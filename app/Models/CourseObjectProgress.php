<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseObjectProgress extends Model
{
    protected $table = 'course_object_progress';

    protected $fillable = [
        'assignment_id',
        'object_id',
        'completed_at',
    ];

    protected $casts = [
        'completed_at' => 'datetime',
    ];

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(CourseAssignment::class, 'assignment_id');
    }

    public function object(): BelongsTo
    {
        return $this->belongsTo(CourseObject::class, 'object_id');
    }
}
