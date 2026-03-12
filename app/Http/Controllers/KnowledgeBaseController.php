<?php

namespace App\Http\Controllers;

use App\Models\KbArticle;
use App\Models\KbArticleView;
use App\Models\KbCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class KnowledgeBaseController extends Controller
{
    // ─── Admin ────────────────────────────────────────────────

    /**
     * Admin: list all categories and articles.
     */
    public function index(Request $request): Response
    {
        $tenantId = $request->user()->tenant_id;
        $status   = $request->get('status', 'all');
        $catId    = $request->get('category', 'all');
        $search   = $request->get('search', '');

        // Categories with article counts
        $categories = KbCategory::where('tenant_id', $tenantId)
            ->withCount('articles')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn ($c) => [
                'id'             => $c->id,
                'name'           => $c->name,
                'slug'           => $c->slug,
                'description'    => $c->description,
                'icon'           => $c->icon,
                'sort_order'     => $c->sort_order,
                'articles_count' => $c->articles_count,
            ]);

        // Articles
        $query = KbArticle::where('tenant_id', $tenantId)
            ->with(['author:id,name', 'category:id,name,icon'])
            ->withCount('views')
            ->orderBy('is_pinned', 'desc')
            ->orderBy('created_at', 'desc');

        if ($status !== 'all') {
            $query->where('status', $status);
        }
        if ($catId !== 'all') {
            $query->where('category_id', $catId);
        }
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('body', 'like', "%{$search}%");
            });
        }

        $articles = $query->get()->map(fn ($a) => $this->formatArticle($a));

        $allArticles = KbArticle::where('tenant_id', $tenantId);
        $stats = [
            'total'      => (clone $allArticles)->count(),
            'published'  => (clone $allArticles)->where('status', 'published')->count(),
            'draft'      => (clone $allArticles)->where('status', 'draft')->count(),
            'categories' => KbCategory::where('tenant_id', $tenantId)->count(),
        ];

        return Inertia::render('Communication/KnowledgeBase', [
            'articles'   => $articles,
            'categories' => $categories,
            'filters'    => ['status' => $status, 'category' => $catId, 'search' => $search],
            'stats'      => $stats,
        ]);
    }

    // ─── Category CRUD ────────────────────────────────────────

    public function storeCategory(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'icon'        => 'nullable|string|max:10',
        ]);

        KbCategory::create([
            'tenant_id'   => $request->user()->tenant_id,
            'name'        => $validated['name'],
            'slug'        => Str::slug($validated['name']) . '-' . Str::random(4),
            'description' => $validated['description'] ?? null,
            'icon'        => $validated['icon'] ?? '📁',
        ]);

        return back()->with('success', "Category \"{$validated['name']}\" created.");
    }

    public function updateCategory(Request $request, KbCategory $category): RedirectResponse
    {
        if ($category->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'icon'        => 'nullable|string|max:10',
        ]);

        $category->update([
            'name'        => $validated['name'],
            'description' => $validated['description'] ?? null,
            'icon'        => $validated['icon'] ?? $category->icon,
        ]);

        return back()->with('success', 'Category updated.');
    }

    public function destroyCategory(Request $request, KbCategory $category): RedirectResponse
    {
        if ($category->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $name = $category->name;
        // Unset category on articles (don't delete them)
        KbArticle::where('category_id', $category->id)->update(['category_id' => null]);
        $category->delete();

        return back()->with('success', "Category \"{$name}\" deleted. Articles moved to uncategorized.");
    }

    // ─── Article CRUD ─────────────────────────────────────────

    public function storeArticle(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'body'        => 'required|string|max:50000',
            'category_id' => 'nullable|integer|exists:kb_categories,id',
            'status'      => 'required|in:draft,published',
            'is_pinned'   => 'boolean',
        ]);

        $article = KbArticle::create([
            'tenant_id'    => $user->tenant_id,
            'created_by'   => $user->id,
            'title'        => $validated['title'],
            'slug'         => Str::slug($validated['title']) . '-' . Str::random(4),
            'body'         => $validated['body'],
            'category_id'  => $validated['category_id'] ?? null,
            'status'       => $validated['status'],
            'is_pinned'    => $validated['is_pinned'] ?? false,
            'published_at' => $validated['status'] === 'published' ? now() : null,
        ]);

        $label = $validated['status'] === 'published' ? 'published' : 'saved as draft';

        return back()->with('success', "Article \"{$article->title}\" {$label}.");
    }

    public function updateArticle(Request $request, KbArticle $article): RedirectResponse
    {
        if ($article->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'body'        => 'required|string|max:50000',
            'category_id' => 'nullable|integer|exists:kb_categories,id',
            'is_pinned'   => 'boolean',
        ]);

        $article->update([
            'title'       => $validated['title'],
            'body'        => $validated['body'],
            'category_id' => $validated['category_id'] ?? null,
            'is_pinned'   => $validated['is_pinned'] ?? false,
        ]);

        return back()->with('success', 'Article updated.');
    }

    public function destroyArticle(Request $request, KbArticle $article): RedirectResponse
    {
        if ($article->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $title = $article->title;
        $article->delete();

        return back()->with('success', "Article \"{$title}\" deleted.");
    }

    public function publishArticle(Request $request, KbArticle $article): RedirectResponse
    {
        if ($article->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $article->update([
            'status'       => 'published',
            'published_at' => $article->published_at ?? now(),
        ]);

        return back()->with('success', "Article \"{$article->title}\" published.");
    }

    public function archiveArticle(Request $request, KbArticle $article): RedirectResponse
    {
        if ($article->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $article->update(['status' => 'archived']);

        return back()->with('success', "Article \"{$article->title}\" archived.");
    }

    // ─── User-facing ──────────────────────────────────────────

    /**
     * User: browse published articles.
     */
    public function browse(Request $request): Response
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;
        $search   = $request->get('search', '');
        $catSlug  = $request->get('category', 'all');

        $categories = KbCategory::where('tenant_id', $tenantId)
            ->withCount('publishedArticles')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn ($c) => [
                'id'                       => $c->id,
                'name'                     => $c->name,
                'slug'                     => $c->slug,
                'icon'                     => $c->icon,
                'published_articles_count' => $c->published_articles_count,
            ]);

        $query = KbArticle::where('tenant_id', $tenantId)
            ->published()
            ->with(['author:id,name', 'category:id,name,slug,icon'])
            ->withCount('views')
            ->orderBy('is_pinned', 'desc')
            ->orderBy('published_at', 'desc');

        if ($catSlug !== 'all') {
            $cat = KbCategory::where('tenant_id', $tenantId)->where('slug', $catSlug)->first();
            if ($cat) {
                $query->where('category_id', $cat->id);
            }
        }
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('body', 'like', "%{$search}%");
            });
        }

        $articles = $query->get()->map(function ($a) use ($user) {
            $isRead = $a->views->where('user_id', $user->id)->isNotEmpty();
            return [
                'id'           => $a->id,
                'title'        => $a->title,
                'slug'         => $a->slug,
                'excerpt'      => Str::limit(strip_tags($a->body), 200),
                'body'         => $a->body,
                'category'     => $a->category ? ['id' => $a->category->id, 'name' => $a->category->name, 'icon' => $a->category->icon] : null,
                'author'       => $a->author ? ['id' => $a->author->id, 'name' => $a->author->name] : null,
                'is_pinned'    => $a->is_pinned,
                'views_count'  => $a->views_count ?? 0,
                'is_read'      => $isRead,
                'published_at' => $a->published_at?->toDateTimeString(),
            ];
        });

        return Inertia::render('User/UserKnowledgeBase', [
            'articles'   => $articles,
            'categories' => $categories,
            'filters'    => ['search' => $search, 'category' => $catSlug],
        ]);
    }

    /**
     * Mark an article as viewed.
     */
    public function markViewed(Request $request, KbArticle $article): RedirectResponse
    {
        if ($article->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        KbArticleView::firstOrCreate([
            'article_id' => $article->id,
            'user_id'    => $request->user()->id,
        ], [
            'viewed_at' => now(),
        ]);

        return back();
    }

    // ─── Helpers ──────────────────────────────────────────────

    private function formatArticle(KbArticle $article): array
    {
        return [
            'id'           => $article->id,
            'title'        => $article->title,
            'slug'         => $article->slug,
            'body'         => $article->body,
            'excerpt'      => Str::limit(strip_tags($article->body), 150),
            'status'       => $article->status,
            'is_pinned'    => $article->is_pinned,
            'category'     => $article->category ? [
                'id'   => $article->category->id,
                'name' => $article->category->name,
                'icon' => $article->category->icon,
            ] : null,
            'author'       => $article->author ? ['id' => $article->author->id, 'name' => $article->author->name] : null,
            'views_count'  => $article->views_count ?? 0,
            'published_at' => $article->published_at?->toDateTimeString(),
            'created_at'   => $article->created_at->toDateTimeString(),
        ];
    }
}
