/**
 * LFerp 本地预览服务（替代 npx serve）
 * - 固定端口 5173
 * - 支持无 .html 后缀访问（cleanUrls）
 * - 不监听文件变更，避免 Windows 上 EMFILE / 进程无故退出
 * - 端口已被健康服务占用时：--ensure 直接成功退出；否则提示后退出
 *
 * 用法：
 *   node tools/preview-server.mjs
 *   node tools/preview-server.mjs --ensure
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.LFERP_PREVIEW_PORT || 5173);
const HOST = process.env.LFERP_PREVIEW_HOST || '127.0.0.1';
const ENSURE = process.argv.includes('--ensure');

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
          JSON.stringify({ ok: true, root: ROOT, port: PORT })
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

function probeHealth() {
  return new Promise(function (resolve) {
    const req = http.get(
      { host: HOST, port: PORT, path: '/__lferp_preview_health', timeout: 1500 },
      function (res) {
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
      }
    );
    req.on('error', function () { resolve(false); });
    req.on('timeout', function () {
      req.destroy();
      resolve(false);
    });
  });
}

function portFree() {
  return new Promise(function (resolve) {
    const tester = net.createServer()
      .once('error', function () { resolve(false); })
      .once('listening', function () {
        tester.close(function () { resolve(true); });
      })
      .listen(PORT, HOST);
  });
}

async function main() {
  const healthy = await probeHealth();
  if (healthy) {
    console.log('LFerp preview already running → http://' + HOST + ':' + PORT + '/');
    console.log('LFerp preview ready');
    if (ENSURE) process.exit(0);
    console.log('(another healthy preview owns the port; this process will exit)');
    process.exit(0);
  }

  const free = await portFree();
  if (!free) {
    console.error(
      '[lferp-preview] 端口 ' + PORT + ' 已被占用，且不是本预览服务。\n' +
      '请关闭占用进程后重试，或设置环境变量 LFERP_PREVIEW_PORT。'
    );
    process.exit(1);
  }

  const server = createAppServer();
  server.listen(PORT, HOST, function () {
    console.log('LFerp preview ready');
    console.log('  root: http://' + HOST + ':' + PORT + '/');
    console.log('  page: http://' + HOST + ':' + PORT + '/MDM/mdm_member_level_rule');
    console.log('  原型生成清单: http://' + HOST + ':' + PORT + '/prototype-gen');
    console.log('  stop: Ctrl+C');
  });

  server.on('error', function (err) {
    console.error('[lferp-preview] listen error:', err.message);
    process.exit(1);
  });

  function shutdown() {
    server.close(function () { process.exit(0); });
  }
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
