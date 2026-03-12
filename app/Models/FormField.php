<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FormField extends Model
{
    protected $fillable = [
        'form_id',
        'type',
        'label',
        'description',
        'is_required',
        'options',
        'settings',
        'sort_order',
        'section',
    ];

    protected function casts(): array
    {
        return [
            'is_required' => 'boolean',
            'options'     => 'array',
            'settings'    => 'array',
        ];
    }

    public function form(): BelongsTo
    {
        return $this->belongsTo(Form::class);
    }

    /**
     * Whether this field type requires an options list.
     */
    public function hasOptions(): bool
    {
        return in_array($this->type, ['select', 'multiselect', 'radio', 'checkbox']);
    }
}
