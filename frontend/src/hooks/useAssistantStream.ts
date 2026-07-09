import { useCallback, type Dispatch } from "react";
import { performAssistantStream } from "./useConversationMessages.utils";
import type { MessagesAction } from "./useConversationMessages.reducer";

interface UseAssistantStreamResult {
  sendAssistantMessage: (body: string, senderId: string) => Promise<void>;
}

export function useAssistantStream(
  conversationId: string | null,
  dispatch: Dispatch<MessagesAction>
): UseAssistantStreamResult {
  const sendAssistantMessage = useCallback(
    (body: string, senderId: string): Promise<void> =>
      conversationId
        ? performAssistantStream(dispatch, conversationId, senderId, body)
        : Promise.resolve(),
    [conversationId, dispatch]
  );

  return { sendAssistantMessage };
}
