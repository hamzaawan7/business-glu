<?php

namespace App\Http\Controllers;

use App\Models\Badge;
use App\Models\Recognition;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RecognitionController extends Controller
{
    // ─────────────────────────────────────────────────────────
    //  ADMIN — Recognition Dashboard
    // ─────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;

        $recognitions = Recognition::where('tenant_id', $tenantId)
            ->with(['sender:id,name', 'recipient:id,name', 'badge:id,name,emoji'])
            ->orderBy('created_at', 'desc')
            ->paginate(25)
            ->withQueryString();

        $stats = [
            'total'        => Recognition::where('tenant_id', $tenantId)->count(),
            'this_month'   => Recognition::where('tenant_id', $tenantId)->where('created_at', '>=', now()->startOfMonth())->count(),
            'total_points' => (int) Recognition::where('tenant_id', $tenantId)->sum('points'),
            'unique_recipients' => Recognition::where('tenant_id', $tenantId)->distinct('recipient_id')->count('recipient_id'),
        ];

        // Top recipients this month
        $topRecipients = Recognition::where('tenant_id', $tenantId)
            ->where('created_at', '>=', now()->startOfMonth())
            ->selectRaw('recipient_id, COUNT(*) as count, SUM(points) as total_points')
            ->groupBy('recipient_id')
            ->orderByDesc('count')
            ->limit(5)
            ->with('recipient:id,name')
            ->get();

        $badges    = Badge::where('tenant_id', $tenantId)->orderBy('name')->get();
        $employees = User::where('tenant_id', $tenantId)->get(['id', 'name', 'email']);

        return Inertia::render('HR/Recognition', [
            'recognitions'  => $recognitions,
            'stats'         => $stats,
            'topRecipients' => $topRecipients,
            'badges'        => $badges,
            'employees'     => $employees,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'recipient_id' => 'required|exists:users,id',
            'badge_id'     => 'nullable|exists:badges,id',
            'message'      => 'required|string|max:500',
            'visibility'   => 'required|in:public,private',
            'points'       => 'nullable|integer|min:0|max:1000',
        ]);

        Recognition::create([
            'tenant_id'    => $user->tenant_id,
            'sender_id'    => $user->id,
            'recipient_id' => $data['recipient_id'],
            'badge_id'     => $data['badge_id'] ?? null,
            'message'      => $data['message'],
            'visibility'   => $data['visibility'],
            'points'       => $data['points'] ?? 0,
        ]);

        return back()->with('flash', ['success' => 'Recognition sent!']);
    }

    public function destroy(Request $request, Recognition $recognition): RedirectResponse
    {
        abort_unless($recognition->tenant_id === $request->user()->tenant_id, 403);
        $recognition->delete();
        return back()->with('flash', ['success' => 'Recognition removed.']);
    }

    // ─────────────────────────────────────────────────────────
    //  Badge CRUD
    // ─────────────────────────────────────────────────────────

    public function storeBadge(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'emoji'       => 'nullable|string|max:20',
            'description' => 'nullable|string|max:255',
        ]);

        Badge::create([
            'tenant_id'   => $request->user()->tenant_id,
            'name'        => $data['name'],
            'emoji'       => $data['emoji'] ?? '⭐',
            'description' => $data['description'] ?? null,
        ]);

        return back()->with('flash', ['success' => 'Badge created.']);
    }

    public function destroyBadge(Request $request, Badge $badge): RedirectResponse
    {
        abort_unless($badge->tenant_id === $request->user()->tenant_id, 403);
        $badge->delete();
        return back()->with('flash', ['success' => 'Badge deleted.']);
    }

    // ─────────────────────────────────────────────────────────
    //  USER — Recognition Wall
    // ─────────────────────────────────────────────────────────

    public function browse(Request $request): Response
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;

        $feed = Recognition::where('tenant_id', $tenantId)
            ->where(function ($q) use ($user) {
                $q->where('visibility', 'public')
                  ->orWhere('sender_id', $user->id)
                  ->orWhere('recipient_id', $user->id);
            })
            ->with(['sender:id,name', 'recipient:id,name', 'badge:id,name,emoji'])
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        // My stats
        $myReceived  = Recognition::where('tenant_id', $tenantId)->where('recipient_id', $user->id)->count();
        $myPoints    = (int) Recognition::where('tenant_id', $tenantId)->where('recipient_id', $user->id)->sum('points');
        $mySent      = Recognition::where('tenant_id', $tenantId)->where('sender_id', $user->id)->count();

        $badges    = Badge::where('tenant_id', $tenantId)->where('is_active', true)->get(['id', 'name', 'emoji']);
        $employees = User::where('tenant_id', $tenantId)->where('id', '!=', $user->id)->get(['id', 'name']);

        return Inertia::render('User/UserRecognition', [
            'feed'      => $feed,
            'myStats'   => ['received' => $myReceived, 'points' => $myPoints, 'sent' => $mySent],
            'badges'    => $badges,
            'employees' => $employees,
        ]);
    }

    public function send(Request $request): RedirectResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'recipient_id' => 'required|exists:users,id|different:' . $user->id,
            'badge_id'     => 'nullable|exists:badges,id',
            'message'      => 'required|string|max:500',
        ]);

        Recognition::create([
            'tenant_id'    => $user->tenant_id,
            'sender_id'    => $user->id,
            'recipient_id' => $data['recipient_id'],
            'badge_id'     => $data['badge_id'] ?? null,
            'message'      => $data['message'],
            'visibility'   => 'public',
            'points'       => 0,
        ]);

        return back()->with('flash', ['success' => 'Recognition sent! 🎉']);
    }
}
