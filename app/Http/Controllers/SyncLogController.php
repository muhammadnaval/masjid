<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\SyncLog;

class SyncLogController extends Controller
{
    /**
     * GET /api/admin/logs
     */
    public function index(): JsonResponse
    {
        $logs = SyncLog::orderBy('created_at', 'desc')->take(50)->get();

        return response()->json([
            'status' => 'success',
            'data'   => $logs,
        ]);
    }

    /**
     * GET /api/admin/logs/latest
     */
    public function latest(): JsonResponse
    {
        $latest = SyncLog::orderBy('created_at', 'desc')->first();

        return response()->json([
            'status' => 'success',
            'latest' => $latest ?? [
                'type'       => 'schedule_sync',
                'status'     => 'success',
                'message'    => 'Sistem berjalan normal. Belum ada log kesalahan.',
                'created_at' => now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * POST /api/admin/logs
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type'    => 'nullable|string|max:100',
            'status'  => 'required|string|in:success,failed',
            'message' => 'required|string',
            'details' => 'nullable|array',
        ]);

        $validated['type'] = $validated['type'] ?? 'schedule_sync';

        $log = SyncLog::create($validated);

        return response()->json([
            'status'  => 'success',
            'data'    => $log,
            'message' => 'Log sinkronisasi berhasil dicatat.',
        ], 201);
    }
}
