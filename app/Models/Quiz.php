<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quiz extends Model
{
    protected $fillable = [
        'tenant_id',
        'created_by',
        'title',
        'description',
        'passing_score',
        'max_attempts',
        'randomize_questions',
        'show_score',
        'show_correct_answers',
        'status',
        'due_date',
    ];

    protected $casts = [
        'passing_score'        => 'integer',
        'max_attempts'         => 'integer',
        'randomize_questions'  => 'boolean',
        'show_score'           => 'boolean',
        'show_correct_answers' => 'boolean',
        'due_date'             => 'date',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(QuizQuestion::class)->orderBy('sort_order');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(QuizAssignment::class);
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }
}
