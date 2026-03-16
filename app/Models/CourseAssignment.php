<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CourseAssignment extends Model
{
    protected $fillable = [
        'course_id',
        'user_id',
        'tenant_id',
        'due_date',
        'status',
        'progress_pct',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'due_date'     => 'date',
        'progress_pct' => 'integer',
        'started_at'   => 'datetime',
        'completed_at' => 'datetime',
    ];

    /* ── Relations ────────────────────────────────────── */

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function objectProgress(): HasMany
    {
        return $this->hasMany(CourseObjectProgress::class, 'assignment_id');
    }
}
