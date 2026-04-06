import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';
import ToastContainer, { showToast } from '@/Components/Toast';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef, FormEventHandler } from 'react';

interface Category { id: number; name: string; description: string | null; }

interface CourseData {
    id: number;
    title: string;
    description: string | null;
    status: string;
    is_mandatory: boolean;
    estimated_minutes: number | null;
    cover_image: string | null;
    category: Category | null;
    creator: { id: number; name: string } | null;
    sections_count: number;
    assignments_count: number;
    completed_count: number;
    created_at: string;
}

interface Props {
    courses: CourseData[];
    filters: { status: string; category: string };
    stats: { total: number; published: number; draft: number; mandatory: number };
    categories: Category[];
}

const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    published: 'bg-emerald-100 text-emerald-700',
    archived: 'bg-amber-100 text-amber-700',
};
const statusLabels: Record<string, string> = { draft: 'Draft', published: 'Published', archived: 'Archived' };

const placeholderGradients = [
    'from-[#495B67] to-[#5d7a8a]',
    'from-[#5d7a8a] to-[#7a9bab]',
    'from-[#3d4f5a] to-[#495B67]',
    'from-[#495B67] to-[#6b8999]',
    'from-[#3a5060] to-[#5d7a8a]',
    'from-[#465a66] to-[#5c7585]',
];

