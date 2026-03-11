<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    /**
     * Admin view: all tasks for the team.
     */
    public function index(Request $request): Response
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;

        // Filter params
        $status   = $request->get('status', 'all');       // all, open, in_progress, completed
        $priority = $request->get('priority', 'all');      // all, low, medium, high, urgent
        $assignee = $request->get('assignee');             // user_id or null

        $query = Task::where('tenant_id', $tenantId)
            ->whereNull('parent_id')                       // only top-level tasks
            ->with(['creator:id,name,email', 'assignees:id,name,email,role', 'subtasks'])
            ->orderByRaw("CASE status WHEN 'open' THEN 1 WHEN 'in_progress' THEN 2 WHEN 'completed' THEN 3 END")
            ->orderByRaw("CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END")
            ->orderBy('due_date')
            ->orderBy('created_at', 'desc');

        if ($status !== 'all') {
            $query->where('status', $status);
        }
        if ($priority !== 'all') {
            $query->where('priority', $priority);
        }
        if ($assignee) {
            $query->whereHas('assignees', fn ($q) => $q->where('users.id', $assignee));
        }

        $tasks = $query->get()->map(fn ($task) => $this->formatTask($task));

        // Stats
        $allTasks = Task::where('tenant_id', $tenantId)->whereNull('parent_id');
        $statsOpen      = (clone $allTasks)->where('status', 'open')->count();
        $statsProgress  = (clone $allTasks)->where('status', 'in_progress')->count();
        $statsCompleted = (clone $allTasks)->where('status', 'completed')->count();
        $statsOverdue   = (clone $allTasks)->where('status', '!=', 'completed')
            ->whereNotNull('due_date')
            ->where('due_date', '<', now()->toDateString())
            ->count();

        // Team members for the assignee dropdown
        $members = User::where('tenant_id', $tenantId)
            ->select('id', 'name', 'email', 'role')
            ->orderBy('name')
            ->get();

        return Inertia::render('Operations/Tasks', [
            'tasks'   => $tasks,
            'members' => $members,
            'filters' => [
                'status'   => $status,
                'priority' => $priority,
                'assignee' => $assignee,
            ],
            'stats'   => [
                'open'      => $statsOpen,
                'inProgress' => $statsProgress,
                'completed' => $statsCompleted,
                'overdue'   => $statsOverdue,
            ],
        ]);
    }

    /**
     * Store a new task.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'priority'    => 'in:low,medium,high,urgent',
            'due_date'    => 'nullable|date',
            'due_time'    => 'nullable|date_format:H:i',
            'location'    => 'nullable|string|max:255',
            'assignee_ids' => 'array',
            'assignee_ids.*' => 'exists:users,id',
            'parent_id'   => 'nullable|exists:tasks,id',
        ]);

        $task = Task::create([
            'tenant_id'   => $user->tenant_id,
            'created_by'  => $user->id,
            'parent_id'   => $validated['parent_id'] ?? null,
            'title'       => $validated['title'],
            'description' => $validated['description'] ?? null,
            'priority'    => $validated['priority'] ?? 'medium',
            'due_date'    => $validated['due_date'] ?? null,
            'due_time'    => $validated['due_time'] ?? null,
            'location'    => $validated['location'] ?? null,
        ]);

        if (! empty($validated['assignee_ids'])) {
            $task->assignees()->attach($validated['assignee_ids']);
        }

        $label = $task->parent_id ? 'Sub-task' : 'Task';

        return back()->with('success', "{$label} \"{$task->title}\" created.");
    }

    /**
     * Update an existing task.
     */
    public function update(Request $request, Task $task): RedirectResponse
    {
        if ($task->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'priority'    => 'in:low,medium,high,urgent',
            'due_date'    => 'nullable|date',
            'due_time'    => 'nullable|date_format:H:i',
            'location'    => 'nullable|string|max:255',
            'assignee_ids' => 'array',
            'assignee_ids.*' => 'exists:users,id',
        ]);

        $task->update([
            'title'       => $validated['title'],
            'description' => $validated['description'] ?? null,
            'priority'    => $validated['priority'] ?? $task->priority,
            'due_date'    => $validated['due_date'] ?? null,
            'due_time'    => $validated['due_time'] ?? null,
            'location'    => $validated['location'] ?? null,
        ]);

        if (isset($validated['assignee_ids'])) {
            $task->assignees()->sync($validated['assignee_ids']);
        }

        return back()->with('success', 'Task updated.');
    }

    /**
     * Delete a task (and its subtasks via cascade).
     */
    public function destroy(Request $request, Task $task): RedirectResponse
    {
        if ($task->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $title = $task->title;
        $task->delete();

        return back()->with('success', "Task \"{$title}\" deleted.");
    }

    /**
     * Toggle task status: open → in_progress → completed (or reopen).
     */
    public function toggleStatus(Request $request, Task $task): RedirectResponse
    {
        if ($task->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $validated = $request->validate([
            'status' => 'required|in:open,in_progress,completed',
        ]);

        $newStatus = $validated['status'];

        if ($newStatus === 'completed') {
            $task->markCompleted($request->user()->id);
        } else {
            $task->update([
                'status'       => $newStatus,
                'completed_at' => null,
                'completed_by' => null,
            ]);
        }

        return back()->with('success', 'Task status updated.');
    }

    /**
     * Bulk update status for multiple tasks.
     */
    public function bulkStatus(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'task_ids' => 'required|array|min:1',
            'task_ids.*' => 'exists:tasks,id',
            'status'   => 'required|in:open,in_progress,completed',
        ]);

        $tasks = Task::whereIn('id', $validated['task_ids'])
            ->where('tenant_id', $user->tenant_id)
            ->get();

        foreach ($tasks as $task) {
            if ($validated['status'] === 'completed') {
                $task->markCompleted($user->id);
            } else {
                $task->update([
                    'status'       => $validated['status'],
                    'completed_at' => null,
                    'completed_by' => null,
                ]);
            }
        }

        $count = $tasks->count();

        return back()->with('success', "{$count} task(s) updated to {$validated['status']}.");
    }

    /**
     * User view: my assigned tasks.
     */
    public function myTasks(Request $request): Response
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;
        $status   = $request->get('status', 'all');

        $query = Task::where('tenant_id', $tenantId)
            ->whereNull('parent_id')
            ->whereHas('assignees', fn ($q) => $q->where('users.id', $user->id))
            ->with(['creator:id,name', 'assignees:id,name,email', 'subtasks'])
            ->orderByRaw("CASE status WHEN 'open' THEN 1 WHEN 'in_progress' THEN 2 WHEN 'completed' THEN 3 END")
            ->orderByRaw("CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END")
            ->orderBy('due_date')
            ->orderBy('created_at', 'desc');

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $tasks = $query->get()->map(fn ($task) => $this->formatTask($task));

        // Stats for the user
        $myTasksBase = Task::where('tenant_id', $tenantId)
            ->whereNull('parent_id')
            ->whereHas('assignees', fn ($q) => $q->where('users.id', $user->id));

        $open      = (clone $myTasksBase)->where('status', 'open')->count();
        $progress  = (clone $myTasksBase)->where('status', 'in_progress')->count();
        $completed = (clone $myTasksBase)->where('status', 'completed')->count();
        $overdue   = (clone $myTasksBase)->where('status', '!=', 'completed')
            ->whereNotNull('due_date')
            ->where('due_date', '<', now()->toDateString())
            ->count();

        return Inertia::render('User/MyTasks', [
            'tasks'  => $tasks,
            'filter' => $status,
            'stats'  => [
                'open'       => $open,
                'inProgress' => $progress,
                'completed'  => $completed,
                'overdue'    => $overdue,
            ],
        ]);
    }

    /**
     * Format a task for the frontend.
     */
    private function formatTask(Task $task): array
    {
        $subtaskProgress = $task->subtasks ? $task->subtaskProgress() : ['total' => 0, 'completed' => 0, 'percent' => 0];

        return [
            'id'          => $task->id,
            'parent_id'   => $task->parent_id,
            'title'       => $task->title,
            'description' => $task->description,
            'priority'    => $task->priority,
            'status'      => $task->status,
            'due_date'    => $task->due_date?->toDateString(),
            'due_time'    => $task->due_time ? substr($task->due_time, 0, 5) : null,
            'location'    => $task->location,
            'is_overdue'  => $task->isOverdue(),
            'completed_at' => $task->completed_at?->toDateTimeString(),
            'creator'     => $task->creator ? [
                'id'   => $task->creator->id,
                'name' => $task->creator->name,
            ] : null,
            'assignees'   => $task->assignees->map(fn ($u) => [
                'id'    => $u->id,
                'name'  => $u->name,
                'email' => $u->email,
            ])->toArray(),
            'subtasks'    => $task->subtasks->map(fn ($st) => [
                'id'        => $st->id,
                'title'     => $st->title,
                'status'    => $st->status,
                'priority'  => $st->priority,
                'due_date'  => $st->due_date?->toDateString(),
                'is_overdue' => $st->isOverdue(),
                'assignees' => $st->assignees ? $st->assignees->map(fn ($u) => [
                    'id'   => $u->id,
                    'name' => $u->name,
                ])->toArray() : [],
            ])->toArray(),
            'subtask_progress' => $subtaskProgress,
            'created_at'  => $task->created_at->toDateTimeString(),
        ];
    }
}
