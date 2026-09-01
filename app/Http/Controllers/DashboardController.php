<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\MosqueProfile;
use App\Models\PrayerLocation;
use App\Models\PrayerSchedule;
use App\Models\MediaItem;
use App\Models\RunningText;
use App\Models\ThemeSetting;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $profile = MosqueProfile::first();
        $location = PrayerLocation::where('is_active', true)->first() ?? PrayerLocation::first();
        $schedule = PrayerSchedule::where('date', date('Y-m-d'))->first() ?? PrayerSchedule::first();
        $activeMediaCount = MediaItem::where('is_active', true)->count();
        $activeTextCount = RunningText::where('is_active', true)->count();
        $theme = ThemeSetting::where('is_active', true)->first() ?? ThemeSetting::first();

        return response()->json([
            'profile' => $profile,
            'location' => $location,
            'schedule' => $schedule,
            'active_media_count' => $activeMediaCount,
            'active_text_count' => $activeTextCount,
            'theme' => $theme,
        ]);
    }
}
