<script lang="ts">
	import { CENARIOS, type Comparativo } from '$lib/calc/comparativo';
	import type { CenarioFunpresp } from '$lib/calc/funpresp';
	import type { Cenario, Marcos, Parametros } from '$lib/calc/tipos';
	import { reais } from './formato';

	let { comparativo, params, marcos }: { comparativo: Comparativo; params: Parametros; marcos: Marcos } = $props();

	const anoAtual = new Date().getFullYear();
	const rotulosCenario = { pessimista: 'Pessimista', base: 'Base', otimista: 'Otimista' };
	const pct = (fracao: number): string => `${(fracao * 100).toLocaleString('pt-BR')}%`;

	const funpresp = (c: Cenario): CenarioFunpresp => comparativo.complementar[c].funpresp;
	const base = $derived(funpresp('base'));
	const composicao = $derived(base.composicao);
	const informado = $derived(params.saldoFunpresp !== null && params.saldoFunpresp !== undefined);
	const anoFimPrazo = $derived(Math.floor(base.inicioSobrevivencia / 12));

	// Saldo por ano: acumulação na ativa (o ano da aposentadoria fica com o saldo de pico) e consumo na renda.
	function saldosPorAno(f: CenarioFunpresp): Map<number, number> {
		const saldos = new Map(f.saldosNaInatividade.map((s) => [s.ano, s.saldo]));
		for (const s of f.saldosAnuais) saldos.set(s.ano, s.saldo);
		return saldos;
	}
	const series = $derived(Object.fromEntries(CENARIOS.map((c) => [c, saldosPorAno(funpresp(c))])) as Record<Cenario, Map<number, number>>);
	const anos = $derived([...new Set(CENARIOS.flatMap((c) => [...series[c].keys()]))].sort((a, b) => a - b));

	const L = 720;
	const A = 300;
	const margem = { topo: 40, direita: 24, base: 32, esquerda: 92 };
	const maximo = $derived(Math.ceil(Math.max(...series.otimista.values()) / 500000) * 500000 || 500000);
	const x = (ano: number): number => margem.esquerda + ((ano - anos[0]) / Math.max(1, anos.at(-1)! - anos[0])) * (L - margem.esquerda - margem.direita);
	const y = (v: number): number => margem.topo + (A - margem.topo - margem.base) * (1 - v / maximo);
	const linha = (c: Cenario): string => anos.filter((a) => series[c].has(a)).map((a, i) => `${i ? 'L' : 'M'}${x(a)},${y(series[c].get(a)!)}`).join(' ');
	const faixa = $derived.by(() => {
		const topo = anos.filter((a) => series.otimista.has(a)).map((a, i) => `${i ? 'L' : 'M'}${x(a)},${y(series.otimista.get(a)!)}`);
		const fundo = [...anos].reverse().filter((a) => series.pessimista.has(a)).map((a) => `L${x(a)},${y(series.pessimista.get(a)!)}`);
		return `${topo.join(' ')} ${fundo.join(' ')} Z`;
	});
	const grade = $derived([0, maximo / 2, maximo]);
	const marcosGrafico = $derived(
		[
			{ ano: anoAtual, rotulo: 'Hoje' },
			{ ano: marcos.anoAposentadoria, rotulo: 'Aposentadoria' },
			{ ano: anoFimPrazo, rotulo: 'Fim do prazo' }
		].filter((m) => m.ano >= anos[0] && m.ano <= anos.at(-1)!)
	);
	const passoEixo = $derived(Math.ceil(anos.length / 8));
	const milhoes = (v: number): string => (v >= 1e6 ? `R$ ${(v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi` : reais(v));

	const partes = $derived(
		[
			{ rotulo: 'Saldo informado', valor: composicao.saldoInicial, classe: 'inicial' },
			{ rotulo: 'Suas contribuições', valor: composicao.participante, classe: 'voce' },
			{ rotulo: 'Contrapartida da União', valor: composicao.uniao, classe: 'uniao' },
			{ rotulo: 'Rendimentos', valor: composicao.rendimentos, classe: 'rendimentos' }
		].filter((p) => p.valor > 0)
	);
	const totalPositivo = $derived(partes.reduce((s, p) => s + p.valor, 0));
</script>

<dl class="numeros">
	<div>
		<dt>Saldo hoje ({informado ? 'informado' : 'simulado desde a posse'})</dt>
		<dd>{reais(base.saldoHoje)}</dd>
	</div>
	<div>
		<dt>Saldo ao se aposentar, em {marcos.anoAposentadoria} ({pct(params.rentabilidades.base)} real)</dt>
		<dd>{reais(base.saldoNaAposentadoria)}</dd>
		<span class="faixa-texto">entre {reais(funpresp('pessimista').saldoNaAposentadoria)} e {reais(funpresp('otimista').saldoNaAposentadoria)}</span>
	</div>
	<div>
		<dt>Renda inicial da Funpresp</dt>
		<dd>{reais(base.rendaInicial)}<small>/mês</small></dd>
		<span class="faixa-texto">até {anoFimPrazo}; depois {reais(base.rendaSobrevivencia)}/mês vitalício</span>
	</div>
</dl>

