<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MosqueProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'address',
        'contact',
        'logo_path',
        'background_path',
        'timezone',
        'hijri_correction',
    ];

    protected $casts = [
        'hijri_correction' => 'integer',
    ];
}
