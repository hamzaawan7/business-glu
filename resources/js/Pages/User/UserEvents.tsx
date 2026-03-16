import UserLayout from '@/Layouts/UserLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { useState } from 'react';

interface EventData {
    id: number;
    title: string;
    description: string | null;
    location: string | null;
    type: string;
    starts_at: string;
    ends_at: string | null;
    is_all_day: boolean;
    is_recurring: boolean;
    recurrence_rule: string | null;
    creator: { id: number; name: string } | null;
    attending_count: number;
    my_rsvp: string | null;
}

interface Props {
    upcomingEvents: EventData[];
    pastEvents: EventData[];
}

const typeIcons: Record<string, string> = {
    general: '📅', meeting: '🤝', social: '🎉', training: '🎓', other: '📌',
};

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function daysUntil(dateStr: string): string {
    const now = new Date();
    const d = new Date(dateStr);
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff < 7) return `In ${diff} days`;
    return formatDate(dateStr);
}

export default function UserEvents({ upcomingEvents, pastEvents }: Props) {
    const page = usePage();
    const flash = (page.props as any).flash ?? {};
    const [viewEvent, setViewEvent] = useState<EventData | null>(null);

    function handleRsvp(eventId: number, status: string) {
        router.post(`/events/${eventId}/rsvp`, { status }, { preserveScroll: true });
    }

    const rsvpColors: Record<string, string> = {
        attending: 'bg-green-500 text-white',
        maybe: 'bg-yellow-400 text-white',
        declined: 'bg-gray-300 text-gray-700',
    };

    return (
        <UserLayout>
            <Head title="Events" />

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Events</h1>
                    <p className="text-sm text-gray-500 mt-1">Upcoming company events and gatherings</p>
                </div>

                {/* Flash */}
                {flash.success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{flash.success}</div>
                )}

                {/* No events */}
                {upcomingEvents.length === 0 && pastEvents.length === 0 && (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-3">📅</div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-1">No events yet</h3>
                        <p className="text-sm text-gray-500">When events are created, they'll appear here.</p>
                    </div>
                )}

                {/* Upcoming Events */}
                {upcomingEvents.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#495B67] uppercase tracking-wider mb-3">
                            🔜 Upcoming ({upcomingEvents.length})
                        </div>
                        <div className="space-y-3">
                            {upcomingEvents.map(event => (
                                <div
                                    key={event.id}
                                    className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-all"
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Date badge */}
                                        <div className="w-12 h-12 rounded-xl bg-[#495B67]/10 flex flex-col items-center justify-center flex-shrink-0">
                                            <span className="text-[9px] font-semibold text-[#495B67] uppercase leading-none">
                                                {new Date(event.starts_at).toLocaleDateString('en-US', { month: 'short' })}
                                            </span>
                                            <span className="text-lg font-bold text-[#495B67] leading-tight">
                                                {new Date(event.starts_at).getDate()}
                                            </span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <button
                                                onClick={() => setViewEvent(event)}
                                                className="font-semibold text-gray-900 text-sm text-left hover:text-[#495B67]"
                                            >
                                                {event.title}
                                            </button>
                                            <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400 flex-wrap">
                                                <span>{typeIcons[event.type]} {event.type}</span>
                                                <span>{event.is_all_day ? 'All day' : formatTime(event.starts_at)}</span>
                                                {event.location && <span>📍 {event.location}</span>}
                                                <span>✅ {event.attending_count} going</span>
                                                <span className="text-[#495B67] font-medium">{daysUntil(event.starts_at)}</span>
                                            </div>

                                            {/* RSVP buttons */}
                                            <div className="flex gap-2 mt-2">
                                                {(['attending', 'maybe', 'declined'] as const).map(status => (
                                                    <button
                                                        key={status}
                                                        onClick={() => handleRsvp(event.id, status)}
                                                        className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                                                            event.my_rsvp === status
                                                                ? rsvpColors[status]
                                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        {status === 'attending' ? '✅ Going' : status === 'maybe' ? '🤔 Maybe' : '❌ Can\'t go'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Past Events */}
                {pastEvents.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                            📋 Past Events ({pastEvents.length})
                        </div>
                        <div className="space-y-3">
                            {pastEvents.map(event => (
                                <div key={event.id} className="bg-white rounded-xl border border-gray-200 p-4 opacity-60">
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex flex-col items-center justify-center flex-shrink-0">
                                            <span className="text-[9px] font-semibold text-gray-400 uppercase leading-none">
                                                {new Date(event.starts_at).toLocaleDateString('en-US', { month: 'short' })}
                                            </span>
                                            <span className="text-lg font-bold text-gray-400 leading-tight">
                                                {new Date(event.starts_at).getDate()}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-gray-700 text-sm">{event.title}</h3>
                                            <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                                                <span>{formatDate(event.starts_at)}</span>
                                                {event.location && <span>📍 {event.location}</span>}
                                                <span>✅ {event.attending_count} attended</span>
                                                {event.my_rsvp && (
                                                    <span className="text-[#495B67] font-medium">
                                                        You: {event.my_rsvp}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Event Detail Modal ── */}
            {viewEvent && (
                <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={() => setViewEvent(null)}>
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{typeIcons[viewEvent.type]}</span>
                                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-600">{viewEvent.type}</span>
                                </div>
                                <button onClick={() => setViewEvent(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mt-2">{viewEvent.title}</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <span>🗓️</span>
                                    <span>
                                        {formatDate(viewEvent.starts_at)}
                                        {!viewEvent.is_all_day && ` at ${formatTime(viewEvent.starts_at)}`}
                                        {viewEvent.ends_at && ` — ${viewEvent.is_all_day ? formatDate(viewEvent.ends_at) : formatTime(viewEvent.ends_at)}`}
                                    </span>
                                </div>
                                {viewEvent.location && (
                                    <div className="flex items-center gap-2">
                                        <span>📍</span> <span>{viewEvent.location}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <span>👤</span> <span>Organized by {viewEvent.creator?.name ?? 'Unknown'}</span>
                                </div>
                            </div>

                            {viewEvent.description && (
                                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {viewEvent.description}
                                </div>
                            )}

                            <div className="bg-gray-50 rounded-lg p-3 text-sm">
                                <span className="text-green-600">✅ {viewEvent.attending_count} attending</span>
                            </div>

                            {/* RSVP in modal */}
                            <div>
                                <p className="text-xs font-medium text-gray-500 mb-2">Your RSVP:</p>
                                <div className="flex gap-2">
                                    {(['attending', 'maybe', 'declined'] as const).map(status => (
                                        <button
                                            key={status}
                                            onClick={() => { handleRsvp(viewEvent.id, status); setViewEvent(null); }}
                                            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                                                viewEvent.my_rsvp === status
                                                    ? rsvpColors[status]
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {status === 'attending' ? '✅ Going' : status === 'maybe' ? '🤔 Maybe' : '❌ Can\'t go'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </UserLayout>
    );
}
