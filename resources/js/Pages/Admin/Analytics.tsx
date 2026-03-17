import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

interface Props {
    team: {
        totalEmployees: number;
        newHires30d: number;
        departments: number;
        roleBreakdown: Record<string, number>;
        departmentStats: { department: string; count: number }[];
    };
    attendance: {
        clockedInNow: number;
        totalHours30d: number;
        avgHoursPerDay: number;
    };
    tasks: {
        total: number;
        open: number;
        completed30d: number;
        completionRate: number;
    };
    forms: {
        active: number;
        submissions30d: number;
    };
    training: {
        totalCourses: number;
        publishedCourses: number;
        assignments: number;
        completions: number;
        completionRate: number;
        totalQuizzes: number;
        quizAttempts30d: number;
        quizPassRate: number;
    };
    communications: {
        totalUpdates: number;
        updates30d: number;
        totalSurveys: number;
        activeSurveys: number;
        surveyResponses30d: number;
        upcomingEvents: number;
        totalRsvps: number;
    };
    helpDesk: {
        openTickets: number;
        resolvedTickets30d: number;
    };
    documents: {
        total: number;
        pendingSignatures: number;
    };
    timeOff: {
        pendingRequests: number;
        approved30d: number;
    };
    recognition: {
        total: number;
        last30d: number;
        topPerformers: {
            user: { id: number; name: string; department: string | null; position: string | null; avatar_url: string | null } | null;
            recognitions: number;
        }[];
    };
    weeklyTrend: { day: string; tasks: number; submissions: number; recognitions: number }[];
}

type Tab = 'overview' | 'team' | 'operations' | 'training' | 'communications';

