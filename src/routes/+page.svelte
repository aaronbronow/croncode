<script lang="ts">
	import ApiKeyInput from '$lib/components/ApiKeyInput.svelte';
	import PromptInput from '$lib/components/PromptInput.svelte';
	import ScriptEdit from '$lib/components/ScriptEdit.svelte';
	import CronBuilder from '$lib/components/CronBuilder.svelte';
	import SessionManager from '$lib/components/SessionManager.svelte';
	import TopMenu from '$lib/components/TopMenu.svelte';
	import { isDemoMode, appState, isAnyKeyVerified } from '$lib/keys.svelte';

	let showHistory = $state(false);
	let showApiConfig = $state(false);
</script>

<div class="min-h-screen bg-slate-950 px-4 py-12 font-sans text-slate-100 selection:bg-blue-500/30">
	<div class="absolute right-8 top-8">
		<TopMenu 
			onToggleHistory={() => showHistory = !showHistory} 
			onToggleApiConfig={() => showApiConfig = !showApiConfig}
		/>
	</div>

	<main class="mx-auto max-w-5xl">
		<header class="mb-12 text-center">
			<h1
				class="mb-2 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-5xl font-black tracking-tighter text-transparent"
			>
				croncode.ai
			</h1>
			<p class="text-lg text-slate-400">Minimalist AI code generator for your recurring scripts.</p>

			{#if isDemoMode.value}
				<div
					class="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-1 text-sm font-medium text-yellow-500"
				>
					<span class="relative flex h-2 w-2">
						<span
							class="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75"
						></span>
						<span class="relative inline-flex h-2 w-2 rounded-full bg-yellow-500"></span>
					</span>
					Demo Mode: Configure keys to enable code generation
				</div>
			{/if}
		</header>

		{#if isAnyKeyVerified.value}
			<div class="mb-8" id="api-config">
				<ApiKeyInput bind:showConfig={showApiConfig} />
			</div>

			<!-- Session & History Manager (Always mounted to handle global drag events) -->
			<section>
				<SessionManager bind:showHistory />
			</section>

			<!-- Cron UI Builder -->
			<div class="mb-8">
				<CronBuilder />
			</div>

			<div class="rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-8">
				<h2 class="text-xs font-black uppercase tracking-[0.2em] text-slate-600">Code</h2>
				<section>
					<PromptInput onToggleApiConfig={() => { showApiConfig = true; }} />
				</section>
				<section>
					<ScriptEdit />
				</section>
			</div>
		{:else}
			<div class="space-y-8">
				<section id="api-config">
					<ApiKeyInput bind:showConfig={showApiConfig} />
				</section>

				<section class="flex flex-col justify-center rounded-lg border border-slate-800 p-6 text-center">
					<div class="mb-4 text-4xl">🏗️</div>
					<h3 class="mb-2 text-xl font-semibold">Prompt Engine Coming Soon</h3>
					<p class="text-slate-400">
						Once configured, you'll be able to generate scripts in Node.js or Python with built-in crontab
						support.
					</p>
				</section>
			</div>
		{/if}
	</main>
</div>
