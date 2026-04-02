import AdminLayout from '@/Layouts/AdminLayout';
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
    description: string | null;
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
    const days = Math.floor(hrs / 24);
    return `${days}d`;
}

function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function convName(conv: Conversation, currentUserId: number): string {
    if (conv.name) return conv.name;
    const others = conv.participants.filter(p => p.id !== currentUserId);
    return others.map(p => p.name).join(', ') || 'Conversation';
}

function convAvatar(conv: Conversation, currentUserId: number): { avatarUrl: string | null; name: string } {
    if (conv.type !== 'direct') return { avatarUrl: null, name: conv.name || 'G' };
    const other = conv.participants.find(p => p.id !== currentUserId);
    return { avatarUrl: other?.avatar_url ?? null, name: other?.name ?? 'User' };
}

export default function Chat({ conversations, users, currentUserId }: Props) {
    const [activeConvId, setActiveConvId] = useState<number | null>(conversations[0]?.id ?? null);
    const [messages, setMessages] = useState<MessageData[]>([]);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [showNewChat, setShowNewChat] = useState(false);
    const [showNewGroup, setShowNewGroup] = useState(false);
    const [searchUsers, setSearchUsers] = useState('');
    const [replyTo, setReplyTo] = useState<MessageData | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const messageForm = useForm<{ body: string; reply_to_id: number | null; file: File | null }>({
        body: '',
        reply_to_id: null,
        file: null,
    });

    const groupForm = useForm<{ name: string; participant_ids: number[] }>({
        name: '',
        participant_ids: [],
    });

    const activeConv = conversations.find(c => c.id === activeConvId);

    const loadMessages = useCallback(async () => {
        if (!activeConvId) return;
        try {
            const res = await fetch(`/chat/${activeConvId}/messages`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch { /* silent */ }
    }, [activeConvId]);

    useEffect(() => {
        if (activeConvId) {
            setLoadingMsgs(true);
            loadMessages().finally(() => setLoadingMsgs(false));
        }
        return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }, [activeConvId, loadMessages]);

    useEffect(() => {
        if (pollingRef.current) clearInterval(pollingRef.current);
        if (activeConvId) {
            pollingRef.current = setInterval(loadMessages, 3000);
        }
        return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }, [activeConvId, loadMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeConvId || (!messageForm.data.body.trim() && !messageForm.data.file)) return;

        const formData = new FormData();
        formData.append('body', messageForm.data.body);
        if (replyTo) formData.append('reply_to_id', String(replyTo.id));
        if (messageForm.data.file) formData.append('file', messageForm.data.file);

        fetch(`/chat/${activeConvId}/messages`, {
            method: 'POST',
            headers: { 'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '' },
            body: formData,
        }).then(() => {
            messageForm.reset();
            setReplyTo(null);
            loadMessages();
        });
    };

    const startDirectChat = (userId: number) => {
        router.post('/chat', { type: 'direct', participant_ids: [userId] }, { onSuccess: () => setShowNewChat(false) });
    };

    const createGroup = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/chat', { type: 'group', name: groupForm.data.name, participant_ids: groupForm.data.participant_ids }, {
            onSuccess: () => { setShowNewGroup(false); groupForm.reset(); },
        });
    };

    const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchUsers.toLowerCase()));

    return (
        <AdminLayout>
            <Head title="Chat" />

            <div className="flex h-[calc(100vh-120px)] bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Sidebar */}
                <div className="w-80 border-r border-slate-200 flex flex-col flex-shrink-0">
                    <div className="p-4 border-b border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-bold text-slate-900">Chat</h2>
                            <div className="flex gap-1">
                                <button onClick={() => { setShowNewChat(true); setShowNewGroup(false); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 text-sm" title="New message"><Icon name="envelope" className="w-3 h-3 inline-block" /></button>
                                <button onClick={() => { setShowNewGroup(true); setShowNewChat(false); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 text-sm" title="New group"><Icon name="user-group" className="w-4 h-4 inline-block" /></button>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {conversations.length === 0 ? (
                            <div className="p-6 text-center">
                                <p className="text-sm text-slate-400">No conversations yet.</p>
                                <button onClick={() => setShowNewChat(true)} className="mt-2 text-sm font-medium hover:underline" style={{ color: '#495B67' }}>Start a chat</button>
                            </div>
                        ) : conversations.map(conv => {
                            const isActive = conv.id === activeConvId;
                            const avatar = convAvatar(conv, currentUserId);
                            return (
                                <button key={conv.id} onClick={() => setActiveConvId(conv.id)} className={`w-full px-4 py-3 flex items-center gap-3 text-left transition ${isActive ? 'bg-slate-50' : 'hover:bg-slate-50'}`}>
                                    {avatar.avatarUrl ? (
                                        <img src={avatar.avatarUrl} className="w-10 h-10 rounded-full object-cover flex-shrink-0" alt="" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white" style={{ backgroundColor: '#495B67' }}>
                                            {conv.type === 'direct' ? initials(avatar.name) : '#'}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className={`text-sm truncate ${conv.unread_count > 0 ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>{convName(conv, currentUserId)}</p>
                                            {conv.latest_message && <span className="text-[10px] text-slate-400 flex-shrink-0">{timeAgo(conv.latest_message.created_at)}</span>}
                                        </div>
                                        {conv.latest_message && <p className="text-xs text-slate-400 truncate mt-0.5">{conv.latest_message.user_name}: {conv.latest_message.body}</p>}
                                    </div>
                                    {conv.unread_count > 0 && <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: '#495B67' }}>{conv.unread_count > 9 ? '9+' : conv.unread_count}</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main area */}
                <div className="flex-1 flex flex-col">
                    {activeConv ? (
                        <>
                            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3">
                                {(() => {
                                    const av = convAvatar(activeConv, currentUserId);
                                    return av.avatarUrl
                                        ? <img src={av.avatarUrl} className="w-8 h-8 rounded-full object-cover" alt="" />
                                        : <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#495B67' }}>{activeConv.type === 'direct' ? initials(av.name) : '#'}</div>;
                                })()}
                                <div>
                                    <p className="text-sm font-bold text-slate-900">{convName(activeConv, currentUserId)}</p>
                                    <p className="text-xs text-slate-400">{activeConv.participants.length} participant{activeConv.participants.length !== 1 ? 's' : ''}</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                {loadingMsgs ? (
                                    <div className="flex items-center justify-center h-full"><p className="text-sm text-slate-400">Loading messages...</p></div>
                                ) : messages.length === 0 ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center">
                                            <p className="text-sm text-slate-400">No messages yet.</p>
                                            <p className="text-xs text-slate-300 mt-1">Send the first message!</p>
                                        </div>
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
                                            <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                                                {showAvatar && !isMine && <p className="text-[10px] text-slate-400 mb-1 ml-1">{msg.user.name}</p>}
                                                {msg.reply_to && (
                                                    <div className="text-[10px] text-slate-400 px-3 py-1 mb-1 border-l-2 border-slate-200 bg-slate-50 rounded">
                                                        <span className="font-medium">{msg.reply_to.user_name}</span>: {msg.reply_to.body.slice(0, 60)}
                                                    </div>
                                                )}
                                                <div className={`px-3 py-2 rounded-2xl text-sm relative group ${isMine ? 'text-white rounded-br-md' : 'bg-slate-100 text-slate-900 rounded-bl-md'}`} style={isMine ? { backgroundColor: '#495B67' } : undefined}>
                                                    {msg.type === 'image' && msg.file_path && <img src={`/storage/${msg.file_path}`} className="max-w-full rounded-lg mb-1" alt="" />}
                                                    {msg.type === 'file' && msg.file_name && <a href={`/storage/${msg.file_path}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 mb-1 underline text-xs">{msg.file_name}</a>}
                                                    <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                                                    <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end' : ''}`}>
                                                        <span className={`text-[9px] ${isMine ? 'text-white/50' : 'text-slate-300'}`}>{formatTime(msg.created_at)}</span>
                                                        {msg.edited_at && <span className={`text-[9px] ${isMine ? 'text-white/40' : 'text-slate-300'}`}>(edited)</span>}
                                                    </div>
                                                    <button onClick={(e) => { e.stopPropagation(); setReplyTo(msg); }} className={`absolute -top-2 ${isMine ? 'left-0' : 'right-0'} hidden group-hover:flex w-6 h-6 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm text-xs`}>↩</button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {replyTo && (
                                <div className="px-5 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                                    <div className="flex-1 text-xs text-slate-500 truncate">Replying to <span className="font-medium">{replyTo.user.name}</span>: {replyTo.body.slice(0, 60)}</div>
                                    <button onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-slate-600 text-sm"><Icon name="x-mark" className="w-3 h-3 inline-block" /></button>
                                </div>
                            )}

                            <form onSubmit={sendMessage} className="px-5 py-3 border-t border-slate-100 flex items-center gap-2">
                                <label className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer text-sm">
                                    <Icon name="paperclip" className="w-4 h-4 inline-block" />
                                    <input type="file" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) messageForm.setData('file', file); }} />
                                </label>
                                {messageForm.data.file && (
                                    <span className="text-xs text-slate-400 max-w-[100px] truncate">
                                        {messageForm.data.file.name}
                                        <button type="button" onClick={() => messageForm.setData('file', null)} className="ml-1 text-slate-400 hover:text-red-500"><Icon name="x-mark" className="w-3 h-3 inline-block" /></button>
                                    </span>
                                )}
                                <input type="text" value={messageForm.data.body} onChange={e => messageForm.setData('body', e.target.value)} placeholder="Type a message..." className="flex-1 rounded-full border-slate-200 text-sm px-4 py-2 focus:ring-[#495B67] focus:border-[#495B67]" autoFocus />
                                <button type="submit" disabled={!messageForm.data.body.trim() && !messageForm.data.file} className="p-2 rounded-full text-white disabled:opacity-30 transition" style={{ backgroundColor: '#495B67' }}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl mb-3" style={{ backgroundColor: '#495B6710' }}><Icon name="chat-bubble" className="w-4 h-4 inline-block" /></div>
                                <p className="text-slate-400 text-sm">Select a conversation or start a new one</p>
                            </div>
                        </div>
                    )}
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

            {showNewGroup && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNewGroup(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-slate-900 mb-4">New Group Chat</h3>
                        <form onSubmit={createGroup}>
                            <input type="text" placeholder="Group name" value={groupForm.data.name} onChange={e => groupForm.setData('name', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm mb-3 focus:ring-[#495B67] focus:border-[#495B67]" required />
                            <p className="text-xs text-slate-400 mb-2">Select members:</p>
                            <div className="max-h-48 overflow-y-auto space-y-1 mb-4">
                                {users.map(u => (
                                    <label key={u.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                                        <input type="checkbox" checked={groupForm.data.participant_ids.includes(u.id)} onChange={e => { const ids = e.target.checked ? [...groupForm.data.participant_ids, u.id] : groupForm.data.participant_ids.filter(id => id !== u.id); groupForm.setData('participant_ids', ids); }} className="rounded border-slate-300 text-[#495B67] focus:ring-[#495B67]" />
                                        <span className="text-sm text-slate-700">{u.name}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setShowNewGroup(false)} className="flex-1 py-2 text-sm text-slate-500 hover:text-slate-700 rounded-lg border border-slate-200">Cancel</button>
                                <button type="submit" disabled={!groupForm.data.name || groupForm.data.participant_ids.length === 0} className="flex-1 py-2 text-sm text-white rounded-lg disabled:opacity-50" style={{ backgroundColor: '#495B67' }}>Create Group</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
