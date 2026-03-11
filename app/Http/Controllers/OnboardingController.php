<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    /**
     * Show the "Create Your Company" onboarding form.
     * Only accessible to users who are not yet assigned to a tenant.
     */
    public function create(): Response|RedirectResponse
    {
        $user = auth()->user();

        // Already onboarded — send them to the dashboard
        if ($user->tenant_id) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Onboarding/CreateCompany');
    }

    /**
     * Create a new tenant (company) and assign the user as owner.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        // Already has a company — don't allow duplicates
        if ($user->tenant_id) {
            return redirect()->route('dashboard');
        }

        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'industry'     => 'nullable|string|max:255',
            'team_size'    => 'nullable|string|max:50',
        ]);

        // Generate a unique slug from the company name
        $baseSlug = Str::slug($validated['company_name']);
        $slug = $baseSlug;
        $counter = 1;

        while (Tenant::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        // Create the tenant
        $tenant = Tenant::create([
            'id'        => $slug,
            'name'      => $validated['company_name'],
            'slug'      => $slug,
            'plan'      => 'free',
            'is_active' => true,
            'data'      => json_encode([
                'industry'  => $validated['industry'] ?? null,
                'team_size' => $validated['team_size'] ?? null,
            ]),
        ]);

        // Assign user as the owner of this company
        $user->update([
            'role'      => 'owner',
            'tenant_id' => $tenant->id,
        ]);

        // Set admin view as default for new owners
        session(['active_view' => 'admin']);

        return redirect()->route('dashboard');
    }
}
