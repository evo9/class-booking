import { join } from 'path';
import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

import { ConfigService } from '@nestjs/config';

const jsonStringify = (value: any): string => {
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
};

export const winstonConfig = (
  configService: ConfigService,
): WinstonModuleOptions => {
  const isDev = configService.get('APP_MODE') === 'dev';
  const transports: winston.transport[] = [];

  if (isDev) {
    transports.push(new winston.transports.Console({ level: 'debug' }));
    transports.push(new winston.transports.Console({ level: 'error' }));
  } else {
    transports.push(
      new DailyRotateFile({
        dirname: join(process.cwd(), 'logs'),
        filename: 'debug-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        level: 'debug',
      }),
    );
    transports.push(
      new DailyRotateFile({
        dirname: join(process.cwd(), 'logs'),
        filename: 'error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        level: 'error',
      }),
    );
  }

  return {
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message, stack, context }) => {
        let log = `${String(timestamp)} [${level.toUpperCase()}] ${jsonStringify(message)}`;
        if (context) {
          log += ` | Context: ${jsonStringify(context)}`;
        }
        if (stack) {
          log += ` | Stack: ${jsonStringify(stack)}`;
        }
        return log;
      }),
    ),
    transports,
  };
};
