import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommandHandlers } from '@src/contexts/enrollment/application/commands';
import { QueryHandlers } from '@src/contexts/enrollment/application/queries';
import { CLASS_SESSION_REPOSITORY } from '@src/contexts/enrollment/domain/ports';
import { SESSION_READ_REPOSITORY } from '@src/contexts/enrollment/application/ports';
import { ClassSessionOrmEntity } from '@src/contexts/enrollment/infrastructure/persistence/typeorm/entities';
import { EnrollmentOrmEntity } from '@src/contexts/enrollment/infrastructure/persistence/typeorm/entities';
import { TypeOrmClassSessionRepository } from '@src/contexts/enrollment/infrastructure/persistence/typeorm/repositories';
import { TypeOrmSessionReadRepository } from '@src/contexts/enrollment/infrastructure/persistence/typeorm/repositories';
import { JwtAuthGuard } from '@src/shared/presentation/guards';
import { IdentityModule } from '@src/contexts/identity/identity.module';
import { SessionsController } from '@src/contexts/enrollment/presentation/controllers';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([ClassSessionOrmEntity, EnrollmentOrmEntity]),
    IdentityModule,
  ],
  controllers: [SessionsController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    JwtAuthGuard,
    {
      provide: CLASS_SESSION_REPOSITORY,
      useClass: TypeOrmClassSessionRepository,
    },
    {
      provide: SESSION_READ_REPOSITORY,
      useClass: TypeOrmSessionReadRepository,
    },
  ],
})
export class EnrollmentModule {}
