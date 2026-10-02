<script lang="ts">
	// Fonte embutida no site: nenhuma requisição a terceiros (LGPD).
	import '@fontsource/public-sans/400.css';
	import '@fontsource/public-sans/600.css';
	import '@fontsource/public-sans/700.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
