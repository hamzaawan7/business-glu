import UserLayout from '@/Layouts/UserLayout';
import Icon from '@/Components/Icon';
import { Head, router, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef, useCallback } from 'react';

interface User {
    id: number;
    name: string;
    avatar_url: string | null;
    department: string | null;
    position: string | null;
}

interface MessageData {
    id: number;
    body: string;
    type: string;
    file_path: string | null;
    file_name: string | null;
    file_size: number | null;
    reply_to: { id: number; body: string; user_name: string | null } | null;
    user: { id: number; name: string; avatar_url: string | null };
    edited_at: string | null;
    created_at: string;
}

interface Conversation {
    id: number;
    type: string;
    name: string | null;
    participants: User[];
    latest_message: { id: number; body: string; user_name: string | null; created_at: string } | null;
    unread_count: number;
    updated_at: string;
}

interface Props {
    conversations: Conversation[];
    users: User[];
    currentUserId: number;
}

const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
}

function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function convName(conv: Conversation, uid: number): string {
    if (conv.name) return conv.name;
    const others = conv.participants.filter(p => p.id !== uid);
    return others.map(p => p.name).join(', ') || 'Chat';
}

function otherUser(conv: Conversation, uid: number): User | undefined {
    return conv.participants.find(p => p.id !== uid);
}

