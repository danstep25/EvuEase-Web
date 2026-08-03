# EvuEase Web (Frontend)

Angular web application for EvuEase / EvalEase (Admin, Registrar, Evaluator, and Student portals).

## Specifications

| Item | Value |
|------|--------|
| Framework | Angular **18** (standalone components) |
| Language | TypeScript ~5.4 |
| Styling | Tailwind CSS 3 + SCSS |
| Package manager | npm |
| Node.js | **18.x or higher** (20 LTS recommended) |
| Dev server | `http://localhost:4200` |
| API (default) | `https://localhost:7252/api` |

Configure the API base URL in:

- `src/environments/environment.ts` (development)
- `src/environments/environment.prod.ts` (production)

---

## Required software / packages

| Software | Required? | Purpose |
|----------|-----------|---------|
| **Node.js** | Yes | JavaScript runtime (**18+**, 20 LTS recommended) |
| **npm** | Yes | Package manager (installed with Node.js) |
| **Modern browser** | Yes | Chrome / Edge / Firefox for the UI |
| **Backend API running** | Yes | Frontend calls `https://localhost:7252/api` |
| **Git** | Optional | Clone the repository |

**Installed by `npm install` (from `package.json` — no global install needed):**

- Angular 18 (`@angular/*`)
- TypeScript, RxJS, Zone.js
- Tailwind CSS, PostCSS, Autoprefixer
- Angular CLI / build tools (via local `node_modules`)

You do **not** need a global Angular CLI (`npm install -g @angular/cli`) unless you prefer it. Use `npm start` after installing dependencies.

## Prerequisites by OS

### Windows

1. Install [Node.js 20 LTS](https://nodejs.org/) (includes npm).
2. Optional: [Git for Windows](https://git-scm.com/download/win).
3. Ensure the backend API is running (see [Backend README](../EvuEase-API/README.md)).

Verify:

```powershell
node -v
npm -v
```

### macOS

1. Install Node.js 20 LTS via [nodejs.org](https://nodejs.org/) or Homebrew:

```bash
brew install node@20
```

2. Optional: Xcode Command Line Tools (`xcode-select --install`) if build tools are missing.

Verify:

```bash
node -v
npm -v
```

### Linux

1. Install Node.js 20 LTS using your package manager or [NodeSource / nvm](https://nodejs.org/).

Example with **nvm**:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# restart shell, then:
nvm install 20
nvm use 20
```

Verify:

```bash
node -v
npm -v
```

---

## Setup and run

Do this after the API and database are available.

### 1. Install dependencies

**Windows (PowerShell):**

```powershell
cd EvuEase-Web
npm install
```

**macOS / Linux:**

```bash
cd EvuEase-Web
npm install
```

### 2. Point to the API

Edit `src/environments/environment.ts` if your API URL differs:

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://localhost:7252/api',
  apiVersion: 'v1',
  useMockAuth: false
};
```

If you run the API on HTTP only:

```typescript
apiUrl: 'http://localhost:5218/api',
```

CORS on the API must allow `http://localhost:4200`.

### 3. Start the development server

```bash
npm start
```

This runs `ng serve`. Open:

`http://localhost:4200/`

### 4. Production build

```bash
npm run build
```

Output is written under `dist/`.

---

## Available scripts

| Script | Command | Description |
|--------|---------|-------------|
| Start | `npm start` | Dev server (`ng serve`) |
| Build | `npm run build` | Production build |
| Watch | `npm run watch` | Build and watch (development config) |
| Test | `npm test` | Unit tests (Karma/Jasmine) |

---

## Project structure (high level)

```
EvuEase-Web/
├── src/
│   ├── app/
│   │   ├── pages/           # Admin, Registrar, Evaluator, StudentPortal, Auth
│   │   ├── core/            # Guards, models, interceptors, services
│   │   ├── shared/          # Shared UI, constants, utilities
│   │   └── app.routes.ts
│   ├── environments/
│   ├── styles.scss
│   └── index.html
├── angular.json
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## Portals

After login, routes are role-based, for example:

| Portal | Path prefix |
|--------|-------------|
| Admin | `/admin` |
| Registrar | `/registrar` |
| Evaluator | `/evaluator` |
| Student | `/student_portal` |

Use accounts that exist in your database (seed or create via Admin → User Management). Older demo-only credentials in docs may not match a fresh database.

---

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| `npm install` fails | Use Node 18+; delete `node_modules` and `package-lock.json`, then `npm install` again |
| Blank page / API errors | Confirm API is running and `environment.apiUrl` is correct |
| CORS blocked | Add `http://localhost:4200` to API `Cors:AllowedOrigins` |
| HTTPS certificate warning to API | Trust .NET dev cert (`dotnet dev-certs https --trust`) or use HTTP API URL |
| Port 4200 in use | `npx ng serve --port 4300` and update API CORS if needed |

---

## Related

- Backend / database setup: [../EvuEase-API/README.md](../EvuEase-API/README.md)
- Repository overview: [../README.md](../README.md)
