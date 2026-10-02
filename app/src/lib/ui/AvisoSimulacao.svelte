<script lang="ts">
	// Aceite guardado no navegador. Mudou o texto do aviso? Incremente a versão para pedir de novo.
	const CHAVE = 'finpol:aviso-aceito';
	const VERSAO = '2';

	let dialogo: HTMLDialogElement;
	let concordo = $state(false);
	let aceito = false;

	function jaAceitou(): boolean {
		try {
			return localStorage.getItem(CHAVE) === VERSAO;
		} catch {
			return false;
		}
	}

	$effect(() => {
		aceito = jaAceitou();
		if (!aceito) dialogo.showModal();
	});

	function aceitar(): void {
		aceito = true;
		try {
			localStorage.setItem(CHAVE, VERSAO);
		} catch {
			// Sem armazenamento: o aviso volta a aparecer na próxima visita.
		}
		dialogo.close();
	}

	// Esc não dispensa o aviso; se o navegador fechar mesmo assim, ele reabre até o aceite.
	const impedirCancelamento = (evento: Event): void => evento.preventDefault();
	const reabrirSemAceite = (): void => {
		if (!aceito) dialogo.showModal();
	};
</script>

<dialog
	bind:this={dialogo}
	aria-labelledby="aviso-titulo"
	aria-describedby="aviso-texto"
	oncancel={impedirCancelamento}
	onclose={reabrirSemAceite}
>
	<h2 id="aviso-titulo">Antes de começar</h2>
	<div id="aviso-texto">
		<p>
			O FinPol é uma ferramenta de <strong>simulação</strong>. Ele projeta salário, contribuições e aposentadoria a partir de
			regras públicas e das premissas que você escolhe.
		</p>
		<ul>
			<li>
				Os resultados são <strong>estimativas</strong>: regras mudam, tabelas são reajustadas e a sua situação pode ter
				particularidades que o app não considera.
			</li>
			<li>Não é aconselhamento financeiro, jurídico ou previdenciário.</li>
			<li>
				Antes de decidir sobre previdência, aposentadoria ou investimentos, confirme com a gestão de pessoas do seu órgão,
				com a Funpresp e com um profissional de sua confiança.
			</li>
		</ul>
		<p class="lgpd">
			<strong>Privacidade (LGPD, Lei 13.709/2018):</strong> os dados que você informa não são coletados nem tratados por
			nenhum servidor. Todo o cálculo acontece no seu navegador, e as informações ficam guardadas apenas nele; para apagá-las,
			limpe os dados deste site no navegador.
		</p>
	</div>
	<label class="aceite">
		<input type="checkbox" bind:checked={concordo} />
		<span>Entendi que os valores são simulações e que não devo usá-los como única base para minhas decisões.</span>
	</label>
	<button type="button" disabled={!concordo} onclick={aceitar}>Entendi, começar</button>
</dialog>

<style>
	dialog {
		width: min(34rem, calc(100vw - 2rem));
		padding: 1.75rem 1.75rem 1.5rem;
		border: 1px solid var(--linha);
		border-top: 4px solid var(--latao);
		border-radius: 8px;
		background: var(--superficie);
		color: var(--tinta);
		box-shadow: 0 20px 60px rgb(0 0 0 / 0.35);
	}
	dialog::backdrop {
		background: rgb(10 14 20 / 0.6);
		backdrop-filter: blur(3px);
	}
	h2 {
		margin: 0 0 0.75rem;
		font-size: 1.375rem;
		letter-spacing: -0.01em;
	}
	p,
	li {
		font-size: 0.9375rem;
		line-height: 1.55;
	}
	p {
		margin: 0 0 0.75rem;
	}
	.lgpd {
		margin: 0 0 1.25rem;
		padding: 0.6rem 0.75rem;
		font-size: 0.8125rem;
		border-left: 3px solid var(--aco);
		background: var(--papel);
	}
	ul {
		margin: 0 0 1rem;
		padding-left: 1.25rem;
		color: var(--suave);
	}
	li + li {
		margin-top: 0.4rem;
	}
	.aceite {
		display: flex;
		gap: 0.6rem;
		align-items: flex-start;
		padding: 0.75rem;
		border-radius: 6px;
		background: var(--latao-fundo);
		font-size: 0.875rem;
		line-height: 1.45;
		cursor: pointer;
	}
	.aceite input {
		width: 1.1rem;
		height: 1.1rem;
		margin: 0.1rem 0 0;
		flex: none;
		accent-color: var(--aco);
	}
	button {
		display: block;
		width: 100%;
		margin-top: 1rem;
		padding: 0.7rem 1rem;
		font: inherit;
		font-weight: 700;
		color: var(--superficie);
		background: var(--aco);
		border: 0;
		border-radius: 6px;
		cursor: pointer;
	}
	button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	:is(button, .aceite input):focus-visible {
		outline: 2px solid var(--aco);
		outline-offset: 2px;
	}
</style>
