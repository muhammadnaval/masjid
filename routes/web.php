<?php

use Illuminate\Support\Facades\Route;

Route::fallback(function () {
    $indexPath = public_path('dist/index.html');
    if (file_exists($indexPath)) {
        return response()->file($indexPath);
    }
    return response('Application frontend not built. Please run npm run build.', 404);
});
