import { useCallback, type Dispatch } from "react";
import { performSend } from "./useConversationMessages.utils";
import type { MessagesAction } from "./useConversationMessages.reducer";

interface UseSendMessageResult {
  sendNewMessage: (body: string, senderId: string) => Promise<void>;
}

export function useSendMessage(
  conversationId: string | null,
  dispatch: Dispatch<MessagesAction>
): UseSendMessageResult {
  const sendNewMessage = useCallback(
    (body: string, senderId: string): Promise<void> =>
      conversationId
        ? performSend(dispatch, conversationId, senderId, body)
        : Promise.resolve(),
    [conversationId, dispatch]
  );

  return { sendNewMessage };
}
