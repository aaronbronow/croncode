import { browser } from '$app/environment';

export const keys = $state({
	gemini: (browser && localStorage.getItem('GEMINI_API_KEY')) || '',
	claude: (browser && localStorage.getItem('CLAUDE_API_KEY')) || ''
});

export const saveKeys = (gemini: string, claude: string) => {
	keys.gemini = gemini;
	keys.claude = claude;
	if (browser) {
		localStorage.setItem('GEMINI_API_KEY', gemini);
		localStorage.setItem('CLAUDE_API_KEY', claude);
	}
};

export const clearKeys = () => {
	keys.gemini = '';
	keys.claude = '';
	if (browser) {
		localStorage.removeItem('GEMINI_API_KEY');
		localStorage.removeItem('CLAUDE_API_KEY');
	}
};

export const isDemoMode = {
	get value() {
		return !keys.gemini;
	}
};
