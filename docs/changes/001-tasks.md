# 001 — MVP de projeção salarial (FinPol)

Web app SvelteKit local para projetar a remuneração de Técnico Legislativo/Policial
Legislativo Federal do Senado, a partir da tabela vigente em 05/04/2026 (Lei 15.350/26).

## Decisões

- Stack: SvelteKit + TypeScript, sem backend; cálculo puro em `src/lib/calc`.
- Sem reajustes futuros por ora (valores nominais da tabela 2026).
- Especialização parametrizável, teto 30%.
- Marcos: ano de chegada ao padrão máximo (36) e ano provável de aposentadoria.
- Privacidade: nenhum dado pessoal no código (nome, CPF, matrícula, conta, endereço).
  PDFs fora do versionamento (`.gitignore`). Parâmetros do usuário ficam só no
  navegador (localStorage), com valores não sensíveis (datas e percentuais).

## Regras de cálculo (validadas contra folha real do Senado, padrão 24)

- GDAE = 40% venc. · Especialização = x% venc. · Periculosidade = 10% venc.
- GAL, GR, VPI e auxílio-alimentação fixos.
- PSSS: valor fixo (14% progressivo limitado ao teto RGPS).
- Funpresp: 8,5% × (venc + GAL + GR + GDAE + Esp + VPI − teto RGPS).
- IRPF: tabela mensal 2026 sobre (tributável − PSSS − Funpresp − dependentes).
- Progressão: +1 padrão por ano no mês de progressão, após 12 meses da posse (posse no P21).
- Aposentadoria policial (EC 103/2019, art. 10, §2º, I): 55 anos de idade,
  30 de contribuição e 25 de exercício em cargo policial — todos parametrizáveis.

## Tarefas

- [x] Criar projeto SvelteKit em `app/` + `.gitignore` protegendo PDFs
- [x] Dados: tabela de vencimentos do Técnico Legislativo (P21–P36) e verbas fixas
- [x] `folha.ts`: cálculo do contracheque de um mês (bruto, descontos, líquido)
- [x] `progressao.ts`: padrão vigente em uma data
- [x] `aposentadoria.ts`: ano provável de aposentadoria
- [x] `projecao.ts`: série anual (líquido mensal, 13º, 1/3 férias) + marcos
- [x] Testes (vitest): folha de referência bate ao centavo; progressão; marcos
- [x] UI: formulário de parâmetros, cards de marcos, tabela anual, gráfico SVG
- [x] Verificação: `npm test` e `npm run check` verdes; app sobe e renderiza
