import UserLayout from '@/Layouts/UserLayout';
import Icon from '@/Components/Icon';
import { Head, router } from '@inertiajs/react';

interface Attempt {
    id: number;
    score: number;
    result: 'pass' | 'fail';
    correct_count: number;
    total_questions: number;
    created_at: string;
}

interface Quiz {
    id: number;
    title: string;
    description: string | null;
    passing_score: number;
    max_attempts: number | null;
    due_date: string | null;
    questions_count: number;
}

interface Props {
    quizzes: Quiz[];
    myAttempts: Record<number, Attempt[]>;
}

export default function UserQuizzes({ quizzes, myAttempts }: Props) {
    const getQuizStatus = (quiz: Quiz) => {
        const attempts = myAttempts[quiz.id] || [];
        if (attempts.length === 0) return 'not_started';
        if (attempts.some(a => a.result === 'pass')) return 'passed';
        if (quiz.max_attempts && attempts.length >= quiz.max_attempts) return 'failed';
        return 'in_progress';
    };

    const getBestScore = (quizId: number) => {
        const attempts = myAttempts[quizId] || [];
        if (attempts.length === 0) return null;
        return Math.max(...attempts.map(a => a.score));
    };

    const statusConfig: Record<string, { label: string; color: string }> = {
        not_started: { label: 'Not Started', color: 'bg-slate-100 text-slate-600' },
        in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-700' },
        passed: { label: 'Passed', color: 'bg-green-100 text-green-700' },
        failed: { label: 'Failed', color: 'bg-red-100 text-red-700' },
    };

    const passedCount = quizzes.filter(q => getQuizStatus(q) === 'passed').length;
    const pendingCount = quizzes.filter(q => ['not_started', 'in_progress'].includes(getQuizStatus(q))).length;

    const scoredQuizzes = quizzes.filter(q => getBestScore(q.id) !== null);
    const avgScore = scoredQuizzes.length
        ? Math.round(scoredQuizzes.reduce((s, q) => s + (getBestScore(q.id) || 0), 0) / scoredQuizzes.length)
        : 0;

    return (
        <UserLayout>
            <Head title="My Quizzes" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Quizzes</h1>
                    <p className="text-sm text-slate-500 mt-1">Complete assigned quizzes and track your progress.</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Assigned', value: quizzes.length, icon: 'clipboard-list' },
                        { label: 'Completed', value: passedCount, icon: 'check-circle' },
                        { label: 'Pending', value: pendingCount, icon: 'hourglass' },
                        { label: 'Avg Score', value: scoredQuizzes.length ? `${avgScore}%` : '—', icon: 'chart-bar' },
                    ].map(s => (
                        <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <span><Icon name={s.icon} className="w-5 h-5" /></span>
                                <span className="text-xs text-slate-500">{s.label}</span>
                            </div>
                            <span className="text-xl font-bold text-slate-900">{s.value}</span>
                        </div>
                    ))}
                </div>

                {/* Quiz Cards */}
                {quizzes.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                        No quizzes assigned to you yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {quizzes.map(quiz => {
                            const status = getQuizStatus(quiz);
                            const cfg = statusConfig[status];
                            const attempts = myAttempts[quiz.id] || [];
                            const best = getBestScore(quiz.id);
                            const hasPassed = status === 'passed';
                            const canRetry = !quiz.max_attempts || attempts.length < quiz.max_attempts;

                            return (
                                <div key={quiz.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold text-slate-900">{quiz.title}</h3>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${cfg.color}`}>{cfg.label}</span>
                                    </div>
                                    {quiz.description && <p className="text-sm text-slate-500 mb-3 line-clamp-2">{quiz.description}</p>}

                                    <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                                        <span>{quiz.questions_count} question{quiz.questions_count !== 1 ? 's' : ''}</span>
                                        <span>Pass: {quiz.passing_score}%</span>
                                        {best !== null && <span>Best: {best}%</span>}
                                        <span>{attempts.length}{quiz.max_attempts ? `/${quiz.max_attempts}` : ''} attempt{attempts.length !== 1 ? 's' : ''}</span>
                                    </div>

                                    {quiz.due_date && (
                                        <p className="text-xs text-slate-400 mb-3">Due: {new Date(quiz.due_date).toLocaleDateString()}</p>
                                    )}

                                    {best !== null && (
                                        <div className="mb-3">
                                            <div className="w-full bg-slate-100 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full ${best >= quiz.passing_score ? 'bg-green-500' : 'bg-yellow-500'}`}
                                                    style={{ width: `${Math.min(best, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => router.get(route('quizzes.take', quiz.id))}
                                        disabled={hasPassed && !canRetry}
                                        className={`w-full text-center px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                                            hasPassed
                                                ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                                : 'text-white hover:opacity-90'
                                        } disabled:opacity-50`}
                                        style={!hasPassed ? { backgroundColor: '#495B67' } : undefined}
                                    >
                                        {hasPassed ? (canRetry ? 'Retake Quiz' : 'Completed <Icon name="check" className="w-3.5 h-3.5 inline-block" /> ') : status === 'in_progress' ? 'Continue Quiz' : 'Start Quiz'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </UserLayout>
    );
}
