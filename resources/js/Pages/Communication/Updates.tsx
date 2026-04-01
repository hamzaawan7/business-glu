import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useState, useRef, FormEventHandler, ChangeEvent } from 'react';

/* ═══ Types ══════════════════════════════════════════════ */

interface AudienceData { type: string; value: string | null; }

interface UpdateData {
    id: number;
    title: string;
    body: string;
    cover_image: string | null;
    attachments: { name: string; path: string; type: string; size: number }[];
    images: string[];
    youtube_url: string | null;
    type: string;
    category: string | null;
    status: string;
    is_pinned: boolean;
    is_popup: boolean;
    allow_comments: boolean;
    allow_reactions: boolean;
    published_at: string | null;
    scheduled_at: string | null;
    expires_at: string | null;
    reminder_at: string | null;
    creator: { id: number; name: string } | null;
    audiences: AudienceData[];
    comments_count: number;
    reactions_count: number;
    reads_count: number;
    created_at: string;
}

interface TemplateData {
    id: number;
    name: string;
    title: string | null;
    body: string | null;
    type: string;
    category: string | null;
    cover_image: string | null;
    images: string[];
    allow_comments: boolean;
    allow_reactions: boolean;
    is_default: boolean;
    creator: { id: number; name: string } | null;
    created_at: string;
}

interface TeamMember { id: number; name: string; email: string; role: string; }

interface Props {
    updates: UpdateData[];
    filters: { status: string; type: string; category: string };
    stats: { total: number; published: number; draft: number; scheduled: number; pinned: number };
    teamCount: number;
    teamMembers: TeamMember[];
    departments: string[];
    templates: TemplateData[];
}

/* ═══ Constants ══════════════════════════════════════════ */

const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    published: 'bg-green-100 text-green-700',
    scheduled: 'bg-blue-100 text-blue-700',
    archived: 'bg-gray-100 text-gray-500',
};

const typeIcons: Record<string, string> = { announcement: '📢', news: '��', event: '🎉', poll: '📊' };
const typeLabels: Record<string, string> = { announcement: 'Announcement', news: 'News', event: 'Event', poll: 'Poll' };
const roles = ['owner', 'admin', 'manager', 'member'];

/* ═══ Component ══════════════════════════════════════════ */

