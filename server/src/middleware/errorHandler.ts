import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import { sendError } from '../utils/response';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(`[ERROR] ${err.message}`, {
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  if (err instanceof ValidationError) {
    sendError(res, err.message, err.statusCode, err.errorCode, err.errors);
    return;
  }

  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.errorCode);
    return;
  }

  // Prisma errors
  if ((err as any).code === 'P2002') {
    sendError(res, 'A record with this value already exists', 409, 'DUPLICATE_ENTRY');
    return;
  }

  if ((err as any).code === 'P2025') {
    sendError(res, 'Record not found', 404, 'NOT_FOUND');
    return;
  }

  // Default error
  sendError(
    res,
    process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    500,
    'INTERNAL_ERROR'
  );
}
