<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\RunningText;

class RunningTextController extends Controller
{
    /**
     * GET /api/admin/running-text
     */
    public function index(): JsonResponse
    {
        $items = RunningText::orderBy('id', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data'   => $items,
        ]);
    }

    /**
     * POST /api/admin/running-text
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'text'      => 'required|string|max:1000',
            'speed'     => 'nullable|string|in:slow,normal,fast',
            'category'  => 'nullable|string|in:umum,donasi,kajian,himbauan',
            'is_active' => 'nullable|boolean',
            'starts_at' => 'nullable|date',
            'ends_at'   => 'nullable|date|after_or_equal:starts_at',
        ]);

        $validated['speed']     = $validated['speed'] ?? 'normal';
        $validated['category']  = $validated['category'] ?? 'umum';
        $validated['is_active'] = $validated['is_active'] ?? true;

        $item = RunningText::create($validated);

        return response()->json([
            'status'  => 'success',
            'data'    => $item,
            'message' => 'Running text berhasil ditambahkan.',
        ], 201);
    }

    /**
     * GET /api/admin/running-text/{id}
     */
    public function show(int $id): JsonResponse
    {
        $item = RunningText::findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data'   => $item,
        ]);
    }

    /**
     * POST/PUT /api/admin/running-text/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $item = RunningText::findOrFail($id);

        $validated = $request->validate([
            'text'      => 'sometimes|string|max:1000',
            'speed'     => 'nullable|string|in:slow,normal,fast',
            'category'  => 'nullable|string|in:umum,donasi,kajian,himbauan',
            'is_active' => 'sometimes|boolean',
            'starts_at' => 'nullable|date',
            'ends_at'   => 'nullable|date',
        ]);

        $item->update($validated);

        return response()->json([
            'status'  => 'success',
            'data'    => $item,
            'message' => 'Running text berhasil diperbarui.',
        ]);
    }

    /**
     * DELETE /api/admin/running-text/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $item = RunningText::findOrFail($id);
        $item->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Running text berhasil dihapus.',
        ]);
    }
}
