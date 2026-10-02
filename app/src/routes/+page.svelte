<script lang="ts">
	import { compararRegimes } from '$lib/calc/comparativo';
	import { calcularFolha } from '$lib/calc/folha';
	import { indiceMes, padraoEm } from '$lib/calc/progressao';
	import { calcularMarcos, projetar } from '$lib/calc/projecao';
	import { PADRAO_MAXIMO } from '$lib/data/tabela-2026';
	import Aposentadoria from '$lib/ui/Aposentadoria.svelte';
	import AvisoSimulacao from '$lib/ui/AvisoSimulacao.svelte';
	import ComoCalculamos from '$lib/ui/ComoCalculamos.svelte';
	import Contracheque from '$lib/ui/Contracheque.svelte';
	import Escada from '$lib/ui/Escada.svelte';
	import { NOMES_MESES, reais } from '$lib/ui/formato';
	import Parametros from '$lib/ui/Parametros.svelte';
	import TabelaAnual from '$lib/ui/TabelaAnual.svelte';
	import Veredito from '$lib/ui/Veredito.svelte';
	import { carregarParametros, salvarParametros } from '$lib/ui/persistencia';
	import { iniciarTutorial, tutorialVisto } from '$lib/ui/tutorial';
	import { ANO_COPYRIGHT, LICENCA, TITULAR, URL_CODIGO_FONTE, URL_LICENCA } from '$lib/sobre';

	const hoje = new Date();
	const anoAtual = hoje.getFullYear();
	const mesAtual = hoje.getMonth() + 1;

	let params = $state(carregarParametros());
	$effect(() => salvarParametros($state.snapshot(params)));

	const linhas = $derived(projetar(params));
	const linhasFuturas = $derived(linhas.filter((l) => l.ano >= anoAtual));
	const marcos = $derived(calcularMarcos(params));
	const folhaAtual = $derived(calcularFolha(padraoEm(params, anoAtual, mesAtual), params, { ano: anoAtual }));
	const folhaMaxima = $derived(calcularFolha(PADRAO_MAXIMO, params, { ano: marcos.anoPadraoMaximo }));
	const ganhoAteMaximo = $derived(folhaMaxima.liquido - folhaAtual.liquido);
	const comparativo = $derived(compararRegimes(params, indiceMes(anoAtual, mesAtual)));
	const inativas = $derived(
		params.regime === 'complementar' ? comparativo.complementar.base.inatividade.linhas : comparativo.integralidade.linhas
	);
	const temAposentadoria = $derived(comparativo.integralidade.linhas.length > 0);

	// A seção aberta fica no endereço (#vida-ativa…): o "voltar" do navegador e links diretos funcionam.
	const SECOES = [
		{ id: 'resumo', rotulo: 'Resumo' },
		{ id: 'vida-ativa', rotulo: 'Vida ativa' },
		{ id: 'aposentadoria', rotulo: 'Aposentadoria' },
		{ id: 'como-calculamos', rotulo: 'Como calculamos' }
	] as const;
	type Secao = (typeof SECOES)[number]['id'];
	const secaoDoEndereco = (): Secao => SECOES.find((s) => `#${s.id}` === location.hash)?.id ?? 'resumo';

	let secao = $state<Secao>(secaoDoEndereco());
	$effect(() => {
		const sincronizar = (): void => {
			secao = secaoDoEndereco();
			window.scrollTo({ top: 0 });
		};
		addEventListener('hashchange', sincronizar);
		return () => removeEventListener('hashchange', sincronizar);
	});

	function abrir(id: Secao): void {
		if (id === secao) return;
		location.hash = id;
		document.getElementById(`aba-${id}`)?.focus();
	}

	const abrirTutorial = (): void => iniciarTutorial();
	// Na primeira visita, o tour começa logo depois do aceite do aviso de simulação.
	const aoLiberar = (): void => {
		if (!tutorialVisto()) abrirTutorial();
	};

	// Setas esquerda/direita percorrem as abas (padrão de acessibilidade de tablist).
	function navegarComTeclado(evento: KeyboardEvent): void {
		const passo = { ArrowRight: 1, ArrowLeft: -1 }[evento.key];
		if (!passo) return;
		evento.preventDefault();
		const atual = SECOES.findIndex((s) => s.id === secao);
		abrir(SECOES[(atual + passo + SECOES.length) % SECOES.length].id);
	}
</script>

<AvisoSimulacao onliberado={aoLiberar} />

