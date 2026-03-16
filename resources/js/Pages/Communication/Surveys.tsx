import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';

interface QuestionData {
    id?: number;
    type: string;
    question: string;
    description: string;
    is_required: boolean;
    options: string[];
    settings: Record<string, any>;
}

interface SurveyData {
    id: number;
    title: string;
    description: string | null;
    type: string;
    status: string;
    is_anonymous: boolean;
    allow_multiple: boolean;
    published_at: string | null;
    closes_at: string | null;
    created_at: string;
    creator: { id: number; name: string; email: string } | null;
    questions_count: number;
    responses_count: number;
    questions?: QuestionData[];
}

interface Props {
    surveys: SurveyData[];
    filters: { status: string; type: string };
    stats: { total: number; active: number; draft: number; closed: number };
    teamCount: number;
}

const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    active: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-500',
    archived: 'bg-gray-100 text-gray-400',
};

const typeIcons: Record<string, string> = { survey: '📝', poll: '📊' };

const questionTypes = [
    { value: 'single_choice', label: 'Single Choice', icon: '○' },
    { value: 'multiple_choice', label: 'Multiple Choice', icon: '☐' },
    { value: 'text', label: 'Short Text', icon: 'Aa' },
    { value: 'textarea', label: 'Long Text', icon: '¶' },
    { value: 'rating', label: 'Rating (1-5)', icon: '★' },
    { value: 'yes_no', label: 'Yes / No', icon: '✓✗' },
    { value: 'nps', label: 'NPS (0-10)', icon: '📈' },
];

function emptyQuestion(): QuestionData {
    return { type: 'single_choice', question: '', description: '', is_required: true, options: ['', ''], settings: {} };
}

