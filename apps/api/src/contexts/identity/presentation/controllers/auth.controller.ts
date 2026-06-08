import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import {
  UserRepository,
  USER_REPOSITORY,
} from '@src/contexts/identity/domain/ports';
import { Email } from '@src/contexts/identity/domain/value-objects';
import { PasswordService } from '@src/contexts/identity/infrastructure/auth/password.service';
import { AuthJwtService } from '@src/contexts/identity/infrastructure/auth/jwt.service';
import { JwtAuthGuard } from '@src/shared/presentation/guards';
import { CurrentActor } from '@src/shared/presentation/decorators';
import { ActorContext } from '@src/shared/presentation/types';
import { LoginDto } from '@src/contexts/identity/presentation/dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly jwtService: AuthJwtService,
  ) {}

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.userRepo.findByEmail(new Email(dto.email));
    if (
      !user ||
      !(await this.passwordService.verify(user.passwordHash, dto.password))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({ sub: user.id.value, role: user.role });
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 3_600_000,
    });

    return {
      id: user.id.value,
      displayName: user.displayName,
      role: user.role,
    };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentActor() actor: ActorContext) {
    return actor;
  }
}
