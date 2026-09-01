<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use App\Models\MediaItem;
use App\Models\DonationSetting;
use App\Models\MosqueProfile;
use App\Models\AudioSetting;

class CleanOrphanFilesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'storage:clean-orphans {--dry-run : Menampilkan file orphan tanpa menghapusnya}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Scans public storage directory and prunes orphan unreferenced files.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Scanning storage directory for orphan files...');

        // 1. Gather all active file paths from database
        $activeFiles = [];

        // MediaItems
        $mediaFiles = MediaItem::whereNotNull('file_path')->pluck('file_path')->all();
        foreach ($mediaFiles as $path) {
            $activeFiles[] = ltrim(str_replace('/storage/', '', $path), '/');
        }

        // Donation QR Code
        $donation = DonationSetting::first();
        if ($donation && $donation->qr_code_path) {
            $activeFiles[] = ltrim(str_replace('/storage/', '', $donation->qr_code_path), '/');
        }

        // Mosque Profile Logo & Background
        $profile = MosqueProfile::first();
        if ($profile) {
            if ($profile->logo_path) {
                $activeFiles[] = ltrim(str_replace('/storage/', '', $profile->logo_path), '/');
            }
            if ($profile->background_path) {
                $activeFiles[] = ltrim(str_replace('/storage/', '', $profile->background_path), '/');
            }
        }

        // Audio Settings
        $audioFiles = AudioSetting::whereNotNull('file_path')->pluck('file_path')->all();
        foreach ($audioFiles as $path) {
            $activeFiles[] = ltrim(str_replace('/storage/', '', $path), '/');
        }

        $activeFiles = array_filter(array_unique($activeFiles));

        // 2. Scan disk files under public disk
        $directories = ['uploads', 'media', 'donasi', 'audio'];
        $allFilesOnDisk = [];

        foreach ($directories as $dir) {
            if (Storage::disk('public')->exists($dir)) {
                $files = Storage::disk('public')->allFiles($dir);
                foreach ($files as $f) {
                    $allFilesOnDisk[] = $f;
                }
            }
        }

        // 3. Identify orphan files
        $orphanFiles = array_diff($allFilesOnDisk, $activeFiles);

        $isDryRun = $this->option('dry-run');

        if (empty($orphanFiles)) {
            $this->info('Clean! Tidak ditemukan file orphan di dalam storage.');
            return 0;
        }

        $this->warn(sprintf('Ditemukan %d file orphan:', count($orphanFiles)));

        $deletedCount = 0;
        foreach ($orphanFiles as $file) {
            if ($isDryRun) {
                $this->line(" [Dry-Run] Orphan file: {$file}");
            } else {
                if (Storage::disk('public')->delete($file)) {
                    $this->line(" [Deleted] Orphan file: {$file}");
                    $deletedCount++;
                }
            }
        }

        if ($isDryRun) {
            $this->info(sprintf('[Dry-Run Selesai] Total %d file orphan terdeteksi.', count($orphanFiles)));
        } else {
            $this->info(sprintf('[Cleanup Selesai] Total %d file orphan berhasil dihapus dari disk.', $deletedCount));
        }

        return 0;
    }
}
