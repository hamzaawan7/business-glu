import UserLayout from '@/Layouts/UserLayout';
import Icon from '@/Components/Icon';
import { Head } from '@inertiajs/react';

interface TimelineEvent {
    id: number;
    type: string;
    title: string;
    description: string | null;
    event_date: string;
    file_path: string | null;
    file_name: string | null;
    creator: { id: number; name: string } | null;
}

interface Props {
    events: TimelineEvent[];
    upcoming: TimelineEvent[];
}

const typeConfig: Record<string, { icon: string; color: string; label: string }> = {
    hired: { icon: 'party-popper', color: 'bg-green-100 text-green-700', label: 'Hired' },
    promotion: { icon: 'arrow-up', color: 'bg-blue-100 text-blue-700', label: 'Promotion' },
    role_change: { icon: 'arrow-path', color: 'bg-indigo-100 text-indigo-700', label: 'Role Change' },
    department_change: { icon: 'building', color: 'bg-purple-100 text-purple-700', label: 'Dept Change' },
    salary_change: { icon: 'currency-dollar', color: 'bg-yellow-100 text-yellow-700', label: 'Salary Change' },
    review: { icon: 'clipboard-list', color: 'bg-orange-100 text-orange-700', label: 'Review' },
    award: { icon: 'trophy', color: 'bg-amber-100 text-amber-700', label: 'Award' },
    training: { icon: 'book-open', color: 'bg-cyan-100 text-cyan-700', label: 'Training' },
    probation_end: { icon: 'check-circle', color: 'bg-emerald-100 text-emerald-700', label: 'Probation End' },
    anniversary: { icon: 'cake', color: 'bg-pink-100 text-pink-700', label: 'Anniversary' },
    termination: { icon: 'hand-wave', color: 'bg-red-100 text-red-700', label: 'Termination' },
    custom: { icon: 'pin', color: 'bg-slate-100 text-slate-600', label: 'Milestone' },
};

const getConfig = (type: string) => typeConfig[type] || typeConfig.custom;

export default function UserTimeline({ events, upcoming }: Props) {
    // Group events by year
    const groupedByYear: Record<string, TimelineEvent[]> = {};
    events.forEach(ev => {
        const year = new Date(ev.event_date).getFullYear().toString();
        if (!groupedByYear[year]) groupedByYear[year] = [];
        groupedByYear[year].push(ev);
    });
    const sortedYears = Object.keys(groupedByYear).sort((a, b) => Number(b) - Number(a));

    return (
        <UserLayout>
            <Head title="My Timeline" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Timeline</h1>
                    <p className="text-sm text-slate-500 mt-1">Your career journey and milestones.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Timeline */}
                    <div className="lg:col-span-2">
                        {events.length === 0 ? (
                            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                                No timeline events yet.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {sortedYears.map(year => (
                                    <div key={year}>
                                        <h3 className="text-sm font-bold text-slate-400 mb-3">{year}</h3>
                                        <div className="relative">
                                            <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />
                                            <div className="space-y-3">
                                                {groupedByYear[year].map(ev => {
                                                    const cfg = getConfig(ev.type);
                                                    return (
                                                        <div key={ev.id} className="relative pl-12">
                                                            <div className="absolute left-3 top-4 w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: '#495B67' }} />
                                                            <div className="bg-white rounded-xl border border-slate-200 p-4">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                                                                        <Icon name={cfg.icon} className="w-4 h-4 inline-block mr-1" /> {cfg.label}
                                                                    </span>
                                                                    <span className="text-xs text-slate-400">{new Date(ev.event_date).toLocaleDateString()}</span>
                                                                </div>
                                                                <h4 className="text-sm font-semibold text-slate-900">{ev.title}</h4>
                                                                {ev.description && <p className="text-xs text-slate-500 mt-1">{ev.description}</p>}
                                                                {ev.file_name && (
                                                                    <a href={route('timeline.download', ev.id)} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1">
                                                                        <Icon name="paperclip" className="w-3.5 h-3.5 inline-block mr-0.5" /> {ev.file_name}
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Upcoming Events */}
                    <div>
                        <div className="bg-white rounded-xl border border-slate-200 p-5">
                            <h3 className="text-sm font-bold text-slate-900 mb-3">Upcoming (90 days)</h3>
                            {upcoming.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-4">No upcoming events.</p>
                            ) : (
                                <div className="space-y-2">
                                    {upcoming.map(ev => {
                                        const cfg = getConfig(ev.type);
                                        const daysUntil = Math.ceil((new Date(ev.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                        return (
                                            <div key={ev.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                                                <span className="text-sm"><Icon name={cfg.icon} className="w-4 h-4 inline-block" /></span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-slate-900 truncate">{ev.title}</p>
                                                    <p className="text-xs text-slate-400">
                                                        {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="bg-white rounded-xl border border-slate-200 p-5 mt-4">
                            <h3 className="text-sm font-bold text-slate-900 mb-3">Summary</h3>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Total Events</span>
                                    <span className="font-medium text-slate-900">{events.length}</span>
                                </div>
                                {events.length > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">First Event</span>
                                        <span className="font-medium text-slate-900">{new Date(events[events.length - 1].event_date).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
