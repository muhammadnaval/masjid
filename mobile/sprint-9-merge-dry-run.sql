-- Generated 2026-08-02T16:42:48.245Z
BEGIN;

-- ===== MIGRATION =====
-- [MIGRATION] migration system.20260802161442 (add)
-- Migration 20260802161442: allow-sprint-8-text-content
ALTER TABLE public.media_items
  DROP CONSTRAINT IF EXISTS media_items_type_check,
  ADD CONSTRAINT media_items_type_check CHECK (type IN (
    'welcome', 'announcement', 'hadith', 'text', 'daily_doa', 'doa',
    'kasTable', 'kastable', 'infoTable', 'infotable', 'donation',
    'image', 'video', 'youtube', 'livestream'
  ));
INSERT INTO "system"."custom_migrations" ("version", "name", "statements", "created_at") VALUES ('20260802161442', 'allow-sprint-8-text-content', ARRAY['ALTER TABLE public.media_items
  DROP CONSTRAINT IF EXISTS media_items_type_check,
  ADD CONSTRAINT media_items_type_check CHECK (type IN (
    ''welcome'', ''announcement'', ''hadith'', ''text'', ''daily_doa'', ''doa'',
    ''kasTable'', ''kastable'', ''infoTable'', ''infotable'', ''donation'',
    ''image'', ''video'', ''youtube'', ''livestream''
  ));'], '2026-08-02T16:36:40.559045+00:00')
  ON CONFLICT ("version") DO UPDATE SET "name" = EXCLUDED."name", "statements" = EXCLUDED."statements", "created_at" = EXCLUDED."created_at";

-- ===== DATA =====
-- [DATA] edge_function edge_function.masjid-backend (modify)
INSERT INTO "functions"."definitions" ("id", "code", "name", "slug", "status", "created_at", "updated_at", "deployed_at", "description") VALUES ('a4f9f1e8-aa27-4489-9136-b234c238b26e', '// @ts-ignore Deno resolves npm: specifiers at runtime; local TypeScript may not.
import { createAdminClient, createClient } from ''npm:@insforge/sdk'';

declare const Deno: {
  env: { get(name: string): string | undefined };
};

const corsHeaders = {
  ''Access-Control-Allow-Origin'': ''*'',
  ''Access-Control-Allow-Methods'': ''GET, POST, PUT, DELETE, OPTIONS'',
  ''Access-Control-Allow-Headers'': ''Content-Type, Authorization'',
};
const tables = [''mosque_profiles'', ''prayer_locations'', ''prayer_schedules'', ''prayer_time_corrections'', ''iqamah_settings'', ''audio_settings'', ''friday_settings'', ''display_settings'', ''donation_settings'', ''theme_settings'', ''running_texts'', ''media_items'', ''agendas''] as const;
const prayers = [''subuh'', ''syuruq'', ''dzuhur'', ''ashar'', ''maghrib'', ''isya''] as const;
const masterLocations = [
  { province_name: ''SUMATERA BARAT'', city_code: ''0314'', city_name: ''KOTA PADANG'' },
  { province_name: ''SUMATERA BARAT'', city_code: ''0312'', city_name: ''KOTA BUKITTINGGI'' },
  { province_name: ''SUMATERA BARAT'', city_code: ''0317'', city_name: ''KOTA SOLOK'' },
  { province_name: ''SUMATERA BARAT'', city_code: ''0305'', city_name: ''KAB. PADANG PARIAMAN'' },
  { province_name: ''DKI JAKARTA'', city_code: ''1301'', city_name: ''KOTA JAKARTA SELATAN'' },
  { province_name: ''DKI JAKARTA'', city_code: ''1302'', city_name: ''KOTA JAKARTA TIMUR'' },
  { province_name: ''JAWA BARAT'', city_code: ''1203'', city_name: ''KOTA BANDUNG'' },
  { province_name: ''JAWA BARAT'', city_code: ''1221'', city_name: ''KOTA BEKASI'' },
  { province_name: ''JAWA TIMUR'', city_code: ''1638'', city_name: ''KOTA SURABAYA'' },
];

type AdminClient = ReturnType<typeof createAdminClient>;
type Rows = Record<string, any[]>;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, ''Content-Type'': ''application/json'' } });
}
function ok(data: unknown, message?: string): Response {
  return json({ status: ''success'', ...(message ? { message } : {}), data });
}
function fail(message: string, status = 400): Response {
  return json({ status: ''error'', message }, status);
}
function timeValue(value: unknown): string | null {
  return value == null ? null : String(value).slice(0, 5);
}
function correctedTime(value: string | null, minutes: number): string | null {
  if (!value) return value;
  const [hours, mins] = value.split('':'').map(Number);
  const total = (hours * 60 + mins + minutes + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, ''0'')}:${String(total % 60).padStart(2, ''0'')}`;
}
function int(value: unknown, min: number, max: number, fallback?: number): number {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed)) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Nilai harus berupa angka ${min}–${max}`);
  }
  if (parsed < min || parsed > max) throw new Error(`Nilai harus antara ${min}–${max}`);
  return parsed;
}
function text(value: unknown, name: string, max: number, required = false): string {
  const result = String(value ?? '''').trim();
  if (required && !result) throw new Error(`${name} wajib diisi`);
  if (result.length > max) throw new Error(`${name} maksimal ${max} karakter`);
  return result;
}
function validDate(value: unknown): string | null {
  if (value == null || value === '''') return null;
  const result = String(value);
  if (Number.isNaN(Date.parse(result))) throw new Error(''Tanggal tidak valid'');
  return result;
}
async function readJson(req: Request, maxBytes = 1_000_000): Promise<any> {
  const length = Number(req.headers.get(''content-length'') || 0);
  if (length > maxBytes) throw new Error(''Payload terlalu besar'');
  const raw = await req.text();
  if (new TextEncoder().encode(raw).byteLength > maxBytes) throw new Error(''Payload terlalu besar'');
  try { return raw ? JSON.parse(raw) : {}; } catch { throw new Error(''Payload JSON tidak valid''); }
}
async function rows(client: AdminClient, table: string): Promise<any[]> {
  const { data, error } = await client.database.from(table).select(''*'');
  if (error) throw error;
  return data ?? [];
}
async function allRows(client: AdminClient): Promise<Rows> {
  const results = await Promise.all(tables.map((table) => rows(client, table)));
  return Object.fromEntries(tables.map((table, i) => [table, results[i]]));
}
async function updateById(client: AdminClient, table: string, id: number, payload: Record<string, unknown>): Promise<any> {
  const { data, error } = await client.database.from(table).update(payload).eq(''id'', id).select();
  if (error) throw error;
  if (!data?.[0]) throw new Error(''Data tidak ditemukan'');
  return data[0];
}
async function updateSingleton(client: AdminClient, table: string, payload: Record<string, unknown>): Promise<any> {
  const current = (await rows(client, table))[0];
  if (!current) throw new Error(`Data ${table} belum tersedia`);
  return updateById(client, table, Number(current.id), payload);
}
async function upsertBy(client: AdminClient, table: string, key: string, value: unknown, payload: Record<string, unknown>): Promise<any> {
  const { data: existing, error: selectError } = await client.database.from(table).select(''*'').eq(key, value).limit(1);
  if (selectError) throw selectError;
  if (existing?.[0]) return updateById(client, table, Number(existing[0].id), payload);
  const { data, error } = await client.database.from(table).insert([{ [key]: value, ...payload }]).select();
  if (error) throw error;
  if (!data?.[0]) throw new Error(''Database tidak mengembalikan data baru'');
  return data[0];
}
async function insert(client: AdminClient, table: string, payload: Record<string, unknown>): Promise<any> {
  const { data, error } = await client.database.from(table).insert([payload]).select();
  if (error) throw error;
  if (!data?.[0]) throw new Error(''Database tidak mengembalikan data baru'');
  return data[0];
}
async function remove(client: AdminClient, table: string, id: number): Promise<any> {
  const { data: existing, error: selectError } = await client.database.from(table).select(''*'').eq(''id'', id).limit(1);
  if (selectError) throw selectError;
  if (!existing?.[0]) throw new Error(''Data tidak ditemukan'');
  const { error } = await client.database.from(table).delete().eq(''id'', id);
  if (error) throw error;
  return existing[0];
}
async function requireAdmin(req: Request, baseUrl: string, client: AdminClient): Promise<any> {
  const auth = req.headers.get(''authorization'') || '''';
  if (!auth.startsWith(''Bearer '')) throw new Error(''UNAUTHORIZED'');
  const token = auth.slice(7).trim();
  if (!token) throw new Error(''UNAUTHORIZED'');
  const response = await fetch(`${baseUrl}/api/auth/sessions/current`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(''UNAUTHORIZED'');
  const result = await response.json();
  const user = result.user || result;
  const email = String(user.email || '''').trim().toLowerCase();
  if (!email) throw new Error(''UNAUTHORIZED'');
  const { data, error } = await client.database.from(''admin_users'').select(''email'').eq(''email'', email).limit(1);
  if (error || !data?.[0]) throw new Error(''UNAUTHORIZED'');
  return user;
}
function buildDisplay(data: Rows): Record<string, unknown> {
  const mosqueProfile = data.mosque_profiles[0] ?? {};
  const prayerLocation = data.prayer_locations.find((item) => item.is_active) ?? data.prayer_locations[0] ?? {};
  const corrections = Object.fromEntries(data.prayer_time_corrections.map((item) => [item.prayer_name, item.correction_minutes ?? 0]));
  const iqamahSettings = Object.fromEntries(data.iqamah_settings.map((item) => [item.prayer_name, { is_enabled: item.is_enabled, duration_minutes: item.duration_minutes }]));
  const audioSettings = Object.fromEntries(data.audio_settings.map((item) => [item.type, { is_enabled: item.is_enabled, volume: item.volume, custom_url: item.source_url || item.file_path, play_before_minutes: item.play_before_minutes, play_after_minutes: item.play_after_minutes }]));
  const display = data.display_settings[0] ?? {};
  const today = new Intl.DateTimeFormat(''en-CA'', { timeZone: ''Asia/Jakarta'' }).format(new Date());
  const scheduleRow = data.prayer_schedules.find((item) => String(item.schedule_date).slice(0, 10) === today);
  const rawSchedule: Record<string, any> = scheduleRow ? {
    date: today, imsak: timeValue(scheduleRow.imsak), subuh: timeValue(scheduleRow.subuh), syuruq: timeValue(scheduleRow.syuruq), dzuhur: timeValue(scheduleRow.dzuhur), ashar: timeValue(scheduleRow.ashar), maghrib: timeValue(scheduleRow.maghrib), isya: timeValue(scheduleRow.isya),
  } : { date: today, imsak: ''04:54'', subuh: ''05:04'', syuruq: ''06:19'', dzuhur: ''12:28'', ashar: ''15:50'', maghrib: ''18:30'', isya: ''19:42'' };
  const todaySchedule = Object.fromEntries(Object.entries(rawSchedule).map(([key, value]) => [key, key === ''date'' ? value : correctedTime(value, corrections[key] ?? 0)]));
  const now = new Date();
  const activeNow = (item: any) => item.is_active !== false && (!item.starts_at || new Date(item.starts_at) <= now) && (!item.ends_at || new Date(item.ends_at) >= now);
  return {
    mosqueProfile, prayerLocation, rawSchedule, todaySchedule, timeCorrections: corrections,
    hijriCorrectionDays: display.hijri_correction_days ?? 0, iqamahSettings,
    adzanSettings: { durationSeconds: display.adzan_duration_seconds ?? 180, displayMessage: display.adzan_display_message ?? ''Mari Menunaikan Shalat Berjamaah di Masjid'' },
    audioSettings,
    syuruqSettings: { is_enabled: display.syuruq_enabled ?? true, durationMinutes: display.syuruq_duration_minutes ?? 15, displayMessage: display.syuruq_display_message ?? ''Waktu terlarang shalat saat matahari terbit hingga masuk waktu Dhuha'' },
    donationSettings: data.donation_settings[0] ?? {}, fridaySettings: data.friday_settings[0] ?? {},
    themeSettings: data.theme_settings.find((item) => item.is_active) ?? data.theme_settings[0] ?? {},
    agendas: data.agendas.filter((item) => item.is_active !== false && (!item.ends_at || new Date(item.ends_at) >= now)), runningTexts: data.running_texts.filter(activeNow),
    mediaItems: data.media_items.filter(activeNow).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).slice(0, 10),
  };
}
function yearMonth(): { year: string; month: string } {
  const parts = new Intl.DateTimeFormat(''en-CA'', { timeZone: ''Asia/Jakarta'', year: ''numeric'', month: ''2-digit'' }).formatToParts(new Date());
  return { year: parts.find((p) => p.type === ''year'')!.value, month: parts.find((p) => p.type === ''month'')!.value };
}
function scheduleDto(item: any): Record<string, unknown> {
  return { date: String(item.schedule_date).slice(0, 10), imsak: timeValue(item.imsak), subuh: timeValue(item.subuh), syuruq: timeValue(item.syuruq), dzuhur: timeValue(item.dzuhur), ashar: timeValue(item.ashar), maghrib: timeValue(item.maghrib), isya: timeValue(item.isya) };
}
function myQuranCityCode(location: any): string {
  return masterLocations.find((item) => item.city_name === location?.city_name)?.city_code || String(location?.city_code || ''0314'');
}
async function syncSchedules(client: AdminClient, cityCode: string): Promise<{ location: string; schedules: any[] }> {
  const { year, month } = yearMonth();
  const response = await fetch(`https://api.myquran.com/v2/sholat/jadwal/${encodeURIComponent(cityCode)}/${year}/${month}`);
  if (!response.ok) throw new Error(`MyQuran API HTTP ${response.status}`);
  const result = await response.json();
  const source = result.status === true && result.data?.jadwal ? result.data.jadwal : [];
  const list = Array.isArray(source) ? source : [source];
  if (!list.length) throw new Error(''Respons MyQuran API tidak berisi jadwal'');
  for (const item of list) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date || '''')) throw new Error(''Tanggal jadwal tidak valid'');
    for (const key of [''imsak'', ''subuh'', ''terbit'', ''dzuhur'', ''ashar'', ''maghrib'', ''isya'']) if (!/^\d{2}:\d{2}$/.test(item[key] || '''')) throw new Error(''Waktu jadwal tidak valid'');
    await upsertBy(client, ''prayer_schedules'', ''schedule_date'', item.date, { imsak: item.imsak, subuh: item.subuh, syuruq: item.terbit, dzuhur: item.dzuhur, ashar: item.ashar, maghrib: item.maghrib, isya: item.isya, source: ''MyQuran API'' });
  }
  const schedules = (await rows(client, ''prayer_schedules'')).filter((item) => String(item.schedule_date).startsWith(`${year}-${month}-`)).sort((a, b) => String(a.schedule_date).localeCompare(String(b.schedule_date))).map(scheduleDto);
  return { location: String(result.data?.lokasi || cityCode), schedules };
}

