import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, FormEventHandler, ChangeEvent } from 'react';

interface Category { id: number; name: string; }

interface DocData {
    id: number;
    title: string;
    description: string | null;
    file_name: string;
    file_type: string;
    file_size: number;
    status: string;
    visibility: string;
    expiry_date: string | null;
    category: Category | null;
    uploader: { id: number; name: string } | null;
    employee: { id: number; name: string } | null;
    created_at: string;
}

interface Employee { id: number; name: string; email: string; }

interface Props {
    documents: { data: DocData[]; links: any[]; current_page: number; last_page: number };
    filters: { status: string; category: string; search: string };
    stats: { total: number; active: number; expiring_soon: number; expired: number };
    categories: Category[];
    employees: Employee[];
}

const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    archived: 'bg-slate-100 text-slate-600',
    expired: 'bg-red-100 text-red-700',
};

const visibilityLabels: Record<string, string> = { admin: 'Admin Only', employee: 'Employee', all: 'Everyone' };

function formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

function isExpiringSoon(date: string | null): boolean {
    if (!date) return false;
    const d = new Date(date);
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 86400000);
    return d > now && d <= thirtyDays;
}

function isExpired(date: string | null): boolean {
    if (!date) return false;
    return new Date(date) < new Date();
}

export default function Documents({ documents, filters, stats, categories, employees }: Props) {
    const [showUpload, setShowUpload] = useState(false);
    const [showCatModal, setShowCatModal] = useState(false);
    const [editDoc, setEditDoc] = useState<DocData | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [search, setSearch] = useState(filters.search);

    const form = useForm<{
        title: string;
        description: string;
        category_id: string | number;
        user_id: string | number;
        visibility: string;
        expiry_date: string;
        file: File | null;
    }>({
        title: '',
        description: '',
        category_id: '',
        user_id: '',
        visibility: 'all',
        expiry_date: '',
        file: null,
    });

    const editForm = useForm({
        title: '',
        description: '',
        category_id: '' as string | number,
        user_id: '' as string | number,
        visibility: 'all',
        expiry_date: '',
        status: 'active',
    });

    const catForm = useForm({ name: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route('admin.documents.store'), {
            forceFormData: true,
            onSuccess: () => { form.reset(); setShowUpload(false); },
        });
    };

    const submitEdit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editDoc) return;
        editForm.patch(route('admin.documents.update', editDoc.id), {
            onSuccess: () => { editForm.reset(); setEditDoc(null); },
        });
    };

    const openEdit = (doc: DocData) => {
        editForm.setData({
            title: doc.title,
            description: doc.description || '',
            category_id: doc.category?.id || '',
            user_id: doc.employee?.id || '',
            visibility: doc.visibility,
            expiry_date: doc.expiry_date || '',
            status: doc.status,
        });
        setEditDoc(doc);
    };

    const submitCat: FormEventHandler = (e) => {
        e.preventDefault();
        catForm.post(route('admin.documents.store-category'), {
            onSuccess: () => { catForm.reset(); setShowCatModal(false); },
        });
    };

    const confirmDelete = () => {
        if (!deleteId) return;
        router.delete(route('admin.documents.destroy', deleteId), { preserveScroll: true, onSuccess: () => setDeleteId(null) });
    };

    const applyFilter = (key: string, value: string) => {
        router.get(route('admin.documents.index'), { ...filters, [key]: value }, { preserveState: true, preserveScroll: true });
    };

    const handleSearch = () => {
        router.get(route('admin.documents.index'), { ...filters, search }, { preserveState: true, preserveScroll: true });
    };

    return (
        <AdminLayout>
            <Head title="Document Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Document Management</h1>
                        <p className="text-sm text-slate-500 mt-1">Upload, organize, and track employee &amp; company documents</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowCatModal(true)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Categories</button>
                        <button onClick={() => setShowUpload(true)} className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#495B67' }}>+ Upload Document</button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Documents', value: stats.total, color: 'bg-slate-50' },
                        { label: 'Active', value: stats.active, color: 'bg-green-50' },
                        { label: 'Expiring Soon', value: stats.expiring_soon, color: 'bg-amber-50' },
                        { label: 'Expired', value: stats.expired, color: 'bg-red-50' },
                    ].map((s) => (
                        <div key={s.label} className={`${s.color} rounded-xl p-4 text-center`}>
                            <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Filters & Search */}
                <div className="flex flex-wrap gap-3 items-center">
                    <select value={filters.status} onChange={e => applyFilter('status', e.target.value)} className="rounded-lg border-slate-200 text-sm">
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                    </select>
                    <select value={filters.category} onChange={e => applyFilter('category', e.target.value)} className="rounded-lg border-slate-200 text-sm">
                        <option value="all">All Categories</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="flex flex-1 min-w-[200px]">
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            placeholder="Search documents…"
                            className="w-full rounded-lg border-slate-200 text-sm"
                        />
                    </div>
                </div>

                {/* Expiring Soon Alert */}
                {stats.expiring_soon > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
                        <span className="text-amber-600 text-xl">⚠️</span>
                        <div>
                            <p className="font-semibold text-amber-800">{stats.expiring_soon} document{stats.expiring_soon !== 1 ? 's' : ''} expiring within 30 days</p>
                            <p className="text-sm text-amber-600">Review and renew expiring documents to maintain compliance.</p>
                        </div>
                    </div>
                )}

                {/* Documents Table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium text-slate-600">Document</th>
                                    <th className="text-left px-4 py-3 font-medium text-slate-600">Category</th>
                                    <th className="text-left px-4 py-3 font-medium text-slate-600">Employee</th>
                                    <th className="text-left px-4 py-3 font-medium text-slate-600">Visibility</th>
                                    <th className="text-left px-4 py-3 font-medium text-slate-600">Expiry</th>
                                    <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                                    <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {documents.data.length === 0 && (
                                    <tr><td colSpan={7} className="text-center py-12 text-slate-400">No documents found</td></tr>
                                )}
                                {documents.data.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-900">{doc.title}</div>
                                            <div className="text-xs text-slate-400">{doc.file_name} · {formatSize(doc.file_size)}</div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{doc.category?.name || '—'}</td>
                                        <td className="px-4 py-3 text-slate-600">{doc.employee?.name || 'Company'}</td>
                                        <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">{visibilityLabels[doc.visibility]}</span></td>
                                        <td className="px-4 py-3">
                                            {doc.expiry_date ? (
                                                <span className={`text-xs font-medium ${isExpired(doc.expiry_date) ? 'text-red-600' : isExpiringSoon(doc.expiry_date) ? 'text-amber-600' : 'text-slate-500'}`}>
                                                    {new Date(doc.expiry_date).toLocaleDateString()}
                                                    {isExpired(doc.expiry_date) && ' ⚠️'}
                                                    {isExpiringSoon(doc.expiry_date) && !isExpired(doc.expiry_date) && ' ⏰'}
                                                </span>
                                            ) : <span className="text-xs text-slate-400">No expiry</span>}
                                        </td>
                                        <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[doc.status] || 'bg-slate-100 text-slate-600'}`}>{doc.status}</span></td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex gap-1 justify-end">
                                                <a href={route('documents.download', doc.id)} className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600">↓</a>
                                                <button onClick={() => openEdit(doc)} className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600">Edit</button>
                                                <button onClick={() => setDeleteId(doc.id)} className="text-xs px-2 py-1 rounded bg-red-50 hover:bg-red-100 text-red-600">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    {documents.last_page > 1 && (
                        <div className="flex items-center justify-center gap-1 p-4 border-t border-slate-100">
                            {documents.links.map((link: any, i: number) => (
                                <button
                                    key={i}
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                    className={`px-3 py-1 rounded text-sm ${link.active ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'} ${!link.url ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            {showUpload && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowUpload(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <form onSubmit={submit} className="p-6 space-y-4">
                            <h2 className="text-lg font-bold text-slate-900">Upload Document</h2>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                                <input type="text" value={form.data.title} onChange={e => form.setData('title', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" required />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea value={form.data.description} onChange={e => form.setData('description', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" rows={2} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                    <select value={form.data.category_id} onChange={e => form.setData('category_id', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm">
                                        <option value="">None</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Assign to Employee</label>
                                    <select value={form.data.user_id} onChange={e => form.setData('user_id', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm">
                                        <option value="">Company-wide</option>
                                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Visibility *</label>
                                    <select value={form.data.visibility} onChange={e => form.setData('visibility', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm">
                                        <option value="all">Everyone</option>
                                        <option value="employee">Employee Only</option>
                                        <option value="admin">Admin Only</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
                                    <input type="date" value={form.data.expiry_date} onChange={e => form.setData('expiry_date', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">File * <span className="text-slate-400 font-normal">(max 20MB)</span></label>
                                <input
                                    type="file"
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => form.setData('file', e.target.files?.[0] || null)}
                                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                                    required
                                />
                            </div>

                            {form.errors && Object.keys(form.errors).length > 0 && (
                                <div className="text-sm text-red-600">{Object.values(form.errors).flat().join(', ')}</div>
                            )}

                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowUpload(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">Cancel</button>
                                <button type="submit" disabled={form.processing} className="px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50" style={{ backgroundColor: '#495B67' }}>
                                    {form.processing ? 'Uploading…' : 'Upload'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditDoc(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <form onSubmit={submitEdit} className="p-6 space-y-4">
                            <h2 className="text-lg font-bold text-slate-900">Edit Document</h2>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                                <input type="text" value={editForm.data.title} onChange={e => editForm.setData('title', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea value={editForm.data.description} onChange={e => editForm.setData('description', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" rows={2} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                    <select value={editForm.data.category_id} onChange={e => editForm.setData('category_id', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm">
                                        <option value="">None</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Employee</label>
                                    <select value={editForm.data.user_id} onChange={e => editForm.setData('user_id', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm">
                                        <option value="">Company-wide</option>
                                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Visibility</label>
                                    <select value={editForm.data.visibility} onChange={e => editForm.setData('visibility', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm">
                                        <option value="all">Everyone</option>
                                        <option value="employee">Employee Only</option>
                                        <option value="admin">Admin Only</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Expiry</label>
                                    <input type="date" value={editForm.data.expiry_date} onChange={e => editForm.setData('expiry_date', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                    <select value={editForm.data.status} onChange={e => editForm.setData('status', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm">
                                        <option value="active">Active</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setEditDoc(null)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">Cancel</button>
                                <button type="submit" disabled={editForm.processing} className="px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50" style={{ backgroundColor: '#495B67' }}>
                                    {editForm.processing ? 'Saving…' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Category Modal */}
            {showCatModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCatModal(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                        <div className="p-6 space-y-4">
                            <h2 className="text-lg font-bold text-slate-900">Document Categories</h2>

                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {categories.length === 0 && <p className="text-sm text-slate-400">No categories yet</p>}
                                {categories.map(c => (
                                    <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                                        <span className="text-sm text-slate-700">{c.name}</span>
                                        <button onClick={() => router.delete(route('admin.documents.destroy-category', c.id), { preserveScroll: true })} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={submitCat} className="flex gap-2">
                                <input type="text" value={catForm.data.name} onChange={e => catForm.setData('name', e.target.value)} placeholder="New category name" className="flex-1 rounded-lg border-slate-200 text-sm" required />
                                <button type="submit" disabled={catForm.processing} className="px-4 py-2 text-sm text-white rounded-lg" style={{ backgroundColor: '#495B67' }}>Add</button>
                            </form>

                            <div className="flex justify-end">
                                <button onClick={() => setShowCatModal(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteId(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Document?</h3>
                        <p className="text-sm text-slate-500 mb-4">This will permanently delete the file. This action cannot be undone.</p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">Cancel</button>
                            <button onClick={confirmDelete} className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
