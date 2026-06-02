import { render, screen } from "@testing-library/react";
import type { Conversation } from "../../types/chat";
import { ConversationListPresentational } from "./ConversationListPresentational";

const noop = (): void => {};

const sampleConversation: Conversation = {
  id: "c1",
  title: "Dana and Maya",
  participantIds: ["u1", "u2"],
  lastMessage: {
    id: "m1",
    conversationId: "c1",
    senderId: "u2",
    body: "See you later!",
    createdAt: "2026-05-28T12:00:00.000Z",
    status: "sent",
  },
  updatedAt: "2026-05-28T12:00:00.000Z",
};

describe("ConversationListPresentational", () => {
  it("renders the loading skeleton while isLoading is true", () => {
    render(
      <ConversationListPresentational
        conversations={[]}
        selectedConversationId={null}
        isLoading={true}
        error={null}
        onSelectConversation={noop}
      />
    );

    expect(
      screen.getByRole("list", { name: /loading conversations/i })
    ).toBeInTheDocument();
  });

  it("renders the empty state when there are no conversations", () => {
    render(
      <ConversationListPresentational
        conversations={[]}
        selectedConversationId={null}
        isLoading={false}
        error={null}
        onSelectConversation={noop}
      />
    );

    expect(screen.getByText(/no conversations yet/i)).toBeInTheDocument();
  });

  it("renders the conversation title and last-message preview when loaded", () => {
    render(
      <ConversationListPresentational
        conversations={[sampleConversation]}
        selectedConversationId={null}
        isLoading={false}
        error={null}
        onSelectConversation={noop}
      />
    );

    expect(screen.getByText("Dana and Maya")).toBeInTheDocument();
    expect(screen.getByText("See you later!")).toBeInTheDocument();
  });
});
