<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PrayerTimeCorrection extends Model
{
    use HasFactory;

    protected $fillable = [
        'prayer_name',
        'correction_minutes',
    ];
}
