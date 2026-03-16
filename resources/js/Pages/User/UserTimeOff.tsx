import UserLayout from '@/Layouts/UserLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';

interface Policy { id: number; name: string; color: string; days_per_year: number; }
interface Balance { id: number; leave_policy_id: number; balance: number; used: number; total: number; policy: Policy | null; }

interface RequestData {
    id: number;
    policy: { id: number; name: string; color: string } | null;
    start_date: string;
    end_date: string;
    days: number;
    reason: string | null;
    status: string;
    reviewer: { id: number; name: string } | null;
    review_note: string | null;
    reviewed_at: string | null;
    created_at: string;
}

interface Props {
    requests: RequestData[];
    policies: Policy[];
    balances: Balance[];
    year: number;
}

const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    denied: 'bg-red-100 text-red-700',
    cancelled: 'bg-slate-100 text-slate-500',
};

export default function UserTimeOff({ requests, policies, balances, year }: Props) {
    const [showRequest, setShowRequest] = useState(false);

    const form = useForm({
        leave_policy_id: '' as string | number,
        start_date: '',
        end_date: '',
        reason: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route('time-off.submit'), {
            onSuccess: () => { form.reset(); setShowRequest(false); },
        });
    };

    const pendingCount = requests.filter(r => r.status === 'pending').length;

    return (
        <UserLayout title="Time Off">
            <Head title="Time Off" />

            <div className="space-y-5">
                {/* Balances */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-base font-semibold text-slate-900 mb-3">My Balances — {year}</h3>
                    {balances.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-4">No leave policies configured yet</p>
                    ) : (
                        <div className={`grid gap-3 ${balances.length <= 3 ? `grid-cols-${balances.length}` : 'grid-cols-2 sm:grid-cols-3'}`}>
                            {balances.map(b => {
                                const pct = b.total > 0 ? ((b.used / b.total) * 100) : 0;
                                return (
                                    <div key={b.id} className="text-center">
                                        <div className="rounded-lg p-3 bg-slate-50 mb-2">
                                            <p className="text-xl font-bold text-slate-900">{b.balance}</p>
                                            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                                                <div className="h-1.5 rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: b.policy?.color || '#3B82F6' }} />
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-1">{b.used} of {b.total} used</p>
                                        </div>
                                        <p className="text-xs text-slate-600 font-medium">{b.policy?.name}</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Request Button */}
                <button
                    onClick={() => setShowRequest(true)}
                    className="w-full rounded-xl py-3 text-sm font-medium text-white transition-colors"
                    style={{ backgroundColor: '#495B67' }}
                >
                    Request Time Off
                </button>

                {/* Pending Indicator */}
                {pendingCount > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 text-center">
                        {pendingCount} request{pendingCount !== 1 ? 's' : ''} pending approval
                    </div>
                )}

                {/* Request History */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-slate-100">
                    <div className="p-4">
                        <h3 className="text-base font-semibold text-slate-900">Request History</h3>
                    </div>
                    {requests.length === 0 ? (
                        <div className="text-center py-8 px-4">
                            <p className="text-sm text-slate-400">No time off requests yet</p>
                        </div>
                    ) : (
                        requests.map(req => (
                            <div key={req.id} className="p-4">
                                <div className="flex items-start justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: req.policy?.color || '#ccc' }} />
                                        <span className="font-medium text-slate-900 text-sm">{req.policy?.name}</span>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[req.status]}`}>{req.status}</span>
                                </div>
                                <p className="text-sm text-slate-600 ml-[18px]">
                                    {new Date(req.start_date).toLocaleDateString()} – {new Date(req.end_date).toLocaleDateString()} · {req.days} day{req.days !== 1 ? 's' : ''}
                                </p>
                                {req.reason && <p className="text-xs text-slate-400 ml-[18px] mt-1">{req.reason}</p>}
                                {req.review_note && (
                                    <p className="text-xs mt-1 ml-[18px] text-slate-500 italic">
                                        {req.reviewer?.name}: {req.review_note}
                                    </p>
                                )}
                                {req.status === 'pending' && (
                                    <button
                                        onClick={() => router.post(route('time-off.cancel', req.id), {}, { preserveScroll: true })}
                                        className="text-xs text-red-500 hover:text-red-700 ml-[18px] mt-2"
                                    >Cancel Request</button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Request Modal */}
            {showRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowRequest(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                        <form onSubmit={submit} className="p-6 space-y-4">
                            <h2 className="text-lg font-bold text-slate-900">Request Time Off</h2>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Leave Type *</label>
                                <select value={form.data.leave_policy_id} onChange={e => form.setData('leave_policy_id', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" required>
                                    <option value="">Select type…</option>
                                    {policies.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.days_per_year} days/yr)</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
                                    <input type="date" value={form.data.start_date} onChange={e => form.setData('start_date', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">End Date *</label>
                                    <input type="date" value={form.data.end_date} onChange={e => form.setData('end_date', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" required />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Reason (optional)</label>
                                <textarea value={form.data.reason} onChange={e => form.setData('reason', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" rows={2} placeholder="Why are you requesting time off?" />
                            </div>

                            {form.errors && Object.keys(form.errors).length > 0 && (
                                <div className="text-sm text-red-600">{Object.values(form.errors).flat().join(', ')}</div>
                            )}

                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowRequest(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">Cancel</button>
                                <button type="submit" disabled={form.processing} className="px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50" style={{ backgroundColor: '#495B67' }}>
                                    {form.processing ? 'Submitting…' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </UserLayout>
    );
}
