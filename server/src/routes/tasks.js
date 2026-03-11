import { Router } from 'express';
import auth from '../middleware/auth.js';
import Task from '../models/Task.js';
import Team from '../models/Team.js';
import Activity from '../models/Activity.js';

const router = Router();

// List tasks (with filters)
router.get('/', auth, async (req, res) => {
    try {
        const { status, assignedTo, priority, projectId, contactId, sort } = req.query;

        // Build query: user's own tasks OR tasks assigned to them
        const query = {
            $or: [
                { userId: req.user.id },
                { assignedTo: req.user.id },
            ]
        };

        if (status && status !== 'all') query.status = status;
        if (assignedTo) query.assignedTo = assignedTo;
        if (priority) query.priority = priority;
        if (projectId) query.projectId = projectId;
        if (contactId) query.contactId = contactId;

        let sortObj = { createdAt: -1 };
        if (sort === 'dueDate') sortObj = { dueDate: 1 };
        if (sort === 'priority') sortObj = { priority: -1, createdAt: -1 };

        const tasks = await Task.find(query)
            .populate('assignedTo', 'name email')
            .populate('assignedBy', 'name email')
            .populate('contactId', 'name email company')
            .populate('projectId', 'name color')
            .sort(sortObj)
            .limit(200)
            .lean();

        // Counts by status
        const baseQuery = { $or: [{ userId: req.user.id }, { assignedTo: req.user.id }] };
        const [todo, inProgress, done, overdue] = await Promise.all([
            Task.countDocuments({ ...baseQuery, status: 'todo' }),
            Task.countDocuments({ ...baseQuery, status: 'in_progress' }),
            Task.countDocuments({ ...baseQuery, status: 'done' }),
            Task.countDocuments({ ...baseQuery, status: { $in: ['todo', 'in_progress'] }, dueDate: { $lt: new Date() } }),
        ]);

        res.json({ tasks, counts: { todo, inProgress, done, overdue } });
    } catch (error) {
        console.error('Tasks list error:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Create task
router.post('/', auth, async (req, res) => {
    try {
        const { title, description, type, priority, status, dueDate, assignedTo, contactId, projectId, teamId } = req.body;

        if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });

        const task = new Task({
            userId: req.user.id,
            teamId: teamId || undefined,
            assignedTo: assignedTo || req.user.id,
            assignedBy: assignedTo && assignedTo !== req.user.id ? req.user.id : undefined,
            contactId: contactId || undefined,
            projectId: projectId || undefined,
            title: title.trim(),
            description: description || '',
            type: type || 'other',
            priority: priority || 'medium',
            status: status || 'todo',
            dueDate: dueDate ? new Date(dueDate) : undefined,
        });

        await task.save();

        const populated = await Task.findById(task._id)
            .populate('assignedTo', 'name email')
            .populate('contactId', 'name email company')
            .populate('projectId', 'name color');

        // Log activity
        await Activity.log({
            userId: req.user.id,
            teamId: teamId || undefined,
            type: 'task_created',
            title: `Created task: ${title.trim()}`,
            taskId: task._id,
            contactId: contactId || undefined,
            projectId: projectId || undefined,
        });

        res.status(201).json(populated);
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Update task
router.put('/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            $or: [{ userId: req.user.id }, { assignedTo: req.user.id }],
        });

        if (!task) return res.status(404).json({ error: 'Task not found' });

        const allowed = ['title', 'description', 'type', 'priority', 'status', 'dueDate', 'assignedTo', 'contactId', 'projectId'];
        for (const key of allowed) {
            if (req.body[key] !== undefined) {
                task[key] = req.body[key];
            }
        }

        // Auto-set completedAt
        if (req.body.status === 'done' && !task.completedAt) {
            task.completedAt = new Date();

            await Activity.log({
                userId: req.user.id,
                teamId: task.teamId,
                type: 'task_completed',
                title: `Completed task: ${task.title}`,
                taskId: task._id,
            });
        } else if (req.body.status && req.body.status !== 'done') {
            task.completedAt = undefined;
        }

        await task.save();

        const populated = await Task.findById(task._id)
            .populate('assignedTo', 'name email')
            .populate('contactId', 'name email company')
            .populate('projectId', 'name color');

        res.json(populated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            $or: [{ userId: req.user.id }, { assignedTo: req.user.id }],
        });
        if (!task) return res.status(404).json({ error: 'Task not found' });
        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

export default router;
