const winston = require('winston');

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'warn';
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const baseFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }), 
  winston.format.printf((info) => {
    const { timestamp, level, message, stack, ...meta } = info;
    
    const cleanLevel = level.toUpperCase().replace(/\u001b\[\d+m/g, '');
    const env = process.env.NODE_ENV || 'development';

    const context = Object.keys(meta).length ? JSON.stringify(meta) : "";

    return `[${timestamp}] ${env}.${cleanLevel}: ${stack || message} ${context}`;
  })
);

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }), // تلوين الليفل والنص في الكونسول فقط
      baseFormat
    )
  }),
  
  new winston.transports.File({
    filename: 'storage/logs/error.log',
    level: 'error',
    format: baseFormat
  }),
  new winston.transports.File({ 
    filename: 'storage/logs/app.log',
    level: 'info',
    format: baseFormat
  }),
  new winston.transports.File({ 
    filename: 'storage/logs/warning.log',
    level: 'warn',
    format: baseFormat
  }),
];

const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
});

module.exports = logger;