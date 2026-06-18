# API Contract

This document describes the mocked API contract for the Week 2 frontend chat project.  
The same contract is expected to be implemented by the backend in Week 3.

## Overview

This is the API for a **Chat MVP**: users sign in, see the conversations they
participate in, read a message thread, and post new messages. In Week 2 the API is
**mocked on the frontend** (an in-memory fake behind `src/api/apiClient.ts` with
artificial latency and a simulated send-failure rate); in Week 3 the same endpoints and
response shapes will be implemented by a real backend, so this document is the contract
both sides agree on.

**Auth style:** token-based. The client calls `POST /auth/login` with a `userId` and
receives `{ token, user }`. The `token` identifies the current user on subsequent
requests (sent as an `Authorization` header by the real backend), and `user` is the
authoritative account record. No passwords are exchanged this week.

## Base assumptions

- All timestamps are ISO strings.
- All IDs are strings.
- Auth is mocked in Week 2.
- The mocked API returns the same response shapes expected from the future backend.
- The frontend never receives user passwords.
- Conversations are sorted by `updatedAt` descending.
- Messages are returned from oldest to newest within each page.

---

## Types

### User

```ts
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}
```

### MessageStatus

```ts
type MessageStatus = "sent" | "pending" | "failed";
```

`pending` is used only by the frontend for optimistic messages that were added to the UI before the API response was confirmed.

### Message

```ts
interface Message {
  id: string;
  conversationId: string;
  body: string;
  senderId: string;
  createdAt: string;
  status: MessageStatus;
}
```

### Conversation

```ts
interface Conversation {
  id: string;
  title: string;
  participantIds: string[];
  lastMessage: Message | null;
  updatedAt: string;
}
```

### LoginRequest

```ts
interface LoginRequest {
  userId: string;
}
```

### LoginResponse

```ts
interface LoginResponse {
  token: string;
  user: User;
}
```

### GetConversationsResponse

```ts
interface GetConversationsResponse {
  conversations: Conversation[];
}
```

### GetMessagesResponse

```ts
interface GetMessagesResponse {
  messages: Message[];
  nextCursor: string | null;
}
```

### CreateMessageRequest

```ts
interface CreateMessageRequest {
  body: string;
}
```

### CreateMessageResponse

```ts
interface CreateMessageResponse {
  message: Message;
}
```

### ApiErrorResponse

```ts
interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

interface ApiErrorResponse {
  error: ApiError;
}
```

> **Changed in Week 3 (real backend):** the error shape moved from a flat
> `{ message }` to a nested `{ error: { code, message, details? } }`. Clients should
> read `error.message` for display and may switch on `error.code`. `details` is present
> only on validation errors (it carries the raw Zod issues).

---

## Endpoints

## POST /auth/login

Logs in as an existing mock user.

### Request body

```ts
interface LoginRequest {
  userId: string;
}
```

### Response body

```ts
interface LoginResponse {
  token: string;
  user: User;
}
```

### Example request

```json
{
  "userId": "u1"
}
```

### Example response

```json
{
  "token": "mock-token-u1",
  "user": {
    "id": "u1",
    "name": "Dana",
    "email": "dana@example.com",
    "createdAt": "2026-05-28T10:00:00.000Z",
    "updatedAt": "2026-05-28T10:00:00.000Z"
  }
}
```

---

## GET /conversations

Returns all conversations that the current user participates in.

The current user is identified by the auth token.

Conversations are returned sorted by `updatedAt` descending, so the most recently updated conversation appears first.

### Response body

```ts
interface GetConversationsResponse {
  conversations: Conversation[];
}
```

### Example response

```json
{
  "conversations": [
    {
      "id": "c1",
      "title": "Dana and Maya",
      "participantIds": ["u1", "u2"],
      "lastMessage": {
        "id": "m2",
        "conversationId": "c1",
        "body": "See you later!",
        "senderId": "u2",
        "createdAt": "2026-05-28T12:15:00.000Z",
        "status": "sent"
      },
      "updatedAt": "2026-05-28T12:15:00.000Z"
    },
    {
      "id": "c2",
      "title": "Team chat",
      "participantIds": ["u1", "u2", "u3"],
      "lastMessage": {
        "id": "m3",
        "conversationId": "c2",
        "body": "Let's sync tomorrow",
        "senderId": "u3",
        "createdAt": "2026-05-27T16:30:00.000Z",
        "status": "sent"
      },
      "updatedAt": "2026-05-27T16:30:00.000Z"
    }
  ]
}
```

