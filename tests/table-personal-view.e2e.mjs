import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test, { after, before } from 'node:test';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5199;
const ORIGIN = `http://127.0.0.1:${PORT}`;

let server;
let browser;

function waitForPreview() {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + 10_000;
    function retry() {
      if (Date.now() >= deadline) {
        reject(new Error('LFerp preview did not become ready'));
        return;
      }
      setTimeout(probe, 100);
    }
    function probe() {
      const req = http.get(`${ORIGIN}/__lferp_preview_health`, (res) => {
        res.resume();
        if (res.statusCode === 200) resolve();
        else retry();
      });
      req.on('error', retry);
      req.setTimeout(500, () => {
        req.destroy();
        retry();
      });
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

async function freshPage(pathname) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await page.goto(`${ORIGIN}${pathname}`);
  return { context, page };
}

test('the four synced lists expose separate filter and column settings entrances', async () => {
  const pages = [
    '/MDM/mdm_aftersale_ticket.html',
    '/MDM/mdm_order_retail.html',
    '/SCM/purchase_store_order_sheet.html',
    '/SCM/purchase_order.html'
  ];

  for (const pathname of pages) {
    const { context, page } = await freshPage(pathname);
    assert.equal(await page.getByRole('button', { name: /管理筛选项/ }).count(), 1, pathname);
    assert.equal(await page.getByRole('button', { name: '列设置', exact: true }).count(), 1, pathname);
    assert.deepEqual(
      await page.locator('[data-lf-personal-view] thead th').evaluateAll((headers) => headers
        .filter((header) => {
          const label = header.textContent.replace(/[?？]/g, '').trim();
          return !header.querySelector('input[type="checkbox"]') && label !== '序号' && label !== '#' && label !== '操作';
        })
        .filter((header) => !header.hasAttribute('data-preference-key'))
        .map((header) => header.textContent.trim())),
      [],
      pathname
    );
    if (pathname.includes('mdm_order_retail')) {
      assert.equal(await page.getByRole('button', { name: '管理筛选项 · 6', exact: true }).count(), 1);
    }
    await context.close();
  }
});

test('shared table view mounts when deployed below the repository base path', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await page.route('**/js/lf-table-personal-view.js*', (route) => route.abort());
  await page.goto(`${ORIGIN}/MDM/mdm_aftersale_ticket.html`);
  await page.evaluate(() => history.replaceState({}, '', '/LFerp/MDM/mdm_aftersale_ticket.html'));
  await page.addScriptTag({ path: path.join(ROOT, 'js', 'lf-table-personal-view.js') });

  assert.equal(await page.getByRole('button', { name: /管理筛选项/ }).count(), 1);
  assert.equal(await page.getByRole('button', { name: '列设置', exact: true }).count(), 1);
  await context.close();
});

test('filter draft previews order and visibility, cancel restores values, save persists layout only', async () => {
  const { context, page } = await freshPage('/MDM/mdm_aftersale_ticket.html');
  await page.locator('#asUserPhone').fill('13800000000');

  await page.getByRole('button', { name: /管理筛选项/ }).click();
  const drawer = page.getByRole('dialog', { name: '管理筛选项' });
  await drawer.locator('[data-lf-view-item="asorderno"]').dragTo(
    drawer.locator('[data-lf-view-item="asticketno"]')
  );
  await drawer.getByRole('checkbox', { name: '用户手机号', exact: true }).uncheck();
  assert.equal(await page.locator('#asUserPhone').inputValue(), '');
  assert.equal(await page.locator('#asUserPhone').isVisible(), false);
  assert.equal(await page.locator('#asTicketFilterGrid > .aftersale-filter-field').first().innerText(), '订单号');

  await drawer.getByRole('button', { name: '取消', exact: true }).click();
  assert.equal(await page.locator('#asUserPhone').inputValue(), '13800000000');
  assert.equal(await page.locator('#asUserPhone').isVisible(), true);
  assert.equal(await page.locator('#asTicketFilterGrid > .aftersale-filter-field').first().innerText(), '售后单号');

  await page.getByRole('button', { name: /管理筛选项/ }).click();
  await page.getByRole('dialog', { name: '管理筛选项' })
    .getByRole('checkbox', { name: '用户手机号', exact: true })
    .uncheck();
  await page.getByRole('dialog', { name: '管理筛选项' })
    .getByRole('button', { name: '保存视图', exact: true })
    .click();

  const preference = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((item) => item.includes('commerce.aftersale.list'));
    return key ? { key, value: localStorage.getItem(key) } : null;
  });
  assert.ok(preference);
  assert.doesNotMatch(preference.value, /13800000000/);

  await page.reload();
  assert.equal(await page.locator('#asUserPhone').isVisible(), false);
  await context.close();
});

