import {
  Module,
  NestModule,
  ValidationPipe,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ConfigAppModule } from './modules/config-app.module';
import { DatabaseModule } from './modules/database.module';
import { AuthModule } from './modules/common/auth/auth.module';
import { Logger } from './utils/log.util';
import { JwtAuthGuard } from './guard/jwt.guard';
import { SetLoginUserGloballyMiddleware } from "./middleware/set-login-user-globally.middleware";

@Module({
  imports: [
    ConfigAppModule,
    DatabaseModule,
    AuthModule,
  ],
  providers: [
    Logger,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SetLoginUserGloballyMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL })
  }
}
