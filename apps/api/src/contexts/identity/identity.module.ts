import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from '@src/contexts/identity/presentation/controllers';
import {
  PasswordService,
  AuthJwtService,
} from '@src/contexts/identity/infrastructure/auth';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  TypeOrmUserRepository,
  UserOrmEntity,
} from '@src/contexts/identity/infrastructure/persistence/typeorm';
import { USER_REPOSITORY } from '@src/contexts/identity/domain';
import { UserSeeder } from '@src/contexts/identity/infrastructure/seeding/user.seeder';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrmEntity]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'dev-secret-change-in-prod'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    TypeOrmUserRepository,
    {
      provide: USER_REPOSITORY,
      useClass: TypeOrmUserRepository,
    },
    PasswordService,
    AuthJwtService,
    UserSeeder,
  ],
  exports: [AuthJwtService],
})
export class IdentityModule {}
