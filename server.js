const http = require('http');
const { Server } = require("socket.io");
const app = require("./src/app");

const config = require('./src/config/environment');
const connectDB = require('./src/config/database');
const logger = require('./src/lib/utils/logger');

const startServer = async () => {
  const container = app.container;
  await connectDB(container);

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

  app.set('io', io);

  server.listen(config.port, () => {
    const isProd = config.env === 'production';
    const envBadge = isProd ? '■ PRODUCTION ■' : '● DEVELOPMENT ●';
    const dbLabel = config.database.driver === 'postgres' ? 'PostgreSQL' : 'MongoDB';

    console.log('\n========================================================');
    console.log('🚀   FRAMEWORK ENGINE ACTIVATED SUCCESSFULLY');
    console.log('==========================================================');
    console.log(`🌐 ENVIRONMENT  :  ${envBadge}`);
    console.log(`🔌 PORT         :  ${config.port}`);
    console.log(`💾 DATABASE     :  ${dbLabel}`);
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
