<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimeEntryBreak extends Model
{
    protected $fillable = [
        'time_entry_id',
        'start',
        'end',
        'type',
        'duration_minutes',
    ];

    protected function casts(): array
    {
        return [
            'start' => 'datetime',
            'end'   => 'datetime',
        ];
    }

    public function timeEntry(): BelongsTo
    {
        return $this->belongsTo(TimeEntry::class);
    }

    /**
     * Check if this break is still ongoing.
     */
    public function isActive(): bool
    {
        return is_null($this->end);
    }

    /**
     * Calculate break duration in minutes.
     */
    public function calculateDuration(): int
    {
        $endTime = $this->end ?? now();
        return (int) $this->start->diffInMinutes($endTime);
    }
}
