import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { User } from '@src/contexts/identity/domain/entities';
import {
  UserRepository,
  USER_REPOSITORY,
} from '@src/contexts/identity/domain/ports';
import { Email } from '@src/contexts/identity/domain/value-objects';
import { PasswordService } from '@src/contexts/identity/infrastructure/auth/password.service';

const SEED_USERS = [
  {
    email: 'admin@booking.dev',
    password: 'admin123',
    displayName: 'Admin',
    role: 'admin' as const,
  },
  {
    email: 'alice@booking.dev',
    password: 'alice123',
    displayName: 'Alice',
    role: 'attendee' as const,
  },
  {
    email: 'bob@booking.dev',
    password: 'bob123',
    displayName: 'Bob',
    role: 'attendee' as const,
  },
  {
    email: 'carol@booking.dev',
    password: 'carol123',
    displayName: 'Carol',
    role: 'attendee' as const,
  },
];

@Injectable()
export class UserSeeder implements OnModuleInit {
  constructor(
    @Inject(USER_REPOSITORY) private readonly repo: UserRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env['NODE_ENV'] !== 'development') return;
    await this.seed();
  }

  private async seed(): Promise<void> {
    for (const u of SEED_USERS) {
      const existing = await this.repo.findByEmail(new Email(u.email));
      if (existing) continue;

      const passwordHash = await this.passwordService.hash(u.password);
      const user = new User({
        id: this.repo.nextId(),
        email: new Email(u.email),
        passwordHash,
        displayName: u.displayName,
        role: u.role,
      });
      await this.repo.save(user);
    }
  }
}
