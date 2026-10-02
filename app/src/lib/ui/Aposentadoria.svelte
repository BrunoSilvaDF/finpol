<script lang="ts">
	import type { Comparativo } from '$lib/calc/comparativo';
	import { percentualBeneficioRpps } from '$lib/calc/rpps';
	import type { Marcos, Parametros, Regime } from '$lib/calc/tipos';
	import { NOMES_MESES, reais } from './formato';
	import InvestirDiferenca from './InvestirDiferenca.svelte';
	import ProjecaoFunpresp from './ProjecaoFunpresp.svelte';
	import Vida from './Vida.svelte';

	let { comparativo, params, marcos }: { comparativo: Comparativo; params: Parametros; marcos: Marcos } = $props();

	const base = $derived(comparativo.complementar.base);
	const pessimista = $derived(comparativo.complementar.pessimista);
	const otimista = $derived(comparativo.complementar.otimista);
	const integral = $derived(comparativo.integralidade.inicial);
	const complementar = $derived(base.inatividade.inicial);

	const idadeAposentadoria = $derived(marcos.anoAposentadoria - params.anoNascimento);
	const anoFimPrazo = $derived(Math.floor(base.funpresp.inicioSobrevivencia / 12));
	const percentualRpps = $derived(Math.round(percentualBeneficioRpps(params) * 100));
	const diferencaMensalAtiva = $derived(comparativo.liquidoMensalAtual.complementar - comparativo.liquidoMensalAtual.integralidade);
	const diferencaAtiva = $derived(comparativo.liquidoAtiva.complementar - comparativo.liquidoAtiva.integralidade);
	const pct = (fracao: number): string => `${(fracao * 100).toLocaleString('pt-BR')}%`;
	const etiqueta = (regime: Regime): string => (params.regime === regime ? 'seu regime' : 'comparação');

	const abas = [
		{ id: 'comparativo', rotulo: 'Comparativo' },
		{ id: 'funpresp', rotulo: 'Funpresp' },
		{ id: 'investir', rotulo: 'Investir a diferença' }
	] as const;
	let aba = $state<(typeof abas)[number]['id']>('comparativo');
</script>

<p class="abertura">
	Aposentadoria em {NOMES_MESES[marcos.mesAposentadoria - 1]} de {marcos.anoAposentadoria}, aos {idadeAposentadoria} anos.
	Valores líquidos por mês, em reais de hoje.
</p>

