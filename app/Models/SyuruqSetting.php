<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SyuruqSetting extends Model
{
    protected $table = 'syuruq_settings';

    protected $fillable = [
        'is_enabled',
        'duration_minutes',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'duration_minutes' => 'integer',
    ];
}
