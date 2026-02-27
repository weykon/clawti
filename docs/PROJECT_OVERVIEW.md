# Clawti-Frontend (VibeCreature) — Project Overview

## What Is This?

An **AI agent companion app** where users discover, chat with, and create virtual character agents ("creatures"). Built as a single-page React application with a mobile-first design supporting English and Chinese.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLAWTI-FRONTEND (VibeCreature)                │
│                 React 19 + TypeScript + Vite + Tailwind          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐   ┌──────────────────────────────────────────┐    │
│  │ main.tsx  │──▶│              App.tsx (~3069 lines)        │    │
│  │ (entry)   │   │  ┌────────────────────────────────────┐  │    │
│  └──────────┘   │  │  Views (state-based routing)        │  │    │
│                  │  │                                     │  │    │
│                  │  │  ┌──────────┐  ┌──────────┐        │  │    │
│                  │  │  │ Discover │  │   Chat   │        │  │    │
│                  │  │  │ (browse  │  │ (talk to │        │  │    │
│                  │  │  │ agents)  │  │  agents) │        │  │    │
│                  │  │  └──────────┘  └──────────┘        │  │    │
│                  │  │  ┌──────────┐  ┌──────────┐        │  │    │
│                  │  │  │  Create  │  │ Profile  │        │  │    │
│                  │  │  │ (make    │  │ (user    │        │  │    │
│                  │  │  │ agents)  │  │ settings)│        │  │    │
│                  │  │  └──────────┘  └──────────┘        │  │    │
│                  │  └────────────────────────────────────┘  │    │
│                  └──────────────────────────────────────────┘    │
│                           │                                      │
│                           │ fetch()                              │
│                           ▼                                      │
│                  ┌──────────────────┐                            │
│                  │   api.ts (92 ln) │                            │
│                  │   ApiClient class│                            │
│                  │   Bearer JWT auth│                            │
│                  └────────┬─────────┘                            │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │  /api/*  (Vite proxy)
                            ▼
                   ┌────────────────┐
                   │   Backend API  │
                   │ localhost:3001  │
                   └────────────────┘
```

---

## Tech Stack

| Layer          | Technology                        |
|----------------|-----------------------------------|
| Framework      | React 19 + TypeScript             |
| Build Tool     | Vite 6.2                          |
| Styling        | Tailwind CSS 4.1                  |
| Icons          | Lucide React                      |
| Animations     | Motion (Framer Motion)            |
| Markdown       | react-markdown                    |
| Utilities      | clsx + tailwind-merge             |
| State Mgmt     | React useState (no external lib)  |
| Routing        | Internal state (no router lib)    |
| Auth           | Bearer JWT via localStorage       |
| i18n           | Manual EN/ZH translation object   |

**Not present**: Redux, Zustand, React Router, WebSocket/SSE, testing framework, form validation library, environment variable configuration.

---

## File Map

```
clawti-frontend/
├── index.html              ← HTML shell
├── package.json            ← deps & scripts (dev, build, preview)
├── vite.config.ts          ← build config, path alias (@/), API proxy → :3001
├── tsconfig.json           ← TS config (ES2022, bundler resolution)
├── .env.example            ← empty (no env vars defined)
│
└── src/
    ├── main.tsx            ← React entry point (11 lines)
    ├── App.tsx             ← ALL views, state, logic, UI (~3069 lines)
    ├── api.ts              ← API client class (92 lines)
    └── index.css           ← Tailwind imports + custom styles
```

---

## Feature Inventory

### 1. Discover View (`activeView === 'discover'`)
- Browse available AI agents in a card-based grid/swipe layout
- Filter by gender, race, occupation
- Swipe-style navigation through character cards
- Click to open character profile or start chat
- Uses `api.creatures.discover()` for backend data, falls back to `INITIAL_CHARACTERS` mock data

### 2. Chat View (`activeView === 'chat'`)
- Real-time text conversation with selected character
- Message history loaded via `api.chat.messages()`
- Send messages via `api.chat.send()`
- Clear chat history via `api.chat.clear()`
- Markdown rendering for AI responses (via react-markdown)
- Typing indicator animation during AI response
- Friends list sidebar showing saved characters

### 3. Create View (`activeView === 'create'`)
- Three creation flows: **Simple**, **Detailed**, **Import**
- **Simple**: Multi-step wizard (name → personality → appearance → greeting)
- **Detailed**: Extended form with more personality attributes
- **Import**: Paste URL or upload file (SillyTavern character card format)
- Submits via `api.creatures.create()`
- Import parses SillyTavern-format JSON character cards

### 4. Profile View (`activeView === 'profile'`)
- User account settings and information
- Energy system display (gamification currency)
- Daily check-in for energy rewards (`api.user.dailyCheckin()`)
- Premium subscription management
- Language toggle (EN/ZH)
- Privacy and help sections
- Login/Register/Logout flows

---

## State Management

All state lives in the root `App` component via **37 `useState` hooks**. No external state management library is used.

### Key State Variables

| Variable              | Type                          | Purpose                          |
|-----------------------|-------------------------------|----------------------------------|
| `activeView`          | `View`                        | Current view/page                |
| `selectedCharacter`   | `Character \| null`           | Currently selected agent         |
| `messages`            | `Record<string, Message[]>`   | Chat history keyed by char ID   |
| `characters`          | `Character[]`                 | Discovered agents list           |
| `friends`             | `Character[]`                 | User's saved agents              |
| `isLoggedIn`          | `boolean`                     | Auth state                       |
| `language`            | `'en' \| 'zh'`               | Current UI language              |
| `energy`              | `number`                      | User's energy balance            |
| `createFlow`          | `'simple'\|'detailed'\|'import'` | Active creation wizard        |
| `createStep`          | `number`                      | Current step in creation wizard  |
| `filters`             | `{ gender, race, occupation }`| Discover view filters            |

---

## i18n Approach

A single `translations` object (defined at module scope in App.tsx, ~160 keys) maps string IDs to English and Chinese values:

```ts
const translations = {
  en: { appName: 'clawti', tagline: 'Connect with unique digital souls', ... },
  zh: { appName: 'clawti', tagline: '连接独特的数字灵魂', ... },
};
const t = translations[language]; // used as t.appName, t.tagline, etc.
```

Language is auto-detected from `navigator.language` on first load, stored in component state. Some Character fields carry `_en` suffixes (e.g., `tagline_en`, `description_en`) for bilingual content.

---

## Build & Dev Commands

```bash
npm run dev      # Start Vite dev server (HMR, proxy to :3001)
npm run build    # Production build
npm run preview  # Preview production build locally
```

The Vite dev server proxies all `/api/*` requests to `http://localhost:3001` with `changeOrigin: true`.

---

## Key Patterns

1. **Monolithic component**: Everything lives in `App.tsx` — views, state, handlers, UI. No component decomposition.
2. **Backend data mapping**: `creatureToCharacter()` transforms backend creature objects into the frontend `Character` interface, handling multiple possible field names with fallbacks.
3. **Optimistic loading**: On mount, the app loads discover data before auth validation; if auth succeeds, it loads user profile, creatures, and friends in parallel via `Promise.all`.
4. **Mock fallback**: `INITIAL_CHARACTERS` provides hardcoded demo data when the backend is unavailable.
5. **Energy system**: Gamification currency that limits interactions; replenished via daily check-in or premium purchase.
