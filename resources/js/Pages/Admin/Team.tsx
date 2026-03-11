import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { User } from '@/types';
import { FormEventHandler, useState } from 'react';

interface Invitation {
    id: number;
    email: string;
    role: string;
    expires_at: string;
    inviter?: { id: number; name: string };
}

interface TeamProps {
    members?: User[];
    invitations?: Invitation[];
}

const roleColors: Record<string, string> = {
    super_admin: 'bg-red-100 text-red-700',
    owner: 'bg-purple-100 text-purple-700',
    admin: 'bg-blue-100 text-blue-700',
    manager: 'bg-green-100 text-green-700',
    member: 'bg-gray-100 text-gray-700',
};

const assignableRoles = [
    { value: 'admin', label: 'Admin', description: 'Full access to all admin features' },
    { value: 'manager', label: 'Manager', description: 'Manage teams, schedules, and approvals' },
    { value: 'member', label: 'Member', description: 'Standard employee access' },
];

export default function Team({ members = [], invitations = [] }: TeamProps) {
    const page = usePage();
    const user = page.props.auth.user;
    const flash = (page.props as any).flash ?? {};

    const [showInviteModal, setShowInviteModal] = useState(false);
    const [editingMember, setEditingMember] = useState<User | null>(null);
    const [removingMember, setRemovingMember] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Invite form
    const inviteForm = useForm({
        email: '',
        role: 'member',
    });

    // Role edit form
    const roleForm = useForm({
        role: '',
    });

    const canManageTeam = ['super_admin', 'owner', 'admin'].includes(user.role);

    const filteredMembers = members.filter(
        (m) =>
            m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleInvite: FormEventHandler = (e) => {
        e.preventDefault();
        inviteForm.post(route('admin.team.invite'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowInviteModal(false);
                inviteForm.reset();
            },
        });
    };

    const handleUpdateRole: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editingMember) return;
        roleForm.patch(route('admin.team.update-role', editingMember.id), {
            preserveScroll: true,
            onSuccess: () => {
                setEditingMember(null);
                roleForm.reset();
            },
        });
    };

    const handleRemoveMember = () => {
        if (!removingMember) return;
        router.delete(route('admin.team.remove', removingMember.id), {
            preserveScroll: true,
            onSuccess: () => setRemovingMember(null),
        });
    };

    const handleCancelInvitation = (invitationId: number) => {
        router.delete(route('admin.team.cancel-invitation', invitationId), {
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout title="Team">
            <Head title="Team" />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Flash Messages */}
                {flash.success && (
                    <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                        <p className="text-sm text-green-700">{flash.success}</p>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold font-heading text-brand-primary">Team Members</h2>
                        <p className="text-sm text-brand-accent mt-1">
                            Manage your team, roles, and permissions.
                        </p>
                    </div>
                    {canManageTeam && (
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary-dark transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Invite Member
                        </button>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Members', value: members.length || 0 },
                        { label: 'Admins', value: members.filter(m => ['super_admin', 'owner', 'admin'].includes(m.role)).length },
                        { label: 'Managers', value: members.filter(m => m.role === 'manager').length },
                        { label: 'Members', value: members.filter(m => m.role === 'member').length },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
                            <p className="text-2xl font-bold font-heading text-brand-primary">{stat.value}</p>
                            <p className="text-xs text-brand-accent mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Pending Invitations */}
                {invitations.length > 0 && (
                    <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                        <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                            </svg>
                            Pending Invitations ({invitations.length})
                        </h3>
                        <div className="space-y-2">
                            {invitations.map((inv) => (
                                <div key={inv.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-amber-100">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-xs font-bold">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-brand-secondary">{inv.email}</p>
                                            <p className="text-xs text-brand-accent">
                                                Invited as <span className="capitalize">{inv.role}</span>
                                                {inv.inviter && <> by {inv.inviter.name}</>}
                                            </p>
                                        </div>
                                    </div>
                                    {canManageTeam && (
                                        <button
                                            onClick={() => handleCancelInvitation(inv.id)}
                                            className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Member list */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1 max-w-xs">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search members..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 pl-10 pr-4 py-2 text-sm focus:border-brand-primary focus:ring-brand-primary"
                                />
                            </div>
                        </div>
                    </div>

                    {filteredMembers.length > 0 ? (
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-brand-accent uppercase tracking-wider">Name</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-brand-accent uppercase tracking-wider">Email</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-brand-accent uppercase tracking-wider">Role</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-brand-accent uppercase tracking-wider">Status</th>
                                    {canManageTeam && (
                                        <th className="text-right px-6 py-3 text-xs font-medium text-brand-accent uppercase tracking-wider">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredMembers.map((member) => {
                                    const isProtected = member.role === 'owner' || member.role === 'super_admin';
                                    const isSelf = member.id === user.id;

                                    return (
                                        <tr key={member.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary text-white text-xs font-bold">
                                                        {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-brand-primary">{member.name}</span>
                                                        {isSelf && (
                                                            <span className="ml-2 text-xs text-brand-accent">(you)</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-brand-secondary">{member.email}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium capitalize ${roleColors[member.role] ?? roleColors.member}`}>
                                                    {member.role.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${member.email_verified_at ? 'text-green-600' : 'text-amber-600'}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${member.email_verified_at ? 'bg-green-400' : 'bg-amber-400'}`} />
                                                    {member.email_verified_at ? 'Active' : 'Pending'}
                                                </span>
                                            </td>
                                            {canManageTeam && (
                                                <td className="px-6 py-4 text-right">
                                                    {!isProtected && !isSelf && (
                                                        <div className="flex items-center justify-end gap-3">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingMember(member);
                                                                    roleForm.setData('role', member.role);
                                                                }}
                                                                className="text-sm text-brand-accent hover:text-brand-primary transition-colors"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => setRemovingMember(member)}
                                                                className="text-sm text-red-400 hover:text-red-600 transition-colors"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="px-6 py-12 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0Zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0Z" />
                            </svg>
                            <p className="mt-3 text-sm text-brand-accent">
                                {searchQuery ? 'No members match your search.' : 'No team members found.'}
                            </p>
                            {!searchQuery && (
                                <p className="text-xs text-gray-400 mt-1">Invite your first team member to get started.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Invite Modal ──────────────────────────────────── */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowInviteModal(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold font-heading text-brand-primary">Invite Team Member</h3>
                            <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleInvite} className="space-y-5">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-brand-secondary mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={inviteForm.data.email}
                                    onChange={(e) => inviteForm.setData('email', e.target.value)}
                                    placeholder="colleague@example.com"
                                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:ring-brand-primary"
                                    required
                                    autoFocus
                                />
                                {inviteForm.errors.email && (
                                    <p className="text-xs text-red-500 mt-1">{inviteForm.errors.email}</p>
                                )}
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-sm font-medium text-brand-secondary mb-2">
                                    Role
                                </label>
                                <div className="space-y-2">
                                    {assignableRoles.map((r) => (
                                        <label
                                            key={r.value}
                                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                                inviteForm.data.role === r.value
                                                    ? 'border-brand-primary bg-brand-primary/5'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="role"
                                                value={r.value}
                                                checked={inviteForm.data.role === r.value}
                                                onChange={(e) => inviteForm.setData('role', e.target.value)}
                                                className="mt-0.5 text-brand-primary focus:ring-brand-primary"
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-brand-secondary">{r.label}</p>
                                                <p className="text-xs text-brand-accent">{r.description}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                {inviteForm.errors.role && (
                                    <p className="text-xs text-red-500 mt-1">{inviteForm.errors.role}</p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-brand-secondary hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={inviteForm.processing}
                                    className="rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary-dark transition-colors disabled:opacity-50"
                                >
                                    {inviteForm.processing ? 'Sending...' : 'Send Invitation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Edit Role Modal ──────────────────────────────── */}
            {editingMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditingMember(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold font-heading text-brand-primary">
                                Edit Role — {editingMember.name}
                            </h3>
                            <button onClick={() => setEditingMember(null)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleUpdateRole} className="space-y-5">
                            <div className="space-y-2">
                                {assignableRoles.map((r) => (
                                    <label
                                        key={r.value}
                                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                            roleForm.data.role === r.value
                                                ? 'border-brand-primary bg-brand-primary/5'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="role"
                                            value={r.value}
                                            checked={roleForm.data.role === r.value}
                                            onChange={(e) => roleForm.setData('role', e.target.value)}
                                            className="mt-0.5 text-brand-primary focus:ring-brand-primary"
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-brand-secondary">{r.label}</p>
                                            <p className="text-xs text-brand-accent">{r.description}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            {roleForm.errors.role && (
                                <p className="text-xs text-red-500">{roleForm.errors.role}</p>
                            )}

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingMember(null)}
                                    className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-brand-secondary hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={roleForm.processing}
                                    className="rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary-dark transition-colors disabled:opacity-50"
                                >
                                    {roleForm.processing ? 'Saving...' : 'Update Role'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Remove Confirmation Modal ────────────────────── */}
            {removingMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setRemovingMember(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 mb-4">
                                <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold font-heading text-brand-primary mb-2">
                                Remove Team Member
                            </h3>
                            <p className="text-sm text-brand-accent">
                                Are you sure you want to remove <strong>{removingMember.name}</strong> from the team?
                                They will lose access to all company resources.
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-3 mt-6">
                            <button
                                onClick={() => setRemovingMember(null)}
                                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-brand-secondary hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRemoveMember}
                                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                            >
                                Remove Member
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
