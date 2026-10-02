# 004 — Aposentadoria informada e contribuição anterior separada

- Ano (e mês) da aposentadoria opcionais: vazio → regra policial; preenchido → usa o informado
  (mês padrão: dezembro). Aviso quando o informado é anterior aos requisitos da regra.
- Contribuição anterior à posse separada em: atividade policial (conta para os 30 anos de
  contribuição **e** para os 25 de cargo policial) e fora da atividade policial (só para os 30).

## Tarefas

- [x] `Parametros`: `contribuicaoAnteriorPolicial`, `contribuicaoAnteriorOutra`,
      `anoAposentadoriaInformado` (null = regra), `mesAposentadoriaInformado`
- [x] `aposentadoria.ts`: `mesIndiceAposentadoriaRegra` + `mesIndiceAposentadoria` (informado ou regra)
- [x] Marcos: indicar se a data foi informada e qual seria a da regra
- [x] UI: campos novos, dica com a data da regra, aviso de antecipação, resumo ajustado
- [x] Migração do `localStorage` (`contribuicaoAnterior` antigo → fora da atividade policial)
- [x] Testes; `npm run check`; conferência no navegador
