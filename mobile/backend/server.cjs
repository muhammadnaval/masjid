const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const INSFORGE_BASE_URL = process.env.INSFORGE_URL || 'https://2a5hq4xh.ap-southeast.insforge.app';
const INSFORGE_ANON_KEY = process.env.INSFORGE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJpbnNmb3JnZSIsInN1YiI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDB9';
const INSFORGE_API_KEY = process.env.INSFORGE_API_KEY || 'ik_live_5893a7c6f01e23b490a18f2d';
const ADMIN_EMAILS = new Set(
  (process.env.INSFORGE_ADMIN_EMAILS || 'admin@masjid.test')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)
);
const PORT = process.env.PORT || 8095;
const ALLOWED_MEDIA_TYPES = new Set(['welcome', 'announcement', 'hadith', 'text', 'kasTable', 'kastable', 'infoTable', 'infotable', 'donation', 'image', 'video', 'youtube', 'livestream']);

let insforgeClient = null;
let createInsforgeClient = null;
(async () => {
  try {
    if (!INSFORGE_BASE_URL || !INSFORGE_ANON_KEY || !INSFORGE_API_KEY || ADMIN_EMAILS.size === 0) {
      throw new Error('INSFORGE_URL, INSFORGE_ANON_KEY, INSFORGE_API_KEY, dan INSFORGE_ADMIN_EMAILS wajib diatur');
    }
    const sdk = await import('@insforge/sdk');
    createInsforgeClient = sdk.createClient;
    insforgeClient = sdk.createAdminClient({
      baseUrl: INSFORGE_BASE_URL,
      apiKey: INSFORGE_API_KEY
    });
    console.log('InsForge SDK initialized successfully');
    await initializePrayerSchedules();
  } catch (e) {
    console.error('Failed to initialize InsForge SDK:', e.message || e);
  }
})();

// In-memory data store with fallback defaults (synced with schema.sql)
let stateStore = {
  mosqueProfile: {
    name: 'MASJID AL-HIDAYAH SITEBA',
    address: 'Jl. Siteba No. 12, Surau Gadang, Nanggalo, Kota Padang',
    contact: '(0751) 70512',
    logo_path: null,
    background_path: null,
    timezone: 'Asia/Jakarta'
  },
  prayerLocation: {
    province_name: 'SUMATERA BARAT',
    city_code: '0314',
    city_name: 'KOTA PADANG'
  },
  monthlySchedules: [],
  lastSyncTime: null,
  hijriCorrectionDays: 0,
  timeCorrections: {
    subuh: 0,
    syuruq: 0,
    dzuhur: 0,
    ashar: 0,
    maghrib: 0,
    isya: 0
  },
  iqamahSettings: {
    subuh: { is_enabled: true, duration_minutes: 10 },
    dzuhur: { is_enabled: true, duration_minutes: 10 },
    ashar: { is_enabled: true, duration_minutes: 8 },
    maghrib: { is_enabled: true, duration_minutes: 7 },
    isya: { is_enabled: true, duration_minutes: 10 }
  },
  adzanSettings: {
    durationSeconds: 180,
    displayMessage: "Mari Menunaikan Shalat Berjama'ah di Masjid"
  },
  audioSettings: {
    adzan: { is_enabled: true, volume: 80, custom_url: null },
    murottal: { is_enabled: true, play_before_minutes: 10, volume: 70, custom_url: null },
    dzikir_pagi: { is_enabled: true, volume: 75, custom_url: null },
    dzikir_petang: { is_enabled: true, volume: 75, custom_url: null }
  },
  syuruqSettings: {
    is_enabled: true,
    durationMinutes: 15,
    displayMessage: "Waktu terlarang shalat saat matahari terbit hingga masuk waktu Dhuha"
  },
  donationSettings: {
    id: 1,
    title: 'INFAQ & DONASI MASJID',
    description: 'Salurkan Infaq & Sedekah Terbaik Anda melalui QRIS / Transfer Bank Nagari',
    account_name: 'Bank Nagari 1002.0210.09881-1 a.n Masjid Al-Hidayah',
    qr_code_path: '/storage/masjid-assets/qr_donasi.png',
    is_active: true
  },
  agendas: [],
  fridaySettings: {
    id: 1,
    is_enabled: true,
    disable_iqamah_on_friday: true,
    khutbah_duration_minutes: 35,
    khutbah_title: 'SELAMAT MENUNAIKAN SHALAT JUM\'AT',
    khutbah_message: 'Harap mendengarkan Khutbah Jum\'at dengan khusyuk dan tidak berbicara demi kesempurnaan pahala Jum\'at.',
    khatib_name: 'Ust. Dr. H. Ahmad Fauzi, Lc., MA',
    imam_name: 'Ust. M. Ridwan, Lc',
    theme_title: 'Keutamaan Menjaga Ukhuwah Islamiyah'
  },
  themeSettings: {
    id: 1,
    theme_name: 'Modern Emerald Dark',
    primary_color: '#10B981',
    secondary_color: '#F59E0B',
    background_color: '#0F172A',
    text_color: '#FFFFFF',
    layout_config: { mode: 'default' }
  },
  runningTexts: [
    {
      id: 1,
      text: 'Selamat Datang di Masjid Al-Hidayah Siteba • Mohon menonaktifkan atau mematikan nada dering Handphone selama berada di dalam area masjid demi menjaga kekhusyukan ibadah • Infaq & Donasi dapat disalurkan melalui Rekening Bank Nagari 1002.0210.09881-1 a.n Masjid Al-Hidayah • Kajian Subuh rutin setiap hari Ahad bersama Ustadz Dr. H. Ahmad Fauzi • Jagalah kebersihan & kerapihan shaf shalat bersama',
      is_active: true
    }
  ],
  mediaItems: [
    {
      id: 1,
      title: 'SELAMAT DATANG DI MASJID AL-HIDAYAH',
      type: 'welcome',
      subtitle: 'Mari Menjaga Kesucian dan Kekhusyukan di Rumah Allah',
      durationSeconds: 8,
      sort_order: 1,
      is_active: true
    },
    {
      id: 3,
      title: 'AGENDA KAJIAN RUTIN SUBUH',
      type: 'announcement',
      subtitle: 'Setiap Hari Ahad Pekan Pertama & Ketiga',
      translationText: 'Pemateri: Ustadz Dr. H. Ahmad Fauzi, Lc., MA • Tema: Tazkiyatun Nufs & Fiqih Muamalah',
      durationSeconds: 8,
      sort_order: 3,
      is_active: true
    },
    {
      id: 4,
      title: 'LAPORAN KAS MASJID PEKAN INI',
      type: 'kasTable',
      tableData: {
        'Saldo Awal': 'Rp 14.500.000',
        'Infaq Jumat': 'Rp 5.230.000',
        'Pengeluaran Operasional': 'Rp 2.100.000',
        'Saldo Akhir': 'Rp 17.630.000'
      },
      durationSeconds: 8,
      sort_order: 4,
      is_active: true
    }
  ]
};

const STATE_STORE_FILE = path.join(__dirname, 'state_store.json');

function loadStateStore() {
  try {
    if (fs.existsSync(STATE_STORE_FILE)) {
      const data = fs.readFileSync(STATE_STORE_FILE, 'utf8');
      const loaded = JSON.parse(data);
      if (loaded && typeof loaded === 'object') {
        stateStore = {
          ...stateStore,
          ...loaded,
          mosqueProfile: { ...stateStore.mosqueProfile, ...(loaded.mosqueProfile || {}) },
          prayerLocation: { ...stateStore.prayerLocation, ...(loaded.prayerLocation || {}) },
          timeCorrections: { ...stateStore.timeCorrections, ...(loaded.timeCorrections || {}) },
          iqamahSettings: { ...stateStore.iqamahSettings, ...(loaded.iqamahSettings || {}) },
          adzanSettings: { ...stateStore.adzanSettings, ...(loaded.adzanSettings || {}) },
          audioSettings: { ...stateStore.audioSettings, ...(loaded.audioSettings || {}) },
          syuruqSettings: { ...stateStore.syuruqSettings, ...(loaded.syuruqSettings || {}) },
          donationSettings: { ...stateStore.donationSettings, ...(loaded.donationSettings || {}) },
          fridaySettings: { ...stateStore.fridaySettings, ...(loaded.fridaySettings || {}) },
          themeSettings: { ...stateStore.themeSettings, ...(loaded.themeSettings || {}) },
          runningTexts: Array.isArray(loaded.runningTexts) ? loaded.runningTexts : stateStore.runningTexts,
          mediaItems: Array.isArray(loaded.mediaItems)
            ? loaded.mediaItems.filter(item => ALLOWED_MEDIA_TYPES.has(item.type))
            : stateStore.mediaItems,
          agendas: Array.isArray(loaded.agendas) ? loaded.agendas : stateStore.agendas
        };
        console.log('✓ Successfully loaded persisted configurations');
      }
    }
  } catch (e) {
    console.error('Error reading state_store.json:', e.message || e);
  }
}

