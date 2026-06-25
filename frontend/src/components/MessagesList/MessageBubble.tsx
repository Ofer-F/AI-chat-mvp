import type { Message } from "../../types/chat";
import { ASSISTANT_SENDER_ID } from "../../constants";

interface MessageBubbleProps {
  message: Message;
  currentUserId: string;
}

export function MessageBubble({ message, currentUserId }: MessageBubbleProps) {
  const isOwnMessage = message.senderId === currentUserId;
  const isAssistant = message.senderId === ASSISTANT_SENDER_ID;

  const variant = isOwnMessage ? "own" : isAssistant ? "assistant" : null;
  const rowClass = variant ? `bubble-row bubble-row--${variant}` : "bubble-row";
  const bubbleClass = variant ? `bubble bubble--${variant}` : "bubble";

  const senderLabel = isOwnMessage
    ? "Me"
    : isAssistant
      ? "AI Assistant"
      : message.senderId;

  // While the assistant reply streams in, its placeholder stays `pending`: show
  // a typing indicator before the first token, then the growing text with a
  // blinking cursor.
  const isStreaming = isAssistant && message.status === "pending";
  const isAwaitingFirstToken = isStreaming && message.body.length === 0;

  return (
    <div className={rowClass}>
      <article className={bubbleClass}>
        <span className="bubble__sender">{senderLabel}</span>

        {isAwaitingFirstToken ? (
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
