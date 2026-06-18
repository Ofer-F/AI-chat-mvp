import type { JSX } from "react";
import type { Conversation } from "../../types/chat";
import { ConversationListSkeleton } from "./ConversationListSkeleton";

interface ConversationListPresentationalProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  isLoading: boolean;
  error: string | null;
  onSelectConversation: (conversationId: string) => void;
}

export function ConversationListPresentational({
  conversations,
  selectedConversationId,
  isLoading,
  error,
  onSelectConversation,
}: ConversationListPresentationalProps): JSX.Element {
  if (isLoading) {
    return <ConversationListSkeleton />;
  }

  if (error) {
    return (
      <p role="alert" className="list-empty">
        {error}
      </p>
    );
  }

  if (conversations.length === 0) {
    return <p className="list-empty">No conversations yet.</p>;
  }

  return (
    <ul className="conversation-list">
      {conversations.map((conversation) => {
        const isSelected = conversation.id === selectedConversationId;
        const itemClass = isSelected
          ? "conversation-item conversation-item--selected"
          : "conversation-item";

        return (
          <li key={conversation.id}>
            <button
              type="button"
              className={itemClass}
              onClick={() => onSelectConversation(conversation.id)}
              aria-pressed={isSelected}
            >
              <span className="conversation-item__title">
                {conversation.title}
              </span>
              <span className="conversation-item__preview">
                {conversation.lastMessage?.body ?? "No messages yet"}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
