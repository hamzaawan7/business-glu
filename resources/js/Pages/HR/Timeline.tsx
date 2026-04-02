import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';

interface Employee {
    id: number;
    name: string;
    email: string;
}

interface TimelineEvent {
    id: number;
    user_id: number;
    type: string;
    title: string;
    description: string | null;
    event_date: string;
    file_path: string | null;
    file_name: string | null;
    metadata: Record<string, any> | null;
    created_at: string;
    user: { id: number; name: string; email: string };
    creator: { id: number; name: string } | null;
}

interface Stats {
    total_events: number;
    employees: number;
    upcoming: number;
    this_month: number;
}

interface Props {
    events: TimelineEvent[];
    employees: Employee[];
    upcoming: TimelineEvent[];
    stats: Stats;
    filters: { employee: string | null; type: string };
}

const eventTypes = [
    { value: 'hired', label: 'Hired', icon: 'party-popper', color: 'bg-green-100 text-green-700' },
    { value: 'promotion', label: 'Promotion', icon: 'arrow-up', color: 'bg-blue-100 text-blue-700' },
    { value: 'role_change', label: 'Role Change', icon: 'arrow-path', color: 'bg-indigo-100 text-indigo-700' },
    { value: 'department_change', label: 'Dept Change', icon: 'building', color: 'bg-purple-100 text-purple-700' },
    { value: 'salary_change', label: 'Salary Change', icon: 'currency-dollar', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'review', label: 'Review', icon: 'clipboard-list', color: 'bg-orange-100 text-orange-700' },
    { value: 'award', label: 'Award', icon: 'trophy', color: 'bg-amber-100 text-amber-700' },
    { value: 'training', label: 'Training', icon: 'book-open', color: 'bg-cyan-100 text-cyan-700' },
    { value: 'probation_end', label: 'Probation End', icon: 'check-circle', color: 'bg-emerald-100 text-emerald-700' },
    { value: 'anniversary', label: 'Anniversary', icon: 'cake', color: 'bg-pink-100 text-pink-700' },
    { value: 'termination', label: 'Termination', icon: 'hand-wave', color: 'bg-red-100 text-red-700' },
    { value: 'custom', label: 'Custom', icon: 'pin', color: 'bg-slate-100 text-slate-600' },
];

const getTypeConfig = (type: string) => eventTypes.find(t => t.value === type) || eventTypes[eventTypes.length - 1];

