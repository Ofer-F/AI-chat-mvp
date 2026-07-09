import type { ConversationType, Message } from "../../types/chat";
import { ASSISTANT_SENDER_ID } from "../../constants";

interface MessageBubbleProps {
  message: Message;
  currentUserId: string;
  conversationType: ConversationType | null;
}

export function MessageBubble({
  message,
  currentUserId,
  conversationType,
}: MessageBubbleProps) {
  const isOwnMessage = message.senderId === currentUserId;
  const isAssistant = message.senderId === ASSISTANT_SENDER_ID;

  const variant = isOwnMessage ? "own" : isAssistant ? "assistant" : null;
  const rowClass = variant ? `bubble-row bubble-row--${variant}` : "bubble-row";
  const bubbleClass = variant ? `bubble bubble--${variant}` : "bubble";

  const assistantLabel =
    conversationType === "tutor" ? "AI Tutor" : "AI Assistant";
  const senderLabel = isOwnMessage
    ? "Me"
    : isAssistant
      ? assistantLabel
      : message.senderId;

  const isStreaming = isAssistant && message.status === "pending";
  const isShowingToolProgress = isStreaming && Boolean(message.toolProgress);
  const isAwaitingFirstToken =
    isStreaming && message.body.length === 0 && !isShowingToolProgress;

  return (
    <div className={rowClass}>
      <article className={bubbleClass}>
        <span className="bubble__sender">{senderLabel}</span>

        {isShowingToolProgress ? (
          <p className="bubble__tool-progress" aria-live="polite">
            <span className="bubble__tool-progress-spinner" aria-hidden="true" />
            {message.toolProgress}
          </p>
        ) : isAwaitingFirstToken ? (
          <p className="bubble__typing" aria-label="Assistant is typing">
            <span className="bubble__typing-dot" />
            <span className="bubble__typing-dot" />
            <span className="bubble__typing-dot" />
          </p>
        ) : (
          <p className="bubble__body">
            {message.body}
            {isStreaming && <span className="bubble__cursor" aria-hidden="true" />}
          </p>
        )}

        {message.citations && message.citations.length > 0 ? (
          <div className="bubble__sources">
            <span className="bubble__sources-label">
              Sources ({message.citations.length})
            </span>
            <ul className="bubble__sources-list">
              {message.citations.map((citation) => (
                <li key={citation.id}>
                  <details className="bubble__source">
                    <summary className="bubble__source-name">
                      {citation.documentName}
                    </summary>
                    <p className="bubble__source-text">{citation.text}</p>
                  </details>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {!isAssistant && message.status === "pending" && (
          <small className="bubble__status">Sending…</small>
        )}
        {message.status === "failed" && (
          <small className="bubble__status bubble__status--failed">
            Failed to send
          </small>
        )}
      </article>
    </div>
  );
}
