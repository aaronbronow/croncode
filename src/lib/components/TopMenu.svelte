<script lang="ts">
	let isOpen = $state(false);
	let { onToggleHistory, onToggleApiConfig } = $props();

	function toggleMenu() {
		isOpen = !isOpen;
	}

	function closeMenu() {
		isOpen = false;
	}
</script>

<div class="relative">
	<button
		onclick={toggleMenu}
		class="flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-400 transition-colors hover:border-slate-700 hover:text-slate-100"
		aria-label="Menu"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<line x1="4" y1="12" x2="20" y2="12"></line>
			<line x1="4" y1="6" x2="20" y2="6"></line>
			<line x1="4" y1="18" x2="20" y2="18"></line>
		</svg>
	</button>

	{#if isOpen}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="fixed inset-0 z-40" onclick={closeMenu}></div>

		<div
			class="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-lg border border-slate-700 bg-slate-900 p-2 shadow-2xl"
		>
			<button
				onclick={() => {
					onToggleHistory();
					closeMenu();
				}}
				class="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
			>
				Session History
			</button>
			<button
				onclick={() => {
					onToggleApiConfig();
					closeMenu();
				}}
				class="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
			>
				API Configuration
			</button>
			<a
				href="https://github.com/croncode/croncode"
				target="_blank"
				rel="noopener noreferrer"
				onclick={closeMenu}
				class="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
			>
				GitHub
			</a>
			<a
				href="https://croncode.net/"
				target="_blank"
				rel="noopener noreferrer"
				onclick={closeMenu}
				class="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
			>
				About
			</a>
		</div>
	{/if}
</div>
