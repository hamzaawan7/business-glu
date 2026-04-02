import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';
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
    draft: 'bg-slate-100 text-slate-600',
    published: 'bg-emerald-100 text-emerald-700',
    scheduled: 'bg-sky-100 text-sky-700',
    archived: 'bg-gray-100 text-gray-500',
};

const statusDot: Record<string, string> = {
    draft: 'bg-slate-400',
    published: 'bg-emerald-500',
    scheduled: 'bg-sky-500',
    archived: 'bg-gray-400',
};

const typeIcons: Record<string, string> = { announcement: 'megaphone', news: 'newspaper', event: 'party-popper', poll: 'chart-bar' };
const typeLabels: Record<string, string> = { announcement: 'Announcement', news: 'News', event: 'Event', poll: 'Poll' };
const typeBg: Record<string, string> = {
    announcement: 'from-red-500 to-orange-500', news: 'from-blue-500 to-cyan-500',
    event: 'from-purple-500 to-pink-500', poll: 'from-amber-500 to-yellow-500',
};
const roles = ['owner', 'admin', 'manager', 'member'];

/* ═══ Mobile Preview Component ═══════════════════════════ */

const MobilePreview = ({ title, body, type, category, coverImage, hasImages, hasYoutube, allowComments, allowReactions, creatorName }: {
    title: string; body: string; type: string; category: string;
    coverImage?: string | null; hasImages?: boolean; hasYoutube?: boolean;
    allowComments: boolean; allowReactions: boolean; creatorName?: string;
}) => {
    const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return (
        <div className="flex flex-col items-center">
            {/* Phone frame */}
            <div className="relative w-[260px] h-[480px] bg-gray-900 rounded-[32px] p-[6px] shadow-2xl shadow-black/20">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-gray-900 rounded-b-xl z-20" />
                {/* Screen */}
                <div className="w-full h-full bg-white rounded-[26px] overflow-hidden flex flex-col">
                    {/* Status bar */}
                    <div className="bg-[#495B67] px-5 pt-3 pb-0 flex items-center justify-between text-[9px] font-medium text-white/80">
                        <span>{time}</span>
                        <div className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/></svg>
                        </div>
                    </div>
                    {/* App header */}
                    <div className="bg-[#495B67] px-4 pt-0.5 pb-1.5">
                        <div className="flex items-center gap-1.5">
                            <svg className="w-3 h-3 text-white/80" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
                            <span className="text-white font-semibold text-[11px]">Updates</span>
                        </div>
                    </div>
                    {/* Post content preview */}
                    <div className="flex-1 overflow-y-auto bg-gray-50">
                        <div className="m-2.5 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Cover or gradient */}
                            {coverImage ? (
                                <div className="h-24 overflow-hidden">
                                    <img src={coverImage} alt="" className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className={`h-16 bg-gradient-to-r ${typeBg[type] || 'from-gray-500 to-gray-600'} flex items-end px-3 pb-2`}>
                                    <span className="text-white text-lg"><Icon name={typeIcons[type] || 'megaphone'} className="w-4 h-4 inline-block" /></span>
                                </div>
                            )}

                            <div className="p-3">
                                {/* Author row */}
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 rounded-full bg-[#495B67] text-white flex items-center justify-center text-[8px] font-bold">
                                        {creatorName ? creatorName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'AD'}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-gray-900 leading-tight">{creatorName || 'Admin'}</p>
                                        <p className="text-[8px] text-gray-400">Just now</p>
                                    </div>
                                    {category && (
                                        <span className="ml-auto text-[7px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600 font-medium">{category}</span>
                                    )}
                                </div>

                                {/* Title */}
                                <h4 className="text-[11px] font-bold text-gray-900 leading-snug">
                                    {title || 'Your update title…'}
                                </h4>

                                {/* Body */}
                                <p className="mt-1 text-[9px] text-gray-600 leading-relaxed line-clamp-4">
                                    {body || 'Write your update content here and see how it looks to your team on their mobile app.'}
                                </p>

                                {/* YouTube placeholder */}
                                {hasYoutube && (
                                    <div className="mt-2 bg-gray-900 rounded-lg aspect-video flex items-center justify-center">
                                        <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
                                            <svg className="w-3.5 h-3.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                        </div>
                                    </div>
                                )}

                                {/* Images placeholder */}
                                {hasImages && (
                                    <div className="mt-2 grid grid-cols-3 gap-1">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="aspect-square rounded bg-gray-100 flex items-center justify-center">
                                                <svg className="w-3 h-3 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"/></svg>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Reactions preview */}
                                <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-gray-50">
                                    {allowReactions && (
                                        <div className="flex items-center gap-1 text-[8px] text-gray-400">
                                            <span className="flex -space-x-0.5">
                                                <span className="inline-block"><Icon name="hand-thumb-up" className="w-4 h-4 inline-block" /></span>
                                                <span className="inline-block"><Icon name="heart" className="w-4 h-4 inline-block" /></span>
                                            </span>
                                            <span>12</span>
                                        </div>
                                    )}
                                    {allowComments && (
                                        <div className="flex items-center gap-0.5 text-[8px] text-gray-400">
                                            <Icon name="chat-bubble" className="w-4 h-4 inline-block" /> <span>3</span>
                                        </div>
                                    )}
                                    <span className="ml-auto text-[7px] text-gray-300">24 read</span>
                                </div>
                            </div>
                        </div>

                        {/* Ghost cards below */}
                        <div className="mx-2.5 mb-2 space-y-2">
                            <div className="bg-white rounded-xl border border-gray-100 p-3 opacity-40">
                                <div className="h-2 w-24 bg-gray-200 rounded-full mb-2" />
                                <div className="h-1.5 w-full bg-gray-100 rounded-full mb-1" />
                                <div className="h-1.5 w-3/4 bg-gray-100 rounded-full" />
                            </div>
                            <div className="bg-white rounded-xl border border-gray-100 p-3 opacity-20">
                                <div className="h-2 w-20 bg-gray-200 rounded-full mb-2" />
                                <div className="h-1.5 w-full bg-gray-100 rounded-full" />
                            </div>
                        </div>
                    </div>
                    {/* Bottom nav */}
                    <div className="bg-white border-t border-gray-100 px-4 py-1.5 flex items-center justify-around">
                        {['home', 'clock', 'megaphone', 'chat-bubble', 'user'].map((iconName, i) => (
                            <div key={i} className={`flex flex-col items-center ${i === 2 ? 'text-[#495B67]' : 'text-gray-300'}`}>
                                <Icon name={iconName} className="w-3.5 h-3.5" />
                                <div className={`h-0.5 w-3 rounded-full mt-0.5 ${i === 2 ? 'bg-[#495B67]' : 'bg-transparent'}`} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

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
    const [wizardStep, setWizardStep] = useState(0);

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
        setWizardStep(0);
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
        setWizardStep(0);
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
    const timeAgo = (s: string) => {
        const diff = (Date.now() - new Date(s).getTime()) / 1000;
        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        return formatDate(s);
    };

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
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Audience</label>
            <div className="grid grid-cols-4 gap-1 bg-gray-100 p-1 rounded-xl">
                {[
                    { val: 'all', label: 'All', desc: 'Everyone' },
                    { val: 'department', label: 'Dept', desc: 'By Department' },
                    { val: 'role', label: 'Role', desc: 'By Role' },
                    { val: 'user', label: 'People', desc: 'Specific' },
                ].map(opt => (
                    <button key={opt.val} type="button" onClick={() => onChange(opt.val, [])}
                        className={`px-2 py-2 text-[10px] font-medium rounded-lg transition-all text-center ${
                            audType === opt.val ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}>
                        {opt.label}
                    </button>
                ))}
            </div>
            {audType === 'department' && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                    {departments.map(d => (
                        <button key={d} type="button" onClick={() => onChange('department', audValues.includes(d) ? audValues.filter(v => v !== d) : [...audValues, d])}
                            className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                                audValues.includes(d) ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-primary'
                            }`}>
                            {d}
                        </button>
                    ))}
                    {departments.length === 0 && <p className="text-xs text-gray-400 italic">No departments configured</p>}
                </div>
            )}
            {audType === 'role' && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                    {roles.map(r => (
                        <button key={r} type="button" onClick={() => onChange('role', audValues.includes(r) ? audValues.filter(v => v !== r) : [...audValues, r])}
                            className={`px-3 py-1.5 text-xs rounded-full border capitalize transition-all ${
                                audValues.includes(r) ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-primary'
                            }`}>
                            {r}
                        </button>
                    ))}
                </div>
            )}
            {audType === 'user' && (
                <div className="max-h-36 overflow-y-auto space-y-0.5 mt-2 bg-white rounded-lg border border-gray-200 p-1">
                    {teamMembers.map(m => (
                        <button key={m.id} type="button" onClick={() => {
                            const sid = String(m.id);
                            onChange('user', audValues.includes(sid) ? audValues.filter(v => v !== sid) : [...audValues, sid]);
                        }}
                            className={`w-full flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg transition-all ${
                                audValues.includes(String(m.id)) ? 'bg-brand-primary/10 text-brand-primary' : 'text-gray-600 hover:bg-gray-50'
                            }`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${
                                audValues.includes(String(m.id)) ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-500'
                            }`}>{m.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</div>
                            <span className="font-medium">{m.name}</span>
                            <span className="text-gray-400 ml-auto text-[10px]">{m.email}</span>
                            {audValues.includes(String(m.id)) && <span className="text-brand-primary"><Icon name="check" className="w-3 h-3 inline-block" /></span>}
                        </button>
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

        const STEPS = [
            { id: 'content', label: 'Content', icon: 'pencil-square' },
            { id: 'media', label: 'Media', icon: 'photo' },
            { id: 'audience', label: 'Audience & Options', icon: 'user-group' },
            { id: 'publish', label: isCreate ? 'Publish' : 'Save', icon: 'rocket' },
        ];

        const step = wizardStep;
        const setStep = setWizardStep;
        const canNext = step < STEPS.length - 1;
        const canPrev = step > 0;

        /* step validation — require title+body before advancing from step 0 */
        const isStepValid = (s: number) => {
            if (s === 0) return !!form.data.title?.trim() && !!form.data.body?.trim();
            return true;
        };

        const wizardContent = (
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Header with step indicators */}
                    <div className="px-6 py-4 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-bold font-heading text-brand-primary">
                                    {isCreate ? 'Create Update' : 'Edit Update'}
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">Step {step + 1} of {STEPS.length} — {STEPS[step].label}</p>
                            </div>
                            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition">&times;</button>
                        </div>

                        {/* Step progress bar */}
                        <div className="flex items-center gap-1">
                            {STEPS.map((s, i) => (
                                <button key={s.id} type="button" onClick={() => { if (i < step || isStepValid(step)) setStep(i); }}
                                    className="flex-1 group relative">
                                    <div className={`h-1.5 rounded-full transition-all ${
                                        i < step ? 'bg-brand-primary' : i === step ? 'bg-brand-primary/60' : 'bg-gray-200'
                                    }`} />
                                    <div className={`flex items-center gap-1.5 mt-2 ${
                                        i === step ? 'text-brand-primary' : i < step ? 'text-gray-500' : 'text-gray-300'
                                    }`}>
                                        <Icon name={s.icon} className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-semibold uppercase tracking-wide hidden sm:inline">{s.label}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Step content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* ─── Step 1: Content ─────────────────── */}
                        {step === 0 && (
                            <div className="space-y-5 animate-fadeIn">
                                {/* Template picker (create only) */}
                                {isCreate && templates.length > 0 && (
                                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-3">
                                        <label className="block text-xs font-semibold text-purple-700 mb-1.5">Start from a template</label>
                                        <select value={(form.data as any).template_id || ''}
                                            onChange={e => {
                                                const tpl = templates.find((t: TemplateData) => t.id === Number(e.target.value));
                                                if (tpl) {
                                                    form.setData({ ...form.data, title: tpl.title ?? '', body: tpl.body ?? '', type: tpl.type, category: tpl.category ?? '', allow_comments: tpl.allow_comments, allow_reactions: tpl.allow_reactions, template_id: String(tpl.id) } as any);
                                                } else {
                                                    (form as any).setData('template_id', '');
                                                }
                                            }}
                                            className="w-full text-sm border border-purple-200 rounded-lg px-3 py-2 bg-white/80 focus:ring-purple-400 focus:border-purple-400">
                                            <option value="">Blank post</option>
                                            {templates.map((t: TemplateData) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Title *</label>
                                    <input type="text" value={form.data.title} onChange={(e: ChangeEvent<HTMLInputElement>) => form.setData('title' as any, e.target.value)}
                                        placeholder="What's this update about?" required autoFocus
                                        className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-brand-primary focus:border-brand-primary placeholder:text-gray-300" />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Content *</label>
                                    <textarea value={form.data.body} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => form.setData('body' as any, e.target.value)}
                                        rows={8} placeholder="Write your update here..." required
                                        className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-brand-primary focus:border-brand-primary placeholder:text-gray-300 resize-none" />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Type</label>
                                        <select value={form.data.type} onChange={(e: ChangeEvent<HTMLSelectElement>) => form.setData('type' as any, e.target.value)}
                                            className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-brand-primary focus:border-brand-primary">
                                            <option value="announcement">Announcement</option>
                                            <option value="news">News</option>
                                            <option value="event">Event</option>
                                            <option value="poll">Poll</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Category</label>
                                        <input type="text" value={(form.data as any).category || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => form.setData('category' as any, e.target.value)}
                                            placeholder="e.g. Safety, HR"
                                            className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-brand-primary focus:border-brand-primary placeholder:text-gray-300" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ─── Step 2: Media ───────────────────── */}
                        {step === 1 && (
                            <div className="space-y-5 animate-fadeIn">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">YouTube Video</label>
                                    <input type="url" value={(form.data as any).youtube_url || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => form.setData('youtube_url' as any, e.target.value)}
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-brand-primary focus:border-brand-primary placeholder:text-gray-300" />
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Upload Files</h4>

                                    {/* Cover Image */}
                                    <div>
                                        <input ref={cRef} type="file" accept="image/*" className="hidden"
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) form.setData('cover_image' as any, e.target.files[0]); }} />
                                        <button type="button" onClick={() => cRef.current?.click()}
                                            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed transition-all text-left ${
                                                (form.data as any).cover_image ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 hover:border-brand-primary hover:bg-brand-primary/5'
                                            }`}>
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                (form.data as any).cover_image ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                                            }`}>
                                                <Icon name={(form.data as any).cover_image ? 'check-circle' : 'photo'} className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-gray-700">Cover Image</p>
                                                <p className="text-xs text-gray-400">{(form.data as any).cover_image ? (form.data as any).cover_image.name : 'Click to upload a hero image'}</p>
                                            </div>
                                            {(form.data as any).cover_image && (
                                                <button type="button" onClick={(e) => { e.stopPropagation(); form.setData('cover_image' as any, null); }}
                                                    className="text-xs text-red-400 hover:text-red-600 font-medium px-2 py-1">Remove</button>
                                            )}
                                        </button>
                                    </div>

                                    {/* Photos */}
                                    <div>
                                        <input ref={iRef} type="file" accept="image/*" multiple className="hidden"
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => { if (e.target.files) form.setData('upload_images' as any, Array.from(e.target.files)); }} />
                                        <button type="button" onClick={() => iRef.current?.click()}
                                            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed transition-all text-left ${
                                                (form.data as any).upload_images?.length > 0 ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 hover:border-brand-primary hover:bg-brand-primary/5'
                                            }`}>
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                (form.data as any).upload_images?.length > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                                            }`}>
                                                <Icon name="camera" className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-gray-700">Photos</p>
                                                <p className="text-xs text-gray-400">
                                                    {(form.data as any).upload_images?.length > 0 ? `${(form.data as any).upload_images.length} photo(s) selected` : 'Upload multiple images'}
                                                </p>
                                            </div>
                                            {(form.data as any).upload_images?.length > 0 && (
                                                <button type="button" onClick={(e) => { e.stopPropagation(); form.setData('upload_images' as any, []); }}
                                                    className="text-xs text-red-400 hover:text-red-600 font-medium px-2 py-1">Clear</button>
                                            )}
                                        </button>
                                    </div>

                                    {/* Files */}
                                    <div>
                                        <input ref={fRef} type="file" multiple className="hidden"
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => { if (e.target.files) form.setData('upload_files' as any, Array.from(e.target.files)); }} />
                                        <button type="button" onClick={() => fRef.current?.click()}
                                            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed transition-all text-left ${
                                                (form.data as any).upload_files?.length > 0 ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 hover:border-brand-primary hover:bg-brand-primary/5'
                                            }`}>
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                (form.data as any).upload_files?.length > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                                            }`}>
                                                <Icon name="document" className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-gray-700">Documents & Files</p>
                                                <p className="text-xs text-gray-400">
                                                    {(form.data as any).upload_files?.length > 0 ? `${(form.data as any).upload_files.length} file(s) selected` : 'PDFs, docs, spreadsheets, etc.'}
                                                </p>
                                            </div>
                                            {(form.data as any).upload_files?.length > 0 && (
                                                <button type="button" onClick={(e) => { e.stopPropagation(); form.setData('upload_files' as any, []); }}
                                                    className="text-xs text-red-400 hover:text-red-600 font-medium px-2 py-1">Clear</button>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Existing media on edit */}
                                {!isCreate && existingUpdate?.cover_image && !(form.data as any).remove_cover && (
                                    <div className="flex items-center gap-3 text-xs bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                                        <img src={existingUpdate.cover_image} alt="" className="w-14 h-14 rounded-lg object-cover" />
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-700">Current cover image</p>
                                            <p className="text-gray-400 text-[10px]">Upload a new one above to replace</p>
                                        </div>
                                        <button type="button" onClick={() => form.setData('remove_cover' as any, true)}
                                            className="text-red-400 hover:text-red-600 text-[10px] font-medium">Remove</button>
                                    </div>
                                )}
                                {!isCreate && existingUpdate?.images && existingUpdate.images.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-gray-500">Existing images</p>
                                        <div className="flex gap-2 flex-wrap">
                                            {existingUpdate.images.map((img: string, i: number) => (
                                                <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ─── Step 3: Audience & Options ──────── */}
                        {step === 2 && (
                            <div className="space-y-6 animate-fadeIn">
                                <AudiencePicker
                                    audType={(form.data as any).audience_type}
                                    audValues={(form.data as any).audience_values}
                                    onChange={(type: string, values: string[]) => { form.setData('audience_type' as any, type); form.setData('audience_values' as any, values); }}
                                />

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Options</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { key: 'is_pinned', icon: 'pin', label: 'Pin to top', desc: 'Shows first in feed' },
                                            { key: 'is_popup', icon: 'bolt', label: 'Pop-up alert', desc: 'Must acknowledge' },
                                            { key: 'allow_comments', icon: 'chat-bubble', label: 'Comments', desc: 'Allow team to comment' },
                                            { key: 'allow_reactions', icon: 'hand-thumb-up', label: 'Reactions', desc: 'Allow emoji reactions' },
                                        ].map(opt => (
                                            <button key={opt.key} type="button"
                                                onClick={() => form.setData(opt.key as any, !(form.data as any)[opt.key])}
                                                className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all text-left ${
                                                    (form.data as any)[opt.key]
                                                        ? 'border-brand-primary bg-brand-primary/5'
                                                        : 'border-gray-100 hover:border-gray-300'
                                                }`}>
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                    (form.data as any)[opt.key] ? 'bg-brand-primary/10 text-brand-primary' : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                    <Icon name={opt.icon} className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className={`text-xs font-semibold ${(form.data as any)[opt.key] ? 'text-brand-primary' : 'text-gray-500'}`}>{opt.label}</p>
                                                    <p className="text-[9px] text-gray-400">{opt.desc}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Scheduling dates */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Scheduling</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] text-gray-500 font-medium mb-1">Expires on</label>
                                            <input type="date" value={(form.data as any).expires_at || ''}
                                                onChange={(e: ChangeEvent<HTMLInputElement>) => form.setData('expires_at' as any, e.target.value)}
                                                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-brand-primary focus:border-brand-primary" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-gray-500 font-medium mb-1">Send reminder on</label>
                                            <input type="date" value={(form.data as any).reminder_at || ''}
                                                onChange={(e: ChangeEvent<HTMLInputElement>) => form.setData('reminder_at' as any, e.target.value)}
                                                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-brand-primary focus:border-brand-primary" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ─── Step 4: Publish ─────────────────── */}
                        {step === 3 && (
                            <div className="space-y-5 animate-fadeIn">
                                {/* Summary card */}
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Review Summary</h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                                            <p className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Title</p>
                                            <p className="text-gray-800 font-medium truncate">{form.data.title || '—'}</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                                            <p className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Type</p>
                                            <p className="text-gray-800 font-medium flex items-center gap-1.5">
                                                <Icon name={typeIcons[form.data.type]} className="w-3.5 h-3.5" /> {typeLabels[form.data.type]}
                                            </p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                                            <p className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Audience</p>
                                            <p className="text-gray-800 font-medium">{(form.data as any).audience_type === 'all' ? 'Everyone' : `${(form.data as any).audience_type}: ${(form.data as any).audience_values?.length || 0} selected`}</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                                            <p className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Media</p>
                                            <p className="text-gray-800 font-medium">
                                                {[(form.data as any).cover_image && 'Cover', (form.data as any).upload_images?.length && `${(form.data as any).upload_images.length} photos`, (form.data as any).upload_files?.length && `${(form.data as any).upload_files.length} files`, (form.data as any).youtube_url && 'Video'].filter(Boolean).join(', ') || 'None'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Publish options (create only) */}
                                {isCreate && (
                                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-5 space-y-4">
                                        <h4 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Publishing</h4>
                                        <button type="button"
                                            onClick={() => form.setData('publish_now' as any, !(form.data as any).publish_now)}
                                            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                                                (form.data as any).publish_now ? 'border-emerald-500 bg-emerald-500/10' : 'border-emerald-200 bg-white'
                                            }`}>
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                (form.data as any).publish_now ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-500'
                                            }`}>
                                                <Icon name={(form.data as any).publish_now ? 'check' : 'pause'} className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <p className={`text-sm font-bold ${(form.data as any).publish_now ? 'text-emerald-700' : 'text-gray-500'}`}>
                                                    {(form.data as any).publish_now ? 'Publishing immediately' : 'Save as draft'}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {(form.data as any).publish_now ? 'Visible to your team right away' : 'Or schedule it below'}
                                                </p>
                                            </div>
                                        </button>
                                        {!(form.data as any).publish_now && (
                                            <div>
                                                <label className="block text-[10px] text-emerald-600 font-medium mb-1">Schedule for later</label>
                                                <input type="datetime-local" value={(form.data as any).scheduled_at || ''}
                                                    onChange={(e: ChangeEvent<HTMLInputElement>) => form.setData('scheduled_at' as any, e.target.value)}
                                                    className="w-full text-sm border border-emerald-200 rounded-xl px-4 py-2.5 focus:ring-emerald-400 focus:border-emerald-400 bg-white/80" />
                                                <p className="text-[9px] text-gray-400 mt-1">Leave blank to save as draft</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Errors */}
                                {Object.keys(form.errors).length > 0 && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                        {Object.values(form.errors).map((err: any, i: number) => (
                                            <p key={i} className="text-xs text-red-600">{err}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer with navigation */}
                    <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600 transition">Cancel</button>
                            {canPrev && (
                                <button type="button" onClick={() => setStep(step - 1)}
                                    className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
                                    Back
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {canNext ? (
                                <button type="button" onClick={() => { if (isStepValid(step)) setStep(step + 1); }}
                                    disabled={!isStepValid(step)}
                                    className="px-6 py-2.5 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-40 shadow-sm shadow-brand-primary/20 flex items-center gap-1.5">
                                    Next
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
                                </button>
                            ) : (
                                <button type="button" onClick={onSubmit as any} disabled={form.processing}
                                    className="px-6 py-2.5 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-50 shadow-sm shadow-brand-primary/20">
                                    {form.processing ? (
                                        <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</span>
                                    ) : isCreate ? ((form.data as any).publish_now ? 'Publish Now' : 'Save') : 'Save Changes'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            );

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-4 px-4 z-50 overflow-y-auto">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl mb-8 flex overflow-hidden" style={{ minHeight: 'min(85vh, 680px)' }}>
                    {/* Left: Multi-step Form */}
                    {wizardContent}

                    {/* Right: Fixed Live Mobile Preview */}
                    <div className="hidden lg:flex w-[340px] bg-gradient-to-b from-gray-50 to-gray-100 border-l border-gray-200 flex-col items-center justify-center py-6 px-4 flex-shrink-0">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4">Live Preview</p>
                        <MobilePreview
                            title={form.data.title}
                            body={form.data.body}
                            type={form.data.type}
                            category={(form.data as any).category}
                            coverImage={existingUpdate?.cover_image && !(form.data as any).remove_cover ? existingUpdate.cover_image : undefined}
                            hasImages={(form.data as any).upload_images?.length > 0 || (existingUpdate?.images?.length ?? 0) > 0}
                            hasYoutube={!!((form.data as any).youtube_url)}
                            allowComments={(form.data as any).allow_comments}
                            allowReactions={(form.data as any).allow_reactions}
                        />
                        <p className="text-[9px] text-gray-400 mt-3 text-center max-w-[200px]">This preview updates in real time as you fill in the form</p>
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
                {flash.success && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                        <span className="text-base"><Icon name="check-circle" className="w-4 h-4 inline-block" /></span> {flash.success}
                    </div>
                )}
                {flash.error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                        <span className="text-base"><Icon name="exclamation-triangle" className="w-4 h-4 inline-block" /></span> {flash.error}
                    </div>
                )}

                {/* Hero Header */}
                <div className="bg-gradient-to-r from-[#495B67] to-[#5a7080] rounded-2xl p-6 flex items-center justify-between text-white overflow-hidden relative">
                    <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/5 rounded-full" />
                    <div className="absolute -right-4 top-16 w-24 h-24 bg-white/5 rounded-full" />
                    <div className="relative z-10">
                        <h1 className="text-2xl font-bold font-heading">Updates Feed</h1>
                        <p className="text-sm text-white/70 mt-1">Keep your team informed with rich, targeted updates</p>
                    </div>
                    <button onClick={() => openCreate()}
                        className="relative z-10 px-5 py-2.5 bg-white text-[#495B67] text-sm font-bold rounded-xl hover:bg-white/90 transition shadow-lg shadow-black/10 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
                        New Update
                    </button>
                </div>

                {/* Stats — modern glass cards */}
                <div className="grid grid-cols-5 gap-3">
                    {[
                        { label: 'Total', value: stats.total, icon: 'chart-bar', gradient: 'from-slate-500/10 to-slate-600/5' },
                        { label: 'Published', value: stats.published, icon: 'dot-green', gradient: 'from-emerald-500/10 to-emerald-600/5' },
                        { label: 'Draft', value: stats.draft, icon: 'pencil', gradient: 'from-slate-400/10 to-slate-500/5' },
                        { label: 'Scheduled', value: stats.scheduled, icon: 'clock', gradient: 'from-sky-500/10 to-sky-600/5' },
                        { label: 'Pinned', value: stats.pinned, icon: 'pin', gradient: 'from-amber-500/10 to-amber-600/5' },
                    ].map(s => (
                        <div key={s.label} className={`bg-gradient-to-br ${s.gradient} backdrop-blur-xl rounded-xl border border-white/60 p-4 shadow-sm`}>
                            <div className="flex items-center justify-between">
                                <span className="text-lg"><Icon name={s.icon} className="w-5 h-5" /></span>
                                <span className="text-2xl font-bold font-heading text-gray-800">{s.value}</span>
                            </div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Tab switcher */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                    {(['updates', 'templates'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
                                activeTab === tab ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'
                            }`}>
                            {tab === 'templates' ? <><Icon name="document" className="w-4 h-4 inline-block" /> Templates ({templates.length})</> : 'Updates'}
                        </button>
                    ))}
                </div>

                {/* ═══ UPDATES TAB ════════════════════════════ */}
                {activeTab === 'updates' && (
                    <>
                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Filters</span>
                            <select value={filters.status} onChange={e => applyFilter('status', e.target.value)}
                                className="text-xs font-medium border-0 bg-gray-100 rounded-lg px-3 py-1.5 focus:ring-brand-primary text-gray-600">
                                <option value="all">All Status</option>
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="scheduled">Scheduled</option>
                                <option value="archived">Archived</option>
                            </select>
                            <select value={filters.type} onChange={e => applyFilter('type', e.target.value)}
                                className="text-xs font-medium border-0 bg-gray-100 rounded-lg px-3 py-1.5 focus:ring-brand-primary text-gray-600">
                                <option value="all">All Types</option>
                                <option value="announcement">Announcement</option>
                                <option value="news">News</option>
                                <option value="event">Event</option>
                                <option value="poll">Poll</option>
                            </select>
                        </div>

                        {/* Updates list — modern cards */}
                        <div className="space-y-3">
                            {updates.length === 0 && (
                                <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
                                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Icon name="megaphone" className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-base font-bold font-heading text-gray-800">No updates yet</h3>
                                    <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">Create your first update to keep your team informed and engaged.</p>
                                    <button onClick={() => openCreate()} className="mt-4 px-5 py-2 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 transition">
                                        Create First Update
                                    </button>
                                </div>
                            )}

                            {updates.map(update => (
                                <div key={update.id} className={`group bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden ${
                                    update.is_pinned ? 'border-amber-200 ring-1 ring-amber-100' : 'border-gray-100'
                                }`}>
                                    <div className="flex">
                                        {/* Type accent strip */}
                                        <div className={`w-1 bg-gradient-to-b ${typeBg[update.type] || 'from-gray-400 to-gray-500'} flex-shrink-0`} />

                                        {/* Cover thumbnail */}
                                        {update.cover_image && (
                                            <div className="w-24 h-full flex-shrink-0 hidden sm:block">
                                                <img src={update.cover_image} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        )}

                                        {/* Content */}
                                        <div className="flex-1 p-4 min-w-0">
                                            <div className="flex items-start gap-3">
                                                <div className="flex-1 min-w-0">
                                                    {/* Top tags row */}
                                                    <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                                                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusColors[update.status]}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${statusDot[update.status]}`} />
                                                            {update.status}
                                                        </span>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-600">
                                                            <Icon name={typeIcons[update.type]} className="w-3.5 h-3.5 inline-block mr-1" /> {typeLabels[update.type]}
                                                        </span>
                                                        {update.category && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-purple-50 text-purple-600">{update.category}</span>}
                                                        {update.is_pinned && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-600">Pinned</span>}
                                                        {update.is_popup && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-orange-50 text-orange-600">Pop-up</span>}
                                                    </div>

                                                    {/* Title */}
                                                    <button onClick={() => setViewUpdate(update)} className="text-sm font-bold text-gray-900 hover:text-brand-primary text-left transition block">
                                                        {update.title}
                                                    </button>

                                                    {/* Body excerpt */}
                                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{update.body}</p>

                                                    {/* Meta row */}
                                                    <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                                                        {update.creator && <span className="font-medium">{update.creator.name}</span>}
                                                        <span>{update.published_at ? timeAgo(update.published_at) : timeAgo(update.created_at)}</span>
                                                        <span className="flex items-center gap-0.5">{audienceLabel(update.audiences)}</span>
                                                        {update.youtube_url && <span><Icon name="video-camera" className="w-4 h-4 inline-block" /></span>}
                                                        {update.images.length > 0 && <span>{update.images.length}</span>}
                                                        {update.attachments.length > 0 && <span>{update.attachments.length}</span>}
                                                    </div>
                                                </div>

                                                {/* Right side: metrics + actions */}
                                                <div className="flex-shrink-0 text-right space-y-2">
                                                    {/* Mini metrics */}
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-center">
                                                            <p className="text-xs font-bold text-gray-800">{update.reads_count}</p>
                                                            <p className="text-[8px] text-gray-400">reads</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-xs font-bold text-gray-800">{update.reactions_count}</p>
                                                            <p className="text-[8px] text-gray-400">reacts</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-xs font-bold text-gray-800">{update.comments_count}</p>
                                                            <p className="text-[8px] text-gray-400">comments</p>
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <a href={route('admin.updates.analytics', update.id)}
                                                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-500 transition" title="Analytics">
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>
                                                        </a>
                                                        {update.status === 'draft' && (
                                                            <button onClick={() => handlePublish(update)} className="p-1.5 rounded-lg hover:bg-green-50 text-green-500 transition" title="Publish">
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"/></svg>
                                                            </button>
                                                        )}
                                                        {update.status === 'published' && (
                                                            <button onClick={() => handleArchive(update)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition" title="Archive">
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/></svg>
                                                            </button>
                                                        )}
                                                        <button onClick={() => handleTogglePin(update)} className={`p-1.5 rounded-lg transition ${update.is_pinned ? 'bg-amber-50 text-amber-500' : 'hover:bg-amber-50 text-gray-400'}`} title={update.is_pinned ? 'Unpin' : 'Pin'}>
                                                            <svg className="w-3.5 h-3.5" fill={update.is_pinned ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6A2.25 2.25 0 016 3.75h1.5m9 0h-9"/></svg>
                                                        </button>
                                                        <button onClick={() => setSaveTemplateFor(update)} className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-400 transition" title="Save as template">
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"/></svg>
                                                        </button>
                                                        <button onClick={() => openEdit(update)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-400 transition" title="Edit">
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
                                                        </button>
                                                        <button onClick={() => setDeleteConfirm(update)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition" title="Delete">
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* ═══ TEMPLATES TAB — Mobile Preview Cards ════ */}
                {activeTab === 'templates' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Preview how templates look on mobile, then use them to create posts instantly.</p>
                            </div>
                            <button onClick={() => setShowTemplateModal(true)}
                                className="px-5 py-2.5 bg-brand-primary text-white text-sm font-bold rounded-xl hover:opacity-90 transition shadow-sm flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
                                New Template
                            </button>
                        </div>

                        {templates.length === 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
                                <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Icon name="document" className="w-8 h-8 text-purple-400" />
                                </div>
                                <h3 className="text-base font-bold font-heading text-gray-800">No templates yet</h3>
                                <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">Templates let you create consistent updates faster. Build your first one!</p>
                                <button onClick={() => setShowTemplateModal(true)} className="mt-4 px-5 py-2 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 transition">
                                    Create Template
                                </button>
                            </div>
                        )}

                        {/* Template cards with phone previews */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {templates.map(tpl => (
                                <div key={tpl.id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden">
                                    {/* Phone preview area */}
                                    <div className="bg-gradient-to-b from-gray-50 to-gray-100 flex justify-center overflow-hidden" style={{ height: 280 }}>
                                        <div className="transform scale-[0.55] origin-top shrink-0">
                                            <MobilePreview
                                                title={tpl.title || tpl.name}
                                                body={tpl.body || ''}
                                                type={tpl.type}
                                                category={tpl.category || ''}
                                                coverImage={tpl.cover_image}
                                                hasImages={tpl.images?.length > 0}
                                                allowComments={tpl.allow_comments}
                                                allowReactions={tpl.allow_reactions}
                                                creatorName={tpl.creator?.name}
                                            />
                                        </div>
                                    </div>

                                    {/* Template info */}
                                    <div className="p-4 border-t border-gray-50">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-bold text-gray-900 truncate">{tpl.name}</h4>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-600">
                                                        <Icon name={typeIcons[tpl.type]} className="w-3.5 h-3.5 inline-block mr-1" /> {typeLabels[tpl.type]}
                                                    </span>
                                                    {tpl.category && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-purple-50 text-purple-600">{tpl.category}</span>}
                                                    {tpl.is_default && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-green-50 text-green-600">Default</span>}
                                                </div>
                                                {tpl.creator && <p className="text-[10px] text-gray-400 mt-1">by {tpl.creator.name}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                                            <button onClick={() => openCreate(tpl)}
                                                className="flex-1 py-2 text-xs font-bold text-white bg-brand-primary rounded-xl hover:opacity-90 transition text-center">
                                                Use Template
                                            </button>
                                            <button onClick={() => handleDeleteTemplate(tpl.id)}
                                                className="p-2 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 transition" title="Delete">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ═══ Modals ════════════════════════════════════ */}

            {showCreateModal && renderModal(true, createForm, handleCreate, () => { setShowCreateModal(false); createForm.reset(); })}
            {editingUpdate && renderModal(false, editForm, handleEdit, () => setEditingUpdate(null), editingUpdate)}

            {/* Delete confirm */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="bg-red-50 p-6 text-center">
                            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
                                <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mt-3">Delete Update?</h3>
                            <p className="text-sm text-gray-500 mt-1">"{deleteConfirm.title}" and all its media, comments, and reactions will be permanently removed.</p>
                        </div>
                        <div className="flex gap-3 p-4">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">Cancel</button>
                            <button onClick={handleDelete} className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Save as template */}
            {saveTemplateFor && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="bg-purple-50 p-6 text-center">
                            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto">
                                <Icon name="save" className="w-7 h-7 text-purple-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mt-3">Save as Template</h3>
                            <p className="text-sm text-gray-500 mt-1">Give it a name so you can quickly reuse this format.</p>
                        </div>
                        <div className="p-4 space-y-3">
                            <input type="text" value={templateName} onChange={e => setTemplateName(e.target.value)}
                                placeholder="Template name"
                                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-brand-primary focus:border-brand-primary" autoFocus />
                            <div className="flex gap-3">
                                <button onClick={() => { setSaveTemplateFor(null); setTemplateName(''); }}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">Cancel</button>
                                <button onClick={handleSaveAsTemplate} disabled={!templateName.trim()}
                                    className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-brand-primary rounded-xl hover:opacity-90 transition disabled:opacity-50">Save</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create template modal — with live preview */}
            {showTemplateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-8 px-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mb-8 flex overflow-hidden">
                        {/* Form side */}
                        <div className="flex-1 flex flex-col min-w-0">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                <div>
                                    <h2 className="text-lg font-bold font-heading text-brand-primary">New Template</h2>
                                    <p className="text-xs text-gray-400 mt-0.5">Design a reusable template — see the preview live →</p>
                                </div>
                                <button onClick={() => setShowTemplateModal(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition">&times;</button>
                            </div>
                            <form onSubmit={handleCreateTemplate} className="flex-1 overflow-y-auto p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Template Name *</label>
                                    <input type="text" value={tplForm.data.name} onChange={e => tplForm.setData('name', e.target.value)} required
                                        placeholder="e.g. Weekly Update, New Hire Welcome"
                                        className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-brand-primary focus:border-brand-primary placeholder:text-gray-300" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Default Title</label>
                                    <input type="text" value={tplForm.data.title} onChange={e => tplForm.setData('title', e.target.value)}
                                        placeholder="Pre-filled title for posts using this template"
                                        className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-brand-primary focus:border-brand-primary placeholder:text-gray-300" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Default Content</label>
                                    <textarea value={tplForm.data.body} onChange={e => tplForm.setData('body', e.target.value)} rows={4}
                                        placeholder="Write template content..."
                                        className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-brand-primary focus:border-brand-primary placeholder:text-gray-300 resize-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Type</label>
                                        <select value={tplForm.data.type} onChange={e => tplForm.setData('type', e.target.value)}
                                            className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-brand-primary focus:border-brand-primary">
                                            <option value="announcement">Announcement</option>
                                            <option value="news">News</option>
                                            <option value="event">Event</option>
                                            <option value="poll">Poll</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Category</label>
                                        <input type="text" value={tplForm.data.category} onChange={e => tplForm.setData('category', e.target.value)}
                                            placeholder="e.g. HR"
                                            className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-brand-primary focus:border-brand-primary placeholder:text-gray-300" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { key: 'allow_comments' as const, icon: 'chat-bubble', label: 'Comments' },
                                        { key: 'allow_reactions' as const, icon: 'hand-thumb-up', label: 'Reactions' },
                                    ].map(opt => (
                                        <button key={opt.key} type="button"
                                            onClick={() => tplForm.setData(opt.key, !tplForm.data[opt.key])}
                                            className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all ${
                                                tplForm.data[opt.key] ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-100'
                                            }`}>
                                            <span><Icon name={opt.icon} className="w-4 h-4" /></span>
                                            <span className={`text-xs font-semibold ${tplForm.data[opt.key] ? 'text-brand-primary' : 'text-gray-400'}`}>{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </form>
                            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                                <button onClick={() => setShowTemplateModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600 transition">Cancel</button>
                                <button onClick={handleCreateTemplate as any} disabled={tplForm.processing}
                                    className="px-6 py-2.5 bg-brand-primary text-white text-sm font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 shadow-sm">
                                    {tplForm.processing ? 'Saving…' : 'Save Template'}
                                </button>
                            </div>
                        </div>

                        {/* Preview side */}
                        <div className="hidden lg:flex w-[340px] bg-gradient-to-b from-gray-50 to-gray-100 border-l border-gray-200 flex-col items-center justify-center py-6 px-4 flex-shrink-0">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4">Template Preview</p>
                            <MobilePreview
                                title={tplForm.data.title || tplForm.data.name}
                                body={tplForm.data.body}
                                type={tplForm.data.type}
                                category={tplForm.data.category}
                                allowComments={tplForm.data.allow_comments}
                                allowReactions={tplForm.data.allow_reactions}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* View update detail */}
            {viewUpdate && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-4 px-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mb-8 flex overflow-hidden">
                        {/* Content side */}
                        <div className="flex-1 min-w-0">
                            {/* Cover */}
                            {viewUpdate.cover_image && (
                                <div className="h-48 overflow-hidden">
                                    <img src={viewUpdate.cover_image} alt="" className="w-full h-full object-cover" />
                                </div>
                            )}
                            {!viewUpdate.cover_image && (
                                <div className={`h-20 bg-gradient-to-r ${typeBg[viewUpdate.type] || 'from-gray-500 to-gray-600'}`} />
                            )}

                            <div className="p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl font-bold font-heading text-gray-900">{viewUpdate.title}</h2>
                                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusColors[viewUpdate.status]}`}>{viewUpdate.status}</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-600"><Icon name={typeIcons[viewUpdate.type]} className="w-3.5 h-3.5 inline-block mr-1" /> {typeLabels[viewUpdate.type]}</span>
                                            {viewUpdate.category && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-purple-50 text-purple-600">{viewUpdate.category}</span>}
                                            {viewUpdate.is_pinned && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-600">Pinned</span>}
                                        </div>
                                    </div>
                                    <button onClick={() => setViewUpdate(null)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition flex-shrink-0">&times;</button>
                                </div>

                                <div className="flex items-center gap-3 text-xs text-gray-400 mt-3">
                                    {viewUpdate.creator && <span>by <strong className="text-gray-600">{viewUpdate.creator.name}</strong></span>}
                                    {viewUpdate.published_at && <span>{formatDate(viewUpdate.published_at)}</span>}
                                    {viewUpdate.expires_at && <span className="text-orange-500">Expires {formatDate(viewUpdate.expires_at)}</span>}
                                    <span>{audienceLabel(viewUpdate.audiences)}</span>
                                </div>

                                <div className="mt-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{viewUpdate.body}</div>

                                {viewUpdate.youtube_url && (
                                    <div className="mt-4 aspect-video rounded-xl overflow-hidden bg-black">
                                        <iframe src={viewUpdate.youtube_url.replace('watch?v=', 'embed/')} className="w-full h-full" allowFullScreen title="YouTube video" />
                                    </div>
                                )}

                                {viewUpdate.images.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2 mt-4">
                                        {viewUpdate.images.map((img, i) => (
                                            <img key={i} src={img} alt="" className="w-full h-32 object-cover rounded-xl" />
                                        ))}
                                    </div>
                                )}

                                {viewUpdate.attachments.length > 0 && (
                                    <div className="space-y-1.5 mt-4">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Attachments</p>
                                        {viewUpdate.attachments.map((att, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
                                                <Icon name="paperclip" className="w-4 h-4 inline-block" /> <span className="font-medium">{att.name}</span>
                                                <span className="text-gray-400 ml-auto">({formatSize(att.size)})</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Metrics footer */}
                                <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-1.5 text-sm text-gray-500"><span><Icon name="chat-bubble" className="w-4 h-4 inline-block" /></span> {viewUpdate.comments_count}</div>
                                    <div className="flex items-center gap-1.5 text-sm text-gray-500"><span><Icon name="hand-thumb-up" className="w-4 h-4 inline-block" /></span> {viewUpdate.reactions_count}</div>
                                    <div className="flex items-center gap-1.5 text-sm text-gray-500"><span><Icon name="eye" className="w-4 h-4 inline-block" /></span> {viewUpdate.reads_count}/{teamCount}</div>
                                    <a href={route('admin.updates.analytics', viewUpdate.id)} className="ml-auto text-sm text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1">
                                        <Icon name="chart-bar" className="w-4 h-4 inline-block" /> View Analytics →
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Phone preview side */}
                        <div className="hidden lg:flex w-[340px] bg-gradient-to-b from-gray-50 to-gray-100 border-l border-gray-200 flex-col items-center justify-center py-6 px-4 flex-shrink-0">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4">Mobile View</p>
                            <MobilePreview
                                title={viewUpdate.title}
                                body={viewUpdate.body}
                                type={viewUpdate.type}
                                category={viewUpdate.category || ''}
                                coverImage={viewUpdate.cover_image}
                                hasImages={viewUpdate.images.length > 0}
                                hasYoutube={!!viewUpdate.youtube_url}
                                allowComments={viewUpdate.allow_comments}
                                allowReactions={viewUpdate.allow_reactions}
                                creatorName={viewUpdate.creator?.name}
                            />
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
