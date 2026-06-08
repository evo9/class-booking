import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ActorContext } from '@src/shared/presentation/types/actor-context.type';

export const CurrentActor = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): ActorContext =>
    ctx.switchToHttp().getRequest().actor,
);
