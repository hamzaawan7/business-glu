import UserLayout from '@/Layouts/UserLayout';
import Icon from '@/Components/Icon';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface CourseInfo {
    id: number;
    title: string;
    description: string | null;
    estimated_minutes: number | null;
    is_mandatory: boolean;
    status: string;
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
}

interface AvailableCourse {
    id: number;
    title: string;
    description: string | null;
    estimated_minutes: number | null;
    is_mandatory: boolean;
    category: { id: number; name: string } | null;
    sections_count: number;
}

interface Props {
    assignments: AssignmentData[];
    availableCourses: AvailableCourse[];
}

export default function UserCourses({ assignments, availableCourses }: Props) {
    const [tab, setTab] = useState<'my' | 'browse'>('my');

    const inProgress = assignments.filter((a) => a.status !== 'completed');
    const completed  = assignments.filter((a) => a.status === 'completed');

    return (
        <UserLayout>
            <Head title="Courses & Training" />

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Courses & Training</h1>
                    <p className="text-sm text-slate-500">Complete your assigned training courses</p>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 rounded-xl border border-blue-100 p-3 text-center">
                        <div className="text-xl font-bold text-blue-700">{inProgress.length}</div>
                        <div className="text-xs text-blue-600">In Progress</div>
                    </div>
                    <div className="bg-green-50 rounded-xl border border-green-100 p-3 text-center">
                        <div className="text-xl font-bold text-green-700">{completed.length}</div>
                        <div className="text-xs text-green-600">Completed</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 text-center">
                        <div className="text-xl font-bold text-slate-900">{availableCourses.length}</div>
                        <div className="text-xs text-slate-500">Available</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                    {([['my', 'My Courses'], ['browse', 'Browse']] as const).map(([key, label]) => (
                        <button key={key} onClick={() => setTab(key)} className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition ${tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                            {label}
                        </button>
                    ))}
                </div>

                {tab === 'my' && (
                    <div className="space-y-4">
                        {/* In Progress */}
                        {inProgress.length > 0 && (
                            <>
                                <h2 className="text-sm font-semibold text-slate-700">In Progress</h2>
                                {inProgress.map((a) => (
                                    <div
                                        key={a.id}
                                        onClick={() => a.course && router.get(route('courses.detail', a.course.id))}
                                        className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:border-[#495B67]/30 transition"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-medium text-slate-900">{a.course?.title}</h3>
                                                {a.course?.description && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{a.course.description}</p>}
                                            </div>
                                            {a.course?.is_mandatory && (
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 ml-2">Required</span>
                                            )}
                                        </div>
                                        <div className="mt-3">
                                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                                                <span>{a.progress_pct}% complete</span>
                                                {a.due_date && <span>Due {a.due_date}</span>}
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2">
                                                <div className="h-2 rounded-full transition-all" style={{ width: `${a.progress_pct}%`, backgroundColor: '#495B67' }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}

                        {/* Completed */}
                        {completed.length > 0 && (
                            <>
                                <h2 className="text-sm font-semibold text-slate-700 mt-6">Completed</h2>
                                {completed.map((a) => (
                                    <div key={a.id} className="bg-green-50 rounded-xl border border-green-100 p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium text-slate-900">{a.course?.title}</h3>
                                                <p className="text-xs text-green-600 mt-1">Completed {a.completed_at ? new Date(a.completed_at).toLocaleDateString() : ''}</p>
                                            </div>
                                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">100%</span>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}

                        {assignments.length === 0 && (
                            <div className="text-center py-12">
                                <div className="text-3xl mb-2"><Icon name="book-open" className="w-4 h-4 inline-block" /></div>
                                <p className="text-slate-400 text-sm">No courses assigned yet</p>
                                <button onClick={() => setTab('browse')} className="text-sm text-[#495B67] hover:underline mt-2">Browse available courses</button>
                            </div>
                        )}
                    </div>
                )}

                {tab === 'browse' && (
                    <div className="space-y-3">
                        {availableCourses.length === 0 && (
                            <div className="text-center py-12">
                                <div className="text-3xl mb-2"><Icon name="book-open" className="w-4 h-4 inline-block" /></div>
                                <p className="text-slate-400 text-sm">No courses available right now</p>
                            </div>
                        )}
                        {availableCourses.map((c) => (
                            <div
                                key={c.id}
                                onClick={() => router.get(route('courses.detail', c.id))}
                                className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:border-[#495B67]/30 transition"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-medium text-slate-900">{c.title}</h3>
                                        {c.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{c.description}</p>}
                                    </div>
                                    {c.is_mandatory && (
                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 ml-2">Required</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                                    {c.category && <span>{c.category.name}</span>}
                                    <span>{c.sections_count} sections</span>
                                    {c.estimated_minutes && <span><Icon name="stopwatch" className="w-3.5 h-3.5 inline-block" /> {c.estimated_minutes} min</span>}
                                    <span className="ml-auto text-[#495B67] font-medium">Start →</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </UserLayout>
    );
}
