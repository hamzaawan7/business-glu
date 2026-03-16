<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    protected $fillable = [
        'tenant_id',
        'category_id',
        'created_by',
        'assigned_to',
        'subject',
        'description',
        'priority',
        'status',
        'resolved_at',
        'closed_at',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
        'closed_at'   => 'datetime',
    ];

    /* ── Relations ────────────────────────────────────── */

    public function category(): BelongsTo
    {
        return $this->belongsTo(HelpDeskCategory::class, 'category_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(TicketReply::class);
    }

    /* ── Helpers ──────────────────────────────────────── */

    public function isOpen(): bool
    {
        return in_array($this->status, ['open', 'in_progress']);
    }
}
