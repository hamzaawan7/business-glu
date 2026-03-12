<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Form extends Model
{
    protected $fillable = [
        'tenant_id',
        'created_by',
        'title',
        'description',
        'type',
        'status',
        'is_required',
        'allow_multiple',
        'is_anonymous',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'is_required'    => 'boolean',
            'allow_multiple' => 'boolean',
            'is_anonymous'   => 'boolean',
            'published_at'   => 'datetime',
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

    public function fields(): HasMany
    {
        return $this->hasMany(FormField::class)->orderBy('sort_order');
    }

    public function assignees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'form_assignments')
            ->withTimestamps();
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(FormSubmission::class);
    }

    // ── Helpers ──────────────────────────────────────────────

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function submissionCount(): int
    {
        return $this->submissions()->count();
    }

    public function completionRate(): float
    {
        $assigned = $this->assignees()->count();
        if ($assigned === 0) return 0;

        $submitted = $this->submissions()
            ->distinct('user_id')
            ->count('user_id');

        return round(($submitted / $assigned) * 100, 1);
    }
}