export default function Courses({ courses, filters, stats, categories }: Props) {
    const page = usePage();
    const flash = (page.props as any).flash ?? {};
    const pageErrors = (page.props as any).errors ?? {};

    const [showCreateChooser, setShowCreateChooser] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [showDuplicatePicker, setShowDuplicatePicker] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [dupSearch, setDupSearch] = useState('');
    const [dupConfirmCourse, setDupConfirmCourse] = useState<CourseData | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (flash.success) showToast('success', flash.success);
        if (flash.error) showToast('error', flash.error);
    }, [flash.success, flash.error]);

    useEffect(() => {
        const errorKeys = Object.keys(pageErrors);
        if (errorKeys.length > 0) {
            errorKeys.forEach((key) => showToast('error', pageErrors[key]));
        }
    }, [JSON.stringify(pageErrors)]);

    const form = useForm({
        title: '',
        description: '',
        category_id: '' as string | number,
        is_mandatory: false,
        estimated_minutes: '' as string | number,
        cover_image: null as File | null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route('admin.courses.store'), {
            forceFormData: true,
            onSuccess: () => { form.reset(); setCoverPreview(null); setShowCreate(false); showToast('success', 'Course created.'); },
            onError: () => showToast('error', 'Failed to create course.'),
        });
    };

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        form.setData('cover_image', file);
        const reader = new FileReader();
        reader.onload = (ev) => setCoverPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const catForm = useForm({ name: '', description: '' });
    const submitCat: FormEventHandler = (e) => {
        e.preventDefault();
        catForm.post(route('admin.courses.store-category'), {
            onSuccess: () => { catForm.reset(); setShowCategoryModal(false); showToast('success', 'Category created.'); },
            onError: () => showToast('error', 'Failed to create category.'),
        });
    };

    const applyFilter = (key: string, value: string) => {
        router.get(route('admin.courses.index'), { ...filters, [key]: value }, { preserveState: true, preserveScroll: true });
    };

    const confirmDelete = () => {
        if (!deleteId) return;
        router.delete(route('admin.courses.destroy', deleteId), { preserveScroll: true, onSuccess: () => { setDeleteId(null); showToast('success', 'Course deleted.'); }, onError: () => showToast('error', 'Failed to delete course.') });
    };

    return (
        <AdminLayout>
            <Head title="Courses & Training" />
            <ToastContainer />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Courses & Training</h1>
                        <p className="text-sm text-slate-500 mt-1">Build and manage employee training programs</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowCategoryModal(true)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">Categories</button>
                        <button onClick={() => setShowCreateChooser(true)} className="px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm hover:opacity-90 transition" style={{ backgroundColor: '#495B67' }}>+ New Course</button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Courses', value: stats.total, icon: 'book-open', bg: 'bg-slate-50', accent: 'text-slate-600' },
                        { label: 'Published', value: stats.published, icon: 'check-circle', bg: 'bg-emerald-50', accent: 'text-emerald-600' },
                        { label: 'Draft', value: stats.draft, icon: 'pencil', bg: 'bg-slate-50', accent: 'text-slate-500' },
                        { label: 'Mandatory', value: stats.mandatory, icon: 'exclamation-triangle', bg: 'bg-orange-50', accent: 'text-orange-600' },
                    ].map((s) => (
                        <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-slate-100`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                                    <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                                </div>
                                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                                    <Icon name={s.icon} className={`w-5 h-5 ${s.accent}`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Icon name="magnifying-glass" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67] transition"
                        />
                    </div>
                    <select value={filters.status} onChange={(e) => applyFilter('status', e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]">
                        <option value="all">All Statuses</option>
                        {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <select value={filters.category} onChange={(e) => applyFilter('category', e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]">
                        <option value="all">All Categories</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                {/* Course Grid */}
                {(() => {
                    const filteredCourses = search
                        ? courses.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase()))
                        : courses;
                    return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredCourses.length === 0 && (
                        <div className="col-span-full text-center py-16">
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                <Icon name="book-open" className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-slate-500 text-sm font-medium">No courses yet</p>
                            <p className="text-slate-400 text-xs mt-1">Create your first course to get started</p>
                            <button onClick={() => setShowCreateChooser(true)} className="mt-4 px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#495B67' }}>+ New Course</button>
                        </div>
                    )}
                    {filteredCourses.map((c, idx) => (
                        <div key={c.id} className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-300">
                            {/* Cover Image */}
                            <div className="relative h-40 overflow-hidden">
                                {c.cover_image ? (
                                    <img
                                        src={c.cover_image}
                                        alt={c.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className={`w-full h-full bg-gradient-to-br ${placeholderGradients[idx % placeholderGradients.length]} flex items-center justify-center`}>
                                        <Icon name="book-open" className="w-12 h-12 text-white/20" />
                                    </div>
                                )}
                                {/* Overlay badges */}
                                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm ${
                                        c.status === 'published' ? 'bg-emerald-500/90 text-white' :
                                        c.status === 'archived' ? 'bg-amber-500/90 text-white' :
                                        'bg-white/90 text-slate-600'
                                    }`}>
                                        {statusLabels[c.status]}
                                    </span>
                                    {c.is_mandatory && (
                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/90 text-white backdrop-blur-sm">Required</span>
                                    )}
                                </div>
                                {c.category && (
                                    <span className="absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full bg-black/30 text-white backdrop-blur-sm">{c.category.name}</span>
                                )}
                                {/* Gradient fade at bottom */}
                                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/20 to-transparent" />
                            </div>

                            {/* Card Body */}
                            <div className="p-5">
                                <h3 className="font-semibold text-slate-900 text-base mb-1 line-clamp-1">{c.title}</h3>
                                {c.description && <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">{c.description}</p>}
                                {!c.description && <div className="mb-3" />}

                                <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                                    <span className="flex items-center gap-1">
                                        <Icon name="squares-2x2" className="w-3.5 h-3.5" />
                                        {c.sections_count} sections
                                    </span>
                                    {c.estimated_minutes && (
                                        <span className="flex items-center gap-1">
                                            <Icon name="stopwatch" className="w-3.5 h-3.5" />
                                            {c.estimated_minutes} min
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                        <Icon name="users" className="w-3.5 h-3.5" />
                                        {c.assignments_count}
                                    </span>
                                </div>

                                {/* Progress bar */}
                                {c.assignments_count > 0 && (
                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <span className="text-slate-500 font-medium">Completion</span>
                                            <span className="text-slate-600 font-semibold">{c.completed_count}/{c.assignments_count}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${(c.completed_count / c.assignments_count) * 100}%`,
                                                    backgroundColor: c.completed_count === c.assignments_count ? '#16a34a' : '#495B67',
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => router.get(route('admin.courses.builder', c.id))}
                                        className="flex-1 px-3 py-2.5 text-xs font-semibold text-white rounded-lg hover:opacity-90 transition"
                                        style={{ backgroundColor: '#495B67' }}
                                    >
                                        Edit Course
                                    </button>
                                    {c.status === 'draft' && (
                                        <button
                                            onClick={() => router.post(route('admin.courses.publish', c.id), {}, { preserveScroll: true, onSuccess: () => showToast('success', 'Course published.'), onError: () => showToast('error', 'Failed to publish course.') })}
                                            className="px-3 py-2.5 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition"
                                        >
                                            Publish
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setDeleteId(c.id)}
                                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                    >
                                        <Icon name="trash" className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                    );
                })()}
            </div>

            {/* ── Create Chooser Modal ── */}
            {showCreateChooser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateChooser(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Close button */}
                        <div className="flex justify-end p-5 pb-0">
                            <button onClick={() => setShowCreateChooser(false)} className="text-slate-300 hover:text-slate-500 transition">
                                <Icon name="x-mark" className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="px-10 pb-2">
                            <h2 className="text-2xl font-bold text-slate-900 mb-1">Create a New Course</h2>
                            <p className="text-sm text-slate-400">How would you like to get started?</p>
                        </div>
                        <div className="px-10 pb-10 pt-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                {/* Start from scratch */}
                                <button
                                    onClick={() => { setShowCreateChooser(false); setShowCreate(true); }}
                                    className="group flex flex-col items-center text-center p-6 rounded-2xl border border-slate-200 hover:border-[#495B67]/30 hover:shadow-md transition-all duration-300"
                                >
                                    <div className="relative w-32 h-32 mb-3">
                                        <svg viewBox="0 0 130 130" className="w-full h-full">
                                            {/* Shadow doc */}
                                            <rect x="30" y="28" width="52" height="68" rx="5" fill="#eef2f7"/>
                                            {/* Main document */}
                                            <rect x="26" y="24" width="52" height="68" rx="5" fill="white" stroke="#dce3eb" strokeWidth="1.2"/>
                                            {/* Text lines */}
                                            <line x1="36" y1="52" x2="68" y2="52" stroke="#dce3eb" strokeWidth="2" strokeLinecap="round"/>
                                            <line x1="36" y1="60" x2="62" y2="60" stroke="#dce3eb" strokeWidth="2" strokeLinecap="round"/>
                                            <line x1="36" y1="68" x2="55" y2="68" stroke="#dce3eb" strokeWidth="2" strokeLinecap="round"/>
                                            <line x1="36" y1="76" x2="48" y2="76" stroke="#dce3eb" strokeWidth="2" strokeLinecap="round"/>
                                            {/* Pencil body */}
                                            <g transform="rotate(-40 68 38)">
                                                <rect x="63" y="18" width="10" height="36" rx="2" fill="#8eaab8"/>
                                                <rect x="63" y="18" width="10" height="8" rx="2" fill="#6d8fa0"/>
                                                <polygon points="63,54 68,62 73,54" fill="#8eaab8"/>
                                            </g>
                                            {/* Purple 4-point star - top right */}
                                            <path d="M96 22 L98.5 14 L101 22 L109 24.5 L101 27 L98.5 35 L96 27 L88 24.5 Z" fill="#9b8ec4" opacity="0.7"/>
                                            {/* Small purple star - left */}
                                            <path d="M14 38 L15.5 33 L17 38 L22 39.5 L17 41 L15.5 46 L14 41 L9 39.5 Z" fill="#9b8ec4" opacity="0.5"/>
                                            {/* Pink dot */}
                                            <circle cx="22" cy="72" r="2.5" fill="#e8a4b8" opacity="0.6"/>
                                            {/* Blue dot */}
                                            <circle cx="85" cy="60" r="2" fill="#7eb8d4" opacity="0.5"/>
                                            {/* Small pink dot */}
                                            <circle cx="90" cy="42" r="1.5" fill="#e8a4b8" opacity="0.5"/>
                                        </svg>
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">Start from Scratch</span>
                                    <span className="text-xs text-slate-400 mt-1 leading-relaxed">Build a course from the<br/>ground up</span>
                                </button>

                                {/* Use a template */}
                                <button
                                    onClick={() => { setShowCreateChooser(false); router.visit(route('admin.courses.templates')); }}
                                    className="group flex flex-col items-center text-center p-6 rounded-2xl border border-slate-200 hover:border-[#495B67]/30 hover:shadow-md transition-all duration-300"
                                >
                                    <div className="relative w-32 h-32 mb-3">
                                        <svg viewBox="0 0 130 130" className="w-full h-full">
                                            {/* Back card */}
                                            <rect x="38" y="22" width="52" height="68" rx="5" fill="#e8edf2" stroke="#dce3eb" strokeWidth="0.8"/>
                                            {/* Middle card */}
                                            <rect x="31" y="28" width="52" height="68" rx="5" fill="#f0f4f7" stroke="#dce3eb" strokeWidth="1"/>
                                            {/* Front card */}
                                            <rect x="24" y="34" width="52" height="68" rx="5" fill="white" stroke="#dce3eb" strokeWidth="1.2"/>
                                            {/* Color blocks on front card */}
                                            <rect x="33" y="46" width="16" height="12" rx="3" fill="#9b8ec4" opacity="0.45"/>
                                            <rect x="53" y="46" width="14" height="5" rx="2" fill="#e8a4b8" opacity="0.45"/>
                                            <rect x="53" y="54" width="10" height="4" rx="1.5" fill="#7eb8d4" opacity="0.45"/>
                                            {/* Text lines */}
                                            <line x1="33" y1="68" x2="66" y2="68" stroke="#dce3eb" strokeWidth="2" strokeLinecap="round"/>
                                            <line x1="33" y1="76" x2="58" y2="76" stroke="#dce3eb" strokeWidth="2" strokeLinecap="round"/>
                                            <line x1="33" y1="84" x2="50" y2="84" stroke="#dce3eb" strokeWidth="2" strokeLinecap="round"/>
                                            {/* Purple star */}
                                            <path d="M95 30 L97 24 L99 30 L105 32 L99 34 L97 40 L95 34 L89 32 Z" fill="#9b8ec4" opacity="0.55"/>
                                            {/* Pink dot */}
                                            <circle cx="88" cy="55" r="2" fill="#e8a4b8" opacity="0.5"/>
                                            {/* Blue dot */}
                                            <circle cx="14" cy="50" r="2" fill="#7eb8d4" opacity="0.45"/>
                                            {/* Small purple star */}
                                            <path d="M10 75 L11 72 L12 75 L15 76 L12 77 L11 80 L10 77 L7 76 Z" fill="#9b8ec4" opacity="0.4"/>
                                        </svg>
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">Use a Template</span>
                                    <span className="text-xs text-slate-400 mt-1 leading-relaxed">Pick from ready-made<br/>courses</span>
                                </button>

                                {/* Duplicate existing */}
                                <button
                                    onClick={() => { setShowCreateChooser(false); setShowDuplicatePicker(true); }}
                                    className="group flex flex-col items-center text-center p-6 rounded-2xl border border-slate-200 hover:border-[#495B67]/30 hover:shadow-md transition-all duration-300"
                                >
                                    <div className="relative w-32 h-32 mb-3">
                                        <svg viewBox="0 0 130 130" className="w-full h-full">
                                            {/* Back document */}
                                            <rect x="38" y="18" width="48" height="62" rx="5" fill="#eef2f7" stroke="#dce3eb" strokeWidth="1"/>
                                            <line x1="48" y1="34" x2="76" y2="34" stroke="#dce3eb" strokeWidth="2" strokeLinecap="round"/>
                                            <line x1="48" y1="42" x2="70" y2="42" stroke="#dce3eb" strokeWidth="2" strokeLinecap="round"/>
                                            <line x1="48" y1="50" x2="64" y2="50" stroke="#dce3eb" strokeWidth="2" strokeLinecap="round"/>
                                            {/* Front document */}
                                            <rect x="22" y="38" width="48" height="62" rx="5" fill="white" stroke="#dce3eb" strokeWidth="1.2"/>
                                            <line x1="32" y1="54" x2="60" y2="54" stroke="#dce3eb" strokeWidth="2" strokeLinecap="round"/>
                                            <line x1="32" y1="62" x2="54" y2="62" stroke="#dce3eb" strokeWidth="2" strokeLinecap="round"/>
                                            <line x1="32" y1="70" x2="48" y2="70" stroke="#dce3eb" strokeWidth="2" strokeLinecap="round"/>
                                            <line x1="32" y1="78" x2="42" y2="78" stroke="#dce3eb" strokeWidth="2" strokeLinecap="round"/>
                                            {/* Arrow circle */}
                                            <circle cx="90" cy="80" r="15" fill="#eef2f7" stroke="#dce3eb" strokeWidth="1.2"/>
                                            <path d="M84 80 L96 80" stroke="#8eaab8" strokeWidth="2.5" strokeLinecap="round"/>
                                            <path d="M92 75 L97 80 L92 85" stroke="#8eaab8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                            {/* Purple star */}
                                            <path d="M95 22 L97 16 L99 22 L105 24 L99 26 L97 32 L95 26 L89 24 Z" fill="#9b8ec4" opacity="0.55"/>
                                            {/* Small purple star */}
                                            <path d="M14 32 L15.5 28 L17 32 L21 33.5 L17 35 L15.5 39 L14 35 L10 33.5 Z" fill="#9b8ec4" opacity="0.45"/>
                                            {/* Pink dot */}
                                            <circle cx="108" cy="46" r="2" fill="#e8a4b8" opacity="0.5"/>
                                            {/* Blue dot */}
                                            <circle cx="12" cy="60" r="1.8" fill="#7eb8d4" opacity="0.45"/>
                                        </svg>
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">Duplicate Existing</span>
                                    <span className="text-xs text-slate-400 mt-1 leading-relaxed">Copy and customize a<br/>course</span>
                                </button>
                            </div>
                        </div>
                        <div className="px-10 py-5 border-t border-slate-100 flex justify-end">
                            <button onClick={() => setShowCreateChooser(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-600 transition">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Duplicate Picker Modal ── */}
            {showDuplicatePicker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => { setShowDuplicatePicker(false); setDupSearch(''); }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-1">Duplicate a Course</h2>
                            <p className="text-sm text-slate-500 mb-4">Select a course to copy</p>
                            <input
                                type="text"
                                placeholder="Search courses..."
                                value={dupSearch}
                                onChange={(e) => setDupSearch(e.target.value)}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#495B67]/20 focus:border-[#495B67] transition mb-3"
                            />
                            <div className="max-h-64 overflow-y-auto space-y-1">
                                {courses
                                    .filter((c) => c.title.toLowerCase().includes(dupSearch.toLowerCase()))
                                    .map((c) => (
                                        <button
                                            key={c.id}
                                            onClick={() => setDupConfirmCourse(c)}
                                            className="w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-slate-50 transition"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#495B67] to-[#5d7a8a] flex-shrink-0 overflow-hidden">
                                                {c.cover_image && <img src={c.cover_image} alt="" className="w-full h-full object-cover" />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-medium text-slate-800 truncate">{c.title}</div>
                                                <div className="text-xs text-slate-400">{c.sections_count} sections &middot; {statusLabels[c.status]}</div>
                                            </div>
                                            <Icon name="document-duplicate" className="w-4 h-4 text-slate-300" />
                                        </button>
                                    ))}
                                {courses.filter((c) => c.title.toLowerCase().includes(dupSearch.toLowerCase())).length === 0 && (
                                    <p className="text-sm text-slate-400 text-center py-6">No courses match your search</p>
                                )}
                            </div>
                        </div>
                        <div className="px-6 py-3 border-t border-slate-100 flex justify-between">
                            <button onClick={() => { setShowDuplicatePicker(false); setDupSearch(''); setShowCreateChooser(true); }} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5 transition">
                                <Icon name="arrow-left" className="w-3.5 h-3.5" /> Back
                            </button>
                            <button onClick={() => { setShowDuplicatePicker(false); setDupSearch(''); }} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Duplicate Confirm Modal ── */}
            {dupConfirmCourse && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setDupConfirmCourse(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-[#495B67]/10 flex items-center justify-center mx-auto mb-4">
                                <Icon name="document-duplicate" className="w-7 h-7 text-[#495B67]" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">Duplicate Course</h3>
                            <p className="text-sm text-slate-500">
                                Create a copy of <span className="font-semibold text-slate-700">"{dupConfirmCourse.title}"</span>?
                            </p>
                            <p className="text-xs text-slate-400 mt-1">All sections and lessons will be copied to a new draft course.</p>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end">
                            <button
                                onClick={() => setDupConfirmCourse(null)}
                                className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    router.post(route('admin.courses.duplicate', dupConfirmCourse.id), {}, {
                                        preserveScroll: true,
                                        onSuccess: () => showToast('success', 'Course duplicated.'),
                                        onError: () => showToast('error', 'Failed to duplicate course.'),
                                    });
                                    setDupConfirmCourse(null);
                                    setShowDuplicatePicker(false);
                                    setDupSearch('');
                                }}
                                className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition"
                                style={{ backgroundColor: '#495B67' }}
                            >
                                Duplicate
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Create Course Modal ── */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => { setShowCreate(false); setCoverPreview(null); form.reset(); }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Cover Image Upload */}
                        <div
                            className="relative h-36 bg-gradient-to-br from-[#495B67] to-[#5d7a8a] cursor-pointer group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {coverPreview ? (
                                <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center">
                                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-2 group-hover:bg-white/20 transition">
                                        <Icon name="photo" className="w-6 h-6 text-white/60" />
                                    </div>
                                    <p className="text-sm text-white/60 group-hover:text-white/80 transition">Click to add cover image</p>
                                </div>
                            )}
                            {coverPreview && (
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                                    <span className="opacity-0 group-hover:opacity-100 transition text-white text-sm font-medium">Change Cover</span>
                                </div>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                        </div>

                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">New Course</h2>
                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                                    <input type="text" value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#495B67]/20 focus:border-[#495B67] transition" placeholder="e.g. New Employee Onboarding" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                    <textarea value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} rows={3} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#495B67]/20 focus:border-[#495B67] transition" placeholder="What will employees learn?" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                        <select value={form.data.category_id} onChange={(e) => form.setData('category_id', e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#495B67]/20 focus:border-[#495B67] transition">
                                            <option value="">None</option>
                                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Est. Minutes</label>
                                        <input type="number" min="1" value={form.data.estimated_minutes} onChange={(e) => form.setData('estimated_minutes', e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#495B67]/20 focus:border-[#495B67] transition" placeholder="30" />
                                    </div>
                                </div>
                                <label className="flex items-center gap-2.5 text-sm text-slate-700 py-1">
                                    <input type="checkbox" checked={form.data.is_mandatory} onChange={(e) => form.setData('is_mandatory', e.target.checked)} className="rounded border-slate-300 text-[#495B67] focus:ring-[#495B67] w-4 h-4" />
                                    Mandatory training
                                </label>
                                <div className="flex justify-between pt-2 border-t border-slate-100">
                                    <button type="button" onClick={() => { setShowCreate(false); setCoverPreview(null); form.reset(); setShowCreateChooser(true); }} className="px-4 py-2.5 text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5 transition">
                                        <Icon name="arrow-left" className="w-3.5 h-3.5" /> Back
                                    </button>
                                    <div className="flex gap-3">
                                    <button type="button" onClick={() => { setShowCreate(false); setCoverPreview(null); form.reset(); }} className="px-4 py-2.5 text-sm text-slate-600 hover:text-slate-800 transition">Cancel</button>
                                    <button type="submit" disabled={form.processing} className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg disabled:opacity-50 hover:opacity-90 transition" style={{ backgroundColor: '#495B67' }}>
                                        {form.processing ? 'Creating...' : 'Create Course'}
                                    </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Category Modal ── */}
            {showCategoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowCategoryModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Course Categories</h2>
                        <div className="space-y-2 mb-6">
                            {categories.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No categories yet. Add one below.</p>}
                            {categories.map((c) => (
                                <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <span className="text-sm font-medium text-slate-700">{c.name}</span>
                                    <button onClick={() => router.delete(route('admin.courses.destroy-category', c.id), { preserveScroll: true, onSuccess: () => showToast('success', 'Category deleted.'), onError: () => showToast('error', 'Failed to delete category.') })} className="text-xs text-red-500 hover:text-red-700 transition">Remove</button>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={submitCat} className="space-y-3 border-t border-slate-100 pt-4">
                            <h3 className="text-sm font-medium text-slate-700">Add Category</h3>
                            <input type="text" placeholder="Category name" value={catForm.data.name} onChange={(e) => catForm.setData('name', e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#495B67]/20 focus:border-[#495B67] transition" required />
                            <input type="text" placeholder="Description (optional)" value={catForm.data.description} onChange={(e) => catForm.setData('description', e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#495B67]/20 focus:border-[#495B67] transition" />
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setShowCategoryModal(false)} className="px-4 py-2.5 text-sm text-slate-600">Close</button>
                                <button type="submit" disabled={catForm.processing} className="px-4 py-2.5 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition" style={{ backgroundColor: '#495B67' }}>Add</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete Confirm ── */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setDeleteId(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <Icon name="trash" className="w-6 h-6 text-red-500" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900 text-center mb-2">Delete Course</h2>
                        <p className="text-sm text-slate-500 text-center mb-6">This will permanently delete the course and all its content, sections, and assignments.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition">Cancel</button>
                            <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
