import { RowDataPacket } from 'mysql2';

export interface Chat {
  id: number;
  user_low_id: number;
  user_high_id: number;
  created_at?: Date | string;
}

export interface ChatRow extends RowDataPacket {
  id: number;
  user_low_id: number;
  user_high_id: number;
  created_at: Date;
}

export interface ChatParticipantRow extends RowDataPacket {
  id: number;
  chat_id: number;
  user_id: number;
  joined_at: Date;
}

export interface UserChatListItem {
  chatId: number;
  members: number[];
  otherMember?: {
    id: number;
    name: string;
    email: string;
  };
  createdAt?: Date | string;
}

export interface CreateChatDTO {
  userAId: number;
  userBId: number;
}
