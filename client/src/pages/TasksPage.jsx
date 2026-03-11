import { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
    CheckCircle, Circle, Clock, Plus, Loader2, Trash2,
    Calendar, Flag, User, Filter, ArrowUpDown, AlertCircle,
    Phone, Video, Mail, Briefcase, MoreHorizontal, ChevronDown,
    ListTodo, PlayCircle, CheckSquare, XCircle
} from 'lucide-react';

const TYPE_CONFIG = {
    follow_up: { label: 'Follow Up', icon: Mail, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-500/10' },
    call: { label: 'Call', icon: Phone, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10' },
    meeting: { label: 'Meeting', icon: Video, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
    review: { label: 'Review', icon: CheckCircle, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-500/10' },
    outreach: { label: 'Outreach', icon: Mail, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
    other: { label: 'Other', icon: Briefcase, color: 'text-surface-500', bg: 'bg-surface-100 dark:bg-surface-800' },
};

const PRIORITY_CONFIG = {
    urgent: { label: 'Urgent', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10', dot: 'bg-red-500' },
    high: { label: 'High', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10', dot: 'bg-orange-500' },
    medium: { label: 'Medium', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', dot: 'bg-blue-500' },
    low: { label: 'Low', color: 'text-surface-400', bg: 'bg-surface-100 dark:bg-surface-800', dot: 'bg-surface-400' },
};

const STATUS_TABS = [
    { key: 'all', label: 'All', icon: ListTodo },
    { key: 'todo', label: 'To Do', icon: Circle },
    { key: 'in_progress', label: 'In Progress', icon: PlayCircle },
    { key: 'done', label: 'Done', icon: CheckSquare },
];

export default function TasksPage() {
    const [tasks, setTasks] = useState([]);
    const [counts, setCounts] = useState({ todo: 0, inProgress: 0, done: 0, overdue: 0 });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({
        title: '', description: '', type: 'other', priority: 'medium', dueDate: '',
    });

    useEffect(() => { fetchTasks(); }, [statusFilter]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            let url = '/tasks';
            if (statusFilter !== 'all') url += `?status=${statusFilter}`;
            const res = await api.get(url);
            setTasks(res.data.tasks || []);
            setCounts(res.data.counts || {});
        } catch {
            toast.error('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!form.title.trim()) return toast.error('Title is required');
        setCreating(true);
        try {
            await api.post('/tasks', form);
            toast.success('Task created!');
            setShowCreate(false);
            setForm({ title: '', description: '', type: 'other', priority: 'medium', dueDate: '' });
            fetchTasks();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to create task');
        } finally {
            setCreating(false);
        }
    };

    const updateStatus = async (taskId, status) => {
        try {
            await api.put(`/tasks/${taskId}`, { status });
            if (status === 'done') toast.success('Task completed! 🎉');
            fetchTasks();
        } catch {
            toast.error('Failed to update');
        }
    };

    const deleteTask = async (taskId) => {
        if (!confirm('Delete this task?')) return;
        try {
            await api.delete(`/tasks/${taskId}`);
            toast.success('Task deleted');
            fetchTasks();
        } catch {
            toast.error('Failed to delete');
        }
    };

    const isOverdue = (task) => {
        return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Tasks</h1>
                    <p className="text-surface-500 text-sm mt-1">Manage your to-do list and assignments</p>
                </div>
                <button onClick={() => setShowCreate(!showCreate)} className="btn-primary">
                    <Plus className="w-4 h-4" /> New Task
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'To Do', value: counts.todo, icon: Circle, color: 'from-blue-500 to-blue-600' },
                    { label: 'In Progress', value: counts.inProgress, icon: PlayCircle, color: 'from-amber-500 to-amber-600' },
                    { label: 'Completed', value: counts.done, icon: CheckCircle, color: 'from-green-500 to-green-600' },
                    { label: 'Overdue', value: counts.overdue, icon: AlertCircle, color: 'from-red-500 to-red-600' },
                ].map((s, i) => (
                    <div key={i} className="glass-card p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                            <s.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-surface-900 dark:text-white">{s.value}</div>
                            <div className="text-xs text-surface-500">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Task Panel */}
            {showCreate && (
                <div className="glass-card p-6 border-2 border-primary-200 dark:border-primary-700 animate-in">
                    <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-primary-500" /> Create New Task
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">Title *</label>
                            <input
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                className="input"
                                placeholder="What needs to be done?"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">Description</label>
                            <textarea
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                className="input min-h-[80px] resize-y"
                                placeholder="Add details..."
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">Type</label>
                                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input">
                                    {Object.entries(TYPE_CONFIG).map(([key, val]) => (
                                        <option key={key} value={key}>{val.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">Priority</label>
                                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="input">
                                    {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
                                        <option key={key} value={key}>{val.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">Due Date</label>
                                <input
                                    type="date"
                                    value={form.dueDate}
                                    onChange={e => setForm({ ...form, dueDate: e.target.value })}
                                    className="input"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <button onClick={handleCreate} disabled={creating} className="btn-primary">
                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                Create Task
                            </button>
                            <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Filter Tabs */}
            <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 rounded-xl p-1">
                {STATUS_TABS.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setStatusFilter(key)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${statusFilter === key
                            ? 'bg-white dark:bg-surface-900 shadow text-surface-900 dark:text-white'
                            : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                            }`}
                    >
                        <Icon className="w-4 h-4" /> {label}
                        {key === 'todo' && counts.todo > 0 && (
                            <span className="ml-1 bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{counts.todo}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tasks List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : tasks.length === 0 ? (
                <div className="text-center py-16 glass-card">
                    <ListTodo className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-300">No tasks found</h3>
                    <p className="text-surface-400 mt-1">Create your first task to get started</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {tasks.map(task => {
                        const typeConf = TYPE_CONFIG[task.type] || TYPE_CONFIG.other;
                        const priorityConf = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                        const TypeIcon = typeConf.icon;
                        const overdue = isOverdue(task);

                        return (
                            <div
                                key={task._id}
                                className={`glass-card p-4 flex items-center gap-4 group transition-all hover:shadow-md ${overdue ? 'border-l-4 border-red-500' : ''} ${task.status === 'done' ? 'opacity-60' : ''}`}
                            >
                                {/* Status Toggle */}
                                <button
                                    onClick={() => updateStatus(task._id, task.status === 'done' ? 'todo' : task.status === 'todo' ? 'in_progress' : 'done')}
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${task.status === 'done'
                                        ? 'border-green-500 bg-green-500 text-white'
                                        : task.status === 'in_progress'
                                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10'
                                            : 'border-surface-300 dark:border-surface-600 hover:border-primary-500'
                                        }`}
                                    title={task.status === 'done' ? 'Mark as to-do' : task.status === 'todo' ? 'Start progress' : 'Mark done'}
                                >
                                    {task.status === 'done' && <CheckCircle className="w-4 h-4" />}
                                    {task.status === 'in_progress' && <PlayCircle className="w-3.5 h-3.5 text-amber-500" />}
                                </button>

                                {/* Type Icon */}
                                <div className={`w-8 h-8 rounded-lg ${typeConf.bg} flex items-center justify-center flex-shrink-0`}>
                                    <TypeIcon className={`w-4 h-4 ${typeConf.color}`} />
                                </div>

                                {/* Task Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={`font-medium text-sm ${task.status === 'done' ? 'line-through text-surface-400' : 'text-surface-900 dark:text-white'}`}>
                                            {task.title}
                                        </span>
                                    </div>
                                    {task.description && (
                                        <p className="text-xs text-surface-500 truncate mt-0.5">{task.description}</p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        {/* Priority */}
                                        <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${priorityConf.bg} ${priorityConf.color}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${priorityConf.dot}`} />
                                            {priorityConf.label}
                                        </span>
                                        {/* Type */}
                                        <span className="text-[10px] text-surface-400">{typeConf.label}</span>
                                        {/* Contact */}
                                        {task.contactId && (
                                            <span className="text-[10px] text-surface-500 flex items-center gap-1">
                                                <User className="w-3 h-3" /> {task.contactId.name || task.contactId.email}
                                            </span>
                                        )}
                                        {/* Project */}
                                        {task.projectId && (
                                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${task.projectId.color}20`, color: task.projectId.color }}>
                                                {task.projectId.name}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Due Date */}
                                {task.dueDate && (
                                    <div className={`flex items-center gap-1 text-xs flex-shrink-0 ${overdue ? 'text-red-500 font-medium' : 'text-surface-400'}`}>
                                        <Calendar className="w-3.5 h-3.5" />
                                        {overdue && '⚠ '}
                                        {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </div>
                                )}

                                {/* Assigned To */}
                                {task.assignedTo && (
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" title={task.assignedTo.name}>
                                        {(task.assignedTo.name || '?').charAt(0).toUpperCase()}
                                    </div>
                                )}

                                {/* Delete */}
                                <button
                                    onClick={() => deleteTask(task._id)}
                                    className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-red-500 transition-all flex-shrink-0"
                                    title="Delete task"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
