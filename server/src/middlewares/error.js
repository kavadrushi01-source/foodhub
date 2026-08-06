import logger from '../config/logger.js';
import { AppError } from '../utils/errors.js';
import { sendError } from '../utils/apiResponse.js';
import config from '../config/index.js';

/**
 * Centralized error handler. Translates Mongoose/JWT errors into clean responses.
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let code = err.code || 'ERROR';
  let details = err.details || null;

  // Mongoose duplicate key
  if (err.name === 'MongoServerError' && err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value for ${field}: ${err.keyValue?.[field]}`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    details = Object.values(err.errors).map((e) => ({ path: e.path, message: e.message }));
    message = 'Validation failed';
  }

  // Cast error (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = `Invalid ${err.path}: ${err.value}`;
  }

  if (err.name === 'ZodError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  }

  // Log non-operational errors (bugs) with stack
  if (statusCode >= 500 || !err.isOperational) {
    logger.error(`[${req.method}] ${req.originalUrl} -> ${statusCode}`, {
      message: err.message,
      stack: err.stack,
    });
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} -> ${statusCode} ${code}: ${message}`);
  }

  const body = { success: false, status: statusCode, code, message };
  if (details) body.details = details;
  if (!config.isProd && statusCode >= 500) body.stack = err.stack;

  res.status(statusCode).json(body);
};

/** 404 handler for unmatched routes. */
export const notFound = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
};

export default { errorHandler, notFound };
