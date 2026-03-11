import { Router } from 'express';
import auth from '../middleware/auth.js';
import Link from '../models/Link.js';

const router = Router();

// List links
router.get('/', auth, async (req, res) => {
    try {
        const { projectId, status, page = 1, limit = 50 } = req.query;
        const filter = { userId: req.user.id };
        if (projectId) filter.projectId = projectId;
        if (status) filter.status = status;

        const [links, total] = await Promise.all([
            Link.find(filter)
                .populate('contactId', 'name email company')
                .sort({ updatedAt: -1 })
                .skip((page - 1) * limit)
                .limit(Number(limit))
                .lean(),
            Link.countDocuments(filter),
        ]);

        // Stats
        const stats = await Link.aggregate([
            { $match: { userId: req.user.id, ...(projectId ? { projectId: Link.castId(projectId) } : {}) } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);

        const statusCounts = {};
        stats.forEach(s => { statusCounts[s._id] = s.count; });

        res.json({
            links,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            stats: statusCounts,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch links' });
    }
});

// Create link
router.post('/', auth, async (req, res) => {
    try {
        const { targetUrl, linkUrl, anchorText, projectId, contactId, campaignId, notes } = req.body;
        if (!targetUrl?.trim()) return res.status(400).json({ error: 'Target URL is required' });

        const link = await Link.create({
            userId: req.user.id,
            targetUrl: targetUrl.trim(),
            linkUrl: linkUrl || '',
            anchorText: anchorText || '',
            projectId,
            contactId,
            campaignId,
            notes: notes || '',
        });

        res.status(201).json(link);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create link' });
    }
});

// Update link
router.put('/:id', auth, async (req, res) => {
    try {
        const { targetUrl, linkUrl, anchorText, status, notes } = req.body;
        const update = {};
        if (targetUrl !== undefined) update.targetUrl = targetUrl.trim();
        if (linkUrl !== undefined) update.linkUrl = linkUrl;
        if (anchorText !== undefined) update.anchorText = anchorText;
        if (notes !== undefined) update.notes = notes;
        if (status !== undefined) {
            update.status = status;
            if (status === 'live' && !update.firstFoundAt) update.firstFoundAt = new Date();
            if (status === 'removed') update.removedAt = new Date();
        }

        const link = await Link.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            update,
            { new: true }
        );
        if (!link) return res.status(404).json({ error: 'Link not found' });

        res.json(link);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update link' });
    }
});

// Check link status (crawl target URL for backlink)
router.post('/:id/check', auth, async (req, res) => {
    try {
        const link = await Link.findOne({ _id: req.params.id, userId: req.user.id });
        if (!link) return res.status(404).json({ error: 'Link not found' });

        let newStatus = 'pending';
        let httpStatus = 0;

        try {
            const response = await fetch(link.targetUrl, {
                headers: { 'User-Agent': 'AutoMindz Link Checker/1.0' },
                signal: AbortSignal.timeout(15000),
            });
            httpStatus = response.status;

            if (response.ok && link.linkUrl) {
                const html = await response.text();
                if (html.includes(link.linkUrl)) {
                    const nofollowCheck = html.match(new RegExp(`<a[^>]*href=["']${link.linkUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`, 'i'));
                    newStatus = nofollowCheck?.[0]?.includes('nofollow') ? 'nofollow' : 'live';
                } else {
                    newStatus = link.status === 'live' ? 'removed' : 'pending';
                }
            } else if (!response.ok) {
                newStatus = 'broken';
            }
        } catch {
            newStatus = 'broken';
        }

        // Update
        link.lastCheckedAt = new Date();
        link.status = newStatus;
        if (newStatus === 'live' && !link.firstFoundAt) link.firstFoundAt = new Date();
        if (newStatus === 'removed') link.removedAt = new Date();
        link.checkHistory.push({ checkedAt: new Date(), status: newStatus, httpStatus });

        // Keep only last 50 checks
        if (link.checkHistory.length > 50) {
            link.checkHistory = link.checkHistory.slice(-50);
        }

        await link.save();
        res.json(link);
    } catch (error) {
        res.status(500).json({ error: 'Failed to check link' });
    }
});

// Delete link
router.delete('/:id', auth, async (req, res) => {
    try {
        const link = await Link.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!link) return res.status(404).json({ error: 'Link not found' });
        res.json({ message: 'Link deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete link' });
    }
});

// Bulk check all links for a project
router.post('/bulk-check', auth, async (req, res) => {
    try {
        const { projectId } = req.body;
        const filter = { userId: req.user.id };
        if (projectId) filter.projectId = projectId;

        const links = await Link.find(filter);
        res.json({ message: `Checking ${links.length} links in background`, count: links.length });

        // Run checks asynchronously (don't block response)
        for (const link of links) {
            try {
                const response = await fetch(link.targetUrl, {
                    headers: { 'User-Agent': 'AutoMindz Link Checker/1.0' },
                    signal: AbortSignal.timeout(10000),
                });

                let newStatus = 'pending';
                if (response.ok && link.linkUrl) {
                    const html = await response.text();
                    newStatus = html.includes(link.linkUrl) ? 'live' : 'removed';
                } else if (!response.ok) {
                    newStatus = 'broken';
                }

                link.status = newStatus;
                link.lastCheckedAt = new Date();
                link.checkHistory.push({ checkedAt: new Date(), status: newStatus, httpStatus: response.status });
                await link.save();
            } catch {
                link.status = 'broken';
                link.lastCheckedAt = new Date();
                await link.save();
            }
        }
    } catch (error) {
        console.error('Bulk link check error:', error);
    }
});

export default router;
