<?php

namespace App\Http\Controllers;

use App\Models\LeaveBalance;
use App\Models\LeavePolicy;
use App\Models\LeaveRequest;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TimeOffController extends Controller
{
    // ─────────────────────────────────────────────────────────
    //  ADMIN — Time Off Dashboard
    // ─────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;
        $status   = $request->get('status', 'all');

        $query = LeaveRequest::where('tenant_id', $tenantId)
            ->with(['user:id,name', 'policy:id,name,color', 'reviewer:id,name'])
            ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
            ->orderBy('created_at', 'desc');

        if ($status !== 'all') $query->where('status', $status);

        $requests = $query->paginate(25)->withQueryString();

        $stats = [
            'pending'  => LeaveRequest::where('tenant_id', $tenantId)->where('status', 'pending')->count(),
            'approved' => LeaveRequest::where('tenant_id', $tenantId)->where('status', 'approved')->count(),
            'denied'   => LeaveRequest::where('tenant_id', $tenantId)->where('status', 'denied')->count(),
            'off_today' => LeaveRequest::where('tenant_id', $tenantId)
                ->where('status', 'approved')
                ->where('start_date', '<=', now()->toDateString())
                ->where('end_date', '>=', now()->toDateString())
                ->count(),
        ];

        $policies  = LeavePolicy::where('tenant_id', $tenantId)->where('is_active', true)->orderBy('sort_order')->get();
        $employees = User::where('tenant_id', $tenantId)->get(['id', 'name', 'email']);

        // Calendar data — approved requests for current month range
        $calStart = now()->startOfMonth()->subWeek();
        $calEnd   = now()->endOfMonth()->addWeek();
        $calendar = LeaveRequest::where('tenant_id', $tenantId)
            ->where('status', 'approved')
            ->where('start_date', '<=', $calEnd)
            ->where('end_date', '>=', $calStart)
            ->with(['user:id,name', 'policy:id,name,color'])
            ->get();

        return Inertia::render('HR/TimeOff', [
            'requests'  => $requests,
            'filters'   => ['status' => $status],
            'stats'     => $stats,
            'policies'  => $policies,
            'employees' => $employees,
            'calendar'  => $calendar,
        ]);
    }

    // ─────────────────────────────────────────────────────────
    //  Review (approve / deny)
    // ─────────────────────────────────────────────────────────

    public function review(Request $request, LeaveRequest $leaveRequest): RedirectResponse
    {
        abort_unless($leaveRequest->tenant_id === $request->user()->tenant_id, 403);

        $data = $request->validate([
            'status'      => 'required|in:approved,denied',
            'review_note' => 'nullable|string|max:500',
        ]);

        $leaveRequest->update([
            'status'      => $data['status'],
            'review_note' => $data['review_note'] ?? null,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        // Update balance if approved
        if ($data['status'] === 'approved') {
            $balance = LeaveBalance::firstOrCreate(
                [
                    'user_id'         => $leaveRequest->user_id,
                    'leave_policy_id' => $leaveRequest->leave_policy_id,
                    'year'            => $leaveRequest->start_date->year,
                ],
                [
                    'tenant_id' => $leaveRequest->tenant_id,
                    'total'     => $leaveRequest->policy->days_per_year,
                    'used'      => 0,
                    'balance'   => $leaveRequest->policy->days_per_year,
                ]
            );

            $balance->increment('used', $leaveRequest->days);
            $balance->decrement('balance', $leaveRequest->days);
        }

        return back()->with('flash', ['success' => "Request {$data['status']}."]);
    }

    // ─────────────────────────────────────────────────────────
    //  Policy CRUD
    // ─────────────────────────────────────────────────────────

    public function storePolicy(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'              => 'required|string|max:100',
            'color'             => 'nullable|string|max:20',
            'days_per_year'     => 'required|numeric|min:0|max:365',
            'accrual_type'      => 'required|in:annual,monthly,none',
            'requires_approval' => 'required|boolean',
        ]);

        LeavePolicy::create([
            'tenant_id'         => $request->user()->tenant_id,
            'name'              => $data['name'],
            'color'             => $data['color'] ?? '#3B82F6',
            'days_per_year'     => $data['days_per_year'],
            'accrual_type'      => $data['accrual_type'],
            'requires_approval' => $data['requires_approval'],
        ]);

        return back()->with('flash', ['success' => 'Leave policy created.']);
    }

    public function updatePolicy(Request $request, LeavePolicy $policy): RedirectResponse
    {
        abort_unless($policy->tenant_id === $request->user()->tenant_id, 403);

        $data = $request->validate([
            'name'              => 'sometimes|string|max:100',
            'color'             => 'nullable|string|max:20',
            'days_per_year'     => 'sometimes|numeric|min:0|max:365',
            'accrual_type'      => 'sometimes|in:annual,monthly,none',
            'requires_approval' => 'sometimes|boolean',
            'is_active'         => 'sometimes|boolean',
        ]);

        $policy->update($data);
        return back()->with('flash', ['success' => 'Policy updated.']);
    }

    public function destroyPolicy(Request $request, LeavePolicy $policy): RedirectResponse
    {
        abort_unless($policy->tenant_id === $request->user()->tenant_id, 403);
        $policy->delete();
        return back()->with('flash', ['success' => 'Policy deleted.']);
    }

    // ─────────────────────────────────────────────────────────
    //  USER — My Time Off
    // ─────────────────────────────────────────────────────────

    public function browse(Request $request): Response
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;
        $year     = (int) $request->get('year', now()->year);

        $myRequests = LeaveRequest::where('tenant_id', $tenantId)
            ->where('user_id', $user->id)
            ->with(['policy:id,name,color', 'reviewer:id,name'])
            ->orderBy('created_at', 'desc')
            ->get();

        $policies = LeavePolicy::where('tenant_id', $tenantId)->where('is_active', true)->orderBy('sort_order')->get(['id', 'name', 'color', 'days_per_year']);

        $balances = LeaveBalance::where('tenant_id', $tenantId)
            ->where('user_id', $user->id)
            ->where('year', $year)
            ->with('policy:id,name,color')
            ->get();

        // Ensure balances exist for all active policies
        foreach ($policies as $p) {
            if (!$balances->contains('leave_policy_id', $p->id)) {
                $bal = LeaveBalance::create([
                    'tenant_id'       => $tenantId,
                    'user_id'         => $user->id,
                    'leave_policy_id' => $p->id,
                    'total'           => $p->days_per_year,
                    'used'            => 0,
                    'balance'         => $p->days_per_year,
                    'year'            => $year,
                ]);
                $bal->load('policy:id,name,color');
                $balances->push($bal);
            }
        }

        return Inertia::render('User/UserTimeOff', [
            'requests' => $myRequests,
            'policies' => $policies,
            'balances' => $balances,
            'year'     => $year,
        ]);
    }

    public function submit(Request $request): RedirectResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'leave_policy_id' => 'required|exists:leave_policies,id',
            'start_date'      => 'required|date|after_or_equal:today',
            'end_date'        => 'required|date|after_or_equal:start_date',
            'reason'          => 'nullable|string|max:500',
        ]);

        // Calculate business days
        $start = Carbon::parse($data['start_date']);
        $end   = Carbon::parse($data['end_date']);
        $days  = 0;
        $curr  = $start->copy();
        while ($curr->lte($end)) {
            if ($curr->isWeekday()) $days++;
            $curr->addDay();
        }

        LeaveRequest::create([
            'tenant_id'       => $user->tenant_id,
            'user_id'         => $user->id,
            'leave_policy_id' => $data['leave_policy_id'],
            'start_date'      => $data['start_date'],
            'end_date'        => $data['end_date'],
            'days'            => $days,
            'reason'          => $data['reason'] ?? null,
            'status'          => 'pending',
        ]);

        return back()->with('flash', ['success' => 'Time off request submitted.']);
    }

    public function cancel(Request $request, LeaveRequest $leaveRequest): RedirectResponse
    {
        abort_unless($leaveRequest->user_id === $request->user()->id, 403);
        abort_unless($leaveRequest->status === 'pending', 422);

        $leaveRequest->update(['status' => 'cancelled']);

        return back()->with('flash', ['success' => 'Request cancelled.']);
    }
}
