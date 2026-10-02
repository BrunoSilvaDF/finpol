# Changelog

Todas as mudanças relevantes para quem usa o FinPol ficam registradas aqui.
O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto usa
[versionamento semântico](https://semver.org/lang/pt-BR/).

## [1.0.0] — 2026-10-02

Primeira versão pública, disponível em <https://brunosilvadf.github.io/finpol/>.

### Adicionado

**Vida ativa**

- Projeção da remuneração de Técnico Legislativo / Policial Legislativo Federal pela tabela do Senado
  de 2026, da posse ao padrão máximo, com progressão anual configurável.
- Contracheque projetado do mês e de qualquer ano, com vencimento, gratificações, adicionais, PSSS,
  Funpresp e IR conferidos ao centavo com folhas reais; cada rubrica tem um (?) que explica o cálculo.
- Tabela ano a ano com líquido mensal, 13º, 1/3 de férias e líquido anual, incluindo os anos desde a
  posse (destacados como estimativa) e a idade completada em cada ano.
- Gráfico em degraus do líquido mensal ao longo da carreira.

**Aposentadoria**

- Data da aposentadoria pela regra dos policiais (EC 103/2019), considerando tempo de contribuição
  anterior à posse, dentro e fora da atividade policial, ou por idade informada.
- Comparação entre o regime complementar (RPPS até o teto + Funpresp) e a integralidade (regime
  anterior), com renda líquida, saldo acumulado, ponto de equilíbrio e gráfico da vida inteira.
- Projeção do saldo da Funpresp (LegisPrev), com contrapartida da União, custos do plano, três
  cenários de rentabilidade, saldo atual opcional e renda vitalícia após o prazo.
- Simulação de investir a diferença de líquido entre os regimes, com valor mensal ajustável e o
  aporte necessário para empatar com a integralidade.
- Veredito no Resumo com as três opções lado a lado: integralidade, complementar e complementar com
  a diferença investida.

**Premissas e transparência**

- Valores em reais de hoje, com reajuste real opcional do teto do INSS, dos salários e dos descontos
  (plano de saúde, sindicato e associações).
- Aba "Como calculamos" com todas as regras, tabelas e fontes.

**Uso**

- Menu com as abas Resumo, Vida ativa, Aposentadoria e Como calculamos, com endereço próprio para cada
  aba.
- Aviso de simulação com aceite obrigatório na primeira visita.
- Tutorial guiado na primeira visita, com opção de pular e de rever depois.
- Versão para celular com barra superior e painel de dados aberto pelo botão ☰.
- Temas claro e escuro, conforme o sistema.

### Segurança

- Privacidade (LGPD): todo o cálculo acontece no navegador e os dados ficam apenas nele; o site não
  usa servidor, cookies, análise de uso nem recursos de terceiros.

[1.0.0]: https://github.com/BrunoSilvaDF/finpol/releases/tag/v1.0.0
