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
  await page.evaluate(() => {
    const reasons = window.MdmAftersaleReasons;
    const original = reasons.getReasonList;
    window.__freightRefundReasonTypes = [];
    reasons.getReasonList = function (...args) {
      window.__freightRefundReasonTypes.push(args[0]);
      return original.apply(this, args);
    };
  });

  assert.equal(await entry.count(), 1);
  await entry.click();

  const drawer = page.locator('#orderFreightRefundDrawer');
  await drawer.waitFor({ state: 'visible' });
  assert.equal(await drawer.getByRole('heading', { name: '退运费' }).count(), 1);
  assert.equal(await drawer.locator('[data-freight-amount="original"]').textContent(), '¥10.00');
  assert.equal(await drawer.locator('[data-freight-amount="refunded"]').textContent(), '¥4.00');
  assert.equal(await drawer.locator('[data-freight-amount="remaining"]').textContent(), '¥6.00');
  assert.equal(await drawer.locator('#orderFreightRefundAmount').inputValue(), '6.00');
  assert.equal(await drawer.locator('input[readonly]').inputValue(), '支付宝（原路退回）');
  assert.equal(await drawer.locator('.order-as-product-list').count(), 0);
  assert.deepEqual(await page.evaluate(() => window.__freightRefundReasonTypes), ['退运费']);

  await page.close();
});

test('freight refund reuses the existing aftersale drawer shell', async () => {
  const page = await openProxyPage();
  const row = page.locator(`tr[data-order-id="${ORDER_ID}"]`);

  await row.getByRole('button', { name: '发起售后', exact: true }).click();
  const aftersaleDrawer = page.locator('#orderPlatformAsDrawer');
  await aftersaleDrawer.waitFor({ state: 'visible' });
  const aftersaleMetrics = await aftersaleDrawer.evaluate((element) => ({
    width: element.getBoundingClientRect().width,
    headerHeight: element.querySelector('.store-drawer__header')?.getBoundingClientRect().height,
    bodyPadding: getComputedStyle(element.querySelector('.store-drawer__body')).padding,
    footerHeight: element.querySelector('.order-as-drawer__footer')?.getBoundingClientRect().height
  }));
  await page.locator('[data-as-close]').click();

  await row.getByRole('button', { name: '退运费', exact: true }).click();
  const freightDrawer = page.locator('#orderFreightRefundDrawer');
  await freightDrawer.waitFor({ state: 'visible' });
  assert.equal(await freightDrawer.locator('.order-as-occur').count(), 1);
  assert.equal(await freightDrawer.locator('.order-as-item').count(), 1);
  assert.equal(await freightDrawer.locator('.order-as-drawer__footer').count(), 1);
  const freightMetrics = await freightDrawer.evaluate((element) => ({
    width: element.getBoundingClientRect().width,
    headerHeight: element.querySelector('.store-drawer__header')?.getBoundingClientRect().height,
    bodyPadding: getComputedStyle(element.querySelector('.store-drawer__body')).padding,
    footerHeight: element.querySelector('.order-as-drawer__footer')?.getBoundingClientRect().height
  }));
  assert.ok(Math.abs(freightMetrics.width - aftersaleMetrics.width) < 0.5);
  assert.deepEqual(
    {
      headerHeight: freightMetrics.headerHeight,
      bodyPadding: freightMetrics.bodyPadding,
      footerHeight: freightMetrics.footerHeight
    },
    {
      headerHeight: aftersaleMetrics.headerHeight,
      bodyPadding: aftersaleMetrics.bodyPadding,
      footerHeight: aftersaleMetrics.footerHeight
    }
  );

  await page.close();
});

test('freight refund drawer manages dialog focus and Escape consistently', async () => {
  const page = await openProxyPage();
  const row = page.locator(`tr[data-order-id="${ORDER_ID}"]`);
  const entry = row.getByRole('button', { name: '退运费', exact: true });

  await entry.click();
  const drawer = page.locator('#orderFreightRefundDrawer');
  await drawer.waitFor({ state: 'visible' });
  assert.equal(await drawer.getAttribute('aria-modal'), 'true');
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'orderFreightRefundAmount');

  await page.keyboard.press('Escape');
  await drawer.waitFor({ state: 'detached' });
  assert.equal(
    await page.evaluate(() => document.activeElement?.textContent.trim()),
    '退运费'
  );

  await page.close();
});

