import AdminLayout from '@/Layouts/AdminLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { useState } from 'react';

interface Member {
    id: number;
    name: string;
    email: string;
}

interface FieldData {
    id: number;
    type: string;
    label: string;
    description: string | null;
    is_required: boolean;
    options: string[] | null;
    sort_order: number;
}

interface FormDataShape {
    id: number;
    title: string;
    description: string | null;
    type: string;
    status: string;
    fields: FieldData[];
    assignees: Member[];
    submissions_count: number;
    assignees_count: number;
}

interface SubmissionData {
    id: number;
    user: { id: number; name: string; email: string } | null;
    answers: Record<string, any>;
    status: string;
    reviewer_notes: string | null;
    reviewer: { id: number; name: string } | null;
    reviewed_at: string | null;
    created_at: string;
}

interface Props {
    form: FormDataShape;
    submissions: SubmissionData[];
}

const statusColors: Record<string, string> = {
    submitted: 'bg-blue-100 text-blue-700',
    reviewed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
};

export default function FormSubmissions({ form, submissions }: Props) {
    const page = usePage();
    const flash = (page.props as any).flash ?? {};
    const [viewSubmission, setViewSubmission] = useState<SubmissionData | null>(null);
    const [reviewNotes, setReviewNotes] = useState('');

    const handleReview = (submission: SubmissionData, status: 'reviewed' | 'rejected') => {
        router.patch(route('admin.forms.review-submission', submission.id), {
            status,
            reviewer_notes: reviewNotes,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setViewSubmission(null);
                setReviewNotes('');
            },
        });
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    };

    const getFieldLabel = (fieldId: string | number) => {
        const field = form.fields.find(f => String(f.id) === String(fieldId));
        return field?.label ?? `Field ${fieldId}`;
    };

    const renderAnswer = (fieldId: string | number, value: any) => {
        if (value === null || value === undefined || value === '') return <span className="text-gray-400 italic">No answer</span>;
        if (Array.isArray(value)) return value.join(', ');
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        return String(value);
    };

    return (
        <AdminLayout title={`Submissions — ${form.title}`}>
            <Head title={`Submissions — ${form.title}`} />

            <div className="space-y-6">
                {flash.success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{flash.success}</div>
                )}

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <a href={route('admin.forms.index')} className="text-sm text-brand-accent hover:text-brand-primary transition">
                                ← Forms
                            </a>
                        </div>
                        <h1 className="text-2xl font-bold font-heading text-brand-primary">{form.title}</h1>
                        <p className="text-sm text-brand-accent mt-1">
                            {submissions.length} submission{submissions.length !== 1 ? 's' : ''} · {form.assignees_count} assigned
                        </p>
                    </div>
                </div>

                {/* Submissions list */}
                <div className="space-y-3">
                    {submissions.length === 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                            <h3 className="text-base font-semibold font-heading text-brand-primary">No submissions yet</h3>
                            <p className="text-sm text-brand-accent mt-1">Submissions will appear here once team members fill out the form.</p>
                        </div>
                    )}

                    {submissions.map(submission => (
                        <div key={submission.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center">
                                        <span className="text-xs font-semibold text-brand-primary">
                                            {submission.user ? submission.user.name.charAt(0).toUpperCase() : '?'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-brand-primary">
                                            {submission.user?.name ?? 'Anonymous'}
                                        </p>
                                        <p className="text-xs text-brand-accent">{formatDate(submission.created_at)}</p>
                                    </div>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColors[submission.status]}`}>
                                        {submission.status}
                                    </span>
                                </div>
                                <button
                                    onClick={() => { setViewSubmission(submission); setReviewNotes(submission.reviewer_notes ?? ''); }}
                                    className="px-3 py-1.5 text-xs font-medium text-brand-primary bg-brand-primary/10 rounded-lg hover:bg-brand-primary/20 transition"
                                >
                                    View
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── View Submission Modal ────────────────────────── */}
            {viewSubmission && (
                <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-12 px-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mb-12">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-bold font-heading text-brand-primary">Submission Details</h2>
                                <p className="text-xs text-brand-accent mt-0.5">
                                    {viewSubmission.user?.name ?? 'Anonymous'} · {formatDate(viewSubmission.created_at)}
                                </p>
                            </div>
                            <button onClick={() => setViewSubmission(null)} className="text-brand-accent hover:text-brand-primary text-xl leading-none">&times;</button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            {/* Answers */}
                            {form.fields.map(field => (
                                <div key={field.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                    <p className="text-xs font-medium text-brand-accent uppercase tracking-wide">{field.label}</p>
                                    <p className="text-sm text-brand-primary mt-1">
                                        {renderAnswer(field.id, viewSubmission.answers[field.id])}
                                    </p>
                                </div>
                            ))}

                            {/* Review section */}
                            <hr className="border-gray-200" />
                            <div>
                                <label className="block text-sm font-medium text-brand-primary mb-1">Review Notes</label>
                                <textarea
                                    value={reviewNotes}
                                    onChange={e => setReviewNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Optional notes for the submitter..."
                                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary"
                                />
                            </div>

                            {viewSubmission.reviewer && (
                                <p className="text-xs text-brand-accent">
                                    Reviewed by {viewSubmission.reviewer.name} on {viewSubmission.reviewed_at ? formatDate(viewSubmission.reviewed_at) : ''}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                            <button onClick={() => setViewSubmission(null)} className="px-4 py-2 text-sm text-brand-accent hover:text-brand-primary transition">
                                Close
                            </button>
                            {viewSubmission.status === 'submitted' && (
                                <>
                                    <button
                                        onClick={() => handleReview(viewSubmission, 'rejected')}
                                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleReview(viewSubmission, 'reviewed')}
                                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
                                    >
                                        Approve
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
