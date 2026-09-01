<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AccountSettingTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_fetch_account_details(): void
    {
        User::create([
            'name' => 'Pengurus Masjid Utama',
            'email' => 'admin@masjid.test',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->getJson('/api/admin/account');

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => 'success',
                 ])
                 ->assertJsonPath('data.email', 'admin@masjid.test')
                 ->assertJsonPath('data.name', 'Pengurus Masjid Utama');
    }

    public function test_can_update_profile_info(): void
    {
        User::create([
            'name' => 'Old Name',
            'email' => 'old@masjid.test',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/admin/account/profile', [
            'name' => 'Takmir Masjid New',
            'email' => 'newadmin@masjid.test',
        ]);

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => 'success',
                 ])
                 ->assertJsonPath('data.name', 'Takmir Masjid New')
                 ->assertJsonPath('data.email', 'newadmin@masjid.test');

        $this->assertDatabaseHas('users', [
            'email' => 'newadmin@masjid.test',
            'name' => 'Takmir Masjid New',
        ]);
    }

    public function test_can_change_password_with_valid_current_password(): void
    {
        $user = User::create([
            'name' => 'Admin User',
            'email' => 'admin@masjid.test',
            'password' => Hash::make('oldpassword123'),
        ]);

        $payload = [
            'current_password' => 'oldpassword123',
            'new_password' => 'newpassword456',
            'new_password_confirmation' => 'newpassword456',
        ];

        $response = $this->postJson('/api/admin/account/password', $payload);

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => 'success',
                     'message' => 'Kata sandi akun admin berhasil diperbarui!',
                 ]);

        $user->refresh();
        $this->assertTrue(Hash::check('newpassword456', $user->password));
    }

    public function test_cannot_change_password_with_wrong_current_password(): void
    {
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@masjid.test',
            'password' => Hash::make('correctpassword'),
        ]);

        $payload = [
            'current_password' => 'wrongpassword',
            'new_password' => 'newpassword456',
            'new_password_confirmation' => 'newpassword456',
        ];

        $response = $this->postJson('/api/admin/account/password', $payload);

        $response->assertStatus(422)
                 ->assertJson([
                     'status' => 'error',
                     'message' => 'Kata sandi saat ini tidak benar.',
                 ]);
    }

    public function test_cannot_change_password_with_unmatched_confirmation(): void
    {
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@masjid.test',
            'password' => Hash::make('correctpassword'),
        ]);

        $payload = [
            'current_password' => 'correctpassword',
            'new_password' => 'newpassword456',
            'new_password_confirmation' => 'mismatchpassword',
        ];

        $response = $this->postJson('/api/admin/account/password', $payload);

        $response->assertStatus(422);
    }
}
