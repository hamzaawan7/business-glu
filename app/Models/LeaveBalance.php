<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveBalance extends Model
{
    protected $fillable = [
        'tenant_id',
        'user_id',
        'leave_policy_id',
        'balance',
        'used',
        'total',
        'year',
    ];

    protected $casts = [
        'balance' => 'decimal:1',
        'used'    => 'decimal:1',
        'total'   => 'decimal:1',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function policy(): BelongsTo
    {
        return $this->belongsTo(LeavePolicy::class, 'leave_policy_id');
    }
}
