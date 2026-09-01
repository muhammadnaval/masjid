const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8095;
const ALLOWED_MEDIA_TYPES = new Set(['welcome', 'announcement', 'hadith', 'text', 'kasTable', 'kastable', 'infoTable', 'infotable', 'donation', 'image', 'video', 'youtube', 'livestream']);
let doaCache = { loadedAt: 0, items: [] };

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
    city_code: '1371',
    city_name: 'KOTA PADANG'
  },
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
      id: 2,
      title: 'HADITS HARI INI',
      type: 'hadith',
      arabicText: 'مَنْ بَنَى مَسْجِدًالِلَّهِ بَنَى اللَّهُ لَهُ مِثْلَهُ فِي الْجَنَّةِ',
      translationText: 'Barangsiapa membangun masjid karena Allah, maka Allah akan bangunkan baginya yang serupa di surga. (HR. Bukhari & Muslim)',
      durationSeconds: 10,
      sort_order: 2,
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

async function hourlyDoaSlide() {
  const now = Date.now();
  if (now - doaCache.loadedAt > 3600000 || !doaCache.items.length) {
    try {
      const response = await fetch('https://equran.id/api/doa', { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!response.ok) throw new Error(`eQuran Doa API HTTP ${response.status}`);
      const result = await response.json();
      const items = Array.isArray(result?.data) ? result.data.filter(item => item?.nama && item?.ar && item?.tr && item?.idn) : [];
      if (items.length) doaCache = { loadedAt: now, items };
    } catch (_) {}
  }
  if (!doaCache.items.length) return null;
  const item = doaCache.items[Math.floor(now / 3600000) % doaCache.items.length];
  return {
    id: `doa_${item.id ?? item.nama}`,
    title: item.nama,
    type: 'hadith',
    content: JSON.stringify({ subtitle: item.tr, arabic_text: item.ar, content: item.idn }),
    duration_seconds: 60,
    sort_order: 9999,
    is_active: true,
  };
}

// HTTP Server Routing
const server = http.createServer(async (req, res) => {
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

  // API 1: Public Display State
  if (pathname === '/api/v1/display/state' && method === 'GET') {
    return sendJSON(res, {
      status: 'success',
      data: {
        mosqueProfile: stateStore.mosqueProfile,
        prayerLocation: stateStore.prayerLocation,
        timeCorrections: stateStore.timeCorrections,
        iqamahSettings: stateStore.iqamahSettings,
        runningTexts: stateStore.runningTexts.filter(t => t.is_active),
        mediaItems: [...stateStore.mediaItems.filter(m => m.is_active && ALLOWED_MEDIA_TYPES.has(m.type)), ...[await hourlyDoaSlide()].filter(Boolean)]
      }
    });
  }

  // API 2: Admin Profile
  if (pathname === '/api/v1/admin/mosque-profile' && method === 'GET') {
    return sendJSON(res, { status: 'success', data: stateStore.mosqueProfile });
  }

  if (pathname === '/api/v1/admin/mosque-profile' && method === 'PUT') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        stateStore.mosqueProfile = { ...stateStore.mosqueProfile, ...payload };
        return sendJSON(res, { status: 'success', message: 'Profil masjid berhasil diperbarui', data: stateStore.mosqueProfile });
      } catch (err) {
        return sendJSON(res, { status: 'error', message: 'Invalid JSON payload' }, 400);
      }
    });
    return;
  }

  // API 3: Admin Running Text
  if (pathname === '/api/v1/admin/running-text' && method === 'GET') {
    return sendJSON(res, { status: 'success', data: stateStore.runningTexts });
  }

  if (pathname === '/api/v1/admin/running-text' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const newItem = {
          id: Date.now(),
          text: payload.text || 'Running text baru',
          is_active: payload.is_active !== undefined ? payload.is_active : true
        };
        stateStore.runningTexts.push(newItem);
        return sendJSON(res, { status: 'success', message: 'Running text ditambahkan', data: newItem });
      } catch (err) {
        return sendJSON(res, { status: 'error', message: 'Invalid payload' }, 400);
      }
    });
    return;
  }

  // API 4: Admin Media Items
  if (pathname === '/api/v1/admin/media-items' && method === 'GET') {
    return sendJSON(res, { status: 'success', data: stateStore.mediaItems.filter(m => ALLOWED_MEDIA_TYPES.has(m.type)) });
  }

  if (pathname === '/api/v1/admin/media-items' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const type = payload.type || 'announcement';
        if (!ALLOWED_MEDIA_TYPES.has(type)) {
          return sendJSON(res, { status: 'error', message: 'Tipe media tidak didukung' }, 422);
        }
        const newItem = {
          id: Date.now(),
          title: payload.title || 'Pengumuman Baru',
          type,
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

  // Serve Web Admin Dashboard static files
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

server.listen(PORT, () => {
  console.log(`Insforge Backend Server running on http://localhost:${PORT}`);
});
