// @ts-ignore Deno resolves npm: specifiers at runtime; local TypeScript may not.
import { createAdminClient } from 'npm:@insforge/sdk';

declare const Deno: {
  env: { get(name: string): string | undefined };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const tables = [
  'mosque_profiles',
  'prayer_locations',
  'prayer_schedules',
  'prayer_time_corrections',
  'iqamah_settings',
  'audio_settings',
  'friday_settings',
  'display_settings',
  'donation_settings',
  'theme_settings',
  'running_texts',
  'media_items',
  'agendas',
] as const;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function timeValue(value: unknown): string | null {
  if (value == null) return null;
  return String(value).slice(0, 5);
}

function correctedTime(value: string | null, minutes: number): string | null {
  if (!value) return value;
  const [hours, mins] = value.split(':').map(Number);
  const total = (hours * 60 + mins + minutes + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== 'GET') return json({ status: 'error', message: 'Method not allowed' }, 405);

  try {
    const baseUrl = Deno.env.get('INSFORGE_BASE_URL');
    const apiKey = Deno.env.get('API_KEY');
    if (!baseUrl || !apiKey) throw new Error('Konfigurasi InsForge function belum lengkap');

    const client = createAdminClient({ baseUrl, apiKey });
    const results = await Promise.all(tables.map((table) => client.database.from(table).select('*')));
    const failed = results.find((result: any) => result.error);
    if (failed?.error) throw failed.error;

    const data = Object.fromEntries(tables.map((table, index) => [table, results[index].data ?? []])) as Record<string, any[]>;
    const mosqueProfile = data.mosque_profiles[0] ?? {};
    const prayerLocation = data.prayer_locations.find((item) => item.is_active) ?? data.prayer_locations[0] ?? {};
    const corrections = Object.fromEntries(data.prayer_time_corrections.map((item) => [item.prayer_name, item.correction_minutes ?? 0]));
    const iqamahSettings = Object.fromEntries(data.iqamah_settings.map((item) => [item.prayer_name, {
      is_enabled: item.is_enabled,
      duration_minutes: item.duration_minutes,
    }]));
    const audioSettings = Object.fromEntries(data.audio_settings.map((item) => [item.type, {
      is_enabled: item.is_enabled,
      volume: item.volume,
      custom_url: item.source_url || item.file_path,
      play_before_minutes: item.play_before_minutes,
      play_after_minutes: item.play_after_minutes,
    }]));
    const display = data.display_settings[0] ?? {};
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
    const scheduleRow = data.prayer_schedules.find((item) => String(item.schedule_date).slice(0, 10) === today);
    const rawSchedule = scheduleRow ? {
      date: today,
      imsak: timeValue(scheduleRow.imsak),
      subuh: timeValue(scheduleRow.subuh),
      syuruq: timeValue(scheduleRow.syuruq),
      dzuhur: timeValue(scheduleRow.dzuhur),
      ashar: timeValue(scheduleRow.ashar),
      maghrib: timeValue(scheduleRow.maghrib),
      isya: timeValue(scheduleRow.isya),
    } : {
      date: today,
      imsak: '04:54', subuh: '05:04', syuruq: '06:19', dzuhur: '12:28',
      ashar: '15:50', maghrib: '18:30', isya: '19:42',
    };
    const todaySchedule = Object.fromEntries(Object.entries(rawSchedule).map(([key, value]) => [
      key,
      key === 'date' ? value : correctedTime(value, corrections[key] ?? 0),
    ]));
    const activeNow = (item: any) => item.is_active !== false &&
      (!item.starts_at || new Date(item.starts_at) <= new Date()) &&
      (!item.ends_at || new Date(item.ends_at) >= new Date());

    return json({
      status: 'success',
      data: {
        mosqueProfile,
        prayerLocation,
        rawSchedule,
        todaySchedule,
        timeCorrections: corrections,
        hijriCorrectionDays: display.hijri_correction_days ?? 0,
        iqamahSettings,
        adzanSettings: {
          durationSeconds: display.adzan_duration_seconds ?? 180,
          displayMessage: display.adzan_display_message ?? 'Mari Menunaikan Shalat Berjamaah di Masjid',
        },
        audioSettings,
        syuruqSettings: {
          is_enabled: display.syuruq_enabled ?? true,
          durationMinutes: display.syuruq_duration_minutes ?? 15,
          displayMessage: display.syuruq_display_message ?? 'Waktu terlarang shalat saat matahari terbit hingga masuk waktu Dhuha',
        },
        donationSettings: data.donation_settings[0] ?? {},
        fridaySettings: data.friday_settings[0] ?? {},
        themeSettings: data.theme_settings.find((item) => item.is_active) ?? data.theme_settings[0] ?? {},
        agendas: data.agendas.filter(activeNow),
        runningTexts: data.running_texts.filter(activeNow),
        mediaItems: data.media_items.filter(activeNow).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).slice(0, 10),
      },
    });
  } catch (error) {
    console.error(error);
    return json({ status: 'error', message: 'Gagal memuat konfigurasi display' }, 500);
  }
}
