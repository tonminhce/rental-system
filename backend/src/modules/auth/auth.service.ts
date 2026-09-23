import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { createHash } from 'crypto';
import { Op, Transaction } from 'sequelize';
import * as ms from 'ms';
import { User } from '../../database/entities/user.entity';
import { Role } from '../../database/entities/role.entity';
import { RefreshToken } from '../../database/entities/refresh-token.entity';
import { loggerUtil } from '../../shared/utils/log.util';
import { hashPassword, verifyPassword } from '../../shared/utils/password.util';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SequelizeErrorUtil } from 'src/utils/sequelize-error.util';

const _serviceName = 'AuthService';

// ponytail: all-zero digest in verifyPassword's scrypt format — can never
// authenticate; exists only so the user-not-found login path burns the same
// scrypt cost as the wrong-password path (no account-enumeration timing gap).
const DUMMY_SCRYPT_HASH = `scrypt:${'0'.repeat(32)}:${'0'.repeat(128)}`;

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(Role)
    private roleModel: typeof Role,
    @InjectModel(RefreshToken)
    private refreshTokenModel: typeof RefreshToken,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    loggerUtil.info(`${_serviceName} initialized with models:`, {
      hasUserModel: !!this.userModel,
      hasRoleModel: !!this.roleModel,
      hasRefreshTokenModel: !!this.refreshTokenModel,
    });
  }
  async signup(
    signupDto: SignupDto,
  ): Promise<{ user: any; token: string; refreshToken: string }> {
    loggerUtil.info(
      `${_serviceName}.signup begin with email: ${signupDto.email}`,
    );

    try {
      const role = await this.roleModel.findOne({
        where: { name: signupDto.role },
      });

      if (!role)
        throw new HttpException('Invalid account role', HttpStatus.BAD_REQUEST);
      const hashedPassword = await hashPassword(signupDto.password);

      const user = await this.userModel.create({
        name: signupDto.name,
        email: signupDto.email,
        password: hashedPassword,
        phone: signupDto.phone,
        roleId: role.id,
      });

      loggerUtil.info(
        `${_serviceName}.signup user created with id: ${user.id}`,
      );

      const payload = {
        id: user.id,
        email: user.email,
        role: role.name,
      };

      // Tạo cả access token và refresh token
      const { token, refreshToken, refreshTokenExpiry } =
        this.generateTokens(payload);

      // Cố gắng lưu refresh token vào database
      try {
        await this.storeRefreshToken(user.id, refreshToken, refreshTokenExpiry);
      } catch (e) {
        loggerUtil.warn(
          `${_serviceName}.signup could not store refresh token, but continuing: ${e.message}`,
        );
        // Tiếp tục mà không dừng lại nếu có lỗi lưu token
      }

      loggerUtil.info(
        `${_serviceName}.signup successful with tokens generated`,
      );

      const userData = {
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: role.name,
      };

      return { user: userData, token, refreshToken };
    } catch (error) {
      loggerUtil.error(`${_serviceName}.signup error: ${error.message}`, error);
      if (error instanceof Error) {
        const message = SequelizeErrorUtil.formatSequelizeError(error);
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }
      throw error;
    }
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ user: any; token: string; refreshToken: string }> {
    loggerUtil.info(
      `${_serviceName}.login begin with email: ${loginDto.email}`,
    );

    try {
      const user = await this.userModel.findOne({
        where: { email: loginDto.email },
        include: ['role'],
      });

      if (!user) {
        loggerUtil.warn(
          `${_serviceName}.login user not found: ${loginDto.email}`,
        );
        // Absorb the same scrypt cost as the wrong-password branch below.
        await verifyPassword(loginDto.password, DUMMY_SCRYPT_HASH);
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!(await verifyPassword(loginDto.password, user.password))) {
        loggerUtil.warn(
          `${_serviceName}.login invalid password for user: ${loginDto.email}`,
        );
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.password.startsWith('scrypt:')) {
        await user.update({ password: await hashPassword(loginDto.password) });
      }
      const payload = {
        id: user.id,
        email: user.email,
        role: user.role ? user.role.name : null,
      };

      loggerUtil.info(
        `${_serviceName}.login generating tokens with payload: ${JSON.stringify(payload)}`,
      );

      // Tạo cả access token và refresh token
      const { token, refreshToken, refreshTokenExpiry } =
        this.generateTokens(payload);

      // Cố gắng thu hồi các refresh token cũ nếu có thể
      try {
        await this.revokeAllRefreshTokens(user.id);
      } catch (e) {
        loggerUtil.warn(
          `${_serviceName}.login could not revoke old refresh tokens, but continuing: ${e.message}`,
        );
        // Tiếp tục mà không dừng lại nếu có lỗi thu hồi
      }

      // Cố gắng lưu refresh token mới nếu có thể
      try {
        await this.storeRefreshToken(user.id, refreshToken, refreshTokenExpiry);
      } catch (e) {
        loggerUtil.warn(
          `${_serviceName}.login could not store refresh token, but continuing: ${e.message}`,
        );
        // Tiếp tục mà không dừng lại nếu có lỗi lưu token
      }

      loggerUtil.info(
        `${_serviceName}.login successful for user: ${user.email}`,
      );

      const userData = {
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role ? user.role.name : null,
      };

      return { user: userData, token, refreshToken };
    } catch (error) {
      loggerUtil.error(`${_serviceName}.login error: ${error.message}`, error);
      if (error instanceof Error) {
        const message = SequelizeErrorUtil.formatSequelizeError(error);
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }
      throw error;
    }
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<{ token: string; refreshToken: string }> {
    loggerUtil.info(`${_serviceName}.refreshToken begin`);

    // Verify with REFRESH_TOKEN_SECRET ONLY — never fall back to the access
    // secret (an undefined option would make jsonwebtoken use JwtModule's).
    const refreshTokenSecret = this.configService.get<string>(
      'REFRESH_TOKEN_SECRET',
    );
    if (!refreshTokenSecret) {
      loggerUtil.error(
        `${_serviceName}.refreshToken REFRESH_TOKEN_SECRET is not configured`,
      );
      throw new HttpException(
        'Token refresh unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    let payload;
    try {
      payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: refreshTokenSecret,
      });
    } catch (error) {
      loggerUtil.error(
        `${_serviceName}.refreshToken invalid refresh token: ${error.message}`,
      );
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Fail-closed on the type claim: rejects access tokens and any legacy
    // token issued before type claims existed.
    if (payload.type !== 'refresh') {
      loggerUtil.warn(
        `${_serviceName}.refreshToken rejected token of type: ${payload.type}`,
      );
      throw new UnauthorizedException('Invalid refresh token');
    }

    try {
      const result = await this.rotateRefreshToken(
        payload.id,
        AuthService.hashToken(refreshTokenDto.refreshToken),
      );
      if ('error' in result) {
        throw new UnauthorizedException(result.error);
      }
      loggerUtil.info(
        `${_serviceName}.refreshToken successful for user id: ${payload.id}`,
      );
      return result;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Fail-closed: any DB error during rotation → 503, no new pair issued.
      loggerUtil.error(
        `${_serviceName}.refreshToken rotation failed: ${error.message}`,
        error,
      );
      throw new HttpException(
        'Could not refresh token',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  // Revoke the presented token and insert its replacement atomically under a
  // row lock, so concurrent refreshes can't both rotate the same token.
  private async rotateRefreshToken(
    userId: number,
    tokenHash: string,
  ): Promise<{ token: string; refreshToken: string } | { error: string }> {
    const sequelize = this.refreshTokenModel.sequelize;
    return sequelize.transaction(async (t: Transaction) => {
      const storedToken = await this.refreshTokenModel.findOne({
        where: { token: tokenHash, userId, isRevoked: false },
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!storedToken) {
        return { error: 'Invalid or revoked refresh token' };
      }

      const expired = new Date() > storedToken.expiresAt;
      await storedToken.update({ isRevoked: true }, { transaction: t });
      if (expired) {
        return { error: 'Refresh token expired' };
      }

      // Lazily delete rows past their expiry — no cron.
      // ponytail: whole-table sweep per rotation, scheduled cleanup if it grows hot
      await this.refreshTokenModel.destroy({
        where: { expiresAt: { [Op.lt]: new Date() } },
        transaction: t,
      });

      const user = await this.userModel.findByPk(userId, {
        include: ['role'],
        transaction: t,
      });
      if (!user) {
        return { error: 'User no longer exists' };
      }

      const { token, refreshToken, refreshTokenExpiry } = this.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role ? user.role.name : null,
      });
      await this.storeRefreshToken(
        user.id,
        refreshToken,
        refreshTokenExpiry,
        t,
      );
      return { token, refreshToken };
    });
  }

  async logout(userId: number, token?: string): Promise<boolean> {
    loggerUtil.info(`${_serviceName}.logout begin for user: ${userId}`);
    try {
      const [affected] = await this.refreshTokenModel.update(
        { isRevoked: true },
        {
          where: token
            ? { userId, token: AuthService.hashToken(token), isRevoked: false }
            : { userId, isRevoked: false },
        },
      );
      if (token && affected === 0) {
        // Fail-closed on a token that revoked nothing: an already-revoked row
        // keeps double-logout idempotent (true), an unknown token is a client
        // error (false) instead of a silent 200.
        const known = await this.refreshTokenModel.findOne({
          where: { userId, token: AuthService.hashToken(token) },
          attributes: ['id'],
        });
        if (!known) {
          loggerUtil.warn(
            `${_serviceName}.logout unknown refresh token for user: ${userId}`,
          );
          return false;
        }
      }
      loggerUtil.info(
        `${_serviceName}.logout tokens revoked for user: ${userId}`,
      );
      return true;
    } catch (error) {
      // Fail-closed: report failure when revocation did not happen.
      loggerUtil.error(
        `${_serviceName}.logout failed to revoke tokens for user ${userId}: ${error.message}`,
        error,
      );
      return false;
    }
  }

  // Tokens are stored as sha256 hashes — a DB leak can't be replayed.
  // Compatibility break: pre-existing cleartext rows never match again; users re-login.
  private static hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  // Phương thức tạo tokens
  private generateTokens(payload: any): {
    token: string;
    refreshToken: string;
    refreshTokenExpiry: Date;
  } {
    const tokenSecret = this.configService.get('TOKEN_SECRET');
    const tokenExpiration = this.configService.get('TOKEN_EXPIRATION') || '1h';

    const refreshTokenSecret = this.configService.get('REFRESH_TOKEN_SECRET');
    const refreshTokenExpiration =
      this.configService.get('REFRESH_TOKEN_EXPIRATION') || '7d';

    const token = this.jwtService.sign({ ...payload, type: 'access' }, {
      secret: tokenSecret,
      expiresIn: +ms(tokenExpiration) / 1000,
    });

    const refreshToken = this.jwtService.sign({ ...payload, type: 'refresh' }, {
      secret: refreshTokenSecret,
      expiresIn: +ms(refreshTokenExpiration) / 1000,
    });

    // Tính thời gian hết hạn
    const refreshTokenExpiryMs = +ms(refreshTokenExpiration);
    const refreshTokenExpiry = new Date(Date.now() + refreshTokenExpiryMs);

    return { token, refreshToken, refreshTokenExpiry };
  }

  // Vô hiệu hóa tất cả refresh token của user
  private async revokeAllRefreshTokens(userId: number): Promise<void> {
    const [revoked] = await this.refreshTokenModel.update(
      { isRevoked: true },
      { where: { userId, isRevoked: false } },
    );
    loggerUtil.info(
      `${_serviceName}.revokeAllRefreshTokens revoked ${revoked} tokens for user: ${userId}`,
    );
  }

  // Lưu refresh token (sha256 hash) vào database
  private async storeRefreshToken(
    userId: number,
    token: string,
    expiresAt: Date,
    transaction?: Transaction,
  ): Promise<void> {
    try {
      await this.refreshTokenModel.create(
        {
          userId,
          token: AuthService.hashToken(token),
          expiresAt,
          isRevoked: false,
        } as any,
        transaction ? { transaction } : undefined,
      );
      loggerUtil.info(
        `${_serviceName}.storeRefreshToken successful for user: ${userId}`,
      );
    } catch (error) {
      loggerUtil.error(
        `${_serviceName}.storeRefreshToken error: ${error.message}`,
        error,
      );
      throw new HttpException(
        'Failed to store refresh token',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    loggerUtil.info(
      `${_serviceName}.changePassword begin for userId: ${userId}`,
    );

    try {
      // Confirm that newPassword and confirmPassword match
      if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
        throw new HttpException(
          'New password and confirm password do not match',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Find the user
      const user = await this.userModel.findByPk(userId);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Verify current password
      if (
        !(await verifyPassword(
          changePasswordDto.currentPassword,
          user.password,
        ))
      ) {
        throw new HttpException(
          'Current password is incorrect',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Hash and set new password
      const newHashedPassword = await hashPassword(
        changePasswordDto.newPassword,
      );

      // Check if new password is the same as current password
      if (await verifyPassword(changePasswordDto.newPassword, user.password)) {
        throw new HttpException(
          'New password cannot be the same as current password',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Update the password
      await user.update({ password: newHashedPassword });

      // Revoke all existing refresh tokens (optional security measure)
      try {
        await this.revokeAllRefreshTokens(userId);
      } catch (e) {
        loggerUtil.warn(
          `${_serviceName}.changePassword could not revoke old refresh tokens, but continuing: ${e.message}`,
        );
      }

      loggerUtil.info(
        `${_serviceName}.changePassword successful for userId: ${userId}`,
      );

      return { message: 'Password changed successfully' };
    } catch (error) {
      loggerUtil.error(
        `${_serviceName}.changePassword error: ${error.message}`,
        error,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Error) {
        const message = SequelizeErrorUtil.formatSequelizeError(error);
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }
      throw error;
    }
  }
}
