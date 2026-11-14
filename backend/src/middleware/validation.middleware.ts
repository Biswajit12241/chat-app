import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export function parsePositiveInt(val: unknown, fieldName: string): number {
  if (val === undefined || val === null || val === '') {
    throw ApiError.badRequest(`${fieldName} is required`);
  }

  const num = Number(val);
  if (!Number.isInteger(num) || num <= 0) {
    throw ApiError.badRequest(`${fieldName} must be a positive integer`);
  }

  return num;
}

export function parseNonEmptyString(val: unknown, fieldName: string): string {
  if (typeof val !== 'string' || val.trim().length === 0) {
    throw ApiError.badRequest(`${fieldName} must be a non-empty string`);
  }

  return val.trim();
}

/**
 * Validates request body for chat creation (API 1)
 */
export function validateCreateChat(req: Request, _res: Response, next: NextFunction): void {
  const { userAId, userBId } = req.body;
  parsePositiveInt(userAId, 'userAId');
  parsePositiveInt(userBId, 'userBId');
  next();
}

/**
 * Validates request params & body for sending a message (API 2)
 */
export function validateSendMessage(req: Request, _res: Response, next: NextFunction): void {
  parsePositiveInt(req.params.chatId, 'chatId');
  const { senderId, text } = req.body;
  parsePositiveInt(senderId, 'senderId');
  parseNonEmptyString(text, 'text');
  next();
}

/**
 * Validates request params & query for message pagination (API 3)
 */
export function validateGetMessages(req: Request, _res: Response, next: NextFunction): void {
  parsePositiveInt(req.params.chatId, 'chatId');
  if (req.query.limit !== undefined) {
    const limit = Number(req.query.limit);
    if (!Number.isInteger(limit) || limit <= 0 || limit > 100) {
      throw ApiError.badRequest('Query parameter limit must be an integer between 1 and 100');
    }
  }
  next();
}

/**
 * Validates request params & body for read receipt (API 4)
 */
export function validateMarkRead(req: Request, _res: Response, next: NextFunction): void {
  parsePositiveInt(req.params.chatId, 'chatId');
  parseNonEmptyString(req.params.messageId, 'messageId');
  const { userId } = req.body;
  parsePositiveInt(userId, 'userId');
  next();
}

/**
 * Validates request params & body for updating last seen (API 5)
 */
export function validateUpdateLastSeen(req: Request, _res: Response, next: NextFunction): void {
  parsePositiveInt(req.params.chatId, 'chatId');
  const { userId, messageId } = req.body;
  parsePositiveInt(userId, 'userId');
  parseNonEmptyString(messageId, 'messageId');
  next();
}

/**
 * Validates request params for user chat list (API 6)
 */
export function validateGetUserChats(req: Request, _res: Response, next: NextFunction): void {
  parsePositiveInt(req.params.userId, 'userId');
  next();
}
