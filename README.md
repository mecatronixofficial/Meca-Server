# Mecatronix Server

The API behind the Mecatronix website and admin panel. It's a NestJS 11 + TypeScript app using PostgreSQL (TypeORM), Cloudflare R2 for file storage, and Resend for email.

- All routes live under `/mec-api`, with the same paths the old Express server used, so existing clients keep working.
- Responses use the envelope `{ success, message, data }`; errors use `{ success: false, message, errors? }`.

## Quick start

```bash
cp .env.example .env        # then fill in every value
bun install                 # or npm install
npm run db:setup            # create the database, run migrations, create the superadmin
npm run start:dev           # http://localhost:5000
```

| URL | What it is |
| --- | --- |
| `/` | API home page in a browser; JSON health report for other clients |
| `/health` | JSON health report (database, email, version) |
| `/mec-api/docs` | Swagger API docs. Call **auth/login** there first to try protected routes |
| `/mec-api/mail/preview` | Every email template with sample data (development only) |

## Configuration

Every setting is listed with comments in [.env.example](.env.example). The main groups:

- **PostgreSQL:** set `DATABASE_URL` and `DB_SSL`. For a managed database that uses its own certificate authority (e.g. Aiven), point `DB_SSL_CA` at the provider's `ca.pem` to get verified TLS. Any `sslmode` in the URL is ignored in favour of these settings.
- **Cloudflare R2:** set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` and `R2_BUCKET`. `R2_PUBLIC_URL` is the bucket's public domain (an `r2.dev` URL or a custom domain).
- **Resend:** set `RESEND_API_KEY` and `MAIL_FROM` (an address on a domain verified in Resend). `ADMIN_EMAIL` receives contact-form enquiries. While the key is empty, email is switched off with a warning and nothing else breaks.
- **URLs:** `API_URL` is this server's public address (used in unsubscribe links). `CLIENT_URL` and `ADMIN_URL` are the website and the admin app. `RESET_PASSWORD_URL` is optional (see [Pages and emails](#pages-and-emails)).

## Superadmin

`npm run seed:superadmin` reads the `SUPERADMIN_*` values from `.env`. It is safe to run any number of times:

| State of `SUPERADMIN_EMAIL` | Result |
| --- | --- |
| No account | Creates a superadmin |
| Regular admin | Promotes it to superadmin (password unchanged) |
| Already a superadmin | Nothing changes |
| Any, with `SUPERADMIN_RESET_PASSWORD=true` | Also resets the password |

| Action | admin | superadmin |
| --- | --- | --- |
| Manage content, uploads, dashboard | ✓ | ✓ |
| View or edit **own** profile | ✓ | ✓ |
| Create, list or delete admins; change roles | — | ✓ |

Two safety rules apply: the last superadmin can't be deleted or demoted, and nobody can delete their own account. Accounts are re-checked on every request, so a deletion or role change takes effect immediately.

## Lists: pagination, search, filters

List endpoints accept `?page=&limit=&search=`. Without `page` or `limit` they return a plain array, as before, so existing clients are unaffected. With either one they return a page:

```json
{ "items": [ ... ], "meta": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 } }
```

`limit` is capped at 100. Some lists also accept extra filters: `review/all?verified=true`, `enquiry/getall?opened=false` and `invoice/all?status=sent`. For `news/get`, paging applies to the `subscribers` list, while `total` and `dailyStats` always cover every subscriber.

## Pages and emails

- **Templates:** emails live in [views/emails](views/emails) and share a layout from `views/emails/partials` (header, footer, button, details table, notice). Server pages live in [views/pages](views/pages). Both use EJS, and the shared brand values are injected automatically.
- **Newsletter unsubscribe:** newsletter and voucher emails carry a signed unsubscribe link (`/mec-api/news/unsubscribe`) and RFC 8058 one-click `List-Unsubscribe` headers, which Gmail and Yahoo require for bulk mail. Links can't be forged for someone else's address.
- **Password reset:** the emailed link goes to `${ADMIN_URL}/reset-password/<token>` by default. If the admin app has no reset screen, set `RESET_PASSWORD_URL=${API_URL}/mec-api/auth/reset-password` to use the built-in page.
- **Security alerts:** admins get an email when their password changes.

## File uploads (R2)

- **Endpoint:** `POST /mec-api/img/upload` (multipart, field `images`).
- **Folder:** an optional `folder` field (`blogs`, `projects`, `banners`, …) stores files under `<folder>/<yyyy>/<mm>/`.
- **Type check:** each file's real type is read from its contents (JPEG, PNG, WebP, GIF or PDF), so a renamed executable is rejected.
- **Limits:** `MAX_FILE_SIZE_BYTES` and `MAX_UPLOAD_FILES`.
- **Cleanup:** deleting a blog also deletes its images from R2.

## Project layout

```text
src/
  main.ts, app.setup.ts       bootstrap; middleware, views and Swagger (shared with the e2e tests)
  app.module.ts               modules, global guards, filter and interceptor
  common/                     response envelope, pagination, guards, decorators, URLs, transforms
  config/environment.ts       env validation and defaults
  database/                   entity registry, data source, migrations, seeds, db:create
  mail/  storage/             Resend email and R2 uploads
  auth/  admins/              login, password flows, reset page; admin management
  blogs/ clients/ reviews/ projects/ works/ banners/
  enquiries/ newsletters/ vouchers/ invoices/ dashboard/ health/
views/emails, views/pages     EJS templates
test/                         end-to-end tests (Supertest)
```

Each domain module has its own `entities/`, `dto/` (validated with class-validator and documented in Swagger), service and controller. Every route requires a login (the `admin_token` cookie or a `Bearer` header) unless it is marked `@Public()`. Add `@Roles(AdminRole.SUPERADMIN)` to restrict a route to superadmins.

## Scripts

| Script | Purpose |
| --- | --- |
| `start:dev`, `start`, `build` | Watch mode, run the build, compile to `dist/` |
| `check` | `typecheck` + `lint` + unit tests |
| `test`, `test:cov`, `test:e2e` | Unit tests, coverage, end-to-end tests (needs `TEST_DATABASE_URL`) |
| `lint`, `lint:fix`, `format`, `format:check` | ESLint and Prettier |
| `db:create`, `db:setup` | Create the database if missing; full first-time setup |
| `migration:run`, `migration:revert`, `migration:generate` | Schema migrations (ts-node) |
| `migration:run:prod`, `seed:superadmin:prod` | The same, run from `dist/` |

**Schema changes:** edit the entities, run `npm run migration:generate`, review the generated file, then run `migration:run`. Entities and migrations currently match exactly, so a fresh `migration:generate` reports "No changes".

## Deployment

1. `npm ci` (or `bun install --frozen-lockfile`), then `npm run build`.
2. `npm run migration:run:prod`, then `npm run seed:superadmin:prod`.
3. `npm start`, with `NODE_ENV=production` and `DB_SYNCHRONIZE=false`.

Production checklist:

- **Secrets:** a 32+ character `JWT_SECRET`.
- **URLs:** `API_URL` set to the public address.
- **Storage:** an R2 public domain.
- **Email:** a verified Resend sending domain.
- **Docs:** Swagger stays off in production unless `SWAGGER_ENABLED=true`.
