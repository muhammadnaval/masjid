<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Agenda;

class AgendaController extends Controller
{
    /**
     * GET /api/admin/agenda
     */
    public function index(): JsonResponse
    {
        $agendas = Agenda::orderBy('date', 'asc')->get();

        return response()->json([
            'status' => 'success',
            'data'   => $agendas,
        ]);
    }

    /**
     * POST /api/admin/agenda
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'              => 'required|string|max:255',
            'date'               => 'required|date',
            'time'               => 'nullable|string|max:50',
            'location'           => 'nullable|string|max:255',
            'description'        => 'nullable|string',
            'is_islamic_holiday' => 'nullable|boolean',
            'is_active'          => 'nullable|boolean',
        ]);

        $validated['time']               = $validated['time'] ?? '18:30';
        $validated['location']           = $validated['location'] ?? 'Ruang Utama Masjid';
        $validated['is_islamic_holiday'] = $validated['is_islamic_holiday'] ?? false;
        $validated['is_active']          = $validated['is_active'] ?? true;

        $agenda = Agenda::create($validated);

        return response()->json([
            'status'  => 'success',
            'data'    => $agenda,
            'message' => 'Agenda berhasil ditambahkan.',
        ], 201);
    }

    /**
     * GET /api/admin/agenda/{id}
     */
    public function show(int $id): JsonResponse
    {
        $agenda = Agenda::findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data'   => $agenda,
        ]);
    }

    /**
     * POST/PUT /api/admin/agenda/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $agenda = Agenda::findOrFail($id);

        $validated = $request->validate([
            'title'              => 'sometimes|string|max:255',
            'date'               => 'sometimes|date',
            'time'               => 'nullable|string|max:50',
            'location'           => 'nullable|string|max:255',
            'description'        => 'nullable|string',
            'is_islamic_holiday' => 'sometimes|boolean',
            'is_active'          => 'sometimes|boolean',
        ]);

        $agenda->update($validated);

        return response()->json([
            'status'  => 'success',
            'data'    => $agenda,
            'message' => 'Agenda berhasil diperbarui.',
        ]);
    }

    /**
     * DELETE /api/admin/agenda/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $agenda = Agenda::findOrFail($id);
        $agenda->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Agenda berhasil dihapus.',
        ]);
    }
}
