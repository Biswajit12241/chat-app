import { Request, Response } from 'express';
import { UserService } from './user.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { parsePositiveInt } from '../../middleware/validation.middleware';
import { ChatService } from '../chat/chat.service';

export class UserController {
  private userService: UserService;
  private chatService: ChatService;

  constructor() {
    this.userService = new UserService();
    this.chatService = new ChatService();
  }

  getAllUsers = async (_req: Request, res: Response): Promise<void> => {
    const users = await this.userService.getAllUsers();
    ApiResponse.success(res, { users });
  };

  getUserById = async (req: Request, res: Response): Promise<void> => {
    const userId = parsePositiveInt(req.params.id, 'id');
    const user = await this.userService.getUserById(userId);
    ApiResponse.success(res, { user });
  };

  /**
   * API 6: List User Chats
   * GET /user/:userId/chats
   */
  getUserChats = async (req: Request, res: Response): Promise<void> => {
    const userId = parsePositiveInt(req.params.userId, 'userId');
    const chats = await this.chatService.getUserChats(userId);
    ApiResponse.success(res, { chats });
  };
}
