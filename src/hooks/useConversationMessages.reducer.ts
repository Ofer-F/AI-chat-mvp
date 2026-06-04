import type { Message } from "../types/chat";

export interface MessagesState {
    messages: Message[];
    nextCursor: string | null;
    isLoading: boolean;
    isLoadingMore: boolean;
    error: string | null;
}

export const initialMessagesState: MessagesState = {
    messages: [],
    nextCursor: null,
    isLoading: false,
    isLoadingMore: false,
    error: null,
};

export type MessagesAction =
    | { type: "reset" }
    | { type: "initialLoadStarted" }
    | {
        type: "initialLoadSucceeded";
        messages: Message[];
        nextCursor: string | null;
    }
    | { type: "initialLoadFailed"; error: string }
    | { type: "loadMoreStarted" }
    | {
        type: "loadMoreSucceeded";
        messages: Message[];
        nextCursor: string | null;
    }
    | { type: "loadMoreFailed"; error: string }
    | { type: "messageOptimisticAdded"; message: Message }
    | { type: "messageSendConfirmed"; temporaryId: string; message: Message }
    | { type: "messageSendFailed"; temporaryId: string; error: string }
    | { type: "errorDismissed" };  

export function messagesReducer(
    state: MessagesState,
    action: MessagesAction
): MessagesState {

    switch (action.type) {
        case "reset":
            return initialMessagesState;

        case "initialLoadStarted":
            return { ...state, isLoading: true, error: null };

        case "initialLoadSucceeded":
            return {
                ...state,
                isLoading: false,
                messages: action.messages,
                nextCursor: action.nextCursor,
            };

        case "initialLoadFailed":
            return {
                ...state,
                isLoading: false,
                messages: [],
                nextCursor: null,
                error: action.error,
            };

        case "loadMoreStarted":
            return { ...state, isLoadingMore: true, error: null };

        case "loadMoreSucceeded":
            return {
                ...state,
                isLoadingMore: false,
                messages: [...state.messages, ...action.messages],
                nextCursor: action.nextCursor,
            };

        case "loadMoreFailed":
            return { ...state, isLoadingMore: false, error: action.error };

        case "messageOptimisticAdded":
            return {
                ...state,
                error: null,
                messages: [...state.messages, action.message],
            };

        case "messageSendConfirmed":
            return {
                ...state,
                messages: state.messages.map((message) =>
                    message.id === action.temporaryId ? action.message : message
                ),
            };

        case "messageSendFailed":
            return {
                ...state,
                error: action.error,
                messages: state.messages.filter(
                    (message) => message.id !== action.temporaryId
                ),
            };

        case "errorDismissed":
            return { ...state, error: null };
    }
}