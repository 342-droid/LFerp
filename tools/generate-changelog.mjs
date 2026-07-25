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
        if (f === 'changelog.html' || f === 'compare.html') continue; // 日志/对比页自身不算业务页面更新
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

/* ---------- 按页面说明：commit body 的「- 页面名: 说明」行 + changelog-notes.json 补录 ---------- */

const NOTE_RE = /^\s*[-*·]\s*(.{1,24}?)\s*[:：]\s*(.+)$/;

/** 历史提交的补录说明（body 里没写的老提交），格式 { "<sha7>": ["页面名: 说明", ...] } */
const backfillNotes = (() => {
    try {
        return JSON.parse(readFileSync(join(repoRoot, 'changelog-notes.json'), 'utf8'));
    } catch (e) {
        return {};
    }
})();

/** 「商城 · 用户 APP」→「商城」：用于无前缀行的正文包含匹配 */
function shortTitle(title) {
    return String(title || '').split('·')[0].trim();
}

/** 短名在正文中的归属：位置启发（名字在句首附近的优先）+ 嵌套名去重（「我的」让位「我的订单」） */
function attachByMention(content, pages, notes) {
    let hits = pages
        .map((p) => {
            const st = shortTitle(p.title);
            return st.length >= 2 ? { p, st, idx: content.indexOf(st) } : null;
        })
        .filter((h) => h && h.idx >= 0);
    hits = hits.filter((h) =>
        !hits.some((o) => o.p !== h.p && o.st !== h.st && o.st.includes(h.st) && o.idx <= h.idx)
    );
    const minIdx = Math.min(...hits.map((h) => h.idx));
    if (hits.length && minIdx <= 6) hits = hits.filter((h) => h.idx <= 14);
    for (const h of hits) notes.push({ file: h.p.file, text: content });
    return hits.length > 0;
}

/**
 * body/补录行 → [{file, text}]。
 * 规范格式「- 页面名: 说明」按名字匹配（全名/短名/文件名）；
 * 无前缀的 bullet 或成段散文：按「；。」拆条后用页面短名在正文中的出现位置归属；
 * 都对不上则丢弃（不把 dev 向内容漏给业务）。
 */
function parseNotes(lines, pages) {
    const notes = [];
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;
        if (/^(co-authored-by|signed-off-by|change-id|reviewed-by)/i.test(line)) continue;
        const bullet = line.match(/^[-*·]\s*(.+)$/);
        const content = (bullet ? bullet[1] : line).trim();
        if (content.includes('/') && /\.\w{2,4}\b/.test(content.slice(0, 40))) continue; // 文件路径类 dev 行

        const m = content.match(/^(.{1,24}?)\s*[:：]\s*(.+)$/);
        if (m) {
            const name = m[1].trim();
            const text = m[2].trim();
            if (name === '通用') {
                notes.push({ file: null, text });
                continue;
            }
            const page = pages.find((p) =>
                p.title === name ||
                p.title.replace(/\s/g, '') === name.replace(/\s/g, '') ||
                shortTitle(p.title) === name ||
                posix.basename(p.file, '.html') === name
            );
            if (page) {
                notes.push({ file: page.file, text });
                continue;
            }
        }
        // 无前缀/名字没对上：按强分隔符拆条后逐条归属
        for (const clause of content.split(/[；。]/)) {
            const c = clause.trim();
            if (c.length >= 6) attachByMention(c, pages, notes);
        }
    }
    return notes;
}

/* ---------- git log 解析 ---------- */

const SEP = '\x1f';
const RECORD = '\x1e';
const BODY_END = '\x02';
const raw = execFileSync(
    'git',
    ['log', '--no-merges', '--name-only', `--pretty=format:${RECORD}%H${SEP}%an${SEP}%aI${SEP}%s${SEP}%b${BODY_END}`],
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
    const bodyEnd = record.indexOf(BODY_END);
    if (bodyEnd < 0) continue;
    const fields = record.slice(0, bodyEnd).replace(/^\n/, '').split(SEP);
    const [sha, author, isoDate, subject, body] = fields;
    if (!sha || !subject) continue;
    if (SKIP_AUTHORS.test(author) || SKIP_SUBJECTS.test(subject)) continue;

    const files = record.slice(bodyEnd + 1).split('\n').map((l) => l.trim()).filter(Boolean);
    const m = subject.match(TYPE_RE);
    const type = m ? m[1].toLowerCase() : 'other';
    const text = m ? m[2].trim() : subject.trim();
    const { date, time } = beijingParts(isoDate);
    const { pages, global } = mapFilesToPages(files);

    if (!latestSha) latestSha = sha;
    if (!dayMap.has(date)) dayMap.set(date, []);
    const item = { sha: sha.slice(0, 7), type, text, author, time, pages };
    if (global) item.global = true;
    // 人工补录（changelog-notes.json）优先于 body 解析：补录是逐提交整理的，质量更高
    const notes = backfillNotes[item.sha]
        ? parseNotes(backfillNotes[item.sha].map((l) => '- ' + l), pages)
        : parseNotes((body || '').split('\n'), pages);
    if (notes.length) item.notes = notes;
    dayMap.get(date).push(item);
    total += 1;
}

const days = [...dayMap.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, items]) => ({ date, items }));

const out = { latestSha, total, days };
writeFileSync(resolve(repoRoot, 'changelog.json'), JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(`changelog.json: ${days.length} 天 / ${total} 条提交, latest=${latestSha.slice(0, 7)}`);
