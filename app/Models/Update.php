<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Update extends Model
{
    protected $fillable = [
        'tenant_id',
        'created_by',
        'title',
        'body',
        'type',
        'status',
        'is_pinned',
        'is_popup',
        'allow_comments',
        'allow_reactions',
        'published_at',
        'scheduled_at',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'is_pinned'       => 'boolean',
            'is_popup'        => 'boolean',
            'allow_comments'  => 'boolean',
            'allow_reactions' => 'boolean',
            'published_at'    => 'datetime',
            'scheduled_at'    => 'datetime',
            'expires_at'      => 'datetime',
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

    public function comments(): HasMany
    {
        return $this->hasMany(UpdateComment::class)->orderBy('created_at');
    }

    public function reactions(): HasMany
    {
        return $this->hasMany(UpdateReaction::class);
    }

    public function reads(): HasMany
    {
        return $this->hasMany(UpdateRead::class);
    }

    // ── Helpers ──────────────────────────────────────────────

    public function isPublished(): bool
    {
        return $this->status === 'published';
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function hasBeenReadBy(int $userId): bool
    {
        return $this->reads()->where('user_id', $userId)->exists();
    }
}
