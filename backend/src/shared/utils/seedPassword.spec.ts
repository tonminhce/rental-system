import { verifyPassword } from './password.util';
import { hashSeedPassword, resolveSeedPassword } from './seedPassword';

describe('seedPassword', () => {
  it('produces a hash the login path accepts', async () => {
    const stored = await hashSeedPassword('alpha-fixture');

    expect(stored).toMatch(/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/);
    await expect(verifyPassword('alpha-fixture', stored)).resolves.toBe(true);
    await expect(verifyPassword('beta-fixture', stored)).resolves.toBe(false);
  });

  it('salts each hash so seeded rows do not share a digest', async () => {
    const [first, second] = await Promise.all([
      hashSeedPassword('alpha-fixture'),
      hashSeedPassword('alpha-fixture'),
    ]);

    expect(first).not.toBe(second);
  });

  it('uses the supplied value when one is configured', () => {
    const configured = 'from-environment';

    expect(resolveSeedPassword({ SEED_DEMO_PASSWORD: configured })).toEqual({
      password: configured,
      generated: false,
    });
  });

  it('mints a different value per run when none is configured', () => {
    const first = resolveSeedPassword({});
    const second = resolveSeedPassword({});

    expect(first.generated).toBe(true);
    expect(first.password).not.toBe(second.password);
    expect(first.password.length).toBeGreaterThanOrEqual(12);
  });
});
