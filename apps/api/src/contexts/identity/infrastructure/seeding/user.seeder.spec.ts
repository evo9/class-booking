import { User } from '@src/contexts/identity/domain/entities';
import { Email, UserId } from '@src/contexts/identity/domain/value-objects';
import { UserRepository } from '@src/contexts/identity/domain/ports';
import { PasswordService } from '@src/contexts/identity/infrastructure/auth/password.service';
import { UserSeeder } from './user.seeder';

const SEED_EMAILS = [
  'admin@booking.dev',
  'alice@booking.dev',
  'bob@booking.dev',
  'carol@booking.dev',
];

function makeUser(email: string): User {
  return User.reconstitute({
    id: UserId.create(),
    email: new Email(email),
    passwordHash: '$argon2id$existing',
    displayName: 'Existing',
    role: 'attendee',
  });
}

function makeRepo(): jest.Mocked<UserRepository> {
  return {
    findByEmail: jest.fn().mockResolvedValue(null),
    findById: jest.fn(),
    save: jest.fn().mockResolvedValue(undefined),
    nextId: jest.fn().mockReturnValue(UserId.create()),
  };
}

function makePasswordService(): jest.Mocked<PasswordService> {
  return {
    hash: jest.fn().mockResolvedValue('$argon2id$hash'),
    verify: jest.fn(),
  };
}

describe('UserSeeder', () => {
  let repo: jest.Mocked<UserRepository>;
  let passwordService: jest.Mocked<PasswordService>;

  const originalEnv = process.env['NODE_ENV'];
  beforeEach(() => {
    process.env['NODE_ENV'] = 'development';
    repo = makeRepo();
    passwordService = makePasswordService();
  });
  afterEach(() => {
    process.env['NODE_ENV'] = originalEnv;
  });

  it('creates all seed users when none exist', async () => {
    const seeder = new UserSeeder(repo, passwordService);

    await seeder.onModuleInit();

    expect(repo.save).toHaveBeenCalledTimes(4);
  });

  it('skips a user that already exists', async () => {
    repo.findByEmail.mockImplementation(async (email: Email) =>
      email.value === 'admin@booking.dev'
        ? makeUser('admin@booking.dev')
        : null,
    );
    const seeder = new UserSeeder(repo, passwordService);

    await seeder.onModuleInit();

    expect(repo.save).toHaveBeenCalledTimes(3);
  });

  it('skips all users when all already exist', async () => {
    repo.findByEmail.mockImplementation(async (email: Email) =>
      makeUser(email.value),
    );
    const seeder = new UserSeeder(repo, passwordService);

    await seeder.onModuleInit();

    expect(repo.save).not.toHaveBeenCalled();
  });

  it('hashes each password before saving', async () => {
    const seeder = new UserSeeder(repo, passwordService);

    await seeder.onModuleInit();

    expect(passwordService.hash).toHaveBeenCalledTimes(4);
    const savedUser = repo.save.mock.calls[0][0];
    expect(savedUser.passwordHash).toBe('$argon2id$hash');
  });

  it('seeds the correct emails', async () => {
    const seeder = new UserSeeder(repo, passwordService);

    await seeder.onModuleInit();

    const savedEmails = repo.save.mock.calls.map(([user]) => user.email.value);
    expect(savedEmails).toEqual(expect.arrayContaining(SEED_EMAILS));
  });

  it('does nothing outside development environment', async () => {
    process.env['NODE_ENV'] = 'production';
    const seeder = new UserSeeder(repo, passwordService);

    await seeder.onModuleInit();

    expect(repo.findByEmail).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
  });
});
