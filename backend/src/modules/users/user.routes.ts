import { Router } from 'express';
import { UserController } from './user.controller';
import { asyncHandler } from '../../utils/asyncHandler';
import { validateGetUserChats } from '../../middleware/validation.middleware';

const router = Router();
const userController = new UserController();

// List all users
router.get('/', asyncHandler(userController.getAllUsers));

// API 6: List User Chats - GET /user/:userId/chats
router.get('/:userId/chats', validateGetUserChats, asyncHandler(userController.getUserChats));

// Get user by id
router.get('/:id', asyncHandler(userController.getUserById));

export default router;
