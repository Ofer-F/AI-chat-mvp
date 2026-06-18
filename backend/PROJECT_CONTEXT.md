# Project Context — Chat MVP Backend (Mongo)

This document captures the context for the **Chat MVP backend**, derived from the
existing NestJS implementation (`../backend-chat-mvp-nest`). This `-mongo` iteration
continues that project, with one major change: **swap the in-memory store for
MongoDB** while keeping the API contract and module structure intact.

## TL;DR

A NestJS + TypeScript chat backend with JWT authentication (Passport), bcrypt
password hashing, and feature modules for users, auth, and conversations/messages.
The previous week used an in-memory store; this week persists everything in MongoDB
(via Mongoose). The frontend (`../frontend-chat-mvp`) must keep working unchanged.

## Tech stack

- **Framework:** NestJS 11 + TypeScript (strict mode, no `any`, explicit return types).
- **Auth:** `@nestjs/passport`, `@nestjs/jwt`, `passport-jwt`, `bcrypt`.
- **Validation:** `class-validator` + `class-transformer` (global `ValidationPipe`
  with `whitelist: true, transform: true`).
- **Config:** `@nestjs/config` (global). All secrets come from env — never hardcoded.
- **HTTP layer:** Express platform (`@nestjs/platform-express`), CORS enabled.
- **Persistence (this iteration):** MongoDB via Mongoose (`@nestjs/mongoose`),
  replacing the previous `InMemoryStore`.
- **Tooling:** ESLint + Prettier, Jest (unit + e2e).

## Architecture & module layout

The app is organized into feature modules wired through the root `AppModule`:

- **`AppModule`** — root module. Imports `ConfigModule.forRoot({ isGlobal: true })`
  plus the feature modules. (Will also import the Mongo connection module here.)
- **`UsersModule`** — owns user data and password hashing. Exposes `UsersService`
  (`findById`, `findByEmail`, `create`, `toPublic`). Exported for `AuthModule`.
- **`AuthModule`** — owns signup/login, JWT issuance, Passport JWT strategy, and
  the `JwtAuthGuard`. Registers `JwtModule` async from `ConfigService`
  (`JWT_SECRET`, `JWT_EXPIRES_IN`). Hosts `AuthController` and `MeController`.
- **`ConversationsModule`** — owns conversations + messages. Hosts
  `ConversationsController`, `MessagesController`, `ConversationsService`,
  `MessagesService`.
- **Store layer** — in the nest project, `StoreModule` provides a singleton
  `InMemoryStore` (Maps for users/conversations/messages). **In this iteration,
  this is replaced by Mongoose models/repositories** so the same service APIs are
  backed by MongoDB.
- **`common/`** — shared types (`common/types/chat.ts`) and a global
  `HttpExceptionFilter`.

### Cross-cutting pieces

- **`HttpExceptionFilter`** (global) — normalizes all errors to
  `{ error: { code, message, details? } }`, where `code` is the `HttpStatus` name.
- **`@CurrentUser()` decorator** — param decorator that extracts the authenticated
  user from the request. NOTE: in the nest source it currently returns a hardcoded
  stub user (`u-123`) instead of `request.user` — this must be fixed to read the
  Passport-populated `request.user`.
- **`JwtStrategy`** — validates the bearer token, looks up the user by `sub`, and
  returns the `PublicUser` (attached to `request.user`).
- **`JwtAuthGuard`** — `AuthGuard('jwt')`; applied via `@UseGuards` on every chat
  endpoint and on `/me`.

## Domain model

From `common/types/chat.ts`:

```ts
interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}
type PublicUser = Pick<User, 'id' | 'name' | 'email'>;

type MessageStatus = 'sent' | 'pending' | 'failed';

interface Message {
  id: string;
  conversationId: string;
  body: string;
  senderId: string;
  createdAt: string;
  status: MessageStatus;
}

interface Conversation {
  id: string;
  title: string;
  participantIds: string[];
  lastMessage: Message | null;
  updatedAt: string;
}
```

When moving to Mongo, preserve these shapes in API responses (map Mongo `_id` →
`id`, keep ISO-string timestamps) so the frontend contract is unchanged.

## API contract

All `/conversations/*`, `/conversations/:id/messages/*`, and `/me` endpoints require
a valid JWT in `Authorization: Bearer <token>`. Missing/invalid token → `401`.

### Auth

- `POST /auth/signup` — body `{ email, password, name }` → `{ token, user }`.
  Duplicate email → `409`.
- `POST /auth/login` — body `{ email, password }` → `{ token, user }`.
  Bad credentials → `401`.
- `GET /me` — returns the current authenticated `PublicUser`.

