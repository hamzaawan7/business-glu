import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, usePage } from '@inertiajs/react';

const Icon = ({ d, className = 'w-5 h-5' }: { d: string; className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
);

const statIcons = {
    users: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0Zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0Z',
    clock: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
    tasks: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25',
    chat: 'M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155',
};

interface DashboardProps {
    stats?: {
        teamMembers: number;
        clockedIn: number;
        openTasks: number;
        unreadMessages: number;
    };
}

export default function Dashboard({ stats }: DashboardProps) {
    const user = usePage().props.auth.user;

    const statCards = [
        {
            label: 'Team Members',
            value: stats?.teamMembers ?? 0,
            icon: statIcons.users,
            color: 'bg-blue-50 text-blue-600',
            href: '/admin/team',
        },
        {
            label: 'Clocked In',
            value: stats?.clockedIn ?? 0,
            icon: statIcons.clock,
            color: 'bg-green-50 text-green-600',
            href: '/admin/time-clock',
        },
        {
            label: 'Open Tasks',
            value: stats?.openTasks ?? 0,
            icon: statIcons.tasks,
            color: 'bg-amber-50 text-amber-600',
            href: '/admin/tasks',
        },
        {
            label: 'Messages',
            value: stats?.unreadMessages ?? 0,
            icon: statIcons.chat,
            color: 'bg-purple-50 text-purple-600',
            href: '/admin/chat',
        },
    ];

    const quickActions = [
        { label: 'Clock In', href: '/admin/time-clock', icon: statIcons.clock, color: 'bg-green-500 hover:bg-green-600' },
        { label: 'Create Task', href: '/admin/tasks', icon: statIcons.tasks, color: 'bg-amber-500 hover:bg-amber-600' },
        { label: 'Send Message', href: '/admin/chat', icon: statIcons.chat, color: 'bg-purple-500 hover:bg-purple-600' },
        { label: 'View Team', href: '/admin/team', icon: statIcons.users, color: 'bg-blue-500 hover:bg-blue-600' },
    ];

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <AdminLayout title="Dashboard">
            <Head title="Dashboard" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Welcome banner */}
                <div className="bg-gradient-to-r from-brand-primary to-brand-primary-light rounded-xl p-6 text-white">
                    <h2 className="text-2xl font-bold font-heading">
                        {greeting()}, {user.name.split(' ')[0]}!
                    </h2>
                    <p className="mt-1 text-white/80 text-sm">
                        Here's what's happening with your team today.
                    </p>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((stat) => (
                        <Link
                            key={stat.label}
                            href={stat.href}
                            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className={`rounded-lg p-2.5 ${stat.color}`}>
                                    <Icon d={stat.icon} className="w-5 h-5" />
                                </div>
                                <svg className="w-4 h-4 text-gray-300 group-hover:text-brand-primary transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                                </svg>
                            </div>
                            <p className="text-2xl font-bold font-heading text-brand-primary">
                                {stat.value}
                            </p>
                            <p className="text-sm text-brand-accent mt-1">{stat.label}</p>
                        </Link>
                    ))}
                </div>

                {/* Content grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-lg font-semibold font-heading text-brand-primary mb-4">
                            Quick Actions
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {quickActions.map((action) => (
                                <Link
                                    key={action.label}
                                    href={action.href}
                                    className={`flex flex-col items-center gap-2 rounded-lg p-3 text-white text-sm font-medium transition-colors ${action.color}`}
                                >
                                    <Icon d={action.icon} className="w-6 h-6" />
                                    {action.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-lg font-semibold font-heading text-brand-primary mb-4">
                            Recent Activity
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm text-brand-accent">
                                <div className="h-2 w-2 rounded-full bg-green-400" />
                                <span>System initialized — Welcome to Business Glu!</span>
                                <span className="ml-auto text-xs text-gray-400">Just now</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-brand-accent">
                                <div className="h-2 w-2 rounded-full bg-blue-400" />
                                <span>Your account was created</span>
                                <span className="ml-auto text-xs text-gray-400">Today</span>
                            </div>
                            <div className="border-t border-gray-100 pt-3 mt-3">
                                <p className="text-xs text-gray-400 text-center">
                                    Activity will appear here as your team starts using Business Glu.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Module overview */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold font-heading text-brand-primary mb-4">
                        Getting Started
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { name: 'Time Clock', desc: 'Track hours with GPS & geofencing', href: '/admin/time-clock', status: 'ready' },
                            { name: 'Scheduling', desc: 'Create shifts & manage availability', href: '/admin/scheduling', status: 'ready' },
                            { name: 'Team Chat', desc: 'Communicate with your team', href: '/admin/chat', status: 'ready' },
                            { name: 'Quick Tasks', desc: 'Assign and track tasks', href: '/admin/tasks', status: 'ready' },
                            { name: 'Forms', desc: 'Digital forms & checklists', href: '/admin/forms', status: 'ready' },
                            { name: 'Courses', desc: 'Train & onboard your team', href: '/admin/courses', status: 'coming-soon' },
                        ].map((module) => (
                            <Link
                                key={module.name}
                                href={module.href}
                                className="flex items-center gap-3 rounded-lg border border-gray-100 p-4 hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-colors"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-brand-primary">{module.name}</p>
                                        {module.status === 'coming-soon' && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                                                Soon
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-brand-accent mt-0.5">{module.desc}</p>
                                </div>
                                <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
