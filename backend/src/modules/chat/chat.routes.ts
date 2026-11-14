import { Router } from 'express';
import { ChatController } from './chat.controller';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  validateCreateChat,
  validateSendMessage,
  validateGetMessages,
  validateMarkRead,
  validateUpdateLastSeen,
} from '../../middleware/validation.middleware';

const router = Router();
const chatController = new ChatController();

// API 1: Create or Get Chat - POST /chat/create
router.post('/create', validateCreateChat, asyncHandler(chatController.createChat));

// API 2: Send Message - POST /chat/:chatId/message/send
router.post('/:chatId/message/send', validateSendMessage, asyncHandler(chatController.sendMessage));

// API 3: Get Messages - GET /chat/:chatId/messages
router.get('/:chatId/messages', validateGetMessages, asyncHandler(chatController.getMessages));

// API 4: Mark Message Read - POST /chat/:chatId/message/:messageId/read
router.post('/:chatId/message/:messageId/read', validateMarkRead, asyncHandler(chatController.markMessageRead));

// API 5: Update Last Seen - POST /chat/:chatId/lastseen
router.post('/:chatId/lastseen', validateUpdateLastSeen, asyncHandler(chatController.updateLastSeen));

// Helper: Get Last Seen - GET /chat/:chatId/lastseen
router.get('/:chatId/lastseen', asyncHandler(chatController.getChatLastSeen));

export default router;
