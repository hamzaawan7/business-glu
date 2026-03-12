import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';

// ─── Types ──────────────────────────────────────────────────

interface Member {
    id: number;
    name: string;
    email: string;
    role?: string;
}

interface FieldData {
    id?: number;
    type: string;
    label: string;
    description: string | null;
    is_required: boolean;
    options: string[] | null;
    settings: Record<string, any> | null;
    sort_order: number;
    section: string | null;
}

interface FormData {
    id: number;
    title: string;
    description: string | null;
    type: string;
    status: string;
    is_required: boolean;
    allow_multiple: boolean;
    is_anonymous: boolean;
    published_at: string | null;
    creator: { id: number; name: string } | null;
    fields: FieldData[];
    assignees: Member[];
    submissions_count: number;
    assignees_count: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    forms: FormData[];
    members: Member[];
    filters: { status: string; type: string };
    stats: { total: number; active: number; draft: number; archived: number };
}

const fieldTypes: { value: string; label: string; icon: string }[] = [
    { value: 'text', label: 'Short Text', icon: '📝' },
    { value: 'textarea', label: 'Long Text', icon: '📄' },
    { value: 'number', label: 'Number', icon: '#️⃣' },
    { value: 'select', label: 'Dropdown', icon: '📋' },
    { value: 'multiselect', label: 'Multi-Select', icon: '☑️' },
    { value: 'checkbox', label: 'Checkbox', icon: '✅' },
    { value: 'radio', label: 'Radio', icon: '🔘' },
    { value: 'yes_no', label: 'Yes / No', icon: '👍' },
    { value: 'date', label: 'Date', icon: '📅' },
    { value: 'time', label: 'Time', icon: '🕐' },
    { value: 'signature', label: 'Signature', icon: '✍️' },
    { value: 'image', label: 'Image Upload', icon: '📸' },
    { value: 'file', label: 'File Upload', icon: '📎' },
    { value: 'location', label: 'Location', icon: '📍' },
];

const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    active: 'bg-green-100 text-green-700',
    archived: 'bg-gray-100 text-gray-500',
};

const typeLabels: Record<string, string> = {
    form: 'Form',
    checklist: 'Checklist',
};

// ─── Field Builder Helper Types ─────────────────────────────

interface FieldBuilderEntry {
    tempId: string;
    id?: number;
    type: string;
    label: string;
    description: string;
    is_required: boolean;
    options: string[];
    section: string;
}

function createEmptyField(): FieldBuilderEntry {
    return {
        tempId: crypto.randomUUID(),
        type: 'text',
        label: '',
        description: '',
        is_required: false,
        options: [],
        section: '',
    };
}

function fieldNeedsOptions(type: string) {
    return ['select', 'multiselect', 'radio', 'checkbox'].includes(type);
}

// ─── Component ──────────────────────────────────────────────

