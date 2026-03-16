import UserLayout from '@/Layouts/UserLayout';
import { Head, useForm } from '@inertiajs/react';
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
    created_at: string;
}

interface Props {
    documents: DocData[];
    categories: Category[];
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

const typeIcons: Record<string, string> = {
    pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊',
    png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️',
    zip: '📦', rar: '📦', txt: '📃', csv: '📊',
};

export default function UserDocuments({ documents, categories }: Props) {
    const [showUpload, setShowUpload] = useState(false);
    const [filterCat, setFilterCat] = useState('all');

    const form = useForm<{
        title: string;
        category_id: string | number;
        file: File | null;
    }>({
        title: '',
        category_id: '',
        file: null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route('documents.user-upload'), {
            forceFormData: true,
            onSuccess: () => { form.reset(); setShowUpload(false); },
        });
    };

    const filtered = filterCat === 'all' ? documents : documents.filter(d => d.category?.id === Number(filterCat));

    return (
        <UserLayout title="Documents">
            <Head title="My Documents" />

            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">My Documents</h1>
                        <p className="text-sm text-slate-500">{documents.length} document{documents.length !== 1 ? 's' : ''} available</p>
                    </div>
                    <button onClick={() => setShowUpload(true)} className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#495B67' }}>
                        + Upload
                    </button>
                </div>

                {/* Filter */}
                {categories.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        <button
                            onClick={() => setFilterCat('all')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap ${filterCat === 'all' ? 'text-white' : 'bg-slate-100 text-slate-600'}`}
                            style={filterCat === 'all' ? { backgroundColor: '#495B67' } : {}}
                        >All</button>
                        {categories.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setFilterCat(String(c.id))}
                                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap ${filterCat === String(c.id) ? 'text-white' : 'bg-slate-100 text-slate-600'}`}
                                style={filterCat === String(c.id) ? { backgroundColor: '#495B67' } : {}}
                            >{c.name}</button>
                        ))}
                    </div>
                )}

                {/* Documents List */}
                {filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        <h3 className="mt-3 text-base font-semibold text-slate-700">No documents</h3>
                        <p className="text-sm text-slate-400 mt-1">Documents shared with you will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map(doc => (
                            <div key={doc.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                                <div className="text-2xl">{typeIcons[doc.file_type.toLowerCase()] || '📎'}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-slate-900 truncate">{doc.title}</div>
                                    <div className="text-xs text-slate-400">{doc.file_name} · {formatSize(doc.file_size)}</div>
                                    {doc.category && <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{doc.category.name}</span>}
                                    {doc.expiry_date && (
                                        <span className={`inline-block mt-1 ml-1 text-xs px-2 py-0.5 rounded-full ${new Date(doc.expiry_date) < new Date() ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                                            Expires {new Date(doc.expiry_date).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                                <a
                                    href={route('documents.download', doc.id)}
                                    className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                                >
                                    ↓
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {showUpload && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowUpload(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                        <form onSubmit={submit} className="p-6 space-y-4">
                            <h2 className="text-lg font-bold text-slate-900">Upload Document</h2>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                                <input type="text" value={form.data.title} onChange={e => form.setData('title', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" required />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                <select value={form.data.category_id} onChange={e => form.setData('category_id', e.target.value)} className="w-full rounded-lg border-slate-200 text-sm">
                                    <option value="">None</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
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
        </UserLayout>
    );
}
