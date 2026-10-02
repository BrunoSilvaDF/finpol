<script lang="ts">
	import { mesIndiceAposentadoriaRegra } from '$lib/calc/aposentadoria';
	import { PARAMETROS_PADRAO } from '$lib/calc/padrao';
	import { indiceMes } from '$lib/calc/progressao';
	import type { Parametros } from '$lib/calc/tipos';
	import { CENARIOS } from '$lib/calc/comparativo';
	import { percentualBeneficioRpps } from '$lib/calc/rpps';
	import { ALIQUOTAS_FUNPRESP, PADRAO_MAXIMO, PADRAO_MINIMO } from '$lib/data/tabela-2026';
	import { NOMES_MESES } from './formato';

	let { params = $bindable() }: { params: Parametros } = $props();

	const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

	// O formulário trabalha em pontos percentuais; o cálculo, em fração.
	let especializacaoPct = $derived(Math.round(params.especializacao * 100));
	const regra = $derived(mesIndiceAposentadoriaRegra(params));
	const idadeRegra = $derived(Math.floor(regra / 12) - params.anoNascimento - (regra % 12 < params.mesNascimento - 1 ? 1 : 0));
	const dataRegra = $derived(`${NOMES_MESES[regra % 12]} de ${Math.floor(regra / 12)}, aos ${idadeRegra} anos`);
	const antesDaRegra = $derived(
		Boolean(params.idadeAposentadoriaInformada) &&
			indiceMes(params.anoNascimento + params.idadeAposentadoriaInformada!, params.mesNascimento) < regra
	);

	const definirEspecializacao = (pct: number): void => {
		params.especializacao = pct / 100;
	};

	const emPercentual = (fracao: number): number => Math.round(fracao * 1000) / 10;
	// Campo vazio volta ao valor calculado (null); preenchido, guarda a fração.
	const fracaoOuNulo = (texto: string): number | null => (texto === '' ? null : +texto / 100);
	const numeroOuNulo = (texto: string): number | null => (texto === '' ? null : +texto);
	const percentualRppsRegra = $derived(emPercentual(percentualBeneficioRpps({ ...params, percentualRppsInformado: null })));
	const rotulosCenario = { pessimista: 'Pessimista', base: 'Base', otimista: 'Otimista' };
</script>