export default function Forms({ forms, members, filters, stats }: Props) {
    const page = usePage();
    const flash = (page.props as any).flash ?? {};

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingForm, setEditingForm] = useState<FormData | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<FormData | null>(null);
    const [assignModal, setAssignModal] = useState<FormData | null>(null);
    const [viewForm, setViewForm] = useState<FormData | null>(null);

    // Field builder state (shared for create & edit)
    const [builderFields, setBuilderFields] = useState<FieldBuilderEntry[]>([createEmptyField()]);

    // Assign modal state
    const [assignUserIds, setAssignUserIds] = useState<number[]>([]);

    // ─── Inertia forms ──────────────────────────────────────

    const createForm = useForm({
        title: '',
        description: '',
        type: 'form' as string,
        is_required: false,
        allow_multiple: false,
        is_anonymous: false,
        fields: [] as any[],
    });

    const editForm = useForm({
        title: '',
        description: '',
        type: 'form' as string,
        is_required: false,
        allow_multiple: false,
        is_anonymous: false,
        fields: [] as any[],
    });

    // ─── Handlers ───────────────────────────────────────────

    const openCreate = () => {
        createForm.reset();
        setBuilderFields([createEmptyField()]);
        setShowCreateModal(true);
    };

    const openEdit = (form: FormData) => {
        editForm.setData({
            title: form.title,
            description: form.description ?? '',
            type: form.type,
            is_required: form.is_required,
            allow_multiple: form.allow_multiple,
            is_anonymous: form.is_anonymous,
            fields: [],
        });
        setBuilderFields(
            form.fields.map(f => ({
                tempId: crypto.randomUUID(),
                id: f.id,
                type: f.type,
                label: f.label,
                description: f.description ?? '',
                is_required: f.is_required,
                options: f.options ?? [],
                section: f.section ?? '',
            }))
        );
        setEditingForm(form);
    };

    const openAssign = (form: FormData) => {
        setAssignUserIds(form.assignees.map(a => a.id));
        setAssignModal(form);
    };

    const buildFieldsPayload = () =>
        builderFields
            .filter(f => f.label.trim() !== '')
            .map(f => ({
                id: f.id ?? undefined,
                type: f.type,
                label: f.label,
                description: f.description || null,
                is_required: f.is_required,
                options: fieldNeedsOptions(f.type) ? f.options.filter(o => o.trim() !== '') : null,
                section: f.section || null,
            }));

    const handleCreate: FormEventHandler = (e) => {
        e.preventDefault();
        const fields = buildFieldsPayload();
        if (fields.length === 0) return;

        createForm.transform(data => ({ ...data, fields }));
        createForm.post(route('admin.forms.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowCreateModal(false);
                createForm.reset();
                setBuilderFields([createEmptyField()]);
            },
        });
    };

    const handleEdit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editingForm) return;
        const fields = buildFieldsPayload();
        if (fields.length === 0) return;

        editForm.transform(data => ({ ...data, fields }));
        editForm.patch(route('admin.forms.update', editingForm.id), {
            preserveScroll: true,
            onSuccess: () => {
                setEditingForm(null);
                setBuilderFields([createEmptyField()]);
            },
        });
    };

    const handleDelete = () => {
        if (!deleteConfirm) return;
        router.delete(route('admin.forms.destroy', deleteConfirm.id), {
            preserveScroll: true,
            onSuccess: () => setDeleteConfirm(null),
        });
    };

    const handlePublish = (form: FormData) => {
        router.post(route('admin.forms.publish', form.id), {}, { preserveScroll: true });
    };

    const handleArchive = (form: FormData) => {
        router.post(route('admin.forms.archive', form.id), {}, { preserveScroll: true });
    };

    const handleAssign: FormEventHandler = (e) => {
        e.preventDefault();
        if (!assignModal) return;
        router.post(route('admin.forms.assign', assignModal.id), { user_ids: assignUserIds }, {
            preserveScroll: true,
            onSuccess: () => setAssignModal(null),
        });
    };

    const applyFilter = (key: string, value: string) => {
        router.get(route('admin.forms.index'), { ...filters, [key]: value }, { preserveScroll: true, preserveState: true });
    };

    // ─── Field builder helpers ──────────────────────────────

    const addField = () => setBuilderFields(prev => [...prev, createEmptyField()]);

    const removeField = (tempId: string) => {
        setBuilderFields(prev => prev.filter(f => f.tempId !== tempId));
    };

    const updateField = (tempId: string, key: keyof FieldBuilderEntry, value: any) => {
        setBuilderFields(prev => prev.map(f => f.tempId === tempId ? { ...f, [key]: value } : f));
    };

    const moveField = (index: number, direction: 'up' | 'down') => {
        setBuilderFields(prev => {
            const next = [...prev];
            const target = direction === 'up' ? index - 1 : index + 1;
            if (target < 0 || target >= next.length) return prev;
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
    };

    const addOption = (tempId: string) => {
        setBuilderFields(prev => prev.map(f =>
            f.tempId === tempId ? { ...f, options: [...f.options, ''] } : f
        ));
    };

    const updateOption = (tempId: string, idx: number, value: string) => {
        setBuilderFields(prev => prev.map(f => {
            if (f.tempId !== tempId) return f;
            const opts = [...f.options];
            opts[idx] = value;
            return { ...f, options: opts };
        }));
    };

    const removeOption = (tempId: string, idx: number) => {
        setBuilderFields(prev => prev.map(f => {
            if (f.tempId !== tempId) return f;
            return { ...f, options: f.options.filter((_, i) => i !== idx) };
        }));
    };

    // ─── Render Helpers ─────────────────────────────────────

    const renderFieldBuilder = () => (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-brand-primary">Fields</h4>
                <button type="button" onClick={addField} className="text-xs font-medium text-brand-primary hover:underline">
                    + Add Field
                </button>
            </div>

            {builderFields.map((field, idx) => (
                <div key={field.tempId} className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-brand-accent font-medium w-6">{idx + 1}.</span>
                        <select
                            value={field.type}
                            onChange={e => updateField(field.tempId, 'type', e.target.value)}
                            className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-brand-primary focus:border-brand-primary"
                        >
                            {fieldTypes.map(ft => (
                                <option key={ft.value} value={ft.value}>{ft.icon} {ft.label}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="Field label"
                            value={field.label}
                            onChange={e => updateField(field.tempId, 'label', e.target.value)}
                            className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-brand-primary focus:border-brand-primary"
                        />
                        <label className="flex items-center gap-1 text-xs text-brand-accent whitespace-nowrap">
                            <input
                                type="checkbox"
                                checked={field.is_required}
                                onChange={e => updateField(field.tempId, 'is_required', e.target.checked)}
                                className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                            />
                            Req.
                        </label>
                        <div className="flex items-center gap-0.5">
                            <button type="button" onClick={() => moveField(idx, 'up')} disabled={idx === 0} className="text-xs text-brand-accent hover:text-brand-primary disabled:opacity-30 p-0.5">↑</button>
                            <button type="button" onClick={() => moveField(idx, 'down')} disabled={idx === builderFields.length - 1} className="text-xs text-brand-accent hover:text-brand-primary disabled:opacity-30 p-0.5">↓</button>
                        </div>
                        {builderFields.length > 1 && (
                            <button type="button" onClick={() => removeField(field.tempId)} className="text-xs text-red-500 hover:text-red-700 font-medium">✕</button>
                        )}
                    </div>

                    <input
                        type="text"
                        placeholder="Description (optional)"
                        value={field.description}
                        onChange={e => updateField(field.tempId, 'description', e.target.value)}
                        className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-brand-primary focus:border-brand-primary"
                    />

                    {fieldNeedsOptions(field.type) && (
                        <div className="pl-6 space-y-1">
                            <p className="text-[10px] text-brand-accent uppercase tracking-wide">Options</p>
                            {field.options.map((opt, oi) => (
                                <div key={oi} className="flex items-center gap-1">
                                    <input
                                        type="text"
                                        placeholder={`Option ${oi + 1}`}
                                        value={opt}
                                        onChange={e => updateOption(field.tempId, oi, e.target.value)}
                                        className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:ring-brand-primary focus:border-brand-primary"
                                    />
                                    <button type="button" onClick={() => removeOption(field.tempId, oi)} className="text-xs text-red-400 hover:text-red-600">✕</button>
                                </div>
                            ))}
                            <button type="button" onClick={() => addOption(field.tempId)} className="text-xs text-brand-primary hover:underline">+ Add option</button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );

    const renderFormModal = (
        isCreate: boolean,
        form: ReturnType<typeof useForm>,
        onSubmit: FormEventHandler,
        onClose: () => void,
    ) => (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-12 px-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mb-12">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold font-heading text-brand-primary">
                        {isCreate ? 'Create Form' : 'Edit Form'}
                    </h2>
                    <button onClick={onClose} className="text-brand-accent hover:text-brand-primary text-xl leading-none">&times;</button>
                </div>

                <form onSubmit={onSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-brand-primary mb-1">Title *</label>
                        <input
                            type="text"
                            value={form.data.title}
                            onChange={e => form.setData('title', e.target.value)}
                            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-brand-primary mb-1">Description</label>
                        <textarea
                            value={form.data.description}
                            onChange={e => form.setData('description', e.target.value)}
                            rows={2}
                            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary"
                        />
                    </div>

                    {/* Type + Options */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-brand-primary mb-1">Type</label>
                            <select
                                value={form.data.type}
                                onChange={e => form.setData('type', e.target.value)}
                                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary"
                            >
                                <option value="form">Form</option>
                                <option value="checklist">Checklist</option>
                            </select>
                        </div>
                        <div className="space-y-2 pt-6">
                            <label className="flex items-center gap-2 text-sm text-brand-primary">
                                <input type="checkbox" checked={form.data.is_required} onChange={e => form.setData('is_required', e.target.checked)} className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary" />
                                Required
                            </label>
                            <label className="flex items-center gap-2 text-sm text-brand-primary">
                                <input type="checkbox" checked={form.data.allow_multiple} onChange={e => form.setData('allow_multiple', e.target.checked)} className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary" />
                                Allow multiple submissions
                            </label>
                            <label className="flex items-center gap-2 text-sm text-brand-primary">
                                <input type="checkbox" checked={form.data.is_anonymous} onChange={e => form.setData('is_anonymous', e.target.checked)} className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary" />
                                Anonymous
                            </label>
                        </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* Field Builder */}
                    {renderFieldBuilder()}

                    {/* Errors */}
                    {Object.keys(form.errors).length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            {Object.values(form.errors).map((err, i) => (
                                <p key={i} className="text-xs text-red-600">{err as string}</p>
                            ))}
                        </div>
                    )}
                </form>

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-brand-accent hover:text-brand-primary transition">
                        Cancel
                    </button>
                    <button
                        onClick={onSubmit as any}
                        disabled={form.processing}
                        className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50"
                    >
                        {form.processing ? 'Saving…' : isCreate ? 'Create Form' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );

    // ─── Main Return ────────────────────────────────────────

    return (
        <AdminLayout title="Forms & Checklists">
            <Head title="Forms & Checklists" />

            <div className="space-y-6">
                {/* Flash messages */}
                {flash.success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{flash.success}</div>
                )}
                {flash.error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{flash.error}</div>
                )}

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold font-heading text-brand-primary">Forms & Checklists</h1>
                        <p className="text-sm text-brand-accent mt-1">Build, assign, and track custom forms</p>
                    </div>
                    <button onClick={openCreate} className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition">
                        + New Form
                    </button>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total', value: stats.total, color: 'text-brand-primary', bg: 'bg-slate-50' },
                        { label: 'Active', value: stats.active, color: 'text-green-600', bg: 'bg-green-50' },
                        { label: 'Draft', value: stats.draft, color: 'text-slate-600', bg: 'bg-slate-50' },
                        { label: 'Archived', value: stats.archived, color: 'text-gray-500', bg: 'bg-gray-50' },
                    ].map(stat => (
                        <div key={stat.label} className={`rounded-xl border border-gray-200 p-4 shadow-sm ${stat.bg}`}>
                            <p className="text-xs text-brand-accent uppercase tracking-wide">{stat.label}</p>
                            <p className={`text-2xl font-bold font-heading mt-1 ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
                    <span className="text-xs font-medium text-brand-accent uppercase tracking-wide">Filter:</span>
                    <select
                        value={filters.status}
                        onChange={e => applyFilter('status', e.target.value)}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-brand-primary focus:border-brand-primary"
                    >
                        <option value="all">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                    </select>
                    <select
                        value={filters.type}
                        onChange={e => applyFilter('type', e.target.value)}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-brand-primary focus:border-brand-primary"
                    >
                        <option value="all">All Types</option>
                        <option value="form">Forms</option>
                        <option value="checklist">Checklists</option>
                    </select>
                </div>

                {/* Forms list */}
                <div className="space-y-3">
                    {forms.length === 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                            <svg className="mx-auto h-12 w-12 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            <h3 className="mt-3 text-base font-semibold font-heading text-brand-primary">No forms yet</h3>
                            <p className="text-sm text-brand-accent mt-1">Create your first form to get started.</p>
                        </div>
                    )}

                    {forms.map(form => (
                        <div key={form.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-4">
                                <div className="flex items-start gap-3">
                                    {/* Icon */}
                                    <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-lg">{form.type === 'checklist' ? '✅' : '📋'}</span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <button onClick={() => setViewForm(form)} className="text-sm font-medium text-brand-primary hover:underline text-left">
                                                {form.title}
                                            </button>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColors[form.status]}`}>
                                                {form.status}
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-600">
                                                {typeLabels[form.type]}
                                            </span>
                                            {form.is_required && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-red-50 text-red-600">Required</span>
                                            )}
                                        </div>

                                        {form.description && (
                                            <p className="text-xs text-brand-accent mt-1 line-clamp-2">{form.description}</p>
                                        )}

                                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                                            <span className="text-xs text-brand-accent">
                                                {form.fields.length} field{form.fields.length !== 1 ? 's' : ''}
                                            </span>
                                            <span className="text-xs text-brand-accent">
                                                {form.assignees_count} assigned
                                            </span>
                                            <span className="text-xs text-brand-accent">
                                                {form.submissions_count} submission{form.submissions_count !== 1 ? 's' : ''}
                                            </span>
                                            {form.creator && (
                                                <span className="text-xs text-brand-accent">by {form.creator.name}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        {form.status === 'draft' && (
                                            <button onClick={() => handlePublish(form)} className="px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition">
                                                Publish
                                            </button>
                                        )}
                                        {form.status === 'active' && (
                                            <button onClick={() => handleArchive(form)} className="px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                                                Archive
                                            </button>
                                        )}
                                        <button onClick={() => openAssign(form)} className="px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
                                            Assign
                                        </button>
                                        <button onClick={() => openEdit(form)} className="px-2.5 py-1.5 text-xs font-medium text-brand-accent hover:text-brand-primary transition">
                                            Edit
                                        </button>
                                        <button onClick={() => setDeleteConfirm(form)} className="px-2.5 py-1.5 text-xs font-medium text-red-500 hover:text-red-700 transition">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Create Modal ─────────────────────────────────── */}
            {showCreateModal && renderFormModal(
                true,
                createForm,
                handleCreate,
                () => { setShowCreateModal(false); createForm.reset(); setBuilderFields([createEmptyField()]); },
            )}

            {/* ── Edit Modal ──────────────────────────────────── */}
            {editingForm && renderFormModal(
                false,
                editForm,
                handleEdit,
                () => { setEditingForm(null); setBuilderFields([createEmptyField()]); },
            )}

            {/* ── Delete Confirm ──────────────────────────────── */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                        <h3 className="text-lg font-bold font-heading text-brand-primary">Delete Form</h3>
                        <p className="text-sm text-brand-accent mt-2">
                            Are you sure you want to delete <strong>"{deleteConfirm.title}"</strong>? This will also remove all submissions. This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-brand-accent hover:text-brand-primary transition">Cancel</button>
                            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Assign Modal ────────────────────────────────── */}
            {assignModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold font-heading text-brand-primary">
                                Assign "{assignModal.title}"
                            </h2>
                            <button onClick={() => setAssignModal(null)} className="text-brand-accent hover:text-brand-primary text-xl leading-none">&times;</button>
                        </div>
                        <form onSubmit={handleAssign} className="p-6 space-y-3 max-h-80 overflow-y-auto">
                            {members.map(m => (
                                <label key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={assignUserIds.includes(m.id)}
                                        onChange={() => setAssignUserIds(prev =>
                                            prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id]
                                        )}
                                        className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-brand-primary">{m.name}</p>
                                        <p className="text-xs text-brand-accent">{m.email}</p>
                                    </div>
                                </label>
                            ))}
                        </form>
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                            <p className="text-xs text-brand-accent">{assignUserIds.length} selected</p>
                            <div className="flex gap-3">
                                <button onClick={() => setAssignModal(null)} className="px-4 py-2 text-sm text-brand-accent hover:text-brand-primary transition">Cancel</button>
                                <button onClick={handleAssign as any} className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition">
                                    Save Assignments
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── View Form Detail ────────────────────────────── */}
            {viewForm && (
                <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-12 px-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mb-12">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-bold font-heading text-brand-primary">{viewForm.title}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColors[viewForm.status]}`}>{viewForm.status}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-600">{typeLabels[viewForm.type]}</span>
                                </div>
                            </div>
                            <button onClick={() => setViewForm(null)} className="text-brand-accent hover:text-brand-primary text-xl leading-none">&times;</button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            {viewForm.description && <p className="text-sm text-brand-accent">{viewForm.description}</p>}

                            {/* Settings */}
                            <div className="flex flex-wrap gap-2 text-xs">
                                {viewForm.is_required && <span className="bg-red-50 text-red-600 px-2 py-1 rounded">Required</span>}
                                {viewForm.allow_multiple && <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded">Multiple submissions</span>}
                                {viewForm.is_anonymous && <span className="bg-purple-50 text-purple-600 px-2 py-1 rounded">Anonymous</span>}
                            </div>

                            {/* Fields preview */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-brand-primary">Fields ({viewForm.fields.length})</h4>
                                {viewForm.fields.map((f, i) => (
                                    <div key={f.id ?? i} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-start gap-3">
                                        <span className="text-xs font-medium text-brand-accent w-6 pt-0.5">{i + 1}.</span>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-brand-primary">{f.label}</span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 font-medium">
                                                    {fieldTypes.find(ft => ft.value === f.type)?.label ?? f.type}
                                                </span>
                                                {f.is_required && <span className="text-[10px] text-red-500 font-medium">Required</span>}
                                            </div>
                                            {f.description && <p className="text-xs text-brand-accent mt-0.5">{f.description}</p>}
                                            {f.options && f.options.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {f.options.map((opt, oi) => (
                                                        <span key={oi} className="text-[10px] bg-white border border-gray-200 rounded px-1.5 py-0.5">{opt}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Assignees */}
                            {viewForm.assignees.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-brand-primary mb-2">Assigned To ({viewForm.assignees.length})</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {viewForm.assignees.map(a => (
                                            <span key={a.id} className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-1 rounded-full">{a.name}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Stats */}
                            <div className="flex items-center gap-6 text-sm">
                                <span className="text-brand-accent">{viewForm.submissions_count} submission{viewForm.submissions_count !== 1 ? 's' : ''}</span>
                                <span className="text-brand-accent">{viewForm.assignees_count} assigned</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                            {viewForm.submissions_count > 0 && (
                                <a
                                    href={route('admin.forms.submissions', viewForm.id)}
                                    className="px-4 py-2 text-sm font-medium text-brand-primary hover:underline"
                                >
                                    View Submissions →
                                </a>
                            )}
                            <button onClick={() => setViewForm(null)} className="px-4 py-2 text-sm text-brand-accent hover:text-brand-primary transition">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
