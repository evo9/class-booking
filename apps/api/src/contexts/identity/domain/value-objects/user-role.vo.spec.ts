import { UserRole, USER_ROLES } from './user-role.vo';

describe('UserRole', () => {
  it('accepts "admin"', () => {
    const role: UserRole = 'admin';
    expect(USER_ROLES).toContain(role);
  });

  it('accepts "attendee"', () => {
    const role: UserRole = 'attendee';
    expect(USER_ROLES).toContain(role);
  });

  it('USER_ROLES contains exactly the two valid values', () => {
    expect(USER_ROLES).toHaveLength(2);
    expect(USER_ROLES).toEqual(expect.arrayContaining(['admin', 'attendee']));
  });
});
