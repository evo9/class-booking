import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { SessionListItemDto, RosterEntryDto } from '@class-booking/contracts';
import { CancelEnrollmentCommand } from '@src/contexts/enrollment/application/commands/cancel-enrollment';
import { CancelSessionCommand } from '@src/contexts/enrollment/application/commands/cancel-session';
import { EnrollAttendeeCommand } from '@src/contexts/enrollment/application/commands/enroll-attendee';
import { ScheduleSessionCommand } from '@src/contexts/enrollment/application/commands/schedule-session';
import {
  SessionListItem,
  RosterEntry,
} from '@src/contexts/enrollment/application/ports';
import { GetSessionRosterQuery } from '@src/contexts/enrollment/application/queries/get-session-roster';
import { ListAvailableSessionsQuery } from '@src/contexts/enrollment/application/queries/list-available-sessions';
import { CurrentActor, RequireRole } from '@src/shared/presentation/decorators';
import { JwtAuthGuard } from '@src/shared/presentation/guards';
import { ActorContext } from '@src/shared/presentation/types';
import { ScheduleSessionRequestDto } from '@src/contexts/enrollment/presentation/dto';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @RequireRole('admin')
  async scheduleSession(
    @Body() dto: ScheduleSessionRequestDto,
  ): Promise<{ sessionId: string }> {
    return this.commandBus.execute(
      new ScheduleSessionCommand(
        dto.title,
        new Date(dto.startsAt),
        dto.capacity,
      ),
    );
  }

  @Get()
  async listSessions(
    @CurrentActor() actor: ActorContext,
  ): Promise<SessionListItemDto[]> {
    const sessions: SessionListItem[] = await this.queryBus.execute(
      new ListAvailableSessionsQuery(actor.id),
    );
    return sessions.map((s) => ({ ...s, startsAt: s.startsAt.toISOString() }));
  }

  @Get(':id/roster')
  @RequireRole('admin')
  async getRoster(@Param('id') id: string): Promise<RosterEntryDto[]> {
    const entries: RosterEntry[] = await this.queryBus.execute(
      new GetSessionRosterQuery(id),
    );
    return entries.map((e) => ({
      ...e,
      enrolledAt: e.enrolledAt.toISOString(),
    }));
  }

  @Post(':id/enrollments')
  @RequireRole('attendee')
  @HttpCode(201)
  async enroll(
    @Param('id') sessionId: string,
    @CurrentActor() actor: ActorContext,
  ): Promise<void> {
    await this.commandBus.execute(
      new EnrollAttendeeCommand(sessionId, actor.id),
    );
  }

  @Delete(':id/enrollments')
  @RequireRole('attendee')
  @HttpCode(204)
  async cancelEnrollment(
    @Param('id') sessionId: string,
    @CurrentActor() actor: ActorContext,
  ): Promise<void> {
    await this.commandBus.execute(
      new CancelEnrollmentCommand(sessionId, actor.id),
    );
  }

  @Post(':id/cancel')
  @RequireRole('admin')
  @HttpCode(200)
  async cancelSession(@Param('id') id: string): Promise<void> {
    await this.commandBus.execute(new CancelSessionCommand(id));
  }
}
