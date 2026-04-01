<?php

namespace App\Http\Controllers;

use App\Models\Update;
use App\Models\UpdateAudience;
use App\Models\UpdateComment;
use App\Models\UpdateReaction;
use App\Models\UpdateRead;
use App\Models\UpdateTemplate;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class UpdateController extends Controller
{
    // ─── Admin: Index ────────────────────────────────────────

    public function index(Request $request): Response
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;
        $status   = $request->get('status', 'all');
        $type     = $request->get('type', 'all');
        $category = $request->get('category', 'all');

        $query = Update::where('tenant_id', $tenantId)
            ->with(['creator:id,name,email', 'audiences'])
            ->withCount(['comments', 'reactions', 'reads'])
            ->orderBy('is_pinned', 'desc')
            ->orderBy('created_at', 'desc');

        if ($status !== 'all') {
            $query->where('status', $status);
        }
        if ($type !== 'all') {
            $query->where('type', $type);
        }
        if ($category !== 'all') {
            $query->where('category', $category);
        }

        $updates = $query->get()->map(fn ($u) => $this->formatUpdate($u, $user->id));

        $allUpdates = Update::where('tenant_id', $tenantId);
        $stats = [
            'total'     => (clone $allUpdates)->count(),
            'published' => (clone $allUpdates)->where('status', 'published')->count(),
            'draft'     => (clone $allUpdates)->where('status', 'draft')->count(),
            'scheduled' => (clone $allUpdates)->where('status', 'scheduled')->count(),
            'pinned'    => (clone $allUpdates)->where('is_pinned', true)->count(),
        ];

        $teamCount   = User::where('tenant_id', $tenantId)->count();
        $teamMembers = User::where('tenant_id', $tenantId)->select('id', 'name', 'email', 'role')->get();

        $departments = User::where('tenant_id', $tenantId)
            ->whereNotNull('department')
            ->distinct()
            ->pluck('department')
            ->values()
            ->toArray();

        $templates = UpdateTemplate::where('tenant_id', $tenantId)
            ->with('creator:id,name')
            ->orderBy('is_default', 'desc')
            ->orderBy('name')
            ->get()
            ->map(fn ($t) => [
                'id'              => $t->id,
                'name'            => $t->name,
                'title'           => $t->title,
                'body'            => $t->body,
                'type'            => $t->type,
                'category'        => $t->category,
                'cover_image'     => $t->cover_image ? Storage::url($t->cover_image) : null,
                'images'          => $t->images ? array_map(fn ($p) => Storage::url($p), $t->images) : [],
                'allow_comments'  => $t->allow_comments,
                'allow_reactions' => $t->allow_reactions,
                'is_default'      => $t->is_default,
                'creator'         => $t->creator ? ['id' => $t->creator->id, 'name' => $t->creator->name] : null,
                'created_at'      => $t->created_at->toDateTimeString(),
            ]);

        return Inertia::render('Communication/Updates', [
            'updates'     => $updates,
            'filters'     => ['status' => $status, 'type' => $type, 'category' => $category],
            'stats'       => $stats,
            'teamCount'   => $teamCount,
            'teamMembers' => $teamMembers,
            'departments' => $departments,
            'templates'   => $templates,
        ]);
    }

    // ─── Admin: Create Update ────────────────────────────────

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'title'            => 'required|string|max:255',
            'body'             => 'required|string|max:10000',
            'type'             => 'required|in:announcement,news,event,poll',
            'category'         => 'nullable|string|max:100',
            'youtube_url'      => 'nullable|url|max:500',
            'is_pinned'        => 'boolean',
            'is_popup'         => 'boolean',
            'allow_comments'   => 'boolean',
            'allow_reactions'  => 'boolean',
            'publish_now'      => 'boolean',
            'scheduled_at'     => 'nullable|date|after:now',
            'expires_at'       => 'nullable|date|after:now',
            'reminder_at'      => 'nullable|date|after:now',
            'template_id'      => 'nullable|integer|exists:update_templates,id',
            'cover_image'      => 'nullable|image|max:5120',
            'upload_images'    => 'nullable|array|max:10',
            'upload_images.*'  => 'image|max:5120',
            'upload_files'     => 'nullable|array|max:10',
            'upload_files.*'   => 'file|max:10240',
            'audience_type'    => 'nullable|in:all,department,role,user',
            'audience_values'  => 'nullable|array',
            'audience_values.*' => 'string',
        ]);

        $publishNow = $validated['publish_now'] ?? false;

        $coverImagePath = null;
        if ($request->hasFile('cover_image')) {
            $coverImagePath = $request->file('cover_image')->store('updates/covers', 'public');
        }

        $imagePaths = [];
        if ($request->hasFile('upload_images')) {
            foreach ($request->file('upload_images') as $image) {
                $imagePaths[] = $image->store('updates/images', 'public');
            }
        }

        $attachments = [];
        if ($request->hasFile('upload_files')) {
            foreach ($request->file('upload_files') as $file) {
                $path = $file->store('updates/files', 'public');
                $attachments[] = [
                    'name' => $file->getClientOriginalName(),
                    'path' => $path,
                    'type' => $file->getMimeType(),
                    'size' => $file->getSize(),
                ];
            }
        }

        $update = Update::create([
            'tenant_id'       => $user->tenant_id,
            'created_by'      => $user->id,
            'template_id'     => $validated['template_id'] ?? null,
            'title'           => $validated['title'],
            'body'            => $validated['body'],
            'cover_image'     => $coverImagePath,
            'attachments'     => !empty($attachments) ? $attachments : null,
            'images'          => !empty($imagePaths) ? $imagePaths : null,
            'youtube_url'     => $validated['youtube_url'] ?? null,
            'type'            => $validated['type'],
            'category'        => $validated['category'] ?? null,
            'status'          => $publishNow ? 'published' : ($validated['scheduled_at'] ?? false ? 'scheduled' : 'draft'),
            'is_pinned'       => $validated['is_pinned'] ?? false,
            'is_popup'        => $validated['is_popup'] ?? false,
            'allow_comments'  => $validated['allow_comments'] ?? true,
            'allow_reactions'  => $validated['allow_reactions'] ?? true,
            'published_at'    => $publishNow ? now() : null,
            'scheduled_at'    => $validated['scheduled_at'] ?? null,
            'expires_at'      => $validated['expires_at'] ?? null,
            'reminder_at'     => $validated['reminder_at'] ?? null,
        ]);

        $audienceType = $validated['audience_type'] ?? 'all';
        if ($audienceType === 'all') {
            $update->audiences()->create(['audience_type' => 'all', 'audience_value' => null]);
        } else {
            $values = $validated['audience_values'] ?? [];
            foreach ($values as $value) {
                $update->audiences()->create([
                    'audience_type'  => $audienceType,
                    'audience_value' => $value,
                ]);
            }
        }

        $label = $publishNow ? 'published' : 'saved as draft';
        return back()->with('success', "Update \"{$update->title}\" {$label}.");
    }

    // ─── Admin: Update Existing ──────────────────────────────

    public function update(Request $request, Update $update): RedirectResponse
    {
        if ($update->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $validated = $request->validate([
            'title'            => 'required|string|max:255',
            'body'             => 'required|string|max:10000',
            'type'             => 'required|in:announcement,news,event,poll',
            'category'         => 'nullable|string|max:100',
            'youtube_url'      => 'nullable|url|max:500',
            'is_pinned'        => 'boolean',
            'is_popup'         => 'boolean',
            'allow_comments'   => 'boolean',
            'allow_reactions'  => 'boolean',
            'expires_at'       => 'nullable|date',
            'reminder_at'      => 'nullable|date',
            'cover_image'      => 'nullable|image|max:5120',
            'upload_images'    => 'nullable|array|max:10',
            'upload_images.*'  => 'image|max:5120',
            'upload_files'     => 'nullable|array|max:10',
            'upload_files.*'   => 'file|max:10240',
            'remove_cover'     => 'boolean',
            'remove_images'    => 'nullable|array',
            'remove_images.*'  => 'string',
            'audience_type'    => 'nullable|in:all,department,role,user',
            'audience_values'  => 'nullable|array',
            'audience_values.*' => 'string',
        ]);

        $coverImagePath = $update->cover_image;
        if ($request->boolean('remove_cover') && $coverImagePath) {
            Storage::disk('public')->delete($coverImagePath);
            $coverImagePath = null;
        }
        if ($request->hasFile('cover_image')) {
            if ($update->cover_image) {
                Storage::disk('public')->delete($update->cover_image);
            }
            $coverImagePath = $request->file('cover_image')->store('updates/covers', 'public');
        }

        $existingImages = $update->images ?? [];
        $removeImages = $validated['remove_images'] ?? [];
        foreach ($removeImages as $img) {
            Storage::disk('public')->delete($img);
            $existingImages = array_values(array_filter($existingImages, fn ($i) => $i !== $img));
        }
        if ($request->hasFile('upload_images')) {
            foreach ($request->file('upload_images') as $image) {
                $existingImages[] = $image->store('updates/images', 'public');
            }
        }

        $existingAttachments = $update->attachments ?? [];
        if ($request->hasFile('upload_files')) {
            foreach ($request->file('upload_files') as $file) {
                $path = $file->store('updates/files', 'public');
                $existingAttachments[] = [
                    'name' => $file->getClientOriginalName(),
                    'path' => $path,
                    'type' => $file->getMimeType(),
                    'size' => $file->getSize(),
                ];
            }
        }

        $update->update([
            'title'           => $validated['title'],
            'body'            => $validated['body'],
            'cover_image'     => $coverImagePath,
            'attachments'     => !empty($existingAttachments) ? $existingAttachments : null,
            'images'          => !empty($existingImages) ? array_values($existingImages) : null,
            'youtube_url'     => $validated['youtube_url'] ?? null,
            'type'            => $validated['type'],
            'category'        => $validated['category'] ?? null,
            'is_pinned'       => $validated['is_pinned'] ?? false,
            'is_popup'        => $validated['is_popup'] ?? false,
            'allow_comments'  => $validated['allow_comments'] ?? true,
            'allow_reactions'  => $validated['allow_reactions'] ?? true,
            'expires_at'      => $validated['expires_at'] ?? null,
            'reminder_at'     => $validated['reminder_at'] ?? null,
        ]);

        if (isset($validated['audience_type'])) {
            $update->audiences()->delete();
            $audienceType = $validated['audience_type'];
            if ($audienceType === 'all') {
                $update->audiences()->create(['audience_type' => 'all', 'audience_value' => null]);
            } else {
                $values = $validated['audience_values'] ?? [];
                foreach ($values as $value) {
                    $update->audiences()->create([
                        'audience_type'  => $audienceType,
                        'audience_value' => $value,
                    ]);
                }
            }
        }

        return back()->with('success', 'Update saved.');
    }

    // ─── Admin: Delete ───────────────────────────────────────

    public function destroy(Request $request, Update $update): RedirectResponse
    {
        if ($update->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        if ($update->cover_image) {
            Storage::disk('public')->delete($update->cover_image);
        }
        if ($update->images) {
            foreach ($update->images as $img) {
                Storage::disk('public')->delete($img);
            }
        }
        if ($update->attachments) {
            foreach ($update->attachments as $att) {
                Storage::disk('public')->delete($att['path'] ?? '');
            }
        }

        $title = $update->title;
        $update->delete();

        return back()->with('success', "Update \"{$title}\" deleted.");
    }

    // ─── Admin: Publish ──────────────────────────────────────

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

    // ─── Admin: Archive ──────────────────────────────────────

    public function archive(Request $request, Update $update): RedirectResponse
    {
        if ($update->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $update->update(['status' => 'archived']);
        return back()->with('success', "Update \"{$update->title}\" archived.");
    }

    // ─── Admin: Toggle Pin ───────────────────────────────────

    public function togglePin(Request $request, Update $update): RedirectResponse
    {
        if ($update->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $update->update(['is_pinned' => !$update->is_pinned]);
        $label = $update->is_pinned ? 'pinned' : 'unpinned';
        return back()->with('success', "Update {$label}.");
    }

    // ─── Admin: Per-Post Analytics ───────────────────────────

    public function analytics(Request $request, Update $update): Response
    {
        if ($update->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $tenantId = $request->user()->tenant_id;
        $teamMembers = User::where('tenant_id', $tenantId)->select('id', 'name', 'email')->get();

        $reads = UpdateRead::where('update_id', $update->id)
            ->with('user:id,name,email')
            ->orderBy('read_at', 'desc')
            ->get()
            ->map(fn ($r) => [
                'user'    => $r->user ? ['id' => $r->user->id, 'name' => $r->user->name, 'email' => $r->user->email] : null,
                'read_at' => $r->read_at?->toDateTimeString(),
            ]);

        $readUserIds = $reads->pluck('user.id')->filter()->toArray();
        $unreadMembers = $teamMembers->filter(fn ($m) => !in_array($m->id, $readUserIds))->values();

        $reactions = UpdateReaction::where('update_id', $update->id)
            ->with('user:id,name')
            ->get()
            ->groupBy('emoji')
            ->map(fn ($group) => [
                'count' => $group->count(),
                'users' => $group->map(fn ($r) => $r->user ? ['id' => $r->user->id, 'name' => $r->user->name] : null)->filter()->values(),
            ]);

        $comments = UpdateComment::where('update_id', $update->id)
            ->with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($c) => [
                'id'         => $c->id,
                'body'       => $c->body,
                'user'       => $c->user ? ['id' => $c->user->id, 'name' => $c->user->name] : null,
                'created_at' => $c->created_at->toDateTimeString(),
            ]);

        return Inertia::render('Communication/UpdateAnalytics', [
            'update'        => $this->formatUpdate($update->loadCount(['comments', 'reactions', 'reads']), $request->user()->id),
            'reads'         => $reads,
            'unreadMembers' => $unreadMembers->map(fn ($m) => ['id' => $m->id, 'name' => $m->name, 'email' => $m->email]),
            'reactions'     => $reactions,
            'comments'      => $comments,
            'teamCount'     => $teamMembers->count(),
        ]);
    }

    // ═══ TEMPLATES ═══════════════════════════════════════════

    public function storeTemplate(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'title'           => 'nullable|string|max:255',
            'body'            => 'nullable|string|max:10000',
            'type'            => 'required|in:announcement,news,event,poll',
            'category'        => 'nullable|string|max:100',
            'allow_comments'  => 'boolean',
            'allow_reactions' => 'boolean',
            'cover_image'     => 'nullable|image|max:5120',
            'upload_images'   => 'nullable|array|max:10',
            'upload_images.*' => 'image|max:5120',
        ]);

        $coverImagePath = null;
        if ($request->hasFile('cover_image')) {
            $coverImagePath = $request->file('cover_image')->store('updates/templates', 'public');
        }

        $imagePaths = [];
        if ($request->hasFile('upload_images')) {
            foreach ($request->file('upload_images') as $image) {
                $imagePaths[] = $image->store('updates/templates', 'public');
            }
        }

        UpdateTemplate::create([
            'tenant_id'       => $user->tenant_id,
            'created_by'      => $user->id,
            'name'            => $validated['name'],
            'title'           => $validated['title'] ?? null,
            'body'            => $validated['body'] ?? null,
            'type'            => $validated['type'],
            'category'        => $validated['category'] ?? null,
            'cover_image'     => $coverImagePath,
            'images'          => !empty($imagePaths) ? $imagePaths : null,
            'allow_comments'  => $validated['allow_comments'] ?? true,
            'allow_reactions'  => $validated['allow_reactions'] ?? true,
        ]);

        return back()->with('success', "Template \"{$validated['name']}\" saved.");
    }

    public function saveAsTemplate(Request $request, Update $update): RedirectResponse
    {
        if ($update->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        UpdateTemplate::create([
            'tenant_id'       => $request->user()->tenant_id,
            'created_by'      => $request->user()->id,
            'name'            => $validated['name'],
            'title'           => $update->title,
            'body'            => $update->body,
            'type'            => $update->type,
            'category'        => $update->category,
            'cover_image'     => $update->cover_image,
            'images'          => $update->images,
            'allow_comments'  => $update->allow_comments,
            'allow_reactions'  => $update->allow_reactions,
        ]);

        return back()->with('success', "Template \"{$validated['name']}\" created from update.");
    }

    public function destroyTemplate(Request $request, UpdateTemplate $template): RedirectResponse
    {
        if ($template->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        if ($template->cover_image) {
            Storage::disk('public')->delete($template->cover_image);
        }
        if ($template->images) {
            foreach ($template->images as $img) {
                Storage::disk('public')->delete($img);
            }
        }

        $name = $template->name;
        $template->delete();

        return back()->with('success', "Template \"{$name}\" deleted.");
    }

    // ═══ USER-FACING FEED ════════════════════════════════════

    public function feed(Request $request): Response
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;

        $query = Update::where('tenant_id', $tenantId)
            ->where('status', 'published')
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>', now());
            })
            ->with([
                'creator:id,name,email',
                'comments' => fn ($q) => $q->with('user:id,name')->latest()->limit(10),
                'reactions',
                'audiences',
            ])
            ->withCount(['comments', 'reactions', 'reads']);

        $updates = $query->orderBy('is_pinned', 'desc')
            ->orderBy('published_at', 'desc')
            ->get()
            ->filter(function ($update) use ($user) {
                if ($update->audiences->isEmpty()) {
                    return true;
                }
                foreach ($update->audiences as $audience) {
                    if ($audience->audience_type === 'all') {
                        return true;
                    }
                    if ($audience->audience_type === 'user' && $audience->audience_value == $user->id) {
                        return true;
                    }
                    if ($audience->audience_type === 'department' && ($user->department ?? '') === $audience->audience_value) {
                        return true;
                    }
                    if ($audience->audience_type === 'role' && $user->role === $audience->audience_value) {
                        return true;
                    }
                }
                return false;
            })
            ->values()
            ->map(fn ($u) => $this->formatUpdateForFeed($u, $user->id));

        return Inertia::render('User/UserUpdates', [
            'updates' => $updates,
        ]);
    }

    // ═══ SHARED ACTIONS ══════════════════════════════════════

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

    public function deleteComment(Request $request, UpdateComment $comment): RedirectResponse
    {
        $post = $comment->post;
        if ($post->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        if ($comment->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            abort(403);
        }

        $comment->delete();
        return back()->with('success', 'Comment deleted.');
    }

    public function toggleReaction(Request $request, Update $update): RedirectResponse
    {
        if ($update->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $emoji  = $request->input('emoji', '👍');
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

    // ═══ HELPERS ═════════════════════════════════════════════

    private function formatUpdate(Update $update, int $currentUserId): array
    {
        return [
            'id'               => $update->id,
            'title'            => $update->title,
            'body'             => $update->body,
            'cover_image'      => $update->cover_image ? Storage::url($update->cover_image) : null,
            'attachments'      => $update->attachments ?? [],
            'images'           => $update->images ? array_map(fn ($p) => Storage::url($p), $update->images) : [],
            'youtube_url'      => $update->youtube_url,
            'type'             => $update->type,
            'category'         => $update->category,
            'status'           => $update->status,
            'is_pinned'        => $update->is_pinned,
            'is_popup'         => $update->is_popup,
            'allow_comments'   => $update->allow_comments,
            'allow_reactions'   => $update->allow_reactions,
            'published_at'     => $update->published_at?->toDateTimeString(),
            'scheduled_at'     => $update->scheduled_at?->toDateTimeString(),
            'expires_at'       => $update->expires_at?->toDateTimeString(),
            'reminder_at'      => $update->reminder_at?->toDateTimeString(),
            'creator'          => $update->creator ? ['id' => $update->creator->id, 'name' => $update->creator->name] : null,
            'audiences'        => $update->audiences ? $update->audiences->map(fn ($a) => [
                'type'  => $a->audience_type,
                'value' => $a->audience_value,
            ])->toArray() : [],
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
            'cover_image'      => $update->cover_image ? Storage::url($update->cover_image) : null,
            'attachments'      => $update->attachments ? array_map(fn ($a) => [
                'name' => $a['name'],
                'url'  => Storage::url($a['path']),
                'type' => $a['type'],
                'size' => $a['size'],
            ], $update->attachments) : [],
            'images'           => $update->images ? array_map(fn ($p) => Storage::url($p), $update->images) : [],
            'youtube_url'      => $update->youtube_url,
            'type'             => $update->type,
            'category'         => $update->category,
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
