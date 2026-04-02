# croncode.ai

A minimalist AI code generator for your recurring scripts. Generate Node.js or Python scripts with built-in crontab support.

## Getting Started

### Local Setup

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Start the development server:**
    ```bash
    npm run dev
    ```

### Docker Setup

If you prefer using Docker:

```bash
docker compose up
```

The app will be available at `http://localhost:5173`.

## Tech Stack

- **Framework:** [SvelteKit](https://kit.svelte.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)

## Available Commands

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run check`: Run Svelte and TypeScript checks
- `npm run lint`: Run Prettier and ESLint
- `npm run format`: Format code with Prettier
