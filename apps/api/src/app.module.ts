import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WinstonLoggerModule } from '@src//infrastructure/persistence/winston-logger/winston-logger.module';
import { TypeormModule } from '@src/infrastructure/persistence/typeorm/typeorm.module';
import { EnrollmentModule } from '@src/contexts/enrollment/enrollment.module';
import { IdentityModule } from '@src/contexts/identity/identity.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    WinstonLoggerModule,
    TypeormModule,
    EnrollmentModule,
    IdentityModule,
  ],
})
export class AppModule {}
