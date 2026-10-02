# FinPol

Simulador da carreira de Técnico Legislativo / Policial Legislativo Federal do Senado Federal:
projeta a remuneração da posse ao padrão máximo e à aposentadoria, e a renda da aposentadoria em
diante, comparando o regime complementar (teto + Funpresp) com a integralidade (regime anterior).

> **Aviso:** é uma ferramenta de simulação. Os resultados são estimativas e não devem ser a única
> base para decisões sobre previdência, aposentadoria ou investimentos.

## O que mostra

Quatro abas no menu superior (a aba aberta fica no endereço: `#resumo`, `#vida-ativa`,
`#aposentadoria`, `#como-calculamos`). Na primeira visita, um aviso de que se trata de simulação
precisa ser aceito; o aceite fica guardado no navegador. Em seguida, um tutorial guiado destaca onde
informar os dados e as abas de resultados (dá para rever pelo botão "Ver tutorial"). No celular, os
dados ficam num painel aberto pelo botão ☰ da barra superior.

- **Resumo:** veredito (qual regime rende mais na aposentadoria, considerando investir a diferença de
  líquido da ativa) com as três opções lado a lado e o resumo da carreira.
- **Vida ativa:** gráfico da carreira, contracheque do mês e ano a ano na ativa. Cada rubrica tem
  um (?) com a explicação do cálculo.
- **Aposentadoria:** comparativo dos regimes, projeção do saldo da Funpresp, investir a diferença
  (com valor ajustável) e ano a ano aposentado.
- **Como calculamos:** todas as regras, tabelas e fontes.

## Regras de cálculo

As regras, premissas, parâmetros e limitações estão em **[docs/regras.md](docs/regras.md)**.
Decisões de arquitetura ficam em [docs/decisions](docs/decisions).

## Como rodar

Requer Node 22+.

```bash
cd app
npm install
npm run dev      # http://localhost:5173
npm test         # testes do motor de cálculo (vitest)
npm run check    # checagem de tipos (svelte-check)
npm run build    # site estático em app/build
```

## Privacidade (LGPD)

Para fins da LGPD (Lei 13.709/2018), o app **não coleta nem trata dados pessoais em servidor**: todo o
cálculo acontece no navegador de quem usa, e os parâmetros (inclusive data de nascimento) ficam apenas
no `localStorage` dele. Não há backend, cookies, contas, análise de uso nem recursos de terceiros; a
fonte é servida pelo próprio site. Se o app for publicado num site, a hospedagem pode registrar dados
técnicos de acesso, como o IP, mas não recebe o que é digitado no app.

Nenhum dado pessoal (nome, CPF, matrícula, conta, endereço) fica no código.

## Licença

Copyright (C) 2026 BrunoSilvaDF.

Este programa é software livre: você pode redistribuí-lo e/ou modificá-lo sob os termos da
**GNU Affero General Public License**, versão 3 ou (a seu critério) qualquer versão posterior,
publicada pela Free Software Foundation. Ele é distribuído na esperança de ser útil, mas **sem
nenhuma garantia**, nem mesmo a garantia implícita de comerciabilidade ou adequação a um propósito
específico. Veja o arquivo [LICENSE](LICENSE).

Pela AGPL, quem disponibilizar uma versão modificada do app para uso pela rede deve oferecer aos
usuários o código-fonte dessa versão.
