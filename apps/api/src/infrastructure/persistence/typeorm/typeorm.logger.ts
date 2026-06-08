import { join } from 'path';
import { Logger as TypeOrmLogger, QueryRunner } from 'typeorm';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

export class TypeormLogger implements TypeOrmLogger {
  private readonly logger = winston.createLogger({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message }) => {
        return `${String(timestamp)} [${level}]: ${String(message)}`;
      }),
    ),
    transports: [
      new DailyRotateFile({
        dirname: join(process.cwd(), 'logs'),
        filename: 'typeorm-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        level: 'debug',
      }),
    ],
  });

  private logMessage(
    level: string,
    message: unknown,
    meta?: Record<string, string>,
  ) {
    const msg =
      typeof message === 'string'
        ? message.replace(/”/g, '“')
        : JSON.stringify(message).replace(/”/g, '“');

    this.logger.log(level, msg, meta);
  }

  logQuery(query: string, parameters?: any[], _queryRunner?: QueryRunner) {
    this.logMessage('debug', `Query: ${query}`, {
      parameters: parameters ? JSON.stringify(parameters) : '',
    });
  }

  logQueryError(
    error: string,
    query: string,
    parameters?: any[],
    _queryRunner?: QueryRunner,
  ) {
    this.logMessage('error', `Query Failed: ${query}`, {
      error,
      parameters: parameters ? JSON.stringify(parameters) : '',
    });
  }

  logQuerySlow(
    time: number,
    query: string,
    parameters?: any[],
    _queryRunner?: QueryRunner,
  ) {
    this.logMessage('warn', `Query is slow (${time} ms): ${query}`, {
      parameters: parameters ? JSON.stringify(parameters) : '',
    });
  }

  logSchemaBuild(message: string, _queryRunner?: QueryRunner) {
    this.logMessage('debug', `Schema build: ${message}`);
  }

  logMigration(message: string, _queryRunner?: QueryRunner) {
    this.logMessage('debug', `Migration: ${message}`);
  }

  log(
    level: 'log' | 'info' | 'warn',
    message: any,
    _queryRunner?: QueryRunner,
  ) {
    this.logMessage(level, message);
  }
}
