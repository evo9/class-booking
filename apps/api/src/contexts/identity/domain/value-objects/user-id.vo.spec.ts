import { UserId } from './user-id.vo';

describe('UserId', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  it('creates from a valid UUID string', () => {
    const id = UserId.fromString(validUuid);
    expect(id.value).toBe(validUuid);
  });

  it('creates a new random UUID via create()', () => {
    const id = UserId.create();
    expect(id.value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('throws on invalid UUID', () => {
    expect(() => UserId.fromString('not-a-uuid')).toThrow();
  });

  it('throws on empty string', () => {
    expect(() => UserId.fromString('')).toThrow();
  });
});
