<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseCertificate extends Model
{
    protected $fillable = [
        'assignment_id',
        'user_id',
        'course_id',
        'tenant_id',
        'certificate_number',
        'issued_at',
        'certificate_data',
    ];

    protected $casts = [
        'issued_at'        => 'datetime',
        'certificate_data' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(CourseAssignment::class, 'assignment_id');
    }
}
