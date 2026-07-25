/**
 * 为 changelog.json 里近 DIFF_DAYS 天的每条「提交×页面」生成前后对照截图：
 *   changelog-assets/<sha7>/<页面slug>.before.png / .after.png（变化区域已圈红框）
 *   changelog-assets/manifest.json  → changelog.html 据此显示「看对比」入口
 *
 * 改动前 = 该提交父提交的导出树，改动后 = 该提交的导出树，分别静态服务后同环境截图，
 * 因此两侧渲染环境一致，像素对比可靠。已生成过的（提交×页面）跳过，可重复执行。
 *
 * 为控制仓库体积：输出 JPEG；「界面无可见变化」(regions=0) 只记 manifest 不存图。
 * 环境变量：DIFF_DAYS 生成窗口(默认3天)  RETAIN_DAYS 图片保留(默认14天)
 *           MAX_DIFFS 单次上限(默认120)  PW_CHANNEL 本地可设 chrome 复用系统浏览器
 * 依赖：npm i（playwright + pngjs），CI 另需 npx playwright install chromium
 */
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { visualDiff } from './visual-diff.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = join(repoRoot, 'changelog-assets');
const manifestPath = join(assetsDir, 'manifest.json');

const DIFF_DAYS = Number(process.env.DIFF_DAYS || 3);
const RETAIN_DAYS = Number(process.env.RETAIN_DAYS || 14);
const MAX_DIFFS = Number(process.env.MAX_DIFFS || 120);
const PORTS = [45871, 45872];

const changelog = JSON.parse(fs.readFileSync(join(repoRoot, 'changelog.json'), 'utf8'));
const manifest = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    : {};

