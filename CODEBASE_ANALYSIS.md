# 🔒 AutoMindz Comprehensive Security & Production Audit Report

**Date:** May 16, 2026  
**Codebase:** AutoMindz Email Outreach System  
**Analysis Depth:** Full architecture, security, configuration, and deployment audit

---

## 🔴 CRITICAL FINDINGS (Immediate Action Required)

### C1. Razorpay Webhook — Timing Attack Vulnerability & Missing Raw Body Verification
**File:** `server/src/services/razorpayWebhook.js`  
**Severity:** 🔴 CRITICAL  

**Issue:**
```javascript
// Line 16-18 — Simple string comparison, NOT timing-safe
const expectedSignature = crypto.createHmac('sha256', webhookSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');
if (expectedSignature !== signature) {  // ← VULNERABLE
```
1. **`!==` string comparison** allows timing attacks — must use `crypto.timingSafeEqual()`
2. **Razorpay requires raw body verification**, but `express.json()` is applied globally which re-encodes the body, breaking signature validation. The endpoint uses `express.json()` on line 71 of `index.js` instead of `express.raw()`.

**Fix Required:**
```javascript
// Use timingSafeEqual AND raw body parsing
app.post('/api/v1/billing/webhook', express.raw({ type: 'application/json' }), handleRazorpayWebhook);

// In razorpayWebhook.js:
const verifyRazorpaySignature = (rawBody, signature) => {
    const expected = crypto.createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');
    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
};
```

### C2. crypto-js AES Encryption — Weak Implementation
**File:** `server/src/utils/crypto.js`  
**Severity:** 🔴 CRITICAL  

**Issue:** Uses `crypto-js` with a passphrase-based AES encryption (CryptoJS.AES.encrypt(text, key)) instead of proper key derivation (PBKDF2, scrypt) with a random IV per encryption. This means:
- Same plaintext → same ciphertext (deterministic, no IV)
- Passphrase is used directly, not a derived key
- No authentication tag (no GCM mode)

**Fix Required:** Use Node.js native `crypto.createCipheriv()` with:
- AES-256-GCM (authenticated encryption)
- Random 16-byte IV per encryption
- PBKDF2 key derivation from the ENCRYPTION_KEY

### C3. JWT_SECRET Used as HMAC Key for OAuth State
**File:** `server/src/utils/crypto.js` (line 27)
**Severity:** 🔴 CRITICAL  

```javascript
const hmacKey = env.JWT_SECRET || 'dev-secret-change-me';
```
Using the same secret for JWT signing AND OAuth state HMAC creates a cross-protocol vulnerability. If one is compromised, both are.

**Fix:** Use a dedicated `OAUTH_STATE_SECRET` environment variable.

### C4. Auth Routes Not Behind authLimiter
**File:** `server/src/index.js` (line 189)
**Severity:** 🔴 CRITICAL  

```javascript
app.use('/api/v1/auth', authRoutes);  // No authLimiter applied here!
```
The `authLimiter` is defined but never applied to auth routes. Only the general `apiLimiter` (200 req/15min) covers `/api/v1/auth/*`. Login/register endpoints need strict 20 req/15min limits.

**Fix:**
```javascript
app.use('/api/v1/auth', authLimiter, authRoutes);
```

---

## 🟠 HIGH SEVERITY FINDINGS

### H1. Default JWT Secret in Development
**File:** `server/src/config/env.js` (line 20)
**Severity:** 🟠 HIGH  

```javascript
JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
```
Only validated in production. Development environments using the default are susceptible to token forgery if exposed.

**Fix:** Add validation in development mode too, or generate a random fallback.

### H2. Resend Webhook Bypass When Secret Missing
**File:** `server/src/services/webhookHandler.js` (lines 14-18)
**Severity:** 🟠 HIGH  

```javascript
if (!secret) {
    logger.warn('RESEND_WEBHOOK_SECRET not set — skipping signature verification');
    return true;  // ← Bypasses all verification in dev/test
}
```
In staging/testing environments pointing at real Resend webhooks, this is exploitable.

**Fix:** In non-development environments, reject unverified webhooks.

### H3. Sentry TracesSampleRate at 1.0 in Production
**File:** `server/src/index.js` (lines 66-67)
**Severity:** 🟠 HIGH  

```javascript
tracesSampleRate: 1.0,   // ← Captures 100% of traces
profilesSampleRate: 1.0,  // ← Captures 100% of profiles
```
This will generate massive Sentry usage costs and performance overhead at scale.

**Fix:** 
```javascript
tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
```

### H4. No Rate Limiting on File Uploads
**File:** `server/src/index.js` (line 186)
**Severity:** 🟠 HIGH  

```javascript
app.use('/uploads', express.static(resolve(__dirname, '../uploads')));
```
Static file serving with no size limits, no auth, and no rate limiting. `multer` in package.json suggests file uploads exist somewhere.

**Fix:** Apply size limits on upload middleware, rate-limit upload endpoints, and validate file types.

