import { apiClient } from './api';
import type {
  Chat,
  UserChatsResponse,
  CreateChatResponse,
} from '../types/chat.types';
import type {
  ChatMessage,
  MessagesResponse,
  SendMessageResponse,
  MarkReadResponse,
  UpdateLastSeenResponse,
  GetLastSeenResponse,
} from '../types/message.types';

export const chatService = {
  /**
   * API 1: Create or Get Chat
   */
  async createOrGetChat(userAId: number, userBId: number): Promise<CreateChatResponse> {
    const res = await apiClient.post<CreateChatResponse>('/chat/create', {
      userAId,
      userBId,
    });
    return res.data;
  },

  /**
   * API 2: Send Message
   */
  async sendMessage(chatId: number, senderId: number, text: string): Promise<ChatMessage> {
    const res = await apiClient.post<SendMessageResponse>(`/chat/${chatId}/message/send`, {
      senderId,
      text,
    });
    return res.data.message;
  },

  /**
   * API 3: Get Messages (Chronological)
   */
  async getMessages(
    chatId: number,
    limit: number = 50,
    cursor?: string
  ): Promise<MessagesResponse> {
    const params: Record<string, string | number> = { limit };
    if (cursor) {
      params.cursor = cursor;
    }
    const res = await apiClient.get<MessagesResponse>(`/chat/${chatId}/messages`, {
      params,
    });
    return res.data;
  },

  /**
   * API 4: Mark Message Read
   */
  async markMessageRead(
    chatId: number,
    messageId: string,
    userId: number
  ): Promise<MarkReadResponse> {
    const res = await apiClient.post<MarkReadResponse>(
      `/chat/${chatId}/message/${messageId}/read`,
      { userId }
    );
    return res.data;
  },

  /**
   * API 5: Update Last Seen
   */
  async updateLastSeen(
    chatId: number,
    userId: number,
    messageId: string
  ): Promise<UpdateLastSeenResponse> {
    const res = await apiClient.post<UpdateLastSeenResponse>(
      `/chat/${chatId}/lastseen`,
      { userId, messageId }
    );
    return res.data;
  },

  /**
   * API 6: List User Chats
   */
  async getUserChats(userId: number): Promise<Chat[]> {
    const res = await apiClient.get<UserChatsResponse>(`/user/${userId}/chats`);
    return res.data.chats;
  },

  /**
   * Helper: Get Chat Last Seen records
   */
  async getLastSeen(chatId: number): Promise<Record<string, { lastSeenMessageId: string; updatedAt: string }>> {
    const res = await apiClient.get<GetLastSeenResponse>(`/chat/${chatId}/lastseen`);
    return res.data.lastSeen;
  },
};
