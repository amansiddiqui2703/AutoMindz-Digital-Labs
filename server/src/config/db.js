import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';
import env from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const connectDB = async () => {
    // Try connecting to the configured MongoDB first
    try {
        const conn = await mongoose.connect(env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log(`✓ MongoDB connected: ${conn.connection.host}`);
        return;
    } catch {
        console.warn('⚠ Could not connect to MongoDB at', env.MONGODB_URI);
    }

    // Fallback: start a local MongoDB with persistent storage
    try {
        console.log('⏳ Starting local MongoDB with persistent storage...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');

        // Create a persistent data directory
        const dbPath = resolve(__dirname, '../../data/mongodb');
        if (!fs.existsSync(dbPath)) {
            fs.mkdirSync(dbPath, { recursive: true });
        }

        const mongod = await MongoMemoryServer.create({
            instance: {
                dbPath,
                storageEngine: 'wiredTiger',
            },
        });

        const uri = mongod.getUri();
        await mongoose.connect(uri);
        console.log('✓ Local MongoDB started (data saved to server/data/mongodb)');
    } catch (error) {
        console.error('✗ MongoDB connection failed:', error.message);
        console.error('  Please install MongoDB or set a valid MONGODB_URI in .env');
        process.exit(1);
    }
};

export default connectDB;