export default function Surveys({ surveys, filters, stats, teamCount }: Props) {
    const page = usePage();
    const flash = (page.props as any).flash ?? {};

    const [showModal, setShowModal] = useState(false);
    const [editingSurvey, setEditingSurvey] = useState<SurveyData | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<SurveyData | null>(null);
    const [questions, setQuestions] = useState<QuestionData[]>([emptyQuestion()]);

    const form = useForm({
        title: '',
        description: '',
        type: 'survey' as string,
        is_anonymous: false,
        allow_multiple: false,
        closes_at: '',
    });

    function openCreate() {
        form.reset();
        form.setData({ title: '', description: '', type: 'survey', is_anonymous: false, allow_multiple: false, closes_at: '' });
        setQuestions([emptyQuestion()]);
        setEditingSurvey(null);
        setShowModal(true);
    }

    function openEdit(survey: SurveyData) {
        setEditingSurvey(survey);
        form.setData({
            title: survey.title,
            description: survey.description || '',
            type: survey.type,
            is_anonymous: survey.is_anonymous,
            allow_multiple: survey.allow_multiple,
            closes_at: survey.closes_at ? survey.closes_at.split('T')[0] : '',
        });
        if (survey.questions && survey.questions.length > 0) {
            setQuestions(survey.questions.map(q => ({
                id: q.id,
                type: q.type,
                question: q.question,
                description: q.description || '',
                is_required: q.is_required,
                options: q.options || ['', ''],
                settings: q.settings || {},
            })));
        } else {
            setQuestions([emptyQuestion()]);
        }
        setShowModal(true);
    }

    function addQuestion() {
        setQuestions(prev => [...prev, emptyQuestion()]);
    }

    function removeQuestion(index: number) {
        if (questions.length <= 1) return;
        setQuestions(prev => prev.filter((_, i) => i !== index));
    }

    function updateQuestion(index: number, field: keyof QuestionData, value: any) {
        setQuestions(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q));
    }

    function addOption(qIndex: number) {
        setQuestions(prev => prev.map((q, i) => i === qIndex ? { ...q, options: [...q.options, ''] } : q));
    }

    function removeOption(qIndex: number, oIndex: number) {
        setQuestions(prev => prev.map((q, i) => {
            if (i !== qIndex || q.options.length <= 2) return q;
            return { ...q, options: q.options.filter((_, oi) => oi !== oIndex) };
        }));
    }

    function updateOption(qIndex: number, oIndex: number, value: string) {
        setQuestions(prev => prev.map((q, i) => {
            if (i !== qIndex) return q;
            const newOpts = [...q.options];
            newOpts[oIndex] = value;
            return { ...q, options: newOpts };
        }));
    }

    function moveQuestion(index: number, direction: 'up' | 'down') {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= questions.length) return;
        setQuestions(prev => {
            const arr = [...prev];
            [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
            return arr;
        });
    }

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        const payload = {
            ...form.data,
            closes_at: form.data.closes_at || null,
            questions: questions.map(q => ({
                ...q,
                options: ['single_choice', 'multiple_choice'].includes(q.type) ? q.options.filter(o => o.trim()) : null,
                description: q.description || null,
            })),
        };

        if (editingSurvey) {
            router.patch(`/admin/surveys/${editingSurvey.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => { setShowModal(false); setEditingSurvey(null); },
            });
        } else {
            router.post('/admin/surveys', payload, {
                preserveScroll: true,
                onSuccess: () => setShowModal(false),
            });
        }
    };

    function handleDelete() {
        if (!deleteConfirm) return;
        router.delete(`/admin/surveys/${deleteConfirm.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteConfirm(null),
        });
    }

    function handlePublish(survey: SurveyData) {
        router.post(`/admin/surveys/${survey.id}/publish`, {}, { preserveScroll: true });
    }

    function handleClose(survey: SurveyData) {
        router.post(`/admin/surveys/${survey.id}/close`, {}, { preserveScroll: true });
    }

    function viewResults(survey: SurveyData) {
        router.visit(`/admin/surveys/${survey.id}/results`);
    }

    function applyFilter(key: string, value: string) {
        router.get('/admin/surveys', { ...filters, [key]: value }, { preserveScroll: true, preserveState: true });
    }

    const needsOptions = (type: string) => ['single_choice', 'multiple_choice'].includes(type);

    return (
        <AdminLayout>
            <Head title="Surveys & Polls" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Surveys & Polls</h1>
                        <p className="text-sm text-gray-500 mt-1">Create surveys and polls to gather team feedback</p>
                    </div>
                    <button onClick={openCreate} className="px-4 py-2 bg-[#495B67] text-white text-sm font-medium rounded-lg hover:bg-[#3a4a55] transition-colors">
                        + New Survey
                    </button>
                </div>

                {/* Flash */}
                {flash.success && (
                    <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{flash.success}</div>
                )}
                {flash.error && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{flash.error}</div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Surveys', value: stats.total, icon: '📋' },
                        { label: 'Active', value: stats.active, icon: '✅' },
                        { label: 'Drafts', value: stats.draft, icon: '📝' },
                        { label: 'Closed', value: stats.closed, icon: '🔒' },
                    ].map(s => (
                        <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>{s.icon}</span> {s.label}
                            </div>
                            <div className="text-2xl font-bold text-gray-900 mt-1">{s.value}</div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Filter:</span>
                        <select
                            value={filters.status}
                            onChange={(e) => applyFilter('status', e.target.value)}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                        >
                            <option value="all">All Status</option>
                            <option value="draft">Draft</option>
                            <option value="active">Active</option>
                            <option value="closed">Closed</option>
                        </select>
                        <select
                            value={filters.type}
                            onChange={(e) => applyFilter('type', e.target.value)}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                        >
                            <option value="all">All Types</option>
                            <option value="survey">📝 Surveys</option>
                            <option value="poll">📊 Polls</option>
                        </select>
                    </div>
                </div>

                {/* Survey List */}
                {surveys.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <div className="text-4xl mb-3">📋</div>
                        <p className="text-gray-500 text-sm">No surveys found. Create your first survey to start collecting feedback.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {surveys.map(survey => (
                            <div key={survey.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-all">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-[#495B67]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-lg">{typeIcons[survey.type] ?? '📋'}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <h3 className="font-semibold text-gray-900">{survey.title}</h3>
                                            <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${statusColors[survey.status] || 'bg-gray-100 text-gray-600'}`}>
                                                {survey.status}
                                            </span>
                                            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-50 text-blue-600">
                                                {survey.type}
                                            </span>
                                            {survey.is_anonymous && (
                                                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-purple-50 text-purple-600">
                                                    Anonymous
                                                </span>
                                            )}
                                        </div>
                                        {survey.description && (
                                            <p className="text-sm text-gray-500 line-clamp-2">{survey.description}</p>
                                        )}
                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                            <span>By {survey.creator?.name ?? 'Unknown'}</span>
                                            <span>❓ {survey.questions_count} question{survey.questions_count !== 1 ? 's' : ''}</span>
                                            <span>📩 {survey.responses_count} response{survey.responses_count !== 1 ? 's' : ''}</span>
                                            {survey.responses_count > 0 && teamCount > 0 && (
                                                <span>📊 {Math.round((survey.responses_count / teamCount) * 100)}% completion</span>
                                            )}
                                            {survey.closes_at && (
                                                <span>⏰ Closes {new Date(survey.closes_at).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        {survey.status === 'draft' && (
                                            <button onClick={() => handlePublish(survey)} className="px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                                                Publish
                                            </button>
                                        )}
                                        {survey.status === 'active' && (
                                            <button onClick={() => handleClose(survey)} className="px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                                                Close
                                            </button>
                                        )}
                                        {survey.responses_count > 0 && (
                                            <button onClick={() => viewResults(survey)} className="px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                                                Results
                                            </button>
                                        )}
                                        <button onClick={() => openEdit(survey)} className="p-1.5 text-gray-400 hover:text-[#495B67] rounded" title="Edit">
                                            ✏️
                                        </button>
                                        <button onClick={() => setDeleteConfirm(survey)} className="p-1.5 text-gray-400 hover:text-red-500 rounded" title="Delete">
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Create / Edit Survey Modal ── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-8 px-4 z-50 overflow-y-auto" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full mb-12" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900">{editingSurvey ? 'Edit Survey' : 'New Survey'}</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Build your survey with different question types</p>
                        </div>
                        <form onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto">
                            <div className="px-6 py-4 space-y-4">
                                {/* Survey basics */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                        <input
                                            type="text"
                                            value={form.data.title}
                                            onChange={(e) => form.setData('title', e.target.value)}
                                            placeholder="Survey title..."
                                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                            required
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea
                                            value={form.data.description}
                                            onChange={(e) => form.setData('description', e.target.value)}
                                            placeholder="Brief description of this survey..."
                                            rows={2}
                                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                        <select
                                            value={form.data.type}
                                            onChange={(e) => form.setData('type', e.target.value)}
                                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                        >
                                            <option value="survey">📝 Survey</option>
                                            <option value="poll">📊 Poll</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Close Date</label>
                                        <input
                                            type="date"
                                            value={form.data.closes_at}
                                            onChange={(e) => form.setData('closes_at', e.target.value)}
                                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                        />
                                    </div>
                                </div>

                                {/* Options */}
                                <div className="flex flex-wrap gap-4">
                                    <label className="flex items-center gap-2 text-sm text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={form.data.is_anonymous}
                                            onChange={(e) => form.setData('is_anonymous', e.target.checked)}
                                            className="rounded border-gray-300 text-[#495B67] focus:ring-[#495B67]"
                                        />
                                        🔒 Anonymous responses
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={form.data.allow_multiple}
                                            onChange={(e) => form.setData('allow_multiple', e.target.checked)}
                                            className="rounded border-gray-300 text-[#495B67] focus:ring-[#495B67]"
                                        />
                                        🔄 Allow multiple submissions
                                    </label>
                                </div>

                                {/* Questions */}
                                <div className="border-t border-gray-200 pt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-semibold text-gray-900">Questions ({questions.length})</h3>
                                        <button type="button" onClick={addQuestion} className="text-xs text-[#495B67] hover:underline font-medium">
                                            + Add Question
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {questions.map((q, qIndex) => (
                                            <div key={qIndex} className="bg-gray-50 rounded-xl border border-gray-200 p-4 relative">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-xs font-semibold text-gray-500">Q{qIndex + 1}</span>
                                                    <div className="flex items-center gap-1">
                                                        <button type="button" onClick={() => moveQuestion(qIndex, 'up')} disabled={qIndex === 0} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">↑</button>
                                                        <button type="button" onClick={() => moveQuestion(qIndex, 'down')} disabled={qIndex === questions.length - 1} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">↓</button>
                                                        {questions.length > 1 && (
                                                            <button type="button" onClick={() => removeQuestion(qIndex)} className="p-1 text-red-400 hover:text-red-600">✕</button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                        <div className="sm:col-span-2">
                                                            <input
                                                                type="text"
                                                                value={q.question}
                                                                onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                                                                placeholder="Enter your question..."
                                                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <select
                                                                value={q.type}
                                                                onChange={(e) => {
                                                                    updateQuestion(qIndex, 'type', e.target.value);
                                                                    if (needsOptions(e.target.value) && q.options.length < 2) {
                                                                        updateQuestion(qIndex, 'options', ['', '']);
                                                                    }
                                                                }}
                                                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                                            >
                                                                {questionTypes.map(qt => (
                                                                    <option key={qt.value} value={qt.value}>{qt.icon} {qt.label}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <input
                                                        type="text"
                                                        value={q.description}
                                                        onChange={(e) => updateQuestion(qIndex, 'description', e.target.value)}
                                                        placeholder="Optional description or help text..."
                                                        className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                                    />

                                                    {/* Options for choice questions */}
                                                    {needsOptions(q.type) && (
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-medium text-gray-600">Options</label>
                                                            {q.options.map((opt, oIndex) => (
                                                                <div key={oIndex} className="flex items-center gap-2">
                                                                    <span className="text-xs text-gray-400 w-4">{q.type === 'single_choice' ? '○' : '☐'}</span>
                                                                    <input
                                                                        type="text"
                                                                        value={opt}
                                                                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                                                        placeholder={`Option ${oIndex + 1}`}
                                                                        className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                                                    />
                                                                    {q.options.length > 2 && (
                                                                        <button type="button" onClick={() => removeOption(qIndex, oIndex)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                            <button type="button" onClick={() => addOption(qIndex)} className="text-xs text-[#495B67] hover:underline">
                                                                + Add option
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Preview hints for non-choice types */}
                                                    {q.type === 'rating' && (
                                                        <div className="flex gap-1">
                                                            {[1, 2, 3, 4, 5].map(n => (
                                                                <span key={n} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-400">{n}★</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {q.type === 'yes_no' && (
                                                        <div className="flex gap-2">
                                                            <span className="px-4 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-400">Yes</span>
                                                            <span className="px-4 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-400">No</span>
                                                        </div>
                                                    )}
                                                    {q.type === 'nps' && (
                                                        <div className="flex gap-1">
                                                            {Array.from({ length: 11 }, (_, i) => (
                                                                <span key={i} className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-[10px] text-gray-400">{i}</span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <label className="flex items-center gap-2 text-xs text-gray-600">
                                                        <input
                                                            type="checkbox"
                                                            checked={q.is_required}
                                                            onChange={(e) => updateQuestion(qIndex, 'is_required', e.target.checked)}
                                                            className="rounded border-gray-300 text-[#495B67] focus:ring-[#495B67]"
                                                        />
                                                        Required
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button type="button" onClick={addQuestion} className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-[#495B67] hover:text-[#495B67] transition-colors">
                                        + Add Question
                                    </button>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={form.processing} className="px-4 py-2 bg-[#495B67] text-white text-sm font-medium rounded-lg hover:bg-[#3a4a55] disabled:opacity-50 transition-colors">
                                    {form.processing ? 'Saving...' : editingSurvey ? 'Save Changes' : 'Create Survey'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete Confirm ── */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Survey</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Are you sure you want to delete "<strong>{deleteConfirm.title}</strong>"?
                            {deleteConfirm.responses_count > 0 && ` This will also delete ${deleteConfirm.responses_count} response(s).`}
                            {' '}This cannot be undone.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
