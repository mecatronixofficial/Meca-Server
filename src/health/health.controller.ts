import { Controller, Get, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { APP_VERSION, DOCS_PATH, docsEnabled } from '../app.setup';
import { ok } from '../common/api-response';
import { Public } from '../common/decorators/auth.decorators';
import { MailService } from '../mail/mail.service';

@ApiTags('Health')
@Public()
@SkipThrottle()
@Controller()
export class HealthController {
  constructor(
    private readonly db: DataSource,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  /** Browsers get the API home page; API clients and uptime monitors get the JSON health report. */
  @Get('/')
  @ApiOkResponse({ description: 'Health report (JSON), or the API home page when requested by a browser.' })
  async home(@Req() req: Request, @Res() res: Response) {
    const report = await this.report();
    if (req.accepts(['json', 'html']) !== 'html') return res.json(ok('Mecatronix API is running', report));
    res.render('pages/home', {
      ...report,
      docsUrl: docsEnabled(this.config) ? `/${DOCS_PATH}` : null,
      healthUrl: '/health',
    });
  }

  @Get('health')
  async health() {
    return ok('Mecatronix API is running', await this.report());
  }

  private async report() {
    const database = await this.db
      .query('SELECT 1')
      .then(() => 'up' as const)
      .catch(() => 'down' as const);
    return {
      status: database === 'up' ? 'ok' : 'degraded',
      database,
      mail: this.mail.enabled,
      version: APP_VERSION,
      environment: this.config.get<string>('NODE_ENV') ?? 'development',
      timestamp: new Date().toISOString(),
    };
  }
}
