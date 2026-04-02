import UserLayout from '@/Layouts/UserLayout';
import { Head, Link, usePage } from '@inertiajs/react';

const Icon = ({ d, className = 'w-5 h-5' }: { d: string; className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
);

interface RecentUpdate {
    id: number;
    title: string;
    type: string;
    creator_name: string;
    published_at: string;
    is_read: boolean;
}

interface UpcomingEvent {
    id: number;
    title: string;
    type: string;
    starts_at: string;
    location: string | null;
}

interface UserHomeProps {
    stats?: {
        hoursThisWeek: number;
        upcomingShifts: number;
        openTasks: number;
        unreadMessages: number;
    };
    recentUpdates?: RecentUpdate[];
    upcomingEvents?: UpcomingEvent[];
}

const updateTypeIcons: Record<string, string> = {
    announcement: 'M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46',
    news: 'M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5',
    event: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
    poll: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
};

const eventTypeIcons: Record<string, string> = {
    general: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
    meeting: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
    social: 'M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z',
    training: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5',
    other: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
};

function timeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function daysUntil(dateStr: string): string {
    const now = new Date();
    const d = new Date(dateStr);
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff < 7) return `In ${diff} days`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function UserHome({ stats, recentUpdates = [], upcomingEvents = [] }: UserHomeProps) {
    const user = usePage().props.auth.user;

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <UserLayout>
            <Head title="Home" />

            <div className="space-y-5 max-w-lg mx-auto">
                {/* Welcome */}
                <div className="bg-gradient-to-r from-brand-primary to-brand-primary-light rounded-2xl p-5 text-white">
                    <p className="text-sm text-white/70">{greeting()}</p>
                    <h1 className="text-xl font-bold font-heading mt-0.5">
                        {user.name.split(' ')[0]}
                    </h1>
                    <p className="text-sm text-white/80 mt-2">
                        Here's your day at a glance.
                    </p>
                </div>

                {/* Clock In CTA */}
                <Link
                    href="/app/time-clock"
                    className="flex items-center gap-4 rounded-2xl bg-white border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                        <Icon d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                        <p className="text-base font-semibold font-heading text-brand-primary">Clock In</p>
                        <p className="text-sm text-brand-accent">
                            {stats?.hoursThisWeek ?? 0}h logged this week
                        </p>
                    </div>
                    <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </Link>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-3">
                    <Link href="/app/schedule" className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-center mb-2">
                            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                                <Icon d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </div>
                        </div>
                        <p className="text-lg font-bold font-heading text-brand-primary">{stats?.upcomingShifts ?? 0}</p>
                        <p className="text-[10px] text-brand-accent mt-0.5">Upcoming Shifts</p>
                    </Link>

                    <Link href="/app/tasks" className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-center mb-2">
                            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                                <Icon d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25" />
                            </div>
                        </div>
                        <p className="text-lg font-bold font-heading text-brand-primary">{stats?.openTasks ?? 0}</p>
                        <p className="text-[10px] text-brand-accent mt-0.5">My Tasks</p>
                    </Link>

                    <Link href="/app/chat" className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-center mb-2">
                            <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
                                <Icon d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                            </div>
                        </div>
                        <p className="text-lg font-bold font-heading text-brand-primary">{stats?.unreadMessages ?? 0}</p>
                        <p className="text-[10px] text-brand-accent mt-0.5">Messages</p>
                    </Link>
                </div>

                {/* Upcoming Events */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-semibold font-heading text-brand-primary">Upcoming Events</h3>
                        <Link href="/app/events" className="text-xs text-brand-primary font-medium hover:underline">View All</Link>
                    </div>
                    {upcomingEvents.length === 0 ? (
                        <div className="flex items-center gap-3 text-sm text-brand-accent py-4 justify-center">
                            <svg className="w-7 h-7 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                            <span>No upcoming events</span>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {upcomingEvents.map(event => {
                                const startDate = new Date(event.starts_at);
                                const monthShort = startDate.toLocaleDateString('en-US', { month: 'short' });
                                const dayNum = startDate.getDate();
                                return (
                                    <Link key={event.id} href="/app/events"
                                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors -mx-1">
                                        <div className="w-11 h-11 rounded-xl bg-brand-primary/10 text-brand-primary flex flex-col items-center justify-center flex-shrink-0">
                                            <span className="text-[8px] font-bold uppercase leading-none">{monthShort}</span>
                                            <span className="text-base font-black leading-tight">{dayNum}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{event.title}</p>
                                            <p className="text-xs text-gray-400">
                                                {daysUntil(event.starts_at)}
                                                {event.location && ` · ${event.location}`}
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <Icon d={eventTypeIcons[event.type] || eventTypeIcons.general} className="w-4 h-4 text-gray-300" />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Recent Feed / Updates */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-semibold font-heading text-brand-primary">Recent Updates</h3>
                        <Link href="/app/feed" className="text-xs text-brand-primary font-medium hover:underline">View Feed</Link>
                    </div>
                    {recentUpdates.length === 0 ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm text-brand-accent">
                                <div className="h-2 w-2 rounded-full bg-green-400 shrink-0" />
                                <span>Welcome to Business Glu!</span>
                            </div>
                            <p className="text-xs text-gray-400 text-center pt-2">
                                Company updates will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {recentUpdates.map(update => (
                                <Link key={update.id} href="/app/feed"
                                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors -mx-1">
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${update.is_read ? 'bg-gray-300' : 'bg-brand-primary'}`} />
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center flex-shrink-0">
                                        <Icon d={updateTypeIcons[update.type] || updateTypeIcons.announcement} className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm truncate ${update.is_read ? 'text-gray-600' : 'font-semibold text-gray-900'}`}>
                                            {update.title}
                                        </p>
                                        <p className="text-xs text-gray-400">{update.creator_name} · {timeAgo(update.published_at)}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Today's Schedule */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-base font-semibold font-heading text-brand-primary mb-3">
                        Today's Schedule
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-brand-accent py-4 justify-center">
                        <svg className="w-7 h-7 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        <span>No shifts scheduled for today</span>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
