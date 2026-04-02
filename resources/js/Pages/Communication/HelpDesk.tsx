import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';

/* ── Types ───────────────────────────────────────────── */

interface Category {
    id: number;
    name: string;
    color: string;
    description: string | null;
}

interface TeamMember {
    id: number;
    name: string;
    email: string;
}

interface TicketData {
    id: number;
    subject: string;
    description: string;
    priority: string;
    status: string;
    category: Category | null;
    creator: { id: number; name: string; email: string } | null;
    assignee: { id: number; name: string; email: string } | null;
    replies_count: number;
    created_at: string;
    resolved_at: string | null;
    closed_at: string | null;
}

interface PaginatedTickets {
    data: TicketData[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    tickets: PaginatedTickets;
    filters: { status: string; priority: string; category: string; search: string };
    stats: { total: number; open: number; in_progress: number; resolved: number; closed: number; urgent: number };
    categories: Category[];
    teamMembers: TeamMember[];
}

/* ── Constants ───────────────────────────────────────── */

const priorityColors: Record<string, string> = {
    low: 'bg-slate-100 text-slate-600',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
};

const statusColors: Record<string, string> = {
    open: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-blue-100 text-blue-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-slate-100 text-slate-600',
};

const statusLabels: Record<string, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
};

const priorityLabels: Record<string, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
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

/* ── Component ───────────────────────────────────────── */

