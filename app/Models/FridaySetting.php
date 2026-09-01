<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FridaySetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'is_enabled',
        'disable_iqamah_on_friday',
        'khutbah_title',
        'khutbah_khatib',
        'khutbah_imam',
        'khutbah_duration_minutes',
    ];

    protected $casts = [
        'is_enabled'               => 'boolean',
        'disable_iqamah_on_friday' => 'boolean',
        'khutbah_duration_minutes' => 'integer',
    ];
}
