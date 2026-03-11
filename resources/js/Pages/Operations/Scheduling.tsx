import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';

interface Member {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface ShiftData {
    id: number;
    user_id: number | null;
    user: Member | null;
    title: string | null;
    date: string;
    start_time: string;
    end_time: string;
    duration_hours: number;
    duration_label: string;
    color: string;
    location: string | null;
    notes: string | null;
    is_published: boolean;
    is_open: boolean;
    is_recurring: boolean;
    repeat_type: string | null;
    repeat_group_id: number | null;
    status: string;
}

interface DateInfo {
    date: string;
    dayName: string;
    dayNumber: string;
    isToday: boolean;
}

interface Props {
    dates: DateInfo[];
    shifts: ShiftData[];
    members: Member[];
    weekStart: string;
    weekEnd: string;
    weekLabel: string;
    stats: {
        totalShifts: number;
        totalHours: number;
        openShifts: number;
        published: number;
    };
}

const SHIFT_COLORS = [
    '#495B67', '#3B82F6', '#10B981', '#F59E0B',
    '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4',
];

export default function Scheduling({ dates, shifts, members, weekStart, weekEnd, weekLabel, stats }: Props) {
    const page = usePage();
    const flash = (page.props as any).flash ?? {};

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingShift, setEditingShift] = useState<ShiftData | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<ShiftData | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [duplicateTarget, setDuplicateTarget] = useState('');
    const [deleteScope, setDeleteScope] = useState<'this' | 'following' | 'all'>('this');

    // Create shift form
    const createForm = useForm({
        user_id: '' as string | number,
        title: '',
        dates: [] as string[],
        start_time: '09:00',
        end_time: '17:00',
        color: '#495B67',
        location: '',
        notes: '',
        is_open: false,
        repeat_type: 'none',
        repeat_end_date: '',
    });

    // Edit shift form
    const editForm = useForm({
        user_id: '' as string | number,
        title: '',
        date: '',
        start_time: '',
        end_time: '',
        color: '',
        location: '',
        notes: '',
        is_open: false,
    });

    const openCreate = (date?: string) => {
        createForm.reset();
        if (date) createForm.setData('dates', [date]);
        setSelectedDate(date ?? null);
        setShowCreateModal(true);
    };

    const openEdit = (shift: ShiftData) => {
        editForm.setData({
            user_id: shift.user_id ?? '',
            title: shift.title ?? '',
            date: shift.date,
            start_time: shift.start_time,
            end_time: shift.end_time,
            color: shift.color,
            location: shift.location ?? '',
            notes: shift.notes ?? '',
            is_open: shift.is_open,
        });
        setEditingShift(shift);
    };

