import { ExecutionContext } from '@nestjs/common';
import { AuthJwtService } from '@src/contexts/identity/infrastructure/auth';
import { JwtAuthGuard } from './jwt-auth.guard';

function makeContext(cookies: Record<string, string>): {
  ctx: ExecutionContext;
  req: Record<string, unknown>;
} {
  const req: Record<string, unknown> = { cookies };
  const ctx = {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
  return { ctx, req };
}

describe('JwtAuthGuard', () => {
  let jwtService: jest.Mocked<AuthJwtService>;
  let guard: JwtAuthGuard;

  beforeEach(() => {
    jwtService = { sign: jest.fn(), verify: jest.fn() } as any;
    guard = new JwtAuthGuard(jwtService);
  });

  it('returns false when access_token cookie is missing', () => {
    const { ctx } = makeContext({});

    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('returns false when token is invalid', () => {
    jwtService.verify.mockReturnValue(null);
    const { ctx } = makeContext({ access_token: 'bad-token' });

    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('attaches actor to request and returns true on valid token', () => {
    jwtService.verify.mockReturnValue({ sub: 'user-123', role: 'admin' });
    const { ctx, req } = makeContext({ access_token: 'valid-token' });

    const result = guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(req['actor']).toEqual({ id: 'user-123', role: 'admin' });
  });

  it('passes token value to jwtService.verify', () => {
    jwtService.verify.mockReturnValue({ sub: 'u', role: 'attendee' });
    const { ctx } = makeContext({ access_token: 'my-jwt' });

    guard.canActivate(ctx);

    expect(jwtService.verify).toHaveBeenCalledWith('my-jwt');
  });
});
