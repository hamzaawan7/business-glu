<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DirectoryController extends Controller
{
    /**
     * Admin view: full directory with management capabilities.
     */
    public function index(Request $request): Response
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;
        $search   = $request->get('search', '');
        $dept     = $request->get('department', 'all');
        $role     = $request->get('role', 'all');

        $query = User::where('tenant_id', $tenantId)
            ->select([
                'id', 'name', 'email', 'phone', 'role', 'position',
                'department', 'location', 'bio', 'avatar_url',
                'hire_date', 'directory_visible', 'created_at',
            ])
            ->orderBy('name');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('position', 'like', "%{$search}%")
                  ->orWhere('department', 'like', "%{$search}%")
                  ->orWhere('location', 'like', "%{$search}%");
            });
        }
        if ($dept !== 'all') {
            $query->where('department', $dept);
        }
        if ($role !== 'all') {
            $query->where('role', $role);
        }

        $members = $query->get()->map(fn ($m) => $this->formatMember($m));

        // Gather unique departments for the filter dropdown
        $departments = User::where('tenant_id', $tenantId)
            ->whereNotNull('department')
            ->where('department', '!=', '')
            ->distinct()
            ->pluck('department')
            ->sort()
            ->values()
            ->toArray();

        // Gather unique locations
        $locations = User::where('tenant_id', $tenantId)
            ->whereNotNull('location')
            ->where('location', '!=', '')
            ->distinct()
            ->pluck('location')
            ->sort()
            ->values()
            ->toArray();

        $stats = [
            'total'       => User::where('tenant_id', $tenantId)->count(),
            'visible'     => User::where('tenant_id', $tenantId)->where('directory_visible', true)->count(),
            'departments' => count($departments),
            'locations'   => count($locations),
        ];

        return Inertia::render('Communication/Directory', [
            'members'     => $members,
            'filters'     => ['search' => $search, 'department' => $dept, 'role' => $role],
            'departments' => $departments,
            'locations'   => $locations,
            'stats'       => $stats,
        ]);
    }

    /**
     * Update a team member's profile fields (admin action).
     */
    public function updateProfile(Request $request, User $member): RedirectResponse
    {
        if ($member->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $validated = $request->validate([
            'phone'             => 'nullable|string|max:30',
            'position'          => 'nullable|string|max:255',
            'department'        => 'nullable|string|max:255',
            'location'          => 'nullable|string|max:255',
            'bio'               => 'nullable|string|max:1000',
            'hire_date'         => 'nullable|date',
            'directory_visible' => 'boolean',
        ]);

        $member->update($validated);

        return back()->with('success', "Profile for {$member->name} updated.");
    }

    /**
     * Bulk update department for selected members.
     */
    public function bulkUpdateDepartment(Request $request): RedirectResponse
    {
        $tenantId = $request->user()->tenant_id;

        $validated = $request->validate([
            'member_ids'  => 'required|array|min:1',
            'member_ids.*' => 'integer',
            'department'  => 'required|string|max:255',
        ]);

        User::where('tenant_id', $tenantId)
            ->whereIn('id', $validated['member_ids'])
            ->update(['department' => $validated['department']]);

        $count = count($validated['member_ids']);

        return back()->with('success', "Department updated for {$count} member(s).");
    }

    /**
     * User view: browse visible directory members.
     */
    public function browse(Request $request): Response
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;
        $search   = $request->get('search', '');
        $dept     = $request->get('department', 'all');

        $query = User::where('tenant_id', $tenantId)
            ->where('directory_visible', true)
            ->select([
                'id', 'name', 'email', 'phone', 'role', 'position',
                'department', 'location', 'bio', 'avatar_url', 'hire_date',
            ])
            ->orderBy('name');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('position', 'like', "%{$search}%")
                  ->orWhere('department', 'like', "%{$search}%")
                  ->orWhere('location', 'like', "%{$search}%");
            });
        }
        if ($dept !== 'all') {
            $query->where('department', $dept);
        }

        $members = $query->get()->map(fn ($m) => [
            'id'         => $m->id,
            'name'       => $m->name,
            'email'      => $m->email,
            'phone'      => $m->phone,
            'role'       => $m->role,
            'position'   => $m->position,
            'department' => $m->department,
            'location'   => $m->location,
            'bio'        => $m->bio,
            'avatar_url' => $m->avatar_url,
            'hire_date'  => $m->hire_date?->toDateString(),
        ]);

        $departments = User::where('tenant_id', $tenantId)
            ->where('directory_visible', true)
            ->whereNotNull('department')
            ->where('department', '!=', '')
            ->distinct()
            ->pluck('department')
            ->sort()
            ->values()
            ->toArray();

        return Inertia::render('User/UserDirectory', [
            'members'     => $members,
            'departments' => $departments,
            'filters'     => ['search' => $search, 'department' => $dept],
        ]);
    }

    // ─── Helpers ──────────────────────────────────────────────

    private function formatMember(User $member): array
    {
        return [
            'id'                => $member->id,
            'name'              => $member->name,
            'email'             => $member->email,
            'phone'             => $member->phone,
            'role'              => $member->role,
            'position'          => $member->position,
            'department'        => $member->department,
            'location'          => $member->location,
            'bio'               => $member->bio,
            'avatar_url'        => $member->avatar_url,
            'hire_date'         => $member->hire_date?->toDateString(),
            'directory_visible' => $member->directory_visible,
            'created_at'        => $member->created_at->toDateTimeString(),
        ];
    }
}
