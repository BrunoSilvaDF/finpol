<script lang="ts">
	import {
		ALIQUOTAS_FUNPRESP,
		AUXILIO_ALIMENTACAO,
		DEDUCAO_DEPENDENTE_IRPF,
		FUNPRESP_CARREGAMENTO,
		FUNPRESP_FCBE,
		FUNPRESP_PERCENTUAL_SOBREVIVENCIA,
		GAL,
		GR,
		IR_REGRESSIVO_FUNPRESP,
		PADRAO_MAXIMO,
		PADRAO_MINIMO,
		PERCENTUAL_ESPECIALIZACAO_MAXIMO,
		PERCENTUAL_GDAE,
		PERCENTUAL_PERICULOSIDADE,
		REDUTOR_IRPF,
		RPPS_BENEFICIO,
		TABELA_IRPF,
		TABELA_RPPS,
		TETO_RGPS,
		VENCIMENTO_POR_PADRAO,
		VPI
	} from '$lib/data/tabela-2026';
	import { reaisCentavos } from './formato';

	const pct = (fracao: number): string => `${(Math.round(fracao * 10000) / 100).toLocaleString('pt-BR')}%`;
	const limite = (valor: number): string => (valor === Infinity ? 'acima' : `até ${reaisCentavos(valor)}`);
	const padroes = Array.from({ length: PADRAO_MAXIMO - PADRAO_MINIMO + 1 }, (_, i) => PADRAO_MINIMO + i);
</script>

