<script lang="ts">
	import { scriptState } from '$lib/script.svelte';
	import cronstrue from 'cronstrue';
	import { CronExpressionParser } from 'cron-parser';
	import { cronned } from '@jszkl/cronned';

	// Suggestions for Natural Language Building
	const suggestions = [
		{ label: 'Every minute', cron: '* * * * *', description: 'Runs every single minute' },
		{ label: 'Every hour', cron: '0 * * * *', description: 'Runs at the start of every hour' },
		{ label: 'Every day at midnight', cron: '0 0 * * *', description: 'Runs at 00:00 every day' },
		{ label: 'Every day at 4:00 AM', cron: '0 4 * * *', description: 'Runs at 04:00 every day' },
		{ label: 'Every Monday at 9:00 AM', cron: '0 9 * * 1', description: 'Runs at 09:00 every Monday' },
		{ label: 'Every weekday at 5:00 PM', cron: '0 17 * * 1-5', description: 'Runs Mon-Fri at 17:00' },
		{ label: 'Every 15 minutes', cron: '*/15 * * * *', description: 'Runs every 15 mins' }
	];

	let displayValue = $state(cronstrue.toString(scriptState.cron));
	let cronExpression = $state(scriptState.cron);
	let showSuggestions = $state(false);
	
	let explanation = $derived.by(() => {
		try {
			return cronstrue.toString(cronExpression);
		} catch {
			return 'Invalid cron expression';
		}
	});

	let nextRuns = $derived.by(() => {
		try {
			const interval = CronExpressionParser.parse(cronExpression);
			return [
				interval.next().toString(),
				interval.next().toString(),
				interval.next().toString()
			];
		} catch {
			return [];
		}
	});

	// Detect if input is a raw cron expression (5 parts)
	function isRawCron(val: string) {
		return /^(\S+\s+){4}\S+$/.test(val.trim());
	}

	function updateFromInput() {
		const term = displayValue.trim();
		if (!term) return;

		// 1. Check if it's a raw cron string
		if (isRawCron(term)) {
			try {
				CronExpressionParser.parse(term);
				cronExpression = term;
				scriptState.cron = term;
				return;
			} catch { /* ignore */ }
		}

		// 2. Try parsing as natural language
		try {
			const result = cronned(term);
			if (result && result.crons && result.crons.length > 0) {
				cronExpression = result.crons[0];
				scriptState.cron = result.crons[0];
			}
		} catch { /* ignore */ }
	}

	let smartMatch = $derived.by(() => {
		const term = displayValue.toLowerCase().trim();
		if (!term || isRawCron(term) || term.split(' ').length < 2) return null;
		
		try {
			const result = cronned(term);
			if (result && result.crons && result.crons.length > 0) {
				const cron = result.crons[0];
				// Only return if it's different from current value
				if (cron !== cronExpression) {
					return { label: term, cron, description: 'Parsed from natural language' };
				}
			}
		} catch { /* ignore */ }
		return null;
	});

	let filteredSuggestions = $derived.by(() => {
		const term = displayValue.toLowerCase().trim();
		if (!term) return suggestions;

		let list = suggestions.filter(s => 
			s.label.toLowerCase().includes(term) || 
			s.cron.includes(term)
		);
		
		if (smartMatch) {
			list = [
				{ label: `Smart Match: ${smartMatch.label}`, cron: smartMatch.cron, description: smartMatch.description },
				...list
			];
		}
		
		return list;
	});

	function selectSuggestion(suggestion: { label: string, cron: string }) {
		// Set display to the clean label (natural language)
		const cleanLabel = suggestion.label.replace(/^Smart Match: /, '');
		displayValue = cleanLabel.charAt(0).toUpperCase() + cleanLabel.slice(1);
		
		cronExpression = suggestion.cron;
		scriptState.cron = suggestion.cron;
		showSuggestions = false;
	}

	function finalize() {
		// If there's a smart match or a valid raw cron, we use it to clean up the display
		const match = filteredSuggestions[0];
		if (match && (displayValue.toLowerCase().trim() === match.label.toLowerCase().trim() || match.label.startsWith('Smart Match'))) {
			selectSuggestion(match);
		} else {
			// Otherwise just close suggestions
			showSuggestions = false;
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			finalize();
		}
	}

	function handleContainerFocusOut(e: FocusEvent) {
		const target = e.relatedTarget as HTMLElement;
		// Only finalize if focus is moving outside the input + suggestions container
		if (!e.currentTarget || !(e.currentTarget as HTMLElement).contains(target)) {
			finalize();
		}
	}
</script>

