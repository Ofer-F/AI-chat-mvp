import type { Conversation, Message, PublicUser } from "../types/chat";

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: PublicUser;
}

export interface GetUsersResponse {
  users: PublicUser[];
}

export interface GetConversationsResponse {
  conversations: Conversation[];
}

export interface CreateConversationRequest {
  title: string;
  participantIds: string[];
}

export interface CreateConversationResponse {
  conversation: Conversation;
}

export interface GetMessagesResponse {
  messages: Message[];
  nextCursor: string | null;
}

export interface CreateMessageRequest {
  body: string;
}

export interface CreateMessageResponse {
  message: Message;
}

export interface AuthApiClient {
  signup(request: SignupRequest): Promise<AuthResponse>;
  login(request: LoginRequest): Promise<AuthResponse>;
  logout(): void;
  getMe(): Promise<PublicUser>;
}

export interface ConversationApiClient {
  getUsers(): Promise<GetUsersResponse>;
  getConversations(): Promise<GetConversationsResponse>;
  createConversation(
    request: CreateConversationRequest
  ): Promise<CreateConversationResponse>;
  getMessages(
    conversationId: string,
    cursor?: string,
    limit?: number
  ): Promise<GetMessagesResponse>;
  sendMessage(
    conversationId: string,
    request: CreateMessageRequest
  ): Promise<CreateMessageResponse>;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const TOKEN_STORAGE_KEY = "chat-mvp.token";

let authToken: string | null = readStoredToken();

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

export function setAuthToken(token: string | null): void {
  authToken = token;
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // localStorage may be unavailable (private mode); fall back to in-memory.
  }
}

let onUnauthorized: (() => void) | null = null;

// Lets the app react to a 401 (clear session + redirect to login) without the
// client layer importing React state directly.
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  const rawBody = await response.text();
  let parsedBody: unknown = null;
  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      parsedBody = null;
    }
  }

  if (!response.ok) {
    const errorBody = parsedBody as ApiErrorBody | null;
    const code = errorBody?.error?.code ?? "ERROR";
    const message =
      errorBody?.error?.message ?? `Request failed (${response.status})`;

    if (response.status === 401) {
      setAuthToken(null);
      onUnauthorized?.();
    }

    throw new ApiError(
      response.status,
      code,
      message,
      errorBody?.error?.details
    );
  }

  return parsedBody as T;
}

class HttpAuthApiClient implements AuthApiClient {
  async signup(signupRequest: SignupRequest): Promise<AuthResponse> {
    const response = await request<AuthResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(signupRequest),
    });
    setAuthToken(response.token);
    return response;
  }

  async login(loginRequest: LoginRequest): Promise<AuthResponse> {
    const response = await request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(loginRequest),
    });
    setAuthToken(response.token);
    return response;
  }

  logout(): void {
    setAuthToken(null);
  }

  getMe(): Promise<PublicUser> {
    return request<PublicUser>("/me");
  }
}

class HttpConversationApiClient implements ConversationApiClient {
  getUsers(): Promise<GetUsersResponse> {
    return request<GetUsersResponse>("/users");
  }

  getConversations(): Promise<GetConversationsResponse> {
    return request<GetConversationsResponse>("/conversations");
  }

  createConversation(
    createConversationRequest: CreateConversationRequest
  ): Promise<CreateConversationResponse> {
    return request<CreateConversationResponse>("/conversations", {
      method: "POST",
      body: JSON.stringify(createConversationRequest),
    });
  }

  getMessages(
    conversationId: string,
    cursor?: string,
    limit?: number
  ): Promise<GetMessagesResponse> {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    if (limit !== undefined) params.set("limit", String(limit));
    const query = params.toString() ? `?${params.toString()}` : "";
    return request<GetMessagesResponse>(
      `/conversations/${encodeURIComponent(conversationId)}/messages${query}`
    );
  }

  sendMessage(
    conversationId: string,
    createMessageRequest: CreateMessageRequest
  ): Promise<CreateMessageResponse> {
    return request<CreateMessageResponse>(
      `/conversations/${encodeURIComponent(conversationId)}/messages`,
      {
        method: "POST",
        body: JSON.stringify(createMessageRequest),
      }
    );
  }
}

export const authApiClient: AuthApiClient = new HttpAuthApiClient();
export const conversationApiClient: ConversationApiClient =
  new HttpConversationApiClient();
