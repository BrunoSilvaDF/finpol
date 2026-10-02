# FinPol — instruções do projeto

App web de projeção salarial da carreira de Policial Legislativo Federal do Senado.
Visão geral: `README.md`. Regras de cálculo, parâmetros e limitações: `docs/regras.md`.
Licença: AGPL-3.0-or-later, copyright BrunoSilvaDF (`LICENSE`; textos do app em `app/src/lib/sobre.ts`).

## Stack e comandos

- SvelteKit 2 + Svelte 5 (runes: `$state`, `$derived`, `$props`, `$bindable`) + TypeScript.
- Sem backend; `ssr = false` + `prerender = true` com `adapter-static` (ADR-003). `BASE_PATH`
  define o caminho base no build do GitHub Pages; vazio no desenvolvimento.
- Tudo dentro de `app/`: `npm run dev`, `npm test` (vitest), `npm run check` (svelte-check), `npm run build`.
- `app/.npmrc` fixa o registro público (registry.npmjs.org): o `package-lock.json` não pode ter URLs de
  registros internos, senão o `npm ci` do GitHub Actions falha.
- Antes de concluir qualquer mudança: `npm test` e `npm run check` verdes.

## Estrutura

```
app/src/lib/data/tabela-2026.ts   valores do quadro de remunerações, teto RGPS, tabela IRPF
app/src/lib/calc/                 motor de cálculo puro (sem dependência de UI)
  folha.ts         contracheque de um mês e 13º (com fração para ano incompleto)
  irpf.ts          IRPF mensal com redutor da Lei 15.270/2025
  progressao.ts    padrão vigente em um mês; `indiceMes` = ano*12 + (mes-1)
  reajuste.ts      teto do RGPS por ano e fatores de reajuste real (teto e salários)
  aposentadoria.ts mês da aposentadoria (requisitos cumulativos)
  projecao.ts      linhas anuais da vida ativa + marcos
  rpps.ts          contribuição progressiva, contribuição do aposentado, benefício RPPS
  funpresp.ts      acumulação da conta (RAP) e renda (temporária + sobrevivência 80%)
  inatividade.ts   renda do aposentado por regime, ano a ano até a idade-horizonte
  comparativo.ts   compara os regimes (3 cenários) e calcula o ponto de equilíbrio
  investimento.ts  "investir a diferença": saldo, saques e aporte para empatar
  *.test.ts        testes; calc.test.ts tem a âncora (folha de técnico P24 conferida ao centavo)
app/src/lib/ui/                   componentes (Veredito, Parametros, Escada, Vida, Aposentadoria,
                                  ProjecaoFunpresp, InvestirDiferenca, TabelaAnual, Contracheque,
                                  Provento, Rubricas)
app/src/routes/+page.svelte       página única com abas (Resumo, Vida ativa, Aposentadoria via #hash)
                                  + tokens de cor (claro/escuro)
docs/changes/NNN-tasks.md         plano de cada mudança, com checklist
docs/decisions/ADR-NNN-*.md       decisões arquiteturais
docs/regras.md                    regras de cálculo (espelhadas na aba "Como calculamos")
```

## Regras do domínio (não quebrar)

- O teste "reproduz a folha de um técnico P24" é a âncora: qualquer mudança no motor deve
  mantê-lo passando ao centavo.
- Rubricas percentuais e IRPF são **truncados** (não arredondados).
- Periculosidade entra no IR, mas **não** na base do Funpresp.
- Auxílio-alimentação não entra no IR nem no 13º.
- Novos valores de tabela (reajustes, novo teto RGPS, nova tabela IR) vão em `lib/data`,
  nunca espalhados no motor.
- Tudo em reais constantes de 2026; taxas sempre reais (ADR-001). Nada de IPCA no motor.
- Teto do RGPS só via `tetoRgps(params, ano)`; `calcularFolha` recebe `{ ano }` da competência (ADR-002).
- PSSS é calculado pela tabela do RPPS com arredondamento por faixa (dá 988,10 no teto).
- Mudou uma regra? Atualize juntos `docs/regras.md` e `app/src/lib/ui/ComoCalculamos.svelte`.
- Funções do motor são puras: "hoje" entra como argumento (`mesAtual`), nunca `new Date()`.

## Privacidade

- Nunca colocar no código, testes, commits ou docs: nome, CPF, matrícula, conta bancária,
  endereço ou data de nascimento completa.
- PDFs de contracheque ficam fora do git (`.gitignore`). Ao lê-los, extrair apenas valores.
- Parâmetros do usuário: só no `localStorage`, nunca em arquivos versionados.
- Aviso de simulação (`AvisoSimulacao.svelte`): aceite em `localStorage` com versão; ao mudar o
  texto do aviso, incremente `VERSAO` para pedir o aceite de novo.
- Tutorial (`lib/ui/tutorial.ts`, `driver.js`): começa após o aceite na primeira visita
  (`finpol:tutorial-visto`); os alvos são marcados com `data-tour` na lateral e no menu.
  Sem animação entre passos (`animate: false`): cliques rápidos embaralham o estado do driver.js.
  O botão "Pular tutorial" é inserido no rodapé do balão via `onPopoverRender`.
- Celular (≤ 760px): barra superior com ☰; a lateral vira painel deslizante (`alternarPainel` em
  `+page.svelte`). Durante o tutorial o painel abre/fecha sem animação e com `flushSync`, para o
  destaque medir a posição final.
- O repositório é publicável: padrões e testes usam valores genéricos (posse 01/2022, nascimento
  01/1985). Nunca usar dados de contracheques reais de pessoas identificáveis em testes ou docs.

## Versionamento

- Versionamento semântico. A versão vive só em `app/package.json` e chega à página pelo Vite
  (`__VERSAO_APP__`, em `lib/sobre.ts`).
- Para lançar: atualizar `version` no `package.json` (e o lockfile), adicionar a entrada no
  `CHANGELOG.md` (linguagem de usuário, sem commits técnicos) e criar a tag anotada `vX.Y.Z`.

## Convenções

- Código e textos da UI em português; nomes de domínio (folha, padrão, verba).
- Toda mudança com 3+ passos: plano em `docs/changes/NNN-tasks.md` antes de implementar.
- Commits: `<tipo>: <descrição no imperativo>` (projeto pessoal, sem ticket Redmine).
