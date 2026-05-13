import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'debug';
const logFormat = process.env.LOG_FORMAT || 'json';

const transports: winston.transport[] = [
  new winston.transports.Console({
    format:
      logFormat === 'json'
        ? winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        : winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.colorize(),
            winston.format.printf(
              ({ timestamp, level, message, ...meta }) => {
                const metaStr =
                  Object.keys(meta).length > 0
                    ? `\n${JSON.stringify(meta, null, 2)}`
                    : '';
                return `${timestamp} [${level}] ${message}${metaStr}`;
              }
            )
          ),
  }),
];

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: './logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    new winston.transports.File({
      filename: './logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    })
  );
}

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true })
  ),
  defaultMeta: { service: 'bridge' },
  transports,
});

export default logger;

