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
  assert.equal(await drawer.locator('[data-freight-amount="pending"]').textContent(), '¥0.00');
  assert.equal(await drawer.locator('[data-freight-amount="refunded"]').textContent(), '¥4.00');
  assert.equal(await drawer.locator('[data-freight-amount="remaining"]').textContent(), '¥6.00');
  assert.equal(await drawer.locator('#orderFreightRefundAmount').inputValue(), '6.00');
  assert.equal(await drawer.locator('input[name="aftersaleType"]').inputValue(), '仅退款');
  assert.equal(await drawer.locator('#orderFreightRefundReason').inputValue(), '退运费');
  assert.equal(await drawer.locator('#orderFreightRefundReason').getAttribute('readonly'), '');
  assert.equal(await drawer.locator('input[name="refundChannel"]').inputValue(), '支付宝（原路退回）');
  assert.equal(await drawer.locator('.order-as-product-list').count(), 0);
  assert.equal(await drawer.locator('#orderFreightRefundConfirm').isChecked(), false);
  assert.equal(await drawer.locator('[data-freight-submit]').isDisabled(), true);
  assert.match(
    await drawer.locator('.order-freight-refund-confirm').textContent(),
    /提交后将生成退款单，退款成功后不可撤回/
  );
  await page.close();
});

test('cautious confirmation gates submit and the drawer footer stays in the viewport', async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`${ORIGIN}/MDM/mdm_order_proxy.html`);
  const row = page.locator(`tr[data-order-id="${ORDER_ID}"]`);

  await row.getByRole('button', { name: '退运费', exact: true }).click();
  const drawer = page.locator('#orderFreightRefundDrawer');
  const submit = drawer.locator('[data-freight-submit]');
  const confirm = drawer.locator('#orderFreightRefundConfirm');
  await drawer.locator('#orderFreightRefundAmount').fill('2');
  await drawer.locator('#orderFreightRefundDesc').fill('配送体验补偿');

  assert.equal(await submit.isDisabled(), true);
  await confirm.check();
  assert.equal(await submit.isDisabled(), false);

  await drawer.locator('#orderFreightRefundAmount').fill('7');
  assert.equal(await submit.isDisabled(), true);
  assert.equal(
    await drawer.locator('#orderFreightRefundError').textContent(),
    '本次退运费不能超过剩余可退运费 ¥6.00'
  );

  const layout = await drawer.evaluate((element) => {
    const body = element.querySelector('.order-as-drawer__body');
    const footer = element.querySelector('.order-as-drawer__footer');
    const drawerRect = element.getBoundingClientRect();
    const footerRect = footer.getBoundingClientRect();
    return {
      drawerBottom: Math.round(drawerRect.bottom),
      footerBottom: Math.round(footerRect.bottom),
      viewportHeight: window.innerHeight,
      bodyOverflowY: getComputedStyle(body).overflowY,
      footerPosition: getComputedStyle(footer).position
    };
  });
  assert.equal(layout.drawerBottom, layout.viewportHeight);
  assert.equal(layout.footerBottom, layout.viewportHeight);
  assert.equal(layout.bodyOverflowY, 'auto');
  assert.equal(layout.footerPosition, 'sticky');

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
      paid: detail.amounts.paid,
      refund: detail.amounts.refund,
      merchant: detail.amounts.merchant
    };
  }, ORDER_ID);

  await row.getByRole('button', { name: '退运费', exact: true }).click();
  await page.locator('#orderFreightRefundAmount').fill('7');
  await page.locator('#orderFreightRefundDesc').fill('配送体验补偿');
  await page.locator('#orderFreightRefundConfirm').check();

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
    const aftersale = detail.aftersales.find((item) => item.refundScene === 'ORDER_FREIGHT');
    return {
      goodsTag: detail.goods[0].aftersaleTag,
      paid: detail.amounts.paid,
      refund: detail.amounts.refund,
      merchant: detail.amounts.merchant,
      aftersale
    };
  }, ORDER_ID);
  assert.equal(after.goodsTag, before.goodsTag);
  assert.equal(after.paid, before.paid);
  assert.equal(after.refund, before.refund);
  assert.equal(after.merchant, before.merchant);
  assert.equal(after.aftersale.type, '仅退款');
  assert.equal(after.aftersale.reason, '退运费');
  assert.equal(after.aftersale.refundScene, 'ORDER_FREIGHT');
  assert.equal(after.aftersale.status, '退款中');
  assert.equal(after.aftersale.refundAlipay, '¥2.00');
  assert.equal(after.aftersale.refundWechat, '¥0.00');
  assert.equal(after.aftersale.refundWallet, '¥0.00');

  await row.getByRole('link', { name: '查看', exact: true }).click();
  const detail = page.locator('#orderDetailDrawer');
  await detail.waitFor({ state: 'visible' });
  assert.match(await detail.locator('.order-detail-amount-row--paid').textContent(), /买家实付¥25\.00/);
  assert.equal(await detail.locator('.order-detail-freight-ledger').count(), 0);
  const refundToggle = detail.locator('.order-detail-refund-toggle');
  assert.equal(await refundToggle.getAttribute('aria-expanded'), 'false');
  assert.match(await detail.locator('.order-detail-refund-line').textContent(), /退款¥4\.00/);
  await refundToggle.click();
  const refundBreakdown = detail.locator('.order-detail-refund-breakdown');
  assert.equal(await refundToggle.getAttribute('aria-expanded'), 'true');
  assert.match(await refundBreakdown.textContent(), /商品退款¥0\.00/);
  assert.match(await refundBreakdown.textContent(), /运费退还¥4\.00/);
  assert.match(await refundBreakdown.textContent(), /退款处理中¥2\.00/);
  assert.match(await refundBreakdown.textContent(), /处理中金额不计入退款合计/);
  await detail.getByRole('button', { name: '售后明细' }).click();
  const freightAftersale = detail.locator(
    'tr[data-aftersale-type="仅退款"][data-refund-scene="ORDER_FREIGHT"]'
  );
  assert.equal(await freightAftersale.count(), 1);
  assert.match(await freightAftersale.textContent(), /订单运费/);
  assert.match(await freightAftersale.textContent(), /仅退款/);
  assert.match(await freightAftersale.textContent(), /退款中/);
  assert.match(await freightAftersale.textContent(), /关联售后单/);
  assert.match(await freightAftersale.locator('a[data-freight-aftersale-link]').getAttribute('href'), /mdm_aftersale_ticket_detail\.html/);
  assert.equal(await freightAftersale.locator('td').nth(5).textContent(), '¥2.00');
  assert.equal(await freightAftersale.locator('td').nth(6).textContent(), '¥0.00');

  await page.close();
});

