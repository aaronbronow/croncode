<script lang="ts">
	import { scriptState } from '$lib/script.svelte';

	function handleTest() {
		scriptState.executionOutput = 'WASM execution coming soon...';
	}
</script>

<div class="flex h-full flex-col rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-xl">
	<div class="mb-4 flex items-center justify-between">
		<h2 class="text-xl font-bold text-slate-100">Script</h2>
		<button
			onclick={handleTest}
			disabled={!scriptState.result.trim() || scriptState.isGenerating}
			class="rounded bg-slate-700 px-3 py-1 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-600 disabled:opacity-50"
		>
			Test Script
		</button>
	</div>

	<div class="mb-4 flex-1">
		<label for="script-editor" class="sr-only">Script Editor</label>
		{#if scriptState.isGenerating}
			<div class="flex h-48 items-center justify-center rounded border border-slate-700 bg-slate-800/50 md:h-64">
				<div class="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
			</div>
		{:else}
			<textarea
				id="script-editor"
				bind:value={scriptState.result}
				placeholder="Generated script will appear here. You can tweak it before testing."
				class="h-48 w-full resize-y rounded border border-slate-600 bg-slate-800 px-3 py-2 font-mono text-sm text-slate-100 focus:border-blue-500 focus:outline-none md:h-64"
			></textarea>
		{/if}
	</div>

	{#if scriptState.executionOutput}
		<div class="mt-auto">
			<h3 class="mb-2 text-sm font-medium text-slate-400">Execution Output</h3>
			<pre class="max-h-32 w-full overflow-auto rounded border border-slate-700 bg-black p-3 font-mono text-xs text-slate-300"><code>{scriptState.executionOutput}</code></pre>
		</div>
	{/if}
</div>
