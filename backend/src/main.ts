import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './app/http-exception.filter';
import { AllExceptionFilter } from './app/all-exception.filter';
import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerDocumentOptions,
} from '@nestjs/swagger';
import { Logger } from './shared/utils/log.util';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new Logger(),
  });

  const configService = app.get(ConfigService); // Use the ConfigService
  app.setGlobalPrefix(configService.get<string>('APP_PREFIX')); // Use configService
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionFilter());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN').split(','),
    credentials: true,
    preflightContinue: false,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });
  const nodeENV: string = configService.get<string>('NODE_ENV');
  if (nodeENV !== 'production') {
    const appName = configService.get<string>('APP_NAME');
    const appDescription = configService.get<string>('APP_DESCRIPTION');
    const appVersion = configService.get<string>('APP_VERSION');
    const swaggerPath = configService.get<string>('SWAGGER_PATH');
    const config = new DocumentBuilder()
      .setTitle(`Service Name: ${appName}`)
      .setDescription(`${appDescription}`)
      .setVersion(`${appVersion}`)
      .addBearerAuth()
      .build();
    const options: SwaggerDocumentOptions = {
      operationIdFactory: (controllerKey: string, methodKey: string) =>
        methodKey,
    };
    const document = SwaggerModule.createDocument(app, config, options);
    SwaggerModule.setup(swaggerPath, app, document);
  }
  // CommandFactory.run(AppModule);
  await app.listen(configService.get<number>('APP_PORT')); // Use configService
}

bootstrap();
