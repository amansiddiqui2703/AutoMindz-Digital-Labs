import mongoose from 'mongoose';
import env from './env.js';



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

    // Fallback: start a local in-memory MongoDB
    try {
        console.log('⏳ Starting local in-memory MongoDB...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');

        const mongod = await MongoMemoryServer.create();

        const uri = mongod.getUri();
        await mongoose.connect(uri);
        console.log('✓ Local in-memory MongoDB started at', uri);
        console.log('  ⚠ Data will not persist across restarts. Install MongoDB for persistence.');
    } catch (error) {
        console.error('✗ MongoDB connection failed:', error.message);
        console.error('  Please install MongoDB or set a valid MONGODB_URI in .env');
        process.exit(1);
    }
};

export default connectDB;
