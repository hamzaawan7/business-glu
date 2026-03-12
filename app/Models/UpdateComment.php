<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UpdateComment extends Model
{
    protected $fillable = [
        'update_id',
        'user_id',
        'body',
    ];

    public function post(): BelongsTo
    {
        return $this->belongsTo(Update::class, 'update_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
