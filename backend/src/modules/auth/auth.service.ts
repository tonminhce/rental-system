import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import * as ms from 'ms';
import { User } from '../../database/entities/user.entity';
import { Role } from '../../database/entities/role.entity';
import { RefreshToken } from '../../database/entities/refresh-token.entity';
import { loggerUtil } from '../../shared/utils/log.util';
import { encodeToMD5 } from '../../shared/utils/md5.util';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SequelizeErrorUtil } from 'src/utils/sequelize-error.util';

const _serviceName = 'AuthService';

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
  async signup(signupDto: SignupDto): Promise<{ user: any; token: string; refreshToken: string }> {
    loggerUtil.info(
      `${_serviceName}.signup begin with email: ${signupDto.email}`,
    );

    try {
      
      const role = await this.roleModel.findOne({
        where: { name: signupDto.role },
      });

      const hashedPassword = encodeToMD5(signupDto.password);

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
      const { token, refreshToken, refreshTokenExpiry } = this.generateTokens(payload);

      // Cố gắng lưu refresh token vào database
      try {
        await this.storeRefreshToken(user.id, refreshToken, refreshTokenExpiry);
      } catch (e) {
        loggerUtil.warn(`${_serviceName}.signup could not store refresh token, but continuing: ${e.message}`);
        // Tiếp tục mà không dừng lại nếu có lỗi lưu token
      }

      loggerUtil.info(`${_serviceName}.signup successful with tokens generated`);

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

  async login(loginDto: LoginDto): Promise<{ user: any; token: string; refreshToken: string }> {
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
        throw new UnauthorizedException('Invalid credentials');
      }

      const hashedPassword = encodeToMD5(loginDto.password);
      if (hashedPassword !== user.password) {
        loggerUtil.warn(
          `${_serviceName}.login invalid password for user: ${loginDto.email}`,
        );
        throw new UnauthorizedException('Invalid credentials');
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
      const { token, refreshToken, refreshTokenExpiry } = this.generateTokens(payload);

      // Cố gắng thu hồi các refresh token cũ nếu có thể
      try {
        await this.revokeAllRefreshTokens(user.id);
      } catch (e) {
        loggerUtil.warn(`${_serviceName}.login could not revoke old refresh tokens, but continuing: ${e.message}`);
        // Tiếp tục mà không dừng lại nếu có lỗi thu hồi
      }

      // Cố gắng lưu refresh token mới nếu có thể
      try {
        await this.storeRefreshToken(user.id, refreshToken, refreshTokenExpiry);
      } catch (e) {
        loggerUtil.warn(`${_serviceName}.login could not store refresh token, but continuing: ${e.message}`);
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
  
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<{ token: string; refreshToken: string }> {
    try {
      loggerUtil.info(`${_serviceName}.refreshToken begin`);
      
      const refreshTokenSecret = this.configService.get('REFRESH_TOKEN_SECRET');
      
      // Verify refresh token
      let payload;
      try {
        payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
          secret: refreshTokenSecret,
        });
      } catch (error) {
        loggerUtil.error(`${_serviceName}.refreshToken invalid refresh token: ${error.message}`);
        throw new UnauthorizedException('Invalid refresh token');
      }
      
      // Kiểm tra token trong database nếu có thể
      try {
        const storedToken = await this.refreshTokenModel.findOne({
          where: { 
            token: refreshTokenDto.refreshToken,
            userId: payload.id,
            isRevoked: false 
          }
        });

        if (!storedToken) {
          loggerUtil.warn(`${_serviceName}.refreshToken token not found or revoked for user: ${payload.id}`);
          throw new UnauthorizedException('Invalid or revoked refresh token');
        }

        // Kiểm tra hạn sử dụng trong database
        if (new Date() > storedToken.expiresAt) {
          loggerUtil.warn(`${_serviceName}.refreshToken token expired for user: ${payload.id}`);
          await storedToken.update({ isRevoked: true });
          throw new UnauthorizedException('Refresh token expired');
        }
        
        // Revoke current token
        await storedToken.update({ isRevoked: true });
      } catch (error) {
        // Nếu có lỗi khi kiểm tra database, log cảnh báo và tiếp tục
        if (!(error instanceof UnauthorizedException)) {
          loggerUtil.warn(`${_serviceName}.refreshToken error checking database token, but continuing: ${error.message}`);
          // Chỉ throw lỗi UnauthorizedException, các lỗi khác cho phép tiếp tục
        } else {
          throw error;
        }
      }
      
      // Check if user still exists
      const user = await this.userModel.findByPk(payload.id, {
        include: ['role'],
      });
      
      if (!user) {
        loggerUtil.warn(`${_serviceName}.refreshToken user not found with id: ${payload.id}`);
        throw new UnauthorizedException('User no longer exists');
      }
      
      // Tạo tokens mới
      const newPayload = {
        id: user.id,
        email: user.email,
        role: user.role ? user.role.name : null,
      };
      
      const { token, refreshToken, refreshTokenExpiry } = this.generateTokens(newPayload);
      
      // Lưu refresh token mới vào database nếu có thể
      try {
        await this.storeRefreshToken(user.id, refreshToken, refreshTokenExpiry);
      } catch (e) {
        loggerUtil.warn(`${_serviceName}.refreshToken could not store new refresh token, but continuing: ${e.message}`);
        // Tiếp tục mà không dừng lại nếu có lỗi lưu token
      }
      
      loggerUtil.info(`${_serviceName}.refreshToken successful for user: ${user.email}`);
      
      return { token, refreshToken };
    } catch (error) {
      loggerUtil.error(`${_serviceName}.refreshToken error: ${error.message}`, error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new HttpException('Could not refresh token', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async logout(userId: number, token?: string): Promise<boolean> {
    try {
      loggerUtil.info(`${_serviceName}.logout begin for user: ${userId}`);
      
      try {
        if (token) {
          // Vô hiệu hóa token cụ thể
          const refreshToken = await this.refreshTokenModel.findOne({
            where: {
              userId,
              token,
              isRevoked: false
            }
          });
          
          if (refreshToken) {
            await refreshToken.update({ isRevoked: true });
            loggerUtil.info(`${_serviceName}.logout specific token revoked for user: ${userId}`);
          }
        } else {
          // Vô hiệu hóa tất cả refresh token của user
          await this.revokeAllRefreshTokens(userId);
          loggerUtil.info(`${_serviceName}.logout all tokens revoked for user: ${userId}`);
        }
      } catch (error) {
        // Ignore database errors during logout
        loggerUtil.warn(`${_serviceName}.logout error revoking tokens, but continuing: ${error.message}`);
      }
      
      return true;
    } catch (error) {
      loggerUtil.error(`${_serviceName}.logout error: ${error.message}`, error);
      // Always return success, even if there was an error
      return true;
    }
  }

  // Phương thức tạo tokens
  private generateTokens(payload: any): { token: string; refreshToken: string; refreshTokenExpiry: Date } {
    const tokenSecret = this.configService.get('TOKEN_SECRET');
    const tokenExpiration = this.configService.get('TOKEN_EXPIRATION') || '1h';
    
    const refreshTokenSecret = this.configService.get('REFRESH_TOKEN_SECRET') || '1qazXSW@';
    const refreshTokenExpiration = this.configService.get('REFRESH_TOKEN_EXPIRATION') || '7d';
    
    const token = this.jwtService.sign(payload, {
      secret: tokenSecret,
      expiresIn: +ms(tokenExpiration) / 1000,
    });
    
    const refreshToken = this.jwtService.sign(payload, {
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
    try {
      // Kiểm tra xem model đã được khởi tạo chưa
      if (!this.refreshTokenModel) {
        loggerUtil.warn(`${_serviceName}.revokeAllRefreshTokens model not initialized`);
        return;
      }

      // Tìm tất cả token chưa bị revoke của user
      const activeTokens = await this.refreshTokenModel.findAll({
        where: {
          userId,
          isRevoked: false
        }
      });
      
      // Cập nhật từng token
      for (const token of activeTokens) {
        token.isRevoked = true;
        await token.save();
      }
      
      loggerUtil.info(`${_serviceName}.revokeAllRefreshTokens successful for user: ${userId}, revoked ${activeTokens.length} tokens`);
    } catch (error) {
      loggerUtil.error(`${_serviceName}.revokeAllRefreshTokens error: ${error.message}`, error);
      throw new HttpException('Failed to revoke refresh tokens', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Lưu refresh token vào database
  private async storeRefreshToken(userId: number, token: string, expiresAt: Date): Promise<void> {
    try {
      // Kiểm tra xem model đã được khởi tạo chưa
      if (!this.refreshTokenModel) {
        loggerUtil.warn(`${_serviceName}.storeRefreshToken model not initialized`);
        return;
      }

      await this.refreshTokenModel.create({
        userId,
        token,
        expiresAt,
        isRevoked: false
      });
      loggerUtil.info(`${_serviceName}.storeRefreshToken successful for user: ${userId}`);
    } catch (error) {
      loggerUtil.error(`${_serviceName}.storeRefreshToken error: ${error.message}`, error);
      throw new HttpException('Failed to store refresh token', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Hàm mới chỉ tạo access token (giữ lại để tương thích)
  private generateAccessToken(payload: any): string {
    const tokenSecret = this.configService.get('TOKEN_SECRET');
    const tokenExpiration = this.configService.get('TOKEN_EXPIRATION') || '1d';
    
    return this.jwtService.sign(payload, {
      secret: tokenSecret,
      expiresIn: +ms(tokenExpiration) / 1000,
    });
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    loggerUtil.info(
      `${_serviceName}.changePassword begin for userId: ${userId}`,
    );

    try {
      // Confirm that newPassword and confirmPassword match
      if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
        throw new HttpException('New password and confirm password do not match', HttpStatus.BAD_REQUEST);
      }

      // Find the user
      const user = await this.userModel.findByPk(userId);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Verify current password
      const currentHashedPassword = encodeToMD5(changePasswordDto.currentPassword);
      if (currentHashedPassword !== user.password) {
        throw new HttpException('Current password is incorrect', HttpStatus.BAD_REQUEST);
      }

      // Hash and set new password
      const newHashedPassword = encodeToMD5(changePasswordDto.newPassword);
      
      // Check if new password is the same as current password
      if (newHashedPassword === user.password) {
        throw new HttpException('New password cannot be the same as current password', HttpStatus.BAD_REQUEST);
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
      loggerUtil.error(`${_serviceName}.changePassword error: ${error.message}`, error);
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
