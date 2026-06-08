# Task 15 — NestJS Module Wiring

**Layer:** infrastructure / presentation glue  
**Depends on:** 08–14  
**Blocks:** 16

## enrollment.module.ts

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ClassSessionOrmEntity, EnrollmentOrmEntity } from '@src/enrollment/infrastructure/persistence/entities';
import { TypeOrmClassSessionRepository } from '@src/enrollment/infrastructure/persistence/typeorm-class-session.repository';
import { TypeOrmSessionReadRepository } from '@src/enrollment/infrastructure/persistence/typeorm-session-read.repository';
import { NestDomainEventPublisher } from '@src/enrollment/infrastructure/events/domain-event-publisher';
import { CommandHandlers } from '@src/enrollment/application/commands';
import { QueryHandlers } from '@src/enrollment/application/queries';
import { CLASS_SESSION_REPOSITORY } from '@src/enrollment/domain/ports';
import { SESSION_READ_REPOSITORY, DOMAIN_EVENT_PUBLISHER } from '@src/enrollment/application/ports';
import { SessionsController } from '@src/enrollment/presentation/controllers/sessions.controller';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([ClassSessionOrmEntity, EnrollmentOrmEntity]),
  ],
  controllers: [SessionsController],
  providers: [
    // Repositories
    TypeOrmClassSessionRepository,
    { provide: CLASS_SESSION_REPOSITORY, useClass: TypeOrmClassSessionRepository },
    TypeOrmSessionReadRepository,
    { provide: SESSION_READ_REPOSITORY, useClass: TypeOrmSessionReadRepository },

    // CQRS handlers — EventBus injected directly, no custom publisher needed
    ...CommandHandlers,
    ...QueryHandlers,
  ],
})
export class EnrollmentModule {}
```

## app.module.ts

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeormModule } from '@src/infrastructure/persistence/typeorm/typeorm.module';
import { EnrollmentModule } from '@src/enrollment/enrollment.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeormModule,      // handles TypeORM setup; autoLoadEntities picks up entities from forFeature()
    EnrollmentModule,
  ],
})
export class AppModule {}
```

## main.ts

```typescript
const app = await NestFactory.create(AppModule);
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
app.useGlobalFilters(new DomainExceptionFilter());
app.enableCors({ origin: 'http://localhost:4200' });
await app.listen(process.env.PORT ?? 3000);
```

## Notes

- `CqrsModule` auto-discovers handlers via the `@CommandHandler` / `@QueryHandler` decorators
- Handlers must still be listed in `providers` so NestJS DI can inject their dependencies
- `...CommandHandlers` and `...QueryHandlers` are the arrays exported from `commands/index.ts` and `queries/index.ts`
