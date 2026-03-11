<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    /**
     * Display the company settings page.
     */
    public function index(): Response
    {
        $user = auth()->user();
        $tenant = $user->tenant;

        return Inertia::render('Admin/Settings', [
            'company' => $tenant ? [
                'name'    => $tenant->name,
                'slug'    => $tenant->slug,
                'plan'    => $tenant->plan ?? 'free',
                'modules' => $tenant->getActiveModules(),
            ] : null,
        ]);
    }

    /**
     * Update company information.
     */
    public function updateCompany(Request $request): RedirectResponse
    {
        $user = $request->user();
        $tenant = $user->tenant;

        if (!$tenant) {
            abort(404);
        }

        // Only owner can update company settings
        if (!in_array($user->role, ['super_admin', 'owner'])) {
            abort(403, 'Only the company owner can update settings.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $tenant->update([
            'name' => $validated['name'],
        ]);

        return back()->with('success', 'Company information updated.');
    }

    /**
     * Toggle a module on or off.
     */
    public function toggleModule(Request $request): RedirectResponse
    {
        $user = $request->user();
        $tenant = $user->tenant;

        if (!$tenant) {
            abort(404);
        }

        // Only owner/admin can toggle modules
        if (!$user->isAdmin()) {
            abort(403);
        }

        $validated = $request->validate([
            'module'  => 'required|string|in:' . implode(',', array_keys(Tenant::DEFAULT_MODULES)),
            'enabled' => 'required|boolean',
        ]);

        $modules = $tenant->modules ?? [];
        $modules[$validated['module']] = $validated['enabled'];

        $tenant->update(['modules' => $modules]);

        $label = str_replace('_', ' ', $validated['module']);

        return back()->with('success', ucwords($label) . ' has been ' . ($validated['enabled'] ? 'enabled' : 'disabled') . '.');
    }
}
