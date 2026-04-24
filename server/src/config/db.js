import mongoose from 'mongoose';
import env from './env.js';



const connectDB = async () => {
    try {
        if (!env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        const conn = await mongoose.connect(env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });

        console.log(`✓ MongoDB connected: ${conn.connection.host}`);
        
        mongoose.connection.on('error', err => {
            console.error('✗ MongoDB runtime error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠ MongoDB disconnected. Attempting to reconnect...');
        });

    } catch (error) {
        console.error('⛔ CRITICAL: MongoDB connection failed!');
        console.error(`  Reason: ${error.message}`);
        console.error('  -> Ensure MONGODB_URI is correct and your database is accessible.');
        process.exit(1);
    }
};

export default connectDB;
