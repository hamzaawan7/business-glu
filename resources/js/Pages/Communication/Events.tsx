import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';

interface EventData {
    id: number;
    title: string;
    description: string | null;
    location: string | null;
    type: string;
    status: string;
    starts_at: string;
    ends_at: string | null;
    is_all_day: boolean;
    is_recurring: boolean;
    recurrence_rule: string | null;
    recurrence_end: string | null;
    created_at: string;
    creator: { id: number; name: string; email: string } | null;
    rsvps_count: number;
    attending_count: number;
    declined_count: number;
    maybe_count: number;
}

interface Props {
    events: EventData[];
    filters: { status: string; type: string };
    stats: { total: number; upcoming: number; draft: number; past: number };
}

const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    published: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-500',
};

const typeIcons: Record<string, string> = {
    general: '📅', meeting: '🤝', social: '🎉', training: '🎓', other: '📌',
};

const typeLabels: Record<string, string> = {
    general: 'General', meeting: 'Meeting', social: 'Social', training: 'Training', other: 'Other',
};

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function toInputDatetime(dateStr: string | null): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toInputDate(dateStr: string | null): string {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
}

export default function Events({ events, filters, stats }: Props) {
    const page = usePage();
    const flash = (page.props as any).flash ?? {};

    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<EventData | null>(null);
    const [viewEvent, setViewEvent] = useState<EventData | null>(null);

    const form = useForm({
        title: '',
        description: '',
        location: '',
        type: 'general' as string,
        starts_at: '',
        ends_at: '',
        is_all_day: false,
        is_recurring: false,
        recurrence_rule: '' as string,
        recurrence_end: '',
        publish_now: false,
    });

    function openCreate() {
        form.reset();
        form.setData({
            title: '', description: '', location: '', type: 'general',
            starts_at: '', ends_at: '', is_all_day: false, is_recurring: false,
            recurrence_rule: '', recurrence_end: '', publish_now: false,
        });
        setEditingEvent(null);
        setShowModal(true);
    }

    function openEdit(event: EventData) {
        setEditingEvent(event);
        form.setData({
            title: event.title,
            description: event.description || '',
            location: event.location || '',
            type: event.type,
            starts_at: toInputDatetime(event.starts_at),
            ends_at: toInputDatetime(event.ends_at),
            is_all_day: event.is_all_day,
            is_recurring: event.is_recurring,
            recurrence_rule: event.recurrence_rule || '',
            recurrence_end: toInputDate(event.recurrence_end),
            publish_now: false,
        });
        setShowModal(true);
    }

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editingEvent) {
            form.patch(`/admin/events/${editingEvent.id}`, {
                preserveScroll: true,
                onSuccess: () => { setShowModal(false); setEditingEvent(null); },
            });
        } else {
            form.post('/admin/events', {
                preserveScroll: true,
                onSuccess: () => setShowModal(false),
            });
        }
    };

    function handleDelete() {
        if (!deleteConfirm) return;
        router.delete(`/admin/events/${deleteConfirm.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteConfirm(null),
        });
    }

    function handlePublish(event: EventData) {
        router.post(`/admin/events/${event.id}/publish`, {}, { preserveScroll: true });
    }

    function handleCancel(event: EventData) {
        router.post(`/admin/events/${event.id}/cancel`, {}, { preserveScroll: true });
    }

    function applyFilter(key: string, value: string) {
        router.get('/admin/events', { ...filters, [key]: value }, { preserveScroll: true, preserveState: true });
    }

    const isUpcoming = (event: EventData) => new Date(event.starts_at) > new Date();

    return (
        <AdminLayout>
            <Head title="Events" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
                        <p className="text-sm text-gray-500 mt-1">Create and manage company events with RSVP tracking</p>
                    </div>
                    <button onClick={openCreate} className="px-4 py-2 bg-[#495B67] text-white text-sm font-medium rounded-lg hover:bg-[#3a4a55] transition-colors">
                        + New Event
                    </button>
                </div>

                {/* Flash */}
                {flash.success && (
                    <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{flash.success}</div>
                )}
                {flash.error && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{flash.error}</div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Events', value: stats.total, icon: '📅' },
                        { label: 'Upcoming', value: stats.upcoming, icon: '🔜' },
                        { label: 'Drafts', value: stats.draft, icon: '📝' },
                        { label: 'Past', value: stats.past, icon: '✅' },
                    ].map(s => (
                        <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>{s.icon}</span> {s.label}
                            </div>
                            <div className="text-2xl font-bold text-gray-900 mt-1">{s.value}</div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Filter:</span>
                        <select
                            value={filters.status}
                            onChange={(e) => applyFilter('status', e.target.value)}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                        >
                            <option value="all">All Status</option>
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <select
                            value={filters.type}
                            onChange={(e) => applyFilter('type', e.target.value)}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                        >
                            <option value="all">All Types</option>
                            <option value="general">📅 General</option>
                            <option value="meeting">🤝 Meeting</option>
                            <option value="social">🎉 Social</option>
                            <option value="training">🎓 Training</option>
                            <option value="other">📌 Other</option>
                        </select>
                    </div>
                </div>

                {/* Events List */}
                {events.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <div className="text-4xl mb-3">📅</div>
                        <p className="text-gray-500 text-sm">No events found. Create your first event to get started.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {events.map(event => (
                            <div key={event.id} className={`bg-white rounded-xl border p-5 hover:shadow-sm transition-all ${event.status === 'cancelled' ? 'border-red-200 opacity-60' : 'border-gray-200'}`}>
                                <div className="flex items-start gap-4">
                                    {/* Date badge */}
                                    <div className="w-14 h-14 rounded-xl bg-[#495B67]/10 flex flex-col items-center justify-center flex-shrink-0">
                                        <span className="text-[10px] font-semibold text-[#495B67] uppercase">
                                            {new Date(event.starts_at).toLocaleDateString('en-US', { month: 'short' })}
                                        </span>
                                        <span className="text-lg font-bold text-[#495B67] leading-tight">
                                            {new Date(event.starts_at).getDate()}
                                        </span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <h3
                                                className="font-semibold text-gray-900 hover:text-[#495B67] cursor-pointer"
                                                onClick={() => setViewEvent(event)}
                                            >
                                                {event.title}
                                            </h3>
                                            <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${statusColors[event.status] || 'bg-gray-100 text-gray-600'}`}>
                                                {event.status}
                                            </span>
                                            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-50 text-blue-600">
                                                {typeIcons[event.type]} {typeLabels[event.type]}
                                            </span>
                                            {event.is_recurring && (
                                                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-purple-50 text-purple-600">
                                                    🔄 {event.recurrence_rule}
                                                </span>
                                            )}
                                        </div>
                                        {event.description && (
                                            <p className="text-sm text-gray-500 line-clamp-1">{event.description}</p>
                                        )}
                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                            <span>
                                                🕐 {event.is_all_day ? 'All day' : formatTime(event.starts_at)}
                                                {event.ends_at && !event.is_all_day && ` — ${formatTime(event.ends_at)}`}
                                            </span>
                                            {event.location && <span>📍 {event.location}</span>}
                                            <span>✅ {event.attending_count} attending</span>
                                            {event.maybe_count > 0 && <span>🤔 {event.maybe_count} maybe</span>}
                                            {event.declined_count > 0 && <span>❌ {event.declined_count} declined</span>}
                                            <span>By {event.creator?.name ?? 'Unknown'}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        {event.status === 'draft' && (
                                            <button onClick={() => handlePublish(event)} className="px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                                                Publish
                                            </button>
                                        )}
                                        {event.status === 'published' && (
                                            <button onClick={() => handleCancel(event)} className="px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                                                Cancel
                                            </button>
                                        )}
                                        <button onClick={() => openEdit(event)} className="p-1.5 text-gray-400 hover:text-[#495B67] rounded" title="Edit">
                                            ✏️
                                        </button>
                                        <button onClick={() => setDeleteConfirm(event)} className="p-1.5 text-gray-400 hover:text-red-500 rounded" title="Delete">
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Create / Edit Event Modal ── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-8 px-4 z-50 overflow-y-auto" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mb-12" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900">{editingEvent ? 'Edit Event' : 'New Event'}</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 max-h-[75vh] overflow-y-auto">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                <input
                                    type="text"
                                    value={form.data.title}
                                    onChange={(e) => form.setData('title', e.target.value)}
                                    placeholder="Event title..."
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={form.data.description}
                                    onChange={(e) => form.setData('description', e.target.value)}
                                    placeholder="Event details..."
                                    rows={3}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    <input
                                        type="text"
                                        value={form.data.location}
                                        onChange={(e) => form.setData('location', e.target.value)}
                                        placeholder="Conference room, address..."
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        value={form.data.type}
                                        onChange={(e) => form.setData('type', e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                    >
                                        <option value="general">📅 General</option>
                                        <option value="meeting">🤝 Meeting</option>
                                        <option value="social">🎉 Social</option>
                                        <option value="training">🎓 Training</option>
                                        <option value="other">📌 Other</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Starts At *</label>
                                    <input
                                        type={form.data.is_all_day ? 'date' : 'datetime-local'}
                                        value={form.data.is_all_day ? toInputDate(form.data.starts_at) : form.data.starts_at}
                                        onChange={(e) => form.setData('starts_at', e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ends At</label>
                                    <input
                                        type={form.data.is_all_day ? 'date' : 'datetime-local'}
                                        value={form.data.is_all_day ? toInputDate(form.data.ends_at) : form.data.ends_at}
                                        onChange={(e) => form.setData('ends_at', e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                    />
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="flex flex-wrap gap-4">
                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={form.data.is_all_day}
                                        onChange={(e) => form.setData('is_all_day', e.target.checked)}
                                        className="rounded border-gray-300 text-[#495B67] focus:ring-[#495B67]"
                                    />
                                    All day event
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={form.data.is_recurring}
                                        onChange={(e) => form.setData('is_recurring', e.target.checked)}
                                        className="rounded border-gray-300 text-[#495B67] focus:ring-[#495B67]"
                                    />
                                    🔄 Recurring event
                                </label>
                            </div>

                            {/* Recurrence */}
                            {form.data.is_recurring && (
                                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Frequency</label>
                                        <select
                                            value={form.data.recurrence_rule}
                                            onChange={(e) => form.setData('recurrence_rule', e.target.value)}
                                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                        >
                                            <option value="">Select...</option>
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Until</label>
                                        <input
                                            type="date"
                                            value={form.data.recurrence_end}
                                            onChange={(e) => form.setData('recurrence_end', e.target.value)}
                                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Publish option (create only) */}
                            {!editingEvent && (
                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={form.data.publish_now}
                                        onChange={(e) => form.setData('publish_now', e.target.checked)}
                                        className="rounded border-gray-300 text-[#495B67] focus:ring-[#495B67]"
                                    />
                                    Publish immediately
                                </label>
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

                        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
                            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSubmit as any} disabled={form.processing} className="px-4 py-2 bg-[#495B67] text-white text-sm font-medium rounded-lg hover:bg-[#3a4a55] disabled:opacity-50 transition-colors">
                                {form.processing ? 'Saving...' : editingEvent ? 'Save Changes' : 'Create Event'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── View Event Modal ── */}
            {viewEvent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewEvent(null)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${statusColors[viewEvent.status]}`}>
                                    {viewEvent.status}
                                </span>
                                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-50 text-blue-600">
                                    {typeIcons[viewEvent.type]} {typeLabels[viewEvent.type]}
                                </span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">{viewEvent.title}</h2>
                        </div>
                        <div className="px-6 py-4 space-y-3">
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <span>🕐</span>
                                <span>
                                    {formatDate(viewEvent.starts_at)}
                                    {!viewEvent.is_all_day && ` at ${formatTime(viewEvent.starts_at)}`}
                                    {viewEvent.ends_at && ` — ${viewEvent.is_all_day ? formatDate(viewEvent.ends_at) : formatTime(viewEvent.ends_at)}`}
                                </span>
                            </div>
                            {viewEvent.location && (
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <span>📍</span> <span>{viewEvent.location}</span>
                                </div>
                            )}
                            {viewEvent.description && (
                                <div className="text-sm text-gray-700 whitespace-pre-wrap mt-2">{viewEvent.description}</div>
                            )}
                            <div className="flex items-center gap-4 text-sm bg-gray-50 rounded-lg p-3">
                                <span className="text-green-600">✅ {viewEvent.attending_count} attending</span>
                                <span className="text-yellow-600">🤔 {viewEvent.maybe_count} maybe</span>
                                <span className="text-red-500">❌ {viewEvent.declined_count} declined</span>
                            </div>
                            {viewEvent.is_recurring && (
                                <div className="text-xs text-purple-600 bg-purple-50 rounded-lg px-3 py-2">
                                    🔄 Recurs {viewEvent.recurrence_rule}{viewEvent.recurrence_end && ` until ${formatDate(viewEvent.recurrence_end)}`}
                                </div>
                            )}
                            <p className="text-xs text-gray-400">Created by {viewEvent.creator?.name ?? 'Unknown'}</p>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
                            <button onClick={() => { setViewEvent(null); openEdit(viewEvent); }} className="px-4 py-2 text-sm text-[#495B67] hover:bg-gray-100 rounded-lg">
                                ✏️ Edit
                            </button>
                            <button onClick={() => setViewEvent(null)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirm ── */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Event</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Are you sure you want to delete "<strong>{deleteConfirm.title}</strong>"? All RSVPs will be removed. This cannot be undone.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
