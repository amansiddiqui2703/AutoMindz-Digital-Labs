import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import Contact from '../src/models/Contact.js';
import User from '../src/models/User.js';

/**
 * Usage: node scripts/seedContacts.js <user-email>
 * Adds 10 sample contacts for the specified user.
 */
const seedContacts = async () => {
    const userEmail = process.argv[2];
    if (!userEmail) {
        console.error('Usage: node scripts/seedContacts.js <your-email>');
        console.error('Example: node scripts/seedContacts.js admin@automindz.com');
        process.exit(1);
    }

    try {
        await connectDB();

        const user = await User.findOne({ email: userEmail.toLowerCase() });
        if (!user) {
            console.error(`User "${userEmail}" not found. Register first.`);
            process.exit(1);
        }

        const contacts = [
            { name: 'Rahul Sharma', email: 'rahul@techcorp.com', company: 'TechCorp', phone: '9876543210', source: 'manual' },
            { name: 'Priya Patel', email: 'priya@designhub.io', company: 'DesignHub', phone: '9876543211', source: 'manual' },
            { name: 'Amit Kumar', email: 'amit@startupxyz.com', company: 'StartupXYZ', phone: '9876543212', source: 'manual' },
            { name: 'Sneha Gupta', email: 'sneha@dataflow.in', company: 'DataFlow', phone: '9876543213', source: 'manual' },
            { name: 'Vikram Singh', email: 'vikram@cloudbase.dev', company: 'CloudBase', phone: '9876543214', source: 'manual' },
            { name: 'Neha Joshi', email: 'neha@appworks.co', company: 'AppWorks', phone: '9876543215', source: 'manual' },
            { name: 'Rohan Verma', email: 'rohan@webscale.io', company: 'WebScale', phone: '9876543216', source: 'manual' },
            { name: 'Anjali Mehta', email: 'anjali@devstudio.in', company: 'DevStudio', phone: '9876543217', source: 'manual' },
            { name: 'Karan Malhotra', email: 'karan@ailabs.tech', company: 'AILabs', phone: '9876543218', source: 'manual' },
            { name: 'Deepika Rao', email: 'deepika@growthco.com', company: 'GrowthCo', phone: '9876543219', source: 'manual' },
        ];

        let added = 0;
        for (const c of contacts) {
            try {
                await Contact.findOneAndUpdate(
                    { userId: user._id, email: c.email },
                    { userId: user._id, ...c },
                    { upsert: true, new: true }
                );
                added++;
                console.log(`  ✅ ${c.name} (${c.email})`);
            } catch (err) {
                console.log(`  ⚠ Skipped ${c.email}: ${err.message}`);
            }
        }

        console.log(`\n🎉 Done! Added ${added} contacts for ${userEmail}`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

seedContacts();
