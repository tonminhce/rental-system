import { HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { validate } from 'class-validator';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';

const ACCESS_SECRET = 'a'.repeat(32);
const REFRESH_SECRET = 'b'.repeat(32);

const hashToken = (t: string) =>
  createHash('sha256').update(t).digest('hex');

function makeService() {
  const configService = {
    get: (key: string) =>
      ({
        TOKEN_SECRET: ACCESS_SECRET,
        REFRESH_TOKEN_SECRET: REFRESH_SECRET,
        TOKEN_EXPIRATION: '1h',
        REFRESH_TOKEN_EXPIRATION: '7d',
      })[key],
  } as any;
  const jwtService = new JwtService({ secret: ACCESS_SECRET });
  const refreshTokenModel = {
    // fake sequelize: run the callback with a transaction stub
    sequelize: {
      transaction: (cb: (t: any) => any) => cb({ LOCK: { UPDATE: 'UPDATE' } }),
    },
    findOne: jest.fn(),
    create: jest.fn().mockResolvedValue({}),
    destroy: jest.fn().mockResolvedValue(0),
    update: jest.fn().mockResolvedValue([1]),
  };
  const userModel = { findByPk: jest.fn() };
  const service = new AuthService(
    userModel as any,
    {} as any,
    refreshTokenModel as any,
    configService,
    jwtService,
  );
  return { service, refreshTokenModel, userModel, jwtService };
}

const signed = (jwt: JwtService, payload: any, secret: string) =>
  jwt.sign(payload, { secret, expiresIn: 600 });

describe('AuthService.refreshToken type claims (fail-closed)', () => {
  it('rejects an access-type token even when signed with the refresh secret', async () => {
    const { service, refreshTokenModel, jwtService } = makeService();
    const token = signed(jwtService, { id: 1, type: 'access' }, REFRESH_SECRET);

    await expect(
      service.refreshToken({ refreshToken: token }),
    ).rejects.toThrow(UnauthorizedException);
    expect(refreshTokenModel.create).not.toHaveBeenCalled();
  });

  it('rejects a legacy token with no type claim', async () => {
    const { service, refreshTokenModel, jwtService } = makeService();
    const token = signed(jwtService, { id: 1 }, REFRESH_SECRET);

    await expect(
      service.refreshToken({ refreshToken: token }),
    ).rejects.toThrow(UnauthorizedException);
    expect(refreshTokenModel.create).not.toHaveBeenCalled();
  });

  it('rejects a refresh-type token signed with the ACCESS secret', async () => {
    const { service, jwtService } = makeService();
    const token = signed(jwtService, { id: 1, type: 'refresh' }, ACCESS_SECRET);

    await expect(
      service.refreshToken({ refreshToken: token }),
    ).rejects.toThrow(UnauthorizedException);
  });
});

describe('AuthService.refreshToken fail-closed on DB errors', () => {
  it('throws 503 and issues no new pair when the revocation check fails', async () => {
    const { service, refreshTokenModel, jwtService } = makeService();
    const token = signed(jwtService, { id: 1, type: 'refresh' }, REFRESH_SECRET);
    refreshTokenModel.findOne.mockRejectedValue(new Error('ER_LOCK_DEADLOCK'));

    const err = await service
      .refreshToken({ refreshToken: token })
      .catch((e) => e);

    expect(err).toBeInstanceOf(HttpException);
    expect(err.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    expect(refreshTokenModel.create).not.toHaveBeenCalled();
  });
});

describe('AuthService.logout reports revocation failure', () => {
  it('returns false when the DB update fails, true on success (hashing the token)', async () => {
    const { service, refreshTokenModel } = makeService();

    refreshTokenModel.update.mockRejectedValueOnce(new Error('db down'));
    await expect(service.logout(1, 'some-token')).resolves.toBe(false);

    await expect(service.logout(1, 'some-token')).resolves.toBe(true);
    expect(refreshTokenModel.update).toHaveBeenLastCalledWith(
      { isRevoked: true },
      expect.objectContaining({
        where: { userId: 1, token: hashToken('some-token'), isRevoked: false },
      }),
    );
  });

  it('returns false for an unknown token, true for an already-revoked one', async () => {
    const { service, refreshTokenModel } = makeService();

    // revoked nothing + row unknown → failure (no silent 200)
    refreshTokenModel.update.mockResolvedValueOnce([0]);
    refreshTokenModel.findOne.mockResolvedValueOnce(null);
    await expect(service.logout(1, 'bogus')).resolves.toBe(false);

    // revoked nothing + row exists (already revoked) → idempotent success
    refreshTokenModel.update.mockResolvedValueOnce([0]);
    refreshTokenModel.findOne.mockResolvedValueOnce({ id: 7 });
    await expect(service.logout(1, 'already-revoked')).resolves.toBe(true);
  });

  it("revokes the user's remaining live refresh tokens when the presented one is known but already revoked", async () => {
    const { service, refreshTokenModel } = makeService();

    // presented row revokes nothing (already revoked) but IS known → logout
    // must still end the session: every other live row for the user dies too.
    refreshTokenModel.update.mockResolvedValueOnce([0]);
    refreshTokenModel.findOne.mockResolvedValueOnce({ id: 7 });
    await expect(service.logout(1, 'stale-rotated-token')).resolves.toBe(true);
    expect(refreshTokenModel.update).toHaveBeenLastCalledWith(
      { isRevoked: true },
      { where: { userId: 1, isRevoked: false } },
    );
  });
});

describe('refresh token rotation issues unique tokens', () => {
  it('two same-second rotations produce different refresh tokens (jti)', async () => {
    const { service, refreshTokenModel, userModel, jwtService } = makeService();
    const stored: any = {
      expiresAt: new Date(Date.now() + 60_000),
      update: jest.fn().mockResolvedValue(undefined),
    };
    refreshTokenModel.findOne.mockResolvedValue(stored);
    userModel.findByPk.mockResolvedValue({
      id: 1,
      email: 'a@b.c',
      role: { name: 'user' },
    });
    const token = signed(jwtService, { id: 1, type: 'refresh' }, REFRESH_SECRET);

    const r1: any = await service.refreshToken({ refreshToken: token });
    const r2: any = await service.refreshToken({ refreshToken: token });
    expect(r1.refreshToken).toBeDefined();
    expect(r1.refreshToken).not.toBe(r2.refreshToken);
  });
});

describe('SignupDto phone regex is anchored and stateless', () => {
  const baseDto = () =>
    Object.assign(new SignupDto(), {
      name: 'Test User',
      email: 'test@example.com',
      password: 'secret1',
      role: 'user',
    });

  it('accepts a full valid Vietnamese phone number', async () => {
    const dto = baseDto();
    dto.phone = '0828696919';
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects a valid number embedded in junk (unanchored match)', async () => {
    const dto = baseDto();
    dto.phone = 'xx0828696919yy';
    const errors = await validate(dto);
    expect(errors.map((e) => e.property)).toContain('phone');
  });

  it('gives the same verdict twice for the same input (no /g lastIndex drift)', async () => {
    const dto = baseDto();
    dto.phone = '+84828696919';
    expect(await validate(dto)).toHaveLength(0);
    expect(await validate(dto)).toHaveLength(0);
  });
});
