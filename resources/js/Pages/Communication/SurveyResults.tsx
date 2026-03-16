import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';

interface AnalyticsItem {
    question_id: number;
    question: string;
    type: string;
    total_answers: number;
    breakdown: any;
}

interface ResponseData {
    id: number;
    user: { id: number; name: string; email: string } | null;
    answers: { question_id: number; value: string }[];
    created_at: string;
}

interface SurveyData {
    id: number;
    title: string;
    description: string | null;
    type: string;
    status: string;
    is_anonymous: boolean;
    responses_count: number;
    questions: { id: number; question: string; type: string; options: string[] | null; sort_order: number }[];
    responses: ResponseData[];
    created_at: string;
}

interface Props {
    survey: SurveyData;
    analytics: AnalyticsItem[];
}

export default function SurveyResults({ survey, analytics }: Props) {
    const totalResponses = survey.responses?.length ?? 0;

    function renderBreakdown(item: AnalyticsItem) {
        if (['single_choice', 'multiple_choice', 'yes_no'].includes(item.type)) {
            const items = Array.isArray(item.breakdown) ? item.breakdown : [];
            const maxCount = Math.max(...items.map((b: any) => b.count), 1);
            return (
                <div className="space-y-2 mt-3">
                    {items.map((b: any, i: number) => (
                        <div key={i}>
                            <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-gray-700">{b.label}</span>
                                <span className="text-gray-500 text-xs">
                                    {b.count} ({item.total_answers > 0 ? Math.round((b.count / item.total_answers) * 100) : 0}%)
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                                <div
                                    className="bg-[#495B67] h-2.5 rounded-full transition-all"
                                    style={{ width: `${maxCount > 0 ? (b.count / maxCount) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (['rating', 'nps'].includes(item.type)) {
            const bd = item.breakdown as any;
            return (
                <div className="mt-3 grid grid-cols-4 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-[#495B67]">{bd.average}</div>
                        <div className="text-[10px] text-gray-500 uppercase">Average</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-gray-700">{bd.min}</div>
                        <div className="text-[10px] text-gray-500 uppercase">Min</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-gray-700">{bd.max}</div>
                        <div className="text-[10px] text-gray-500 uppercase">Max</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-gray-700">{bd.count}</div>
                        <div className="text-[10px] text-gray-500 uppercase">Responses</div>
                    </div>
                </div>
            );
        }

        // Text / textarea — show individual responses
        return (
            <div className="mt-3 text-xs text-gray-500">
                {item.total_answers} text response{item.total_answers !== 1 ? 's' : ''} collected
            </div>
        );
    }

    return (
        <AdminLayout>
            <Head title={`Results — ${survey.title}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <button onClick={() => router.visit('/admin/surveys')} className="text-sm text-[#495B67] hover:underline mb-1 inline-block">
                            ← Back to Surveys
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">{survey.title}</h1>
                        <p className="text-sm text-gray-500 mt-1">{survey.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                            survey.status === 'active' ? 'bg-green-100 text-green-700' :
                            survey.status === 'closed' ? 'bg-gray-100 text-gray-600' :
                            'bg-slate-100 text-slate-700'
                        }`}>
                            {survey.status}
                        </span>
                        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-600">
                            {survey.type}
                        </span>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Responses', value: totalResponses, icon: '📩' },
                        { label: 'Questions', value: survey.questions?.length ?? 0, icon: '❓' },
                        { label: 'Type', value: survey.type, icon: survey.type === 'poll' ? '📊' : '📝' },
                        { label: 'Anonymous', value: survey.is_anonymous ? 'Yes' : 'No', icon: '🔒' },
                    ].map(s => (
                        <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>{s.icon}</span> {s.label}
                            </div>
                            <div className="text-2xl font-bold text-gray-900 mt-1">{s.value}</div>
                        </div>
                    ))}
                </div>

                {/* Analytics per question */}
                {analytics.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <div className="text-4xl mb-3">📊</div>
                        <p className="text-gray-500 text-sm">No responses yet. Share this survey with your team to start collecting data.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {analytics.map((item, idx) => (
                            <div key={item.question_id} className="bg-white rounded-xl border border-gray-200 p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold text-gray-400">Q{idx + 1}</span>
                                            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-600">{item.type.replace('_', ' ')}</span>
                                        </div>
                                        <h3 className="font-medium text-gray-900">{item.question}</h3>
                                    </div>
                                    <span className="text-xs text-gray-400">{item.total_answers} answer{item.total_answers !== 1 ? 's' : ''}</span>
                                </div>
                                {renderBreakdown(item)}
                            </div>
                        ))}
                    </div>
                )}

                {/* Individual Responses */}
                {survey.responses && survey.responses.length > 0 && (
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">Individual Responses ({survey.responses.length})</h2>
                        <div className="space-y-3">
                            {survey.responses.map((resp, i) => (
                                <div key={resp.id} className="bg-white rounded-xl border border-gray-200 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-gray-900">
                                            {survey.is_anonymous ? `Anonymous #${i + 1}` : (resp.user?.name ?? 'Unknown')}
                                        </span>
                                        <span className="text-xs text-gray-400">{new Date(resp.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {survey.questions?.map(q => {
                                            const answer = resp.answers?.find((a: any) => a.question_id === q.id);
                                            return (
                                                <div key={q.id} className="flex items-start gap-2">
                                                    <span className="text-xs text-gray-400 w-6 flex-shrink-0 pt-0.5">Q{q.sort_order + 1}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-xs text-gray-500">{q.question}</span>
                                                        <p className="text-sm text-gray-900">{answer?.value || <span className="text-gray-400 italic">No answer</span>}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
