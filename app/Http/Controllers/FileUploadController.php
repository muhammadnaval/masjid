<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileUploadController extends Controller
{
    private const DANGEROUS_EXTENSIONS = [
        'php', 'phtml', 'php3', 'php4', 'php5', 'php7', 'phps',
        'exe', 'sh', 'bat', 'cmd', 'js', 'html', 'htm', 'cgi', 'pl', 'py', 'jar', 'vbs', 'scr', 'dll'
    ];

    /**
     * POST /api/admin/files/upload
     * Global file upload endpoint with strict mime type validation, file size limits,
     * dangerous extension blocking, filename normalization, and structured storage.
     */
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file',
            'type' => 'nullable|string|in:image,video,audio,auto',
        ]);

        $file = $request->file('file');
        $originalExt = strtolower($file->getClientOriginalExtension());

        // 1. Rejection of dangerous file extensions
        if (in_array($originalExt, self::DANGEROUS_EXTENSIONS, true)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'File berbahaya dengan ekstensi .' . $originalExt . ' tidak diizinkan.',
            ], 422);
        }

        // Determine file type category
        $mime = $file->getMimeType();
        $fileType = $request->input('type', 'auto');

        if ($fileType === 'auto') {
            if (str_contains($mime, 'image')) {
                $fileType = 'image';
            } elseif (str_contains($mime, 'video')) {
                $fileType = 'video';
            } elseif (str_contains($mime, 'audio')) {
                $fileType = 'audio';
            } else {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Jenis file tidak didukung. Format yang diizinkan: Gambar (JPG, PNG, WebP), Video (MP4, WebM), Audio (MP3, WAV, OGG).',
                ], 422);
            }
        }

        // 2. Validate max size per category
        $fileSizeBytes = $file->getSize();

        if ($fileType === 'image') {
            $request->validate([
                'file' => 'mimes:jpg,jpeg,png,webp,gif,svg|max:10240', // 10MB
            ]);
            $subFolder = 'uploads/images';
        } elseif ($fileType === 'video') {
            $request->validate([
                'file' => 'mimes:mp4,webm|max:102400', // 100MB
            ]);
            $subFolder = 'uploads/videos';
        } elseif ($fileType === 'audio') {
            $request->validate([
                'file' => 'mimes:mp3,wav,ogg,m4a|max:51200', // 50MB
            ]);
            $subFolder = 'uploads/audio';
        } else {
            return response()->json([
                'status'  => 'error',
                'message' => 'Jenis file tidak valid.',
            ], 422);
        }

        // 3. Normalize filename (slugified name + timestamp + random string)
        $clientName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safeSlug = Str::slug($clientName);
        if (empty($safeSlug)) {
            $safeSlug = 'file';
        }
        $normalizedFilename = sprintf('%s-%s-%s.%s', $safeSlug, date('YmdHis'), Str::random(8), $originalExt);

        // 4. Store in structured directory
        $path = $file->storeAs($subFolder, $normalizedFilename, 'public');
        $fileUrl = '/storage/' . $path;

        return response()->json([
            'status'     => 'success',
            'file_url'   => $fileUrl,
            'file_path'  => $path,
            'file_type'  => $fileType,
            'file_size'  => $fileSizeBytes,
            'file_name'  => $normalizedFilename,
            'message'    => 'File berhasil diunggah.',
        ], 201);
    }
}
