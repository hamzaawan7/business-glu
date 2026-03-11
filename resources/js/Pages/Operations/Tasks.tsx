import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';

interface Member {
    id: number;
    name: string;
    email: string;
    role?: string;
}

interface SubtaskData {
    id: number;
    title: string;
    status: string;
    priority: string;
    due_date: string | null;
    is_overdue: boolean;
    assignees: { id: number; name: string }[];
}

interface TaskData {
    id: number;
    parent_id: number | null;
    title: string;
    description: string | null;
    priority: string;
    status: string;
    due_date: string | null;
    due_time: string | null;
    location: string | null;
    is_overdue: boolean;
    completed_at: string | null;
    creator: { id: number; name: string } | null;
    assignees: Member[];
    subtasks: SubtaskData[];
    subtask_progress: { total: number; completed: number; percent: number };
    created_at: string;
}

interface Props {
    tasks: TaskData[];
    members: Member[];
    filters: { status: string; priority: string; assignee: string | null };
    stats: { open: number; inProgress: number; completed: number; overdue: number };
}

const priorityColors: Record<string, string> = {
    urgent: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-blue-100 text-blue-700 border-blue-200',
    low: 'bg-gray-100 text-gray-600 border-gray-200',
};

const statusColors: Record<string, string> = {
    open: 'bg-slate-100 text-slate-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
};

const statusLabels: Record<string, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    completed: 'Completed',
};

