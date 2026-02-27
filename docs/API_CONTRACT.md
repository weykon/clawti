# API Contract — Backend ↔ Frontend Interface

All endpoints are relative to `/api` which is proxied by Vite to `http://localhost:3001`.

Authentication is via `Bearer <JWT>` in the `Authorization` header. The token is stored in `localStorage` under key `vc_token`.

---

## Endpoint Catalog

### Auth

| Method | Path               | Request Body                                  | Response                    | Auth Required |
|--------|--------------------|-----------------------------------------------|-----------------------------|---------------|
| POST   | `/auth/register`   | `{ username, email, password }`               | `{ user, token }`          | No            |
| POST   | `/auth/login`      | `{ email, password }`                         | `{ user, token }`          | No            |
| GET    | `/auth/me`         | —                                             | User object                 | Yes           |

### User Profile

| Method | Path                        | Request Body        | Response            | Auth Required |
|--------|-----------------------------|---------------------|---------------------|---------------|
| GET    | `/user/profile`             | —                   | Profile object      | Yes           |
| PUT    | `/user/profile`             | `{ ...profileData }`| Updated profile     | Yes           |
| GET    | `/user/energy`              | —                   | Energy info         | Yes           |
| POST   | `/user/energy/daily-checkin`| —                   | Updated energy info | Yes           |

### Friends

| Method | Path                   | Request Body              | Response         | Auth Required |
|--------|------------------------|---------------------------|------------------|---------------|
| GET    | `/user/friends`        | —                         | `{ friends: [] }`| Yes           |
| POST   | `/user/friends`        | `{ creature_id: string }` | Friend object    | Yes           |
| DELETE | `/user/friends/:id`    | —                         | Confirmation     | Yes           |

> **Note**: The frontend sends `creature_id` (snake_case) in the POST body — verify backend field name matches.

### Creatures (Agents)

| Method | Path                   | Query Params                      | Request Body                                              | Response                | Auth Required |
|--------|------------------------|-----------------------------------|-----------------------------------------------------------|-------------------------|---------------|
| GET    | `/creatures/discover`  | `?gender=&occupation=&limit=`     | —                                                         | `{ creatures: [] }`     | No            |
| GET    | `/creatures/:id`       | —                                 | —                                                         | Creature object         | No            |
| POST   | `/creatures`           | —                                 | `{ name, personalityDetails, messageExamples, ... }`      | Created creature        | Yes           |
| DELETE | `/creatures/:id`       | —                                 | —                                                         | Confirmation            | Yes           |

### Chat

| Method | Path                            | Query Params   | Request Body         | Response               | Auth Required |
|--------|---------------------------------|----------------|----------------------|------------------------|---------------|
| GET    | `/chat/:creatureId/messages`    | `?limit=50`    | —                    | Message array          | Yes           |
| POST   | `/chat/:creatureId/send`        | —              | `{ content: string }`| Reply message          | Yes           |
| DELETE | `/chat/:creatureId`             | —              | —                    | Confirmation           | Yes           |

### Feed

| Method | Path                   | Query Params                   | Request Body         | Response         | Auth Required |
|--------|------------------------|--------------------------------|----------------------|------------------|---------------|
| GET    | `/feed`                | `?tab=recommended&limit=20&offset=0` | —              | Feed items array | No*           |
| GET    | `/feed/:id`            | —                              | —                    | Feed item        | No*           |
| POST   | `/feed/:id/like`       | —                              | —                    | Confirmation     | Yes           |
| POST   | `/feed/:id/comment`    | —                              | `{ content: string }`| Comment object   | Yes           |

> *Feed read access may or may not require auth — the frontend sends the token if available.

---

## Data Models

### Character (Frontend Interface)

```typescript
interface Character {
  id: string;
  name: string;
  tagline: string;
  tagline_en?: string;
  description: string;
  description_en?: string;
  avatar: string;
  images?: string[];
  personality: string;
  personality_en?: string;
  greeting: string;
  greeting_en?: string;
  isCustom?: boolean;
  gender?: string;
  gender_en?: string;
  race?: string;
  race_en?: string;
  occupation?: string;
  occupation_en?: string;
  age?: number;
  world?: string;
  world_en?: string;
  rating?: number;
}
```

