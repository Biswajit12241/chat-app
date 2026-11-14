import { pool } from '../../config/database';
import { Chat, ChatRow, ChatParticipantRow, UserChatListItem } from './chat.types';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface ChatMemberJoinRow extends RowDataPacket {
  chat_id: number;
  created_at: Date;
  member_id: number;
  member_name: string;
  member_email: string;
}

export class ChatRepository {
  async findChatById(chatId: number): Promise<Chat | null> {
    const [rows] = await pool.execute<ChatRow[]>(
      'SELECT id, user_low_id, user_high_id, created_at FROM chats WHERE id = ?',
      [chatId]
    );

    const chat = rows[0];
    if (!chat) return null;

    return {
      id: Number(chat.id),
      user_low_id: Number(chat.user_low_id),
      user_high_id: Number(chat.user_high_id),
      created_at: chat.created_at,
    };
  }

  async findChatByUsers(userLowId: number, userHighId: number): Promise<Chat | null> {
    const [rows] = await pool.execute<ChatRow[]>(
      'SELECT id, user_low_id, user_high_id, created_at FROM chats WHERE user_low_id = ? AND user_high_id = ?',
      [userLowId, userHighId]
    );

    const chat = rows[0];
    if (!chat) return null;

    return {
      id: Number(chat.id),
      user_low_id: Number(chat.user_low_id),
      user_high_id: Number(chat.user_high_id),
      created_at: chat.created_at,
    };
  }

  async isParticipant(chatId: number, userId: number): Promise<boolean> {
    const [rows] = await pool.execute<ChatParticipantRow[]>(
      'SELECT id FROM chat_participants WHERE chat_id = ? AND user_id = ?',
      [chatId, userId]
    );
    return rows.length > 0;
  }

  async getParticipants(chatId: number): Promise<number[]> {
    const [rows] = await pool.execute<ChatParticipantRow[]>(
      'SELECT user_id FROM chat_participants WHERE chat_id = ? ORDER BY user_id ASC',
      [chatId]
    );
    return rows.map((r) => Number(r.user_id));
  }

  /**
   * Creates a chat and its participants in an atomic MySQL transaction.
   */
  async createChatWithParticipants(userLowId: number, userHighId: number): Promise<number> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Insert into chats table
      const [chatResult] = await connection.execute<ResultSetHeader>(
        'INSERT INTO chats (user_low_id, user_high_id) VALUES (?, ?)',
        [userLowId, userHighId]
      );

      const chatId = chatResult.insertId;

      // Insert both participants
      await connection.execute(
        'INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?), (?, ?)',
        [chatId, userLowId, chatId, userHighId]
      );

      await connection.commit();
      return chatId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Retrieves all chats for a given user, joining chats and chat_participants with member info.
   * Ordered by chat creation time descending.
   */
  async findUserChats(userId: number): Promise<UserChatListItem[]> {
    const [rows] = await pool.execute<ChatMemberJoinRow[]>(
      `SELECT 
        c.id AS chat_id,
        c.created_at,
        cp_all.user_id AS member_id,
        u.name AS member_name,
        u.email AS member_email
       FROM chats c
       INNER JOIN chat_participants cp ON c.id = cp.chat_id
       INNER JOIN chat_participants cp_all ON c.id = cp_all.chat_id
       INNER JOIN users u ON cp_all.user_id = u.id
       WHERE cp.user_id = ?
       ORDER BY c.created_at DESC, cp_all.user_id ASC`,
      [userId]
    );

    const chatMap = new Map<number, UserChatListItem>();

    for (const row of rows) {
      const chatId = Number(row.chat_id);
      const memberId = Number(row.member_id);

      if (!chatMap.has(chatId)) {
        chatMap.set(chatId, {
          chatId,
          members: [],
          createdAt: row.created_at,
        });
      }

      const item = chatMap.get(chatId)!;
      item.members.push(memberId);

      // If this member is NOT the requesting user, store as otherMember
      if (memberId !== userId && !item.otherMember) {
        item.otherMember = {
          id: memberId,
          name: row.member_name,
          email: row.member_email,
        };
      }
    }

    return Array.from(chatMap.values());
  }
}
