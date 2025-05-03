import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import {
  databaseConfig,
} from '../config/database.config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../database/entities/user.entity';
import { RentalPost } from '../database/entities/rental-post.entity';
import { RentalImage } from '../database/entities/rental-image.entity';
import { ChatRoom } from '../database/entities/chat-room.entity';
import { ChatRoomMember } from '../database/entities/chat-room-member.entity';
import { Message } from '../database/entities/message.entity';
import { FavoriteList } from '../database/entities/favorite-list.entity';
import { Role } from '../database/entities/role.entity';
import { UserProfile } from 'src/database/entities/user-profile.entity';
import { Booking } from 'src/database/entities/booking.entity';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return databaseConfig(configService);
      },
    }),
    SequelizeModule.forFeature([
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
    ]),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
