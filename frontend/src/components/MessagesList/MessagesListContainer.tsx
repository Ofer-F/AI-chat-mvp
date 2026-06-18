import type { JSX } from "react";
import { useConversationMessages } from "../../hooks/useConversationMessages";
import { useSendMessage } from "../../hooks/useSendMessage";
import { MessagesListPresentational } from "./MessagesListPresentational";
import { MessageComposer } from "../MessageComposer/MessageComposer";
import { Toast } from "../Toast/Toast";

interface MessagesListContainerProps {
  conversationId: string | null;
  currentUserId: string;
}

export function MessagesListContainer({
  conversationId,
  currentUserId,
}: MessagesListContainerProps): JSX.Element {
  const {
    messages,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMoreMessages,
    clearError,
    dispatch,
  } = useConversationMessages(conversationId);

  const { sendNewMessage } = useSendMessage(conversationId, dispatch);

  return (
    <>
    <MessagesListPresentational
      messages={messages}
      currentUserId={currentUserId}
      isLoading={isLoading}
      isLoadingMore={isLoadingMore}
      error={error}
      hasMore={hasMore}
      onLoadMore={loadMoreMessages}
      hasSelectedConversation={conversationId !== null}
    />

    <MessageComposer
        disabled={conversationId === null}
        onSendMessage={(body) => sendNewMessage(body, currentUserId)}
      />
      <Toast message={error} onDismiss={clearError} />
    </>
  );
}