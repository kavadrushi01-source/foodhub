import mongoose from 'mongoose';
import config from '../config/index.js';
import logger from '../config/logger.js';

let isConnected = false;

/**
 * Connect to MongoDB with sensible defaults (autoIndex in dev, pooling, etc.)
 */
export const connectDB = async () => {
  if (isConnected) return mongoose.connection;

  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(config.db.uri, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    });

    isConnected = true;
    logger.info(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });

    return conn;
  } catch (err) {
    logger.error('❌ MongoDB connection failed:', err.message);
    throw err;
  }
};

export const disconnectDB = async () => {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  logger.info('MongoDB disconnected (graceful)');
};

export default connectDB;
