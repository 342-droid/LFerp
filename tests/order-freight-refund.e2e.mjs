import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test, { after, before } from 'node:test';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5197;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const ORDER_ID = 'ORD-3212689201560682';

let server;
let browser;

function waitForPreview() {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + 10_000;
    function probe() {
      const req = http.get(`${ORIGIN}/__lferp_preview_health`, (res) => {
        res.resume();
        if (res.statusCode === 200) {
          resolve();
          return;
        }
        retry();
      });
      req.on('error', retry);
      req.setTimeout(500, () => {
        req.destroy();
        retry();
      });
    }
    function retry() {
      if (Date.now() >= deadline) {
        reject(new Error('LFerp preview did not become ready'));
        return;
      }
      setTimeout(probe, 100);
    }
    probe();
  });
}

before(async () => {
  server = spawn(process.execPath, ['tools/preview-server.mjs'], {
    cwd: ROOT,
    env: { ...process.env, LFERP_PREVIEW_PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  await waitForPreview();
  browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome', headless: true });
});

after(async () => {
  if (browser) await browser.close();
  if (server && !server.killed) server.kill('SIGTERM');
});

async function openProxyPage() {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(`${ORIGIN}/MDM/mdm_order_proxy.html`);
  return page;
}

test('eligible proxy order opens an order-level freight refund drawer', async () => {
  const page = await openProxyPage();
  const row = page.locator(`tr[data-order-id="${ORDER_ID}"]`);
  const entry = row.getByRole('button', { name: '退运费', exact: true });

  assert.equal(await entry.count(), 1);
  await entry.click();

  const drawer = page.locator('#orderFreightRefundDrawer');
  await drawer.waitFor({ state: 'visible' });
  assert.equal(await drawer.getByRole('heading', { name: '退运费' }).count(), 1);
  assert.equal(await drawer.locator('[data-freight-amount="original"]').textContent(), '¥10.00');
  assert.equal(await drawer.locator('[data-freight-amount="refunded"]').textContent(), '¥4.00');
  assert.equal(await drawer.locator('[data-freight-amount="remaining"]').textContent(), '¥6.00');
  assert.equal(await drawer.locator('#orderFreightRefundAmount').inputValue(), '6.00');
  assert.equal(await drawer.locator('.order-as-product-list').count(), 0);

  await page.close();
});

test('freight refund rejects overflow and accumulates without changing goods aftersale state', async () => {
  const page = await openProxyPage();
  const row = page.locator(`tr[data-order-id="${ORDER_ID}"]`);
  const beforeGoodsTag = await page.evaluate((orderId) => {
    return window.OrderLiveDetail.resolveDetail(orderId).goods[0].aftersaleTag;
  }, ORDER_ID);

  await row.getByRole('button', { name: '退运费', exact: true }).click();
  await page.locator('#orderFreightRefundAmount').fill('7');
  await page.locator('#orderFreightRefundReason').selectOption('平台补偿');
  await page.locator('#orderFreightRefundDesc').fill('配送体验补偿');
  await page.locator('[data-freight-submit]').click();

  assert.equal(
    await page.locator('#orderFreightRefundError').textContent(),
    '本次退运费不能超过剩余可退运费 ¥6.00'
  );

  await page.locator('#orderFreightRefundAmount').fill('2');
  await page.locator('[data-freight-submit]').click();
  await page.locator('#orderFreightRefundDrawer').waitFor({ state: 'detached' });

  const summary = await page.evaluate((orderId) => window.OrderFreightRefund.getSummary(orderId), ORDER_ID);
  assert.deepEqual(
    { original: summary.original, refunded: summary.refunded, remaining: summary.remaining },
    { original: 10, refunded: 6, remaining: 4 }
  );
  const afterGoodsTag = await page.evaluate((orderId) => {
    return window.OrderLiveDetail.resolveDetail(orderId).goods[0].aftersaleTag;
  }, ORDER_ID);
  assert.equal(afterGoodsTag, beforeGoodsTag);

  await row.getByRole('link', { name: '查看', exact: true }).click();
  const detail = page.locator('#orderDetailDrawer');
  await detail.waitFor({ state: 'visible' });
  assert.match(await detail.locator('.order-detail-amount-foot').textContent(), /累计退运费 ¥6\.00/);
  await detail.getByRole('button', { name: '售后明细' }).click();
  const freightAftersale = detail.locator('tr[data-aftersale-type="退运费"]');
  assert.equal(await freightAftersale.count(), 1);
  assert.match(await freightAftersale.textContent(), /¥2\.00/);

  await page.close();
});
