import { Global, Module } from '@nestjs/common';
import { AppUrls } from './app-urls';

/** App-wide helpers available to every module without importing. */
@Global()
@Module({ providers: [AppUrls], exports: [AppUrls] })
export class CommonModule {}
