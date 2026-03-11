import { Router } from 'express';
import auth from '../middleware/auth.js';
import Contact from '../models/Contact.js';
import Link from '../models/Link.js';
import EmailLog from '../models/EmailLog.js';
import Campaign from '../models/Campaign.js';

const router = Router();

// Enrich single contact (DA/DR lookup)
router.post('/enrich/:contactId', auth, async (req, res) => {
    try {
        const contact = await Contact.findOne({ _id: req.params.contactId, userId: req.user.id });
        if (!contact) return res.status(404).json({ error: 'Contact not found' });

        const domain = contact.website || contact.email?.split('@')[1] || '';
        if (!domain) return res.status(400).json({ error: 'No domain found for this contact' });

        // Simulate enrichment (in production, integrate with Moz/Ahrefs/SEMrush API)
        const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

        // Generate realistic-looking mock data based on domain hash
        const hash = [...cleanDomain].reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const da = Math.min(95, Math.max(5, (hash % 70) + 15));
        const dr = Math.min(95, Math.max(5, (hash % 60) + 20));
        const traffic = Math.round((hash * 137) % 500000) + 1000;

        contact.enrichment = {
            domainAuthority: da,
            domainRating: dr,
            monthlyTraffic: traffic,
            enrichedAt: new Date(),
        };
        contact.website = contact.website || `https://${cleanDomain}`;
        await contact.save();

        res.json({
            message: 'Contact enriched',
            enrichment: contact.enrichment,
            domain: cleanDomain,
        });
    } catch (error) {
        console.error('Enrichment error:', error);
        res.status(500).json({ error: 'Failed to enrich contact' });
    }
});

// Bulk enrich contacts
router.post('/enrich-bulk', auth, async (req, res) => {
    try {
        const { contactIds } = req.body;
        if (!contactIds?.length) return res.status(400).json({ error: 'No contacts specified' });

        const contacts = await Contact.find({ _id: { $in: contactIds }, userId: req.user.id });
        let enriched = 0;

        for (const contact of contacts) {
            const domain = contact.website || contact.email?.split('@')[1] || '';
            if (!domain) continue;

            const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
            const hash = [...cleanDomain].reduce((acc, c) => acc + c.charCodeAt(0), 0);

            contact.enrichment = {
                domainAuthority: Math.min(95, Math.max(5, (hash % 70) + 15)),
                domainRating: Math.min(95, Math.max(5, (hash % 60) + 20)),
                monthlyTraffic: Math.round((hash * 137) % 500000) + 1000,
                enrichedAt: new Date(),
            };
            contact.website = contact.website || `https://${cleanDomain}`;
            await contact.save();
            enriched++;
        }

        res.json({ message: `Enriched ${enriched} contacts`, enriched });
    } catch (error) {
        res.status(500).json({ error: 'Failed to bulk enrich' });
    }
});

// Link report per campaign
router.get('/campaign-links/:campaignId', auth, async (req, res) => {
    try {
        const campaign = await Campaign.findOne({ _id: req.params.campaignId, userId: req.user.id });
        if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

        // Get links related to this campaign
        const links = await Link.find({ userId: req.user.id, campaignId: campaign._id })
            .populate('contactId', 'name email company enrichment')
            .sort({ createdAt: -1 })
            .lean();

        // Get stats
        const statusCounts = { live: 0, removed: 0, broken: 0, pending: 0, nofollow: 0 };
        for (const link of links) {
            if (statusCounts[link.status] !== undefined) statusCounts[link.status]++;
        }

        // Get email logs for this campaign to calculate response metrics
        const emailLogs = await EmailLog.countDocuments({ campaignId: campaign._id, status: 'sent' });

        res.json({
            campaign: { _id: campaign._id, name: campaign.name, status: campaign.status },
            links,
            stats: {
                totalLinks: links.length,
                ...statusCounts,
                emailsSent: emailLogs,
                linkAcquisitionRate: emailLogs > 0 ? ((links.filter(l => l.status === 'live').length / emailLogs) * 100).toFixed(1) : '0',
            },
        });
    } catch (error) {
        console.error('Campaign links error:', error);
        res.status(500).json({ error: 'Failed to fetch campaign link report' });
    }
});

// SEO overview (all contacts with enrichment data)
router.get('/overview', auth, async (req, res) => {
    try {
        const { sortBy, minDA, maxDA } = req.query;

        const query = { userId: req.user.id, 'enrichment.enrichedAt': { $exists: true } };
        if (minDA) query['enrichment.domainAuthority'] = { $gte: parseInt(minDA) };
        if (maxDA) {
            query['enrichment.domainAuthority'] = {
                ...query['enrichment.domainAuthority'],
                $lte: parseInt(maxDA),
            };
        }

        let sortObj = { 'enrichment.domainAuthority': -1 };
        if (sortBy === 'dr') sortObj = { 'enrichment.domainRating': -1 };
        if (sortBy === 'traffic') sortObj = { 'enrichment.monthlyTraffic': -1 };
        if (sortBy === 'recent') sortObj = { 'enrichment.enrichedAt': -1 };

        const contacts = await Contact.find(query)
            .sort(sortObj)
            .limit(200)
            .select('name email company website enrichment pipelineStage tags')
            .lean();

        // Get link counts per contact
        const contactIds = contacts.map(c => c._id);
        const linkCounts = await Link.aggregate([
            { $match: { userId: Contact.schema.path('userId').cast(req.user.id), contactId: { $in: contactIds } } },
            { $group: { _id: '$contactId', total: { $sum: 1 }, live: { $sum: { $cond: [{ $eq: ['$status', 'live'] }, 1, 0] } } } },
        ]);

        const linkMap = {};
        for (const lc of linkCounts) {
            linkMap[lc._id.toString()] = { total: lc.total, live: lc.live };
        }

        const enrichedContacts = contacts.map(c => ({
            ...c,
            links: linkMap[c._id.toString()] || { total: 0, live: 0 },
        }));

        // Summary stats
        const allEnriched = await Contact.find({ userId: req.user.id, 'enrichment.enrichedAt': { $exists: true } })
            .select('enrichment').lean();
        const avgDA = allEnriched.length > 0
            ? (allEnriched.reduce((s, c) => s + (c.enrichment?.domainAuthority || 0), 0) / allEnriched.length).toFixed(1)
            : 0;
        const avgDR = allEnriched.length > 0
            ? (allEnriched.reduce((s, c) => s + (c.enrichment?.domainRating || 0), 0) / allEnriched.length).toFixed(1)
            : 0;

        const totalLinks = await Link.countDocuments({ userId: req.user.id });
        const liveLinks = await Link.countDocuments({ userId: req.user.id, status: 'live' });

        res.json({
            contacts: enrichedContacts,
            summary: {
                totalEnriched: allEnriched.length,
                avgDA: parseFloat(avgDA),
                avgDR: parseFloat(avgDR),
                totalLinks,
                liveLinks,
            },
        });
    } catch (error) {
        console.error('SEO overview error:', error);
        res.status(500).json({ error: 'Failed to fetch SEO overview' });
    }
});

export default router;