test('column draft supports drag ordering, visibility and pin while header dragging owns width', async () => {
  const { context, page } = await freshPage('/MDM/mdm_aftersale_ticket.html');
  await page.getByRole('button', { name: '列设置', exact: true }).click();
  const drawer = page.getByRole('dialog', { name: '列设置' });

  assert.equal(await drawer.getByText('操作', { exact: true }).count(), 0);
  await drawer.locator('[data-lf-view-item="aftersalesource"]').dragTo(
    drawer.locator('[data-lf-view-item="aftersaleno"]')
  );
  await drawer.getByRole('checkbox', { name: '订单来源', exact: true }).uncheck();
  await drawer.locator('[data-lf-view-item="aftersalesource"]')
    .getByRole('button', { name: '固定左侧 售后来源', exact: true })
    .click();
  await drawer.getByRole('button', { name: '保存视图', exact: true }).click();

  const headers = page.locator('#asTicketTable thead th');
  assert.equal((await headers.nth(0).innerText()).trim(), '序号');
  assert.equal((await headers.nth(1).innerText()).trim(), '');
  assert.equal((await headers.nth(2).innerText()).trim(), '售后来源');
  assert.equal((await headers.nth(3).innerText()).trim(), '售后单号');
  assert.equal(await page.getByRole('columnheader', { name: '订单来源', exact: true }).isVisible(), false);
  assert.equal(
    await page.locator('#asTicketTableBody tr').first().locator('[data-lf-view-column-key="ordersource"]').isVisible(),
    false
  );
  assert.equal(
    await page.getByRole('columnheader', { name: '售后来源', exact: true }).evaluate((node) => node.style.position),
    'sticky'
  );

  const ticketHeader = page.getByRole('columnheader', { name: '售后单号', exact: true });
  const originalWidth = await ticketHeader.evaluate((node) => Number.parseInt(node.style.width, 10));
  const resizer = ticketHeader.locator('.lf-view-column-resizer');
  await resizer.dispatchEvent('pointerdown', { button: 0, buttons: 1, clientX: 200, pointerId: 1 });
  await page.locator('body').dispatchEvent('pointermove', { buttons: 1, clientX: 240, pointerId: 1 });
  await page.locator('body').dispatchEvent('pointerup', { button: 0, buttons: 0, clientX: 240, pointerId: 1 });
  await page.waitForTimeout(650);
  assert.equal(await ticketHeader.evaluate((node) => Number.parseInt(node.style.width, 10)), originalWidth + 40);

  await page.reload();
  assert.equal((await page.locator('#asTicketTable thead th').nth(2).innerText()).trim(), '售后来源');
  assert.equal(await page.getByRole('columnheader', { name: '订单来源', exact: true }).isVisible(), false);
  assert.equal(
    await page.getByRole('columnheader', { name: '售后单号', exact: true }).evaluate((node) => Number.parseInt(node.style.width, 10)),
    originalWidth + 40
  );
  await page.locator('#asTicketQuery').click();
  assert.equal(
    await page.locator('#asTicketTableBody tr').first().locator('[data-lf-view-column-key="ordersource"]').isVisible(),
    false
  );

  await page.getByRole('button', { name: '列设置', exact: true }).click();
  const restoredDrawer = page.getByRole('dialog', { name: '列设置' });
  await restoredDrawer.getByRole('button', { name: '恢复默认', exact: true }).click();
  await restoredDrawer.getByRole('button', { name: '保存视图', exact: true }).click();
  assert.equal((await page.locator('#asTicketTable thead th').nth(2).innerText()).trim(), '售后单号');
  assert.equal(
    await page.evaluate(() => Object.keys(localStorage).some((item) => item.includes('commerce.aftersale.list'))),
    false
  );
  await context.close();
});

