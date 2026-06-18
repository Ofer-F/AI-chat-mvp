import { useState, type FormEvent, type JSX } from "react";
import type { PublicUser } from "../../types/chat";
import { ApiError, authApiClient } from "../../api/apiClient";

interface AuthScreenProps {
  onAuthenticated: (user: PublicUser) => void;
}

type AuthMode = "login" | "signup";

const MIN_PASSWORD_LENGTH = 6;

export function AuthScreen({ onAuthenticated }: AuthScreenProps): JSX.Element {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignup = mode === "signup";

  function switchMode(nextMode: AuthMode): void {
    setMode(nextMode);
    setError(null);
    setDetails([]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setDetails([]);

    if (isSignup && password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = isSignup
        ? await authApiClient.signup({ email, password, name })
        : await authApiClient.login({ email, password });
      onAuthenticated(response.user);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
        setDetails(
          Array.isArray(caught.details)
            ? (caught.details as string[]).filter(
                (item) => typeof item === "string"
              )
            : []
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth">
      <form className="auth__card" onSubmit={handleSubmit}>
        <h1 className="auth__title">{isSignup ? "Create account" : "Sign in"}</h1>
        <p className="auth__hint">
          {isSignup
            ? "Sign up to start chatting."
            : "Sign in with your email and password."}
        </p>

        {error ? (
          <p className="auth__error" role="alert">
            {error}
          </p>
        ) : null}

        {details.length > 1 ? (
          <ul className="auth__error-details" role="alert">
            {details.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}

        {isSignup ? (
          <label className="auth__field">
            <span className="auth__label">Name</span>
            <input
              className="auth__input"
              type="text"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
        ) : null}

        <label className="auth__field">
          <span className="auth__label">Email</span>
          <input
            className="auth__input"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="auth__field">
          <span className="auth__label">Password</span>
          <input
            className="auth__input"
            type="password"
            name="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={isSignup ? MIN_PASSWORD_LENGTH : undefined}
            required
          />
        </label>

        <button
          type="submit"
          className="btn auth__submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting
            ? "Please wait…"
            : isSignup
              ? "Create account"
              : "Sign in"}
        </button>

        <p className="auth__switch">
          {isSignup ? "Already have an account?" : "Need an account?"}{" "}
          <button
            type="button"
            className="auth__switch-btn"
            onClick={() => switchMode(isSignup ? "login" : "signup")}
          >
            {isSignup ? "Sign in" : "Sign up"}
          </button>
        </p>
      </form>
    </main>
  );
}
