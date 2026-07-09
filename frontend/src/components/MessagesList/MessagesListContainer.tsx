import type { JSX } from "react";
import type { ConversationType } from "../../types/chat";
import { useConversationMessages } from "../../hooks/useConversationMessages";
import { useSendMessage } from "../../hooks/useSendMessage";
import { useAssistantStream } from "../../hooks/useAssistantStream";
import { MessagesListPresentational } from "./MessagesListPresentational";
import { MessageComposer } from "../MessageComposer/MessageComposer";
import { KnowledgePanel } from "../Knowledge/KnowledgePanel";
import { Toast } from "../Toast/Toast";

interface MessagesListContainerProps {
  conversationId: string | null;
  conversationType: ConversationType | null;
  currentUserId: string;
}

export function MessagesListContainer({
  conversationId,
  conversationType,
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
  const { sendAssistantMessage } = useAssistantStream(conversationId, dispatch);

  const isAiThread =
    conversationType === "assistant" || conversationType === "tutor";

  const handleSend = (body: string): Promise<void> =>
    isAiThread
      ? sendAssistantMessage(body, currentUserId)
      : sendNewMessage(body, currentUserId);

  return (
    <>
    {conversationType === "tutor" && conversationId !== null ? (
      <KnowledgePanel />
    ) : null}

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
        onSendMessage={handleSend}
      />
      <Toast message={error} onDismiss={clearError} />
    </>
  );
}