<section aria-labelledby="t-composicao">
	<h4 id="t-composicao">De onde vem o saldo ao se aposentar (cenário base)</h4>
	<div class="barra" role="img" aria-label="Composição do saldo da Funpresp">
		{#each partes as p (p.classe)}
			<span class={p.classe} style:width="{(p.valor / totalPositivo) * 100}%"></span>
		{/each}
	</div>
	<ul class="legenda-composicao">
		{#each partes as p (p.classe)}
			<li><span class="amostra {p.classe}"></span>{p.rotulo}: <strong>{reais(p.valor)}</strong></li>
		{/each}
		<li class="custo">FCBE e taxa de carregamento: <strong>−{reais(composicao.custos)}</strong></li>
	</ul>
</section>

<figure>
	<svg viewBox="0 0 {L} {A}" role="img" aria-label="Saldo projetado da Funpresp por ano, nos três cenários">
		{#each grade as v (v)}
			<line class="grade" x1={margem.esquerda} x2={L - margem.direita} y1={y(v)} y2={y(v)} />
			<text class="eixo" x={margem.esquerda - 8} y={y(v) + 4} text-anchor="end">{milhoes(v)}</text>
		{/each}
		{#each marcosGrafico as m, k (m.rotulo)}
			{@const noFim = x(m.ano) > L * 0.7}
			<line class="marco" x1={x(m.ano)} x2={x(m.ano)} y1={margem.topo - 18 + k * 12} y2={A - margem.base} />
			<text class="marco-rotulo" x={x(m.ano) + (noFim ? -6 : 6)} y={margem.topo - 22 + k * 12} text-anchor={noFim ? 'end' : 'start'}>{m.rotulo} · {m.ano}</text>
		{/each}
		<path class="faixa" d={faixa} />
		<path class="linha extremo" d={linha('pessimista')} />
		<path class="linha extremo" d={linha('otimista')} />
		<path class="linha" d={linha('base')} />
		{#each anos as ano, i (ano)}
			{#if i % passoEixo === 0}
				<text class="eixo" x={x(ano)} y={A - 10} text-anchor="middle">{ano}</text>
			{/if}
		{/each}
	</svg>
	<figcaption>
		Saldo da conta individual em reais de hoje: cresce com as contribuições até a aposentadoria e é consumido pela renda
		até o fim do prazo ({params.expectativaSobrevida} anos). Linha cheia: cenário base; tracejadas: pessimista
		({pct(params.rentabilidades.pessimista)}) e otimista ({pct(params.rentabilidades.otimista)}).
	</figcaption>
</figure>

<details>
	<summary>Ver o saldo ano a ano</summary>
	<div class="rolagem">
		<table>
			<thead>
				<tr>
					<th scope="col">Ano</th>
					<th scope="col">Idade</th>
					<th scope="col">Fase</th>
					{#each CENARIOS as c (c)}<th scope="col">{rotulosCenario[c]}</th>{/each}
				</tr>
			</thead>
			<tbody>
				{#each anos as ano (ano)}
					<tr class:marco={ano === marcos.anoAposentadoria}>
						<th scope="row">{ano}</th>
						<td>{ano - params.anoNascimento}</td>
						<td class="fase">{ano < marcos.anoAposentadoria ? 'acumulação' : ano === marcos.anoAposentadoria ? 'aposentadoria' : 'renda'}</td>
						{#each CENARIOS as c (c)}<td>{series[c].has(ano) ? reais(series[c].get(ano)!) : '—'}</td>{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</details>

<style>
	.numeros {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
		gap: 0.75rem;
		margin: 0 0 1.5rem;
	}
	.numeros div {
		padding: 0.75rem 1rem;
		border: 1px solid var(--linha);
		border-radius: 4px;
		background: var(--superficie);
	}
	.numeros dt {
		font-size: 0.8125rem;
		color: var(--suave);
	}
	.numeros dd {
		margin: 0.25rem 0 0;
		font-size: 1.375rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	.numeros small {
		font-size: 0.8125rem;
		font-weight: 400;
		color: var(--suave);
	}
	.faixa-texto {
		display: block;
		font-size: 0.75rem;
		color: var(--suave);
		font-variant-numeric: tabular-nums;
	}
	h4 {
		margin: 0 0 0.5rem;
		font-size: 0.875rem;
	}
	.barra {
		display: flex;
		height: 1.25rem;
		border-radius: 3px;
		overflow: hidden;
		background: var(--papel);
	}
	.inicial {
		background: var(--suave);
	}
	.voce {
		background: var(--aco);
	}
	.uniao {
		background: var(--integral);
	}
	.rendimentos {
		background: var(--latao);
	}
	.legenda-composicao {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1.25rem;
		margin: 0.5rem 0 1.5rem;
		padding: 0;
		list-style: none;
		font-size: 0.8125rem;
		font-variant-numeric: tabular-nums;
	}
	.legenda-composicao li {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}
	.custo {
		color: var(--negativo);
	}
	.amostra {
		display: inline-block;
		width: 0.8rem;
		height: 0.8rem;
		border-radius: 2px;
	}
	figure {
		margin: 0 0 1rem;
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
		stroke: var(--aco);
		stroke-width: 2.5;
		stroke-linejoin: round;
	}
	.linha.extremo {
		stroke-width: 1.25;
		stroke-dasharray: 4 3;
	}
	.faixa {
		fill: var(--aco);
		opacity: 0.12;
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
		margin-top: 0.5rem;
		font-size: 0.8125rem;
		color: var(--suave);
		max-width: 60em;
	}
	summary {
		font-size: 0.875rem;
		color: var(--aco);
		cursor: pointer;
	}
	summary:focus-visible {
		outline: 2px solid var(--aco);
		outline-offset: 2px;
	}
	.rolagem {
		overflow-x: auto;
		margin-top: 0.75rem;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.8125rem;
		font-variant-numeric: tabular-nums;
	}
	th,
	td {
		padding: 0.35rem 0.75rem;
		text-align: right;
		border-bottom: 1px solid var(--linha);
		white-space: nowrap;
	}
	th:first-child,
	.fase {
		text-align: left;
	}
	thead th {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--suave);
	}
	.fase {
		color: var(--suave);
	}
	tr.marco {
		background: var(--latao-fundo);
	}
</style>
