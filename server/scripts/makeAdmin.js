import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';

/**
 * Usage: node scripts/makeAdmin.js <email>
 * Promotes a specific user to admin role.
 */
const makeAdmin = async () => {
    const email = process.argv[2];
    if (!email) {
        console.error('Usage: node scripts/makeAdmin.js <email>');
        process.exit(1);
    }

    try {
        await connectDB();
        console.log('Connected to MongoDB');

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            console.error(`User with email "${email}" not found.`);
            process.exit(1);
        }

        user.role = 'admin';
        await user.save();
        console.log(`✅ User ${user.email} promoted to Admin.`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

makeAdmin();
