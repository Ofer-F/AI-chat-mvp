import type { JSX } from "react";
import type { User } from "../../types/chat";

interface AuthScreenProps {
  users: User[];
  onLogin: (user: User) => void;
  error?: string | null;
}

export function AuthScreen({
  users,
  onLogin,
  error,
}: AuthScreenProps): JSX.Element {
  return (
    <main className="auth">
      <div className="auth__card">
        <h1 className="auth__title">Sign in</h1>
        <p className="auth__hint">Choose a user to continue.</p>
        {error ? (
          <p className="auth__error" role="alert">
            {error}
          </p>
        ) : null}
        <ul className="auth__list">
          {users.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                className="auth__option"
                onClick={() => onLogin(user)}
              >
                <span className="auth__option-name">{user.name}</span>
                <span className="auth__option-email">{user.email}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
