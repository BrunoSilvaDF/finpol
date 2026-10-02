# ADR-002: Reajuste real do teto do RGPS e dos salários

- **Status:** aceito (complementa o ADR-001)
- **Data:** 2026-10-02
- **Contexto da mudança:** `docs/changes/008-tasks.md`

## Contexto

O teto do RGPS é a referência de quase todos os cálculos de previdência: o PSSS do regime
complementar para nele, a Funpresp incide sobre o que passa dele e o benefício do RPPS fica limitado
a ele. Ele é reajustado todo janeiro pelo INPC (Lei 8.212, art. 20 §1º; portaria interministerial
MPS/MF), e as faixas da contribuição progressiva do RPPS acompanham.

Pelo ADR-001, tudo está em reais de 2026. Nesses termos, o teto só muda se o INPC divergir do IPCA
(2023–2026: em média −0,3% real ao ano). Os salários do Senado, por outro lado, não têm reajuste
automático e historicamente alternam perdas e recomposições. A **relação entre teto e salário**
muda o comparativo: se o salário perde para a inflação, a integralidade (presa ao salário) encolhe,
enquanto o benefício do RPPS no complementar (preso ao teto) se mantém.

## Alternativas Consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| Teto e salários com reajuste real parametrizável (escolhida) | Captura a relação teto × salário, que é o que muda o resultado; padrão 0% preserva os resultados anteriores | Mais um par de premissas para o usuário entender |
| Só o teto reajustável | Mais simples | Com salários fixos em termos reais, o efeito do teto é quase nulo (INPC ≈ IPCA) |
| Teto, salários e tabela do IR | Captura a defasagem da tabela do IR | Mais complexidade; a defasagem depende de decisões políticas imprevisíveis |
| Valores nominais (IPCA + reajustes) | Próximo dos extratos | Rejeitada no ADR-001 |

## Decisão

Dois parâmetros de premissa, em % real ao ano, aplicados a partir de 2027: **reajuste real do
teto** (INPC − IPCA) e **reajuste real dos salários** (reajuste do Senado − IPCA), ambos com padrão
0%. Até 2026 valem os valores de 2026. Critério: modelar a relação teto × salário com o mínimo de
premissas, sem sair dos reais constantes do ADR-001.

## Consequências

- Nada usa `TETO_RGPS` diretamente no motor, exceto `reajuste.ts`: o teto de um ano vem de
  `tetoRgps(params, ano)`, e as faixas do RPPS são reajustadas com `fatorTeto(params, ano)`.
- `calcularFolha` recebe o ano da competência (`{ ano }`, padrão 2026); proventos são multiplicados
  por `fatorSalario(params, ano)`. Quem chama com um ano específico deve passar o ano.
- O benefício do RPPS no complementar usa a média dos tetos dos anos de contribuição (quando não
  informada), limitada ao teto do ano da aposentadoria, e depois acompanha o teto (reajuste pelo
  índice do RGPS, sem paridade). O provento integral acompanha os salários (paridade).
- A tabela do IR fica constante em termos reais (fora do escopo). Se vier a ser modelada, revisar
  este ADR.