test('submitted freight refund is available in the global aftersale list', async () => {
  const page = await openProxyPage();
  const row = page.locator(`tr[data-order-id="${ORDER_ID}"]`);

  await row.getByRole('button', { name: '退运费', exact: true }).click();
  await page.locator('#orderFreightRefundAmount').fill('2');
  await page.locator('#orderFreightRefundDesc').fill('配送体验补偿');
  await page.locator('#orderFreightRefundConfirm').check();
  await page.locator('[data-freight-submit]').click();
  await page.locator('#orderFreightRefundDrawer').waitFor({ state: 'detached' });

  await page.goto(`${ORIGIN}/MDM/mdm_aftersale_ticket.html`);
  assert.equal(await page.locator('#asType option[value="退运费"]').count(), 0);
  await page.locator('#asOrderNo').fill(ORDER_ID);
  await page.locator('#asTicketQuery').click();

  const aftersaleRow = page.locator('#asTicketTableBody tr');
  assert.equal(await aftersaleRow.count(), 1);
  assert.equal(await aftersaleRow.getAttribute('data-order-no'), ORDER_ID);
  assert.equal(await aftersaleRow.getAttribute('data-type'), '仅退款');
  assert.equal(await aftersaleRow.getAttribute('data-refund-scene'), 'ORDER_FREIGHT');
  assert.equal(await aftersaleRow.getAttribute('data-status'), '退款中');
  assert.equal(await aftersaleRow.getAttribute('data-order-source'), '代采');
  assert.equal(await aftersaleRow.getAttribute('data-apply-amount'), '2.00');
  assert.equal(await aftersaleRow.getAttribute('data-refund-exec'), '退款执行中');
  assert.match(await aftersaleRow.textContent(), /运营代用户发起/);
  assert.match(await aftersaleRow.textContent(), /仅退款/);
  assert.match(await aftersaleRow.textContent(), /退运费/);

  await aftersaleRow.getByRole('link', { name: '查看详情', exact: true }).click();
  await page.locator('#asDetailBody').waitFor({ state: 'visible' });
  const detailBody = page.locator('#asDetailBody');
  assert.match(await detailBody.textContent(), new RegExp(ORDER_ID));
  assert.match(await detailBody.textContent(), /申请类型仅退款/);
  assert.match(await detailBody.textContent(), /退款原因退运费/);
  assert.match(await detailBody.textContent(), /本次退运费¥2\.00/);
  assert.match(await detailBody.textContent(), /退款渠道支付宝/);
  assert.match(await detailBody.textContent(), /退款单已生成/);
  assert.match(await detailBody.textContent(), /运营提交后生成/);
  assert.match(await detailBody.textContent(), /原路退回/);
  const progressItems = detailBody.locator('.aftersale-timeline__item');
  assert.match(await progressItems.nth(2).textContent(), /发起退款/);
  assert.match(await progressItems.nth(2).getAttribute('class'), /is-current/);
  assert.match(await progressItems.nth(3).textContent(), /退款成功/);
  assert.equal(
    await progressItems.nth(3).locator('.aftersale-timeline__dot--hollow').count(),
    1
  );
  const originalOrderLink = detailBody.locator('[data-original-order-link]');
  assert.match(await originalOrderLink.textContent(), new RegExp(ORDER_ID));
  assert.match(await originalOrderLink.getAttribute('href'), /mdm_order_proxy\.html\?orderNo=/);
  assert.equal(await detailBody.locator('.aftersale-goods-table').count(), 0);
  assert.equal(
    await detailBody.locator('.aftersale-detail-card__title', { hasText: '审批信息' }).count(),
    0
  );

  await Promise.all([page.waitForLoadState('domcontentloaded'), originalOrderLink.click()]);
  await page.waitForFunction(
    () => window.OrderFreightRefund && window.OrderLiveDetail && window.OrderProxyList
  );
  const linkedOrderSummary = await page.evaluate(
    (orderId) => window.OrderFreightRefund.getSummary(orderId),
    ORDER_ID
  );
  assert.deepEqual(
    {
      original: linkedOrderSummary.original,
      refunded: linkedOrderSummary.refunded,
      pending: linkedOrderSummary.pending,
      remaining: linkedOrderSummary.remaining
    },
    { original: 10, refunded: 4, pending: 2, remaining: 4 }
  );

  await page.close();
});
