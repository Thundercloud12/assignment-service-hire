import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { AUTH_HEADER_PREFIX } from '../constants/auth.constants';
import type { IAuthTokenPayload } from '../interfaces/IUser';
import { ApiError } from '../errors/ApiError';
import { env } from '../config/env';
import type { UserRole } from '../constants/auth.constants';

const isAuthTokenPayload = (value: string | jwt.JwtPayload): value is jwt.JwtPayload & IAuthTokenPayload => {
  return typeof value === 'object' && value !== null && typeof value.id === 'string' && typeof value.email === 'string' && typeof value.role === 'string' && typeof value.organizationId === 'string';
};

export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authorizationHeader = req.headers.authorization;
    const token = authorizationHeader?.startsWith(`${AUTH_HEADER_PREFIX} `)
      ? authorizationHeader.slice(AUTH_HEADER_PREFIX.length + 1)
      : undefined;

    if (!token) {
      throw new ApiError('No token provided', 401);
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (!isAuthTokenPayload(decoded)) {
      throw new ApiError('Invalid token', 401);
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role as UserRole,
      organizationId: decoded.organizationId,
    };

    next();
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      next(error);
      return;
    }

    next(new ApiError('Authentication failed', 401));
  }
};

export const authorizeRoles = (roles: readonly UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new ApiError('Insufficient permissions', 403));
      return;
    }

    next();
  };
};