# ADR-003: Site estático publicado no GitHub Pages

- **Status:** aceito
- **Data:** 2026-10-02
- **Contexto da mudança:** `docs/changes/013-tasks.md`

## Contexto

O app precisava ser publicável para outras pessoas usarem. Ele não tem backend: todo o cálculo é
feito no navegador e os parâmetros (alguns pessoais, como data de nascimento) ficam no
`localStorage` de quem usa.

## Alternativas Consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| Site estático no GitHub Pages (escolhida) | Gratuito, sem servidor, nenhum dado sai do navegador | Exige repositório público ou plano pago |
| Hospedagem com servidor (Vercel, Netlify com SSR) | Permite recursos de servidor | Desnecessário; aumentaria superfície de dados pessoais |
| Manter só uso local | Nada a publicar | Não atende o objetivo de compartilhar |

## Decisão

`adapter-static` com `prerender = true` e `ssr = false`: o build gera um casco HTML e os scripts,
que montam a página no navegador. O caminho base vem de `BASE_PATH` (nome do repositório) no
workflow de publicação. Critério: nenhum dado do usuário trafega para servidores.

## Consequências

- Não criar rotas de servidor (`+server.ts`, `+page.server.ts`) nem `load` que dependa de servidor.
- Links e recursos internos devem ser relativos ou usar `base` de `$app/paths`.
- Navegação entre seções usa `#hash` (funciona em hospedagem estática sem regras de rewrite).
- Padrões, testes e documentação usam apenas valores genéricos: o repositório é público.
