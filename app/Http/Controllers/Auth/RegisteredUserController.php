<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\TeamInvitation;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        event(new Registered($user));

        Auth::login($user);

        // If there's a pending invitation, accept it automatically
        $pendingToken = session()->pull('pending_invitation');
        if ($pendingToken) {
            $invitation = TeamInvitation::where('token', $pendingToken)
                ->whereNull('accepted_at')
                ->where('expires_at', '>', now())
                ->first();

            if ($invitation) {
                $user->update([
                    'tenant_id' => $invitation->tenant_id,
                    'role'      => $invitation->role,
                ]);

                $invitation->update(['accepted_at' => now()]);

                session(['active_view' => 'user']);

                return redirect(route('dashboard', absolute: false))
                    ->with('success', 'Welcome to ' . $invitation->tenant->name . '!');
            }
        }

        return redirect(route('onboarding.create', absolute: false));
    }
}
