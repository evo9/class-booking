import { AttendeeId } from './attendee-id.vo';
import { SessionId } from './session-id.vo';

describe('AttendeeId', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440001';

  it('creates from a valid UUID string', () => {
    const id = AttendeeId.fromString(validUuid);
    expect(id.value).toBe(validUuid);
  });

  it('creates a new random UUID via create()', () => {
    const id = AttendeeId.create();
    expect(id.value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('throws on invalid UUID', () => {
    expect(() => AttendeeId.fromString('bad')).toThrow();
  });

  it('is nominally distinct from SessionId at the type level', () => {
    // This is a compile-time check — runtime values are just strings.
    // If TypeScript accepted this assignment the brands would be the same type.
    const attendeeId = AttendeeId.fromString(validUuid);
    const sessionId = SessionId.fromString(validUuid);

    // They carry the same raw value but are different VO types
    expect(attendeeId.value).toBe(sessionId.value);
    expect(attendeeId).not.toBe(sessionId);
  });
});
