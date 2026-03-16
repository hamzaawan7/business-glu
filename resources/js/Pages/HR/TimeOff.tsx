import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';

interface Policy { id: number; name: string; color: string; days_per_year: number; accrual_type: string; requires_approval: boolean; is_active: boolean; }
interface Employee { id: number; name: string; email: string; }

interface RequestData {
    id: number;
    user: { id: number; name: string } | null;
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

interface CalendarEntry {
    id: number;
    start_date: string;
    end_date: string;
    user: { id: number; name: string } | null;
    policy: { id: number; name: string; color: string } | null;
}

interface Props {
    requests: { data: RequestData[]; links: any[]; current_page: number; last_page: number };
    filters: { status: string };
    stats: { pending: number; approved: number; denied: number; off_today: number };
    policies: Policy[];
    employees: Employee[];
    calendar: CalendarEntry[];
}

const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    denied: 'bg-red-100 text-red-700',
    cancelled: 'bg-slate-100 text-slate-500',
};

export default function TimeOff({ requests, filters, stats, policies, employees, calendar }: Props) {
    const [tab, setTab] = useState<'requests' | 'policies' | 'calendar'>('requests');
    const [showPolicyModal, setShowPolicyModal] = useState(false);
    const [reviewReq, setReviewReq] = useState<RequestData | null>(null);

    const policyForm = useForm({
        name: '',
        color: '#3B82F6',
        days_per_year: '' as string | number,
        accrual_type: 'annual',
        requires_approval: true,
    });

    const reviewForm = useForm({
        status: 'approved' as string,
        review_note: '',
    });

    const submitPolicy: FormEventHandler = (e) => {
        e.preventDefault();
        policyForm.post(route('admin.time-off.store-policy'), {
            onSuccess: () => { policyForm.reset(); setShowPolicyModal(false); },
        });
    };

    const submitReview: FormEventHandler = (e) => {
        e.preventDefault();
        if (!reviewReq) return;
        reviewForm.post(route('admin.time-off.review', reviewReq.id), {
            onSuccess: () => { reviewForm.reset(); setReviewReq(null); },
        });
    };

    const applyFilter = (key: string, value: string) => {
        router.get(route('admin.time-off.index'), { ...filters, [key]: value }, { preserveState: true, preserveScroll: true });
    };

    // Build simple calendar grid for current month
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const firstDayOfWeek = new Date(now.getFullYear(), now.getMonth(), 1).getDay();

    return (
        <AdminLayout>
            <Head title="Time Off Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Time Off Management</h1>
                        <p className="text-sm text-slate-500 mt-1">Review requests, manage policies, and track team availability</p>
                    </div>
                    <button onClick={() => setShowPolicyModal(true)} className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#495B67' }}>+ New Policy</button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Pending Review', value: stats.pending, color: 'bg-amber-50' },
                        { label: 'Approved', value: stats.approved, color: 'bg-green-50' },
                        { label: 'Denied', value: stats.denied, color: 'bg-red-50' },
                        { label: 'Off Today', value: stats.off_today, color: 'bg-blue-50' },
                    ].map((s) => (
                        <div key={s.label} className={`${s.color} rounded-xl p-4 text-center`}>
                            <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
                    {(['requests', 'calendar', 'policies'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-4 py-2 text-sm font-medium rounded-md capitalize ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                        >{t}</button>
                    ))}
                </div>

                {/* Requests Tab */}
                {tab === 'requests' && (
                    <>
                        <div className="flex gap-3">
                            <select value={filters.status} onChange={e => applyFilter('status', e.target.value)} className="rounded-lg border-slate-200 text-sm">
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="denied">Denied</option>
                            </select>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="text-left px-4 py-3 font-medium text-slate-600">Employee</th>
                                            <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                                            <th className="text-left px-4 py-3 font-medium text-slate-600">Dates</th>
                                            <th className="text-left px-4 py-3 font-medium text-slate-600">Days</th>
                                            <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                                            <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {requests.data.length === 0 && (
                                            <tr><td colSpan={6} className="text-center py-12 text-slate-400">No requests found</td></tr>
                                        )}
                                        {requests.data.map((req) => (
                                            <tr key={req.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-slate-900">{req.user?.name}</div>
                                                    <div className="text-xs text-slate-400">{new Date(req.created_at).toLocaleDateString()}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: req.policy?.color || '#ccc' }} />
                                                        {req.policy?.name}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">
                                                    {new Date(req.start_date).toLocaleDateString()} – {new Date(req.end_date).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">{req.days}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[req.status]}`}>{req.status}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {req.status === 'pending' ? (
                                                        <button onClick={() => { reviewForm.setData({ status: 'approved', review_note: '' }); setReviewReq(req); }} className="text-xs px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600">Review</button>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">{req.reviewer?.name && `by ${req.reviewer.name}`}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {requests.last_page > 1 && (
                                <div className="flex items-center justify-center gap-1 p-4 border-t border-slate-100">
                                    {requests.links.map((link: any, i: number) => (
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
                    </>
                )}

                {/* Calendar Tab */}
                {tab === 'calendar' && (
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <h3 className="font-semibold text-slate-900 mb-4">
                            {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h3>
                        <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <div key={d} className="bg-slate-50 p-2 text-center text-xs font-medium text-slate-500">{d}</div>
                            ))}
                            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                                <div key={`pad-${i}`} className="bg-white p-2 min-h-[60px]" />
                            ))}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const dayEvents = calendar.filter(e => {
                                    const s = e.start_date.substring(0, 10);
                                    const en = e.end_date.substring(0, 10);
                                    return dateStr >= s && dateStr <= en;
                                });
                                const isToday = day === now.getDate();
                                return (
                                    <div key={day} className={`bg-white p-2 min-h-[60px] ${isToday ? 'ring-2 ring-blue-400 ring-inset' : ''}`}>
                                        <div className={`text-xs font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-slate-600'}`}>{day}</div>
                                        {dayEvents.slice(0, 2).map(ev => (
                                            <div key={ev.id} className="text-[10px] px-1 py-0.5 rounded mb-0.5 text-white truncate" style={{ backgroundColor: ev.policy?.color || '#ccc' }}>
                                                {ev.user?.name}
                                            </div>
                                        ))}
                                        {dayEvents.length > 2 && <div className="text-[10px] text-slate-400">+{dayEvents.length - 2} more</div>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Policies Tab */}
                {tab === 'policies' && (
                    <div className="space-y-4">
                        {policies.length === 0 && (
                            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
                                No leave policies configured. Create one to get started.
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {policies.map(p => (
                                <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                                        <h3 className="font-semibold text-slate-900">{p.name}</h3>
                                    </div>
                                    <div className="space-y-2 text-sm text-slate-600">
                                        <div className="flex justify-between"><span>Days/Year</span><span className="font-medium">{p.days_per_year}</span></div>
                                        <div className="flex justify-between"><span>Accrual</span><span className="font-medium capitalize">{p.accrual_type}</span></div>
                                        <div className="flex justify-between"><span>Approval Required</span><span className="font-medium">{p.requires_approval ? 'Yes' : 'No'}</span></div>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <button
                                            onClick={() => router.patch(route('admin.time-off.update-policy', p.id), { is_active: !p.is_active } as any, { preserveScroll: true })}
                                            className={`text-xs px-2 py-1 rounded ${p.is_active ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}
                                        >{p.is_active ? 'Active' : 'Inactive'}</button>
                                        <button onClick={() => router.delete(route('admin.time-off.destroy-policy', p.id), { preserveScroll: true })} className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 ml-auto">Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* New Policy Modal */}
            {showPolicyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowPolicyModal(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                        <form onSubmit={submitPolicy} className="p-6 space-y-4">
                            <h2 className="text-lg font-bold text-slate-900">New Leave Policy</h2>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                                <input type="text" value={policyForm.data.name} onChange={e => policyForm.setData('name', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" placeholder="e.g. Vacation, Sick Leave" required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Days Per Year *</label>
                                    <input type="number" step="0.5" min="0" value={policyForm.data.days_per_year} onChange={e => policyForm.setData('days_per_year', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                                    <input type="color" value={policyForm.data.color} onChange={e => policyForm.setData('color', e.target.value)} className="w-full h-[38px] rounded-lg border-slate-200" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Accrual</label>
                                    <select value={policyForm.data.accrual_type} onChange={e => policyForm.setData('accrual_type', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm">
                                        <option value="annual">Annual (all at once)</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="none">None (manual)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Requires Approval</label>
                                    <select value={policyForm.data.requires_approval ? '1' : '0'} onChange={e => policyForm.setData('requires_approval', e.target.value === '1')} className="w-full rounded-lg border-slate-200 text-sm">
                                        <option value="1">Yes</option>
                                        <option value="0">No</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowPolicyModal(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">Cancel</button>
                                <button type="submit" disabled={policyForm.processing} className="px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50" style={{ backgroundColor: '#495B67' }}>Create Policy</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Review Modal */}
            {reviewReq && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setReviewReq(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                        <form onSubmit={submitReview} className="p-6 space-y-4">
                            <h2 className="text-lg font-bold text-slate-900">Review Request</h2>

                            <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-slate-500">Employee</span><span className="font-medium text-slate-900">{reviewReq.user?.name}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Type</span><span className="font-medium text-slate-900">{reviewReq.policy?.name}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Dates</span><span className="font-medium text-slate-900">{new Date(reviewReq.start_date).toLocaleDateString()} – {new Date(reviewReq.end_date).toLocaleDateString()}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Days</span><span className="font-medium text-slate-900">{reviewReq.days}</span></div>
                                {reviewReq.reason && <div><span className="text-slate-500">Reason: </span><span className="text-slate-700">{reviewReq.reason}</span></div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Decision *</label>
                                <select value={reviewForm.data.status} onChange={e => reviewForm.setData('status', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm">
                                    <option value="approved">Approve</option>
                                    <option value="denied">Deny</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Note (optional)</label>
                                <textarea value={reviewForm.data.review_note} onChange={e => reviewForm.setData('review_note', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" rows={2} placeholder="Add a note for the employee…" />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setReviewReq(null)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">Cancel</button>
                                <button type="submit" disabled={reviewForm.processing} className={`px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 ${reviewForm.data.status === 'denied' ? 'bg-red-600 hover:bg-red-700' : ''}`} style={reviewForm.data.status === 'approved' ? { backgroundColor: '#495B67' } : {}}>
                                    {reviewForm.data.status === 'approved' ? 'Approve' : 'Deny'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
