# Issues & Optimization Notes

Observations from a code audit of the clawti-frontend codebase. Organized by severity and category. No UI/CSS changes recommended.

---

## Code Structure

### Monolithic App.tsx (~3069 lines)

All views, state, handlers, and rendering logic live in a single file. This creates:
- **Collaboration friction**: Two developers can't work on different views without merge conflicts
- **Cognitive load**: 37 `useState` hooks in one component, hard to trace state flow
- **Re-render cascade**: Any state change re-renders the entire app tree
- **No code splitting**: The entire app is one bundle; no lazy loading possible

**Recommendation**: Extract into view components (`DiscoverView`, `ChatView`, `CreateView`, `ProfileView`) and a shared state context or store. This is the highest-impact improvement.

### No URL-Based Routing

Views are controlled by `useState<View>('discover')`. Consequences:
- No deep linking (can't share a URL to a specific creature or chat)
- Browser back/forward buttons don't work
- No history management
- No SEO (though less relevant for an app-like product)

**Recommendation**: Add `react-router-dom` with route-based view switching.

### No Dedicated Types File

`Character` and `Message` interfaces are defined inline in `App.tsx` (lines 76–107). They can't be imported by other modules or shared with a backend TypeScript project.

**Recommendation**: Extract to `src/types.ts`.

---

## API & Integration

### `creatureToCharacter()` Uses `any` Type

```typescript
function creatureToCharacter(c: any): Character { ... }
```

The backend response has no type definition. If the backend changes a field name, the frontend will silently produce `undefined` values with no compile-time warning.

**Recommendation**: Define a `BackendCreature` interface matching the actual backend response. Replace `any` throughout `api.ts`.

### Inconsistent Backend ID Fields

```typescript
id: c.agentId || c.agent_id || c.id
name: c.name || c.agentName || 'Unknown'
greeting: c.greeting || c.firstMes || ''
```

Three fallbacks for ID and two for name/greeting suggests the backend contract hasn't stabilized.

**Action**: Agree on canonical field names with the backend team and remove fallbacks.

### Pervasive `any` in API Client

Every method in `api.ts` returns `Promise<any>`:
- `auth.me()` → `any`
- `user.profile()` → `any`
- `creatures.discover()` → `any`
- `friends.list()` → `any`

**Recommendation**: Define response types for each endpoint. This enables IDE autocompletion and compile-time checking.

### No Error Response Contract

Error handling:
```typescript
const err = await res.json().catch(() => ({ error: 'Request failed' }));
throw new Error(err.error || `HTTP ${res.status}`);
```

No standardized error format is expected or enforced. Different endpoints may return different error shapes.

**Recommendation**: Agree on a standard error response format with the backend:
```json
{ "error": "message", "code": "ERROR_CODE" }
```

### No Real-Time Communication

Chat is synchronous REST only (`POST /chat/:id/send` → wait for full response). No streaming, WebSocket, or SSE support.

**Impact**:
- User sees a loading spinner until the full AI response is generated
- No typing indicators from the server
- No push notifications
- Long AI responses may feel slow

**Recommendation**: Consider SSE for streaming AI responses or WebSocket for real-time features.

---

## Auth & Security

### No Token Refresh

If the JWT expires, `api.auth.me()` fails and the user is silently logged out (token cleared from localStorage). There's no refresh token mechanism.

**Impact**: Users with long sessions will be unexpectedly logged out.

**Recommendation**: Implement refresh token flow or extend JWT expiry with sliding window.

### Token Storage in localStorage

JWT is stored in `localStorage('vc_token')`. This is vulnerable to XSS attacks — any injected script can read the token.

**Alternative**: Use `httpOnly` cookies (requires backend changes to set cookies instead of returning tokens in response body).

### No CSRF Protection

No CSRF tokens are sent or validated.

**Note**: This is partially mitigated by using `Authorization` header (not cookies) for auth, but worth considering if cookie-based auth is adopted later.

---

## Missing Capabilities

| Capability                      | Status    | Impact                                           |
|---------------------------------|-----------|--------------------------------------------------|
| Testing framework               | Missing   | No automated tests; regressions caught manually  |
| Form validation library          | Missing   | Manual validation only; inconsistent UX           |
| Loading/error boundary components| Missing   | Unhandled promise rejections may crash the app    |
| Request retry / offline handling | Missing   | Network errors surface as uncaught exceptions     |
| Request deduplication / caching  | Missing   | Duplicate API calls on rapid navigation           |
| Token refresh mechanism          | Missing   | Users logged out when JWT expires                 |
| Pagination (infinite scroll)     | Missing   | Only `limit`/`offset` params, no scroll trigger   |
| Image upload                     | Missing   | Creature photos are external URLs only            |
| Environment variables            | Missing   | Backend URL hardcoded in Vite config              |
| Type-safe API responses          | Missing   | All API methods return `Promise<any>`             |

---

## Data Integrity Observations

### Friends List Parsing

```typescript
const friendsList = (friendsRes?.friends || friendsRes || []);
if (Array.isArray(friendsList)) {
  setFriends(friendsList.map((f: any) => creatureToCharacter(f.creature || f)));
}
```

The code handles two possible response shapes (`{ friends: [...] }` or a direct array) and two possible friend item shapes (`{ creature: {...} }` or a direct creature object). This suggests the backend response format isn't finalized.

### Energy System

The energy value is initialized to `1000` in frontend state but should come from the backend via `api.user.energy()`. If the backend call fails, the user sees stale/default energy.

### Mock Data Fallback

`INITIAL_CHARACTERS` (hardcoded array) is used when the backend discover endpoint fails. This means:
- The app "works" without a backend (good for development)
- But users might see stale mock data and not realize the backend is down

---

## Priority Recommendations

These are ordered by impact-to-effort ratio, focusing on backend integration readiness:

1. **Define API response types** — Replace all `any` types in `api.ts` with typed interfaces. High impact, moderate effort.
2. **Stabilize backend field names** — Agree with backend on canonical IDs (`id` vs `agentId` vs `agent_id`). Remove fallback chains. High impact, low effort.
3. **Extract types to `src/types.ts`** — Move `Character`, `Message`, and new API response types. Low effort, enables sharing.
4. **Add error response contract** — Standardize error format between frontend and backend. Medium effort.
5. **Extract App.tsx into components** — Split monolith into view components. High effort, high long-term value.
6. **Add environment variables** — Make backend URL configurable via `.env`. Low effort.
7. **Add token refresh** — Implement refresh token flow. Medium effort, important for UX.
8. **Add testing framework** — Set up Vitest for unit tests. Medium effort, important for reliability.

---

## Notes for Backend Team

When building/reviewing the backend API, please confirm:

1. **Creature ID field**: Is it `agentId`, `agent_id`, or `id`? Frontend needs one canonical field.
2. **Creature name field**: Is it `name` or `agentName`?
3. **Greeting field**: Is it `greeting` or `firstMes`?
4. **Friends response shape**: Is it `{ friends: [{ creature: {...} }] }` or something else?
5. **Error response format**: Can we standardize on `{ error: string, code?: string }`?
6. **Auth response**: Does login/register always return `{ user, token }` at top level?
7. **Feed auth requirement**: Do feed read endpoints require authentication?
8. **Rate limiting**: Are any endpoints rate-limited? Frontend has no retry logic.
9. **Chat response**: Does `POST /chat/:id/send` return a single `Message` object or something else?
10. **Image handling**: Will creature creation support image upload, or URLs only?
