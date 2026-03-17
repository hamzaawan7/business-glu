<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseAssignment;
use App\Models\Document;
use App\Models\Event;
use App\Models\EventRsvp;
use App\Models\Form;
use App\Models\FormSubmission;
use App\Models\LeaveRequest;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\Recognition;
use App\Models\Survey;
use App\Models\SurveyResponse;
use App\Models\Task;
use App\Models\Ticket;
use App\Models\TimeEntry;
use App\Models\TimelineEvent;
use App\Models\Update;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class AnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        $now = Carbon::now();
        $thirtyDaysAgo = $now->copy()->subDays(30);
        $sevenDaysAgo = $now->copy()->subDays(7);

        // ── Team Overview ───────────────────────────────────
        $totalEmployees = User::where('tenant_id', $tenantId)->count();
        $newHires30d = User::where('tenant_id', $tenantId)
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->count();

        $departments = User::where('tenant_id', $tenantId)
            ->whereNotNull('department')
            ->where('department', '!=', '')
            ->distinct('department')
            ->count('department');

        $roleBreakdown = User::where('tenant_id', $tenantId)
            ->selectRaw('role, count(*) as count')
            ->groupBy('role')
            ->pluck('count', 'role')
            ->toArray();

        // ── Time & Attendance ───────────────────────────────
        $clockedInNow = TimeEntry::where('tenant_id', $tenantId)
            ->where('status', 'active')
            ->count();

        $totalHours30d = TimeEntry::where('tenant_id', $tenantId)
            ->where('clock_in', '>=', $thirtyDaysAgo)
            ->whereNotNull('clock_out')
            ->selectRaw('SUM(TIMESTAMPDIFF(SECOND, clock_in, clock_out)) as total_seconds')
            ->value('total_seconds');
        // For SQLite compatibility
        if ($totalHours30d === null) {
            $totalHours30d = TimeEntry::where('tenant_id', $tenantId)
                ->where('clock_in', '>=', $thirtyDaysAgo)
                ->whereNotNull('clock_out')
                ->selectRaw("SUM(strftime('%s', clock_out) - strftime('%s', clock_in)) as total_seconds")
                ->value('total_seconds');
        }
        $totalHours30d = round(($totalHours30d ?? 0) / 3600, 1);

        $avgHoursPerDay = $totalHours30d > 0 ? round($totalHours30d / 30, 1) : 0;

        // ── Tasks ───────────────────────────────────────────
        $totalTasks = Task::where('tenant_id', $tenantId)->whereNull('parent_id')->count();
        $openTasks = Task::where('tenant_id', $tenantId)
            ->whereNull('parent_id')
            ->whereIn('status', ['open', 'in_progress'])
            ->count();
        $completedTasks30d = Task::where('tenant_id', $tenantId)
            ->whereNull('parent_id')
            ->where('status', 'completed')
            ->where('updated_at', '>=', $thirtyDaysAgo)
            ->count();
        $taskCompletionRate = $totalTasks > 0
            ? round(Task::where('tenant_id', $tenantId)->whereNull('parent_id')->where('status', 'completed')->count() / $totalTasks * 100)
            : 0;

        // ── Forms ───────────────────────────────────────────
        $activeForms = Form::where('tenant_id', $tenantId)->where('status', 'published')->count();
        $submissions30d = FormSubmission::where('tenant_id', $tenantId)
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->count();

        // ── Training ────────────────────────────────────────
        $totalCourses = Course::where('tenant_id', $tenantId)->count();
        $publishedCourses = Course::where('tenant_id', $tenantId)->where('status', 'published')->count();
        $courseAssignments = CourseAssignment::where('tenant_id', $tenantId)->count();
        $courseCompletions = CourseAssignment::where('tenant_id', $tenantId)->where('status', 'completed')->count();
        $courseCompletionRate = $courseAssignments > 0 ? round($courseCompletions / $courseAssignments * 100) : 0;

        // ── Quizzes ─────────────────────────────────────────
        $totalQuizzes = Quiz::where('tenant_id', $tenantId)->count();
        $quizAttempts30d = QuizAttempt::where('tenant_id', $tenantId)
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->count();
        $quizPassRate = QuizAttempt::where('tenant_id', $tenantId)->count() > 0
            ? round(QuizAttempt::where('tenant_id', $tenantId)->where('result', 'pass')->count() / QuizAttempt::where('tenant_id', $tenantId)->count() * 100)
            : 0;

        // ── Communications ──────────────────────────────────
        $totalUpdates = Update::where('tenant_id', $tenantId)->count();
        $updates30d = Update::where('tenant_id', $tenantId)
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->count();

        // ── Surveys ─────────────────────────────────────────
        $totalSurveys = Survey::where('tenant_id', $tenantId)->count();
        $activeSurveys = Survey::where('tenant_id', $tenantId)->where('status', 'published')->count();
        $surveyResponses30d = SurveyResponse::where('tenant_id', $tenantId)
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->count();

        // ── Events ──────────────────────────────────────────
        $upcomingEvents = Event::where('tenant_id', $tenantId)
            ->where('start_date', '>=', $now)
            ->where('status', 'published')
            ->count();
        $totalRsvps = EventRsvp::where('tenant_id', $tenantId)->count();

        // ── Help Desk ───────────────────────────────────────
        $openTickets = Ticket::where('tenant_id', $tenantId)
            ->whereIn('status', ['open', 'in_progress'])
            ->count();
        $resolvedTickets30d = Ticket::where('tenant_id', $tenantId)
            ->where('status', 'resolved')
            ->where('updated_at', '>=', $thirtyDaysAgo)
            ->count();

        // ── Documents ───────────────────────────────────────
        $totalDocuments = Document::where('tenant_id', $tenantId)->count();
        $pendingSignatures = Document::where('tenant_id', $tenantId)
            ->where('requires_signature', true)
            ->where('status', 'published')
            ->count();

        // ── Time Off ────────────────────────────────────────
        $pendingLeaveRequests = LeaveRequest::where('tenant_id', $tenantId)
            ->where('status', 'pending')
            ->count();
        $approvedLeave30d = LeaveRequest::where('tenant_id', $tenantId)
            ->where('status', 'approved')
            ->where('updated_at', '>=', $thirtyDaysAgo)
            ->count();

        // ── Recognition ─────────────────────────────────────
        $recognitions30d = Recognition::where('tenant_id', $tenantId)
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->count();
        $totalRecognitions = Recognition::where('tenant_id', $tenantId)->count();

        // ── Weekly Trend (last 7 days activity) ─────────────
        $weeklyTrend = [];
        for ($i = 6; $i >= 0; $i--) {
            $day = $now->copy()->subDays($i);
            $dayLabel = $day->format('D');
            $dayStart = $day->copy()->startOfDay();
            $dayEnd = $day->copy()->endOfDay();

            $weeklyTrend[] = [
                'day' => $dayLabel,
                'tasks' => Task::where('tenant_id', $tenantId)
                    ->whereNull('parent_id')
                    ->where('status', 'completed')
                    ->whereBetween('updated_at', [$dayStart, $dayEnd])
                    ->count(),
                'submissions' => FormSubmission::where('tenant_id', $tenantId)
                    ->whereBetween('created_at', [$dayStart, $dayEnd])
                    ->count(),
                'recognitions' => Recognition::where('tenant_id', $tenantId)
                    ->whereBetween('created_at', [$dayStart, $dayEnd])
                    ->count(),
            ];
        }

        // ── Department Breakdown ────────────────────────────
        $departmentStats = User::where('tenant_id', $tenantId)
            ->whereNotNull('department')
            ->where('department', '!=', '')
            ->selectRaw('department, count(*) as count')
            ->groupBy('department')
            ->orderByDesc('count')
            ->limit(10)
            ->get()
            ->toArray();

        // ── Top Performers (most recognitions received) ─────
        $topPerformers = Recognition::where('tenant_id', $tenantId)
            ->selectRaw('recipient_id, count(*) as total')
            ->groupBy('recipient_id')
            ->orderByDesc('total')
            ->limit(5)
            ->with('recipient:id,name,department,position,avatar_url')
            ->get()
            ->map(fn ($r) => [
                'user' => $r->recipient,
                'recognitions' => $r->total,
            ])
            ->toArray();

        return Inertia::render('Admin/Analytics', [
            'team' => [
                'totalEmployees' => $totalEmployees,
                'newHires30d' => $newHires30d,
                'departments' => $departments,
                'roleBreakdown' => $roleBreakdown,
                'departmentStats' => $departmentStats,
            ],
            'attendance' => [
                'clockedInNow' => $clockedInNow,
                'totalHours30d' => $totalHours30d,
                'avgHoursPerDay' => $avgHoursPerDay,
            ],
            'tasks' => [
                'total' => $totalTasks,
                'open' => $openTasks,
                'completed30d' => $completedTasks30d,
                'completionRate' => $taskCompletionRate,
            ],
            'forms' => [
                'active' => $activeForms,
                'submissions30d' => $submissions30d,
            ],
            'training' => [
                'totalCourses' => $totalCourses,
                'publishedCourses' => $publishedCourses,
                'assignments' => $courseAssignments,
                'completions' => $courseCompletions,
                'completionRate' => $courseCompletionRate,
                'totalQuizzes' => $totalQuizzes,
                'quizAttempts30d' => $quizAttempts30d,
                'quizPassRate' => $quizPassRate,
            ],
            'communications' => [
                'totalUpdates' => $totalUpdates,
                'updates30d' => $updates30d,
                'totalSurveys' => $totalSurveys,
                'activeSurveys' => $activeSurveys,
                'surveyResponses30d' => $surveyResponses30d,
                'upcomingEvents' => $upcomingEvents,
                'totalRsvps' => $totalRsvps,
            ],
            'helpDesk' => [
                'openTickets' => $openTickets,
                'resolvedTickets30d' => $resolvedTickets30d,
            ],
            'documents' => [
                'total' => $totalDocuments,
                'pendingSignatures' => $pendingSignatures,
            ],
            'timeOff' => [
                'pendingRequests' => $pendingLeaveRequests,
                'approved30d' => $approvedLeave30d,
            ],
            'recognition' => [
                'total' => $totalRecognitions,
                'last30d' => $recognitions30d,
                'topPerformers' => $topPerformers,
            ],
            'weeklyTrend' => $weeklyTrend,
        ]);
    }
}
