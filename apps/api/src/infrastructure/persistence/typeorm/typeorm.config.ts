import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { TypeormLogger } from '@src/infrastructure/persistence/typeorm/typeorm.logger';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export const typeormConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions | DataSourceOptions => ({
  type: 'postgres',
  host: configService.get('POSTGRES_HOST', 'localhost'),
  port: +configService.get<number>('POSTGRES_PORT', 5432),
  username: configService.get('POSTGRES_USER', 'booking'),
  password: configService.get('POSTGRES_PASSWORD', 'booking'),
  database: configService.get('POSTGRES_DATABASE', 'class_booking'),
  autoLoadEntities: true,
  synchronize: false,
  logging: configService.get('NODE_ENV') === 'development',
  logger: new TypeormLogger(),
  namingStrategy: new SnakeNamingStrategy(),
});
