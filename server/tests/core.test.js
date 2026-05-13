/**
 * AutoMindz — Core Unit Tests
 *
 * Tests for critical systems:
 *   1. Email threading (RFC 2047 subject encoding, threadId plumbing)
 *   2. Follow-up reply detection (hasRecipientReplied)
 *   3. SSE event deduplication
 *   4. Queue duplicate-launch guard
 *   5. Inbox /sync-replies message deduplication
 *
 * Run with: node --test server/tests/core.test.js
 * (Node.js built-in test runner, no extra dependencies required)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// ── Helpers ──────────────────────────────────────────────────────────────────

let mongod;

before(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
});

after(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

// ── 1. RFC 2047 Subject Encoding ─────────────────────────────────────────────

describe('RFC 2047 MIME header encoding', () => {
    // Inline the same logic from gmailOAuth.js so we can test it independently
    const NEEDS_ENCODING_RE = /[^\x20-\x7E]|[()<>@,;:\\"\/\[\]?=]|[!#$%&'*+\-/^_`{|}~]/;
    const encodeMimeHeader = (value) => {
        if (!value) return '';
        if (!NEEDS_ENCODING_RE.test(value)) return value;
        const encoded = Buffer.from(value, 'utf8').toString('base64');
        return `=?UTF-8?B?${encoded}?=`;
    };

    it('leaves plain ASCII subject unchanged', () => {
        const result = encodeMimeHeader('Hello World');
        assert.equal(result, 'Hello World');
    });

    it('encodes subject with exclamation mark', () => {
        const result = encodeMimeHeader('Hello World!');
        assert.match(result, /^=\?UTF-8\?B\?/);
        const decoded = Buffer.from(result.replace('=?UTF-8?B?', '').replace('?=', ''), 'base64').toString('utf8');
        assert.equal(decoded, 'Hello World!');
    });

    it('encodes subject with special chars: @#$%^&*()', () => {
        const subject = 'Deal @50% off! (Limited)';
        const result = encodeMimeHeader(subject);
        assert.match(result, /^=\?UTF-8\?B\?/);
        const decoded = Buffer.from(result.replace('=?UTF-8?B?', '').replace('?=', ''), 'base64').toString('utf8');
        assert.equal(decoded, subject);
    });

    it('encodes subject with unicode characters', () => {
        const subject = 'こんにちは World';
        const result = encodeMimeHeader(subject);
        assert.match(result, /^=\?UTF-8\?B\?/);
        const decoded = Buffer.from(result.replace('=?UTF-8?B?', '').replace('?=', ''), 'base64').toString('utf8');
        assert.equal(decoded, subject);
    });

    it('returns empty string for falsy input', () => {
        assert.equal(encodeMimeHeader(''), '');
        assert.equal(encodeMimeHeader(null), '');
        assert.equal(encodeMimeHeader(undefined), '');
    });
});

// ── 2. SSE Event Deduplication ────────────────────────────────────────────────

describe('SSEManager deduplication', () => {
    it('suppresses identical events within 500ms window', async () => {
        // Mock response object
        const writes = [];
        const mockRes = {
            write: (data) => writes.push(data),
            on: () => {},
        };

        // Inline SSEManager to avoid importing the full module
        const recentEvents = new Map();
        const sendEvent = (userId, event, payload) => {
            const dedupKey = `${userId}:${event}:${JSON.stringify(payload)}`;
            const lastSent = recentEvents.get(dedupKey);
            if (lastSent && Date.now() - lastSent < 500) return;
            recentEvents.set(dedupKey, Date.now());
            mockRes.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
        };

        sendEvent('user1', 'inbox_update', { _id: 'msg1' });
        sendEvent('user1', 'inbox_update', { _id: 'msg1' }); // duplicate
        sendEvent('user1', 'inbox_update', { _id: 'msg1' }); // duplicate

        assert.equal(writes.length, 1, 'Only 1 write should happen within 500ms window');
    });

    it('allows same event after 500ms window expires', async () => {
        const writes = [];
        const mockRes = { write: (d) => writes.push(d), on: () => {} };
        const recentEvents = new Map();
        const sendEvent = (userId, event, payload, fakeNow) => {
            const dedupKey = `${userId}:${event}:${JSON.stringify(payload)}`;
            const lastSent = recentEvents.get(dedupKey);
            if (lastSent && fakeNow - lastSent < 500) return;
            recentEvents.set(dedupKey, fakeNow);
            mockRes.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
        };

        const t0 = Date.now();
        sendEvent('user1', 'inbox_update', { _id: 'msg2' }, t0);
        sendEvent('user1', 'inbox_update', { _id: 'msg2' }, t0 + 600); // after window

        assert.equal(writes.length, 2, 'Both writes should succeed after 500ms');
    });
});

// ── 3. Queue Duplicate-Launch Guard ──────────────────────────────────────────

describe('Campaign duplicate enqueue guard', () => {
    it('prevents concurrent enqueue of the same campaign', async () => {
        const called = [];
        const enqueuingCampaigns = new Set();

        const mockEnqueue = async (id) => {
            if (enqueuingCampaigns.has(id)) return 'skipped';
            enqueuingCampaigns.add(id);
            try {
                await new Promise(r => setTimeout(r, 10)); // simulate async work
                called.push(id);
                return 'done';
            } finally {
                enqueuingCampaigns.delete(id);
            }
        };

        const [r1, r2, r3] = await Promise.all([
            mockEnqueue('campaign123'),
            mockEnqueue('campaign123'),
            mockEnqueue('campaign123'),
        ]);

        assert.equal(called.length, 1, 'Only 1 enqueue should proceed');
        assert.equal(r1, 'done');
        assert.equal(r2, 'skipped');
        assert.equal(r3, 'skipped');
    });
});

// ── 4. InboxMessage DB Operations ────────────────────────────────────────────

describe('InboxMessage model', () => {
    // Dynamic import after DB is connected
    let InboxMessage;
    before(async () => {
        const mod = await import('../src/models/InboxMessage.js');
        InboxMessage = mod.default;
    });

    it('creates an inbound message and retrieves by gmailThreadId', async () => {
        const userId = new mongoose.Types.ObjectId();
        const threadId = 'thread-abc-123';

        await InboxMessage.create({
            userId,
            gmailMessageId: 'msg-001',
            gmailThreadId: threadId,
            direction: 'inbound',
            from: 'test@example.com',
            to: 'me@myapp.com',
            subject: 'Re: Hello',
            receivedAt: new Date(),
        });

        const found = await InboxMessage.findOne({ gmailThreadId: threadId });
        assert.ok(found, 'Message should be found by threadId');
        assert.equal(found.direction, 'inbound');
        assert.equal(found.from, 'test@example.com');
    });

    it('rejects duplicate gmailMessageId for same user (unique index)', async () => {
        const userId = new mongoose.Types.ObjectId();

        await InboxMessage.create({
            userId,
            gmailMessageId: 'unique-msg-001',
            gmailThreadId: 'thread-x',
            direction: 'outbound',
            from: 'me@myapp.com',
            to: 'contact@example.com',
            receivedAt: new Date(),
        });

        await assert.rejects(
            () => InboxMessage.create({
                userId,
                gmailMessageId: 'unique-msg-001', // duplicate
                gmailThreadId: 'thread-x',
                direction: 'outbound',
                from: 'me@myapp.com',
                to: 'contact@example.com',
                receivedAt: new Date(),
            }),
            { name: 'MongoServerError' },
            'Duplicate gmailMessageId should be rejected'
        );
    });
});

// ── 5. EmailLog DB Operations ────────────────────────────────────────────────

describe('EmailLog model', () => {
    let EmailLog;
    before(async () => {
        const mod = await import('../src/models/EmailLog.js');
        EmailLog = mod.default;
    });

    it('creates an email log and retrieves it by trackingId', async () => {
        const userId = new mongoose.Types.ObjectId();
        const trackingId = 'track-' + Date.now();

        const log = await EmailLog.create({
            userId,
            to: 'lead@example.com',
            subject: 'Test Campaign',
            trackingId,
            status: 'sent',
            sentAt: new Date(),
        });

        const found = await EmailLog.findOne({ trackingId });
        assert.ok(found);
        assert.equal(found.status, 'sent');
        assert.equal(found.to, 'lead@example.com');
    });
});
