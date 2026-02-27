# Clawti Frontend — Colleague Onboarding Prompt

Give this prompt to Claude Code after installing it. It will handle the full setup for you.

---

## Prerequisites (do these manually first)

**1. Install GitHub CLI and log in**
```bash
# macOS
brew install gh
gh auth login    # choose: GitHub.com → HTTPS → Login with browser

# Windows
winget install GitHub.CLI
gh auth login

# Linux
sudo apt install gh   # or: https://cli.github.com/
gh auth login
```

**2. Install Claude Code**
```bash
npm install -g @anthropic/claude-code
```

---

## Claude Code Onboarding Prompt

Copy and paste the following into Claude Code:

---

```
I'm joining the clawti-frontend project as a new contributor. Please help me:

1. Fork https://github.com/weykon/clawti-frontend to my GitHub account using gh cli, then clone my fork locally into ~/projects/clawti-frontend (create the directory if needed)

2. Install dependencies with npm install

3. Create a .env.local file based on .env.example — for local development, use these values:
   - NEXTAUTH_URL=http://localhost:3000
   - NEXTAUTH_SECRET=<generate a random 32-char string>
   - DATABASE_URL=postgresql://clawti:clawti_secret_2024@localhost:5433/clawti  (ask the team lead for the actual DB creds or spin up a local postgres)
   - ALAN_URL=http://localhost:7088  (or ask the team lead for the shared dev URL)
   - Leave STRIPE_* empty for now (Stripe features gracefully disable without keys)
   - BACKEND_URL=http://localhost:3001  (legacy, can leave as-is)

4. Show me the project structure so I understand the codebase — key directories are:
   - app/           → Next.js App Router pages and API routes
   - src/components → React components (all 'use client')
   - src/store/     → 5 Zustand stores (UI, Auth, Creature, Chat, Create)
   - src/lib/       → auth, db, stripe helpers
   - worker/        → Postgres task queue worker
   - deploy.sh      → deployment script for the usa-ny server
   - db/schema.sql  → Postgres schema

5. Set up an upstream remote pointing to weykon/clawti-frontend so I can pull updates

6. Run npm run dev and confirm it starts on localhost:3000

7. Give me a brief tour of what each part does so I can get started contributing
```

---

## Development Workflow

Once set up, the standard contribution flow is:

```bash
# Pull latest from upstream
git fetch upstream
git merge upstream/main

# Create a feature branch
git checkout -b feature/your-feature-name

# Make changes, then push to YOUR fork
git push origin feature/your-feature-name

# Open a PR on GitHub against weykon/clawti-frontend:main
gh pr create --base main --head your-github-username:feature/your-feature-name
```

## Deploying to Preview (usa-ny server)

After your PR is merged, the team lead will run:
```bash
./deploy.sh --frontend
```

Or to deploy your branch directly for review:
```bash
ssh usa-ny "cd /root/p/clawti-frontend && git fetch && git checkout your-branch && ./deploy.sh --frontend"
```

Live preview: https://clawti.clawhivemarket.com

## Key Contacts

- Repo owner: [@weykon](https://github.com/weykon)
- Server access: ask the team lead for SSH key to usa-ny
- DB credentials: ask the team lead for `.env.local` values
