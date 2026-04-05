<script lang="ts">
	import { scriptState, clearScriptState, type HistoryEntry } from '$lib/script.svelte';
	import yaml from 'yaml';

	let { showHistory = $bindable(false) } = $props();

	let fileInput: HTMLInputElement;
	let viewMode = $state('history'); // 'history' or 'yaml'
	let isDragging = $state(false);

	// Persistence effect
	$effect(() => {
		const stateToSave = {
			language: scriptState.language,
			activeLanguage: scriptState.activeLanguage,
			result: scriptState.result,
			cron: scriptState.cron,
			promptText: scriptState.promptText,
			activeScriptId: scriptState.activeScriptId,
			history: scriptState.history
		};
		localStorage.setItem('croncode_session', JSON.stringify(stateToSave));
	});

	const currentSnapshot = $derived({
		promptText: scriptState.promptText,
		language: scriptState.language,
		activeLanguage: scriptState.activeLanguage,
		result: scriptState.result,
		cron: scriptState.cron,
		activeScriptId: scriptState.activeScriptId,
		history: scriptState.history
	});

	const yamlContent = $derived(yaml.stringify(currentSnapshot));

	function saveSession() {
		const blob = new Blob([yamlContent], { type: 'application/x-yaml' });
		const url = URL.createObjectURL(blob);

		const a = document.createElement('a');
		a.href = url;
		a.download = `croncode-session-${new Date().toISOString().slice(0, 10)}.yaml`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function processFile(file: File) {
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const content = e.target?.result as string;
				const snapshot = yaml.parse(content);
				
				if (snapshot) {
					// Restore state
					if (snapshot.promptText !== undefined) scriptState.promptText = snapshot.promptText;
					if (snapshot.language !== undefined) scriptState.language = snapshot.language;
					if (snapshot.activeLanguage !== undefined) scriptState.activeLanguage = snapshot.activeLanguage;
					if (snapshot.result !== undefined) scriptState.result = snapshot.result;
					if (snapshot.cron !== undefined) scriptState.cron = snapshot.cron;
					if (snapshot.activeScriptId !== undefined) scriptState.activeScriptId = snapshot.activeScriptId;
					if (snapshot.history !== undefined) scriptState.history = snapshot.history;
					
					// Ensure the panel shows up when we drop a session
					showHistory = true;
				}
			} catch (err) {
				console.error("Failed to parse YAML session", err);
				alert("Invalid session file format.");
			}
		};
		reader.readAsText(file);
	}

	function handleFileUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		processFile(file);
		// Reset the input so the same file can be uploaded again if needed
		target.value = '';
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		// Only hide if we're leaving the window
		if (!e.relatedTarget) {
			isDragging = false;
		}
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		const file = e.dataTransfer?.files[0];
		if (file) processFile(file);
	}

	function loadHistoryEntry(entry: HistoryEntry) {
		scriptState.activeScriptId = entry.id;
		scriptState.promptText = entry.prompt || '';
		scriptState.result = entry.code;
		scriptState.language = entry.language;
		scriptState.activeLanguage = entry.language;
		scriptState.cron = entry.cron;
	}

	function formatDate(isoString: string) {
		const date = new Date(isoString);
		return date.toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	function deleteHistoryEntry(id: string, event: MouseEvent) {
		event.stopPropagation();
		scriptState.history = scriptState.history.filter((e: HistoryEntry) => e.id !== id);
		if (scriptState.activeScriptId === id) {
			scriptState.activeScriptId = null;
		}
	}
</script>

<svelte:window 
	ondragover={handleDragOver} 
	ondragleave={handleDragLeave} 
	ondrop={handleDrop} 
/>

{#if isDragging}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-blue-600/20 backdrop-blur-sm">
		<div class="rounded-2xl border-2 border-dashed border-blue-400 bg-slate-900/90 p-12 text-center shadow-2xl">
			<div class="mb-4 text-6xl">📄</div>
			<h3 class="mb-2 text-2xl font-bold text-white">Restore Session</h3>
			<p class="text-blue-300">Drop your YAML session file here to load your history and scripts.</p>
		</div>
	</div>
{/if}

{#if showHistory}
	<div class="mb-12 rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-xl">
		<div class="mb-6 flex items-center justify-between">
			<div>
				<h2 class="text-xl font-bold text-slate-100">Session & History</h2>
				<p class="text-sm text-slate-400">Manage your generated scripts and restore previous sessions.</p>
			</div>
			<div class="flex gap-3">
				<input
					type="file"
					accept=".yaml,.yml"
					class="hidden"
					bind:this={fileInput}
					onchange={handleFileUpload}
				/>
				<button
					onclick={() => viewMode = viewMode === 'history' ? 'yaml' : 'history'}
					class="rounded border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700"
				>
					{viewMode === 'history' ? 'View YAML' : 'View History'}
				</button>
				<button
					onclick={() => fileInput.click()}
					class="rounded border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700"
				>
					Upload
				</button>
				<button
					onclick={saveSession}
					class="rounded border border-blue-600 bg-blue-600/20 px-3 py-1.5 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-600/30"
				>
					Save
				</button>
				<button
					onclick={clearScriptState}
					class="rounded border border-red-600 bg-red-600/20 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-600/30"
				>
					Clear
				</button>
				<button
					onclick={() => showHistory = false}
					class="rounded border border-slate-600 bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-600"
				>
					Close
				</button>
			</div>
		</div>

		{#if viewMode === 'history'}
			{#if scriptState.history.length === 0}
				<div class="rounded border border-slate-800 bg-slate-950 p-8 text-center text-sm text-slate-500">
					No scripts in history. Generate or test a script to start saving your session.
				</div>
			{:else}
				<div class="space-y-3">
					{#each scriptState.history as entry}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							onclick={() => loadHistoryEntry(entry)}
							class="group relative w-full cursor-pointer rounded border p-4 text-left transition-colors {scriptState.activeScriptId === entry.id ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 bg-slate-950 hover:border-slate-700'}"
						>
							<div class="mb-2 flex items-center justify-between">
								<div class="flex items-center gap-3">
									<span class="rounded bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-300">
										{entry.language}
									</span>
									<span class="text-xs font-mono text-slate-500">
										<span class="font-sans font-semibold">Cron:</span> {entry.cron}
									</span>
								</div>
								<div class="flex items-center gap-4">
									<span class="text-xs text-slate-500">{formatDate(entry.timestamp)}</span>
									<button
										onclick={(e) => deleteHistoryEntry(entry.id, e)}
										class="rounded-full p-1 text-slate-500 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
										aria-label="Delete history entry"
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
											<path d="M3 6h18"></path>
											<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
											<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
										</svg>
									</button>
								</div>
							</div>
							{#if entry.prompt}
								<p class="truncate pr-8 text-sm text-slate-300">"{entry.prompt}"</p>
							{:else}
								<p class="text-sm italic text-slate-500">Manually edited script</p>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		{:else}
			<div class="rounded border border-slate-800 bg-slate-950 p-4">
				<pre class="max-h-96 overflow-auto text-xs text-slate-400 font-mono"><code>{yamlContent}</code></pre>
			</div>
		{/if}
	</div>
{/if}
