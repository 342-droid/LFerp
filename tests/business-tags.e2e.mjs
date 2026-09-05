import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test, { after, before } from 'node:test';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5198;
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

test('basic settings owns a separate capability menu without moving product tag management', async () => {
  const { context, page } = await freshPage('/SCM/basic_settings_business_tags.html');

  assert.equal(await page.getByRole('link', { name: /标签管理/ }).count(), 1);
  assert.equal(await page.getByRole('heading', { name: '标签能力配置', exact: true }).count(), 1);
  assert.equal(await page.locator('[data-business-tag-module]').count(), 4);
  for (const code of ['STORE_TAG', 'MEMBER_TAG', 'MDM_PRODUCT_TAG', 'AFTER_SALE_TAG']) {
    assert.equal(await page.locator(`[data-business-tag-module="${code}"]`).count(), 1);
  }
  for (const label of ['门店标签', '会员标签', '商品标签', '售后标签']) {
    assert.equal(await page.getByText(label, { exact: true }).count(), 1);
  }
  assert.equal(await page.getByText('业务用途', { exact: true }).count(), 0);
  assert.equal(await page.getByRole('heading', { name: '标签库管理', exact: true }).count(), 0);
  assert.equal(await page.getByRole('button', { name: '管理商品标签', exact: true }).count(), 0);

  await page.goto(`${ORIGIN}/MDM/mdm_product_selection.html`);
  assert.equal(await page.getByRole('button', { name: '标签管理', exact: true }).isVisible(), true);

  await context.close();
});

test('product tag management owns facts while requirement 570 binds tags from the cutoff rule', async () => {
  const { context, page } = await freshPage('/MDM/mdm_product_selection.html');

  await page.getByRole('button', { name: '标签管理', exact: true }).click();
  const drawer = page.getByRole('dialog', { name: '商品标签管理' });
  await drawer.waitFor({ state: 'visible' });
  assert.equal(await drawer.getByText('业务用途', { exact: true }).count(), 0);
  assert.equal(await drawer.getByText('设置用途', { exact: true }).count(), 0);
  assert.equal(await drawer.getByText('系统维护', { exact: true }).count(), 0);
  assert.equal(await drawer.getByText('订货汇总', { exact: true }).count(), 0);

  await drawer.getByRole('button', { name: '+ 新增标签', exact: true }).click();
  const form = page.locator('[data-sel-tag-form]');
  await form.getByLabel('标签名称').fill('冷链商品');
  await form.getByRole('button', { name: '保存', exact: true }).click();
  assert.equal(await drawer.getByText('冷链商品', { exact: true }).count(), 1);

  await page.goto(`${ORIGIN}/MDM/mdm_order_express_cutoff.html`);
  await page.getByRole('button', { name: '+ 新增', exact: true }).click();
  const ruleDrawer = page.locator('.sf-drawer');
  assert.equal(await ruleDrawer.getByRole('heading', { name: '新增截单策略', exact: true }).count(), 1);
  await ruleDrawer.getByRole('radio', { name: '指定商品标签', exact: true }).check();
  await ruleDrawer.getByRole('button', { name: '+ 添加商品标签', exact: true }).click();
  const picker = page.locator('.cutoff-pick-backdrop .pts-rule-pick-modal');
  assert.equal(await picker.getByRole('heading', { name: '选择商品标签', exact: true }).count(), 1);
  assert.equal(await picker.getByRole('checkbox', { name: '冷链商品', exact: true }).count(), 1);

  await context.close();
});

test('business tag bindings can be cleared and colors reject unsafe CSS values', async () => {
  const { context, page } = await freshPage('/SCM/basic_settings_business_tags.html');
  const result = await page.evaluate(() => {
    const store = window.BusinessTagPrototypeStore;
    store.saveBinding('STORE', 'STORE-CLEAR-CHECK', ['store-focus']);
    store.saveBinding('STORE', 'STORE-CLEAR-CHECK', []);
    const afterEnsure = store.ensureDemoBinding('STORE', 'STORE-CLEAR-CHECK', 0);
    let colorError = '';
    try {
      store.addTag('STORE', { name: '不安全颜色', color: '#fff;background:url(https://example.invalid/a)' });
    } catch (error) {
      colorError = error.message;
    }
    return {
      afterEnsure,
      colorError,
      unsafeStored: store.listTags('STORE', true).some((item) => item.name === '不安全颜色')
    };
  });

  assert.deepEqual(result.afterEnsure, []);
  assert.match(result.colorError, /6 位十六进制色值/);
  assert.equal(result.unsafeStored, false);
  await context.close();
});

test('store and after-sale pages keep their own tag libraries and read unified member tags', async () => {
  const { context, page } = await freshPage('/MDM/mdm_archive_store.html');

  assert.equal(await page.getByRole('button', { name: '门店标签管理', exact: true }).count(), 1);
  assert.equal(await page.getByRole('columnheader', { name: '门店标签', exact: true }).count(), 1);

  await page.goto(`${ORIGIN}/MDM/mdm_aftersale_ticket.html`);
  assert.equal(await page.getByRole('button', { name: '标签管理', exact: true }).count(), 1);
  assert.equal(await page.getByRole('columnheader', { name: '售后标签', exact: true }).count(), 1);
  assert.equal(await page.getByRole('columnheader', { name: '会员标签', exact: true }).count(), 1);
  assert.match(
    await page.locator('#asTicketTableBody tr').first().locator('[data-member-tag-list="MEMBER"]').textContent(),
    /高活跃/
  );

  await context.close();
});
