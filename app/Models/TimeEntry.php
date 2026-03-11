<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TimeEntry extends Model
{
    protected $fillable = [
        'tenant_id',
        'user_id',
        'clock_in',
        'clock_out',
        'clock_in_lat',
        'clock_in_lng',
        'clock_out_lat',
        'clock_out_lng',
        'clock_in_note',
        'clock_out_note',
        'total_break_minutes',
        'total_minutes',
        'status',
        'approved_by',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'clock_in'    => 'datetime',
            'clock_out'   => 'datetime',
            'approved_at' => 'datetime',
            'clock_in_lat'  => 'decimal:7',
            'clock_in_lng'  => 'decimal:7',
            'clock_out_lat' => 'decimal:7',
            'clock_out_lng' => 'decimal:7',
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

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function breaks(): HasMany
    {
        return $this->hasMany(TimeEntryBreak::class);
    }

    // ── Helpers ──────────────────────────────────────────────

    /**
     * Check if the user is currently clocked in (no clock_out).
     */
    public function isActive(): bool
    {
        return is_null($this->clock_out);
    }

    /**
     * Check if the user is currently on a break.
     */
    public function isOnBreak(): bool
    {
        return $this->breaks()->whereNull('end')->exists();
    }

    /**
     * Get the current active break (if any).
     */
    public function activeBreak(): ?TimeEntryBreak
    {
        return $this->breaks()->whereNull('end')->first();
    }

    /**
     * Calculate total worked minutes (excluding breaks).
     */
    public function calculateTotalMinutes(): int
    {
        $endTime = $this->clock_out ?? now();
        $totalMinutes = $this->clock_in->diffInMinutes($endTime);

        return max(0, $totalMinutes - $this->total_break_minutes);
    }

    /**
     * Format duration as "Xh Ym".
     */
    public static function formatMinutes(int $minutes): string
    {
        $hours = intdiv($minutes, 60);
        $mins = $minutes % 60;

        if ($hours === 0) {
            return "{$mins}m";
        }

        return "{$hours}h {$mins}m";
    }
}
