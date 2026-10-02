# 005 — Projeção da aposentadoria (complementar × integralidade)

Plano completo aprovado: regras pesquisadas, arquitetura e esboço da interface em
`~/.claude/plans/curried-growing-stallman.md` (resumo aqui).

## Marco 1 — Base RPPS
- [x] Teto RGPS 8.475,55; tabela progressiva RPPS 2026 (Portaria MPS/MF 13/2026)
- [x] `rpps.ts`: contribuição progressiva (arredondamento por faixa), contribuição do aposentado, % do benefício (60% + 2%)
- [x] `folha.ts`: PSSS calculado por regime; Funpresp com alíquota parametrizada; 13º expõe contribuições
- [x] Parâmetros: `regime`, `aliquotaFunpresp` (remove `psss` + migração)
- [x] Testes: âncora ao centavo; PSSS = 988,10; integralidade na ativa

## Marco 2 — Funpresp
- [x] `funpresp.ts`: acumulação mensal (participante + contrapartida) × (1 − FCBE − carregamento), 13º, juros reais
- [x] Saldo atual informado; conversão em renda (`RAP / Fator`), prazo, sobrevivência 80%
- [x] Parâmetros: `saldoFunpresp`, `rentabilidades`, `taxaAtuarial`, `expectativaSobrevida`
- [x] Testes: fator de anuidade, contrapartida, saldo informado

## Marco 3 — Inatividade
- [x] `inatividade.ts`: renda dos dois regimes; IR progressivo/regressivo; contribuição do aposentado; série anual até a idade-horizonte
- [x] Parâmetros: `tributacaoFunpresp`, `percentualRppsInformado`, `mediaRppsInformada`, `idadeHorizonte`
- [x] Testes com valores conferidos à mão

## Marco 4 — Interface
- [x] Parâmetros (grupo Previdência + premissas)
- [x] `Aposentadoria.svelte`: comparativo lado a lado + ponto de equilíbrio
- [x] `Vida.svelte`: líquido mensal da posse ao horizonte, duas linhas + faixa de cenários
- [x] `TabelaAnual`: anos de inatividade do regime escolhido
- [x] Conferência no navegador (desktop/mobile, claro/escuro)

## Marco 5 — Docs
- [x] ADR-001 valores em reais constantes
- [x] README e CLAUDE.md
