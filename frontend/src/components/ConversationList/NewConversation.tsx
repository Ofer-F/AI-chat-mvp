import { useState, type FormEvent, type JSX } from "react";
import { ApiError, conversationApiClient } from "../../api/apiClient";
import { useUsers } from "../../hooks/useUsers";

interface NewConversationProps {
  currentUserId: string;
  onCreated: (conversationId: string) => void;
}

export function NewConversation({
  currentUserId,
  onCreated,
}: NewConversationProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    users,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useUsers();

  const selectableUsers = users.filter((user) => user.id !== currentUserId);

  function reset(): void {
    setTitle("");
    setParticipantIds([]);
    setError(null);
  }

  function toggleParticipant(id: string): void {
    setParticipantIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }
    if (participantIds.length === 0) {
      setError("Select at least one participant.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await conversationApiClient.createConversation({
        title: title.trim(),
        participantIds,
      });
      reset();
      setIsOpen(false);
      onCreated(response.conversation.id);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not create conversation."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return (
      <div className="new-conversation">
        <button
          type="button"
          className="btn new-conversation__open"
          onClick={() => setIsOpen(true)}
        >
          New conversation
        </button>
      </div>
    );
  }

  return (
    <form className="new-conversation new-conversation--open" onSubmit={handleSubmit}>
      {error ? (
        <p className="auth__error" role="alert">
          {error}
        </p>
      ) : null}

      <label className="auth__field">
        <span className="auth__label">Title</span>
        <input
          className="auth__input"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </label>

      <fieldset className="new-conversation__participants">
        <legend className="auth__label">Participants</legend>
        {isLoadingUsers ? (
          <p className="auth__hint">Loading users…</p>
        ) : usersError ? (
          <p className="auth__error" role="alert">
            {usersError}
          </p>
        ) : selectableUsers.length === 0 ? (
          <p className="auth__hint">No other users yet.</p>
        ) : (
          selectableUsers.map((user) => (
            <label key={user.id} className="new-conversation__participant">
              <input
                type="checkbox"
                checked={participantIds.includes(user.id)}
                onChange={() => toggleParticipant(user.id)}
              />
              <span>
                {user.name} ({user.email})
              </span>
            </label>
          ))
        )}
      </fieldset>

      <div className="new-conversation__actions">
        <button
          type="submit"
          className="btn"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? "Creating…" : "Create"}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            reset();
            setIsOpen(false);
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
