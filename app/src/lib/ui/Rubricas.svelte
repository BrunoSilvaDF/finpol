<script lang="ts" module>
	export interface Rubrica {
		rotulo: string;
		valor: number;
		/** desconto: valor em vermelho com sinal de menos; total: em negrito; liquido: destaque final */
		tipo?: 'desconto' | 'total' | 'total desconto' | 'liquido';
		explicacao?: string;
	}
</script>

<script lang="ts">
	import { reaisCentavos } from './formato';

	let { rubricas }: { rubricas: Rubrica[] } = $props();

	const uid = $props.id();
	const MARGEM = 8;

	// Popover nativo fica na camada superior (não é cortado pelas tabelas com rolagem);
	// aqui só o posicionamos logo abaixo do botão (?) que o abriu, sem sair da tela.
	function posicionar(evento: Event): void {
		const popover = evento.currentTarget as HTMLElement;
		if ((evento as ToggleEvent).newState !== 'open') return;
		const botao = document.querySelector<HTMLElement>(`[popovertarget="${popover.id}"]`);
		if (!botao) return;
		const alvo = botao.getBoundingClientRect();
		const largura = popover.offsetWidth;
		const altura = popover.offsetHeight;
		const esquerda = Math.min(Math.max(MARGEM, alvo.left - 12), innerWidth - largura - MARGEM);
		const cabeAbaixo = alvo.bottom + MARGEM + altura <= innerHeight;
		popover.style.left = `${esquerda}px`;
		popover.style.top = `${cabeAbaixo ? alvo.bottom + 6 : alvo.top - altura - 6}px`;
		// Posição fixa: ao rolar a página o balão se descolaria do (?), então fecha.
		const fechar = (): void => {
			if (popover.matches(':popover-open')) popover.hidePopover();
		};
		addEventListener('scroll', fechar, { once: true, passive: true, capture: true });
	}
</script>

<dl>
	{#each rubricas as r, i (r.rotulo)}
		<dt class={r.tipo}>
			{r.rotulo}
			{#if r.explicacao}
				<button type="button" class="ajuda" popovertarget="{uid}-{i}" aria-label="O que é {r.rotulo}?">?</button>
				<div popover id="{uid}-{i}" class="popover" ontoggle={posicionar}>
					<strong>{r.rotulo}</strong>
					<p>{r.explicacao}</p>
				</div>
			{/if}
		</dt>
		<dd class={r.tipo}>{reaisCentavos(r.valor)}</dd>
	{/each}
</dl>

<style>
	dl {
		display: grid;
		grid-template-columns: 1fr auto;
		max-width: 36rem;
		margin: 0;
		font-size: 0.875rem;
		font-variant-numeric: tabular-nums;
	}
	dt,
	dd {
		margin: 0;
		padding: 0.3rem 0;
		border-bottom: 1px solid var(--linha);
	}
	dd {
		text-align: right;
		padding-left: 1rem;
		white-space: nowrap;
	}
	.ajuda {
		display: inline-grid;
		place-items: center;
		width: 1.1rem;
		height: 1.1rem;
		margin-left: 0.3rem;
		padding: 0;
		vertical-align: 0.05rem;
		font: inherit;
		font-size: 0.6875rem;
		font-weight: 700;
		line-height: 1;
		color: var(--aco);
		background: none;
		border: 1px solid currentColor;
		border-radius: 50%;
		cursor: pointer;
		opacity: 0.75;
	}
	.ajuda:hover,
	.ajuda:focus-visible {
		opacity: 1;
	}
	.ajuda:focus-visible {
		outline: 2px solid var(--aco);
		outline-offset: 2px;
	}
	.popover {
		position: fixed;
		inset: auto;
		margin: 0;
		width: min(22rem, calc(100vw - 16px));
		padding: 0.75rem 0.9rem;
		font-size: 0.8125rem;
		font-weight: 400;
		line-height: 1.45;
		color: var(--tinta);
		background: var(--superficie);
		border: 1px solid var(--linha);
		border-radius: 6px;
		box-shadow: 0 6px 24px rgb(0 0 0 / 0.18);
	}
	.popover strong {
		display: block;
		margin-bottom: 0.25rem;
		font-size: 0.8125rem;
	}
	.popover p {
		margin: 0;
		color: var(--suave);
	}
	dd.desconto {
		color: var(--negativo);
	}
	dd.desconto::before {
		content: '− ';
	}
	.total,
	.liquido {
		font-weight: 700;
	}
	.liquido {
		color: var(--aco);
		border-bottom: 0;
	}
</style>
