import { EventEmitter } from 'events';

class SSEManager extends EventEmitter {
    constructor() {
        super();
        // userClients maps userId (string) -> Set of active Response objects
        this.userClients = new Map();
        
        // Listen to internal events to broadcast
        this.on('broadcast', ({ userId, event, payload }) => {
            this.sendEventToUser(userId, event, payload);
        });
    }

    addClient(userId, res) {
        const id = userId.toString();
        if (!this.userClients.has(id)) {
            this.userClients.set(id, new Set());
        }
        this.userClients.get(id).add(res);

        // Remove client when they disconnect
        res.on('close', () => {
            const clients = this.userClients.get(id);
            if (clients) {
                clients.delete(res);
                if (clients.size === 0) {
                    this.userClients.delete(id);
                }
            }
        });
    }

    sendEventToUser(userId, event, payload) {
        const id = userId.toString();
        const clients = this.userClients.get(id);
        if (clients) {
            const dataString = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
            for (const res of clients) {
                try {
                    res.write(dataString);
                } catch (err) {
                    console.error('Failed to write SSE to client:', err);
                }
            }
        }
    }
}

const sse = new SSEManager();
export default sse;
