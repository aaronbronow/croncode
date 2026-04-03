<script lang="ts">
	import { keys, saveKeys, appState, setKeyVerified, setDefaultModel } from '$lib/keys.svelte';

	let geminiInput = $state(keys.gemini);
	let claudeInput = $state(keys.claude);
	let isEditing = $state(!keys.gemini && !keys.claude);

	let isTestingGemini = $state(false);
	let isTestingClaude = $state(false);
	let geminiTestStatus = $state<{ success?: boolean; message?: string }>({});
	let claudeTestStatus = $state<{ success?: boolean; message?: string }>({});

	function handleSave() {
		saveKeys(geminiInput, claudeInput);
		isEditing = false;
		geminiTestStatus = {};
		claudeTestStatus = {};
	}

	async function testGemini() {
		if (!geminiInput) return;
		isTestingGemini = true;
		geminiTestStatus = {};

		try {
			const response = await fetch(
				`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiInput}`
			);

			if (response.ok) {
				geminiTestStatus = { success: true, message: 'Gemini API connection successful!' };
				setKeyVerified('gemini', true);
			} else {
				const error = await response.json();
				geminiTestStatus = {
					success: false,
					message: error.error?.message || 'Invalid Gemini API key.'
				};
			}
		} catch (e) {
			geminiTestStatus = { success: false, message: 'Connection failed. Check your network.' };
		} finally {
			isTestingGemini = false;
		}
	}

	async function testClaude() {
		if (!claudeInput) return;
		isTestingClaude = true;
		claudeTestStatus = {};

		try {
			const response = await fetch('https://api.anthropic.com/v1/messages', {
				method: 'POST',
				headers: {
					'x-api-key': claudeInput,
					'content-type': 'application/json',
					'anthropic-version': '2023-06-01',
					'anthropic-dangerous-direct-browser-access': 'true'
				},
				body: JSON.stringify({
					model: 'claude-haiku-4-5',
					max_tokens: 1,
					messages: [{ role: 'user', content: 'test' }]
				})
			});

			if (response.ok) {
				claudeTestStatus = { success: true, message: 'Claude API connection successful!' };
				setKeyVerified('claude', true);
			} else {
				const error = await response.json();
				claudeTestStatus = {
					success: false,
					message: error.error?.message || 'Invalid Claude API key or CORS error.'
				};
			}
		} catch (e) {
			claudeTestStatus = {
				success: false,
				message: 'Connection failed. Likely a CORS restriction or network issue.'
			};
		} finally {
			isTestingClaude = false;
		}
	}

	function handleEdit() {
		isEditing = true;
		geminiTestStatus = {};
		claudeTestStatus = {};
	}
</script>

