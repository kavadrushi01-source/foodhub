import mongoose from 'mongoose';
import config from '../config/index.js';
import logger from '../config/logger.js';

// One connection attempt at a time, shared by every concurrent caller and kept
// alive across invocations on a warm serverless instance (module state lives
// as long as the process does).
let connectPromise = null;
let listenersBound = false;

/**
 * Connect to MongoDB with sensible defaults (pooling, 10s selection timeout).
 * Idempotent + race-safe: concurrent calls await the same promise, and a
 * failed attempt clears it so a later call (e.g. the dbReady middleware)
 * can retry instead of leaving the instance dead.
 */
export const connectDB = async () => {
  // Warm connection — reuse it.
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!connectPromise) {
    mongoose.set('strictQuery', true);
    connectPromise = mongoose
      .connect(config.db.uri, {
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
      })
      .then(() => {
        logger.info(`✅ MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
        if (!listenersBound) {
          listenersBound = true;
          mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error:', err);
          });
          mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
            connectPromise = null; // allow a future connectDB() to reconnect
          });
        }
        return mongoose.connection;
      })
      .catch((err) => {
        connectPromise = null;
        logger.error('❌ MongoDB connection failed:', err.message);
        throw err;
      });
  }

  return connectPromise;
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
  connectPromise = null;
  logger.info('MongoDB disconnected (graceful)');
};

export default connectDB;