### H5. Config Mismatch — Stripe vs Razorpay
**File:** `server/src/config/index.js` (lines 28-36)
**Severity:** 🟠 HIGH  

```javascript
stripe: {
    secretKey: env.STRIPE_SECRET_KEY,        // ← These env vars don't exist in env.js
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    prices: { ... }
},
```
The config object references Stripe, but `env.js` only has Razorpay configuration. These env vars will silently be `undefined`.

**Fix:** Remove Stripe config or add proper env var support.

---

## 🟡 MEDIUM SEVERITY FINDINGS

### M1. Auth Middleware — No Blacklisted Token Check
**File:** `server/src/middleware/auth.js`
**Severity:** 🟡 MEDIUM  

No token blacklisting/invalidation mechanism. When a user changes their password or logs out, existing JWTs remain valid until expiry.

**Fix:** Implement a Redis-based token blacklist or use a token version in the User model.

### M2. ENCRYPTION_KEY Not Validated at Startup in Development
**File:** `server/src/config/env.js`
**Severity:** 🟡 MEDIUM  

`ENCRYPTION_KEY` is in `REQUIRED_ENV_VARS` but the module-level code in `crypto.js` will throw an error anyway. However, startup validation could provide a clearer error message.

### M3. No Account Lockout on Failed Login Attempts
**File:** `server/src/models/User.js`
**Severity:** 🟡 MEDIUM  

No mechanism to lock accounts after N failed login attempts. Only the 20 req/15min rate limit protects auth endpoints.

**Fix:** Add failed login tracking to User model and reject login after N failures within a time window.

### M4. Console Transport Disabled in Production
**File:** `server/src/utils/logger.js` (lines 33-43)
**Severity:** 🟡 MEDIUM  

```javascript
if (!isProduction) {
    logger.add(new winston.transports.Console({ ... }));
}
```
In production, logs only go to files. In Docker/Kubernetes, stdout/stderr is the standard logging mechanism — file logs create persistence issues and require volume mounts.

**Fix:** Always add console transport in containerized environments or use `NODE_ENV !== 'test'`.

### M5. CI/CD — Docker Push Disabled
**File:** `.github/workflows/ci-cd.yml` (line 51)
**Severity:** 🟡 MEDIUM  

```yaml
push: false  # ← Images are built but never pushed to a registry
```
Docker images are built but go nowhere. No deployment step exists.

**Fix:** Add registry authentication and push to Docker Hub/GitHub Container Registry.

### M6. xss-clean Package is Deprecated
**File:** `server/package.json` (line 42)
**Severity:** 🟡 MEDIUM  

The `xss-clean` package is deprecated and unmaintained. It only provides basic XSS filtering.

**Fix:** Replace with a DOMPurify-based alternative or use `helmet`'s CSP directives as the primary XSS defense.

### M7. Auth Route Legacy Aliases Expose Unauthenticated Endpoints
**File:** `server/src/index.js` (lines 220-221)
**Severity:** 🟡 MEDIUM  

```javascript
app.use('/api/auth', authRoutes);      // Legacy alias
app.use('/api/accounts', accountRoutes);
```
These aliases bypass any middleware applied to `/api/v1/auth` — including any future `authLimiter`.

**Fix:** Remove legacy aliases after Google Cloud Console redirect URIs are updated.

---

## 🟢 LOW SEVERITY FINDINGS

### L1. No HEALTHCHECK in Dockerfile
**File:** `server/Dockerfile`
**Severity:** 🟢 LOW  

Missing Docker `HEALTHCHECK` instruction means orchestrators (K8s, Docker Swarm) cannot monitor application health.

**Fix:** `HEALTHCHECK --interval=30s --timeout=3s CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1`

### L2. GitHub Actions on v3 Actions — Version Pinning
**Files:** `.github/workflows/ci-cd.yml`
**Severity:** 🟢 LOW  

Uses `actions/checkout@v3`, `actions/setup-node@v3`, `docker/setup-buildx-action@v2`. These are outdated.

**Fix:** Update to `@v4` for checkout/setup-node, `@v3` for buildx.

### L3. Redis TLS — RejectUnauthorized Disabled
**File:** `server/src/config/redis.js` (line 45)
**Severity:** 🟢 LOW  

```javascript
redisOpts.tls = { rejectUnauthorized: false };
```
Disabling TLS certificate validation makes Man-in-the-Middle attacks possible.

**Fix:** Use proper CA certificates or set `rejectUnauthorized: true` with NODE_EXTRA_CA_CERTS.

### L4. Morgan Token Registration After First Use
**File:** `server/src/index.js` (lines 119-125)
**Severity:** 🟢 LOW  

```javascript
app.use(morgan(':method :url :status ... [req-id: :req-id]', { ... }));
morgan.token('req-id', (req) => req.id);  // ← Token registered AFTER use
```
The `req-id` token is used in the format string before it's registered. Morgan handles this gracefully but it's an ordering anti-pattern.

