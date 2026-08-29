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

async function freshPage(pathname) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await page.goto(`${ORIGIN}${pathname}`);
  return { context, page };
}

test('system admin independently enables three tag modules and member capability drives after-sale usage', async () => {
  const { context, page } = await freshPage('/SCM/basic_settings_system.html');

  assert.equal(await page.getByRole('heading', { name: '标签能力配置', exact: true }).count(), 1);
  assert.equal(await page.locator('[data-business-tag-module]').count(), 3);
  for (const code of ['STORE_TAG', 'MEMBER_TAG', 'AFTER_SALE_TAG']) {
    assert.equal(await page.locator(`[data-business-tag-module="${code}"]`).count(), 1);
  }
  for (const label of ['门店标签', '会员标签', '售后标签']) {
    assert.equal(await page.getByText(label, { exact: true }).count(), 1);
  }
  assert.equal(await page.getByText('下单用户会员标签', { exact: true }).count(), 0);

  await page.locator('[data-business-tag-module="MEMBER_TAG"] input[role="switch"]').uncheck();
  await page.goto(`${ORIGIN}/MDM/mdm_aftersale_ticket.html`);
  assert.equal(await page.getByRole('columnheader', { name: '售后标签', exact: true }).count(), 1);
  assert.equal(await page.getByRole('columnheader', { name: '会员标签', exact: true }).count(), 0);

  await page.goto(`${ORIGIN}/SCM/basic_settings_system.html`);
  await page.locator('[data-business-tag-module="MEMBER_TAG"] input[role="switch"]').check();
  await page.goto(`${ORIGIN}/MDM/mdm_aftersale_ticket.html`);
  assert.equal(await page.getByRole('columnheader', { name: '会员标签', exact: true }).count(), 1);

  await context.close();
});

test('after-sale list filters its own tags and reads unified member tags without a parallel member model', async () => {
  const { context, page } = await freshPage('/MDM/mdm_aftersale_ticket.html');

  assert.equal(await page.getByRole('button', { name: '标签管理', exact: true }).count(), 1);
  assert.equal(await page.getByRole('columnheader', { name: '售后标签', exact: true }).count(), 1);
  assert.equal(await page.getByRole('columnheader', { name: '会员标签', exact: true }).count(), 1);
  const headers = await page.locator('#asTicketTable thead th').allTextContents();
  assert.ok(headers.indexOf('售后状态') < headers.indexOf('售后标签'));
  assert.ok(headers.indexOf('售后标签') < headers.indexOf('会员标签'));

  const firstRow = page.locator('#asTicketTableBody tr').first();
  assert.match(await firstRow.locator('[data-business-tag-list="AFTER_SALE"]').textContent(), /优先处理/);
  assert.match(await firstRow.locator('[data-member-tag-list="MEMBER"]').textContent(), /高活跃/);

  const memberFilter = page.locator('#asMemberTagFilter');
  await memberFilter.locator('[data-business-tag-picker-trigger]').click();
  await memberFilter.getByRole('checkbox', { name: '高活跃', exact: true }).check();
  await page.getByRole('button', { name: '查询', exact: true }).click();
  const memberFilteredRows = page.locator('#asTicketTableBody tr:visible');
  assert.ok((await memberFilteredRows.count()) > 0);
  for (let i = 0; i < await memberFilteredRows.count(); i += 1) {
    assert.match(await memberFilteredRows.nth(i).locator('[data-member-tag-list="MEMBER"]').textContent(), /高活跃/);
  }
  await page.getByRole('button', { name: '重置', exact: true }).click();

  const filter = page.locator('#asAfterSaleTagFilter');
  await filter.locator('[data-business-tag-picker-trigger]').click();
  await filter.getByRole('checkbox', { name: '优先处理', exact: true }).check();
  await filter.getByRole('checkbox', { name: '重点跟进', exact: true }).check();
  await filter.locator('[data-business-tag-match]').selectOption('ALL');
  await page.getByRole('button', { name: '查询', exact: true }).click();

  const visibleRows = page.locator('#asTicketTableBody tr:visible');
  assert.ok((await visibleRows.count()) > 0);
  for (let i = 0; i < await visibleRows.count(); i += 1) {
    const tags = await visibleRows.nth(i).locator('[data-business-tag-list="AFTER_SALE"]').textContent();
    assert.match(tags, /优先处理/);
    assert.match(tags, /重点跟进/);
  }

  await visibleRows.first().getByRole('link', { name: '查看详情', exact: true }).click();
  assert.equal(await page.getByRole('heading', { name: '业务标签', exact: true }).count(), 1);
  assert.match(await page.locator('[data-business-tag-detail="AFTER_SALE"]').textContent(), /优先处理/);
  assert.match(await page.locator('[data-member-tag-detail="MEMBER"]').textContent(), /高活跃/);
  assert.equal(await page.getByText('只读 · 来自会员管理', { exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: '管理售后标签', exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: '管理会员标签', exact: true }).count(), 0);

  await context.close();
});

