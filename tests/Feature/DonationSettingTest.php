<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\DonationSetting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class DonationSettingTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_fetch_donation_setting(): void
    {
        DonationSetting::create([
            'title' => 'Infaq Masjid Test',
            'description' => 'Sedekah subuh berkah',
            'bank_name' => 'BSI',
            'account_name' => 'Masjid Test',
            'account_number' => '1234567890',
            'qr_code_path' => 'https://example.com/qr.png',
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/admin/donasi');

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => 'success',
                 ])
                 ->assertJsonPath('donation.title', 'Infaq Masjid Test');
    }

    public function test_can_update_donation_setting(): void
    {
        $payload = [
            'title' => 'Infaq Pembangunan Menara',
            'description' => 'Mari selesaikan pembangunan menara masjid.',
            'bank_name' => 'Bank Mandiri',
            'account_name' => 'Panitia Pembangunan Masjid',
            'account_number' => '9876543210',
            'qr_code_path' => 'https://example.com/qr_menara.png',
            'is_active' => true,
        ];

        $response = $this->postJson('/api/admin/donasi', $payload);

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => 'success',
                     'message' => 'Pengaturan donasi berhasil disimpan.',
                 ]);

        $this->assertDatabaseHas('donation_settings', [
            'title' => 'Infaq Pembangunan Menara',
            'bank_name' => 'Bank Mandiri',
            'account_number' => '9876543210',
        ]);
    }

    public function test_can_upload_qr_code_image(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->create('qris.png', 500, 'image/png');

        $response = $this->postJson('/api/admin/donasi/upload-qr', [
            'qr_file' => $file,
        ]);

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => 'success',
                 ]);

        $fileUrl = $response->json('file_url');
        $storagePath = str_replace('/storage/', '', $fileUrl);

        Storage::disk('public')->assertExists($storagePath);
    }

    public function test_donation_setting_included_in_display_state(): void
    {
        DonationSetting::create([
            'title' => 'Infaq Display',
            'description' => 'Deskripsi Display',
            'bank_name' => 'BSI',
            'account_name' => 'Masjid',
            'account_number' => '7123',
            'qr_code_path' => 'https://example.com/qr.png',
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/display/state');

        $response->assertStatus(200)
                 ->assertJsonPath('donation.title', 'Infaq Display');
    }
}
