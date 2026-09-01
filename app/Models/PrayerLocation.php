<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PrayerLocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'province_name',
        'city_code',
        'city_name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
