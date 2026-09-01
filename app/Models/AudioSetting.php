<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AudioSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'prayer_name',
        'file_path',
        'source_url',
        'play_before_minutes',
        'play_after_minutes',
        'volume',
        'is_enabled',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
    ];
}
