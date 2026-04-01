<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UpdateAudience extends Model
{
    protected $fillable = [
        'update_id',
        'audience_type',
        'audience_value',
    ];

    public function post(): BelongsTo
    {
        return $this->belongsTo(Update::class, 'update_id');
    }
}
