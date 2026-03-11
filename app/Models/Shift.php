<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Shift extends Model
{
    protected $fillable = [
        'tenant_id',
        'user_id',
        'created_by',
        'title',
        'date',
        'start_time',
        'end_time',
        'color',
        'location',
        'notes',
        'is_published',
        'is_open',
        'repeat_type',
        'repeat_group_id',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'date'         => 'date',
            'is_published' => 'boolean',
            'is_open'      => 'boolean',
        ];
    }

    // ── Relationships ────────────────────────────────────────

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ── Helpers ──────────────────────────────────────────────

    /**
     * Get the duration in hours (decimal).
     */
    public function durationHours(): float
    {
        $start = Carbon::parse($this->start_time);
        $end   = Carbon::parse($this->end_time);

        // Handle overnight shifts
        if ($end->lt($start)) {
            $end->addDay();
        }

        return round($start->diffInMinutes($end) / 60, 2);
    }

    /**
     * Format duration as "Xh Ym".
     */
    public function formattedDuration(): string
    {
        $start = Carbon::parse($this->start_time);
        $end   = Carbon::parse($this->end_time);

        if ($end->lt($start)) {
            $end->addDay();
        }

        $totalMinutes = $start->diffInMinutes($end);
        $hours = intdiv($totalMinutes, 60);
        $minutes = $totalMinutes % 60;

        return $minutes > 0 ? "{$hours}h {$minutes}m" : "{$hours}h";
    }

    /**
     * Check if the shift is assigned to someone.
     */
    public function isAssigned(): bool
    {
        return $this->user_id !== null;
    }

    /**
     * Check if the shift is an open shift anyone can claim.
     */
    public function isOpen(): bool
    {
        return $this->is_open && ! $this->isAssigned();
    }
}
