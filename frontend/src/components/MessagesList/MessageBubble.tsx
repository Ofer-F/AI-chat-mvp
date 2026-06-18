import type { Message } from "../../types/chat";

interface MessageBubbleProps {
  message: Message;
  currentUserId: string;
}

export function MessageBubble({ message, currentUserId }: MessageBubbleProps) {
  const isOwnMessage = message.senderId === currentUserId;
  const rowClass = isOwnMessage ? "bubble-row bubble-row--own" : "bubble-row";
  const bubbleClass = isOwnMessage ? "bubble bubble--own" : "bubble";

  return (
    <div className={rowClass}>
      <article className={bubbleClass}>
        <span className="bubble__sender">
          {isOwnMessage ? "Me" : message.senderId}
        </span>
        <p className="bubble__body">{message.body}</p>

        {message.status === "pending" && (
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
