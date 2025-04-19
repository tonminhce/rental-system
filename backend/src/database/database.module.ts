import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { databaseConfig } from '../config/database.config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { RentalPost } from './entities/rental-post.entity';
import { RentalImage } from './entities/rental-image.entity';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatRoomMember } from './entities/chat-room-member.entity';
import { Message } from './entities/message.entity';
import { FavoriteList } from './entities/favorite-list.entity';
import { Role } from './entities/role.entity';

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
    ]),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
