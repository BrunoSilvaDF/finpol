# FinPol

Projeção da remuneração na carreira de Técnico Legislativo / Policial Legislativo Federal
do Senado Federal: da posse ao padrão máximo e à aposentadoria, e da aposentadoria em diante,
comparando o regime complementar (teto + Funpresp) com a integralidade (regime anterior).
Todos os valores em reais de 2026 ([ADR-001](docs/decisions/ADR-001-valores-em-reais-constantes.md)), com
reajuste real opcional do teto do INSS e dos salários ([ADR-002](docs/decisions/ADR-002-reajuste-real-do-teto-e-dos-salarios.md)).

O motor de cálculo reproduz ao centavo folhas reais do Senado de 2026, no regime complementar e no regime
anterior (integralidade).

## O que mostra

Quatro abas no menu superior (a aba aberta fica no endereço: `#resumo`, `#vida-ativa`,
`#aposentadoria`, `#como-calculamos`). Na primeira visita, um aviso de que se trata de simulação
precisa ser aceito; o aceite fica guardado no navegador.

- **Resumo:** veredito e resumo da carreira.
- **Vida ativa:** gráfico da carreira, contracheque do mês e ano a ano na ativa.
- **Aposentadoria:** comparativo dos regimes, projeção do saldo da Funpresp (composição, acumulação e
  consumo pela renda), investir a diferença e ano a ano aposentado.
- **Como calculamos:** todas as regras, tabelas (vencimentos, RPPS, IR) e fontes.

Em detalhe:

- Veredito no topo: qual regime rende mais na aposentadoria com os parâmetros informados,
  supondo que, no complementar, a diferença de líquido da ativa seja investida.
- Resumo: padrão e líquido atuais, ano em que chega ao padrão 36 e mês/ano da aposentadoria.
- Gráfico em degraus do líquido mensal ao longo da carreira, com os dois marcos.
- Contracheque projetado do mês atual.
- Aposentadoria: cartões comparando complementar e integralidade (renda líquida ao se
  aposentar, após o fim do prazo da Funpresp, saldo acumulado e custo na ativa), ponto de
  equilíbrio e gráfico do líquido mensal da posse até a idade-horizonte.
- Tabela ano a ano, da posse à idade-horizonte (líquido mensal, 13º, 1/3 de férias, líquido
  anual). Clicar em um ano abre o contracheque ou o provento de exemplo daquele ano.

## Como rodar

Requer Node 22+.

```bash
cd app
npm install
npm run dev      # http://localhost:5173
npm test         # testes do motor de cálculo (vitest)
npm run check    # checagem de tipos (svelte-check)
npm run build    # site estático em app/build
```

## Publicação (GitHub Pages)

O app é 100% estático: não há servidor nem chamadas de rede; tudo é calculado no navegador e os
parâmetros ficam só no `localStorage` de quem usa. O workflow `.github/workflows/pages.yml` roda os
testes, gera o build com `BASE_PATH=/<repositório>` e publica no GitHub Pages a cada push na `main`.

Para ativar: **Settings → Pages → Source: GitHub Actions** (exige repositório público ou plano pago).

## Parâmetros

Editáveis na barra lateral e salvos apenas no `localStorage` do navegador:

| Grupo | Parâmetros |
|---|---|
| Carreira | data de posse, padrão na posse, mês da progressão, adicional de especialização (0–30%) |
| Descontos | plano de saúde/sindicato/associações, com reajuste real anual opcional a partir de 2027; dependentes no IR |
| Aposentadoria | mês e ano de nascimento; contribuição anterior à posse (em atividade policial e fora dela); idade da aposentadoria (opcional; vazia, segue a regra; preenchida, aposenta no mês do aniversário); requisitos (55 anos de idade, 30 de contribuição, 25 em cargo policial) |
| Previdência | regime (complementar ou integralidade), alíquota Funpresp (7,5/8/8,5%), tributação da Funpresp (progressiva/regressiva), saldo atual da Funpresp (opcional) |
| Premissas | rentabilidade real da Funpresp por cenário (2/4/6%), taxa atuarial (4%), expectativa de sobrevida (27 anos), % e média do benefício RPPS (opcionais), reajuste real do teto do INSS e dos salários a partir de 2027 (0%), idade-horizonte (90) |

## Regras de cálculo

Base: quadro de remunerações dos efetivos do Senado vigente a partir de 05/04/2026
(Lei 15.350/2026).

