# croncode.ai

A minimalist AI code generator for your recurring scripts. Generate Node.js, Python, or Bash scripts with built-in crontab support. Try it at https://croncode.ai

## Development Environments

There are three ways to run the development environment locally. All methods support Hot Module Replacement (HMR) and provide a consistent experience.

### 1. Standard Dev Mode (Vite)
Best for rapid UI development and general logic.
```bash
npm install
npm run dev
```
The app will be available at `http://localhost:5173`.

### 2. Cloudflare Wrangler Emulation
Best for testing Cloudflare-specific features and ensuring production compatibility before deploying to Cloudflare Pages.
```bash
npm install
npm run dev:wrangler
```
This builds the project and runs it using the local Wrangler Pages emulator.

### 3. Docker Compose
Best for a completely isolated environment or for contributors who prefer not to install Node.js locally.
```bash
docker compose up
```
The container automatically maps your host user's UID/GID to prevent permission issues with build caches. The app will be available at `http://localhost:5173`.

## API Key Configuration

The application requires API keys for Google Gemini and/or Anthropic Claude to generate scripts. There are two ways to provide these:

### 1. Environment Variables (`.env`)
You can create a `.env` file in the project root based on `.env.example`.
```bash
GEMINI_API_KEY=your_key_here
CLAUDE_API_KEY=your_key_here
```
When keys are provided via the environment, the server passes them to the client as defaults. On the first load, these keys are automatically saved to your browser's `localStorage`. This is ideal for private development instances where you want the app to be "ready-to-use" immediately.

### 2. In-App UI Configuration
If no environment variables are provided, or if you wish to override them, you can enter your API keys directly in the application's UI. These keys are stored only in your browser's `localStorage`. This allows users of a shared deployment to use their own personal API keys securely without them being stored on the server.

## In-Browser Script Verification

`croncode.ai` uses a **Hybrid Verification Engine** to allow you to test your generated scripts directly in the browser with high fidelity.

### Hybrid VM Architecture

| Language | Engine | Technology | Best For |
| :--- | :--- | :--- | :--- |
| **Node.js** | **WebContainer** | `@webcontainer/api` | Fast, native Node.js execution. |
| **Python** | **Microterm** | CheerpX (WebVM) | Standard Library & system tool testing. |
| **Bash** | **Microterm** | CheerpX (WebVM) | Full Linux `coreutils` fidelity (`date`, `curl`). |

### Key Differences

- **WebContainers (WebAssembly)**: Optimized for Node.js workflows. It provides a lightning-fast, Wasm-based micro-runtime that feels native to the browser but is limited to Node.js and basic shell commands.
- **Microterm (x86 Virtualization)**: Powered by Leaning Technologies' **CheerpX**, this is a full x86 virtualization layer. It boots a real Linux guest (Debian/Alpine) using WebSocket-based chunk streaming, providing a 100% compliant environment for complex Bash and Python scripts that require system-level binaries.

## Tech Stack

- **Framework:** [SvelteKit](https://kit.svelte.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Deployment:** [Cloudflare Pages](https://pages.cloudflare.com/)

## Available Commands

- `npm run dev`: Start standard Vite development server
- `npm run dev:wrangler`: Build and start local Cloudflare Wrangler emulator
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run check`: Run Svelte and TypeScript checks
- `npm run lint`: Run Prettier and ESLint
- `npm run format`: Format code with Prettier
