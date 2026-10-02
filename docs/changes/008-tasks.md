# 008 — Reajuste real do teto do RGPS e dos salários

Contexto: o teto do RGPS é reajustado todo janeiro pelo INPC (Lei 8.212, art. 20 §1º;
portaria interministerial MPS/MF), e as faixas do RPPS acompanham. Em reais de 2026 (ADR-001),
o que importa é o ganho real (INPC − IPCA) do teto e dos salários, e a relação entre eles.

Decisões (usuário): parametrizar teto **e** salários; padrão 0% real para ambos.

## Modelo
- `reajuste.ts`: `tetoRgps(params, ano)` e fatores por ano a partir de 2027 (até 2026 = valores de 2026).
- Folha: proventos × fator salarial do ano; teto e faixas do RPPS × fator do teto do ano.
- Funpresp: base de participação = remuneração − teto do ano.
- RPPS complementar: média = média do teto nos anos de contribuição (ou informada); limitado ao teto
  do ano da aposentadoria; depois reajustado pelo INPC → acompanha o fator do teto.
- Integralidade: provento do último salário; depois acompanha os salários (paridade).
- Contribuição do aposentado: sobre o excedente ao teto do ano.
- Tabela do IR: fica constante em termos reais (fora do escopo, registrado no ADR-002).

## Tarefas
- [x] `reajuste.ts` + parâmetros `reajusteRealTeto` e `reajusteRealSalarios` (padrão 0)
- [x] `folha.ts` / `rpps.ts` com ano da competência; `Folha` expõe GAL, GR, VPI e auxílio
- [x] `projecao.ts`, `funpresp.ts`, `inatividade.ts`, `comparativo.ts` passam o ano
- [x] Testes: âncora intacta; padrão 0% não altera nada; teto e salários reajustados por ano
- [x] UI: premissas na lateral; contracheque/provento usam valores do ano
- [x] ADR-002, README, CLAUDE.md; conferência no navegador