function saveStateStore() {
  try {
    fs.writeFileSync(STATE_STORE_FILE, JSON.stringify(stateStore, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing state_store.json:', e.message || e);
  }
}

loadStateStore();

function timeValue(value) {
  return value == null ? null : String(value).slice(0, 5);
}

async function saveRowByKey(table, key, value, payload) {
  if (!insforgeClient) throw new Error('InsForge admin client belum siap');
  const { data, error } = await insforgeClient.database.from(table).select('id').eq(key, value).limit(1);
  if (error) throw error;
  const query = data?.length
    ? insforgeClient.database.from(table).update(payload).eq('id', data[0].id)
    : insforgeClient.database.from(table).insert([{ [key]: value, ...payload }]);
  const { error: writeError } = await query;
  if (writeError) throw writeError;
}

async function saveSingleton(table, payload) {
  if (!insforgeClient) throw new Error('InsForge admin client belum siap');
  const { data, error } = await insforgeClient.database.from(table).select('id').limit(1);
  if (error) throw error;
  const query = data?.length
    ? insforgeClient.database.from(table).update(payload).eq('id', data[0].id)
    : insforgeClient.database.from(table).insert([payload]);
  const { error: writeError } = await query;
  if (writeError) throw writeError;
}

let lastPrimaryStateLoad = 0;

async function loadPrimaryStateFromDatabase({ force = false } = {}) {
  if (!force && Date.now() - lastPrimaryStateLoad < 5000) return true;
  if (!insforgeClient) return false;
  const tables = [
    'mosque_profiles', 'prayer_locations', 'prayer_schedules',
    'prayer_time_corrections', 'iqamah_settings', 'audio_settings',
    'friday_settings', 'display_settings', 'donation_settings', 'theme_settings',
    'running_texts', 'media_items', 'agendas'
  ];
  const results = await Promise.all(tables.map(table => insforgeClient.database.from(table).select('*')));
  if (results.some(result => result.error)) {
    throw results.find(result => result.error).error;
  }
  const data = Object.fromEntries(tables.map((table, index) => [table, results[index].data || []]));

  if (data.mosque_profiles[0]) stateStore.mosqueProfile = data.mosque_profiles[0];
  const activeLocation = data.prayer_locations.find(item => item.is_active) || data.prayer_locations[0];
  if (activeLocation) stateStore.prayerLocation = activeLocation;
  stateStore.monthlySchedules = data.prayer_schedules.map(item => ({
    date: String(item.schedule_date).slice(0, 10),
    imsak: timeValue(item.imsak), subuh: timeValue(item.subuh), syuruq: timeValue(item.syuruq),
    dzuhur: timeValue(item.dzuhur), ashar: timeValue(item.ashar),
    maghrib: timeValue(item.maghrib), isya: timeValue(item.isya)
  }));
  stateStore.lastSyncTime = data.prayer_schedules.reduce(
    (latest, item) => !latest || item.updated_at > latest ? item.updated_at : latest,
    null
  );
  for (const item of data.prayer_time_corrections) {
    stateStore.timeCorrections[item.prayer_name] = item.correction_minutes;
  }
  for (const item of data.iqamah_settings) {
    stateStore.iqamahSettings[item.prayer_name] = {
      is_enabled: item.is_enabled,
      duration_minutes: item.duration_minutes
    };
  }
  for (const item of data.audio_settings) {
    stateStore.audioSettings[item.type] = {
      is_enabled: item.is_enabled,
      volume: item.volume,
      custom_url: item.source_url || item.file_path,
      play_before_minutes: item.play_before_minutes,
      play_after_minutes: item.play_after_minutes
    };
  }
  if (data.friday_settings[0]) stateStore.fridaySettings = data.friday_settings[0];
  if (data.display_settings[0]) {
    const settings = data.display_settings[0];
    stateStore.hijriCorrectionDays = settings.hijri_correction_days;
    stateStore.adzanSettings = {
      durationSeconds: settings.adzan_duration_seconds,
      displayMessage: settings.adzan_display_message
    };
    stateStore.syuruqSettings = {
      is_enabled: settings.syuruq_enabled,
      durationMinutes: settings.syuruq_duration_minutes,
      displayMessage: settings.syuruq_display_message
    };
  }
  if (data.donation_settings[0]) stateStore.donationSettings = data.donation_settings[0];
  const activeTheme = data.theme_settings.find(item => item.is_active) || data.theme_settings[0];
  if (activeTheme) stateStore.themeSettings = activeTheme;
  stateStore.runningTexts = data.running_texts;
  stateStore.mediaItems = data.media_items.filter(item => ALLOWED_MEDIA_TYPES.has(item.type));
  stateStore.agendas = data.agendas;
  lastPrimaryStateLoad = Date.now();
  return true;
}

function jakartaYearMonth() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit'
  }).formatToParts(new Date());
  return {
    year: parts.find(part => part.type === 'year').value,
    month: parts.find(part => part.type === 'month').value
  };
}

async function syncPrayerSchedules(cityCode, year, month) {
  const response = await fetch(`https://api.myquran.com/v2/sholat/jadwal/${cityCode}/${year}/${month}`, {
    headers: { 'User-Agent': 'Masjid Display/1.0' }
  });
  if (!response.ok) throw new Error(`MyQuran API HTTP ${response.status}`);
  const json = await response.json();
  const rawRows = json.status === true && json.data?.jadwal
    ? (Array.isArray(json.data.jadwal) ? json.data.jadwal : [json.data.jadwal])
    : [];
  if (rawRows.length === 0) throw new Error('Respons MyQuran API tidak berisi jadwal');

  for (const item of rawRows) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date || '')) throw new Error('Tanggal jadwal MyQuran API tidak valid');
    await saveRowByKey('prayer_schedules', 'schedule_date', item.date, {
      imsak: item.imsak, subuh: item.subuh, syuruq: item.terbit,
      dzuhur: item.dzuhur, ashar: item.ashar, maghrib: item.maghrib, isya: item.isya,
      source: 'MyQuran API'
    });
  }
  await loadPrimaryStateFromDatabase({ force: true });
  return { location: json.data.lokasi, schedules: stateStore.monthlySchedules };
}

async function initializePrayerSchedules() {
  try {
    await loadPrimaryStateFromDatabase({ force: true });
    const { year, month } = jakartaYearMonth();
    const prefix = `${year}-${month}-`;
    if (!stateStore.monthlySchedules.some(item => item.date.startsWith(prefix))) {
      await syncPrayerSchedules(stateStore.prayerLocation.city_code || '0314', year, month);
    }
  } catch (error) {
    console.error('Failed to initialize prayer schedules:', error.message || error);
  }
}



// Helper: send JSON response
function sendJSON(res, data, statusCode = 200) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// Helper: Adjust time string HH:mm by offset minutes
function adjustTimeString(timeStr, offsetMinutes) {
  if (!timeStr) return timeStr;
  const offset = parseInt(offsetMinutes, 10) || 0;
  if (offset === 0) return timeStr;
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let h = parseInt(parts[0], 10);
  let m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return timeStr;
  let totalMin = h * 60 + m + offset;
  totalMin = (totalMin + 1440) % 1440;
  const newH = Math.floor(totalMin / 60).toString().padStart(2, '0');
  const newM = (totalMin % 60).toString().padStart(2, '0');
  return `${newH}:${newM}`;
}

// Helper: Apply time corrections to schedule item
function getCorrectedSchedule(sched, corrections) {
  if (!sched) return sched;
  const c = corrections || {};
  return {
    ...sched,
    subuh: adjustTimeString(sched.subuh, c.subuh || 0),
    syuruq: adjustTimeString(sched.syuruq, c.syuruq || 0),
    dzuhur: adjustTimeString(sched.dzuhur, c.dzuhur || 0),
    ashar: adjustTimeString(sched.ashar, c.ashar || 0),
    maghrib: adjustTimeString(sched.maghrib, c.maghrib || 0),
    isya: adjustTimeString(sched.isya, c.isya || 0)
  };
}

