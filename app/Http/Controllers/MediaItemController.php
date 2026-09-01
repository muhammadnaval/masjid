<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\MediaItem;
use Illuminate\Support\Facades\Storage;

class MediaItemController extends Controller
{
    /**
     * GET /api/admin/media
     * List all media items.
     */
    public function index(): JsonResponse
    {
        $items = MediaItem::orderBy('sort_order')->orderBy('id', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data'   => $items,
        ]);
    }

    /**
     * POST /api/admin/media
     * Create new media item.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'            => 'required|string|max:255',
            'type'             => 'required|string|in:image,video,youtube,livestream,text,table,donation,hadith,doa',
            'content'          => 'nullable|string',
            'file_path'        => 'nullable|string|max:500',
            'duration_seconds' => 'required|integer|min:3|max:300',
            'sort_order'       => 'nullable|integer',
            'is_active'        => 'nullable|boolean',
            'starts_at'        => 'nullable|date',
            'ends_at'          => 'nullable|date|after_or_equal:starts_at',
            'table_data'       => 'nullable|array',
        ]);

        $maxSort = MediaItem::max('sort_order') ?? 0;
        $validated['sort_order'] = $validated['sort_order'] ?? ($maxSort + 1);
        $validated['is_active']  = $validated['is_active'] ?? true;

        // Clean YouTube URL to embed format if type is youtube
        if ($validated['type'] === 'youtube' && !empty($validated['file_path'])) {
            $validated['file_path'] = $this->formatYoutubeEmbedUrl($validated['file_path']);
        }

        $item = MediaItem::create($validated);

        return response()->json([
            'status'  => 'success',
            'data'    => $item,
            'message' => 'Konten media berhasil ditambahkan.',
        ], 201);
    }

    /**
     * GET /api/admin/media/{id}
     */
    public function show(int $id): JsonResponse
    {
        $item = MediaItem::findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data'   => $item,
        ]);
    }

    /**
     * POST /api/admin/media/{id} or PUT
     * Update existing media item.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $item = MediaItem::findOrFail($id);

        $validated = $request->validate([
            'title'            => 'sometimes|string|max:255',
            'type'             => 'sometimes|string|in:image,video,youtube,livestream,text,table,donation,hadith,doa',
            'content'          => 'nullable|string',
            'file_path'        => 'nullable|string|max:500',
            'duration_seconds' => 'sometimes|integer|min:3|max:300',
            'sort_order'       => 'nullable|integer',
            'is_active'        => 'sometimes|boolean',
            'starts_at'        => 'nullable|date',
            'ends_at'          => 'nullable|date',
            'table_data'       => 'nullable|array',
        ]);

        if (isset($validated['type']) && $validated['type'] === 'youtube' && !empty($validated['file_path'])) {
            $validated['file_path'] = $this->formatYoutubeEmbedUrl($validated['file_path']);
        }

        $item->update($validated);

        return response()->json([
            'status'  => 'success',
            'data'    => $item,
            'message' => 'Konten media berhasil diperbarui.',
        ]);
    }

    /**
     * DELETE /api/admin/media/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $item = MediaItem::findOrFail($id);
        if ($item->file_path) {
            $relativePath = ltrim(str_replace('/storage/', '', $item->file_path), '/');
            \Illuminate\Support\Facades\Storage::disk('public')->delete($relativePath);
        }
        $item->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Konten media berhasil dihapus.',
        ]);
    }

    /**
     * POST /api/admin/media/reorder
     * Reorder list of media items.
     */
    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order'   => 'required|array',
            'order.*' => 'integer|exists:media_items,id',
        ]);

        foreach ($validated['order'] as $index => $id) {
            MediaItem::where('id', $id)->update(['sort_order' => $index + 1]);
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Urutan media berhasil disimpan.',
        ]);
    }

    /**
     * POST /api/admin/media/upload
     * Handle media file upload (Image JPG/PNG/WebP or Video MP4/WebM max 50MB).
     */
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:jpg,jpeg,png,webp,mp4,webm|max:51200', // 50MB max
        ]);

        $file     = $request->file('file');
        $mime     = $file->getMimeType();
        $isVector = str_contains($mime, 'image');
        $folder   = $isVector ? 'media/images' : 'media/videos';

        $path    = $file->store($folder, 'public');
        $fileUrl = '/storage/' . $path;

        return response()->json([
            'status'    => 'success',
            'file_url'  => $fileUrl,
            'file_type' => $isVector ? 'image' : 'video',
            'message'   => 'File media berhasil diunggah.',
        ]);
    }

    /**
     * Helper to format YouTube URLs into iframe embed URL format.
     */
    private function formatYoutubeEmbedUrl(string $url): string
    {
        // Check if already an embed URL
        if (str_contains($url, 'youtube.com/embed/')) {
            return $url;
        }

        // Extract Video ID
        $videoId = null;
        if (preg_match('/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/', $url, $matches)) {
            $videoId = $matches[1];
        }

        if ($videoId) {
            return "https://www.youtube.com/embed/{$videoId}?autoplay=1&mute=1&enablejsapi=1&controls=0";
        }

        return $url;
    }
}
