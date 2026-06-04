import { useCallback, useEffect, useReducer, type Dispatch } from "react";
import { conversationApiClient } from "../api/apiClient";
import type { Message } from "../types/chat";
import {
  initialMessagesState,
  messagesReducer,
  type MessagesAction,
} from "./useConversationMessages.reducer";

interface UseConversationMessagesResult {
  messages: Message[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMoreMessages: () => Promise<void>;
  clearError: () => void;
  dispatch: Dispatch<MessagesAction>;
}

export function useConversationMessages(
  conversationId: string | null
): UseConversationMessagesResult {
  const [state, dispatch] = useReducer(messagesReducer, initialMessagesState);

  const loadInitialMessages = useCallback(async (): Promise<void> => {
    if (!conversationId) {
      dispatch({ type: "reset" });
      return;
    }

    dispatch({ type: "initialLoadStarted" });

    try {
      const response = await conversationApiClient.getMessages(conversationId);
      dispatch({
        type: "initialLoadSucceeded",
        messages: response.messages,
        nextCursor: response.nextCursor,
      });
    } catch {
      dispatch({
        type: "initialLoadFailed",
        error: "Could not load messages.",
      });
    }
  }, [conversationId]);

  const loadMoreMessages = useCallback(async (): Promise<void> => {
    if (!conversationId || !state.nextCursor || state.isLoadingMore) {
      return;
    }

    dispatch({ type: "loadMoreStarted" });

    try {
      const response = await conversationApiClient.getMessages(
        conversationId,
        state.nextCursor
      );
      dispatch({
        type: "loadMoreSucceeded",
        messages: response.messages,
        nextCursor: response.nextCursor,
      });
    } catch {
      dispatch({
        type: "loadMoreFailed",
        error: "Could not load more messages.",
      });
    }
  }, [conversationId, state.nextCursor, state.isLoadingMore]);

  useEffect(() => {
    void loadInitialMessages();
  }, [loadInitialMessages]);

  const clearError = useCallback((): void => {
    dispatch({ type: "errorDismissed" });
  }, []);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    isLoadingMore: state.isLoadingMore,
    error: state.error,
    hasMore: state.nextCursor !== null,
    loadMoreMessages,
    clearError,
    dispatch,
  };
}