<script lang="ts">
	import { scriptState } from '$lib/script.svelte';
	import CodeMirror from 'svelte-codemirror-editor';
	import { javascript } from '@codemirror/lang-javascript';
	import { python } from '@codemirror/lang-python';
	import { StreamLanguage } from '@codemirror/language';
	import { shell } from '@codemirror/legacy-modes/mode/shell';
	import { executeScript } from '$lib/webcontainer';
	import MicrotermRunner from './MicrotermRunner.svelte';

	let runner: any = $state(null);

	const langs: Record<string, any> = {
		'Node.js': javascript(),
		Python: python(),
		Bash: StreamLanguage.define(shell)
	};

	let editorLang = $derived(langs[scriptState.language] || javascript());

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

<div class="mt-8 flex flex-col border-t border-slate-800 pt-8">
	<div class="mb-4 flex items-center justify-between">
		<h3 class="text-sm font-bold text-slate-400">Source Editor</h3>
		<div class="flex gap-2">
			<button
				onclick={handleTest}
				disabled={!scriptState.result.trim() || scriptState.isGenerating || scriptState.isExecuting}
				class="rounded bg-slate-700 px-3 py-1 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-600 disabled:opacity-50"
			>
				{scriptState.isExecuting ? 'Running...' : `Test ${scriptState.activeLanguage}`}
			</button>
		</div>
	</div>

	<div class="mb-4 flex-1">
		<label for="script-editor" class="sr-only">Script Editor</label>
		{#if scriptState.isGenerating}
			<div
				class="flex h-96 items-center justify-center rounded border border-slate-700 bg-slate-800/50 md:h-[32rem]"
			>
				<div
					class="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
				></div>
			</div>
		{:else}
			<div
				class="h-96 overflow-auto rounded border border-slate-700 focus-within:border-blue-500/50 md:h-[32rem]"
			>
				<CodeMirror
					bind:value={scriptState.result}
					lang={editorLang}
					styles={{
						'&': {
							backgroundColor: '#020617', // slate-950
							color: '#e2e8f0', // slate-200
							fontSize: '0.8125rem', // slightly smaller (13px)
							minHeight: '100%',
							lineHeight: '1.4' // compact
						},
						'.cm-content': {
							caretColor: '#3b82f6' // blue-500
						},
						'.cm-cursor, .cm-dropCursor': {
							borderLeftColor: '#3b82f6'
						},
						'&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
							{
								backgroundColor: 'rgba(59, 130, 246, 0.2)' // blue-500/20
							},
						'.cm-gutters': {
							backgroundColor: '#0f172a', // slate-900
							color: '#475569', // slate-500
							borderRight: '1px solid #1e293b' // slate-800
						}
					}}
				/>
			</div>
		{/if}
	</div>

	<div class="mt-4">
		<div class="mb-2 flex items-center justify-between">
			<h3 class="text-xs font-medium tracking-wider text-slate-500 uppercase">
				Terminal Output
			</h3>
			<div class="flex items-center gap-4">
				<div class="flex items-center gap-2">
					<div
						class="h-1.5 w-1.5 rounded-full {scriptState.webContainerReady
							? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
							: 'bg-slate-600'}"
					></div>
					<span
						class="text-[10px] font-medium tracking-wider uppercase {scriptState.webContainerReady
							? 'text-green-400'
							: 'text-slate-600'}"
					>
						WebContainer {scriptState.webContainerReady ? 'Ready' : ''}
					</span>
				</div>
				<div class="flex items-center gap-2">
					<div
						class="h-1.5 w-1.5 rounded-full {scriptState.webVmReady
							? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
							: 'bg-slate-600'}"
					></div>
					<span
						class="text-[10px] font-medium tracking-wider uppercase {scriptState.webVmReady
							? 'text-green-400'
							: 'text-slate-600'}"
					>
						WebVM {scriptState.webVmReady ? 'Ready' : ''}
					</span>
				</div>
			</div>
		</div>
		<div class="h-64 overflow-hidden rounded border border-slate-700 bg-[#002b36]">
			<MicrotermRunner bind:this={runner} />
		</div>
	</div>
</div>
