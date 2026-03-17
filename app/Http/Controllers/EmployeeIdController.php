<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeIdController extends Controller
{
    // Admin: manage ID settings & view all employee IDs
    public function index(Request $request): Response
    {
        $tenantId = $request->user()->tenant_id;

        $employees = User::where('tenant_id', $tenantId)
            ->select('id', 'name', 'email', 'role', 'department', 'position', 'avatar_url', 'phone', 'hire_date')
            ->orderBy('name')
            ->get();

        // Get tenant/company info for branding
        $tenant = \App\Models\Tenant::find($tenantId);

        return Inertia::render('HR/EmployeeIds', [
            'employees'   => $employees,
            'companyName' => $tenant?->name ?? 'Company',
        ]);
    }

    // User: view own digital ID
    public function myId(Request $request): Response
    {
        $user   = $request->user();
        $tenant = \App\Models\Tenant::find($user->tenant_id);

        return Inertia::render('User/UserEmployeeId', [
            'employee'    => $user->only(['id', 'name', 'email', 'role', 'department', 'position', 'avatar_url', 'phone', 'hire_date']),
            'companyName' => $tenant?->name ?? 'Company',
        ]);
    }
}
