---
name: cipherocto-platform
description: Build and maintain CipherOcto, a centralized internal platform for managing a portfolio of Android and Google Play applications, shared subscription infrastructure, remote configuration, business finances, team costs, analytics, and deployment. Use when implementing or modifying any CipherOcto platform module or shared service.
---

# CipherOcto Platform — Engineering Skill

## 1. Project mission

Build CipherOcto as the internal operating platform for a company that develops, publishes, monetizes, and maintains multiple mobile applications.

The platform must provide one central dashboard to manage:

- Application portfolio and release tracking.
- Remote configuration and feature flags.
- Shared subscription and entitlement infrastructure.
- Google Play integration and financial reporting.
- Advertising revenue and app analytics.
- Company expenses, developer salaries, and profitability.
- Development projects, tasks, bugs, and releases.
- Team permissions, audit trails, and operational settings.

CipherOcto is initially an internal company tool, not a public multi-tenant SaaS product. Design the architecture so it can become a multi-tenant service later without requiring a complete rewrite.

## 2. Core engineering principles

1. Build reusable infrastructure once and integrate every new app through documented interfaces.
2. Keep the management platform independent of individual apps' databases and technology stacks.
3. Use PostgreSQL for CipherOcto's central management database.
4. Support PostgreSQL, MongoDB, MySQL, SQLite, and standalone applications in the app portfolio.
5. Prefer a modular monolith over premature microservices.
6. Keep business logic out of React components and database-specific logic out of shared domain services.
7. Do not duplicate Google Play Billing integration in every application.
8. Treat revenue, profit, subscription status, and configuration as distinct data domains.
9. Use secure defaults, explicit permissions, automated tests, migrations, and audit logs.
10. Never implement a feature that silently bypasses Google Play policies or purchase verification.

## 3. Technology stack

### Central management platform

- Frontend: React, TypeScript, Vite.
- UI: Tailwind CSS and shadcn/ui.
- Backend: Node.js and TypeScript with Fastify.
- Database: PostgreSQL.
- ORM: Prisma.
- Validation: Zod, wired into Fastify via a type provider (for example `fastify-type-provider-zod`) so route schemas drive both validation and TypeScript types.
- API documentation: OpenAPI generated from route schemas with `@fastify/swagger` and `@fastify/swagger-ui`.
- Testing: Vitest and API integration tests using Fastify's `app.inject()`.

Fastify conventions:

- Structure each domain module (apps, config, billing, finance, team) as an encapsulated Fastify plugin registered with a route prefix.
- Share cross-cutting services (Prisma client, config, logger, auth) through decorators and plugins wrapped with `fastify-plugin` only when they must be visible to sibling plugins.
- Use hooks (`onRequest`, `preHandler`) for authentication and authorization, and keep route handlers thin; business logic lives in service classes/functions.
- Use official plugins where available: `@fastify/jwt` or session auth, `@fastify/cors`, `@fastify/helmet`, `@fastify/rate-limit`, `@fastify/sensible`, `@fastify/env`.
- Use a central error handler (`setErrorHandler`) to return a consistent error shape.
- Build the app in a `buildApp()` factory separate from `listen()` so tests can create instances without binding a port.
- Use Fastify's built-in Pino logger with request IDs and redact secrets, tokens, and salary data from logs.
- Deployment: Docker, Docker Compose, Nginx, and the existing VPS infrastructure.

Use compatible, currently maintained dependency versions. Check existing project dependencies before upgrading or replacing packages.

### Mobile subscription integration

- Native Android subscription SDK: Kotlin.
- Billing integration: official Google Play Billing Library.
- Shared subscription backend: Node.js and TypeScript.
- Purchase verification: Google Play Developer API.
- Lifecycle synchronization: Google Play Real-time Developer Notifications, with reconciliation and recovery jobs.

For apps built using React Native or another mobile framework, provide an adapter around the shared billing contract instead of assuming all apps use native Kotlin.

### App-specific databases

Each application may choose its own database and backend.

Examples:

- PostgreSQL + Prisma.
- MongoDB + Mongoose or the project's existing data-access layer.
- MySQL with the selected supported ORM.
- SQLite for local or offline storage.
- No custom backend for standalone utilities.

Never force an app to migrate databases merely to integrate with CipherOcto.

## 4. High-level architecture

The platform consists of the following modules.

### A. App Portfolio

Responsibilities:

- Register and manage apps.
- Store app name, package name, platform, environment, owner, status, and technology stack.
- Track development, testing, production, maintenance, and archived states.
- Record release versions and links to Google Play Console.
- Track app-specific hosting and operational costs.
- Display app performance and financial summaries.

Package names must be unique within the relevant platform and registry.

### B. Remote Configuration

Responsibilities:

- Manage app-specific settings.
- Publish immutable configuration versions.
- Maintain draft, published, and rolled-back states.
- Support feature flags, usage limits, maintenance mode, and UI configuration.
- Support gradual rollouts and environment-specific configuration.
- Provide a versioned API and client caching strategy.
- Track who changed and published each configuration.

