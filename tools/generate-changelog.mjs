/**
 * 从 git log 生成 changelog.json（供 changelog.html 展示）。
 * 由 .github/workflows/changelog.yml 每日定时执行，也可本地手动执行：
 *   node tools/generate-changelog.mjs
 * 注意：输出内容只由提交历史决定（不含生成时间戳），CI 据此 diff 判断是否需要提交。
 *
 * 每条提交附带受影响页面 pages：HTML 改动即页面本身；js/css 改动反查引用它的页面；
 * 被超过 GLOBAL_REF_THRESHOLD 个页面引用的共享文件记为全局改动（global: true）。
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const GLOBAL_REF_THRESHOLD = 20;
const SKIP_DIRS = new Set(['vendor', 'node_modules', '.git', '.github']);

/* ---------- 页面清单、标题、资源反向索引 ---------- */

function walkHtml(dir, prefix, out) {
    for (const name of readdirSync(dir)) {
        if (SKIP_DIRS.has(name) || name.startsWith('.')) continue;
        const abs = join(dir, name);
        const rel = prefix ? prefix + '/' + name : name;
        const st = statSync(abs);
        if (st.isDirectory()) walkHtml(abs, rel, out);
        else if (name.endsWith('.html')) out.push(rel);
    }
    return out;
}

/** 从 <title>模块 - 页面名</title> 拆出显示名；拆不出时回退文件名 */
function pageMeta(relPath) {
    let module = '';
    let title = posix.basename(relPath, '.html');
    try {
        const html = readFileSync(join(repoRoot, relPath), 'utf8');
        const m = html.match(/<title>([^<]*)<\/title>/i);
        if (m && m[1].trim()) {
            const raw = m[1].trim();
            const parts = raw.split(/\s+-\s+/);
            if (parts.length >= 2) {
                module = parts[0].trim();
                title = parts.slice(1).join(' - ').trim();
            } else {
                title = raw;
            }
        }
    } catch (e) { /* 读不到就用文件名 */ }
    return { file: relPath, module, title };
}

/** 资源(js/css) repo 相对路径 → 引用它的页面集合 */
function buildAssetIndex(htmlFiles) {
    const index = new Map();
    const REF_RE = /(?:src|href)\s*=\s*"([^"]+?\.(?:js|css))(?:[?#][^"]*)?"/gi;
    for (const page of htmlFiles) {
        let html;
        try { html = readFileSync(join(repoRoot, page), 'utf8'); } catch (e) { continue; }
        const dir = posix.dirname(page);
        for (const m of html.matchAll(REF_RE)) {
            const ref = m[1];
            if (/^(?:https?:)?\/\//i.test(ref)) continue;
            const asset = posix.normalize(posix.join(dir === '.' ? '' : dir, ref));
            if (asset.startsWith('..')) continue;
            if (!index.has(asset)) index.set(asset, new Set());
            index.get(asset).add(page);
        }
    }
    return index;
}

const htmlFiles = walkHtml(repoRoot, '', []);
const htmlSet = new Set(htmlFiles);
const assetIndex = buildAssetIndex(htmlFiles);
const metaCache = new Map();

function metaOf(page) {
    if (!metaCache.has(page)) metaCache.set(page, pageMeta(page));
    return metaCache.get(page);
}

/** 一次提交的改动文件 → { pages, global } */
function mapFilesToPages(files) {
    const pages = new Set();
    let global = false;
    for (const f of files) {
        if (f === 'changelog.html') continue; // 日志页自身不算业务页面更新
        if (htmlSet.has(f)) {
            pages.add(f);
            continue;
        }
        const refs = assetIndex.get(f);
        if (!refs) continue; // 非页面资源（文档、工具、已删除文件等）
        if (refs.size > GLOBAL_REF_THRESHOLD) {
            global = true;
            continue;
        }
        for (const p of refs) pages.add(p);
    }
    return { pages: [...pages].sort().map(metaOf), global };
}

/* ---------- git log 解析 ---------- */

const SEP = '\x1f';
const RECORD = '\x1e';
const raw = execFileSync(
    'git',
    ['log', '--no-merges', '--name-only', `--pretty=format:${RECORD}%H${SEP}%an${SEP}%aI${SEP}%s`],
    { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
);

const TYPE_RE = /^(feat|fix|docs|style|refactor|perf|test|chore|build|ci|revert)\s*[:：]\s*(.+)$/i;
const SKIP_AUTHORS = /\bgithub-actions\b/i;
const SKIP_SUBJECTS = /^(chore\s*[:：]\s*更新更新日志|merge\s*[:：])/i;

/** 按东八区取日期 yyyy-MM-dd 和时刻 HH:mm */
function beijingParts(isoDate) {
    const d = new Date(isoDate);
    const fmt = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false
    });
    const [date, time] = fmt.format(d).split(' ');
    return { date, time };
}

const dayMap = new Map();
let latestSha = '';
let total = 0;

for (const record of raw.split(RECORD)) {
    const lines = record.replace(/^\n/, '').split('\n');
    if (!lines[0]) continue;
    const [sha, author, isoDate, subject] = lines[0].split(SEP);
    if (!sha || !subject) continue;
    if (SKIP_AUTHORS.test(author) || SKIP_SUBJECTS.test(subject)) continue;

    const files = lines.slice(1).map((l) => l.trim()).filter(Boolean);
    const m = subject.match(TYPE_RE);
    const type = m ? m[1].toLowerCase() : 'other';
    const text = m ? m[2].trim() : subject.trim();
    const { date, time } = beijingParts(isoDate);
    const { pages, global } = mapFilesToPages(files);

    if (!latestSha) latestSha = sha;
    if (!dayMap.has(date)) dayMap.set(date, []);
    const item = { sha: sha.slice(0, 7), type, text, author, time, pages };
    if (global) item.global = true;
    dayMap.get(date).push(item);
    total += 1;
}

const days = [...dayMap.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, items]) => ({ date, items }));

const out = { latestSha, total, days };
writeFileSync(resolve(repoRoot, 'changelog.json'), JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(`changelog.json: ${days.length} 天 / ${total} 条提交, latest=${latestSha.slice(0, 7)}`);
