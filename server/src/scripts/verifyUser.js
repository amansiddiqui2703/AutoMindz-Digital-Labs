import connectDB from '../config/db.js';
import User from '../models/User.js';
import process from 'process';

const verifyUser = async (email) => {
    try {
        await connectDB();
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            console.error(`User with email ${email} not found.`);
            process.exit(1);
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        console.log(`\nSuccessfully verified user: ${email}\n`);
        process.exit(0);
    } catch (error) {
        console.error('Error verifying user:', error);
        process.exit(1);
    }
};

const email = process.argv[2];
if (!email) {
    console.log('Usage: node verifyUser.js <email>');
    process.exit(1);
}

verifyUser(email);
