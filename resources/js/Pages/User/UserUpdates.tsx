import UserLayout from '@/Layouts/UserLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

interface AttachmentData { name: string; url: string; type: string; size: number; }
interface CommentData { id: number; body: string; user: { id: number; name: string } | null; created_at: string; }

interface UpdateData {
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

interface Props { updates: UpdateData[]; }

const typeIcons: Record<string, string> = { announcement: '📢', news: '📰', event: '🎉', poll: '📊' };
const typeLabels: Record<string, string> = { announcement: 'Announcement', news: 'News', event: 'Event', poll: 'Poll' };
const typeBadgeColors: Record<string, string> = {
    announcement: 'bg-red-100 text-red-700', news: 'bg-blue-100 text-blue-700',
    event: 'bg-purple-100 text-purple-700', poll: 'bg-amber-100 text-amber-700',
};
const reactionEmojis = ['👍', '❤️', '��', '🎉', '😮', '😢'];

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

export default function UserUpdates({ updates }: Props) {
    const page = usePage();
    const flash = (page.props as any).flash ?? {};
    const currentUser = (page.props as any).auth?.user;

    const [expandedPost, setExpandedPost] = useState<number | null>(null);
    const [commentText, setCommentText] = useState<Record<number, string>>({});
    const [submittingComment, setSubmittingComment] = useState<number | null>(null);
    const [showReactionPicker, setShowReactionPicker] = useState<number | null>(null);
    const [popupUpdate, setPopupUpdate] = useState<UpdateData | null>(null);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const reactionPickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unreadPopup = updates.find(u => u.is_popup && !u.is_read);
        if (unreadPopup) setPopupUpdate(unreadPopup);
    }, [updates]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target as Node)) {
                setShowReactionPicker(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function markAsRead(updateId: number) { router.post(`/updates/${updateId}/read`, {}, { preserveScroll: true }); }

    function toggleComments(updateId: number) {
        if (expandedPost === updateId) { setExpandedPost(null); return; }
        setExpandedPost(updateId);
        const update = updates.find(u => u.id === updateId);
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

    function dismissPopup() {
        if (popupUpdate) { markAsRead(popupUpdate.id); setPopupUpdate(null); }
    }

    const pinnedUpdates = updates.filter(u => u.is_pinned);
    const regularUpdates = updates.filter(u => !u.is_pinned);

    function renderUpdateCard(update: UpdateData) {
        const isExpanded = expandedPost === update.id;
        const reactionEntries = Object.entries(update.reaction_counts || {});
        const embedUrl = update.youtube_url ? getYoutubeEmbedUrl(update.youtube_url) : null;

        return (
            <div key={update.id}
                className={`bg-white rounded-xl shadow-sm border transition-all duration-200 ${
                    update.is_read ? 'border-gray-200' : 'border-l-4 border-l-[#495B67] border-t-gray-200 border-r-gray-200 border-b-gray-200'
                }`}>
                {/* Cover image */}
                {update.cover_image && (
                    <div className="h-48 overflow-hidden rounded-t-xl cursor-pointer" onClick={() => setLightboxImage(update.cover_image)}>
                        <img src={update.cover_image} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                )}

                {/* Header */}
                <div className="p-5 pb-3">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#495B67] text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                            {update.creator ? getInitials(update.creator.name) : '??'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-gray-900 text-sm">{update.creator?.name ?? 'Unknown'}</span>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${typeBadgeColors[update.type] || 'bg-gray-100 text-gray-600'}`}>
                                    {typeIcons[update.type]} {typeLabels[update.type] || update.type}
                                </span>
                                {update.category && (
                                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-purple-50 text-purple-600">
                                        {update.category}
                                    </span>
                                )}
                                {update.is_pinned && <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">📌 Pinned</span>}
                                {!update.is_read && <span className="inline-block w-2 h-2 rounded-full bg-[#495B67]" title="Unread" />}
                            </div>
                            <span className="text-xs text-gray-500 mt-0.5 block">
                                {update.published_at ? timeAgo(update.published_at) : timeAgo(update.created_at)}
                            </span>
                        </div>
                        {!update.is_read && (
                            <button onClick={() => markAsRead(update.id)}
                                className="text-xs text-[#495B67] hover:text-[#3a4a55] font-medium flex-shrink-0" title="Mark as read">✓ Read</button>
                        )}
                    </div>

                    {/* Title & Body */}
                    <div className="mt-3">
                        <h3 className="text-base font-semibold text-gray-900">{update.title}</h3>
                        <div className="mt-2 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{update.body}</div>
                    </div>

                    {/* YouTube embed */}
                    {embedUrl && (
                        <div className="mt-3 aspect-video rounded-lg overflow-hidden bg-black">
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
                                <div key={i} className="cursor-pointer rounded-lg overflow-hidden" onClick={() => setLightboxImage(img)}>
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
                                    className="flex items-center gap-2 text-xs text-[#495B67] bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-100 transition">
                                    📎 <span className="font-medium">{att.name}</span>
                                    <span className="text-gray-400 ml-auto">{formatSize(att.size)}</span>
                                    <span className="text-[#495B67] font-medium">↓</span>
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                {/* Reactions bar */}
                {reactionEntries.length > 0 && (
                    <div className="px-5 pb-2 flex flex-wrap gap-1.5">
                        {reactionEntries.map(([emoji, count]) => (
                            <button key={emoji} onClick={() => update.allow_reactions && toggleReaction(update.id, emoji)}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-colors ${
                                    update.my_reactions.includes(emoji) ? 'bg-[#495B67]/10 border-[#495B67]/30 text-[#495B67]' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                } ${!update.allow_reactions ? 'cursor-default opacity-60' : 'cursor-pointer'}`}
                                disabled={!update.allow_reactions}>
                                <span>{emoji}</span><span className="font-medium">{count}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Action bar */}
                <div className="px-5 py-2.5 border-t border-gray-100 flex items-center gap-1">
                    {update.allow_reactions && (
                        <div className="relative" ref={showReactionPicker === update.id ? reactionPickerRef : null}>
                            <button onClick={() => setShowReactionPicker(showReactionPicker === update.id ? null : update.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                😀 React
                            </button>
                            {showReactionPicker === update.id && (
                                <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg p-2 flex gap-1 z-50">
                                    {reactionEmojis.map(emoji => (
                                        <button key={emoji} onClick={() => toggleReaction(update.id, emoji)}
                                            className={`w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-lg ${
                                                update.my_reactions.includes(emoji) ? 'bg-[#495B67]/10 ring-1 ring-[#495B67]/30' : ''
                                            }`}>{emoji}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {update.allow_comments && (
                        <button onClick={() => toggleComments(update.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                isExpanded ? 'bg-[#495B67]/10 text-[#495B67]' : 'text-gray-600 hover:bg-gray-100'
                            }`}>
                            💬 {update.comments_count > 0 ? `${update.comments_count} Comment${update.comments_count !== 1 ? 's' : ''}` : 'Comment'}
                        </button>
                    )}
                    <div className="ml-auto text-xs text-gray-400">{update.reads_count} read{update.reads_count !== 1 ? 's' : ''}</div>
                </div>

                {/* Comments section */}
                {isExpanded && update.allow_comments && (
                    <div className="border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
                        {update.comments.length > 0 && (
                            <div className="px-5 pt-3 space-y-3">
                                {update.comments.map(comment => (
                                    <div key={comment.id} className="flex gap-2.5">
                                        <div className="w-7 h-7 rounded-full bg-[#71858E] text-white flex items-center justify-center text-[10px] font-medium flex-shrink-0 mt-0.5">
                                            {comment.user ? getInitials(comment.user.name) : '??'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="bg-white rounded-lg px-3 py-2 border border-gray-100">
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
                            <div className="w-7 h-7 rounded-full bg-[#495B67] text-white flex items-center justify-center text-[10px] font-medium flex-shrink-0">
                                {currentUser ? getInitials(currentUser.name) : '??'}
                            </div>
                            <div className="flex-1 flex gap-2">
                                <input type="text" value={commentText[update.id] || ''}
                                    onChange={(e) => setCommentText(prev => ({ ...prev, [update.id]: e.target.value }))}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(update.id); } }}
                                    placeholder="Write a comment..."
                                    className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67] bg-white"
                                    disabled={submittingComment === update.id} />
                                <button onClick={() => submitComment(update.id)}
                                    disabled={submittingComment === update.id || !(commentText[update.id]?.trim())}
                                    className="px-3 py-1.5 bg-[#495B67] text-white text-xs font-medium rounded-lg hover:bg-[#3a4a55] disabled:opacity-50 transition-colors">
                                    {submittingComment === update.id ? '...' : 'Post'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <UserLayout>
            <Head title="Updates" />
            <div className="max-w-2xl mx-auto px-4 py-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Updates</h1>
                    <p className="text-sm text-gray-500 mt-1">Stay informed with the latest from your team</p>
                </div>
                {flash.success && <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{flash.success}</div>}

                {updates.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-3">📭</div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-1">No updates yet</h3>
                        <p className="text-sm text-gray-500">When your team posts updates, they'll appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pinnedUpdates.length > 0 && (
                            <>
                                <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider">
                                    <span>📌</span> Pinned
                                </div>
                                {pinnedUpdates.map(u => renderUpdateCard(u))}
                                {regularUpdates.length > 0 && (
                                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">Recent</div>
                                )}
                            </>
                        )}
                        {regularUpdates.map(u => renderUpdateCard(u))}
                    </div>
                )}
            </div>

            {/* Popup overlay */}
            {popupUpdate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
                        {popupUpdate.cover_image && (
                            <div className="h-40 overflow-hidden">
                                <img src={popupUpdate.cover_image} alt="" className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div className="bg-[#495B67] px-6 py-4">
                            <div className="flex items-center gap-2 text-white">
                                <span className="text-xl">{typeIcons[popupUpdate.type] || '📢'}</span>
                                <span className="text-xs font-medium uppercase tracking-wider opacity-80">{typeLabels[popupUpdate.type] || 'Update'}</span>
                            </div>
                            <h2 className="text-lg font-bold text-white mt-1">{popupUpdate.title}</h2>
                            <p className="text-xs text-white/60 mt-1">
                                By {popupUpdate.creator?.name ?? 'Unknown'} • {popupUpdate.published_at ? timeAgo(popupUpdate.published_at) : timeAgo(popupUpdate.created_at)}
                            </p>
                        </div>
                        <div className="px-6 py-4 max-h-64 overflow-y-auto">
                            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{popupUpdate.body}</div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                            <button onClick={dismissPopup}
                                className="px-5 py-2 bg-[#495B67] text-white text-sm font-medium rounded-lg hover:bg-[#3a4a55] transition-colors">
                                Got it ✓
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
