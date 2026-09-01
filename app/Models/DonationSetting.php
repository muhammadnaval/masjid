<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DonationSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'qr_code_path',
        'bank_name',
        'account_name',
        'account_number',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