async function authenticateAdmin(req) {
  const authorization = req.headers.authorization || '';
  if (!authorization.startsWith('Bearer ')) return null;
  const accessToken = authorization.slice(7).trim();
  if (!accessToken || !INSFORGE_BASE_URL) return null;

  try {
    const response = await fetch(`${INSFORGE_BASE_URL}/api/auth/sessions/current`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!response.ok) return null;
    const data = await response.json();
    const user = data.user || data;
    const email = String(user.email || '').toLowerCase();
    return ADMIN_EMAILS.has(email) ? user : null;
  } catch (error) {
    console.error('Admin token verification failed:', error.message || error);
    return null;
  }
}

// HTTP Server Routing
const server = http.createServer(async (req, res) => {
  const originalEnd = res.end;
  res.end = function (...args) {
    if (req.method && req.method !== 'GET' && req.method !== 'OPTIONS' && res.statusCode >= 200 && res.statusCode < 300) {
      saveStateStore();
    }
    return originalEnd.apply(this, args);
  };

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  if (pathname.startsWith('/api/v1/admin/') && pathname !== '/api/v1/admin/login') {
    const adminUser = await authenticateAdmin(req);
    if (!adminUser) {
      return sendJSON(res, { status: 'error', message: 'Token admin tidak valid atau kedaluwarsa' }, 401);
    }
    req.adminUser = adminUser;
    try {
      await loadPrimaryStateFromDatabase();
    } catch (error) {
      return sendJSON(res, { status: 'error', message: 'PostgreSQL tidak tersedia' }, 503);
    }
  }



  // API 1: Public Display State (PRD 29.4 & 29.5)
  if ((pathname === '/api/v1/display/state' || pathname === '/api/v1/display') && method === 'GET') {
    try {
      await loadPrimaryStateFromDatabase();
    } catch (error) {
      console.error('PostgreSQL state load failed, using local fallback:', error.message || error);
    }
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
    const todaySched = (stateStore.monthlySchedules || []).find(s => s.date === todayStr) || {
      date: todayStr,
      imsak: '04:54',
      subuh: '05:04',
      syuruq: '06:19',
      dzuhur: '12:28',
      ashar: '15:50',
      maghrib: '18:30',
      isya: '19:42'
    };
    const correctedSched = getCorrectedSchedule(todaySched, stateStore.timeCorrections);

    let activeMediaItems = stateStore.mediaItems.filter(m => m.is_active && ALLOWED_MEDIA_TYPES.has(m.type));

    // Cap active multimedia slides to maximum 10 items
    if (activeMediaItems.length > 10) {
      activeMediaItems = activeMediaItems.slice(0, 10);
    }

    return sendJSON(res, {
      status: 'success',
      data: {
        mosqueProfile: stateStore.mosqueProfile,
        prayerLocation: stateStore.prayerLocation,
        rawSchedule: todaySched,
        todaySchedule: correctedSched,
        timeCorrections: stateStore.timeCorrections,
        hijriCorrectionDays: stateStore.hijriCorrectionDays,
        iqamahSettings: stateStore.iqamahSettings,
        adzanSettings: stateStore.adzanSettings,
        audioSettings: stateStore.audioSettings,
        syuruqSettings: stateStore.syuruqSettings,
        donationSettings: stateStore.donationSettings,
        fridaySettings: stateStore.fridaySettings,
        themeSettings: stateStore.themeSettings,
        agendas: stateStore.agendas.filter(a => a.is_active),
        runningTexts: stateStore.runningTexts.filter(t => t.is_active),
        mediaItems: activeMediaItems
      }
    });
  }

  // API 29.4.1: GET & PUT Time Corrections
  if (pathname === '/api/v1/admin/time-corrections' && method === 'GET') {
    return sendJSON(res, { status: 'success', data: stateStore.timeCorrections });
  }

  if (pathname === '/api/v1/admin/time-corrections' && method === 'PUT') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      let payload;
      try {
        payload = JSON.parse(body || '{}');
      } catch (_) {
        return sendJSON(res, { status: 'error', message: 'Payload JSON tidak valid' }, 400);
      }
      try {
        const parseOffset = value => {
          const number = parseInt(value, 10);
          return isNaN(number) ? 0 : Math.max(-60, Math.min(60, number));
        };
        const corrections = {
          subuh: parseOffset(payload.subuh), syuruq: parseOffset(payload.syuruq),
          dzuhur: parseOffset(payload.dzuhur), ashar: parseOffset(payload.ashar),
          maghrib: parseOffset(payload.maghrib), isya: parseOffset(payload.isya)
        };
        await Promise.all(Object.entries(corrections).map(([prayer, correction]) =>
          saveRowByKey('prayer_time_corrections', 'prayer_name', prayer, { correction_minutes: correction })
        ));
        await loadPrimaryStateFromDatabase({ force: true });
        return sendJSON(res, { status: 'success', message: 'Koreksi waktu sholat berhasil diperbarui', data: stateStore.timeCorrections });
      } catch (error) {
        console.error('Failed to save time corrections:', error.message || error);
        return sendJSON(res, { status: 'error', message: 'Database tidak dapat menyimpan koreksi waktu' }, 503);
      }
    });
    return;
  }

  // API 29.10.2: GET & PUT Hijri Date Correction
  if (pathname === '/api/v1/admin/hijri-correction' && method === 'GET') {
    return sendJSON(res, { status: 'success', data: { hijriCorrectionDays: stateStore.hijriCorrectionDays } });
  }

  if (pathname === '/api/v1/admin/hijri-correction' && method === 'PUT') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      let payload;
      try {
        payload = JSON.parse(body || '{}');
      } catch (_) {
        return sendJSON(res, { status: 'error', message: 'Payload JSON tidak valid' }, 400);
      }
      try {
        const parsed = parseInt(payload.hijriCorrectionDays, 10);
        const offset = isNaN(parsed) ? 0 : Math.max(-5, Math.min(5, parsed));
        await saveSingleton('display_settings', { hijri_correction_days: offset });
        await loadPrimaryStateFromDatabase({ force: true });
        return sendJSON(res, { status: 'success', message: 'Koreksi tanggal Hijriyah berhasil diperbarui', data: { hijriCorrectionDays: stateStore.hijriCorrectionDays } });
      } catch (error) {
        console.error('Failed to save Hijri correction:', error.message || error);
        return sendJSON(res, { status: 'error', message: 'Database tidak dapat menyimpan koreksi Hijriyah' }, 503);
      }
    });
    return;
  }

  // API 29.8.1: GET & PUT Iqamah Settings
  if (pathname === '/api/v1/admin/iqamah-settings' && method === 'GET') {
    return sendJSON(res, { status: 'success', data: stateStore.iqamahSettings });
  }

  if (pathname === '/api/v1/admin/iqamah-settings' && method === 'PUT') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      let payload;
      try {
        payload = JSON.parse(body || '{}');
      } catch (_) {
        return sendJSON(res, { status: 'error', message: 'Payload JSON tidak valid' }, 400);
      }
      try {
        const prayers = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];
        await Promise.all(prayers.filter(prayer => payload[prayer]).map(prayer => {
          const parsed = parseInt(payload[prayer].duration_minutes, 10);
          return saveRowByKey('iqamah_settings', 'prayer_name', prayer, {
            is_enabled: payload[prayer].is_enabled !== undefined ? Boolean(payload[prayer].is_enabled) : true,
            duration_minutes: isNaN(parsed) ? 10 : Math.max(1, Math.min(60, parsed))
          });
        }));
        await loadPrimaryStateFromDatabase({ force: true });
        return sendJSON(res, { status: 'success', message: 'Pengaturan countdown Iqamah berhasil diperbarui', data: stateStore.iqamahSettings });
      } catch (error) {
        console.error('Failed to save iqamah settings:', error.message || error);
        return sendJSON(res, { status: 'error', message: 'Database tidak dapat menyimpan pengaturan iqamah' }, 503);
      }
    });
    return;
  }

  // API 29.9.1: GET & PUT Syuruq Settings
  if (pathname === '/api/v1/admin/syuruq-settings' && method === 'GET') {
    return sendJSON(res, { status: 'success', data: stateStore.syuruqSettings });
  }

  if (pathname === '/api/v1/admin/syuruq-settings' && method === 'PUT') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      let payload;
      try {
        payload = JSON.parse(body || '{}');
      } catch (_) {
        return sendJSON(res, { status: 'error', message: 'Payload JSON tidak valid' }, 400);
      }
      try {
        const parsed = parseInt(payload.durationMinutes, 10);
        await saveSingleton('display_settings', {
          syuruq_enabled: payload.is_enabled !== undefined ? Boolean(payload.is_enabled) : true,
          syuruq_duration_minutes: isNaN(parsed) ? 15 : Math.max(1, Math.min(60, parsed)),
          syuruq_display_message: payload.displayMessage || stateStore.syuruqSettings.displayMessage
        });
        await loadPrimaryStateFromDatabase({ force: true });
        return sendJSON(res, { status: 'success', message: 'Pengaturan layar pengingat Syuruq berhasil diperbarui', data: stateStore.syuruqSettings });
      } catch (error) {
        console.error('Failed to save syuruq settings:', error.message || error);
        return sendJSON(res, { status: 'error', message: 'Database tidak dapat menyimpan pengaturan syuruq' }, 503);
      }
    });
    return;
  }

  // API 29.7.2: GET & PUT Audio Settings
  if (pathname === '/api/v1/admin/audio-settings' && method === 'GET') {
    return sendJSON(res, {
      status: 'success',
      data: {
        adzanSettings: stateStore.adzanSettings,
        audioSettings: stateStore.audioSettings
      }
    });
  }

  if (pathname === '/api/v1/admin/audio-settings' && method === 'PUT') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      let payload;
      try {
        payload = JSON.parse(body || '{}');
      } catch (_) {
        return sendJSON(res, { status: 'error', message: 'Payload JSON tidak valid' }, 400);
      }
      try {
        if (payload.adzanSettings) {
          const parsed = parseInt(payload.adzanSettings.durationSeconds, 10);
          await saveSingleton('display_settings', {
            adzan_duration_seconds: isNaN(parsed) ? stateStore.adzanSettings.durationSeconds : Math.max(1, Math.min(900, parsed)),
            adzan_display_message: payload.adzanSettings.displayMessage || stateStore.adzanSettings.displayMessage
          });
        }
        await Promise.all(Object.entries(payload.audioSettings || {}).map(([type, settings]) =>
          saveRowByKey('audio_settings', 'type', type, {
            is_enabled: settings.is_enabled !== undefined ? Boolean(settings.is_enabled) : true,
            volume: Math.max(0, Math.min(100, parseInt(settings.volume, 10) || 0)),
            source_url: settings.custom_url || null,
            play_before_minutes: settings.play_before_minutes == null ? null : Math.max(0, parseInt(settings.play_before_minutes, 10) || 0),
            play_after_minutes: settings.play_after_minutes == null ? null : Math.max(0, parseInt(settings.play_after_minutes, 10) || 0)
          })
        ));
        await loadPrimaryStateFromDatabase({ force: true });
        return sendJSON(res, { status: 'success', message: 'Pengaturan audio adzan dan alarm berhasil diperbarui', data: { adzanSettings: stateStore.adzanSettings, audioSettings: stateStore.audioSettings } });
      } catch (error) {
        console.error('Failed to save audio settings:', error.message || error);
        return sendJSON(res, { status: 'error', message: 'Database tidak dapat menyimpan pengaturan audio' }, 503);
      }
    });
    return;
  }

  // API 29.16.1: GET & PUT Donation Settings
  if (pathname === '/api/v1/admin/donation-settings' && method === 'GET') {
    if (insforgeClient && insforgeClient.database) {
      try {
        const { data: dbData } = await insforgeClient.database
          .from('donation_settings')
          .select('*')
          .limit(1);
        if (dbData && dbData.length > 0) {
          stateStore.donationSettings = {
            ...stateStore.donationSettings,
            ...dbData[0]
          };
        }
      } catch (e) {
        console.log('InsForge DB select donation_settings fallback:', e.message || e);
      }
    }
    return sendJSON(res, { status: 'success', data: stateStore.donationSettings });
  }

  if (pathname === '/api/v1/admin/donation-settings' && method === 'PUT') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        stateStore.donationSettings = {
          ...stateStore.donationSettings,
          ...payload
        };

        if (insforgeClient && insforgeClient.database) {
          try {
            const dbPayload = {
              title: stateStore.donationSettings.title,
              description: stateStore.donationSettings.description,
              account_name: stateStore.donationSettings.account_name,
              qr_code_path: stateStore.donationSettings.qr_code_path || stateStore.donationSettings.qr_code_url || null,
              is_active: stateStore.donationSettings.is_active !== undefined ? Boolean(stateStore.donationSettings.is_active) : true,
              updated_at: new Date().toISOString()
            };
            const { error: dbError } = await insforgeClient.database
              .from('donation_settings')
              .update(dbPayload)
              .eq('id', stateStore.donationSettings.id || 1);
            if (dbError) {
              console.error('InsForge DB update donation_settings error:', dbError);
            } else {
              console.log('InsForge DB donation_settings updated!');
            }
          } catch (e) {
            console.log('InsForge DB update donation_settings fallback:', e.message || e);
          }
        }

        return sendJSON(res, {
          status: 'success',
          message: 'Pengaturan QR Donasi & Rekening Masjid berhasil diperbarui',
          data: stateStore.donationSettings
        });
      } catch (err) {
        return sendJSON(res, { status: 'error', message: 'Payload JSON tidak valid' }, 400);
      }
    });
    return;
  }

  // API 29.13.1: CRUD Media Items with InsForge BaaS Integration
  if (pathname === '/api/v1/admin/media-items' && method === 'GET') {
    if (insforgeClient && insforgeClient.database) {
      try {
        const { data: dbData, error } = await insforgeClient.database
          .from('media_items')
          .select('*')
          .order('sort_order', { ascending: true });
        if (error) throw error;
        if (dbData) {
          const filteredDbData = dbData.filter(m => ALLOWED_MEDIA_TYPES.has(m.type) && (m.id < 10 || m.type !== 'hadith')); 
          stateStore.mediaItems = filteredDbData.map(m => {
            let subtitle = m.subtitle || null;
            let arabic_text = m.arabic_text || null;
            let content = m.content || null;

            if (m.content && m.content.trim().startsWith('{')) {
              try {
                const parsed = JSON.parse(m.content);
                if (parsed.subtitle) subtitle = parsed.subtitle;
                if (parsed.arabic_text) arabic_text = parsed.arabic_text;
                if (parsed.content) content = parsed.content;
              } catch (_) {}
            }

            return {
              ...m,
              url: m.file_path || m.url || null,
              subtitle,
              arabic_text,
              content: m.content
            };
          });
        }
      } catch (e) {
        console.error('InsForge DB select media_items error:', e.message || e);
        return sendJSON(res, { status: 'error', message: 'Database tidak dapat memuat media' }, 503);
      }
    } else {
      return sendJSON(res, { status: 'error', message: 'Database belum siap' }, 503);
    }
    const resultList = stateStore.mediaItems.slice(0, 10);
    return sendJSON(res, { status: 'success', data: resultList });
  }

  if (pathname === '/api/v1/admin/media-items' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const title = String(payload.title || '').trim();
        const type = String(payload.type || 'announcement').trim();
        const durationSeconds = Number.parseInt(payload.duration_seconds, 10) || 10;
        const allowedTypes = ALLOWED_MEDIA_TYPES;
        if (!title) return sendJSON(res, { status: 'error', message: 'Judul media wajib diisi' }, 422);
        if (!allowedTypes.has(type)) return sendJSON(res, { status: 'error', message: 'Tipe media tidak didukung' }, 422);
        if (durationSeconds < 3 || durationSeconds > 300) return sendJSON(res, { status: 'error', message: 'Durasi media harus 3–300 detik' }, 422);
        const mediaUrl = payload.url ? String(payload.url).trim() : null;
        if (type === 'image' && !mediaUrl) return sendJSON(res, { status: 'error', message: 'Gambar wajib diunggah atau URL wajib diisi' }, 422);

        // Preserve JSON or structure subtitle & arabic_text into content if needed
        let contentStr = payload.content || '';
        if ((payload.subtitle || payload.arabic_text) && !contentStr.trim().startsWith('{')) {
          contentStr = JSON.stringify({
            subtitle: payload.subtitle || '',
            arabic_text: payload.arabic_text || '',
            content: payload.content || ''
          });
        }

        const newItem = {
          id: Date.now(),
          title,
          subtitle: payload.subtitle || '',
          content: contentStr,
          arabic_text: payload.arabic_text || payload.arabicText || '',
          translation_text: payload.translation_text || payload.translationText || payload.content || '',
          type,
          url: mediaUrl,
          duration_seconds: durationSeconds,
          sort_order: parseInt(payload.sort_order, 10) || (stateStore.mediaItems.length + 1),
          is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true,
          starts_at: payload.starts_at || null,
          ends_at: payload.ends_at || null
        };

        // Sync with InsForge Database
        if (!insforgeClient || !insforgeClient.database) {
          return sendJSON(res, { status: 'error', message: 'Database belum siap' }, 503);
        }
        try {
            const dbPayload = {
              title: newItem.title,
              type: newItem.type,
              content: newItem.content,
              file_path: newItem.url || null,
              duration_seconds: newItem.duration_seconds,
              sort_order: newItem.sort_order,
              is_active: newItem.is_active,
              starts_at: newItem.starts_at,
              ends_at: newItem.ends_at
            };

            const { data: dbResult, error: dbError } = await insforgeClient.database
              .from('media_items')
              .insert([dbPayload])
              .select();

          if (dbError) throw dbError;
          if (!dbResult || !dbResult[0]) throw new Error('Database tidak mengembalikan media baru');
          newItem.id = dbResult[0].id;
        } catch (e) {
          console.error('InsForge DB insert media_items error:', e.message || e);
          return sendJSON(res, { status: 'error', message: 'Database tidak dapat menyimpan media' }, 503);
        }

        stateStore.mediaItems.push(newItem);

        return sendJSON(res, {
          status: 'success',
          message: 'Item multimedia berhasil ditambahkan dan tersimpan di InsForge Backend',
          data: newItem
        });
      } catch (err) {
        return sendJSON(res, { status: 'error', message: 'Payload JSON tidak valid' }, 400);
      }
    });
    return;
  }

  if (pathname === '/api/v1/admin/media-items/toggle' && method === 'PUT') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const item = stateStore.mediaItems.find(m => m.id === payload.id);
        if (item) {
          const previousStatus = item.is_active;
          item.is_active = payload.is_active !== undefined ? Boolean(payload.is_active) : !item.is_active;

          if (!insforgeClient || !insforgeClient.database) {
            item.is_active = previousStatus;
            return sendJSON(res, { status: 'error', message: 'Database belum siap' }, 503);
          }
          try {
            const { error: updateError } = await insforgeClient.database
              .from('media_items')
              .update({ is_active: item.is_active })
              .eq('id', item.id);
            if (updateError) throw updateError;
          } catch (e) {
            item.is_active = previousStatus;
            console.error('InsForge DB update media_items error:', e.message || e);
            return sendJSON(res, { status: 'error', message: 'Database tidak dapat memperbarui media' }, 503);
          }

          return sendJSON(res, {
            status: 'success',
            message: `Status media "${item.title}" berhasil diperbarui`,
            data: item
          });
        }
        return sendJSON(res, { status: 'error', message: 'Item media tidak ditemukan' }, 404);
      } catch (err) {
        return sendJSON(res, { status: 'error', message: 'Payload JSON tidak valid' }, 400);
      }
    });
    return;
  }

  if (pathname === '/api/v1/admin/media-items' && method === 'DELETE') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const id = payload.id || parseInt(parsedUrl.query.id, 10);
        const idx = stateStore.mediaItems.findIndex(m => m.id === id);
        if (idx !== -1) {
          if (!insforgeClient || !insforgeClient.database) {
            return sendJSON(res, { status: 'error', message: 'Database belum siap' }, 503);
          }
          const removed = stateStore.mediaItems[idx];
          try {
            const { error: deleteError } = await insforgeClient.database
              .from('media_items')
              .delete()
              .eq('id', id);
            if (deleteError) throw deleteError;
          } catch (e) {
            console.error('InsForge DB delete media_items error:', e.message || e);
            return sendJSON(res, { status: 'error', message: 'Database tidak dapat menghapus media' }, 503);
          }
          stateStore.mediaItems.splice(idx, 1);

          return sendJSON(res, {
            status: 'success',
            message: `Item media "${removed.title}" berhasil dihapus`,
            data: removed
          });
        }
        return sendJSON(res, { status: 'error', message: 'Item media tidak ditemukan' }, 404);
      } catch (err) {
        return sendJSON(res, { status: 'error', message: 'Payload JSON tidak valid' }, 400);
      }
    });
    return;
  }

