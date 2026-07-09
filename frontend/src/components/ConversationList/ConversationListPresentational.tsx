import type { JSX } from "react";
import type { Conversation, ConversationType } from "../../types/chat";
import { ConversationListSkeleton } from "./ConversationListSkeleton";

const TYPE_BADGES: Record<ConversationType, string> = {
  human: "Chat",
  assistant: "Assistant",
  tutor: "Tutor",
};

interface ConversationListPresentationalProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  isLoading: boolean;
  error: string | null;
  deletingConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
}

export function ConversationListPresentational({
  conversations,
  selectedConversationId,
  isLoading,
  error,
  deletingConversationId,
  onSelectConversation,
  onDeleteConversation,
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
        const isDeleting = conversation.id === deletingConversationId;
        const rowClass = isSelected
          ? "conversation-row conversation-row--selected"
          : "conversation-row";

        return (
          <li key={conversation.id} className={rowClass}>
            <button
              type="button"
              className="conversation-item"
              onClick={() => onSelectConversation(conversation.id)}
              aria-pressed={isSelected}
            >
              <span className="conversation-item__header">
                <span className="conversation-item__title">
                  {conversation.title}
                </span>
                <span
                  className={`conversation-item__badge conversation-item__badge--${conversation.type}`}
                >
                  {TYPE_BADGES[conversation.type]}
                </span>
              </span>
              <span className="conversation-item__preview">
                {conversation.lastMessage?.body ?? "No messages yet"}
              </span>
            </button>
            <button
              type="button"
              className="conversation-row__delete"
              onClick={() => onDeleteConversation(conversation.id)}
              disabled={isDeleting}
              aria-busy={isDeleting}
              aria-label={`Delete conversation ${conversation.title}`}
              title="Delete conversation"
            >
              {isDeleting ? "…" : "×"}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
