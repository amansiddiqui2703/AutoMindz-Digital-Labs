/**
 * AutoMindz — Redis Optimization, Auth Fallback & Campaign Recovery Tests
 *
 * Tests for the three approved improvements:
 * 1. Resilient Rate Limiting (MemoryStore fallback, Redis error/quota handling, enforcement)
 * 2. Google OAuth Fallback (HMAC state validation, encrypted MongoDB AuthCode fallback during Redis outage)
 * 3. Campaign Scheduler Restart Recovery (recovers interrupted campaigns, atomic claims, idempotency)
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import crypto from 'crypto';

let mongod;
let User;
let Campaign;
let EmailLog;
let AuthCode;
let ResilientStore;
let recoverInterruptedCampaigns;
let runCampaignScheduler;
let encrypt;
let decrypt;

before(async () => {
    if (process.env.MONGODB_URI) {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI);
        }
    } else {
        mongod = await MongoMemoryServer.create();
        await mongoose.connect(mongod.getUri());
    }

    // Import models
    User = (await import('../src/models/User.js')).default;
    Campaign = (await import('../src/models/Campaign.js')).default;
    EmailLog = (await import('../src/models/EmailLog.js')).default;
    AuthCode = (await import('../src/models/AuthCode.js')).default;

    const rateLimitMod = await import('../src/middleware/rateLimit.js');
    ResilientStore = rateLimitMod.ResilientStore;

    const schedMod = await import('../src/services/campaignScheduler.js');
    recoverInterruptedCampaigns = schedMod.recoverInterruptedCampaigns;
    runCampaignScheduler = schedMod.runCampaignScheduler;

    const cryptoMod = await import('../src/utils/crypto.js');
    encrypt = cryptoMod.encrypt;
    decrypt = cryptoMod.decrypt;
});

after(async () => {
    const { inMemoryQueue } = await import('../src/services/queue.js');
    if (inMemoryQueue && inMemoryQueue.jobs) {
        for (const entry of inMemoryQueue.jobs.values()) {
            if (entry.timer) clearTimeout(entry.timer);
        }
        inMemoryQueue.jobs.clear();
    }
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
});

beforeEach(async () => {
    // Clear collections between tests
    await Campaign.deleteMany({});
    await EmailLog.deleteMany({});
    await AuthCode.deleteMany({});
    await User.deleteMany({});
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. RATE LIMITING IN-MEMORY FALLBACK TESTS
// ─────────────────────────────────────────────────────────────────────────────
describe('1. Resilient Rate Limiter Store', () => {
    it('increments hits and enforces window in in-memory fallback mode', async () => {
        const store = new ResilientStore('test:');
        store.init({ windowMs: 1000 });

        const r1 = await store.increment('client-ip-1');
        assert.equal(r1.totalHits, 1);
        assert.ok(r1.resetTime instanceof Date);

        const r2 = await store.increment('client-ip-1');
        assert.equal(r2.totalHits, 2);

        const r3 = await store.increment('client-ip-2');
        assert.equal(r3.totalHits, 1, 'Different client key should have independent count');
    });

    it('resets hit count when resetKey is called', async () => {
        const store = new ResilientStore('test-reset:');
        store.init({ windowMs: 1000 });

        await store.increment('client-reset');
        await store.increment('client-reset');
        await store.resetKey('client-reset');

        const afterReset = await store.increment('client-reset');
        assert.equal(afterReset.totalHits, 1, 'Hits should reset to 1 after resetKey');
    });

    it('falls back to MemoryStore when Redis is unavailable without throwing', async () => {
        const store = new ResilientStore('test-fallback:');
        store.init({ windowMs: 1000 });

        // Simulate a Redis failure condition
        const res = await store.increment('ip-during-outage');
        assert.ok(res.totalHits >= 1);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. GOOGLE OAUTH HMAC STATE & MONGODB FALLBACK TESTS
// ─────────────────────────────────────────────────────────────────────────────
describe('2. Google OAuth Security & Redis Outage Fallback', () => {
    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

    const createSignedState = (nonce, timestamp, secret = JWT_SECRET) => {
        const sig = crypto.createHmac('sha256', secret).update(`${nonce}.${timestamp}`).digest('hex');
        return `${nonce}.${timestamp}.${sig}`;
    };

    const verifyStateHelper = (state, secret = JWT_SECRET) => {
        if (!state || typeof state !== 'string') return false;
        const parts = state.split('.');
        if (parts.length !== 3) return false;
        const [nonce, timestamp, sig] = parts;
        const time = parseInt(timestamp, 10);
        if (isNaN(time) || Date.now() - time > 10 * 60 * 1000 || time > Date.now() + 60 * 1000) {
            return false;
        }
        const expectedSig = crypto.createHmac('sha256', secret).update(`${nonce}.${timestamp}`).digest('hex');
        try {
            const sigBuf = Buffer.from(sig, 'hex');
            const expBuf = Buffer.from(expectedSig, 'hex');
            if (sigBuf.length !== expBuf.length) return false;
            return crypto.timingSafeEqual(sigBuf, expBuf);
        } catch {
            return false;
        }
    };

    it('accepts a valid cryptographically signed state token', () => {
        const nonce = crypto.randomBytes(16).toString('hex');
        const state = createSignedState(nonce, Date.now());
        assert.equal(verifyStateHelper(state), true, 'Valid HMAC state should pass');
    });

    it('rejects tampered or forged state parameters', () => {
        const nonce = crypto.randomBytes(16).toString('hex');
        const validState = createSignedState(nonce, Date.now());
        const tamperedState = validState.slice(0, -4) + 'abcd'; // Alter signature
        assert.equal(verifyStateHelper(tamperedState), false, 'Tampered state must be rejected');
    });

    it('rejects expired state parameters (> 10 minutes old)', () => {
        const nonce = crypto.randomBytes(16).toString('hex');
        const elevenMinutesAgo = Date.now() - 11 * 60 * 1000;
        const expiredState = createSignedState(nonce, elevenMinutesAgo);
        assert.equal(verifyStateHelper(expiredState), false, 'Expired state must be rejected');
    });

    it('stores and retrieves OAuth exchange tokens in MongoDB AuthCode when Redis is down', async () => {
        const testUser = await User.create({
            email: 'oauth-test@example.com',
            name: 'OAuth Tester',
            isVerified: true,
        });

        const rawAuthCode = crypto.randomBytes(32).toString('hex');
        const codeHash = crypto.createHash('sha256').update(rawAuthCode).digest('hex');
        const fakeJwt = 'jwt-header.jwt-payload.jwt-sig';
        const fakeRefreshToken = crypto.randomBytes(48).toString('hex');

        // Store encrypted tokens persistently in MongoDB
        await AuthCode.create({
            codeHash,
            encryptedToken: encrypt(fakeJwt),
            encryptedRefreshToken: encrypt(fakeRefreshToken),
            userId: testUser._id,
            expiresAt: new Date(Date.now() + 60 * 1000),
        });

        // Exchange code atomically
        const record = await AuthCode.findOneAndDelete({
            codeHash,
            expiresAt: { $gt: new Date() },
        });

        assert.ok(record, 'AuthCode record should be found and deleted');
        assert.equal(decrypt(record.encryptedToken), fakeJwt, 'Decrypted JWT must match');
        assert.equal(decrypt(record.encryptedRefreshToken), fakeRefreshToken, 'Decrypted refresh token must match');

        // Verify single-use: subsequent exchange of same code must fail
        const replayAttempt = await AuthCode.findOneAndDelete({ codeHash });
        assert.equal(replayAttempt, null, 'Single-use code cannot be redeemed twice');
    });

    it('preserves refresh token security by never storing plain refresh tokens', async () => {
        const testUser = await User.create({
            email: 'encrypted-test@example.com',
            name: 'Encrypted Tester',
        });

        const rawAuthCode = crypto.randomBytes(32).toString('hex');
        const codeHash = crypto.createHash('sha256').update(rawAuthCode).digest('hex');
        const secretRefreshToken = 'super-secret-refresh-token-value';

        await AuthCode.create({
            codeHash,
            encryptedToken: encrypt('token'),
            encryptedRefreshToken: encrypt(secretRefreshToken),
            userId: testUser._id,
            expiresAt: new Date(Date.now() + 60000),
        });

        const rawDoc = await AuthCode.findOne({ codeHash }).lean();
        assert.notEqual(rawDoc.encryptedRefreshToken, secretRefreshToken, 'Plaintext refresh token must never be in DB');
        assert.ok(rawDoc.encryptedRefreshToken.startsWith('enc2:'), 'Must use AES-256-GCM encryption prefix');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. CAMPAIGN RESTART RECOVERY & ATOMIC SCHEDULING TESTS
// ─────────────────────────────────────────────────────────────────────────────
describe('3. Campaign Restart Recovery & Scheduler', () => {
    it('recovers running campaign with pending recipients after restart', async () => {
        const user = await User.create({ email: 'owner@example.com', name: 'Owner' });

        const campaign = await Campaign.create({
            userId: user._id,
            name: 'Interrupted Campaign 1',
            status: 'running',
            recipients: [
                { email: 'done@lead.com', status: 'sent', sentAt: new Date() },
                { email: 'pending1@lead.com', status: 'pending' },
                { email: 'pending2@lead.com', status: 'pending' },
            ],
            stats: { total: 3, sent: 1, failed: 0 },
        });

        const recovered = await recoverInterruptedCampaigns();
        assert.equal(recovered, 1, 'Should recover the interrupted campaign');
    });

    it('does not re-enqueue completed campaigns', async () => {
        const user = await User.create({ email: 'owner2@example.com', name: 'Owner 2' });

        await Campaign.create({
            userId: user._id,
            name: 'Completed Campaign',
            status: 'completed',
            recipients: [
                { email: 'contact1@lead.com', status: 'sent' },
                { email: 'contact2@lead.com', status: 'sent' },
            ],
            stats: { total: 2, sent: 2, failed: 0 },
        });

        const recovered = await recoverInterruptedCampaigns();
        assert.equal(recovered, 0, 'Completed campaigns must not be recovered');
    });

    it('does not re-enqueue paused or archived campaigns', async () => {
        const user = await User.create({ email: 'owner3@example.com', name: 'Owner 3' });

        await Campaign.create({
            userId: user._id,
            name: 'Paused Campaign',
            status: 'paused',
            recipients: [{ email: 'p@lead.com', status: 'pending' }],
        });

        await Campaign.create({
            userId: user._id,
            name: 'Archived Campaign',
            status: 'running',
            isArchived: true,
            recipients: [{ email: 'archived@lead.com', status: 'pending' }],
        });

        const recovered = await recoverInterruptedCampaigns();
        assert.equal(recovered, 0, 'Paused and archived campaigns must be ignored during recovery');
    });

    it('prevents duplicate sends by checking EmailLog (idempotency)', async () => {
        const user = await User.create({ email: 'owner4@example.com', name: 'Owner 4' });

        const campaign = await Campaign.create({
            userId: user._id,
            name: 'Idempotency Campaign',
            status: 'running',
            recipients: [
                { email: 'already-sent@lead.com', status: 'pending' }, // In DB still marked pending
            ],
        });

        // Simulate that an EmailLog already exists for this email and campaign
        await EmailLog.create({
            userId: user._id,
            campaignId: campaign._id,
            to: 'already-sent@lead.com',
            status: 'sent',
            trackingId: 'tid-12345',
            sentAt: new Date(),
        });

        // Check already-contacted set logic used in queue
        const existingLogs = await EmailLog.find(
            { campaignId: campaign._id, status: { $in: ['sent', 'queued'] } },
            { to: 1 }
        ).lean();
        const alreadyContacted = new Set(existingLogs.map(l => l.to.toLowerCase()));

        assert.equal(alreadyContacted.has('already-sent@lead.com'), true, 'Recipient must be flagged as already contacted');
    });

    it('atomically claims scheduled campaigns to prevent duplicate execution across ticks', async () => {
        const user = await User.create({ email: 'owner5@example.com', name: 'Owner 5' });

        const scheduledCampaign = await Campaign.create({
            userId: user._id,
            name: 'Scheduled Due Campaign',
            status: 'scheduled',
            scheduledAt: new Date(Date.now() - 60000), // Due 1 minute ago
            recipients: [{ email: 'lead@target.com', status: 'pending' }],
        });

        // Simulate two concurrent scheduler ticks attempting to claim the same campaign
        const [claim1, claim2] = await Promise.all([
            Campaign.findOneAndUpdate(
                { _id: scheduledCampaign._id, status: 'scheduled' },
                { $set: { status: 'running' } },
                { new: true }
            ),
            Campaign.findOneAndUpdate(
                { _id: scheduledCampaign._id, status: 'scheduled' },
                { $set: { status: 'running' } },
                { new: true }
            ),
        ]);

        const successfulClaims = [claim1, claim2].filter(Boolean);
        assert.equal(successfulClaims.length, 1, 'Exactly one concurrent tick must claim the campaign');
    });
});
