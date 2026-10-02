<script lang="ts">
	import { CENARIOS, type Comparativo } from '$lib/calc/comparativo';
	import type { Marcos, Parametros } from '$lib/calc/tipos';
	import { reais } from './formato';

	let { comparativo, params, marcos }: { comparativo: Comparativo; params: Parametros; marcos: Marcos } = $props();

	const base = $derived(comparativo.complementar.base.investimento);
	const rotulosCenario = { pessimista: 'Pessimista', base: 'Base', otimista: 'Otimista' };
	const pct = (fracao: number): string => `${(fracao * 100).toLocaleString('pt-BR')}%`;

	// Barras: a maior renda média define a escala, com folga para a linha da integralidade não colar na borda.
	const escala = $derived(
		1.08 * Math.max(base.mediaIntegralidade, ...CENARIOS.map((c) => comparativo.complementar[c].investimento.mediaComplementarInvestindo))
	);
	const largura = (valor: number): string => `${(valor / escala) * 100}%`;

	// Investir mais (ou menos) que a diferença muda o consumo na ativa em relação à integralidade.
	const consumoAMenos = $derived(base.aporteMensalMedio - base.diferencaMensalMedia);
	const definirAporte = (texto: string): void => {
		params.aporteMensalInvestimento = texto === '' ? null : Math.max(0, +texto);
	};
</script>

<p class="intro">
	No complementar, o líquido da ativa é maior porque a contribuição ao RPPS para no teto. E se você vivesse com o mesmo
	líquido da integralidade e investisse a diferença, na mesma rentabilidade real da Funpresp, para sacar aos poucos
	da aposentadoria até os {params.idadeHorizonte} anos? Você também pode simular outro valor de investimento.
</p>

