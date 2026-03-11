import UserLayout from '@/Layouts/UserLayout';
import { Head, usePage, router } from '@inertiajs/react';

interface SubtaskData {
    id: number;
    title: string;
    status: string;
    is_overdue: boolean;
}

interface TaskData {
    id: number;
    title: string;
    description: string | null;
    priority: string;
    status: string;
    due_date: string | null;
    due_time: string | null;
    location: string | null;
    is_overdue: boolean;
    completed_at: string | null;
    creator: { id: number; name: string } | null;
    assignees: { id: number; name: string }[];
    subtasks: SubtaskData[];
    subtask_progress: { total: number; completed: number; percent: number };
}

interface Props {
    tasks: TaskData[];
    filters: { status: string; priority: string };
    stats: { open: number; inProgress: number; completed: number; overdue: number };
}

const priorityColors: Record<string, string> = {
    urgent: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-blue-100 text-blue-700 border-blue-200',
    low: 'bg-gray-100 text-gray-600 border-gray-200',
};

const statusFilters = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Done' },
];

export default function MyTasks({ tasks, filters, stats }: Props) {
    const page = usePage();
    const flash = (page.props as any).flash ?? {};

    const applyFilter = (key: string, value: string) => {
        router.get(route('user.tasks'), { ...filters, [key]: value }, { preserveScroll: true, preserveState: true });
    };

    const handleStatusChange = (taskId: number, status: string) => {
        router.patch(route('tasks.toggle-status', taskId), { status }, { preserveScroll: true });
    };

    const formatDate = (date: string) => {
        const d = new Date(date + 'T00:00:00');
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const totalActive = stats.open + stats.inProgress;

    return (
        <UserLayout title="My Tasks">
            <Head title="My Tasks" />

            <div className="space-y-4 max-w-lg mx-auto">
                {/* Flash messages */}
                {flash.success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                        {flash.success}
                    </div>
                )}

                {/* Quick stats bar */}
                <div className="flex items-center gap-4 bg-white rounded-2xl border border-gray-200 px-4 py-3 shadow-sm">
                    <div className="flex-1 text-center">
                        <p className="text-lg font-bold font-heading text-brand-primary">{totalActive}</p>
                        <p className="text-[10px] text-brand-accent uppercase tracking-wide">Active</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200" />
                    <div className="flex-1 text-center">
                        <p className="text-lg font-bold font-heading text-green-600">{stats.completed}</p>
                        <p className="text-[10px] text-brand-accent uppercase tracking-wide">Done</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200" />
                    <div className="flex-1 text-center">
                        <p className={`text-lg font-bold font-heading ${stats.overdue > 0 ? 'text-red-600' : 'text-brand-primary'}`}>{stats.overdue}</p>
                        <p className="text-[10px] text-brand-accent uppercase tracking-wide">Overdue</p>
                    </div>
                </div>

                {/* Filter pills */}
                <div className="flex gap-2">
                    {statusFilters.map(f => (
                        <button
                            key={f.key}
                            onClick={() => applyFilter('status', f.key)}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                                filters.status === f.key
                                    ? 'bg-brand-primary text-white'
                                    : 'bg-white border border-gray-200 text-brand-accent hover:text-brand-primary'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Task list */}
                {tasks.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25" />
                        </svg>
                        <h3 className="mt-3 text-base font-semibold font-heading text-brand-primary">No tasks assigned</h3>
                        <p className="text-sm text-brand-accent mt-1">
                            When your manager assigns tasks to you, they'll show up here.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tasks.map(task => (
                            <div
                                key={task.id}
                                className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                                    task.is_overdue ? 'border-red-300' : 'border-gray-200'
                                }`}
                            >
                                <div className="p-4">
                                    <div className="flex items-start gap-3">
                                        {/* Status circle */}
                                        <button
                                            onClick={() =>
                                                handleStatusChange(
                                                    task.id,
                                                    task.status === 'completed'
                                                        ? 'open'
                                                        : task.status === 'open'
                                                        ? 'in_progress'
                                                        : 'completed'
                                                )
                                            }
                                            className={`mt-0.5 w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition ${
                                                task.status === 'completed'
                                                    ? 'bg-green-500 border-green-500 text-white'
                                                    : task.status === 'in_progress'
                                                    ? 'border-blue-400 bg-blue-50'
                                                    : 'border-gray-300 hover:border-brand-primary'
                                            }`}
                                        >
                                            {task.status === 'completed' && (
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                </svg>
                                            )}
                                            {task.status === 'in_progress' && (
                                                <div className="w-2.5 h-2.5 bg-blue-400 rounded-full" />
                                            )}
                                        </button>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span
                                                    className={`text-sm font-medium ${
                                                        task.status === 'completed'
                                                            ? 'line-through text-gray-400'
                                                            : 'text-brand-primary'
                                                    }`}
                                                >
                                                    {task.title}
                                                </span>
                                                <span
                                                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${
                                                        priorityColors[task.priority]
                                                    }`}
                                                >
                                                    {task.priority}
                                                </span>
                                                {task.is_overdue && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-red-100 text-red-700">
                                                        OVERDUE
                                                    </span>
                                                )}
                                            </div>

                                            {task.description && (
                                                <p className="text-xs text-brand-accent mt-1 line-clamp-2">
                                                    {task.description}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                                {task.due_date && (
                                                    <span
                                                        className={`text-xs ${
                                                            task.is_overdue ? 'text-red-600 font-medium' : 'text-brand-accent'
                                                        }`}
                                                    >
                                                        Due {formatDate(task.due_date)}
                                                        {task.due_time ? ` at ${task.due_time}` : ''}
                                                    </span>
                                                )}
                                                {task.location && (
                                                    <span className="text-xs text-brand-accent">📍 {task.location}</span>
                                                )}
                                                {task.creator && (
                                                    <span className="text-xs text-brand-accent">
                                                        From {task.creator.name.split(' ')[0]}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Subtasks */}
                                {task.subtasks.length > 0 && (
                                    <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-2 space-y-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500 rounded-full transition-all"
                                                    style={{ width: `${task.subtask_progress.percent}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] text-brand-accent font-medium">
                                                {task.subtask_progress.completed}/{task.subtask_progress.total}
                                            </span>
                                        </div>
                                        {task.subtasks.map(st => (
                                            <div key={st.id} className="flex items-center gap-2 py-1">
                                                <button
                                                    onClick={() =>
                                                        handleStatusChange(
                                                            st.id,
                                                            st.status === 'completed' ? 'open' : 'completed'
                                                        )
                                                    }
                                                    className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition ${
                                                        st.status === 'completed'
                                                            ? 'bg-green-500 border-green-500 text-white'
                                                            : 'border-gray-300 hover:border-brand-primary'
                                                    }`}
                                                >
                                                    {st.status === 'completed' && (
                                                        <svg
                                                            className="w-2.5 h-2.5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={3}
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M4.5 12.75l6 6 9-13.5"
                                                            />
                                                        </svg>
                                                    )}
                                                </button>
                                                <span
                                                    className={`text-xs flex-1 ${
                                                        st.status === 'completed'
                                                            ? 'line-through text-gray-400'
                                                            : 'text-brand-secondary'
                                                    }`}
                                                >
                                                    {st.title}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </UserLayout>
    );
}
