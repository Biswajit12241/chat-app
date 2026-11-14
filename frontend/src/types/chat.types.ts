import type { User } from './user.types';

export interface Chat {
  chatId: number;
  members: number[];
  otherMember?: User;
  createdAt?: string;
}

export interface CreateChatRequest {
  userAId: number;
  userBId: number;
}

export interface CreateChatResponse {
  success: boolean;
  chatId: number;
  message: string;
}

export interface UserChatsResponse {
  success: boolean;
  chats: Chat[];
}
