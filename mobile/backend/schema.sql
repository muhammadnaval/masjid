-- PostgreSQL Schema for Masjid Display (Insforge Backend)
-- PRD Section 9: Data Structures & Tables

-- 1. Mosque Profiles
CREATE TABLE IF NOT EXISTS mosque_profiles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL DEFAULT 'MASJID AL-HIDAYAH SITEBA',
    address TEXT NOT NULL DEFAULT 'Jl. Siteba No. 12, Surau Gadang, Nanggalo, Kota Padang',
    contact VARCHAR(100) DEFAULT '(0751) 70512',
    logo_path VARCHAR(255) DEFAULT NULL,
    background_path VARCHAR(255) DEFAULT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Jakarta',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Prayer Locations (MyQuran API integration)
CREATE TABLE IF NOT EXISTS prayer_locations (
    id BIGSERIAL PRIMARY KEY,
    province_name VARCHAR(100) NOT NULL DEFAULT 'SUMATERA BARAT',
    city_code VARCHAR(50) NOT NULL DEFAULT '0314', -- MyQuran city code for Kota Padang
    city_name VARCHAR(100) NOT NULL DEFAULT 'KOTA PADANG',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Prayer Schedules (Cache)
CREATE TABLE IF NOT EXISTS prayer_schedules (
    id BIGSERIAL PRIMARY KEY,
    schedule_date DATE NOT NULL,
    imsak TIME DEFAULT '04:46:00',
    subuh TIME NOT NULL DEFAULT '04:56:00',
    syuruq TIME NOT NULL DEFAULT '06:14:00',
    dzuhur TIME NOT NULL DEFAULT '12:24:00',
    ashar TIME NOT NULL DEFAULT '15:47:00',
    maghrib TIME NOT NULL DEFAULT '18:28:00',
    isya TIME NOT NULL DEFAULT '19:40:00',
    source VARCHAR(50) DEFAULT 'MyQuran API',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(schedule_date)
);

-- 4. Prayer Time Corrections (in minutes)
CREATE TABLE IF NOT EXISTS prayer_time_corrections (
    id BIGSERIAL PRIMARY KEY,
    prayer_name VARCHAR(50) NOT NULL UNIQUE,
    correction_minutes INTEGER DEFAULT 0 CHECK (correction_minutes BETWEEN -60 AND 60),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Iqamah Settings
CREATE TABLE IF NOT EXISTS iqamah_settings (
    id BIGSERIAL PRIMARY KEY,
    prayer_name VARCHAR(50) NOT NULL UNIQUE,
    is_enabled BOOLEAN DEFAULT TRUE,
    duration_minutes INTEGER DEFAULT 10 CHECK (duration_minutes BETWEEN 1 AND 60),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Display Settings (singleton)
CREATE TABLE IF NOT EXISTS display_settings (
    id BIGINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    hijri_correction_days INTEGER NOT NULL DEFAULT 0 CHECK (hijri_correction_days BETWEEN -5 AND 5),
    adzan_duration_seconds INTEGER NOT NULL DEFAULT 180 CHECK (adzan_duration_seconds BETWEEN 1 AND 900),
    adzan_display_message TEXT NOT NULL DEFAULT 'Mari Menunaikan Shalat Berjamaah di Masjid',
    syuruq_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    syuruq_duration_minutes INTEGER NOT NULL DEFAULT 15 CHECK (syuruq_duration_minutes BETWEEN 1 AND 60),
    syuruq_display_message TEXT NOT NULL DEFAULT 'Waktu terlarang shalat saat matahari terbit hingga masuk waktu Dhuha',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Friday Settings (singleton)
CREATE TABLE IF NOT EXISTS friday_settings (
    id BIGSERIAL PRIMARY KEY,
    is_enabled BOOLEAN DEFAULT TRUE,
    disable_iqamah_on_friday BOOLEAN DEFAULT TRUE,
    khutbah_duration_minutes INTEGER DEFAULT 35 CHECK (khutbah_duration_minutes BETWEEN 1 AND 180),
    khutbah_title VARCHAR(255) DEFAULT 'SELAMAT MENUNAIKAN SHALAT JUM''AT',
    khutbah_message TEXT DEFAULT '',
    khatib_name VARCHAR(255) DEFAULT '',
    imam_name VARCHAR(255) DEFAULT '',
    theme_title VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS mosque_profiles_singleton ON mosque_profiles ((TRUE));
CREATE UNIQUE INDEX IF NOT EXISTS prayer_locations_one_active ON prayer_locations ((is_active)) WHERE is_active;
CREATE UNIQUE INDEX IF NOT EXISTS friday_settings_singleton ON friday_settings ((TRUE));

-- 6. Media Items (Announcements, Posters, Hadith, Kas Table)
CREATE TABLE IF NOT EXISTS media_items (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'welcome' CHECK (type IN ('welcome', 'announcement', 'hadith', 'kasTable', 'kastable', 'infoTable', 'infotable', 'donation', 'image', 'video', 'youtube'))
    content TEXT DEFAULT NULL,
    file_path VARCHAR(255) DEFAULT NULL,
    duration_seconds INTEGER DEFAULT 8 CHECK (duration_seconds BETWEEN 3 AND 300),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    ends_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Running Texts
CREATE TABLE IF NOT EXISTS running_texts (
    id BIGSERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    speed INTEGER DEFAULT 50 CHECK (speed BETWEEN 10 AND 200),
    is_active BOOLEAN DEFAULT TRUE,
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    ends_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Audio Settings
CREATE TABLE IF NOT EXISTS audio_settings (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL UNIQUE, -- adzan, murottal, dzikir_pagi, dzikir_petang
    prayer_name VARCHAR(50) DEFAULT NULL,
    file_path VARCHAR(255) DEFAULT NULL,
    source_url VARCHAR(255) DEFAULT NULL,
    play_before_minutes INTEGER DEFAULT NULL CHECK (play_before_minutes IS NULL OR play_before_minutes >= 0),
    play_after_minutes INTEGER DEFAULT NULL CHECK (play_after_minutes IS NULL OR play_after_minutes >= 0),
    volume INTEGER DEFAULT 80 CHECK (volume BETWEEN 0 AND 100),
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Donation Settings (QR Donation)
CREATE TABLE IF NOT EXISTS donation_settings (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL DEFAULT 'Infaq & Sedekah Masjid',
    description TEXT DEFAULT 'Salurkan donasi Anda melalui Rekening Bank Nagari',
    qr_code_path VARCHAR(255) DEFAULT NULL,
    account_name VARCHAR(150) DEFAULT 'Bank Nagari 1002.0210.09881-1 a.n Masjid Al-Hidayah',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Theme Settings
CREATE TABLE IF NOT EXISTS theme_settings (
    id BIGSERIAL PRIMARY KEY,
    theme_name VARCHAR(100) DEFAULT 'Modern Emerald Dark',
    primary_color VARCHAR(20) DEFAULT '#10B981',
    secondary_color VARCHAR(20) DEFAULT '#F59E0B',
    background_color VARCHAR(20) DEFAULT '#0F172A',
    text_color VARCHAR(20) DEFAULT '#F1F5F9',
    layout_config JSONB DEFAULT '{}',
    custom_css TEXT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sprint 1–4 updated_at triggers (system.update_updated_at is provided by InsForge).
CREATE TRIGGER mosque_profiles_updated_at BEFORE UPDATE ON mosque_profiles FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER prayer_locations_updated_at BEFORE UPDATE ON prayer_locations FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER prayer_schedules_updated_at BEFORE UPDATE ON prayer_schedules FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER prayer_time_corrections_updated_at BEFORE UPDATE ON prayer_time_corrections FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER iqamah_settings_updated_at BEFORE UPDATE ON iqamah_settings FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER audio_settings_updated_at BEFORE UPDATE ON audio_settings FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER display_settings_updated_at BEFORE UPDATE ON display_settings FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER friday_settings_updated_at BEFORE UPDATE ON friday_settings FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

-- ========================================================
-- SEED DEFAULT DATA
-- ========================================================

INSERT INTO mosque_profiles (name, address, contact)
VALUES ('MASJID AL-HIDAYAH SITEBA', 'Jl. Siteba No. 12, Surau Gadang, Nanggalo, Kota Padang', '(0751) 70512')
ON CONFLICT DO NOTHING;

INSERT INTO prayer_locations (province_name, city_code, city_name, is_active)
VALUES ('SUMATERA BARAT', '0314', 'KOTA PADANG', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO prayer_time_corrections (prayer_name, correction_minutes) VALUES
('subuh', 0), ('syuruq', 0), ('dzuhur', 0), ('ashar', 0), ('maghrib', 0), ('isya', 0)
ON CONFLICT (prayer_name) DO NOTHING;

INSERT INTO iqamah_settings (prayer_name, is_enabled, duration_minutes) VALUES
('subuh', TRUE, 10), ('dzuhur', TRUE, 10), ('ashar', TRUE, 8), ('maghrib', TRUE, 7), ('isya', TRUE, 10)
ON CONFLICT (prayer_name) DO NOTHING;

INSERT INTO display_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO friday_settings (is_enabled, disable_iqamah_on_friday, khutbah_duration_minutes)
VALUES (TRUE, TRUE, 35)
ON CONFLICT DO NOTHING;

INSERT INTO media_items (title, type, content, duration_seconds, sort_order) VALUES
('SELAMAT DATANG DI MASJID AL-HIDAYAH', 'welcome', 'Mari Menjaga Kesucian dan Kekhusyukan di Rumah Allah', 8, 1),
('HADITS HARI INI', 'hadith', '{"arabic":"مَنْ بَنَى مَسْجِدًالِلَّهِ بَنَى اللَّهُ لَهُ مِثْلَهُ فِي الْجَنَّةِ", "translation":"Barangsiapa membangun masjid karena Allah, maka Allah akan bangunkan baginya yang serupa di surga. (HR. Bukhari & Muslim)"}', 10, 2),
('AGENDA KAJIAN RUTIN SUBUH', 'announcement', 'Pemateri: Ustadz Dr. H. Ahmad Fauzi, Lc., MA • Tema: Tazkiyatun Nufs & Fiqih Muamalah', 8, 3),
('LAPORAN KAS MASJID PEKAN INI', 'kasTable', '{"Saldo Awal":"Rp 14.500.000","Infaq Jumat":"Rp 5.230.000","Pengeluaran Operasional":"Rp 2.100.000","Saldo Akhir":"Rp 17.630.000"}', 8, 4)
ON CONFLICT DO NOTHING;

INSERT INTO running_texts (text, is_active) VALUES
('Selamat Datang di Masjid Al-Hidayah Siteba • Mohon menonaktifkan atau mematikan nada dering Handphone selama berada di dalam area masjid demi menjaga kekhusyukan ibadah • Infaq & Donasi dapat disalurkan melalui Rekening Bank Nagari 1002.0210.09881-1 a.n Masjid Al-Hidayah • Kajian Subuh rutin setiap hari Ahad bersama Ustadz Dr. H. Ahmad Fauzi • Jagalah kebersihan & kerapihan shaf shalat bersama', TRUE)
ON CONFLICT DO NOTHING;
