import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(() => {
    service = new PasswordService();
  });

  it('hash returns a non-empty string different from the plain password', async () => {
    const hash = await service.hash('my-secret');

    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
    expect(hash).not.toBe('my-secret');
  });

  it('verify returns true for the correct password', async () => {
    const hash = await service.hash('correct-horse');

    const result = await service.verify(hash, 'correct-horse');

    expect(result).toBe(true);
  });

  it('verify returns false for a wrong password', async () => {
    const hash = await service.hash('correct-horse');

    const result = await service.verify(hash, 'wrong-password');

    expect(result).toBe(false);
  });

  it('two hashes of the same password are different (salted)', async () => {
    const hash1 = await service.hash('same-password');
    const hash2 = await service.hash('same-password');

    expect(hash1).not.toBe(hash2);
  });
});
