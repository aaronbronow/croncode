<script lang="ts">
	import { scriptState } from '$lib/script.svelte';
	import CodeMirror from 'svelte-codemirror-editor';
	import { javascript } from '@codemirror/lang-javascript';
	import { python } from '@codemirror/lang-python';
	import { StreamLanguage } from '@codemirror/language';
	import { shell } from '@codemirror/legacy-modes/mode/shell';

	const langs: Record<string, any> = {
		'Node.js': javascript(),
		Python: python(),
		Bash: StreamLanguage.define(shell)
	};

	let editorLang = $derived(langs[scriptState.language] || javascript());

	function handleTest() {
		scriptState.executionOutput = 'WebContainer execution coming in the next phase...';
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
			<div class="rounded border border-slate-600 focus-within:border-blue-500 overflow-auto h-48 md:h-64">
				<CodeMirror 
					bind:value={scriptState.result} 
					lang={editorLang} 
					styles={{
						"&": {
							backgroundColor: "#1e293b",
							color: "#f1f5f9",
							fontSize: "0.875rem",
							minHeight: "100%"
						}
					}} 
				/>
			</div>
		{/if}
	</div>

	{#if scriptState.executionOutput}
		<div class="mt-auto">
			<h3 class="mb-2 text-sm font-medium text-slate-400">Execution Output</h3>
			<pre class="max-h-32 w-full overflow-auto rounded border border-slate-700 bg-black p-3 font-mono text-xs text-slate-300"><code>{scriptState.executionOutput}</code></pre>
		</div>
	{/if}
</div>
