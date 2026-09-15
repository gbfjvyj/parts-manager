const fs = require('fs');
const crypto = require('crypto');
const zlib = require('zlib');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;
const privateKey = process.env.APP_UPDATE_PRIVATE_KEY || (
  process.env.APP_UPDATE_PRIVATE_KEY_FILE
    ? fs.readFileSync(process.env.APP_UPDATE_PRIVATE_KEY_FILE, 'utf8')
    : ''
);
const version = process.env.APP_UPDATE_VERSION || String(Date.now());

if (!url || !key || !privateKey) {
  throw new Error('SUPABASE_URL、SUPABASE_ANON_KEY 和更新私钥不能为空');
}

const html = fs.readFileSync('index.html');
const htmlGzipBase64 = zlib.gzipSync(html, { level: 9 }).toString('base64');
const sha256 = crypto.createHash('sha256').update(html).digest('hex');
const signature = crypto.sign(
  'RSA-SHA256',
  Buffer.from(`${version}\n${sha256}`, 'utf8'),
  privateKey
).toString('base64');

const rows = [
  { key: 'webBundleVersion', value: version },
  { key: 'webBundleGzip', value: htmlGzipBase64 },
  { key: 'webBundleSha256', value: sha256 },
  { key: 'webBundleSignature', value: signature }
];

async function upsert(row) {
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal'
  };
  const filter = `app_config?key=eq.${encodeURIComponent(row.key)}`;
  let response = await fetch(`${url}/rest/v1/${filter}`, {
    method: 'PATCH', headers, body: JSON.stringify({ value: row.value })
  });
  if (!response.ok) throw new Error(`${row.key} 更新失败：${await response.text()}`);

  response = await fetch(`${url}/rest/v1/app_config?key=eq.${encodeURIComponent(row.key)}`, { headers });
  const existing = response.ok ? await response.json() : [];
  if (existing.length) return;

  response = await fetch(`${url}/rest/v1/app_config`, {
    method: 'POST', headers, body: JSON.stringify(row)
  });
  if (!response.ok) throw new Error(`${row.key} 创建失败：${await response.text()}`);
}

(async () => {
  // 最后发布版本号，防止 App 读到尚未上传完整的网页包。
  for (const row of rows.slice(1)) await upsert(row);
  await upsert(rows[0]);
  console.log(`已发布网页更新 ${version} (${sha256})`);
})().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
