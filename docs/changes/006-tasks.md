# 006 — Veredito no topo e "investir a diferença"

Pedido: banner no topo com o comparativo seco e a melhor opção para os parâmetros do usuário;
aba separada mostrando a diferença de contribuição entre os regimes, investida ao longo da
vida ativa, e se isso iguala ou supera a integralidade.

Modelo (reais de 2026, juros reais — ADR-001):
- Aporte: a cada ano ativo, (líquido anual complementar − integralidade) ÷ meses ativos, todo mês.
- Rentabilidade: a mesma do cenário da Funpresp (pessimista/base/otimista).
- Saque: saldo na aposentadoria convertido em parcelas mensais iguais até a idade-horizonte
  (`fatorRenda`), consumindo o principal.
- Comparação: na ativa os dois consomem o mesmo; vence quem tem a maior renda média mensal na
  aposentadoria (inclui 13º; complementar = RPPS + Funpresp + saques).

## Tarefas
- [x] `investimento.ts` + integração no `comparativo.ts` (por cenário)
- [x] Testes: aportes somam a diferença; saldo com juros 0 = soma; veredito coerente
- [x] `Veredito.svelte`: banner no topo (melhor opção, números, cenários, aviso de elegibilidade)
- [x] `Aposentadoria.svelte` com abas: Comparativo | Investir a diferença (`InvestirDiferenca.svelte`)
- [x] Conferência no navegador; README
