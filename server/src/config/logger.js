import winston from 'winston';
import config from '../config/index.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} [${level}]: ${stack || message}${metaStr}`;
});

const logger = winston.createLogger({
  level: config.isProd ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat,
  ),
  defaultMeta: { service: 'foodhub-api' },
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
      handleExceptions: true,
    }),
  ],
});

// Add file transport only in production-like setups
if (config.isProd) {
  logger.add(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  );
  logger.add(new winston.transports.File({ filename: 'logs/combined.log' }));
}

export default logger;
