import { ChatRepository } from './chat.repository';
import { UserService } from '../users/user.service';
import { ApiError } from '../../utils/ApiError';
import { UserChatListItem } from './chat.types';

export class ChatService {
  private chatRepo: ChatRepository;
  private userService: UserService;

  constructor() {
    this.chatRepo = new ChatRepository();
    this.userService = new UserService();
  }

  /**
   * API 1: Create or Get Chat between two users
   */
  async createOrGetChat(
    userAId: number,
    userBId: number
  ): Promise<{ chatId: number; message: string; isNew: boolean }> {
    if (userAId === userBId) {
      throw ApiError.badRequest('A user cannot create a chat with themselves');
    }

    // Verify both users exist in MySQL
    await this.userService.validateUsersExist(userAId, userBId);

    const userLowId = Math.min(userAId, userBId);
    const userHighId = Math.max(userAId, userBId);

    // Check if chat already exists
    const existingChat = await this.chatRepo.findChatByUsers(userLowId, userHighId);
    if (existingChat) {
      return {
        chatId: existingChat.id,
        message: 'Chat already exists',
        isNew: false,
      };
    }

    // Try creating chat in transaction (handles concurrent duplicates gracefully)
    try {
      const newChatId = await this.chatRepo.createChatWithParticipants(userLowId, userHighId);
      return {
        chatId: newChatId,
        message: 'Chat created successfully',
        isNew: true,
      };
    } catch (err: unknown) {
      // In case of race condition / concurrent creation
      if (typeof err === 'object' && err !== null && 'code' in err) {
        const sqlError = err as { code: string };
        if (sqlError.code === 'ER_DUP_ENTRY') {
          const chat = await this.chatRepo.findChatByUsers(userLowId, userHighId);
          if (chat) {
            return {
              chatId: chat.id,
              message: 'Chat already exists',
              isNew: false,
            };
          }
        }
      }
      throw err;
    }
  }

  /**
   * Verifies that a chat exists in MySQL.
   */
  async verifyChatExists(chatId: number): Promise<void> {
    const chat = await this.chatRepo.findChatById(chatId);
    if (!chat) {
      throw ApiError.notFound(`Chat with id ${chatId} not found`);
    }
  }

  /**
   * Verifies that a user is an authorized participant in the chat.
   */
  async verifyChatMembership(chatId: number, userId: number): Promise<void> {
    await this.verifyChatExists(chatId);

    const isMember = await this.chatRepo.isParticipant(chatId, userId);
    if (!isMember) {
      throw ApiError.forbidden(`User with id ${userId} is not a participant in chat ${chatId}`);
    }
  }

  /**
   * API 6: List User Chats
   */
  async getUserChats(userId: number): Promise<UserChatListItem[]> {
    // Verify user exists in MySQL
    await this.userService.getUserById(userId);

    return this.chatRepo.findUserChats(userId);
  }
}
