import cors from 'cors';
import express, { type Express, type Request, type Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorMiddleware } from './middleware/error.middleware';
import { apiRouter } from './routes';

export const createApp = (): Express => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_ORIGIN ?? true,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(morgan('dev'));

  app.use('/api', apiRouter);

  app.get('/health', (_req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      message: 'Backend is running',
      environment: env.NODE_ENV,
    });
  });

  app.use((_req: Request, res: Response): void => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
    });
  });

  app.use(errorMiddleware);

  return app;
};