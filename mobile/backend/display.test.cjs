const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');

const port = 18095;
let server;
let serverErrors = '';

before(async () => {
  server = spawn(process.execPath, ['server.cjs'], {
    cwd: __dirname,
    env: {
      ...process.env,
      PORT: String(port),
      INSFORGE_URL: 'http://127.0.0.1:1',
      INSFORGE_ANON_KEY: 'test-anon-key',
      INSFORGE_API_KEY: 'test-api-key',
      INSFORGE_ADMIN_EMAILS: 'admin@example.test',
    },
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  server.stderr.on('data', (chunk) => {
    serverErrors += chunk.toString();
  });
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/v1/display`);
      if (response.status) return;
    } catch (_) {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Backend test tidak dapat dimulai');
});

after(() => server?.kill());

test('GET /api/v1/display returns Sprint 8 content collections', async () => {
  const response = await fetch(`http://127.0.0.1:${port}/api/v1/display`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, 'success');
  assert.ok(Array.isArray(body.data.mediaItems));
  assert.ok(Array.isArray(body.data.agendas));
  assert.match(body.data.todaySchedule.subuh, /^\d{2}:\d{2}$/);
  assert.equal(body.data.syuruqSettings.is_enabled, true);
  assert.equal(body.data.syuruqSettings.durationMinutes, 15);
});

test('removed content APIs are unavailable', async () => {
  for (const route of ['/api/v1/hadith/random', '/api/v1/dua/random', '/api/hadith-items', '/api/dua-items']) {
    const response = await fetch(`http://127.0.0.1:${port}${route}`);
    assert.equal(response.status, 404, route);
  }
});

test('GET /api/v1/display logs database failure and serves fallback', async () => {
  const response = await fetch(`http://127.0.0.1:${port}/api/v1/display`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, 'success');
  assert.match(body.data.todaySchedule.subuh, /^\d{2}:\d{2}$/);
  assert.match(serverErrors, /state load failed|initialize prayer schedules/i);
});

test('removed daily-doa media types never reach display or admin UI', async () => {
  const displayResponse = await fetch(`http://127.0.0.1:${port}/api/v1/display`);
  const displayBody = await displayResponse.json();
  const adminResponse = await fetch(`http://127.0.0.1:${port}/`);
  const adminHtml = await adminResponse.text();

  assert.ok(displayBody.data.mediaItems.every((item) => !['daily_doa', 'doa'].includes(item.type)));
  assert.doesNotMatch(adminHtml, /Doa Harian|daily[_-]doa/i);
  assert.equal(adminResponse.headers.get('cache-control'), 'no-store, no-cache, must-revalidate');
});
