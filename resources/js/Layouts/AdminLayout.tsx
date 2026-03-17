import ApplicationLogo from '@/Components/ApplicationLogo';
import ViewSwitcher from '@/Components/ViewSwitcher';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState } from 'react';

/* ─── SVG Icon Components ─── */
const Icon = ({ d, className = 'w-5 h-5' }: { d: string; className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
);

const icons = {
    dashboard: 'M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
    users: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0Zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0Z',
    clock: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
    calendar: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
    tasks: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25',
    forms: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
    chat: 'M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155',
    updates: 'M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5',
    directory: 'M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z',
    knowledge: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
    surveys: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
    events: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z',
    helpdesk: 'M16.712 4.33a9.027 9.027 0 011.652 1.306c.51.51.944 1.064 1.306 1.652M16.712 4.33l-3.448 4.138m3.448-4.138a9.014 9.014 0 00-9.424 0M19.67 7.288l-4.138 3.448m4.138-3.448a9.014 9.014 0 010 9.424m-4.138-5.976a3.736 3.736 0 00-.88-1.388 3.737 3.737 0 00-1.388-.88m2.268 2.268a3.765 3.765 0 010 2.528m-2.268-4.796a3.765 3.765 0 00-2.528 0m4.796 4.796c-.181.506-.475.982-.88 1.388a3.736 3.736 0 01-1.388.88m2.268-2.268l4.138 3.448m0 0a9.027 9.027 0 01-1.306 1.652c-.51.51-1.064.944-1.652 1.306m0 0l-3.448-4.138m3.448 4.138a9.014 9.014 0 01-9.424 0m5.976-4.138a3.765 3.765 0 01-2.528 0m0 0a3.736 3.736 0 01-1.388-.88 3.737 3.737 0 01-.88-1.388m0 0l-4.138 3.448M7.288 19.67a9.014 9.014 0 010-9.424m4.796 4.796l-4.138 3.448m0 0A9.027 9.027 0 013.33 16.712a9.014 9.014 0 01-1.306-1.652m0 0l4.138-3.448M4.33 7.288A9.014 9.014 0 017.288 4.33m-2.958 2.958L8.468 10.736M7.288 4.33l3.448 4.138m0 0a3.765 3.765 0 012.528 0',
    courses: 'M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5',
    documents: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
    timeoff: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
    recognition: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
    settings: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z',
    settingsInner: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    chevronDown: 'M19.5 8.25l-7.5 7.5-7.5-7.5',
    chevronRight: 'M8.25 4.5l7.5 7.5-7.5 7.5',
    collapse: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12',
    logout: 'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9',
};

/* ─── Navigation structure ─── */
interface NavItem {
    label: string;
    icon: string;
    href?: string;
    routeName?: string;
    children?: { label: string; href: string; routeName: string }[];
}

const navigation: { section: string; items: NavItem[] }[] = [
    {
        section: '',
        items: [
            { label: 'Dashboard', icon: 'dashboard', href: '/admin/dashboard', routeName: 'admin.dashboard' },
        ],
    },
    {
        section: 'Operations',
        items: [
            { label: 'Time Clock', icon: 'clock', href: '/admin/time-clock', routeName: 'admin.time-clock.*' },
            { label: 'Scheduling', icon: 'calendar', href: '/admin/scheduling', routeName: 'admin.scheduling.*' },
            { label: 'Quick Tasks', icon: 'tasks', href: '/admin/tasks', routeName: 'admin.tasks.*' },
            { label: 'Forms', icon: 'forms', href: '/admin/forms', routeName: 'admin.forms.*' },
        ],
    },
    {
        section: 'Communication',
        items: [
            { label: 'Chat', icon: 'chat', href: '/admin/chat', routeName: 'admin.chat.*' },
            { label: 'Updates', icon: 'updates', href: '/admin/updates', routeName: 'admin.updates.*' },
            { label: 'Directory', icon: 'directory', href: '/admin/directory', routeName: 'admin.directory.*' },
            { label: 'Knowledge Base', icon: 'knowledge', href: '/admin/knowledge-base', routeName: 'admin.knowledge-base.*' },
            { label: 'Surveys', icon: 'surveys', href: '/admin/surveys', routeName: 'admin.surveys.*' },
            { label: 'Events', icon: 'events', href: '/admin/events', routeName: 'admin.events.*' },
            { label: 'Help Desk', icon: 'helpdesk', href: '/admin/help-desk', routeName: 'admin.help-desk.*' },
        ],
    },
    {
        section: 'HR & People',
        items: [
            { label: 'Courses', icon: 'courses', href: '/admin/courses', routeName: 'admin.courses.*' },
            { label: 'Documents', icon: 'documents', href: '/admin/documents', routeName: 'admin.documents.*' },
            { label: 'Time Off', icon: 'timeoff', href: '/admin/time-off', routeName: 'admin.time-off.*' },
            { label: 'Recognition', icon: 'recognition', href: '/admin/recognition', routeName: 'admin.recognition.*' },
            { label: 'Quizzes', icon: 'courses', href: '/admin/quizzes', routeName: 'admin.quizzes.*' },
            { label: 'Timeline', icon: 'courses', href: '/admin/timeline', routeName: 'admin.timeline.*' },
            { label: 'Org Chart', icon: 'users', href: '/admin/org-chart', routeName: 'admin.org-chart.*' },
            { label: 'Employee IDs', icon: 'users', href: '/admin/employee-ids', routeName: 'admin.employee-ids.*' },
        ],
    },
    {
        section: 'Admin',
        items: [
            { label: 'Team', icon: 'users', href: '/admin/team', routeName: 'admin.team.*' },
            { label: 'Analytics', icon: 'settings', href: '/admin/analytics', routeName: 'admin.analytics.*' },
            { label: 'Settings', icon: 'settings', href: '/admin/settings', routeName: 'admin.settings.*' },
        ],
    },
];

/* ─── Sidebar Nav Item ─── */
function SidebarLink({
    item,
    collapsed,
}: {
    item: NavItem;
    collapsed: boolean;
}) {
    const currentUrl = usePage().url;
    const isActive = item.href ? currentUrl.startsWith(item.href) : false;

    return (
        <Link
            href={item.href ?? '#'}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                    ? 'bg-brand-primary text-white'
                    : 'text-brand-secondary hover:bg-gray-100 hover:text-brand-primary'
            } ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? item.label : undefined}
        >
            <Icon d={icons[item.icon as keyof typeof icons] ?? icons.dashboard} className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
        </Link>
    );
}

/* ─── Main Layout ─── */
export default function AdminLayout({
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
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
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
                    collapsed ? 'lg:w-16' : 'lg:w-64'
                }`}
            >
                {sidebarContent}
            </aside>

            {/* Main content area */}
            <div className={`flex flex-1 flex-col transition-all duration-200 ${collapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
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
                                        href={route('profile.edit')}
                                        className="block px-4 py-2 text-sm text-brand-secondary hover:bg-gray-50"
                                        onClick={() => setUserMenuOpen(false)}
                                    >
                                        Profile
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
