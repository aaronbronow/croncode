<script lang="ts">
	import ApiKeyInput from '$lib/components/ApiKeyInput.svelte';
	import PromptInput from '$lib/components/PromptInput.svelte';
	import ScriptEdit from '$lib/components/ScriptEdit.svelte';
	import CronBuilder from '$lib/components/CronBuilder.svelte';
	import SessionManager from '$lib/components/SessionManager.svelte';
	import TopMenu from '$lib/components/TopMenu.svelte';
	import { isDemoMode, appState, isAnyKeyVerified } from '$lib/keys.svelte';
	import { generateDockerfile } from '$lib/utils/docker';
	import { scriptState } from '$lib/script.svelte';

	let showHistory = $state(false);
	let showApiConfig = $state(false);
	let showDockerfile = $state(false);

	let dockerConfig = $derived(
		generateDockerfile(scriptState.result, scriptState.activeLanguage, scriptState.cron)
	);

	function handleDownloadDockerfile() {
		const blob = new Blob([dockerConfig.dockerfile], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'Dockerfile';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
</script>

<div class="min-h-screen bg-slate-950 px-4 py-12 font-sans text-slate-100 selection:bg-blue-500/30">
	<div class="absolute top-8 right-8">
		<TopMenu
			onToggleHistory={() => (showHistory = !showHistory)}
			onToggleApiConfig={() => (showApiConfig = !showApiConfig)}
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

			<div class="space-y-8">
				<div class="rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-xl">
					<h2 class="text-xs font-black tracking-[0.2em] text-slate-600 uppercase">Code</h2>
					<section>
						<PromptInput
							onToggleApiConfig={() => {
								showApiConfig = true;
							}}
						/>
					</section>
					<section>
						<ScriptEdit />
					</section>
				</div>

				<div class="rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-xl">
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-xs font-black tracking-[0.2em] text-slate-600 uppercase">
							Docker Deployment
						</h2>
						<div class="flex gap-4">
							<button
								onclick={() => (showDockerfile = !showDockerfile)}
								class="text-xs font-medium text-slate-400 transition-colors hover:text-slate-200"
							>
								{showDockerfile ? 'Hide Dockerfile' : 'Show Dockerfile'}
							</button>
							<button
								onclick={handleDownloadDockerfile}
								class="text-xs font-medium text-blue-400 transition-colors hover:text-blue-300"
							>
								Download Dockerfile
							</button>
						</div>
					</div>

					<div
						class="mb-6 rounded border border-blue-500/20 bg-blue-500/5 p-4 text-sm text-slate-400"
					>
						<p class="mb-3">
							To deploy your script, download the Dockerfile and use these commands to build and
							run:
						</p>
						<div class="space-y-4">
							<div>
								<span
									class="mb-1 block text-[10px] font-bold tracking-wider text-slate-500 uppercase"
								>
									Build and Start Cron
								</span>
								<div class="rounded bg-slate-950 p-3 font-mono text-xs text-blue-300">
									docker build -t croncode -f Dockerfile . && docker run --rm --network host croncode
								</div>
								</div>
								<div>
								<span class="mb-1 block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
									Run Immediately (Bypass Cron)
								</span>
								<div class="rounded bg-slate-950 p-3 font-mono text-xs text-indigo-300">
									docker run --rm --network host croncode {dockerConfig.runCommand}
								</div>
							</div>
						</div>
					</div>

					{#if showDockerfile}
						<div
							class="max-h-96 overflow-auto rounded border border-slate-700 bg-slate-950 p-4 text-sm"
						>
							<pre class="whitespace-pre-wrap font-mono text-slate-300">{dockerConfig.dockerfile}</pre>
						</div>

					{/if}
				</div>
			</div>
		{:else}
			<div class="space-y-8">
				<section id="api-config">
					<ApiKeyInput bind:showConfig={showApiConfig} />
				</section>

				<section
					class="flex flex-col justify-center rounded-lg border border-slate-800 p-6 text-center"
				>
					<div class="mb-4 text-4xl">🏗️</div>
					<h3 class="mb-2 text-xl font-semibold">Prompt Engine Coming Soon</h3>
					<p class="text-slate-400">
						Once configured, you'll be able to generate scripts in Node.js or Python with built-in
						crontab support.
					</p>
				</section>
			</div>
		{/if}
	</main>
</div>
