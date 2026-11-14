import { Response } from 'express';

export class ApiResponse {
  static success<T extends Record<string, unknown>>(
    res: Response,
    payload: T,
    statusCode: number = 200
  ): Response {
    return res.status(statusCode).json({
      success: true,
      ...payload,
    });
  }

  static error(
    res: Response,
    message: string,
    statusCode: number = 500,
    errors: unknown[] = []
  ): Response {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(errors.length > 0 ? { errors } : {}),
    });
  }
}