export default function Tasks({ tasks, members, filters, stats }: Props) {
    const page = usePage();
    const flash = (page.props as any).flash ?? {};

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingTask, setEditingTask] = useState<TaskData | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<TaskData | null>(null);
    const [addSubtaskFor, setAddSubtaskFor] = useState<TaskData | null>(null);
    const [selectedTasks, setSelectedTasks] = useState<number[]>([]);

    const createForm = useForm({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        due_time: '',
        location: '',
        assignee_ids: [] as number[],
        parent_id: null as number | null,
    });

    const editForm = useForm({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        due_time: '',
        location: '',
        assignee_ids: [] as number[],
    });

    const openCreate = (parentId?: number) => {
        createForm.reset();
        createForm.setData('parent_id', parentId ?? null);
        if (parentId) {
            setAddSubtaskFor(tasks.find(t => t.id === parentId) ?? null);
        }
        setShowCreateModal(true);
    };

    const openEdit = (task: TaskData) => {
        editForm.setData({
            title: task.title,
            description: task.description ?? '',
            priority: task.priority,
            due_date: task.due_date ?? '',
            due_time: task.due_time ?? '',
            location: task.location ?? '',
            assignee_ids: task.assignees.map(a => a.id),
        });
        setEditingTask(task);
    };

    const handleCreate: FormEventHandler = (e) => {
        e.preventDefault();
        createForm.post(route('admin.tasks.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowCreateModal(false);
                setAddSubtaskFor(null);
                createForm.reset();
            },
        });
    };

    const handleEdit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editingTask) return;
        editForm.patch(route('admin.tasks.update', editingTask.id), {
            preserveScroll: true,
            onSuccess: () => setEditingTask(null),
        });
    };

    const handleDelete = () => {
        if (!deleteConfirm) return;
        router.delete(route('admin.tasks.destroy', deleteConfirm.id), {
            preserveScroll: true,
            onSuccess: () => setDeleteConfirm(null),
        });
    };

    const handleStatusChange = (taskId: number, status: string) => {
        router.patch(route('tasks.toggle-status', taskId), { status }, { preserveScroll: true });
    };

    const handleBulkStatus = (status: string) => {
        router.post(route('tasks.bulk-status'), {
            task_ids: selectedTasks,
            status,
        }, {
            preserveScroll: true,
            onSuccess: () => setSelectedTasks([]),
        });
    };

    const toggleSelect = (id: number) => {
        setSelectedTasks(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const applyFilter = (key: string, value: string) => {
        router.get(route('admin.tasks.index'), {
            ...filters,
            [key]: value,
        }, { preserveScroll: true, preserveState: true });
    };

    const formatDate = (date: string) => {
        const d = new Date(date + 'T00:00:00');
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const toggleAssignee = (form: { data: { assignee_ids: number[] }; setData: (key: string, value: any) => void }, userId: number) => {
        const current = form.data.assignee_ids;
        form.setData(
            'assignee_ids',
            current.includes(userId) ? current.filter(id => id !== userId) : [...current, userId]
        );
    };

    return (
        <AdminLayout title="Quick Tasks">
            <Head title="Quick Tasks" />

            <div className="space-y-6">
                {/* Flash messages */}
                {flash.success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                        {flash.success}
                    </div>
                )}
                {flash.error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {flash.error}
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold font-heading text-brand-primary">Quick Tasks</h1>
                        <p className="text-sm text-brand-accent mt-1">Create, assign, and track tasks</p>
                    </div>
                    <button
                        onClick={() => openCreate()}
                        className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition"
                    >
                        + New Task
                    </button>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Open', value: stats.open, color: 'text-slate-600', bg: 'bg-slate-50' },
                        { label: 'In Progress', value: stats.inProgress, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Completed', value: stats.completed, color: 'text-green-600', bg: 'bg-green-50' },
                        { label: 'Overdue', value: stats.overdue, color: 'text-red-600', bg: 'bg-red-50' },
                    ].map(stat => (
                        <div key={stat.label} className={`rounded-xl border border-gray-200 p-4 shadow-sm ${stat.bg}`}>
                            <p className="text-xs text-brand-accent uppercase tracking-wide">{stat.label}</p>
                            <p className={`text-2xl font-bold font-heading mt-1 ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
                    <span className="text-xs font-medium text-brand-accent uppercase tracking-wide">Filter:</span>
                    <select
                        value={filters.status}
                        onChange={e => applyFilter('status', e.target.value)}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-brand-primary focus:border-brand-primary"
                    >
                        <option value="all">All Status</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                    <select
                        value={filters.priority}
                        onChange={e => applyFilter('priority', e.target.value)}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-brand-primary focus:border-brand-primary"
                    >
                        <option value="all">All Priority</option>
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                    <select
                        value={filters.assignee ?? ''}
                        onChange={e => applyFilter('assignee', e.target.value)}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-brand-primary focus:border-brand-primary"
                    >
                        <option value="">All Assignees</option>
                        {members.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>

                    {/* Bulk actions */}
                    {selectedTasks.length > 0 && (
                        <div className="ml-auto flex items-center gap-2">
                            <span className="text-xs text-brand-accent">{selectedTasks.length} selected</span>
                            <button onClick={() => handleBulkStatus('completed')} className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition">
                                Mark Done
                            </button>
                            <button onClick={() => handleBulkStatus('open')} className="px-3 py-1.5 bg-slate-600 text-white text-xs font-medium rounded-lg hover:bg-slate-700 transition">
                                Reopen
                            </button>
                        </div>
                    )}
                </div>

                {/* Task list */}
                <div className="space-y-3">
                    {tasks.length === 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                            <svg className="mx-auto h-12 w-12 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25" />
                            </svg>
                            <h3 className="mt-3 text-base font-semibold font-heading text-brand-primary">No tasks yet</h3>
                            <p className="text-sm text-brand-accent mt-1">Create your first task to get started.</p>
                        </div>
                    )}

                    {tasks.map(task => (
                        <div key={task.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${task.is_overdue ? 'border-red-300' : 'border-gray-200'}`}>
                            <div className="p-4">
                                <div className="flex items-start gap-3">
                                    {/* Checkbox */}
                                    <input
                                        type="checkbox"
                                        checked={selectedTasks.includes(task.id)}
                                        onChange={() => toggleSelect(task.id)}
                                        className="mt-1 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                                    />

                                    {/* Status toggle */}
                                    <button
                                        onClick={() => handleStatusChange(task.id, task.status === 'completed' ? 'open' : task.status === 'open' ? 'in_progress' : 'completed')}
                                        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition ${
                                            task.status === 'completed'
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : task.status === 'in_progress'
                                                ? 'border-blue-400 bg-blue-50'
                                                : 'border-gray-300 hover:border-brand-primary'
                                        }`}
                                        title={`Status: ${statusLabels[task.status]}`}
                                    >
                                        {task.status === 'completed' && (
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                            </svg>
                                        )}
                                        {task.status === 'in_progress' && (
                                            <div className="w-2 h-2 bg-blue-400 rounded-full" />
                                        )}
                                    </button>

                                    {/* Task content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <button
                                                onClick={() => openEdit(task)}
                                                className={`text-sm font-medium text-left hover:text-brand-primary transition ${
                                                    task.status === 'completed' ? 'line-through text-gray-400' : 'text-brand-primary'
                                                }`}
                                            >
                                                {task.title}
                                            </button>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${priorityColors[task.priority]}`}>
                                                {task.priority}
                                            </span>
                                            {task.is_overdue && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-red-100 text-red-700">OVERDUE</span>
                                            )}
                                        </div>

                                        {task.description && (
                                            <p className="text-xs text-brand-accent mt-1 line-clamp-2">{task.description}</p>
                                        )}

                                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                                            {task.due_date && (
                                                <span className={`text-xs ${task.is_overdue ? 'text-red-600 font-medium' : 'text-brand-accent'}`}>
                                                    Due {formatDate(task.due_date)}{task.due_time ? ` at ${task.due_time}` : ''}
                                                </span>
                                            )}
                                            {task.location && (
                                                <span className="text-xs text-brand-accent">📍 {task.location}</span>
                                            )}
                                            {task.assignees.length > 0 && (
                                                <span className="text-xs text-brand-accent">
                                                    → {task.assignees.map(a => a.name.split(' ')[0]).join(', ')}
                                                </span>
                                            )}
                                            {task.subtask_progress.total > 0 && (
                                                <span className="text-xs text-brand-accent">
                                                    {task.subtask_progress.completed}/{task.subtask_progress.total} subtasks
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <button
                                        onClick={() => openCreate(task.id)}
                                        className="text-xs text-brand-accent hover:text-brand-primary font-medium transition"
                                        title="Add subtask"
                                    >
                                        + Sub
                                    </button>
                                </div>
                            </div>

                            {/* Subtasks */}
                            {task.subtasks.length > 0 && (
                                <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-2 space-y-1">
                                    {/* Progress bar */}
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-500 rounded-full transition-all"
                                                style={{ width: `${task.subtask_progress.percent}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] text-brand-accent font-medium">{task.subtask_progress.percent}%</span>
                                    </div>
                                    {task.subtasks.map(st => (
                                        <div key={st.id} className="flex items-center gap-2 py-1">
                                            <button
                                                onClick={() => handleStatusChange(st.id, st.status === 'completed' ? 'open' : 'completed')}
                                                className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition ${
                                                    st.status === 'completed'
                                                        ? 'bg-green-500 border-green-500 text-white'
                                                        : 'border-gray-300 hover:border-brand-primary'
                                                }`}
                                            >
                                                {st.status === 'completed' && (
                                                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                    </svg>
                                                )}
                                            </button>
                                            <span className={`text-xs flex-1 ${st.status === 'completed' ? 'line-through text-gray-400' : 'text-brand-secondary'}`}>
                                                {st.title}
                                            </span>
                                            {st.due_date && (
                                                <span className={`text-[10px] ${st.is_overdue ? 'text-red-600' : 'text-brand-accent'}`}>
                                                    {formatDate(st.due_date)}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Create / Subtask Modal ── */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowCreateModal(false); setAddSubtaskFor(null); }}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <h2 className="text-lg font-bold font-heading text-brand-primary mb-4">
                                {addSubtaskFor ? `Add Sub-task to "${addSubtaskFor.title}"` : 'Create Task'}
                            </h2>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-brand-secondary mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={createForm.data.title}
                                        onChange={e => createForm.setData('title', e.target.value)}
                                        placeholder="What needs to be done?"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                        required
                                        autoFocus
                                    />
                                    {createForm.errors.title && <p className="text-xs text-red-600 mt-1">{createForm.errors.title}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-brand-secondary mb-1">Description (optional)</label>
                                    <textarea
                                        value={createForm.data.description}
                                        onChange={e => createForm.setData('description', e.target.value)}
                                        rows={2}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-brand-secondary mb-1">Priority</label>
                                        <select
                                            value={createForm.data.priority}
                                            onChange={e => createForm.setData('priority', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-brand-secondary mb-1">Due Date</label>
                                        <input
                                            type="date"
                                            value={createForm.data.due_date}
                                            onChange={e => createForm.setData('due_date', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-brand-secondary mb-1">Location (optional)</label>
                                    <input
                                        type="text"
                                        value={createForm.data.location}
                                        onChange={e => createForm.setData('location', e.target.value)}
                                        placeholder="e.g. Main Office"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                    />
                                </div>

                                {!addSubtaskFor && (
                                    <div>
                                        <label className="block text-sm font-medium text-brand-secondary mb-2">Assign to</label>
                                        <div className="flex flex-wrap gap-2">
                                            {members.map(m => (
                                                <button
                                                    type="button"
                                                    key={m.id}
                                                    onClick={() => toggleAssignee(createForm, m.id)}
                                                    className={`px-3 py-1.5 text-xs rounded-full border transition ${
                                                        createForm.data.assignee_ids.includes(m.id)
                                                            ? 'bg-brand-primary text-white border-brand-primary'
                                                            : 'bg-white text-brand-secondary border-gray-300 hover:border-brand-primary'
                                                    }`}
                                                >
                                                    {m.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => { setShowCreateModal(false); setAddSubtaskFor(null); }}
                                        className="px-4 py-2 text-sm text-brand-accent hover:text-brand-primary transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createForm.processing}
                                        className="px-5 py-2 bg-brand-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50"
                                    >
                                        {createForm.processing ? 'Creating…' : addSubtaskFor ? 'Add Sub-task' : 'Create Task'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit Task Modal ── */}
            {editingTask && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingTask(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <h2 className="text-lg font-bold font-heading text-brand-primary mb-4">Edit Task</h2>
                            <form onSubmit={handleEdit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-brand-secondary mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={editForm.data.title}
                                        onChange={e => editForm.setData('title', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-brand-secondary mb-1">Description</label>
                                    <textarea
                                        value={editForm.data.description}
                                        onChange={e => editForm.setData('description', e.target.value)}
                                        rows={3}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-brand-secondary mb-1">Priority</label>
                                        <select
                                            value={editForm.data.priority}
                                            onChange={e => editForm.setData('priority', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-brand-secondary mb-1">Due Date</label>
                                        <input
                                            type="date"
                                            value={editForm.data.due_date}
                                            onChange={e => editForm.setData('due_date', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-brand-secondary mb-1">Location</label>
                                    <input
                                        type="text"
                                        value={editForm.data.location}
                                        onChange={e => editForm.setData('location', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-brand-secondary mb-2">Assign to</label>
                                    <div className="flex flex-wrap gap-2">
                                        {members.map(m => (
                                            <button
                                                type="button"
                                                key={m.id}
                                                onClick={() => toggleAssignee(editForm, m.id)}
                                                className={`px-3 py-1.5 text-xs rounded-full border transition ${
                                                    editForm.data.assignee_ids.includes(m.id)
                                                        ? 'bg-brand-primary text-white border-brand-primary'
                                                        : 'bg-white text-brand-secondary border-gray-300 hover:border-brand-primary'
                                                }`}
                                            >
                                                {m.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <button
                                        type="button"
                                        onClick={() => { setDeleteConfirm(editingTask); setEditingTask(null); }}
                                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                                    >
                                        Delete Task
                                    </button>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setEditingTask(null)}
                                            className="px-4 py-2 text-sm text-brand-accent hover:text-brand-primary transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={editForm.processing}
                                            className="px-5 py-2 bg-brand-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50"
                                        >
                                            {editForm.processing ? 'Saving…' : 'Save Changes'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation ── */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-bold font-heading text-brand-primary mb-2">Delete Task</h2>
                        <p className="text-sm text-brand-accent mb-6">
                            Are you sure you want to delete &ldquo;{deleteConfirm.title}&rdquo;?
                            {deleteConfirm.subtasks.length > 0 && (
                                <span className="block mt-1 text-red-600 font-medium">
                                    This will also delete {deleteConfirm.subtasks.length} sub-task(s).
                                </span>
                            )}
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 text-sm text-brand-accent hover:text-brand-primary transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
