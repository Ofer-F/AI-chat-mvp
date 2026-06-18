export interface User {
    id: string;
    name: string;
    email: string;
}

export type PublicUser = User;

export type MessageStatus = 'sent' | 'pending' | 'failed';

export interface Message {
    id: string;
    conversationId: string;
    body: string;
    senderId: string;
    createdAt: string;
    status: MessageStatus;
}

export interface Conversation {
    id: string;
    title: string;
    participantIds: string[];
    lastMessage: Message | null;
    updatedAt: string;
}