<div class="pagina">
	<aside>
		<h1>FinPol</h1>
		<p class="sub">Projeção da remuneração na carreira de Policial Legislativo do Senado.</p>
		<button type="button" class="ver-tutorial" onclick={abrirTutorial}>Ver tutorial</button>
		<Parametros bind:params />
		<footer class="rodape">
			<p>FinPol © {ANO_COPYRIGHT} {TITULAR}.</p>
			<p>
				Software livre sob a licença <a href={URL_LICENCA} rel="noopener noreferrer" target="_blank">{LICENCA}</a>, sem nenhuma
				garantia. <a href={URL_CODIGO_FONTE} rel="noopener noreferrer" target="_blank">Código-fonte</a>.
			</p>
		</footer>
	</aside>

	<main>
		<!-- svelte-ignore a11y_interactive_supports_focus -->
		<div class="menu" data-tour="menu" role="tablist" aria-label="Seções" tabindex="-1" onkeydown={navegarComTeclado}>
			{#each SECOES as s (s.id)}
				<button
					type="button"
					role="tab"
					id="aba-{s.id}"
					aria-selected={secao === s.id}
					aria-controls="painel-{s.id}"
					tabindex={secao === s.id ? 0 : -1}
					onclick={() => abrir(s.id)}>{s.rotulo}</button
				>
			{/each}
		</div>

		{#if secao === 'resumo'}
		<div class="painel" role="tabpanel" id="painel-resumo" aria-labelledby="aba-resumo">
		{#if temAposentadoria}
			<Veredito {comparativo} {params} />
		{/if}

		<p class="resumo">
			Hoje você está no padrão <strong>{folhaAtual.padrao}</strong> e recebe
			<strong>{reais(folhaAtual.liquido)}</strong> líquidos por mês.
			{#if folhaAtual.padrao < PADRAO_MAXIMO}
				Chega ao padrão {PADRAO_MAXIMO} em <strong>{marcos.anoPadraoMaximo}</strong>, com {reais(ganhoAteMaximo)} a mais por mês,
			{:else}
				Você já está no padrão máximo
			{/if}
			e {marcos.aposentadoriaInformada ? 'planeja se aposentar' : 'pode se aposentar'} em
			<strong>{NOMES_MESES[marcos.mesAposentadoria - 1]} de {marcos.anoAposentadoria}</strong>.
		</p>
		</div>
		{:else if secao === 'vida-ativa'}
		<div class="painel" role="tabpanel" id="painel-vida-ativa" aria-labelledby="aba-vida-ativa">
			<section aria-labelledby="t-escada">
				<h3 id="t-escada">Líquido mensal ao longo da carreira</h3>
				{#if linhasFuturas.length > 0}
					<Escada linhas={linhasFuturas} {marcos} />
				{:else}
					<p class="vazio">Não há anos a projetar: a aposentadoria calculada já passou. Revise o ano de nascimento e os requisitos.</p>
				{/if}
			</section>

			<section aria-labelledby="t-folha">
				<h3 id="t-folha">Contracheque projetado deste mês</h3>
				<Contracheque folha={folhaAtual} {params} />
			</section>

			<section aria-labelledby="t-tabela-ativa">
				<h3 id="t-tabela-ativa">Ano a ano na ativa</h3>
				<TabelaAnual {linhas} inativas={[]} {marcos} {params} {anoAtual} />
			</section>
		</div>
		{:else if secao === 'aposentadoria'}
		<div class="painel" role="tabpanel" id="painel-aposentadoria" aria-labelledby="aba-aposentadoria">
			{#if temAposentadoria}
				<Aposentadoria {comparativo} {params} {marcos} />
				<section aria-labelledby="t-tabela-inativa">
					<h3 id="t-tabela-inativa">Ano a ano na aposentadoria</h3>
					<TabelaAnual linhas={[]} {inativas} {marcos} {params} {anoAtual} />
				</section>
			{:else}
				<p class="vazio">A aposentadoria calculada já passou ou não há anos até a idade-horizonte. Revise os parâmetros.</p>
			{/if}
		</div>
		{:else}
			<div class="painel" role="tabpanel" id="painel-como-calculamos" aria-labelledby="aba-como-calculamos">
				<ComoCalculamos />
			</div>
		{/if}
	</main>
</div>

<style>
	:global(:root) {
		--papel: #f3f5f4;
		--superficie: #ffffff;
		--campo: #ffffff;
		--tinta: #1b2430;
		--suave: #5f6874;
		--linha: #d9dee3;
		--aco: #2e4a6b;
		--latao: #8a6a1f;
		--latao-fundo: #f6efdc;
		--linha-fundo: #e8ecef;
		--negativo: #8b3a3a;
		--integral: #4a7a5c;
		color-scheme: light;
	}
	@media (prefers-color-scheme: dark) {
		:global(:root) {
			--papel: #141a21;
			--superficie: #1b222b;
			--campo: #222b35;
			--tinta: #e6eaee;
			--suave: #9aa4b0;
			--linha: #2f3a46;
			--aco: #8fb3dc;
			--latao: #d6b25e;
			--latao-fundo: #2a2518;
			--linha-fundo: #222b35;
			--negativo: #e09a9a;
			--integral: #8cc5a0;
			color-scheme: dark;
		}
	}
	:global(body) {
		margin: 0;
		background: var(--papel);
		color: var(--tinta);
		font-family: 'Public Sans', system-ui, sans-serif;
		line-height: 1.5;
	}
	.pagina {
		display: grid;
		grid-template-columns: 18rem minmax(0, 1fr);
		min-height: 100vh;
	}
	aside {
		background: var(--superficie);
		border-right: 1px solid var(--linha);
		padding: 2rem 1.5rem;
		position: sticky;
		top: 0;
		height: 100vh;
		overflow-y: auto;
		box-sizing: border-box;
	}
	h1 {
		font-size: 1.5rem;
		margin: 0;
		color: var(--aco);
		letter-spacing: -0.01em;
	}
	.sub {
		font-size: 0.8125rem;
		color: var(--suave);
		margin: 0.25rem 0 1.75rem;
	}
	main {
		padding: 2.5rem 3rem 4rem;
		max-width: 60rem;
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 3rem;
	}
	.resumo {
		font-size: clamp(1.25rem, 2.4vw, 1.75rem);
		line-height: 1.35;
		max-width: 36em;
		margin: 0;
		font-variant-numeric: tabular-nums;
	}
	.resumo strong {
		color: var(--aco);
	}
	.ver-tutorial {
		font: inherit;
		font-size: 0.8125rem;
		margin: -1rem 0 1.5rem;
		padding: 0.3rem 0.7rem;
		color: var(--aco);
		background: none;
		border: 1px solid var(--linha);
		border-radius: 4px;
		cursor: pointer;
	}
	.ver-tutorial:focus-visible {
		outline: 2px solid var(--aco);
		outline-offset: 2px;
	}
	.rodape {
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid var(--linha);
		font-size: 0.75rem;
		line-height: 1.5;
		color: var(--suave);
	}
	.rodape p {
		margin: 0 0 0.35rem;
	}
	.rodape a {
		color: var(--aco);
	}
	.rodape a:focus-visible {
		outline: 2px solid var(--aco);
		outline-offset: 2px;
	}
	.menu {
		position: sticky;
		top: 0;
		z-index: 2;
		display: flex;
		gap: 0.25rem;
		margin: -2.5rem -3rem 0;
		padding: 0.75rem 3rem 0;
		background: var(--papel);
		border-bottom: 1px solid var(--linha);
		/* Rola na horizontal em telas estreitas, sem criar barra vertical. */
		overflow-x: auto;
		overflow-y: hidden;
	}
	.menu button {
		font: inherit;
		font-size: 0.9375rem;
		background: none;
		border: 0;
		border-bottom: 3px solid transparent;
		margin-bottom: -1px;
		padding: 0.6rem 0.9rem;
		color: var(--suave);
		cursor: pointer;
		white-space: nowrap;
	}
	.menu button:hover {
		color: var(--tinta);
	}
	.menu button[aria-selected='true'] {
		color: var(--tinta);
		font-weight: 700;
		border-bottom-color: var(--aco);
	}
	.menu button:focus-visible {
		outline: 2px solid var(--aco);
		outline-offset: -2px;
	}
	.painel {
		display: grid;
		gap: 2.5rem;
		grid-template-columns: minmax(0, 1fr);
	}
	h3 {
		font-size: 1rem;
		margin: 0 0 1rem;
	}
	.vazio {
		color: var(--suave);
	}
	@media (max-width: 760px) {
		.pagina {
			grid-template-columns: minmax(0, 1fr);
		}
		aside {
			position: static;
			height: auto;
			border-right: 0;
			border-bottom: 1px solid var(--linha);
			padding: 1.5rem 1rem;
		}
		main {
			padding: 1.5rem 1rem 3rem;
			gap: 2rem;
		}
		.rodape {
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid var(--linha);
		font-size: 0.75rem;
		line-height: 1.5;
		color: var(--suave);
	}
	.rodape p {
		margin: 0 0 0.35rem;
	}
	.rodape a {
		color: var(--aco);
	}
	.rodape a:focus-visible {
		outline: 2px solid var(--aco);
		outline-offset: 2px;
	}
	.menu {
			margin: -1.5rem -1rem 0;
			padding: 0.25rem 1rem 0;
		}
	}
</style>