### Message (Frontend Interface)

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
```

### Backend → Frontend Mapping

The function `creatureToCharacter(c: any)` in `App.tsx:55` maps backend creature objects:

```
Backend field(s)                      → Frontend field
────────────────────────────────────────────────────────
c.agentId || c.agent_id || c.id       → id
c.name || c.agentName                 → name
c.bio                                 → tagline
c.worldDescription || c.bio           → description
c.photos?.[0]                         → avatar (fallback: picsum.photos)
c.photos                              → images
c.personality                         → personality
c.greeting || c.firstMes              → greeting
c.gender                              → gender
c.age                                 → age
c.occupation                          → occupation
c.rating                              → rating (default: 0)
c.creatorId !== '0000...0000'         → isCustom
```

**Action needed**: The triple-fallback on ID (`agentId || agent_id || id`) and double-fallback on name (`name || agentName`) indicate the backend field names are not yet stabilized. Agree on a single canonical field for each.

---

## Auth Flow

```
  User                    Frontend                      Backend
   │                         │                             │
   │── enter credentials ──▶ │                             │
   │                         │── POST /auth/login ────────▶│
   │                         │   { email, password }       │
   │                         │◀── { user, token } ─────────│
   │                         │                             │
   │                         │── localStorage.setItem('vc_token', token)
   │                         │── setIsLoggedIn(true)       │
   │                         │                             │
   │                         │── Promise.all([             │
   │                         │     GET /user/profile,      │
   │                         │     GET /creatures/discover,│
   │                         │     GET /user/friends       │
   │                         │   ]) ──────────────────────▶│
   │                         │◀── parallel responses ──────│
   │◀── render app ──────────│                             │
```

On app mount, the frontend:
1. Loads discover data (unauthenticated, for initial display)
2. Checks for existing token via `api.auth.me()`
3. If valid: sets `isLoggedIn(true)` and loads user data (profile + creatures + friends in parallel)
4. If invalid: clears token, shows unauthenticated state

**No token refresh**: If the JWT expires, the `/auth/me` call fails and the user is logged out. There is no silent refresh mechanism.

---

## Chat Flow

```
  User                    Frontend                      Backend
   │                         │                             │
   │── select creature ────▶ │                             │
   │                         │── GET /chat/:id/messages ──▶│
   │                         │   ?limit=50                 │
   │                         │◀── Message[] ───────────────│
   │◀── show history ────────│                             │
   │                         │                             │
   │── type & send ─────────▶│                             │
   │                         │── add user msg to state     │
   │                         │── setIsTyping(true)         │
   │                         │── POST /chat/:id/send ─────▶│
   │                         │   { content: "hello" }      │
   │                         │◀── { reply message } ───────│
   │                         │── setIsTyping(false)        │
   │◀── show AI reply ───────│                             │
```

Chat is **synchronous REST only** — no streaming, no WebSocket, no SSE. The user sees a typing indicator while waiting for the POST response.

---

## Creature Creation Flow

```
  User                      Frontend                      Backend
   │                           │                             │
   │── choose flow type ──────▶│ (simple/detailed/import)    │
   │                           │                             │
   │  [Simple: 4-step wizard]  │                             │
   │── step 1: name ──────────▶│                             │
   │── step 2: personality ───▶│                             │
   │── step 3: appearance ────▶│                             │
   │── step 4: greeting ──────▶│                             │
   │                           │── POST /creatures ─────────▶│
   │                           │   { name, personalityDetails,│
   │                           │     messageExamples }        │
   │                           │◀── created creature ────────│
   │◀── success ───────────────│                             │
   │                           │                             │
   │  [Import flow]            │                             │
   │── paste URL or upload ───▶│                             │
   │                           │── parse SillyTavern card    │
   │                           │── POST /creatures ─────────▶│
   │                           │◀── created creature ────────│
   │◀── success ───────────────│                             │
```

---

## Error Handling

The API client has minimal error handling:

```typescript
if (!res.ok) {
  const err = await res.json().catch(() => ({ error: 'Request failed' }));
  throw new Error(err.error || `HTTP ${res.status}`);
}
```

**Current behavior**:
- Non-2xx responses throw an `Error` with the `error` field from the JSON body, or a generic `HTTP {status}` message
- If the response body isn't valid JSON, falls back to `'Request failed'`
- No standardized error response schema is enforced

**Recommended error response format** (to be agreed with backend):

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": {}
}
```

---

## Request Headers

All requests include:

```
Content-Type: application/json
Authorization: Bearer <token>    (when authenticated)
```

No other custom headers are sent. No CSRF token. No request ID.
