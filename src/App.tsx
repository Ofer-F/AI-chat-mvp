import { useState } from "react";
import type { User } from "./types/chat";
import { ChatLayout } from "./components/ChatLayout/ChatLayout";
import { mockUsers } from "./api/mockData";
import { AuthScreen } from "./components/AuthScreen/AuthScreen";
import { authApiClient, setAuthToken } from "./api/apiClient";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  async function handleLogin(user: User): Promise<void> {
    try {
      const response = await authApiClient.login({ userId: user.id });
      setCurrentUser(response.user);
      setAuthError(null);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Could not sign in.");
    }
  }

  function handleLogout(): void {
    setAuthToken(null);
    setCurrentUser(null);
  }

  if (!currentUser) {
    return (
      <AuthScreen users={mockUsers} onLogin={handleLogin} error={authError} />
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <span className="topbar__title">Signed in as {currentUser.name}</span>
        <button type="button" className="btn" onClick={handleLogout}>
          Log out
        </button>
      </header>
      <ChatLayout currentUser={currentUser} />
    </div>
  );
}
