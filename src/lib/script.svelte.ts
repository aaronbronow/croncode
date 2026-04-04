export const scriptState = $state({
	language: 'Node.js', // Target language for next generation
	activeLanguage: 'Node.js', // Language of the code currently in the editor
	result: '',
	cron: '0 0 * * *', // Default: Every day at midnight
	isGenerating: false,
	isExecuting: false,
	error: '',
	executionOutput: ''
});
