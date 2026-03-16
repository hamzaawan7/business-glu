import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';

interface BadgeData { id: number; name: string; emoji: string; description: string | null; is_active: boolean; }
interface Employee { id: number; name: string; email: string; }

interface RecognitionData {
    id: number;
    sender: { id: number; name: string } | null;
    recipient: { id: number; name: string } | null;
    badge: { id: number; name: string; emoji: string } | null;
    message: string;
    visibility: string;
    points: number;
    created_at: string;
}

interface TopRecipient {
    recipient_id: number;
    count: number;
    total_points: number;
    recipient: { id: number; name: string } | null;
}

interface Props {
    recognitions: { data: RecognitionData[]; links: any[]; last_page: number };
    stats: { total: number; this_month: number; total_points: number; unique_recipients: number };
    topRecipients: TopRecipient[];
    badges: BadgeData[];
    employees: Employee[];
}

export default function Recognition({ recognitions, stats, topRecipients, badges, employees }: Props) {
    const [tab, setTab] = useState<'wall' | 'badges' | 'leaderboard'>('wall');
    const [showSend, setShowSend] = useState(false);
    const [showBadgeModal, setShowBadgeModal] = useState(false);

    const form = useForm({
        recipient_id: '' as string | number,
        badge_id: '' as string | number,
        message: '',
        visibility: 'public',
        points: '' as string | number,
    });

    const badgeForm = useForm({ name: '', emoji: '⭐', description: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route('admin.recognition.store'), {
            onSuccess: () => { form.reset(); setShowSend(false); },
        });
    };

    const submitBadge: FormEventHandler = (e) => {
        e.preventDefault();
        badgeForm.post(route('admin.recognition.store-badge'), {
            onSuccess: () => { badgeForm.reset(); setShowBadgeModal(false); },
        });
    };

    return (
        <AdminLayout>
            <Head title="Recognition & Rewards" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Recognition & Rewards</h1>
                        <p className="text-sm text-slate-500 mt-1">Celebrate achievements and motivate your team</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowBadgeModal(true)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Badges</button>
                        <button onClick={() => setShowSend(true)} className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#495B67' }}>+ Send Recognition</button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Recognitions', value: stats.total, color: 'bg-slate-50' },
                        { label: 'This Month', value: stats.this_month, color: 'bg-blue-50' },
                        { label: 'Total Points Awarded', value: stats.total_points, color: 'bg-amber-50' },
                        { label: 'People Recognized', value: stats.unique_recipients, color: 'bg-green-50' },
                    ].map((s) => (
                        <div key={s.label} className={`${s.color} rounded-xl p-4 text-center`}>
                            <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
                    {(['wall', 'leaderboard', 'badges'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-4 py-2 text-sm font-medium rounded-md capitalize ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                        >{t}</button>
                    ))}
                </div>

                {/* Wall Tab */}
                {tab === 'wall' && (
                    <div className="space-y-4">
                        {recognitions.data.length === 0 && (
                            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
                                No recognitions yet. Send the first one!
                            </div>
                        )}
                        {recognitions.data.map(r => (
                            <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="text-2xl">{r.badge?.emoji || '🌟'}</div>
                                        <div>
                                            <p className="text-sm text-slate-900">
                                                <span className="font-semibold">{r.sender?.name}</span>
                                                {' → '}
                                                <span className="font-semibold">{r.recipient?.name}</span>
                                            </p>
                                            {r.badge && <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 mt-1">{r.badge.name}</span>}
                                            <p className="text-sm text-slate-600 mt-2">{r.message}</p>
                                            <div className="flex gap-3 mt-2 text-xs text-slate-400">
                                                <span>{new Date(r.created_at).toLocaleDateString()}</span>
                                                {r.points > 0 && <span className="text-amber-500 font-medium">+{r.points} pts</span>}
                                                {r.visibility === 'private' && <span className="text-slate-400">🔒 Private</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => router.delete(route('admin.recognition.destroy', r.id), { preserveScroll: true })} className="text-xs text-red-400 hover:text-red-600">×</button>
                                </div>
                            </div>
                        ))}
                        {recognitions.last_page > 1 && (
                            <div className="flex items-center justify-center gap-1">
                                {recognitions.links.map((link: any, i: number) => (
                                    <button
                                        key={i}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                        className={`px-3 py-1 rounded text-sm ${link.active ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'} ${!link.url ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Leaderboard Tab */}
                {tab === 'leaderboard' && (
                    <div className="bg-white rounded-xl border border-slate-200">
                        <div className="p-4 border-b border-slate-100">
                            <h3 className="font-semibold text-slate-900">Top Recognized This Month</h3>
                        </div>
                        {topRecipients.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">No recognitions this month yet</div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {topRecipients.map((tr, i) => (
                                    <div key={tr.recipient_id} className="flex items-center gap-4 px-4 py-3">
                                        <div className="text-lg font-bold text-slate-300 w-8 text-center">{i + 1}</div>
                                        <div className="flex-1">
                                            <div className="font-medium text-slate-900">{tr.recipient?.name}</div>
                                            <div className="text-xs text-slate-400">{tr.count} recognition{tr.count !== 1 ? 's' : ''}</div>
                                        </div>
                                        <div className="text-sm font-semibold text-amber-500">{tr.total_points} pts</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Badges Tab */}
                {tab === 'badges' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {badges.length === 0 && (
                            <div className="col-span-full bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">No badges created yet</div>
                        )}
                        {badges.map(b => (
                            <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-5 text-center">
                                <div className="text-4xl mb-2">{b.emoji}</div>
                                <div className="font-semibold text-slate-900 text-sm">{b.name}</div>
                                {b.description && <div className="text-xs text-slate-400 mt-1">{b.description}</div>}
                                <button onClick={() => router.delete(route('admin.recognition.destroy-badge', b.id), { preserveScroll: true })} className="text-xs text-red-400 hover:text-red-600 mt-3">Delete</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Send Recognition Modal */}
            {showSend && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowSend(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                        <form onSubmit={submit} className="p-6 space-y-4">
                            <h2 className="text-lg font-bold text-slate-900">Send Recognition</h2>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Recipient *</label>
                                <select value={form.data.recipient_id} onChange={e => form.setData('recipient_id', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" required>
                                    <option value="">Select employee…</option>
                                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Badge</label>
                                    <select value={form.data.badge_id} onChange={e => form.setData('badge_id', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm">
                                        <option value="">None</option>
                                        {badges.filter(b => b.is_active).map(b => <option key={b.id} value={b.id}>{b.emoji} {b.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Points</label>
                                    <input type="number" min="0" max="1000" value={form.data.points} onChange={e => form.setData('points', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" placeholder="0" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Message *</label>
                                <textarea value={form.data.message} onChange={e => form.setData('message', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" rows={3} placeholder="What did they do great?" required />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Visibility</label>
                                <select value={form.data.visibility} onChange={e => form.setData('visibility', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm">
                                    <option value="public">Public (everyone sees)</option>
                                    <option value="private">Private (only recipient)</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowSend(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">Cancel</button>
                                <button type="submit" disabled={form.processing} className="px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50" style={{ backgroundColor: '#495B67' }}>
                                    {form.processing ? 'Sending…' : 'Send 🎉'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Badge Modal */}
            {showBadgeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowBadgeModal(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
                        <form onSubmit={submitBadge} className="p-6 space-y-4">
                            <h2 className="text-lg font-bold text-slate-900">Create Badge</h2>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                                <input type="text" value={badgeForm.data.name} onChange={e => badgeForm.setData('name', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" required />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Emoji</label>
                                <input type="text" value={badgeForm.data.emoji} onChange={e => badgeForm.setData('emoji', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" maxLength={20} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <input type="text" value={badgeForm.data.description} onChange={e => badgeForm.setData('description', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowBadgeModal(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">Cancel</button>
                                <button type="submit" disabled={badgeForm.processing} className="px-4 py-2 text-sm text-white rounded-lg" style={{ backgroundColor: '#495B67' }}>Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
