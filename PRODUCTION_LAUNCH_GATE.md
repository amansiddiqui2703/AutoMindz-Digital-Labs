# AutoMindz Production Launch Gate

This checklist is intentionally conservative. A successful frontend build alone does not mean the SaaS is production-ready.

## Current deployment assumptions

- Repository: `amansiddiqui2703/AutoMindz-Digital-Labs`
- Frontend: React + Vite in `client/`
- API: Node.js + Express in `server/`
- Data: MongoDB
- Queue/scheduling: Redis + Bull (unless the in-memory development mode is explicitly selected)
- Email infrastructure: Gmail OAuth for user mailboxes; Resend for system mail
- Payments: Razorpay
- Primary site previously configured in project context: `https://automindzdigitallabs.online`

## P0 — Must pass before accepting paying customers

### Secrets and access
- [ ] Revoke any GitHub personal access token that was pasted into a chat, issue, log, or source file; create a replacement with minimum permissions and an expiry.
- [ ] Verify no real `.env`, OAuth client secret, database URI, JWT secret, encryption key, Razorpay secret, Resend key, or Gmail refresh token exists in Git history or current files.
- [ ] Configure strong, unique production values for `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, and `ENCRYPTION_KEY`. Never use example/default values.
- [ ] Configure production `APP_URL` and `SERVER_URL` exactly; verify OAuth callback URLs match Google Cloud Console.
- [ ] Keep MongoDB, Redis, payment secrets, and provider keys server-side only. Never use `VITE_*` variables for secrets.
- [ ] Ensure admin access is restricted to explicitly controlled `ADMIN_EMAILS` accounts.

### Infrastructure
- [ ] Use managed MongoDB with authentication, TLS, backups, and a tested restore procedure.
- [ ] Use persistent/managed Redis for distributed rate limiting and background jobs; do not rely on in-memory queues for production.
- [ ] Deploy API and frontend with HTTPS and a health check; confirm the host supports the app's Node version and Puppeteer requirements.
- [ ] Confirm background schedulers do not run twice across multiple API replicas, or move scheduled work to a single worker.
- [ ] Set resource limits, log retention, error alerts, and uptime monitoring.
- [ ] Confirm DNS, TLS certificate, canonical host, and redirects for the production domain.

### Authentication and tenant isolation
- [ ] Verify every private API route requires authentication.
- [ ] Verify every database query that reads or changes user data is scoped to the authenticated user/tenant.
- [ ] Test registration, email verification, login, refresh, logout, password reset, and revoked/expired tokens.
- [ ] Check cookie/token storage, CORS allowlist, CSRF exposure where cookies are used, and account lockout/rate limits.
- [ ] Confirm OAuth state/nonce validation and redirect URI validation for every Google OAuth flow.

### Email and contact-finder safeguards
- [ ] Test Gmail connect/disconnect, expired/revoked OAuth grants, token refresh, mailbox rotation, and provider quota errors.
- [ ] Verify campaign scheduling, pause/resume, retry behavior, deduplication, and thread-aware follow-ups.
- [ ] Add hard per-user sending limits, provider rate limits, idempotency, and a global kill switch.
- [ ] Make unsubscribe/suppression enforcement mandatory before each send; never send to suppressed contacts.
- [ ] Validate public contact-finder URLs against SSRF: block localhost, private/reserved IP ranges, metadata endpoints, non-HTTP protocols, and redirect chains into private networks.
- [ ] Apply crawl timeouts, response-size limits, concurrency limits, and domain-level throttling.
- [ ] Verify open/click tracking respects consent and privacy disclosures; do not treat open pixels as perfectly accurate.

### Billing
- [ ] Verify Razorpay signatures using the exact raw request body and constant-time comparison.
- [ ] Make webhook processing idempotent; handle duplicate, delayed, and out-of-order events.
- [ ] Do not grant a paid plan based only on a client-side checkout success message.
- [ ] Test successful, failed, cancelled, refunded, and expired subscription paths in test mode before live mode.
- [ ] Confirm pricing, taxes/invoices, refund/cancellation terms, and support contact are published.

### Privacy and legal
- [ ] Publish accurate Terms, Privacy Policy, cookie/tracking disclosure, and contact/support details.
- [ ] Document data retention, deletion/export, third-party processors, and how Gmail access is used.
- [ ] Review Google OAuth consent-screen configuration and any verification requirements before external users connect Gmail.
- [ ] Do not advertise “GDPR compliant” or similar until the actual operational/legal requirements have been reviewed.

## P1 — Release verification

- [ ] Clean install from lockfiles: `npm ci` in `server/` and `npm ci --legacy-peer-deps` in `client/`.
- [ ] Run server tests: `npm test` in `server/`.
- [ ] Run frontend lint and production build: `npm run lint` and `npm run build` in `client/`.
- [ ] Run end-to-end smoke tests against a staging environment with non-production provider credentials.
- [ ] Test mobile/responsive layout, empty states, API failures, and accessibility basics.
- [ ] Verify robots/sitemap do not expose authenticated routes or private data.
- [ ] Confirm error responses never return stack traces, secrets, tokens, or raw provider errors.
- [ ] Verify backup restoration and document rollback to the previous deploy.

## Required staging smoke tests

1. Register a test user, verify email, sign in, and sign out.
2. Confirm user A cannot read or modify user B's contacts, campaigns, inbox, analytics, or billing.
3. Connect a dedicated test Gmail account; send only to an inbox owned by the tester.
4. Schedule, pause, resume, and cancel a small test campaign; confirm no duplicate sends.
5. Trigger unsubscribe and verify subsequent campaign attempts are blocked.
6. Submit valid and invalid payment webhooks, including the same valid event twice.
7. Restart the API and worker; verify scheduled jobs and persisted data survive.
8. Test database/Redis/provider outages and confirm graceful errors and alerting.

## Release decision

Do not mark the product “production ready” until the P0 checks are verified against the deployed environment. Some checks require access to hosting dashboards, Google Cloud, MongoDB, Redis, Resend, and Razorpay; they cannot be truthfully certified from source code alone.