{#if (appState.geminiVerified || appState.claudeVerified) && !isEditing}
	<div class="rounded-lg border border-slate-700 bg-slate-900 p-4 shadow-xl">
		<div class="flex items-center justify-between">
			<div class="flex flex-wrap gap-4">
				{#if appState.geminiVerified}
					<div class="flex items-center gap-2">
						<div class="h-2 w-2 rounded-full bg-green-500"></div>
						<span class="text-sm font-medium text-green-400">Gemini Ready</span>
					</div>
				{/if}
				{#if appState.claudeVerified}
					<div class="flex items-center gap-2">
						<div class="h-2 w-2 rounded-full bg-green-500"></div>
						<span class="text-sm font-medium text-green-400">Claude Ready</span>
					</div>
				{/if}
			</div>
			<button onclick={handleEdit} class="text-sm text-blue-400 hover:text-blue-300 hover:underline">
				Edit Configuration
			</button>
		</div>

		{#if appState.geminiVerified && appState.claudeVerified}
			<div class="mt-4 flex items-center gap-4 border-t border-slate-800 pt-4">
				<span class="text-sm font-medium text-slate-400">Default Model:</span>
				<div class="flex gap-4">
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="radio"
							name="defaultModel"
							value="gemini"
							checked={appState.defaultModel === 'gemini'}
							onchange={() => setDefaultModel('gemini')}
							class="text-blue-600"
						/>
						<span class="text-sm text-slate-200">Gemini</span>
					</label>
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="radio"
							name="defaultModel"
							value="claude"
							checked={appState.defaultModel === 'claude'}
							onchange={() => setDefaultModel('claude')}
							class="text-blue-600"
						/>
						<span class="text-sm text-slate-200">Claude</span>
					</label>
				</div>
			</div>
		{/if}
	</div>
{:else}
	<div class="rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-xl">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-xl font-bold text-slate-100">API Configuration</h2>
			{#if !isEditing && (appState.geminiVerified || appState.claudeVerified)}
				<button onclick={handleEdit} class="text-sm text-blue-400 hover:text-blue-300 hover:underline">
					Edit Keys
				</button>
			{/if}
		</div>

		<div class="space-y-6">
			<!-- Gemini -->
			<div>
				<div class="mb-1 flex items-center justify-between">
					<label for="gemini-key" class="block text-sm font-medium text-slate-400">
						Gemini API Key
					</label>
					<a
						href="https://aistudio.google.com/app/apikey"
						target="_blank"
						rel="noopener noreferrer"
						class="text-xs text-blue-400 hover:text-blue-300 hover:underline"
					>
						Get Key →
					</a>
				</div>
				<div class="flex gap-2">
					<input
						id="gemini-key"
						type="password"
						bind:value={geminiInput}
						placeholder="Enter your Google Gemini key..."
						class="flex-1 rounded border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
					/>
					<button
						onclick={testGemini}
						disabled={!geminiInput || isTestingGemini}
						class="rounded bg-slate-800 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
					>
						{isTestingGemini ? '...' : 'Test'}
					</button>
				</div>
				{#if geminiTestStatus.message}
					<p
						class="mt-1 text-xs {geminiTestStatus.success ? 'text-green-400' : 'text-red-400'}"
					>
						{geminiTestStatus.message}
					</p>
				{/if}
			</div>

			<!-- Claude -->
			<div>
				<div class="mb-1 flex items-center justify-between">
					<label for="claude-key" class="block text-sm font-medium text-slate-400">
						Claude API Key
					</label>
					<a
						href="https://console.anthropic.com/settings/keys"
						target="_blank"
						rel="noopener noreferrer"
						class="text-xs text-blue-400 hover:text-blue-300 hover:underline"
					>
						Get Key →
					</a>
				</div>
				<div class="flex gap-2">
					<input
						id="claude-key"
						type="password"
						bind:value={claudeInput}
						placeholder="Enter your Anthropic Claude key..."
						class="flex-1 rounded border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
					/>
					<button
						onclick={testClaude}
						disabled={!claudeInput || isTestingClaude}
						class="rounded bg-slate-800 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
					>
						{isTestingClaude ? '...' : 'Test'}
					</button>
				</div>
				{#if claudeTestStatus.message}
					<p
						class="mt-1 text-xs {claudeTestStatus.success ? 'text-green-400' : 'text-red-400'}"
					>
						{claudeTestStatus.message}
					</p>
				{/if}
			</div>

			<div class="flex gap-3 pt-2">
				<button
					onclick={handleSave}
					class="flex-1 rounded bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-500"
				>
					Save Configuration
				</button>
				{#if keys.gemini || keys.claude}
					<button
						onclick={() => (isEditing = false)}
						class="rounded bg-slate-700 px-4 py-2 font-semibold text-slate-200 transition-colors hover:bg-slate-600"
					>
						Cancel
					</button>
				{/if}
			</div>
			<p class="text-xs text-slate-500">
				Keys are stored in your browser's <code>localStorage</code> and never sent to our servers.
			</p>
		</div>
	</div>
{/if}
