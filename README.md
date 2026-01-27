## 1r0nf1st-website

Modern Vite + React + TypeScript portfolio site with a separate Express API server. The frontend calls the local API server, which handles all external API requests (GitHub, etc.), keeping tokens and secrets server-side. Includes user authentication with Supabase database integration.

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
   - `JWT_SECRET` – secret key for JWT token signing. Generate a secure secret: `openssl rand -base64 32`. **IMPORTANT:** Change this to a strong random string in production.
   - `SUPABASE_URL` – your Supabase project URL (get from Supabase dashboard → Settings → API).
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

# Server - Authentication
JWT_SECRET=your-generated-secret-key-here

# Server - Supabase Database
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

After updating `.env`, restart the dev servers (`pnpm dev`) so both Vite and Express pick up the new environment variables.

### Supabase Database Setup

1. **Create a Supabase project** at https://supabase.com
2. **Get your credentials** from Supabase dashboard → Settings → API:
   - Copy the **Project URL** → `SUPABASE_URL`
   - Copy the **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`
3. **Create the users table** in Supabase SQL Editor:

   ```sql
   CREATE TABLE IF NOT EXISTS users (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     username VARCHAR(255) UNIQUE NOT NULL,
     password_hash TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
   ```

4. **Add credentials to `.env`** file (see example above)

The default admin user (`admin` / `admin123`) will be automatically created on first server startup if it doesn't exist.

### Features

#### Authentication

- **User Registration** – Create new user accounts with username and password
- **User Login** – Secure authentication with JWT tokens
- **Password Change** – Users can change their password (requires current password verification)
- **Protected Routes** – Routes that require authentication
- **Session Management** – JWT tokens stored in localStorage, auto-verification on page load

#### Routing

- **Home Page** (`/`) – Main portfolio page with GitHub projects
- **Projects Page** (`/projects`) – Grid view of all projects (20 placeholder projects)
- **Login Page** (`/login`) – User authentication (login/register)
- **Change Password Page** (`/change-password`) – Protected route for password changes

#### API Endpoints

- `GET /api/github/repos` – Fetch GitHub repositories
- `GET /api/github/commits` – Fetch commits for a repository
- `POST /api/auth/register` – Register a new user
- `POST /api/auth/login` – Login and get JWT token
- `GET /api/auth/verify` – Verify JWT token
- `POST /api/auth/change-password` – Change user password (protected)

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

- **Password Hashing** – All passwords are hashed with bcrypt (10 rounds) before storage
- **JWT Authentication** – Secure token-based authentication
- **Protected Routes** – Server-side route protection with JWT middleware
- **CORS Configuration** – Environment-based CORS settings for production
- **Environment Variables** – Sensitive data stored in `.env` (git-ignored)
- **No Password Exposure** – Passwords never logged or returned in API responses

### Default Credentials

For development/testing, a default admin user is automatically created:

- **Username:** `admin`
- **Password:** `admin123`

**⚠️ Important:** Change the default admin password after first login in production environments.
