import UserLayout from '@/Layouts/UserLayout';
import Icon from '@/Components/Icon';
import { Head, useForm } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';

interface BadgeData { id: number; name: string; emoji: string; }
interface Employee { id: number; name: string; }

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

interface Props {
    feed: RecognitionData[];
    myStats: { received: number; points: number; sent: number };
    badges: BadgeData[];
    employees: Employee[];
}

export default function UserRecognition({ feed, myStats, badges, employees }: Props) {
    const [showSend, setShowSend] = useState(false);

    const form = useForm({
        recipient_id: '' as string | number,
        badge_id: '' as string | number,
        message: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route('recognition.send'), {
            onSuccess: () => { form.reset(); setShowSend(false); },
        });
    };

    return (
        <UserLayout title="Recognition">
            <Head title="Recognition" />

            <div className="space-y-5">
                {/* My Stats */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-base font-semibold text-slate-900 mb-3">My Recognition</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Received', value: myStats.received, color: 'bg-green-50 text-green-600' },
                            { label: 'Points', value: myStats.points, color: 'bg-amber-50 text-amber-600' },
                            { label: 'Sent', value: myStats.sent, color: 'bg-blue-50 text-blue-600' },
                        ].map(s => (
                            <div key={s.label} className="text-center">
                                <div className={`rounded-lg p-3 ${s.color} mb-1`}>
                                    <p className="text-xl font-bold">{s.value}</p>
                                </div>
                                <p className="text-xs text-slate-500">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Send Button */}
                <button
                    onClick={() => setShowSend(true)}
                    className="w-full rounded-xl py-3 text-sm font-medium text-white transition-colors"
                    style={{ backgroundColor: '#495B67' }}
                >
                    <Icon name="party-popper" className="w-4 h-4 inline-block" /> Recognize a Colleague
                </button>

                {/* Recognition Wall */}
                <div>
                    <h3 className="text-base font-semibold text-slate-900 mb-3">Recognition Wall</h3>
                    {feed.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
                            <div className="text-4xl mb-2"><Icon name="sparkles" className="w-3 h-3 inline-block" /></div>
                            <h3 className="text-base font-semibold text-slate-700">No recognitions yet</h3>
                            <p className="text-sm text-slate-400 mt-1">Be the first to recognize a colleague!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {feed.map(r => (
                                <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="text-2xl">{r.badge?.emoji || 'sparkles'}</div>
                                        <div className="flex-1">
                                            <p className="text-sm text-slate-900">
                                                <span className="font-semibold">{r.sender?.name}</span>
                                                {' recognized '}
                                                <span className="font-semibold">{r.recipient?.name}</span>
                                            </p>
                                            {r.badge && <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 mt-1">{r.badge.name}</span>}
                                            <p className="text-sm text-slate-600 mt-1.5">{r.message}</p>
                                            <div className="flex gap-3 mt-2 text-xs text-slate-400">
                                                <span>{new Date(r.created_at).toLocaleDateString()}</span>
                                                {r.points > 0 && <span className="text-amber-500 font-medium">+{r.points} pts</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Send Modal */}
            {showSend && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowSend(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                        <form onSubmit={submit} className="p-6 space-y-4">
                            <h2 className="text-lg font-bold text-slate-900">Recognize Someone</h2>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Who are you recognizing? *</label>
                                <select value={form.data.recipient_id} onChange={e => form.setData('recipient_id', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" required>
                                    <option value="">Select a colleague…</option>
                                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Badge (optional)</label>
                                <select value={form.data.badge_id} onChange={e => form.setData('badge_id', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm">
                                    <option value="">No badge</option>
                                    {badges.map(b => <option key={b.id} value={b.id}>{b.emoji} {b.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">What did they do? *</label>
                                <textarea value={form.data.message} onChange={e => form.setData('message', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" rows={3} placeholder="Share why you're recognizing them…" required />
                            </div>

                            {form.errors && Object.keys(form.errors).length > 0 && (
                                <div className="text-sm text-red-600">{Object.values(form.errors).flat().join(', ')}</div>
                            )}

                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowSend(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">Cancel</button>
                                <button type="submit" disabled={form.processing} className="px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50" style={{ backgroundColor: '#495B67' }}>
                                    {form.processing ? 'Sending…' : 'Send Recognition <Icon name="party-popper" className="w-4 h-4 inline-block" />'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </UserLayout>
    );
}
