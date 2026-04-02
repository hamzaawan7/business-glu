import UserLayout from '@/Layouts/UserLayout';
import Icon from '@/Components/Icon';
import { Head, usePage, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

/* ═══ Types ══════════════════════════════════════════════ */

interface AttachmentData { name: string; url: string; type: string; size: number; }
interface CommentData { id: number; body: string; user: { id: number; name: string } | null; created_at: string; }

interface UpdateItem {
    feed_type: 'update';
    feed_date: string;
    id: number;
    title: string;
    body: string;
    cover_image: string | null;
    attachments: AttachmentData[];
    images: string[];
    youtube_url: string | null;
    type: string;
    category: string | null;
    is_pinned: boolean;
    is_popup: boolean;
    allow_comments: boolean;
    allow_reactions: boolean;
    published_at: string | null;
    creator: { id: number; name: string } | null;
    comments: CommentData[];
    comments_count: number;
    reaction_counts: Record<string, number>;
    my_reactions: string[];
    reactions_count: number;
    reads_count: number;
    is_read: boolean;
    created_at: string;
}

interface EventItem {
    feed_type: 'event';
    feed_date: string;
    id: number;
    title: string;
    description: string | null;
    location: string | null;
    type: string;
    starts_at: string;
    ends_at: string | null;
    is_all_day: boolean;
    is_recurring: boolean;
    creator: { id: number; name: string } | null;
    attending_count: number;
    my_rsvp: string | null;
    is_upcoming: boolean;
}

type FeedItem = UpdateItem | EventItem;

interface Props {
    pinnedItems: UpdateItem[];
    feedItems: FeedItem[];
    popupUpdate: UpdateItem | null;
}

/* ═══ Constants ══════════════════════════════════════════ */

const updateTypeIcons: Record<string, string> = { announcement: 'megaphone', news: 'newspaper', event: 'party-popper', poll: 'chart-bar' };
const updateTypeLabels: Record<string, string> = { announcement: 'Announcement', news: 'News', event: 'Event', poll: 'Poll' };
const updateTypeBadgeColors: Record<string, string> = {
    announcement: 'bg-red-50 text-red-700 border-red-100', news: 'bg-blue-50 text-blue-700 border-blue-100',
    event: 'bg-purple-50 text-purple-700 border-purple-100', poll: 'bg-amber-50 text-amber-700 border-amber-100',
};
const eventTypeIcons: Record<string, string> = { general: 'calendar', meeting: 'handshake', social: 'party-popper', training: 'academic-cap', other: 'pin' };
const eventTypeLabels: Record<string, string> = { general: 'General', meeting: 'Meeting', social: 'Social', training: 'Training', other: 'Other' };
const reactionIcons = ['hand-thumb-up', 'heart', 'face-smile', 'party-popper', 'face-surprised', 'face-frown'];

/* ═══ Helpers ════════════════════════════════════════════ */

function timeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatSize(b: number): string {
    return b < 1024 ? `${b}B` : b < 1048576 ? `${(b / 1024).toFixed(1)}KB` : `${(b / 1048576).toFixed(1)}MB`;
}

function getYoutubeEmbedUrl(url: string): string | null {
    try {
        const u = new URL(url);
        let vid = u.searchParams.get('v');
        if (!vid && u.hostname === 'youtu.be') vid = u.pathname.slice(1);
        return vid ? `https://www.youtube.com/embed/${vid}` : null;
    } catch { return null; }
}

function formatEventDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatEventTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function daysUntil(dateStr: string): string {
    const now = new Date();
    const d = new Date(dateStr);
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff < 0) return formatEventDate(dateStr);
    if (diff < 7) return `In ${diff} days`;
    return formatEventDate(dateStr);
}

/* ═══ Component ══════════════════════════════════════════ */

