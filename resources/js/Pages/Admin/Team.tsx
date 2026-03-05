import AppLayout from '@/Layouts/AppLayout';
import { Head, usePage } from '@inertiajs/react';
import { User } from '@/types';

interface TeamProps {
    members?: User[];
}

const roleColors: Record<string, string> = {
    super_admin: 'bg-red-100 text-red-700',
    owner: 'bg-purple-100 text-purple-700',
    admin: 'bg-blue-100 text-blue-700',
    manager: 'bg-green-100 text-green-700',
    member: 'bg-gray-100 text-gray-700',
};

export default function Team({ members = [] }: TeamProps) {
    const user = usePage().props.auth.user;

    return (
        <AppLayout title="Team">
            <Head title="Team" />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold font-heading text-brand-primary">Team Members</h2>
                        <p className="text-sm text-brand-accent mt-1">
                            Manage your team, roles, and permissions.
                        </p>
                    </div>
                    {(user.role === 'super_admin' || user.role === 'owner' || user.role === 'admin') && (
                        <button className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary-dark transition-colors">
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
                                    className="w-full rounded-lg border border-gray-200 pl-10 pr-4 py-2 text-sm focus:border-brand-primary focus:ring-brand-primary"
                                />
                            </div>
                        </div>
                    </div>

                    {members.length > 0 ? (
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-brand-accent uppercase tracking-wider">Name</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-brand-accent uppercase tracking-wider">Email</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-brand-accent uppercase tracking-wider">Role</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-brand-accent uppercase tracking-wider">Status</th>
                                    <th className="text-right px-6 py-3 text-xs font-medium text-brand-accent uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {members.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary text-white text-xs font-bold">
                                                    {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                </div>
                                                <span className="text-sm font-medium text-brand-primary">{member.name}</span>
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
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-sm text-brand-accent hover:text-brand-primary transition-colors">
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="px-6 py-12 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0Zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0Z" />
                            </svg>
                            <p className="mt-3 text-sm text-brand-accent">No team members found.</p>
                            <p className="text-xs text-gray-400 mt-1">Invite your first team member to get started.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
