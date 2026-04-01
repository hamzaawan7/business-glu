<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UpdateTemplate extends Model
{
    protected $fillable = [
        'tenant_id',
        'created_by',
        'name',
        'title',
        'body',
        'type',
        'category',
        'cover_image',
        'images',
        'allow_comments',
        'allow_reactions',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'images'          => 'array',
            'allow_comments'  => 'boolean',
            'allow_reactions' => 'boolean',
            'is_default'      => 'boolean',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