async function uploadToInsForgeStorage(fileName, buffer, contentType, accessToken) {
  if (!createInsforgeClient) throw new Error('InsForge SDK belum siap');
  const client = createInsforgeClient({ baseUrl: INSFORGE_BASE_URL, anonKey: INSFORGE_ANON_KEY });
  client.getHttpClient().setAuthToken(accessToken);
  const file = new Blob([buffer], { type: contentType });
  const { data, error } = await client.storage.from('masjid-assets').upload(fileName, file);
  if (error) throw error;
  return { url: data.url, key: data.key };
}

  // API: InsForge Cloud Storage Asset Upload Endpoint
  if (pathname === '/api/v1/admin/upload' && method === 'POST') {
    let chunks = [];
    req.on('data', chunk => { chunks.push(chunk); });
    req.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        if (buffer.length > 10 * 1024 * 1024) {
          return sendJSON(res, { status: 'error', message: 'Ukuran file maksimal 10 MiB' }, 413);
        }
        let fileName = `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
        let contentType = 'image/jpeg';
        let fileBuf = buffer;

        // Check if request is JSON body
        try {
          const bodyStr = buffer.toString('utf8');
          const jsonPayload = JSON.parse(bodyStr);
          if (jsonPayload.url) {
            return sendJSON(res, {
              status: 'success',
              message: 'URL asset berhasil diterima',
              data: { url: jsonPayload.url, key: `masjid-assets/${fileName}` }
            });
          }
          if (jsonPayload.filename) {
            fileName = jsonPayload.filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
            const ext = fileName.split('.').pop().toLowerCase();
            if (ext === 'png') contentType = 'image/png';
            else if (ext === 'webp') contentType = 'image/webp';
            else if (ext === 'svg') contentType = 'image/svg+xml';
            else if (ext === 'mp4') contentType = 'video/mp4';
          }
          if (jsonPayload.fileData && jsonPayload.fileData.startsWith('data:')) {
            const base64Parts = jsonPayload.fileData.split(',');
            const mimeMatch = base64Parts[0].match(/:(.*?);/);
            if (mimeMatch) contentType = mimeMatch[1];
            fileBuf = Buffer.from(base64Parts[1], 'base64');
          }
        } catch (_) {
          // Binary buffer upload
        }

        const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'video/mp4']);
        if (!allowedTypes.has(contentType)) {
          return sendJSON(res, { status: 'error', message: 'Tipe file tidak didukung' }, 415);
        }

        // Upload to InsForge Storage API & Bucket
        const uploaded = await uploadToInsForgeStorage(
          fileName,
          fileBuf,
          contentType,
          req.headers.authorization.slice(7).trim()
        );

        return sendJSON(res, {
          status: 'success',
          message: 'File berhasil diunggah ke InsForge Storage bucket masjid-assets',
          data: uploaded
        });
      } catch (err) {
        console.error('Upload error:', err);
        return sendJSON(res, { status: 'error', message: 'Gagal mengunggah file' }, 500);
      }
    });
    return;
  }

  // API: InsForge Auth Admin Login (Sub-Fitur 29.1.1)
  if (pathname === '/api/v1/admin/login' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const email = data.email ? data.email.trim().toLowerCase() : '';
        const password = data.password ? data.password.trim() : '';

        if (!email || !password) {
          return sendJSON(res, { status: 'error', message: 'Email dan password wajib diisi' }, 422);
        }

        if (!ADMIN_EMAILS.has(email)) {
          return sendJSON(res, { status: 'error', message: 'Akun tidak memiliki akses admin' }, 403);
        }

        // Call InsForge SDK signInWithPassword
        if (createInsforgeClient) {
          try {
            const authClient = createInsforgeClient({ baseUrl: INSFORGE_BASE_URL, anonKey: INSFORGE_ANON_KEY });
            const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
              email: email,
              password: password
            });

            if (!authError && authData && authData.accessToken) {
              return sendJSON(res, {
                status: 'success',
                message: 'InsForge Auth Login Berhasil',
                data: {
                  token: authData.accessToken,
                  user: authData.user || { email: email, role: 'admin', provider: 'insforge_auth' }
                }
              });
            }

            if (authError) {
              return sendJSON(res, {
                status: 'error',
                message: authError.message || 'Email atau password InsForge Auth tidak valid'
              }, 401);
            }
          } catch (e) {
            console.error('InsForge Auth Error:', e);
          }
        }

        return sendJSON(res, { status: 'error', message: 'Email atau password InsForge Auth tidak valid' }, 401);
      } catch (err) {
        return sendJSON(res, { status: 'error', message: 'Payload JSON tidak valid' }, 400);
      }
    });
    return;
  }

  if (pathname === '/api/v1/admin/logout' && method === 'POST') {
    return sendJSON(res, { status: 'success', message: 'Logout berhasil' });
  }

  // API: Dashboard Summary (Sub-Fitur 29.1.2)
  if (pathname === '/api/v1/admin/dashboard/summary' && method === 'GET') {
    return sendJSON(res, {
      status: 'success',
      data: {
        displayStatus: 'ONLINE',
        activeLocation: stateStore.prayerLocation,
        lastSync: stateStore.lastSyncTime || new Date().toISOString(),
        syncStatus: 'TERBARU (MyQuran API)',
        activeMediaCount: stateStore.mediaItems.filter(m => m.is_active).length,
        activeRunningTextCount: stateStore.runningTexts.filter(t => t.is_active).length,
        mosqueProfile: stateStore.mosqueProfile
      }
    });
  }

  // Master Location Data for MyQuran API (Section 29.3.1)
  const masterLocations = [
    { province_name: 'SUMATERA BARAT', city_code: '0314', city_name: 'KOTA PADANG' },
    { province_name: 'SUMATERA BARAT', city_code: '0312', city_name: 'KOTA BUKITTINGGI' },
    { province_name: 'SUMATERA BARAT', city_code: '0317', city_name: 'KOTA SOLOK' },
    { province_name: 'SUMATERA BARAT', city_code: '0305', city_name: 'KAB. PADANG PARIAMAN' },
    { province_name: 'DKI JAKARTA', city_code: '1301', city_name: 'KOTA JAKARTA SELATAN' },
    { province_name: 'DKI JAKARTA', city_code: '1302', city_name: 'KOTA JAKARTA TIMUR' },
    { province_name: 'JAWA BARAT', city_code: '1203', city_name: 'KOTA BANDUNG' },
    { province_name: 'JAWA BARAT', city_code: '1221', city_name: 'KOTA BEKASI' },
    { province_name: 'JAWA TIMUR', city_code: '1638', city_name: 'KOTA SURABAYA' }
  ];

  // API 29.3.1: Get List of Provinces & Cities
  if (pathname === '/api/v1/admin/locations/provinces' && method === 'GET') {
    const provinces = [...new Set(masterLocations.map(l => l.province_name))];
    return sendJSON(res, { status: 'success', data: provinces });
  }

  if (pathname === '/api/v1/admin/locations/cities' && method === 'GET') {
    const prov = parsedUrl.query.province;
    const cities = prov ? masterLocations.filter(l => l.province_name === prov) : masterLocations;
    return sendJSON(res, { status: 'success', data: cities });
  }

  if (pathname === '/api/v1/admin/locations/active' && method === 'GET') {
    return sendJSON(res, { status: 'success', data: stateStore.prayerLocation });
  }

  if (pathname === '/api/v1/admin/locations/active' && method === 'PUT') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      let payload;
      try {
        payload = JSON.parse(body || '{}');
      } catch (_) {
        return sendJSON(res, { status: 'error', message: 'Payload tidak valid' }, 400);
      }
      const location = masterLocations.find(item => item.city_code === payload.city_code) || {
        province_name: payload.province_name || 'SUMATERA BARAT',
        city_code: payload.city_code || '0314',
        city_name: payload.city_name || 'KOTA PADANG'
      };
      try {
        const { error } = await insforgeClient.database.from('prayer_locations').update({ is_active: false }).neq('city_code', '');
        if (error) throw error;
        await saveRowByKey('prayer_locations', 'city_code', location.city_code, { ...location, is_active: true });
        await loadPrimaryStateFromDatabase({ force: true });
        return sendJSON(res, { status: 'success', message: 'Lokasi aktif berhasil diperbarui', data: stateStore.prayerLocation });
      } catch (error) {
        console.error('Failed to save active location:', error.message || error);
        return sendJSON(res, { status: 'error', message: 'Database tidak dapat menyimpan lokasi aktif' }, 503);
      }
    });
    return;
  }

  // API GET Monthly Prayer Schedules. PostgreSQL is primary; provider only fills an empty month.
  if (pathname === '/api/v1/admin/jadwal' && method === 'GET') {
    const { year, month } = jakartaYearMonth();
    const prefix = `${year}-${month}-`;
    try {
      if (!stateStore.monthlySchedules.some(item => item.date.startsWith(prefix))) {
        await syncPrayerSchedules(stateStore.prayerLocation.city_code || '0314', year, month);
      }
      return sendJSON(res, { status: 'success', data: { lastSync: stateStore.lastSyncTime, city: stateStore.prayerLocation, schedules: stateStore.monthlySchedules } });
    } catch (error) {
      console.error('Failed to load monthly schedules:', error.message || error);
      return sendJSON(res, { status: 'error', message: 'Jadwal bulan aktif belum tersedia' }, 503);
    }
  }

  // API 29.3.2: Explicit live sync from current MyQuran API provider.
  if (pathname === '/api/v1/admin/jadwal/sync' && method === 'POST') {
    const { year, month } = jakartaYearMonth();
    try {
      const result = await syncPrayerSchedules(stateStore.prayerLocation.city_code || '0314', year, month);
      return sendJSON(res, {
        status: 'success',
        message: `Jadwal sholat MyQuran API untuk ${result.location} (${month}/${year}) berhasil disinkronkan`,
        data: { lastSync: stateStore.lastSyncTime, city: stateStore.prayerLocation, schedules: result.schedules }
      });
    } catch (error) {
      console.error('Failed to sync MyQuran API:', error.message || error);
      return sendJSON(res, { status: 'error', message: 'Gagal menyinkronkan jadwal dari MyQuran API' }, 503);
    }
  }

  // API 2: Admin Mosque Profile (Section 29.2)
  if (pathname === '/api/v1/admin/mosque-profile' && method === 'GET') {
    return sendJSON(res, { status: 'success', data: stateStore.mosqueProfile });
  }



  if (pathname === '/api/v1/admin/mosque-profile' && method === 'PUT') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      let payload;
      try {
        payload = JSON.parse(body || '{}');
      } catch (_) {
        return sendJSON(res, { status: 'error', message: 'Payload JSON tidak valid' }, 400);
      }
      if (!payload.name || payload.name.trim() === '') {
        return sendJSON(res, { status: 'error', message: 'Nama masjid wajib diisi' }, 422);
      }
      try {
        await saveSingleton('mosque_profiles', {
          name: payload.name.trim(),
          address: payload.address || stateStore.mosqueProfile.address,
          contact: payload.contact || stateStore.mosqueProfile.contact,
          timezone: payload.timezone || stateStore.mosqueProfile.timezone || 'Asia/Jakarta',
          logo_path: payload.logo_path !== undefined ? payload.logo_path : stateStore.mosqueProfile.logo_path,
          background_path: payload.background_path !== undefined ? payload.background_path : stateStore.mosqueProfile.background_path
        });
        await loadPrimaryStateFromDatabase({ force: true });
        return sendJSON(res, { status: 'success', message: 'Profil masjid & aset visual berhasil disimpan', data: stateStore.mosqueProfile });
      } catch (error) {
        console.error('Failed to save mosque profile:', error.message || error);
        return sendJSON(res, { status: 'error', message: 'Database tidak dapat menyimpan profil masjid' }, 503);
      }
    });
    return;
  }

  // API 29.17.1: Admin Running Text CRUD with InsForge BaaS Integration
  if (pathname === '/api/v1/admin/running-text' && method === 'GET') {
    if (insforgeClient && insforgeClient.database) {
      try {
        const { data: dbData, error } = await insforgeClient.database
          .from('running_texts')
          .select('*')
          .order('id', { ascending: true });
        if (error) throw error;
        stateStore.runningTexts = dbData || [];
      } catch (e) {
        console.error('InsForge DB select running_texts error:', e.message || e);
        return sendJSON(res, { status: 'error', message: 'Database tidak dapat memuat running text' }, 503);
      }
    } else {
      return sendJSON(res, { status: 'error', message: 'Database belum siap' }, 503);
    }
    return sendJSON(res, { status: 'success', data: stateStore.runningTexts });
  }

  if (pathname === '/api/v1/admin/running-text' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const text = String(payload.text || '').trim();
        const speed = Number.parseInt(payload.speed, 10) || 50;
        if (!text) return sendJSON(res, { status: 'error', message: 'Isi running text wajib diisi' }, 422);
        if (speed < 10 || speed > 200) return sendJSON(res, { status: 'error', message: 'Kecepatan running text harus 10–200 px/s' }, 422);
        const newItem = {
          id: Date.now(),
          text,
          speed,
          is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true,
          starts_at: payload.starts_at || null,
          ends_at: payload.ends_at || null
        };

        if (!insforgeClient || !insforgeClient.database) {
          return sendJSON(res, { status: 'error', message: 'Database belum siap' }, 503);
        }
        try {
          const dbPayload = {
            text: newItem.text,
            speed: newItem.speed,
            is_active: newItem.is_active,
            starts_at: newItem.starts_at,
            ends_at: newItem.ends_at
          };
          const { data: dbResult, error: dbError } = await insforgeClient.database
            .from('running_texts')
            .insert([dbPayload])
            .select();
          if (dbError) throw dbError;
          if (!dbResult || !dbResult[0]) throw new Error('Database tidak mengembalikan running text baru');
          newItem.id = dbResult[0].id;
        } catch (e) {
          console.error('InsForge DB insert running_texts error:', e.message || e);
          return sendJSON(res, { status: 'error', message: 'Database tidak dapat menyimpan running text' }, 503);
        }

        stateStore.runningTexts.push(newItem);

        return sendJSON(res, {
          status: 'success',
          message: 'Running text berhasil ditambahkan dan tersimpan di InsForge Backend',
          data: newItem
        });
      } catch (err) {
        return sendJSON(res, { status: 'error', message: 'Payload JSON tidak valid' }, 400);
      }
    });
    return;
  }

  if (pathname === '/api/v1/admin/running-text/toggle' && method === 'PUT') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const item = stateStore.runningTexts.find(r => r.id === payload.id);
        if (item) {
          const previousStatus = item.is_active;
          item.is_active = payload.is_active !== undefined ? Boolean(payload.is_active) : !item.is_active;

          if (!insforgeClient || !insforgeClient.database) {
            item.is_active = previousStatus;
            return sendJSON(res, { status: 'error', message: 'Database belum siap' }, 503);
          }
          try {
            const { error: updateError } = await insforgeClient.database
              .from('running_texts')
              .update({ is_active: item.is_active })
              .eq('id', item.id);
            if (updateError) throw updateError;
          } catch (e) {
            item.is_active = previousStatus;
            console.error('InsForge DB update running_texts error:', e.message || e);
            return sendJSON(res, { status: 'error', message: 'Database tidak dapat memperbarui running text' }, 503);
          }

          return sendJSON(res, {
            status: 'success',
            message: `Status running text berhasil diperbarui`,
            data: item
          });
        }
        return sendJSON(res, { status: 'error', message: 'Running text tidak ditemukan' }, 404);
      } catch (err) {
        return sendJSON(res, { status: 'error', message: 'Payload JSON tidak valid' }, 400);
      }
    });
    return;
  }

  if (pathname === '/api/v1/admin/running-text' && method === 'DELETE') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const id = payload.id || parseInt(parsedUrl.query.id, 10);
        const idx = stateStore.runningTexts.findIndex(r => r.id === id);
        if (idx !== -1) {
          if (!insforgeClient || !insforgeClient.database) {
            return sendJSON(res, { status: 'error', message: 'Database belum siap' }, 503);
          }
          const removed = stateStore.runningTexts[idx];
          try {
            const { error: deleteError } = await insforgeClient.database
              .from('running_texts')
              .delete()
              .eq('id', id);
            if (deleteError) throw deleteError;
          } catch (e) {
            console.error('InsForge DB delete running_texts error:', e.message || e);
            return sendJSON(res, { status: 'error', message: 'Database tidak dapat menghapus running text' }, 503);
          }
          stateStore.runningTexts.splice(idx, 1);

          return sendJSON(res, {
            status: 'success',
            message: `Running text berhasil dihapus`,
            data: removed
          });
        }
        return sendJSON(res, { status: 'error', message: 'Running text tidak ditemukan' }, 404);
      } catch (err) {
        return sendJSON(res, { status: 'error', message: 'Payload JSON tidak valid' }, 400);
      }
    });
    return;
  }

  // API 29.20.1: GET & PUT Theme & Layout Settings
  if (pathname === '/api/v1/admin/theme-settings' && method === 'GET') {
    if (insforgeClient && insforgeClient.database) {
      try {
        const { data: dbData } = await insforgeClient.database
          .from('theme_settings')
          .select('*')
          .limit(1);
        if (dbData && dbData.length > 0) {
          stateStore.themeSettings = {
            ...stateStore.themeSettings,
            ...dbData[0]
          };
        }
      } catch (e) {
        console.log('InsForge DB select theme_settings fallback:', e.message || e);
      }
    }
    return sendJSON(res, { status: 'success', data: stateStore.themeSettings });
  }

  if (pathname === '/api/v1/admin/theme-settings' && method === 'PUT') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        stateStore.themeSettings = {
          ...stateStore.themeSettings,
          ...payload
        };

        if (insforgeClient && insforgeClient.database) {
          try {
            const dbPayload = {
              theme_name: stateStore.themeSettings.theme_name || 'Modern Emerald Dark',
              primary_color: stateStore.themeSettings.primary_color || '#10B981',
              secondary_color: stateStore.themeSettings.secondary_color || '#F59E0B',
              background_color: stateStore.themeSettings.background_color || '#0F172A',
              text_color: stateStore.themeSettings.text_color || '#FFFFFF',
              layout_config: stateStore.themeSettings.layout_config || { mode: 'default' },
              updated_at: new Date().toISOString()
            };
            const { error: dbError } = await insforgeClient.database
              .from('theme_settings')
              .update(dbPayload)
              .eq('id', stateStore.themeSettings.id || 1);
            if (dbError) {
              console.error('InsForge DB update theme_settings error:', dbError);
            } else {
              console.log('InsForge DB theme_settings updated!');
            }
          } catch (e) {
            console.log('InsForge DB update theme_settings fallback:', e.message || e);
          }
        }

        return sendJSON(res, {
          status: 'success',
          message: 'Pengaturan Kustomisasi Tema & Layout berhasil diperbarui',
          data: stateStore.themeSettings
        });
      } catch (err) {
        return sendJSON(res, { status: 'error', message: 'Payload JSON tidak valid' }, 400);
      }
    });
    return;
  }

  // API 29.19.1: GET & PUT Friday Settings
  if (pathname === '/api/v1/admin/friday-settings' && method === 'GET') {
    return sendJSON(res, { status: 'success', data: stateStore.fridaySettings });
  }

  if (pathname === '/api/v1/admin/friday-settings' && method === 'PUT') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      let payload;
      try {
        payload = JSON.parse(body || '{}');
      } catch (_) {
        return sendJSON(res, { status: 'error', message: 'Payload JSON tidak valid' }, 400);
      }
      try {
        const settings = { ...stateStore.fridaySettings, ...payload };
        const parsedDuration = parseInt(settings.khutbah_duration_minutes, 10);
        await saveSingleton('friday_settings', {
          is_enabled: settings.is_enabled !== undefined ? Boolean(settings.is_enabled) : true,
          disable_iqamah_on_friday: settings.disable_iqamah_on_friday !== undefined ? Boolean(settings.disable_iqamah_on_friday) : true,
          khutbah_duration_minutes: isNaN(parsedDuration) ? 35 : Math.max(1, Math.min(180, parsedDuration)),
          khutbah_title: settings.khutbah_title || 'SELAMAT MENUNAIKAN SHALAT JUM\'AT',
          khutbah_message: settings.khutbah_message || '',
          khatib_name: settings.khatib_name || '',
          imam_name: settings.imam_name || '',
          theme_title: settings.theme_title || ''
        });
        await loadPrimaryStateFromDatabase({ force: true });
        return sendJSON(res, { status: 'success', message: 'Pengaturan Mode Jum\'at & Khutbah berhasil diperbarui', data: stateStore.fridaySettings });
      } catch (error) {
        console.error('Failed to save Friday settings:', error.message || error);
        return sendJSON(res, { status: 'error', message: 'Database tidak dapat menyimpan pengaturan Jumat' }, 503);
      }
    });
    return;
  }

  // API 29.18.1: CRUD Agendas & Islamic Events with InsForge BaaS Integration
  if (pathname === '/api/v1/admin/agendas' && method === 'GET') {
    if (insforgeClient && insforgeClient.database) {
      try {
        const { data: dbData, error } = await insforgeClient.database
          .from('agendas')
          .select('*')
          .order('starts_at', { ascending: true });
        if (!error && dbData && dbData.length > 0) {
          stateStore.agendas = dbData;
        }
      } catch (e) {
        console.log('InsForge DB select agendas fallback:', e.message || e);
      }
    }
    return sendJSON(res, { status: 'success', data: stateStore.agendas });
  }

  if (pathname === '/api/v1/admin/agendas' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const newItem = {
          id: Date.now(),
          title: payload.title || 'Agenda Masjid Baru',
          description: payload.description || '',
          starts_at: payload.starts_at || null,
          ends_at: payload.ends_at || null,
          is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true
        };

        if (insforgeClient && insforgeClient.database) {
          try {
            const dbPayload = {
              title: newItem.title,
              description: newItem.description,
              starts_at: newItem.starts_at,
              ends_at: newItem.ends_at,
              is_active: newItem.is_active
            };
            const { data: dbResult, error: dbError } = await insforgeClient.database
              .from('agendas')
              .insert([dbPayload])
              .select();

            if (dbError) {
              console.error('InsForge DB insert agendas error:', dbError);
            } else if (dbResult && dbResult[0]) {
              console.log('Agenda synced to InsForge DB ID:', dbResult[0].id);
              newItem.id = dbResult[0].id;
            }
          } catch (e) {
            console.log('InsForge DB insert agendas fallback:', e.message || e);
          }
        }

        stateStore.agendas.push(newItem);

        return sendJSON(res, {
          status: 'success',
          message: 'Agenda masjid berhasil ditambahkan dan tersimpan di InsForge Backend',
          data: newItem
        });
      } catch (err) {
        return sendJSON(res, { status: 'error', message: 'Payload JSON tidak valid' }, 400);
      }
    });
    return;
  }

  if (pathname === '/api/v1/admin/agendas/toggle' && method === 'PUT') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const item = stateStore.agendas.find(a => a.id === payload.id);
        if (item) {
          item.is_active = payload.is_active !== undefined ? Boolean(payload.is_active) : !item.is_active;

          if (insforgeClient && insforgeClient.database) {
            try {
              await insforgeClient.database
                .from('agendas')
                .update({ is_active: item.is_active })
                .eq('id', item.id);
            } catch (e) {
              console.log('InsForge DB update agendas fallback:', e.message || e);
            }
          }

          return sendJSON(res, {
            status: 'success',
            message: `Status agenda "${item.title}" berhasil diperbarui`,
            data: item
          });
        }
        return sendJSON(res, { status: 'error', message: 'Agenda tidak ditemukan' }, 404);
      } catch (err) {
        return sendJSON(res, { status: 'error', message: 'Payload JSON tidak valid' }, 400);
      }
    });
    return;
  }

  if (pathname === '/api/v1/admin/agendas' && method === 'DELETE') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const id = payload.id || parseInt(parsedUrl.query.id, 10);
        const idx = stateStore.agendas.findIndex(a => a.id === id);
        if (idx !== -1) {
          const removed = stateStore.agendas.splice(idx, 1);

          if (insforgeClient && insforgeClient.database) {
            try {
              await insforgeClient.database
                .from('agendas')
                .delete()
                .eq('id', id);
            } catch (e) {
              console.log('InsForge DB delete agendas fallback:', e.message || e);
            }
          }

          return sendJSON(res, {
            status: 'success',
            message: `Agenda "${removed[0].title}" berhasil dihapus`,
            data: removed[0]
          });
        }
        return sendJSON(res, { status: 'error', message: 'Agenda tidak ditemukan' }, 404);
      } catch (err) {
        return sendJSON(res, { status: 'error', message: 'Payload JSON tidak valid' }, 400);
      }
    });
    return;
  }

  // API 4: Admin Media Items
  if (pathname === '/api/v1/admin/media-items' && method === 'GET') {
    return sendJSON(res, { status: 'success', data: stateStore.mediaItems });
  }

  if (pathname === '/api/v1/admin/media-items' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const newItem = {
          id: Date.now(),
          title: payload.title || 'Pengumuman Baru',
          type: payload.type || 'announcement',
          subtitle: payload.subtitle || '',
          translationText: payload.translationText || '',
          durationSeconds: payload.durationSeconds || 8,
          sort_order: stateStore.mediaItems.length + 1,
          is_active: true
        };
        stateStore.mediaItems.push(newItem);
        return sendJSON(res, { status: 'success', message: 'Konten media berhasil ditambahkan', data: newItem });
      } catch (err) {
        return sendJSON(res, { status: 'error', message: 'Invalid payload' }, 400);
      }
    });
    return;
  }
  // API: List files in InsForge S3 Storage bucket masjid-assets
  if (pathname === '/api/v1/admin/storage/list' && method === 'GET') {
    try {
      const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
      const listRes = await insforgeS3.send(new ListObjectsV2Command({ Bucket: 'masjid-assets' }));
      const files = (listRes.Contents || []).map(obj => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
        url: `/storage/masjid-assets/${obj.Key}`
      }));
      return sendJSON(res, { status: 'success', data: files });
    } catch (err) {
      console.error('S3 List Error:', err.message);
      return sendJSON(res, { status: 'error', message: 'Gagal membaca daftar file storage' }, 500);
    }
  }

  // Proxy: Serve InsForge S3 Storage files via /storage/masjid-assets/{key}
  if (pathname === '/health' && method === 'GET') {
    return sendJSON(res, {
      status: insforgeClient ? 'ok' : 'degraded',
      databaseClientReady: Boolean(insforgeClient)
    }, insforgeClient ? 200 : 503);
  }

  if (pathname.startsWith('/storage/masjid-assets/') && method === 'GET') {
    const fileKey = decodeURIComponent(pathname.replace('/storage/masjid-assets/', ''));
    if (!fileKey) {
      return sendJSON(res, { status: 'error', message: 'Missing file key' }, 400);
    }
    try {
      const { GetObjectCommand } = require('@aws-sdk/client-s3');
      const cmd = new GetObjectCommand({ Bucket: 'masjid-assets', Key: fileKey });
      const s3Res = await insforgeS3.send(cmd);

      const ext = path.extname(fileKey).toLowerCase();
      const mimeMap = {
        '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif',
        '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
        '.pdf': 'application/pdf', '.txt': 'text/plain'
      };
      const ct = s3Res.ContentType || mimeMap[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': ct,
        'Content-Length': s3Res.ContentLength || '',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      });

      // Stream the S3 body to response
      const bodyStream = s3Res.Body;
      if (bodyStream && typeof bodyStream.pipe === 'function') {
        bodyStream.pipe(res);
      } else if (bodyStream && typeof bodyStream.transformToByteArray === 'function') {
        const bytes = await bodyStream.transformToByteArray();
        res.end(Buffer.from(bytes));
      } else {
        res.end();
      }
    } catch (err) {
      console.error('S3 Proxy Error:', fileKey, err.message || err);
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', message: 'File not found in InsForge Storage', key: fileKey }));
    }
    return;
  }

  // Serve Web Admin Dashboard static files
  if (pathname.startsWith('/api/')) {
    return sendJSON(res, { status: 'error', message: 'API route not found' }, 404);
  }

  let filePath = path.join(__dirname, 'admin_public', pathname === '/' ? 'index.html' : pathname);
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(__dirname, 'admin_public', 'index.html');
    }
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg'
    };
    const contentType = mimeTypes[ext] || 'text/html';

    fs.readFile(filePath, (error, content) => {
      if (error) {
        res.writeHead(500);
        res.end('Server Error: ' + error.code);
      } else {
        res.writeHead(200, {
          'Content-Type': contentType,
          ...(contentType === 'text/html' ? {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          } : {})
        });
        res.end(content, 'utf-8');
      }
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Insforge Backend Server running on port ${PORT}`);
});
