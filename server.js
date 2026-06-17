/**
 * Application Entry Point
 *
 * Bootstraps the HTTP server, connects to MongoDB, initializes
 * Socket.IO for real-time communication, and begins listening
 * on the configured port.
 *
 * @module server
 */

const http = require('http');
const { Server } = require("socket.io");
const app = require("./src/app");

const config = require('./src/config/environment');
const connectDB = require('./src/config/database');
const logger = require('./src/utils/logger');

/**
 * Start the HTTP server and all supporting services
 *
 * 1. Connects to MongoDB
 * 2. Creates the HTTP server from the Express app
 * 3. Initializes Socket.IO with CORS from env config
 * 4. Logs socket connect/disconnect events
 * 5. Stores the `io` instance on `app` for use in controllers
 * 6. Binds to the configured port and logs startup banner
 *
 * @async
 * @returns {Promise<void>}
 */
const startServer = async () => {
  await connectDB();

  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: config.cors.origin,
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected successfully: [ID: ${socket.id}]`);

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: [ID: ${socket.id}] - Reason: ${reason}`);
    });
  });

  /** Expose Socket.IO instance for controller-level emit */
  app.set('io', io);

  server.listen(config.port, () => {
    const isProd = config.env === 'production';
    const envBadge = isProd ? '■ PRODUCTION ■' : '● DEVELOPMENT ●';

    console.log('\n========================================================');
    console.log('🚀   FRAMEWORK ENGINE ACTIVATED SUCCESSFULLY');
    console.log('==========================================================');
    console.log(`🌐 ENVIRONMENT  :  ${envBadge}`);
    console.log(`🔌 PORT         :  ${config.port}`);
    console.log(`💾 DATABASE URI :  ${config.database.uri.substring(0, 40)}...`);
    console.log(`🔒 CORS ORIGIN  :  ${config.cors.origin}`);
    console.log(`🎟️ JWT EXPIRES  :  ${config.jwt.expiresIn}`);
    console.log('========================================================\n');

    logger.info(`Server efficiently running in [${config.env}] mode on port ${config.port}`);
  });
};

startServer().catch((err) => {
  logger.error(`Failed to start server: ${err.message}`);
  process.exit(1);
});