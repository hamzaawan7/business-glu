import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface Employee {
    id: number;
    name: string;
    email: string;
    role: string;
    department: string | null;
    position: string | null;
    reports_to: number | null;
    avatar_url: string | null;
    phone: string | null;
}

interface Props {
    employees: Employee[];
    departments: string[];
}

export default function OrgChart({ employees, departments }: Props) {
    const [filterDept, setFilterDept] = useState('all');
    const [selectedId, setSelectedId] = useState<number | null>(null);

    // Build tree structure
    const buildTree = (parentId: number | null): Employee[] => {
        return employees
            .filter(e => e.reports_to === parentId)
            .filter(e => filterDept === 'all' || e.department === filterDept);
    };

    // Root employees (no manager, or manager not in list)
    const rootEmployees = employees.filter(e => {
        if (e.reports_to === null) return true;
        return !employees.find(m => m.id === e.reports_to);
    }).filter(e => filterDept === 'all' || e.department === filterDept);

    const getDirectReports = (id: number) => employees.filter(e => e.reports_to === id);

    const selected = selectedId ? employees.find(e => e.id === selectedId) : null;

    const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const roleColors: Record<string, string> = {
        owner: 'bg-purple-100 text-purple-700',
        admin: 'bg-blue-100 text-blue-700',
        manager: 'bg-indigo-100 text-indigo-700',
        member: 'bg-slate-100 text-slate-600',
    };

    const OrgNode = ({ emp, depth = 0 }: { emp: Employee; depth?: number }) => {
        const reports = getDirectReports(emp.id).filter(e => filterDept === 'all' || e.department === filterDept);
        const isSelected = selectedId === emp.id;

        return (
            <div className={`${depth > 0 ? 'ml-8 border-l-2 border-slate-100 pl-4' : ''}`}>
                <div
                    onClick={() => setSelectedId(isSelected ? null : emp.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all mb-2 ${isSelected ? 'bg-[#495B67]/5 border border-[#495B67]/30' : 'bg-white border border-slate-200 hover:shadow-sm'}`}
                >
                    {emp.avatar_url ? (
                        <img src={emp.avatar_url} className="w-10 h-10 rounded-full object-cover" alt={emp.name} />
                    ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: '#495B67' }}>
                            {initials(emp.name)}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900 truncate">{emp.name}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${roleColors[emp.role] || roleColors.member}`}>{emp.role}</span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{emp.position || 'No title'}</p>
                    </div>
                    {reports.length > 0 && (
                        <span className="text-xs text-slate-400 shrink-0">{reports.length} report{reports.length !== 1 ? 's' : ''}</span>
                    )}
                </div>
                {reports.length > 0 && (
                    <div>
                        {reports.map(r => <OrgNode key={r.id} emp={r} depth={depth + 1} />)}
                    </div>
                )}
            </div>
        );
    };

    return (
        <AdminLayout>
            <Head title="Org Chart" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Org Chart</h1>
                        <p className="text-sm text-slate-500">{employees.length} employees · {departments.length} departments</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Employees', value: employees.length, icon: '👥' },
                        { label: 'Departments', value: departments.length, icon: '🏢' },
                        { label: 'Managers', value: employees.filter(e => getDirectReports(e.id).length > 0).length, icon: '👔' },
                        { label: 'No Manager', value: employees.filter(e => !e.reports_to).length, icon: '🔗' },
                    ].map(s => (
                        <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <span>{s.icon}</span>
                                <span className="text-xs text-slate-500">{s.label}</span>
                            </div>
                            <span className="text-xl font-bold text-slate-900">{s.value}</span>
                        </div>
                    ))}
                </div>

                {/* Filter */}
                <div className="flex gap-3">
                    <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="rounded-lg border-slate-200 text-sm">
                        <option value="all">All Departments</option>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Tree */}
                    <div className="lg:col-span-2">
                        {rootEmployees.length === 0 ? (
                            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                                No employees found. Set up reporting structures in Directory.
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {rootEmployees.map(emp => <OrgNode key={emp.id} emp={emp} />)}
                            </div>
                        )}
                    </div>

                    {/* Detail Panel */}
                    <div>
                        {selected ? (
                            <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-6">
                                <div className="text-center mb-4">
                                    {selected.avatar_url ? (
                                        <img src={selected.avatar_url} className="w-16 h-16 rounded-full object-cover mx-auto mb-2" alt={selected.name} />
                                    ) : (
                                        <div className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold text-white mx-auto mb-2" style={{ backgroundColor: '#495B67' }}>
                                            {initials(selected.name)}
                                        </div>
                                    )}
                                    <h3 className="text-sm font-bold text-slate-900">{selected.name}</h3>
                                    <p className="text-xs text-slate-500">{selected.position || 'No title'}</p>
                                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mt-1 ${roleColors[selected.role] || roleColors.member}`}>{selected.role}</span>
                                </div>

                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between py-1 border-b border-slate-50">
                                        <span className="text-slate-400">Email</span>
                                        <span className="text-slate-700">{selected.email}</span>
                                    </div>
                                    {selected.phone && (
                                        <div className="flex justify-between py-1 border-b border-slate-50">
                                            <span className="text-slate-400">Phone</span>
                                            <span className="text-slate-700">{selected.phone}</span>
                                        </div>
                                    )}
                                    {selected.department && (
                                        <div className="flex justify-between py-1 border-b border-slate-50">
                                            <span className="text-slate-400">Department</span>
                                            <span className="text-slate-700">{selected.department}</span>
                                        </div>
                                    )}
                                    {selected.reports_to && (
                                        <div className="flex justify-between py-1 border-b border-slate-50">
                                            <span className="text-slate-400">Reports to</span>
                                            <span className="text-slate-700">{employees.find(e => e.id === selected.reports_to)?.name || '—'}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between py-1">
                                        <span className="text-slate-400">Direct Reports</span>
                                        <span className="text-slate-700">{getDirectReports(selected.id).length}</span>
                                    </div>
                                </div>

                                {/* Direct reports list */}
                                {getDirectReports(selected.id).length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-slate-100">
                                        <p className="text-xs font-medium text-slate-500 mb-2">Direct Reports</p>
                                        <div className="space-y-1">
                                            {getDirectReports(selected.id).map(r => (
                                                <button key={r.id} onClick={() => setSelectedId(r.id)} className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 text-left">
                                                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: '#495B67' }}>
                                                        {initials(r.name)}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium text-slate-900">{r.name}</p>
                                                        <p className="text-[10px] text-slate-400">{r.position}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
                                <p className="text-sm">Click on an employee to view details.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
