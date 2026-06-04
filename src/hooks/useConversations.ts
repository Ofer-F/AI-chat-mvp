import { useCallback, useEffect, useReducer } from "react";
import { conversationApiClient } from "../api/apiClient";
import type { Conversation } from "../types/chat";

interface UseConversationsResult {
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
  reloadConversations: () => Promise<void>;
}

interface ConversationsState {
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
}

type ConversationsAction =
  | { type: "loadStarted" }
  | { type: "loadSucceeded"; conversations: Conversation[] }
  | { type: "loadFailed"; error: string };

const initialState: ConversationsState = {
  conversations: [],
  isLoading: true,
  error: null,
};

function conversationsReducer(
  state: ConversationsState,
  action: ConversationsAction
): ConversationsState {
  switch (action.type) {
    case "loadStarted":
      return { ...state, isLoading: true, error: null };

    case "loadSucceeded":
      return {
        conversations: action.conversations,
        isLoading: false,
        error: null,
      };

    case "loadFailed":
      return { conversations: [], isLoading: false, error: action.error };
  }
}

export function useConversations(
  currentUserId: string
): UseConversationsResult {
  const [state, dispatch] = useReducer(conversationsReducer, initialState);

  const loadConversations = useCallback(async (): Promise<void> => {
    dispatch({ type: "loadStarted" });

    try {
      const response = await conversationApiClient.getConversations(currentUserId);
      dispatch({ type: "loadSucceeded", conversations: response.conversations });
    } catch {
      dispatch({ type: "loadFailed", error: "Could not load conversations." });
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;

    void loadConversations();
  }, [currentUserId, loadConversations]);

  return {
    conversations: state.conversations,
    isLoading: state.isLoading,
    error: state.error,
    reloadConversations: loadConversations,
  };
}
