import { useState } from "react";
import type { User } from "../../types/chat";
import { useConversations } from "../../hooks/useConversations";
import { ConversationListContainer } from "../ConversationList/ConversationListContainer";
import { MessagesListContainer } from "../MessagesList/MessagesListContainer";

interface ChatLayoutProps {
  currentUser: User;
}

export function ChatLayout({ currentUser }: ChatLayoutProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);

  // Lifted here so the thread knows the selected conversation's `type` (to pick
  // the streaming vs. REST send path) while the sidebar still owns the list UI.
  const { conversations, isLoading, error, reloadConversations } =
    useConversations(currentUser.id);

  const selectedConversation =
    conversations.find(
      (conversation) => conversation.id === selectedConversationId
    ) ?? null;

  return (
    <main className="chat-layout">
      <aside className="chat-layout__sidebar">
        <ConversationListContainer
          currentUserId={currentUser.id}
          conversations={conversations}
          isLoading={isLoading}
          error={error}
          reloadConversations={reloadConversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
        />
      </aside>

      <section className="chat-layout__thread">
        <MessagesListContainer
          conversationId={selectedConversationId}
          conversationType={selectedConversation?.type ?? null}
          currentUserId={currentUser.id}
        />
      </section>
    </main>
  );
}