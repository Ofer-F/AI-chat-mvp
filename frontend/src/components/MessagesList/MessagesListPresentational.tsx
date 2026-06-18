import { useEffect, useRef } from "react";
import type { JSX } from "react";
import type { Message } from "../../types/chat";
import { MessageBubble } from "./MessageBubble";
import { MessagesListSkeleton } from "./MessagesListSkeleton";

interface MessagesListPresentationalProps {
  messages: Message[];
  currentUserId: string;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  isLoadingMore: boolean;
  hasSelectedConversation: boolean;
  onLoadMore: () => void;
}

export function MessagesListPresentational({
  messages,
  currentUserId,
  isLoading,
  hasMore,
  isLoadingMore,
  hasSelectedConversation,
  onLoadMore,
}: MessagesListPresentationalProps): JSX.Element {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!hasSelectedConversation) {
    return (
      <div className="message-thread message-thread--empty">
        <p className="list-empty">Select a conversation to view messages.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="message-thread">
        <MessagesListSkeleton />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="message-thread message-thread--empty">
        <p className="list-empty">No messages yet. Send the first message.</p>
      </div>
    );
  }

  return (
    <section className="message-thread">
      {hasMore && (
        <button
          type="button"
          className="btn message-thread__load-more"
          onClick={onLoadMore}
          disabled={isLoadingMore}
          aria-busy={isLoadingMore}
        >
          {isLoadingMore ? "Loading…" : "Load more messages"}
        </button>
      )}

      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          currentUserId={currentUserId}
        />
      ))}
      <div ref={messagesEndRef} />
    </section>
  );
}
