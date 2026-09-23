import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './app/http-exception.filter';
import { AllExceptionFilter } from './app/all-exception.filter';
import { JwtExceptionFilter } from './shared/filters/jwt-exception.filter';
import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerDocumentOptions,
} from '@nestjs/swagger';
import { Sequelize } from 'sequelize-typescript';
import { Logger } from './shared/utils/log.util';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new Logger(),
  });

  const configService = app.get(ConfigService); // Use the ConfigService
  if (configService.get<string>('NODE_ENV') === 'production') {
    for (const name of ['TOKEN_SECRET', 'REFRESH_TOKEN_SECRET', 'DB_PASSWORD', 'CORS_ORIGIN']) {
      if (!process.env[name]) throw new Error(`${name} must be explicitly configured in production`);
    }
    for (const name of ['TOKEN_SECRET', 'REFRESH_TOKEN_SECRET']) {
      if (process.env[name].length < 32 || process.env[name].startsWith('local-development')) throw new Error(`${name} must be a strong production secret`);
    }
    if (process.env.TOKEN_SECRET === process.env.REFRESH_TOKEN_SECRET) throw new Error('Use separate signing keys for access and refresh tokens');
  }
  const httpInstance = app.getHttpAdapter().getInstance();
  httpInstance.disable('x-powered-by');
  // Behind nginx req.ip is the proxy unless we trust the first hop; without
  // this every client shares one rate-limit bucket.
  httpInstance.set('trust proxy', 1);

  // GET /api/health — 200 {"status":"ok"} when MySQL is reachable, else 503
  // {"status":"error"}. Registered as a raw express route: no auth, exact path.
  const sequelize = app.get(Sequelize);
  httpInstance.get(
    `/${configService.get<string>('APP_PREFIX')}/health`,
    async (_req, res) => {
      try {
        await sequelize.authenticate();
        res.status(200).json({ status: 'ok' });
      } catch {
        res.status(503).json({ status: 'error' });
      }
    },
  );

  // ponytail: per-process limiter, redis when >1 instance
  const authWindows = new Map<string, { count: number; expires: number }>();
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    if (req.method === 'POST' && /\/auth\/(login|signup|refresh-token)$/.test(req.path)) {
      const now = Date.now();
      const key = req.ip;
      const window = authWindows.get(key);
      if (window && window.expires > now) {
        if (++window.count > 30) return res.status(429).json({ message: 'Too many attempts. Please try again in a minute.' });
      } else {
        authWindows.set(key, { count: 1, expires: now + 60000 });
      }
      if (authWindows.size > 10000) authWindows.delete(authWindows.keys().next().value);
    }
    next();
  });
  app.setGlobalPrefix(configService.get<string>('APP_PREFIX')); // Use configService
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // Nest picks the FIRST registered filter whose @Catch type matches (and
  // @Catch() matches everything), so most-specific must come first — the old
  // order let AllExceptionFilter flatten every 401 into a 500.
  app.useGlobalFilters(new JwtExceptionFilter());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalFilters(new AllExceptionFilter());
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
  await app.listen(configService.get<number>('APP_PORT'), process.env.APP_HOST || '0.0.0.0');
}

bootstrap();
