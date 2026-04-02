import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';

interface Answer {
    id: number;
    answer: string;
    is_correct: boolean;
    sort_order: number;
}

interface Question {
    id: number;
    question: string;
    sort_order: number;
    answers: Answer[];
}

interface Assignment {
    id: number;
    user: { id: number; name: string; email: string };
}

interface Employee {
    id: number;
    name: string;
    email: string;
}

interface QuizStats {
    total_attempts: number;
    avg_score: number;
    pass_rate: number;
    unique_takers: number;
}

interface QuizData {
    id: number;
    title: string;
    description: string | null;
    passing_score: number;
    max_attempts: number | null;
    randomize_questions: boolean;
    show_score: boolean;
    show_correct_answers: boolean;
    status: string;
    due_date: string | null;
    questions: Question[];
}

interface Props {
    quiz: QuizData;
    employees: Employee[];
    assignments: Assignment[];
    quizStats: QuizStats;
}

export default function QuizBuilder({ quiz, employees, assignments, quizStats }: Props) {
    const [activeTab, setActiveTab] = useState<'questions' | 'assignments' | 'settings'>('questions');
    const [showAssign, setShowAssign] = useState(false);

    // ── Question form ─────────────────────────────────────
    const [questionText, setQuestionText] = useState('');
    const [answers, setAnswers] = useState<{ answer: string; is_correct: boolean }[]>([
        { answer: '', is_correct: true },
        { answer: '', is_correct: false },
    ]);

    const resetForm = () => {
        setQuestionText('');
        setAnswers([
            { answer: '', is_correct: true },
            { answer: '', is_correct: false },
        ]);
    };

    const addAnswer = () => setAnswers(a => [...a, { answer: '', is_correct: false }]);
    const removeAnswer = (idx: number) => { if (answers.length > 2) setAnswers(a => a.filter((_, i) => i !== idx)); };

    const setCorrect = (idx: number) => {
        setAnswers(a => a.map((ans, i) => ({ ...ans, is_correct: i === idx })));
    };

    const updateAnswerText = (idx: number, text: string) => {
        setAnswers(a => a.map((ans, i) => i === idx ? { ...ans, answer: text } : ans));
    };

    const saveQuestion = () => {
        const payload = { question: questionText, answers } as any;
        router.post(route('admin.quizzes.questions.store', quiz.id), payload, {
            preserveScroll: true,
            onSuccess: () => resetForm(),
        });
    };

    const deleteQuestion = (id: number) => {
        if (!confirm('Delete this question?')) return;
        router.delete(route('admin.quizzes.questions.destroy', { quiz: quiz.id, question: id }), { preserveScroll: true });
    };

    // ── Settings form ─────────────────────────────────────
    const settingsForm = useForm({
        title: quiz.title,
        description: quiz.description || '',
        passing_score: quiz.passing_score,
        max_attempts: quiz.max_attempts ?? ('' as string | number),
        randomize_questions: quiz.randomize_questions,
        show_score: quiz.show_score,
        show_correct_answers: quiz.show_correct_answers,
        due_date: quiz.due_date || '',
    });

    const saveSettings: FormEventHandler = (e) => {
        e.preventDefault();
        settingsForm.put(route('admin.quizzes.update', quiz.id), { preserveScroll: true });
    };

    // ── Assign ────────────────────────────────────────────
    const assignForm = useForm({ user_ids: [] as number[] });
    const assignedUserIds = assignments.map(a => a.user.id);
    const unassigned = employees.filter(e => !assignedUserIds.includes(e.id));

    const handleAssign: FormEventHandler = (e) => {
        e.preventDefault();
        assignForm.post(route('admin.quizzes.assign', quiz.id), {
            onSuccess: () => { assignForm.reset(); setShowAssign(false); },
        });
    };

    const removeAssignment = (id: number) => {
        router.delete(route('admin.quizzes.remove-assignment', id), { preserveScroll: true });
    };

    return (
        <AdminLayout>
            <Head title={`Quiz Builder — ${quiz.title}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <a href={route('admin.quizzes.index')} className="text-slate-400 hover:text-slate-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </a>
                            <h1 className="text-2xl font-bold text-slate-900">{quiz.title}</h1>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${quiz.status === 'published' ? 'bg-green-100 text-green-700' : quiz.status === 'archived' ? 'bg-slate-100 text-slate-500' : 'bg-yellow-100 text-yellow-700'}`}>
                                {quiz.status}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">{quiz.questions.length} questions · Pass: {quiz.passing_score}% · {assignments.length} assigned</p>
                    </div>
                    <div className="flex gap-2">
                        {quiz.status === 'draft' && (
                            <button onClick={() => router.post(route('admin.quizzes.publish', quiz.id))} className="px-4 py-2 text-sm text-white rounded-lg bg-green-600 hover:bg-green-700">Publish</button>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Attempts', value: quizStats.total_attempts, icon: 'pencil' },
                        { label: 'Avg Score', value: `${quizStats.avg_score}%`, icon: 'chart-bar' },
                        { label: 'Pass Rate', value: `${quizStats.pass_rate}%`, icon: 'check-circle' },
                        { label: 'Unique Takers', value: quizStats.unique_takers, icon: 'user-group' },
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

                {/* Tabs */}
                <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
                    {(['questions', 'assignments', 'settings'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* ── Questions Tab ─────────────────────────── */}
                {activeTab === 'questions' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Add Question Form */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-6">
                                <h2 className="text-sm font-bold text-slate-900 mb-4">Add Question</h2>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Question *</label>
                                        <textarea value={questionText} onChange={e => setQuestionText(e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" rows={2} placeholder="Enter your question..." />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Answer Options</label>
                                        <div className="space-y-2">
                                            {answers.map((ans, idx) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="correct_answer"
                                                        checked={ans.is_correct}
                                                        onChange={() => setCorrect(idx)}
                                                        className="text-green-600"
                                                        title="Mark as correct answer"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={ans.answer}
                                                        onChange={e => updateAnswerText(idx, e.target.value)}
                                                        className="flex-1 rounded-lg border-slate-200 text-sm"
                                                        placeholder={`Option ${idx + 1}`}
                                                    />
                                                    {answers.length > 2 && (
                                                        <button type="button" onClick={() => removeAnswer(idx)} className="text-red-400 hover:text-red-600 text-xs"><Icon name="x-mark" className="w-3 h-3 inline-block" /></button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <button type="button" onClick={addAnswer} className="text-xs text-blue-600 mt-2 hover:underline">+ Add Option</button>
                                    </div>

                                    <button
                                        onClick={saveQuestion}
                                        disabled={!questionText.trim() || answers.some(a => !a.answer.trim())}
                                        className="w-full px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50"
                                        style={{ backgroundColor: '#495B67' }}
                                    >
                                        Add Question
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Questions List */}
                        <div className="lg:col-span-2 space-y-3">
                            {quiz.questions.length === 0 ? (
                                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
                                    No questions yet. Use the form to add your first question.
                                </div>
                            ) : (
                                quiz.questions.map((q, idx) => (
                                    <div key={q.id} className="bg-white rounded-xl border border-slate-200 p-5">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-slate-400">Q{idx + 1}</span>
                                                    <span className="text-xs text-slate-400">{q.answers.length} options</span>
                                                </div>
                                                <p className="text-sm font-medium text-slate-900">{q.question}</p>
                                            </div>
                                            <button onClick={() => deleteQuestion(q.id)} className="p-1 text-slate-400 hover:text-red-600 ml-3">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>

                                        {q.answers.length > 0 && (
                                            <div className="mt-3 space-y-1.5">
                                                {q.answers.map((ans) => (
                                                    <div key={ans.id} className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg ${ans.is_correct ? 'bg-green-50 text-green-700 font-medium' : 'bg-slate-50 text-slate-600'}`}>
                                                        {ans.is_correct ? (
                                                            <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                        ) : (
                                                            <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                                                        )}
                                                        {ans.answer}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* ── Assignments Tab ──────────────────────── */}
                {activeTab === 'assignments' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-700">{assignments.length} Assigned</h3>
                            <button onClick={() => setShowAssign(true)} className="px-4 py-2 text-sm text-white rounded-lg" style={{ backgroundColor: '#495B67' }}>
                                Assign Employees
                            </button>
                        </div>

                        {assignments.length === 0 ? (
                            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
                                No one assigned yet. Click "Assign Employees" to get started.
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                                {assignments.map(a => (
                                    <div key={a.id} className="flex items-center justify-between px-5 py-3">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{a.user.name}</p>
                                            <p className="text-xs text-slate-400">{a.user.email}</p>
                                        </div>
                                        <button onClick={() => removeAssignment(a.id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Settings Tab ─────────────────────────── */}
                {activeTab === 'settings' && (
                    <div className="max-w-lg">
                        <form onSubmit={saveSettings} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                            <h3 className="text-sm font-bold text-slate-900">Quiz Settings</h3>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                                <input type="text" value={settingsForm.data.title} onChange={e => settingsForm.setData('title', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea value={settingsForm.data.description} onChange={e => settingsForm.setData('description', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" rows={2} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Passing Score (%)</label>
                                    <input type="number" min={1} max={100} value={settingsForm.data.passing_score} onChange={e => settingsForm.setData('passing_score', Number(e.target.value))} className="w-full rounded-lg border-slate-200 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Max Attempts</label>
                                    <input type="number" min={1} value={settingsForm.data.max_attempts} onChange={e => settingsForm.setData('max_attempts', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" placeholder="Unlimited" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                                <input type="date" value={settingsForm.data.due_date} onChange={e => settingsForm.setData('due_date', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={settingsForm.data.randomize_questions} onChange={e => settingsForm.setData('randomize_questions', e.target.checked)} className="rounded border-slate-300" />
                                    Randomize question order
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={settingsForm.data.show_score} onChange={e => settingsForm.setData('show_score', e.target.checked)} className="rounded border-slate-300" />
                                    Show score after completion
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={settingsForm.data.show_correct_answers} onChange={e => settingsForm.setData('show_correct_answers', e.target.checked)} className="rounded border-slate-300" />
                                    Show correct answers after completion
                                </label>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button type="submit" disabled={settingsForm.processing} className="px-6 py-2 text-sm text-white rounded-lg disabled:opacity-50" style={{ backgroundColor: '#495B67' }}>Save Settings</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* Assign Modal */}
            {showAssign && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAssign(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <form onSubmit={handleAssign} className="p-6 space-y-4">
                            <h2 className="text-lg font-bold text-slate-900">Assign Quiz</h2>
                            <p className="text-sm text-slate-500">Select employees to assign this quiz to.</p>

                            {unassigned.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-4">All employees are already assigned.</p>
                            ) : (
                                <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto p-2 space-y-1">
                                    {unassigned.map(u => (
                                        <label key={u.id} className="flex items-center gap-2 text-sm p-1.5 rounded hover:bg-slate-50 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={assignForm.data.user_ids.includes(u.id)}
                                                onChange={e => {
                                                    const ids = e.target.checked
                                                        ? [...assignForm.data.user_ids, u.id]
                                                        : assignForm.data.user_ids.filter(id => id !== u.id);
                                                    assignForm.setData('user_ids', ids);
                                                }}
                                                className="rounded border-slate-300"
                                            />
                                            <span>{u.name}</span>
                                            <span className="text-xs text-slate-400 ml-auto">{u.email}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowAssign(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">Cancel</button>
                                <button type="submit" disabled={assignForm.processing || assignForm.data.user_ids.length === 0} className="px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50" style={{ backgroundColor: '#495B67' }}>
                                    Assign ({assignForm.data.user_ids.length})
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
