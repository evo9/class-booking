import 'reflect-metadata';
import { EventBus } from '@nestjs/cqrs';
import { ClassSessionRepository } from '@src/contexts/enrollment/domain/ports';
import { SessionId } from '@src/contexts/enrollment/domain/value-objects';
import { SessionScheduledEvent } from '@src/contexts/enrollment/domain/events';
import { ScheduleSessionCommand } from './schedule-session.command';
import { ScheduleSessionHandler } from './schedule-session.handler';

describe('ScheduleSessionHandler', () => {
  let repo: jest.Mocked<ClassSessionRepository>;
  let eventBus: jest.Mocked<EventBus>;
  let handler: ScheduleSessionHandler;

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      nextId: jest.fn(),
    };
    eventBus = { publishAll: jest.fn() } as any;
    handler = new ScheduleSessionHandler(repo, eventBus);
  });

  it('returns sessionId from nextId()', async () => {
    const id = SessionId.create();
    repo.nextId.mockReturnValue(id);

    const result = await handler.execute(
      new ScheduleSessionCommand('Yoga', new Date(Date.now() + 60_000), 10),
    );

    expect(result.sessionId).toBe(id.value);
  });

  it('saves the scheduled session', async () => {
    repo.nextId.mockReturnValue(SessionId.create());

    await handler.execute(
      new ScheduleSessionCommand('Yoga', new Date(Date.now() + 60_000), 10),
    );

    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('publishes SessionScheduledEvent after save', async () => {
    repo.nextId.mockReturnValue(SessionId.create());
    const capturedEvents: unknown[] = [];
    eventBus.publishAll.mockImplementation((events: unknown[]) => {
      capturedEvents.push(...events);
    });

    await handler.execute(
      new ScheduleSessionCommand('Yoga', new Date(Date.now() + 60_000), 10),
    );

    expect(capturedEvents).toHaveLength(1);
    expect(capturedEvents[0]).toBeInstanceOf(SessionScheduledEvent);
  });
});
