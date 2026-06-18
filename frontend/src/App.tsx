import { useEffect, useState } from "react";
import type { PublicUser } from "./types/chat";
import { ChatLayout } from "./components/ChatLayout/ChatLayout";
import { AuthScreen } from "./components/AuthScreen/AuthScreen";
import {
  authApiClient,
  getAuthToken,
  setUnauthorizedHandler,
} from "./api/apiClient";

type SessionStatus = "restoring" | "guest" | "authenticated";

export default function App() {
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [status, setStatus] = useState<SessionStatus>(() =>
    getAuthToken() ? "restoring" : "guest"
  );

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setCurrentUser(null);
      setStatus("guest");
    });

    if (!getAuthToken()) {
      return () => setUnauthorizedHandler(null);
    }

    let active = true;
    authApiClient
      .getMe()
      .then((user) => {
        if (!active) return;
        setCurrentUser(user);
        setStatus("authenticated");
      })
      .catch(() => {
        if (!active) return;
        authApiClient.logout();
        setStatus("guest");
      });

    return () => {
      active = false;
      setUnauthorizedHandler(null);
    };
  }, []);

  function handleAuthenticated(user: PublicUser): void {
    setCurrentUser(user);
    setStatus("authenticated");
  }

  function handleLogout(): void {
    authApiClient.logout();
    setCurrentUser(null);
    setStatus("guest");
  }

  if (status === "restoring") {
    return (
      <main className="auth">
        <div className="auth__card">
          <p className="auth__hint">Restoring your session…</p>
        </div>
      </main>
    );
  }

  if (status === "guest" || !currentUser) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
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
