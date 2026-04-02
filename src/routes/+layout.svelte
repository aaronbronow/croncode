<script lang="ts">
	import { initDefaults } from '$lib/keys.svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { data, children } = $props();

	if (data?.defaults) {
		initDefaults(data.defaults);
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
