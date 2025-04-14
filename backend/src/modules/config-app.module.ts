import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';
import { HealthCheckModule } from './common/health-check/health-check.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [`.env`],
      // envFilePath: [`.env.${process.env.NODE_ENV}`],
    }),

    HealthCheckModule,
  ],
})
export class ConfigAppModule {}
