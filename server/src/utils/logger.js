import winston from 'winston';
import config from '../config/index.js';

const { combine, timestamp, printf, colorize, errors, splat, json } = winston.format;

const customFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `[${timestamp}] ${level}: ${message} `;
  if (Object.keys(metadata).length > 0) {
    msg += JSON.stringify(metadata);
  }
  if (stack) {
    msg += `\n${stack}`;
  }
  return msg;
});

const isProduction = config.app?.isProduction || process.env.NODE_ENV === 'production';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    splat(),
    json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (!isProduction) {
  logger.add(
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        customFormat
      ),
    })
  );
}

export default logger;
