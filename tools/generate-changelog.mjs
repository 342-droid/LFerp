/**
 * 从 git log 生成 changelog.json（供 changelog.html 展示）。
 * 由 .github/workflows/changelog.yml 每日定时执行，也可本地手动执行：
 *   node tools/generate-changelog.mjs
 * 注意：输出内容只由提交历史决定（不含生成时间戳），CI 据此 diff 判断是否需要提交。
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const SEP = '\x1f';
const RECORD = '\x1e';
const raw = execFileSync(
    'git',
    ['log', '--no-merges', '--pretty=format:%H%x1f%an%x1f%aI%x1f%s%x1e'],
    { cwd: repoRoot, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }
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
    const line = record.replace(/^\n/, '');
    if (!line) continue;
    const [sha, author, isoDate, subject] = line.split(SEP);
    if (!sha || !subject) continue;
    if (SKIP_AUTHORS.test(author) || SKIP_SUBJECTS.test(subject)) continue;

    const m = subject.match(TYPE_RE);
    const type = m ? m[1].toLowerCase() : 'other';
    const text = m ? m[2].trim() : subject.trim();
    const { date, time } = beijingParts(isoDate);

    if (!latestSha) latestSha = sha;
    if (!dayMap.has(date)) dayMap.set(date, []);
    dayMap.get(date).push({ sha: sha.slice(0, 7), type, text, author, time });
    total += 1;
}

const days = [...dayMap.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, items]) => ({ date, items }));

const out = { latestSha, total, days };
writeFileSync(resolve(repoRoot, 'changelog.json'), JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(`changelog.json: ${days.length} 天 / ${total} 条提交, latest=${latestSha.slice(0, 7)}`);