test('after-sale member tags follow the member-360 assignment source', async () => {
  const { context, page } = await freshPage('/MDM/mdm_aftersale_ticket.html');

  await page.evaluate(() => {
    localStorage.setItem('mdm_member_c_list_v1', JSON.stringify([
      { id: 'U10001', tags: '储值、复购' }
    ]));
  });
  await page.reload();

  const projected = await page.locator('#asTicketTableBody tr').first()
    .locator('[data-member-tag-list="MEMBER"]').textContent();
  assert.match(projected, /储值/);
  assert.match(projected, /复购/);
  assert.doesNotMatch(projected, /高活跃/);
  assert.equal(await page.locator('[data-business-tag-list="CONSUMER"]').count(), 0);

  await context.close();
});

test('after-sale tag library creates a tag without choosing a color', async () => {
  const { context, page } = await freshPage('/MDM/mdm_aftersale_ticket.html');

  await page.getByRole('button', { name: '标签管理', exact: true }).click();
  const drawer = page.locator('[data-business-tag-manager]');
  await drawer.waitFor({ state: 'visible' });
  assert.equal(await page.locator('[data-business-tag-form]').isVisible(), false);
  await drawer.getByRole('button', { name: '新增标签', exact: true }).click();
  const form = page.locator('[data-business-tag-form]');
  await form.getByLabel('标签名称').fill('待人工核实');
  assert.equal(await form.getByLabel('标签颜色').inputValue(), '');
  await form.getByRole('button', { name: '保存', exact: true }).click();

  const created = drawer.locator('tr', { hasText: '待人工核实' });
  assert.equal(await created.count(), 1);
  assert.match(await created.textContent(), /默认/);

  await context.close();
});

test('store owns its tag library while member management keeps the single existing member-tag library', async () => {
  const { context, page } = await freshPage('/MDM/mdm_archive_store.html');

  assert.equal(await page.getByRole('button', { name: '门店标签管理', exact: true }).count(), 1);
  assert.equal(await page.getByRole('columnheader', { name: '门店标签', exact: true }).count(), 1);
  assert.match(await page.locator('#tableBody tr').first().locator('[data-business-tag-list="STORE"]').textContent(), /重点门店/);

  await page.goto(`${ORIGIN}/MDM/mdm_member_c.html`);
  assert.equal(await page.getByRole('columnheader', { name: '会员标签', exact: true }).count(), 1);
  assert.equal(await page.getByRole('columnheader', { name: '业务标签', exact: true }).count(), 0);
  assert.equal(await page.getByRole('button', { name: '消费者标签管理', exact: true }).count(), 0);
  const memberHeaders = await page.locator('#tableBody').locator('xpath=../thead/tr/th').allTextContents();
  const memberTagColumn = memberHeaders.indexOf('会员标签');
  assert.ok(memberTagColumn >= 0);
  assert.equal((await page.locator('#tableBody tr').first().locator('td').nth(memberTagColumn).textContent()).trim(), '高活跃');

  await page.goto(`${ORIGIN}/MDM/mdm_member_tag.html`);
  assert.equal(await page.getByRole('button', { name: '会员标签', exact: true }).count(), 1);
  assert.equal(await page.locator('#btnBatchTag').count(), 1);
  assert.equal(await page.getByRole('button', { name: '新增标签', exact: true }).count(), 1);

  await context.close();
});
