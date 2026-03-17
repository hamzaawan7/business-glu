import UserLayout from '@/Layouts/UserLayout';
import { Head } from '@inertiajs/react';

interface Employee {
    id: number;
    name: string;
    email: string;
    role: string;
    department: string | null;
    position: string | null;
    avatar_url: string | null;
    phone: string | null;
    hire_date: string | null;
}

interface Props {
    employee: Employee;
    companyName: string;
}

const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

export default function UserEmployeeId({ employee, companyName }: Props) {
    return (
        <UserLayout>
            <Head title="My Employee ID" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Employee ID</h1>
                    <p className="text-sm text-slate-500 mt-1">Your digital identification card.</p>
                </div>

                <div className="flex flex-col items-center gap-6">
                    {/* Front of card */}
                    <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-xl" style={{ background: 'linear-gradient(135deg, #495B67 0%, #3a4a54 100%)' }}>
                        {/* Header */}
                        <div className="px-6 pt-6 pb-3">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-white font-bold text-lg tracking-wide">{companyName}</h3>
                                <span className="text-[10px] text-white/60 font-medium uppercase tracking-widest">Employee ID</span>
                            </div>
                            <div className="h-px bg-white/20" />
                        </div>

                        {/* Photo & Name */}
                        <div className="px-6 pb-4 flex items-center gap-4">
                            {employee.avatar_url ? (
                                <img src={employee.avatar_url} className="w-20 h-20 rounded-xl object-cover border-2 border-white/30" alt={employee.name} />
                            ) : (
                                <div className="w-20 h-20 rounded-xl flex items-center justify-center text-2xl font-bold bg-white/20 text-white border-2 border-white/30">
                                    {initials(employee.name)}
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="text-white font-bold text-xl">{employee.name}</p>
                                <p className="text-white/70 text-sm">{employee.position || employee.role}</p>
                                {employee.department && <p className="text-white/50 text-xs mt-0.5">{employee.department}</p>}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="bg-white/10 px-6 py-4 space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-white/50">Email</span>
                                <span className="text-white/80">{employee.email}</span>
                            </div>
                            {employee.phone && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-white/50">Phone</span>
                                    <span className="text-white/80">{employee.phone}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xs">
                                <span className="text-white/50">Employee ID</span>
                                <span className="text-white/80 font-mono font-bold">EMP-{String(employee.id).padStart(5, '0')}</span>
                            </div>
                            {employee.hire_date && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-white/50">Member Since</span>
                                    <span className="text-white/80">{new Date(employee.hire_date).toLocaleDateString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xs">
                                <span className="text-white/50">Status</span>
                                <span className="text-green-300 font-medium">● Active</span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 text-center">
                            <p className="text-[10px] text-white/30">This is a digital employee identification card</p>
                        </div>
                    </div>

                    {/* Card info */}
                    <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                        <h3 className="text-sm font-bold text-slate-900">Card Information</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">ID Number</span>
                                <span className="font-mono font-medium text-slate-700">EMP-{String(employee.id).padStart(5, '0')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Role</span>
                                <span className="text-slate-700 capitalize">{employee.role}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Organization</span>
                                <span className="text-slate-700">{companyName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Card Status</span>
                                <span className="text-green-600 font-medium">Active</span>
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-slate-400 text-center max-w-sm">
                        This digital ID can be shown as proof of employment. Take a screenshot or show this page on your mobile device.
                    </p>
                </div>
            </div>
        </UserLayout>
    );
}
