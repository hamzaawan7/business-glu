import UserLayout from '@/Layouts/UserLayout';
import Icon from '@/Components/Icon';
import { Head, usePage, router } from '@inertiajs/react';
import { useState } from 'react';

interface MemberData {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    position: string | null;
    department: string | null;
    location: string | null;
    bio: string | null;
    avatar_url: string | null;
    hire_date: string | null;
}

interface Props {
    members: MemberData[];
    departments: string[];
    filters: { search: string; department: string };
}

const roleLabels: Record<string, string> = {
    owner: 'Owner',
    admin: 'Admin',
    manager: 'Manager',
    member: 'Employee',
};

const roleColors: Record<string, string> = {
    owner: 'bg-purple-100 text-purple-700',
    admin: 'bg-blue-100 text-blue-700',
    manager: 'bg-amber-100 text-amber-700',
    member: 'bg-gray-100 text-gray-600',
};

function getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function UserDirectory({ members, departments, filters }: Props) {
    const page = usePage();
    const currentUser = (page.props as any).auth?.user;

    const [viewMember, setViewMember] = useState<MemberData | null>(null);
    const [searchValue, setSearchValue] = useState(filters.search || '');

    function handleSearch(value: string) {
        setSearchValue(value);
        clearTimeout((window as any).__dirUserSearch);
        (window as any).__dirUserSearch = setTimeout(() => {
            router.get('/app/directory', { ...filters, search: value }, { preserveState: true, replace: true });
        }, 400);
    }

    function handleFilterDept(value: string) {
        router.get('/app/directory', { ...filters, department: value }, { preserveState: true, replace: true });
    }

    // Group by department
    const grouped = members.reduce<Record<string, MemberData[]>>((acc, m) => {
        const dept = m.department || 'Other';
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(m);
        return acc;
    }, {});

    return (
        <UserLayout>
            <Head title="Directory" />

            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="mb-5">
                    <h1 className="text-2xl font-bold text-gray-900">Directory</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {members.length} team member{members.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {/* Search & Filter */}
                <div className="space-y-3 mb-6">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                        <input
                            type="text"
                            value={searchValue}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search people..."
                            className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm focus:border-[#495B67] focus:ring-1 focus:ring-[#495B67]"
                        />
                    </div>

                    {departments.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            <button
                                onClick={() => handleFilterDept('all')}
                                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                    filters.department === 'all'
                                        ? 'bg-[#495B67] text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                All
                            </button>
                            {departments.map(dept => (
                                <button
                                    key={dept}
                                    onClick={() => handleFilterDept(dept)}
                                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                        filters.department === dept
                                            ? 'bg-[#495B67] text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {dept}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {members.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-3"><Icon name="user-group" className="w-4 h-4 inline-block" /></div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-1">No results</h3>
                        <p className="text-sm text-gray-500">
                            Try a different search or filter.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([dept, deptMembers]) => (
                            <div key={dept}>
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Icon name="building" className="w-3.5 h-3.5 inline-block mr-0.5" /> {dept}
                                    <span className="text-gray-300">·</span>
                                    <span className="font-normal">{deptMembers.length}</span>
                                </h3>
                                <div className="space-y-2">
                                    {deptMembers.map(member => (
                                        <button
                                            key={member.id}
                                            onClick={() => setViewMember(member)}
                                            className="w-full bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 hover:shadow-sm transition-all text-left"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-[#495B67] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                                                {getInitials(member.name)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-gray-900 text-sm truncate">{member.name}</span>
                                                    {member.id === currentUser?.id && (
                                                        <span className="text-[10px] text-[#495B67] font-medium bg-[#495B67]/10 px-1.5 py-0.5 rounded">You</span>
                                                    )}
                                                </div>
                                                {member.position && (
                                                    <p className="text-xs text-gray-500 truncate">{member.position}</p>
                                                )}
                                                {member.location && (
                                                    <p className="text-[10px] text-gray-400 mt-0.5"><Icon name="map-pin" className="w-3.5 h-3.5 inline-block" /> {member.location}</p>
                                                )}
                                            </div>
                                            <span className={`flex-shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-full ${roleColors[member.role] || 'bg-gray-100 text-gray-600'}`}>
                                                {roleLabels[member.role] || member.role}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Profile Card Modal ── */}
            {viewMember && (
                <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={() => setViewMember(null)}>
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Gradient Header */}
                        <div className="bg-gradient-to-br from-[#495B67] to-[#71858E] px-6 py-6 text-center relative">
                            <button
                                onClick={() => setViewMember(null)}
                                className="absolute top-3 right-3 text-white/60 hover:text-white text-lg"
                            >
                                <Icon name="x-mark" className="w-3.5 h-3.5 inline-block" /> 
                            </button>
                            <div className="w-18 h-18 rounded-full bg-white/20 text-white flex items-center justify-center text-xl font-bold mx-auto" style={{ width: 72, height: 72 }}>
                                {getInitials(viewMember.name)}
                            </div>
                            <h2 className="text-lg font-bold text-white mt-2">{viewMember.name}</h2>
                            {viewMember.position && (
                                <p className="text-white/80 text-sm">{viewMember.position}</p>
                            )}
                            <span className={`mt-2 inline-flex px-3 py-1 text-xs font-medium rounded-full ${roleColors[viewMember.role] || 'bg-white/20 text-white'}`}>
                                {roleLabels[viewMember.role] || viewMember.role}
                            </span>
                        </div>

                        {/* Info */}
                        <div className="px-6 py-4 space-y-3">
                            {viewMember.bio && (
                                <p className="text-sm text-gray-500 italic text-center">"{viewMember.bio}"</p>
                            )}

                            <div className="space-y-2.5">
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="text-gray-400 w-5 text-center"><Icon name="envelope" className="w-3 h-3 inline-block" /></span>
                                    <a href={`mailto:${viewMember.email}`} className="text-[#495B67] hover:underline truncate">{viewMember.email}</a>
                                </div>
                                {viewMember.phone && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <span className="text-gray-400 w-5 text-center"><Icon name="phone-call" className="w-4 h-4 inline-block" /></span>
                                        <a href={`tel:${viewMember.phone}`} className="text-[#495B67] hover:underline">{viewMember.phone}</a>
                                    </div>
                                )}
                                {viewMember.department && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <span className="text-gray-400 w-5 text-center"><Icon name="building" className="w-4 h-4 inline-block" /></span>
                                        <span className="text-gray-700">{viewMember.department}</span>
                                    </div>
                                )}
                                {viewMember.location && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <span className="text-gray-400 w-5 text-center"><Icon name="map-pin" className="w-3 h-3 inline-block" /></span>
                                        <span className="text-gray-700">{viewMember.location}</span>
                                    </div>
                                )}
                                {viewMember.hire_date && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <span className="text-gray-400 w-5 text-center"><Icon name="calendar" className="w-4 h-4 inline-block" /></span>
                                        <span className="text-gray-700">
                                            Joined {new Date(viewMember.hire_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
                            {viewMember.phone && (
                                <a
                                    href={`tel:${viewMember.phone}`}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 text-sm font-medium rounded-xl hover:bg-green-100 transition-colors"
                                >
                                    <Icon name="phone-call" className="w-4 h-4 inline-block" /> Call
                                </a>
                            )}
                            <a
                                href={`mailto:${viewMember.email}`}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#495B67]/10 text-[#495B67] text-sm font-medium rounded-xl hover:bg-[#495B67]/20 transition-colors"
                            >
                                <Icon name="envelope" className="w-3.5 h-3.5 inline-block" />  Email
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </UserLayout>
    );
}
