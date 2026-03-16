import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';

interface Category { id: number; name: string; description: string | null; }

interface CourseData {
    id: number;
    title: string;
    description: string | null;
    status: string;
    is_mandatory: boolean;
    estimated_minutes: number | null;
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
    published: 'bg-green-100 text-green-700',
    archived: 'bg-amber-100 text-amber-700',
};
const statusLabels: Record<string, string> = { draft: 'Draft', published: 'Published', archived: 'Archived' };

export default function Courses({ courses, filters, stats, categories }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const form = useForm({
        title: '',
        description: '',
        category_id: '' as string | number,
        is_mandatory: false,
        estimated_minutes: '' as string | number,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route('admin.courses.store'), {
            onSuccess: () => { form.reset(); setShowCreate(false); },
        });
    };

    const catForm = useForm({ name: '', description: '' });
    const submitCat: FormEventHandler = (e) => {
        e.preventDefault();
        catForm.post(route('admin.courses.store-category'), {
            onSuccess: () => { catForm.reset(); setShowCategoryModal(false); },
        });
    };

    const applyFilter = (key: string, value: string) => {
        router.get(route('admin.courses.index'), { ...filters, [key]: value }, { preserveState: true, preserveScroll: true });
    };

    const confirmDelete = () => {
        if (!deleteId) return;
        router.delete(route('admin.courses.destroy', deleteId), { preserveScroll: true, onSuccess: () => setDeleteId(null) });
    };

    return (
        <AdminLayout>
            <Head title="Courses & Training" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Courses & Training</h1>
                        <p className="text-sm text-slate-500 mt-1">Build and manage employee training programs</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowCategoryModal(true)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Categories</button>
                        <button onClick={() => setShowCreate(true)} className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#495B67' }}>+ New Course</button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Courses', value: stats.total, color: 'bg-slate-50' },
                        { label: 'Published', value: stats.published, color: 'bg-green-50' },
                        { label: 'Draft', value: stats.draft, color: 'bg-slate-50' },
                        { label: 'Mandatory', value: stats.mandatory, color: 'bg-orange-50' },
                    ].map((s) => (
                        <div key={s.label} className={`${s.color} rounded-xl p-4 text-center`}>
                            <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3">
                    <select value={filters.status} onChange={(e) => applyFilter('status', e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                        <option value="all">All Statuses</option>
                        {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <select value={filters.category} onChange={(e) => applyFilter('category', e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                        <option value="all">All Categories</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                {/* Course Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.length === 0 && (
                        <div className="col-span-full text-center py-12">
                            <div className="text-3xl mb-2">📚</div>
                            <p className="text-slate-400 text-sm">No courses yet. Create your first course to get started.</p>
                        </div>
                    )}
                    {courses.map((c) => (
                        <div key={c.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-[#495B67]/30 transition">
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[c.status]}`}>{statusLabels[c.status]}</span>
                                        {c.is_mandatory && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 ml-1">Required</span>}
                                    </div>
                                    {c.category && <span className="text-xs text-slate-400">{c.category.name}</span>}
                                </div>

                                <h3 className="font-semibold text-slate-900 mb-1">{c.title}</h3>
                                {c.description && <p className="text-xs text-slate-500 line-clamp-2 mb-3">{c.description}</p>}

                                <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                                    <span>📖 {c.sections_count} sections</span>
                                    {c.estimated_minutes && <span>⏱ {c.estimated_minutes} min</span>}
                                    <span>👥 {c.assignments_count} assigned</span>
                                </div>

                                {/* Progress bar */}
                                {c.assignments_count > 0 && (
                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                                            <span>Completion</span>
                                            <span>{c.completed_count}/{c.assignments_count}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                                            <div className="h-1.5 rounded-full" style={{ width: `${(c.completed_count / c.assignments_count) * 100}%`, backgroundColor: '#495B67' }} />
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => router.get(route('admin.courses.builder', c.id))}
                                        className="flex-1 px-3 py-2 text-xs font-medium text-white rounded-lg"
                                        style={{ backgroundColor: '#495B67' }}
                                    >
                                        Edit Course
                                    </button>
                                    {c.status === 'draft' && (
                                        <button
                                            onClick={() => router.post(route('admin.courses.publish', c.id), {}, { preserveScroll: true })}
                                            className="px-3 py-2 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100"
                                        >
                                            Publish
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setDeleteId(c.id)}
                                        className="px-3 py-2 text-xs text-red-500 hover:text-red-700"
                                    >
                                        🗑
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Create Course Modal ── */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">New Course</h2>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                                <input type="text" value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                    <select value={form.data.category_id} onChange={(e) => form.setData('category_id', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                                        <option value="">None</option>
                                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Est. Minutes</label>
                                    <input type="number" min="1" value={form.data.estimated_minutes} onChange={(e) => form.setData('estimated_minutes', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                                </div>
                            </div>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                                <input type="checkbox" checked={form.data.is_mandatory} onChange={(e) => form.setData('is_mandatory', e.target.checked)} className="rounded border-slate-300 text-[#495B67] focus:ring-[#495B67]" />
                                Mandatory training
                            </label>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
                                <button type="submit" disabled={form.processing} className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50" style={{ backgroundColor: '#495B67' }}>
                                    {form.processing ? 'Creating…' : 'Create Course'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Category Modal ── */}
            {showCategoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCategoryModal(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Course Categories</h2>
                        <div className="space-y-2 mb-6">
                            {categories.length === 0 && <p className="text-sm text-slate-400">No categories yet.</p>}
                            {categories.map((c) => (
                                <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <span className="text-sm font-medium text-slate-700">{c.name}</span>
                                    <button onClick={() => router.delete(route('admin.courses.destroy-category', c.id), { preserveScroll: true })} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={submitCat} className="space-y-3 border-t border-slate-100 pt-4">
                            <h3 className="text-sm font-medium text-slate-700">Add Category</h3>
                            <input type="text" placeholder="Category name" value={catForm.data.name} onChange={(e) => catForm.setData('name', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" required />
                            <input type="text" placeholder="Description (optional)" value={catForm.data.description} onChange={(e) => catForm.setData('description', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setShowCategoryModal(false)} className="px-4 py-2 text-sm text-slate-600">Close</button>
                                <button type="submit" disabled={catForm.processing} className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#495B67' }}>Add</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete Confirm ── */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteId(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-slate-900 mb-2">Delete Course</h2>
                        <p className="text-sm text-slate-500 mb-4">This will permanently delete the course and all its content, sections, and assignments.</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
                            <button onClick={confirmDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
