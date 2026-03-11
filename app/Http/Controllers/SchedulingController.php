<?php

namespace App\Http\Controllers;

use App\Models\Shift;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SchedulingController extends Controller
{
    /**
     * Admin view: weekly schedule grid.
     */
    public function index(Request $request): Response
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;

        // Week navigation: ?week=2026-03-09 (Monday of the desired week)
        $weekStart = $request->get('week')
            ? Carbon::parse($request->get('week'))->startOfWeek()
            : now()->startOfWeek();

        $weekEnd = $weekStart->copy()->endOfWeek();

        // Build array of dates for the week header
        $dates = [];
        foreach (CarbonPeriod::create($weekStart, $weekEnd) as $day) {
            $dates[] = [
                'date'      => $day->toDateString(),
                'dayName'   => $day->format('D'),
                'dayNumber' => $day->format('j'),
                'isToday'   => $day->isToday(),
            ];
        }

        // Fetch all shifts for this week
        $shifts = Shift::where('tenant_id', $tenantId)
            ->whereBetween('date', [$weekStart->toDateString(), $weekEnd->toDateString()])
            ->with('user:id,name,email,role')
            ->orderBy('date')
            ->orderBy('start_time')
            ->get()
            ->map(fn ($shift) => $this->formatShift($shift));

        // Team members for the assignment dropdown
        $members = User::where('tenant_id', $tenantId)
            ->select('id', 'name', 'email', 'role')
            ->orderBy('name')
            ->get();

        // Stats
        $totalShifts   = $shifts->count();
        $totalHours    = $shifts->sum('duration_hours');
        $openShifts    = $shifts->where('is_open', true)->count();
        $publishedCount = $shifts->where('is_published', true)->count();

        return Inertia::render('Operations/Scheduling', [
            'dates'       => $dates,
            'shifts'      => $shifts,
            'members'     => $members,
            'weekStart'   => $weekStart->toDateString(),
            'weekEnd'     => $weekEnd->toDateString(),
            'weekLabel'   => $weekStart->format('M j') . ' – ' . $weekEnd->format('M j, Y'),
            'stats'       => [
                'totalShifts'  => $totalShifts,
                'totalHours'   => round($totalHours, 1),
                'openShifts'   => $openShifts,
                'published'    => $publishedCount,
            ],
        ]);
    }

    /**
     * Store a new shift (with optional recurrence).
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'user_id'         => 'nullable|exists:users,id',
            'title'           => 'nullable|string|max:100',
            'date'            => 'required|date',
            'start_time'      => 'required|date_format:H:i',
            'end_time'        => 'required|date_format:H:i',
            'color'           => 'nullable|string|max:7',
            'location'        => 'nullable|string|max:255',
            'notes'           => 'nullable|string|max:1000',
            'is_open'         => 'boolean',
            'repeat_type'     => 'nullable|in:none,weekly',
            'repeat_end_date' => 'nullable|date|after:date',
        ]);

        $repeatType = $validated['repeat_type'] ?? 'none';

        $baseData = [
            'tenant_id'  => $user->tenant_id,
            'created_by' => $user->id,
            'user_id'    => $validated['user_id'] ?? null,
            'title'      => $validated['title'] ?? null,
            'start_time' => $validated['start_time'],
            'end_time'   => $validated['end_time'],
            'color'      => $validated['color'] ?? '#495B67',
            'location'   => $validated['location'] ?? null,
            'notes'      => $validated['notes'] ?? null,
            'is_open'    => $validated['is_open'] ?? false,
        ];

        if ($repeatType === 'none' || ! $repeatType) {
            Shift::create(array_merge($baseData, [
                'date' => $validated['date'],
            ]));
            return back()->with('success', 'Shift created successfully.');
        }

        // ── Recurring shift generation ────────────────────────
        $groupId      = now()->timestamp . mt_rand(1000, 9999);
        $startDate    = Carbon::parse($validated['date']);
        $endDate      = ! empty($validated['repeat_end_date'])
            ? Carbon::parse($validated['repeat_end_date'])
            : $startDate->copy()->addYear(); // default: 1 year if "forever"
        $repeatEndDate = ! empty($validated['repeat_end_date'])
            ? $validated['repeat_end_date']
            : null;

        $interval = 7; // weekly
        $count    = 0;
        $current  = $startDate->copy();

        while ($current->lte($endDate) && $count < 52) { // cap at 52 weeks
            Shift::create(array_merge($baseData, [
                'date'            => $current->toDateString(),
                'repeat_type'     => 'weekly',
                'repeat_group_id' => $groupId,
                'repeat_end_date' => $repeatEndDate,
            ]));
            $count++;
            $current->addDays($interval);
        }

        return back()->with('success', "{$count} recurring shift(s) created.");
    }

    /**
     * Update an existing shift.
     */
    public function update(Request $request, Shift $shift): RedirectResponse
    {
        $user = $request->user();

        // Ensure same tenant
        if ($shift->tenant_id !== $user->tenant_id) {
            abort(403);
        }

        $validated = $request->validate([
            'user_id'    => 'nullable|exists:users,id',
            'title'      => 'nullable|string|max:100',
            'date'       => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time'   => 'required|date_format:H:i',
            'color'      => 'nullable|string|max:7',
            'location'   => 'nullable|string|max:255',
            'notes'      => 'nullable|string|max:1000',
            'is_open'    => 'boolean',
        ]);

        $shift->update([
            'user_id'    => $validated['user_id'] ?? null,
            'title'      => $validated['title'] ?? null,
            'date'       => $validated['date'],
            'start_time' => $validated['start_time'],
            'end_time'   => $validated['end_time'],
            'color'      => $validated['color'] ?? $shift->color,
            'location'   => $validated['location'] ?? null,
            'notes'      => $validated['notes'] ?? null,
            'is_open'    => $validated['is_open'] ?? false,
        ]);

        return back()->with('success', 'Shift updated successfully.');
    }

    /**
     * Delete shift(s) — supports Google Calendar-style scopes for recurring shifts.
     *
     * delete_scope: "this" | "following" | "all"
     */
    public function destroy(Request $request, Shift $shift): RedirectResponse
    {
        if ($shift->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $scope = $request->input('delete_scope', 'this');

        // Non-recurring shift — just delete it
        if (! $shift->repeat_group_id) {
            $shift->delete();
            return back()->with('success', 'Shift deleted.');
        }

        // Recurring shift — scope-based deletion
        switch ($scope) {
            case 'all':
                $count = Shift::where('repeat_group_id', $shift->repeat_group_id)->delete();
                return back()->with('success', "{$count} recurring shift(s) deleted.");

            case 'following':
                $count = Shift::where('repeat_group_id', $shift->repeat_group_id)
                    ->where('date', '>=', $shift->date->toDateString())
                    ->delete();
                return back()->with('success', "{$count} shift(s) deleted from this date onward.");

            default: // 'this'
                $shift->delete();
                return back()->with('success', 'Shift deleted.');
        }
    }

    /**
     * Publish all unpublished shifts for a given week.
     */
    public function publish(Request $request): RedirectResponse
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;

        $validated = $request->validate([
            'week_start' => 'required|date',
            'week_end'   => 'required|date',
        ]);

        $count = Shift::where('tenant_id', $tenantId)
            ->whereBetween('date', [$validated['week_start'], $validated['week_end']])
            ->where('is_published', false)
            ->update(['is_published' => true]);

        if ($count === 0) {
            return back()->with('error', 'No unpublished shifts to publish.');
        }

        return back()->with('success', "{$count} shift(s) published successfully.");
    }

    /**
     * Duplicate a week's shifts to a target week.
     */
    public function duplicate(Request $request): RedirectResponse
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;

        $validated = $request->validate([
            'source_week' => 'required|date',
            'target_week' => 'required|date',
        ]);

        $sourceStart = Carbon::parse($validated['source_week'])->startOfWeek();
        $targetStart = Carbon::parse($validated['target_week'])->startOfWeek();
        $daysDiff    = $sourceStart->diffInDays($targetStart);

        $sourceShifts = Shift::where('tenant_id', $tenantId)
            ->whereBetween('date', [
                $sourceStart->toDateString(),
                $sourceStart->copy()->endOfWeek()->toDateString(),
            ])
            ->get();

        if ($sourceShifts->isEmpty()) {
            return back()->with('error', 'No shifts found in the source week.');
        }

        $count = 0;
        foreach ($sourceShifts as $shift) {
            Shift::create([
                'tenant_id'  => $tenantId,
                'user_id'    => $shift->user_id,
                'created_by' => $user->id,
                'title'      => $shift->title,
                'date'       => Carbon::parse($shift->date)->addDays($daysDiff)->toDateString(),
                'start_time' => $shift->start_time,
                'end_time'   => $shift->end_time,
                'color'      => $shift->color,
                'location'   => $shift->location,
                'notes'      => $shift->notes,
                'is_open'    => $shift->is_open,
            ]);
            $count++;
        }

        return back()->with('success', "{$count} shift(s) duplicated to " . $targetStart->format('M j') . '.');
    }

    /**
     * User view: personal upcoming schedule.
     */
    public function mySchedule(Request $request): Response
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;

        // This week
        $weekStart = now()->startOfWeek();
        $weekEnd   = now()->endOfWeek();

        $dates = [];
        foreach (CarbonPeriod::create($weekStart, $weekEnd) as $day) {
            $dates[] = [
                'date'      => $day->toDateString(),
                'dayName'   => $day->format('D'),
                'dayNumber' => $day->format('j'),
                'isToday'   => $day->isToday(),
            ];
        }

        // My shifts this week
        $myShifts = Shift::where('tenant_id', $tenantId)
            ->where('user_id', $user->id)
            ->where('is_published', true)
            ->whereBetween('date', [$weekStart->toDateString(), $weekEnd->toDateString()])
            ->orderBy('date')
            ->orderBy('start_time')
            ->get()
            ->map(fn ($shift) => $this->formatShift($shift));

        // Upcoming shifts (next 14 days beyond this week)
        $upcomingShifts = Shift::where('tenant_id', $tenantId)
            ->where('user_id', $user->id)
            ->where('is_published', true)
            ->where('date', '>', $weekEnd->toDateString())
            ->where('date', '<=', now()->addDays(21)->toDateString())
            ->orderBy('date')
            ->orderBy('start_time')
            ->get()
            ->map(fn ($shift) => $this->formatShift($shift));

        // Open shifts (unclaimed, published)
        $openShifts = Shift::where('tenant_id', $tenantId)
            ->where('is_open', true)
            ->where('is_published', true)
            ->whereNull('user_id')
            ->where('date', '>=', now()->toDateString())
            ->orderBy('date')
            ->orderBy('start_time')
            ->limit(10)
            ->get()
            ->map(fn ($shift) => $this->formatShift($shift));

        // This week's total scheduled hours
        $weekTotalHours = $myShifts->sum('duration_hours');

        return Inertia::render('User/MySchedule', [
            'dates'          => $dates,
            'myShifts'       => $myShifts,
            'upcomingShifts' => $upcomingShifts,
            'openShifts'     => $openShifts,
            'weekTotalHours' => round($weekTotalHours, 1),
            'weekLabel'      => $weekStart->format('M j') . ' – ' . $weekEnd->format('M j'),
        ]);
    }

    /**
     * Claim an open shift.
     */
    public function claim(Request $request, Shift $shift): RedirectResponse
    {
        $user = $request->user();

        if ($shift->tenant_id !== $user->tenant_id) {
            abort(403);
        }

        if (! $shift->is_open || $shift->user_id !== null) {
            return back()->with('error', 'This shift is no longer available.');
        }

        $shift->update([
            'user_id' => $user->id,
            'is_open' => false,
        ]);

        return back()->with('success', 'Shift claimed! It has been added to your schedule.');
    }

    /**
     * Format a shift for the frontend.
     */
    private function formatShift(Shift $shift): array
    {
        return [
            'id'              => $shift->id,
            'user_id'         => $shift->user_id,
            'user'            => $shift->user ? [
                'id'    => $shift->user->id,
                'name'  => $shift->user->name,
                'email' => $shift->user->email,
                'role'  => $shift->user->role,
            ] : null,
            'title'           => $shift->title,
            'date'            => $shift->date->toDateString(),
            'start_time'      => substr($shift->start_time, 0, 5),
            'end_time'        => substr($shift->end_time, 0, 5),
            'duration_hours'  => $shift->durationHours(),
            'duration_label'  => $shift->formattedDuration(),
            'color'           => $shift->color,
            'location'        => $shift->location,
            'notes'           => $shift->notes,
            'is_published'    => $shift->is_published,
            'is_open'         => $shift->is_open && $shift->user_id === null,
            'is_recurring'    => $shift->repeat_group_id !== null,
            'repeat_type'     => $shift->repeat_type,
            'repeat_group_id' => $shift->repeat_group_id,
            'status'          => $shift->status,
        ];
    }
}
