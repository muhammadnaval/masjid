<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ThemeSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'theme_name',
        'primary_color',
        'secondary_color',
        'background_color',
        'text_color',
        'layout_config',
        'custom_css',
        'is_active',
    ];

    protected $casts = [
        'layout_config' => 'array',
        'is_active' => 'boolean',
    ];
}
