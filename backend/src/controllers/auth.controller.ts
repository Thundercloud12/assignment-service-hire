import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../errors/ApiError';
import { authService } from '../services/auth.service';

class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.refreshToken(req.body);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: result,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError('User not authenticated', 401);
      }

      const user = await authService.getCurrentUser(req.user.id);

      res.status(200).json({
        success: true,
        message: 'User profile loaded successfully',
        data: user,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await authService.getUsers();

      res.status(200).json({
        success: true,
        message: 'Users loaded successfully',
        data: users,
      });
    } catch (error: unknown) {
      next(error);
    }
  }
}

export const authController = new AuthController();