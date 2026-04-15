import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import EmailLog from '../src/models/EmailLog.js';
import Campaign from '../src/models/Campaign.js';

const checkLogs = async () => {
    await connectDB();
    
    console.log("--- Latest Failed Email Logs ---");
    const logs = await EmailLog.find({ status: 'failed' }).sort({ createdAt: -1 }).limit(5);
    for (const log of logs) {
        console.log(`To: ${log.to}, Error: ${log.error}, Date: ${log.createdAt}`);
    }

    console.log("\n--- Latest Campaigns ---");
    const campaigns = await Campaign.find().sort({ createdAt: -1 }).limit(3);
    for (const c of campaigns) {
        console.log(`Campaign: ${c.name}, Status: ${c.status}, Stats:`, c.stats);
    }
    
    process.exit(0);
};

checkLogs().catch(console.error);
