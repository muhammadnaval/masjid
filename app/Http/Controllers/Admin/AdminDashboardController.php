<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MosqueProfile;
use App\Models\PrayerLocation;
use App\Models\PrayerSchedule;
use App\Models\MediaItem;
use App\Models\RunningText;
use App\Models\SyncLog;
use App\Models\ThemeSetting;

class AdminDashboardController extends Controller
{
    public function index()
    {
        return view('admin.dashboard', [
            'profile' => MosqueProfile::first(),
            'location' => PrayerLocation::where('is_active', true)->first() ?? PrayerLocation::first(),
            'schedule' => PrayerSchedule::where('date', date('Y-m-d'))->first(),
            'activeMediaCount' => MediaItem::where('is_active', true)->count(),
            'activeTextCount' => RunningText::where('is_active', true)->count(),
            'theme' => ThemeSetting::where('is_active', true)->first(),
            'latestLog' => SyncLog::orderBy('created_at', 'desc')->first(),
        ]);
    }
}
