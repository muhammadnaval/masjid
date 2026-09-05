<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Agenda extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'date',
        'time',
        'location',
        'description',
        'duration_seconds',
        'is_islamic_holiday',
        'is_active',
    ];

    protected $casts = [
        'is_islamic_holiday' => 'boolean',
        'is_active' => 'boolean',
    ];
}
