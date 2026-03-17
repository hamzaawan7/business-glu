<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $query = ActivityLog::where('tenant_id', $tenantId)
            ->with('user:id,name,avatar_url')
            ->orderByDesc('created_at');

        // Filters
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('description', 'like', "%{$s}%")
                  ->orWhere('subject_label', 'like', "%{$s}%")
                  ->orWhere('action', 'like', "%{$s}%");
            });
        }

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('subject_type')) {
            $query->where('subject_type', $request->subject_type);
        }

        $logs = $query->paginate(50)->through(fn ($log) => [
            'id' => $log->id,
            'action' => $log->action,
            'subject_type' => $log->subject_type ? class_basename($log->subject_type) : null,
            'subject_id' => $log->subject_id,
            'subject_label' => $log->subject_label,
            'description' => $log->description,
            'properties' => $log->properties,
            'ip_address' => $log->ip_address,
            'user' => $log->user ? [
                'id' => $log->user->id,
                'name' => $log->user->name,
                'avatar_url' => $log->user->avatar_url,
            ] : null,
            'created_at' => $log->created_at->toISOString(),
        ]);

        // Get unique actions for the filter dropdown
        $actions = ActivityLog::where('tenant_id', $tenantId)
            ->distinct('action')
            ->pluck('action')
            ->sort()
            ->values();

        // Get unique subject types
        $subjectTypes = ActivityLog::where('tenant_id', $tenantId)
            ->whereNotNull('subject_type')
            ->distinct('subject_type')
            ->pluck('subject_type')
            ->map(fn ($t) => ['value' => $t, 'label' => class_basename($t)])
            ->values();

        $users = User::where('tenant_id', $tenantId)
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        // Stats
        $totalLogs = ActivityLog::where('tenant_id', $tenantId)->count();
        $todayLogs = ActivityLog::where('tenant_id', $tenantId)
            ->whereDate('created_at', today())
            ->count();
        $uniqueUsers = ActivityLog::where('tenant_id', $tenantId)
            ->distinct('user_id')
            ->count('user_id');

        return Inertia::render('Admin/ActivityLog', [
            'logs' => $logs,
            'actions' => $actions,
            'subjectTypes' => $subjectTypes,
            'users' => $users,
            'filters' => $request->only(['search', 'action', 'user_id', 'subject_type']),
            'stats' => [
                'total' => $totalLogs,
                'today' => $todayLogs,
                'uniqueUsers' => $uniqueUsers,
            ],
        ]);
    }
}
