type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const log = (level: LogLevel, message: string): void => {
  const output = level === 'error' ? console.error : console.log;
  output(`[${level.toUpperCase()}] ${message}`);
};

export const logger = {
  info: (message: string): void => log('info', message),
  warn: (message: string): void => log('warn', message),
  error: (message: string): void => log('error', message),
  debug: (message: string): void => log('debug', message),
};

export default logger;