<script lang="ts">
	import { keys, appState, isAnyKeyVerified } from '$lib/keys.svelte';
	import { scriptState } from '$lib/script.svelte';

	let { onToggleApiConfig } = $props();

	async function generateScript() {
		if (!scriptState.promptText.trim()) return;

		scriptState.isGenerating = true;
		scriptState.error = '';
		scriptState.result = '';
		scriptState.executionOutput = '';

		const systemPrompt = `Generate a ${scriptState.language} script. Do not use markdown blocks like \`\`\`python, just return the raw code. Output a single functional file. Ignore any scheduling or timing logic requested by the user (e.g., 'run every day'), as the cron schedule is handled entirely by a separate Docker crontab system. Return ONLY the logic to be executed.`;
		const userPrompt = scriptState.promptText.trim();

		try {
			if (appState.defaultModel === 'gemini') {
				const response = await fetch(
					`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${keys.gemini}`,
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							contents: [
								{
									parts: [
										{
											text: `${systemPrompt}\n\n${userPrompt}`
										}
									]
								}
							]
						})
					}
				);

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error?.message || 'Failed to generate script with Gemini');
				}

				const data = await response.json();
				const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
				scriptState.result = text.trim();
				scriptState.activeLanguage = scriptState.language;
			} else if (appState.defaultModel === 'claude') {
				const response = await fetch('https://api.anthropic.com/v1/messages', {
					method: 'POST',
					headers: {
						'x-api-key': keys.claude,
						'content-type': 'application/json',
						'anthropic-version': '2023-06-01',
						'anthropic-dangerous-direct-browser-access': 'true'
					},
					body: JSON.stringify({
						model: 'claude-haiku-4-5',
						max_tokens: 4096,
						system: systemPrompt,
						messages: [{ role: 'user', content: userPrompt }]
					})
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error?.message || 'Failed to generate script with Claude');
				}

				const data = await response.json();
				const text = data.content?.[0]?.text || '';
				scriptState.result = text.trim();
				scriptState.activeLanguage = scriptState.language;
			}
			
			// Save to history
			if (scriptState.result) {
				scriptState.activeScriptId = crypto.randomUUID();
				scriptState.history.push({
					id: scriptState.activeScriptId,
					timestamp: new Date().toISOString(),
					prompt: scriptState.promptText.trim(),
					code: scriptState.result,
					language: scriptState.activeLanguage,
					cron: scriptState.cron
				});
			}
		} catch (e: any) {
			scriptState.error = e.message || 'An unexpected error occurred.';
		} finally {
			scriptState.isGenerating = false;
		}
	}
</script>

<div class="flex h-full flex-col rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-xl">
	<div class="mb-4 flex items-center justify-between">
		<h2 class="text-xl font-bold text-slate-100">Prompt Engine</h2>
		<div class="flex items-center gap-2">
			{#if isAnyKeyVerified.value}
				<div class="h-2 w-2 rounded-full bg-green-500"></div>
				<span class="text-xs font-medium text-green-400 uppercase tracking-wider">
					{appState.defaultModel === 'gemini' ? 'Gemini' : 'Claude'} Ready
				</span>
			{:else}
				<div class="h-2 w-2 rounded-full bg-slate-500"></div>
				<a 
					href="#api-config" 
					onclick={(e) => { e.preventDefault(); onToggleApiConfig(); setTimeout(() => document.getElementById('api-config')?.scrollIntoView({ behavior: 'smooth' }), 50); }}
					class="text-xs font-medium text-slate-500 uppercase tracking-wider hover:text-slate-400 underline decoration-slate-500/30"
				>
					Add API Key
				</a>
			{/if}
		</div>
	</div>

	<div class="mb-4">
		<label for="language-select" class="mb-1 block text-sm font-medium text-slate-400">
			Language
		</label>
		<select
			id="language-select"
			bind:value={scriptState.language}
			class="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
		>
			<option value="Node.js">Node.js</option>
			<option value="Python">Python</option>
			<option value="Bash">Bash</option>
		</select>
	</div>

	<div class="mb-4 flex-1">
		<div class="mb-1 flex items-baseline justify-between">
			<label for="prompt-textarea" class="block text-sm font-medium text-slate-400">
				Prompt
			</label>
			<span class="text-xs text-slate-500">Schedule is handled separately. Do not include timing (e.g., 'run every day').</span>
		</div>
		<textarea
			id="prompt-textarea"
			bind:value={scriptState.promptText}
			placeholder="e.g., Fetch latest news from HackerNews"
			class="h-48 w-full resize-y rounded border border-slate-600 bg-slate-800 px-3 py-2 font-mono text-sm text-slate-100 focus:border-blue-500 focus:outline-none md:h-64"
		></textarea>
	</div>

	<button
		onclick={generateScript}
		disabled={scriptState.isGenerating || !scriptState.promptText.trim()}
		class="w-full rounded bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
	>
		{scriptState.isGenerating ? 'Generating...' : 'Generate Script'}
	</button>

	{#if scriptState.error}
		<div class="mt-4 rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
			{scriptState.error}
		</div>
	{/if}
</div>
