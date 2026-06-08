# Task 14 — Presentation: Controllers + Request/Response DTOs

**Layer:** presentation  
**Depends on:** 06, 07, 13  
**Blocks:** 16 (e2e tests)

## Goal

Implement the REST controller and all DTOs with `class-validator` validation.

## Files to create

### `apps/api/src/enrollment/presentation/dto/`

**`schedule-session.request.dto.ts`**
```typescript
export class ScheduleSessionRequestDto {
  @IsString() @IsNotEmpty() title: string;
  @IsISO8601() startsAt: string;
  @IsInt() @Min(1) capacity: number;
}
```

**`session-list.response.dto.ts`** — maps to `SessionListItemDto` from contracts package.

**`roster.response.dto.ts`** — maps to `RosterEntryDto` from contracts package.

### `apps/api/src/enrollment/presentation/controllers/sessions.controller.ts`

```typescript
@Controller('sessions')
@UseGuards(ActorGuard)
export class SessionsController {

  @Post()
  @RequireRole('admin')
  async scheduleSession(@Body() dto: ScheduleSessionRequestDto) { ... }

  @Get()
  async listSessions() { ... }

  @Get(':id/roster')
  @RequireRole('admin')
  async getRoster(@Param('id') id: string) { ... }

  @Post(':id/enrollments')
  @RequireRole('attendee')
  @HttpCode(201)
  async enroll(@Param('id') sessionId: string, @Actor() actor: ActorContext) { ... }

  @Delete(':id/enrollments')
  @RequireRole('attendee')
  @HttpCode(204)
  async cancelEnrollment(@Param('id') sessionId: string, @Actor() actor: ActorContext) { ... }

  @Post(':id/cancel')
  @RequireRole('admin')
  @HttpCode(200)
  async cancelSession(@Param('id') id: string) { ... }
}
```

## API contract

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/sessions` | `ScheduleSessionRequestDto` | `{ sessionId: string }` 201 |
| GET | `/sessions` | — | `SessionListItemDto[]` 200 |
| GET | `/sessions/:id/roster` | — | `RosterEntryDto[]` 200 |
| POST | `/sessions/:id/enrollments` | — | 201 |
| DELETE | `/sessions/:id/enrollments` | — | 204 |
| POST | `/sessions/:id/cancel` | — | 200 |

## Notes

- Enable `ValidationPipe` globally in `main.ts`: `app.useGlobalPipes(new ValidationPipe({ whitelist: true }))`.
- `attendeeId` for enroll/cancel comes from `@Actor() actor` — NOT from request body or params.
- Response DTOs should use the types from `packages/contracts` to stay in sync with the Angular frontend.
- Enable CORS in `main.ts` for Angular dev server (`http://localhost:4200`).
