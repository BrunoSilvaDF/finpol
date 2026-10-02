<script lang="ts">
	import type { Comparativo } from '$lib/calc/comparativo';
	import type { ProjecaoInatividade } from '$lib/calc/inatividade';
	import type { LinhaAnual, Marcos, Parametros } from '$lib/calc/tipos';
	import { reais } from './formato';

	let { comparativo, params, marcos }: { comparativo: Comparativo; params: Parametros; marcos: Marcos } = $props();

	const L = 720;
	const A = 320;
	const margem = { topo: 40, direita: 24, base: 32, esquerda: 84 };

	// Líquido mensal de cada ano: na ativa, o do último mês ativo; aposentado, o do último mês do ano.
	function serie(ativa: LinhaAnual[], inativa: ProjecaoInatividade): Map<number, number> {
		const valores = new Map<number, number>();
		for (const l of ativa) if (l.ano < marcos.anoAposentadoria) valores.set(l.ano, l.liquidoMensal);
		for (const l of inativa.linhas) valores.set(l.ano, l.mensal.liquido);
		return valores;
	}

	const integral = $derived(serie(comparativo.ativa.integralidade, comparativo.integralidade));
	const base = $derived(serie(comparativo.ativa.complementar, comparativo.complementar.base.inatividade));
	const pessimista = $derived(serie(comparativo.ativa.complementar, comparativo.complementar.pessimista.inatividade));
	const otimista = $derived(serie(comparativo.ativa.complementar, comparativo.complementar.otimista.inatividade));

	const anos = $derived([...integral.keys()]);
	const todos = $derived([...integral.values(), ...pessimista.values(), ...otimista.values()]);
	const minimo = $derived(Math.floor((Math.min(...todos) * 0.9) / 5000) * 5000);
	const maximo = $derived(Math.ceil((Math.max(...todos) * 1.05) / 5000) * 5000);
	const largura = $derived((L - margem.esquerda - margem.direita) / anos.length);

	const x = (i: number): number => margem.esquerda + i * largura;
	const y = (v: number): number => margem.topo + (A - margem.topo - margem.base) * (1 - (v - minimo) / (maximo - minimo));

	const degraus = (valores: Map<number, number>): string =>
		anos.map((ano, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(valores.get(ano) ?? 0)} H${x(i + 1)}`).join(' ');

	// Faixa entre os cenários, só na inatividade (na ativa os três coincidem).
	const faixa = $derived.by(() => {
		const inicio = anos.indexOf(marcos.anoAposentadoria);
		if (inicio < 0) return '';
		const trecho = anos.slice(inicio);
		const topo = trecho.map((ano, k) => `${k === 0 ? 'M' : 'L'}${x(inicio + k)},${y(otimista.get(ano)!)} H${x(inicio + k + 1)}`);
		const fundo = [...trecho].reverse().map((ano, k) => {
			const i = inicio + trecho.length - 1 - k;
			return `L${x(i + 1)},${y(pessimista.get(ano)!)} H${x(i)}`;
		});
		return `${topo.join(' ')} ${fundo.join(' ')} Z`;
	});

	const anoFimPrazo = $derived(Math.floor(comparativo.complementar.base.funpresp.inicioSobrevivencia / 12));
	const marcosVisiveis = $derived(
		[
			{ ano: marcos.anoAposentadoria, rotulo: 'Aposentadoria' },
			{ ano: anoFimPrazo, rotulo: 'Fim do prazo Funpresp' }
		]
			.map((m) => ({ ...m, i: anos.indexOf(m.ano) }))
			.filter((m) => m.i >= 0)
	);
	const grade = $derived([minimo, (minimo + maximo) / 2, maximo]);
	const passoEixo = $derived(Math.ceil(anos.length / 8));
</script>

<figure>
	<svg viewBox="0 0 {L} {A}" role="img" aria-label="Líquido mensal da posse até os {params.idadeHorizonte} anos, nos dois regimes">
		{#each grade as v (v)}
			<line class="grade" x1={margem.esquerda} x2={L - margem.direita} y1={y(v)} y2={y(v)} />
			<text class="eixo" x={margem.esquerda - 8} y={y(v) + 4} text-anchor="end">{reais(v)}</text>
		{/each}

		{#each marcosVisiveis as m, k (m.rotulo)}
			{@const noFim = m.i > anos.length * 0.6}
			<line class="marco" x1={x(m.i)} x2={x(m.i)} y1={margem.topo - 18 + k * 14} y2={A - margem.base} />
			<text class="marco-rotulo" x={x(m.i) + (noFim ? -6 : 6)} y={margem.topo - 22 + k * 14} text-anchor={noFim ? 'end' : 'start'}>{m.rotulo} · {m.ano}</text>
		{/each}

		<path class="faixa" d={faixa} />
		<path class="linha integral" d={degraus(integral)} />
		<path class="linha complementar" d={degraus(base)} />

		{#each anos as ano, i (ano)}
			{#if i % passoEixo === 0}
				<text class="eixo" x={x(i) + largura / 2} y={A - 10} text-anchor="middle">{ano}</text>
			{/if}
		{/each}
	</svg>
	<figcaption>
		<span class="legenda"><span class="amostra complementar"></span>Complementar (rentabilidade base)</span>
		<span class="legenda"><span class="amostra faixa-amostra"></span>Entre pessimista e otimista</span>
		<span class="legenda"><span class="amostra integral"></span>Integralidade</span>
	</figcaption>
</figure>

<style>
	figure {
		margin: 0;
	}
	svg {
		width: 100%;
		height: auto;
		display: block;
	}
	.grade {
		stroke: var(--linha);
	}
	.eixo {
		fill: var(--suave);
		font-size: 11px;
		font-variant-numeric: tabular-nums;
	}
	.linha {
		fill: none;
		stroke-width: 2.5;
		stroke-linejoin: round;
	}
	.complementar {
		stroke: var(--aco);
	}
	.integral {
		stroke: var(--integral);
	}
	.faixa {
		fill: var(--aco);
		opacity: 0.14;
	}
	.marco {
		stroke: var(--latao);
		stroke-width: 1.5;
		stroke-dasharray: 3 3;
	}
	.marco-rotulo {
		fill: var(--latao);
		font-size: 11px;
		font-weight: 600;
	}
	figcaption {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.25rem;
		margin-top: 0.5rem;
		font-size: 0.8125rem;
		color: var(--suave);
	}
	.legenda {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}
	.amostra {
		display: inline-block;
		width: 1.25rem;
		height: 3px;
	}
	.amostra.complementar {
		background: var(--aco);
	}
	.amostra.integral {
		background: var(--integral);
	}
	.faixa-amostra {
		height: 0.75rem;
		background: var(--aco);
		opacity: 0.18;
	}
</style>
