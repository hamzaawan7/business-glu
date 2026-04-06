<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CourseTemplate extends Model
{
    protected $fillable = [
        'tenant_id',
        'name',
        'description',
        'category',
        'cover_image',
        'content',
        'is_system',
    ];

    protected $casts = [
        'content'   => 'array',
        'is_system' => 'boolean',
    ];
}
