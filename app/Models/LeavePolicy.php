<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeavePolicy extends Model
{
    protected $fillable = [
        'tenant_id',
        'name',
        'color',
        'days_per_year',
        'accrual_type',
        'requires_approval',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'days_per_year'    => 'decimal:1',
        'requires_approval' => 'boolean',
        'is_active'        => 'boolean',
    ];

    public function balances(): HasMany
    {
        return $this->hasMany(LeaveBalance::class);
    }

    public function requests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }
}