test('freight refund rejects overflow and creates a pending Alipay aftersale without changing settled amounts', async () => {
  const page = await openProxyPage();
  const row = page.locator(`tr[data-order-id="${ORDER_ID}"]`);
  const before = await page.evaluate((orderId) => {
    const detail = window.OrderLiveDetail.resolveDetail(orderId);
    return {
      goodsTag: detail.goods[0].aftersaleTag,
      refund: detail.amounts.refund,
      merchant: detail.amounts.merchant
    };
  }, ORDER_ID);

  await row.getByRole('button', { name: '退运费', exact: true }).click();
  await page.locator('#orderFreightRefundAmount').fill('7');
  await page.locator('#orderFreightRefundReason').selectOption('退运费');
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
    {
      original: summary.original,
      refunded: summary.refunded,
      pending: summary.pending,
      remaining: summary.remaining
    },
    { original: 10, refunded: 4, pending: 2, remaining: 4 }
  );
  const after = await page.evaluate((orderId) => {
    const detail = window.OrderLiveDetail.resolveDetail(orderId);
    const aftersale = detail.aftersales.find((item) => item.type === '退运费');
    return {
      goodsTag: detail.goods[0].aftersaleTag,
      refund: detail.amounts.refund,
      merchant: detail.amounts.merchant,
      aftersale
    };
  }, ORDER_ID);
  assert.equal(after.goodsTag, before.goodsTag);
  assert.equal(after.refund, before.refund);
  assert.equal(after.merchant, before.merchant);
  assert.equal(after.aftersale.status, '退款中');
  assert.equal(after.aftersale.refundAlipay, '¥2.00');
  assert.equal(after.aftersale.refundWechat, '¥0.00');
  assert.equal(after.aftersale.refundWallet, '¥0.00');

  await row.getByRole('link', { name: '查看', exact: true }).click();
  const detail = page.locator('#orderDetailDrawer');
  await detail.waitFor({ state: 'visible' });
  assert.match(await detail.locator('.order-detail-amount-foot').textContent(), /累计退运费 ¥4\.00/);
  await detail.getByRole('button', { name: '售后明细' }).click();
  const freightAftersale = detail.locator('tr[data-aftersale-type="退运费"]');
  assert.equal(await freightAftersale.count(), 1);
  assert.match(await freightAftersale.textContent(), /退款中/);
  assert.equal(await freightAftersale.locator('td').nth(5).textContent(), '¥2.00');
  assert.equal(await freightAftersale.locator('td').nth(6).textContent(), '¥0.00');

  await page.close();
});

test('submitted freight refund is available in the global aftersale list', async () => {
  const page = await openProxyPage();
  const row = page.locator(`tr[data-order-id="${ORDER_ID}"]`);

  await row.getByRole('button', { name: '退运费', exact: true }).click();
  await page.locator('#orderFreightRefundAmount').fill('2');
  await page.locator('#orderFreightRefundReason').selectOption('退运费');
  await page.locator('#orderFreightRefundDesc').fill('配送体验补偿');
  await page.locator('[data-freight-submit]').click();
  await page.locator('#orderFreightRefundDrawer').waitFor({ state: 'detached' });

  await page.goto(`${ORIGIN}/MDM/mdm_aftersale_ticket.html`);
  assert.equal(await page.locator('#asType option[value="退运费"]').count(), 1);
  await page.locator('#asOrderNo').fill(ORDER_ID);
  await page.locator('#asTicketQuery').click();

  const aftersaleRow = page.locator('#asTicketTableBody tr');
  assert.equal(await aftersaleRow.count(), 1);
  assert.equal(await aftersaleRow.getAttribute('data-order-no'), ORDER_ID);
  assert.equal(await aftersaleRow.getAttribute('data-type'), '退运费');
  assert.equal(await aftersaleRow.getAttribute('data-status'), '退款中');
  assert.equal(await aftersaleRow.getAttribute('data-order-source'), '代采');
  assert.equal(await aftersaleRow.getAttribute('data-apply-amount'), '2.00');
  assert.equal(await aftersaleRow.getAttribute('data-refund-exec'), '退款执行中');
  assert.match(await aftersaleRow.textContent(), /运营代用户发起/);

  await aftersaleRow.getByRole('link', { name: '查看详情', exact: true }).click();
  await page.locator('#asDetailBody').waitFor({ state: 'visible' });
  const detailBody = page.locator('#asDetailBody');
  assert.match(await detailBody.textContent(), new RegExp(ORDER_ID));
  assert.match(await detailBody.textContent(), /退运费/);
  assert.match(await detailBody.textContent(), /本次退运费¥2\.00/);
  assert.match(await detailBody.textContent(), /退款渠道支付宝/);
  assert.equal(await detailBody.locator('.aftersale-goods-table').count(), 0);

  await page.close();
});