test('preference drawers mirror the shared personal-view interaction instead of inventing width inputs', async () => {
  const { context, page } = await freshPage('/MDM/mdm_aftersale_ticket.html');

  await page.getByRole('button', { name: '列设置', exact: true }).click();
  const columnDrawer = page.getByRole('dialog', { name: '列设置' });
  assert.equal(await columnDrawer.getByText('个人视图', { exact: true }).count(), 1);
  assert.equal(
    await columnDrawer.getByText('仅影响你的个人视图，保存后可在其他设备恢复', { exact: true }).count(),
    1
  );
  assert.equal(await columnDrawer.getByText(/\d+\/ \d+ 列已显示/).count(), 1);
  assert.equal(await columnDrawer.getByText('固定左侧', { exact: true }).count(), 1);
  assert.equal(await columnDrawer.getByText('普通列', { exact: true }).count(), 1);
  assert.equal(await columnDrawer.getByText('固定右侧', { exact: true }).count(), 1);
  assert.equal(await columnDrawer.locator('input[type="number"]').count(), 0);
  assert.equal(await columnDrawer.locator('select').count(), 0);
  assert.equal(await columnDrawer.getByRole('button', { name: /上移|下移/ }).count(), 0);
  await columnDrawer.getByRole('button', { name: '取消', exact: true }).click();

  await page.getByRole('button', { name: /管理筛选项/ }).click();
  const filterDrawer = page.getByRole('dialog', { name: '管理筛选项' });
  assert.equal(await filterDrawer.getByText(/\d+\/ \d+ 个筛选项已显示/).count(), 1);
  assert.equal(await filterDrawer.getByText('固定左侧', { exact: true }).count(), 0);
  assert.equal(await filterDrawer.locator('[data-lf-view-item][draggable="true"]').count() > 0, true);
  await context.close();
});

test('existing preferences hide and mark newly introduced columns until explicitly acknowledged', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => {
    localStorage.setItem('lferp:table-personal-view:v1:commerce.aftersale.list', JSON.stringify({
      formatVersion: 1,
      columns: [{ key: 'aftersaleno', visible: true, order: 0, pin: 'none', width: 180 }]
    }));
  });
  const page = await context.newPage();
  await page.goto(`${ORIGIN}/MDM/mdm_aftersale_ticket.html`);

  assert.equal(await page.getByRole('columnheader', { name: '售后来源', exact: true }).isVisible(), false);
  assert.equal(await page.getByRole('button', { name: '列设置', exact: true }).getAttribute('title'), '已显示 1 列');
  await page.getByRole('button', { name: '列设置', exact: true }).click();
  const sourceRow = page.locator('[data-lf-view-item="aftersalesource"]');
  assert.match(await sourceRow.innerText(), /新增/);
  await context.close();
});

test('column settings keep one business column and stay open when persistence fails', async () => {
  const { context, page } = await freshPage('/MDM/mdm_aftersale_ticket.html');
  await page.getByRole('button', { name: '列设置', exact: true }).click();
  const drawer = page.getByRole('dialog', { name: '列设置' });
  const labels = await drawer.locator('[data-lf-view-visible]').evaluateAll((inputs) =>
    inputs.map((input) => input.getAttribute('aria-label'))
  );
  for (const label of labels.slice(1)) {
    await drawer.getByRole('checkbox', { name: label, exact: true }).uncheck();
  }
  await drawer.getByRole('checkbox', { name: labels[0], exact: true }).click();
  assert.equal(await drawer.getByRole('checkbox', { name: labels[0], exact: true }).isChecked(), true);
  assert.equal(await drawer.getByText('至少保留一个业务列', { exact: true }).count(), 1);

  await page.evaluate(() => {
    Object.defineProperty(Storage.prototype, 'setItem', {
      configurable: true,
      value() { throw new DOMException('blocked', 'SecurityError'); }
    });
  });
  await drawer.getByRole('button', { name: '保存视图', exact: true }).click();
  assert.equal(await drawer.isVisible(), true);
  assert.equal(await drawer.getByText('保存失败，请检查浏览器存储权限后重试', { exact: true }).count(), 1);
  await context.close();
});

test('hidden pinned columns do not leave a sticky offset gap', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => {
    localStorage.setItem('lferp:table-personal-view:v1:commerce.aftersale.list', JSON.stringify({
      formatVersion: 1,
      columns: [
        { key: 'aftersaleno', visible: false, order: 0, pin: 'left', width: 220 },
        { key: 'aftersalesource', visible: true, order: 1, pin: 'left', width: 140 }
      ]
    }));
  });
  const page = await context.newPage();
  await page.goto(`${ORIGIN}/MDM/mdm_aftersale_ticket.html`);
  const offsets = await page.evaluate(() => {
    const table = document.querySelector('#asTicketTable');
    const systemWidth = ['__serial', '__selection'].reduce((sum, key) => {
      const header = table.querySelector(`thead [data-lf-view-column-key="${key}"]`);
      return sum + (header ? header.offsetWidth : 0);
    }, 0);
    const source = table.querySelector('thead [data-lf-view-column-key="aftersalesource"]');
    return { expected: systemWidth, actual: Number.parseInt(source.style.left, 10) };
  });
  assert.equal(offsets.actual, offsets.expected);
  await context.close();
});
