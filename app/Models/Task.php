<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    protected $fillable = [
        'tenant_id',
        'created_by',
        'parent_id',
        'title',
        'description',
        'priority',
        'status',
        'due_date',
        'due_time',
        'completed_at',
        'completed_by',
        'location',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'due_date'     => 'date',
            'completed_at' => 'datetime',
        ];
    }

    // ── Relationships ────────────────────────────────────────

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function completedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Task::class, 'parent_id');
    }

    public function subtasks(): HasMany
    {
        return $this->hasMany(Task::class, 'parent_id')->orderBy('sort_order');
    }

    public function assignees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'task_user')->withTimestamps();
    }

    // ── Helpers ──────────────────────────────────────────────

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isOverdue(): bool
    {
        if (! $this->due_date || $this->isCompleted()) {
            return false;
        }

        return $this->due_date->isPast();
    }

    public function isParent(): bool
    {
        return $this->parent_id === null;
    }

    public function subtaskProgress(): array
    {
        $total = $this->subtasks->count();
        if ($total === 0) {
            return ['total' => 0, 'completed' => 0, 'percent' => 0];
        }

        $completed = $this->subtasks->where('status', 'completed')->count();

        return [
            'total'     => $total,
            'completed' => $completed,
            'percent'   => round(($completed / $total) * 100),
        ];
    }

    /**
     * Mark the task as completed.
     */
    public function markCompleted(int $userId): void
    {
        $this->update([
            'status'       => 'completed',
            'completed_at' => now(),
            'completed_by' => $userId,
        ]);
    }

    /**
     * Reopen a completed task.
     */
    public function reopen(): void
    {
        $this->update([
            'status'       => 'open',
            'completed_at' => null,
            'completed_by' => null,
        ]);
    }
}
