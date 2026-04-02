<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventRsvp;
use App\Models\Update;
use App\Models\UpdateRead;
use App\Models\Task;
use App\Models\TimeEntry;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class FeedController extends Controller
{
    /**
     * User Home — dashboard with recent feed items preview.
     */
    public function home(Request $request): Response
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;

        // Quick stats
        $hoursThisWeek = round(
            TimeEntry::where('user_id', $user->id)
                ->where('clock_in', '>=', now()->startOfWeek())
                ->get()
                ->sum(fn ($e) => $e->clock_out
                    ? $e->clock_in->diffInMinutes($e->clock_out) / 60
                    : $e->clock_in->diffInMinutes(now()) / 60
                ), 1
        );
        $upcomingShifts = \App\Models\Shift::where('tenant_id', $tenantId)
            ->where('user_id', $user->id)
            ->where('date', '>=', now()->toDateString())
            ->where('date', '<=', now()->addDays(7)->toDateString())
            ->count();
        $openTasks      = Task::where('tenant_id', $tenantId)
            ->where('assigned_to', $user->id)
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->count();
        $unreadMessages = 0; // TODO: implement chat unread count

        // Recent feed items (last 5) for the home preview
        $recentUpdates = Update::where('tenant_id', $tenantId)
            ->where('status', 'published')
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->with(['creator:id,name,email', 'audiences'])
            ->withCount(['reads'])
            ->orderBy('published_at', 'desc')
            ->limit(10)
            ->get()
            ->filter(function ($update) use ($user) {
                if ($update->audiences->isEmpty()) return true;
                foreach ($update->audiences as $audience) {
                    if ($audience->audience_type === 'all') return true;
                    if ($audience->audience_type === 'user' && $audience->audience_value == $user->id) return true;
                    if ($audience->audience_type === 'department' && ($user->department ?? '') === $audience->audience_value) return true;
                    if ($audience->audience_type === 'role' && $user->role === $audience->audience_value) return true;
                }
                return false;
            })
            ->take(3)
            ->values()
            ->map(fn ($u) => [
                'id'           => $u->id,
                'title'        => $u->title,
                'type'         => $u->type,
                'creator_name' => $u->creator?->name ?? 'Unknown',
                'published_at' => $u->published_at?->toDateTimeString() ?? $u->created_at->toDateTimeString(),
                'is_read'      => $u->reads->where('user_id', $user->id)->isNotEmpty(),
            ]);

        $upcomingEvents = Event::where('tenant_id', $tenantId)
            ->where('status', 'published')
            ->where('starts_at', '>', now())
            ->with(['creator:id,name'])
            ->orderBy('starts_at', 'asc')
            ->limit(3)
            ->get()
            ->map(fn ($e) => [
                'id'        => $e->id,
                'title'     => $e->title,
                'type'      => $e->type,
                'starts_at' => $e->starts_at->toDateTimeString(),
                'location'  => $e->location,
            ]);

        return Inertia::render('User/Home', [
            'stats' => [
                'hoursThisWeek'  => $hoursThisWeek,
                'upcomingShifts' => $upcomingShifts,
                'openTasks'      => $openTasks,
                'unreadMessages' => $unreadMessages,
            ],
            'recentUpdates'  => $recentUpdates,
            'upcomingEvents' => $upcomingEvents,
        ]);
    }

    /**
     * Unified feed — merges published Updates + published Events into a single
     * social-media-style timeline sorted by date (newest first).
     */
    public function index(Request $request): Response
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;

        // ── Updates ────────────────────────────────────────
        $updates = Update::where('tenant_id', $tenantId)
            ->where('status', 'published')
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>', now());
            })
            ->with([
                'creator:id,name,email',
                'comments' => fn ($q) => $q->with('user:id,name')->latest()->limit(20),
                'reactions',
                'audiences',
            ])
            ->withCount(['comments', 'reactions', 'reads'])
            ->orderBy('is_pinned', 'desc')
            ->orderBy('published_at', 'desc')
            ->get()
            ->filter(function ($update) use ($user) {
                if ($update->audiences->isEmpty()) return true;
                foreach ($update->audiences as $audience) {
                    if ($audience->audience_type === 'all') return true;
                    if ($audience->audience_type === 'user' && $audience->audience_value == $user->id) return true;
                    if ($audience->audience_type === 'department' && ($user->department ?? '') === $audience->audience_value) return true;
                    if ($audience->audience_type === 'role' && $user->role === $audience->audience_value) return true;
                }
                return false;
            })
            ->values()
            ->map(fn ($u) => $this->formatUpdateForFeed($u, $user->id));

        // ── Events ────────────────────────────────────────
        $events = Event::where('tenant_id', $tenantId)
            ->where('status', 'published')
            ->with(['creator:id,name'])
            ->withCount([
                'rsvps as attending_count' => fn ($q) => $q->where('status', 'attending'),
            ])
            ->orderBy('starts_at', 'desc')
            ->limit(50)
            ->get()
            ->map(function ($event) use ($user) {
                $rsvp = EventRsvp::where('event_id', $event->id)
                    ->where('user_id', $user->id)
                    ->first();

                return [
                    'feed_type'       => 'event',
                    'feed_date'       => $event->starts_at->toDateTimeString(),
                    'id'              => $event->id,
                    'title'           => $event->title,
                    'description'     => $event->description,
                    'location'        => $event->location,
                    'type'            => $event->type,
                    'starts_at'       => $event->starts_at->toDateTimeString(),
                    'ends_at'         => $event->ends_at?->toDateTimeString(),
                    'is_all_day'      => $event->is_all_day,
                    'is_recurring'    => $event->is_recurring,
                    'creator'         => $event->creator ? ['id' => $event->creator->id, 'name' => $event->creator->name] : null,
                    'attending_count' => $event->attending_count,
                    'my_rsvp'         => $rsvp?->status,
                    'is_upcoming'     => $event->starts_at->isFuture(),
                ];
            });

        // ── Merge & sort ──────────────────────────────────
        // Pinned updates always go to the top, then everything else by date
        $pinned = $updates->filter(fn ($u) => $u['is_pinned'])->values();
        $unpinned = $updates->filter(fn ($u) => !$u['is_pinned']);

        $merged = $unpinned->concat($events)
            ->sortByDesc('feed_date')
            ->values();

        // Check for any popup updates the user hasn't read yet
        $popupUpdate = $updates->first(fn ($u) => $u['is_popup'] && !$u['is_read']);

        return Inertia::render('User/UserFeed', [
            'pinnedItems'  => $pinned,
            'feedItems'    => $merged,
            'popupUpdate'  => $popupUpdate,
        ]);
    }

    // ── Helpers ─────────────────────────────────────────────

    private function formatUpdateForFeed(Update $update, int $currentUserId): array
    {
        $reactionCounts = $update->reactions->groupBy('emoji')->map(fn ($group) => $group->count());
        $myReactions    = $update->reactions->where('user_id', $currentUserId)->pluck('emoji')->toArray();
        $isRead         = $update->reads->where('user_id', $currentUserId)->isNotEmpty();

        return [
            'feed_type'        => 'update',
            'feed_date'        => $update->published_at?->toDateTimeString() ?? $update->created_at->toDateTimeString(),
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
            'allow_reactions'  => $update->allow_reactions,
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
