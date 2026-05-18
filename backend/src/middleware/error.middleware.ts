import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../errors/ApiError';
import { ValidationError } from '../errors/ValidationError';
import logger from '../config/logger';
import { env } from '../config/env';

export const errorMiddleware = (
  err: Error | ApiError | ValidationError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof ValidationError) {
    logger.error(`Validation Error: ${err.message}`);

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.issues,
      ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    });
    return;
  }

  if (err instanceof ApiError) {
    logger.error(`API Error: ${err.message} (${err.statusCode})`);

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    });
    return;
  }

  logger.error(`Unhandled Error: ${err.message}`);

  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    ...(env.NODE_ENV === 'development' ? { error: err.message } : {}),
  });
};

export default errorMiddleware;