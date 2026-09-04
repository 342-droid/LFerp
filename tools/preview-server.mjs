/**
 * LFerp 本地预览服务（替代 npx serve）
 * - 固定端口 5173，同时监听 127.0.0.1 与 ::1（浏览器访问 localhost 常走 IPv6）
 * - 支持无 .html 后缀访问（cleanUrls）
 * - 不监听文件变更，避免 Windows 上 EMFILE / 进程无故退出
 * - 端口被非健康进程占用时：回收本机 node 占用后重绑
 * - --ensure：已健康则立刻退出；否则拉起独立守护进程，等健康后退出（避免被代理超时杀掉）
 * - --watch：打开仓库后常驻，健康丢失时自动抢回端口
 *
 * 用法：
 *   node tools/preview-server.mjs
 *   node tools/preview-server.mjs --ensure
 *   node tools/preview-server.mjs --watch
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';
import { execFileSync, spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.LFERP_PREVIEW_PORT || 5173);
const HOST_OVERRIDE = process.env.LFERP_PREVIEW_HOST || '';
const BIND_HOSTS = HOST_OVERRIDE ? [HOST_OVERRIDE] : ['127.0.0.1', '::1'];
const ENSURE = process.argv.includes('--ensure');
const WATCH = process.argv.includes('--watch');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8'
};

let servers = [];

function contentType(filePath) {
  return MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function safeJoin(root, reqPath) {
  const decoded = decodeURIComponent(reqPath.split('?')[0].split('#')[0] || '/');
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const full = path.join(root, normalized);
  if (!full.startsWith(root)) return null;
  return full;
}

function resolveFile(urlPath) {
  let target = safeJoin(ROOT, urlPath);
  if (!target) return null;

  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    const indexHtml = path.join(target, 'index.html');
    if (fs.existsSync(indexHtml)) return indexHtml;
  }

  if (fs.existsSync(target) && fs.statSync(target).isFile()) return target;

  /* cleanUrls：/MDM/foo → /MDM/foo.html */
  if (!path.extname(target)) {
    const withHtml = target + '.html';
    if (fs.existsSync(withHtml) && fs.statSync(withHtml).isFile()) return withHtml;
  }

  return null;
}

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
}

