import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { ValidationError } from '../errors/ValidationError';

export const validateBody = (schema: ZodTypeAny): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      console.error('\n⚠️ --- ZOD VALIDATION FAILED ---');
      console.error('URL:', req.originalUrl || req.url);
      console.error('METHOD:', req.method);
      console.error('REQUEST BODY:', JSON.stringify(req.body, null, 2));
      console.error('ZOD ERRORS:', JSON.stringify(parsed.error.errors, null, 2));
      console.error('--------------------------------\n');

      next(
        new ValidationError(
          'Validation failed',
          parsed.error.errors.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        ),
      );
      return;
    }

    req.body = parsed.data;
    next();
  };
};