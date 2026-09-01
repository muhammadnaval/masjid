<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class RandomContentService
{
    private const HADIS_CACHE_KEY = 'random_hadis';
    private const DOA_CACHE_KEY = 'random_doa';
    private const CACHE_TTL = 1800; // 30 menit

    /**
     * Ambil hadis acak dari MyQuran API, di-cache 30 menit.
     * Mengembalikan array siap pakai sebagai media item, atau null jika gagal.
     */
    public function getRandomHadis(): ?array
    {
        return Cache::remember(self::HADIS_CACHE_KEY, self::CACHE_TTL, function () {
            try {
                $response = Http::timeout(5)->get('https://api.myquran.com/v3/hadis/enc/random');
                if ($response->failed()) return null;

                $json = $response->json();
                $data = $json['data'] ?? null;
                $text = $data['text'] ?? null;

                if (!$text || empty($text['ar']) || empty($text['id'])) return null;

                $takhrij = $data['takhrij'] ?? '';
                $grade = $data['grade'] ?? '';
                $translation = $text['id'] . ($takhrij ? "\nTakhrij: $takhrij" : '');

                return [
                    'id' => 'random_hadis',
                    'title' => 'HADIS PILIHAN',
                    'type' => 'hadith',
                    'content' => json_encode([
                        'subtitle' => $grade ? "Grade: $grade" : '',
                        'arabic_text' => $text['ar'],
                        'content' => $translation,
                    ]),
                    'duration_seconds' => 10,
                    'sort_order' => -9999,
                    'is_active' => true,
                ];
            } catch (\Throwable $e) {
                report($e);
                return null;
            }
        });
    }

    /**
     * Ambil doa acak dari eQuran API, di-cache 30 menit.
     * Mengembalikan array siap pakai sebagai media item, atau null jika gagal.
     */
    public function getRandomDoa(): ?array
    {
        return Cache::remember(self::DOA_CACHE_KEY, self::CACHE_TTL, function () {
            try {
                $response = Http::timeout(5)->get('https://equran.id/api/doa');
                if ($response->failed()) return null;

                $json = $response->json();
                $items = collect($json['data'] ?? [])->filter(function ($item) {
                    return isset($item['ar']) && preg_match('/[\x{0600}-\x{06FF}]/u', $item['ar']);
                });

                if ($items->isEmpty()) return null;

                $item = $items->random();

                return [
                    'id' => 'random_doa',
                    'title' => 'DOA PILIHAN',
                    'type' => 'hadith',
                    'content' => json_encode([
                        'subtitle' => $item['nama'] ?? $item['grup'] ?? '',
                        'arabic_text' => $item['ar'],
                        'content' => $item['idn'] ?? $item['tr'] ?? '',
                    ]),
                    'duration_seconds' => 10,
                    'sort_order' => -10000,
                    'is_active' => true,
                ];
            } catch (\Throwable $e) {
                report($e);
                return null;
            }
        });
    }
}
