<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    protected $fillable = [
        'tenant_id',
        'created_by',
        'title',
        'description',
        'location',
        'type',
        'starts_at',
        'ends_at',
        'is_all_day',
        'status',
        'is_recurring',
        'recurrence_rule',
        'recurrence_end',
    ];

    protected $casts = [
        'starts_at'       => 'datetime',
        'ends_at'         => 'datetime',
        'is_all_day'      => 'boolean',
        'is_recurring'    => 'boolean',
        'recurrence_end'  => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(\Stancl\Tenancy\Database\Models\Tenant::class, 'tenant_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function rsvps(): HasMany
    {
        return $this->hasMany(EventRsvp::class);
    }

    public function isUpcoming(): bool
    {
        return $this->starts_at->isFuture();
    }

    public function isPast(): bool
    {
        return ($this->ends_at ?? $this->starts_at)->isPast();
    }
}