<div class="abas" role="tablist" aria-label="Visões da aposentadoria">
	{#each abas as a (a.id)}
		<button
			type="button"
			role="tab"
			id="aba-{a.id}"
			aria-selected={aba === a.id}
			aria-controls="painel-{a.id}"
			tabindex={aba === a.id ? 0 : -1}
			onclick={() => (aba = a.id)}>{a.rotulo}</button
		>
	{/each}
</div>

{#if aba === 'funpresp'}
	<div role="tabpanel" id="painel-funpresp" aria-labelledby="aba-funpresp">
		<ProjecaoFunpresp {comparativo} {params} {marcos} />
	</div>
{:else if aba === 'investir'}
	<div role="tabpanel" id="painel-investir" aria-labelledby="aba-investir">
		<InvestirDiferenca {comparativo} {params} {marcos} />
	</div>
{:else}
<div role="tabpanel" id="painel-comparativo" aria-labelledby="aba-comparativo">

<div class="cartoes">
	<article class:seu={params.regime === 'complementar'} aria-labelledby="t-complementar">
		<header>
			<h3 id="t-complementar">Complementar</h3>
			<span class="etiqueta">{etiqueta('complementar')}</span>
		</header>
		<p class="valor">{reais(complementar.liquido)}</p>
		<p class="nota">
			Ao se aposentar, com a Funpresp rendendo {pct(params.rentabilidades.base)} ao ano acima da inflação. Entre
			{reais(pessimista.inatividade.inicial.liquido)} ({pct(params.rentabilidades.pessimista)}) e
			{reais(otimista.inatividade.inicial.liquido)} ({pct(params.rentabilidades.otimista)}).
		</p>
		<dl>
			<dt>RPPS ({percentualRpps}% da média, até o teto)</dt><dd>{reais(complementar.rpps)}</dd>
			<dt>Funpresp</dt><dd>{reais(complementar.funpresp)}</dd>
			<dt>IR ({params.tributacaoFunpresp})</dt><dd class="neg">{reais(complementar.irpf)}</dd>
			<dt>Saúde, sindicato e associações</dt><dd class="neg">{reais(complementar.outrosDescontos)}</dd>
		</dl>
		<h4>A partir de {anoFimPrazo}</h4>
		<p>
			<strong>{reais(base.aposFimDoPrazo.liquido)}</strong>: acaba o prazo da renda da Funpresp, que passa a pagar 80% da
			última parcela, vitalício.
		</p>
		<h4>Saldo na Funpresp ao se aposentar</h4>
		<p>
			<strong>{reais(base.funpresp.saldoNaAposentadoria)}</strong>, entre {reais(pessimista.funpresp.saldoNaAposentadoria)}
			e {reais(otimista.funpresp.saldoNaAposentadoria)}.
		</p>
		<h4>Na ativa</h4>
		<p>{reais(diferencaMensalAtiva)} a mais por mês hoje: contribui ao RPPS só até o teto.</p>
	</article>

	<article class:seu={params.regime === 'integralidade'} aria-labelledby="t-integralidade">
		<header>
			<h3 id="t-integralidade">Integralidade</h3>
			<span class="etiqueta">{etiqueta('integralidade')}</span>
		</header>
		<p class="valor">{reais(integral.liquido)}</p>
		<p class="nota">Provento igual à última remuneração do cargo, sem periculosidade e sem auxílio-alimentação.</p>
		<dl>
			<dt>Provento integral</dt><dd>{reais(integral.rpps)}</dd>
			<dt>Contribuição do aposentado</dt><dd class="neg">{reais(integral.contribuicao)}</dd>
			<dt>IR</dt><dd class="neg">{reais(integral.irpf)}</dd>
			<dt>Saúde, sindicato e associações</dt><dd class="neg">{reais(integral.outrosDescontos)}</dd>
		</dl>
		<h4>A partir de {anoFimPrazo}</h4>
		<p>Sem mudança: o provento é vitalício.</p>
		<h4>Saldo na Funpresp ao se aposentar</h4>
		<p>Não há: toda a contribuição vai para o RPPS.</p>
		<h4>Na ativa</h4>
		<p>{reais(diferencaMensalAtiva)} a menos por mês hoje: contribui ao RPPS sobre a remuneração inteira.</p>
	</article>
</div>

<p class="equilibrio">
	Da posse à aposentadoria, o complementar entrega <strong>{reais(diferencaAtiva)}</strong> líquidos a mais.
	{#if base.anoEquilibrio !== null}
		No cenário base, a integralidade compensa essa diferença em <strong>{base.anoEquilibrio}</strong>, cerca de
		{base.anoEquilibrio - marcos.anoAposentadoria} anos depois de se aposentar.
	{:else}
		No cenário base, a integralidade não compensa essa diferença até os {params.idadeHorizonte} anos.
	{/if}
	Pessimista: {pessimista.anoEquilibrio ?? 'não compensa'}; otimista: {otimista.anoEquilibrio ?? 'não compensa'}.
</p>

<Vida {comparativo} {params} {marcos} />

<p class="ressalva">
	Premissas: sobrevida de {params.expectativaSobrevida} anos e taxa atuarial de {pct(params.taxaAtuarial)} para converter o
	saldo em renda (confira no simulador da Funpresp); benefício RPPS de {percentualRpps}% da média. A vantagem do complementar
	na ativa é somada sem considerar o rendimento caso seja investida: veja a aba "Investir a diferença".
</p>
</div>
{/if}

<style>
	.abertura {
		margin: 0 0 1rem;
		color: var(--suave);
		font-size: 0.9375rem;
	}
	.abas {
		display: flex;
		gap: 0.25rem;
		margin: 0 0 1.25rem;
		border-bottom: 1px solid var(--linha);
	}
	.abas button {
		font: inherit;
		font-size: 0.875rem;
		background: none;
		border: 0;
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
		padding: 0.5rem 0.75rem;
		color: var(--suave);
		cursor: pointer;
	}
	.abas button[aria-selected='true'] {
		color: var(--tinta);
		font-weight: 600;
		border-bottom-color: var(--aco);
	}
	.abas button:focus-visible {
		outline: 2px solid var(--aco);
		outline-offset: 2px;
	}
	.cartoes {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
		gap: 1rem;
	}
	article {
		border: 1px solid var(--linha);
		border-radius: 6px;
		padding: 1.25rem;
		background: var(--superficie);
	}
	article.seu {
		border-color: var(--aco);
		box-shadow: inset 0 3px 0 var(--aco);
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 0.5rem;
	}
	h3 {
		margin: 0;
		font-size: 1.0625rem;
	}
	.etiqueta {
		font-size: 0.75rem;
		color: var(--suave);
	}
	.seu .etiqueta {
		color: var(--aco);
		font-weight: 600;
	}
	.valor {
		font-size: 2rem;
		font-weight: 700;
		margin: 0.5rem 0 0.25rem;
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.01em;
	}
	.nota {
		margin: 0 0 1rem;
		font-size: 0.8125rem;
		color: var(--suave);
	}
	dl {
		display: grid;
		grid-template-columns: 1fr auto;
		margin: 0 0 1rem;
		font-size: 0.8125rem;
		font-variant-numeric: tabular-nums;
	}
	dt,
	dd {
		margin: 0;
		padding: 0.25rem 0;
		border-bottom: 1px solid var(--linha);
	}
	dd {
		text-align: right;
		padding-left: 0.75rem;
	}
	.neg {
		color: var(--negativo);
	}
	.neg::before {
		content: '− ';
	}
	h4 {
		margin: 1rem 0 0.25rem;
		font-size: 0.8125rem;
		color: var(--suave);
		font-weight: 600;
	}
	article p:not(.valor, .nota) {
		margin: 0;
		font-size: 0.875rem;
	}
	.equilibrio {
		margin: 1.5rem 0;
		font-size: 1rem;
		max-width: 44em;
		font-variant-numeric: tabular-nums;
	}
	.ressalva {
		margin: 1rem 0 0;
		font-size: 0.8125rem;
		color: var(--suave);
		max-width: 60em;
	}
</style>
