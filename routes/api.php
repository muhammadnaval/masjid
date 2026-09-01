<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DisplayController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MosqueProfileController;
use App\Http\Controllers\PrayerScheduleController;
use App\Http\Controllers\AudioSettingController;
use App\Http\Controllers\IqamahSettingController;

/*
|--------------------------------------------------------------------------
| API Routes for Masjid Display
|--------------------------------------------------------------------------
*/

Route::get('/display/state', [DisplayController::class, 'state']);

Route::prefix('admin')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
    
    Route::get('/profil-masjid', [MosqueProfileController::class, 'show']);
    Route::post('/profil-masjid', [MosqueProfileController::class, 'update']);
    
    Route::get('/jadwal-sholat', [PrayerScheduleController::class, 'index']);
    Route::get('/jadwal-sholat/provinsi', [PrayerScheduleController::class, 'provinces']);
    Route::post('/jadwal-sholat/kabkota', [PrayerScheduleController::class, 'kabkota']);
    Route::post('/jadwal-sholat/lokasi', [PrayerScheduleController::class, 'updateLocation']);
    Route::post('/jadwal-sholat/koreksi', [PrayerScheduleController::class, 'updateCorrections']);
    Route::post('/jadwal-sholat/sinkronisasi', [PrayerScheduleController::class, 'sync']);

    Route::get('/audio', [AudioSettingController::class, 'show']);
    Route::post('/audio', [AudioSettingController::class, 'update']);
    Route::post('/audio/upload', [AudioSettingController::class, 'uploadFile']);
    Route::post('/audio/upload-murottal', [AudioSettingController::class, 'uploadMurottalFile']);
    Route::post('/audio/upload-dzikir-pagi', [AudioSettingController::class, 'uploadDzikirPagiFile']);
    Route::post('/audio/upload-dzikir-petang', [AudioSettingController::class, 'uploadDzikirPetangFile']);

    Route::get('/iqamah', [IqamahSettingController::class, 'index']);
    Route::post('/iqamah', [IqamahSettingController::class, 'update']);

    Route::get('/syuruq', [\App\Http\Controllers\SyuruqSettingController::class, 'show']);
    Route::post('/syuruq', [\App\Http\Controllers\SyuruqSettingController::class, 'update']);

    Route::get('/hijri', [\App\Http\Controllers\HijriSettingController::class, 'show']);
    Route::post('/hijri', [\App\Http\Controllers\HijriSettingController::class, 'update']);

    Route::get('/media', [\App\Http\Controllers\MediaItemController::class, 'index']);
    Route::post('/media', [\App\Http\Controllers\MediaItemController::class, 'store']);
    Route::get('/media/{id}', [\App\Http\Controllers\MediaItemController::class, 'show']);
    Route::post('/media/upload', [\App\Http\Controllers\MediaItemController::class, 'upload']);
    Route::post('/media/reorder', [\App\Http\Controllers\MediaItemController::class, 'reorder']);
    Route::match(['post', 'put'], '/media/{id}', [\App\Http\Controllers\MediaItemController::class, 'update']);
    Route::delete('/media/{id}', [\App\Http\Controllers\MediaItemController::class, 'destroy']);

    Route::get('/donasi', [\App\Http\Controllers\DonationSettingController::class, 'show']);
    Route::post('/donasi', [\App\Http\Controllers\DonationSettingController::class, 'update']);
    Route::post('/donasi/upload-qr', [\App\Http\Controllers\DonationSettingController::class, 'uploadQr']);

    Route::get('/running-text', [\App\Http\Controllers\RunningTextController::class, 'index']);
    Route::post('/running-text', [\App\Http\Controllers\RunningTextController::class, 'store']);
    Route::get('/running-text/{id}', [\App\Http\Controllers\RunningTextController::class, 'show']);
    Route::match(['post', 'put'], '/running-text/{id}', [\App\Http\Controllers\RunningTextController::class, 'update']);
    Route::delete('/running-text/{id}', [\App\Http\Controllers\RunningTextController::class, 'destroy']);

    Route::get('/agenda', [\App\Http\Controllers\AgendaController::class, 'index']);
    Route::post('/agenda', [\App\Http\Controllers\AgendaController::class, 'store']);
    Route::get('/agenda/{id}', [\App\Http\Controllers\AgendaController::class, 'show']);
    Route::match(['post', 'put'], '/agenda/{id}', [\App\Http\Controllers\AgendaController::class, 'update']);
    Route::delete('/agenda/{id}', [\App\Http\Controllers\AgendaController::class, 'destroy']);

    Route::get('/friday', [\App\Http\Controllers\FridaySettingController::class, 'show']);
    Route::post('/friday', [\App\Http\Controllers\FridaySettingController::class, 'update']);

    Route::get('/theme', [\App\Http\Controllers\ThemeSettingController::class, 'show']);
    Route::post('/theme', [\App\Http\Controllers\ThemeSettingController::class, 'update']);
    Route::post('/theme/reset', [\App\Http\Controllers\ThemeSettingController::class, 'reset']);

    Route::post('/files/upload', [\App\Http\Controllers\FileUploadController::class, 'upload']);

    Route::get('/account', [\App\Http\Controllers\AccountSettingController::class, 'show']);
    Route::post('/account/profile', [\App\Http\Controllers\AccountSettingController::class, 'updateProfile']);
    Route::post('/account/password', [\App\Http\Controllers\AccountSettingController::class, 'updatePassword']);

    Route::get('/logs', [\App\Http\Controllers\SyncLogController::class, 'index']);
    Route::get('/logs/latest', [\App\Http\Controllers\SyncLogController::class, 'latest']);
    Route::post('/logs', [\App\Http\Controllers\SyncLogController::class, 'store']);
});
