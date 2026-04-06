import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';

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
    directory_visible: boolean;
    created_at: string;
}

interface Props {
    members: MemberData[];
    filters: { search: string; department: string; role: string };
    departments: string[];
    locations: string[];
    stats: { total: number; visible: number; departments: number; locations: number };
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

export default function Directory({ members, filters, departments, locations, stats }: Props) {
    const page = usePage();
    const flash = (page.props as any).flash ?? {};

    const [editingMember, setEditingMember] = useState<MemberData | null>(null);
    const [viewMember, setViewMember] = useState<MemberData | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkDeptModal, setBulkDeptModal] = useState(false);
    const [bulkDept, setBulkDept] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const editForm = useForm({
        phone: '',
        position: '',
        department: '',
        location: '',
        bio: '',
        hire_date: '',
        directory_visible: true,
    });

    function openEdit(member: MemberData) {
        setEditingMember(member);
        editForm.setData({
            phone: member.phone || '',
            position: member.position || '',
            department: member.department || '',
            location: member.location || '',
            bio: member.bio || '',
            hire_date: member.hire_date || '',
            directory_visible: member.directory_visible,
        });
    }

    const handleEditSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editingMember) return;
        editForm.patch(`/admin/directory/${editingMember.id}`, {
            onSuccess: () => setEditingMember(null),
        });
    };

    function handleSearch(value: string) {
        router.get('/admin/directory', { ...filters, search: value }, { preserveState: true, replace: true });
    }

    function handleFilterDept(value: string) {
        router.get('/admin/directory', { ...filters, department: value }, { preserveState: true, replace: true });
    }

    function handleFilterRole(value: string) {
        router.get('/admin/directory', { ...filters, role: value }, { preserveState: true, replace: true });
    }

    function toggleSelect(id: number) {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }

    function selectAll() {
        if (selectedIds.length === members.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(members.map(m => m.id));
        }
    }

    function submitBulkDept() {
        if (!bulkDept.trim() || selectedIds.length === 0) return;
        router.post('/admin/directory/bulk-department', {
            member_ids: selectedIds,
            department: bulkDept.trim(),
        }, {
            onSuccess: () => {
                setBulkDeptModal(false);
                setBulkDept('');
                setSelectedIds([]);
            },
        });
    }

    // Group members by department for grid view
    const grouped = members.reduce<Record<string, MemberData[]>>((acc, m) => {
        const dept = m.department || 'No Department';
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(m);
        return acc;
    }, {});

    return (
        <AdminLayout>
            <Head title="Company Directory" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Company Directory</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage employee profiles and organizational structure</p>
                    </div>
                    {selectedIds.length > 0 && (
                        <button
                            onClick={() => setBulkDeptModal(true)}
                            className="px-4 py-2 bg-[#495B67] text-white text-sm font-medium rounded-lg hover:bg-[#3a4a55] transition-colors"
                        >
                            Set Department ({selectedIds.length})
                        </button>
                    )}
                </div>

                {/* Flash */}
                {flash.success && (
                    <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                        {flash.success}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Members', value: stats.total, icon: 'user-group' },
                        { label: 'Visible', value: stats.visible, icon: '<Icon name="eye" className="w-4 h-4 inline-block" />' },
                        { label: 'Departments', value: stats.departments, icon: 'building' },
                        { label: 'Locations', value: stats.locations, icon: 'map-pin' },
                    ].map(s => (
                        <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span><Icon name={s.icon} className="w-5 h-5" /></span> {s.label}
                            </div>
                            <div className="text-2xl font-bold text-gray-900 mt-1">{s.value}</div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                                <input
                                    type="text"
                                    defaultValue={filters.search}
                                    onChange={(e) => {
                                        clearTimeout((window as any).__dirSearch);
                                        (window as any).__dirSearch = setTimeout(() => handleSearch(e.target.value), 400);
                                    }}
                                    placeholder="Search name, email, position, department..."
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                />
                            </div>
                        </div>
                        <select
                            value={filters.department}
                            onChange={(e) => handleFilterDept(e.target.value)}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                        >
                            <option value="all">All Departments</option>
                            {departments.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                        <select
                            value={filters.role}
                            onChange={(e) => handleFilterRole(e.target.value)}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                        >
                            <option value="all">All Roles</option>
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="member">Employee</option>
                        </select>
                        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-[#495B67] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                            >
                                ▦ Grid
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-[#495B67] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                            >
                                <Icon name="bars-3" className="w-3.5 h-3.5 inline-block" />  List
                            </button>
                        </div>
                    </div>
                </div>

                {members.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <div className="text-4xl mb-3"><Icon name="user-group" className="w-4 h-4 inline-block" /></div>
                        <p className="text-gray-500 text-sm">No members found matching your filters.</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    /* ── Grid View (grouped by department) ── */
                    <div className="space-y-6">
                        {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([dept, deptMembers]) => (
                            <div key={dept}>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Icon name="building" className="w-3.5 h-3.5 inline-block mr-0.5" /> {dept}
                                    <span className="text-xs font-normal text-gray-400">({deptMembers.length})</span>
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {deptMembers.map(member => (
                                        <div
                                            key={member.id}
                                            className={`bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer relative ${
                                                !member.directory_visible ? 'opacity-60' : ''
                                            }`}
                                            onClick={() => setViewMember(member)}
                                        >
                                            {/* Checkbox */}
                                            <div
                                                className="absolute top-3 right-3"
                                                onClick={(e) => { e.stopPropagation(); toggleSelect(member.id); }}
                                            >
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                                    selectedIds.includes(member.id)
                                                        ? 'bg-[#495B67] border-[#495B67] text-white'
                                                        : 'border-gray-300 hover:border-gray-400'
                                                }`}>
                                                    {selectedIds.includes(member.id) && <span className="text-xs"><Icon name="check" className="w-3 h-3 inline-block" /></span>}
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center text-center">
                                                <div className="w-16 h-16 rounded-full bg-[#495B67] text-white flex items-center justify-center text-lg font-semibold mb-3">
                                                    {getInitials(member.name)}
                                                </div>
                                                <h4 className="font-semibold text-gray-900 text-sm">{member.name}</h4>
                                                {member.position && (
                                                    <p className="text-xs text-gray-500 mt-0.5">{member.position}</p>
                                                )}
                                                <span className={`mt-2 inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full ${roleColors[member.role] || 'bg-gray-100 text-gray-600'}`}>
                                                    {roleLabels[member.role] || member.role}
                                                </span>
                                                {member.location && (
                                                    <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                                                        <Icon name="map-pin" className="w-3.5 h-3.5 inline-block" />  {member.location}
                                                    </p>
                                                )}
                                                {!member.directory_visible && (
                                                    <p className="text-[10px] text-red-400 mt-1">Hidden from directory</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* ── List View ── */
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50">
                                        <th className="p-3 text-left">
                                            <div
                                                className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer ${
                                                    selectedIds.length === members.length && members.length > 0
                                                        ? 'bg-[#495B67] border-[#495B67] text-white'
                                                        : 'border-gray-300'
                                                }`}
                                                onClick={selectAll}
                                            >
                                                {selectedIds.length === members.length && members.length > 0 && <span className="text-xs"><Icon name="check" className="w-3 h-3 inline-block" /></span>}
                                            </div>
                                        </th>
                                        <th className="p-3 text-left font-medium text-gray-600">Name</th>
                                        <th className="p-3 text-left font-medium text-gray-600">Position</th>
                                        <th className="p-3 text-left font-medium text-gray-600">Department</th>
                                        <th className="p-3 text-left font-medium text-gray-600">Location</th>
                                        <th className="p-3 text-left font-medium text-gray-600">Role</th>
                                        <th className="p-3 text-left font-medium text-gray-600">Contact</th>
                                        <th className="p-3 text-right font-medium text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {members.map(member => (
                                        <tr key={member.id} className={`hover:bg-gray-50 ${!member.directory_visible ? 'opacity-60' : ''}`}>
                                            <td className="p-3">
                                                <div
                                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer ${
                                                        selectedIds.includes(member.id)
                                                            ? 'bg-[#495B67] border-[#495B67] text-white'
                                                            : 'border-gray-300'
                                                    }`}
                                                    onClick={() => toggleSelect(member.id)}
                                                >
                                                    {selectedIds.includes(member.id) && <span className="text-xs"><Icon name="check" className="w-3 h-3 inline-block" /></span>}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[#495B67] text-white flex items-center justify-center text-xs font-medium">
                                                        {getInitials(member.name)}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{member.name}</div>
                                                        <div className="text-xs text-gray-400">{member.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3 text-gray-600">{member.position || '—'}</td>
                                            <td className="p-3 text-gray-600">{member.department || '—'}</td>
                                            <td className="p-3 text-gray-600">{member.location || '—'}</td>
                                            <td className="p-3">
                                                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${roleColors[member.role] || 'bg-gray-100 text-gray-600'}`}>
                                                    {roleLabels[member.role] || member.role}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2 text-xs">
                                                    {member.phone && (
                                                        <a href={`tel:${member.phone}`} className="text-[#495B67] hover:underline"><Icon name="phone-call" className="w-4 h-4 inline-block" /></a>
                                                    )}
                                                    <a href={`mailto:${member.email}`} className="text-[#495B67] hover:underline"><Icon name="envelope" className="w-3 h-3 inline-block" /></a>
                                                </div>
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => setViewMember(member)}
                                                        className="p-1.5 text-gray-400 hover:text-gray-700 rounded"
                                                        title="View profile"
                                                    >
                                                        <Icon name="eye" className="w-4 h-4 inline-block" />
                                                    </button>
                                                    <button
                                                        onClick={() => openEdit(member)}
                                                        className="p-1.5 text-gray-400 hover:text-[#495B67] rounded"
                                                        title="Edit profile"
                                                    >
                                                        <Icon name="pencil-square" className="w-4 h-4 inline-block" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* ── View Profile Modal ── */}
            {viewMember && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewMember(null)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="bg-gradient-to-br from-[#495B67] to-[#71858E] px-6 py-8 text-center">
                            <div className="w-20 h-20 rounded-full bg-white/20 text-white flex items-center justify-center text-2xl font-bold mx-auto">
                                {getInitials(viewMember.name)}
                            </div>
                            <h2 className="text-xl font-bold text-white mt-3">{viewMember.name}</h2>
                            {viewMember.position && (
                                <p className="text-white/80 text-sm mt-1">{viewMember.position}</p>
                            )}
                            <span className={`mt-2 inline-flex px-3 py-1 text-xs font-medium rounded-full ${roleColors[viewMember.role] || 'bg-white/20 text-white'}`}>
                                {roleLabels[viewMember.role] || viewMember.role}
                            </span>
                        </div>

                        {/* Details */}
                        <div className="px-6 py-4 space-y-3">
                            {viewMember.bio && (
                                <p className="text-sm text-gray-600 italic">"{viewMember.bio}"</p>
                            )}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-gray-400 text-xs block">Email</span>
                                    <a href={`mailto:${viewMember.email}`} className="text-[#495B67] hover:underline">{viewMember.email}</a>
                                </div>
                                {viewMember.phone && (
                                    <div>
                                        <span className="text-gray-400 text-xs block">Phone</span>
                                        <a href={`tel:${viewMember.phone}`} className="text-[#495B67] hover:underline">{viewMember.phone}</a>
                                    </div>
                                )}
                                {viewMember.department && (
                                    <div>
                                        <span className="text-gray-400 text-xs block">Department</span>
                                        <span className="text-gray-900">{viewMember.department}</span>
                                    </div>
                                )}
                                {viewMember.location && (
                                    <div>
                                        <span className="text-gray-400 text-xs block">Location</span>
                                        <span className="text-gray-900">{viewMember.location}</span>
                                    </div>
                                )}
                                {viewMember.hire_date && (
                                    <div>
                                        <span className="text-gray-400 text-xs block">Hire Date</span>
                                        <span className="text-gray-900">{new Date(viewMember.hire_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                )}
                                <div>
                                    <span className="text-gray-400 text-xs block">Directory Status</span>
                                    <span className={viewMember.directory_visible ? 'text-green-600' : 'text-red-500'}>
                                        {viewMember.directory_visible ? '<Icon name="check" className="w-3.5 h-3.5 inline-block" />  Visible' : '<Icon name="x-mark" className="w-3.5 h-3.5 inline-block" />  Hidden'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-between">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setViewMember(null); openEdit(viewMember); }}
                                    className="px-4 py-2 text-sm font-medium text-[#495B67] hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <Icon name="pencil-square" className="w-4 h-4 inline-block" /> Edit Profile
                                </button>
                                <button
                                    onClick={() => { setViewMember(null); router.get(route('directory.user-training', viewMember.id)); }}
                                    className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
                                    style={{ backgroundColor: '#495B67' }}
                                >
                                    <Icon name="book-open" className="w-4 h-4 inline-block" /> Training
                                </button>
                            </div>
                            <button
                                onClick={() => setViewMember(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit Profile Modal ── */}
            {editingMember && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingMember(null)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900">Edit Profile — {editingMember.name}</h2>
                            <p className="text-xs text-gray-500 mt-1">Update organizational and contact information</p>
                        </div>
                        <form onSubmit={handleEditSubmit} className="px-6 py-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input
                                        type="text"
                                        value={editForm.data.phone}
                                        onChange={(e) => editForm.setData('phone', e.target.value)}
                                        placeholder="(555) 123-4567"
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Position / Title</label>
                                    <input
                                        type="text"
                                        value={editForm.data.position}
                                        onChange={(e) => editForm.setData('position', e.target.value)}
                                        placeholder="Software Engineer"
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                    <input
                                        type="text"
                                        value={editForm.data.department}
                                        onChange={(e) => editForm.setData('department', e.target.value)}
                                        placeholder="Engineering"
                                        list="dept-list"
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                    />
                                    <datalist id="dept-list">
                                        {departments.map(d => <option key={d} value={d} />)}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    <input
                                        type="text"
                                        value={editForm.data.location}
                                        onChange={(e) => editForm.setData('location', e.target.value)}
                                        placeholder="New York Office"
                                        list="loc-list"
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                    />
                                    <datalist id="loc-list">
                                        {locations.map(l => <option key={l} value={l} />)}
                                    </datalist>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                                <textarea
                                    value={editForm.data.bio}
                                    onChange={(e) => editForm.setData('bio', e.target.value)}
                                    placeholder="A short bio..."
                                    rows={3}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date</label>
                                <input
                                    type="date"
                                    value={editForm.data.hire_date}
                                    onChange={(e) => editForm.setData('hire_date', e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="dir-visible"
                                    checked={editForm.data.directory_visible}
                                    onChange={(e) => editForm.setData('directory_visible', e.target.checked)}
                                    className="rounded border-gray-300 text-[#495B67] focus:ring-[#495B67]"
                                />
                                <label htmlFor="dir-visible" className="text-sm text-gray-700">
                                    Visible in employee directory
                                </label>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingMember(null)}
                                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="px-4 py-2 bg-[#495B67] text-white text-sm font-medium rounded-lg hover:bg-[#3a4a55] disabled:opacity-50 transition-colors"
                                >
                                    {editForm.processing ? 'Saving...' : 'Save Profile'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Bulk Department Modal ── */}
            {bulkDeptModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setBulkDeptModal(false)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900">Set Department</h2>
                            <p className="text-xs text-gray-500 mt-1">Update department for {selectedIds.length} selected member(s)</p>
                        </div>
                        <div className="px-6 py-4 space-y-4">
                            <input
                                type="text"
                                value={bulkDept}
                                onChange={(e) => setBulkDept(e.target.value)}
                                placeholder="Department name..."
                                list="bulk-dept-list"
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                autoFocus
                            />
                            <datalist id="bulk-dept-list">
                                {departments.map(d => <option key={d} value={d} />)}
                            </datalist>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setBulkDeptModal(false)}
                                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitBulkDept}
                                    disabled={!bulkDept.trim()}
                                    className="px-4 py-2 bg-[#495B67] text-white text-sm font-medium rounded-lg hover:bg-[#3a4a55] disabled:opacity-50"
                                >
                                    Update
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