---

## GET /conversations/:id/messages

Returns paginated messages for a specific conversation.

Messages are returned from oldest to newest within each page.

### Path params

| Name | Type | Description |
|---|---|---|
| id | string | Conversation ID |

### Query params

| Name | Type | Required | Description |
|---|---|---|---|
| cursor | string | No | Opaque cursor for the next page. Omit to fetch the first page. |
| limit | number | No | Max messages per page. Defaults to 20 in the mock. |

### Response body

```ts
interface GetMessagesResponse {
  messages: Message[];
  nextCursor: string | null;
}
```

### Example request

```txt
GET /conversations/c1/messages?cursor=cursor-older-page-1
```

### Example response

```json
{
  "messages": [
    {
      "id": "m1",
      "conversationId": "c1",
      "body": "Hey!",
      "senderId": "u1",
      "createdAt": "2026-05-28T12:00:00.000Z",
      "status": "sent"
    },
    {
      "id": "m2",
      "conversationId": "c1",
      "body": "See you later!",
      "senderId": "u2",
      "createdAt": "2026-05-28T12:15:00.000Z",
      "status": "sent"
    }
  ],
  "nextCursor": null
}
```

### Notes / semantics

- Messages are sorted **oldest → newest** within each page.
- `cursor` - The client should send `cursor` back exactly as received, without reading or changing it.
- `nextCursor` is `null` when there is no more data to load.

---

## POST /conversations/:id/messages

Creates a new message in a specific conversation.

The current user is identified by the auth token and becomes the message sender.

### Path params

| Name | Type | Description |
|---|---|---|
| id | string | Conversation ID |

### Request body

```ts
interface CreateMessageRequest {
  body: string;
}
```

### Response body

```ts
interface CreateMessageResponse {
  message: Message;
}
```

### Example request

```json
{
  "body": "Sounds good!"
}
```

### Example response

```json
{
  "message": {
    "id": "m3",
    "conversationId": "c1",
    "body": "Sounds good!",
    "senderId": "u1",
    "createdAt": "2026-05-28T12:20:00.000Z",
    "status": "sent"
  }
}
```

### Notes / semantics

- On success the returned message `status` MUST be `"sent"`. (`pending` is a frontend-only state for optimistic messages and is never returned by the API.)
- On failure the endpoint returns an `ApiErrorResponse` (e.g. `403` if the sender is not a participant, `404` if the conversation is unknown, `400` if the body is empty). The Week 2 mock additionally failed ~25% of sends on purpose (`SHOULD_FAIL_SEND_RATE`) to exercise the optimistic-send + rollback flow; the real backend does not do this.

---

## Errors

Failed API calls return this shape (the HTTP status carries the category; the body
carries a machine-readable `code` and a human-readable `message`):

```ts
interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

### Example error response

`404 Not Found`:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Conversation not found: zzz"
  }
}
```

`400 Bad Request` (validation — note the `details`):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      {
        "code": "too_small",
        "path": ["body"],
        "message": "Too small: expected string to have >=1 characters"
      }
    ]
  }
}
```

### Status codes and `code` values

| HTTP | `error.code` | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Body or query params fail validation (`details` carries the issues). |
| 401 | `UNAUTHORIZED` | Missing/malformed/invalid `Authorization` token. |
| 403 | `FORBIDDEN` | Authenticated, but not a participant in the target conversation. |
| 404 | `NOT_FOUND` | Unknown user, conversation, or route. |
| 409 | `CONFLICT` | Creating a direct conversation that already exists. |
| 500 | `INTERNAL` | Unexpected server error (generic message; internals never leaked). |

> **Note:** the Week 2 mock returned a flat `{ message }` and failed ~25% of sends on
> purpose (`SHOULD_FAIL_SEND_RATE`) to exercise optimistic-send rollback. The real
> backend does **not** randomly fail; sends succeed unless a real error occurs, and all
> errors use the nested shape above.

---