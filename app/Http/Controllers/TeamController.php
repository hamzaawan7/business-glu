<?php

namespace App\Http\Controllers;

use App\Models\TeamInvitation;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TeamController extends Controller
{
    /**
     * Display the team management page.
     */
    public function index(): Response
    {
        $user = auth()->user();

        $members = User::where('tenant_id', $user->tenant_id)
            ->select(['id', 'name', 'email', 'email_verified_at', 'role', 'tenant_id', 'created_at'])
            ->orderBy('name')
            ->get();

        $invitations = TeamInvitation::where('tenant_id', $user->tenant_id)
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->with('inviter:id,name')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Admin/Team', [
            'members'     => $members,
            'invitations' => $invitations,
        ]);
    }

    /**
     * Send a team invitation via email.
     */
    public function invite(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'email' => [
                'required',
                'email',
                'max:255',
                // Can't invite someone already on this team
                Rule::unique('users', 'email')->where(function ($query) use ($user) {
                    return $query->where('tenant_id', $user->tenant_id);
                }),
            ],
            'role' => ['required', Rule::in(['admin', 'manager', 'member'])],
        ], [
            'email.unique' => 'This person is already a member of your team.',
        ]);

        // Delete any existing pending invitation for this email on this tenant
        TeamInvitation::where('tenant_id', $user->tenant_id)
            ->where('email', $validated['email'])
            ->delete();

        // Create the invitation
        $invitation = TeamInvitation::create([
            'tenant_id'  => $user->tenant_id,
            'email'      => $validated['email'],
            'role'       => $validated['role'],
            'token'      => Str::random(64),
            'invited_by' => $user->id,
            'expires_at' => now()->addDays(7),
        ]);

        // TODO: Send invitation email with link containing the token
        // Mail::to($validated['email'])->send(new TeamInvitationMail($invitation));

        return back()->with('success', 'Invitation sent to ' . $validated['email']);
    }

    /**
     * Update a team member's role.
     */
    public function updateRole(Request $request, User $member): RedirectResponse
    {
        $user = $request->user();

        // Must be same tenant
        if ($member->tenant_id !== $user->tenant_id) {
            abort(403);
        }

        // Can't change your own role
        if ($member->id === $user->id) {
            return back()->withErrors(['role' => "You can't change your own role."]);
        }

        // Can't modify the owner (only one owner per tenant)
        if ($member->role === 'owner') {
            return back()->withErrors(['role' => "You can't change the owner's role."]);
        }

        // Can't modify super_admin
        if ($member->role === 'super_admin') {
            return back()->withErrors(['role' => "You can't modify a super admin."]);
        }

        $validated = $request->validate([
            'role' => ['required', Rule::in(['admin', 'manager', 'member'])],
        ]);

        $member->update(['role' => $validated['role']]);

        return back()->with('success', $member->name . "'s role updated to " . $validated['role']);
    }

    /**
     * Remove a team member from the company.
     */
    public function remove(Request $request, User $member): RedirectResponse
    {
        $user = $request->user();

        // Must be same tenant
        if ($member->tenant_id !== $user->tenant_id) {
            abort(403);
        }

        // Can't remove yourself
        if ($member->id === $user->id) {
            return back()->withErrors(['member' => "You can't remove yourself from the team."]);
        }

        // Can't remove the owner
        if ($member->role === 'owner') {
            return back()->withErrors(['member' => "You can't remove the company owner."]);
        }

        // Can't remove a super_admin
        if ($member->role === 'super_admin') {
            return back()->withErrors(['member' => "You can't remove a super admin."]);
        }

        // Disassociate user from tenant (don't delete them)
        $member->update([
            'tenant_id' => null,
            'role'      => 'member',
        ]);

        return back()->with('success', $member->name . ' has been removed from the team.');
    }

    /**
     * Cancel a pending invitation.
     */
    public function cancelInvitation(Request $request, TeamInvitation $invitation): RedirectResponse
    {
        $user = $request->user();

        // Must be same tenant
        if ($invitation->tenant_id !== $user->tenant_id) {
            abort(403);
        }

        $invitation->delete();

        return back()->with('success', 'Invitation cancelled.');
    }

    /**
     * Accept a team invitation (public route — no auth required).
     * Shows a registration/login form if the user doesn't have an account,
     * or directly accepts if they're logged in.
     */
    public function showAcceptForm(string $token): Response|RedirectResponse
    {
        $invitation = TeamInvitation::where('token', $token)
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->with('tenant:id,name')
            ->first();

        if (!$invitation) {
            return Inertia::render('Team/InvitationExpired');
        }

        // If the user is logged in and already has a tenant, redirect
        $user = auth()->user();
        if ($user && $user->tenant_id) {
            return redirect()->route('dashboard')
                ->with('error', 'You are already part of a company.');
        }

        return Inertia::render('Team/AcceptInvitation', [
            'invitation' => [
                'token'        => $invitation->token,
                'email'        => $invitation->email,
                'role'         => $invitation->role,
                'company_name' => $invitation->tenant->name,
            ],
        ]);
    }

    /**
     * Process accepting a team invitation.
     */
    public function acceptInvitation(Request $request, string $token): RedirectResponse
    {
        $invitation = TeamInvitation::where('token', $token)
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->first();

        if (!$invitation) {
            return redirect()->route('login')
                ->with('error', 'This invitation is no longer valid.');
        }

        $user = $request->user();

        if (!$user) {
            // Store the token in session and redirect to register
            session(['pending_invitation' => $token]);
            return redirect()->route('register');
        }

        // Already belongs to a company
        if ($user->tenant_id) {
            return redirect()->route('dashboard')
                ->with('error', 'You are already part of a company.');
        }

        // Accept the invitation
        $user->update([
            'tenant_id' => $invitation->tenant_id,
            'role'      => $invitation->role,
        ]);

        $invitation->update(['accepted_at' => now()]);

        session(['active_view' => 'user']);

        return redirect()->route('dashboard')
            ->with('success', 'Welcome to ' . $invitation->tenant->name . '!');
    }
}
