import { WebContainer } from '@webcontainer/api';

let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

export async function bootWebContainer(onProgress?: (msg: string) => void): Promise<WebContainer> {
	if (webcontainerInstance) return webcontainerInstance;

	if (!bootPromise) {
		bootPromise = (async () => {
			if (onProgress) {
				onProgress('[System] Booting WebContainer (first run may take a few seconds)...\n');
			}
			const instance = await WebContainer.boot();
			webcontainerInstance = instance;
			return instance;
		})();
	}

	return bootPromise;
}

export async function executeScript(
	language: string,
	code: string,
	onOutput: (data: string) => void,
	onProgress?: (msg: string) => void
): Promise<void> {
	const wc = await bootWebContainer(onProgress);

	let filename = '';
	let command = '';
	let args: string[] = [];

	switch (language) {
		case 'Node.js':
			filename = 'index.js';
			command = 'node';
			args = [filename];
			break;
		case 'Python':
			filename = 'main.py';
			command = 'python3';
			args = [filename];
			break;
		case 'Bash':
			filename = 'script.sh';
			command = 'bash';
			args = [filename];
			break;
		default:
			throw new Error(`Unsupported language: ${language}`);
	}

	await wc.fs.writeFile(filename, code);

	const process = await wc.spawn(command, args);

	process.output.pipeTo(
		new WritableStream({
			write(data) {
				onOutput(data);
			}
		})
	);

	const exitCode = await process.exit;
	if (exitCode !== 0) {
		onOutput(`\n[System] Process exited with code ${exitCode}`);
	}
}