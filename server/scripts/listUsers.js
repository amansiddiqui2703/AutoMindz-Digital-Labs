import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';

const listUsers = async () => {
    try {
        await connectDB();
        const users = await User.find({}).select('email name role isVerified googleId createdAt');
        console.log(`\nFound ${users.length} users:\n`);
        users.forEach(u => {
            console.log(`  ${u.email} | role: ${u.role} | verified: ${u.isVerified} | google: ${!!u.googleId} | name: ${u.name}`);
        });
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

listUsers();
