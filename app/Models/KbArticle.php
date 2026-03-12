<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KbArticle extends Model
{
    protected $fillable = [
        'tenant_id',
        'category_id',
        'created_by',
        'title',
        'slug',
        'body',
        'status',
        'is_pinned',
        'sort_order',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'is_pinned'    => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(KbCategory::class, 'category_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function views(): HasMany
    {
        return $this->hasMany(KbArticleView::class, 'article_id');
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }
}