### Conversations

- `GET /conversations` — `{ conversations: Conversation[] }`, only those the user
  participates in, sorted by `updatedAt` desc.
- `POST /conversations` — body `{ title, participantIds }` →
  `{ conversation: Conversation }`. Creator is auto-added as a participant; needs
  ≥2 participants; rejects unknown users (`404`); rejects duplicate 1:1
  conversations (`409`).

### Messages

- `GET /conversations/:id/messages` — query `{ cursor?, limit? }` →
  `{ messages: Message[], nextCursor: string | null }`. Index-based cursor
  pagination (default limit 20).
- `POST /conversations/:id/messages` — body `{ body }` → `{ message: Message }`.
  Updates the conversation's `lastMessage` and `updatedAt`.

### Authorization rule

A user may only read or post in conversations they are a participant of.
Accessing someone else's conversation → `403` (never the data). Unknown
conversation → `404`.

## Validation (DTOs)

- `SignupDto` — `email` (`@IsEmail`), `password` (`@MinLength(6)`), `name` (non-empty).
- `LoginDto` — `email` (`@IsEmail`), `password` (`@MinLength(1)`).
- `CreateConversationDto` — `title` (non-empty), `participantIds`
  (array, min size 1, each non-empty string).
- `CreateMessageDto` — `body` (non-empty string).
- `GetMessagesQueryDto` — optional `cursor` (string), optional `limit`
  (positive int, transformed via `@Type(() => Number)`).

## Auth flow

1. `signup`/`login` validate credentials, hash/compare with bcrypt
   (salt rounds = 10), and sign a JWT `{ sub: userId, email }`.
2. Protected requests pass through `JwtAuthGuard` → `JwtStrategy.validate`,
   which loads the user and attaches the `PublicUser` to the request.
3. Controllers read it via `@CurrentUser()`.

## Configuration (env)

From `.env.example` (nest project):

```
PORT=3000
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=change-me-to-a-long-random-secret
JWT_EXPIRES_IN=1d
```

This iteration additionally needs a Mongo connection variable, e.g.:

```
MONGODB_URI=mongodb://localhost:27017/chat-mvp
```

## Seed data

The nest project seeds three users (Dana `u1`, Maya `u2`, Ofer `u3`, all with
password `password123`) and two conversations (`c1` Dana↔Maya, `c2` team chat) with
sample messages. Replicate equivalent seeding against MongoDB for local dev.

## What changes in the `-mongo` iteration

- Replace `InMemoryStore` (Maps) with Mongoose schemas/models for `User`,
  `Conversation`, and `Message`.
- Inject repositories/models into the existing services without changing their
  public method signatures, so controllers and the API contract stay identical.
- Add `MongooseModule.forRootAsync` (driven by `ConfigService` / `MONGODB_URI`).
- Map Mongo documents to the existing `User`/`Conversation`/`Message`/`PublicUser`
  shapes in responses.

## Known issues to address (carried from nest source)

- `@CurrentUser()` returns a hardcoded stub user instead of `request.user` — fix it
  to read the authenticated user populated by `JwtStrategy`.
- `in-memory.store.ts` contains a leftover `UsersDBService` that duplicates
  `UsersService` logic — remove or reconcile when introducing Mongo repositories.

## Acceptance bar (inherited)

- Clean feature modules with correct imports/exports.
- DTO validation on every request body/query.
- JWT signup + login work end to end; `401` bad creds, `409` duplicate signup.
- `@UseGuards(JwtAuthGuard)` on every chat endpoint; `@CurrentUser()` extracts the
  real authenticated user.
- Passwords hashed with bcrypt — no plaintext anywhere.
- `JWT_SECRET` (and `MONGODB_URI`) loaded from env; `.env.example` checked in.
- Cross-user access returns `403`, never the data.
- `npx tsc --noEmit` passes; `npm run build` passes.

## Frontend context (`../frontend-chat-mvp`)

The React client is the consumer of this backend. **The Mongo backend MUST keep the
exact same HTTP API the frontend already calls** — same routes, request bodies,
response shapes, status codes, and the nested error format. No frontend changes
should be required.

### Frontend tech stack

- **React 19 + TypeScript**, built with **Vite** (dev server on port `5173`,
  `strictPort: true`).
- **Vitest** + Testing Library (jsdom) for tests.
- No data-fetching library — a hand-written `fetch` wrapper in
  `src/api/apiClient.ts`.
- Config via Vite env: `VITE_API_URL` (defaults to `http://localhost:3000`).

### How the frontend talks to the backend

`src/api/apiClient.ts` is the single source of truth for backend calls:

