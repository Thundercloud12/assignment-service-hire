import { createApp } from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import logger from './config/logger';

const startServer = async (): Promise<void> => {
  await connectDatabase();

  const app = createApp();

  app.listen(env.PORT, (): void => {
    logger.info(`Server listening on port ${env.PORT}`);
  });
};

startServer().catch((error: unknown): void => {
  const message = error instanceof Error ? error.message : 'Unknown startup error';
  logger.error(`Failed to start server: ${message}`);
  process.exit(1);
});