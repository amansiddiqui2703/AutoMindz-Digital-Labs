import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config({ path: '../.env' }); // Look for .env in the parent root

const mongoUri = process.env.MONGODB_URI;
const targetEmail = 'amanriyazsiddiqui.12@gmail.com';

async function checkUser() {
    try {
        console.log('Connecting to MongoDB...');
        if (!mongoUri) throw new Error('MONGODB_URI is not defined in .env');
        await mongoose.connect(mongoUri);
        console.log('Connected.');

        const user = await User.findOne({ email: targetEmail });
        if (!user) {
            console.log(`User ${targetEmail} not found.`);
        } else {
            console.log('--- USER STATUS ---');
            console.log('ID:', user._id);
            console.log('Email:', user.email);
            console.log('Role:', user.role);
            console.log('Plan:', user.plan);
            console.log('Plan Expires At:', user.planExpiresAt);
            console.log('Is Verified:', user.isVerified);
            console.log('Settings:', JSON.stringify(user.settings, null, 2));
            console.log('-------------------');
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

checkUser();
