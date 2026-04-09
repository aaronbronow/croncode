export interface HistoryEntry {
	id: string;
	version: string;
	timestamp: string;
	prompt?: string;
	code: string;
	language: string;
	cron: string;
}

const DEFAULT_STATE = {
	language: 'Node.js',
	activeLanguage: 'Node.js',
	result: '',
	cron: '0 0 * * *',
	promptText: '',
	isGenerating: false,
	isExecuting: false,
	error: '',
	executionOutput: '',
	activeScriptId: null as string | null,
	history: [] as HistoryEntry[],
	webContainerReady: false,
	webVmReady: false,
	ENABLE_WEBVM: false
};

function loadState() {
	if (typeof window === 'undefined') return DEFAULT_STATE;
	const saved = localStorage.getItem('croncode_session');
	if (!saved) return DEFAULT_STATE;
	try {
		const parsed = JSON.parse(saved);
		return { ...DEFAULT_STATE, ...parsed, isGenerating: false, isExecuting: false };
	} catch {
		return DEFAULT_STATE;
	}
}

export const scriptState = $state(loadState());

export function clearScriptState() {
	scriptState.language = DEFAULT_STATE.language;
	scriptState.activeLanguage = DEFAULT_STATE.activeLanguage;
	scriptState.result = DEFAULT_STATE.result;
	scriptState.cron = DEFAULT_STATE.cron;
	scriptState.promptText = DEFAULT_STATE.promptText;
	scriptState.activeScriptId = DEFAULT_STATE.activeScriptId;
	scriptState.history = [];
	scriptState.error = '';
	scriptState.executionOutput = '';
}
