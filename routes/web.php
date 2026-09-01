<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\AdminDashboardController;

Route::get('/admin/login', [AuthController::class, 'showLogin'])->name('admin.login');
Route::post('/admin/login', [AuthController::class, 'login'])->name('admin.login.post');
Route::post('/admin/logout', [AuthController::class, 'logout'])->name('admin.logout');

Route::middleware('auth')->prefix('admin')->group(function () {
    Route::get('/', fn () => redirect()->route('admin.dashboard'));
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('admin.dashboard');
});

Route::fallback(function () {
    $indexPath = public_path('dist/index.html');
    if (file_exists($indexPath)) return response()->file($indexPath);
    return response('Application frontend not built.', 404);
});
