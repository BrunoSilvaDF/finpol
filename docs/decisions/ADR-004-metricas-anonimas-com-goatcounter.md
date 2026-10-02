# ADR-004: Métricas de acesso anônimas com GoatCounter

- **Status:** aceito
- **Data:** 2026-10-02
- **Contexto da mudança:** `docs/changes/019-tasks.md`

## Contexto

Com o app publicado (ADR-003), não há como saber quantas pessoas o usam nem quais abas são abertas.
A ADR-003 fixou o critério "nenhum dado do usuário trafega para servidores", e os textos de privacidade
prometem "sem análise de uso nem recursos de terceiros". Medir o uso exige revisar essa promessa sem
abrir mão do essencial: o que a pessoa digita nunca sai do navegador.

## Alternativas Consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| GoatCounter hospedado (escolhida) | Gratuito para uso pessoal; sem cookies; não guarda IP; aceita contagem manual (abas por `#hash`) e eventos | Script de terceiro; bloqueadores de anúncio reduzem a contagem |
| Cloudflare Web Analytics | Gratuito, sem limite de pageviews | Sem eventos customizados; troca de `#hash` pode não contar |
| Google Analytics | Gratuito, completo | Cookies, transferência internacional, exige banner de consentimento |
| Endpoint próprio (Worker/Edge Function) | Nenhum terceiro vê os dados | Cria backend para manter, contra o espírito da ADR-003 |
| Não medir | Nada muda | Nenhuma informação de uso |

## Decisão

Carregar o script do GoatCounter (`https://finpol.goatcounter.com/count`) em `app.html` e contar cada
troca de aba como uma página (`hashchange` → `goatcounter.count({ path })`). O critério da ADR-003
passa a ser: **nenhum dado informado no app trafega para servidores**; métricas agregadas de acesso
(caminho, referrer, navegador, tela, país), sem cookies e sem identificador persistente, são permitidas.

## Consequências

- Nunca enviar ao GoatCounter valores digitados (datas, padrão, percentuais) nem nada derivado deles:
  só caminho da página e, se houver eventos, nomes fixos.
- README, "Como calculamos" e o aviso inicial dizem o que é coletado; mudar o aviso exige incrementar
  `VERSAO` em `AvisoSimulacao.svelte`.
- Acessos em `localhost` não são contados (padrão do GoatCounter), então desenvolvimento não polui os dados.
- Os números ficam abaixo do real por causa de bloqueadores de anúncio.
