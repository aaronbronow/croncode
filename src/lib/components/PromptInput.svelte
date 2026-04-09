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

		let systemPrompt = `Generate a ${scriptState.language} script. Do not use markdown blocks like \`\`\`${scriptState.language === 'Node.js' ? 'javascript' : scriptState.language.toLowerCase()}, just return the raw code. Output a single functional file. Prefer using the language's standard library for all tasks (e.g., 'urllib' in Python, native 'fetch' in Node.js) to avoid the need for external package managers. Only use external packages if the standard library implementation would be excessively complex or bloated. Ignore any scheduling or timing logic requested by the user (e.g., 'run every day'), as the cron schedule is handled entirely by a separate Docker crontab system. Return ONLY the logic to be executed.`;

		if (scriptState.language === 'Bash') {
			systemPrompt +=
				" Always include 'set -euo pipefail' at the beginning of Bash scripts for robustness. If you use external tools like 'curl' or 'jq', assume the script will run in an Alpine-based Docker container and provide a comment at the top explaining that these should be installed via 'apk add --no-cache curl jq'.";
		}

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
					version: __APP_VERSION__,
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

<div class="flex flex-col">
	<div class="mb-4 flex items-center justify-between">
		<h3 class="text-sm font-bold text-slate-400">Prompt Engine</h3>
		<div class="flex items-center gap-2">
			{#if isAnyKeyVerified.value}
				<div class="h-2 w-2 rounded-full bg-green-500"></div>
				<span class="text-xs font-medium tracking-wider text-green-400 uppercase">
					{appState.defaultModel === 'gemini' ? 'Gemini' : 'Claude'} Ready
				</span>
			{:else}
				<div class="h-2 w-2 rounded-full bg-slate-500"></div>
				<a
					href="#api-config"
					onclick={(e) => {
						e.preventDefault();
						onToggleApiConfig();
						setTimeout(
							() => document.getElementById('api-config')?.scrollIntoView({ behavior: 'smooth' }),
							50
						);
					}}
					class="text-xs font-medium tracking-wider text-slate-500 uppercase underline decoration-slate-500/30 hover:text-slate-400"
				>
					Add API Key
				</a>
			{/if}
		</div>
	</div>

	<div class="mb-4">
		<div class="mb-1 flex items-baseline justify-between">
			<label
				for="prompt-textarea"
				class="block text-xs font-medium tracking-wider text-slate-500 uppercase"
			>
				Instructions
			</label>
			<span class="text-[10px] text-slate-600">Schedule is handled in the Cron panel.</span>
		</div>
		<textarea
			id="prompt-textarea"
			bind:value={scriptState.promptText}
			placeholder="e.g., Fetch latest news from HackerNews"
			class="h-20 w-full resize-y rounded border border-slate-700 bg-slate-800/50 px-3 py-2 font-mono text-sm text-slate-100 focus:border-blue-500/50 focus:outline-none"
		></textarea>
	</div>

	<div class="flex flex-col gap-4 sm:flex-row sm:items-end">
		<div class="flex-1">
			<label
				for="language-select"
				class="mb-1 block text-xs font-medium tracking-wider text-slate-500 uppercase"
			>
				Language
			</label>
			<select
				id="language-select"
				bind:value={scriptState.language}
				class="w-full rounded border border-slate-700 bg-slate-800/50 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
			>
				<option value="Node.js">Node.js</option>
				<option value="Python">Python</option>
				{#if scriptState.ENABLE_WEBVM}
					<option value="Bash">Bash</option>
				{/if}
			</select>
		</div>

		<button
			onclick={generateScript}
			disabled={scriptState.isGenerating || !scriptState.promptText.trim()}
			class="flex-[2] rounded bg-blue-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
		>
			{scriptState.isGenerating ? 'Generating...' : 'Generate Script'}
		</button>
	</div>

	{#if scriptState.error}
		<div class="mt-4 rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
			{scriptState.error}
		</div>
	{/if}
</div>
