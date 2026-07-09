import type {
  Conversation,
  ConversationType,
  KnowledgeDocument,
  Message,
  PublicUser,
} from "../types/chat";

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
  type?: ConversationType;
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

export interface AssistantStreamHandlers {
  onDelta: (text: string) => void;
  onToolCall: (event: { name: string; label: string }) => void;
  onToolResult: (event: { name: string }) => void;
  onDone: (message: Message) => void;
  onError: (message: string) => void;
}

export interface GetKnowledgeDocumentsResponse {
  documents: KnowledgeDocument[];
}

export interface UploadKnowledgeDocumentResponse {
  document: KnowledgeDocument;
}

export interface KnowledgeApiClient {
  uploadDocument(file: File): Promise<UploadKnowledgeDocumentResponse>;
  listDocuments(): Promise<GetKnowledgeDocumentsResponse>;
  deleteDocument(documentId: string): Promise<void>;
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
  deleteConversation(conversationId: string): Promise<void>;
  getMessages(
    conversationId: string,
    cursor?: string,
    limit?: number
  ): Promise<GetMessagesResponse>;
  sendMessage(
    conversationId: string,
    request: CreateMessageRequest
  ): Promise<CreateMessageResponse>;
  streamAssistantMessage(
    conversationId: string,
    body: string,
    handlers: AssistantStreamHandlers
  ): Promise<void>;
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
  }
}

let onUnauthorized: (() => void) | null = null;

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
  if (
    init?.body !== undefined &&
    !(init.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
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

  deleteConversation(conversationId: string): Promise<void> {
    return request<void>(
      `/conversations/${encodeURIComponent(conversationId)}`,
      { method: "DELETE" }
    );
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

  async streamAssistantMessage(
    conversationId: string,
    body: string,
    handlers: AssistantStreamHandlers
  ): Promise<void> {
    const headers = new Headers();
    if (authToken) {
      headers.set("Authorization", `Bearer ${authToken}`);
    }

    const path = `/conversations/${encodeURIComponent(
      conversationId
    )}/assistant/stream?body=${encodeURIComponent(body)}`;

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        method: "GET",
        headers,
      });
    } catch {
      handlers.onError("Unable to reach the assistant. Please try again.");
      return;
    }

    if (response.status === 401) {
      setAuthToken(null);
      onUnauthorized?.();
      handlers.onError("Your session has expired. Please sign in again.");
      return;
    }

    if (!response.ok || !response.body) {
      handlers.onError(`Request failed (${response.status})`);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let separatorIndex: number;
        while ((separatorIndex = buffer.indexOf("\n\n")) !== -1) {
          const frame = buffer.slice(0, separatorIndex);
          buffer = buffer.slice(separatorIndex + 2);
          dispatchSseFrame(frame, handlers);
        }
      }
    } catch {
      handlers.onError("The assistant stream was interrupted.");
    }
  }
}

interface AssistantDeltaData {
  text: string;
}

interface AssistantToolCallData {
  name: string;
  label: string;
}

interface AssistantToolResultData {
  name: string;
}

interface AssistantDoneData {
  message: Message;
}

interface AssistantErrorData {
  message: string;
}

function dispatchSseFrame(frame: string, handlers: AssistantStreamHandlers): void {
  let event = "message";
  const dataLines: string[] = [];

  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trimStart());
    }
  }

  if (dataLines.length === 0) {
    return;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(dataLines.join("\n"));
  } catch {
    return;
  }

  switch (event) {
    case "delta":
      handlers.onDelta((payload as AssistantDeltaData).text);
      break;
    case "tool_call":
      handlers.onToolCall(payload as AssistantToolCallData);
      break;
    case "tool_result":
      handlers.onToolResult(payload as AssistantToolResultData);
      break;
    case "done":
      handlers.onDone((payload as AssistantDoneData).message);
      break;
    case "error":
      handlers.onError((payload as AssistantErrorData).message);
      break;
    default:
      break;
  }
}

class HttpKnowledgeApiClient implements KnowledgeApiClient {
  uploadDocument(file: File): Promise<UploadKnowledgeDocumentResponse> {
    const formData = new FormData();
    formData.append("file", file);
    return request<UploadKnowledgeDocumentResponse>("/knowledge/documents", {
      method: "POST",
      body: formData,
    });
  }

  listDocuments(): Promise<GetKnowledgeDocumentsResponse> {
    return request<GetKnowledgeDocumentsResponse>("/knowledge/documents");
  }

  deleteDocument(documentId: string): Promise<void> {
    return request<void>(
      `/knowledge/documents/${encodeURIComponent(documentId)}`,
      { method: "DELETE" }
    );
  }
}

export const authApiClient: AuthApiClient = new HttpAuthApiClient();
export const conversationApiClient: ConversationApiClient =
  new HttpConversationApiClient();
export const knowledgeApiClient: KnowledgeApiClient =
  new HttpKnowledgeApiClient();
