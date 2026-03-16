import ApplicationLogo from '@/Components/ApplicationLogo';
import ViewSwitcher from '@/Components/ViewSwitcher';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, useState } from 'react';

/* ─── SVG Icon ─── */
const Icon = ({ d, className = 'w-5 h-5' }: { d: string; className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
);

const icons = {
    home: 'M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
    clock: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
    schedule: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
    chat: 'M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155',
    tasks: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25',
    forms: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
    updates: 'M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5',
    timeoff: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
    documents: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
    directory: 'M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z',
    knowledge: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
    profile: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
    chevronDown: 'M19.5 8.25l-7.5 7.5-7.5-7.5',
    collapse: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12',
    logout: 'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9',
};

/* ─── Navigation structure ─── */
interface NavItem {
    label: string;
    icon: keyof typeof icons;
    href: string;
}

const navigation: { section: string; items: NavItem[] }[] = [
    {
        section: '',
        items: [
            { label: 'Home', icon: 'home', href: '/app' },
        ],
    },
    {
        section: 'My Work',
        items: [
            { label: 'Time Clock', icon: 'clock', href: '/app/time-clock' },
            { label: 'Schedule', icon: 'schedule', href: '/app/schedule' },
            { label: 'Tasks', icon: 'tasks', href: '/app/tasks' },
            { label: 'Forms', icon: 'forms', href: '/app/forms' },
        ],
    },
    {
        section: 'Communication',
        items: [
            { label: 'Chat', icon: 'chat', href: '/app/chat' },
            { label: 'Updates', icon: 'updates', href: '/app/updates' },
            { label: 'Events', icon: 'schedule', href: '/app/events' },
            { label: 'Surveys', icon: 'forms', href: '/app/surveys' },
            { label: 'Help Desk', icon: 'tasks', href: '/app/help-desk' },
        ],
    },
    {
        section: 'HR & Info',
        items: [
            { label: 'Courses', icon: 'knowledge', href: '/app/courses' },
            { label: 'Time Off', icon: 'timeoff', href: '/app/time-off' },
            { label: 'Documents', icon: 'documents', href: '/app/documents' },
            { label: 'Recognition', icon: 'updates', href: '/app/recognition' },
            { label: 'Directory', icon: 'directory', href: '/app/directory' },
            { label: 'Knowledge Base', icon: 'knowledge', href: '/app/knowledge-base' },
        ],
    },
    {
        section: 'Account',
        items: [
            { label: 'My Profile', icon: 'profile', href: '/app/profile' },
        ],
    },
];

/* ─── Sidebar Nav Link ─── */
function SidebarLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
    const currentUrl = usePage().url;
    const isActive =
        item.href === '/app'
            ? currentUrl === '/app'
            : currentUrl.startsWith(item.href);

    return (
        <Link
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                    ? 'bg-brand-primary/10 text-brand-primary'
                    : 'text-brand-secondary hover:bg-gray-100 hover:text-brand-primary'
            } ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? item.label : undefined}
        >
            <Icon d={icons[item.icon]} className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
        </Link>
    );
}

/* ─── Main User Layout ─── */
export default function UserLayout({
    title,
    children,
}: PropsWithChildren<{ title?: string }>) {
    const user = usePage().props.auth.user;
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const sidebarContent = (
        <div className="flex h-full flex-col">
            {/* Logo */}
            <div className={`flex items-center border-b border-gray-200 ${collapsed ? 'justify-center px-2 py-4' : 'px-4 py-4'}`}>
                {collapsed ? (
                    <ApplicationLogo size="sm" variant="stacked" />
                ) : (
                    <ApplicationLogo size="sm" />
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
                {navigation.map((group) => (
                    <div key={group.section || 'main'}>
                        {group.section && !collapsed && (
                            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-brand-accent">
                                {group.section}
                            </p>
                        )}
                        {group.section && collapsed && (
                            <div className="mb-2 border-t border-gray-200" />
                        )}
                        <div className="space-y-1">
                            {group.items.map((item) => (
                                <SidebarLink key={item.label} item={item} collapsed={collapsed} />
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer: collapse toggle */}
            <div className="border-t border-gray-200 p-3">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-brand-accent hover:bg-gray-100 hover:text-brand-primary transition-colors"
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <Icon d={icons.collapse} className="w-5 h-5" />
                    {!collapsed && <span>Collapse</span>}
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar — mobile */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:hidden ${
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {sidebarContent}
            </aside>

            {/* Sidebar — desktop */}
            <aside
                className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-gray-200 transition-all duration-200 ${
                    collapsed ? 'lg:w-16' : 'lg:w-60'
                }`}
            >
                {sidebarContent}
            </aside>

            {/* Main content area */}
            <div className={`flex flex-1 flex-col transition-all duration-200 ${collapsed ? 'lg:pl-16' : 'lg:pl-60'}`}>
                {/* Top bar */}
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 sm:px-6">
                    {/* Mobile hamburger */}
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="lg:hidden text-brand-accent hover:text-brand-primary"
                    >
                        <Icon d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" className="w-6 h-6" />
                    </button>

                    {/* Page title */}
                    {title && (
                        <h1 className="text-lg font-semibold font-heading text-brand-primary">
                            {title}
                        </h1>
                    )}

                    <div className="flex-1" />

                    {/* View switcher */}
                    <ViewSwitcher />

                    {/* User menu */}
                    <div className="relative">
                        <button
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-brand-secondary hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-white text-xs font-bold">
                                {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <span className="hidden sm:block">{user.name}</span>
                            <Icon d={icons.chevronDown} className="w-4 h-4" />
                        </button>

                        {userMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                                <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                                    <div className="px-4 py-2 border-b border-gray-100">
                                        <p className="text-sm font-medium text-brand-primary">{user.name}</p>
                                        <p className="text-xs text-brand-accent">{user.email}</p>
                                        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary font-medium capitalize">
                                            {user.role?.replace('_', ' ') ?? 'member'}
                                        </span>
                                    </div>
                                    <Link
                                        href="/app/profile"
                                        className="block px-4 py-2 text-sm text-brand-secondary hover:bg-gray-50"
                                        onClick={() => setUserMenuOpen(false)}
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

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
