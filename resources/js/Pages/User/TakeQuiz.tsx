import UserLayout from '@/Layouts/UserLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface Answer {
    id: number;
    answer: string;
}

interface Question {
    id: number;
    question: string;
    answers: Answer[];
}

interface Quiz {
    id: number;
    title: string;
    description: string | null;
    passing_score: number;
    max_attempts: number | null;
    show_score: boolean;
    show_correct_answers: boolean;
    questions: Question[];
}

interface Props {
    quiz: Quiz;
    hasPassed: boolean;
    attemptCount: number;
}

export default function TakeQuiz({ quiz, hasPassed, attemptCount }: Props) {
    const [currentQ, setCurrentQ] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
    const [submitting, setSubmitting] = useState(false);

    const questions = quiz.questions;
    const totalQuestions = questions.length;
    const answeredCount = Object.keys(selectedAnswers).length;

    const selectAnswer = (questionId: number, answerId: number) => {
        setSelectedAnswers(prev => ({ ...prev, [questionId]: answerId }));
    };

    const handleSubmit = () => {
        if (answeredCount < totalQuestions) {
            if (!confirm(`You have answered ${answeredCount} of ${totalQuestions} questions. Unanswered questions will be marked wrong. Submit anyway?`)) return;
        }
        setSubmitting(true);
        router.post(route('quizzes.submit', quiz.id), { answers: selectedAnswers } as any, {
            preserveScroll: true,
            onFinish: () => setSubmitting(false),
        });
    };

    const question = questions[currentQ];

    return (
        <UserLayout>
            <Head title={`${quiz.title} — Question ${currentQ + 1}`} />

            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold text-slate-900">{quiz.title}</h1>
                        <p className="text-xs text-slate-400">
                            {answeredCount} of {totalQuestions} answered
                            {attemptCount > 0 && <span> · Attempt #{attemptCount + 1}</span>}
                        </p>
                    </div>
                    <button onClick={() => router.get(route('user.quizzes'))} className="text-sm text-slate-400 hover:text-slate-600">Exit</button>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${((currentQ + 1) / totalQuestions) * 100}%`, backgroundColor: '#495B67' }} />
                </div>

                {/* Question */}
                {question && (
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-bold text-slate-400">Question {currentQ + 1} of {totalQuestions}</span>
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">{question.question}</h2>

                        <div className="space-y-2">
                            {question.answers.map(ans => (
                                <button
                                    key={ans.id}
                                    onClick={() => selectAnswer(question.id, ans.id)}
                                    className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                                        selectedAnswers[question.id] === ans.id
                                            ? 'border-[#495B67] bg-[#495B67]/5 text-[#495B67] font-medium'
                                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                                    }`}
                                >
                                    {ans.answer}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                        disabled={currentQ === 0}
                        className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                    >
                        ← Previous
                    </button>

                    {/* Question dots */}
                    <div className="hidden sm:flex gap-1 flex-wrap justify-center">
                        {questions.map((q, idx) => (
                            <button
                                key={q.id}
                                onClick={() => setCurrentQ(idx)}
                                className={`w-7 h-7 rounded-full text-xs font-medium transition-colors ${
                                    idx === currentQ
                                        ? 'text-white'
                                        : selectedAnswers[q.id] !== undefined
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-slate-100 text-slate-400'
                                }`}
                                style={idx === currentQ ? { backgroundColor: '#495B67' } : undefined}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>

                    {currentQ < totalQuestions - 1 ? (
                        <button
                            onClick={() => setCurrentQ(currentQ + 1)}
                            className="px-4 py-2 text-sm text-white rounded-lg"
                            style={{ backgroundColor: '#495B67' }}
                        >
                            Next →
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="px-6 py-2 text-sm text-white rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                            {submitting ? 'Submitting...' : 'Submit Quiz'}
                        </button>
                    )}
                </div>
            </div>
        </UserLayout>
    );
}
