import { JwtService as NestJwtService } from '@nestjs/jwt';
import { AuthJwtService } from './jwt.service';

const TEST_SECRET = 'test-secret-for-unit-tests';

function makeService(): AuthJwtService {
  const nestJwt = new NestJwtService({
    secret: TEST_SECRET,
    signOptions: { expiresIn: '1h' },
  });
  return new AuthJwtService(nestJwt);
}

describe('AuthJwtService', () => {
  let service: AuthJwtService;

  beforeEach(() => {
    service = makeService();
  });

  describe('sign', () => {
    it('returns a non-empty JWT string', () => {
      const token = service.sign({ sub: 'user-id', role: 'admin' });

      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verify', () => {
    it('returns payload for a valid token', () => {
      const token = service.sign({ sub: 'user-123', role: 'attendee' });

      const payload = service.verify(token);

      expect(payload).not.toBeNull();
      expect(payload!.sub).toBe('user-123');
      expect(payload!.role).toBe('attendee');
    });

    it('returns null for a tampered token', () => {
      const token = service.sign({ sub: 'user-id', role: 'admin' });
      const tampered = token.slice(0, -5) + 'XXXXX';

      const result = service.verify(tampered);

      expect(result).toBeNull();
    });

    it('returns null for a token signed with a different secret', () => {
      const otherJwt = new NestJwtService({ secret: 'other-secret' });
      const otherService = new AuthJwtService(otherJwt);
      const token = otherService.sign({ sub: 'user-id', role: 'admin' });

      const result = service.verify(token);

      expect(result).toBeNull();
    });

    it('returns null for a completely invalid string', () => {
      const result = service.verify('not-a-jwt-at-all');

      expect(result).toBeNull();
    });
  });
});