    const handleCreate: FormEventHandler = (e) => {
        e.preventDefault();
        createForm.post(route('admin.scheduling.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowCreateModal(false);
                createForm.reset();
            },
        });
    };

    const handleEdit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editingShift) return;
        editForm.patch(route('admin.scheduling.update', editingShift.id), {
            preserveScroll: true,
            onSuccess: () => setEditingShift(null),
        });
    };

    const handleDelete = () => {
        if (!deleteConfirm) return;
        router.delete(route('admin.scheduling.destroy', deleteConfirm.id), {
            data: { delete_scope: deleteScope },
            preserveScroll: true,
            onSuccess: () => {
                setDeleteConfirm(null);
                setDeleteScope('this');
            },
        });
    };

    const handlePublish = () => {
        router.post(route('admin.scheduling.publish'), {
            week_start: weekStart,
            week_end: weekEnd,
        }, { preserveScroll: true });
    };

    const handleDuplicate = () => {
        if (!duplicateTarget) return;
        router.post(route('admin.scheduling.duplicate'), {
            source_week: weekStart,
            target_week: duplicateTarget,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setShowDuplicateModal(false);
                setDuplicateTarget('');
            },
        });
    };

    const getNextWeekStart = () => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + 7);
        return d.toISOString().split('T')[0];
    };

    const navigateWeek = (direction: 'prev' | 'next') => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + (direction === 'prev' ? -7 : 7));
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        router.get(route('admin.scheduling.index'), { week: `${y}-${m}-${day}` }, { preserveScroll: true });
    };

    // Group shifts by date
    const shiftsByDate: Record<string, ShiftData[]> = {};
    dates.forEach(d => { shiftsByDate[d.date] = []; });
    shifts.forEach(s => {
        if (shiftsByDate[s.date]) shiftsByDate[s.date].push(s);
    });

    // Group shifts by member for the grid view
    const memberRows = members.map(member => ({
        member,
        shifts: dates.map(d => shifts.filter(s => s.user_id === member.id && s.date === d.date)),
    }));

    // Unassigned / open shifts row
    const openRow = dates.map(d => shifts.filter(s => s.user_id === null && s.date === d.date));

    return (
        <AdminLayout title="Scheduling">
            <Head title="Scheduling" />

            <div className="space-y-6">
                {/* Flash messages */}
                {flash.success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                        {flash.success}
                    </div>
                )}
                {flash.error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {flash.error}
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold font-heading text-brand-primary">Scheduling</h1>
                        <p className="text-sm text-brand-accent mt-1">Create and manage employee schedules</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { setDuplicateTarget(getNextWeekStart()); setShowDuplicateModal(true); }}
                            className="px-4 py-2 border border-gray-300 text-brand-secondary text-sm font-medium rounded-lg hover:bg-gray-50 transition"
                        >
                            Duplicate Week
                        </button>
                        <button
                            onClick={handlePublish}
                            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
                        >
                            Publish Week
                        </button>
                        <button
                            onClick={() => openCreate()}
                            className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition"
                        >
                            + Add Shift
                        </button>
                    </div>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Shifts', value: stats.totalShifts, color: 'text-brand-primary' },
                        { label: 'Total Hours', value: `${stats.totalHours}h`, color: 'text-blue-600' },
                        { label: 'Open Shifts', value: stats.openShifts, color: 'text-amber-600' },
                        { label: 'Published', value: stats.published, color: 'text-green-600' },
                    ].map(stat => (
                        <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                            <p className="text-xs text-brand-accent uppercase tracking-wide">{stat.label}</p>
                            <p className={`text-2xl font-bold font-heading mt-1 ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Week navigation */}
                <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
                    <button
                        onClick={() => navigateWeek('prev')}
                        className="text-brand-accent hover:text-brand-primary p-1"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>
                    <div className="text-center">
                        <p className="text-sm font-semibold font-heading text-brand-primary">{weekLabel}</p>
                    </div>
                    <button
                        onClick={() => navigateWeek('next')}
                        className="text-brand-accent hover:text-brand-primary p-1"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>
                </div>

                {/* Schedule grid */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left px-4 py-3 text-xs font-medium text-brand-accent uppercase tracking-wide w-44">
                                    Employee
                                </th>
                                {dates.map(d => (
                                    <th
                                        key={d.date}
                                        className={`text-center px-2 py-3 cursor-pointer hover:bg-gray-50 ${
                                            d.isToday ? 'bg-brand-primary/5' : ''
                                        }`}
                                        onClick={() => openCreate(d.date)}
                                    >
                                        <div className={`text-sm font-bold ${d.isToday ? 'text-brand-primary' : 'text-brand-secondary'}`}>
                                            {d.dayName}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {memberRows.map(({ member, shifts: memberShifts }) => (
                                <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                                    <td className="px-4 py-3">
                                        <div className="text-sm font-medium text-brand-primary">{member.name}</div>
                                        <div className="text-xs text-brand-accent capitalize">{member.role}</div>
                                    </td>
                                    {memberShifts.map((dayShifts, i) => (
                                        <td key={dates[i].date} className="px-2 py-2 align-top">
                                            <div className="space-y-1 min-h-[48px]">
                                                {dayShifts.map(shift => (
                                                    <button
                                                        key={shift.id}
                                                        onClick={() => openEdit(shift)}
                                                        className="w-full text-left px-2 py-1.5 rounded-md text-xs transition hover:ring-2 hover:ring-offset-1 hover:ring-brand-primary/30"
                                                        style={{ backgroundColor: shift.color + '20', borderLeft: `3px solid ${shift.color}` }}
                                                    >
                                                        <div className="font-medium" style={{ color: shift.color }}>
                                                            {shift.start_time} – {shift.end_time}
                                                        </div>
                                                        {shift.title && (
                                                            <div className="text-gray-600 truncate">{shift.title}</div>
                                                        )}
                                                        {!shift.is_published && (
                                                            <span className="text-[10px] text-amber-600 font-medium">DRAFT</span>
                                                        )}
                                                        {shift.is_recurring && (
                                                            <span className="text-[10px] text-brand-accent">🔁</span>
                                                        )}
                                                    </button>
                                                ))}
                                                {dayShifts.length === 0 && (
                                                    <button
                                                        onClick={() => {
                                                            createForm.setData('user_id', member.id);
                                                            openCreate(dates[i].date);
                                                        }}
                                                        className="w-full h-12 rounded-md border border-dashed border-gray-200 hover:border-brand-accent hover:bg-gray-50 flex items-center justify-center text-gray-300 hover:text-brand-accent transition"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))}

                            {/* Open / unassigned shifts row */}
                            {openRow.some(day => day.length > 0) && (
                                <tr className="border-b border-gray-100 bg-amber-50/30">
                                    <td className="px-4 py-3">
                                        <div className="text-sm font-medium text-amber-700">Open Shifts</div>
                                        <div className="text-xs text-amber-500">Unassigned</div>
                                    </td>
                                    {openRow.map((dayShifts, i) => (
                                        <td key={dates[i].date} className="px-2 py-2 align-top">
                                            <div className="space-y-1">
                                                {dayShifts.map(shift => (
                                                    <button
                                                        key={shift.id}
                                                        onClick={() => openEdit(shift)}
                                                        className="w-full text-left px-2 py-1.5 rounded-md text-xs bg-amber-100 border-l-3 border-amber-400 hover:ring-2 hover:ring-amber-300 transition"
                                                    >
                                                        <div className="font-medium text-amber-700">
                                                            {shift.start_time} – {shift.end_time}
                                                        </div>
                                                        {shift.title && (
                                                            <div className="text-amber-600 truncate">{shift.title}</div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Create Shift Modal ── */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <h2 className="text-lg font-bold font-heading text-brand-primary mb-4">Create Shift</h2>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-brand-secondary mb-1">Assign to</label>
                                    <select
                                        value={createForm.data.user_id}
                                        onChange={e => createForm.setData('user_id', e.target.value ? Number(e.target.value) : '')}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                    >
                                        <option value="">Unassigned (Open Shift)</option>
                                        {members.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-brand-secondary mb-1">Title (optional)</label>
                                    <input
                                        type="text"
                                        value={createForm.data.title}
                                        onChange={e => createForm.setData('title', e.target.value)}
                                        placeholder="e.g. Morning Shift"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-brand-secondary mb-2">Days</label>
                                    <div className="flex gap-1.5">
                                        {dates.map(d => {
                                            const selected = createForm.data.dates.includes(d.date);
                                            return (
                                                <button
                                                    type="button"
                                                    key={d.date}
                                                    onClick={() => {
                                                        const current = createForm.data.dates;
                                                        createForm.setData(
                                                            'dates',
                                                            selected
                                                                ? current.filter(dd => dd !== d.date)
                                                                : [...current, d.date]
                                                        );
                                                    }}
                                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition border ${
                                                        selected
                                                            ? 'bg-brand-primary text-white border-brand-primary'
                                                            : 'bg-white text-brand-secondary border-gray-300 hover:border-brand-primary'
                                                    }`}
                                                >
                                                    {d.dayName}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <button
                                            type="button"
                                            onClick={() => createForm.setData('dates', dates.slice(0, 5).map(d => d.date))}
                                            className="text-[11px] text-brand-accent hover:text-brand-primary font-medium"
                                        >
                                            Mon–Fri
                                        </button>
                                        <span className="text-gray-300">|</span>
                                        <button
                                            type="button"
                                            onClick={() => createForm.setData('dates', dates.map(d => d.date))}
                                            className="text-[11px] text-brand-accent hover:text-brand-primary font-medium"
                                        >
                                            All days
                                        </button>
                                        <span className="text-gray-300">|</span>
                                        <button
                                            type="button"
                                            onClick={() => createForm.setData('dates', [])}
                                            className="text-[11px] text-brand-accent hover:text-brand-primary font-medium"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                    {createForm.errors.dates && <p className="text-xs text-red-600 mt-1">{createForm.errors.dates}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-brand-secondary mb-1">Start</label>
                                        <input
                                            type="time"
                                            value={createForm.data.start_time}
                                            onChange={e => createForm.setData('start_time', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-brand-secondary mb-1">End</label>
                                        <input
                                            type="time"
                                            value={createForm.data.end_time}
                                            onChange={e => createForm.setData('end_time', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-brand-secondary mb-1">Color</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {SHIFT_COLORS.map(c => (
                                            <button
                                                type="button"
                                                key={c}
                                                onClick={() => createForm.setData('color', c)}
                                                className={`w-8 h-8 rounded-full border-2 transition ${
                                                    createForm.data.color === c ? 'border-brand-primary scale-110 ring-2 ring-brand-primary/30' : 'border-transparent'
                                                }`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-brand-secondary mb-1">Location (optional)</label>
                                    <input
                                        type="text"
                                        value={createForm.data.location}
                                        onChange={e => createForm.setData('location', e.target.value)}
                                        placeholder="e.g. Main Office"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-brand-secondary mb-1">Notes (optional)</label>
                                    <textarea
                                        value={createForm.data.notes}
                                        onChange={e => createForm.setData('notes', e.target.value)}
                                        rows={2}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                    />
                                </div>

                                {/* Recurrence */}
                                <div>
                                    <label className="block text-sm font-medium text-brand-secondary mb-1">Repeat</label>
                                    <select
                                        value={createForm.data.repeat_type}
                                        onChange={e => createForm.setData('repeat_type', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                    >
                                        <option value="none">Does not repeat</option>
                                        <option value="weekly">Every week</option>
                                    </select>
                                </div>

                                {createForm.data.repeat_type === 'weekly' && (
                                    <div>
                                        <label className="block text-sm font-medium text-brand-secondary mb-1">Repeat until (optional)</label>
                                        <input
                                            type="date"
                                            value={createForm.data.repeat_end_date}
                                            onChange={e => createForm.setData('repeat_end_date', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                        />
                                        <p className="text-xs text-brand-accent mt-1">Leave empty for indefinite (up to 1 year)</p>
                                    </div>
                                )}

                                {!createForm.data.user_id && (
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={createForm.data.is_open}
                                            onChange={e => createForm.setData('is_open', e.target.checked)}
                                            className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                                        />
                                        <span className="text-sm text-brand-secondary">Open shift (employees can claim)</span>
                                    </label>
                                )}

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2 text-sm text-brand-accent hover:text-brand-primary transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createForm.processing}
                                        className="px-5 py-2 bg-brand-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50"
                                    >
                                        {createForm.processing ? 'Creating…' : 'Create Shift'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit Shift Modal ── */}
            {editingShift && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingShift(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <h2 className="text-lg font-bold font-heading text-brand-primary mb-4">Edit Shift</h2>
                            <form onSubmit={handleEdit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-brand-secondary mb-1">Assign to</label>
                                    <select
                                        value={editForm.data.user_id}
                                        onChange={e => editForm.setData('user_id', e.target.value ? Number(e.target.value) : '')}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                    >
                                        <option value="">Unassigned (Open Shift)</option>
                                        {members.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-brand-secondary mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={editForm.data.title}
                                        onChange={e => editForm.setData('title', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-brand-secondary mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={editForm.data.date}
                                        onChange={e => editForm.setData('date', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-brand-secondary mb-1">Start</label>
                                        <input
                                            type="time"
                                            value={editForm.data.start_time}
                                            onChange={e => editForm.setData('start_time', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-brand-secondary mb-1">End</label>
                                        <input
                                            type="time"
                                            value={editForm.data.end_time}
                                            onChange={e => editForm.setData('end_time', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-brand-secondary mb-1">Color</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {SHIFT_COLORS.map(c => (
                                            <button
                                                type="button"
                                                key={c}
                                                onClick={() => editForm.setData('color', c)}
                                                className={`w-8 h-8 rounded-full border-2 transition ${
                                                    editForm.data.color === c ? 'border-brand-primary scale-110 ring-2 ring-brand-primary/30' : 'border-transparent'
                                                }`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-brand-secondary mb-1">Location</label>
                                    <input
                                        type="text"
                                        value={editForm.data.location}
                                        onChange={e => editForm.setData('location', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-brand-secondary mb-1">Notes</label>
                                    <textarea
                                        value={editForm.data.notes}
                                        onChange={e => editForm.setData('notes', e.target.value)}
                                        rows={2}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <button
                                        type="button"
                                        onClick={() => { setDeleteScope('this'); setDeleteConfirm(editingShift); setEditingShift(null); }}
                                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                                    >
                                        Delete Shift
                                    </button>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setEditingShift(null)}
                                            className="px-4 py-2 text-sm text-brand-accent hover:text-brand-primary transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={editForm.processing}
                                            className="px-5 py-2 bg-brand-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50"
                                        >
                                            {editForm.processing ? 'Saving…' : 'Save Changes'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation (Google Calendar-style) ── */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-bold font-heading text-brand-primary mb-2">Delete Shift</h2>
                        <p className="text-sm text-brand-accent mb-4">
                            {deleteConfirm.user ? `${deleteConfirm.user.name}'s shift` : 'This shift'}
                            {' '}on {new Date(deleteConfirm.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })}
                            {deleteConfirm.title ? ` — ${deleteConfirm.title}` : ''}
                        </p>

                        {deleteConfirm.is_recurring ? (
                            <div className="space-y-2 mb-6">
                                <p className="text-xs font-medium text-brand-accent uppercase tracking-wide">This is a recurring shift</p>
                                {[
                                    { value: 'this' as const, label: 'This shift only' },
                                    { value: 'following' as const, label: 'This and all following shifts' },
                                    { value: 'all' as const, label: 'All shifts in this series' },
                                ].map(opt => (
                                    <label
                                        key={opt.value}
                                        className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition hover:bg-gray-50 ${
                                            deleteScope === opt.value ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-200'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="delete_scope"
                                            value={opt.value}
                                            checked={deleteScope === opt.value}
                                            onChange={() => setDeleteScope(opt.value)}
                                            className="text-brand-primary focus:ring-brand-primary"
                                        />
                                        <span className="text-sm text-brand-secondary">{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-brand-accent mb-6">Are you sure you want to delete this shift?</p>
                        )}

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => { setDeleteConfirm(null); setDeleteScope('this'); }}
                                className="px-4 py-2 text-sm text-brand-accent hover:text-brand-primary transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Duplicate Week Modal ── */}
            {showDuplicateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDuplicateModal(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-bold font-heading text-brand-primary mb-2">Duplicate Week</h2>
                        <p className="text-sm text-brand-accent mb-4">
                            Copy all shifts from <span className="font-medium text-brand-primary">{weekLabel}</span> to another week.
                        </p>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-brand-secondary mb-1">Copy to week starting</label>
                            <input
                                type="date"
                                value={duplicateTarget}
                                onChange={e => setDuplicateTarget(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDuplicateModal(false)}
                                className="px-4 py-2 text-sm text-brand-accent hover:text-brand-primary transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDuplicate}
                                disabled={!duplicateTarget}
                                className="px-5 py-2 bg-brand-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50"
                            >
                                Duplicate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
