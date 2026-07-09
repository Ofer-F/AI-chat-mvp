import type { Conversation } from "../../types/chat";
import { ConversationListPresentational } from "./ConversationListPresentational";
import { NewConversation } from "./NewConversation";

interface ConversationListContainerProps {
  currentUserId: string;
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
  reloadConversations: () => Promise<void>;
  selectedConversationId: string | null;
  deletingConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
}

export function ConversationListContainer({
  currentUserId,
  conversations,
  isLoading,
  error,
  reloadConversations,
  selectedConversationId,
  deletingConversationId,
  onSelectConversation,
  onDeleteConversation,
}: ConversationListContainerProps) {
  async function handleCreated(conversationId: string): Promise<void> {
    await reloadConversations();
    onSelectConversation(conversationId);
  }

  return (
    <>
      <NewConversation
        currentUserId={currentUserId}
        onCreated={handleCreated}
      />
      <ConversationListPresentational
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        deletingConversationId={deletingConversationId}
        onSelectConversation={onSelectConversation}
        onDeleteConversation={onDeleteConversation}
        isLoading={isLoading}
        error={error}
      />
    </>
  );
}
