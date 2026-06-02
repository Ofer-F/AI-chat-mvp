import type { Message } from "../types/chat";
import {
  initialMessagesState,
  messagesReducer,
  type MessagesState,
} from "./useMessages.reducer";

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: "m1",
    conversationId: "c1",
    senderId: "u1",
    body: "hello",
    createdAt: "2026-05-28T12:00:00.000Z",
    status: "sent",
    ...overrides,
  };
}

describe("messagesReducer", () => {
  it("appends an optimistic message and clears any previous error", () => {
    const optimistic = makeMessage({ id: "temp-1", status: "pending" });
    const stateWithError: MessagesState = {
      ...initialMessagesState,
      error: "Could not send message.",
    };

    const next = messagesReducer(stateWithError, {
      type: "messageOptimisticAdded",
      message: optimistic,
    });

    expect(next.messages).toEqual([optimistic]);
    expect(next.error).toBeNull();
  });

  it("replaces the optimistic message with the confirmed one on send success", () => {
    const optimistic = makeMessage({ id: "temp-1", status: "pending" });
    const confirmed = makeMessage({ id: "m-real", status: "sent" });
    const state: MessagesState = {
      ...initialMessagesState,
      messages: [optimistic],
    };

    const next = messagesReducer(state, {
      type: "messageSendConfirmed",
      temporaryId: "temp-1",
      message: confirmed,
    });

    expect(next.messages).toEqual([confirmed]);
    expect(next.messages.some((message) => message.id === "temp-1")).toBe(
      false
    );
  });

  it("rolls back the optimistic message and sets an error on send failure", () => {
    const optimistic = makeMessage({ id: "temp-1", status: "pending" });
    const existing = makeMessage({ id: "m1", status: "sent" });
    const state: MessagesState = {
      ...initialMessagesState,
      messages: [existing, optimistic],
    };

    const next = messagesReducer(state, {
      type: "messageSendFailed",
      temporaryId: "temp-1",
      error: "Could not send message.",
    });

    expect(next.messages).toEqual([existing]);
    expect(next.error).toBe("Could not send message.");
  });
});