function bjDate(offsetDays) {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' })
        .format(new Date(Date.now() - offsetDays * 86400000));
}
const genCutoff = bjDate(DIFF_DAYS - 1);
const retainCutoff = bjDate(RETAIN_DAYS - 1);
const slug = (file) => file.replace(/\//g, '__');

/* ---------- 收集任务：近 DIFF_DAYS 天、尚未生成的（提交×页面） ---------- */
const bySha = new Map(); // sha7 -> [{file}]
let skippedByCap = 0;
let planned = 0;
for (const day of changelog.days) {
    if (day.date < genCutoff) continue;
    for (const item of day.items) {
        for (const p of item.pages || []) {
            const key = `${item.sha}|${p.file}`;
            const entry = manifest[key];
            if (entry && (!entry.after || fs.existsSync(join(repoRoot, entry.after)))) continue;
            if (planned >= MAX_DIFFS) { skippedByCap += 1; continue; }
            if (!bySha.has(item.sha)) bySha.set(item.sha, []);
            bySha.get(item.sha).push(p);
            planned += 1;
        }
    }
}
if (skippedByCap) console.log(`⚠️ 超出单次上限 MAX_DIFFS=${MAX_DIFFS}，本次跳过 ${skippedByCap} 个，下次执行继续补`);
if (!planned) console.log('没有需要生成的对比图');

/* ---------- 静态服务与截图 ---------- */
function exportTree(ref, dir) {
    fs.mkdirSync(dir, { recursive: true });
    execFileSync('bash', ['-c', `git archive ${ref} | tar -x -C '${dir}'`], { cwd: repoRoot });
}

async function waitPort(port) {
    for (let i = 0; i < 50; i++) {
        try {
            await fetch(`http://127.0.0.1:${port}/`);
            return;
        } catch (e) {
            await new Promise((r) => setTimeout(r, 100));
        }
    }
    throw new Error(`静态服务 :${port} 未就绪`);
}

async function main() {
    let browser = null;
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), 'lferp-diff-'));
    let done = 0;

    try {
        if (planned) {
            browser = await chromium.launch(
                process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}
            );
        }

        for (const [sha, pages] of bySha) {
            const beforeDir = join(tmpRoot, `${sha}-before`);
            const afterDir = join(tmpRoot, `${sha}-after`);
            let hasParent = true;
            try {
                exportTree(`${sha}^`, beforeDir);
            } catch (e) {
                hasParent = false; // 根提交
            }
            exportTree(sha, afterDir);

            const servers = [
                hasParent ? spawn('python3', ['-m', 'http.server', String(PORTS[0]), '-d', beforeDir], { stdio: 'ignore' }) : null,
                spawn('python3', ['-m', 'http.server', String(PORTS[1]), '-d', afterDir], { stdio: 'ignore' })
            ];
            try {
                if (hasParent) await waitPort(PORTS[0]);
                await waitPort(PORTS[1]);

                const ctx = await browser.newContext({
                    viewport: { width: 1440, height: 900 },
                    reducedMotion: 'reduce'
                });
                const page = await ctx.newPage();

                async function shoot(port, file, out) {
                    await page.goto(`http://127.0.0.1:${port}/${file}`, { waitUntil: 'networkidle', timeout: 30000 });
                    await page.waitForTimeout(500);
                    await page.screenshot({ path: out, fullPage: true });
                }

                for (const p of pages) {
                    const key = `${sha}|${p.file}`;
                    const relBefore = `changelog-assets/${sha}/${slug(p.file)}.before.jpg`;
                    const relAfter = `changelog-assets/${sha}/${slug(p.file)}.after.jpg`;
                    try {
                        if (!fs.existsSync(join(afterDir, p.file))) {
                            console.log(`− ${key} 页面在该提交中已不存在，跳过`);
                            continue;
                        }
                        if (!hasParent || !fs.existsSync(join(beforeDir, p.file))) {
                            fs.mkdirSync(join(assetsDir, sha), { recursive: true });
                            await page.goto(`http://127.0.0.1:${PORTS[1]}/${p.file}`, { waitUntil: 'networkidle', timeout: 30000 });
                            await page.waitForTimeout(500);
                            await page.screenshot({ path: join(repoRoot, relAfter), fullPage: true, type: 'jpeg', quality: 80 });
                            manifest[key] = { after: relAfter, status: 'added', date: dayOf(sha) };
                            console.log(`＋ ${key} 新增页面`);
                        } else {
                            const tb = join(tmpRoot, 'b.png');
                            const ta = join(tmpRoot, 'a.png');
                            const ob = join(tmpRoot, 'ob.jpg');
                            const oa = join(tmpRoot, 'oa.jpg');
                            await shoot(PORTS[0], p.file, tb);
                            await shoot(PORTS[1], p.file, ta);
                            const { regions } = visualDiff(tb, ta, ob, oa);
                            if (regions > 0) {
                                fs.mkdirSync(join(assetsDir, sha), { recursive: true });
                                fs.copyFileSync(ob, join(repoRoot, relBefore));
                                fs.copyFileSync(oa, join(repoRoot, relAfter));
                                manifest[key] = { before: relBefore, after: relAfter, regions, status: 'diff', date: dayOf(sha) };
                            } else {
                                // 界面无可见变化：只记结论，不存图（控制仓库体积）
                                manifest[key] = { regions: 0, status: 'diff', date: dayOf(sha) };
                            }
                            console.log(`✓ ${key} 变化 ${regions} 处`);
                        }
                        done += 1;
                    } catch (e) {
                        console.log(`✗ ${key} 失败: ${e.message}`);
                    }
                }
                await ctx.close();
            } finally {
                for (const s of servers) if (s) s.kill();
            }
            writeManifest(); // 每个提交落一次盘，中断可续
        }
    } finally {
        if (browser) await browser.close();
        fs.rmSync(tmpRoot, { recursive: true, force: true });
    }

    /* ---------- 裁剪超过保留期的图片与 manifest 项 ---------- */
    const keepShas = new Set();
    for (const day of changelog.days) {
        if (day.date < retainCutoff) continue;
        for (const item of day.items) keepShas.add(item.sha);
    }
    for (const key of Object.keys(manifest)) {
        const sha = key.split('|')[0];
        if (!keepShas.has(sha)) delete manifest[key];
    }
    if (fs.existsSync(assetsDir)) {
        for (const name of fs.readdirSync(assetsDir)) {
            const p = join(assetsDir, name);
            if (fs.statSync(p).isDirectory() && !keepShas.has(name)) {
                fs.rmSync(p, { recursive: true, force: true });
                console.log(`✂ 裁剪过期对比图 ${name}`);
            }
        }
    }

    writeManifest();
    console.log(`manifest: ${Object.keys(manifest).length} 项, 本次新生成 ${done} 个`);
}

function writeManifest() {
    fs.mkdirSync(assetsDir, { recursive: true });
    const sorted = {};
    for (const k of Object.keys(manifest).sort()) sorted[k] = manifest[k];
    fs.writeFileSync(manifestPath, JSON.stringify(sorted, null, 2) + '\n', 'utf8');
}

function dayOf(sha) {
    for (const day of changelog.days) {
        for (const item of day.items) if (item.sha === sha) return day.date;
    }
    return bjDate(0);
}

await main();
