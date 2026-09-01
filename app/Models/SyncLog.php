<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SyncLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'status',
        'message',
        'details',
    ];

    protected $casts = [
        'details' => 'array',
    ];
}
