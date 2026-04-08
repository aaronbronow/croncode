import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

let commitHash = 'unknown';
try {
	commitHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch (e) {
	if (process.env.CF_PAGES_COMMIT_SHA) {
		commitHash = process.env.CF_PAGES_COMMIT_SHA.substring(0, 7);
	}
}

export default defineConfig({
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version),
		__COMMIT_HASH__: JSON.stringify(commitHash)
	},
	plugins: [tailwindcss(), sveltekit()],
	server: {
		host: true,
		allowedHosts: true,
		watch: { usePolling: true },
		headers: {
			'Cross-Origin-Embedder-Policy': 'require-corp',
			'Cross-Origin-Opener-Policy': 'same-origin'
		}
	}
});
