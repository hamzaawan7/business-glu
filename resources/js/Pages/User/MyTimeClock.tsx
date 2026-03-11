import UserLayout from '@/Layouts/UserLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

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
    activeEntry: TimeEntryData | null;
    recentEntries: TimeEntryData[];
    weekTotalMinutes: number;
}

function formatMinutes(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
}

function LiveTimer({ since }: { since: string }) {
    const [elapsed, setElapsed] = useState('');

    useEffect(() => {
        const start = new Date(since).getTime();
        const tick = () => {
            const diff = Math.floor((Date.now() - start) / 1000);
            const h = Math.floor(diff / 3600);
            const m = Math.floor((diff % 3600) / 60);
            const s = diff % 60;
            setElapsed(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [since]);

    return <span className="font-mono">{elapsed}</span>;
}

export default function MyTimeClock({ activeEntry, recentEntries, weekTotalMinutes }: Props) {
    const page = usePage();
    const flash = (page.props as any).flash ?? {};

    const clockInForm = useForm({ note: '' });
    const clockOutForm = useForm({ note: '' });

    const isClockedIn = !!activeEntry;
    const isOnBreak = activeEntry?.is_on_break ?? false;

    const handleClockIn = () => {
        clockInForm.post(route('time-clock.clock-in'), { preserveScroll: true });
    };

    const handleClockOut = () => {
        clockOutForm.post(route('time-clock.clock-out'), { preserveScroll: true });
    };

    const handleStartBreak = () => {
        router.post(route('time-clock.break-start'), {}, { preserveScroll: true });
    };

    const handleEndBreak = () => {
        router.post(route('time-clock.break-end'), {}, { preserveScroll: true });
    };

    return (
        <UserLayout title="Time Clock">
            <Head title="Time Clock" />

            <div className="space-y-5 max-w-lg mx-auto">
                {/* Flash Messages */}
                {flash.success && (
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                        <p className="text-sm text-green-700">{flash.success}</p>
                    </div>
                )}
                {flash.error && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                        <p className="text-sm text-red-700">{flash.error}</p>
                    </div>
                )}

                {/* Clock button */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm text-center">
                    {isClockedIn ? (
                        <>
                            <p className="text-sm text-brand-accent mb-2">
                                {isOnBreak ? '☕ On Break' : '🟢 Currently Clocked In'}
                            </p>
                            <div className="text-3xl font-bold font-heading text-brand-primary mb-4">
                                <LiveTimer since={activeEntry!.clock_in} />
                            </div>

                            {/* Break / Clock Out buttons */}
                            <div className="flex items-center justify-center gap-3">
                                {isOnBreak ? (
                                    <button
                                        onClick={handleEndBreak}
                                        className="flex-1 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
                                    >
                                        End Break
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleStartBreak}
                                        className="flex-1 rounded-xl border-2 border-amber-400 px-5 py-3 text-sm font-semibold text-amber-600 hover:bg-amber-50 transition-colors"
                                    >
                                        ☕ Take Break
                                    </button>
                                )}
                                <button
                                    onClick={handleClockOut}
                                    disabled={clockOutForm.processing}
                                    className="flex-1 rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                                >
                                    {clockOutForm.processing ? 'Clocking out...' : 'Clock Out'}
                                </button>
                            </div>

                            {/* Clocked in info */}
                            <div className="mt-4 text-xs text-brand-accent">
                                Clocked in at{' '}
                                <span className="font-medium text-brand-primary">
                                    {new Date(activeEntry!.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {activeEntry!.total_break_minutes > 0 && (
                                    <> · Breaks: {activeEntry!.total_break_minutes}m</>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-brand-accent mb-4">Ready to start your shift?</p>

                            <button
                                onClick={handleClockIn}
                                disabled={clockInForm.processing}
                                className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-green-500 text-white font-bold text-lg font-heading shadow-lg shadow-green-200 hover:bg-green-600 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {clockInForm.processing ? '...' : 'Clock In'}
                            </button>
                        </>
                    )}
                </div>

                {/* Summary */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-base font-semibold font-heading text-brand-primary mb-3">Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-brand-accent">Current Shift</p>
                            <p className="text-lg font-bold font-heading text-brand-primary">
                                {isClockedIn ? activeEntry!.total_formatted : '—'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-brand-accent">This Week</p>
                            <p className="text-lg font-bold font-heading text-brand-primary">
                                {formatMinutes(weekTotalMinutes)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Recent entries */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-base font-semibold font-heading text-brand-primary mb-3">
                        Recent Entries
                    </h3>
                    {recentEntries.length > 0 ? (
                        <div className="space-y-3">
                            {recentEntries.map((entry) => (
                                <div key={entry.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                    <div>
                                        <p className="text-sm font-medium text-brand-primary">
                                            {new Date(entry.clock_in).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </p>
                                        <p className="text-xs text-brand-accent">
                                            {new Date(entry.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {' → '}
                                            {entry.clock_out
                                                ? new Date(entry.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : '—'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-brand-primary">{entry.total_formatted}</p>
                                        {entry.total_break_minutes > 0 && (
                                            <p className="text-xs text-brand-accent">Break: {entry.total_break_minutes}m</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <svg className="mx-auto h-10 w-10 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-brand-accent mt-2">No time entries yet</p>
                            <p className="text-xs text-gray-400 mt-1">Clock in to start tracking your hours.</p>
                        </div>
                    )}
                </div>
            </div>
        </UserLayout>
    );
}
