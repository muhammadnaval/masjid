<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MediaItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'type',
        'content',
        'file_path',
        'duration_seconds',
        'sort_order',
        'is_active',
        'starts_at',
        'ends_at',
        'table_data',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'table_data' => 'array',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];
}
