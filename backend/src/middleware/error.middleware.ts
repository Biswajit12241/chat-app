import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ApiError } from '../utils/ApiError';

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  // If it's an instance of ApiError
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors.length > 0 ? { errors: err.errors } : {}),
    });
    return;
  }

  // Handle MySQL Errors
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const sqlError = err as { code: string; message: string; sqlMessage?: string };

    if (sqlError.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        success: false,
        message: 'Duplicate record already exists',
        detail: sqlError.sqlMessage || sqlError.message,
      });
      return;
    }

    if (sqlError.code === 'ER_NO_REFERENCED_ROW_2' || sqlError.code === 'ER_NO_REFERENCED_ROW') {
      res.status(404).json({
        success: false,
        message: 'Referenced record (such as user or chat) not found',
      });
      return;
    }

    if (sqlError.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
      res.status(400).json({
        success: false,
        message: 'Database constraint violation',
      });
      return;
    }
  }

  // Handle generic error
  const standardError = err instanceof Error ? err : new Error(String(err));
  console.error('[Unhandled Error]', {
    url: req.originalUrl,
    method: req.method,
    message: standardError.message,
    stack: standardError.stack,
  });

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : standardError.message,
  });
};
