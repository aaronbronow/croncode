<script lang="ts">
	import { keys, saveKeys, clearKeys } from '$lib/keys.svelte';

	let geminiInput = $state(keys.gemini);
	let claudeInput = $state(keys.claude);
	let isEditing = $state(!keys.gemini);

	let isTesting = $state(false);
	let testStatus = $state<{ success?: boolean; message?: string }>({});

	function handleSave() {
		saveKeys(geminiInput, claudeInput);
		isEditing = false;
		testStatus = {};
	}

	async function testConnection() {
		if (!geminiInput) return;
		isTesting = true;
		testStatus = {};

		try {
			// Using a lightweight endpoint to verify the key
			const response = await fetch(
				`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiInput}`
			);

			if (response.ok) {
				testStatus = { success: true, message: 'Gemini API connection successful!' };
			} else {
				const error = await response.json();
				testStatus = {
					success: false,
					message: error.error?.message || 'Invalid Gemini API key.'
				};
			}
		} catch (e) {
			testStatus = { success: false, message: 'Connection failed. Check your network.' };
		} finally {
			isTesting = false;
		}
	}

	function handleEdit() {
		isEditing = true;
		testStatus = {};
	}
</script>

<div class="rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-xl">
	<div class="mb-4 flex items-center justify-between">
		<h2 class="text-xl font-bold text-slate-100">API Configuration</h2>
		{#if !isEditing}
			<button onclick={handleEdit} class="text-sm text-blue-400 hover:text-blue-300 hover:underline">
				Edit Keys
			</button>
		{/if}
	</div>

	{#if isEditing}
		<div class="space-y-4">
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
						onclick={testConnection}
						disabled={!geminiInput || isTesting}
						class="rounded bg-slate-800 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
					>
						{isTesting ? '...' : 'Test'}
					</button>
				</div>
				{#if testStatus.message}
					<p
						class="mt-1 text-xs {testStatus.success ? 'text-green-400' : 'text-red-400'}"
					>
						{testStatus.message}
					</p>
				{/if}
			</div>

			<div>
				<div class="mb-1 flex items-center justify-between">
					<label for="claude-key" class="block text-sm font-medium text-slate-400">
						Claude API Key (Optional)
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
				<input
					id="claude-key"
					type="password"
					bind:value={claudeInput}
					placeholder="Enter your Anthropic Claude key..."
					class="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
				/>
			</div>

			<div class="flex gap-3 pt-2">
				<button
					onclick={handleSave}
					class="flex-1 rounded bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-500"
				>
					Save Configuration
				</button>
				{#if keys.gemini}
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
	{:else}
		<div class="space-y-2">
			<div class="flex items-center gap-2">
				<div class="h-2 w-2 rounded-full bg-green-500"></div>
				<span class="text-sm text-slate-300">Gemini Key Configured</span>
			</div>
			{#if keys.claude}
				<div class="flex items-center gap-2">
					<div class="h-2 w-2 rounded-full bg-green-500"></div>
					<span class="text-sm text-slate-300">Claude Key Configured</span>
				</div>
			{:else}
				<div class="flex items-center gap-2">
					<div class="h-2 w-2 rounded-full bg-slate-600"></div>
					<span class="text-sm text-slate-400">Claude Key Missing (Optional)</span>
				</div>
			{/if}
		</div>
	{/if}
</div>
