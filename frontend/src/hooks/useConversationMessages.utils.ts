import type { Dispatch } from "react";
import type { Message, MessageStatus } from "../types/chat";
import { conversationApiClient } from "../api/apiClient";
import { ASSISTANT_SENDER_ID } from "../constants";
import type { MessagesAction } from "./useConversationMessages.reducer";

export function createOptimisticMessage(
  conversationId: string,
  senderId: string,
  body: string,
  status: MessageStatus = "pending"
): Message {
  return {
    id: `temp-${crypto.randomUUID()}`,
    conversationId,
    senderId,
    body,
    createdAt: new Date().toISOString(),
    status,
  };
}

export function createAssistantPlaceholder(conversationId: string): Message {
  return {
    id: `temp-assistant-${crypto.randomUUID()}`,
    conversationId,
    senderId: ASSISTANT_SENDER_ID,
    body: "",
    createdAt: new Date().toISOString(),
    status: "pending",
  };
}

export async function performSend(
  dispatch: Dispatch<MessagesAction>,
  conversationId: string,
  senderId: string,
  body: string
): Promise<void> {
  const trimmedBody = body.trim();
  if (!trimmedBody) return;

  const optimisticMessage = createOptimisticMessage(
    conversationId,
    senderId,
    trimmedBody
  );

  dispatch({ type: "messageOptimisticAdded", message: optimisticMessage });

  try {
    const response = await conversationApiClient.sendMessage(conversationId, {
      body: trimmedBody,
    });
    dispatch({
      type: "messageSendConfirmed",
      temporaryId: optimisticMessage.id,
      message: response.message,
    });
  } catch (error) {
    dispatch({
      type: "messageSendFailed",
      temporaryId: optimisticMessage.id,
      error: error instanceof Error ? error.message : "Could not send message.",
    });
  }
}

export async function performAssistantStream(
  dispatch: Dispatch<MessagesAction>,
  conversationId: string,
  senderId: string,
  body: string
): Promise<void> {
  const trimmedBody = body.trim();
  if (!trimmedBody) return;

  // The backend persists the user message before streaming, so we show it as
  // already sent (there's no separate confirmation round-trip on this path).
  const userMessage = createOptimisticMessage(
    conversationId,
    senderId,
    trimmedBody,
    "sent"
  );
  dispatch({ type: "messageOptimisticAdded", message: userMessage });

  const placeholder = createAssistantPlaceholder(conversationId);
  dispatch({ type: "assistantStreamStarted", message: placeholder });

  await conversationApiClient.streamAssistantMessage(
    conversationId,
    trimmedBody,
    {
      onDelta: (text) =>
        dispatch({
          type: "assistantStreamDelta",
          placeholderId: placeholder.id,
          textChunk: text,
        }),
      onToolCall: (event) =>
        dispatch({
          type: "assistantStreamToolCall",
          placeholderId: placeholder.id,
          label: event.label,
        }),
      // The label persists until the answer streams (deltas/done clear it), so
      // there's no separate reducer action needed on tool completion.
      onToolResult: () => {},
      onDone: (message) =>
        dispatch({
          type: "assistantStreamCompleted",
          placeholderId: placeholder.id,
          message,
        }),
      onError: (errorMessage) =>
        dispatch({
          type: "assistantStreamFailed",
          placeholderId: placeholder.id,
          error: errorMessage,
        }),
    }
  );
}
