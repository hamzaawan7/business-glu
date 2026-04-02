import UserLayout from '@/Layouts/UserLayout';
import Icon from '@/Components/Icon';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';

interface Category { id: number; name: string; color: string; description: string | null; }

interface TicketData {
    id: number;
    subject: string;
    description: string;
    priority: string;
    status: string;
    category: Category | null;
    assignee: { id: number; name: string } | null;
    replies_count: number;
    created_at: string;
    resolved_at: string | null;
}

interface Props {
    tickets: TicketData[];
    categories: Category[];
}

const statusColors: Record<string, string> = {
    open: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-blue-100 text-blue-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-slate-100 text-slate-600',
};

const statusLabels: Record<string, string> = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' };
const priorityLabels: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };

const priorityColors: Record<string, string> = {
    low: 'bg-slate-100 text-slate-600',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
};

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

export default function UserHelpDesk({ tickets, categories }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');

    const form = useForm({
        subject: '',
        description: '',
        category_id: '' as string | number,
        priority: 'medium',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route('help-desk.submit'), {
            onSuccess: () => { form.reset(); setShowCreate(false); },
        });
    };

    const filtered = tickets.filter((t) => {
        if (filter === 'open') return ['open', 'in_progress'].includes(t.status);
        if (filter === 'resolved') return ['resolved', 'closed'].includes(t.status);
        return true;
    });

    const openCount = tickets.filter((t) => ['open', 'in_progress'].includes(t.status)).length;
    const resolvedCount = tickets.filter((t) => ['resolved', 'closed'].includes(t.status)).length;

    return (
        <UserLayout>
            <Head title="Help Desk" />

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Help Desk</h1>
                        <p className="text-sm text-slate-500">Submit and track your support requests</p>
                    </div>
                    <button onClick={() => setShowCreate(true)} className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#495B67' }}>
                        + New Ticket
                    </button>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                        <div className="text-xl font-bold text-slate-900">{tickets.length}</div>
                        <div className="text-xs text-slate-500">Total</div>
                    </div>
                    <div className="bg-yellow-50 rounded-xl border border-yellow-100 p-3 text-center">
                        <div className="text-xl font-bold text-yellow-700">{openCount}</div>
                        <div className="text-xs text-yellow-600">Open</div>
                    </div>
                    <div className="bg-green-50 rounded-xl border border-green-100 p-3 text-center">
                        <div className="text-xl font-bold text-green-700">{resolvedCount}</div>
                        <div className="text-xs text-green-600">Resolved</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                    {([['all', 'All'], ['open', 'Active'], ['resolved', 'Resolved']] as const).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition ${filter === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Tickets List */}
                <div className="space-y-3">
                    {filtered.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-3xl mb-2"><Icon name="ticket" className="w-3 h-3 inline-block" /></div>
                            <p className="text-slate-400 text-sm">No tickets yet</p>
                        </div>
                    )}

                    {filtered.map((t) => (
                        <div
                            key={t.id}
                            onClick={() => router.get(route('help-desk.show', t.id))}
                            className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:border-[#495B67]/30 transition"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-slate-900 truncate">{t.subject}</h3>
                                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{t.description}</p>
                                </div>
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ml-2 whitespace-nowrap ${statusColors[t.status]}`}>
                                    {statusLabels[t.status]}
                                </span>
                            </div>

                            <div className="flex items-center gap-3 mt-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[t.priority]}`}>
                                    {priorityLabels[t.priority]}
                                </span>
                                {t.category && (
                                    <span className="flex items-center gap-1 text-xs text-slate-500">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.category.color }} />
                                        {t.category.name}
                                    </span>
                                )}
                                {t.assignee && (
                                    <span className="text-xs text-slate-400">→ {t.assignee.name}</span>
                                )}
                                <span className="text-xs text-slate-400 ml-auto">{t.replies_count}</span>
                                <span className="text-xs text-slate-400">{timeAgo(t.created_at)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Create Ticket Modal ── */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Submit a Ticket</h2>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                                <input
                                    type="text"
                                    value={form.data.subject}
                                    onChange={(e) => form.setData('subject', e.target.value)}
                                    placeholder="Brief summary of your issue"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    value={form.data.description}
                                    onChange={(e) => form.setData('description', e.target.value)}
                                    rows={4}
                                    placeholder="Describe the issue in detail…"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                    <select
                                        value={form.data.category_id}
                                        onChange={(e) => form.setData('category_id', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                                    >
                                        <option value="">General</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                                    <select
                                        value={form.data.priority}
                                        onChange={(e) => form.setData('priority', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                                    >
                                        {Object.entries(priorityLabels).map(([k, v]) => (
                                            <option key={k} value={k}>{v}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50"
                                    style={{ backgroundColor: '#495B67' }}
                                >
                                    {form.processing ? 'Submitting…' : 'Submit Ticket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </UserLayout>
    );
}
