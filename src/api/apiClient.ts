import type { Conversation, Message, User } from "../types/chat";

import { mockConversations, mockMessages, mockUsers } from "./mockData";

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

abstract class BaseMockApiClient {
  protected static readonly MOCK_DELAY_MS = 500;

  protected delay(ms: number = BaseMockApiClient.MOCK_DELAY_MS): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }
}

export class MockedAuthApiClient
  extends BaseMockApiClient
  implements AuthApiClient
{
  async login(request: LoginRequest): Promise<LoginResponse> {
    await this.delay();

    const user = mockUsers.find((mockUser) => mockUser.id === request.userId);

    if (!user) {
      throw new Error("User not found");
    }

    return {
      token: `mock-token-${user.id}`,
      user,
    };
  }
}

export class MockedConversationApiClient
  extends BaseMockApiClient
  implements ConversationApiClient
{
  private static readonly DEFAULT_MESSAGES_LIMIT = 20;
  private static readonly SHOULD_FAIL_SEND_RATE = 0.25;

  async getConversations(
    currentUserId: string
  ): Promise<GetConversationsResponse> {
    await this.delay();

    const conversations = mockConversations
      .filter((conversation) =>
        conversation.participantIds.includes(currentUserId)
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

    return { conversations };
  }

  async getMessages(
    conversationId: string,
    cursor?: string
  ): Promise<GetMessagesResponse> {
    await this.delay();

    const allMessages = mockMessages
      .filter((message) => message.conversationId === conversationId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

    const startIndex = cursor ? Number(cursor) : 0;
    const endIndex =
      startIndex + MockedConversationApiClient.DEFAULT_MESSAGES_LIMIT;
    const messages = allMessages.slice(startIndex, endIndex);

    const nextCursor = endIndex < allMessages.length ? String(endIndex) : null;

    return {
      messages,
      nextCursor,
    };
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    request: CreateMessageRequest
  ): Promise<CreateMessageResponse> {
    await this.delay();

    const shouldFail =
      Math.random() < MockedConversationApiClient.SHOULD_FAIL_SEND_RATE;

    if (shouldFail) {
      throw new Error("Failed to send message");
    }

    const now = new Date().toISOString();

    return {
      message: {
        id: crypto.randomUUID(),
        conversationId,
        senderId,
        body: request.body,
        createdAt: now,
        status: "sent",
      },
    };
  }
}

export const authApiClient: AuthApiClient = new MockedAuthApiClient();
export const conversationApiClient: ConversationApiClient =
  new MockedConversationApiClient();
