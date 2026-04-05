<script lang="ts">
	import { scriptState } from '$lib/script.svelte';
	import { formatCronForPalette } from '$lib/cronFormat';
	import { CronExpressionParser } from 'cron-parser';
	import { cronned } from '@jszkl/cronned';

	let showSuggestions = $state(false);
	let nlInput = $state('');
	let isNlFocused = $state(false);
	
	const suggestions = [
		{ label: 'minute', cron: '* * * * *' },
		{ label: 'hour', cron: '0 * * * *' },
		{ label: 'day at midnight', cron: '0 0 * * *' },
		{ label: '15 minutes', cron: '*/15 * * * *' },
		{ label: 'weekday at 9am', cron: '0 9 * * 1-5' }
	];

	let lastValidCron = $state(scriptState.cron);

	// Sync nlInput with scriptState.cron whenever cron changes or focus shifts
	$effect(() => {
		const currentCron = scriptState.cron;
		try {
			CronExpressionParser.parse(currentCron);
			lastValidCron = currentCron;
			if (!isNlFocused) {
				nlInput = formatCronForPalette(currentCron);
			}
		} catch {
			if (!isNlFocused) {
				nlInput = '';
			}
		}
	});

	let nextRuns = $derived.by(() => {
		try {
			const interval = CronExpressionParser.parse(scriptState.cron);
			const runs = [];
			for (let i = 0; i < 10; i++) {
				runs.push(interval.next().toDate());
			}
			return runs;
		} catch {
			return [];
		}
	});

	function parseNL(val: string) {
		const term = val.trim().toLowerCase();
		if (!term) return null;

		// Prepend "every " if missing to help the parser recognize frequencies
		const query = term.startsWith('every') || term.startsWith('at') ? term : `every ${term}`;

		try {
			const result = cronned(query) as any;
			if (result && result.crons && result.crons.length > 0) {
				// Only return the cron if it's not the default * * * * * 
				// UNLESS the user actually typed "minute"
				const cron = result.crons[0];
				if (cron !== '* * * * *' || term.includes('min')) {
					return cron;
				}
			}
		} catch { /* ignore */ }
		return null;
	}

	function handleNLInput(val: string) {
		nlInput = val;
		const cron = parseNL(val);
		if (cron) {
			scriptState.cron = cron;
		}
	}

	function selectSuggestion(suggestion: { label: string, cron: string }) {
		scriptState.cron = suggestion.cron;
		nlInput = suggestion.label;
		showSuggestions = false;
	}

	let filteredSuggestions = $derived.by(() => {
		const term = nlInput.toLowerCase().trim();
		if (!term) return suggestions;
		return suggestions.filter(s => 
			s.label.toLowerCase().includes(term)
		);
	});

	function handleFocusOut(e: FocusEvent) {
		const target = e.relatedTarget as HTMLElement;
		if (!e.currentTarget || !(e.currentTarget as HTMLElement).contains(target)) {
			// Auto-complete common shorthand before blurring
			let val = nlInput.trim().toLowerCase();
			if (val.endsWith(' p')) val += 'm';
			else if (val.endsWith(' a')) val += 'm';

			const cron = parseNL(val);
			if (cron) {
				scriptState.cron = cron;
			}

			showSuggestions = false;
			isNlFocused = false;
		}
	}

	function handleCronBlur() {
		try {
			CronExpressionParser.parse(scriptState.cron);
		} catch {
			scriptState.cron = lastValidCron;
		}
	}
</script>

<div class="rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-4">
	<div class="grid gap-4 md:grid-cols-[1fr_10rem]">
		<!-- Column 1: Every... (Command Palette) -->
		<div class="relative" onfocusout={handleFocusOut}>
			<label for="every-input" class="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
				Every...
			</label>
			<input
				id="every-input"
				type="text"
				bind:value={nlInput}
				oninput={(e) => handleNLInput(e.currentTarget.value)}
				onfocus={() => { showSuggestions = true; isNlFocused = true; }}
				placeholder="minute"
				class="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none transition-colors"
			/>
			
			{#if showSuggestions && filteredSuggestions.length > 0}
				<div class="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded border border-slate-700 bg-slate-900 shadow-2xl">
					{#each filteredSuggestions as suggestion}
						<button
							onclick={() => selectSuggestion(suggestion)}
							class="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
						>
							<span>{suggestion.label}</span>
							<span class="text-[10px] font-mono text-slate-500">{suggestion.cron}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Column 2: Expression... (Cron Syntax) -->
		<div class="min-w-0">
			<label for="expression-input" class="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
				Expression...
			</label>
			<input
				id="expression-input"
				type="text"
				bind:value={scriptState.cron}
				onblur={handleCronBlur}
				placeholder="* * * * *"
				class="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-sm text-blue-400 focus:border-blue-500 focus:outline-none transition-colors"
			/>
		</div>
	</div>

	<!-- Row 2: Next run at... -->
	<div class="relative">
		<span class="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
			Next run at...
		</span>
		
		<div class="relative">
			<div class="flex gap-6 overflow-hidden whitespace-nowrap pr-12">
				{#if nextRuns.length > 0}
					{#each nextRuns as run}
						<div class="flex flex-col border-l border-slate-700 pl-3 first:border-0 first:pl-0">
							<span class="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
								{run.toLocaleString(undefined, { month: 'short', day: 'numeric' })}
							</span>
							<span class="text-sm font-mono text-slate-300">
								{run.toLocaleString(undefined, { hour: '2-digit', minute: '2-digit' })}
							</span>
						</div>
					{/each}
				{:else}
					<div class="text-xs italic text-slate-600">Invalid expression</div>
				{/if}
			</div>
			
			<!-- Fade-out mask -->
			<div class="absolute inset-y-0 right-0 w-24 bg-gradient-to-r from-transparent to-slate-900 pointer-events-none"></div>
		</div>
	</div>
</div>
