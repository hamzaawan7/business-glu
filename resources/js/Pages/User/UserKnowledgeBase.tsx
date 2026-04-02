import UserLayout from '@/Layouts/UserLayout';
import Icon from '@/Components/Icon';
import { Head, usePage, router } from '@inertiajs/react';
import { useState } from 'react';

interface CategoryData {
    id: number;
    name: string;
    slug: string;
    icon: string;
    published_articles_count: number;
}

interface ArticleData {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    body: string;
    category: { id: number; name: string; icon: string } | null;
    author: { id: number; name: string } | null;
    is_pinned: boolean;
    views_count: number;
    is_read: boolean;
    published_at: string | null;
}

interface Props {
    articles: ArticleData[];
    categories: CategoryData[];
    filters: { search: string; category: string };
}

function timeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function UserKnowledgeBase({ articles, categories, filters }: Props) {
    const page = usePage();

    const [viewArticle, setViewArticle] = useState<ArticleData | null>(null);
    const [searchValue, setSearchValue] = useState(filters.search || '');

    function handleSearch(value: string) {
        setSearchValue(value);
        clearTimeout((window as any).__kbUserSearch);
        (window as any).__kbUserSearch = setTimeout(() => {
            router.get('/app/knowledge-base', { ...filters, search: value }, { preserveState: true, replace: true });
        }, 400);
    }

    function handleFilterCategory(slug: string) {
        router.get('/app/knowledge-base', { ...filters, category: slug }, { preserveState: true, replace: true });
    }

    function openArticle(article: ArticleData) {
        setViewArticle(article);
        // Mark as viewed
        if (!article.is_read) {
            router.post(`/kb/articles/${article.id}/view`, {}, { preserveScroll: true, preserveState: true });
        }
    }

    const pinnedArticles = articles.filter(a => a.is_pinned);
    const regularArticles = articles.filter(a => !a.is_pinned);

    return (
        <UserLayout>
            <Head title="Knowledge Base" />

            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="mb-5">
                    <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {articles.length} article{articles.length !== 1 ? 's' : ''} available
                    </p>
                </div>

                {/* Search */}
                <div className="mb-4">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                        <input
                            type="text"
                            value={searchValue}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search articles..."
                            className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm focus:border-[#495B67] focus:ring-1 focus:ring-[#495B67]"
                        />
                    </div>
                </div>

                {/* Category pills */}
                {categories.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
                        <button
                            onClick={() => handleFilterCategory('all')}
                            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                filters.category === 'all'
                                    ? 'bg-[#495B67] text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            All
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => handleFilterCategory(cat.slug)}
                                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                    filters.category === cat.slug
                                        ? 'bg-[#495B67] text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                <Icon name={cat.icon || "folder-open"} className="w-4 h-4 inline-block" /> {cat.name} ({cat.published_articles_count})
                            </button>
                        ))}
                    </div>
                )}

                {articles.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-3"><Icon name="book-open" className="w-4 h-4 inline-block" /></div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-1">No articles found</h3>
                        <p className="text-sm text-gray-500">
                            {filters.search || filters.category !== 'all'
                                ? 'Try a different search or category.'
                                : 'Articles will appear here once published.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Pinned */}
                        {pinnedArticles.length > 0 && (
                            <>
                                <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider">
                                    <Icon name="pin" className="w-4 h-4 inline-block" /> Pinned
                                </div>
                                {pinnedArticles.map(article => (
                                    <button
                                        key={article.id}
                                        onClick={() => openArticle(article)}
                                        className={`w-full bg-white rounded-xl border p-4 text-left hover:shadow-sm transition-all ${
                                            article.is_read ? 'border-gray-200' : 'border-l-4 border-l-[#495B67] border-t-gray-200 border-r-gray-200 border-b-gray-200'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="text-2xl flex-shrink-0 mt-0.5">
                                                <Icon name={article.category?.icon ?? 'document'} className="w-4 h-4 inline-block" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-gray-900 text-sm truncate">{article.title}</h3>
                                                    {!article.is_read && (
                                                        <span className="inline-block w-2 h-2 rounded-full bg-[#495B67] flex-shrink-0" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{article.excerpt}</p>
                                                <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                                                    {article.category && <span>{article.category.name}</span>}
                                                    <span>By {article.author?.name ?? 'Unknown'}</span>
                                                    <span><Icon name="eye" className="w-4 h-4 inline-block" /> {article.views_count}</span>
                                                    {article.published_at && <span>{timeAgo(article.published_at)}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                                {regularArticles.length > 0 && (
                                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">
                                        All Articles
                                    </div>
                                )}
                            </>
                        )}

                        {/* Regular articles */}
                        {regularArticles.map(article => (
                            <button
                                key={article.id}
                                onClick={() => openArticle(article)}
                                className={`w-full bg-white rounded-xl border p-4 text-left hover:shadow-sm transition-all ${
                                    article.is_read ? 'border-gray-200' : 'border-l-4 border-l-[#495B67] border-t-gray-200 border-r-gray-200 border-b-gray-200'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="text-2xl flex-shrink-0 mt-0.5">
                                        <Icon name={article.category?.icon ?? 'document'} className="w-4 h-4 inline-block" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900 text-sm truncate">{article.title}</h3>
                                            {!article.is_read && (
                                                <span className="inline-block w-2 h-2 rounded-full bg-[#495B67] flex-shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{article.excerpt}</p>
                                        <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                                            {article.category && <span>{article.category.name}</span>}
                                            <span>By {article.author?.name ?? 'Unknown'}</span>
                                            <span><Icon name="eye" className="w-4 h-4 inline-block" /> {article.views_count}</span>
                                            {article.published_at && <span>{timeAgo(article.published_at)}</span>}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Article Reader Modal ── */}
            {viewArticle && (
                <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={() => setViewArticle(null)}>
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {viewArticle.category && (
                                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-600">
                                            <Icon name={viewArticle.category.icon || "folder-open"} className="w-3.5 h-3.5 inline-block mr-1" /> {viewArticle.category.name}
                                        </span>
                                    )}
                                    {viewArticle.is_pinned && <span className="text-xs"><Icon name="pin" className="w-4 h-4 inline-block" /></span>}
                                </div>
                                <button onClick={() => setViewArticle(null)} className="text-gray-400 hover:text-gray-600 text-lg">
                                    <Icon name="x-mark" className="w-3.5 h-3.5 inline-block" /> 
                                </button>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mt-2">{viewArticle.title}</h2>
                            <p className="text-xs text-gray-400 mt-1">
                                By {viewArticle.author?.name ?? 'Unknown'}
                                {viewArticle.published_at && ` · ${timeAgo(viewArticle.published_at)}`}
                                {` · <Icon name="eye" className="w-4 h-4 inline-block" /> ${viewArticle.views_count} views`}
                            </p>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {viewArticle.body}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </UserLayout>
    );
}