<div class="ajuste">
	<label>
		Quanto investir por mês na ativa
		<span class="campo">
			<span aria-hidden="true">R$</span>
			<input
				type="number"
				min="0"
				step="100"
				placeholder="{Math.round(base.diferencaMensalMedia).toLocaleString('pt-BR')} (a diferença)"
				value={params.aporteMensalInvestimento ?? ''}
				oninput={(e) => definirAporte(e.currentTarget.value)}
			/>
		</span>
	</label>
	{#if params.aporteMensalInvestimento !== null}
		<button type="button" onclick={() => (params.aporteMensalInvestimento = null)}>Voltar a investir a diferença</button>
	{/if}
	<p class="nota-ajuste" class:alerta={consumoAMenos > 1}>
		{#if !base.aporteInformado}
			Usando a diferença de líquido entre os regimes ({reais(base.diferencaMensalMedia)} por mês, em média): na ativa, você
			consome o mesmo que na integralidade.
		{:else if consumoAMenos > 1}
			Investindo {reais(params.aporteMensalInvestimento ?? 0)} por mês, você consome {reais(consumoAMenos)} a menos por mês que
			na integralidade durante a ativa: a comparação deixa de ser de mesmo consumo.
		{:else if consumoAMenos < -1}
			Investindo {reais(params.aporteMensalInvestimento ?? 0)} por mês, sobram {reais(-consumoAMenos)} por mês a mais que na
			integralidade para gastar durante a ativa.
		{:else}
			O valor informado é praticamente igual à diferença de líquido entre os regimes.
		{/if}
	</p>
</div>

<dl class="numeros">
	<div>
		<dt>{base.aporteInformado ? 'Investimento por mês na ativa' : 'Diferença média por mês na ativa'}</dt>
		<dd>{reais(base.aporteMensalMedio)}</dd>
	</div>
	<div>
		<dt>Total aportado até {marcos.anoAposentadoria}, sem rendimento</dt>
		<dd>{reais(base.totalAportado)}</dd>
	</div>
	<div>
		<dt>Saldo investido ao se aposentar ({pct(params.rentabilidades.base)} real)</dt>
		<dd>{reais(base.saldoNaAposentadoria)}</dd>
	</div>
</dl>

<div class="rolagem">
	<table>
		<thead>
			<tr>
				<th scope="col">Cenário</th>
				<th scope="col">Saldo investido</th>
				<th scope="col">Saque mensal</th>
				<th scope="col">Complementar + saque</th>
				<th scope="col">Integralidade</th>
				<th scope="col">Diferença</th>
				<th scope="col">Aporte p/ empatar</th>
			</tr>
		</thead>
		<tbody>
			{#each CENARIOS as cenario (cenario)}
				{@const r = comparativo.complementar[cenario].investimento}
				<tr class:base={cenario === 'base'}>
					<th scope="row">{rotulosCenario[cenario]} ({pct(params.rentabilidades[cenario])})</th>
					<td>{reais(r.saldoNaAposentadoria)}</td>
					<td>{reais(r.saqueMensal)}</td>
					<td>{reais(r.mediaComplementarInvestindo)}</td>
					<td>{reais(r.mediaIntegralidade)}</td>
					<td class:neg={r.vantagemMensal < 0} class:pos={r.vantagemMensal > 0}>{reais(r.vantagemMensal)}</td>
					<td>{r.aporteMensalParaEmpatar > 0 ? reais(r.aporteMensalParaEmpatar) : 'já empata'}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<figure>
	<div class="barras" role="img" aria-label="Renda média mensal na aposentadoria por cenário, comparada à integralidade">
		{#each CENARIOS as cenario (cenario)}
			{@const r = comparativo.complementar[cenario].investimento}
			<div class="linha">
				<span class="rotulo">{rotulosCenario[cenario]}</span>
				<div class="trilho">
					<span class="seg previdencia" style:width={largura(r.mediaComplementar)}></span>
					<span class="seg saque" style:width={largura(r.saqueMensal)}></span>
					<span class="referencia" style:left={largura(r.mediaIntegralidade)}></span>
				</div>
			</div>
		{/each}
	</div>
	<figcaption>
		<span class="legenda"><span class="amostra previdencia"></span>RPPS + Funpresp</span>
		<span class="legenda"><span class="amostra saque"></span>Saques do investimento</span>
		<span class="legenda"><span class="amostra referencia-amostra"></span>Integralidade</span>
		<span>Médias mensais líquidas na aposentadoria, com 13º.</span>
	</figcaption>
</figure>

<p class="ressalva">
	Diferença da ativa somada da posse em diante (anos passados são estimativas). A rentabilidade é tratada como líquida de
	impostos e taxas; investimentos reais pagam IR sobre o ganho. Coluna "Aporte p/ empatar": quanto seria preciso investir
	todo mês na ativa para a média do complementar igualar a da integralidade.
</p>

<style>
	.intro {
		margin: 0 0 1.25rem;
		max-width: 52em;
	}
	.ajuste {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 0.5rem 1rem;
		margin: 0 0 1.25rem;
		padding: 0.9rem 1rem;
		border: 1px solid var(--linha);
		border-radius: 6px;
		background: var(--superficie);
	}
	.ajuste label {
		display: grid;
		gap: 0.3rem;
		font-size: 0.8125rem;
		font-weight: 600;
	}
	.campo {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-weight: 400;
		color: var(--suave);
	}
	.ajuste input {
		width: 12rem;
		font: inherit;
		font-size: 0.9375rem;
		color: var(--tinta);
		background: var(--campo);
		border: 1px solid var(--linha);
		border-radius: 4px;
		padding: 0.4rem 0.5rem;
		font-variant-numeric: tabular-nums;
	}
	.ajuste button {
		font: inherit;
		font-size: 0.8125rem;
		background: none;
		border: 1px solid var(--linha);
		border-radius: 4px;
		padding: 0.4rem 0.75rem;
		color: var(--aco);
		cursor: pointer;
	}
	:is(.ajuste input, .ajuste button):focus-visible {
		outline: 2px solid var(--aco);
		outline-offset: 2px;
	}
	.nota-ajuste {
		flex-basis: 100%;
		margin: 0;
		font-size: 0.8125rem;
		color: var(--suave);
	}
	.nota-ajuste.alerta {
		color: var(--latao);
	}
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
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--suave);
	}
	tr.base {
		background: var(--linha-fundo);
	}
	.neg {
		color: var(--negativo);
	}
	.pos {
		color: var(--aco);
	}
	figure {
		margin: 1.5rem 0 0;
	}
	.barras {
		display: grid;
		gap: 0.5rem;
	}
	.linha {
		display: grid;
		grid-template-columns: 6rem 1fr;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.8125rem;
	}
	.trilho {
		position: relative;
		display: flex;
		height: 1.25rem;
		background: var(--papel);
		border-radius: 3px;
	}
	.seg {
		height: 100%;
	}
	.previdencia {
		background: var(--aco);
	}
	.saque {
		background: var(--aco);
		opacity: 0.45;
	}
	.referencia {
		position: absolute;
		top: -0.25rem;
		bottom: -0.25rem;
		width: 3px;
		margin-left: -1.5px;
		background: var(--integral);
	}
	figcaption {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.25rem;
		margin-top: 0.75rem;
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
		width: 0.9rem;
		height: 0.9rem;
		border-radius: 2px;
	}
	.amostra.previdencia {
		background: var(--aco);
	}
	.amostra.saque {
		background: var(--aco);
		opacity: 0.45;
	}
	.referencia-amostra {
		width: 3px;
		background: var(--integral);
	}
	.ressalva {
		margin: 1rem 0 0;
		font-size: 0.8125rem;
		color: var(--suave);
		max-width: 60em;
	}
</style>