export default function Timeline({ events, employees, upcoming, stats, filters }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const form = useForm({
        user_id: '' as string | number,
        type: 'custom',
        title: '',
        description: '',
        event_date: new Date().toISOString().split('T')[0],
        file: null as File | null,
    });

    const editForm = useForm({
        type: '',
        title: '',
        description: '',
        event_date: '',
    });

    const handleCreate: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route('admin.timeline.store'), {
            onSuccess: () => { form.reset(); setShowCreate(false); },
            forceFormData: true,
        });
    };

    const startEdit = (ev: TimelineEvent) => {
        setEditId(ev.id);
        editForm.setData({
            type: ev.type,
            title: ev.title,
            description: ev.description || '',
            event_date: ev.event_date.split('T')[0],
        });
    };

    const handleEdit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editId) return;
        editForm.patch(route('admin.timeline.update', editId), {
            onSuccess: () => setEditId(null),
        });
    };

    const confirmDelete = () => {
        if (!deleteId) return;
        router.delete(route('admin.timeline.destroy', deleteId), {
            preserveScroll: true,
            onSuccess: () => setDeleteId(null),
        });
    };

    const applyFilter = (key: string, value: string) => {
        router.get(route('admin.timeline.index'), { ...filters, [key]: value }, { preserveState: true, preserveScroll: true });
    };

    return (
        <AdminLayout>
            <Head title="Employee Timeline" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Employee Timeline</h1>
                        <p className="text-sm text-slate-500">Track milestones, role changes, and employee journey events.</p>
                    </div>
                    <button onClick={() => setShowCreate(true)} className="px-4 py-2 text-sm text-white rounded-lg" style={{ backgroundColor: '#495B67' }}>
                        + Add Event
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Events', value: stats.total_events, icon: 'calendar' },
                        { label: 'Employees', value: stats.employees, icon: 'user-group' },
                        { label: 'Upcoming (30d)', value: stats.upcoming, icon: 'hourglass' },
                        { label: 'This Month', value: stats.this_month, icon: 'chart-bar' },
                    ].map(s => (
                        <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <span><Icon name={s.icon} className="w-5 h-5" /></span>
                                <span className="text-xs text-slate-500">{s.label}</span>
                            </div>
                            <span className="text-xl font-bold text-slate-900">{s.value}</span>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex gap-3 flex-wrap">
                    <select
                        value={filters.employee || ''}
                        onChange={e => applyFilter('employee', e.target.value)}
                        className="rounded-lg border-slate-200 text-sm"
                    >
                        <option value="">All Employees</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                    <select
                        value={filters.type}
                        onChange={e => applyFilter('type', e.target.value)}
                        className="rounded-lg border-slate-200 text-sm"
                    >
                        <option value="all">All Types</option>
                        {eventTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Timeline */}
                    <div className="lg:col-span-2">
                        {events.length === 0 ? (
                            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                                No timeline events found. Add one to get started.
                            </div>
                        ) : (
                            <div className="relative">
                                {/* Vertical line */}
                                <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />

                                <div className="space-y-4">
                                    {events.map(ev => {
                                        const cfg = getTypeConfig(ev.type);
                                        return (
                                            <div key={ev.id} className="relative pl-12">
                                                {/* Dot */}
                                                <div className="absolute left-3 top-4 w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: '#495B67' }} />

                                                <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                                                                    <Icon name={cfg.icon} className="w-4 h-4 inline-block mr-1" /> {cfg.label}
                                                                </span>
                                                                <span className="text-xs text-slate-400">{new Date(ev.event_date).toLocaleDateString()}</span>
                                                            </div>
                                                            <h3 className="text-sm font-semibold text-slate-900">{ev.title}</h3>
                                                            <p className="text-xs text-slate-500 mt-0.5">{ev.user.name}</p>
                                                            {ev.description && <p className="text-xs text-slate-400 mt-1">{ev.description}</p>}
                                                            {ev.file_name && (
                                                                <a href={route('admin.timeline.download', ev.id)} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1">
                                                                    <Icon name="paperclip" className="w-3.5 h-3.5 inline-block mr-0.5" /> {ev.file_name}
                                                                </a>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-1 ml-3">
                                                            <button onClick={() => startEdit(ev)} className="p-1 text-slate-400 hover:text-blue-600">
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                            </button>
                                                            <button onClick={() => setDeleteId(ev.id)} className="p-1 text-slate-400 hover:text-red-600">
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Upcoming sidebar */}
                    <div>
                        <div className="bg-white rounded-xl border border-slate-200 p-5">
                            <h3 className="text-sm font-bold text-slate-900 mb-3">Upcoming (30 days)</h3>
                            {upcoming.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-4">No upcoming events.</p>
                            ) : (
                                <div className="space-y-2">
                                    {upcoming.map(ev => {
                                        const cfg = getTypeConfig(ev.type);
                                        return (
                                            <div key={ev.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                                                <span className="text-sm"><Icon name={cfg.icon} className="w-4 h-4 inline-block" /></span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-slate-900 truncate">{ev.title}</p>
                                                    <p className="text-xs text-slate-400">{(ev as any).user?.name} · {new Date(ev.event_date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <h2 className="text-lg font-bold text-slate-900">Add Timeline Event</h2>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Employee *</label>
                                <select value={form.data.user_id} onChange={e => form.setData('user_id', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" required>
                                    <option value="">Select employee...</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
                                    <select value={form.data.type} onChange={e => form.setData('type', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm">
                                        {eventTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                                    <input type="date" value={form.data.event_date} onChange={e => form.setData('event_date', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                                <input type="text" value={form.data.title} onChange={e => form.setData('title', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" required placeholder="e.g. Promoted to Senior Developer" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea value={form.data.description} onChange={e => form.setData('description', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" rows={2} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Attachment</label>
                                <input type="file" onChange={e => form.setData('file', e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:text-sm file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">Cancel</button>
                                <button type="submit" disabled={form.processing} className="px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50" style={{ backgroundColor: '#495B67' }}>Add Event</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditId(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
                        <form onSubmit={handleEdit} className="p-6 space-y-4">
                            <h2 className="text-lg font-bold text-slate-900">Edit Event</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                                    <select value={editForm.data.type} onChange={e => editForm.setData('type', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm">
                                        {eventTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                    <input type="date" value={editForm.data.event_date} onChange={e => editForm.setData('event_date', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                                <input type="text" value={editForm.data.title} onChange={e => editForm.setData('title', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea value={editForm.data.description} onChange={e => editForm.setData('description', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" rows={2} />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setEditId(null)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">Cancel</button>
                                <button type="submit" disabled={editForm.processing} className="px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50" style={{ backgroundColor: '#495B67' }}>Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteId(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Event?</h3>
                        <p className="text-sm text-slate-500 mb-4">This action cannot be undone.</p>
                        <div className="flex justify-center gap-2">
                            <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">Cancel</button>
                            <button onClick={confirmDelete} className="px-4 py-2 text-sm text-white rounded-lg bg-red-600 hover:bg-red-700">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
