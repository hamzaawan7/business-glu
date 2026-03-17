import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { useState, useRef } from 'react';

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
    employees: Employee[];
    companyName: string;
}

const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

function IdCard({ employee, companyName, small = false }: { employee: Employee; companyName: string; small?: boolean }) {
    return (
        <div className={`rounded-2xl overflow-hidden shadow-lg ${small ? 'w-72' : 'w-80'}`} style={{ background: 'linear-gradient(135deg, #495B67 0%, #3a4a54 100%)' }}>
            {/* Header */}
            <div className="px-5 pt-5 pb-3">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-white font-bold text-sm tracking-wide">{companyName}</h3>
                    <span className="text-[10px] text-white/60 font-medium uppercase tracking-widest">Employee ID</span>
                </div>
                <div className="h-px bg-white/20" />
            </div>

            {/* Body */}
            <div className="px-5 pb-5 flex gap-4">
                {/* Photo */}
                {employee.avatar_url ? (
                    <img src={employee.avatar_url} className="w-16 h-16 rounded-xl object-cover border-2 border-white/30 shrink-0" alt={employee.name} />
                ) : (
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold bg-white/20 text-white border-2 border-white/30 shrink-0">
                        {initials(employee.name)}
                    </div>
                )}

                <div className="min-w-0">
                    <p className="text-white font-bold text-base truncate">{employee.name}</p>
                    <p className="text-white/70 text-xs truncate">{employee.position || employee.role}</p>
                    {employee.department && <p className="text-white/50 text-[11px] truncate">{employee.department}</p>}
                </div>
            </div>

            {/* Footer */}
            <div className="bg-white/10 px-5 py-3 space-y-1">
                <div className="flex justify-between text-[11px]">
                    <span className="text-white/50">Email</span>
                    <span className="text-white/80 truncate ml-2">{employee.email}</span>
                </div>
                {employee.phone && (
                    <div className="flex justify-between text-[11px]">
                        <span className="text-white/50">Phone</span>
                        <span className="text-white/80">{employee.phone}</span>
                    </div>
                )}
                <div className="flex justify-between text-[11px]">
                    <span className="text-white/50">ID</span>
                    <span className="text-white/80 font-mono">EMP-{String(employee.id).padStart(5, '0')}</span>
                </div>
                {employee.hire_date && (
                    <div className="flex justify-between text-[11px]">
                        <span className="text-white/50">Since</span>
                        <span className="text-white/80">{new Date(employee.hire_date).toLocaleDateString()}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function EmployeeIds({ employees, companyName }: Props) {
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const filtered = employees.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.email.toLowerCase().includes(search.toLowerCase()) ||
        (e.department || '').toLowerCase().includes(search.toLowerCase())
    );

    const selected = selectedId ? employees.find(e => e.id === selectedId) : null;

    return (
        <AdminLayout>
            <Head title="Employee IDs" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Digital Employee IDs</h1>
                        <p className="text-sm text-slate-500">Instant digital ID cards for all employees.</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total IDs', value: employees.length, icon: '🪪' },
                        { label: 'With Photo', value: employees.filter(e => e.avatar_url).length, icon: '📸' },
                        { label: 'Departments', value: new Set(employees.map(e => e.department).filter(Boolean)).size, icon: '🏢' },
                        { label: 'Active', value: employees.length, icon: '✅' },
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

                {/* Search */}
                <div>
                    <input
                        type="text"
                        placeholder="Search employees..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full max-w-sm rounded-lg border-slate-200 text-sm"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Employee list */}
                    <div className="lg:col-span-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filtered.map(emp => (
                                <div key={emp.id} onClick={() => setSelectedId(emp.id)} className="cursor-pointer">
                                    <IdCard employee={emp} companyName={companyName} small />
                                </div>
                            ))}
                        </div>
                        {filtered.length === 0 && (
                            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                                No employees found.
                            </div>
                        )}
                    </div>

                    {/* Preview */}
                    <div>
                        {selected ? (
                            <div className="sticky top-6 space-y-4">
                                <h3 className="text-sm font-bold text-slate-700">ID Card Preview</h3>
                                <IdCard employee={selected} companyName={companyName} />
                                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                                    <h4 className="text-xs font-bold text-slate-700">Card Details</h4>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <span className="text-slate-400">ID Number</span>
                                        <span className="text-slate-700 font-mono">EMP-{String(selected.id).padStart(5, '0')}</span>
                                        <span className="text-slate-400">Role</span>
                                        <span className="text-slate-700 capitalize">{selected.role}</span>
                                        <span className="text-slate-400">Status</span>
                                        <span className="text-green-600 font-medium">Active</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
                                Click an ID card to preview.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
