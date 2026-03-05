import ApplicationLogo from '@/Components/ApplicationLogo';
import ViewSwitcher from '@/Components/ViewSwitcher';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, useState } from 'react';

/* ─── SVG Icon ─── */
const Icon = ({ d, className = 'w-6 h-6' }: { d: string; className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
);

/* ─── Bottom tab items (the employee's daily tools) ─── */
const tabs = [
    {
        label: 'Home',
        href: '/app',
        icon: 'M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
    },
    {
        label: 'Clock',
        href: '/app/time-clock',
        icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
        label: 'Schedule',
        href: '/app/schedule',
        icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
    },
    {
        label: 'Chat',
        href: '/app/chat',
        icon: 'M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155',
    },
    {
        label: 'More',
        href: '/app/more',
        icon: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5',
    },
];

/* ─── Main User Layout ─── */
export default function UserLayout({
    title,
    children,
}: PropsWithChildren<{ title?: string }>) {
    const { props } = usePage();
    const user = props.auth.user;
    const currentUrl = usePage().url;
    const [profileOpen, setProfileOpen] = useState(false);

    const isTabActive = (href: string) => {
        if (href === '/app') return currentUrl === '/app';
        return currentUrl.startsWith(href);
    };

    return (
        <div className="flex min-h-screen flex-col bg-gray-50">
            {/* Top header */}
            <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4">
                <ApplicationLogo size="sm" />

                <div className="flex-1" />

                <ViewSwitcher />

                {/* Profile avatar */}
                <div className="relative">
                    <button
                        onClick={() => setProfileOpen(!profileOpen)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-white text-xs font-bold"
                    >
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </button>

                    {profileOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                            <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                                <div className="px-4 py-2 border-b border-gray-100">
                                    <p className="text-sm font-medium text-brand-primary">{user.name}</p>
                                    <p className="text-xs text-brand-accent">{user.email}</p>
                                </div>
                                <Link
                                    href="/app/profile"
                                    className="block px-4 py-2 text-sm text-brand-secondary hover:bg-gray-50"
                                    onClick={() => setProfileOpen(false)}
                                >
                                    My Profile
                                </Link>
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                                >
                                    Log Out
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </header>

            {/* Page title bar (optional) */}
            {title && (
                <div className="bg-white border-b border-gray-200 px-4 py-3">
                    <h1 className="text-lg font-semibold font-heading text-brand-primary">{title}</h1>
                </div>
            )}

            {/* Page content */}
            <main className="flex-1 overflow-y-auto p-4 pb-24">
                {children}
            </main>

            {/* Bottom tab navigation */}
            <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-gray-200 bg-white safe-area-bottom">
                <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
                    {tabs.map((tab) => {
                        const active = isTabActive(tab.href);
                        return (
                            <Link
                                key={tab.label}
                                href={tab.href}
                                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                                    active
                                        ? 'text-brand-primary'
                                        : 'text-gray-400 hover:text-brand-secondary'
                                }`}
                            >
                                <Icon
                                    d={tab.icon}
                                    className={`w-6 h-6 ${active ? 'stroke-[2]' : ''}`}
                                />
                                <span className={`text-[10px] font-medium ${active ? 'font-semibold' : ''}`}>
                                    {tab.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
