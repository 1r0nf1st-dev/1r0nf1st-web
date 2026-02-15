## 1r0nf1st-website

Modern Next.js + React + TypeScript portfolio site with a separate Express API server. The frontend uses the Next.js App Router and proxies `/api` to the Express server, which handles external APIs (GitHub, Medium, Spotify, Strava, Brevo, etc.) and keeps tokens server-side. Includes user authentication (Supabase Auth), notes with TipTap, contact form, goal tracking, and more.

### Prerequisites

- **Node.js** (recommended: latest LTS)
- **pnpm** (this repo uses pnpm; install via `corepack enable` or `npm i -g pnpm`)
- **Supabase account** (free tier at https://supabase.com) – for auth, notes, and attachments

### Install dependencies

```bash
pnpm install
```

### Run the dev servers

The project runs two processes in development:

- **Frontend (Next.js)**: `http://localhost:3000` (Next.js default)
- **API server (Express)**: `http://localhost:3001`

Start both with:

```bash
pnpm dev
```

This runs type-checking first, then starts the API server and waits for its health check, then starts the Next.js dev server.

You can also run them separately:

- `pnpm dev:client` – Next.js frontend only
- `pnpm dev:server` – API server only
- `pnpm server` – Run API server once (no watch mode)
- `pnpm type-check` – TypeScript type-checking for frontend and backend

### Build for production

```bash
pnpm build
```

This builds:

- **Server**: TypeScript → `server/dist/`
- **Next.js**: Static/SSR output → `.next/`

### Run production build

After building:

```bash
pnpm start
```

This starts the Next.js production server. On Vercel, the API is handled by a serverless catchall function; locally, you can run the Express server with `pnpm start:server` if needed.

### Preview production build locally

```bash
pnpm preview
```

Runs `next build && next start` to simulate production.

### Deploy to Vercel

The project is configured for Vercel with Next.js as the framework:

1. **Connect the repo** to Vercel and import this project.
2. **Framework**: Next.js (auto-detected from `vercel.json`).
3. **Build command**: `pnpm build:server && pnpm build` (already in `vercel.json`).
4. **Environment variables**: In Vercel **Settings → Environment Variables**, add the same variables as in `.env.example`. See [Environment and API configuration](#environment-and-api-configuration) below.
5. **Deploy**: Push to your connected branch; Vercel builds and deploys. The site serves the Next.js app and routes `/api/*` to the Express backend via a serverless catchall.

### Lint and format

- **Lint** (ESLint, TypeScript, React, a11y):

  ```bash
  pnpm lint
  ```

- **Format** (Prettier):

  ```bash
  pnpm format
  ```

### Testing

The project uses **Vitest** with **React Testing Library** for component and hook tests.

- **Run all tests**:

  ```bash
  pnpm test
  ```

- **Watch mode**: `pnpm test:watch`
- **UI**: `pnpm test:ui`
- **Coverage**: `pnpm test:coverage`

Tests live next to source files with `.test.ts` or `.test.tsx` extensions.

### Environment and API configuration

1. **Create `.env`** in the project root:

   ```bash
   cp .env.example .env
   ```

   The Express server loads environment variables via `dotenv`.

2. **Server-side configuration** (Express API):

   - `GITHUB_USERNAME` – GitHub username for public repos (used on Cloud Infrastructure page).
   - `GITHUB_TOKEN` (optional) – Personal access token for higher GitHub rate limits.
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` – Supabase project credentials (required for auth and notes).
   - `BREVO_API_KEY`, `BREVO_FROM_EMAIL` – Brevo (Sendinblue) for contact form and transactional email.
   - `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID` (optional) – For deployment info on Cloud Infrastructure page.
   - `PORT` (optional) – API server port (default 3001).
   - `NODE_ENV` – `development` or `production`.
   - `ALLOWED_ORIGINS` – Comma-separated CORS origins for production.
   - `SITE_URL` – Public frontend URL (for password reset emails; Vercel sets `VERCEL_URL` automatically).

   See `.env.example` for the full list, including Medium, Dev.to, Spotify, Strava, OpenWeather, and optional integrations.

3. **Frontend configuration**:

   - `NEXT_PUBLIC_API_BASE_URL` (optional) – API base URL. Leave empty in development and on Vercel (uses relative `/api`). Set only if the API is on a different origin.

### Supabase setup

1. Create a Supabase project at https://supabase.com.
2. Enable **Email/Password** auth in Authentication → Providers.
3. Copy **Project URL**, **anon**, and **service_role** keys from Settings → API into `.env`.
4. Run migrations for notes, attachments, and storage – see `server/db/migrations/RUN_MIGRATIONS.md` for steps and RLS/Storage setup.

See [SUPABASE_AUTH_SETUP.md](./SUPABASE_AUTH_SETUP.md) for detailed auth setup.

### Features

#### Authentication (Supabase Auth)

- Registration and login
- Password change (authenticated users)
- Password reset (forgot password flow)
- Protected routes and session management
- JWT tokens in `localStorage` with refresh handling

#### Notes

- Rich-text editor (TipTap) with tables, task lists, images, links
- Notebooks and tags
- File attachments (Supabase Storage)
- Note sharing
- Version history and restore

#### Contact & Email

- Public contact form (Brevo)
- Domain auth (DKIM/DMARC) for custom sending domains
- Admin-only email send page

#### Routing

- `/` – Home (portfolio, Medium, Dev.to, Spotify, Weather, Quote, Joke, Contact)
- `/projects` – Project grid (Goal Tracker, Notes, Weather, Health, Cloud Infrastructure, Featured Showcase, etc.)
- `/projects/cloud` – Cloud Infrastructure (Vercel deployments, GitHub projects)
- `/projects/showcase` – Featured Showcase (Dev.to, Medium)
- `/notes` – Notes app (login required)
- `/login` – Login and registration
- `/change-password` – Change password (authenticated)
- `/forgot-password` – Password reset request

#### API endpoints (examples)

- `GET /api/github/repos`, `GET /api/github/commits`
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/change-password`, etc.
- `POST /api/contact` – Contact form submission
- `GET/POST/PUT/DELETE /api/notes/*` – Notes CRUD
- `GET/POST/PUT/DELETE /api/goals/*` – Goals CRUD
- Plus Medium, Dev.to, Spotify, Strava, Weather, Vercel, Quote, Joke, Logs, Email

### Project structure

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── login/
│   │   ├── notes/
│   │   ├── change-password/
│   │   ├── forgot-password/
│   │   └── projects/           # Project subpages
│   ├── views/                  # Page components
│   │   ├── HomePage.tsx
│   │   ├── NotesPage.tsx
│   │   ├── CloudInfrastructurePage.tsx
│   │   └── ...
│   ├── components/             # Reusable UI components
│   ├── contexts/               # React contexts (Auth, Theme)
│   └── ...
├── server/
│   ├── db/
│   │   ├── supabase.ts
│   │   └── migrations/         # SQL migrations
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── config.ts
│   └── index.ts
├── .env.example
└── vercel.json
```

### Security

- Supabase Auth for authentication and password hashing
- JWT-based protected routes and API endpoints
- CORS config via `ALLOWED_ORIGINS` in production
- Sensitive values in `.env` (git-ignored)
- RLS and storage policies – see `server/db/migrations/RUN_MIGRATIONS.md`

### Creating your first user

See [SUPABASE_AUTH_SETUP.md](./SUPABASE_AUTH_SETUP.md) for creating users via the Supabase dashboard or the app’s registration flow.
