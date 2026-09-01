<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminPanelController;

Route::get('/admin/login', [AuthController::class, 'showLogin'])->name('admin.login');
Route::post('/admin/login', [AuthController::class, 'login'])->name('admin.login.post');
Route::post('/admin/logout', [AuthController::class, 'logout'])->name('admin.logout');

Route::middleware('auth')->prefix('admin')->group(function () {
    Route::get('/', fn () => redirect()->route('admin.dashboard'));
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('admin.dashboard');

    // Collection CRUD (store via POST)
    Route::post('/running-text', [AdminPanelController::class, 'storeRunningText'])->name('admin.running-text.store');
    Route::post('/agenda', [AdminPanelController::class, 'storeAgenda'])->name('admin.agenda.store');
    Route::post('/media', [AdminPanelController::class, 'storeMedia'])->name('admin.media.store');

    // Toggle & Delete
    Route::put('/{page}/{id}/toggle', [AdminPanelController::class, 'toggle'])->where('page', 'running-text|agenda|media')->name('admin.page.toggle');
    Route::delete('/{page}/{id}', [AdminPanelController::class, 'delete'])->where('page', 'running-text|agenda|media')->name('admin.page.delete');

    // Singleton pages (GET view, POST save)
    $pages = 'profile|schedule|iqamah|syuruq|audio|media|donation|running-text|agenda|theme|hijri|countdown|friday|account';
    Route::get('/{page}', [AdminPanelController::class, 'page'])->where('page', $pages)->name('admin.page.edit');
    Route::post('/{page}/save', [AdminPanelController::class, 'save'])->where('page', $pages)->name('admin.page.save');
});

Route::fallback(fn () => response('Not found', 404));
