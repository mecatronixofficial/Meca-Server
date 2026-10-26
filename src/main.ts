import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp, docsEnabled, DOCS_PATH } from './app.setup';

async function bootstrap(): Promise<void> {
  const app = configureApp(await NestFactory.create<NestExpressApplication>(AppModule));
  app.enableShutdownHooks();

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT') ?? 5000;
  await app.listen(port, config.get<string>('HOST') ?? '0.0.0.0');

  const logger = new Logger('Bootstrap');
  logger.log(`Mecatronix API listening on port ${port} (${config.get<string>('NODE_ENV') ?? 'development'})`);
  if (docsEnabled(config)) logger.log(`API docs: http://localhost:${port}/${DOCS_PATH}`);
}

void bootstrap();