| Rubrica | Regra |
|---|---|
| Vencimento | tabela por padrão (21–36) |
| GAL, GR, VPI, auxílio-alimentação | valores fixos |
| GDAE | 40% do vencimento |
| Adicional de especialização | 0–30% do vencimento |
| Periculosidade | 10% do vencimento |
| PSSS | tabela progressiva do RPPS 2026 (Portaria MPS/MF 13/2026), com arredondamento por faixa; no complementar, só até o teto do RGPS (8.475,55) |
| Funpresp | alíquota × (remuneração sem periculosidade − teto do RGPS do ano); zero na integralidade |
| Teto do RGPS | 8.475,55 em 2026; reajustado todo janeiro pelo INPC, modelado como ganho real (INPC − IPCA) a partir de 2027; as faixas do RPPS acompanham |
| IRPF | tabela mensal 2026 sobre (tributável − PSSS − Funpresp − dependentes), com o redutor da Lei 15.270/2025 |

- Rubricas percentuais e IRPF são **truncados** no centavo, como faz a folha do Senado.
- Progressão: +1 padrão no mês de progressão (julho), desde que tenham se passado 12 meses
  da posse.
- 13º: IR exclusivo na fonte. 1/3 de férias: tributado junto com o mês, a partir do 2º ano.
- Ano da aposentadoria: só os meses em atividade, com 13º e férias proporcionais.

### Aposentadoria

| Tema | Regra |
|---|---|
| Conta Funpresp (RAP) | participante + contrapartida igual da União, menos FCBE (2,5%) e carregamento (6,5% caindo a 2,45% em 8 anos); 13º também contribui; capitalização mensal pela rentabilidade real |
| Renda Funpresp | `saldo / Fator(sobrevida; taxa atuarial)`, recalculada todo janeiro com saldo e prazo restantes; após o prazo, 80% da última parcela, vitalício (Regulamento LegisPrev, arts. 21 e 25) |
| Benefício RPPS (complementar) | média (padrão: média dos tetos) × (60% + 2% por ano de contribuição acima de 20), limitado ao teto do ano da aposentadoria (EC 103, art. 26); depois acompanha o teto (reajuste do RGPS, sem paridade) |
| Integralidade | provento = remuneração do cargo no último padrão, sem periculosidade e auxílio; depois acompanha os salários (paridade) |
| Contribuição do aposentado | alíquota efetiva da tabela sobre o total, aplicada só ao que excede o teto (EC 103, art. 11 §4º) |
| IR do aposentado | tabela mensal; na regressiva, a renda Funpresp paga 10% à parte |
| Ponto de equilíbrio | primeiro ano em que a integralidade acumula mais líquido que o complementar, somando da posse em diante |
| Investir a diferença | a diferença anual de líquido da ativa (complementar − integralidade), ou um valor mensal informado, é aplicada mês a mês na rentabilidade do cenário e sacada em parcelas iguais até a idade-horizonte; vence o regime com maior renda média mensal na aposentadoria (com 13º). Também mostra o aporte mensal que faria o complementar empatar |

## Limitações conhecidas

- Tudo em reais de 2026, com juros reais (ADR-001); reajustes só como ganho real (ADR-002).
- Tabela do IR constante em termos reais (a defasagem histórica da tabela não é modelada).
- Anos anteriores ao atual são estimativas pela tabela de 2026 (destacados na tabela).
- Expectativa de sobrevida e taxa atuarial são estimativas; os valores oficiais estão na Nota
  Técnica do plano e no simulador da Funpresp.
- Carregamento da Funpresp com decréscimo linear; contribuição facultativa fora do escopo.
- Percentual do benefício RPPS pós-EC 103 para policiais é editável (há leituras divergentes).
- Tributação regressiva simplificada como 10%; isenção extra do IR aos 65 anos e pensões fora
  do escopo.
- A vantagem do complementar na ativa é somada sem considerar o rendimento caso seja investida.
- Desconto simplificado mensal do IR não implementado (irrelevante nesta faixa salarial).
- 13º e 1/3 de férias usam o padrão do último mês ativo do ano.

## Privacidade (LGPD)

Para fins da LGPD (Lei 13.709/2018), o app **não coleta nem trata dados pessoais em servidor**: todo o
cálculo acontece no navegador de quem usa, e os parâmetros (inclusive data de nascimento) ficam apenas
no `localStorage` dele. Não há backend, cookies, contas, análise de uso nem recursos de terceiros; a
fonte é servida pelo próprio site. Como qualquer site, a hospedagem (GitHub Pages) pode registrar
dados técnicos de acesso, como o IP, mas não recebe o que é digitado no app.

Nenhum dado pessoal (nome, CPF, matrícula, conta, endereço) fica no código.
Contracheques em PDF são ignorados pelo git.
