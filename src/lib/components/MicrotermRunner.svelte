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

	// Slate Dark Theme for xterm.js
	const slateDark = {
		background: '#020617', // slate-950
		foreground: '#e2e8f0', // slate-200
		cursor: '#3b82f6', // blue-500
		black: '#0f172a', // slate-900
		red: '#f87171', // red-400
		green: '#4ade80', // green-400
		yellow: '#fbbf24', // yellow-400
		blue: '#60a5fa', // blue-400
		magenta: '#f472b6', // pink-400
		cyan: '#22d3ee', // cyan-400
		white: '#f1f5f9', // slate-100
		brightBlack: '#475569', // slate-500
		brightRed: '#ef4444', // red-500
		brightGreen: '#22c55e', // green-500
		brightYellow: '#f59e0b', // yellow-500
		brightBlue: '#3b82f6', // blue-500
		brightMagenta: '#ec4899', // pink-500
		brightCyan: '#06b6d4', // cyan-500
		brightWhite: '#ffffff'
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
				const cloudDevice = await CheerpX.CloudDevice.create(
					'wss://disks.webvm.io/debian_large_20230522_5044875331.ext2'
				);

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

				scriptState.webVmReady = true;
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
			theme: slateDark,
			fontSize: 12, // slightly more compact
			fontFamily: 'Menlo, Monaco, "Courier New", monospace',
			rows: 20
		});
		fitAddon = new FitAddon();
		terminal.loadAddon(fitAddon);
		terminal.open(terminalElement);
		fitAddon.fit();

		terminal.writeln(
			'\x1b[1;34m[System] Terminal Ready. Defaulting to WebContainer for Node.js.\x1b[0m'
		);
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

<div class="flex h-full flex-col">
	{#if isBooting}
		<div class="mb-2 flex items-center gap-3 px-2">
			<div
				class="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
			></div>
			<span class="text-xs font-medium text-slate-500">Booting Alpine guest...</span>
		</div>
	{/if}
	<div
		bind:this={terminalElement}
		class="flex-1 overflow-hidden rounded border border-slate-700 bg-[#002b36] p-2"
	></div>
</div>

<style>
	:global(.xterm-viewport) {
		background-color: #020617 !important;
	}
</style>
