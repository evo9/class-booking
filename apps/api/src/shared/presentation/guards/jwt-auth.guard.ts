import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthJwtService } from '@src/contexts/identity/infrastructure/auth';

interface CookieRequest {
  cookies: Record<string, string>;
  actor?: unknown;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: AuthJwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req: CookieRequest = ctx.switchToHttp().getRequest();
    const token = req.cookies['access_token'];
    if (!token) return false;

    const payload = this.jwtService.verify(token);
    if (!payload) return false;

    req.actor = { id: payload.sub, role: payload.role };
    return true;
  }
}
