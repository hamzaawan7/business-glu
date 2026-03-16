<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Recognition extends Model
{
    protected $fillable = [
        'tenant_id',
        'sender_id',
        'recipient_id',
        'badge_id',
        'message',
        'visibility',
        'points',
    ];

    protected $casts = [
        'points' => 'integer',
    ];

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    public function badge(): BelongsTo
    {
        return $this->belongsTo(Badge::class);
    }
}
