<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Course extends Model
{
    protected $fillable = [
        'tenant_id',
        'category_id',
        'created_by',
        'title',
        'description',
        'cover_image',
        'status',
        'is_mandatory',
        'estimated_minutes',
        'published_at',
    ];

    protected $casts = [
        'is_mandatory'      => 'boolean',
        'estimated_minutes' => 'integer',
        'published_at'      => 'datetime',
    ];

    /* ── Relations ────────────────────────────────────── */

    public function category(): BelongsTo
    {
        return $this->belongsTo(CourseCategory::class, 'category_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function sections(): HasMany
    {
        return $this->hasMany(CourseSection::class)->orderBy('sort_order');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(CourseAssignment::class);
    }

    /* ── Helpers ──────────────────────────────────────── */

    public function totalObjects(): int
    {
        return $this->sections()->withCount('objects')->get()->sum('objects_count');
    }
}
