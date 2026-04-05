<script lang="ts">
	import { scriptState } from '$lib/script.svelte';
	import CodeMirror from 'svelte-codemirror-editor';
	import { javascript } from '@codemirror/lang-javascript';
	import { python } from '@codemirror/lang-python';
	import { StreamLanguage } from '@codemirror/language';
	import { shell } from '@codemirror/legacy-modes/mode/shell';
	import { executeScript } from '$lib/webcontainer';
	import MicrotermRunner from './MicrotermRunner.svelte';

	const langs: Record<string, any> = {
		'Node.js': javascript(),
		Python: python(),
		Bash: StreamLanguage.define(shell)
	};

	let editorLang = $derived(langs[scriptState.language] || javascript());
	let runner: any = $state(null);

	async function handleTest() {
		scriptState.executionOutput = ''; // Keep this for now for logic compatibility
		scriptState.isExecuting = true;

		if (runner) runner.clearTerminal();

		// Save/Update history
		if (scriptState.result.trim()) {
			if (scriptState.activeScriptId) {
				const entry = scriptState.history.find((e: any) => e.id === scriptState.activeScriptId);
				if (entry) {
					entry.code = scriptState.result;
					entry.cron = scriptState.cron;
					entry.language = scriptState.activeLanguage;
				}
			} else {
				scriptState.activeScriptId = crypto.randomUUID();
				scriptState.history.push({
					id: scriptState.activeScriptId,
					timestamp: new Date().toISOString(),
					code: scriptState.result,
					language: scriptState.activeLanguage,
					cron: scriptState.cron
				});
			}
		}

		try {
			// Use activeLanguage (what the code actually is) instead of language (the target preference)
			const executionLanguage = scriptState.activeLanguage;

			
			if (executionLanguage === 'Node.js') {
				if (runner) {
					runner.writeToTerminal('\x1b[1;34m[System] Running Node.js script...\x1b[0m\r\n');
				}
				await executeScript(
					executionLanguage,
					scriptState.result,
					(data) => {
						if (runner) runner.writeToTerminal(data);
					},
					(msg) => {
						if (runner) runner.writeToTerminal(`\x1b[1;34m${msg}\x1b[0m`);
					}
				);
			} else {
				if (runner) await runner.runTest(scriptState.result, executionLanguage);
			}
		} catch (error: any) {
			console.error('[handleTest Error]', error);
			const msg = error?.message || error?.toString() || 'Unknown error';
			if (runner) runner.writeToTerminal(`\r\n\x1b[1;31m[System Error] ${msg}\x1b[0m\r\n`);
		} finally {
			scriptState.isExecuting = false;
		}
	}
</script>

<div class="flex flex-col border-t border-slate-800 pt-8 mt-8">
	<div class="mb-4 flex items-center justify-between">
		<h3 class="text-sm font-bold text-slate-400">Source Editor</h3>
		<button
			onclick={handleTest}
			disabled={!scriptState.result.trim() || scriptState.isGenerating || scriptState.isExecuting}
			class="rounded bg-slate-700 px-3 py-1 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-600 disabled:opacity-50"
		>
			{scriptState.isExecuting ? 'Running...' : `Test ${scriptState.activeLanguage}`}
		</button>
	</div>

	<div class="mb-4 flex-1">
		<label for="script-editor" class="sr-only">Script Editor</label>
		{#if scriptState.isGenerating}
			<div class="flex h-96 items-center justify-center rounded border border-slate-700 bg-slate-800/50 md:h-[32rem]">
				<div class="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
			</div>
		{:else}
			<div class="rounded border border-slate-700 focus-within:border-blue-500/50 overflow-auto h-96 md:h-[32rem]">
				<CodeMirror 
					bind:value={scriptState.result} 
					lang={editorLang} 
					styles={{
						"&": {
							backgroundColor: "#002b36",
							color: "#839496",
							fontSize: "0.875rem",
							minHeight: "100%"
						},
						".cm-content": {
							caretColor: "#93a1a1"
						},
						".cm-cursor, .cm-dropCursor": {
							borderLeftColor: "#93a1a1"
						},
						"&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
							backgroundColor: "rgba(7, 54, 66, 0.9)"
						},
						".cm-gutters": {
							backgroundColor: "#073642",
							color: "#586e75",
							border: "none"
						}
					}} 
				/>
			</div>
		{/if}
	</div>

	<div class="mt-4">
		<h3 class="mb-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Terminal Output</h3>
		<div class="h-64 overflow-hidden rounded border border-slate-700 bg-[#002b36]">
			<MicrotermRunner bind:this={runner} />
		</div>
	</div>
</div>