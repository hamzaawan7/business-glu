import UserLayout from '@/Layouts/UserLayout';
import { Head } from '@inertiajs/react';
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

export default function UserOrgChart({ employees, departments }: Props) {
    const [filterDept, setFilterDept] = useState('all');
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const filtered = filterDept === 'all' ? employees : employees.filter(e => e.department === filterDept);

    const rootEmployees = filtered.filter(e => {
        if (e.reports_to === null) return true;
        return !filtered.find(m => m.id === e.reports_to);
    });

    const getDirectReports = (id: number) => filtered.filter(e => e.reports_to === id);
    const selected = selectedId ? employees.find(e => e.id === selectedId) : null;
    const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const OrgNode = ({ emp, depth = 0 }: { emp: Employee; depth?: number }) => {
        const reports = getDirectReports(emp.id);
        return (
            <div className={`${depth > 0 ? 'ml-8 border-l-2 border-slate-100 pl-4' : ''}`}>
                <div
                    onClick={() => setSelectedId(selectedId === emp.id ? null : emp.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all mb-2 ${selectedId === emp.id ? 'bg-[#495B67]/5 border border-[#495B67]/30' : 'bg-white border border-slate-200 hover:shadow-sm'}`}
                >
                    {emp.avatar_url ? (
                        <img src={emp.avatar_url} className="w-9 h-9 rounded-full object-cover" alt={emp.name} />
                    ) : (
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#495B67' }}>
                            {initials(emp.name)}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{emp.name}</p>
                        <p className="text-xs text-slate-500 truncate">{emp.position || emp.role}</p>
                    </div>
                    {reports.length > 0 && <span className="text-xs text-slate-400">{reports.length}</span>}
                </div>
                {reports.map(r => <OrgNode key={r.id} emp={r} depth={depth + 1} />)}
            </div>
        );
    };

    return (
        <UserLayout>
            <Head title="Org Chart" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Org Chart</h1>
                    <p className="text-sm text-slate-500 mt-1">View the company structure and reporting hierarchy.</p>
                </div>

                <div className="flex gap-3">
                    <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="rounded-lg border-slate-200 text-sm">
                        <option value="all">All Departments</option>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        {rootEmployees.length === 0 ? (
                            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                                No organizational data available yet.
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {rootEmployees.map(emp => <OrgNode key={emp.id} emp={emp} />)}
                            </div>
                        )}
                    </div>

                    <div>
                        {selected ? (
                            <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-6">
                                <div className="text-center mb-4">
                                    {selected.avatar_url ? (
                                        <img src={selected.avatar_url} className="w-14 h-14 rounded-full object-cover mx-auto mb-2" alt={selected.name} />
                                    ) : (
                                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white mx-auto mb-2" style={{ backgroundColor: '#495B67' }}>
                                            {initials(selected.name)}
                                        </div>
                                    )}
                                    <h3 className="text-sm font-bold text-slate-900">{selected.name}</h3>
                                    <p className="text-xs text-slate-500">{selected.position || 'No title'}</p>
                                </div>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between py-1 border-b border-slate-50">
                                        <span className="text-slate-400">Email</span>
                                        <a href={`mailto:${selected.email}`} className="text-blue-600 hover:underline">{selected.email}</a>
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
                                        <div className="flex justify-between py-1">
                                            <span className="text-slate-400">Reports to</span>
                                            <button onClick={() => setSelectedId(selected.reports_to)} className="text-blue-600 hover:underline">
                                                {employees.find(e => e.id === selected.reports_to)?.name || '—'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
                                Click an employee to see their info.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
