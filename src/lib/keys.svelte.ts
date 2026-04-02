import { browser } from '$app/environment';

export const keys = $state({
	gemini: (browser && localStorage.getItem('GEMINI_API_KEY')) || '',
	claude: (browser && localStorage.getItem('CLAUDE_API_KEY')) || ''
});

export const appState = $state({
	geminiVerified: (browser && localStorage.getItem('GEMINI_KEY_VERIFIED') === 'true') || false,
	claudeVerified: (browser && localStorage.getItem('CLAUDE_KEY_VERIFIED') === 'true') || false,
	defaultModel: (browser && (localStorage.getItem('DEFAULT_MODEL') as 'gemini' | 'claude')) || 'gemini'
});

export const isAnyKeyVerified = {
	get value() {
		return appState.geminiVerified || appState.claudeVerified;
	}
};

export const setKeyVerified = (model: 'gemini' | 'claude', verified: boolean) => {
	if (model === 'gemini') {
		appState.geminiVerified = verified;
		if (browser) {
			if (verified) localStorage.setItem('GEMINI_KEY_VERIFIED', 'true');
			else localStorage.removeItem('GEMINI_KEY_VERIFIED');
		}
	} else {
		appState.claudeVerified = verified;
		if (browser) {
			if (verified) localStorage.setItem('CLAUDE_KEY_VERIFIED', 'true');
			else localStorage.removeItem('CLAUDE_KEY_VERIFIED');
		}
	}

	// Update default model if only one is verified
	if (verified) {
		if (model === 'gemini' && !appState.claudeVerified) setDefaultModel('gemini');
		if (model === 'claude' && !appState.geminiVerified) setDefaultModel('claude');
	}
};

export const setDefaultModel = (model: 'gemini' | 'claude') => {
	appState.defaultModel = model;
	if (browser) {
		localStorage.setItem('DEFAULT_MODEL', model);
	}
};

export const initDefaults = (defaults: { gemini: string; claude: string }) => {
	if (browser) {
		if (!localStorage.getItem('GEMINI_API_KEY') && defaults.gemini) {
			keys.gemini = defaults.gemini;
			localStorage.setItem('GEMINI_API_KEY', defaults.gemini);
			setKeyVerified('gemini', true);
		}
		if (!localStorage.getItem('CLAUDE_API_KEY') && defaults.claude) {
			keys.claude = defaults.claude;
			localStorage.setItem('CLAUDE_API_KEY', defaults.claude);
			setKeyVerified('claude', true);
		}
	}
};

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
	setKeyVerified('gemini', false);
	setKeyVerified('claude', false);
	if (browser) {
		localStorage.removeItem('GEMINI_API_KEY');
		localStorage.removeItem('CLAUDE_API_KEY');
		localStorage.removeItem('DEFAULT_MODEL');
	}
};

export const isDemoMode = {
	get value() {
		return !keys.gemini;
	}
};
