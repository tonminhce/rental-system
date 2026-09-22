import { hashPassword, verifyPassword } from './password.util';
import { encodeToMD5 } from './md5.util';
describe('password storage', () => {
  it('uses salted hashes and verifies without plaintext storage', async () => {
    const first = await hashPassword('Example-password-123');
    const second = await hashPassword('Example-password-123');
    expect(first).not.toBe(second);
    expect(await verifyPassword('Example-password-123', first)).toBe(true);
    expect(await verifyPassword('wrong-password', first)).toBe(false);
  });
  it('supports legacy MD5 only for migration', async () => {
    expect(
      await verifyPassword('legacy-password', encodeToMD5('legacy-password')),
    ).toBe(true);
    expect(
      await verifyPassword('wrong-password', encodeToMD5('legacy-password')),
    ).toBe(false);
  });
  it('rejects malformed hashes', async () => {
    expect(await verifyPassword('abc', 'scrypt:x:00')).toBe(false);
    expect(await verifyPassword('abc', '')).toBe(false);
  });
});
