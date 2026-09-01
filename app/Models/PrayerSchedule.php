<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PrayerSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',
        'imsak',
        'subuh',
        'syuruq',
        'dzuhur',
        'ashar',
        'maghrib',
        'isya',
        'source',
    ];
}
