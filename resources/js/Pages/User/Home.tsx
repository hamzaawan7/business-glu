import UserLayout from '@/Layouts/UserLayout';
import { Head, Link, usePage } from '@inertiajs/react';

const Icon = ({ d, className = 'w-5 h-5' }: { d: string; className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
);

interface UserHomeProps {
    stats?: {
        hoursThisWeek: number;
        upcomingShifts: number;
        openTasks: number;
        unreadMessages: number;
    };
}

export default function UserHome({ stats }: UserHomeProps) {
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
                        {user.name.split(' ')[0]} 👋
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

                {/* Upcoming */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-base font-semibold font-heading text-brand-primary mb-3">
                        Today's Schedule
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-brand-accent py-6 justify-center">
                        <svg className="w-8 h-8 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        <span>No shifts scheduled for today</span>
                    </div>
                </div>

                {/* Recent updates */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-base font-semibold font-heading text-brand-primary mb-3">
                        Updates
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-brand-accent">
                            <div className="h-2 w-2 rounded-full bg-green-400 shrink-0" />
                            <span>Welcome to Business Glu!</span>
                        </div>
                        <p className="text-xs text-gray-400 text-center pt-2">
                            Company updates will appear here.
                        </p>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
