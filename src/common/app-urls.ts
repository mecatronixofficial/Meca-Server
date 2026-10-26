import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const trim = (url: string) => url.replace(/\/+$/, '');

/** Public URLs used in emails and pages, derived from configuration in one place. */
@Injectable()
export class AppUrls {
  constructor(private readonly config: ConfigService) {}

  /** Public base URL of this API (API_URL), e.g. https://api.mecatronix.com. */
  get api(): string {
    return trim(this.config.get<string>('API_URL') || `http://localhost:${this.config.get<number>('PORT') ?? 5000}`);
  }

  get admin(): string {
    return trim(this.config.get<string>('ADMIN_URL') || this.config.get<string>('CLIENT_URL') || this.api);
  }

  get website(): string {
    return trim(this.config.get<string>('CLIENT_URL') || this.api);
  }

  get adminLogin(): string {
    return `${this.admin}/login`;
  }

  /** Base for password-reset links; the token is appended. Defaults to the admin app's /reset-password route. */
  resetPassword(token: string): string {
    return `${trim(this.config.get<string>('RESET_PASSWORD_URL') || `${this.admin}/reset-password`)}/${token}`;
  }

  /** Absolute URL of a route on this API, e.g. apiRoute('news/unsubscribe'). */
  apiRoute(path: string): string {
    return `${this.api}/mec-api/${path.replace(/^\/+/, '')}`;
  }
}
