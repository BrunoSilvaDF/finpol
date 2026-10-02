<script lang="ts">
	import type { LinhaAnual, Marcos } from '$lib/calc/tipos';
	import { reais } from './formato';

	let { linhas, marcos }: { linhas: LinhaAnual[]; marcos: Marcos } = $props();

	const L = 720;
	const A = 300;
	const margem = { topo: 40, direita: 24, base: 32, esquerda: 84 };
	const larguraUtil = L - margem.esquerda - margem.direita;
	const alturaUtil = A - margem.topo - margem.base;

	const valores = $derived(linhas.map((l) => l.liquidoMensal));
	const minimo = $derived(Math.floor((Math.min(...valores) * 0.97) / 1000) * 1000);
	const maximo = $derived(Math.ceil((Math.max(...valores) * 1.02) / 1000) * 1000);
	const largDegrau = $derived(larguraUtil / linhas.length);

	const x = (i: number): number => margem.esquerda + i * largDegrau;
	const y = (v: number): number => margem.topo + alturaUtil * (1 - (v - minimo) / (maximo - minimo));

	const caminho = $derived(
		linhas
			.map((l, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(l.liquidoMensal)} H${x(i + 1)}`)
			.join(' ')
	);
	const marcosVisiveis = $derived(
		[
			{ ano: marcos.anoPadraoMaximo, rotulo: 'Padrão máximo' },
			{ ano: marcos.anoAposentadoria, rotulo: 'Aposentadoria' }
		]
			.map((m) => ({ ...m, i: linhas.findIndex((l) => l.ano === m.ano) }))
			.filter((m) => m.i >= 0)
	);
	const grade = $derived([minimo, (minimo + maximo) / 2, maximo]);
	const anosEixo = $derived(linhas.filter((_, i) => i % 4 === 0));
	// Rótulo de padrão apenas quando o degrau muda, para não poluir o patamar final.
	const degraus = $derived(linhas.filter((l, i) => i === 0 || l.padrao !== linhas[i - 1].padrao));
</script>

<figure>
	<svg viewBox="0 0 {L} {A}" role="img" aria-label="Líquido mensal projetado por ano, de {linhas[0]?.ano} a {linhas.at(-1)?.ano}">
		{#each grade as v (v)}
			<line class="grade" x1={margem.esquerda} x2={L - margem.direita} y1={y(v)} y2={y(v)} />
			<text class="eixo" x={margem.esquerda - 8} y={y(v) + 4} text-anchor="end">{reais(v)}</text>
		{/each}

		<!-- Rótulos escalonados para não se sobreporem quando os marcos são próximos. -->
		{#each marcosVisiveis as m, k (m.rotulo)}
			{@const noFim = m.i > linhas.length * 0.7}
			<line class="marco" x1={x(m.i)} x2={x(m.i)} y1={margem.topo - 18 + k * 14} y2={A - margem.base} />
			<text class="marco-rotulo" x={x(m.i) + (noFim ? -6 : 6)} y={margem.topo - 22 + k * 14} text-anchor={noFim ? 'end' : 'start'}>{m.rotulo} · {m.ano}</text>
		{/each}

		<path class="area" d="{caminho} V{A - margem.base} H{x(0)} Z" />
		<path class="degrau" d={caminho} />

		{#each degraus as l (l.ano)}
			{@const i = linhas.indexOf(l)}
			<text class="padrao" x={x(i) + largDegrau / 2} y={y(l.liquidoMensal) - 6} text-anchor="middle">{l.padrao}</text>
		{/each}

		{#each anosEixo as l (l.ano)}
			<text class="eixo" x={x(linhas.indexOf(l)) + largDegrau / 2} y={A - 10} text-anchor="middle">{l.ano}</text>
		{/each}
	</svg>
	<figcaption>Líquido mensal no último mês de cada ano (no ano da aposentadoria, o mês anterior a ela). Os números sobre os degraus são os padrões. Valores pela tabela de 2026, sem reajustes.</figcaption>
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
	.area {
		fill: var(--aco);
		opacity: 0.08;
	}
	.degrau {
		fill: none;
		stroke: var(--aco);
		stroke-width: 2.5;
		stroke-linejoin: round;
	}
	.padrao {
		fill: var(--aco);
		font-size: 10px;
		font-weight: 600;
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
		color: var(--suave);
		font-size: 0.8125rem;
		margin-top: 0.5rem;
	}
</style>
