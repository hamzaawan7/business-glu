<?php

namespace App\Http\Controllers;

use App\Models\TimeEntry;
use App\Models\TimeEntryBreak;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TimeClockController extends Controller
{
    /**
     * Admin view: show all team time entries and today's overview.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;

        // Date filter (default: today)
        $date = $request->get('date', now()->toDateString());
        $startOfDay = Carbon::parse($date)->startOfDay();
        $endOfDay = Carbon::parse($date)->endOfDay();

        // Today's entries for the team
        $entries = TimeEntry::where('tenant_id', $tenantId)
            ->whereBetween('clock_in', [$startOfDay, $endOfDay])
            ->with(['user:id,name,email,role', 'breaks'])
            ->orderByDesc('clock_in')
            ->get()
            ->map(fn ($entry) => $this->formatEntry($entry));

        // Currently clocked-in employees
        $clockedInCount = TimeEntry::where('tenant_id', $tenantId)
            ->whereNull('clock_out')
            ->count();

        // Current user's active entry (if any)
        $myActiveEntry = TimeEntry::where('tenant_id', $tenantId)
            ->where('user_id', $user->id)
            ->whereNull('clock_out')
            ->with('breaks')
            ->first();

        return Inertia::render('Operations/TimeClock', [
            'entries'        => $entries,
            'clockedInCount' => $clockedInCount,
            'date'           => $date,
            'myActiveEntry'  => $myActiveEntry ? $this->formatEntry($myActiveEntry) : null,
        ]);
    }

    /**
     * User view: show personal time clock with clock in/out controls.
     */
    public function myTimeClock(Request $request): Response
    {
        $user = $request->user();

        // Active entry
        $activeEntry = TimeEntry::where('user_id', $user->id)
            ->where('tenant_id', $user->tenant_id)
            ->whereNull('clock_out')
            ->with('breaks')
            ->first();

        // Recent entries (last 7 days)
        $recentEntries = TimeEntry::where('user_id', $user->id)
            ->where('tenant_id', $user->tenant_id)
            ->whereNotNull('clock_out')
            ->orderByDesc('clock_in')
            ->limit(20)
            ->with('breaks')
            ->get()
            ->map(fn ($entry) => $this->formatEntry($entry));

        // This week's total
        $weekStart = now()->startOfWeek();
        $weekEntries = TimeEntry::where('user_id', $user->id)
            ->where('tenant_id', $user->tenant_id)
            ->where('clock_in', '>=', $weekStart)
            ->get();

        $weekTotalMinutes = $weekEntries->sum(function ($entry) {
            return $entry->total_minutes ?? $entry->calculateTotalMinutes();
        });

        return Inertia::render('User/MyTimeClock', [
            'activeEntry'      => $activeEntry ? $this->formatEntry($activeEntry) : null,
            'recentEntries'    => $recentEntries,
            'weekTotalMinutes' => $weekTotalMinutes,
        ]);
    }

    /**
     * Clock in.
     */
    public function clockIn(Request $request): RedirectResponse
    {
        $user = $request->user();

        // Check if already clocked in
        $existing = TimeEntry::where('user_id', $user->id)
            ->where('tenant_id', $user->tenant_id)
            ->whereNull('clock_out')
            ->exists();

        if ($existing) {
            return back()->with('error', 'You are already clocked in.');
        }

        $validated = $request->validate([
            'note' => 'nullable|string|max:500',
            'lat'  => 'nullable|numeric',
            'lng'  => 'nullable|numeric',
        ]);

        TimeEntry::create([
            'tenant_id'     => $user->tenant_id,
            'user_id'       => $user->id,
            'clock_in'      => now(),
            'clock_in_lat'  => $validated['lat'] ?? null,
            'clock_in_lng'  => $validated['lng'] ?? null,
            'clock_in_note' => $validated['note'] ?? null,
            'status'        => 'active',
        ]);

        return back()->with('success', 'Clocked in successfully!');
    }

    /**
     * Clock out.
     */
    public function clockOut(Request $request): RedirectResponse
    {
        $user = $request->user();

        $entry = TimeEntry::where('user_id', $user->id)
            ->where('tenant_id', $user->tenant_id)
            ->whereNull('clock_out')
            ->first();

        if (!$entry) {
            return back()->with('error', 'You are not clocked in.');
        }

        // End any active break first
        $activeBreak = $entry->activeBreak();
        if ($activeBreak) {
            $duration = $activeBreak->calculateDuration();
            $activeBreak->update([
                'end'              => now(),
                'duration_minutes' => $duration,
            ]);
            $entry->increment('total_break_minutes', $duration);
            $entry->refresh();
        }

        $validated = $request->validate([
            'note' => 'nullable|string|max:500',
            'lat'  => 'nullable|numeric',
            'lng'  => 'nullable|numeric',
        ]);

        $totalMinutes = $entry->calculateTotalMinutes();

        $entry->update([
            'clock_out'      => now(),
            'clock_out_lat'  => $validated['lat'] ?? null,
            'clock_out_lng'  => $validated['lng'] ?? null,
            'clock_out_note' => $validated['note'] ?? null,
            'total_minutes'  => $totalMinutes,
            'status'         => 'completed',
        ]);

        return back()->with('success', 'Clocked out. Total: ' . TimeEntry::formatMinutes($totalMinutes));
    }

    /**
     * Start a break.
     */
    public function startBreak(Request $request): RedirectResponse
    {
        $user = $request->user();

        $entry = TimeEntry::where('user_id', $user->id)
            ->where('tenant_id', $user->tenant_id)
            ->whereNull('clock_out')
            ->first();

        if (!$entry) {
            return back()->with('error', 'You are not clocked in.');
        }

        if ($entry->isOnBreak()) {
            return back()->with('error', 'You are already on a break.');
        }

        $validated = $request->validate([
            'type' => 'nullable|string|in:paid,unpaid',
        ]);

        TimeEntryBreak::create([
            'time_entry_id' => $entry->id,
            'start'         => now(),
            'type'          => $validated['type'] ?? 'unpaid',
        ]);

        return back()->with('success', 'Break started.');
    }

    /**
     * End a break.
     */
    public function endBreak(Request $request): RedirectResponse
    {
        $user = $request->user();

        $entry = TimeEntry::where('user_id', $user->id)
            ->where('tenant_id', $user->tenant_id)
            ->whereNull('clock_out')
            ->first();

        if (!$entry) {
            return back()->with('error', 'You are not clocked in.');
        }

        $activeBreak = $entry->activeBreak();

        if (!$activeBreak) {
            return back()->with('error', 'You are not on a break.');
        }

        $duration = $activeBreak->calculateDuration();

        $activeBreak->update([
            'end'              => now(),
            'duration_minutes' => $duration,
        ]);

        $entry->increment('total_break_minutes', $duration);

        return back()->with('success', 'Break ended (' . $duration . 'm).');
    }

    /**
     * Format a time entry for the frontend.
     */
    private function formatEntry(TimeEntry $entry): array
    {
        $isOnBreak = $entry->breaks->contains(fn ($b) => is_null($b->end));

        return [
            'id'                  => $entry->id,
            'user_id'             => $entry->user_id,
            'user'                => $entry->relationLoaded('user') ? $entry->user?->only(['id', 'name', 'email', 'role']) : null,
            'clock_in'            => $entry->clock_in->toISOString(),
            'clock_out'           => $entry->clock_out?->toISOString(),
            'clock_in_note'       => $entry->clock_in_note,
            'clock_out_note'      => $entry->clock_out_note,
            'total_break_minutes' => $entry->total_break_minutes,
            'total_minutes'       => $entry->total_minutes ?? $entry->calculateTotalMinutes(),
            'total_formatted'     => TimeEntry::formatMinutes($entry->total_minutes ?? $entry->calculateTotalMinutes()),
            'status'              => $entry->status,
            'is_active'           => $entry->isActive(),
            'is_on_break'         => $isOnBreak,
            'breaks'              => $entry->breaks->map(fn ($b) => [
                'id'               => $b->id,
                'start'            => $b->start->toISOString(),
                'end'              => $b->end?->toISOString(),
                'type'             => $b->type,
                'duration_minutes' => $b->duration_minutes ?? $b->calculateDuration(),
                'is_active'        => $b->isActive(),
            ]),
        ];
    }
}
