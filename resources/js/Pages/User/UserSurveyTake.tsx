import UserLayout from '@/Layouts/UserLayout';
import Icon from '@/Components/Icon';
import { Head, usePage, router } from '@inertiajs/react';
import { useState } from 'react';

interface QuestionData {
    id: number;
    type: string;
    question: string;
    description: string | null;
    is_required: boolean;
    options: string[] | null;
    sort_order: number;
}

interface ExistingAnswer {
    question_id: number;
    value: string;
}

interface ExistingResponse {
    id: number;
    answers: ExistingAnswer[];
}

interface SurveyData {
    id: number;
    title: string;
    description: string | null;
    type: string;
    status: string;
    is_anonymous: boolean;
    allow_multiple: boolean;
    closes_at: string | null;
    questions: QuestionData[];
}

interface Props {
    survey: SurveyData;
    existingResponse: ExistingResponse | null;
}

export default function UserSurveyTake({ survey, existingResponse }: Props) {
    const page = usePage();
    const flash = (page.props as any).flash ?? {};

    const [answers, setAnswers] = useState<Record<number, string>>(() => {
        if (existingResponse) {
            const initial: Record<number, string> = {};
            existingResponse.answers.forEach(a => { initial[a.question_id] = a.value; });
            return initial;
        }
        return {};
    });
    const [submitting, setSubmitting] = useState(false);

    const alreadyResponded = !!existingResponse && !survey.allow_multiple;
    const isClosed = survey.status !== 'active';

    function updateAnswer(questionId: number, value: string) {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    }

    function toggleMultiChoice(questionId: number, option: string) {
        setAnswers(prev => {
            const current = prev[questionId] ? JSON.parse(prev[questionId]) : [];
            const updated = current.includes(option)
                ? current.filter((v: string) => v !== option)
                : [...current, option];
            return { ...prev, [questionId]: JSON.stringify(updated) };
        });
    }

    function getMultiChoiceValues(questionId: number): string[] {
        try {
            return answers[questionId] ? JSON.parse(answers[questionId]) : [];
        } catch {
            return [];
        }
    }

    function handleSubmit() {
        setSubmitting(true);
        const payload = {
            answers: survey.questions.map(q => ({
                question_id: q.id,
                value: answers[q.id] || null,
            })),
        };

        router.post(`/surveys/${survey.id}/submit`, payload, {
            onSuccess: () => setSubmitting(false),
            onError: () => setSubmitting(false),
        });
    }

    function renderQuestion(q: QuestionData, index: number) {
        const value = answers[q.id] || '';
        const disabled = alreadyResponded || isClosed;

        return (
            <div key={q.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start gap-3">
                    <span className="text-xs font-bold text-gray-400 w-6 flex-shrink-0 pt-1">{index + 1}</span>
                    <div className="flex-1 space-y-3">
                        <div>
                            <h3 className="text-sm font-medium text-gray-900">
                                {q.question}
                                {q.is_required && <span className="text-red-500 ml-0.5">*</span>}
                            </h3>
                            {q.description && (
                                <p className="text-xs text-gray-500 mt-0.5">{q.description}</p>
                            )}
                        </div>

                        {/* Text input */}
                        {q.type === 'text' && (
                            <input
                                type="text"
                                value={value}
                                onChange={(e) => updateAnswer(q.id, e.target.value)}
                                disabled={disabled}
                                placeholder="Your answer..."
                                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#495B67] focus:border-[#495B67] disabled:bg-gray-50"
                            />
                        )}

                        {/* Textarea */}
                        {q.type === 'textarea' && (
                            <textarea
                                value={value}
                                onChange={(e) => updateAnswer(q.id, e.target.value)}
                                disabled={disabled}
                                rows={3}
                                placeholder="Your answer..."
                                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#495B67] focus:border-[#495B67] disabled:bg-gray-50"
                            />
                        )}

                        {/* Single choice */}
                        {q.type === 'single_choice' && (
                            <div className="space-y-2">
                                {(q.options ?? []).map((opt, i) => (
                                    <label key={i} className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`q_${q.id}`}
                                            value={opt}
                                            checked={value === opt}
                                            onChange={() => updateAnswer(q.id, opt)}
                                            disabled={disabled}
                                            className="border-gray-300 text-[#495B67] focus:ring-[#495B67]"
                                        />
                                        {opt}
                                    </label>
                                ))}
                            </div>
                        )}

                        {/* Multiple choice */}
                        {q.type === 'multiple_choice' && (
                            <div className="space-y-2">
                                {(q.options ?? []).map((opt, i) => (
                                    <label key={i} className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={getMultiChoiceValues(q.id).includes(opt)}
                                            onChange={() => toggleMultiChoice(q.id, opt)}
                                            disabled={disabled}
                                            className="rounded border-gray-300 text-[#495B67] focus:ring-[#495B67]"
                                        />
                                        {opt}
                                    </label>
                                ))}
                            </div>
                        )}

                        {/* Rating */}
                        {q.type === 'rating' && (
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map(n => (
                                    <button
                                        key={n}
                                        type="button"
                                        onClick={() => !disabled && updateAnswer(q.id, String(n))}
                                        disabled={disabled}
                                        className={`w-12 h-12 rounded-xl border-2 text-sm font-medium transition-all ${
                                            value === String(n)
                                                ? 'bg-[#495B67] text-white border-[#495B67]'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-[#495B67]'
                                        } disabled:opacity-50`}
                                    >
                                        {n}<Icon name="star" className="w-3.5 h-3.5 inline-block" /> 
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Yes / No */}
                        {q.type === 'yes_no' && (
                            <div className="flex gap-3">
                                {['Yes', 'No'].map(opt => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => !disabled && updateAnswer(q.id, opt)}
                                        disabled={disabled}
                                        className={`flex-1 py-2.5 text-sm font-medium rounded-xl border-2 transition-all ${
                                            value === opt
                                                ? 'bg-[#495B67] text-white border-[#495B67]'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-[#495B67]'
                                        } disabled:opacity-50`}
                                    >
                                        {opt === 'Yes' ? 'hand-thumb-up' : 'hand-thumb-down'} {opt}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* NPS (0-10) */}
                        {q.type === 'nps' && (
                            <div>
                                <div className="flex gap-1.5 flex-wrap">
                                    {Array.from({ length: 11 }, (_, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => !disabled && updateAnswer(q.id, String(i))}
                                            disabled={disabled}
                                            className={`w-10 h-10 rounded-lg border-2 text-sm font-medium transition-all ${
                                                value === String(i)
                                                    ? 'bg-[#495B67] text-white border-[#495B67]'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#495B67]'
                                            } disabled:opacity-50`}
                                        >
                                            {i}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                                    <span>Not likely</span>
                                    <span>Very likely</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <UserLayout>
            <Head title={survey.title} />

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
                {/* Back link */}
                <button onClick={() => router.visit('/app/surveys')} className="text-sm text-[#495B67] hover:underline">
                    ← Back to Surveys
                </button>

                {/* Survey header */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{survey.type === 'poll' ? 'chart-bar' : 'pencil'}</span>
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-50 text-blue-600">{survey.type}</span>
                        {survey.is_anonymous && (
                            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-purple-50 text-purple-600">Anonymous</span>
                        )}
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">{survey.title}</h1>
                    {survey.description && (
                        <p className="text-sm text-gray-500 mt-1">{survey.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                        {survey.questions.length} question{survey.questions.length !== 1 ? 's' : ''}
                        {survey.closes_at && ` · Closes ${new Date(survey.closes_at).toLocaleDateString()}`}
                    </p>
                </div>

                {/* Flash */}
                {flash.success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{flash.success}</div>
                )}
                {flash.error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{flash.error}</div>
                )}

                {/* Already responded banner */}
                {alreadyResponded && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                        <Icon name="check-circle" className="w-4 h-4 inline-block" /> You've already submitted your response to this survey. Thank you!
                    </div>
                )}

                {/* Closed banner */}
                {isClosed && (
                    <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-lg text-sm">
                        <Icon name="lock-closed" className="w-4 h-4 inline-block" /> This survey is closed and no longer accepting responses.
                    </div>
                )}

                {/* Questions */}
                <div className="space-y-3">
                    {survey.questions.map((q, i) => renderQuestion(q, i))}
                </div>

                {/* Submit button */}
                {!alreadyResponded && !isClosed && (
                    <div className="pt-2 pb-8">
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full py-3 bg-[#495B67] text-white text-sm font-medium rounded-xl hover:bg-[#3a4a55] disabled:opacity-50 transition-colors"
                        >
                            {submitting ? 'Submitting...' : 'Submit Response'}
                        </button>
                    </div>
                )}
            </div>
        </UserLayout>
    );
}