- **Base URL:** `import.meta.env.VITE_API_URL ?? "http://localhost:3000"`.
- **Auth header:** every request automatically sends
  `Authorization: Bearer <token>` when a token is present.
- **Token persistence:** stored in `localStorage` under key `chat-mvp.token`
  (falls back to in-memory if `localStorage` is unavailable).
- **401 handling:** any `401` clears the token and triggers an `onUnauthorized`
  handler (the app drops back to the auth screen). So the backend must return `401`
  for missing/invalid/expired tokens.
- **Content-Type:** `application/json` is set automatically for requests with a body.
- **Error parsing:** non-OK responses are read as
  `{ error: { code, message, details? } }` and thrown as an `ApiError`
  (`status`, `code`, `message`, `details`). The UI displays `error.message` and,
  for validation errors, renders the `details` list. **This nested error shape is
  required** — a flat `{ message }` will break error display.

### Exact endpoints the frontend calls

These match the backend contract above; listed here as the frontend's expectations:

| Method | Path | Request body | Success response | Notes |
|---|---|---|---|---|
| POST | `/auth/signup` | `{ email, password, name }` | `{ token, user }` | Token saved on success. Duplicate email → `409`. |
| POST | `/auth/login` | `{ email, password }` | `{ token, user }` | Token saved on success. Bad creds → `401`. |
| GET | `/me` | — | `PublicUser` | Called on app load to restore the session. |
| GET | `/conversations` | — | `{ conversations: Conversation[] }` | Sorted by `updatedAt` desc. |
| POST | `/conversations` | `{ title, participantIds }` | `{ conversation: Conversation }` | Creator auto-added server-side. |
| GET | `/conversations/:id/messages?cursor&limit` | — | `{ messages: Message[], nextCursor }` | Oldest→newest; opaque cursor echoed back as-is. |
| POST | `/conversations/:id/messages` | `{ body }` | `{ message: Message }` | Returned `status` must be `"sent"`. |

> Note: `/me` and `signup`/`login` responses are typed as `PublicUser`
> (`{ id, name, email }`) on the frontend — never send `passwordHash` or other
> private fields.

### Frontend types (`src/types/chat.ts`)

The client-side types are the response contract. They match the backend types,
except `User` here is the **public** shape (no `passwordHash`, no timestamps):

```ts
interface User { id: string; name: string; email: string; }
type PublicUser = User;
type MessageStatus = 'sent' | 'pending' | 'failed';
interface Message {
  id: string; conversationId: string; body: string;
  senderId: string; createdAt: string; status: MessageStatus;
}
interface Conversation {
  id: string; title: string; participantIds: string[];
  lastMessage: Message | null; updatedAt: string;
}
```

`'pending'`/`'failed'` are **frontend-only** optimistic-UI states; the backend
always returns `'sent'` for a successfully created message.

### Key frontend behaviors that constrain the backend

- **Session restore:** on load, if a token exists the app calls `GET /me`; a failure
  logs out. The backend must keep tokens valid across restarts (stable `JWT_SECRET`).
- **Optimistic send:** `useSendMessage` / `useConversationMessages` add a message
  locally as `pending`, then call `POST .../messages`; on success it's replaced with
  the server message (`sent`), on error it's marked `failed`. The backend should
  respond promptly and not randomly fail (unlike the old Week 2 mock).
- **Cursor pagination:** the client treats `cursor`/`nextCursor` as opaque and sends
  the cursor back unchanged; `nextCursor: null` means no more pages.
- **Known limitation:** there is **no "list users" endpoint**. The New Conversation
  UI hardcodes the seeded demo users (`u1` Dana, `u2` Maya, `u3` Ofer), so seeded
  user IDs should remain stable for the demo to work. (A future `GET /users` endpoint
  would remove this hack — out of scope unless requested.)

### Error contract the frontend depends on

| HTTP | `error.code` | Frontend reaction |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Shows message + `details` list. |
| 401 | `UNAUTHORIZED` | Clears token, returns to auth screen. |
| 403 | `FORBIDDEN` | Shows message (not a participant). |
| 404 | `NOT_FOUND` | Shows message (unknown conversation/user). |
| 409 | `CONFLICT` | Shows message (duplicate signup / direct conversation). |
| 500 | `INTERNAL` | Generic error message. |

The nest backend's `HttpExceptionFilter` already produces this nested shape — keep it.

## Related projects

- `../backend-chat-mvp-nest` — the NestJS source this context is based on.
- `../backend-chat-mvp-express` — the earlier Week 3 Express version.
- `../frontend-chat-mvp` — the React frontend (must keep working with this backend).
  See its `API_CONTRACT.md` for the full request/response examples.