function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color?: string }) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color ?? 'text-slate-900'}`}>{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
    );
}

function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="text-slate-600">{label}</span>
                <span className="text-slate-400">{value} / {max} ({pct}%)</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
        </div>
    );
}

function MiniBarChart({ data, dataKey, color }: { data: { day: string; [k: string]: number | string }[]; dataKey: string; color: string }) {
    const maxVal = Math.max(...data.map(d => Number(d[dataKey]) || 0), 1);
    return (
        <div className="flex items-end gap-1 h-16">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                        className="w-full rounded-sm transition-all"
                        style={{
                            height: `${Math.max((Number(d[dataKey]) / maxVal) * 100, 4)}%`,
                            backgroundColor: color,
                            minHeight: '2px',
                        }}
                    />
                    <span className="text-[9px] text-slate-400">{d.day}</span>
                </div>
            ))}
        </div>
    );
}

const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

export default function Analytics({ team, attendance, tasks, forms, training, communications, helpDesk, documents, timeOff, recognition, weeklyTrend }: Props) {
    const [tab, setTab] = useState<Tab>('overview');
    const tabs: { key: Tab; label: string }[] = [
        { key: 'overview', label: 'Overview' },
        { key: 'team', label: 'Team' },
        { key: 'operations', label: 'Operations' },
        { key: 'training', label: 'Training' },
        { key: 'communications', label: 'Communications' },
    ];

    return (
        <AdminLayout>
            <Head title="Analytics" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Analytics & Reporting</h1>
                    <p className="text-sm text-slate-500 mt-1">Cross-module insights for the last 30 days.</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                                tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ═══ OVERVIEW TAB ═══ */}
                {tab === 'overview' && (
                    <div className="space-y-6">
                        {/* Top-line stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            <StatCard label="Team Size" value={team.totalEmployees} sub={`${team.newHires30d} new this month`} />
                            <StatCard label="Clocked In" value={attendance.clockedInNow} color="text-green-600" />
                            <StatCard label="Hours (30d)" value={attendance.totalHours30d} sub={`${attendance.avgHoursPerDay} avg/day`} />
                            <StatCard label="Open Tasks" value={tasks.open} color={tasks.open > 10 ? 'text-amber-600' : 'text-slate-900'} />
                            <StatCard label="Task Completion" value={`${tasks.completionRate}%`} />
                            <StatCard label="Open Tickets" value={helpDesk.openTickets} color={helpDesk.openTickets > 5 ? 'text-red-600' : 'text-slate-900'} />
                        </div>

                        {/* Weekly Activity */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                                <h3 className="text-sm font-bold text-slate-900">Tasks Completed</h3>
                                <MiniBarChart data={weeklyTrend} dataKey="tasks" color="#495B67" />
                                <p className="text-xs text-slate-400">{tasks.completed30d} completed in last 30 days</p>
                            </div>
                            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                                <h3 className="text-sm font-bold text-slate-900">Form Submissions</h3>
                                <MiniBarChart data={weeklyTrend} dataKey="submissions" color="#22c55e" />
                                <p className="text-xs text-slate-400">{forms.submissions30d} submissions in last 30 days</p>
                            </div>
                            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                                <h3 className="text-sm font-bold text-slate-900">Recognitions</h3>
                                <MiniBarChart data={weeklyTrend} dataKey="recognitions" color="#eab308" />
                                <p className="text-xs text-slate-400">{recognition.last30d} given in last 30 days</p>
                            </div>
                        </div>

                        {/* Module summary grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard label="Courses" value={training.publishedCourses} sub={`${training.completionRate}% completion rate`} />
                            <StatCard label="Quizzes" value={training.totalQuizzes} sub={`${training.quizPassRate}% pass rate`} />
                            <StatCard label="Documents" value={documents.total} sub={`${documents.pendingSignatures} pending signatures`} />
                            <StatCard label="Leave Requests" value={timeOff.pendingRequests} sub={`${timeOff.approved30d} approved this month`} color={timeOff.pendingRequests > 0 ? 'text-amber-600' : 'text-slate-900'} />
                            <StatCard label="Updates" value={communications.updates30d} sub="posted this month" />
                            <StatCard label="Active Surveys" value={communications.activeSurveys} sub={`${communications.surveyResponses30d} responses`} />
                            <StatCard label="Upcoming Events" value={communications.upcomingEvents} sub={`${communications.totalRsvps} total RSVPs`} />
                            <StatCard label="Recognitions" value={recognition.total} sub={`${recognition.last30d} this month`} />
                        </div>
                    </div>
                )}

                {/* ═══ TEAM TAB ═══ */}
                {tab === 'team' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard label="Total Employees" value={team.totalEmployees} />
                            <StatCard label="New Hires (30d)" value={team.newHires30d} color="text-green-600" />
                            <StatCard label="Departments" value={team.departments} />
                            <StatCard label="Clocked In Now" value={attendance.clockedInNow} color="text-green-600" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Role breakdown */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                                <h3 className="text-sm font-bold text-slate-900">Role Breakdown</h3>
                                {Object.entries(team.roleBreakdown).map(([role, count]) => (
                                    <ProgressBar key={role} label={role} value={count} max={team.totalEmployees} color="#495B67" />
                                ))}
                            </div>

                            {/* Department breakdown */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                                <h3 className="text-sm font-bold text-slate-900">Department Distribution</h3>
                                {team.departmentStats.length > 0 ? (
                                    team.departmentStats.map(d => (
                                        <ProgressBar key={d.department} label={d.department} value={d.count} max={team.totalEmployees} color="#495B67" />
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-400">No departments configured yet.</p>
                                )}
                            </div>
                        </div>

                        {/* Top performers */}
                        {recognition.topPerformers.length > 0 && (
                            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                                <h3 className="text-sm font-bold text-slate-900">Top Recognized Employees</h3>
                                <div className="divide-y divide-slate-100">
                                    {recognition.topPerformers.map((p, i) => (
                                        <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                                            <span className="text-sm font-bold text-slate-300 w-6">#{i + 1}</span>
                                            {p.user?.avatar_url ? (
                                                <img src={p.user.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-slate-100 text-slate-500">
                                                    {p.user ? initials(p.user.name) : '?'}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 truncate">{p.user?.name ?? 'Unknown'}</p>
                                                <p className="text-xs text-slate-400">{p.user?.position || p.user?.department || '—'}</p>
                                            </div>
                                            <span className="text-sm font-bold" style={{ color: '#495B67' }}>{p.recognitions} 🏆</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ OPERATIONS TAB ═══ */}
                {tab === 'operations' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard label="Total Hours (30d)" value={attendance.totalHours30d} sub={`${attendance.avgHoursPerDay} avg/day`} />
                            <StatCard label="Total Tasks" value={tasks.total} />
                            <StatCard label="Open Tasks" value={tasks.open} color={tasks.open > 10 ? 'text-amber-600' : 'text-slate-900'} />
                            <StatCard label="Task Completion" value={`${tasks.completionRate}%`} color={tasks.completionRate >= 75 ? 'text-green-600' : 'text-amber-600'} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                                <h3 className="text-sm font-bold text-slate-900">Tasks</h3>
                                <ProgressBar label="Completed" value={tasks.total - tasks.open} max={tasks.total} color="#22c55e" />
                                <ProgressBar label="Open / In Progress" value={tasks.open} max={tasks.total} color="#eab308" />
                                <div className="pt-2 border-t border-slate-100">
                                    <p className="text-xs text-slate-400">{tasks.completed30d} tasks completed in the last 30 days</p>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                                <h3 className="text-sm font-bold text-slate-900">Forms & Help Desk</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-slate-400">Active Forms</p>
                                        <p className="text-xl font-bold text-slate-900">{forms.active}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Submissions (30d)</p>
                                        <p className="text-xl font-bold text-slate-900">{forms.submissions30d}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Open Tickets</p>
                                        <p className="text-xl font-bold" style={{ color: helpDesk.openTickets > 5 ? '#ef4444' : '#0f172a' }}>{helpDesk.openTickets}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Resolved (30d)</p>
                                        <p className="text-xl font-bold text-green-600">{helpDesk.resolvedTickets30d}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                                <h3 className="text-sm font-bold text-slate-900">Documents</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-slate-400">Total Documents</p>
                                        <p className="text-xl font-bold text-slate-900">{documents.total}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Pending Signatures</p>
                                        <p className="text-xl font-bold" style={{ color: documents.pendingSignatures > 0 ? '#f59e0b' : '#0f172a' }}>{documents.pendingSignatures}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                                <h3 className="text-sm font-bold text-slate-900">Time Off</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-slate-400">Pending Requests</p>
                                        <p className="text-xl font-bold" style={{ color: timeOff.pendingRequests > 0 ? '#f59e0b' : '#0f172a' }}>{timeOff.pendingRequests}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Approved (30d)</p>
                                        <p className="text-xl font-bold text-green-600">{timeOff.approved30d}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ TRAINING TAB ═══ */}
                {tab === 'training' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard label="Published Courses" value={training.publishedCourses} sub={`${training.totalCourses} total`} />
                            <StatCard label="Course Completion" value={`${training.completionRate}%`} color={training.completionRate >= 75 ? 'text-green-600' : 'text-amber-600'} />
                            <StatCard label="Total Quizzes" value={training.totalQuizzes} />
                            <StatCard label="Quiz Pass Rate" value={`${training.quizPassRate}%`} color={training.quizPassRate >= 75 ? 'text-green-600' : 'text-amber-600'} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                                <h3 className="text-sm font-bold text-slate-900">Course Progress</h3>
                                <ProgressBar label="Completed" value={training.completions} max={training.assignments} color="#22c55e" />
                                <ProgressBar label="In Progress" value={training.assignments - training.completions} max={training.assignments} color="#eab308" />
                                <div className="pt-2 border-t border-slate-100">
                                    <p className="text-xs text-slate-400">{training.assignments} total course assignments</p>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                                <h3 className="text-sm font-bold text-slate-900">Quiz Activity</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-slate-400">Attempts (30d)</p>
                                        <p className="text-xl font-bold text-slate-900">{training.quizAttempts30d}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Pass Rate</p>
                                        <p className="text-xl font-bold" style={{ color: training.quizPassRate >= 75 ? '#22c55e' : '#f59e0b' }}>{training.quizPassRate}%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ COMMUNICATIONS TAB ═══ */}
                {tab === 'communications' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard label="Updates (30d)" value={communications.updates30d} sub={`${communications.totalUpdates} total`} />
                            <StatCard label="Active Surveys" value={communications.activeSurveys} sub={`${communications.totalSurveys} total`} />
                            <StatCard label="Upcoming Events" value={communications.upcomingEvents} />
                            <StatCard label="Recognitions (30d)" value={recognition.last30d} sub={`${recognition.total} all-time`} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                                <h3 className="text-sm font-bold text-slate-900">Survey Engagement</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-slate-400">Active Surveys</p>
                                        <p className="text-xl font-bold text-slate-900">{communications.activeSurveys}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Responses (30d)</p>
                                        <p className="text-xl font-bold text-slate-900">{communications.surveyResponses30d}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                                <h3 className="text-sm font-bold text-slate-900">Events</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-slate-400">Upcoming</p>
                                        <p className="text-xl font-bold text-slate-900">{communications.upcomingEvents}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Total RSVPs</p>
                                        <p className="text-xl font-bold text-slate-900">{communications.totalRsvps}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
