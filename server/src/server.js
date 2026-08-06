import app from './app.js';
import config from './config/index.js';
import { connectDB } from './config/database.js';
import logger from './config/logger.js';

const start = async () => {
  try {
    await connectDB();
    const server = app.listen(config.port, () => {
      logger.info(`🚀 FoodHub API running in ${config.env} mode on port ${config.port}`);
      logger.info(`🌐 CORS origin: ${config.clientUrl}`);
    });

    const shutdown = (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
      // Force exit after 10s
      setTimeout(() => process.exit(1), 10000).unref();
    };

    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled Rejection:', err);
      shutdown('UNHANDLED_REJECTION');
    });
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      shutdown('UNCAUGHT_EXCEPTION');
    });
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
