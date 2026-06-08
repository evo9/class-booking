import { User } from './user.aggregate';
import { UserId } from '@src/contexts/identity/domain/value-objects/user-id.vo';
import { Email } from '@src/contexts/identity/domain/value-objects/email.vo';

describe('User', () => {
  const id = UserId.fromString('550e8400-e29b-41d4-a716-446655440000');
  const email = new Email('alice@example.com');
  const props = {
    id,
    email,
    passwordHash: '$2b$10$hash',
    displayName: 'Alice',
    role: 'admin' as const,
  };

  it('exposes all props after construction', () => {
    const user = new User(props);
    expect(user.id).toBe(id);
    expect(user.email).toBe(email);
    expect(user.passwordHash).toBe('$2b$10$hash');
    expect(user.displayName).toBe('Alice');
    expect(user.role).toBe('admin');
  });

  it('reconstitute creates identical user', () => {
    const user = User.reconstitute(props);
    expect(user.id.value).toBe(id.value);
    expect(user.email.value).toBe(email.value);
    expect(user.role).toBe('admin');
  });

  it('accepts attendee role', () => {
    const user = new User({ ...props, role: 'attendee' });
    expect(user.role).toBe('attendee');
  });
});
