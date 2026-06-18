import { useConversations } from "../../hooks/useConversations";
import { ConversationListPresentational } from "./ConversationListPresentational";
import { NewConversation } from "./NewConversation";

interface ConversationListContainerProps {
  currentUserId: string;
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
}

export function ConversationListContainer({
  currentUserId,
  selectedConversationId,
  onSelectConversation,
}: ConversationListContainerProps) {
  const { conversations, isLoading, error, reloadConversations } =
    useConversations(currentUserId);

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
        onSelectConversation={onSelectConversation}
        isLoading={isLoading}
        error={error}
      />
    </>
  );
}
