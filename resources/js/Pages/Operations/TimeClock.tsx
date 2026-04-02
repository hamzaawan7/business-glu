import AdminLayout from '@/Layouts/AdminLayout';
import { Head, usePage, router } from '@inertiajs/react';

interface BreakEntry {
    id: number;
    start: string;
    end: string | null;
    type: string;
    duration_minutes: number;
    is_active: boolean;
}

interface TimeEntryData {
    id: number;
    user_id: number;
    user: { id: number; name: string; email: string; role: string } | null;
    clock_in: string;
    clock_out: string | null;
    clock_in_note: string | null;
    clock_out_note: string | null;
    total_break_minutes: number;
    total_minutes: number;
    total_formatted: string;
    status: string;
    is_active: boolean;
    is_on_break: boolean;
    breaks: BreakEntry[];
}

interface Props {
    entries: TimeEntryData[];
    clockedInCount: number;
    date: string;
    myActiveEntry: TimeEntryData | null;
}

const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    edited: 'bg-amber-100 text-amber-700',
    approved: 'bg-purple-100 text-purple-700',
};

export default function TimeClock({ entries, clockedInCount, date, myActiveEntry }: Props) {
    const page = usePage();
    const flash = (page.props as any).flash ?? {};

    const handleClockIn = () => {
        router.post(route('time-clock.clock-in'), {}, { preserveScroll: true });
    };

    const handleClockOut = () => {
        router.post(route('time-clock.clock-out'), {}, { preserveScroll: true });
    };

    const handleDateChange = (newDate: string) => {
        router.get(route('admin.time-clock.index'), { date: newDate }, { preserveState: true, preserveScroll: true });
    };

    const activeEntries = entries.filter(e => e.is_active);
    const completedEntries = entries.filter(e => !e.is_active);
    const totalHoursToday = entries.reduce((sum, e) => sum + e.total_minutes, 0);

    return (
        <AdminLayout title="Time Clock">
            <Head title="Time Clock" />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Flash Messages */}
                {flash.success && (
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                        <p className="text-sm text-green-700">{flash.success}</p>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold font-heading text-brand-primary">Time Clock</h2>
                        <p className="text-sm text-brand-accent mt-1">
                            Track employee work hours and manage timesheets.
                        </p>
                    </div>
                    {/* Admin quick clock in/out */}
                    <div>
                        {myActiveEntry ? (
                            <button
                                onClick={handleClockOut}
                                className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition-colors"
                            >
                                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                                Clock Out
                            </button>
                        ) : (
                            <button
                                onClick={handleClockIn}
                                className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-600 transition-colors"
                            >
                                Clock In
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Currently Clocked In', value: clockedInCount, color: 'text-green-600' },
                        { label: "Today's Entries", value: entries.length, color: 'text-brand-primary' },
                        { label: 'On Break', value: entries.filter(e => e.is_on_break).length, color: 'text-amber-600' },
                        {
                            label: 'Total Hours Today',
                            value: `${Math.floor(totalHoursToday / 60)}h ${totalHoursToday % 60}m`,
                            color: 'text-brand-primary',
                        },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
                            <p className={`text-2xl font-bold font-heading ${stat.color}`}>{stat.value}</p>
                            <p className="text-xs text-brand-accent mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Date Picker */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            const d = new Date(date);
                            d.setDate(d.getDate() - 1);
                            handleDateChange(d.toISOString().split('T')[0]);
                        }}
                        className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 transition-colors"
                    >
                        <svg className="w-4 h-4 text-brand-accent" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-primary focus:ring-brand-primary"
                    />
                    <button
                        onClick={() => {
                            const d = new Date(date);
                            d.setDate(d.getDate() + 1);
                            handleDateChange(d.toISOString().split('T')[0]);
                        }}
                        className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 transition-colors"
                    >
                        <svg className="w-4 h-4 text-brand-accent" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>
                    <button
                        onClick={() => handleDateChange(new Date().toISOString().split('T')[0])}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-brand-accent hover:bg-gray-50 transition-colors"
                    >
                        Today
                    </button>
                </div>

                {/* Currently Active */}
                {activeEntries.length > 0 && (
                    <div className="bg-green-50 rounded-xl border border-green-200 p-4">
                        <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            Currently Clocked In ({activeEntries.length})
                        </h3>
                        <div className="space-y-2">
                            {activeEntries.map((entry) => (
                                <div key={entry.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-green-100">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                            {entry.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-brand-primary">{entry.user?.name}</p>
                                            <p className="text-xs text-brand-accent">
                                                Since {new Date(entry.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {entry.is_on_break && <span className="ml-2 text-amber-600 font-medium">On Break</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-semibold text-green-700">{entry.total_formatted}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Completed Entries Table */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-sm font-semibold text-brand-primary">
                            {completedEntries.length > 0
                                ? `Completed Entries (${completedEntries.length})`
                                : 'Entries'}
                        </h3>
                    </div>

                    {completedEntries.length > 0 ? (
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-brand-accent uppercase tracking-wider">Employee</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-brand-accent uppercase tracking-wider">Clock In</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-brand-accent uppercase tracking-wider">Clock Out</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-brand-accent uppercase tracking-wider">Breaks</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-brand-accent uppercase tracking-wider">Total</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-brand-accent uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {completedEntries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-white text-xs font-bold">
                                                    {entry.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'}
                                                </div>
                                                <span className="text-sm font-medium text-brand-primary">{entry.user?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-brand-secondary">
                                            {new Date(entry.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-brand-secondary">
                                            {entry.clock_out
                                                ? new Date(entry.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-brand-secondary">
                                            {entry.total_break_minutes > 0 ? `${entry.total_break_minutes}m` : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-brand-primary">
                                            {entry.total_formatted}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[entry.status] ?? 'bg-gray-100 text-gray-700'}`}>
                                                {entry.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="px-6 py-12 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="mt-3 text-sm text-brand-accent">No completed entries for this date.</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
