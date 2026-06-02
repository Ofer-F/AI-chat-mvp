# Frontend Chat MVP

A small chat application built with **React + Vite + TypeScript** against a fully
**mocked API**. It shows a conversation list on the left and a message thread with a
composer on the right, with explicit loading / empty / success / error states and
optimistic message sending that rolls back on failure.

The mocked API lives behind a single module (`src/api/apiClient.ts`) and matches the
contract documented in [`API_CONTRACT.md`](./API_CONTRACT.md), which a real backend is
expected to implement later.

## Features

- **Mock auth** — pick a user identity to "log in" (no real credentials).
- **Conversation list** — all conversations the current user is in, sorted by most recent.
- **Message thread** — messages for the selected conversation, auto-scrolled to the latest.
- **Composer** — controlled textarea; **Enter** sends, **Shift+Enter** inserts a newline.
- **Optimistic send** — the message appears instantly and is rolled back if the send fails.
- **Cursor-based pagination** — "Load more messages" fetches the next page so long threads load incrementally.
- **All UI states handled** — loading skeletons, empty states, success, and an error toast on failed send.

## Tech stack

- **React 19** + **Vite** + **TypeScript** (strict mode, no `any`, explicit return types).
- **Vitest** + **React Testing Library** for tests.
- **ESLint** (typescript-eslint, react-hooks) for linting.
- No real network: an in-memory fake fetcher behind `apiClient.ts`.

## Getting started

```bash
# install dependencies
npm install

# start the dev server (http://localhost:5173)
npm run dev

# type-check without emitting
npx tsc --noEmit

# lint
npm run lint

# production build
npm run build
```

## Running the tests

```bash
# watch mode (re-runs on change) — best while developing
npm test

# run once and exit — use for CI / a final pre-submit check
npm run test:run
```

Useful filters:

```bash
# a single file
npm run test:run -- useMessages.reducer.test.ts

# tests matching a name
npm run test:run -- -t "rolls back"
```

## Project structure

```
src/
├── api/
│   ├── apiClient.ts          # the single API seam (mocked now, real backend later)
│   └── mockData.ts           # in-memory users, conversations, messages
├── components/
│   ├── AuthScreen/           # mock "log in as user X" screen
│   ├── ChatLayout/           # two-pane shell (sidebar + thread), owns selected conversation
│   ├── ConversationList/     # container + presentational + skeleton (+ test)
│   ├── MessageComposer/      # controlled textarea, Enter/Shift+Enter handling
│   ├── MessagesList/         # container + presentational + bubble + skeleton
│   ├── Skeleton/             # shared skeleton primitive
│   └── Toast/                # error toast
├── hooks/
│   ├── useConversations.ts   # loads conversations for the current user
│   ├── useMessages.ts        # messages domain hook (load, paginate, send)
│   ├── useMessages.reducer.ts# useReducer state machine for the message thread
│   ├── useMessages.utils.ts  # builds optimistic messages
│   └── *.test.ts(x)          # unit / component tests
├── types/
│   └── chat.ts               # shared domain + request/response types
├── test/
│   └── setup.ts              # jest-dom setup for RTL
├── App.tsx                   # auth gate: AuthScreen vs ChatLayout
└── main.tsx                  # entry point
```

## Architecture

### Container / presentational split

UI is separated into **containers** (wire data and callbacks) and **presentational**
components (pure rendering from props). For example, `ConversationListContainer` calls
`useConversations` and feeds `ConversationListPresentational`, and
`MessagesListContainer` calls `useMessages` and feeds `MessagesListPresentational`. This
keeps rendering logic easy to test in isolation.

### Custom hooks

- **`useConversations(currentUserId)`** — loads the current user's conversations, exposing
  `conversations`, `isLoading`, `error`, and `reloadConversations`.
- **`useMessages(conversationId)`** — owns the message thread: initial load, cursor-based
  "load more", and optimistic sending. It exposes `messages`, `isLoading`,
  `isLoadingMore`, `error`, `hasMore`, and the `sendNewMessage` / `loadMoreMessages` /
  `clearError` actions.

### `useReducer` for the message thread

The non-trivial thread state is managed by a reducer in `useMessages.reducer.ts`. It
models every transition explicitly — initial load, load-more, and the three-step
optimistic send (`messageOptimisticAdded` → `messageSendConfirmed` / `messageSendFailed`).
Keeping these in a reducer makes the optimistic flow predictable and unit-testable
without rendering anything.

### The API seam

Every data call goes through `src/api/apiClient.ts` (`login`, `getConversations`,
`getMessages`, `sendMessage`). Today these read from `mockData.ts` with an artificial
delay and a simulated ~25% send-failure rate. Because all components and hooks import
from this single module, swapping the mock for real `fetch` calls in the future is a
localized change — nothing above the seam needs to change as long as the response shapes
keep matching [`API_CONTRACT.md`](./API_CONTRACT.md).

### UI state handling

Each data-driven view renders the appropriate state:

| State | Conversation list | Message thread |
|---|---|---|
| Loading | skeleton | skeleton |
| Empty | "No conversations yet." | "No messages yet." / "Select a conversation" |
| Error | inline alert | error toast on failed send |
| Success | list of conversations | message bubbles, auto-scrolled to bottom |

### Optimistic send flow

1. `useMessages.utils.createOptimisticMessage` builds a temporary message with a
   `temp-` id and `status: "pending"`, which is appended immediately.
2. On success, the reducer replaces the temp message with the server-confirmed one
   (`status: "sent"`).
3. On failure, the reducer removes the temp message and surfaces an error, which the
   `Toast` displays.

### Pagination

`getMessages` returns a page of messages plus a `nextCursor` (or `null`). The thread
shows a "Load more messages" button while `hasMore` is true; loading more appends the
next page so a long thread loads incrementally instead of all at once.

## Tests

Tests run with Vitest + React Testing Library (`src/test/setup.ts` wires up
`@testing-library/jest-dom`). Current coverage:

- **`src/hooks/useMessages.reducer.test.ts`** — unit tests for the reducer:
  - appends an optimistic message and clears any previous error,
  - replaces the optimistic message with the confirmed one on success,
  - rolls back the optimistic message and sets an error on failure.
- **`src/components/ConversationList/ConversationListPresentational.test.tsx`** —
  component tests:
  - renders the loading skeleton,
  - renders the empty state,
  - renders the conversation title and last-message preview when loaded.

Run them with `npm run test:run` (once) or `npm test` (watch).

## API contract

The full request/response contract for every endpoint is documented in
[`API_CONTRACT.md`](./API_CONTRACT.md): `POST /auth/login`, `GET /conversations`,
`GET /conversations/:id/messages`, and `POST /conversations/:id/messages`.
