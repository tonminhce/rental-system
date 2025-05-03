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
import { RolesGuard } from './shared/guards/roles.guard';
import { JwtAuthGuard } from './shared/guards/jwt.guard';
import { SetLoginUserGloballyMiddleware } from "./middleware/set-login-user-globally.middleware";
import { Logger } from './shared/utils/log.util'
import { RoommateModule } from './modules/roommate/roommate.module';
import { BookingModule } from './modules/booking/booking.module';

@Module({
  imports: [
    ConfigAppModule,
    DatabaseModule,
    AuthModule,
    PostModule,
    RoommateModule,
    BookingModule
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
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SetLoginUserGloballyMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL })
  }
}
