import { EnrollmentStatus, ENROLLMENT_STATUSES } from './enrollment-status.vo';

describe('EnrollmentStatus', () => {
  it('accepts "active"', () => {
    const status: EnrollmentStatus = 'active';
    expect(ENROLLMENT_STATUSES).toContain(status);
  });

  it('accepts "cancelled"', () => {
    const status: EnrollmentStatus = 'cancelled';
    expect(ENROLLMENT_STATUSES).toContain(status);
  });

  it('ENROLLMENT_STATUSES contains exactly the two valid values', () => {
    expect(ENROLLMENT_STATUSES).toHaveLength(2);
    expect(ENROLLMENT_STATUSES).toEqual(
      expect.arrayContaining(['active', 'cancelled']),
    );
  });
});
