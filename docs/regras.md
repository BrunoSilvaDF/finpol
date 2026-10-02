# Regras e premissas de cálculo

Referência das regras que o FinPol aplica. A aba **Como calculamos** do app mostra o mesmo conteúdo,
com as tabelas geradas a partir dos dados do código (`app/src/lib/data/tabela-2026.ts`).

Todos os valores ficam em **reais de 2026**, com taxas reais (acima da inflação)
([ADR-001](decisions/ADR-001-valores-em-reais-constantes.md)); reajustes de teto, salários e outros
descontos entram apenas como ganho ou perda real a partir de 2027
([ADR-002](decisions/ADR-002-reajuste-real-do-teto-e-dos-salarios.md)).

O motor reproduz ao centavo folhas reais do Senado de 2026, no regime complementar e no regime
anterior (integralidade).

## Parâmetros

Editáveis na barra lateral e salvos apenas no `localStorage` do navegador:

| Grupo | Parâmetros |
|---|---|
| Carreira | data de posse, padrão na posse, mês da progressão, adicional de especialização (0–30%) |
| Descontos | plano de saúde/sindicato/associações, com reajuste real anual opcional a partir de 2027; dependentes no IR |
| Aposentadoria | mês e ano de nascimento; contribuição anterior à posse (em atividade policial e fora dela); idade da aposentadoria (opcional: vazia, segue a regra; preenchida, aposenta no mês do aniversário); requisitos (55 anos de idade, 30 de contribuição, 25 em cargo policial) |
| Previdência | regime (complementar ou integralidade), alíquota Funpresp (7,5/8/8,5%), tributação da Funpresp (progressiva/regressiva), saldo atual da Funpresp (opcional) |
| Premissas | rentabilidade real da Funpresp por cenário (2/4/6%), taxa atuarial (4%), expectativa de sobrevida (27 anos), % e média do benefício RPPS (opcionais), reajuste real do teto do INSS e dos salários a partir de 2027 (0%), idade-horizonte (90) |
| Investir a diferença | valor mensal investido no complementar (opcional; vazio, investe a diferença de líquido entre os regimes) |

## Vida ativa

Base: quadro de remunerações dos efetivos do Senado vigente a partir de 05/04/2026
(Lei 15.350/2026), cargo de Técnico Legislativo.

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

- A base de contribuição (PSSS e Funpresp) exclui periculosidade e auxílio-alimentação
  (Lei 10.887/2004, art. 4º).
- Rubricas percentuais e IRPF são **truncados** no centavo, como faz a folha do Senado.
- Progressão: +1 padrão no mês de progressão configurado, desde que tenham se passado 12 meses da
  posse, até o padrão 36.
- 13º: IR exclusivo na fonte. 1/3 de férias: tributado junto com o mês, a partir do 2º ano.
- Ano da aposentadoria: só os meses em atividade, com 13º e férias proporcionais.
- Anos anteriores ao atual usam a tabela de 2026 e são estimativas (destacados na tabela).

## Aposentadoria

| Tema | Regra |
|---|---|
| Data | regra dos policiais (EC 103/2019, art. 10, §2º, I): idade, contribuição e tempo policial cumulativos; tempo policial anterior conta para contribuição e exercício, o de fora só para contribuição; ou a idade informada (mês do aniversário) |
| Conta Funpresp (RAP) | participante + contrapartida igual da União, menos FCBE (2,5%) e carregamento (6,5% caindo a 2,45% em 8 anos); 13º também contribui; capitalização mensal pela rentabilidade real |
| Renda Funpresp | `saldo / Fator(sobrevida; taxa atuarial)`, recalculada todo janeiro com saldo e prazo restantes; após o prazo, 80% da última parcela, vitalício (Regulamento LegisPrev, arts. 21 e 25) |
| Benefício RPPS (complementar) | média (padrão: média dos tetos) × (60% + 2% por ano de contribuição acima de 20), limitado ao teto do ano da aposentadoria (EC 103, art. 26); depois acompanha o teto (reajuste do RGPS, sem paridade) |
| Integralidade | provento = remuneração do cargo no último padrão, sem periculosidade e auxílio; depois acompanha os salários (paridade); vale para policiais que ingressaram até 13/11/2019 |
| Contribuição do aposentado | alíquota efetiva da tabela sobre o total, aplicada só ao que excede o teto (EC 103, art. 11, §4º) |
| IR do aposentado | tabela mensal; na regressiva, a renda Funpresp paga 10% à parte |

## Comparativos

| Tema | Regra |
|---|---|
| Média mensal na aposentadoria | todo o líquido da aposentadoria até a idade-horizonte (com 13º) dividido pelo número de meses |
| Ponto de equilíbrio | primeiro ano em que a integralidade acumula mais líquido que o complementar, somando da posse em diante |
| Investir a diferença | a diferença anual de líquido da ativa (complementar − integralidade), ou um valor mensal informado, é aplicada mês a mês na rentabilidade do cenário e sacada em parcelas iguais até a idade-horizonte; vence o regime com maior média mensal. Investindo mais que a diferença, o consumo na ativa fica abaixo do da integralidade |
| Aporte para empatar | investimento mensal na ativa que igualaria a média do complementar à da integralidade |

## Limitações conhecidas

- Só o cargo de Técnico Legislativo; sem função comissionada, anuênios ou outras vantagens pessoais.
- Tabela do IR constante em termos reais (a defasagem histórica da tabela não é modelada).
- Expectativa de sobrevida e taxa atuarial são estimativas; os valores oficiais estão na Nota
  Técnica do plano e no simulador da Funpresp.
- Carregamento da Funpresp com decréscimo linear; contribuição facultativa fora do escopo.
- Percentual do benefício RPPS pós-EC 103 para policiais é editável (há leituras divergentes).
- Tributação regressiva simplificada como 10%; isenção extra do IR aos 65 anos, pensões e desconto
  simplificado mensal fora do escopo.
- Rentabilidade do investimento tratada como líquida de impostos e taxas.
- 13º e 1/3 de férias usam o padrão do último mês ativo do ano.
- Diferenças de centavos podem ocorrer no PSSS por detalhes de arredondamento da folha.

## Fontes

- Quadro de remunerações dos servidores efetivos do Senado (Lei 15.350/2026)
- [Portaria Interministerial MPS/MF nº 13/2026](https://www.legisweb.com.br/legislacao/?id=489284): teto do INSS e tabela do RPPS
- [Emenda Constitucional nº 103/2019](https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc103.htm)
- [Lei 10.887/2004](https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l10.887.htm): base de contribuição
- [Lei 12.618/2012](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12618.htm): previdência complementar do servidor
- [Funpresp](https://www.funpresp.com.br/): Regulamento do LegisPrev, FCBE e taxa de carregamento
