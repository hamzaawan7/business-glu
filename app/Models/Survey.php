<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Survey extends Model
{
    protected $fillable = [
        'tenant_id',
        'created_by',
        'title',
        'description',
        'type',
        'status',
        'is_anonymous',
        'allow_multiple',
        'published_at',
        'closes_at',
    ];

    protected function casts(): array
    {
        return [
            'is_anonymous'   => 'boolean',
            'allow_multiple' => 'boolean',
            'published_at'   => 'datetime',
            'closes_at'      => 'datetime',
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

    public function questions(): HasMany
    {
        return $this->hasMany(SurveyQuestion::class)->orderBy('sort_order');
    }

    public function responses(): HasMany
    {
        return $this->hasMany(SurveyResponse::class);
    }

    public function answers(): HasManyThrough
    {
        return $this->hasManyThrough(SurveyAnswer::class, SurveyResponse::class, 'survey_id', 'response_id');
    }

    // ── Helpers ──────────────────────────────────────────────

    public function isActive(): bool
    {
        return $this->status === 'active'
            && ($this->closes_at === null || $this->closes_at->isFuture());
    }
}
