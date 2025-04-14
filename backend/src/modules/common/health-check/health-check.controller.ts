import { ConfigService } from '@nestjs/config';
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { responseUtil } from 'src/utils/response.util';
import { Public } from 'src/decorator/public.decorator';
import { loggerUtil } from 'src/utils/log.util';
@ApiTags('health-check')
@Controller('health-check')
export class HealthCheckController {
  private readonly _configService;
  constructor(
    configService: ConfigService,
  ) {
    this._configService = configService;
  }

  @Public()
  @Get()
  healthCheck() {
    return responseUtil.success(
      {
        message: 'Service is running',
        env: this._configService.get('NODE_ENV'),
        version: this._configService.get('APP_VERSION'),
      },
      200,
    );
  }
}
