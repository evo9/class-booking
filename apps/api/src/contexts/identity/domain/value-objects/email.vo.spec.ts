import { Email } from './email.vo';

describe('Email', () => {
  it('creates from a valid email', () => {
    const email = new Email('user@example.com');
    expect(email.value).toBe('user@example.com');
  });

  it('creates from a minimal valid email', () => {
    const email = new Email('a@b.c');
    expect(email.value).toBe('a@b.c');
  });

  it('throws when no @ symbol', () => {
    expect(() => new Email('notanemail')).toThrow();
  });

  it('throws when no domain part after @', () => {
    expect(() => new Email('user@')).toThrow();
  });

  it('throws when no dot in domain', () => {
    expect(() => new Email('user@example')).toThrow();
  });

  it('throws when nothing before @', () => {
    expect(() => new Email('@example.com')).toThrow();
  });

  it('throws on empty string', () => {
    expect(() => new Email('')).toThrow();
  });
});
