<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminAccess
{
    /**
     * Ensure the user has admin-level access (super_admin, owner, or admin).
     * Managers and members are redirected to the user view.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->isAdmin()) {
            return redirect()->route('user.home');
        }

        return $next($request);
    }
}
