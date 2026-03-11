import UserLayout from '@/Layouts/UserLayout';
import { Head, usePage, router } from '@inertiajs/react';

interface ShiftData {
    id: number;
    user_id: number | null;
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
}

interface DateInfo {
    date: string;
    dayName: string;
    dayNumber: string;
    isToday: boolean;
}

interface Props {
    dates: DateInfo[];
    myShifts: ShiftData[];
    upcomingShifts: ShiftData[];
    openShifts: ShiftData[];
    weekTotalHours: number;
    weekLabel: string;
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function MySchedule({ dates, myShifts, upcomingShifts, openShifts, weekTotalHours, weekLabel }: Props) {
    const page = usePage();
    const flash = (page.props as any).flash ?? {};

    const handleClaim = (shiftId: number) => {
        router.post(route('scheduling.claim', shiftId), {}, { preserveScroll: true });
    };

    // Group this week's shifts by date
    const shiftsByDate: Record<string, ShiftData[]> = {};
    dates.forEach(d => { shiftsByDate[d.date] = []; });
    myShifts.forEach(s => {
        if (shiftsByDate[s.date]) shiftsByDate[s.date].push(s);
    });

    // Find today's shifts
    const todayStr = new Date().toISOString().split('T')[0];
    const todayShifts = myShifts.filter(s => s.date === todayStr);

    return (
        <UserLayout title="My Schedule">
            <Head title="My Schedule" />

            <div className="space-y-5 max-w-lg mx-auto">
                {/* Flash messages */}
                {flash.success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                        {flash.success}
                    </div>
                )}
                {flash.error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                        {flash.error}
                    </div>
                )}

                {/* Week summary */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold font-heading text-brand-primary">{weekLabel}</p>
                        <div className="text-right">
                            <p className="text-xs text-brand-accent">This week</p>
                            <p className="text-lg font-bold font-heading text-brand-primary">{weekTotalHours}h</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {dates.map(day => {
                            const hasShift = shiftsByDate[day.date]?.length > 0;
                            return (
                                <div
                                    key={day.date}
                                    className={`text-center py-2 rounded-lg font-medium ${
                                        day.isToday
                                            ? 'bg-brand-primary text-white'
                                            : hasShift
                                            ? 'bg-brand-primary/10 text-brand-primary'
                                            : 'text-brand-accent'
                                    }`}
                                >
                                    <div className="text-sm font-bold">{day.dayName}</div>
                                    <div className="text-[10px] mt-0.5 opacity-75">{day.dayNumber}</div>
                                    {hasShift && !day.isToday && (
                                        <div className="w-1.5 h-1.5 bg-brand-primary rounded-full mx-auto mt-0.5" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Today's shifts */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-base font-semibold font-heading text-brand-primary mb-3">
                        Today's Shifts
                    </h3>
                    {todayShifts.length > 0 ? (
                        <div className="space-y-3">
                            {todayShifts.map(shift => (
                                <div
                                    key={shift.id}
                                    className="rounded-xl p-4 border"
                                    style={{ borderColor: shift.color + '40', backgroundColor: shift.color + '08' }}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-2.5 h-2.5 rounded-full"
                                                    style={{ backgroundColor: shift.color }}
                                                />
                                                <span className="text-sm font-semibold text-brand-primary">
                                                    {shift.start_time} – {shift.end_time}
                                                </span>
                                            </div>
                                            {shift.title && (
                                                <p className="text-sm text-brand-secondary mt-1 ml-[18px]">{shift.title}</p>
                                            )}
                                            {shift.location && (
                                                <p className="text-xs text-brand-accent mt-1 ml-[18px]">
                                                    <svg className="w-3 h-3 inline mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                                    </svg>
                                                    {shift.location}
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-xs font-medium text-brand-accent">{shift.duration_label}</span>
                                    </div>
                                    {shift.notes && (
                                        <p className="text-xs text-brand-accent mt-2 ml-[18px] border-t border-gray-100 pt-2">{shift.notes}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <svg className="mx-auto h-10 w-10 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                            <p className="text-sm text-brand-accent mt-2">No shifts scheduled today</p>
                        </div>
                    )}
                </div>

                {/* Upcoming shifts */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-base font-semibold font-heading text-brand-primary mb-3">
                        Upcoming
                    </h3>
                    {upcomingShifts.length > 0 ? (
                        <div className="space-y-2">
                            {upcomingShifts.map(shift => (
                                <div
                                    key={shift.id}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-100 hover:bg-gray-50"
                                >
                                    <div
                                        className="w-1 h-10 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: shift.color }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-brand-accent">{formatDate(shift.date)}</p>
                                        <p className="text-sm font-medium text-brand-primary">
                                            {shift.start_time} – {shift.end_time}
                                            {shift.title ? ` · ${shift.title}` : ''}
                                        </p>
                                        {shift.location && (
                                            <p className="text-xs text-brand-accent truncate">{shift.location}</p>
                                        )}
                                    </div>
                                    <span className="text-xs font-medium text-brand-accent">{shift.duration_label}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-sm text-brand-accent">No upcoming shifts</p>
                        </div>
                    )}
                </div>

                {/* Open shifts */}
                {openShifts.length > 0 && (
                    <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm">
                        <h3 className="text-base font-semibold font-heading text-amber-700 mb-3">
                            Open Shifts
                        </h3>
                        <p className="text-xs text-amber-600 mb-3">These shifts are available — claim one to add it to your schedule.</p>
                        <div className="space-y-2">
                            {openShifts.map(shift => (
                                <div
                                    key={shift.id}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-100"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-amber-600">{formatDate(shift.date)}</p>
                                        <p className="text-sm font-medium text-amber-800">
                                            {shift.start_time} – {shift.end_time}
                                            {shift.title ? ` · ${shift.title}` : ''}
                                        </p>
                                        {shift.location && (
                                            <p className="text-xs text-amber-600 truncate">{shift.location}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleClaim(shift.id)}
                                        className="px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition flex-shrink-0"
                                    >
                                        Claim
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </UserLayout>
    );
}
