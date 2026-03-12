<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UpdateRead extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'update_id',
        'user_id',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function post(): BelongsTo
    {
        return $this->belongsTo(Update::class, 'update_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