export default function MyChat({ conversations, users, currentUserId }: Props) {
    const [activeConvId, setActiveConvId] = useState<number | null>(null);
    const [messages, setMessages] = useState<MessageData[]>([]);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [showNewChat, setShowNewChat] = useState(false);
    const [searchUsers, setSearchUsers] = useState('');
    const [replyTo, setReplyTo] = useState<MessageData | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const messageForm = useForm<{ body: string; file: File | null }>({ body: '', file: null });

    const activeConv = conversations.find(c => c.id === activeConvId);

    const loadMessages = useCallback(async () => {
        if (!activeConvId) return;
        try {
            const res = await fetch(`/chat/${activeConvId}/messages`);
            if (res.ok) setMessages(await res.json());
        } catch { /* */ }
    }, [activeConvId]);

    useEffect(() => {
        if (activeConvId) { setLoadingMsgs(true); loadMessages().finally(() => setLoadingMsgs(false)); }
        return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }, [activeConvId, loadMessages]);

    useEffect(() => {
        if (pollingRef.current) clearInterval(pollingRef.current);
        if (activeConvId) pollingRef.current = setInterval(loadMessages, 3000);
        return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }, [activeConvId, loadMessages]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeConvId || (!messageForm.data.body.trim() && !messageForm.data.file)) return;
        const fd = new FormData();
        fd.append('body', messageForm.data.body);
        if (replyTo) fd.append('reply_to_id', String(replyTo.id));
        if (messageForm.data.file) fd.append('file', messageForm.data.file);
        fetch(`/chat/${activeConvId}/messages`, {
            method: 'POST',
            headers: { 'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '' },
            body: fd,
        }).then(() => { messageForm.reset(); setReplyTo(null); loadMessages(); });
    };

    const startDirectChat = (userId: number) => {
        router.post('/chat', { type: 'direct', participant_ids: [userId] }, { onSuccess: () => setShowNewChat(false) });
    };

    const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchUsers.toLowerCase()));

    // Conversation list view
    if (!activeConvId) {
        return (
            <UserLayout>
                <Head title="Chat" />
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-slate-900">Chat</h1>
                        <button onClick={() => setShowNewChat(true)} className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#495B67' }}>
                            New Chat
                        </button>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        {conversations.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="text-3xl mb-2"><Icon name="chat-bubble" className="w-4 h-4 inline-block" /></div>
                                <p className="text-sm text-slate-400">No conversations yet.</p>
                                <button onClick={() => setShowNewChat(true)} className="mt-2 text-sm font-medium hover:underline" style={{ color: '#495B67' }}>Start a chat</button>
                            </div>
                        ) : conversations.map(conv => {
                            const other = otherUser(conv, currentUserId);
                            return (
                                <button key={conv.id} onClick={() => setActiveConvId(conv.id)} className="w-full px-4 py-3 flex items-center gap-3 text-left border-b border-slate-50 hover:bg-slate-50 transition">
                                    {conv.type === 'direct' && other?.avatar_url ? (
                                        <img src={other.avatar_url} className="w-10 h-10 rounded-full object-cover flex-shrink-0" alt="" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ backgroundColor: '#495B67' }}>
                                            {conv.type === 'direct' && other ? initials(other.name) : '#'}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between">
                                            <p className={`text-sm truncate ${conv.unread_count > 0 ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>{convName(conv, currentUserId)}</p>
                                            {conv.latest_message && <span className="text-[10px] text-slate-400">{timeAgo(conv.latest_message.created_at)}</span>}
                                        </div>
                                        {conv.latest_message && <p className="text-xs text-slate-400 truncate mt-0.5">{conv.latest_message.body}</p>}
                                    </div>
                                    {conv.unread_count > 0 && <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ backgroundColor: '#495B67' }}>{conv.unread_count > 9 ? '9+' : conv.unread_count}</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {showNewChat && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNewChat(false)}>
                        <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                            <h3 className="text-lg font-bold text-slate-900 mb-4">New Message</h3>
                            <input type="text" placeholder="Search people..." value={searchUsers} onChange={e => setSearchUsers(e.target.value)} className="w-full rounded-lg border-slate-200 text-sm mb-3 focus:ring-[#495B67] focus:border-[#495B67]" />
                            <div className="max-h-60 overflow-y-auto space-y-1">
                                {filteredUsers.map(u => (
                                    <button key={u.id} onClick={() => startDirectChat(u.id)} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 text-left">
                                        {u.avatar_url ? <img src={u.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" /> : <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-slate-100 text-slate-500">{initials(u.name)}</div>}
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{u.name}</p>
                                            <p className="text-xs text-slate-400">{u.position || u.department || '—'}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setShowNewChat(false)} className="mt-4 w-full py-2 text-sm text-slate-500 hover:text-slate-700">Cancel</button>
                        </div>
                    </div>
                )}
            </UserLayout>
        );
    }

    // Active conversation view (mobile-friendly full-screen chat)
    return (
        <UserLayout>
            <Head title={activeConv ? convName(activeConv, currentUserId) : 'Chat'} />
            <div className="flex flex-col h-[calc(100vh-140px)]">
                {/* Header with back button */}
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-3">
                    <button onClick={() => setActiveConvId(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                        ← Back
                    </button>
                    <p className="text-sm font-bold text-slate-900">{activeConv ? convName(activeConv, currentUserId) : 'Chat'}</p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-3 pb-2">
                    {loadingMsgs ? (
                        <div className="flex items-center justify-center h-full"><p className="text-sm text-slate-400">Loading...</p></div>
                    ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-center">
                            <p className="text-sm text-slate-400">No messages yet. Say hello!</p>
                        </div>
                    ) : messages.map((msg, i) => {
                        const isMine = msg.user.id === currentUserId;
                        const showAvatar = i === 0 || messages[i - 1].user.id !== msg.user.id;
                        return (
                            <div key={msg.id} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                                {showAvatar ? (
                                    msg.user.avatar_url
                                        ? <img src={msg.user.avatar_url} className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-1" alt="" />
                                        : <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold bg-slate-200 text-slate-500 flex-shrink-0 mt-1">{initials(msg.user.name)}</div>
                                ) : <div className="w-7 flex-shrink-0" />}
                                <div className="max-w-[75%]">
                                    {showAvatar && !isMine && <p className="text-[10px] text-slate-400 mb-1 ml-1">{msg.user.name}</p>}
                                    {msg.reply_to && (
                                        <div className="text-[10px] text-slate-400 px-2 py-1 mb-1 border-l-2 border-slate-200 bg-slate-50 rounded">
                                            <span className="font-medium">{msg.reply_to.user_name}</span>: {msg.reply_to.body.slice(0, 50)}
                                        </div>
                                    )}
                                    <div className={`px-3 py-2 rounded-2xl text-sm ${isMine ? 'text-white rounded-br-md' : 'bg-slate-100 text-slate-900 rounded-bl-md'}`} style={isMine ? { backgroundColor: '#495B67' } : undefined}
                                        onClick={() => setReplyTo(msg)}
                                    >
                                        {msg.type === 'image' && msg.file_path && <img src={`/storage/${msg.file_path}`} className="max-w-full rounded-lg mb-1" alt="" />}
                                        <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                                        <span className={`text-[9px] ${isMine ? 'text-white/50' : 'text-slate-300'}`}>{formatTime(msg.created_at)}{msg.edited_at ? ' (edited)' : ''}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {replyTo && (
                    <div className="py-2 flex items-center gap-2 text-xs text-slate-500 border-t border-slate-100">
                        <span className="truncate flex-1">↩ {replyTo.user.name}: {replyTo.body.slice(0, 40)}</span>
                        <button onClick={() => setReplyTo(null)} className="text-slate-400"><Icon name="x-mark" className="w-3 h-3 inline-block" /></button>
                    </div>
                )}

                <form onSubmit={sendMessage} className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <input type="text" value={messageForm.data.body} onChange={e => messageForm.setData('body', e.target.value)} placeholder="Message..." className="flex-1 rounded-full border-slate-200 text-sm px-4 py-2 focus:ring-[#495B67] focus:border-[#495B67]" autoFocus />
                    <button type="submit" disabled={!messageForm.data.body.trim()} className="p-2 rounded-full text-white disabled:opacity-30" style={{ backgroundColor: '#495B67' }}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                </form>
            </div>
        </UserLayout>
    );
}
