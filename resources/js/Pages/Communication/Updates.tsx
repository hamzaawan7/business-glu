import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';

interface UpdateData {
    id: number;
    title: string;
    body: string;
    type: string;
    status: string;
    is_pinned: boolean;
    is_popup: boolean;
    allow_comments: boolean;
    allow_reactions: boolean;
    published_at: string | null;
    scheduled_at: string | null;
    expires_at: string | null;
    creator: { id: number; name: string } | null;
    comments_count: number;
    reactions_count: number;
    reads_count: number;
    created_at: string;
}

interface Props {
    updates: UpdateData[];
    filters: { status: string; type: string };
    stats: { total: number; published: number; draft: number; pinned: number };
    teamCount: number;
}

const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    published: 'bg-green-100 text-green-700',
    scheduled: 'bg-blue-100 text-blue-700',
    archived: 'bg-gray-100 text-gray-500',
};

const typeIcons: Record<string, string> = {
    announcement: '📢',
    news: '📰',
    event: '🎉',
    poll: '📊',
};

const typeLabels: Record<string, string> = {
    announcement: 'Announcement',
    news: 'News',
    event: 'Event',
    poll: 'Poll',
};

export default function Updates({ updates, filters, stats, teamCount }: Props) {
    const page = usePage();
    const flash = (page.props as any).flash ?? {};

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUpdate, setEditingUpdate] = useState<UpdateData | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<UpdateData | null>(null);
    const [viewUpdate, setViewUpdate] = useState<UpdateData | null>(null);

    const createForm = useForm({
        title: '',
        body: '',
        type: 'announcement' as string,
        is_pinned: false,
        is_popup: false,
        allow_comments: true,
        allow_reactions: true,
        publish_now: false,
        scheduled_at: '',
        expires_at: '',
    });

    const editForm = useForm({
        title: '',
        body: '',
        type: 'announcement' as string,
        is_pinned: false,
        is_popup: false,
        allow_comments: true,
        allow_reactions: true,
        expires_at: '',
    });

    const openCreate = () => {
        createForm.reset();
        setShowCreateModal(true);
    };

    const openEdit = (update: UpdateData) => {
        editForm.setData({
            title: update.title,
            body: update.body,
            type: update.type,
            is_pinned: update.is_pinned,
            is_popup: update.is_popup,
            allow_comments: update.allow_comments,
            allow_reactions: update.allow_reactions,
            expires_at: update.expires_at ? update.expires_at.split(' ')[0] : '',
        });
        setEditingUpdate(update);
    };

    const handleCreate: FormEventHandler = (e) => {
        e.preventDefault();
        createForm.post(route('admin.updates.store'), {
            preserveScroll: true,
            onSuccess: () => { setShowCreateModal(false); createForm.reset(); },
        });
    };

    const handleEdit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editingUpdate) return;
        editForm.patch(route('admin.updates.update', editingUpdate.id), {
            preserveScroll: true,
            onSuccess: () => setEditingUpdate(null),
        });
    };

    const handleDelete = () => {
        if (!deleteConfirm) return;
        router.delete(route('admin.updates.destroy', deleteConfirm.id), {
            preserveScroll: true,
            onSuccess: () => setDeleteConfirm(null),
        });
    };

    const handlePublish = (update: UpdateData) => {
        router.post(route('admin.updates.publish', update.id), {}, { preserveScroll: true });
    };

    const handleArchive = (update: UpdateData) => {
        router.post(route('admin.updates.archive', update.id), {}, { preserveScroll: true });
    };

    const handleTogglePin = (update: UpdateData) => {
        router.post(route('admin.updates.toggle-pin', update.id), {}, { preserveScroll: true });
    };

    const applyFilter = (key: string, value: string) => {
        router.get(route('admin.updates.index'), { ...filters, [key]: value }, { preserveScroll: true, preserveState: true });
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    // ─── Render Modal ───────────────────────────────────────

    const renderUpdateModal = (
        isCreate: boolean,
        form: ReturnType<typeof useForm>,
        onSubmit: FormEventHandler,
        onClose: () => void,
    ) => (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-12 px-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mb-12">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold font-heading text-brand-primary">
                        {isCreate ? 'Create Update' : 'Edit Update'}
                    </h2>
                    <button onClick={onClose} className="text-brand-accent hover:text-brand-primary text-xl leading-none">&times;</button>
                </div>

                <form onSubmit={onSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-brand-primary mb-1">Title *</label>
                        <input
                            type="text"
                            value={form.data.title}
                            onChange={e => form.setData('title', e.target.value)}
                            placeholder="What's the update about?"
                            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary"
                            required
                        />
                    </div>

                    {/* Body */}
                    <div>
                        <label className="block text-sm font-medium text-brand-primary mb-1">Content *</label>
                        <textarea
                            value={form.data.body}
                            onChange={e => form.setData('body', e.target.value)}
                            rows={6}
                            placeholder="Write your update here..."
                            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary"
                            required
                        />
                    </div>

                    {/* Type */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-brand-primary mb-1">Type</label>
                            <select
                                value={form.data.type}
                                onChange={e => form.setData('type', e.target.value)}
                                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary"
                            >
                                <option value="announcement">📢 Announcement</option>
                                <option value="news">📰 News</option>
                                <option value="event">🎉 Event</option>
                                <option value="poll">📊 Poll</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-primary mb-1">Expires</label>
                            <input
                                type="date"
                                value={form.data.expires_at}
                                onChange={e => form.setData('expires_at', e.target.value)}
                                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary"
                            />
                        </div>
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <label className="flex items-center gap-2 text-sm text-brand-primary">
                            <input type="checkbox" checked={form.data.is_pinned} onChange={e => form.setData('is_pinned', e.target.checked)} className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary" />
                            📌 Pin to top
                        </label>
                        <label className="flex items-center gap-2 text-sm text-brand-primary">
                            <input type="checkbox" checked={form.data.is_popup} onChange={e => form.setData('is_popup', e.target.checked)} className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary" />
                            ⚡ Pop-up alert
                        </label>
                        <label className="flex items-center gap-2 text-sm text-brand-primary">
                            <input type="checkbox" checked={form.data.allow_comments} onChange={e => form.setData('allow_comments', e.target.checked)} className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary" />
                            💬 Allow comments
                        </label>
                        <label className="flex items-center gap-2 text-sm text-brand-primary">
                            <input type="checkbox" checked={form.data.allow_reactions} onChange={e => form.setData('allow_reactions', e.target.checked)} className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary" />
                            👍 Allow reactions
                        </label>
                    </div>

                    {/* Publish options (create only) */}
                    {isCreate && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                            <h4 className="text-sm font-semibold text-brand-primary">Publishing</h4>
                            <label className="flex items-center gap-2 text-sm text-brand-primary">
                                <input
                                    type="checkbox"
                                    checked={form.data.publish_now}
                                    onChange={e => form.setData('publish_now', e.target.checked)}
                                    className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                                />
                                Publish immediately
                            </label>
                            {!form.data.publish_now && (
                                <div>
                                    <label className="block text-xs text-brand-accent mb-1">Schedule for later</label>
                                    <input
                                        type="datetime-local"
                                        value={form.data.scheduled_at}
                                        onChange={e => form.setData('scheduled_at', e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary"
                                    />
                                    <p className="text-[10px] text-brand-accent mt-1">Leave blank to save as draft</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Errors */}
                    {Object.keys(form.errors).length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            {Object.values(form.errors).map((err, i) => (
                                <p key={i} className="text-xs text-red-600">{err as string}</p>
                            ))}
                        </div>
                    )}
                </form>

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-brand-accent hover:text-brand-primary transition">Cancel</button>
                    <button
                        onClick={onSubmit as any}
                        disabled={form.processing}
                        className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50"
                    >
                        {form.processing ? 'Saving…' : isCreate ? (form.data.publish_now ? 'Publish Now' : 'Save') : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <AdminLayout title="Updates">
            <Head title="Updates" />

            <div className="space-y-6">
                {flash.success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{flash.success}</div>
                )}
                {flash.error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{flash.error}</div>
                )}

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold font-heading text-brand-primary">Updates Feed</h1>
                        <p className="text-sm text-brand-accent mt-1">Post announcements and updates for your team</p>
                    </div>
                    <button onClick={openCreate} className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition">
                        + New Update
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total', value: stats.total, color: 'text-brand-primary', bg: 'bg-slate-50' },
                        { label: 'Published', value: stats.published, color: 'text-green-600', bg: 'bg-green-50' },
                        { label: 'Draft', value: stats.draft, color: 'text-slate-600', bg: 'bg-slate-50' },
                        { label: 'Pinned', value: stats.pinned, color: 'text-amber-600', bg: 'bg-amber-50' },
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
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="archived">Archived</option>
                    </select>
                    <select
                        value={filters.type}
                        onChange={e => applyFilter('type', e.target.value)}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-brand-primary focus:border-brand-primary"
                    >
                        <option value="all">All Types</option>
                        <option value="announcement">📢 Announcements</option>
                        <option value="news">📰 News</option>
                        <option value="event">🎉 Events</option>
                        <option value="poll">📊 Polls</option>
                    </select>
                </div>

                {/* Updates list */}
                <div className="space-y-3">
                    {updates.length === 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                            <svg className="mx-auto h-12 w-12 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5" />
                            </svg>
                            <h3 className="mt-3 text-base font-semibold font-heading text-brand-primary">No updates yet</h3>
                            <p className="text-sm text-brand-accent mt-1">Create your first update to keep your team informed.</p>
                        </div>
                    )}

                    {updates.map(update => (
                        <div key={update.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${update.is_pinned ? 'border-amber-300 ring-1 ring-amber-100' : 'border-gray-200'}`}>
                            <div className="p-4">
                                <div className="flex items-start gap-3">
                                    {/* Type icon */}
                                    <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-lg">{typeIcons[update.type] ?? '📢'}</span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <button onClick={() => setViewUpdate(update)} className="text-sm font-medium text-brand-primary hover:underline text-left">
                                                {update.title}
                                            </button>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColors[update.status]}`}>
                                                {update.status}
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-600">
                                                {typeLabels[update.type]}
                                            </span>
                                            {update.is_pinned && <span className="text-[10px]">📌</span>}
                                            {update.is_popup && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-orange-50 text-orange-600">Pop-up</span>}
                                        </div>

                                        <p className="text-xs text-brand-accent mt-1 line-clamp-2">{update.body}</p>

                                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                                            {update.creator && (
                                                <span className="text-xs text-brand-accent">by {update.creator.name}</span>
                                            )}
                                            {update.published_at && (
                                                <span className="text-xs text-brand-accent">{formatDate(update.published_at)}</span>
                                            )}
                                            <span className="text-xs text-brand-accent">💬 {update.comments_count}</span>
                                            <span className="text-xs text-brand-accent">👍 {update.reactions_count}</span>
                                            <span className="text-xs text-brand-accent">👁 {update.reads_count}/{teamCount} read</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        {update.status === 'draft' && (
                                            <button onClick={() => handlePublish(update)} className="px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition">
                                                Publish
                                            </button>
                                        )}
                                        {update.status === 'published' && (
                                            <button onClick={() => handleArchive(update)} className="px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                                                Archive
                                            </button>
                                        )}
                                        <button onClick={() => handleTogglePin(update)} className="px-2.5 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition" title={update.is_pinned ? 'Unpin' : 'Pin'}>
                                            {update.is_pinned ? 'Unpin' : 'Pin'}
                                        </button>
                                        <button onClick={() => openEdit(update)} className="px-2.5 py-1.5 text-xs font-medium text-brand-accent hover:text-brand-primary transition">
                                            Edit
                                        </button>
                                        <button onClick={() => setDeleteConfirm(update)} className="px-2.5 py-1.5 text-xs font-medium text-red-500 hover:text-red-700 transition">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && renderUpdateModal(
                true, createForm, handleCreate,
                () => { setShowCreateModal(false); createForm.reset(); },
            )}

            {/* Edit Modal */}
            {editingUpdate && renderUpdateModal(
                false, editForm, handleEdit,
                () => setEditingUpdate(null),
            )}

            {/* Delete Confirm */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                        <h3 className="text-lg font-bold font-heading text-brand-primary">Delete Update</h3>
                        <p className="text-sm text-brand-accent mt-2">
                            Are you sure you want to delete <strong>"{deleteConfirm.title}"</strong>? All comments and reactions will also be removed.
                        </p>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-brand-accent hover:text-brand-primary transition">Cancel</button>
                            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Update Detail */}
            {viewUpdate && (
                <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-12 px-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mb-12">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-bold font-heading text-brand-primary">{viewUpdate.title}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColors[viewUpdate.status]}`}>{viewUpdate.status}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-600">{typeLabels[viewUpdate.type]}</span>
                                    {viewUpdate.is_pinned && <span className="text-[10px]">📌 Pinned</span>}
                                </div>
                            </div>
                            <button onClick={() => setViewUpdate(null)} className="text-brand-accent hover:text-brand-primary text-xl leading-none">&times;</button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            {/* Meta */}
                            <div className="flex items-center gap-3 text-xs text-brand-accent">
                                {viewUpdate.creator && <span>by <strong>{viewUpdate.creator.name}</strong></span>}
                                {viewUpdate.published_at && <span>Published {formatDate(viewUpdate.published_at)} at {formatTime(viewUpdate.published_at)}</span>}
                                {viewUpdate.expires_at && <span className="text-orange-500">Expires {formatDate(viewUpdate.expires_at)}</span>}
                            </div>

                            {/* Body */}
                            <div className="text-sm text-brand-primary whitespace-pre-wrap leading-relaxed">{viewUpdate.body}</div>

                            {/* Settings */}
                            <div className="flex flex-wrap gap-2 text-xs">
                                {viewUpdate.is_popup && <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded">Pop-up alert</span>}
                                {viewUpdate.allow_comments && <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded">Comments on</span>}
                                {viewUpdate.allow_reactions && <span className="bg-purple-50 text-purple-600 px-2 py-1 rounded">Reactions on</span>}
                            </div>

                            {/* Engagement stats */}
                            <div className="flex items-center gap-6 text-sm bg-gray-50 rounded-lg p-3">
                                <span className="text-brand-accent">💬 {viewUpdate.comments_count} comments</span>
                                <span className="text-brand-accent">👍 {viewUpdate.reactions_count} reactions</span>
                                <span className="text-brand-accent">👁 {viewUpdate.reads_count}/{teamCount} read</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100">
                            <button onClick={() => setViewUpdate(null)} className="px-4 py-2 text-sm text-brand-accent hover:text-brand-primary transition">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