Example configuration:

{
  "schemaVersion": 1,
  "appId": "qr-scanner",
  "freeScansPerDay": 10,
  "adsEnabled": true,
  "premiumEnabled": true
}

This example illustrates application configuration only; it does not replace Google Play product definitions or entitlement verification.

The mobile SDK must validate configuration, cache the last valid version, handle network failures, and fall back to safe defaults. Configuration must never execute arbitrary downloaded code.

### C. Subscription Management

Build a shared billing SDK and subscription backend.

The SDK should provide a stable interface for:

- Loading available products.
- Starting a purchase.
- Handling purchase results and pending transactions.
- Restoring or querying purchases where supported.
- Reporting purchase tokens securely to the backend.
- Observing entitlement status.
- Handling connectivity failures and billing errors.

The backend must handle:

- Purchase-token verification.
- Purchase acknowledgement where required.
- Subscription status and entitlement records.
- Renewals, cancellations, expirations, refunds, and revocations.
- Duplicate event handling and idempotency.
- Google Play RTDN processing.
- Periodic reconciliation against authoritative purchase data.
- Subscription audit history.

Do not grant paid access solely because a client reports a successful purchase.

Google Play subscription products and prices are configured in the appropriate Play Console application. CipherOcto may store product mappings and display configuration, but must not pretend that editing its own database creates or changes a Play Console product.

Each app has its own product configuration. Cross-app premium access requires an explicit account, ownership, and entitlement policy; it is not automatic.

### D. Financial Management

Track revenue and expenses at both company and app level.

Revenue categories:

- Google Play sales and proceeds.
- Subscription revenue.
- One-time purchases.
- Advertising revenue.
- Other income.

Expense categories:

- Developer salaries and contractor costs.
- Hosting, domains, and APIs.
- Advertising and customer acquisition.
- Software licenses.
- App-specific services.
- General company overhead.
- Accounting, taxes, refunds, and other applicable costs.

Store transaction dates, reporting periods, currency, source, reconciliation status, and supporting references where available.

Distinguish gross sales, refunds, taxes, platform fees, estimated proceeds, actual payouts, and operating expenses.

Calculate:

- Revenue per app and month.
- Expenses per app and month.
- Company operating profit.
- App-level contribution margin.
- Development investment and cumulative return.
- Break-even revenue.
- Cash received and outstanding settlements.

Do not assume all reports are real-time. Track source timestamps and data freshness.

Support shared-cost allocation rules so shared developer salaries and hosting expenses are not double-counted across apps.

### E. Analytics

Provide app-level and company-level views for available metrics:

- Installs and active users.
- Retention and engagement.
- Ratings and reviews.
- Crash and stability metrics.
- Subscription conversions.
- Active entitlements.
- Ad revenue.
- Release performance.

Use supported APIs, imported reports, or explicitly configured analytics integrations. Clearly label unavailable, estimated, delayed, and manually entered metrics.

Do not fabricate analytics when an integration has not been configured.

### F. Team and Development Operations

Responsibilities:

- Developer and contractor records.
- Roles, permissions, and assignments.
- Projects, tasks, bugs, and release milestones.
- Development hours and app cost allocation.
- Salary and contractor expense records.
- Deployment history and release readiness.
- Audit trails for sensitive operations.

Restrict salary information to authorized roles. Developers should not automatically have access to all company financial data.

## 5. Database design guidelines

Use a central PostgreSQL database for CipherOcto's own records.

Organize the schema around clear domains, including:

- `apps`
- `app_environments`
- `app_releases`
- `app_configurations`
- `app_config_versions`
- `feature_flags`
- `subscription_products`
- `purchase_records`
- `entitlements`
- `subscription_events`
- `revenue_records`
- `expense_records`
- `expense_allocations`
- `payout_records`
- `analytics_snapshots`
- `employees`
- `projects`
- `tasks`
- `users`
- `roles`
- `permissions`
- `audit_logs`
- `integration_connections`

These are proposed domain names, not a requirement to create every table immediately.

Model the relationships and uniqueness constraints carefully. Use decimal-safe representations for money, explicit currencies, timestamps, foreign keys, and indexes.

Store provider-specific identifiers separately from internal IDs. Never use a purchase token as a public identifier.

Use migrations for every schema change. Do not modify production schemas manually.

Keep app-specific business tables in their own databases. CipherOcto should store the metadata and financial or operational summaries needed to manage those apps, not copy every app's business data into the central database.

## 6. API design

Use versioned APIs, consistent error responses, validated request bodies, and authenticated access.

Representative endpoints:

- `GET /api/v1/apps`
- `POST /api/v1/apps`
- `GET /api/v1/apps/:appId`
- `GET /api/v1/apps/:appId/config`
- `POST /api/v1/apps/:appId/config/versions`
- `POST /api/v1/apps/:appId/config/publish`
- `GET /api/v1/apps/:appId/subscriptions/summary`
- `POST /api/v1/billing/verify`
- `POST /api/v1/webhooks/google-play`
- `GET /api/v1/finance/summary`
- `GET /api/v1/finance/apps/:appId`
- `POST /api/v1/expenses`
- `GET /api/v1/projects`