export default function Updates({ updates, filters, stats, teamCount, teamMembers, departments, templates }: Props) {
    const page = usePage();
    const flash = (page.props as any).flash ?? {};

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUpdate, setEditingUpdate] = useState<UpdateData | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<UpdateData | null>(null);
    const [viewUpdate, setViewUpdate] = useState<UpdateData | null>(null);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [saveTemplateFor, setSaveTemplateFor] = useState<UpdateData | null>(null);
    const [templateName, setTemplateName] = useState('');
    const [activeTab, setActiveTab] = useState<'updates' | 'templates'>('updates');

    /* ─── Create Form ────────────────────────────────────── */
    const coverRef = useRef<HTMLInputElement>(null);
    const imagesRef = useRef<HTMLInputElement>(null);
    const filesRef = useRef<HTMLInputElement>(null);

    const createForm = useForm<{
        title: string; body: string; type: string; category: string; youtube_url: string;
        is_pinned: boolean; is_popup: boolean; allow_comments: boolean; allow_reactions: boolean;
        publish_now: boolean; scheduled_at: string; expires_at: string; reminder_at: string;
        template_id: string; cover_image: File | null; upload_images: File[]; upload_files: File[];
        audience_type: string; audience_values: string[];
    }>({
        title: '', body: '', type: 'announcement', category: '', youtube_url: '',
        is_pinned: false, is_popup: false, allow_comments: true, allow_reactions: true,
        publish_now: false, scheduled_at: '', expires_at: '', reminder_at: '',
        template_id: '', cover_image: null, upload_images: [], upload_files: [],
        audience_type: 'all', audience_values: [],
    });

    const editCoverRef = useRef<HTMLInputElement>(null);
    const editImagesRef = useRef<HTMLInputElement>(null);
    const editFilesRef = useRef<HTMLInputElement>(null);

    const editForm = useForm<{
        title: string; body: string; type: string; category: string; youtube_url: string;
        is_pinned: boolean; is_popup: boolean; allow_comments: boolean; allow_reactions: boolean;
        expires_at: string; reminder_at: string;
        cover_image: File | null; upload_images: File[]; upload_files: File[];
        remove_cover: boolean; remove_images: string[];
        audience_type: string; audience_values: string[];
    }>({
        title: '', body: '', type: 'announcement', category: '', youtube_url: '',
        is_pinned: false, is_popup: false, allow_comments: true, allow_reactions: true,
        expires_at: '', reminder_at: '',
        cover_image: null, upload_images: [], upload_files: [],
        remove_cover: false, remove_images: [],
        audience_type: 'all', audience_values: [],
    });

    /* ─── Template form ──────────────────────────────────── */
    const tplForm = useForm({
        name: '', title: '', body: '', type: 'announcement', category: '',
        allow_comments: true, allow_reactions: true,
    });

    /* ─── Helpers ────────────────────────────────────────── */
    const openCreate = (tpl?: TemplateData) => {
        createForm.reset();
        if (tpl) {
            createForm.setData({
                ...createForm.data,
                title: tpl.title ?? '', body: tpl.body ?? '', type: tpl.type,
                category: tpl.category ?? '', template_id: String(tpl.id),
                allow_comments: tpl.allow_comments, allow_reactions: tpl.allow_reactions,
            });
        }
        setShowCreateModal(true);
    };

    const openEdit = (update: UpdateData) => {
        const audType = update.audiences.length > 0 ? update.audiences[0].type : 'all';
        const audVals = update.audiences.filter(a => a.value).map(a => a.value!);
        editForm.setData({
            title: update.title, body: update.body, type: update.type,
            category: update.category ?? '', youtube_url: update.youtube_url ?? '',
            is_pinned: update.is_pinned, is_popup: update.is_popup,
            allow_comments: update.allow_comments, allow_reactions: update.allow_reactions,
            expires_at: update.expires_at ? update.expires_at.split(' ')[0] : '',
            reminder_at: update.reminder_at ? update.reminder_at.split(' ')[0] : '',
            cover_image: null, upload_images: [], upload_files: [],
            remove_cover: false, remove_images: [],
            audience_type: audType, audience_values: audVals,
        });
        setEditingUpdate(update);
    };

    const handleCreate: FormEventHandler = (e) => {
        e.preventDefault();
        createForm.post(route('admin.updates.store'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => { setShowCreateModal(false); createForm.reset(); },
        });
    };

    const handleEdit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editingUpdate) return;
        const formData = { ...editForm.data, _method: 'PATCH' };
        router.post(route('admin.updates.update', editingUpdate.id), formData as any, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => setEditingUpdate(null),
        });
    };

    const handleDelete = () => {
        if (!deleteConfirm) return;
        router.delete(route('admin.updates.destroy', deleteConfirm.id), {
            preserveScroll: true, onSuccess: () => setDeleteConfirm(null),
        });
    };

    const handlePublish = (u: UpdateData) => router.post(route('admin.updates.publish', u.id), {}, { preserveScroll: true });
    const handleArchive = (u: UpdateData) => router.post(route('admin.updates.archive', u.id), {}, { preserveScroll: true });
    const handleTogglePin = (u: UpdateData) => router.post(route('admin.updates.toggle-pin', u.id), {}, { preserveScroll: true });

    const applyFilter = (key: string, value: string) => {
        router.get(route('admin.updates.index'), { ...filters, [key]: value }, { preserveScroll: true, preserveState: true });
    };

    const handleSaveAsTemplate = () => {
        if (!saveTemplateFor || !templateName.trim()) return;
        router.post(route('admin.updates.save-as-template', saveTemplateFor.id), { name: templateName }, {
            preserveScroll: true, onSuccess: () => { setSaveTemplateFor(null); setTemplateName(''); },
        });
    };

    const handleCreateTemplate: FormEventHandler = (e) => {
        e.preventDefault();
        tplForm.post(route('admin.templates.store'), {
            preserveScroll: true, onSuccess: () => { setShowTemplateModal(false); tplForm.reset(); },
        });
    };

    const handleDeleteTemplate = (id: number) => {
        if (!confirm('Delete this template?')) return;
        router.delete(route('admin.templates.destroy', id), { preserveScroll: true });
    };

    const formatDate = (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const formatSize = (b: number) => b < 1024 ? `${b}B` : b < 1048576 ? `${(b/1024).toFixed(1)}KB` : `${(b/1048576).toFixed(1)}MB`;

    const audienceLabel = (a: AudienceData[]) => {
        if (!a.length || a[0].type === 'all') return 'Everyone';
        return `${a[0].type}: ${a.map(x => x.value).join(', ')}`;
    };

    /* ─── Audience Picker Sub-component ──────────────────── */
    const AudiencePicker = ({ audType, audValues, onChange }: {
        audType: string; audValues: string[];
        onChange: (type: string, values: string[]) => void;
    }) => (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-brand-primary">Audience</label>
            <select value={audType} onChange={e => onChange(e.target.value, [])}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary">
                <option value="all">Everyone</option>
                <option value="department">By Department</option>
                <option value="role">By Role</option>
                <option value="user">Specific People</option>
            </select>
            {audType === 'department' && (
                <div className="flex flex-wrap gap-2 mt-1">
                    {departments.map(d => (
                        <label key={d} className="flex items-center gap-1.5 text-xs text-brand-primary bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
                            <input type="checkbox" checked={audValues.includes(d)}
                                onChange={e => onChange('department', e.target.checked ? [...audValues, d] : audValues.filter(v => v !== d))}
                                className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary w-3.5 h-3.5" />
                            {d}
                        </label>
                    ))}
                    {departments.length === 0 && <p className="text-xs text-brand-accent">No departments set up yet.</p>}
                </div>
            )}
            {audType === 'role' && (
                <div className="flex flex-wrap gap-2 mt-1">
                    {roles.map(r => (
                        <label key={r} className="flex items-center gap-1.5 text-xs text-brand-primary bg-gray-50 px-2 py-1 rounded-lg border border-gray-200 capitalize">
                            <input type="checkbox" checked={audValues.includes(r)}
                                onChange={e => onChange('role', e.target.checked ? [...audValues, r] : audValues.filter(v => v !== r))}
                                className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary w-3.5 h-3.5" />
                            {r}
                        </label>
                    ))}
                </div>
            )}
            {audType === 'user' && (
                <div className="max-h-40 overflow-y-auto space-y-1 mt-1">
                    {teamMembers.map(m => (
                        <label key={m.id} className="flex items-center gap-2 text-xs text-brand-primary px-2 py-1 hover:bg-gray-50 rounded">
                            <input type="checkbox" checked={audValues.includes(String(m.id))}
                                onChange={e => onChange('user', e.target.checked ? [...audValues, String(m.id)] : audValues.filter(v => v !== String(m.id)))}
                                className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary w-3.5 h-3.5" />
                            {m.name} <span className="text-brand-accent">({m.email})</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );

    /* ─── Build Modal (shared for create / edit) ─────────── */
    const renderModal = (
        isCreate: boolean,
        form: any,
        onSubmit: FormEventHandler,
        onClose: () => void,
        existingUpdate?: UpdateData | null,
    ) => {
        const cRef = isCreate ? coverRef : editCoverRef;
        const iRef = isCreate ? imagesRef : editImagesRef;
        const fRef = isCreate ? filesRef : editFilesRef;

        return (
            <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-8 px-4 z-50 overflow-y-auto">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mb-12">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-bold font-heading text-brand-primary">
                            {isCreate ? 'Create Update' : 'Edit Update'}
                        </h2>
                        <button onClick={onClose} className="text-brand-accent hover:text-brand-primary text-xl leading-none">&times;</button>
                    </div>

                    <form onSubmit={onSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                        {/* Template picker (create only) */}
                        {isCreate && templates.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-brand-primary mb-1">Start from template</label>
                                <select value={(form.data as any).template_id || ''}
                                    onChange={e => {
                                        const tpl = templates.find(t => t.id === Number(e.target.value));
                                        if (tpl) {
                                            form.setData({ ...form.data, title: tpl.title ?? '', body: tpl.body ?? '', type: tpl.type, category: tpl.category ?? '', allow_comments: tpl.allow_comments, allow_reactions: tpl.allow_reactions, template_id: String(tpl.id) } as any);
                                        } else {
                                            (form as any).setData('template_id', '');
                                        }
                                    }}
                                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary">
                                    <option value="">Blank post</option>
                                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                        )}

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-brand-primary mb-1">Title *</label>
                            <input type="text" value={form.data.title} onChange={e => form.setData('title' as any, e.target.value)}
                                placeholder="What's the update about?" required
                                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary" />
                        </div>

                        {/* Body */}
                        <div>
                            <label className="block text-sm font-medium text-brand-primary mb-1">Content *</label>
                            <textarea value={form.data.body} onChange={e => form.setData('body' as any, e.target.value)}
                                rows={6} placeholder="Write your update here..." required
                                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary" />
                        </div>

                        {/* Type + Category */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-brand-primary mb-1">Type</label>
                                <select value={form.data.type} onChange={e => form.setData('type' as any, e.target.value)}
                                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary">
                                    <option value="announcement">📢 Announcement</option>
                                    <option value="news">📰 News</option>
                                    <option value="event">🎉 Event</option>
                                    <option value="poll">📊 Poll</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-brand-primary mb-1">Category</label>
                                <input type="text" value={(form.data as any).category || ''} onChange={e => form.setData('category' as any, e.target.value)}
                                    placeholder="e.g. Safety, HR, General"
                                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary" />
                            </div>
                        </div>

                        {/* YouTube URL */}
                        <div>
                            <label className="block text-sm font-medium text-brand-primary mb-1">YouTube Video URL</label>
                            <input type="url" value={(form.data as any).youtube_url || ''} onChange={e => form.setData('youtube_url' as any, e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary" />
                        </div>

                        {/* Media uploads */}
                        <div className="space-y-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-brand-primary">Media & Files</h4>

                            {/* Cover image */}
                            <div>
                                <label className="text-xs font-medium text-brand-accent">Cover Image</label>
                                <input ref={cRef} type="file" accept="image/*" className="hidden"
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                        if (e.target.files?.[0]) form.setData('cover_image' as any, e.target.files[0]);
                                    }} />
                                <div className="flex items-center gap-2 mt-1">
                                    <button type="button" onClick={() => cRef.current?.click()}
                                        className="px-3 py-1.5 text-xs font-medium text-brand-primary bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                                        📷 Choose Cover
                                    </button>
                                    {(form.data as any).cover_image && (
                                        <span className="text-xs text-green-600">✓ {((form.data as any).cover_image as File).name}</span>
                                    )}
                                    {!isCreate && existingUpdate?.cover_image && !(form.data as any).remove_cover && (
                                        <button type="button" onClick={() => form.setData('remove_cover' as any, true)}
                                            className="text-xs text-red-500 hover:text-red-700">Remove existing cover</button>
                                    )}
                                </div>
                            </div>

                            {/* Gallery images */}
                            <div>
                                <label className="text-xs font-medium text-brand-accent">Photo Gallery (up to 10)</label>
                                <input ref={iRef} type="file" accept="image/*" multiple className="hidden"
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                        if (e.target.files) form.setData('upload_images' as any, Array.from(e.target.files));
                                    }} />
                                <div className="flex items-center gap-2 mt-1">
                                    <button type="button" onClick={() => iRef.current?.click()}
                                        className="px-3 py-1.5 text-xs font-medium text-brand-primary bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                                        🖼️ Add Photos
                                    </button>
                                    {(form.data as any).upload_images?.length > 0 && (
                                        <span className="text-xs text-green-600">✓ {(form.data as any).upload_images.length} photo(s) selected</span>
                                    )}
                                </div>
                                {!isCreate && existingUpdate?.images && existingUpdate.images.length > 0 && (
                                    <div className="flex gap-2 mt-2 flex-wrap">
                                        {existingUpdate.images.map((img, i) => (
                                            <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                                                <img src={img} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* File attachments */}
                            <div>
                                <label className="text-xs font-medium text-brand-accent">File Attachments (up to 10)</label>
                                <input ref={fRef} type="file" multiple className="hidden"
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                        if (e.target.files) form.setData('upload_files' as any, Array.from(e.target.files));
                                    }} />
                                <div className="flex items-center gap-2 mt-1">
                                    <button type="button" onClick={() => fRef.current?.click()}
                                        className="px-3 py-1.5 text-xs font-medium text-brand-primary bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                                        📎 Attach Files
                                    </button>
                                    {(form.data as any).upload_files?.length > 0 && (
                                        <span className="text-xs text-green-600">✓ {(form.data as any).upload_files.length} file(s) selected</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Audience targeting */}
                        <AudiencePicker
                            audType={(form.data as any).audience_type}
                            audValues={(form.data as any).audience_values}
                            onChange={(type, values) => { form.setData('audience_type' as any, type); form.setData('audience_values' as any, values); }}
                        />

                        {/* Options */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            {[
                                { key: 'is_pinned', icon: '📌', label: 'Pin to top' },
                                { key: 'is_popup', icon: '⚡', label: 'Pop-up alert' },
                                { key: 'allow_comments', icon: '💬', label: 'Allow comments' },
                                { key: 'allow_reactions', icon: '👍', label: 'Allow reactions' },
                            ].map(opt => (
                                <label key={opt.key} className="flex items-center gap-2 text-sm text-brand-primary">
                                    <input type="checkbox" checked={(form.data as any)[opt.key]}
                                        onChange={e => form.setData(opt.key as any, e.target.checked)}
                                        className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary" />
                                    {opt.icon} {opt.label}
                                </label>
                            ))}
                        </div>

                        {/* Scheduling (dates) */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-brand-accent mb-1">Expires at</label>
                                <input type="date" value={(form.data as any).expires_at || ''}
                                    onChange={e => form.setData('expires_at' as any, e.target.value)}
                                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-brand-accent mb-1">Send reminder</label>
                                <input type="date" value={(form.data as any).reminder_at || ''}
                                    onChange={e => form.setData('reminder_at' as any, e.target.value)}
                                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary" />
                            </div>
                        </div>

                        {/* Publish options (create only) */}
                        {isCreate && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                                <h4 className="text-sm font-semibold text-brand-primary">Publishing</h4>
                                <label className="flex items-center gap-2 text-sm text-brand-primary">
                                    <input type="checkbox" checked={(form.data as any).publish_now}
                                        onChange={e => form.setData('publish_now' as any, e.target.checked)}
                                        className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary" />
                                    Publish immediately
                                </label>
                                {!(form.data as any).publish_now && (
                                    <div>
                                        <label className="block text-xs text-brand-accent mb-1">Schedule for later</label>
                                        <input type="datetime-local" value={(form.data as any).scheduled_at || ''}
                                            onChange={e => form.setData('scheduled_at' as any, e.target.value)}
                                            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary" />
                                        <p className="text-[10px] text-brand-accent mt-1">Leave blank to save as draft</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Errors */}
                        {Object.keys(form.errors).length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                {Object.values(form.errors).map((err, i) => (
                                    <p key={i} className="text-xs text-red-600">{err as string}</p>
                                ))}
                            </div>
                        )}
                    </form>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                        <button onClick={onClose} className="px-4 py-2 text-sm text-brand-accent hover:text-brand-primary transition">Cancel</button>
                        <button onClick={onSubmit as any} disabled={form.processing}
                            className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50">
                            {form.processing ? 'Saving…' : isCreate ? ((form.data as any).publish_now ? 'Publish Now' : 'Save') : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    /* ═══ RENDER ══════════════════════════════════════════ */

    return (
        <AdminLayout title="Updates">
            <Head title="Updates" />
            <div className="space-y-6">
                {flash.success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{flash.success}</div>}
                {flash.error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{flash.error}</div>}

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold font-heading text-brand-primary">Updates Feed</h1>
                        <p className="text-sm text-brand-accent mt-1">Post announcements and updates for your team</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => openCreate()} className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition">
                            + New Update
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                        { label: 'Total', value: stats.total, color: 'text-brand-primary', bg: 'bg-slate-50' },
                        { label: 'Published', value: stats.published, color: 'text-green-600', bg: 'bg-green-50' },
                        { label: 'Draft', value: stats.draft, color: 'text-slate-600', bg: 'bg-slate-50' },
                        { label: 'Scheduled', value: stats.scheduled, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Pinned', value: stats.pinned, color: 'text-amber-600', bg: 'bg-amber-50' },
                    ].map(s => (
                        <div key={s.label} className={`rounded-xl border border-gray-200 p-4 shadow-sm ${s.bg}`}>
                            <p className="text-xs text-brand-accent uppercase tracking-wide">{s.label}</p>
                            <p className={`text-2xl font-bold font-heading mt-1 ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-1 shadow-sm w-fit">
                    {(['updates', 'templates'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition capitalize ${activeTab === tab ? 'bg-brand-primary text-white' : 'text-brand-accent hover:text-brand-primary'}`}>
                            {tab === 'templates' ? `Templates (${templates.length})` : 'Updates'}
                        </button>
                    ))}
                </div>

                {activeTab === 'updates' && (
                    <>
                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
                            <span className="text-xs font-medium text-brand-accent uppercase tracking-wide">Filter:</span>
                            <select value={filters.status} onChange={e => applyFilter('status', e.target.value)}
                                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-brand-primary focus:border-brand-primary">
                                <option value="all">All Status</option>
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="scheduled">Scheduled</option>
                                <option value="archived">Archived</option>
                            </select>
                            <select value={filters.type} onChange={e => applyFilter('type', e.target.value)}
                                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-brand-primary focus:border-brand-primary">
                                <option value="all">All Types</option>
                                <option value="announcement">📢 Announcements</option>
                                <option value="news">📰 News</option>
                                <option value="event">🎉 Events</option>
                                <option value="poll">�� Polls</option>
                            </select>
                        </div>

                        {/* Updates list */}
                        <div className="space-y-3">
                            {updates.length === 0 && (
                                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                                    <div className="text-5xl mb-3">📢</div>
                                    <h3 className="mt-3 text-base font-semibold font-heading text-brand-primary">No updates yet</h3>
                                    <p className="text-sm text-brand-accent mt-1">Create your first update to keep your team informed.</p>
                                </div>
                            )}

                            {updates.map(update => (
                                <div key={update.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${update.is_pinned ? 'border-amber-300 ring-1 ring-amber-100' : 'border-gray-200'}`}>
                                    {/* Cover image */}
                                    {update.cover_image && (
                                        <div className="h-40 overflow-hidden">
                                            <img src={update.cover_image} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    )}

                                    <div className="p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <span className="text-lg">{typeIcons[update.type] ?? '📢'}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <button onClick={() => setViewUpdate(update)} className="text-sm font-medium text-brand-primary hover:underline text-left">
                                                        {update.title}
                                                    </button>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColors[update.status]}`}>{update.status}</span>
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-600">{typeLabels[update.type]}</span>
                                                    {update.category && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-purple-50 text-purple-600">{update.category}</span>}
                                                    {update.is_pinned && <span className="text-[10px]">📌</span>}
                                                    {update.is_popup && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-orange-50 text-orange-600">Pop-up</span>}
                                                    {update.youtube_url && <span className="text-[10px]">▶️</span>}
                                                    {update.images.length > 0 && <span className="text-[10px]">🖼️ {update.images.length}</span>}
                                                    {update.attachments.length > 0 && <span className="text-[10px]">📎 {update.attachments.length}</span>}
                                                </div>
                                                <p className="text-xs text-brand-accent mt-1 line-clamp-2">{update.body}</p>
                                                <div className="flex items-center gap-4 mt-2 flex-wrap">
                                                    {update.creator && <span className="text-xs text-brand-accent">by {update.creator.name}</span>}
                                                    {update.published_at && <span className="text-xs text-brand-accent">{formatDate(update.published_at)}</span>}
                                                    <span className="text-xs text-brand-accent">🎯 {audienceLabel(update.audiences)}</span>
                                                    <span className="text-xs text-brand-accent">💬 {update.comments_count}</span>
                                                    <span className="text-xs text-brand-accent">👍 {update.reactions_count}</span>
                                                    <span className="text-xs text-brand-accent">👁 {update.reads_count}/{teamCount} read</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0 flex-wrap">
                                                <a href={route('admin.updates.analytics', update.id)}
                                                    className="px-2.5 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition">
                                                    📊 Analytics
                                                </a>
                                                {update.status === 'draft' && (
                                                    <button onClick={() => handlePublish(update)} className="px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition">Publish</button>
                                                )}
                                                {update.status === 'published' && (
                                                    <button onClick={() => handleArchive(update)} className="px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition">Archive</button>
                                                )}
                                                <button onClick={() => handleTogglePin(update)} className="px-2.5 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition">
                                                    {update.is_pinned ? 'Unpin' : 'Pin'}
                                                </button>
                                                <button onClick={() => setSaveTemplateFor(update)} className="px-2.5 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition" title="Save as template">
                                                    💾
                                                </button>
                                                <button onClick={() => openEdit(update)} className="px-2.5 py-1.5 text-xs font-medium text-brand-accent hover:text-brand-primary transition">Edit</button>
                                                <button onClick={() => setDeleteConfirm(update)} className="px-2.5 py-1.5 text-xs font-medium text-red-500 hover:text-red-700 transition">Delete</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Templates tab */}
                {activeTab === 'templates' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-brand-accent">Reusable templates speed up post creation</p>
                            <button onClick={() => setShowTemplateModal(true)}
                                className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition">
                                + New Template
                            </button>
                        </div>
                        {templates.length === 0 && (
                            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                                <div className="text-5xl mb-3">📄</div>
                                <h3 className="text-base font-semibold font-heading text-brand-primary">No templates yet</h3>
                                <p className="text-sm text-brand-accent mt-1">Create templates to streamline your update workflow.</p>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {templates.map(tpl => (
                                <div key={tpl.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-semibold text-brand-primary">{tpl.name}</h4>
                                            {tpl.title && <p className="text-xs text-brand-accent mt-0.5 truncate">{tpl.title}</p>}
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-600">{typeLabels[tpl.type]}</span>
                                                {tpl.category && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-purple-50 text-purple-600">{tpl.category}</span>}
                                                {tpl.is_default && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-green-50 text-green-600">Default</span>}
                                            </div>
                                            {tpl.creator && <p className="text-[10px] text-brand-accent mt-1">by {tpl.creator.name}</p>}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => openCreate(tpl)}
                                                className="px-2.5 py-1.5 text-xs font-medium text-brand-primary bg-brand-primary/10 rounded-lg hover:bg-brand-primary/20 transition">
                                                Use
                                            </button>
                                            <button onClick={() => handleDeleteTemplate(tpl.id)}
                                                className="px-2.5 py-1.5 text-xs font-medium text-red-500 hover:text-red-700 transition">
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Modals ────────────────────────────────────── */}

            {showCreateModal && renderModal(true, createForm, handleCreate, () => { setShowCreateModal(false); createForm.reset(); })}
            {editingUpdate && renderModal(false, editForm, handleEdit, () => setEditingUpdate(null), editingUpdate)}

            {/* Delete confirm */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                        <h3 className="text-lg font-bold font-heading text-brand-primary">Delete Update</h3>
                        <p className="text-sm text-brand-accent mt-2">
                            Are you sure you want to delete <strong>"{deleteConfirm.title}"</strong>? All media, comments, and reactions will also be removed.
                        </p>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-brand-accent hover:text-brand-primary transition">Cancel</button>
                            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Save as template */}
            {saveTemplateFor && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                        <h3 className="text-lg font-bold font-heading text-brand-primary">Save as Template</h3>
                        <p className="text-sm text-brand-accent mt-2">Give this template a name so you can reuse it later.</p>
                        <input type="text" value={templateName} onChange={e => setTemplateName(e.target.value)}
                            placeholder="Template name"
                            className="w-full mt-3 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary" />
                        <div className="flex justify-end gap-3 mt-4">
                            <button onClick={() => { setSaveTemplateFor(null); setTemplateName(''); }} className="px-4 py-2 text-sm text-brand-accent hover:text-brand-primary transition">Cancel</button>
                            <button onClick={handleSaveAsTemplate} disabled={!templateName.trim()}
                                className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50">Save Template</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create template modal */}
            {showTemplateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-12 px-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mb-12">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold font-heading text-brand-primary">New Template</h2>
                            <button onClick={() => setShowTemplateModal(false)} className="text-brand-accent hover:text-brand-primary text-xl leading-none">&times;</button>
                        </div>
                        <form onSubmit={handleCreateTemplate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-brand-primary mb-1">Template Name *</label>
                                <input type="text" value={tplForm.data.name} onChange={e => tplForm.setData('name', e.target.value)} required
                                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-brand-primary mb-1">Default Title</label>
                                <input type="text" value={tplForm.data.title} onChange={e => tplForm.setData('title', e.target.value)}
                                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-brand-primary mb-1">Default Content</label>
                                <textarea value={tplForm.data.body} onChange={e => tplForm.setData('body', e.target.value)} rows={4}
                                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-brand-primary mb-1">Type</label>
                                    <select value={tplForm.data.type} onChange={e => tplForm.setData('type', e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary">
                                        <option value="announcement">Announcement</option>
                                        <option value="news">News</option>
                                        <option value="event">Event</option>
                                        <option value="poll">Poll</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-brand-primary mb-1">Category</label>
                                    <input type="text" value={tplForm.data.category} onChange={e => tplForm.setData('category', e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary" />
                                </div>
                            </div>
                        </form>
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
                            <button onClick={() => setShowTemplateModal(false)} className="px-4 py-2 text-sm text-brand-accent">Cancel</button>
                            <button onClick={handleCreateTemplate as any} disabled={tplForm.processing}
                                className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50">
                                {tplForm.processing ? 'Saving…' : 'Save Template'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View update detail */}
            {viewUpdate && (
                <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-8 px-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mb-12">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-bold font-heading text-brand-primary">{viewUpdate.title}</h2>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColors[viewUpdate.status]}`}>{viewUpdate.status}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-600">{typeLabels[viewUpdate.type]}</span>
                                    {viewUpdate.category && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-purple-50 text-purple-600">{viewUpdate.category}</span>}
                                    {viewUpdate.is_pinned && <span className="text-[10px]">📌</span>}
                                </div>
                            </div>
                            <button onClick={() => setViewUpdate(null)} className="text-brand-accent hover:text-brand-primary text-xl leading-none">&times;</button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="flex items-center gap-3 text-xs text-brand-accent">
                                {viewUpdate.creator && <span>by <strong>{viewUpdate.creator.name}</strong></span>}
                                {viewUpdate.published_at && <span>Published {formatDate(viewUpdate.published_at)}</span>}
                                {viewUpdate.expires_at && <span className="text-orange-500">Expires {formatDate(viewUpdate.expires_at)}</span>}
                                <span>🎯 {audienceLabel(viewUpdate.audiences)}</span>
                            </div>

                            {viewUpdate.cover_image && (
                                <img src={viewUpdate.cover_image} alt="" className="w-full rounded-lg max-h-64 object-cover" />
                            )}

                            <div className="text-sm text-brand-primary whitespace-pre-wrap leading-relaxed">{viewUpdate.body}</div>

                            {viewUpdate.youtube_url && (
                                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                                    <iframe src={viewUpdate.youtube_url.replace('watch?v=', 'embed/')} className="w-full h-full" allowFullScreen title="YouTube video" />
                                </div>
                            )}

                            {viewUpdate.images.length > 0 && (
                                <div className="grid grid-cols-3 gap-2">
                                    {viewUpdate.images.map((img, i) => (
                                        <img key={i} src={img} alt="" className="w-full h-32 object-cover rounded-lg" />
                                    ))}
                                </div>
                            )}

                            {viewUpdate.attachments.length > 0 && (
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-brand-accent">Attachments</p>
                                    {viewUpdate.attachments.map((att, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs text-brand-primary bg-gray-50 rounded-lg px-3 py-2">
                                            📎 {att.name} <span className="text-brand-accent">({formatSize(att.size)})</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center gap-6 text-sm bg-gray-50 rounded-lg p-3">
                                <span className="text-brand-accent">💬 {viewUpdate.comments_count} comments</span>
                                <span className="text-brand-accent">👍 {viewUpdate.reactions_count} reactions</span>
                                <span className="text-brand-accent">👁 {viewUpdate.reads_count}/{teamCount} read</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                            <a href={route('admin.updates.analytics', viewUpdate.id)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">📊 View Full Analytics →</a>
                            <button onClick={() => setViewUpdate(null)} className="px-4 py-2 text-sm text-brand-accent hover:text-brand-primary transition">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
