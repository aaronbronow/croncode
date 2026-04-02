<script lang="ts">
	import ApiKeyInput from '$lib/components/ApiKeyInput.svelte';
	import { isDemoMode } from '$lib/keys.svelte';
</script>

<div class="min-h-screen bg-slate-950 px-4 py-12 font-sans text-slate-100 selection:bg-blue-500/30">
	<main class="mx-auto max-w-4xl">
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

		<div class="grid gap-8 md:grid-cols-2">
			<section>
				<ApiKeyInput />
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
	</main>
</div>
