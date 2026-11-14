import { Request, Response } from 'express';
import { ChatService } from './chat.service';
import { MessageService } from './message.service';
import { ApiResponse } from '../../utils/ApiResponse';
import {
  parsePositiveInt,
  parseNonEmptyString,
} from '../../middleware/validation.middleware';

export class ChatController {
  private chatService: ChatService;
  private messageService: MessageService;

  constructor() {
    this.chatService = new ChatService();
    this.messageService = new MessageService();
  }

  /**
   * API 1: Create or Get Chat
   * POST /chat/create
   */
  createChat = async (req: Request, res: Response): Promise<void> => {
    const userAId = parsePositiveInt(req.body.userAId, 'userAId');
    const userBId = parsePositiveInt(req.body.userBId, 'userBId');

    const result = await this.chatService.createOrGetChat(userAId, userBId);

    res.status(result.isNew ? 201 : 200).json({
      success: true,
      chatId: result.chatId,
      message: result.message,
    });
  };

  /**
   * API 2: Send Message
   * POST /chat/:chatId/message/send
   */
  sendMessage = async (req: Request, res: Response): Promise<void> => {
    const chatId = parsePositiveInt(req.params.chatId, 'chatId');
    const senderId = parsePositiveInt(req.body.senderId, 'senderId');
    const text = parseNonEmptyString(req.body.text, 'text');

    // Verify sender belongs to the chat and chat exists
    await this.chatService.verifyChatMembership(chatId, senderId);

    // Save message in Firestore
    const createdMessage = await this.messageService.sendMessage(chatId, senderId, text);

    res.status(201).json({
      success: true,
      message: createdMessage,
    });
  };

  /**
   * API 3: Get Messages
   * GET /chat/:chatId/messages?limit=50&cursor=...
   */
  getMessages = async (req: Request, res: Response): Promise<void> => {
    const chatId = parsePositiveInt(req.params.chatId, 'chatId');
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const cursor = typeof req.query.cursor === 'string' && req.query.cursor.trim() ? req.query.cursor.trim() : undefined;

    // Verify chat exists in MySQL
    await this.chatService.verifyChatExists(chatId);

    const result = await this.messageService.getMessages(chatId, limit, cursor);

    res.status(200).json({
      success: true,
      messages: result.messages,
      pagination: result.pagination,
    });
  };

  /**
   * API 4: Mark Message Read
   * POST /chat/:chatId/message/:messageId/read
   */
  markMessageRead = async (req: Request, res: Response): Promise<void> => {
    const chatId = parsePositiveInt(req.params.chatId, 'chatId');
    const messageId = parseNonEmptyString(req.params.messageId, 'messageId');
    const userId = parsePositiveInt(req.body.userId, 'userId');

    // Verify user belongs to chat
    await this.chatService.verifyChatMembership(chatId, userId);

    const { readBy } = await this.messageService.markMessageAsRead(chatId, messageId, userId);

    res.status(200).json({
      success: true,
      message: 'Message marked as read',
      readBy,
    });
  };

  /**
   * API 5: Update Last Seen Message
   * POST /chat/:chatId/lastseen
   */
  updateLastSeen = async (req: Request, res: Response): Promise<void> => {
    const chatId = parsePositiveInt(req.params.chatId, 'chatId');
    const userId = parsePositiveInt(req.body.userId, 'userId');
    const messageId = parseNonEmptyString(req.body.messageId, 'messageId');

    // Verify user belongs to chat
    await this.chatService.verifyChatMembership(chatId, userId);

    const lastSeen = await this.messageService.updateLastSeen(chatId, userId, messageId);

    res.status(200).json({
      success: true,
      message: 'Last seen updated successfully',
      lastSeen,
    });
  };

  /**
   * Get Last Seen Map for Chat (Helper for Frontend UI)
   * GET /chat/:chatId/lastseen
   */
  getChatLastSeen = async (req: Request, res: Response): Promise<void> => {
    const chatId = parsePositiveInt(req.params.chatId, 'chatId');
    await this.chatService.verifyChatExists(chatId);

    const lastSeen = await this.messageService.getChatLastSeen(chatId);
    ApiResponse.success(res, { lastSeen });
  };
}
