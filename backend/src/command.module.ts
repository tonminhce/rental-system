import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { loggerUtil } from 'src/shared/utils/log.util';
import { ConfigAppModule } from './modules/config-app.module';
import { User } from './database/entities/user.entity';
import { RentalPost } from './database/entities/rental-post.entity';
import { RentalImage } from './database/entities/rental-image.entity';
import { ChatRoom } from './database/entities/chat-room.entity';
import { ChatRoomMember } from './database/entities/chat-room-member.entity';
import { Message } from './database/entities/message.entity';
import { FavoriteList } from './database/entities/favorite-list.entity';
import { Role } from './database/entities/role.entity';
import { UserProfile } from './database/entities/user-profile.entity';

@Module({
  imports: [
    ConfigAppModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          dialect: 'mysql',
          port: configService.get<number>('DB_PORT') || 3306,
          host: configService.get<string>('DB_HOST_READ') || '127.0.0.1',
          username: configService.get<string>('DB_USER') || 'grab_user',
          password: configService.get<string>('DB_PASSWORD') || 'grab_pwd',
          database: configService.get<string>('DB_NAME') || 'grab_mysql',
          models: [
            Role,
            User,
            RentalPost,
            RentalImage,
            ChatRoom,
            ChatRoomMember,
            Message,
            FavoriteList,
            UserProfile
          ],
          logging: (msg) => {
            // const logger = new Logger();
            loggerUtil.info(msg, 'Sequelize');
          },
        };
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
      FavoriteList
    ]),
  ],
  providers: [],
})
export class CommandModule implements NestModule {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  configure(consumer: MiddlewareConsumer) {
  }
}
