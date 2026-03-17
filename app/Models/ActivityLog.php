<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    protected $fillable = [
        'tenant_id',
        'user_id',
        'action',
        'subject_type',
        'subject_id',
        'subject_label',
        'description',
        'properties',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'properties' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Polymorphic subject (optional — use subject_type + subject_id)
     */
    public function subject()
    {
        return $this->morphTo();
    }

    /**
     * Quick helper to record an activity entry.
     */
    public static function log(
        string $action,
        ?object $subject = null,
        ?string $description = null,
        ?array $properties = null,
    ): static {
        $user = auth()->user();

        return static::create([
            'tenant_id'     => $user?->tenant_id,
            'user_id'       => $user?->id,
            'action'        => $action,
            'subject_type'  => $subject ? get_class($subject) : null,
            'subject_id'    => $subject?->id ?? null,
            'subject_label' => $subject?->title ?? $subject?->name ?? null,
            'description'   => $description,
            'properties'    => $properties,
            'ip_address'    => request()?->ip(),
            'user_agent'    => request()?->userAgent(),
        ]);
    }
}
