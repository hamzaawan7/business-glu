<?php

namespace App\Http\Controllers;

use App\Models\TimelineEvent;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class TimelineController extends Controller
{
    // ─────────────────────────────────────────────────────────
    //  ADMIN — Timeline management
    // ─────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;

        $employeeId = $request->get('employee');
        $type       = $request->get('type', 'all');

        $employees = User::where('tenant_id', $tenantId)->get(['id', 'name', 'email']);

        $query = TimelineEvent::where('tenant_id', $tenantId)
            ->with(['user:id,name,email', 'creator:id,name'])
            ->orderBy('event_date', 'desc')
            ->orderBy('created_at', 'desc');

        if ($employeeId) $query->where('user_id', $employeeId);
        if ($type !== 'all') $query->where('type', $type);

        $events = $query->get();

        // Upcoming milestones: events in the next 30 days
        $upcoming = TimelineEvent::where('tenant_id', $tenantId)
            ->where('event_date', '>=', now()->toDateString())
            ->where('event_date', '<=', now()->addDays(30)->toDateString())
            ->with('user:id,name')
            ->orderBy('event_date')
            ->limit(10)
            ->get();

        $stats = [
            'total_events'    => TimelineEvent::where('tenant_id', $tenantId)->count(),
            'employees'       => $employees->count(),
            'upcoming'        => $upcoming->count(),
            'this_month'      => TimelineEvent::where('tenant_id', $tenantId)
                ->whereMonth('event_date', now()->month)
                ->whereYear('event_date', now()->year)
                ->count(),
        ];

        return Inertia::render('HR/Timeline', [
            'events'    => $events,
            'employees' => $employees,
            'upcoming'  => $upcoming,
            'stats'     => $stats,
            'filters'   => ['employee' => $employeeId, 'type' => $type],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'user_id'     => 'required|exists:users,id',
            'type'        => 'required|string',
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'event_date'  => 'required|date',
            'file'        => 'nullable|file|max:10240',
            'metadata'    => 'nullable|array',
        ]);

        $filePath = null;
        $fileName = null;
        if ($request->hasFile('file')) {
            $file     = $request->file('file');
            $fileName = $file->getClientOriginalName();
            $filePath = $file->store('timeline-files', 'public');
        }

        TimelineEvent::create([
            'tenant_id'   => $user->tenant_id,
            'user_id'     => $data['user_id'],
            'created_by'  => $user->id,
            'type'        => $data['type'],
            'title'       => $data['title'],
            'description' => $data['description'] ?? null,
            'event_date'  => $data['event_date'],
            'file_path'   => $filePath,
            'file_name'   => $fileName,
            'metadata'    => $data['metadata'] ?? null,
        ]);

        return back()->with('flash', ['success' => 'Timeline event added.']);
    }

    public function update(Request $request, TimelineEvent $event): RedirectResponse
    {
        abort_unless($event->tenant_id === $request->user()->tenant_id, 403);

        $data = $request->validate([
            'type'        => 'required|string',
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'event_date'  => 'required|date',
        ]);

        $event->update($data);

        return back()->with('flash', ['success' => 'Timeline event updated.']);
    }

    public function destroy(Request $request, TimelineEvent $event): RedirectResponse
    {
        abort_unless($event->tenant_id === $request->user()->tenant_id, 403);

        if ($event->file_path) {
            Storage::disk('public')->delete($event->file_path);
        }

        $event->delete();
        return back()->with('flash', ['success' => 'Timeline event deleted.']);
    }

    public function download(Request $request, TimelineEvent $event)
    {
        abort_unless($event->tenant_id === $request->user()->tenant_id, 403);
        abort_unless($event->file_path, 404);

        return Storage::disk('public')->download($event->file_path, $event->file_name);
    }

    // ─────────────────────────────────────────────────────────
    //  USER — My Timeline
    // ─────────────────────────────────────────────────────────

    public function myTimeline(Request $request): Response
    {
        $user = $request->user();

        $events = TimelineEvent::where('user_id', $user->id)
            ->with('creator:id,name')
            ->orderBy('event_date', 'desc')
            ->get();

        $upcoming = TimelineEvent::where('user_id', $user->id)
            ->where('event_date', '>=', now()->toDateString())
            ->where('event_date', '<=', now()->addDays(90)->toDateString())
            ->orderBy('event_date')
            ->get();

        return Inertia::render('User/UserTimeline', [
            'events'   => $events,
            'upcoming' => $upcoming,
        ]);
    }
}
