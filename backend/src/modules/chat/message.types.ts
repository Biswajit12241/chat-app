import { Timestamp, FieldValue } from 'firebase-admin/firestore';

export interface ChatMessage {
  messageId: string;
  chatId: number;
  senderId: number;
  text: string;
  timestamp: string;
  readBy: number[];
}

export interface FirestoreMessageDoc {
  senderId: number;
  text: string;
  timestamp: Timestamp | FieldValue;
  readBy: number[];
}

export interface FirestoreLastSeenDoc {
  userId: number;
  lastSeenMessageId: string;
  messageTimestamp?: Timestamp | number;
  updatedAt: Timestamp | FieldValue;
}

export interface SendMessageDTO {
  senderId: number;
  text: string;
}

export interface PaginationMeta {
  limit: number;
  nextCursor: string | null;
  hasMore: boolean;
}

export interface MessagesResponse {
  messages: ChatMessage[];
  pagination: PaginationMeta;
}

export interface LastSeenInfo {
  userId: number;
  lastSeenMessageId: string;
  updatedAt: string;
}
