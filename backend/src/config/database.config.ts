import { ConfigService } from '@nestjs/config';
import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { Logger } from 'src/utils/log.util';

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
    models: [],
  };
};