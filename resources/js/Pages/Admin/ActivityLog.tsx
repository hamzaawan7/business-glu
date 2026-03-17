import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface LogEntry {
    id: number;
    action: string;
    subject_type: string | null;
    subject_id: number | null;
    subject_label: string | null;
    description: string | null;
    properties: Record<string, any> | null;
    ip_address: string | null;
    user: { id: number; name: string; avatar_url: string | null } | null;
    created_at: string;
}

interface Props {
    logs: {
        data: LogEntry[];
        current_page: number;
        last_page: number;
        total: number;
    };
    actions: string[];
    subjectTypes: { value: string; label: string }[];
    users: { id: number; name: string }[];
    filters: { search?: string; action?: string; user_id?: string; subject_type?: string };
    stats: { total: number; today: number; uniqueUsers: number };
}

const actionColors: Record<string, string> = {
    created: 'bg-green-100 text-green-700',
    updated: 'bg-blue-100 text-blue-700',
    deleted: 'bg-red-100 text-red-700',
    published: 'bg-purple-100 text-purple-700',
    archived: 'bg-slate-100 text-slate-700',
    approved: 'bg-green-100 text-green-700',
    denied: 'bg-red-100 text-red-700',
    assigned: 'bg-indigo-100 text-indigo-700',
    completed: 'bg-emerald-100 text-emerald-700',
    login: 'bg-sky-100 text-sky-700',
    invited: 'bg-amber-100 text-amber-700',
};

function getActionColor(action: string): string {
    return actionColors[action] || 'bg-slate-100 text-slate-600';
}

const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

export default function ActivityLog({ logs, actions, subjectTypes, users, filters, stats }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const applyFilters = (overrides: Record<string, string> = {}) => {
        router.get('/admin/activity-log', {
            search: search || undefined,
            action: filters.action || undefined,
            user_id: filters.user_id || undefined,
            subject_type: filters.subject_type || undefined,
            ...overrides,
        }, { preserveState: true, replace: true });
    };

    return (
        <AdminLayout>
            <Head title="Activity Log" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
                    <p className="text-sm text-slate-500 mt-1">Immutable audit trail of all platform activity.</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Entries</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Today</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{stats.today}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Active Users</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{stats.uniqueUsers}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Action Types</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{actions.length}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap gap-3">
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="text"
                                placeholder="Search activity..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && applyFilters()}
                                className="w-full rounded-lg border-slate-200 text-sm focus:ring-[#495B67] focus:border-[#495B67]"
                            />
                        </div>
                        <select
                            value={filters.action ?? ''}
                            onChange={e => applyFilters({ action: e.target.value })}
                            className="rounded-lg border-slate-200 text-sm focus:ring-[#495B67] focus:border-[#495B67]"
                        >
                            <option value="">All Actions</option>
                            {actions.map(a => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                        <select
                            value={filters.user_id ?? ''}
                            onChange={e => applyFilters({ user_id: e.target.value })}
                            className="rounded-lg border-slate-200 text-sm focus:ring-[#495B67] focus:border-[#495B67]"
                        >
                            <option value="">All Users</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                        <select
                            value={filters.subject_type ?? ''}
                            onChange={e => applyFilters({ subject_type: e.target.value })}
                            className="rounded-lg border-slate-200 text-sm focus:ring-[#495B67] focus:border-[#495B67]"
                        >
                            <option value="">All Modules</option>
                            {subjectTypes.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                        {(filters.search || filters.action || filters.user_id || filters.subject_type) && (
                            <button
                                onClick={() => {
                                    setSearch('');
                                    router.get('/admin/activity-log', {}, { preserveState: true, replace: true });
                                }}
                                className="text-sm text-slate-500 hover:text-slate-700"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Log entries */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    {logs.data.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-slate-400">No activity recorded yet.</p>
                            <p className="text-xs text-slate-300 mt-1">Activity will appear here as users interact with the platform.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {logs.data.map(log => (
                                <div
                                    key={log.id}
                                    className="px-5 py-4 hover:bg-slate-50 cursor-pointer transition"
                                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* User avatar */}
                                        {log.user?.avatar_url ? (
                                            <img src={log.user.avatar_url} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt="" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-slate-100 text-slate-500 flex-shrink-0">
                                                {log.user ? initials(log.user.name) : '?'}
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-medium text-slate-900">
                                                    {log.user?.name ?? 'System'}
                                                </span>
                                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                                {log.subject_type && (
                                                    <span className="text-xs text-slate-400">
                                                        {log.subject_type}
                                                    </span>
                                                )}
                                                {log.subject_label && (
                                                    <span className="text-xs text-slate-600 font-medium truncate max-w-[200px]">
                                                        "{log.subject_label}"
                                                    </span>
                                                )}
                                            </div>
                                            {log.description && (
                                                <p className="text-xs text-slate-500 mt-0.5">{log.description}</p>
                                            )}

                                            {/* Expanded details */}
                                            {expandedId === log.id && (
                                                <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs space-y-2">
                                                    {log.ip_address && (
                                                        <div className="flex gap-2">
                                                            <span className="text-slate-400 w-20">IP Address</span>
                                                            <span className="text-slate-600 font-mono">{log.ip_address}</span>
                                                        </div>
                                                    )}
                                                    {log.subject_id && (
                                                        <div className="flex gap-2">
                                                            <span className="text-slate-400 w-20">Subject ID</span>
                                                            <span className="text-slate-600 font-mono">#{log.subject_id}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex gap-2">
                                                        <span className="text-slate-400 w-20">Timestamp</span>
                                                        <span className="text-slate-600">{new Date(log.created_at).toLocaleString()}</span>
                                                    </div>
                                                    {log.properties && Object.keys(log.properties).length > 0 && (
                                                        <div>
                                                            <span className="text-slate-400">Changes:</span>
                                                            <pre className="mt-1 text-[10px] text-slate-600 bg-white p-2 rounded border border-slate-200 overflow-auto max-h-32">
                                                                {JSON.stringify(log.properties, null, 2)}
                                                            </pre>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <span className="text-xs text-slate-400 flex-shrink-0">{timeAgo(log.created_at)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {logs.last_page > 1 && (
                        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                            <p className="text-xs text-slate-400">
                                Page {logs.current_page} of {logs.last_page} · {logs.total} entries
                            </p>
                            <div className="flex gap-2">
                                {logs.current_page > 1 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.get('/admin/activity-log', { ...filters, page: logs.current_page - 1 }, { preserveState: true });
                                        }}
                                        className="px-3 py-1 text-xs rounded-lg border border-slate-200 hover:bg-slate-50"
                                    >
                                        Previous
                                    </button>
                                )}
                                {logs.current_page < logs.last_page && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.get('/admin/activity-log', { ...filters, page: logs.current_page + 1 }, { preserveState: true });
                                        }}
                                        className="px-3 py-1 text-xs rounded-lg border border-slate-200 hover:bg-slate-50"
                                    >
                                        Next
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
