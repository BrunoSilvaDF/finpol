<script lang="ts">
	import { CENARIOS, type Comparativo } from '$lib/calc/comparativo';
	import type { Parametros } from '$lib/calc/tipos';
	import { reais } from './formato';

	let { comparativo, params }: { comparativo: Comparativo; params: Parametros } = $props();

	// Integralidade policial só para quem ingressou até a EC 103/2019 (13/11/2019).
	const INICIO_REGRA_PERMANENTE = '2019-11-13';

	const base = $derived(comparativo.complementar.base.investimento);
	const complementarVence = $derived(base.vantagemMensal > 0);
	const vencedores = $derived(CENARIOS.map((c) => comparativo.complementar[c].investimento.vantagemMensal > 0));
	const cenariosDivergem = $derived(vencedores.some((v) => v !== complementarVence));
	const hipotetico = $derived(params.dataPosse >= INICIO_REGRA_PERMANENTE);
	const rotulosCenario = { pessimista: 'Pessimista', base: 'Base', otimista: 'Otimista' };
	const pct = (fracao: number): string => `${(fracao * 100).toLocaleString('pt-BR')}%`;

	// Composição do primeiro mês de aposentadoria, para mostrar de onde vem cada valor.
	const integral = $derived(comparativo.integralidade.inicial);
	const complementar = $derived(comparativo.complementar.base.inatividade.inicial);
	const anoFimPrazo = $derived(Math.floor(comparativo.complementar.base.funpresp.inicioSobrevivencia / 12));
	type Opcao = 'integralidade' | 'complementar' | 'investindo';
	const melhor: Opcao = $derived(complementarVence ? 'investindo' : 'integralidade');
</script>

<section class="veredito" class:complementar={complementarVence} aria-labelledby="t-veredito">
	<p class="contexto">
		Média mensal líquida na aposentadoria, com 13º, até os {params.idadeHorizonte} anos; Funpresp e investimento a
		{pct(params.rentabilidades.base)} real
	</p>
	<h2 id="t-veredito">
		{complementarVence
			? `O complementar, investindo ${base.aporteInformado ? reais(base.aporteMensalMedio) + ' por mês' : 'a diferença'}, rende mais na aposentadoria`
			: 'A integralidade rende mais na aposentadoria'}
	</h2>

	<div class="opcoes">
		<div class:vence={melhor === 'integralidade'}>
			<span class="nome">Integralidade</span>
			<strong>{reais(base.mediaIntegralidade)}</strong>
			<p class="formula">
				{reais(integral.rpps)} provento integral − {reais(integral.contribuicao)} contribuição do aposentado −
				{reais(integral.irpf)} IR − {reais(integral.outrosDescontos)} outros = {reais(integral.liquido)} no 1º mês
			</p>
		</div>
		<div>
			<span class="nome">Complementar</span>
			<strong>{reais(base.mediaComplementar)}</strong>
			<p class="formula">
				{reais(complementar.rpps)} RPPS + {reais(complementar.funpresp)} Funpresp − {reais(complementar.irpf)} IR −
				{reais(complementar.outrosDescontos)} outros = {reais(complementar.liquido)} no 1º mês; a Funpresp cai para 80%
				em {anoFimPrazo}
			</p>
		</div>
		<div class:vence={melhor === 'investindo'}>
			<span class="nome">{base.aporteInformado ? 'Complementar + investimento' : 'Complementar + diferença investida'}</span>
			<strong>{reais(base.mediaComplementarInvestindo)}</strong>
			<p class="formula">
				{reais(base.mediaComplementar)} complementar + {reais(base.saqueMensal)} de saques do investimento
				({reais(base.saldoNaAposentadoria)} acumulados com {reais(base.aporteMensalMedio)}/mês da ativa)
			</p>
		</div>
	</div>

	<p class="conclusao">
		{#if complementarVence}
			Investindo em média {reais(base.aporteMensalMedio)} por mês na ativa a {pct(params.rentabilidades.base)} real, o
			complementar fica {reais(base.vantagemMensal)} por mês acima.
		{:else}
			Faltam {reais(-base.vantagemMensal)} por mês. Para empatar, seria preciso investir
			<strong>{reais(base.aporteMensalParaEmpatar)}</strong> por mês na ativa a {pct(params.rentabilidades.base)} real;
			a diferença de líquido entre os regimes dá só {reais(base.diferencaMensalMedia)} por mês, em média.
		{/if}
	</p>

	<ul class="cenarios" aria-label="Resultado por cenário de rentabilidade">
		{#each CENARIOS as cenario, i (cenario)}
			{@const r = comparativo.complementar[cenario].investimento}
			<li>
				{rotulosCenario[cenario]} ({pct(params.rentabilidades[cenario])}):
				{vencedores[i] ? 'complementar' : 'integralidade'} por {reais(Math.abs(r.vantagemMensal))}/mês
			</li>
		{/each}
	</ul>
	{#if base.aporteInformado && Math.abs(base.aporteMensalMedio - base.diferencaMensalMedia) > 1}
		<p class="aviso">
			Simulando um investimento de {reais(base.aporteMensalMedio)} por mês, em vez da diferença de
			{reais(base.diferencaMensalMedia)}: na ativa, o consumo
			{base.aporteMensalMedio > base.diferencaMensalMedia ? 'fica abaixo' : 'fica acima'} do da integralidade em
			{reais(Math.abs(base.aporteMensalMedio - base.diferencaMensalMedia))} por mês.
		</p>
	{/if}
	{#if cenariosDivergem}
		<p class="aviso">O resultado depende da rentabilidade: os cenários não concordam.</p>
	{/if}
	{#if hipotetico}
		<p class="aviso">
			A integralidade vale só para quem ingressou até 13/11/2019; com posse depois disso, este comparativo é hipotético.
		</p>
	{/if}
</section>

<style>
	.veredito {
		--destaque: var(--integral);
		border: 1px solid var(--linha);
		border-left: 6px solid var(--destaque);
		border-radius: 6px;
		background: var(--superficie);
		padding: 1.25rem 1.5rem;
	}
	.veredito.complementar {
		--destaque: var(--aco);
	}
	.contexto {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--suave);
	}
	h2 {
		margin: 0.25rem 0 1rem;
		font-size: clamp(1.25rem, 2.6vw, 1.625rem);
		letter-spacing: -0.01em;
	}
	.opcoes {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
		gap: 0.75rem;
	}
	.opcoes > div {
		display: grid;
		align-content: start;
		gap: 0.125rem;
		padding: 0.75rem 1rem;
		border-radius: 4px;
		background: var(--papel);
	}
	.opcoes > div.vence {
		box-shadow: inset 0 0 0 2px var(--destaque);
	}
	.formula {
		margin: 0.25rem 0 0;
		font-size: 0.75rem;
		line-height: 1.45;
		color: var(--suave);
		font-variant-numeric: tabular-nums;
	}
	.nome {
		font-size: 0.8125rem;
		font-weight: 600;
	}
	strong {
		font-variant-numeric: tabular-nums;
	}
	.opcoes strong {
		font-size: 1.625rem;
	}
	.conclusao {
		margin: 1rem 0 0.5rem;
		max-width: 48em;
		font-variant-numeric: tabular-nums;
	}
	.cenarios {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1.25rem;
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: 0.8125rem;
		color: var(--suave);
		font-variant-numeric: tabular-nums;
	}
	.aviso {
		margin: 0.75rem 0 0;
		font-size: 0.8125rem;
		color: var(--latao);
	}
</style>
