<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CountdownSetting extends Model
{
    protected $fillable = ['prayer_name', 'minutes'];

    public function getMinutesFor(string $prayer): int
    {
        $row = static::where('prayer_name', $prayer)->first();

        return $row ? (int) $row->minutes : 5;
    }

    public static function allAsArray(): array
    {
        return static::all()->pluck('minutes', 'prayer_name')->toArray();
    }
}
