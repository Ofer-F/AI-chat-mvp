import type { Conversation, Message, User } from "../types/chat";

export interface LoginRequest {
  userId: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface GetConversationsResponse {
  conversations: Conversation[];
}

export interface GetMessagesRequest {
  conversationId: string;
  cursor?: string;
  limit?: number;
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
  login(request: LoginRequest): Promise<LoginResponse>;
}

export interface ConversationApiClient {
  getConversations(currentUserId: string): Promise<GetConversationsResponse>;
  getMessages(conversationId: string, cursor?: string): Promise<GetMessagesResponse>;
  sendMessage(
    conversationId: string,
    senderId: string,
    request: CreateMessageRequest
  ): Promise<CreateMessageResponse>;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
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
  const parsedBody: unknown = rawBody ? JSON.parse(rawBody) : null;

  if (!response.ok) {
    const errorBody = parsedBody as ApiErrorBody | null;
    const message =
      errorBody?.error?.message ?? `Request failed (${response.status})`;
    throw new Error(message);
  }

  return parsedBody as T;
}

class HttpAuthApiClient implements AuthApiClient {
  async login(loginRequest: LoginRequest): Promise<LoginResponse> {
    const response = await request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(loginRequest),
    });
    setAuthToken(response.token);
    return response;
  }
}

class HttpConversationApiClient implements ConversationApiClient {
  async getConversations(
    _currentUserId: string
  ): Promise<GetConversationsResponse> {
    return request<GetConversationsResponse>("/conversations");
  }

  async getMessages(
    conversationId: string,
    cursor?: string
  ): Promise<GetMessagesResponse> {
    const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    return request<GetMessagesResponse>(
      `/conversations/${encodeURIComponent(conversationId)}/messages${query}`
    );
  }

  async sendMessage(
    conversationId: string,
    _senderId: string,
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
