<script lang="ts">
	import { calcularFolha } from '$lib/calc/folha';
	import type { LinhaInativa } from '$lib/calc/inatividade';
	import type { LinhaAnual, Marcos, Parametros } from '$lib/calc/tipos';
	import Contracheque from './Contracheque.svelte';
	import { NOMES_MESES, reais } from './formato';
	import Provento from './Provento.svelte';

	let {
		linhas,
		inativas,
		marcos,
		params,
		anoAtual
	}: { linhas: LinhaAnual[]; inativas: LinhaInativa[]; marcos: Marcos; params: Parametros; anoAtual: number } = $props();

	// O ano da aposentadoria tem duas linhas (ativa e aposentado), então a chave inclui a fase.
	let aberta = $state<string | null>(null);
	const alternar = (chave: string): void => {
		aberta = aberta === chave ? null : chave;
	};

	const marcoDoAno = (ano: number): string =>
		ano === marcos.anoPadraoMaximo ? 'Padrão máximo' : ano === marcos.anoAposentadoria ? 'Aposentadoria' : '';
</script>

{#if linhas[0]?.ano < anoAtual}
	<p class="legenda">
		<span class="amostra" aria-hidden="true"></span>
		Anos anteriores a {anoAtual} são estimativas pela tabela de 2026 (reajuste de abril/2026); os valores
		efetivamente pagos estão nos seus contracheques.
	</p>
{/if}

<div class="rolagem">
	<table>
		<thead>
			<tr>
				<th scope="col">Ano</th>
				<th scope="col">Padrão</th>
				<th scope="col" title="Idade completada no ano">Idade</th>
				<th scope="col">Líquido mensal</th>
				<th scope="col">13º líquido</th>
				<th scope="col">1/3 de férias</th>
				<th scope="col">Líquido no ano</th>
			</tr>
		</thead>
		<tbody>
			{#each linhas as l (l.ano)}
				{@const marco = marcoDoAno(l.ano)}
				{@const aberto = aberta === `a${l.ano}`}
				<tr class:marco={marco !== ''} class:passado={l.ano < anoAtual} class:aberto onclick={() => alternar(`a${l.ano}`)}>
					<th scope="row">
						<button type="button" aria-expanded={aberto} aria-controls="folha-{l.ano}" onclick={(e) => { e.stopPropagation(); alternar(`a${l.ano}`); }}>
							<span class="seta" aria-hidden="true">{aberto ? '▾' : '▸'}</span>{l.ano}
						</button>
						{#if marco}<span class="rotulo-marco">{marco}</span>{/if}
					</th>
					<td>{l.padrao}</td>
					<td>{l.idade}</td>
					<td>{reais(l.liquidoMensal)}</td>
					<td>{reais(l.decimoTerceiroLiquido)}</td>
					<td>{l.tercoFeriasLiquido ? reais(l.tercoFeriasLiquido) : '—'}</td>
					<td>{reais(l.liquidoAnual)}</td>
				</tr>
				{#if aberto}
					<tr class="detalhe" id="folha-{l.ano}">
						<td colspan="7">
							<p>Contracheque de exemplo: {NOMES_MESES[l.mesReferencia - 1]} de {l.ano}, padrão {l.padrao}. {#if l.mesesAtivos < 12}Neste ano são {l.mesesAtivos} meses em atividade; 13º e 1/3 de férias proporcionais.{/if}</p>
							<Contracheque folha={calcularFolha(l.padrao, params, { ano: l.ano })} {params} />
						</td>
					</tr>
				{/if}
			{/each}
			{#each inativas as l (l.ano)}
				{@const aberto = aberta === `i${l.ano}`}
				<tr class="inativa" class:aberto onclick={() => alternar(`i${l.ano}`)}>
					<th scope="row">
						<button type="button" aria-expanded={aberto} aria-controls="provento-{l.ano}" onclick={(e) => { e.stopPropagation(); alternar(`i${l.ano}`); }}>
							<span class="seta" aria-hidden="true">{aberto ? '▾' : '▸'}</span>{l.ano}
						</button>
					</th>
					<td>aposentado</td>
					<td>{l.idade}</td>
					<td>{reais(l.mensal.liquido)}</td>
					<td>{reais(l.decimoTerceiroLiquido)}</td>
					<td>—</td>
					<td>{reais(l.liquidoAnual)}</td>
				</tr>
				{#if aberto}
					<tr class="detalhe" id="provento-{l.ano}">
						<td colspan="7">
							<p>
								Provento de exemplo: último mês de {l.ano}{#if params.regime === 'complementar'}, com a Funpresp no cenário base{/if}.
								{#if l.mesesAposentado < 12}Neste ano são {l.mesesAposentado} meses aposentado; 13º proporcional.{/if}
							</p>
							<Provento renda={l.mensal} {params} ano={l.ano} />
						</td>
					</tr>
				{/if}
			{/each}
		</tbody>
	</table>
</div>

<style>
	.rolagem {
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
		font-variant-numeric: tabular-nums;
	}
	th,
	td {
		padding: 0.45rem 0.75rem;
		text-align: right;
		border-bottom: 1px solid var(--linha);
		white-space: nowrap;
	}
	th:first-child {
		text-align: left;
	}
	thead th {
		font-weight: 600;
		font-size: 0.75rem;
		color: var(--suave);
	}
	tbody th {
		font-weight: 600;
	}
	tr.marco {
		background: var(--latao-fundo);
	}
	tr.inativa th:first-child {
		box-shadow: inset 3px 0 0 var(--suave);
	}
	tr.inativa td:nth-child(2) {
		color: var(--suave);
		font-size: 0.8125rem;
	}
	tr.passado,
	.amostra {
		background: repeating-linear-gradient(-45deg, transparent 0 6px, var(--linha-fundo) 6px 8px);
	}
	tr.passado :is(th, td) {
		color: var(--suave);
		font-style: italic;
	}
	.legenda {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0 0 0.75rem;
		font-size: 0.8125rem;
		color: var(--suave);
	}
	.amostra {
		flex: none;
		width: 1.5rem;
		height: 1rem;
		border: 1px solid var(--linha);
	}
	tbody tr:not(.detalhe) {
		cursor: pointer;
	}
	tbody tr:not(.detalhe):hover,
	tr.aberto {
		background: var(--linha-fundo);
	}
	button {
		font: inherit;
		color: inherit;
		background: none;
		border: 0;
		padding: 0;
		cursor: pointer;
	}
	button:focus-visible {
		outline: 2px solid var(--aco);
		outline-offset: 2px;
	}
	.seta {
		display: inline-block;
		width: 1em;
		color: var(--suave);
	}
	tr.detalhe td {
		text-align: left;
		white-space: normal;
		padding: 0.75rem 0.75rem 1.5rem 2rem;
		background: var(--superficie);
	}
	tr.detalhe p {
		margin: 0 0 0.75rem;
		font-size: 0.8125rem;
		color: var(--suave);
	}
	tr.marco .rotulo-marco {
		margin-left: 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--latao);
	}
</style>
