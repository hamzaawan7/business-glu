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
    cover_image: string | null;
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
    total_duration_minutes: number;
}

interface AvailableCourse {
    id: number;
    title: string;
    description: string | null;
    estimated_minutes: number | null;
    is_mandatory: boolean;
    cover_image: string | null;
    category: { id: number; name: string } | null;
    sections_count: number;
}

interface Props {
    assignments: AssignmentData[];
    availableCourses: AvailableCourse[];
}

const placeholderGradients = [
    'from-[#495B67] to-[#5d7a8a]',
    'from-[#5d7a8a] to-[#7a9bab]',
    'from-[#3d4f5a] to-[#495B67]',
    'from-[#495B67] to-[#6b8999]',
    'from-[#3a5060] to-[#5d7a8a]',
];

export default function UserCourses({ assignments, availableCourses }: Props) {
    const [tab, setTab] = useState<'my' | 'browse'>('my');
    const [search, setSearch] = useState('');
    const [enrollCourse, setEnrollCourse] = useState<AvailableCourse | null>(null);

    const inProgress = assignments.filter((a) => a.status !== 'completed');
    const completed  = assignments.filter((a) => a.status === 'completed');

    const isOverdue = (d: string | null) => d ? new Date(d) < new Date() : false;

    const filteredAvailable = (() => {
        if (!search.trim()) return availableCourses;
        const q = search.toLowerCase();
        return availableCourses.filter((c) => c.title.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q) || c.category?.name.toLowerCase().includes(q));
    })();

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
                    <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-3 text-center">
                        <div className="text-xl font-bold text-emerald-700">{completed.length}</div>
                        <div className="text-xs text-emerald-600">Completed</div>
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
                    <div className="space-y-5">
                        {/* In Progress */}
                        {inProgress.length > 0 && (
                            <>
                                <h2 className="text-sm font-semibold text-slate-700">In Progress</h2>
                                <div className="space-y-4">
                                    {inProgress.map((a, idx) => (
                                        <div
                                            key={a.id}
                                            onClick={() => a.course && router.get(route('courses.detail', a.course.id))}
                                            className="group bg-white rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md hover:border-slate-300 transition-all duration-300"
                                        >
                                            {/* Cover + Progress Overlay */}
                                            <div className="relative h-28 overflow-hidden">
                                                {a.course?.cover_image ? (
                                                    <img src={a.course.cover_image} alt={a.course?.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                ) : (
                                                    <div className={`w-full h-full bg-gradient-to-br ${placeholderGradients[idx % placeholderGradients.length]} flex items-center justify-center`}>
                                                        <Icon name="book-open" className="w-8 h-8 text-white/20" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                                {a.course?.is_mandatory && (
                                                    <span className="absolute top-2.5 left-2.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/90 text-white backdrop-blur-sm">Required</span>
                                                )}
                                                {isOverdue(a.due_date) && (
                                                    <span className="absolute top-2.5 left-2.5 mt-6 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-600 text-white backdrop-blur-sm animate-pulse">Overdue</span>
                                                )}
                                                {a.course?.category && (
                                                    <span className="absolute top-2.5 right-2.5 text-xs font-medium px-2 py-0.5 rounded-full bg-black/30 text-white backdrop-blur-sm">{a.course.category.name}</span>
                                                )}
                                                {/* Progress bar at bottom of image */}
                                                <div className="absolute inset-x-0 bottom-0">
                                                    <div className="w-full bg-black/20 h-1.5">
                                                        <div className="h-1.5 transition-all duration-500" style={{ width: `${a.progress_pct}%`, backgroundColor: a.progress_pct >= 75 ? '#16a34a' : '#f59e0b' }} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-slate-900 truncate">{a.course?.title}</h3>
                                                        {a.course?.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{a.course.description}</p>}
                                                    </div>
                                                    <span className="ml-3 text-sm font-bold" style={{ color: '#495B67' }}>{a.progress_pct}%</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <Icon name="check-circle" className="w-3.5 h-3.5 text-emerald-500" />
                                                        {a.completed_lessons} of {a.total_lessons} lessons
                                                    </span>
                                                    {a.total_duration_minutes > 0 && (() => {
                                                        const remaining = Math.max(0, Math.round(a.total_duration_minutes * (1 - a.progress_pct / 100)));
                                                        return remaining > 0 ? (
                                                            <span className="flex items-center gap-1 text-slate-400">
                                                                <Icon name="stopwatch" className="w-3 h-3" />
                                                                {remaining} min left
                                                            </span>
                                                        ) : null;
                                                    })()}
                                                </div>
                                                <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                                                    {a.due_date && isOverdue(a.due_date) ? (
                                                        <span className="text-red-600 font-semibold flex items-center gap-1">
                                                            <Icon name="exclamation-triangle" className="w-3.5 h-3.5" />
                                                            Overdue &middot; was due {new Date(a.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    ) : a.due_date ? (
                                                        <span className="text-amber-600 font-medium">Due {new Date(a.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                    ) : <span />}
                                                    <span className="text-[#495B67] font-medium group-hover:underline">Continue &rarr;</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Completed */}
                        {completed.length > 0 && (
                            <>
                                <h2 className="text-sm font-semibold text-slate-700 mt-2">Completed</h2>
                                <div className="space-y-3">
                                    {completed.map((a, idx) => (
                                        <div
                                            key={a.id}
                                            onClick={() => a.course && router.get(route('courses.detail', a.course.id))}
                                            className="group bg-white rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md transition-all duration-300"
                                        >
                                            <div className="flex items-center">
                                                {/* Mini cover */}
                                                <div className="w-20 h-20 flex-shrink-0 overflow-hidden">
                                                    {a.course?.cover_image ? (
                                                        <img src={a.course.cover_image} alt={a.course?.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className={`w-full h-full bg-gradient-to-br ${placeholderGradients[idx % placeholderGradients.length]} flex items-center justify-center`}>
                                                            <Icon name="book-open" className="w-5 h-5 text-white/20" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0 px-4 py-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="min-w-0">
                                                            <h3 className="font-medium text-slate-900 truncate">{a.course?.title}</h3>
                                                            <p className="text-xs text-emerald-600 mt-0.5">
                                                                {a.total_lessons} lessons completed &middot; {a.completed_at ? new Date(a.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                                                            </p>
                                                        </div>
                                                        <div className="ml-3 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                                            <Icon name="check" className="w-4 h-4 text-emerald-600" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {assignments.length === 0 && (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                    <Icon name="book-open" className="w-8 h-8 text-slate-300" />
                                </div>
                                <p className="text-slate-500 text-sm font-medium">No courses assigned yet</p>
                                <button onClick={() => setTab('browse')} className="text-sm font-medium mt-3 px-4 py-2 rounded-lg hover:opacity-90 transition text-white" style={{ backgroundColor: '#495B67' }}>Browse Courses</button>
                            </div>
                        )}
                    </div>
                )}

                {tab === 'browse' && (
                    <div className="space-y-4">
                        {/* Search */}
                        <div className="relative">
                            <Icon name="magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search courses..."
                                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#495B67]/20 focus:border-[#495B67] transition bg-white"
                            />
                        </div>

                        {filteredAvailable.length === 0 && (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                    <Icon name="book-open" className="w-8 h-8 text-slate-300" />
                                </div>
                                <p className="text-slate-500 text-sm font-medium">No courses available right now</p>
                                <p className="text-slate-400 text-xs mt-1">Check back later for new training</p>
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filteredAvailable.map((c, idx) => (
                                <div
                                    key={c.id}
                                    onClick={() => setEnrollCourse(c)}
                                    className="group bg-white rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md hover:border-slate-300 transition-all duration-300"
                                >
                                    {/* Cover */}
                                    <div className="relative h-32 overflow-hidden">
                                        {c.cover_image ? (
                                            <img src={c.cover_image} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className={`w-full h-full bg-gradient-to-br ${placeholderGradients[idx % placeholderGradients.length]} flex items-center justify-center`}>
                                                <Icon name="book-open" className="w-8 h-8 text-white/20" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                                        {c.is_mandatory && (
                                            <span className="absolute top-2.5 left-2.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/90 text-white backdrop-blur-sm">Required</span>
                                        )}
                                        {c.category && (
                                            <span className="absolute top-2.5 right-2.5 text-xs font-medium px-2 py-0.5 rounded-full bg-black/30 text-white backdrop-blur-sm">{c.category.name}</span>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-slate-900 truncate">{c.title}</h3>
                                        {c.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{c.description}</p>}
                                        <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center gap-1">
                                                    <Icon name="squares-2x2" className="w-3 h-3" />
                                                    {c.sections_count} sections
                                                </span>
                                                {c.estimated_minutes && (
                                                    <span className="flex items-center gap-1">
                                                        <Icon name="stopwatch" className="w-3 h-3" />
                                                        {c.estimated_minutes} min
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[#495B67] font-semibold group-hover:underline">Start &rarr;</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Enrollment Confirmation ── */}
            {enrollCourse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setEnrollCourse(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Mini cover */}
                        <div className={`h-28 bg-gradient-to-br ${placeholderGradients[enrollCourse.id % placeholderGradients.length]} flex items-center justify-center relative overflow-hidden`}>
                            {enrollCourse.cover_image ? (
                                <img src={enrollCourse.cover_image} alt={enrollCourse.title} className="w-full h-full object-cover" />
                            ) : (
                                <Icon name="book-open" className="w-10 h-10 text-white/20" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            {enrollCourse.is_mandatory && (
                                <span className="absolute top-2.5 left-2.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/90 text-white">Required</span>
                            )}
                        </div>
                        <div className="p-5 text-center">
                            <h3 className="text-lg font-bold text-slate-900">{enrollCourse.title}</h3>
                            {enrollCourse.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{enrollCourse.description}</p>}
                            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-400">
                                {enrollCourse.sections_count > 0 && (
                                    <span className="flex items-center gap-1">
                                        <Icon name="squares-2x2" className="w-3 h-3" />
                                        {enrollCourse.sections_count} sections
                                    </span>
                                )}
                                {enrollCourse.estimated_minutes && (
                                    <span className="flex items-center gap-1">
                                        <Icon name="stopwatch" className="w-3 h-3" />
                                        {enrollCourse.estimated_minutes} min
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="px-5 pb-5 flex gap-3">
                            <button onClick={() => setEnrollCourse(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition">Cancel</button>
                            <button
                                onClick={() => router.get(route('courses.detail', enrollCourse.id))}
                                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition"
                                style={{ backgroundColor: '#495B67' }}
                            >Start Course</button>
                        </div>
                    </div>
                </div>
            )}
        </UserLayout>
    );
}
