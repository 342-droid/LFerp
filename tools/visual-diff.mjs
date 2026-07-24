/**
 * 视觉对比：before/after 两张全页截图(PNG) → 输出统一尺寸、圈了红框的前后两张图(JPEG)。
 * 被 generate-changelog-diffs.mjs 调用，也可单独执行：
 *   node tools/visual-diff.mjs before.png after.png outBefore.jpg outAfter.jpg
 */
import fs from 'node:fs';
import { PNG } from 'pngjs';
import jpeg from 'jpeg-js';

const JPEG_QUALITY = 80;

const CELL = 8;        // 变化检测网格
const TOL = 40;        // r+g+b 差值容忍度（抗轻微渲染抖动）
const REACH = 2;       // 连通域搜索半径（格）
const MIN_AREA = 144;  // 小于 12x12px 的孤立变化视为噪声
const MERGE_PAD = 16;  // 相距小于该值的框合并
const BOX_PAD = 6;     // 红框外扩

function onCanvas(img, W, H) {
    const c = new PNG({ width: W, height: H, fill: true });
    c.data.fill(255);
    PNG.bitblt(img, c, 0, 0, img.width, img.height, 0, 0);
    return c;
}

function findBoxes(ca, cb, W, H) {
    const gw = Math.ceil(W / CELL);
    const gh = Math.ceil(H / CELL);
    const grid = new Uint8Array(gw * gh);
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const i = (y * W + x) * 4;
            const d = Math.abs(ca.data[i] - cb.data[i]) +
                Math.abs(ca.data[i + 1] - cb.data[i + 1]) +
                Math.abs(ca.data[i + 2] - cb.data[i + 2]);
            if (d > TOL) grid[Math.floor(y / CELL) * gw + Math.floor(x / CELL)] = 1;
        }
    }
    const boxes = [];
    const seen = new Uint8Array(gw * gh);
    for (let gy = 0; gy < gh; gy++) {
        for (let gx = 0; gx < gw; gx++) {
            const idx = gy * gw + gx;
            if (!grid[idx] || seen[idx]) continue;
            let minX = gx, maxX = gx, minY = gy, maxY = gy;
            const stack = [idx];
            seen[idx] = 1;
            while (stack.length) {
                const cur = stack.pop();
                const cy = Math.floor(cur / gw), cx = cur % gw;
                minX = Math.min(minX, cx); maxX = Math.max(maxX, cx);
                minY = Math.min(minY, cy); maxY = Math.max(maxY, cy);
                for (let dy = -REACH; dy <= REACH; dy++) {
                    for (let dx = -REACH; dx <= REACH; dx++) {
                        const ny = cy + dy, nx = cx + dx;
                        if (ny < 0 || ny >= gh || nx < 0 || nx >= gw) continue;
                        const ni = ny * gw + nx;
                        if (grid[ni] && !seen[ni]) { seen[ni] = 1; stack.push(ni); }
                    }
                }
            }
            boxes.push({
                x0: minX * CELL, y0: minY * CELL,
                x1: Math.min((maxX + 1) * CELL, W - 1), y1: Math.min((maxY + 1) * CELL, H - 1)
            });
        }
    }
    let big = boxes.filter((r) => (r.x1 - r.x0) * (r.y1 - r.y0) >= MIN_AREA);
    let merged = true;
    while (merged) {
        merged = false;
        outer: for (let i = 0; i < big.length; i++) {
            for (let j = i + 1; j < big.length; j++) {
                const r = big[i], s = big[j];
                if (r.x0 - MERGE_PAD < s.x1 && s.x0 - MERGE_PAD < r.x1 &&
                    r.y0 - MERGE_PAD < s.y1 && s.y0 - MERGE_PAD < r.y1) {
                    big[i] = {
                        x0: Math.min(r.x0, s.x0), y0: Math.min(r.y0, s.y0),
                        x1: Math.max(r.x1, s.x1), y1: Math.max(r.y1, s.y1)
                    };
                    big.splice(j, 1);
                    merged = true;
                    break outer;
                }
            }
        }
    }
    return big;
}

function drawBoxes(img, boxes, W, H) {
    function setPx(x, y, alpha) {
        if (x < 0 || x >= W || y < 0 || y >= H) return;
        const i = (y * W + x) * 4;
        img.data[i] = Math.round(img.data[i] * (1 - alpha) + 245 * alpha);
        img.data[i + 1] = Math.round(img.data[i + 1] * (1 - alpha) + 34 * alpha);
        img.data[i + 2] = Math.round(img.data[i + 2] * (1 - alpha) + 45 * alpha);
    }
    for (const r of boxes) {
        const x0 = Math.max(0, r.x0 - BOX_PAD), y0 = Math.max(0, r.y0 - BOX_PAD);
        const x1 = Math.min(W - 1, r.x1 + BOX_PAD), y1 = Math.min(H - 1, r.y1 + BOX_PAD);
        for (let y = y0; y <= y1; y++) {
            for (let x = x0; x <= x1; x++) {
                const onEdge = (y - y0 < 3) || (y1 - y < 3) || (x - x0 < 3) || (x1 - x < 3);
                setPx(x, y, onEdge ? 0.95 : 0.08);
            }
        }
    }
}

/**
 * @returns {{regions: number}} 圈出的变化区域数
 */
export function visualDiff(beforePath, afterPath, outBeforePath, outAfterPath) {
    const a = PNG.sync.read(fs.readFileSync(beforePath));
    const b = PNG.sync.read(fs.readFileSync(afterPath));
    const W = Math.max(a.width, b.width);
    const H = Math.max(a.height, b.height);
    const ca = onCanvas(a, W, H);
    const cb = onCanvas(b, W, H);
    const boxes = findBoxes(ca, cb, W, H);
    drawBoxes(ca, boxes, W, H);
    drawBoxes(cb, boxes, W, H);
    fs.writeFileSync(outBeforePath, jpeg.encode({ data: ca.data, width: W, height: H }, JPEG_QUALITY).data);
    fs.writeFileSync(outAfterPath, jpeg.encode({ data: cb.data, width: W, height: H }, JPEG_QUALITY).data);
    return { regions: boxes.length };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
    const [, , b, a, ob, oa] = process.argv;
    if (!oa) {
        console.error('用法: node tools/visual-diff.mjs before.png after.png outBefore.png outAfter.png');
        process.exit(1);
    }
    const { regions } = visualDiff(b, a, ob, oa);
    console.log(`变化区域 ${regions} 处`);
}