export default function UserFeed({ pinnedItems, feedItems, popupUpdate: initialPopup }: Props) {
    const page = usePage();
    const flash = (page.props as any).flash ?? {};
    const currentUser = (page.props as any).auth?.user;

    const [expandedPost, setExpandedPost] = useState<number | null>(null);
    const [commentText, setCommentText] = useState<Record<number, string>>({});
    const [submittingComment, setSubmittingComment] = useState<number | null>(null);
    const [showReactionPicker, setShowReactionPicker] = useState<number | null>(null);
    const [popupUpdate, setPopupUpdate] = useState<UpdateItem | null>(initialPopup);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [feedFilter, setFeedFilter] = useState<'all' | 'updates' | 'events'>('all');
    const reactionPickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target as Node)) {
                setShowReactionPicker(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    /* ─── Actions ────────────────────────────────────────── */
    function markAsRead(updateId: number) { router.post(`/updates/${updateId}/read`, {}, { preserveScroll: true }); }

    function toggleComments(updateId: number) {
        if (expandedPost === updateId) { setExpandedPost(null); return; }
        setExpandedPost(updateId);
        const update = [...pinnedItems, ...feedItems].find(i => i.feed_type === 'update' && i.id === updateId) as UpdateItem | undefined;
        if (update && !update.is_read) markAsRead(updateId);
    }

    function submitComment(updateId: number) {
        const body = commentText[updateId]?.trim();
        if (!body) return;
        setSubmittingComment(updateId);
        router.post(`/updates/${updateId}/comment`, { body }, {
            preserveScroll: true,
            onFinish: () => { setSubmittingComment(null); setCommentText(prev => ({ ...prev, [updateId]: '' })); },
        });
    }

    function deleteComment(commentId: number) {
        if (!confirm('Delete this comment?')) return;
        router.delete(`/updates/comments/${commentId}`, { preserveScroll: true });
    }

    function toggleReaction(updateId: number, emoji: string) {
        router.post(`/updates/${updateId}/react`, { emoji }, { preserveScroll: true });
        setShowReactionPicker(null);
    }

    function handleRsvp(eventId: number, status: string) {
        router.post(`/events/${eventId}/rsvp`, { status }, { preserveScroll: true });
    }

    function dismissPopup() {
        if (popupUpdate) { markAsRead(popupUpdate.id); setPopupUpdate(null); }
    }

    /* ─── Filtered feed ──────────────────────────────────── */
    const filteredFeed = feedFilter === 'all'
        ? feedItems
        : feedItems.filter(item => item.feed_type === (feedFilter === 'updates' ? 'update' : 'event'));

    /* ─── Render: Update Card ────────────────────────────── */
    function renderUpdateCard(update: UpdateItem) {
        const isExpanded = expandedPost === update.id;
        const reactionEntries = Object.entries(update.reaction_counts || {});
        const embedUrl = update.youtube_url ? getYoutubeEmbedUrl(update.youtube_url) : null;

        return (
            <div key={`update-${update.id}`}
                className={`bg-white rounded-2xl shadow-sm border transition-all duration-200 overflow-hidden ${
                    update.is_read ? 'border-gray-200' : 'border-l-4 border-l-[#495B67] border-t-gray-200 border-r-gray-200 border-b-gray-200'
                }`}>

                {/* Cover image */}
                {update.cover_image && (
                    <div className="h-52 overflow-hidden cursor-pointer" onClick={() => setLightboxImage(update.cover_image)}>
                        <img src={update.cover_image} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                )}

                {/* Header */}
                <div className="p-5 pb-3">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#495B67] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                            {update.creator ? getInitials(update.creator.name) : '??'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-gray-900 text-sm">{update.creator?.name ?? 'Unknown'}</span>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full border ${updateTypeBadgeColors[update.type] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                                    <Icon name={updateTypeIcons[update.type]} className="w-3 h-3" /> {updateTypeLabels[update.type] || update.type}
                                </span>
                                {update.category && (
                                    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full bg-purple-50 text-purple-600 border border-purple-100">
                                        {update.category}
                                    </span>
                                )}
                                {update.is_pinned && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                                        <Icon name="pin" className="w-3 h-3" /> Pinned
                                    </span>
                                )}
                                {!update.is_read && <span className="inline-block w-2 h-2 rounded-full bg-[#495B67]" title="Unread" />}
                            </div>
                            <span className="text-xs text-gray-400 mt-0.5 block">
                                {update.published_at ? timeAgo(update.published_at) : timeAgo(update.created_at)}
                            </span>
                        </div>
                        {!update.is_read && (
                            <button onClick={() => markAsRead(update.id)}
                                className="text-[10px] text-[#495B67] hover:text-[#3a4a55] font-semibold flex-shrink-0 flex items-center gap-1 bg-[#495B67]/5 px-2 py-1 rounded-lg">
                                <Icon name="check" className="w-3 h-3" /> Read
                            </button>
                        )}
                    </div>

                    {/* Title & Body */}
                    <div className="mt-3">
                        <h3 className="text-base font-bold text-gray-900">{update.title}</h3>
                        <div className="mt-2 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{update.body}</div>
                    </div>

                    {/* YouTube embed */}
                    {embedUrl && (
                        <div className="mt-3 aspect-video rounded-xl overflow-hidden bg-black">
                            <iframe src={embedUrl} className="w-full h-full" allowFullScreen title="YouTube video"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                        </div>
                    )}

                    {/* Image gallery */}
                    {update.images.length > 0 && (
                        <div className={`mt-3 grid gap-2 ${
                            update.images.length === 1 ? 'grid-cols-1' :
                            update.images.length === 2 ? 'grid-cols-2' :
                            update.images.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'
                        }`}>
                            {update.images.map((img, i) => (
                                <div key={i} className="cursor-pointer rounded-xl overflow-hidden" onClick={() => setLightboxImage(img)}>
                                    <img src={img} alt="" className={`w-full object-cover hover:scale-105 transition-transform duration-300 ${
                                        update.images.length === 1 ? 'max-h-72' : 'h-32'
                                    }`} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* File attachments */}
                    {update.attachments.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                            {update.attachments.map((att, i) => (
                                <a key={i} href={att.url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs text-[#495B67] bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 hover:bg-gray-100 transition">
                                    <Icon name="paperclip" className="w-4 h-4" /> <span className="font-medium">{att.name}</span>
                                    <span className="text-gray-400 ml-auto">{formatSize(att.size)}</span>
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                {/* Reactions bar */}
                {reactionEntries.length > 0 && (
                    <div className="px-5 pb-2 flex flex-wrap gap-1.5">
                        {reactionEntries.map(([reactionKey, count]) => (
                            <button key={reactionKey} onClick={() => update.allow_reactions && toggleReaction(update.id, reactionKey)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition-colors ${
                                    update.my_reactions.includes(reactionKey)
                                        ? 'bg-[#495B67]/10 border-[#495B67]/30 text-[#495B67]'
                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                } ${!update.allow_reactions ? 'cursor-default opacity-60' : 'cursor-pointer'}`}
                                disabled={!update.allow_reactions}>
                                <Icon name={reactionKey} className="w-3.5 h-3.5" /><span className="font-semibold">{count}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Action bar */}
                <div className="px-5 py-2.5 border-t border-gray-100 flex items-center gap-1">
                    {update.allow_reactions && (
                        <div className="relative" ref={showReactionPicker === update.id ? reactionPickerRef : null}>
                            <button onClick={() => setShowReactionPicker(showReactionPicker === update.id ? null : update.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                                <Icon name="face-smile" className="w-4 h-4" /> React
                            </button>
                            {showReactionPicker === update.id && (
                                <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg p-2 flex gap-1 z-50">
                                    {reactionIcons.map(iconName => (
                                        <button key={iconName} onClick={() => toggleReaction(update.id, iconName)}
                                            className={`w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors ${
                                                update.my_reactions.includes(iconName) ? 'bg-[#495B67]/10 ring-1 ring-[#495B67]/30' : ''
                                            }`}><Icon name={iconName} className="w-5 h-5" /></button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {update.allow_comments && (
                        <button onClick={() => toggleComments(update.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                isExpanded ? 'bg-[#495B67]/10 text-[#495B67]' : 'text-gray-500 hover:bg-gray-100'
                            }`}>
                            <Icon name="chat-bubble" className="w-3.5 h-3.5" />
                            {update.comments_count > 0 ? `${update.comments_count} Comment${update.comments_count !== 1 ? 's' : ''}` : 'Comment'}
                        </button>
                    )}
                    <div className="ml-auto text-[10px] text-gray-400 font-medium">{update.reads_count} read{update.reads_count !== 1 ? 's' : ''}</div>
                </div>

                {/* Comments section */}
                {isExpanded && update.allow_comments && (
                    <div className="border-t border-gray-100 bg-gray-50/50">
                        {update.comments.length > 0 && (
                            <div className="px-5 pt-3 space-y-3">
                                {update.comments.map(comment => (
                                    <div key={comment.id} className="flex gap-2.5">
                                        <div className="w-7 h-7 rounded-full bg-[#71858E] text-white flex items-center justify-center text-[10px] font-semibold flex-shrink-0 mt-0.5">
                                            {comment.user ? getInitials(comment.user.name) : '??'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="bg-white rounded-xl px-3 py-2 border border-gray-100">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold text-gray-900">{comment.user?.name ?? 'Unknown'}</span>
                                                    <span className="text-[10px] text-gray-400">{timeAgo(comment.created_at)}</span>
                                                </div>
                                                <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap">{comment.body}</p>
                                            </div>
                                            {currentUser && comment.user?.id === currentUser.id && (
                                                <button onClick={() => deleteComment(comment.id)}
                                                    className="text-[10px] text-gray-400 hover:text-red-500 mt-0.5 ml-3">Delete</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="p-4 flex gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#495B67] text-white flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                                {currentUser ? getInitials(currentUser.name) : '??'}
                            </div>
                            <div className="flex-1 flex gap-2">
                                <input type="text" value={commentText[update.id] || ''}
                                    onChange={(e) => setCommentText(prev => ({ ...prev, [update.id]: e.target.value }))}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(update.id); } }}
                                    placeholder="Write a comment..."
                                    className="flex-1 rounded-xl border border-gray-200 px-3 py-1.5 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67] bg-white"
                                    disabled={submittingComment === update.id} />
                                <button onClick={() => submitComment(update.id)}
                                    disabled={submittingComment === update.id || !(commentText[update.id]?.trim())}
                                    className="px-3 py-1.5 bg-[#495B67] text-white text-xs font-semibold rounded-xl hover:bg-[#3a4a55] disabled:opacity-50 transition-colors">
                                    {submittingComment === update.id ? '...' : 'Post'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    /* ─── Render: Event Card ─────────────────────────────── */
    function renderEventCard(event: EventItem) {
        const startDate = new Date(event.starts_at);
        const monthShort = startDate.toLocaleDateString('en-US', { month: 'short' });
        const dayNum = startDate.getDate();

        return (
            <div key={`event-${event.id}`}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md">

                {/* Colored top bar */}
                <div className={`h-1.5 ${event.is_upcoming ? 'bg-gradient-to-r from-[#495B67] to-[#71858E]' : 'bg-gray-300'}`} />

                <div className="p-5">
                    <div className="flex gap-4">
                        {/* Date block */}
                        <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center ${
                            event.is_upcoming ? 'bg-[#495B67]/10 text-[#495B67]' : 'bg-gray-100 text-gray-400'
                        }`}>
                            <span className="text-[10px] font-bold uppercase leading-none">{monthShort}</span>
                            <span className="text-xl font-black leading-tight">{dayNum}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                            {/* Event type badge + timing */}
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[#495B67]/10 text-[#495B67] border border-[#495B67]/20">
                                    <Icon name={eventTypeIcons[event.type] || 'calendar'} className="w-3 h-3" />
                                    {eventTypeLabels[event.type] || 'Event'}
                                </span>
                                {event.is_upcoming && (
                                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                        {daysUntil(event.starts_at)}
                                    </span>
                                )}
                                {!event.is_upcoming && (
                                    <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">Past</span>
                                )}
                                {event.is_recurring && (
                                    <span className="text-[10px] text-gray-400">
                                        <Icon name="arrow-path" className="w-3 h-3 inline-block" /> Recurring
                                    </span>
                                )}
                            </div>

                            <h3 className="text-base font-bold text-gray-900">{event.title}</h3>

                            {/* Time & location */}
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Icon name="clock" className="w-3.5 h-3.5" />
                                    {event.is_all_day ? 'All Day' : (
                                        <>
                                            {formatEventTime(event.starts_at)}
                                            {event.ends_at && ` – ${formatEventTime(event.ends_at)}`}
                                        </>
                                    )}
                                </span>
                                {event.location && (
                                    <span className="flex items-center gap-1">
                                        <Icon name="map-pin" className="w-3.5 h-3.5" /> {event.location}
                                    </span>
                                )}
                            </div>

                            {event.description && (
                                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{event.description}</p>
                            )}

                            {/* Creator & attendance */}
                            <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                                {event.creator && (
                                    <span className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 rounded-full bg-[#495B67] text-white flex items-center justify-center text-[8px] font-bold">
                                            {getInitials(event.creator.name)}
                                        </div>
                                        {event.creator.name}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Icon name="user-group" className="w-3.5 h-3.5" /> {event.attending_count} attending
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* RSVP buttons */}
                    {event.is_upcoming && (
                        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                            {(['attending', 'maybe', 'declined'] as const).map(status => {
                                const isActive = event.my_rsvp === status;
                                const configs = {
                                    attending: { label: 'Attending', icon: 'check-circle', activeClass: 'bg-emerald-500 text-white border-emerald-500', inactiveClass: 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-600' },
                                    maybe:    { label: 'Maybe', icon: 'question-mark-circle', activeClass: 'bg-amber-500 text-white border-amber-500', inactiveClass: 'bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-600' },
                                    declined: { label: 'Decline', icon: 'x-circle', activeClass: 'bg-gray-400 text-white border-gray-400', inactiveClass: 'bg-white text-gray-600 border-gray-200 hover:border-gray-400' },
                                };
                                const cfg = configs[status];
                                return (
                                    <button key={status} onClick={() => handleRsvp(event.id, status)}
                                        className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                                            isActive ? cfg.activeClass : cfg.inactiveClass
                                        }`}>
                                        <Icon name={cfg.icon} className="w-3.5 h-3.5" /> {cfg.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    /* ─── Main Render ────────────────────────────────────── */
    const totalUpdates = pinnedItems.length + feedItems.filter(i => i.feed_type === 'update').length;
    const totalEvents = feedItems.filter(i => i.feed_type === 'event').length;

    return (
        <UserLayout>
            <Head title="Feed" />

            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="mb-5">
                    <h1 className="text-2xl font-bold text-gray-900">Feed</h1>
                    <p className="text-sm text-gray-500 mt-1">Updates, events, and everything happening in your organization</p>
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl mb-5">
                    {([
                        { key: 'all' as const, label: 'All', count: pinnedItems.length + feedItems.length },
                        { key: 'updates' as const, label: 'Updates', count: totalUpdates, icon: 'megaphone' },
                        { key: 'events' as const, label: 'Events', count: totalEvents, icon: 'calendar' },
                    ]).map(tab => (
                        <button key={tab.key} onClick={() => setFeedFilter(tab.key)}
                            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                                feedFilter === tab.key
                                    ? 'bg-white text-[#495B67] shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}>
                            {tab.icon && <Icon name={tab.icon} className="w-3.5 h-3.5" />}
                            {tab.label}
                            <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                                feedFilter === tab.key ? 'bg-[#495B67]/10 text-[#495B67]' : 'bg-gray-200 text-gray-500'
                            }`}>{tab.count}</span>
                        </button>
                    ))}
                </div>

                {flash.success && (
                    <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
                        <Icon name="check-circle" className="w-4 h-4" /> {flash.success}
                    </div>
                )}

                {/* Empty state */}
                {pinnedItems.length === 0 && filteredFeed.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Icon name="inbox" className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-1">
                            {feedFilter === 'all' ? 'Nothing in your feed yet' :
                             feedFilter === 'updates' ? 'No updates yet' : 'No events yet'}
                        </h3>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto">
                            {feedFilter === 'all'
                                ? 'When your team posts updates or creates events, they\'ll appear here.'
                                : feedFilter === 'updates'
                                ? 'Company updates and announcements will show up here.'
                                : 'Upcoming meetings, socials, and company events will appear here.'}
                        </p>
                    </div>
                )}

                {/* Feed content */}
                <div className="space-y-4">
                    {/* Pinned updates always show at top */}
                    {(feedFilter === 'all' || feedFilter === 'updates') && pinnedItems.length > 0 && (
                        <>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                                <Icon name="pin" className="w-3.5 h-3.5" /> Pinned
                            </div>
                            {pinnedItems.map(u => renderUpdateCard(u))}
                            {filteredFeed.length > 0 && (
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-1">
                                    <Icon name="clock" className="w-3.5 h-3.5" /> Recent
                                </div>
                            )}
                        </>
                    )}

                    {/* Main feed */}
                    {filteredFeed.map(item =>
                        item.feed_type === 'update'
                            ? renderUpdateCard(item as UpdateItem)
                            : renderEventCard(item as EventItem)
                    )}
                </div>
            </div>

            {/* Popup overlay for must-acknowledge updates */}
            {popupUpdate && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
                        {popupUpdate.cover_image && (
                            <div className="h-40 overflow-hidden">
                                <img src={popupUpdate.cover_image} alt="" className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div className="bg-[#495B67] px-6 py-4">
                            <div className="flex items-center gap-2 text-white">
                                <Icon name={updateTypeIcons[popupUpdate.type] || 'megaphone'} className="w-5 h-5" />
                                <span className="text-xs font-semibold uppercase tracking-wider opacity-80">{updateTypeLabels[popupUpdate.type] || 'Update'}</span>
                            </div>
                            <h2 className="text-lg font-bold text-white mt-1">{popupUpdate.title}</h2>
                            <p className="text-xs text-white/60 mt-1">
                                By {popupUpdate.creator?.name ?? 'Unknown'} · {popupUpdate.published_at ? timeAgo(popupUpdate.published_at) : timeAgo(popupUpdate.created_at)}
                            </p>
                        </div>
                        <div className="px-6 py-4 max-h-64 overflow-y-auto">
                            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{popupUpdate.body}</div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                            <button onClick={dismissPopup}
                                className="px-5 py-2 bg-[#495B67] text-white text-sm font-semibold rounded-xl hover:bg-[#3a4a55] transition-colors flex items-center gap-1.5">
                                Got it <Icon name="check" className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image lightbox */}
            {lightboxImage && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 cursor-pointer" onClick={() => setLightboxImage(null)}>
                    <img src={lightboxImage} alt="" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" />
                    <button className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 transition">&times;</button>
                </div>
            )}
        </UserLayout>
    );
}
