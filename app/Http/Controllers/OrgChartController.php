<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrgChartController extends Controller
{
    public function index(Request $request): Response
    {
        $tenantId = $request->user()->tenant_id;

        $employees = User::where('tenant_id', $tenantId)
            ->select('id', 'name', 'email', 'role', 'department', 'position', 'reports_to', 'avatar_url', 'phone')
            ->orderBy('name')
            ->get();

        $departments = $employees->pluck('department')->filter()->unique()->sort()->values();

        return Inertia::render('HR/OrgChart', [
            'employees'   => $employees,
            'departments' => $departments,
        ]);
    }

    public function browse(Request $request): Response
    {
        $tenantId = $request->user()->tenant_id;

        $employees = User::where('tenant_id', $tenantId)
            ->select('id', 'name', 'email', 'role', 'department', 'position', 'reports_to', 'avatar_url', 'phone')
            ->orderBy('name')
            ->get();

        $departments = $employees->pluck('department')->filter()->unique()->sort()->values();

        return Inertia::render('User/UserOrgChart', [
            'employees'   => $employees,
            'departments' => $departments,
        ]);
    }
}
