// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	/** Versão do app (package.json), injetada pelo Vite. */
	const __VERSAO_APP__: string;

	/** GoatCounter (ADR-004): ausente se o script for bloqueado. */
	interface Window {
		goatcounter?: { count(opcoes: { path: string }): void };
	}

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
