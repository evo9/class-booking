import { Module } from '@nestjs/common';
import { TypeOrmModule as TypeOrmNestModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { typeormConfig } from './typeorm.config';

@Module({
  imports: [
    TypeOrmNestModule.forRootAsync({
      inject: [ConfigService],
      useFactory: typeormConfig,
    }),
  ],
})
export class TypeormModule {}
