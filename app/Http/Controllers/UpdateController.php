<?php

namespace App\Http\Controllers;

use App\Models\Update;
use App\Models\UpdateComment;
use App\Models\UpdateReaction;
use App\Models\UpdateRead;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UpdateController extends Controller
{
    /**
     * Admin view: all updates for the tenant.
     */
    public function index(Request $request): Response
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;
        $status   = $request->get('status', 'all');
        $type     = $request->get('type', 'all');

        $query = Update::where('tenant_id', $tenantId)
            ->with(['creator:id,name,email'])
            ->withCount(['comments', 'reactions', 'reads'])
            ->orderBy('is_pinned', 'desc')
            ->orderBy('created_at', 'desc');

        if ($status !== 'all') {
            $query->where('status', $status);
        }
        if ($type !== 'all') {
            $query->where('type', $type);
        }

        $updates = $query->get()->map(fn ($u) => $this->formatUpdate($u, $user->id));

        $allUpdates = Update::where('tenant_id', $tenantId);
        $stats = [
            'total'     => (clone $allUpdates)->count(),
            'published' => (clone $allUpdates)->where('status', 'published')->count(),
            'draft'     => (clone $allUpdates)->where('status', 'draft')->count(),
            'pinned'    => (clone $allUpdates)->where('is_pinned', true)->count(),
        ];

        $teamCount = User::where('tenant_id', $tenantId)->count();

        return Inertia::render('Communication/Updates', [
            'updates'   => $updates,
            'filters'   => ['status' => $status, 'type' => $type],
            'stats'     => $stats,
            'teamCount' => $teamCount,
        ]);
    }

    /**
     * Create a new update.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'title'          => 'required|string|max:255',
            'body'           => 'required|string|max:10000',
            'type'           => 'required|in:announcement,news,event,poll',
            'is_pinned'      => 'boolean',
            'is_popup'       => 'boolean',
            'allow_comments' => 'boolean',
            'allow_reactions' => 'boolean',
            'publish_now'    => 'boolean',
            'scheduled_at'   => 'nullable|date|after:now',
            'expires_at'     => 'nullable|date|after:now',
        ]);

        $publishNow = $validated['publish_now'] ?? false;

        $update = Update::create([
            'tenant_id'       => $user->tenant_id,
            'created_by'      => $user->id,
            'title'           => $validated['title'],
            'body'            => $validated['body'],
            'type'            => $validated['type'],
            'status'          => $publishNow ? 'published' : ($validated['scheduled_at'] ?? false ? 'scheduled' : 'draft'),
            'is_pinned'       => $validated['is_pinned'] ?? false,
            'is_popup'        => $validated['is_popup'] ?? false,
            'allow_comments'  => $validated['allow_comments'] ?? true,
            'allow_reactions'  => $validated['allow_reactions'] ?? true,
            'published_at'    => $publishNow ? now() : null,
            'scheduled_at'    => $validated['scheduled_at'] ?? null,
            'expires_at'      => $validated['expires_at'] ?? null,
        ]);

        $label = $publishNow ? 'published' : 'saved as draft';

        return back()->with('success', "Update \"{$update->title}\" {$label}.");
    }

    /**
     * Update an existing update.
     */
    public function update(Request $request, Update $update): RedirectResponse
    {
        if ($update->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $validated = $request->validate([
            'title'          => 'required|string|max:255',
            'body'           => 'required|string|max:10000',
            'type'           => 'required|in:announcement,news,event,poll',
            'is_pinned'      => 'boolean',
            'is_popup'       => 'boolean',
            'allow_comments' => 'boolean',
            'allow_reactions' => 'boolean',
            'expires_at'     => 'nullable|date',
        ]);

        $update->update([
            'title'           => $validated['title'],
            'body'            => $validated['body'],
            'type'            => $validated['type'],
            'is_pinned'       => $validated['is_pinned'] ?? false,
            'is_popup'        => $validated['is_popup'] ?? false,
            'allow_comments'  => $validated['allow_comments'] ?? true,
            'allow_reactions'  => $validated['allow_reactions'] ?? true,
            'expires_at'      => $validated['expires_at'] ?? null,
        ]);

        return back()->with('success', 'Update saved.');
    }

    /**
     * Delete an update.
     */
    public function destroy(Request $request, Update $update): RedirectResponse
    {
        if ($update->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $title = $update->title;
        $update->delete();

        return back()->with('success', "Update \"{$title}\" deleted.");
    }

    /**
     * Publish a draft update.
     */
    public function publish(Request $request, Update $update): RedirectResponse
    {
        if ($update->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $update->update([
            'status'       => 'published',
            'published_at' => now(),
        ]);

        return back()->with('success', "Update \"{$update->title}\" published.");
    }

    /**
     * Archive an update.
     */
    public function archive(Request $request, Update $update): RedirectResponse
    {
        if ($update->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $update->update(['status' => 'archived']);

        return back()->with('success', "Update \"{$update->title}\" archived.");
    }

    /**
     * Toggle pin on an update.
     */
    public function togglePin(Request $request, Update $update): RedirectResponse
    {
        if ($update->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $update->update(['is_pinned' => !$update->is_pinned]);

        $label = $update->is_pinned ? 'pinned' : 'unpinned';

        return back()->with('success', "Update {$label}.");
    }

    // ─── User-facing ──────────────────────────────────────────

    /**
     * User view: published updates feed.
     */
    public function feed(Request $request): Response
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;

        $updates = Update::where('tenant_id', $tenantId)
            ->where('status', 'published')
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>', now());
            })
            ->with([
                'creator:id,name,email',
                'comments' => fn ($q) => $q->with('user:id,name')->latest()->limit(10),
                'reactions',
            ])
            ->withCount(['comments', 'reactions', 'reads'])
            ->orderBy('is_pinned', 'desc')
            ->orderBy('published_at', 'desc')
            ->get()
            ->map(fn ($u) => $this->formatUpdateForFeed($u, $user->id));

        return Inertia::render('User/UserUpdates', [
            'updates' => $updates,
        ]);
    }

    // ─── Shared actions (comments, reactions, reads) ─────────

    /**
     * Add a comment to an update.
     */
    public function addComment(Request $request, Update $update): RedirectResponse
    {
        if ($update->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $validated = $request->validate([
            'body' => 'required|string|max:2000',
        ]);

        $update->comments()->create([
            'user_id' => $request->user()->id,
            'body'    => $validated['body'],
        ]);

        return back()->with('success', 'Comment added.');
    }

    /**
     * Delete a comment.
     */
    public function deleteComment(Request $request, UpdateComment $comment): RedirectResponse
    {
        $post = $comment->post;
        if ($post->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        // Allow author or admin to delete
        if ($comment->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            abort(403);
        }

        $comment->delete();

        return back()->with('success', 'Comment deleted.');
    }

    /**
     * Toggle a reaction on an update.
     */
    public function toggleReaction(Request $request, Update $update): RedirectResponse
    {
        if ($update->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $emoji = $request->input('emoji', '👍');
        $userId = $request->user()->id;

        $existing = UpdateReaction::where('update_id', $update->id)
            ->where('user_id', $userId)
            ->where('emoji', $emoji)
            ->first();

        if ($existing) {
            $existing->delete();
        } else {
            UpdateReaction::create([
                'update_id' => $update->id,
                'user_id'   => $userId,
                'emoji'     => $emoji,
            ]);
        }

        return back();
    }

    /**
     * Mark an update as read.
     */
    public function markRead(Request $request, Update $update): RedirectResponse
    {
        if ($update->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        UpdateRead::firstOrCreate([
            'update_id' => $update->id,
            'user_id'   => $request->user()->id,
        ]);

        return back();
    }

    // ─── Helpers ──────────────────────────────────────────────

    private function formatUpdate(Update $update, int $currentUserId): array
    {
        return [
            'id'               => $update->id,
            'title'            => $update->title,
            'body'             => $update->body,
            'type'             => $update->type,
            'status'           => $update->status,
            'is_pinned'        => $update->is_pinned,
            'is_popup'         => $update->is_popup,
            'allow_comments'   => $update->allow_comments,
            'allow_reactions'   => $update->allow_reactions,
            'published_at'     => $update->published_at?->toDateTimeString(),
            'scheduled_at'     => $update->scheduled_at?->toDateTimeString(),
            'expires_at'       => $update->expires_at?->toDateTimeString(),
            'creator'          => $update->creator ? ['id' => $update->creator->id, 'name' => $update->creator->name] : null,
            'comments_count'   => $update->comments_count ?? 0,
            'reactions_count'  => $update->reactions_count ?? 0,
            'reads_count'      => $update->reads_count ?? 0,
            'created_at'       => $update->created_at->toDateTimeString(),
        ];
    }

    private function formatUpdateForFeed(Update $update, int $currentUserId): array
    {
        $reactionCounts = $update->reactions->groupBy('emoji')->map(fn ($group) => $group->count());
        $myReactions = $update->reactions->where('user_id', $currentUserId)->pluck('emoji')->toArray();
        $isRead = $update->reads->where('user_id', $currentUserId)->isNotEmpty();

        return [
            'id'               => $update->id,
            'title'            => $update->title,
            'body'             => $update->body,
            'type'             => $update->type,
            'is_pinned'        => $update->is_pinned,
            'is_popup'         => $update->is_popup,
            'allow_comments'   => $update->allow_comments,
            'allow_reactions'   => $update->allow_reactions,
            'published_at'     => $update->published_at?->toDateTimeString(),
            'creator'          => $update->creator ? ['id' => $update->creator->id, 'name' => $update->creator->name] : null,
            'comments'         => $update->comments->map(fn ($c) => [
                'id'         => $c->id,
                'body'       => $c->body,
                'user'       => $c->user ? ['id' => $c->user->id, 'name' => $c->user->name] : null,
                'created_at' => $c->created_at->toDateTimeString(),
            ])->toArray(),
            'comments_count'   => $update->comments_count ?? 0,
            'reaction_counts'  => $reactionCounts,
            'my_reactions'     => $myReactions,
            'reactions_count'  => $update->reactions_count ?? 0,
            'reads_count'      => $update->reads_count ?? 0,
            'is_read'          => $isRead,
            'created_at'       => $update->created_at->toDateTimeString(),
        ];
    }
}
