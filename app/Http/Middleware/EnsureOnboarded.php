<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOnboarded
{
    /**
     * Redirect users who haven't completed onboarding (no tenant_id)
     * to the company creation page.
     *
     * Exceptions: the onboarding routes themselves, logout, and profile deletion.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->tenant_id && ! $user->isSuperAdmin()) {
            // Allow access to onboarding routes, logout, and profile management
            $allowedRoutes = [
                'onboarding.create',
                'onboarding.store',
                'logout',
                'profile.edit',
                'profile.update',
                'profile.destroy',
            ];

            if (! in_array($request->route()?->getName(), $allowedRoutes)) {
                return redirect()->route('onboarding.create');
            }
        }

        return $next($request);
    }
}