<div class="rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-2xl transition-all duration-300">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h2 class="text-xl font-bold text-slate-100 flex items-center gap-2">
				<span class="text-blue-500">⏰</span> Cron Schedule Builder
			</h2>
			<p class="text-xs text-slate-500 mt-1 uppercase tracking-widest font-semibold">Natural Language Configuration</p>
		</div>
		<div class="hidden sm:flex gap-2">
			{#each suggestions.filter(s => ['* * * * *', '0 * * * *', '0 0 * * *'].includes(s.cron)) as quickSvelte}
				<button
					onclick={() => selectSuggestion(quickSvelte)}
					class="rounded-md bg-slate-800 px-3 py-1 text-xs font-bold text-slate-400 hover:bg-slate-700 hover:text-blue-400 transition-all border border-slate-700"
				>
					{quickSvelte.cron === '* * * * *' ? 'Minutely' : quickSvelte.cron === '0 * * * *' ? 'Hourly' : 'Daily'}
				</button>
			{/each}
		</div>
	</div>

	<div class="grid gap-8 lg:grid-cols-5">
		<!-- Builder Section -->
		<div class="lg:col-span-3 space-y-6">
			<div class="relative" onfocusout={handleContainerFocusOut}>
				<label for="cron-input" class="mb-2 block text-sm font-semibold text-slate-400 flex justify-between">
					<span>Command Palette</span>
					<span class="text-[10px] text-slate-600">Tab to browse suggestions</span>
				</label>
				<div class="group relative">
					<input
						id="cron-input"
						type="text"
						bind:value={displayValue}
						oninput={() => {
							updateFromInput();
							showSuggestions = true;
						}}
						onfocus={() => showSuggestions = true}
						onkeydown={handleKeyDown}
						placeholder="Try 'Every day at 6pm' or '0 0 * * *'"
						class="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-3 text-lg text-slate-100 placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all shadow-inner"
					/>
					
					{#if showSuggestions}
						<div 
							class="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 p-1 shadow-2xl backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-200"
							role="listbox"
						>
							{#each filteredSuggestions as suggestion, i}
								<button
									onclick={() => selectSuggestion(suggestion)}
									class="flex w-full flex-col rounded-md px-3 py-2 text-left hover:bg-blue-600/20 focus:bg-blue-600/20 focus:outline-none group transition-colors"
									role="option"
									aria-selected={i === 0}
								>
									<span class="text-sm font-bold text-slate-200 group-hover:text-blue-400 group-focus:text-blue-400">
										{#if suggestion.label.startsWith('Smart Match')}
											<span class="text-blue-400">✨ {suggestion.label}</span>
										{:else}
											{suggestion.label}
										{/if}
									</span>
									<span class="text-[10px] text-slate-500 font-mono group-hover:text-slate-400 group-focus:text-slate-400">{suggestion.cron} — {suggestion.description}</span>
								</button>
							{/each}
							{#if filteredSuggestions.length === 0}
								<div class="px-3 py-4 text-center text-xs text-slate-500 italic">
									No matching patterns found.
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>

			<div class="flex gap-4">
				<div class="flex-1 rounded-xl bg-blue-600/5 p-5 border border-blue-500/20">
					<h3 class="text-[10px] font-bold uppercase tracking-widest text-blue-500/60 mb-2">Current Expression</h3>
					<div class="flex items-center gap-3">
						<code class="text-2xl font-black text-blue-400 tracking-tighter">{cronExpression}</code>
					</div>
				</div>
				<div class="flex-1 rounded-xl bg-slate-800/30 p-5 border border-slate-700/50">
					<h3 class="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Human Summary</h3>
					<p class="text-lg font-medium text-slate-300 leading-tight">
						{explanation}
					</p>
				</div>
			</div>
		</div>

		<!-- Metadata Section -->
		<div class="lg:col-span-2 space-y-6">
			<div class="rounded-xl bg-slate-950 p-6 border border-slate-800/50 h-full">
				<h3 class="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
					<span class="h-1 w-1 rounded-full bg-green-500 animate-pulse"></span>
					Timeline (Local Time)
				</h3>
				
				{#if nextRuns.length > 0}
					<div class="relative space-y-6 before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-16px)] before:w-[1px] before:bg-slate-800">
						{#each nextRuns as run, i}
							<div class="relative pl-8">
								<div class="absolute left-0 top-1.5 h-6 w-6 rounded-full border border-slate-800 bg-slate-950 p-1 flex items-center justify-center">
									<div class="h-full w-full rounded-full bg-blue-600/20 flex items-center justify-center">
										<span class="text-[8px] font-bold text-blue-500">{i + 1}</span>
									</div>
								</div>
								<div>
									<p class="text-xs font-bold text-slate-200">Next Occurrence</p>
									<p class="text-[11px] font-mono text-slate-500 mt-0.5">{run}</p>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="flex flex-col items-center justify-center h-full py-8 text-center">
						<div class="text-2xl opacity-20 mb-2">⚙️</div>
						<p class="text-xs text-slate-600 italic leading-relaxed">
							Waiting for a valid cron expression to calculate timeline...
						</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
