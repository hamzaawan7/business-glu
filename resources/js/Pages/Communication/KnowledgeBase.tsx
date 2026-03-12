import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';

interface CategoryData {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    icon: string;
    sort_order: number;
    articles_count: number;
}

interface ArticleData {
    id: number;
    title: string;
    slug: string;
    body: string;
    excerpt: string;
    status: string;
    is_pinned: boolean;
    category: { id: number; name: string; icon: string } | null;
    author: { id: number; name: string } | null;
    views_count: number;
    published_at: string | null;
    created_at: string;
}

interface Props {
    articles: ArticleData[];
    categories: CategoryData[];
    filters: { status: string; category: string; search: string };
    stats: { total: number; published: number; draft: number; categories: number };
}

const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    published: 'bg-green-100 text-green-700',
    archived: 'bg-gray-100 text-gray-500',
};

const categoryIcons = ['📁', '📚', '📋', '📖', '🔧', '💡', '🎯', '📌', '🏢', '⚙️', '🔒', '📝', '🎓', '💼', '🗂️'];

export default function KnowledgeBase({ articles, categories, filters, stats }: Props) {
    const page = usePage();
    const flash = (page.props as any).flash ?? {};

    const [showArticleModal, setShowArticleModal] = useState(false);
    const [editingArticle, setEditingArticle] = useState<ArticleData | null>(null);
    const [viewArticle, setViewArticle] = useState<ArticleData | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<ArticleData | null>(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null);
    const [deleteCatConfirm, setDeleteCatConfirm] = useState<CategoryData | null>(null);
    const [activeTab, setActiveTab] = useState<'articles' | 'categories'>('articles');

    // Article form
    const articleForm = useForm({
        title: '',
        body: '',
        category_id: '' as string | number,
        status: 'draft' as string,
        is_pinned: false,
    });

    // Category form
    const catForm = useForm({
        name: '',
        description: '',
        icon: '📁',
    });

    function openCreateArticle() {
        articleForm.reset();
        articleForm.setData({ title: '', body: '', category_id: '', status: 'draft', is_pinned: false });
        setEditingArticle(null);
        setShowArticleModal(true);
    }

    function openEditArticle(article: ArticleData) {
        setEditingArticle(article);
        articleForm.setData({
            title: article.title,
            body: article.body,
            category_id: article.category?.id ?? '',
            status: article.status,
            is_pinned: article.is_pinned,
        });
        setShowArticleModal(true);
    }

    const handleArticleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        // Transform category_id before submit
        const catId = articleForm.data.category_id;
        articleForm.transform((data) => ({
            ...data,
            category_id: catId === '' ? null : Number(catId),
        }));
        if (editingArticle) {
            articleForm.patch(`/admin/knowledge-base/articles/${editingArticle.id}`, {
                onSuccess: () => { setShowArticleModal(false); setEditingArticle(null); },
            });
        } else {
            articleForm.post('/admin/knowledge-base/articles', {
                onSuccess: () => { setShowArticleModal(false); },
            });
        }
    };

    function publishArticle(article: ArticleData) {
        router.post(`/admin/knowledge-base/articles/${article.id}/publish`, {}, { preserveScroll: true });
    }

    function archiveArticle(article: ArticleData) {
        router.post(`/admin/knowledge-base/articles/${article.id}/archive`, {}, { preserveScroll: true });
    }

    function deleteArticle() {
        if (!deleteConfirm) return;
        router.delete(`/admin/knowledge-base/articles/${deleteConfirm.id}`, {
            onSuccess: () => setDeleteConfirm(null),
        });
    }

    function openCreateCategory() {
        catForm.reset();
        catForm.setData({ name: '', description: '', icon: '📁' });
        setEditingCategory(null);
        setShowCategoryModal(true);
    }

    function openEditCategory(cat: CategoryData) {
        setEditingCategory(cat);
        catForm.setData({ name: cat.name, description: cat.description || '', icon: cat.icon });
        setShowCategoryModal(true);
    }

    const handleCategorySubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editingCategory) {
            catForm.patch(`/admin/knowledge-base/categories/${editingCategory.id}`, {
                onSuccess: () => { setShowCategoryModal(false); setEditingCategory(null); },
            });
        } else {
            catForm.post('/admin/knowledge-base/categories', {
                onSuccess: () => setShowCategoryModal(false),
            });
        }
    };

    function deleteCategory() {
        if (!deleteCatConfirm) return;
        router.delete(`/admin/knowledge-base/categories/${deleteCatConfirm.id}`, {
            onSuccess: () => setDeleteCatConfirm(null),
        });
    }

    function handleSearch(value: string) {
        router.get('/admin/knowledge-base', { ...filters, search: value }, { preserveState: true, replace: true });
    }

    function handleFilterStatus(value: string) {
        router.get('/admin/knowledge-base', { ...filters, status: value }, { preserveState: true, replace: true });
    }

    function handleFilterCategory(value: string) {
        router.get('/admin/knowledge-base', { ...filters, category: value }, { preserveState: true, replace: true });
    }

    return (
        <AdminLayout>
            <Head title="Knowledge Base" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
                        <p className="text-sm text-gray-500 mt-1">Create and manage articles, policies, and documentation</p>
                    </div>
                    <div className="flex gap-2">
                        {activeTab === 'categories' ? (
                            <button onClick={openCreateCategory} className="px-4 py-2 bg-[#495B67] text-white text-sm font-medium rounded-lg hover:bg-[#3a4a55] transition-colors">
                                + New Category
                            </button>
                        ) : (
                            <button onClick={openCreateArticle} className="px-4 py-2 bg-[#495B67] text-white text-sm font-medium rounded-lg hover:bg-[#3a4a55] transition-colors">
                                + New Article
                            </button>
                        )}
                    </div>
                </div>

                {/* Flash */}
                {flash.success && (
                    <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                        {flash.success}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Articles', value: stats.total, icon: '📄' },
                        { label: 'Published', value: stats.published, icon: '✅' },
                        { label: 'Drafts', value: stats.draft, icon: '📝' },
                        { label: 'Categories', value: stats.categories, icon: '📁' },
                    ].map(s => (
                        <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>{s.icon}</span> {s.label}
                            </div>
                            <div className="text-2xl font-bold text-gray-900 mt-1">{s.value}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
                    <button
                        onClick={() => setActiveTab('articles')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'articles' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        📄 Articles ({stats.total})
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'categories' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        📁 Categories ({stats.categories})
                    </button>
                </div>

                {activeTab === 'articles' ? (
                    <>
                        {/* Filters */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex-1 min-w-[200px]">
                                    <div className="relative">
                                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                        </svg>
                                        <input
                                            type="text"
                                            defaultValue={filters.search}
                                            onChange={(e) => {
                                                clearTimeout((window as any).__kbSearch);
                                                (window as any).__kbSearch = setTimeout(() => handleSearch(e.target.value), 400);
                                            }}
                                            placeholder="Search articles..."
                                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                        />
                                    </div>
                                </div>
                                <select
                                    value={filters.status}
                                    onChange={(e) => handleFilterStatus(e.target.value)}
                                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                >
                                    <option value="all">All Status</option>
                                    <option value="published">Published</option>
                                    <option value="draft">Draft</option>
                                    <option value="archived">Archived</option>
                                </select>
                                <select
                                    value={filters.category}
                                    onChange={(e) => handleFilterCategory(e.target.value)}
                                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                >
                                    <option value="all">All Categories</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Articles list */}
                        {articles.length === 0 ? (
                            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                                <div className="text-4xl mb-3">📚</div>
                                <p className="text-gray-500 text-sm">No articles found. Create your first article to get started.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {articles.map(article => (
                                    <div key={article.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-all">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    {article.is_pinned && <span className="text-xs">📌</span>}
                                                    <h3
                                                        className="font-semibold text-gray-900 hover:text-[#495B67] cursor-pointer"
                                                        onClick={() => setViewArticle(article)}
                                                    >
                                                        {article.title}
                                                    </h3>
                                                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${statusColors[article.status] || 'bg-gray-100 text-gray-600'}`}>
                                                        {article.status}
                                                    </span>
                                                    {article.category && (
                                                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-50 text-blue-600">
                                                            {article.category.icon} {article.category.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 line-clamp-2">{article.excerpt}</p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                                    <span>By {article.author?.name ?? 'Unknown'}</span>
                                                    <span>👁️ {article.views_count} views</span>
                                                    {article.published_at && (
                                                        <span>Published {new Date(article.published_at).toLocaleDateString()}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                {article.status === 'draft' && (
                                                    <button onClick={() => publishArticle(article)} className="px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                                                        Publish
                                                    </button>
                                                )}
                                                {article.status === 'published' && (
                                                    <button onClick={() => archiveArticle(article)} className="px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                                                        Archive
                                                    </button>
                                                )}
                                                <button onClick={() => openEditArticle(article)} className="p-1.5 text-gray-400 hover:text-[#495B67] rounded" title="Edit">
                                                    ✏️
                                                </button>
                                                <button onClick={() => setDeleteConfirm(article)} className="p-1.5 text-gray-400 hover:text-red-500 rounded" title="Delete">
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    /* ── Categories Tab ── */
                    <div>
                        {categories.length === 0 ? (
                            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                                <div className="text-4xl mb-3">📁</div>
                                <p className="text-gray-500 text-sm">No categories yet. Create one to organize your articles.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {categories.map(cat => (
                                    <div key={cat.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-all">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="text-2xl mb-2">{cat.icon}</div>
                                                <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                                                {cat.description && (
                                                    <p className="text-xs text-gray-500 mt-1">{cat.description}</p>
                                                )}
                                                <p className="text-xs text-gray-400 mt-2">{cat.articles_count} article{cat.articles_count !== 1 ? 's' : ''}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => openEditCategory(cat)} className="p-1 text-gray-400 hover:text-[#495B67]">✏️</button>
                                                <button onClick={() => setDeleteCatConfirm(cat)} className="p-1 text-gray-400 hover:text-red-500">🗑️</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Article Modal ── */}
            {showArticleModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowArticleModal(false)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900">{editingArticle ? 'Edit Article' : 'New Article'}</h2>
                        </div>
                        <form onSubmit={handleArticleSubmit} className="px-6 py-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={articleForm.data.title}
                                    onChange={(e) => articleForm.setData('title', e.target.value)}
                                    placeholder="Article title..."
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    value={articleForm.data.category_id}
                                    onChange={(e) => articleForm.setData('category_id', e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                >
                                    <option value="">Uncategorized</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                                <textarea
                                    value={articleForm.data.body}
                                    onChange={(e) => articleForm.setData('body', e.target.value)}
                                    placeholder="Write your article content..."
                                    rows={12}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67] font-mono"
                                    required
                                />
                                <p className="text-xs text-gray-400 mt-1">Supports plain text. Markdown support coming soon.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={articleForm.data.is_pinned}
                                        onChange={(e) => articleForm.setData('is_pinned', e.target.checked)}
                                        className="rounded border-gray-300 text-[#495B67] focus:ring-[#495B67]"
                                    />
                                    Pin to top
                                </label>
                                {!editingArticle && (
                                    <select
                                        value={articleForm.data.status}
                                        onChange={(e) => articleForm.setData('status', e.target.value)}
                                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                    >
                                        <option value="draft">Save as Draft</option>
                                        <option value="published">Publish Now</option>
                                    </select>
                                )}
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowArticleModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={articleForm.processing} className="px-4 py-2 bg-[#495B67] text-white text-sm font-medium rounded-lg hover:bg-[#3a4a55] disabled:opacity-50 transition-colors">
                                    {articleForm.processing ? 'Saving...' : editingArticle ? 'Save Changes' : 'Create Article'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── View Article Modal ── */}
            {viewArticle && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewArticle(null)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center gap-2 mb-1">
                                {viewArticle.is_pinned && <span>📌</span>}
                                <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${statusColors[viewArticle.status]}`}>
                                    {viewArticle.status}
                                </span>
                                {viewArticle.category && (
                                    <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-50 text-blue-600">
                                        {viewArticle.category.icon} {viewArticle.category.name}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">{viewArticle.title}</h2>
                            <p className="text-xs text-gray-400 mt-1">
                                By {viewArticle.author?.name ?? 'Unknown'} · 👁️ {viewArticle.views_count} views
                            </p>
                        </div>
                        <div className="px-6 py-4">
                            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                                {viewArticle.body}
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
                            <button onClick={() => { setViewArticle(null); openEditArticle(viewArticle); }} className="px-4 py-2 text-sm text-[#495B67] hover:bg-gray-100 rounded-lg">
                                ✏️ Edit
                            </button>
                            <button onClick={() => setViewArticle(null)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Category Modal ── */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCategoryModal(false)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900">{editingCategory ? 'Edit Category' : 'New Category'}</h2>
                        </div>
                        <form onSubmit={handleCategorySubmit} className="px-6 py-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={catForm.data.name}
                                    onChange={(e) => catForm.setData('name', e.target.value)}
                                    placeholder="Category name..."
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <input
                                    type="text"
                                    value={catForm.data.description}
                                    onChange={(e) => catForm.setData('description', e.target.value)}
                                    placeholder="Brief description..."
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                                <div className="flex flex-wrap gap-2">
                                    {categoryIcons.map(icon => (
                                        <button
                                            key={icon}
                                            type="button"
                                            onClick={() => catForm.setData('icon', icon)}
                                            className={`w-10 h-10 flex items-center justify-center rounded-lg text-lg border-2 transition-colors ${
                                                catForm.data.icon === icon
                                                    ? 'border-[#495B67] bg-[#495B67]/10'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowCategoryModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                                    Cancel
                                </button>
                                <button type="submit" disabled={catForm.processing} className="px-4 py-2 bg-[#495B67] text-white text-sm font-medium rounded-lg hover:bg-[#3a4a55] disabled:opacity-50">
                                    {catForm.processing ? 'Saving...' : editingCategory ? 'Save' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete Article Confirm ── */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Article</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Are you sure you want to delete "<strong>{deleteConfirm.title}</strong>"? This cannot be undone.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                            <button onClick={deleteArticle} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Category Confirm ── */}
            {deleteCatConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteCatConfirm(null)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Category</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Delete "<strong>{deleteCatConfirm.name}</strong>"? Articles in this category will become uncategorized.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setDeleteCatConfirm(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                            <button onClick={deleteCategory} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
