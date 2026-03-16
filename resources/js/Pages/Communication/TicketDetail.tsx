import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface Category { id: number; name: string; color: string; }
interface TeamMember { id: number; name: string; email: string; }
interface Reply {
    id: number;
    body: string;
    is_internal: boolean;
    created_at: string;
    user: { id: number; name: string; email: string } | null;
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
    replies: Reply[];
    created_at: string;
    resolved_at: string | null;
    closed_at: string | null;
}

interface Props {
    ticket: TicketData;
    categories: Category[];
    teamMembers: TeamMember[];
}

const statusColors: Record<string, string> = {
    open: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-blue-100 text-blue-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-slate-100 text-slate-600',
};
const statusLabels: Record<string, string> = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' };
const priorityColors: Record<string, string> = { low: 'bg-slate-100 text-slate-600', medium: 'bg-blue-100 text-blue-700', high: 'bg-orange-100 text-orange-700', urgent: 'bg-red-100 text-red-700' };
const priorityLabels: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function TicketDetail({ ticket, categories, teamMembers }: Props) {
    const replyForm = useForm({ body: '', is_internal: false });

    const submitReply: FormEventHandler = (e) => {
        e.preventDefault();
        replyForm.post(route('admin.help-desk.reply', ticket.id), {
            preserveScroll: true,
            onSuccess: () => replyForm.reset(),
        });
    };

    const updateField = (data: Record<string, unknown>) => {
        router.patch(route('admin.help-desk.update', ticket.id), data as any, { preserveScroll: true });
    };

    return (
        <AdminLayout>
            <Head title={`Ticket #${ticket.id} — ${ticket.subject}`} />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Back */}
                <button onClick={() => router.get(route('admin.help-desk.index'))} className="text-sm text-[#495B67] hover:underline">
                    ← Back to Help Desk
                </button>

                {/* Header */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">{ticket.subject}</h1>
                            <p className="text-sm text-slate-500 mt-1">
                                Submitted by <span className="font-medium text-slate-700">{ticket.creator?.name}</span> · {formatDate(ticket.created_at)}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${priorityColors[ticket.priority]}`}>
                                {priorityLabels[ticket.priority]}
                            </span>
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[ticket.status]}`}>
                                {statusLabels[ticket.status]}
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 text-sm text-slate-700 whitespace-pre-wrap">{ticket.description}</div>

                    {/* Quick actions */}
                    <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Status</label>
                            <select value={ticket.status} onChange={(e) => updateField({ status: e.target.value })} className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white">
                                {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Priority</label>
                            <select value={ticket.priority} onChange={(e) => updateField({ priority: e.target.value })} className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white">
                                {Object.entries(priorityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Desk</label>
                            <select value={ticket.category?.id || ''} onChange={(e) => updateField({ category_id: e.target.value || null })} className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white">
                                <option value="">General</option>
                                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Assigned To</label>
                            <select value={ticket.assignee?.id || ''} onChange={(e) => updateField({ assigned_to: e.target.value || null })} className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white">
                                <option value="">Unassigned</option>
                                {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {ticket.resolved_at && (
                        <p className="mt-3 text-xs text-green-600">✅ Resolved on {formatDate(ticket.resolved_at)}</p>
                    )}
                    {ticket.closed_at && (
                        <p className="mt-1 text-xs text-slate-500">🔒 Closed on {formatDate(ticket.closed_at)}</p>
                    )}
                </div>

                {/* Replies / Thread */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                    <h2 className="text-sm font-semibold text-slate-900">Conversation ({ticket.replies.length})</h2>

                    {ticket.replies.length === 0 && (
                        <p className="text-sm text-slate-400">No replies yet.</p>
                    )}

                    {ticket.replies.map((reply) => (
                        <div key={reply.id} className={`p-4 rounded-lg ${reply.is_internal ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ backgroundColor: '#495B67' }}>
                                        {reply.user?.name?.[0] || '?'}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">{reply.user?.name}</span>
                                    {reply.is_internal && (
                                        <span className="text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">Internal Note</span>
                                    )}
                                </div>
                                <span className="text-xs text-slate-400">{formatDate(reply.created_at)}</span>
                            </div>
                            <div className="text-sm text-slate-700 whitespace-pre-wrap">{reply.body}</div>
                        </div>
                    ))}

                    {/* Reply form */}
                    <form onSubmit={submitReply} className="pt-4 border-t border-slate-100 space-y-3">
                        <textarea
                            value={replyForm.data.body}
                            onChange={(e) => replyForm.setData('body', e.target.value)}
                            rows={3}
                            placeholder="Write a reply…"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                            required
                        />
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={replyForm.data.is_internal}
                                    onChange={(e) => replyForm.setData('is_internal', e.target.checked)}
                                    className="rounded border-slate-300 text-[#495B67] focus:ring-[#495B67]"
                                />
                                Internal note (not visible to employee)
                            </label>
                            <button type="submit" disabled={replyForm.processing} className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50" style={{ backgroundColor: '#495B67' }}>
                                {replyForm.processing ? 'Sending…' : 'Send Reply'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