<div class="explicacoes">
	<p class="intro">
		Todas as regras usadas nas projeções, com as tabelas que o app aplica. Abra uma seção para ver os detalhes.
	</p>

	<details open>
		<summary>Premissas gerais</summary>
		<ul>
			<li>
				<strong>Valores em reais de 2026.</strong> Salários, teto do INSS, benefícios e saldos aparecem no poder de compra
				de hoje. Por isso, todas as taxas (rentabilidade, reajustes) são <em>reais</em>, isto é, acima da inflação.
			</li>
			<li>
				<strong>Reajustes opcionais.</strong> A partir de 2027, o teto do INSS, os salários e os outros descontos podem
				ganhar (ou perder) da inflação pelos percentuais das premissas. O padrão é 0%: acompanham a inflação.
			</li>
			<li>
				<strong>Anos passados são estimativas.</strong> Usam a tabela de 2026; os valores pagos de fato estão nos
				contracheques de cada época.
			</li>
			<li>
				<strong>Privacidade (LGPD, Lei 13.709/2018).</strong> Os dados informados não são coletados nem tratados por
				servidor algum: todo o cálculo acontece no seu navegador e os parâmetros ficam guardados só nele
				(armazenamento local). O site não usa cookies, contas, análise de uso nem recursos de terceiros (até a fonte
				é servida pelo próprio site). Para apagar tudo, limpe os dados deste site no navegador.
			</li>
		</ul>
	</details>

	<details>
		<summary>Remuneração (vida ativa)</summary>
		<p>Base: quadro de remunerações do Senado vigente a partir de 05/04/2026 (Lei 15.350/2026), cargo de Técnico Legislativo.</p>
		<table>
			<thead><tr><th scope="col">Rubrica</th><th scope="col">Regra</th></tr></thead>
			<tbody>
				<tr><td>Vencimento</td><td>conforme o padrão (tabela abaixo)</td></tr>
				<tr><td>GAL</td><td>valor fixo de {reaisCentavos(GAL)}</td></tr>
				<tr><td>GR</td><td>valor fixo de {reaisCentavos(GR)}</td></tr>
				<tr><td>GDAE</td><td>{pct(PERCENTUAL_GDAE)} do vencimento</td></tr>
				<tr><td>Adicional de especialização</td><td>de 0% a {pct(PERCENTUAL_ESPECIALIZACAO_MAXIMO)} do vencimento</td></tr>
				<tr><td>VPI</td><td>valor fixo de {reaisCentavos(VPI)}</td></tr>
				<tr><td>Adicional de periculosidade</td><td>{pct(PERCENTUAL_PERICULOSIDADE)} do vencimento</td></tr>
				<tr><td>Auxílio-alimentação</td><td>{reaisCentavos(AUXILIO_ALIMENTACAO)}, indenizatório (sem IR e sem previdência)</td></tr>
			</tbody>
		</table>
		<p>Como na folha do Senado, os centavos das rubricas percentuais e do IR são <strong>truncados</strong>, não arredondados.</p>
		<details class="interna">
			<summary>Vencimento por padrão</summary>
			<table class="compacta">
				<thead><tr><th scope="col">Padrão</th><th scope="col">Vencimento</th></tr></thead>
				<tbody>
					{#each padroes as p (p)}<tr><td>{p}</td><td>{reaisCentavos(VENCIMENTO_POR_PADRAO[p])}</td></tr>{/each}
				</tbody>
			</table>
		</details>
		<h4>Progressão</h4>
		<p>
			Um padrão a mais por ano, no mês de progressão, desde que tenham se passado 12 meses da posse; até o padrão
			{PADRAO_MAXIMO}. 13º salário e 1/3 de férias usam o padrão do último mês ativo do ano; férias a partir do 2º ano.
		</p>
	</details>

	<details>
		<summary>Contribuições previdenciárias</summary>
		<p>
			<strong>Base de contribuição:</strong> vencimento + GAL + GR + GDAE + especialização + VPI. Periculosidade e
			auxílio-alimentação ficam fora (Lei 10.887/2004, art. 4º), como se vê nas folhas reais dos dois regimes.
		</p>
		<h4>PSSS (RPPS), tabela progressiva de 2026</h4>
		<p>Cada alíquota incide só sobre a parte da base dentro da sua faixa (Portaria Interministerial MPS/MF nº 13/2026).</p>
		<table class="compacta">
			<thead><tr><th scope="col">Faixa</th><th scope="col">Alíquota</th></tr></thead>
			<tbody>
				{#each TABELA_RPPS as [teto, aliquota] (teto)}<tr><td>{limite(teto)}</td><td>{pct(aliquota)}</td></tr>{/each}
			</tbody>
		</table>
		<ul>
			<li>
				<strong>Regime complementar:</strong> o PSSS incide só até o teto do INSS ({reaisCentavos(TETO_RGPS)}), o que
				dá R$ 988,10. O que passa do teto vai para a Funpresp.
			</li>
			<li><strong>Integralidade (regime anterior):</strong> o PSSS incide sobre a base inteira, e não há Funpresp.</li>
		</ul>
		<h4>Funpresp (LegisPrev)</h4>
		<ul>
			<li>
				Contribuição básica de {ALIQUOTAS_FUNPRESP.map(pct).join(', ')} (à escolha) sobre o
				<strong>salário de participação</strong>: base de contribuição − teto do INSS.
			</li>
			<li>A União deposita o mesmo valor (contrapartida paritária, Lei 12.618/2012).</li>
			<li>
				Das duas contribuições saem o FCBE ({pct(FUNPRESP_FCBE)}) e a taxa de carregamento (de
				{pct(FUNPRESP_CARREGAMENTO.inicial)} caindo a {pct(FUNPRESP_CARREGAMENTO.final)} em {FUNPRESP_CARREGAMENTO.anos} anos de
				plano). O restante vai para a conta individual e rende a taxa real do cenário.
			</li>
			<li>A contribuição à Funpresp é dedutível do IR.</li>
		</ul>
	</details>

	<details>
		<summary>Imposto de renda</summary>
		<p>
			Mesma regra no RGPS e no RPPS. <strong>Base</strong> = rendimento tributável (bruto sem auxílio-alimentação) −
			contribuição previdenciária − Funpresp − {reaisCentavos(DEDUCAO_DEPENDENTE_IRPF)} por dependente.
		</p>
		<table class="compacta">
			<thead><tr><th scope="col">Base mensal</th><th scope="col">Alíquota</th><th scope="col">Parcela a deduzir</th></tr></thead>
			<tbody>
				{#each TABELA_IRPF as [teto, aliquota, deducao] (teto)}
					<tr><td>{limite(teto)}</td><td>{aliquota ? pct(aliquota) : 'isento'}</td><td>{reaisCentavos(deducao)}</td></tr>
				{/each}
			</tbody>
		</table>
		<ul>
			<li>
				Redutor da Lei 15.270/2025: isenção até {reaisCentavos(REDUTOR_IRPF.isencaoAte)} de rendimento e redução parcial até
				{reaisCentavos(REDUTOR_IRPF.faixaAte)}.
			</li>
			<li>13º salário: tributação exclusiva, separada do mês. 1/3 de férias: tributado junto com o mês.</li>
			<li>
				Na aposentadoria, a renda da Funpresp pode seguir a tabela progressiva (somada ao benefício) ou a regressiva,
				simplificada aqui como {pct(IR_REGRESSIVO_FUNPRESP)} à parte.
			</li>
			<li>A tabela do IR fica constante em termos reais (a defasagem histórica não é modelada).</li>
		</ul>
	</details>

	<details>
		<summary>Aposentadoria</summary>
		<h4>Quando</h4>
		<p>
			Regra dos policiais da EC 103/2019 (art. 10, §2º, I), com requisitos cumulativos: idade mínima, tempo de
			contribuição e tempo em cargo policial (padrão: 55, 30 e 25 anos). Tempo policial anterior à posse conta para os
			dois tempos; tempo fora da atividade policial, só para a contribuição. Também é possível informar a idade da
			aposentadoria: ela acontece no mês do aniversário.
		</p>
		<h4>Regime complementar</h4>
		<ul>
			<li>
				<strong>Benefício do RPPS:</strong> média das contribuições (padrão: média do teto) ×
				({pct(RPPS_BENEFICIO.base)} + {pct(RPPS_BENEFICIO.porAno)} por ano de contribuição acima de
				{RPPS_BENEFICIO.anosSemAcrescimo}), limitado ao teto (EC 103, art. 26). O percentual é editável.
			</li>
			<li>
				<strong>Renda da Funpresp:</strong> saldo ÷ fator de anuidade (prazo = expectativa de sobrevida; juros = taxa
				atuarial), recalculada todo janeiro com o saldo e o prazo restantes (Regulamento LegisPrev, art. 21). Depois do
				prazo, {pct(FUNPRESP_PERCENTUAL_SOBREVIVENCIA)} da última parcela, vitalício (art. 25).
			</li>
			<li>Sem contribuições à Funpresp na aposentadoria; contribuição ao RPPS só sobre o que exceder o teto (em geral, zero).</li>
		</ul>
		<h4>Integralidade (regime anterior)</h4>
		<ul>
			<li>Provento igual à remuneração do cargo no último padrão, sem periculosidade e auxílio; acompanha os salários (paridade).</li>
			<li>
				O aposentado contribui ao RPPS sobre o que exceder o teto, com a alíquota efetiva da tabela calculada sobre o
				total (EC 103, art. 11, §4º).
			</li>
			<li>Vale para policiais que ingressaram até 13/11/2019; para os demais, é uma comparação hipotética.</li>
		</ul>
	</details>

	<details>
		<summary>Comparativo, ponto de equilíbrio e investir a diferença</summary>
		<ul>
			<li>
				<strong>Média mensal na aposentadoria:</strong> todo o líquido da aposentadoria até a idade-horizonte (com 13º)
				dividido pelo número de meses.
			</li>
			<li>
				<strong>Ponto de equilíbrio:</strong> primeiro ano em que a integralidade soma mais líquido que o complementar,
				contando da posse em diante.
			</li>
			<li>
				<strong>Investir a diferença:</strong> no complementar, a pessoa vive com o mesmo líquido da integralidade e
				investe a diferença de cada ano, na rentabilidade do cenário; o saldo é sacado em parcelas iguais até a
				idade-horizonte. Vence o regime com a maior média mensal. "Aporte para empatar" é quanto seria preciso investir por
				mês na ativa para igualar as médias. O valor investido pode ser ajustado; investindo mais que a diferença, o
				consumo na ativa fica abaixo do da integralidade.
			</li>
			<li>A rentabilidade do investimento é tratada como líquida de impostos e taxas.</li>
		</ul>
	</details>

	<details>
		<summary>Limitações</summary>
		<ul>
			<li>Só o cargo de Técnico Legislativo; não há função comissionada, anuênios ou outras vantagens pessoais.</li>
			<li>Expectativa de sobrevida e taxa atuarial são estimativas; os valores oficiais estão no simulador da Funpresp.</li>
			<li>Carregamento da Funpresp com redução linear; contribuição facultativa fora do escopo.</li>
			<li>Sem isenção extra do IR aos 65 anos, sem pensões e sem desconto simplificado mensal.</li>
			<li>Diferenças de centavos podem ocorrer no PSSS por detalhes de arredondamento da folha.</li>
		</ul>
	</details>

	<details>
		<summary>Fontes</summary>
		<ul class="fontes">
			<li><a href="https://www12.senado.leg.br/transparencia" rel="noopener noreferrer" target="_blank">Quadro de remunerações dos servidores efetivos do Senado (Lei 15.350/2026)</a></li>
			<li><a href="https://www.legisweb.com.br/legislacao/?id=489284" rel="noopener noreferrer" target="_blank">Portaria Interministerial MPS/MF nº 13/2026: teto do INSS e tabela do RPPS</a></li>
			<li><a href="https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc103.htm" rel="noopener noreferrer" target="_blank">Emenda Constitucional nº 103/2019</a></li>
			<li><a href="https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l10.887.htm" rel="noopener noreferrer" target="_blank">Lei 10.887/2004: base de contribuição</a></li>
			<li><a href="https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12618.htm" rel="noopener noreferrer" target="_blank">Lei 12.618/2012: previdência complementar do servidor</a></li>
			<li><a href="https://www.funpresp.com.br/planos-e-produtos/" rel="noopener noreferrer" target="_blank">Funpresp: Regulamento do LegisPrev, FCBE e taxa de carregamento</a></li>
		</ul>
	</details>
</div>

<style>
	.explicacoes {
		max-width: 52rem;
		display: grid;
		gap: 0.75rem;
	}
	.intro {
		margin: 0 0 0.5rem;
		color: var(--suave);
	}
	details {
		border: 1px solid var(--linha);
		border-radius: 6px;
		background: var(--superficie);
		padding: 0.75rem 1rem;
	}
	details.interna {
		margin: 0.75rem 0;
		padding: 0.5rem 0.75rem;
		background: var(--papel);
	}
	summary {
		font-weight: 700;
		cursor: pointer;
	}
	details.interna summary {
		font-weight: 600;
		font-size: 0.875rem;
	}
	details[open] > summary {
		margin-bottom: 0.75rem;
	}
	summary:focus-visible {
		outline: 2px solid var(--aco);
		outline-offset: 2px;
	}
	h4 {
		margin: 1rem 0 0.25rem;
		font-size: 0.9375rem;
	}
	p,
	li {
		font-size: 0.9375rem;
		line-height: 1.55;
		max-width: 46em;
	}
	p {
		margin: 0.5rem 0;
	}
	ul {
		margin: 0.5rem 0;
		padding-left: 1.25rem;
	}
	li + li {
		margin-top: 0.35rem;
	}
	table {
		border-collapse: collapse;
		font-size: 0.875rem;
		font-variant-numeric: tabular-nums;
		margin: 0.5rem 0;
	}
	th,
	td {
		text-align: left;
		padding: 0.3rem 1.25rem 0.3rem 0;
		border-bottom: 1px solid var(--linha);
		vertical-align: top;
	}
	thead th {
		font-size: 0.75rem;
		color: var(--suave);
		font-weight: 600;
	}
	.compacta td:not(:first-child),
	.compacta th:not(:first-child) {
		text-align: right;
	}
	a {
		color: var(--aco);
	}
	a:focus-visible {
		outline: 2px solid var(--aco);
		outline-offset: 2px;
	}
</style>
