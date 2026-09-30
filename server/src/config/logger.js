import fs from 'node:fs';
import path from 'node:path';
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

// File transport only where the filesystem is actually writable. Serverless
// hosts (Vercel) run a READ-ONLY fs, and winston mkdir's its log directory in
// the File transport constructor — so adding it there threw
// "ENOENT: no such file or directory, mkdir 'logs'" at *import* time, killing
// the function before Express ever booted (every route returned 500
// FUNCTION_INVOCATION_FAILED). Docker/Railway/local keep file logging as before.
const writableFs = !process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME;

if (config.isProd && writableFs) {
  try {
    const logDir = path.join(process.cwd(), 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    logger.add(new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }));
    logger.add(new winston.transports.File({ filename: path.join(logDir, 'combined.log') }));
  } catch (err) {
    // Never let logging setup take the API down — console transport already covers us.
    logger.warn(`File logging disabled (${err.message})`);
  }
}

export default logger;
