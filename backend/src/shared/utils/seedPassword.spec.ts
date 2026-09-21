import { verifyPassword } from './password.util';
import { hashSeedPassword, resolveSeedPassword } from './seedPassword';

describe('seedPassword', () => {
  it('produces a hash the login path accepts', async () => {
    const stored = await hashSeedPassword('a-seed-only-password');

    expect(stored).toMatch(/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/);
    await expect(verifyPassword('a-seed-only-password', stored)).resolves.toBe(
      true,
    );
    await expect(verifyPassword('wrong', stored)).resolves.toBe(false);
  });

  it('salts each hash so seeded rows do not share a digest', async () => {
    const [first, second] = await Promise.all([
      hashSeedPassword('same'),
      hashSeedPassword('same'),
    ]);

    expect(first).not.toBe(second);
  });

  it('uses the supplied password when one is configured', () => {
    expect(resolveSeedPassword({ SEED_DEMO_PASSWORD: 'from-env' })).toEqual({
      password: 'from-env',
      generated: false,
    });
  });

  it('mints a different password per run when none is configured', () => {
    const first = resolveSeedPassword({});
    const second = resolveSeedPassword({});

    expect(first.generated).toBe(true);
    expect(first.password).not.toBe(second.password);
    expect(first.password.length).toBeGreaterThanOrEqual(12);
  });
});