async function adminRoute(req: Request, route: string, client: AdminClient, baseUrl: string, anonKey: string): Promise<Response> {
  const method = req.method;
  if (route === ''/api/v1/admin/login'' && method === ''POST'') {
    const body = await readJson(req);
    const email = text(body.email, ''Email'', 254, true).toLowerCase();
    const password = text(body.password, ''Password'', 200, true);
    const authClient = createClient({ baseUrl, anonKey });
    const { data, error } = await authClient.auth.signInWithPassword({ email, password });
    if (error || !data?.accessToken) return fail(''Email atau password InsForge Auth tidak valid'', 401);
    const authenticatedEmail = String(data.user?.email || '''').trim().toLowerCase();
    const { data: allowed, error: allowError } = await client.database.from(''admin_users'').select(''email'').eq(''email'', authenticatedEmail).limit(1);
    if (allowError) throw allowError;
    if (!allowed?.[0]) return fail(''Email atau password InsForge Auth tidak valid'', 401);
    return ok({ token: data.accessToken, user: { email: authenticatedEmail, role: ''admin'' } }, ''InsForge Auth Login Berhasil'');
  }
  await requireAdmin(req, baseUrl, client);
  const data = await allRows(client);
  const display = buildDisplay(data) as any;
  if (route === ''/api/v1/admin/logout'' && method === ''POST'') return ok({}, ''Logout berhasil'');
  if (route === ''/api/v1/admin/dashboard/summary'' && method === ''GET'') return ok({ displayStatus: ''ONLINE'', activeLocation: display.prayerLocation, lastSync: data.prayer_schedules.at(-1)?.updated_at ?? null, syncStatus: ''TERBARU (MyQuran API)'', activeMediaCount: data.media_items.filter((x) => x.is_active).length, activeRunningTextCount: data.running_texts.filter((x) => x.is_active).length, mosqueProfile: display.mosqueProfile });
  if (route === ''/api/v1/admin/mosque-profile'' && method === ''GET'') return ok(display.mosqueProfile);
  if (route === ''/api/v1/admin/mosque-profile'' && method === ''PUT'') {
    const b = await readJson(req);
    const saved = await updateSingleton(client, ''mosque_profiles'', { name: text(b.name, ''Nama masjid'', 255, true), address: text(b.address, ''Alamat'', 2000), contact: text(b.contact, ''Kontak'', 100), timezone: text(b.timezone || ''Asia/Jakarta'', ''Zona waktu'', 50, true), logo_path: text(b.logo_path, ''URL logo'', 255) || null, background_path: text(b.background_path, ''URL latar'', 255) || null });
    return ok(saved, ''Profil masjid & aset visual berhasil disimpan'');
  }
  if (route === ''/api/v1/admin/locations/provinces'' && method === ''GET'') return ok([...new Set(masterLocations.map((x) => x.province_name))]);
  if (route === ''/api/v1/admin/locations/cities'' && method === ''GET'') {
    const province = new URL(req.url).searchParams.get(''province'');
    return ok(province ? masterLocations.filter((x) => x.province_name === province) : masterLocations);
  }
  if (route === ''/api/v1/admin/locations/active'' && method === ''GET'') return ok(display.prayerLocation);
  if (route === ''/api/v1/admin/locations/active'' && method === ''PUT'') {
    const b = await readJson(req);
    const cityCode = text(b.city_code, ''Kode kota'', 50, true);
    const location = masterLocations.find((x) => x.city_code === cityCode);
    if (!location) throw new Error(''Lokasi tidak didukung'');
    const { error } = await client.database.from(''prayer_locations'').update({ is_active: false }).neq(''city_code'', '''');
    if (error) throw error;
    const saved = await upsertBy(client, ''prayer_locations'', ''city_code'', cityCode, { ...location, is_active: true });
    return ok(saved, ''Lokasi aktif berhasil diperbarui'');
  }
  if (route === ''/api/v1/admin/jadwal'' && method === ''GET'') {
    const { year, month } = yearMonth();
    let schedules = data.prayer_schedules.filter((x) => String(x.schedule_date).startsWith(`${year}-${month}-`)).sort((a, b) => String(a.schedule_date).localeCompare(String(b.schedule_date))).map(scheduleDto);
    if (!schedules.length) schedules = (await syncSchedules(client, myQuranCityCode(display.prayerLocation))).schedules;
    return ok({ lastSync: data.prayer_schedules.at(-1)?.updated_at ?? null, city: display.prayerLocation, schedules });
  }
  if (route === ''/api/v1/admin/jadwal/sync'' && method === ''POST'') {
    const result = await syncSchedules(client, myQuranCityCode(display.prayerLocation));
    const { year, month } = yearMonth();
    return ok({ lastSync: new Date().toISOString(), city: display.prayerLocation, schedules: result.schedules }, `Jadwal sholat MyQuran API untuk ${result.location} (${month}/${year}) berhasil disinkronkan`);
  }
  if (route === ''/api/v1/admin/time-corrections'' && method === ''GET'') return ok(display.timeCorrections);
  if (route === ''/api/v1/admin/time-corrections'' && method === ''PUT'') {
    const b = await readJson(req);
    for (const prayer of prayers) await upsertBy(client, ''prayer_time_corrections'', ''prayer_name'', prayer, { correction_minutes: int(b[prayer], -60, 60, 0) });
    return ok(b, ''Koreksi waktu sholat berhasil diperbarui'');
  }
  if (route === ''/api/v1/admin/hijri-correction'' && method === ''GET'') return ok({ hijriCorrectionDays: display.hijriCorrectionDays });
  if (route === ''/api/v1/admin/hijri-correction'' && method === ''PUT'') {
    const b = await readJson(req); const days = int(b.hijriCorrectionDays, -5, 5);
    await updateSingleton(client, ''display_settings'', { hijri_correction_days: days });
    return ok({ hijriCorrectionDays: days }, ''Koreksi tanggal Hijriyah berhasil diperbarui'');
  }
  if (route === ''/api/v1/admin/iqamah-settings'' && method === ''GET'') return ok(display.iqamahSettings);
  if (route === ''/api/v1/admin/iqamah-settings'' && method === ''PUT'') {
    const b = await readJson(req);
    for (const prayer of [''subuh'', ''dzuhur'', ''ashar'', ''maghrib'', ''isya'']) {
      if (!b[prayer] || typeof b[prayer] !== ''object'') throw new Error(`Pengaturan ${prayer} tidak valid`);
      await upsertBy(client, ''iqamah_settings'', ''prayer_name'', prayer, { duration_minutes: int(b[prayer].duration_minutes, 1, 60), is_enabled: Boolean(b[prayer].is_enabled) });
    }
    return ok(b, ''Pengaturan countdown iqamah berhasil diperbarui'');
  }
  if (route === ''/api/v1/admin/audio-settings'' && method === ''GET'') return ok({ adzanSettings: display.adzanSettings, audioSettings: display.audioSettings });
  if (route === ''/api/v1/admin/audio-settings'' && method === ''PUT'') {
    const b = await readJson(req);
    if (b.adzanSettings) await updateSingleton(client, ''display_settings'', { adzan_duration_seconds: int(b.adzanSettings.durationSeconds, 1, 900), adzan_display_message: text(b.adzanSettings.displayMessage, ''Pesan adzan'', 2000, true) });
    for (const [type, settings] of Object.entries<any>(b.audioSettings || {})) {
      if (![''adzan'', ''murottal'', ''dzikir_pagi'', ''dzikir_petang''].includes(type)) throw new Error(''Tipe audio tidak didukung'');
      await upsertBy(client, ''audio_settings'', ''type'', type, { is_enabled: Boolean(settings.is_enabled), volume: int(settings.volume, 0, 100), source_url: text(settings.custom_url, ''URL audio'', 255) || null, play_before_minutes: settings.play_before_minutes == null ? null : int(settings.play_before_minutes, 0, 1440), play_after_minutes: settings.play_after_minutes == null ? null : int(settings.play_after_minutes, 0, 1440) });
    }
    return ok({}, ''Pengaturan audio adzan dan alarm berhasil diperbarui'');
  }
  const singletonRoutes: Record<string, { table: string; fields: string[]; message: string }> = {
    ''/api/v1/admin/donation-settings'': { table: ''donation_settings'', fields: [''title'', ''description'', ''qr_code_path'', ''account_name'', ''is_active''], message: ''Pengaturan QR Donasi & Rekening Masjid berhasil diperbarui'' },
    ''/api/v1/admin/theme-settings'': { table: ''theme_settings'', fields: [''theme_name'', ''primary_color'', ''secondary_color'', ''background_color'', ''text_color'', ''layout_config'', ''is_active''], message: ''Pengaturan Kustomisasi Tema & Layout berhasil diperbarui'' },
    ''/api/v1/admin/friday-settings'': { table: ''friday_settings'', fields: [''is_enabled'', ''disable_iqamah_on_friday'', ''khutbah_duration_minutes'', ''khutbah_title'', ''khutbah_message'', ''khatib_name'', ''imam_name'', ''theme_title''], message: "Pengaturan Mode Jum''at & Khutbah berhasil diperbarui" },
  };
  if (singletonRoutes[route] && method === ''GET'') return ok(data[singletonRoutes[route].table][0] ?? {});
  if (singletonRoutes[route] && method === ''PUT'') {
    const spec = singletonRoutes[route], b = await readJson(req), payload: Record<string, unknown> = {};
    for (const field of spec.fields) if (field in b) payload[field] = b[field];
    if (route.endsWith(''donation-settings'')) { payload.title = text(payload.title, ''Judul donasi'', 255, true); payload.description = text(payload.description, ''Deskripsi donasi'', 2000); payload.account_name = text(payload.account_name, ''Nama rekening'', 150); payload.qr_code_path = text(payload.qr_code_path, ''URL QR'', 255) || null; payload.is_active = Boolean(payload.is_active); }
    if (route.endsWith(''theme-settings'')) { for (const field of [''primary_color'', ''secondary_color'', ''background_color'', ''text_color'']) if (!/^#[0-9A-Fa-f]{6}$/.test(String(payload[field] || ''''))) throw new Error(''Format warna harus #RRGGBB''); payload.theme_name = text(payload.theme_name, ''Nama tema'', 100, true); }
    if (route.endsWith(''friday-settings'')) { payload.khutbah_duration_minutes = int(payload.khutbah_duration_minutes, 1, 180); for (const field of [''khutbah_title'', ''khatib_name'', ''imam_name'', ''theme_title'']) payload[field] = text(payload[field], field, 255); payload.khutbah_message = text(payload.khutbah_message, ''Pesan khutbah'', 2000); }
    return ok(await updateSingleton(client, spec.table, payload), spec.message);
  }
  const collection = route.includes(''/running-text'') ? { table: ''running_texts'', base: ''/api/v1/admin/running-text'', label: ''Running text'' } : route.includes(''/agendas'') ? { table: ''agendas'', base: ''/api/v1/admin/agendas'', label: ''Agenda'' } : route.includes(''/media-items'') ? { table: ''media_items'', base: ''/api/v1/admin/media-items'', label: ''Media'' } : null;
  if (collection && route === collection.base && method === ''GET'') return ok(data[collection.table].sort((a, b) => Number(a.sort_order ?? a.id) - Number(b.sort_order ?? b.id)).slice(0, collection.table === ''media_items'' ? 10 : undefined).map((x) => collection.table === ''media_items'' ? { ...x, url: x.file_path } : x));
  if (collection && route === collection.base && method === ''POST'') {
    const b = await readJson(req); let payload: Record<string, unknown>;
    if (collection.table === ''running_texts'') payload = { text: text(b.text, ''Isi running text'', 4000, true), speed: int(b.speed, 10, 200, 50), is_active: b.is_active !== false, starts_at: validDate(b.starts_at), ends_at: validDate(b.ends_at) };
    else if (collection.table === ''agendas'') payload = { title: text(b.title, ''Judul agenda'', 255, true), description: text(b.description, ''Deskripsi agenda'', 4000), starts_at: validDate(b.starts_at), ends_at: validDate(b.ends_at), is_active: b.is_active !== false };
    else {
      const type = text(b.type || ''announcement'', ''Tipe media'', 50, true), allowed = [''welcome'', ''announcement'', ''hadith'', ''text'', ''daily_doa'', ''doa'', ''kasTable'', ''kastable'', ''infoTable'', ''infotable'', ''donation'', ''image'', ''video'', ''youtube'', ''livestream''];
      if (!allowed.includes(type)) throw new Error(''Tipe media tidak didukung'');
      const url = text(b.url, ''URL media'', 255) || null; if ([''image'', ''video'', ''youtube'', ''livestream''].includes(type) && !url) throw new Error(''URL media wajib diisi'');
      let content = text(b.content, ''Konten media'', 10000); if ((b.subtitle || b.arabic_text) && !content.startsWith(''{'')) content = JSON.stringify({ subtitle: text(b.subtitle, ''Subjudul'', 255), arabic_text: text(b.arabic_text, ''Teks Arab'', 4000), content });
      if ([''kasTable'', ''kastable'', ''infoTable'', ''infotable''].includes(type)) {
        let table: any; try { table = JSON.parse(content); } catch { throw new Error(''Struktur tabel tidak valid''); }
        if (!Array.isArray(table.headers) || !table.headers.length || !Array.isArray(table.rows) || table.rows.some((row: unknown) => !Array.isArray(row) || row.length !== table.headers.length)) throw new Error(''Struktur tabel tidak valid'');
      }
      const startsAt = validDate(b.starts_at), endsAt = validDate(b.ends_at); if (startsAt && endsAt && new Date(startsAt) > new Date(endsAt)) throw new Error(''Jadwal selesai harus setelah jadwal mulai'');
      payload = { title: text(b.title, ''Judul media'', 255, true), type, content, file_path: url, duration_seconds: int(b.duration_seconds, 3, 300, 10), sort_order: int(b.sort_order, -10000, 10000, data.media_items.length + 1), is_active: b.is_active !== false, starts_at: startsAt, ends_at: endsAt };
    }
    return ok(await insert(client, collection.table, payload), `${collection.label} berhasil ditambahkan dan tersimpan di InsForge Backend`);
  }
  if (collection && route === `${collection.base}/toggle` && method === ''PUT'') {
    const b = await readJson(req), id = int(b.id, 1, Number.MAX_SAFE_INTEGER);
    return ok(await updateById(client, collection.table, id, { is_active: Boolean(b.is_active) }), `Status ${collection.label.toLowerCase()} berhasil diperbarui`);
  }
  if (collection && route === collection.base && method === ''DELETE'') {
    const b = await readJson(req), id = int(b.id, 1, Number.MAX_SAFE_INTEGER);
    return ok(await remove(client, collection.table, id), `${collection.label} berhasil dihapus`);
  }
  if (route === ''/api/v1/admin/upload'' && method === ''POST'') {
    const b = await readJson(req, 15_000_000), match = /^data:([^;]+);base64,([A-Za-z0-9+/=]+)$/.exec(String(b.fileData || ''''));
    if (!match) throw new Error(''Data file tidak valid'');
    const allowed = [''image/jpeg'', ''image/png'', ''image/webp'', ''image/svg+xml'', ''video/mp4'', ''video/webm'', ''audio/mpeg'', ''audio/mp4'', ''audio/ogg'', ''audio/wav'']; if (!allowed.includes(match[1])) return fail(''Tipe file tidak didukung'', 415);
    const binary = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0)); if (binary.byteLength > 10 * 1024 * 1024) return fail(''Ukuran file maksimal 10 MiB'', 413);
    const filename = text(b.filename, ''Nama file'', 180, true).replace(/[^a-zA-Z0-9_.-]/g, ''_'');
    const blob = new Blob([binary], { type: match[1] });
    const { data: uploaded, error } = await client.storage.from(''masjid-assets'').upload(`${Date.now()}_${crypto.randomUUID()}_${filename}`, blob);
    if (error) throw error;
    return ok({ url: uploaded.url, key: uploaded.key }, ''File berhasil diunggah ke InsForge Storage bucket masjid-assets'');
  }
  return fail(''API route not found'', 404);
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === ''OPTIONS'') return new Response(null, { status: 204, headers: corsHeaders });
  try {
    const baseUrl = Deno.env.get(''INSFORGE_BASE_URL'');
    const apiKey = Deno.env.get(''API_KEY'');
    const anonKey = Deno.env.get(''ANON_KEY'');
    if (!baseUrl || !apiKey || !anonKey) throw new Error(''Konfigurasi InsForge function belum lengkap'');
    const client = createAdminClient({ baseUrl, apiKey });
    const route = new URL(req.url).searchParams.get(''route'') || ''/api/v1/display/state'';
    if (route.startsWith(''/api/v1/admin/'')) return await adminRoute(req, route, client, baseUrl, anonKey);
    if ((route === ''/api/v1/display'' || route === ''/api/v1/display/state'' || route === ''/'') && req.method === ''GET'') return ok(buildDisplay(await allRows(client)));
    if (route === ''/api/v1/hadith/random'' && req.method === ''GET'') {
      const list = (await rows(client, ''media_items'')).filter((x) => x.type === ''hadith'');
      const item = list[Math.floor(Math.random() * list.length)];
      if (!item) return fail(''Hadits belum tersedia'', 404);
      let parsed: any = {}; try { parsed = JSON.parse(item.content || ''{}''); } catch { parsed = { content: item.content }; }
      return ok({ ...item, arabic_text: parsed.arabic || parsed.arabic_text || '''', translation_text: parsed.translation || parsed.content || item.content, subtitle: parsed.subtitle || '''' });
    }
    if (![''GET'', ''POST'', ''PUT'', ''DELETE''].includes(req.method)) return fail(''Method not allowed'', 405);
    return fail(''API route not found'', 404);
  } catch (error) {
    if (error instanceof Error && error.message === ''UNAUTHORIZED'') return fail(''Token admin tidak valid atau kedaluwarsa'', 401);
    console.error(error);
    const message = error instanceof Error && /wajib|maksimal|harus|tidak valid|tidak didukung|antara|tersedia|ditemukan|terlalu besar/.test(error.message) ? error.message : ''Layanan backend gagal memproses permintaan'';
    return fail(message, message === ''Payload terlalu besar'' ? 413 : 503);
  }
}
', 'masjid-backend', 'masjid-backend', 'active', '2026-08-01T16:57:06.956368+00:00', '2026-08-02T16:38:40.856964+00:00', '2026-08-01T16:57:06.959818+00:00', '')
  ON CONFLICT ("slug") DO UPDATE SET "id" = EXCLUDED."id", "code" = EXCLUDED."code", "name" = EXCLUDED."name", "status" = EXCLUDED."status", "created_at" = EXCLUDED."created_at", "updated_at" = EXCLUDED."updated_at", "deployed_at" = EXCLUDED."deployed_at", "description" = EXCLUDED."description";

COMMIT;