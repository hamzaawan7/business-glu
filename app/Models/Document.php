<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Document extends Model
{
    protected $fillable = [
        'tenant_id', 'category_id', 'uploaded_by', 'user_id',
        'title', 'description', 'file_name', 'file_path', 'file_type', 'file_size',
        'status', 'expiry_date', 'visibility',
    ];

    protected $casts = [
        'file_size'   => 'integer',
        'expiry_date' => 'date',
    ];

    public function category(): BelongsTo { return $this->belongsTo(DocumentCategory::class, 'category_id'); }
    public function uploader(): BelongsTo { return $this->belongsTo(User::class, 'uploaded_by'); }
    public function employee(): BelongsTo { return $this->belongsTo(User::class, 'user_id'); }

    public function isExpired(): bool
    {
        return $this->expiry_date && $this->expiry_date->isPast();
    }

    public function isExpiringSoon(): bool
    {
        return $this->expiry_date && $this->expiry_date->isBetween(now(), now()->addDays(30));
    }
}
