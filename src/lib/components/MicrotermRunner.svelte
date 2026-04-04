<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { scriptState } from '$lib/script.svelte';

	let terminalElement: HTMLDivElement;
	let terminal: any;
	let fitAddon: any;
	let cx: any = null;
	let dataDevice: any = null;
	let sendInput: any = null;
	let session: any = null;
	let isBooting = $state(false);

	// Solarized Dark Theme for xterm.js
	const solarizedDark = {
		background: '#002b36',
		foreground: '#839496',
		cursor: '#93a1a1',
		black: '#073642',
		red: '#dc322f',
		green: '#859900',
		yellow: '#b58900',
		blue: '#268bd2',
		magenta: '#d33682',
		cyan: '#2aa198',
		white: '#eee8d5',
		brightBlack: '#002b36',
		brightRed: '#cb4b16',
		brightGreen: '#586e75',
		brightYellow: '#657b83',
		brightBlue: '#839496',
		brightMagenta: '#6c71c4',
		brightCyan: '#93a1a1',
		brightWhite: '#fdf6e3'
	};

	let bootPromise: Promise<void> | null = null;

	export async function bootCheerpX() {
		if (cx) return;
		if (bootPromise) return bootPromise;

		bootPromise = (async () => {
			isBooting = true;
			terminal.writeln('\x1b[1;34m[System] Initializing Microterm (WebVM/CheerpX)...\x1b[0m');

			// 2. Load CheerpX Engine
			if (!(window as any).CheerpX) {
				await new Promise((resolve, reject) => {
					const script = document.createElement('script');
					script.src = 'https://cxrtnc.leaningtech.com/1.2.8/cx.js';
					script.setAttribute('crossorigin', 'anonymous');
					script.onload = resolve;
					script.onerror = reject;
					document.head.appendChild(script);
				});
			}

			try {
				// 3. Boot CheerpX
				const CheerpX = (window as any).CheerpX;
				if (!CheerpX) throw new Error('CheerpX engine failed to load from CDN');

				// CloudDevice for the OS image
				const cloudDevice = await CheerpX.CloudDevice.create('wss://disks.webvm.io/debian_large_20230522_5044875331.ext2');
				
				// IDBDevice + OverlayDevice to make the root filesystem writable (required for many bash operations)
				const idbDevice = await CheerpX.IDBDevice.create('microterm_root');
				const overlayDevice = await CheerpX.OverlayDevice.create(cloudDevice, idbDevice);
				
				// DataDevice for script injection
				dataDevice = await CheerpX.DataDevice.create();

				cx = await CheerpX.Linux.create({
					mounts: [
						{ type: 'ext2', path: '/', dev: overlayDevice },
						{ type: 'dir', path: '/data', dev: dataDevice },
						{ type: 'devs', path: '/dev' }
					]
				});

				// 4. Connect Terminal
				sendInput = cx.setCustomConsole(
					(buf: Uint8Array) => {
						terminal.write(new Uint8Array(buf));
					},
					terminal.cols,
					terminal.rows
				);

				terminal.onData((data: string) => {
					if (sendInput) {
						for (let i = 0; i < data.length; i++) {
							sendInput(data.charCodeAt(i));
						}
					}
				});

				// Run bash interactively
				cx.run('/bin/bash', ['--login']);

				// Small delay to let the shell initialize and display the prompt
				await new Promise((resolve) => setTimeout(resolve, 500));

				terminal.writeln('\x1b[1;32m[System] Microterm Ready.\x1b[0m');
			} catch (e: any) {
				console.error('[Microterm Error]', e);
				const msg = e?.message || e?.toString() || 'Unknown error';
				terminal.writeln(`\x1b[1;31m[System Error] Failed to boot Microterm: ${msg}\x1b[0m`);
				bootPromise = null; // Allow retry on failure
			} finally {
				isBooting = false;
			}
		})();

		return bootPromise;
	}

	onMount(async () => {
		// 1. Dynamically import xterm and its addons (only on client)
		const [{ Terminal }, { FitAddon }] = await Promise.all([
			import('@xterm/xterm'),
			import('@xterm/addon-fit')
		]);
		await import('@xterm/xterm/css/xterm.css');

		// 2. Initialize Terminal
		terminal = new Terminal({
			cursorBlink: true,
			convertEol: true,
			theme: solarizedDark,
			fontSize: 13,
			fontFamily: 'Menlo, Monaco, "Courier New", monospace',
			rows: 20
		});
		fitAddon = new FitAddon();
		terminal.loadAddon(fitAddon);
		terminal.open(terminalElement);
		fitAddon.fit();

		terminal.writeln('\x1b[1;34m[System] Terminal Ready. Defaulting to WebContainer for Node.js.\x1b[0m');
	});

	onDestroy(() => {
		if (terminal) terminal.dispose();
	});

	export function writeToTerminal(data: string) {
		if (terminal) terminal.write(data);
	}

	export function clearTerminal() {
		if (terminal) terminal.clear();
	}

	export async function runTest(code: string, language: string) {
		if (!cx) {
			await bootCheerpX();
		}
		if (!cx || !sendInput) return;

		const filename = language === 'Python' ? 'test.py' : 'test.sh';
		const tmpPath = `/tmp/${filename}`;
		const cmd = language === 'Python' ? `python3 ${tmpPath}` : `sh ${tmpPath}`;

		terminal.writeln(`\x1b[1;34m[System] Running ${language} script...\x1b[0m`);

		try {
			const base64Code = btoa(unescape(encodeURIComponent(code)));
			
			// Inject the file silently using a separate background process.
			// Using /bin/sh -c runs it non-interactively, which avoids the job control warning.
			await cx.run('/bin/sh', ['-c', `base64 -d << 'EOF' > ${tmpPath}\n${base64Code}\nEOF`]);
			
			// Now that the file is injected, just run the command in the interactive shell.
			// We prefix with \n to ensure we are at a clean prompt.
			const runCmd = `\n${cmd}\n`;
			for (let i = 0; i < runCmd.length; i++) {
				sendInput(runCmd.charCodeAt(i));
			}
		} catch (e: any) {
			console.error('[runTest Error]', e);
			const msg = e?.message || e?.toString() || 'Unknown error';
			terminal.writeln(`\x1b[1;31m[System Error] ${msg}\x1b[0m`);
		}
	}
</script>

<div class="flex flex-col h-full">
	{#if isBooting}
		<div class="flex items-center gap-3 mb-2 px-2">
			<div class="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
			<span class="text-xs font-medium text-slate-500">Booting Alpine guest...</span>
		</div>
	{/if}
	<div bind:this={terminalElement} class="flex-1 overflow-hidden rounded bg-[#002b36] p-2 border border-slate-700"></div>
</div>

<style>
	:global(.xterm-viewport) {
		background-color: #002b36 !important;
	}
</style>