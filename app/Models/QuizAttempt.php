<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizAttempt extends Model
{
    protected $fillable = [
        'tenant_id',
        'quiz_id',
        'user_id',
        'score',
        'correct_count',
        'total_questions',
        'result',
        'answers',
    ];

    protected $casts = [
        'score'           => 'integer',
        'correct_count'   => 'integer',
        'total_questions'  => 'integer',
        'answers'         => 'array',
    ];

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
