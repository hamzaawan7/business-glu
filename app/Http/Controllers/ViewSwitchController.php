<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;

class ViewSwitchController extends Controller
{
    /**
     * Toggle between admin and user views.
     * Only admins+ can switch to admin view.
     */
    public function __invoke(Request $request)
    {
        $request->validate([
            'view' => ['required', 'in:admin,user'],
        ]);

        $targetView = $request->input('view');

        // Only allow admin view for users with admin+ role
        if ($targetView === 'admin' && ! $request->user()->isAdmin()) {
            $targetView = 'user';
        }

        Session::put('active_view', $targetView);

        // Redirect to the appropriate home page
        return redirect($targetView === 'admin' ? '/admin/dashboard' : '/app');
    }
}
