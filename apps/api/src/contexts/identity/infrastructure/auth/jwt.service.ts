import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';

@Injectable()
export class AuthJwtService {
  constructor(private readonly jwt: NestJwtService) {}

  sign(payload: { sub: string; role: string }): string {
    return this.jwt.sign(payload);
  }

  verify(token: string): { sub: string; role: string } | null {
    try {
      return this.jwt.verify<{ sub: string; role: string }>(token);
    } catch {
      return null;
    }
  }
}
