import mongoose from 'mongoose';
import env from './env.js';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000; // 3 seconds base delay

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async () => {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            if (!env.MONGODB_URI) {
                throw new Error('MONGODB_URI is not defined in environment variables');
            }

            const conn = await mongoose.connect(env.MONGODB_URI, {
                serverSelectionTimeoutMS: 10000,
                socketTimeoutMS: 45000,
                maxPoolSize: 10,
                retryWrites: true,
            });

            console.log(`✓ MongoDB connected: ${conn.connection.host}`);
            
            mongoose.connection.on('error', err => {
                console.error('✗ MongoDB runtime error:', err);
            });

            mongoose.connection.on('disconnected', () => {
                console.warn('⚠ MongoDB disconnected. Attempting to reconnect...');
            });

            return; // success — exit the retry loop

        } catch (error) {
            const isLastAttempt = attempt === MAX_RETRIES;
            console.error(`⛔ MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed!`);
            console.error(`  Reason: ${error.message}`);

            if (isLastAttempt) {
                console.error('  -> Ensure MONGODB_URI is correct and your database is accessible.');
                process.exit(1);
            }

            const delay = RETRY_DELAY_MS * attempt; // linear backoff: 3s, 6s, 9s
            console.log(`  ⏳ Retrying in ${delay / 1000}s...`);
            await sleep(delay);
        }
    }
};

export default connectDB;