These routes are architectural examples. Follow the existing repository conventions and use consistent resource naming when implementing them.

Keep dashboard administration APIs separate from public mobile SDK APIs. Apply different authentication and authorization policies to each. In Fastify, register them as separate plugins/prefixes (for example `/api/v1/admin/*` and `/api/v1/sdk/*`) so each gets its own auth hooks, rate limits, and schemas.

Define a JSON/Zod schema for every route's params, query, body, and response. Response schemas also prevent accidental leakage of sensitive fields such as purchase tokens and salaries.

For the Google Play webhook, verify the authenticity of the Pub/Sub push (OIDC token) before processing, parse the payload with a schema, and acknowledge quickly while processing idempotently. If a provider requires signature verification over the raw body, capture it with a scoped content-type parser rather than disabling parsing globally.

## 7. Security requirements

- Use secure authentication and role-based access control.
- Enforce server-side authorization on every protected operation.
- Keep secrets, service-account credentials, and private API keys out of mobile apps and source control.
- Use HTTPS for all external communication.
- Verify Google Play purchases on the backend.
- Verify webhook authenticity and protect against replay and duplicate processing.
- Rate-limit public APIs with `@fastify/rate-limit`, using stricter limits on SDK and webhook routes.
- Set secure headers (`@fastify/helmet`), restrict CORS to known dashboard origins, and set sensible body-size limits.
- Validate configuration values against a defined schema.
- Record audit logs for configuration publishing, financial adjustments, and permission changes.
- Use least-privilege service accounts.
- Back up PostgreSQL and test restoration.
- Avoid storing unnecessary personal information.
- Never expose subscriber purchase tokens or sensitive employee information in general-purpose dashboard responses.

## 8. Frontend and UX standards

Build a consistent admin interface with:

- Overview dashboard.
- Sidebar navigation.
- Search and filters.
- Tables with pagination.
- Forms with validation and helpful error messages.
- Date-range and app filters for financial reports.
- Loading, empty, error, and permission-denied states.
- Confirmation dialogs for destructive or financial actions.
- Clear draft, published, and rollback states for remote configuration.
- Responsive layouts and accessible controls.

Use reusable components for tables, metrics, filters, charts, forms, dialogs, and status indicators.

Avoid creating a separate design system for every module.

## 9. Development workflow

For each feature:

1. Inspect the existing repository and understand its structure.
2. Identify the module, dependencies, and affected APIs.
3. Define data models, validation rules, and authorization requirements.
4. Implement migrations before relying on new schema fields.
5. Implement the backend as a Fastify plugin with route schemas, a service layer, and tests (`app.inject()`).
6. Implement the frontend and its loading/error states.
7. Update API documentation.
8. Test failure scenarios and permissions.
9. Check compatibility with existing apps and integrations.
10. Document deployment, environment variables, and rollback procedures.

Do not overwrite working modules or replace architecture without a clear reason.

Do not hardcode production credentials, product IDs, financial values, or app-specific rules into shared SDK code.

## 10. Implementation roadmap

### Phase 1: Foundation
- Repository structure.
- Authentication and roles.
- App registry.
- PostgreSQL schema.
- Central dashboard shell.
- Audit logging.

### Phase 2: Remote configuration
- Configuration schema.
- Draft and publish workflow.
- Versioning and rollback.
- Mobile configuration client.
- Cache and fallback behavior.

### Phase 3: Subscription infrastructure
- Android billing SDK.
- Backend purchase verification.
- Entitlements.
- RTDN handling.
- Subscription status dashboard.

### Phase 4: Business finance
- Revenue and expense management.
- Developer costs.
- App-level cost allocation.
- Monthly profit/loss.
- Financial reconciliation.

### Phase 5: Integrations and analytics
- Google Play reporting integrations.
- Ad network reporting.
- Usage analytics.
- Scheduled imports and data freshness indicators.

### Phase 6: Team and operational management
- Tasks and milestones.
- Developer access management.
- Release tracking.
- Operational reports.

Deliver each phase incrementally. Do not attempt to build every module before validating the foundation.

## 11. Definition of done

A feature is complete only when:

- It meets the documented requirement.
- It has appropriate validation and authorization.
- Its database changes are covered by migrations.
- Its important success and failure paths are tested.
- It handles missing or delayed external data safely.
- It does not break existing apps or integrations.
- Its UI includes loading, empty, and error states where applicable.
- Its documentation and deployment instructions are updated.

## Final directive

Treat CipherOcto as a long-lived internal platform, not a collection of unrelated admin pages.

Build a common management layer, common subscription infrastructure, and a common remote configuration service. Let every mobile application retain its own business logic, backend, database, and release lifecycle.

Prioritize reliability, security, financial accuracy, and reuse over unnecessary complexity. Every new app should become easier and cheaper to launch because the shared platform already exists.
