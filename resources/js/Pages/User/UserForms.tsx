import UserLayout from '@/Layouts/UserLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { useState } from 'react';

interface FieldData {
    id: number;
    type: string;
    label: string;
    description: string | null;
    is_required: boolean;
    options: string[] | null;
    sort_order: number;
}

interface MySubmission {
    id: number;
    answers: Record<string, any>;
    status: string;
    created_at: string;
}

interface FormItem {
    id: number;
    title: string;
    description: string | null;
    type: string;
    is_required: boolean;
    allow_multiple: boolean;
    fields: FieldData[];
    my_submissions: MySubmission[];
    has_submitted: boolean;
}

interface Props {
    forms: FormItem[];
}

const statusColors: Record<string, string> = {
    submitted: 'bg-blue-100 text-blue-700',
    reviewed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
};

export default function UserForms({ forms }: Props) {
    const page = usePage();
    const flash = (page.props as any).flash ?? {};

    const [activeForm, setActiveForm] = useState<FormItem | null>(null);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [viewSubmission, setViewSubmission] = useState<{ form: FormItem; submission: MySubmission } | null>(null);

    const openForm = (form: FormItem) => {
        // Initialize answers
        const initial: Record<string, any> = {};
        form.fields.forEach(f => {
            if (f.type === 'checkbox' || f.type === 'multiselect') {
                initial[f.id] = [];
            } else if (f.type === 'yes_no') {
                initial[f.id] = '';
            } else {
                initial[f.id] = '';
            }
        });
        setAnswers(initial);
        setErrors({});
        setActiveForm(form);
    };

    const updateAnswer = (fieldId: number, value: any) => {
        setAnswers(prev => ({ ...prev, [fieldId]: value }));
        setErrors(prev => {
            const next = { ...prev };
            delete next[`answers.${fieldId}`];
            return next;
        });
    };

    const toggleMulti = (fieldId: number, option: string) => {
        setAnswers(prev => {
            const current = Array.isArray(prev[fieldId]) ? prev[fieldId] : [];
            return {
                ...prev,
                [fieldId]: current.includes(option)
                    ? current.filter((v: string) => v !== option)
                    : [...current, option],
            };
        });
    };

    const handleSubmit = () => {
        if (!activeForm) return;
        setSubmitting(true);

        router.post(route('forms.submit', activeForm.id), { answers }, {
            preserveScroll: true,
            onSuccess: () => {
                setActiveForm(null);
                setAnswers({});
                setSubmitting(false);
            },
            onError: (errs) => {
                setErrors(errs);
                setSubmitting(false);
            },
        });
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    };

    // Separate pending from completed
    const pendingForms = forms.filter(f => !f.has_submitted || f.allow_multiple);
    const completedForms = forms.filter(f => f.has_submitted);

    // ─── Field Renderer ─────────────────────────────────────

    const renderField = (field: FieldData) => {
        const value = answers[field.id];
        const error = errors[`answers.${field.id}`];

        return (
            <div key={field.id} className="space-y-1">
                <label className="block text-sm font-medium text-brand-primary">
                    {field.label}
                    {field.is_required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                {field.description && <p className="text-xs text-brand-accent">{field.description}</p>}

                {/* Text */}
                {field.type === 'text' && (
                    <input
                        type="text"
                        value={value ?? ''}
                        onChange={e => updateAnswer(field.id, e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary"
                    />
                )}

                {/* Textarea */}
                {field.type === 'textarea' && (
                    <textarea
                        value={value ?? ''}
                        onChange={e => updateAnswer(field.id, e.target.value)}
                        rows={3}
                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary"
                    />
                )}

                {/* Number */}
                {field.type === 'number' && (
                    <input
                        type="number"
                        value={value ?? ''}
                        onChange={e => updateAnswer(field.id, e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary"
                    />
                )}

                {/* Select / Dropdown */}
                {field.type === 'select' && (
                    <select
                        value={value ?? ''}
                        onChange={e => updateAnswer(field.id, e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary"
                    >
                        <option value="">Select…</option>
                        {(field.options ?? []).map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                        ))}
                    </select>
                )}

                {/* Multi-select / Checkbox group */}
                {(field.type === 'multiselect' || field.type === 'checkbox') && (
                    <div className="space-y-1">
                        {(field.options ?? []).map((opt, i) => (
                            <label key={i} className="flex items-center gap-2 text-sm text-brand-primary">
                                <input
                                    type="checkbox"
                                    checked={Array.isArray(value) && value.includes(opt)}
                                    onChange={() => toggleMulti(field.id, opt)}
                                    className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                                />
                                {opt}
                            </label>
                        ))}
                    </div>
                )}

                {/* Radio */}
                {field.type === 'radio' && (
                    <div className="space-y-1">
                        {(field.options ?? []).map((opt, i) => (
                            <label key={i} className="flex items-center gap-2 text-sm text-brand-primary">
                                <input
                                    type="radio"
                                    name={`field_${field.id}`}
                                    value={opt}
                                    checked={value === opt}
                                    onChange={e => updateAnswer(field.id, e.target.value)}
                                    className="border-gray-300 text-brand-primary focus:ring-brand-primary"
                                />
                                {opt}
                            </label>
                        ))}
                    </div>
                )}

                {/* Yes/No */}
                {field.type === 'yes_no' && (
                    <div className="flex gap-3">
                        {['Yes', 'No'].map(opt => (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => updateAnswer(field.id, opt)}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg border transition ${
                                    value === opt
                                        ? 'bg-brand-primary text-white border-brand-primary'
                                        : 'bg-white text-brand-primary border-gray-300 hover:border-brand-primary'
                                }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                )}

                {/* Date */}
                {field.type === 'date' && (
                    <input
                        type="date"
                        value={value ?? ''}
                        onChange={e => updateAnswer(field.id, e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary"
                    />
                )}

                {/* Time */}
                {field.type === 'time' && (
                    <input
                        type="time"
                        value={value ?? ''}
                        onChange={e => updateAnswer(field.id, e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary"
                    />
                )}

                {/* Signature (text placeholder) */}
                {field.type === 'signature' && (
                    <div>
                        <input
                            type="text"
                            value={value ?? ''}
                            onChange={e => updateAnswer(field.id, e.target.value)}
                            placeholder="Type your full name as signature"
                            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary italic"
                        />
                    </div>
                )}

                {/* Image / File (placeholder text input) */}
                {(field.type === 'image' || field.type === 'file') && (
                    <div className="text-xs text-brand-accent bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                        File upload coming soon
                    </div>
                )}

                {/* Location (text input placeholder) */}
                {field.type === 'location' && (
                    <input
                        type="text"
                        value={value ?? ''}
                        onChange={e => updateAnswer(field.id, e.target.value)}
                        placeholder="Enter location"
                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary"
                    />
                )}

                {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
        );
    };

    // ─── Main Return ────────────────────────────────────────

    return (
        <UserLayout title="Forms">
            <Head title="Forms" />

            <div className="space-y-4 max-w-lg mx-auto">
                {/* Flash messages */}
                {flash.success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{flash.success}</div>
                )}
                {flash.error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{flash.error}</div>
                )}

                {/* Empty state */}
                {forms.length === 0 && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        <h3 className="mt-3 text-base font-semibold font-heading text-brand-primary">No forms to fill</h3>
                        <p className="text-sm text-brand-accent mt-1">
                            When forms are assigned to you, they'll appear here.
                        </p>
                    </div>
                )}

                {/* Pending forms */}
                {pendingForms.length > 0 && (
                    <div>
                        <h2 className="text-sm font-semibold text-brand-primary mb-2 px-1">
                            To Complete ({pendingForms.filter(f => !f.has_submitted).length})
                        </h2>
                        {pendingForms.map(form => (
                            <div key={form.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                                            <span className="text-lg">{form.type === 'checklist' ? '✅' : '📋'}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-medium text-brand-primary">{form.title}</h3>
                                                {form.is_required && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-red-50 text-red-600">Required</span>
                                                )}
                                            </div>
                                            {form.description && (
                                                <p className="text-xs text-brand-accent mt-0.5 line-clamp-2">{form.description}</p>
                                            )}
                                            <p className="text-xs text-brand-accent mt-1">{form.fields.length} field{form.fields.length !== 1 ? 's' : ''}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => openForm(form)}
                                        className="px-3 py-1.5 bg-brand-primary text-white text-xs font-medium rounded-lg hover:opacity-90 transition flex-shrink-0"
                                    >
                                        {form.has_submitted && form.allow_multiple ? 'Submit Again' : 'Fill Out'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Completed forms */}
                {completedForms.length > 0 && (
                    <div>
                        <h2 className="text-sm font-semibold text-brand-primary mb-2 px-1">
                            Completed ({completedForms.length})
                        </h2>
                        {completedForms.map(form => (
                            <div key={`done-${form.id}`} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-3 opacity-80">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                                            <span className="text-lg">✓</span>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-brand-primary">{form.title}</h3>
                                            {form.my_submissions.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {form.my_submissions.map(sub => (
                                                        <button
                                                            key={sub.id}
                                                            onClick={() => setViewSubmission({ form, submission: sub })}
                                                            className="flex items-center gap-1 text-xs text-brand-accent hover:text-brand-primary"
                                                        >
                                                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusColors[sub.status]?.split(' ')[0] ?? 'bg-gray-300'}`} />
                                                            {formatDate(sub.created_at)}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {form.allow_multiple && (
                                        <button
                                            onClick={() => openForm(form)}
                                            className="px-3 py-1.5 text-xs font-medium text-brand-primary border border-brand-primary rounded-lg hover:bg-brand-primary/5 transition flex-shrink-0"
                                        >
                                            Submit Again
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Fill Form Modal ──────────────────────────────── */}
            {activeForm && (
                <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-8 px-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mb-12">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-bold font-heading text-brand-primary">{activeForm.title}</h2>
                                {activeForm.description && (
                                    <p className="text-xs text-brand-accent mt-0.5">{activeForm.description}</p>
                                )}
                            </div>
                            <button onClick={() => setActiveForm(null)} className="text-brand-accent hover:text-brand-primary text-xl leading-none">&times;</button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                            {activeForm.fields.map(field => renderField(field))}
                        </div>

                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                            <button onClick={() => setActiveForm(null)} className="px-4 py-2 text-sm text-brand-accent hover:text-brand-primary transition">
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50"
                            >
                                {submitting ? 'Submitting…' : 'Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── View Past Submission ─────────────────────────── */}
            {viewSubmission && (
                <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-8 px-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mb-12">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-bold font-heading text-brand-primary">{viewSubmission.form.title}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColors[viewSubmission.submission.status]}`}>
                                        {viewSubmission.submission.status}
                                    </span>
                                    <span className="text-xs text-brand-accent">{formatDate(viewSubmission.submission.created_at)}</span>
                                </div>
                            </div>
                            <button onClick={() => setViewSubmission(null)} className="text-brand-accent hover:text-brand-primary text-xl leading-none">&times;</button>
                        </div>

                        <div className="p-6 space-y-3 max-h-[65vh] overflow-y-auto">
                            {viewSubmission.form.fields.map(field => (
                                <div key={field.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                    <p className="text-xs font-medium text-brand-accent">{field.label}</p>
                                    <p className="text-sm text-brand-primary mt-0.5">
                                        {(() => {
                                            const val = viewSubmission.submission.answers[field.id];
                                            if (val === null || val === undefined || val === '') return <span className="text-gray-400 italic">No answer</span>;
                                            if (Array.isArray(val)) return val.join(', ');
                                            return String(val);
                                        })()}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100">
                            <button onClick={() => setViewSubmission(null)} className="px-4 py-2 text-sm text-brand-accent hover:text-brand-primary transition">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </UserLayout>
    );
}
