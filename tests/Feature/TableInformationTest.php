<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\MediaItem;

class TableInformationTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_khutbah_schedule_table(): void
    {
        $payload = [
            'title' => 'Jadwal Petugas Sholat Jumat Bulan Februari',
            'type' => 'table',
            'duration_seconds' => 15,
            'is_active' => true,
            'table_data' => [
                'headers' => ['Tanggal', 'Khatib', 'Imam', 'Muadzin'],
                'rows' => [
                    ['06 Feb 2026', 'Ustadz Dr. H. Ahmad Fauzi', 'Ustadz Muhammad Ridwan', 'Bilal Abdullah'],
                    ['13 Feb 2026', 'Ustadz Prof. Dr. Rahmat Hidayat', 'Ustadz Syamsul Bahri', 'Bilal Hasan'],
                ],
            ],
        ];

        $response = $this->postJson('/api/admin/media', $payload);

        $response->assertStatus(201)
                 ->assertJson([
                     'status' => 'success',
                 ])
                 ->assertJsonPath('data.table_data.headers.0', 'Tanggal');

        $this->assertDatabaseHas('media_items', [
            'title' => 'Jadwal Petugas Sholat Jumat Bulan Februari',
            'type' => 'table',
        ]);
    }

    public function test_can_create_kas_masjid_report_table(): void
    {
        $payload = [
            'title' => 'Laporan Kas Keuangan Masjid Minggu Ke-1',
            'type' => 'table',
            'duration_seconds' => 20,
            'is_active' => true,
            'table_data' => [
                'headers' => ['Tanggal', 'Keterangan', 'Penerimaan', 'Pengeluaran', 'Saldo'],
                'rows' => [
                    ['01 Feb 2026', 'Infaq Kotak Jumat', 'Rp 4.500.000', 'Rp 0', 'Rp 24.500.000'],
                    ['03 Feb 2026', 'Bayar Listrik & Air', 'Rp 0', 'Rp 1.200.000', 'Rp 23.300.000'],
                ],
            ],
        ];

        $response = $this->postJson('/api/admin/media', $payload);

        $response->assertStatus(201)
                 ->assertJsonPath('data.table_data.headers.1', 'Keterangan');
    }

    public function test_table_data_included_in_display_state(): void
    {
        MediaItem::create([
            'title' => 'Tabel Kas',
            'type' => 'table',
            'duration_seconds' => 10,
            'is_active' => true,
            'sort_order' => 1,
            'table_data' => [
                'headers' => ['Uraian', 'Jumlah'],
                'rows' => [['Kas Utama', 'Rp 10.000.000']],
            ],
        ]);

        $response = $this->getJson('/api/display/state');

        $response->assertStatus(200)
                 ->assertJsonPath('media.0.table_data.headers.0', 'Uraian');
    }
}