function createAppServer() {
  return http.createServer(function (req, res) {
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        send(res, 405, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Method Not Allowed');
        return;
      }

      const urlPath = (req.url || '/').split('?')[0] || '/';
      if (urlPath === '/__lferp_preview_health') {
        send(
          res,
          200,
          { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
          JSON.stringify({ ok: true, root: ROOT, port: PORT, hosts: BIND_HOSTS })
        );
        return;
      }

      let filePath = resolveFile(urlPath === '/' ? '/index.html' : urlPath);
      if (!filePath) {
        send(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Not Found: ' + urlPath);
        return;
      }

      const data = fs.readFileSync(filePath);
      const headers = {
        'Content-Type': contentType(filePath),
        'Cache-Control': 'no-cache'
      };
      if (req.method === 'HEAD') {
        send(res, 200, headers, '');
        return;
      }
      send(res, 200, headers, data);
    } catch (err) {
      send(res, 500, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Server Error');
      console.error('[lferp-preview]', err);
    }
  });
}

function sleep(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

function probeHost(host) {
  return new Promise(function (resolve) {
    const opts = {
      host: host,
      port: PORT,
      path: '/__lferp_preview_health',
      timeout: 1500
    };
    if (host.includes(':')) opts.family = 6;
    const req = http.get(opts, function (res) {
      let buf = '';
      res.on('data', function (c) { buf += c; });
      res.on('end', function () {
        try {
          const json = JSON.parse(buf);
          resolve(!!(json && json.ok));
        } catch (e) {
          resolve(res.statusCode === 200);
        }
      });
    });
    req.on('error', function () { resolve(false); });
    req.on('timeout', function () {
      req.destroy();
      resolve(false);
    });
  });
}

async function probeHealth() {
  for (let i = 0; i < BIND_HOSTS.length; i++) {
    if (await probeHost(BIND_HOSTS[i])) return true;
  }
  if (await probeHost('127.0.0.1')) return true;
  return false;
}

function portFree(host) {
  return new Promise(function (resolve) {
    const tester = net.createServer()
      .once('error', function () { resolve(false); })
      .once('listening', function () {
        tester.close(function () { resolve(true); });
      })
      .listen(PORT, host);
  });
}

function listListenPids() {
  const pids = new Set();
  try {
    const out = execFileSync('netstat', ['-ano', '-p', 'tcp'], {
      encoding: 'utf8',
      windowsHide: true
    });
    const re = new RegExp('[:\\]]' + PORT + '\\s+\\S+\\s+(?:LISTENING|侦听)\\s+(\\d+)', 'gi');
    let m;
    while ((m = re.exec(out))) pids.add(Number(m[1]));
  } catch (e) {
    /* ignore */
  }
  pids.delete(process.pid);
  pids.delete(0);
  return Array.from(pids);
}

function processImage(pid) {
  try {
    const out = execFileSync('tasklist', ['/FI', 'PID eq ' + pid, '/FO', 'CSV', '/NH'], {
      encoding: 'utf8',
      windowsHide: true
    });
    return (out.split(',')[0] || '').replace(/"/g, '').trim().toLowerCase();
  } catch (e) {
    return '';
  }
}

function reclaimStale() {
  const pids = listListenPids();
  for (let i = 0; i < pids.length; i++) {
    const pid = pids[i];
    const name = processImage(pid);
    if (name === 'node.exe' || name === 'node') {
      console.warn('[lferp-preview] reclaim stale ' + name + ' pid=' + pid);
      try {
        execFileSync('taskkill', ['/PID', String(pid), '/F'], { windowsHide: true, stdio: 'ignore' });
      } catch (e) {
        /* ignore */
      }
    } else if (name) {
      console.error('[lferp-preview] 端口 ' + PORT + ' 被 ' + name + ' pid=' + pid + ' 占用（非 node，未回收）');
    }
  }
}

function listenOne(host) {
  return new Promise(function (resolve, reject) {
    const server = createAppServer();
    const skipIpv6 = host === '::1' && !HOST_OVERRIDE;
    function onError(err) {
      server.off('listening', onListen);
      if (skipIpv6) {
        console.warn('[lferp-preview] skip IPv6 ::1: ' + err.message);
        resolve(null);
        return;
      }
      reject(err);
    }
    function onListen() {
      server.off('error', onError);
      resolve(server);
    }
    server.once('error', onError);
    server.once('listening', onListen);
    server.listen(PORT, host);
  });
}

async function listenDual() {
  const bound = [];
  for (let i = 0; i < BIND_HOSTS.length; i++) {
    const server = await listenOne(BIND_HOSTS[i]);
    if (server) bound.push(server);
  }
  if (!bound.length) throw new Error('listen failed on ' + BIND_HOSTS.join(', '));
  servers = servers.concat(bound);
  return bound;
}

function logReady() {
  console.log('LFerp preview ready');
  console.log('  root: http://127.0.0.1:' + PORT + '/');
  console.log('  page: http://127.0.0.1:' + PORT + '/MDM/mdm_member_level_rule');
  console.log('  原型生成清单: http://127.0.0.1:' + PORT + '/prototype-gen');
  console.log('  also: http://localhost:' + PORT + '/');
}

function spawnDaemon() {
  const child = spawn(process.execPath, [SELF], {
    cwd: ROOT,
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
    env: process.env
  });
  child.unref();
  console.log('[lferp-preview] spawned daemon pid=' + child.pid);
}

async function waitHealthy(ms) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (await probeHealth()) return true;
    await sleep(250);
  }
  return probeHealth();
}

async function recoverPort() {
  if (await probeHealth()) return;
  if (!(await portFree(BIND_HOSTS[0] || '127.0.0.1'))) {
    reclaimStale();
    await sleep(400);
  }
}

function shutdown() {
  const pending = servers.map(function (s) {
    return new Promise(function (resolve) {
      s.close(function () { resolve(); });
    });
  });
  Promise.all(pending).finally(function () { process.exit(0); });
}

async function ensureMain() {
  await recoverPort();
  if (await probeHealth()) {
    logReady();
    process.exit(0);
  }
  spawnDaemon();
  if (await waitHealthy(10000)) {
    logReady();
    process.exit(0);
  }
  console.error('[lferp-preview] 无法在端口 ' + PORT + ' 拉起预览服务');
  process.exit(1);
}

async function watchMain() {
  let announced = false;
  for (;;) {
    try {
      if (await probeHealth()) {
        if (!announced) {
          logReady();
          announced = true;
        }
      } else {
        announced = false;
        await recoverPort();
        if (!(await probeHealth())) {
          await listenDual();
          logReady();
          announced = true;
        }
      }
    } catch (err) {
      console.error('[lferp-preview]', err && err.message ? err.message : err);
    }
    await sleep(4000);
  }
}

async function serveMain() {
  await recoverPort();
  if (await probeHealth()) {
    logReady();
    console.log('(another healthy preview owns the port; this process will exit)');
    process.exit(0);
  }
  await listenDual();
  logReady();
  console.log('  stop: Ctrl+C');
}

async function main() {
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  if (ENSURE) return ensureMain();
  if (WATCH) return watchMain();
  return serveMain();
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
