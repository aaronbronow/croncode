<script lang="ts">
	import { keys, appState } from '$lib/keys.svelte';
	import { scriptState } from '$lib/script.svelte';

	let promptText = $state('');
	let language = $state('Node.js');

	async function generateScript() {
		if (!promptText.trim()) return;

		scriptState.isGenerating = true;
		scriptState.error = '';
		scriptState.result = '';
		scriptState.executionOutput = '';

		const systemPrompt = `Generate a ${language} script. Do not use markdown blocks like \`\`\`python, just return the raw code. Output a single functional file.`;
		const userPrompt = promptText.trim();

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
			} else if (appState.defaultModel === 'claude') {
				const response = await fetch('/api/claude', {
					method: 'POST',
					headers: {
						'x-api-key': keys.claude,
						'content-type': 'application/json'
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
		<span class="text-xs font-medium text-slate-500 uppercase tracking-wider">
			Using {appState.defaultModel}
		</span>
	</div>

	<div class="mb-4">
		<label for="language-select" class="mb-1 block text-sm font-medium text-slate-400">
			Language
		</label>
		<select
			id="language-select"
			bind:value={language}
			class="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
		>
			<option value="Node.js">Node.js</option>
			<option value="Python">Python</option>
		</select>
	</div>

	<div class="mb-4 flex-1">
		<label for="prompt-textarea" class="mb-1 block text-sm font-medium text-slate-400">
			Prompt
		</label>
		<textarea
			id="prompt-textarea"
			bind:value={promptText}
			placeholder="e.g., Print Hello World"
			class="h-48 w-full resize-y rounded border border-slate-600 bg-slate-800 px-3 py-2 font-mono text-sm text-slate-100 focus:border-blue-500 focus:outline-none md:h-64"
		></textarea>
	</div>

	<button
		onclick={generateScript}
		disabled={scriptState.isGenerating || !promptText.trim()}
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
