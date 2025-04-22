import {
  Module,
  NestModule,
  ValidationPipe,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ConfigAppModule } from './modules/config-app.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { PostModule } from './modules/post/post.module';
import { JwtAuthGuard } from './guard/jwt.guard';
import { SetLoginUserGloballyMiddleware } from "./middleware/set-login-user-globally.middleware";
import { Logger } from './shared/utils/log.util'

@Module({
  imports: [
    ConfigAppModule,
    DatabaseModule,
    AuthModule,
    PostModule,
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
