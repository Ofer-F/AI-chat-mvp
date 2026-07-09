import { useState } from "react";
import type { User } from "../../types/chat";
import { useConversations } from "../../hooks/useConversations";
import { ApiError, conversationApiClient } from "../../api/apiClient";
import { ConversationListContainer } from "../ConversationList/ConversationListContainer";
import { MessagesListContainer } from "../MessagesList/MessagesListContainer";

interface ChatLayoutProps {
  currentUser: User;
}

export function ChatLayout({ currentUser }: ChatLayoutProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [deletingConversationId, setDeletingConversationId] = useState<
    string | null
  >(null);

  const { conversations, isLoading, error, reloadConversations } =
    useConversations(currentUser.id);

  const selectedConversation =
    conversations.find(
      (conversation) => conversation.id === selectedConversationId
    ) ?? null;

  async function handleDeleteConversation(
    conversationId: string
  ): Promise<void> {
    const conversation = conversations.find(
      (item) => item.id === conversationId
    );
    const confirmed = window.confirm(
      `Delete "${conversation?.title ?? "this conversation"}"? This cannot be undone.`
    );
    if (!confirmed) {
      return;
    }

    setDeletingConversationId(conversationId);
    try {
      await conversationApiClient.deleteConversation(conversationId);
      if (selectedConversationId === conversationId) {
        setSelectedConversationId(null);
      }
      await reloadConversations();
    } catch (caught) {
      window.alert(
        caught instanceof ApiError
          ? caught.message
          : "Could not delete conversation."
      );
    } finally {
      setDeletingConversationId(null);
    }
  }

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
          deletingConversationId={deletingConversationId}
          onSelectConversation={setSelectedConversationId}
          onDeleteConversation={handleDeleteConversation}
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