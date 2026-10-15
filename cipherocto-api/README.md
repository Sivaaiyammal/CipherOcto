# CipherOcto API

The management platform's backend: a **modular monolith** on Fastify + MongoDB,
structured as `SKILL.md` describes. This first slice is **authentication and
role-based access control**; every later module (apps, remote config, billing,
finance…) plugs into the same guards.

- Fastify 5, TypeScript run directly by Node 22.18+ (type stripping — no build step)
- Zod route schemas drive validation, response serialization and OpenAPI
- MongoDB via Mongoose; indexes and data fixes live in versioned migrations
- Vitest + `app.inject()` against an embedded MongoDB

## Run it

```bash
cd cipherocto-api
cp .env.example .env     # set MONGODB_URI and SEED_ADMIN_PASSWORD
npm install
npm run dev              # http://127.0.0.1:4000  ·  docs: /api/v1/docs
```

Need a database? Pick one:

| Option | How |
| --- | --- |
| MongoDB Atlas | put the `mongodb+srv://…` string in `.env` as `MONGODB_URI` |
| Docker | `docker compose up -d mongo` and use `mongodb://127.0.0.1:27017` (publish the port locally) |
| Nothing installed | `npm run dev:db` starts a persistent local mongod in `./data/mongo` |

Then run the web app (`cd ../cipherocto-web && npm run dev`); Vite proxies
`/api` to port 4000 so the session cookie stays first-party.

Sign in with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`, or, while
`DEMO_LOGIN=true`, choose a role on the login page.

```bash
npm test            # 31 tests, embedded MongoDB, never touches Atlas
npm run typecheck
```

## Layout

```
src/
  app.ts            buildApp() factory — no listen(), so tests use app.inject()
  server.ts         listen + graceful shutdown
  services.ts       composition root: repositories → services
  config.ts         @fastify/env schema + derived, validated Config
  plugins/          cross-cutting: database, security, auth hooks, errors, docs
  modules/
    access/         permission catalogue, roles
    auth/           login, sessions, throttling, password change
    users/          team members and role assignment
    audit/          append-only security log
  db/               models.ts, migrate.ts (+ migrations)
  shared/           errors, crypto, auth context
```

Each module is `*.routes.ts` (HTTP + Zod) → `*.service.ts` (rules) →
`*.repository.ts` (the only files that import Mongoose). Adding a domain means
adding a folder and one line in `app.ts`.

## API

Versioned under `/api/v1`. Dashboard administration (`/admin/*`) is separate from
the reserved mobile-SDK surface (`/sdk/*`), which will get its own auth and limits.

| Method | Path | Needs |
| --- | --- | --- |
| GET | `/api/v1/health` | — |
| GET | `/api/v1/auth/config` | — |
| POST | `/api/v1/auth/login` | — |
| POST | `/api/v1/auth/demo` | `DEMO_LOGIN=true` (never production) |
| GET | `/api/v1/auth/me` | signed in |
| POST | `/api/v1/auth/logout` | — |
| POST | `/api/v1/auth/change-password` | signed in |
| GET | `/api/v1/admin/roles` | `team:read` |
| GET | `/api/v1/admin/users` | `team:read` |
| POST | `/api/v1/admin/users` | `team:manage` |
| PATCH | `/api/v1/admin/users/:id` | `team:manage` |
| GET | `/api/v1/admin/audit` | `audit:read` |

Errors always look like `{ error, message, requestId, … }`.

## Security model

- **Sessions, not JWTs.** A random 256-bit token in an `HttpOnly; SameSite=Lax`
  cookie (`Secure` in production). Only its SHA-256 is stored, in a collection
  with a TTL index. Logout, suspension and role changes revoke server-side, so
  they apply immediately.
- **Passwords:** scrypt (`N=2^15`), parameters stored with each hash.
- **Brute force:** failed logins are counted per email and per IP in MongoDB
  (survives restarts, shared across instances). Unknown emails are counted too,
  so a lockout never reveals which accounts exist; unknown email and wrong
  password return the same `401` in the same time.
- **CSRF:** `SameSite=Lax` plus an `Origin` allow-list on writes.
- **Authorization runs first.** Guards run in `onRequest`, before body parsing,
  so anonymous callers always get `401`. `403` lists the missing permissions.
- **Guard rails:** you can't change your own role/status; the last active admin
  can't be demoted or suspended; nobody can grant a role with more access than
  they hold.
- **Audit log:** logins (success/failure/blocked), logouts, password changes and
  user/role changes, with an actor snapshot.
- **Logs** redact cookies, passwords, tokens and salary fields. The MongoDB URI is
  never logged or echoed in errors.
- Response schemas strip anything not declared, so fields like `passwordHash`
  cannot leak by accident.

## RBAC

`src/modules/access/permissions.ts` is the single source of truth: a catalogue of
`area:action` permissions and six built-in roles (`admin`, `release`, `dev`,
`product`, `finance`, `analyst`), synced into the `roles` collection on boot.
Routes declare what they need:

```ts
r.get("/users", { onRequest: requirePermission("team:read"), schema }, handler)
```

The web app reads the list from `GET /auth/me` to hide navigation and disable
controls; that is UX only — the server enforces every rule.

## Before you deploy

- `NODE_ENV=production`: the server refuses to start with `DEMO_LOGIN` on, and
  docs are off unless `API_DOCS=true`.
- HTTPS, and `TRUST_PROXY=true` behind a proxy (so rate limits see real IPs).
- Keep the cookie first-party: proxy `/api/*` from the dashboard's domain
  (Netlify `[[redirects]]` with `status = 200`) or host the API on a sibling
  subdomain. A different registrable domain won't receive the `Lax` cookie.
- Use a **dedicated database per environment** and a least-privilege Atlas user.
  Rotate any credential that has been pasted into chat or a ticket.
- Back up MongoDB and test a restore.
- `docker-compose.yml` runs MongoDB + the API; put Nginx in front for TLS.

## Known limits (deliberate, for now)

- The "last admin" check is count-then-write, so two simultaneous demotions of
  different admins could both pass. Fine for a small team; revisit with a
  transaction (replica set) if admin changes become concurrent.
- Per-IP request limiting (`@fastify/rate-limit`) is in memory per instance.
- No refresh/idle timeout yet: sessions expire at a fixed time.
