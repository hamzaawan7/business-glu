import UserLayout from '@/Layouts/UserLayout';
import { Head, usePage, router } from '@inertiajs/react';

interface SurveyItem {
    id: number;
    title: string;
    description: string | null;
    type: string;
    status: string;
    is_anonymous: boolean;
    allow_multiple: boolean;
    questions_count: number;
    responses_count: number;
    has_responded: boolean;
    published_at: string | null;
    closes_at: string | null;
    creator: { id: number; name: string } | null;
}

interface Props {
    activeSurveys: SurveyItem[];
    completedSurveys: SurveyItem[];
}

function timeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function UserSurveys({ activeSurveys, completedSurveys }: Props) {
    const page = usePage();
    const flash = (page.props as any).flash ?? {};

    const pending = activeSurveys.filter(s => !s.has_responded);
    const responded = activeSurveys.filter(s => s.has_responded);

    function openSurvey(survey: SurveyItem) {
        router.visit(`/surveys/${survey.id}`);
    }

    return (
        <UserLayout>
            <Head title="Surveys & Polls" />

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Surveys & Polls</h1>
                    <p className="text-sm text-gray-500 mt-1">Share your feedback and see what the team thinks</p>
                </div>

                {/* Flash */}
                {flash.success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{flash.success}</div>
                )}
                {flash.error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{flash.error}</div>
                )}

                {/* No surveys at all */}
                {activeSurveys.length === 0 && completedSurveys.length === 0 && (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-3">📋</div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-1">No surveys yet</h3>
                        <p className="text-sm text-gray-500">When surveys are created, they'll appear here for you to respond.</p>
                    </div>
                )}

                {/* Pending (not yet responded) */}
                {pending.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#495B67] uppercase tracking-wider mb-3">
                            📋 Waiting for your response ({pending.length})
                        </div>
                        <div className="space-y-3">
                            {pending.map(survey => (
                                <button
                                    key={survey.id}
                                    onClick={() => openSurvey(survey)}
                                    className="w-full bg-white rounded-xl border border-l-4 border-l-[#495B67] border-t-gray-200 border-r-gray-200 border-b-gray-200 p-4 text-left hover:shadow-sm transition-all"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="text-2xl flex-shrink-0 mt-0.5">
                                            {survey.type === 'poll' ? '📊' : '📝'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-gray-900 text-sm">{survey.title}</h3>
                                                <span className="inline-block w-2 h-2 rounded-full bg-[#495B67] flex-shrink-0" />
                                            </div>
                                            {survey.description && (
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{survey.description}</p>
                                            )}
                                            <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                                                <span>{survey.type}</span>
                                                <span>{survey.questions_count} question{survey.questions_count !== 1 ? 's' : ''}</span>
                                                {survey.is_anonymous && <span>🔒 Anonymous</span>}
                                                {survey.published_at && <span>{timeAgo(survey.published_at)}</span>}
                                                {survey.closes_at && <span>⏰ Closes {new Date(survey.closes_at).toLocaleDateString()}</span>}
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <span className="px-3 py-1.5 bg-[#495B67] text-white text-xs font-medium rounded-lg">
                                                Take
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Already responded (active surveys) */}
                {responded.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                            ✅ Responded ({responded.length})
                        </div>
                        <div className="space-y-3">
                            {responded.map(survey => (
                                <div
                                    key={survey.id}
                                    className="w-full bg-white rounded-xl border border-gray-200 p-4 opacity-80"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                                            <span className="text-lg">✓</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 text-sm">{survey.title}</h3>
                                            <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                                                <span>{survey.type}</span>
                                                <span>{survey.responses_count} response{survey.responses_count !== 1 ? 's' : ''}</span>
                                                <span className="text-green-600">Completed</span>
                                            </div>
                                        </div>
                                        {survey.allow_multiple && (
                                            <button
                                                onClick={() => openSurvey(survey)}
                                                className="px-3 py-1.5 text-xs font-medium text-[#495B67] border border-[#495B67] rounded-lg hover:bg-[#495B67]/5 transition flex-shrink-0"
                                            >
                                                Submit Again
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Closed surveys user participated in */}
                {completedSurveys.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                            🔒 Closed ({completedSurveys.length})
                        </div>
                        <div className="space-y-3">
                            {completedSurveys.map(survey => (
                                <div key={survey.id} className="w-full bg-white rounded-xl border border-gray-200 p-4 opacity-60">
                                    <div className="flex items-start gap-3">
                                        <div className="text-2xl flex-shrink-0 mt-0.5">🔒</div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-gray-700 text-sm">{survey.title}</h3>
                                            <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                                                <span>{survey.type}</span>
                                                <span>{survey.responses_count} total responses</span>
                                                <span>Closed</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </UserLayout>
    );
}
