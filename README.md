## 1r0nf1st-website

Modern Vite + React + TypeScript portfolio site with a separate Express API server. The frontend calls the local API server, which handles all external API requests (GitHub, etc.), keeping tokens and secrets server-side.

### Prerequisites

- **Node.js** (recommended: latest LTS)
- **pnpm** (this repo uses pnpm; install via `corepack enable` or `npm i -g pnpm`)

### Install dependencies

```bash
pnpm install
```

### Run the dev servers

The project runs two servers in development:

- **Frontend (Vite)**: `http://localhost:5173`
- **API server (Express)**: `http://localhost:3001`

Start both with:

```bash
pnpm dev
```

This runs both servers concurrently. You can also run them separately:

- `pnpm dev:client` - Frontend only
- `pnpm dev:server` - API server only
- `pnpm server` - Run API server once (no watch mode)

### Build for production

```bash
pnpm build
```

### Preview the production build

```bash
pnpm preview
```

### Lint and format

- **Lint** (ESLint, TypeScript, React, a11y):

  ```bash
  pnpm lint
  ```

- **Format** (Prettier):

  ```bash
  pnpm format
  ```

### Environment and API configuration

1. **Create your env file** (in the project root):

   ```bash
   cp .env.example .env
   ```

   The Express server automatically loads environment variables from `.env` using `dotenv`.

2. **Server-side configuration** (used by Express API server):
   - `GITHUB_USERNAME` – your GitHub username (used to fetch public repos).
   - `GITHUB_TOKEN` (optional) – personal access token for higher GitHub rate limits.  
     **Never commit this**; `.env` is already git-ignored.
   - `PORT` (optional) – API server port (defaults to 3001).
   - `PUBLIC_API_BASE` (optional) – base URL for any other public REST API you want to call.

3. **Frontend configuration**:
   - `VITE_API_BASE_URL` (optional) – API server URL (defaults to `http://localhost:3001`).

**Example `.env` file:**

```bash
# Frontend
VITE_API_BASE_URL=http://localhost:3001

# Server
GITHUB_USERNAME=your-github-username
GITHUB_TOKEN=ghp_your_token_here
PORT=3001
```

After updating `.env`, restart the dev servers (`pnpm dev`) so both Vite and Express pick up the new environment variables.

### Project structure

- `/src` - React frontend (Vite)
- `/server` - Express API server
  - `/server/routes` - API route handlers
  - `/server/services` - Business logic for external API calls
