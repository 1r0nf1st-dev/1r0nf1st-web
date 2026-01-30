## 1r0nf1st-website

Modern Vite + React + TypeScript portfolio site with a separate Express API server. The frontend calls the local API server, which handles all external API requests (GitHub, etc.), keeping tokens and secrets server-side. Includes user authentication powered by Supabase Auth.

### Prerequisites

- **Node.js** (recommended: latest LTS)
- **pnpm** (this repo uses pnpm; install via `corepack enable` or `npm i -g pnpm`)
- **Supabase account** (free tier available at https://supabase.com) - for user authentication database

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

**Note:** The `dev` script automatically runs TypeScript type-checking before starting the servers. If there are type errors, the servers won't start.

You can also run them separately:

- `pnpm dev:client` - Frontend only
- `pnpm dev:server` - API server only
- `pnpm server` - Run API server once (no watch mode)
- `pnpm type-check` - Run TypeScript type-checking for both frontend and backend

### Build for production

```bash
pnpm build
```

This builds both the frontend and backend:

- `pnpm build:client` - Builds React frontend (outputs to `dist/`)
- `pnpm build:server` - Compiles TypeScript server (outputs to `server/dist/`)

### Run production server

After building:

```bash
pnpm start:server
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

### Testing

The project uses **Vitest** for testing with **React Testing Library** for component tests.

- **Run all tests**:

  ```bash
  pnpm test
  ```

- **Run tests in watch mode**:

  ```bash
  pnpm test:watch
  ```

- **Run tests with UI**:

  ```bash
  pnpm test:ui
  ```

- **Generate coverage report**:

  ```bash
  pnpm test:coverage
  ```

Tests are located alongside source files with `.test.ts` or `.test.tsx` extensions. The test setup includes:

- **Frontend tests**: React components, hooks, and utilities using React Testing Library
- **Server tests**: Express routes, middleware, and services
- **Mocking**: API calls, localStorage, and external dependencies are mocked for isolated testing

Test files follow the naming convention: `*.test.{ts,tsx}` and are automatically discovered by Vitest.

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
   - `NODE_ENV` (optional) – environment mode: `development` or `production` (defaults to `development`).
   - `ALLOWED_ORIGINS` (optional) – comma-separated list of allowed CORS origins for production (e.g., `https://yoursite.com,https://www.yoursite.com`). Leave unset for development (allows all origins).
   - `SUPABASE_URL` – your Supabase project URL (get from Supabase dashboard → Settings → API).
   - `SUPABASE_ANON_KEY` – your Supabase anon/public key (get from Supabase dashboard → Settings → API). Safe for client-side use.
   - `SUPABASE_SERVICE_ROLE_KEY` – your Supabase service role key (get from Supabase dashboard → Settings → API). **IMPORTANT:** Use the `service_role` key, NOT the `anon` key. Keep this secret and never expose it in client-side code.

3. **Frontend configuration**:
   - `VITE_API_BASE_URL` (optional) – API server URL. Leave empty or unset for development (uses `/api` with Vite proxy). Set to full URL for production (e.g., `https://api.yoursite.com`).

**Example `.env` file:**

```bash
# Frontend
VITE_API_BASE_URL=http://localhost:3001

# Server - GitHub
GITHUB_USERNAME=your-github-username
GITHUB_TOKEN=ghp_your_token_here
PORT=3001

# Server - Environment
NODE_ENV=development

# Server - Supabase Auth
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

After updating `.env`, restart the dev servers (`pnpm dev`) so both Vite and Express pick up the new environment variables.

### Supabase Auth Setup

1. **Create a Supabase project** at https://supabase.com
2. **Enable Email/Password Authentication**:
   - Go to **Authentication** → **Providers** in your Supabase dashboard
   - Ensure **Email** provider is enabled
   - For development, disable "Confirm email" (enable for production)
3. **Get your credentials** from Supabase dashboard → Settings → API:
   - Copy the **Project URL** → `SUPABASE_URL`
   - Copy the **anon public** key → `SUPABASE_ANON_KEY`
   - Copy the **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`
4. **Add credentials to `.env`** file (see example above)
5. **Create your first user**:
   - Option A: Via Supabase Dashboard → Authentication → Users → Add user
   - Option B: Via your app at `/login` → Register

See [SUPABASE_AUTH_SETUP.md](./SUPABASE_AUTH_SETUP.md) for detailed setup instructions.

### Features

#### Authentication (Powered by Supabase Auth)

- **User Registration** – Create new user accounts with email and password
- **User Login** – Secure authentication with Supabase JWT tokens
- **Password Change** – Users can change their password (when authenticated)
- **Protected Routes** – Routes that require authentication
- **Session Management** – JWT tokens stored in localStorage, auto-verification on page load
- **Email Verification** – Optional email confirmation (configurable in Supabase dashboard)
- **Token Refresh** – Automatic token refresh handling

#### Routing

- **Home Page** (`/`) – Main portfolio page with GitHub projects
- **Projects Page** (`/projects`) – Grid view of all projects (20 placeholder projects)
- **Login Page** (`/login`) – User authentication (login/register)
- **Change Password Page** (`/change-password`) – Protected route for password changes

#### API Endpoints

- `GET /api/github/repos` – Fetch GitHub repositories
- `GET /api/github/commits` – Fetch commits for a repository
- `POST /api/auth/register` – Register a new user (email + password)
- `POST /api/auth/login` – Login and get Supabase JWT token
- `GET /api/auth/verify` – Verify JWT token
- `POST /api/auth/refresh` – Refresh access token
- `POST /api/auth/change-password` – Change user password (protected)
- `POST /api/auth/logout` – Logout and invalidate session

### Project structure

```
├── src/                          # React frontend (Vite)
│   ├── components/              # Reusable React components
│   │   ├── Footer.tsx
│   │   ├── GitHubProjects.tsx
│   │   ├── Hero.tsx
│   │   ├── InfoCard.tsx
│   │   ├── ProjectsPage.tsx
│   │   └── ProtectedRoute.tsx
│   ├── contexts/                # React contexts
│   │   └── AuthContext.tsx     # Authentication state management
│   ├── pages/                   # Page components
│   │   ├── HomePage.tsx
│   │   ├── LoginPage.tsx
│   │   └── ChangePasswordPage.tsx
│   ├── apiClient.ts             # Generic API client with auth
│   ├── config.ts                # Frontend configuration
│   ├── useGitHubRepos.ts        # Hook for GitHub repos
│   ├── useGitHubCommits.ts      # Hook for GitHub commits
│   ├── App.tsx                  # Main app component with routes
│   └── main.tsx                 # Entry point
├── server/                      # Express API server
│   ├── db/                      # Database configuration
│   │   ├── supabase.ts         # Supabase client setup
│   │   └── migrations/         # SQL migration files
│   ├── middleware/             # Express middleware
│   │   └── auth.ts             # JWT authentication middleware
│   ├── routes/                  # API route handlers
│   │   ├── github.ts           # GitHub API routes
│   │   └── auth.ts             # Authentication routes
│   ├── services/                # Business logic
│   │   └── githubService.ts    # GitHub API integration
│   ├── config.ts               # Server configuration
│   └── index.ts                # Server entry point
└── .env.example                # Environment variables template
```

### Security Features

- **Supabase Auth** – Professional-grade authentication with built-in security
- **Password Hashing** – Automatic secure password hashing (managed by Supabase)
- **JWT Authentication** – Secure token-based authentication with automatic refresh
- **Protected Routes** – Server-side route protection with Supabase token verification
- **CORS Configuration** – Environment-based CORS settings for production
- **Environment Variables** – Sensitive data stored in `.env` (git-ignored)
- **No Password Exposure** – Passwords never logged or returned in API responses
- **Row Level Security** – Can be configured with Supabase RLS policies

### Creating Your First User

See [SUPABASE_AUTH_SETUP.md](./SUPABASE_AUTH_SETUP.md) for instructions on creating your first user via the Supabase dashboard or your application.


