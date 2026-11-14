export interface ChatMessage {
  messageId: string;
  chatId: number;
  senderId: number;
  text: string;
  timestamp: string;
  readBy: number[];
}

export interface PaginationMeta {
  limit: number;
  nextCursor: string | null;
  hasMore: boolean;
}

export interface MessagesResponse {
  success: boolean;
  messages: ChatMessage[];
  pagination: PaginationMeta;
}

export interface SendMessageResponse {
  success: boolean;
  message: ChatMessage;
}

export interface MarkReadResponse {
  success: boolean;
  message: string;
  readBy: number[];
}

export interface LastSeenInfo {
  userId: number;
  lastSeenMessageId: string;
  updatedAt: string;
}

export interface UpdateLastSeenResponse {
  success: boolean;
  message: string;
  lastSeen: LastSeenInfo;
}

export interface GetLastSeenResponse {
  success: boolean;
  lastSeen: Record<string, { lastSeenMessageId: string; updatedAt: string }>;
}
