import { SessionStatus, SESSION_STATUSES } from './session-status.vo';

describe('SessionStatus', () => {
  it('accepts "scheduled"', () => {
    const status: SessionStatus = 'scheduled';
    expect(SESSION_STATUSES).toContain(status);
  });

  it('accepts "cancelled"', () => {
    const status: SessionStatus = 'cancelled';
    expect(SESSION_STATUSES).toContain(status);
  });

  it('SESSION_STATUSES contains exactly the two valid values', () => {
    expect(SESSION_STATUSES).toHaveLength(2);
    expect(SESSION_STATUSES).toEqual(
      expect.arrayContaining(['scheduled', 'cancelled']),
    );
  });
});
