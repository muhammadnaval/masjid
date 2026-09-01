<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Agenda;

class AgendaEventsTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_fetch_agendas(): void
    {
        Agenda::create([
            'title' => 'Kajian Ahad Subuh',
            'date' => date('Y-m-d', strtotime('+3 days')),
            'time' => '05:30',
            'location' => 'Masjid Al-Hidayah',
            'description' => 'Tafsir Ibnu Katsir',
            'is_islamic_holiday' => false,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/admin/agenda');

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => 'success',
                 ])
                 ->assertJsonPath('data.0.title', 'Kajian Ahad Subuh');
    }

    public function test_can_create_agenda(): void
    {
        $payload = [
            'title' => 'Tabligh Akbar Nuzulul Qur\'an',
            'date' => date('Y-m-d', strtotime('+10 days')),
            'time' => '20:00',
            'location' => 'Ruang Utama Masjid',
            'description' => 'Penceramah: Habib Umar',
            'is_islamic_holiday' => true,
            'is_active' => true,
        ];

        $response = $this->postJson('/api/admin/agenda', $payload);

        $response->assertStatus(201)
                 ->assertJson([
                     'status' => 'success',
                 ])
                 ->assertJsonPath('data.title', 'Tabligh Akbar Nuzulul Qur\'an');

        $this->assertDatabaseHas('agendas', [
            'title' => 'Tabligh Akbar Nuzulul Qur\'an',
            'is_islamic_holiday' => 1,
        ]);
    }

    public function test_can_update_agenda(): void
    {
        $agenda = Agenda::create([
            'title' => 'Agenda Lama',
            'date' => date('Y-m-d', strtotime('+5 days')),
            'time' => '18:30',
            'location' => 'Ruang Utama',
            'is_active' => true,
        ]);

        $response = $this->postJson("/api/admin/agenda/{$agenda->id}", [
            'title' => 'Agenda Baru Diperbarui',
            'time' => '19:00',
            'is_active' => false,
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('data.title', 'Agenda Baru Diperbarui');

        $this->assertDatabaseHas('agendas', [
            'id' => $agenda->id,
            'title' => 'Agenda Baru Diperbarui',
            'is_active' => 0,
        ]);
    }

    public function test_can_delete_agenda(): void
    {
        $agenda = Agenda::create([
            'title' => 'Agenda Hapus',
            'date' => date('Y-m-d', strtotime('+2 days')),
        ]);

        $response = $this->deleteJson("/api/admin/agenda/{$agenda->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('agendas', ['id' => $agenda->id]);
    }

    public function test_upcoming_islamic_holiday_included_in_display_state(): void
    {
        Agenda::create([
            'title' => '1 Ramadhan 1447 H - Awal Puasa',
            'date' => date('Y-m-d', strtotime('+5 days')),
            'description' => 'Awal bulan suci Ramadhan',
            'is_islamic_holiday' => true,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/display/state');

        $response->assertStatus(200)
                 ->assertJsonPath('upcoming_islamic_holiday.title', '1 Ramadhan 1447 H - Awal Puasa')
                 ->assertJsonPath('upcoming_islamic_holiday.days_left', 5);
    }
}