<form onsubmit={(e) => e.preventDefault()}>
	<fieldset data-tour="carreira">
		<legend>Carreira</legend>
		<label>Data de posse <input type="date" bind:value={params.dataPosse} required /></label>
		<label>
			Padrão na posse
			<input type="number" min={PADRAO_MINIMO} max={PADRAO_MAXIMO} bind:value={params.padraoInicial} />
		</label>
		<label>
			Mês da progressão
			<select bind:value={params.mesProgressao}>
				{#each meses as m, i (m)}<option value={i + 1}>{m}</option>{/each}
			</select>
		</label>
		<label>
			Adicional de especialização: {especializacaoPct}%
			<input type="range" min="0" max="30" step="1" value={especializacaoPct} oninput={(e) => definirEspecializacao(+e.currentTarget.value)} />
		</label>
	</fieldset>

	<fieldset data-tour="descontos">
		<legend>Descontos</legend>
		<label>Plano de saúde, sindicato e associações <input type="number" step="0.01" min="0" bind:value={params.outrosDescontos} /></label>
		<label>
			Reajuste real anual desses descontos (%)
			<input
				type="number"
				step="0.5"
				value={emPercentual(params.reajusteRealOutrosDescontos)}
				oninput={(e) => (params.reajusteRealOutrosDescontos = +e.currentTarget.value / 100)}
			/>
		</label>
		<p class="dica">A partir de 2027, acima da inflação. Planos de saúde costumam subir mais que o IPCA.</p>
		<label>Dependentes no IR <input type="number" min="0" bind:value={params.dependentesIr} /></label>
	</fieldset>

	<fieldset data-tour="aposentadoria">
		<legend>Aposentadoria</legend>
		<div class="lado-a-lado">
			<label>
				Mês de nascimento
				<select bind:value={params.mesNascimento}>
					{#each meses as m, i (m)}<option value={i + 1}>{m}</option>{/each}
				</select>
			</label>
			<label>Ano de nascimento <input type="number" min="1940" max="2010" bind:value={params.anoNascimento} /></label>
		</div>
		<p class="grupo">Anos de contribuição antes da posse</p>
		<div class="lado-a-lado">
			<label>Em atividade policial <input type="number" min="0" step="0.5" bind:value={params.contribuicaoAnteriorPolicial} /></label>
			<label>Fora da atividade policial <input type="number" min="0" step="0.5" bind:value={params.contribuicaoAnteriorOutra} /></label>
		</div>
		<label>
			Idade da aposentadoria
			<input
				type="number"
				min="40"
				max="80"
				placeholder="pela regra ({idadeRegra} anos)"
				value={params.idadeAposentadoriaInformada ?? ''}
				oninput={(e) => (params.idadeAposentadoriaInformada = e.currentTarget.value === '' ? null : +e.currentTarget.value)}
			/>
		</label>
		<p class="dica" class:alerta={antesDaRegra}>
			{#if antesDaRegra}
				Antes dos requisitos da regra policial, que só se completam em {dataRegra}.
			{:else if params.idadeAposentadoriaInformada}
				Aposentadoria no mês do aniversário. Pela regra policial seria {dataRegra}.
			{:else}
				Calculada pela regra policial: {dataRegra}. Preencha a idade para simular outra.
			{/if}
		</p>
		<details>
			<summary>Requisitos da aposentadoria policial</summary>
			<label>Idade mínima <input type="number" min="0" bind:value={params.idadeMinimaAposentadoria} /></label>
			<label>Anos de contribuição <input type="number" min="0" bind:value={params.contribuicaoMinima} /></label>
			<label>Anos em cargo policial <input type="number" min="0" bind:value={params.exercicioPolicialMinimo} /></label>
		</details>
	</fieldset>

	<fieldset data-tour="previdencia">
		<legend>Previdência</legend>
		<label>
			Regime
			<select bind:value={params.regime}>
				<option value="complementar">Complementar (teto + Funpresp)</option>
				<option value="integralidade">Integralidade (regime anterior)</option>
			</select>
		</label>
		<div class="lado-a-lado">
			<label>
				Alíquota Funpresp
				<select bind:value={params.aliquotaFunpresp}>
					{#each ALIQUOTAS_FUNPRESP as aliquota (aliquota)}<option value={aliquota}>{emPercentual(aliquota).toLocaleString('pt-BR')}%</option>{/each}
				</select>
			</label>
			<label>
				IR na Funpresp
				<select bind:value={params.tributacaoFunpresp}>
					<option value="progressiva">progressiva</option>
					<option value="regressiva">regressiva</option>
				</select>
			</label>
		</div>
		<label>
			Saldo atual na Funpresp (extrato)
			<input
				type="number"
				min="0"
				step="0.01"
				placeholder="simular desde a posse"
				value={params.saldoFunpresp ?? ''}
				oninput={(e) => (params.saldoFunpresp = numeroOuNulo(e.currentTarget.value))}
			/>
		</label>
		<details>
			<summary>Premissas da projeção</summary>
			<p class="grupo">Rentabilidade real da Funpresp (% ao ano, acima da inflação)</p>
			<div class="tres">
				{#each CENARIOS as cenario (cenario)}
					<label>
						{rotulosCenario[cenario]}
						<input
							type="number"
							step="0.5"
							value={emPercentual(params.rentabilidades[cenario])}
							oninput={(e) => (params.rentabilidades[cenario] = +e.currentTarget.value / 100)}
						/>
					</label>
				{/each}
			</div>
			<div class="lado-a-lado">
				<label>
					Taxa atuarial (%)
					<input type="number" step="0.1" value={emPercentual(params.taxaAtuarial)} oninput={(e) => (params.taxaAtuarial = +e.currentTarget.value / 100)} />
				</label>
				<label>Sobrevida (anos) <input type="number" min="1" bind:value={params.expectativaSobrevida} /></label>
			</div>
			<div class="lado-a-lado">
				<label>
					Benefício RPPS (% da média)
					<input
						type="number"
						step="1"
						placeholder="{percentualRppsRegra} (regra)"
						value={params.percentualRppsInformado === null ? '' : emPercentual(params.percentualRppsInformado)}
						oninput={(e) => (params.percentualRppsInformado = fracaoOuNulo(e.currentTarget.value))}
					/>
				</label>
				<label>
					Média de contribuição
					<input
						type="number"
						step="0.01"
						placeholder="média do teto"
						value={params.mediaRppsInformada ?? ''}
						oninput={(e) => (params.mediaRppsInformada = numeroOuNulo(e.currentTarget.value))}
					/>
				</label>
			</div>
			<p class="grupo">Reajuste real a partir de 2027 (% ao ano acima da inflação)</p>
			<div class="lado-a-lado">
				<label>
					Teto do INSS
					<input type="number" step="0.1" value={emPercentual(params.reajusteRealTeto)} oninput={(e) => (params.reajusteRealTeto = +e.currentTarget.value / 100)} />
				</label>
				<label>
					Salários do Senado
					<input
						type="number"
						step="0.1"
						value={emPercentual(params.reajusteRealSalarios)}
						oninput={(e) => (params.reajusteRealSalarios = +e.currentTarget.value / 100)}
					/>
				</label>
			</div>
			<p class="dica">
				O teto é reajustado todo janeiro pelo INPC, que costuma ficar perto do IPCA (2023–2026: −0,3% real ao ano). Valores
				negativos simulam perdas para a inflação.
			</p>
			<label>Projetar até a idade de <input type="number" min="60" max="110" bind:value={params.idadeHorizonte} /></label>
		</details>
	</fieldset>

	<button type="button" onclick={() => (params = structuredClone(PARAMETROS_PADRAO))}>Restaurar valores iniciais</button>
</form>

<style>
	form {
		display: grid;
		gap: 1.25rem;
	}
	fieldset {
		border: 0;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 0.75rem;
	}
	legend {
		font-weight: 700;
		font-size: 0.9375rem;
		padding: 0 0 0.5rem;
		color: var(--tinta);
	}
	label {
		display: grid;
		gap: 0.25rem;
		font-size: 0.8125rem;
		color: var(--suave);
	}
	input,
	select {
		font: inherit;
		font-size: 0.9375rem;
		color: var(--tinta);
		background: var(--campo);
		border: 1px solid var(--linha);
		border-radius: 4px;
		padding: 0.4rem 0.5rem;
		font-variant-numeric: tabular-nums;
		box-sizing: border-box;
		width: 100%;
		min-width: 0;
	}
	input[type='range'] {
		padding: 0;
		border: 0;
		background: none;
		width: 100%;
		accent-color: var(--aco);
	}
	.grupo,
	.dica {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--suave);
	}
	.grupo {
		margin-bottom: -0.25rem;
		color: var(--tinta);
	}
	.dica.alerta {
		color: var(--negativo);
	}
	select:disabled {
		opacity: 0.5;
	}
	.tres {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
	}
	.lado-a-lado {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		/* Rótulos que quebram em duas linhas não desalinham os campos. */
		align-items: end;
	}
	details {
		display: grid;
		gap: 0.75rem;
	}
	details[open] summary {
		margin-bottom: 0.75rem;
	}
	details[open] > :not(summary) + * {
		margin-top: 0.75rem;
	}
	details > label + label {
		margin-top: 0.75rem;
	}
	summary {
		font-size: 0.8125rem;
		color: var(--aco);
		cursor: pointer;
	}
	button {
		font: inherit;
		font-size: 0.8125rem;
		justify-self: start;
		background: none;
		border: 1px solid var(--linha);
		border-radius: 4px;
		padding: 0.4rem 0.75rem;
		color: var(--suave);
		cursor: pointer;
	}
	:is(input, select, button, summary):focus-visible {
		outline: 2px solid var(--aco);
		outline-offset: 2px;
	}
</style>
