import cronstrue from 'cronstrue';

export function formatCronForPalette(cronStr: string): string {
	const parts = cronStr.trim().split(/\s+/);
	if (parts.length !== 5) return '';

	const normalized = parts.join(' ');

	// Exact common matches for perfect phrasing in the UI
	const exactMatches: Record<string, string> = {
		'* * * * *': 'minute',
		'0 * * * *': 'hour',
		'0 0 * * *': 'day at midnight',
		'0 12 * * *': 'day at noon',
		'0 9 * * 1-5': 'weekday at 9:00 AM',
		'*/15 * * * *': '15 minutes'
	};

	if (exactMatches[normalized]) {
		return exactMatches[normalized];
	}

	try {
		let human = cronstrue.toString(normalized);
		// Clean up the string to flow grammatically after "Every..."
		human = human.replace(/^(Every|At)\s+/i, '');
		if (human.length > 0) {
			human = human.charAt(0).toLowerCase() + human.slice(1);
		}
		return human;
	} catch {
		return '';
	}
}
