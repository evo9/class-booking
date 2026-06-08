import { UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { User } from '@src/contexts/identity/domain/entities';
import { Email, UserId } from '@src/contexts/identity/domain/value-objects';
import { UserRepository } from '@src/contexts/identity/domain/ports';
import { PasswordService } from '@src/contexts/identity/infrastructure/auth/password.service';
import { AuthJwtService } from '@src/contexts/identity/infrastructure/auth/jwt.service';
import { AuthController } from './auth.controller';

function makeUser(role: 'admin' | 'attendee' = 'attendee'): User {
  return User.reconstitute({
    id: UserId.fromString('550e8400-e29b-41d4-a716-446655440000'),
    email: new Email('alice@example.com'),
    passwordHash: '$argon2id$hash',
    displayName: 'Alice',
    role,
  });
}

function makeRes(): jest.Mocked<Pick<Response, 'cookie' | 'clearCookie'>> {
  return { cookie: jest.fn(), clearCookie: jest.fn() };
}

describe('AuthController', () => {
  let controller: AuthController;
  let userRepo: jest.Mocked<UserRepository>;
  let passwordService: jest.Mocked<PasswordService>;
  let jwtService: jest.Mocked<AuthJwtService>;

  beforeEach(() => {
    userRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      nextId: jest.fn(),
    };
    passwordService = { hash: jest.fn(), verify: jest.fn() };
    jwtService = { sign: jest.fn(), verify: jest.fn() } as any;
    controller = new AuthController(userRepo, passwordService, jwtService);
  });

  describe('login', () => {
    it('sets httpOnly cookie and returns user profile on valid credentials', async () => {
      const user = makeUser();
      userRepo.findByEmail.mockResolvedValue(user);
      passwordService.verify.mockResolvedValue(true);
      jwtService.sign.mockReturnValue('jwt-token');
      const res = makeRes() as unknown as Response;

      const result = await controller.login(
        { email: 'alice@example.com', password: 'pass' },
        res,
      );

      expect(res.cookie).toHaveBeenCalledWith(
        'access_token',
        'jwt-token',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(result).toEqual({
        id: '550e8400-e29b-41d4-a716-446655440000',
        displayName: 'Alice',
        role: 'attendee',
      });
    });

    it('throws UnauthorizedException when user not found', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      const res = makeRes() as unknown as Response;

      await expect(
        controller.login(
          { email: 'nobody@example.com', password: 'pass' },
          res,
        ),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      userRepo.findByEmail.mockResolvedValue(makeUser());
      passwordService.verify.mockResolvedValue(false);
      const res = makeRes() as unknown as Response;

      await expect(
        controller.login(
          { email: 'alice@example.com', password: 'wrong' },
          res,
        ),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('signs JWT with userId and role', async () => {
      const user = makeUser('admin');
      userRepo.findByEmail.mockResolvedValue(user);
      passwordService.verify.mockResolvedValue(true);
      jwtService.sign.mockReturnValue('jwt-token');
      const res = makeRes() as unknown as Response;

      await controller.login(
        { email: 'alice@example.com', password: 'pass' },
        res,
      );

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: '550e8400-e29b-41d4-a716-446655440000',
        role: 'admin',
      });
    });
  });

  describe('logout', () => {
    it('clears the access_token cookie and returns ok', () => {
      const res = makeRes() as unknown as Response;

      const result = controller.logout(res);

      expect(res.clearCookie).toHaveBeenCalledWith('access_token');
      expect(result).toEqual({ ok: true });
    });
  });
});
