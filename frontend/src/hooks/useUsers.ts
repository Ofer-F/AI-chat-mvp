import { useCallback, useEffect, useReducer } from "react";
import { conversationApiClient } from "../api/apiClient";
import type { PublicUser } from "../types/chat";

interface UseUsersResult {
  users: PublicUser[];
  isLoading: boolean;
  error: string | null;
  reloadUsers: () => Promise<void>;
}

interface UsersState {
  users: PublicUser[];
  isLoading: boolean;
  error: string | null;
}

type UsersAction =
  | { type: "loadStarted" }
  | { type: "loadSucceeded"; users: PublicUser[] }
  | { type: "loadFailed"; error: string };

const initialState: UsersState = {
  users: [],
  isLoading: true,
  error: null,
};

function usersReducer(state: UsersState, action: UsersAction): UsersState {
  switch (action.type) {
    case "loadStarted":
      return { ...state, isLoading: true, error: null };

    case "loadSucceeded":
      return {
        users: action.users,
        isLoading: false,
        error: null,
      };

    case "loadFailed":
      return { users: [], isLoading: false, error: action.error };
  }
}

export function useUsers(): UseUsersResult {
  const [state, dispatch] = useReducer(usersReducer, initialState);

  const loadUsers = useCallback(async (): Promise<void> => {
    dispatch({ type: "loadStarted" });

    try {
      const response = await conversationApiClient.getUsers();
      dispatch({ type: "loadSucceeded", users: response.users });
    } catch {
      dispatch({ type: "loadFailed", error: "Could not load users." });
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  return {
    users: state.users,
    isLoading: state.isLoading,
    error: state.error,
    reloadUsers: loadUsers,
  };
}
