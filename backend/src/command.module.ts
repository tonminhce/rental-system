import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { loggerUtil } from './utils/log.util';
import { ConfigAppModule } from './modules/config-app.module';

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
          models: [],
          logging: (msg) => {
            // const logger = new Logger();
            loggerUtil.info(msg, 'Sequelize');
          },
        };
      },
    }),
    SequelizeModule.forFeature([]),
  ],
  providers: [],
})
export class CommandModule implements NestModule {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  configure(consumer: MiddlewareConsumer) {
  }
}
