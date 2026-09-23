import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [`.env`],
      // envFilePath: [`.env.${process.env.NODE_ENV}`],
    }),
  ],
})
export class ConfigAppModule {}
