# ADR-001: Projeções em reais constantes de 2026, com juros reais

- **Status:** aceito
- **Data:** 2026-10-01
- **Contexto da mudança:** `docs/changes/005-tasks.md` (projeção da aposentadoria)

## Contexto

O FinPol projeta salários de 2023 até a aposentadoria e, desde a mudança 005, a renda na
inatividade até os 90 anos ou mais. Até então todos os valores vinham da tabela de 2026
(Lei 15.350/2026), sem reajustes — decisão do usuário, porque reajustes futuros são incertos.

A projeção da Funpresp exige uma taxa de rentabilidade do fundo. Misturar uma rentabilidade
nominal (com inflação embutida) com salários congelados em valores de 2026 inflaria o saldo
em relação aos salários e tornaria o comparativo com a integralidade enganoso.

## Alternativas Consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **Reais constantes de 2026 + juros reais** (escolhida) | Coerente com salários sem reajuste; valores fáceis de entender ("em dinheiro de hoje"); só um parâmetro por cenário | Ignora ganhos ou perdas reais de salário e do teto do RGPS ao longo do tempo |
| Valores nominais (IPCA + x%) | Mais próximo dos extratos futuros | Exige projetar IPCA e reajustar salários, teto do RGPS, faixas do RPPS e do IR; sem isso o fundo cresce artificialmente frente ao salário |
| Manter o estado atual (sem projeção da Funpresp) | Nada a decidir | Impede comparar os regimes, que é o objetivo da funcionalidade |

## Decisão

Todos os valores do app ficam em **reais constantes de 2026**. A rentabilidade da Funpresp é
**real** (acima da inflação), em três cenários editáveis: pessimista 2%, base 4% e otimista
6% ao ano. Critério: coerência entre as grandezas comparadas — salário, teto do RGPS, benefício
do RPPS e saldo da Funpresp precisam estar na mesma moeda para o comparativo e o ponto de
equilíbrio fazerem sentido.

## Consequências

- Toda nova taxa ou índice aplicado ao longo do tempo deve ser **real**. Não introduzir IPCA
  ou correção nominal em nenhum cálculo sem rever este ADR.
- Tabelas (salário, teto do RGPS, RPPS, IR) ficam congeladas em `app/src/lib/data/tabela-2026.ts`.
  Para atualizar o ano-base, troque os valores ali e revise o teste-âncora da folha.
- A interface deve deixar explícito que os valores são "em reais de hoje" e que as
  rentabilidades são "acima da inflação".
- A taxa atuarial do plano (conversão saldo → renda) também é tratada como taxa real.
