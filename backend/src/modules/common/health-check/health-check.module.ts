import { Module } from '@nestjs/common';
import { HealthCheckController } from './health-check.controller';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [HealthCheckController],
  providers: [ConfigService],
})
export class HealthCheckModule {}
