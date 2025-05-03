import { ConfigService } from '@nestjs/config';
import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { Logger } from 'src/shared/utils/log.util';
import { User } from 'src/database/entities/user.entity';
import { RentalPost } from 'src/database/entities/rental-post.entity';
import { RentalImage } from 'src/database/entities/rental-image.entity';
import { ChatRoom } from 'src/database/entities/chat-room.entity';
import { ChatRoomMember } from 'src/database/entities/chat-room-member.entity';
import { Message } from 'src/database/entities/message.entity';
import { FavoriteList } from 'src/database/entities/favorite-list.entity';
import { Role } from 'src/database/entities/role.entity';
import { UserProfile } from 'src/database/entities/user-profile.entity';
import { Booking } from 'src/database/entities/booking.entity';

export const databaseConfig = (
  configService: ConfigService,
): SequelizeModuleOptions => {
  return {
    dialect: 'mysql',
    port: configService.get<number>('DB_PORT'),
    host: configService.get<string>('DB_HOST_READ'),
    username: configService.get<string>('DB_USER'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME'),
    pool: {
      max: 20,
      min: 0,
      idle: 10000,
    },
    logging: (msg) => {
      const logger = new Logger();
      logger.info(msg, 'Sequelize');
    },
    logQueryParameters: true,
    autoLoadModels: false,
    synchronize: false,
    models: [
      Role,
      User,
      RentalPost,
      RentalImage,
      ChatRoom,
      ChatRoomMember,
      Message,
      FavoriteList,
      UserProfile,
      Booking
    ],
  };
};