**Fix:** Move `morgan.token()` before `app.use(morgan(...))`.

### L5. Mongoose Connection Event Handlers Registered After Connection
**File:** `server/src/config/db.js` (lines 19-24)
**Severity:** 🟢 LOW  

Runtime error/disconnect handlers registered after `mongoose.connect()` — they won't catch initial connection failures (handled by try/catch), but are correct for subsequent events.

**Fix:** Not critical, but could be reordered for clarity.

---

## 📊 Architecture & Code Quality Assessment

### Strengths ✅
1. **Comprehensive security hardening** — helmet with CSP, HSTS, permissions policy, mongo-sanitize, HPP, XSS protection
2. **Granular rate limiting** — Different limiters for auth, inbox sync, AI, campaigns, and general API
3. **Proper JWT sliding renewal** — 72-hour refresh window for active users
4. **Secure OAuth state** — HMAC-signed state with timing-safe verification
5. **Graceful shutdown** — SIGTERM/SIGINT handlers for Docker/K8s
6. **RBAC middleware** — Proper role-based access control on admin routes
7. **Plan enforcement** — Plan expiry checks, admin override, non-bypass on DB errors
8. **Webhook signature verification** — HMAC with timingSafeEqual (except Razorpay)
9. **User model security** — bcrypt (12 rounds), sensitive field exclusion from JSON
10. **Sentry integration** — Error tracking and profiling

### Weaknesses ⚠️
1. **Razorpay webhook** — Most critical vulnerability (timing attack + wrong body parser)
2. **Crypto implementation** — crypto-js without proper IV, GCM, or key derivation
3. **Cross-protocol key reuse** — JWT_SECRET used for OAuth state HMAC
4. **No token invalidation** — Can't revoke JWTs server-side
5. **Deprecated packages** — xss-clean is unmaintained
6. **CI/CD incomplete** — Docker images built but not pushed/deployed
7. **Config drift** — Stripe references present but only Razorpay implemented

---

## 🛠️ Recommended Fix Priority

### Sprint 1 (Security-Critical)
- [ ] **C1**: Fix Razorpay webhook — timingSafeEqual + raw body parsing
- [ ] **C2**: Replace crypto-js with Node.js native AES-256-GCM with IV + PBKDF2
- [ ] **C3**: Add dedicated `OAUTH_STATE_SECRET` env var
- [ ] **C4**: Apply `authLimiter` to auth routes

### Sprint 2 (Production Hardening)
- [ ] **H1**: Validate JWT_SECRET in all environments
- [ ] **H3**: Reduce Sentry sampling rates in production
- [ ] **H5**: Clean up Stripe/Razorpay config mismatch
- [ ] **H2**: Enforce webhook verification in non-development
- [ ] **M1**: Implement token blacklisting/versioning
- [ ] **M3**: Add account lockout mechanism
- [ ] **M5**: Complete CI/CD with Docker push + deployment

### Sprint 3 (Operational Excellence)
- [ ] **H4**: Add upload limits and rate limiting
- [ ] **M4**: Enable console logging in production containers
- [ ] **M6**: Replace deprecated xss-clean
- [ ] **L1**: Add HEALTHCHECK to Dockerfile
- [ ] **L2**: Update GitHub Actions versions
- [ ] **L3**: Fix Redis TLS configuration
- [ ] **M7**: Remove legacy route aliases after redirect URI update
- [ ] **L4**: Fix Morgan token ordering

---

## 📋 Files Audited (17/17)

| # | File | Status |
|---|------|--------|
| 1 | `server/src/config/env.js` | ✅ |
| 2 | `server/src/config/index.js` | ✅ |
| 3 | `server/src/config/db.js` | ✅ |
| 4 | `server/src/config/redis.js` | ✅ |
| 5 | `server/src/index.js` | ✅ |
| 6 | `server/src/middleware/auth.js` | ✅ |
| 7 | `server/src/middleware/rbac.js` | ✅ |
| 8 | `server/src/middleware/rateLimit.js` | ✅ |
| 9 | `server/src/middleware/errorHandler.js` | ✅ |
| 10 | `server/src/middleware/planLimits.js` | ✅ |
| 11 | `server/src/models/User.js` | ✅ |
| 12 | `server/src/utils/crypto.js` | ✅ |
| 13 | `server/src/utils/validators.js` | ✅ |
| 14 | `server/src/utils/logger.js` | ✅ |
| 15 | `server/src/services/webhookHandler.js` | ✅ |
| 16 | `server/src/services/razorpayWebhook.js` | ✅ |
| 17 | `server/src/services/gmailOAuth.js` | ✅ |
| 18 | `server/src/routes/admin.js` | ✅ |
| 19 | `server/package.json` | ✅ |
| 20 | `.env.example` | ✅ |
| 21 | `server/Dockerfile` | ✅ |
| 22 | `.github/workflows/ci-cd.yml` | ✅ |
| 23 | `client/vite.config.js` | ✅ |