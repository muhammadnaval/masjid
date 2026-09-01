<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IqamahSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'prayer_name',
        'is_enabled',
        'duration_minutes',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
    ];
}
