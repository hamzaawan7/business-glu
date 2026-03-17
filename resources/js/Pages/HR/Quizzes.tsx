import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';

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
    questions_count: number;
    assignments_count: number;
    attempts_count: number;
    created_at: string;
}

interface Props {
    quizzes: QuizData[];
    filters: { status: string };
    stats: { total: number; published: number; draft: number; attempts: number };
}

const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    published: 'bg-green-100 text-green-700',
    archived: 'bg-amber-100 text-amber-700',
};

export default function Quizzes({ quizzes, filters, stats }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const form = useForm({
        title: '',
        description: '',
        passing_score: 70,
        max_attempts: '' as string | number,
        randomize_questions: false,
        show_score: true,
        show_correct_answers: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route('admin.quizzes.store'), {
            onSuccess: () => { form.reset(); setShowCreate(false); },
        });
    };

    const confirmDelete = () => {
        if (!deleteId) return;
        router.delete(route('admin.quizzes.destroy', deleteId), { preserveScroll: true, onSuccess: () => setDeleteId(null) });
    };

    const applyFilter = (key: string, value: string) => {
        router.get(route('admin.quizzes.index'), { ...filters, [key]: value }, { preserveState: true, preserveScroll: true });
    };

    return (
        <AdminLayout>
            <Head title="Quizzes" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Quizzes</h1>
                        <p className="text-sm text-slate-500 mt-1">Build and manage quizzes for employee training and assessments</p>
                    </div>
                    <button onClick={() => setShowCreate(true)} className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#495B67' }}>+ New Quiz</button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Quizzes', value: stats.total, color: 'bg-slate-50' },
                        { label: 'Published', value: stats.published, color: 'bg-green-50' },
                        { label: 'Draft', value: stats.draft, color: 'bg-slate-50' },
                        { label: 'Total Attempts', value: stats.attempts, color: 'bg-blue-50' },
                    ].map((s) => (
                        <div key={s.label} className={`${s.color} rounded-xl p-4 text-center`}>
                            <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Filter */}
                <div className="flex gap-3">
                    <select value={filters.status} onChange={e => applyFilter('status', e.target.value)} className="rounded-lg border-slate-200 text-sm">
                        <option value="all">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>

                {/* Quiz Cards */}
                {quizzes.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
                        No quizzes yet. Create your first quiz to get started.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {quizzes.map(q => (
                            <div key={q.id} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="font-semibold text-slate-900 text-sm leading-tight">{q.title}</h3>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${statusColors[q.status]}`}>{q.status}</span>
                                </div>
                                {q.description && <p className="text-xs text-slate-400 mb-3 line-clamp-2">{q.description}</p>}
                                <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-500 mb-4">
                                    <div><span className="font-semibold text-slate-700">{q.questions_count}</span><br />Questions</div>
                                    <div><span className="font-semibold text-slate-700">{q.assignments_count}</span><br />Assigned</div>
                                    <div><span className="font-semibold text-slate-700">{q.attempts_count}</span><br />Attempts</div>
                                </div>
                                <div className="text-xs text-slate-400 mb-3">
                                    Pass: {q.passing_score}%{q.max_attempts ? ` · Max ${q.max_attempts} attempts` : ''}{q.randomize_questions ? ' · Randomized' : ''}
                                </div>
                                <div className="flex gap-2 mt-auto">
                                    <a href={route('admin.quizzes.builder', q.id)} className="flex-1 text-center text-xs px-3 py-2 rounded-lg font-medium text-white" style={{ backgroundColor: '#495B67' }}>
                                        Builder
                                    </a>
                                    {q.status === 'draft' && (
                                        <button onClick={() => router.post(route('admin.quizzes.publish', q.id), {}, { preserveScroll: true })} className="text-xs px-3 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100">Publish</button>
                                    )}
                                    <button onClick={() => setDeleteId(q.id)} className="text-xs px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <form onSubmit={submit} className="p-6 space-y-4">
                            <h2 className="text-lg font-bold text-slate-900">Create Quiz</h2>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                                <input type="text" value={form.data.title} onChange={e => form.setData('title', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" required />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea value={form.data.description} onChange={e => form.setData('description', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" rows={2} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Passing Score (%)</label>
                                    <input type="number" min={1} max={100} value={form.data.passing_score} onChange={e => form.setData('passing_score', Number(e.target.value))} className="w-full rounded-lg border-slate-200 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Max Attempts</label>
                                    <input type="number" min={1} value={form.data.max_attempts} onChange={e => form.setData('max_attempts', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" placeholder="Unlimited" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={form.data.randomize_questions} onChange={e => form.setData('randomize_questions', e.target.checked)} className="rounded border-slate-300" />
                                    Randomize question order
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={form.data.show_score} onChange={e => form.setData('show_score', e.target.checked)} className="rounded border-slate-300" />
                                    Show score after completion
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={form.data.show_correct_answers} onChange={e => form.setData('show_correct_answers', e.target.checked)} className="rounded border-slate-300" />
                                    Show correct answers after completion
                                </label>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">Cancel</button>
                                <button type="submit" disabled={form.processing} className="px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50" style={{ backgroundColor: '#495B67' }}>Create Quiz</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteId(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Quiz?</h3>
                        <p className="text-sm text-slate-500 mb-4">This will permanently delete all questions, assignments, and attempt data.</p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">Cancel</button>
                            <button onClick={confirmDelete} className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
