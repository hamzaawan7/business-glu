<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseAudienceRule extends Model
{
    protected $fillable = [
        'course_id',
        'rule_type',
        'rule_value',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
