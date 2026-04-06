import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';
import { Head, router } from '@inertiajs/react';

interface CourseInfo {
    id: number;
    title: string;
    cover_image: string | null;
    estimated_minutes: number | null;
    is_mandatory: boolean;
    category: { id: number; name: string } | null;
}

interface AssignmentData {
    id: number;
    course_id: number;
    status: string;
    progress_pct: number;
    due_date: string | null;
    started_at: string | null;
    completed_at: string | null;
    course: CourseInfo | null;
    completed_lessons: number;
    total_lessons: number;
}

interface Employee {
    id: number;
    name: string;
    email: string;
    department: string | null;
    position: string | null;
    avatar_url: string | null;
}

interface Props {
    employee: Employee;
    assignments: AssignmentData[];
    stats: { total: number; in_progress: number; completed: number; overdue: number; avg_progress: number };
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    assigned:    { label: 'Assigned',    color: 'text-blue-700',    bg: 'bg-blue-100' },
    in_progress: { label: 'In Progress', color: 'text-amber-700',  bg: 'bg-amber-100' },
    completed:   { label: 'Completed',   color: 'text-emerald-700', bg: 'bg-emerald-100' },
};

const placeholderGradients = [
    'from-[#495B67] to-[#5d7a8a]',
    'from-[#5d7a8a] to-[#7a9bab]',
    'from-[#3d4f5a] to-[#495B67]',
    'from-[#495B67] to-[#6b8999]',
    'from-[#3a5060] to-[#5d7a8a]',
];

export default function UserTraining({ employee, assignments, stats }: Props) {
    return (
        <AdminLayout>
            <Head title={`${employee.name} — Training`} />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                {/* Back + Header */}
                <div>
                    <button
                        onClick={() => router.get(route('directory.index'))}
                        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition mb-4"
                    >
                        <Icon name="arrow-left" className="w-4 h-4" />
                        Back to Directory
                    </button>

                    <div className="flex items-center gap-4">
                        {employee.avatar_url ? (
                            <img src={employee.avatar_url} alt={employee.name} className="w-14 h-14 rounded-full object-cover" />
                        ) : (
                            <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white" style={{ backgroundColor: '#495B67' }}>
                                {employee.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">{employee.name}</h1>
                            <p className="text-sm text-slate-500">
                                {[employee.position, employee.department].filter(Boolean).join(' · ') || employee.email}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                        <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                        <div className="text-xs text-slate-500 mt-0.5">Assigned</div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                        <div className="text-2xl font-bold text-amber-600">{stats.in_progress}</div>
                        <div className="text-xs text-slate-500 mt-0.5">In Progress</div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-600">{stats.completed}</div>
                        <div className="text-xs text-slate-500 mt-0.5">Completed</div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                        <div className="text-2xl font-bold" style={{ color: '#495B67' }}>{stats.avg_progress}%</div>
                        <div className="text-xs text-slate-500 mt-0.5">Avg. Progress</div>
                    </div>
                </div>

                {stats.overdue > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-red-700">
                        <Icon name="exclamation-triangle" className="w-4 h-4 flex-shrink-0" />
                        {stats.overdue} overdue course{stats.overdue > 1 ? 's' : ''}
                    </div>
                )}

                {/* Course List */}
                <div className="space-y-3">
                    {assignments.length === 0 && (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                <Icon name="book-open" className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-slate-500 text-sm">No courses assigned to this employee yet</p>
                        </div>
                    )}

                    {assignments.map((a, idx) => {
                        const sc = statusConfig[a.status] ?? statusConfig['assigned'];
                        const isOverdue = a.due_date && new Date(a.due_date) < new Date() && a.status !== 'completed';

                        return (
                            <div
                                key={a.id}
                                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300"
                            >
                                <div className="flex items-stretch">
                                    {/* Cover thumbnail */}
                                    <div className="w-24 sm:w-32 flex-shrink-0 overflow-hidden">
                                        {a.course?.cover_image ? (
                                            <img src={a.course.cover_image} alt={a.course?.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className={`w-full h-full bg-gradient-to-br ${placeholderGradients[idx % placeholderGradients.length]} flex items-center justify-center min-h-[5rem]`}>
                                                <Icon name="book-open" className="w-6 h-6 text-white/20" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 p-4 flex flex-col justify-center">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-semibold text-slate-900 truncate">{a.course?.title}</h3>
                                                    {a.course?.is_mandatory && (
                                                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">Required</span>
                                                    )}
                                                </div>
                                                {a.course?.category && (
                                                    <p className="text-xs text-slate-400 mt-0.5">{a.course.category.name}</p>
                                                )}
                                            </div>
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${sc.bg} ${sc.color}`}>
                                                {sc.label}
                                            </span>
                                        </div>

                                        {/* Progress bar */}
                                        <div className="mt-3">
                                            <div className="flex items-center justify-between text-xs mb-1">
                                                <span className="text-slate-500">
                                                    {a.completed_lessons} of {a.total_lessons} lessons
                                                </span>
                                                <span className="font-semibold" style={{ color: '#495B67' }}>{a.progress_pct}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                                                <div
                                                    className="h-1.5 rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${a.progress_pct}%`,
                                                        backgroundColor: a.status === 'completed' ? '#16a34a' : '#495B67',
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Meta */}
                                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                                            {a.course?.estimated_minutes && (
                                                <span className="flex items-center gap-1">
                                                    <Icon name="stopwatch" className="w-3 h-3" />
                                                    {a.course.estimated_minutes} min
                                                </span>
                                            )}
                                            {a.due_date && (
                                                <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                                                    <Icon name="calendar" className="w-3 h-3" />
                                                    Due {new Date(a.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    {isOverdue && ' (overdue)'}
                                                </span>
                                            )}
                                            {a.completed_at && (
                                                <span className="text-emerald-600">
                                                    Completed {new Date(a.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </AdminLayout>
    );
}
