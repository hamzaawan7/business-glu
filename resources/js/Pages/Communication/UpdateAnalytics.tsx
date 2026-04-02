import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';
import { Head, router } from '@inertiajs/react';

interface UserRef { id: number; name: string; email?: string; }

interface UpdateData {
    id: number;
    title: string;
    body: string;
    cover_image: string | null;
    type: string;
    category: string | null;
    status: string;
    is_pinned: boolean;
    published_at: string | null;
    creator: { id: number; name: string } | null;
    comments_count: number;
    reactions_count: number;
    reads_count: number;
    created_at: string;
}

interface ReadData {
    user: UserRef | null;
    read_at: string | null;
}

interface ReactionGroup {
    count: number;
    users: UserRef[];
}

interface CommentData {
    id: number;
    body: string;
    user: UserRef | null;
    created_at: string;
}

interface Props {
    update: UpdateData;
    reads: ReadData[];
    unreadMembers: UserRef[];
    reactions: Record<string, ReactionGroup>;
    comments: CommentData[];
    teamCount: number;
}

const typeLabels: Record<string, string> = {
    announcement: 'Announcement', news: 'News', event: 'Event', poll: 'Poll',
};

export default function UpdateAnalytics({ update, reads, unreadMembers, reactions, comments, teamCount }: Props) {
    const readPercent = teamCount > 0 ? Math.round((reads.length / teamCount) * 100) : 0;

    const formatDate = (s: string) => new Date(s).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });

    return (
        <AdminLayout title="Update Analytics">
            <Head title={`Analytics: ${update.title}`} />

            <div className="space-y-6">
                {/* Back + Title */}
                <div className="flex items-center gap-3">
                    <button onClick={() => router.get(route('admin.updates.index'))}
                        className="text-sm text-brand-accent hover:text-brand-primary transition">← Back to Updates</button>
                </div>

                {/* Update summary card */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="flex-1">
                            <h1 className="text-xl font-bold font-heading text-brand-primary">{update.title}</h1>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-600">{typeLabels[update.type] || update.type}</span>
                                {update.category && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-50 text-purple-600">{update.category}</span>}
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${update.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{update.status}</span>
                                {update.is_pinned && <span className="text-xs"><Icon name="pin" className="w-4 h-4 inline-block" /></span>}
                            </div>
                            {update.creator && <p className="text-xs text-brand-accent mt-2">by {update.creator.name} • {update.published_at ? formatDate(update.published_at) : formatDate(update.created_at)}</p>}
                        </div>
                    </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                        <p className="text-xs text-brand-accent uppercase tracking-wide">Read Rate</p>
                        <p className="text-2xl font-bold font-heading text-brand-primary mt-1">{readPercent}%</p>
                        <p className="text-xs text-brand-accent">{reads.length} of {teamCount} members</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                        <p className="text-xs text-brand-accent uppercase tracking-wide">Reactions</p>
                        <p className="text-2xl font-bold font-heading text-brand-primary mt-1">{update.reactions_count}</p>
                        <p className="text-xs text-brand-accent">{Object.keys(reactions).length} types</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                        <p className="text-xs text-brand-accent uppercase tracking-wide">Comments</p>
                        <p className="text-2xl font-bold font-heading text-brand-primary mt-1">{update.comments_count}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                        <p className="text-xs text-brand-accent uppercase tracking-wide">Unread</p>
                        <p className="text-2xl font-bold font-heading text-red-600 mt-1">{unreadMembers.length}</p>
                        <p className="text-xs text-brand-accent">haven't seen it</p>
                    </div>
                </div>

                {/* Read progress bar */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-brand-primary mb-3">Read Progress</h3>
                    <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${readPercent}%` }} />
                    </div>
                    <p className="text-xs text-brand-accent mt-2">{reads.length} read • {unreadMembers.length} unread • {teamCount} total team members</p>
                </div>

                {/* Two column: Reads + Unread */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Read list */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <h3 className="text-sm font-semibold text-brand-primary mb-3">Read ({reads.length})</h3>
                        {reads.length === 0 ? (
                            <p className="text-xs text-brand-accent">No one has read this yet.</p>
                        ) : (
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {reads.map((r, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 last:border-0">
                                        <div>
                                            <span className="font-medium text-brand-primary">{r.user?.name ?? 'Unknown'}</span>
                                            {r.user?.email && <span className="text-brand-accent ml-1">({r.user.email})</span>}
                                        </div>
                                        {r.read_at && <span className="text-brand-accent">{formatDate(r.read_at)}</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Unread list */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <h3 className="text-sm font-semibold text-brand-primary mb-3">Unread ({unreadMembers.length})</h3>
                        {unreadMembers.length === 0 ? (
                            <p className="text-xs text-green-600">Everyone has read this! <Icon name="party-popper" className="w-4 h-4 inline-block" /></p>
                        ) : (
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {unreadMembers.map((m, i) => (
                                    <div key={i} className="text-xs py-1.5 border-b border-gray-50 last:border-0">
                                        <span className="font-medium text-brand-primary">{m.name}</span>
                                        {m.email && <span className="text-brand-accent ml-1">({m.email})</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Reactions breakdown */}
                {Object.keys(reactions).length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <h3 className="text-sm font-semibold text-brand-primary mb-3">Reactions Breakdown</h3>
                        <div className="space-y-3">
                            {Object.entries(reactions).map(([emoji, group]) => (
                                <div key={emoji} className="flex items-start gap-3">
                                    <div className="text-2xl">{emoji}</div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-brand-primary">{group.count}</span>
                                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-brand-primary/30 rounded-full" style={{ width: `${(group.count / teamCount) * 100}%` }} />
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {group.users.map(u => (
                                                <span key={u.id} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-brand-accent">{u.name}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Comments list */}
                {comments.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <h3 className="text-sm font-semibold text-brand-primary mb-3">Comments ({comments.length})</h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {comments.map(c => (
                                <div key={c.id} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="font-semibold text-brand-primary">{c.user?.name ?? 'Unknown'}</span>
                                        <span className="text-brand-accent">{formatDate(c.created_at)}</span>
                                    </div>
                                    <p className="text-sm text-brand-primary mt-1 whitespace-pre-wrap">{c.body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
