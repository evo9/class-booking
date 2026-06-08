import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

import { ConfigService } from '@nestjs/config';
import { typeormConfig } from './typeorm.config';

config();

const configService = new ConfigService();

export default new DataSource({
  ...(typeormConfig(configService) as DataSourceOptions),
  entities: ['src/**/*.orm-entity.ts'],
  migrations: ['src/infrastructure/persistence/typeorm/migrations/*.ts'],
});
