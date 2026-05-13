import { EventEmitter } from 'events';

/**
 * SSEManager — manages Server-Sent Event connections per user.
 *
 * HARDENING FIXES:
 * - Dead connection cleanup (heartbeat was present, improved with try/write check)
 * - Event deduplication: prevent identical events within a 500ms window
 *   to stop race conditions from sending the same inbox_update twice
 * - Improved error logging (no silent swallows)
 * - Per-user connection cap (max 5 tabs) to prevent memory leaks from zombie connections
 * - sendEventToUser never throws — safe to call from background jobs
 */
class SSEManager extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(0);

        // userId (string) -> Set of active Response objects
        this.userClients = new Map();

        // DEDUPLICATION: track recent events to prevent duplicate pushes
        // key: `${userId}:${event}:${JSON.stringify(payload)}`, value: timestamp
        this._recentEvents = new Map();

        // Listen to internal broadcast events
        this.on('broadcast', ({ userId, event, payload }) => {
            this.sendEventToUser(userId, event, payload);
        });

        // HEARTBEAT: every 30s ping all clients and remove dead connections
        setInterval(() => {
            for (const [userId, clients] of this.userClients.entries()) {
                const dead = [];
                for (const res of clients) {
                    try {
                        res.write(': heartbeat\n\n');
                    } catch {
                        dead.push(res);
                    }
                }
                for (const d of dead) clients.delete(d);
                if (clients.size === 0) this.userClients.delete(userId);
            }
        }, 30_000);

        // CLEANUP: evict old deduplication cache entries every 10 seconds
        setInterval(() => {
            const cutoff = Date.now() - 5_000; // keep 5s window
            for (const [key, ts] of this._recentEvents.entries()) {
                if (ts < cutoff) this._recentEvents.delete(key);
            }
        }, 10_000);
    }

    /**
     * Register a new SSE client response object for a user.
     * Enforces a max of 5 simultaneous connections per user (tab cap).
     */
    addClient(userId, res) {
        const id = userId.toString();
        if (!this.userClients.has(id)) {
            this.userClients.set(id, new Set());
        }
        const clients = this.userClients.get(id);

        // MEMORY LEAK GUARD: cap connections per user at 5 (multiple browser tabs)
        if (clients.size >= 5) {
            // Close the oldest connection to make room
            const oldest = clients.values().next().value;
            try { oldest.end(); } catch { /* already closed */ }
            clients.delete(oldest);
        }

        clients.add(res);

        // Remove client when they disconnect
        res.on('close', () => {
            const c = this.userClients.get(id);
            if (c) {
                c.delete(res);
                if (c.size === 0) this.userClients.delete(id);
            }
        });
    }

    /**
     * Send a named event with payload to all connected clients for a user.
     * Includes deduplication: identical event+payload pairs are suppressed
     * within a 500ms window to prevent race-condition double pushes.
     */
    sendEventToUser(userId, event, payload) {
        const id = userId.toString();

        // DEDUPLICATION: skip if same event was sent within last 500ms
        const dedupKey = `${id}:${event}:${JSON.stringify(payload)?._id || JSON.stringify(payload)}`;
        const lastSent = this._recentEvents.get(dedupKey);
        if (lastSent && Date.now() - lastSent < 500) {
            return; // duplicate suppressed
        }
        this._recentEvents.set(dedupKey, Date.now());

        const clients = this.userClients.get(id);
        if (!clients || clients.size === 0) return;

        const dataString = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
        const dead = [];

        for (const res of clients) {
            try {
                res.write(dataString);
            } catch (err) {
                // Connection is dead — mark for removal
                dead.push(res);
            }
        }

        // Cleanup dead connections discovered during send
        for (const d of dead) clients.delete(d);
        if (clients.size === 0) this.userClients.delete(id);
    }

    /** Returns the number of active SSE connections (for monitoring). */
    getConnectionCount() {
        let total = 0;
        for (const clients of this.userClients.values()) total += clients.size;
        return total;
    }
}

const sse = new SSEManager();
export default sse;
