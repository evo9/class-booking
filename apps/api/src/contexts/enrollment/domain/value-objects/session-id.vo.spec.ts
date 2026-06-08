import { SessionId } from './session-id.vo';

describe('SessionId', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  it('creates from a valid UUID string', () => {
    const id = SessionId.fromString(validUuid);
    expect(id.value).toBe(validUuid);
  });

  it('creates a new random UUID via create()', () => {
    const id = SessionId.create();
    expect(id.value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('throws on invalid UUID', () => {
    expect(() => SessionId.fromString('not-a-uuid')).toThrow();
  });

  it('throws on empty string', () => {
    expect(() => SessionId.fromString('')).toThrow();
  });
});
