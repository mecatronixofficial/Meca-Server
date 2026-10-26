import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminsModule } from './admins/admins.module';
import { AuthModule } from './auth/auth.module';
import { BannersModule } from './banners/banners.module';
import { BlogsModule } from './blogs/blogs.module';
import { ClientsModule } from './clients/clients.module';
import { CommonModule } from './common/common.module';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { validateEnvironment } from './config/environment';
import { DashboardModule } from './dashboard/dashboard.module';
import { ENTITIES } from './database/entities';
import { postgresSsl, postgresUrl } from './database/postgres-connection';
import { EnquiriesModule } from './enquiries/enquiries.module';
import { HealthController } from './health/health.controller';
import { InvoicesModule } from './invoices/invoices.module';
import { MailModule } from './mail/mail.module';
import { NewslettersModule } from './newsletters/newsletters.module';
import { ProjectsModule } from './projects/projects.module';
import { ReviewsModule } from './reviews/reviews.module';
import { StorageModule } from './storage/storage.module';
import { VouchersModule } from './vouchers/vouchers.module';
import { WorksModule } from './works/works.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateEnvironment }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        { ttl: config.getOrThrow<number>('RATE_LIMIT_WINDOW_MS'), limit: config.getOrThrow<number>('RATE_LIMIT_MAX_REQUESTS') },
      ],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: postgresUrl(config.getOrThrow<string>('DATABASE_URL')),
        ssl: postgresSsl({ DB_SSL: config.get('DB_SSL'), DB_SSL_CA: config.get('DB_SSL_CA') }),
        entities: ENTITIES,
        synchronize: config.get('DB_SYNCHRONIZE') === 'true' && config.get('NODE_ENV') !== 'production',
        logging: config.get('DB_LOGGING') === 'true',
        extra: { max: config.get<number>('DATABASE_CONNECTION_LIMIT'), connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000 },
      }),
    }),

    // Infrastructure
    CommonModule,
    MailModule,
    StorageModule,

    // Domain
    AuthModule,
    AdminsModule,
    BlogsModule,
    ClientsModule,
    ReviewsModule,
    ProjectsModule,
    WorksModule,
    BannersModule,
    EnquiriesModule,
    NewslettersModule,
    VouchersModule,
    InvoicesModule,
    DashboardModule,
  ],
  controllers: [HealthController],
  providers: [
    // Guard order matters: rate limit, then authenticate, then authorize.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
