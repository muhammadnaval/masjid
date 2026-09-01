<?php

namespace Database\Seeders;

use App\Models\Agenda;
use App\Models\CountdownSetting;
use App\Models\DonationSetting;
use App\Models\IqamahSetting;
use App\Models\MediaItem;
use App\Models\MosqueProfile;
use App\Models\PrayerLocation;
use App\Models\PrayerSchedule;
use App\Models\PrayerTimeCorrection;
use App\Models\RunningText;
use App\Models\SyuruqSetting;
use App\Models\ThemeSetting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Admin User (Preserve existing account if present)
        User::firstOrCreate(
            ['email' => 'pengurus@masjid.test'],
            [
                'name' => 'Pengurus Utama Masjid',
                'password' => Hash::make('Member23!$'),
            ]
        );

        // 1b. Admin User (Laravel migration admin)
        User::firstOrCreate(
            ['email' => 'admin@masjid.test'],
            [
                'name' => 'Pengurus Masjid',
                'password' => Hash::make('admin123'),
            ]
        );

        // 2. Mosque Profile
        MosqueProfile::updateOrCreate(
            ['id' => 1],
            [
                'name' => 'MASJID AL-HIDAYAH SITEBA',
                'address' => 'Jl. Raya Siteba No. 15, Surau Gadang, Kec. Nanggalo, Kota Padang, Sumatera Barat',
                'contact' => 'Telp/WA: 0812-6789-0123 | Instagram: @masjid_alhidayah_siteba',
                'logo_path' => 'https://images.unsplash.com/photo-1542662565-7e4b66bae529?w=300&auto=format&fit=crop&q=80',
                'background_path' => 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=1920&auto=format&fit=crop&q=80',
                'timezone' => 'Asia/Jakarta',
            ]
        );

        // 3. Prayer Locations
        $locations = [
            ['province_name' => 'Sumatera Barat', 'city_code' => 'padang', 'city_name' => 'Kota Padang', 'is_active' => true],
            ['province_name' => 'DKI Jakarta', 'city_code' => 'jakarta', 'city_name' => 'Kota Jakarta Selatan', 'is_active' => false],
            ['province_name' => 'Jawa Barat', 'city_code' => 'bandung', 'city_name' => 'Kota Bandung', 'is_active' => false],
            ['province_name' => 'Jawa Timur', 'city_code' => 'surabaya', 'city_name' => 'Kota Surabaya', 'is_active' => false],
        ];

        foreach ($locations as $loc) {
            PrayerLocation::updateOrCreate(['city_code' => $loc['city_code']], $loc);
        }

        // 4. Prayer Schedules
        PrayerSchedule::updateOrCreate(
            ['date' => date('Y-m-d')],
            [
                'imsak' => '04:45:00',
                'subuh' => '04:55:00',
                'syuruq' => '06:12:00',
                'dzuhur' => '12:20:00',
                'ashar' => '15:42:00',
                'maghrib' => '18:25:00',
                'isya' => '19:36:00',
                'source' => 'Jadwal Resmi Kementerian Agama RI',
            ]
        );

        // 5. Prayer Time Corrections
        $corrections = [
            'subuh' => 2,
            'syuruq' => 0,
            'dzuhur' => 2,
            'ashar' => 2,
            'maghrib' => 2,
            'isya' => 2,
        ];

        foreach ($corrections as $p => $mins) {
            PrayerTimeCorrection::updateOrCreate(
                ['prayer_name' => $p],
                ['correction_minutes' => $mins]
            );
        }

        // 6. Iqamah Settings
        $iqamahs = [
            'subuh' => 10,
            'dzuhur' => 7,
            'ashar' => 7,
            'maghrib' => 5,
            'isya' => 7,
        ];

        foreach ($iqamahs as $p => $dur) {
            IqamahSetting::updateOrCreate(
                ['prayer_name' => $p],
                ['is_enabled' => true, 'duration_minutes' => $dur]
            );
        }

        // 6a. Countdown Settings
        $prayers = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];
        foreach ($prayers as $prayer) {
            CountdownSetting::updateOrCreate(
                ['prayer_name' => $prayer],
                ['minutes' => 5]
            );
        }

        // 6b. Syuruq Settings
        SyuruqSetting::updateOrCreate(
            ['id' => 1],
            ['is_enabled' => true, 'duration_minutes' => 10]
        );

        // 7. Running Text (Bersihkan dummy & buat 1 teks himbauan bersih)
        RunningText::truncate();
        RunningText::create([
            'text' => 'Selamat datang di Masjid Al-Hidayah Siteba. Luruskan dan rapatkan shaf demi kesempurnaan shalat berjamaah.',
            'speed' => 'normal',
            'category' => 'umum',
            'is_active' => true,
        ]);

        // 8. Donation Settings
        DonationSetting::updateOrCreate(
            ['id' => 1],
            [
                'title' => 'Infaq & Sedekah Operasional Masjid',
                'description' => 'Salurkan infaq dan sedekah terbaik Anda untuk memakmurkan masjid dan kegiatan dakwah.',
                'qr_code_path' => 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://masjid.test/donasi',
                'bank_name' => 'Bank Syariah Indonesia (BSI)',
                'account_name' => 'Masjid Al-Hidayah Siteba',
                'account_number' => '7123-4567-8901',
                'is_active' => true,
            ]
        );

        // 9. Theme Settings
        ThemeSetting::updateOrCreate(
            ['id' => 1],
            [
                'theme_name' => 'Emerald Gold (Klasik Masjid)',
                'primary_color' => 'emerald',
                'secondary_color' => 'amber',
                'background_color' => 'bg-slate-950',
                'text_color' => 'text-emerald-50',
                'is_active' => true,
            ]
        );

        // 10. Agendas (Clear all dummy agendas)
        Agenda::truncate();

        // 11. Media Items (Clear dummy slides & add 1 automatic Doa slide)
        MediaItem::truncate();
        MediaItem::create([
            'title' => 'Doa Harian Otomatis (equran.id API)',
            'type' => 'doa',
            'file_path' => 'https://equran.id/api/doa',
            'duration_seconds' => 15,
            'sort_order' => 1,
            'is_active' => true,
        ]);
    }
}
