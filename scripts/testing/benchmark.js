#!/usr/bin/env node

/**
 * ==============================================================================
 * ERPQu High-Concurrency Stress Testing & Benchmark Suite
 * ==============================================================================
 * Engine: Autocannon (HTTP/1.1 load tester)
 * Scenarios:
 *   1. Raw Throughput: GET /health (Tokio runtime baseline)
 *   2. Auth Throughput: POST /api/auth/login (Argon2id + Connection Pool)
 *   3. Multi-Tenant Protected Query: GET /api/finance/accounts (JWT + RLS)
 *   4. Catalog Data Read: GET /api/inventory/items (Pagination & Serializer)
 * ==============================================================================
 */

const autocannon = require('autocannon');
const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8181';
const CONNECTIONS = parseInt(process.env.CONNECTIONS || '50', 10);
const DURATION = parseInt(process.env.DURATION || '10', 10);
const COMPANY_ID = 'c0000000-0000-0000-0000-000000000001';

async function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function getAuthToken() {
  try {
    const url = new URL(`${BASE_URL}/api/auth/login`);
    const payload = JSON.stringify({
      email: 'org.admin@example.com',
      password: 'password123',
    });

    const res = await makeRequest(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      payload
    );

    if (res.status === 200) {
      const parsed = JSON.parse(res.body);
      const token = parsed.token || (parsed.data && parsed.data.token);
      return token;
    }
  } catch (err) {
    // Return null if login fails
  }
  return null;
}

function runAutocannon(opts) {
  return new Promise((resolve, reject) => {
    autocannon(opts, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log(' 🚀 ERPQu High-Concurrency Stress Testing & Benchmark Suite');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log(` Target Server : ${BASE_URL}`);
  console.log(` Concurrency   : ${CONNECTIONS} concurrent connections`);
  console.log(` Duration      : ${DURATION} seconds per scenario`);
  console.log('───────────────────────────────────────────────────────────────────────────────\n');

  // Verify server is alive
  try {
    const url = new URL(`${BASE_URL}/health`);
    const ping = await makeRequest({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'GET',
    });
    if (ping.status !== 200) {
      console.error(`❌ Server returned non-200 on /health: ${ping.status}`);
      process.exit(1);
    }
    console.log('✅ Target server is HEALTHY and responding!\n');
  } catch (err) {
    console.error(`❌ Failed to connect to ${BASE_URL}/health: ${err.message}`);
    console.error('👉 Pastikan backend server Rust sedang menyala di port 8181!');
    process.exit(1);
  }

  // Obtain JWT token
  console.log('🔑 Mengambil JWT Auth Token untuk pengujian endpoint berotentikasi...');
  const token = await getAuthToken();
  if (token) {
    console.log('✅ JWT Token berhasil diperoleh!\n');
  } else {
    console.log('⚠️ Login default gagal, pengujian authenticated akan menggunakan fallback simulated auth header.\n');
  }

  const results = [];

  // Skenario 1: Baseline Healthcheck
  console.log('▶ [1/4] Menjalankan Skenario 1: GET /health (Baseline Tokio Runtime)...');
  const res1 = await runAutocannon({
    url: `${BASE_URL}/health`,
    connections: CONNECTIONS,
    duration: DURATION,
    pipelining: 1,
  });
  results.push({ name: '1. GET /health (Baseline)', data: res1 });
  console.log(`  ➔ Selesai: ${res1.requests.average.toFixed(0)} req/s, p95: ${res1.latency.p95}ms\n`);

  // Skenario 2: Login Throughput
  console.log('▶ [2/4] Menjalankan Skenario 2: POST /api/auth/login (Argon2id + DB Pool)...');
  const loginPayload = JSON.stringify({ email: 'org.admin@example.com', password: 'password123' });
  const res2 = await runAutocannon({
    url: `${BASE_URL}/api/auth/login`,
    method: 'POST',
    body: loginPayload,
    headers: {
      'content-type': 'application/json',
    },
    connections: Math.min(CONNECTIONS, 20), // Argon2id is intentionally CPU-intensive
    duration: DURATION,
  });
  results.push({ name: '2. POST /api/auth/login', data: res2 });
  console.log(`  ➔ Selesai: ${res2.requests.average.toFixed(0)} req/s, p95: ${res2.latency.p95}ms\n`);

  // Skenario 3: Multi-Tenant Protected Query (CoA)
  console.log('▶ [3/4] Menjalankan Skenario 3: GET /api/finance/accounts (Multi-Tenant CoA)...');
  const headers = {
    'X-Company-ID': COMPANY_ID,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res3 = await runAutocannon({
    url: `${BASE_URL}/api/finance/accounts`,
    method: 'GET',
    headers,
    connections: CONNECTIONS,
    duration: DURATION,
  });
  results.push({ name: '3. GET /api/finance/accounts', data: res3 });
  console.log(`  ➔ Selesai: ${res3.requests.average.toFixed(0)} req/s, p95: ${res3.latency.p95}ms\n`);

  // Skenario 4: Inventory Items Catalog Read
  console.log('▶ [4/4] Menjalankan Skenario 4: GET /api/inventory/items (Catalog Read)...');
  const res4 = await runAutocannon({
    url: `${BASE_URL}/api/inventory/items?limit=20`,
    method: 'GET',
    headers,
    connections: CONNECTIONS,
    duration: DURATION,
  });
  results.push({ name: '4. GET /api/inventory/items', data: res4 });
  console.log(`  ➔ Selesai: ${res4.requests.average.toFixed(0)} req/s, p95: ${res4.latency.p95}ms\n`);

  // Summary Table
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log(' 📊 RINGKASAN HASIL BENCHMARK ERPQu');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log(
    '| Skenario Pengujian            | Req/Sec (Avg) | Latency Avg | p50 (ms) | p90 (ms) | p99 (ms) | Total Req | Errors |'
  );
  console.log(
    '|:------------------------------|--------------:|------------:|---------:|---------:|---------:|----------:|-------:|'
  );

  for (const r of results) {
    const d = r.data;
    const pad = (s, len) => String(s).padEnd(len);
    const rpad = (s, len) => String(s).padStart(len);
    const name = pad(r.name, 30);
    const rps = rpad(d.requests.average.toFixed(0), 13);
    const latAvg = rpad(`${d.latency.average.toFixed(1)}ms`, 11);
    const p50 = rpad(`${d.latency.p50}ms`, 8);
    const p90 = rpad(`${d.latency.p90 || d.latency.p97_5}ms`, 8);
    const p99 = rpad(`${d.latency.p99}ms`, 8);
    const total = rpad(d.requests.total, 9);
    const errors = rpad(d.errors, 6);

    console.log(`| ${name}|${rps} |${latAvg} |${p50} |${p90} |${p99} |${total} |${errors} |`);
  }
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('Fatal Benchmark Error:', err);
  process.exit(1);
});
