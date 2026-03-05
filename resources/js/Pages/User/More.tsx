import UserLayout from '@/Layouts/UserLayout';
import { Head, Link, usePage } from '@inertiajs/react';

const Icon = ({ d, className = 'w-5 h-5' }: { d: string; className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
);

const menuItems = [
    {
        section: 'Tools',
        items: [
            { label: 'My Tasks', href: '/app/tasks', icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25' },
            { label: 'Forms', href: '/app/forms', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
            { label: 'Updates', href: '/app/updates', icon: 'M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5' },
        ],
    },
    {
        section: 'HR',
        items: [
            { label: 'Time Off', href: '/app/time-off', icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5' },
            { label: 'Documents', href: '/app/documents', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
            { label: 'Directory', href: '/app/directory', icon: 'M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z' },
            { label: 'Knowledge Base', href: '/app/knowledge-base', icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25' },
        ],
    },
    {
        section: 'Account',
        items: [
            { label: 'My Profile', href: '/app/profile', icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z' },
        ],
    },
];

export default function More() {
    const user = usePage().props.auth.user;

    return (
        <UserLayout title="More">
            <Head title="More" />

            <div className="space-y-5 max-w-lg mx-auto">
                {/* User card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary text-white text-lg font-bold">
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                            <p className="text-base font-semibold font-heading text-brand-primary">{user.name}</p>
                            <p className="text-sm text-brand-accent">{user.email}</p>
                            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary font-medium capitalize">
                                {user.role?.replace('_', ' ') ?? 'member'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Menu sections */}
                {menuItems.map((section) => (
                    <div key={section.section}>
                        <p className="text-xs font-semibold uppercase tracking-wider text-brand-accent px-1 mb-2">
                            {section.section}
                        </p>
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            {section.items.map((item, i) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors ${
                                        i < section.items.length - 1 ? 'border-b border-gray-100' : ''
                                    }`}
                                >
                                    <div className="rounded-lg bg-brand-primary/10 p-2 text-brand-primary">
                                        <Icon d={item.icon} />
                                    </div>
                                    <span className="text-sm font-medium text-brand-secondary flex-1">{item.label}</span>
                                    <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Logout */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="flex items-center gap-3 px-4 py-3.5 w-full text-left hover:bg-gray-50 transition-colors"
                    >
                        <div className="rounded-lg bg-red-50 p-2 text-red-500">
                            <Icon d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                        </div>
                        <span className="text-sm font-medium text-red-600">Log Out</span>
                    </Link>
                </div>
            </div>
        </UserLayout>
    );
}
