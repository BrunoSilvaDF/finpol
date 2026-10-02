# 011 — Reajuste real anual dos outros descontos

Plano de saúde (SIS), sindicato e associações costumam subir acima da inflação. Mesmo padrão do
ADR-002: percentual real ao ano, aplicado a partir de 2027, na ativa e na aposentadoria.

- [x] Parâmetro `reajusteRealOutrosDescontos` (padrão 0) e `outrosDescontosNoAno` em `reajuste.ts`
- [x] Folha e renda do aposentado usam o valor do ano
- [x] Campo em "Descontos" na lateral; explicações do contracheque e do provento citam o reajuste
- [x] Teste; `npm run check`; conferência no navegador
