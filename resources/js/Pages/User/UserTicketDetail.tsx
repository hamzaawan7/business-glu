import UserLayout from '@/Layouts/UserLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface Reply {
    id: number;
    body: string;
    is_internal: boolean;
    created_at: string;
    user: { id: number; name: string } | null;
}

interface TicketData {
    id: number;
    subject: string;
    description: string;
    priority: string;
    status: string;
    category: { id: number; name: string; color: string } | null;
    creator: { id: number; name: string; email: string } | null;
    assignee: { id: number; name: string } | null;
    replies: Reply[];
    created_at: string;
    resolved_at: string | null;
}

interface Props {
    ticket: TicketData;
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

export default function UserTicketDetail({ ticket }: Props) {
    const form = useForm({ body: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route('help-desk.reply', ticket.id), {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    const isClosed = ['resolved', 'closed'].includes(ticket.status);

    return (
        <UserLayout>
            <Head title={`Ticket #${ticket.id}`} />

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                {/* Back */}
                <button onClick={() => router.get(route('user.help-desk'))} className="text-sm text-[#495B67] hover:underline">
                    ← Back to Help Desk
                </button>

                {/* Ticket Header */}
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex items-start justify-between">
                        <h1 className="text-lg font-bold text-slate-900 flex-1">{ticket.subject}</h1>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ml-3 ${statusColors[ticket.status]}`}>
                            {statusLabels[ticket.status]}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 mt-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[ticket.priority]}`}>
                            {priorityLabels[ticket.priority]}
                        </span>
                        {ticket.category && (
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ticket.category.color }} />
                                {ticket.category.name}
                            </span>
                        )}
                        <span className="text-xs text-slate-400">{formatDate(ticket.created_at)}</span>
                    </div>

                    {ticket.assignee && (
                        <p className="text-xs text-slate-500 mt-2">Assigned to <span className="font-medium">{ticket.assignee.name}</span></p>
                    )}

                    <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-700 whitespace-pre-wrap">
                        {ticket.description}
                    </div>

                    {ticket.resolved_at && (
                        <p className="mt-3 text-xs text-green-600">✅ Resolved on {formatDate(ticket.resolved_at)}</p>
                    )}
                </div>

                {/* Thread */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-slate-900">Conversation</h2>

                    {ticket.replies.length === 0 && (
                        <p className="text-sm text-slate-400 py-4 text-center">No replies yet. A team member will respond soon.</p>
                    )}

                    {ticket.replies.map((reply) => {
                        const isMe = reply.user?.id === ticket.creator?.id;
                        return (
                            <div key={reply.id} className={`p-4 rounded-lg ${isMe ? 'bg-[#495B67]/5' : 'bg-slate-50'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium"
                                            style={{ backgroundColor: isMe ? '#495B67' : '#94a3b8' }}
                                        >
                                            {reply.user?.name?.[0] || '?'}
                                        </div>
                                        <span className="text-sm font-medium text-slate-700">
                                            {isMe ? 'You' : reply.user?.name}
                                        </span>
                                        {!isMe && <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Staff</span>}
                                    </div>
                                    <span className="text-xs text-slate-400">{formatDate(reply.created_at)}</span>
                                </div>
                                <div className="text-sm text-slate-700 whitespace-pre-wrap">{reply.body}</div>
                            </div>
                        );
                    })}

                    {/* Reply form */}
                    {!isClosed ? (
                        <form onSubmit={submit} className="pt-4 border-t border-slate-100 space-y-3">
                            <textarea
                                value={form.data.body}
                                onChange={(e) => form.setData('body', e.target.value)}
                                rows={3}
                                placeholder="Add a reply…"
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                required
                            />
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50"
                                    style={{ backgroundColor: '#495B67' }}
                                >
                                    {form.processing ? 'Sending…' : 'Send Reply'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="pt-4 border-t border-slate-100 text-center">
                            <p className="text-sm text-slate-400">This ticket has been {ticket.status}. You can submit a new ticket if you need further help.</p>
                        </div>
                    )}
                </div>
            </div>
        </UserLayout>
    );
}
