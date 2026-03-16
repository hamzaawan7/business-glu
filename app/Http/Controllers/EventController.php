<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventRsvp;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    // ─────────────────────────────────────────────────────────
    //  ADMIN — Full management dashboard
    // ─────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;
        $status   = $request->get('status', 'all');
        $type     = $request->get('type', 'all');

        $query = Event::where('tenant_id', $tenantId)
            ->with(['creator:id,name,email'])
            ->withCount([
                'rsvps',
                'rsvps as attending_count' => fn ($q) => $q->where('status', 'attending'),
                'rsvps as declined_count'  => fn ($q) => $q->where('status', 'declined'),
                'rsvps as maybe_count'     => fn ($q) => $q->where('status', 'maybe'),
            ])
            ->orderBy('starts_at', 'desc');

        if ($status !== 'all') {
            $query->where('status', $status);
        }
        if ($type !== 'all') {
            $query->where('type', $type);
        }

        $events = $query->get();

        $allEvents = Event::where('tenant_id', $tenantId);
        $stats = [
            'total'     => (clone $allEvents)->count(),
            'upcoming'  => (clone $allEvents)->where('status', 'published')->where('starts_at', '>', now())->count(),
            'draft'     => (clone $allEvents)->where('status', 'draft')->count(),
            'past'      => (clone $allEvents)->where('status', 'published')->where('starts_at', '<=', now())->count(),
        ];

        return Inertia::render('Communication/Events', [
            'events'  => $events,
            'filters' => ['status' => $status, 'type' => $type],
            'stats'   => $stats,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'title'           => 'required|string|max:255',
            'description'     => 'nullable|string|max:5000',
            'location'        => 'nullable|string|max:500',
            'type'            => 'required|in:general,meeting,social,training,other',
            'starts_at'       => 'required|date',
            'ends_at'         => 'nullable|date|after_or_equal:starts_at',
            'is_all_day'      => 'boolean',
            'is_recurring'    => 'boolean',
            'recurrence_rule' => 'nullable|in:daily,weekly,monthly',
            'recurrence_end'  => 'nullable|date|after:starts_at',
            'publish_now'     => 'boolean',
        ]);

        $event = Event::create([
            'tenant_id'       => $user->tenant_id,
            'created_by'      => $user->id,
            'title'           => $data['title'],
            'description'     => $data['description'] ?? null,
            'location'        => $data['location'] ?? null,
            'type'            => $data['type'],
            'starts_at'       => $data['starts_at'],
            'ends_at'         => $data['ends_at'] ?? null,
            'is_all_day'      => $data['is_all_day'] ?? false,
            'status'          => !empty($data['publish_now']) ? 'published' : 'draft',
            'is_recurring'    => $data['is_recurring'] ?? false,
            'recurrence_rule' => $data['recurrence_rule'] ?? null,
            'recurrence_end'  => $data['recurrence_end'] ?? null,
        ]);

        return back()->with('flash', ['success' => 'Event created.']);
    }

    public function update(Request $request, Event $event): RedirectResponse
    {
        $this->authorizeTenant($request, $event);

        $data = $request->validate([
            'title'           => 'required|string|max:255',
            'description'     => 'nullable|string|max:5000',
            'location'        => 'nullable|string|max:500',
            'type'            => 'required|in:general,meeting,social,training,other',
            'starts_at'       => 'required|date',
            'ends_at'         => 'nullable|date|after_or_equal:starts_at',
            'is_all_day'      => 'boolean',
            'is_recurring'    => 'boolean',
            'recurrence_rule' => 'nullable|in:daily,weekly,monthly',
            'recurrence_end'  => 'nullable|date|after:starts_at',
        ]);

        $event->update([
            'title'           => $data['title'],
            'description'     => $data['description'] ?? null,
            'location'        => $data['location'] ?? null,
            'type'            => $data['type'],
            'starts_at'       => $data['starts_at'],
            'ends_at'         => $data['ends_at'] ?? null,
            'is_all_day'      => $data['is_all_day'] ?? false,
            'is_recurring'    => $data['is_recurring'] ?? false,
            'recurrence_rule' => $data['recurrence_rule'] ?? null,
            'recurrence_end'  => $data['recurrence_end'] ?? null,
        ]);

        return back()->with('flash', ['success' => 'Event updated.']);
    }

    public function destroy(Request $request, Event $event): RedirectResponse
    {
        $this->authorizeTenant($request, $event);
        $event->delete();

        return back()->with('flash', ['success' => 'Event deleted.']);
    }

    public function publish(Request $request, Event $event): RedirectResponse
    {
        $this->authorizeTenant($request, $event);
        $event->update(['status' => 'published']);

        return back()->with('flash', ['success' => 'Event published.']);
    }

    public function cancel(Request $request, Event $event): RedirectResponse
    {
        $this->authorizeTenant($request, $event);
        $event->update(['status' => 'cancelled']);

        return back()->with('flash', ['success' => 'Event cancelled.']);
    }

    // ─────────────────────────────────────────────────────────
    //  USER — Browse & RSVP
    // ─────────────────────────────────────────────────────────

    public function browse(Request $request): Response
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;

        $upcomingEvents = Event::where('tenant_id', $tenantId)
            ->where('status', 'published')
            ->where('starts_at', '>', now())
            ->with(['creator:id,name'])
            ->withCount([
                'rsvps as attending_count' => fn ($q) => $q->where('status', 'attending'),
            ])
            ->orderBy('starts_at', 'asc')
            ->get()
            ->map(function ($event) use ($user) {
                $rsvp = EventRsvp::where('event_id', $event->id)
                    ->where('user_id', $user->id)
                    ->first();
                $event->my_rsvp = $rsvp ? $rsvp->status : null;
                return $event;
            });

        $pastEvents = Event::where('tenant_id', $tenantId)
            ->where('status', 'published')
            ->where('starts_at', '<=', now())
            ->with(['creator:id,name'])
            ->withCount([
                'rsvps as attending_count' => fn ($q) => $q->where('status', 'attending'),
            ])
            ->orderBy('starts_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($event) use ($user) {
                $rsvp = EventRsvp::where('event_id', $event->id)
                    ->where('user_id', $user->id)
                    ->first();
                $event->my_rsvp = $rsvp ? $rsvp->status : null;
                return $event;
            });

        return Inertia::render('User/UserEvents', [
            'upcomingEvents' => $upcomingEvents,
            'pastEvents'     => $pastEvents,
        ]);
    }

    public function rsvp(Request $request, Event $event): RedirectResponse
    {
        $this->authorizeTenant($request, $event);
        $user = $request->user();

        $data = $request->validate([
            'status' => 'required|in:attending,declined,maybe',
        ]);

        EventRsvp::updateOrCreate(
            ['event_id' => $event->id, 'user_id' => $user->id],
            ['tenant_id' => $user->tenant_id, 'status' => $data['status']],
        );

        return back()->with('flash', ['success' => 'RSVP updated.']);
    }

    // ─────────────────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────────────────

    private function authorizeTenant(Request $request, Event $event): void
    {
        abort_unless($event->tenant_id === $request->user()->tenant_id, 403);
    }
}
