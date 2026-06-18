import { useState } from "react";
import type { JSX } from "react";

interface MessageComposerProps {
  disabled: boolean;
  onSendMessage: (body: string) => Promise<void>;
}

export function MessageComposer({
  disabled,
  onSendMessage,
}: MessageComposerProps): JSX.Element {
  const [body, setBody] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);

  const trimmedBody = body.trim();
  const isSubmitDisabled = disabled || isSending || trimmedBody.length === 0;

  async function handleSubmit(): Promise<void> {
    if (isSubmitDisabled) {
      return;
    }

    try {
        setIsSending(true);
        await onSendMessage(trimmedBody);
        setBody("");
      } finally {
        setIsSending(false);
      }
  }

  function handleFormSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void handleSubmit();
  }

  function handleBodyChange(
    event: React.ChangeEvent<HTMLTextAreaElement>
  ): void {
    setBody(event.target.value);
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ): void {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  }

  return (
    <form className="composer" onSubmit={handleFormSubmit}>
      <textarea
        className="composer__input"
        value={body}
        disabled={disabled || isSending}
        placeholder={
          disabled ? "Select a conversation first" : "Type a message…"
        }
        rows={1}
        onChange={handleBodyChange}
        onKeyDown={handleKeyDown}
      />

      <button
        type="submit"
        className="btn btn--primary"
        disabled={isSubmitDisabled}
      >
        {isSending ? "Sending…" : "Send"}
      </button>
    </form>
  );
}