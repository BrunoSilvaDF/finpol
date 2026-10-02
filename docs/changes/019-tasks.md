# 019 — Métricas de acesso anônimas (GoatCounter)

Decisão: `docs/decisions/ADR-004-metricas-anonimas-com-goatcounter.md`.

- [x] ADR-004 aprovada (status `aceito`)
- [x] `app/src/app.html`: script do GoatCounter (`data-goatcounter="https://finpol.goatcounter.com/count"`,
      `async src="//gc.zgo.at/count.js"`)
- [x] `app/src/app.d.ts`: tipagem mínima de `window.goatcounter` (`count({ path })`), sem `any`
- [x] `+page.svelte`: no `hashchange`, `window.goatcounter?.count({ path: location.pathname + location.hash })`
      — só o caminho, nenhum parâmetro do usuário
- [x] Textos de privacidade dizem o que é coletado (anônimo, sem cookies, sem IP guardado, nada do que é digitado):
  - [x] `README.md` (seção Privacidade)
  - [x] `ComoCalculamos.svelte` (item Privacidade; tira "nem recursos de terceiros")
  - [x] `AvisoSimulacao.svelte` (parágrafo LGPD) + `VERSAO` de `'2'` para `'3'`
- [x] `CLAUDE.md`: nota de que o único recurso de terceiros é o GoatCounter (ADR-004)
- [x] `CHANGELOG.md`: entrada em "Não lançado"
- [x] `npm test` e `npm run check` verdes
- [x] Verificação local: build contém o script e o listener
- [ ] Verificação pós-deploy: trocar de
      aba no site publicado e ver `/finpol/`, `/finpol/#vida-ativa`… no painel `finpol.goatcounter.com`

Fora do escopo: eventos customizados (tutorial concluído, exportar etc.) — avaliar depois de ver os dados.
