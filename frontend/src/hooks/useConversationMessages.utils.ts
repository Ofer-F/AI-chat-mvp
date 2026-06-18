import type { Dispatch } from "react";
import type { Message } from "../types/chat";
import { conversationApiClient } from "../api/apiClient";
import type { MessagesAction } from "./useConversationMessages.reducer";

export function createOptimisticMessage(
  conversationId: string,
  senderId: string,
  body: string
): Message {
  return {
    id: `temp-${crypto.randomUUID()}`,
    conversationId,
    senderId,
    body,
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
