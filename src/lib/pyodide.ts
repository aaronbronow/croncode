import { scriptState } from './script.svelte.ts';

let pyodideInstance: any = null;
let loadPromise: Promise<any> | null = null;

export async function loadPyodideRuntime(onProgress?: (msg: string) => void) {
	if (pyodideInstance) return pyodideInstance;
	if (loadPromise) return loadPromise;

	loadPromise = (async () => {
		if (onProgress) onProgress('[System] Loading Python runtime (Pyodide)...\n');

		// 1. Load Pyodide script from CDN
		if (!(window as any).loadPyodide) {
			await new Promise((resolve, reject) => {
				const script = document.createElement('script');
				script.src = 'https://cdn.jsdelivr.net/pyodide/v0.27.3/full/pyodide.js';
				script.onload = resolve;
				script.onerror = reject;
				document.head.appendChild(script);
			});
		}

		// 2. Initialize Pyodide
		const loadPyodide = (window as any).loadPyodide;
		const pyodide = await loadPyodide({
			indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.3/full/'
		});

		// 3. Load micropip and pyodide-http for networking patch
		await pyodide.loadPackage('micropip');
		const micropip = pyodide.pyimport('micropip');
		await micropip.install('pyodide-http');

		// 4. Patch the standard library (urllib, requests, etc.) to use browser fetch
		pyodide.runPython(`
import pyodide_http
pyodide_http.patch_all()
        `);

		pyodideInstance = pyodide;
		return pyodide;
	})();

	return loadPromise;
}

export async function executePython(
	code: string,
	onOutput: (data: string) => void,
	onProgress?: (msg: string) => void
) {
	try {
		const pyodide = await loadPyodideRuntime(onProgress);

		// Redirect stdout/stderr to our callback
		pyodide.setStdout({
			batched: (data: string) => onOutput(data + '\n')
		});
		pyodide.setStderr({
			batched: (data: string) => onOutput(`\x1b[1;31m${data}\x1b[0m\n`)
		});

		if (onProgress) onProgress('[System] Executing Python script...\n');

		// Run the code
		await pyodide.runPythonAsync(code);
	} catch (error: any) {
		console.error('[Pyodide Error]', error);
		onOutput(`\x1b[1;31m[Python Error] ${error.message || error.toString()}\x1b[0m\n`);
	}
}
