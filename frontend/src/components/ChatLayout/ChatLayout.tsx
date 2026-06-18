import { useState } from "react";
import type { User } from "../../types/chat";
import { ConversationListContainer } from "../ConversationList/ConversationListContainer";
import { MessagesListContainer } from "../MessagesList/MessagesListContainer";

interface ChatLayoutProps {
  currentUser: User;
}

export function ChatLayout({ currentUser }: ChatLayoutProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);

  return (
    <main className="chat-layout">
      <aside className="chat-layout__sidebar">
        <ConversationListContainer
          currentUserId={currentUser.id}
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
        />
      </aside>

      <section className="chat-layout__thread">
        <MessagesListContainer
          conversationId={selectedConversationId}
          currentUserId={currentUser.id}
        />
      </section>
    </main>
  );
}