export default function HelpDesk({ tickets, filters, stats, categories, teamMembers }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingTicket, setEditingTicket] = useState<TicketData | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    /* ── Ticket form ── */
    const ticketForm = useForm({
        subject: '',
        description: '',
        category_id: '' as string | number,
        priority: 'medium',
    });

    const submitTicket: FormEventHandler = (e) => {
        e.preventDefault();
        ticketForm.post(route('admin.help-desk.store'), {
            onSuccess: () => { ticketForm.reset(); setShowCreate(false); },
        });
    };

    /* ── Update ticket ── */
    const updateTicket = (ticket: TicketData, data: Record<string, unknown>) => {
        router.patch(route('admin.help-desk.update', ticket.id), data as any, { preserveScroll: true });
    };

    /* ── Delete ── */
    const confirmDelete = () => {
        if (!deleteId) return;
        router.delete(route('admin.help-desk.destroy', deleteId), {
            preserveScroll: true,
            onSuccess: () => setDeleteId(null),
        });
    };

    /* ── Category form ── */
    const catForm = useForm({ name: '', description: '', color: '#495B67' });
    const submitCategory: FormEventHandler = (e) => {
        e.preventDefault();
        catForm.post(route('admin.help-desk.store-category'), {
            onSuccess: () => { catForm.reset(); setShowCategoryModal(false); },
        });
    };

    /* ── Filters ── */
    const applyFilter = (key: string, value: string) => {
        router.get(route('admin.help-desk.index'), { ...filters, [key]: value }, { preserveState: true, preserveScroll: true });
    };

    return (
        <AdminLayout>
            <Head title="Help Desk" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Help Desk</h1>
                        <p className="text-sm text-slate-500 mt-1">Internal ticketing system — manage employee requests & issues</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowCategoryModal(true)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
                            Manage Desks
                        </button>
                        <button onClick={() => setShowCreate(true)} className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#495B67' }}>
                            + New Ticket
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[
                        { label: 'Total', value: stats.total, color: 'bg-slate-50' },
                        { label: 'Open', value: stats.open, color: 'bg-yellow-50' },
                        { label: 'In Progress', value: stats.in_progress, color: 'bg-blue-50' },
                        { label: 'Resolved', value: stats.resolved, color: 'bg-green-50' },
                        { label: 'Closed', value: stats.closed, color: 'bg-slate-50' },
                        { label: 'Urgent', value: stats.urgent, color: 'bg-red-50' },
                    ].map((s) => (
                        <div key={s.label} className={`${s.color} rounded-xl p-4 text-center`}>
                            <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <input
                        type="text"
                        placeholder="Search tickets…"
                        defaultValue={filters.search}
                        onKeyDown={(e) => { if (e.key === 'Enter') applyFilter('search', (e.target as HTMLInputElement).value); }}
                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg w-64 focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                    />

                    <select value={filters.status} onChange={(e) => applyFilter('status', e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                        <option value="all">All Statuses</option>
                        {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>

                    <select value={filters.priority} onChange={(e) => applyFilter('priority', e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                        <option value="all">All Priorities</option>
                        {Object.entries(priorityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>

                    <select value={filters.category} onChange={(e) => applyFilter('category', e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                        <option value="all">All Desks</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                {/* Ticket Table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-left">
                                <tr>
                                    <th className="px-4 py-3 font-medium text-slate-600">Ticket</th>
                                    <th className="px-4 py-3 font-medium text-slate-600">Desk</th>
                                    <th className="px-4 py-3 font-medium text-slate-600">Status</th>
                                    <th className="px-4 py-3 font-medium text-slate-600">Priority</th>
                                    <th className="px-4 py-3 font-medium text-slate-600">Assigned To</th>
                                    <th className="px-4 py-3 font-medium text-slate-600">Replies</th>
                                    <th className="px-4 py-3 font-medium text-slate-600">Created</th>
                                    <th className="px-4 py-3 font-medium text-slate-600 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {tickets.data.length === 0 && (
                                    <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">No tickets found</td></tr>
                                )}
                                {tickets.data.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => router.get(route('admin.help-desk.show', t.id))}>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-900">{t.subject}</div>
                                            <div className="text-xs text-slate-400">{t.creator?.name || 'Unknown'}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {t.category ? (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.category.color }} />
                                                    {t.category.name}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={t.status}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => updateTicket(t, { status: e.target.value })}
                                                className={`text-xs font-medium px-2 py-1 rounded-full border-0 ${statusColors[t.status]}`}
                                            >
                                                {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${priorityColors[t.priority]}`}>
                                                {priorityLabels[t.priority]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={t.assignee?.id || ''}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => updateTicket(t, { assigned_to: e.target.value || null })}
                                                className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white"
                                            >
                                                <option value="">Unassigned</option>
                                                {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-500">
                                            <Icon name="chat-bubble" className="w-3.5 h-3.5 inline-block mr-0.5" /> {t.replies_count}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-400">
                                            {timeAgo(t.created_at)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setDeleteId(t.id); }}
                                                className="text-xs text-red-500 hover:text-red-700"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {tickets.last_page > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                            <span className="text-xs text-slate-500">
                                Page {tickets.current_page} of {tickets.last_page} ({tickets.total} tickets)
                            </span>
                            <div className="flex gap-1">
                                {tickets.links.map((link, i) => (
                                    <button
                                        key={i}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        className={`px-3 py-1 text-xs rounded-lg ${link.active ? 'bg-[#495B67] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'} ${!link.url ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Create Ticket Modal ── */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">New Ticket</h2>
                        <form onSubmit={submitTicket} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                                <input type="text" value={ticketForm.data.subject} onChange={(e) => ticketForm.setData('subject', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea value={ticketForm.data.description} onChange={(e) => ticketForm.setData('description', e.target.value)} rows={4} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Desk</label>
                                    <select value={ticketForm.data.category_id} onChange={(e) => ticketForm.setData('category_id', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                                        <option value="">General</option>
                                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                                    <select value={ticketForm.data.priority} onChange={(e) => ticketForm.setData('priority', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                                        {Object.entries(priorityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Cancel</button>
                                <button type="submit" disabled={ticketForm.processing} className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50" style={{ backgroundColor: '#495B67' }}>
                                    {ticketForm.processing ? 'Creating…' : 'Create Ticket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Manage Categories Modal ── */}
            {showCategoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCategoryModal(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Help Desks</h2>

                        {/* Existing categories */}
                        <div className="space-y-2 mb-6">
                            {categories.length === 0 && <p className="text-sm text-slate-400">No desks configured yet.</p>}
                            {categories.map((c) => (
                                <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                                        <span className="text-sm font-medium text-slate-700">{c.name}</span>
                                        {c.description && <span className="text-xs text-slate-400">— {c.description}</span>}
                                    </div>
                                    <button
                                        onClick={() => router.delete(route('admin.help-desk.destroy-category', c.id), { preserveScroll: true })}
                                        className="text-xs text-red-500 hover:text-red-700"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add new category */}
                        <form onSubmit={submitCategory} className="space-y-3 border-t border-slate-100 pt-4">
                            <h3 className="text-sm font-medium text-slate-700">Add New Desk</h3>
                            <div className="grid grid-cols-3 gap-3">
                                <input type="text" placeholder="Name" value={catForm.data.name} onChange={(e) => catForm.setData('name', e.target.value)} className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg text-sm" required />
                                <input type="color" value={catForm.data.color} onChange={(e) => catForm.setData('color', e.target.value)} className="w-full h-[38px] rounded-lg border border-slate-200 cursor-pointer" />
                            </div>
                            <input type="text" placeholder="Description (optional)" value={catForm.data.description} onChange={(e) => catForm.setData('description', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setShowCategoryModal(false)} className="px-4 py-2 text-sm text-slate-600">Close</button>
                                <button type="submit" disabled={catForm.processing} className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#495B67' }}>Add Desk</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete Confirm Modal ── */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteId(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-slate-900 mb-2">Delete Ticket</h2>
                        <p className="text-sm text-slate-500 mb-4">This action cannot be undone. All replies will also be deleted.</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
                            <button onClick={confirmDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
