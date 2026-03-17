<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimelineEvent extends Model
{
    protected $fillable = [
        'tenant_id',
        'user_id',
        'created_by',
        'type',
        'title',
        'description',
        'event_date',
        'file_path',
        'file_name',
        'metadata',
    ];

    protected $casts = [
        'event_date' => 'date',
        'metadata'   => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
