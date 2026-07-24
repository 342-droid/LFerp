# 更新日志「页面级视图」+ 侧边栏「新」角标 设计

日期：2026-07-24

## 背景与问题

changelog 页目前是 commit 流水（日期 → commit 标题一句话）。产品/业务同事看原型时，
从「完善售后管理履约与拒收退回闭环」这样的标题里看不出**哪些页面**改了，也没有链接可以点过去看。

## 目标

- changelog 页按天先回答「今天更新了哪些页面」：页面中文名 + 直达链接，点开才看 commit 明细。
- 侧边栏里最近 7 天改过的页面自动挂「新」角标，浏览时自然发现。

## 非目标（YAGNI）

- 不做群推送（企微/飞书）。
- 角标不做「已读消失」，只按 7 天时间窗口。
- 不做 AI/手写的页面级摘要，改动说明沿用 commit 标题。

## 数据层：tools/generate-changelog.mjs 升级

1. `git log` 增加 `--name-only` 取每次提交的改动文件；`--no-merges`、SKIP 规则、东八区日期均保持不变。
2. 文件 → 页面映射：
   - 非 `vendor/` 下的 `*.html` 改动，本身就是页面；
   - `js/**`、`css/**`、`components/**` 改动：启动时扫描全部非 vendor HTML，把 `src=`/`href=` 相对引用解析成 repo 相对路径，建一次「资源 → 引用页面」反向索引，再据此反查（例：`js/order-live-list.js` → `mdm_order_proxy/live/retail` 三页）。用解析后的完整 repo 路径比对，不用 basename，避免多模块重名。
3. 全局改动阈值：单文件被 **> 10** 个页面引用（如 `js/common.js`、`css/common.css`）视为全局改动，不展开页面列表，该 commit 标记 `global: true`。
4. 页面显示名：读当前工作区 HTML 的 `<title>`，按「模块 - 页面名」拆出 `module` 与 `title`（例：`冷丰WMS - 直播订单`）；无 title 或拆不出时回退文件名；文件已被删除的跳过。
5. `changelog.json` 结构：顶层 `latestSha/total/days` 与 item 现有字段全部不变，item 新增：
   ```json
   { "pages": [{ "file": "MDM/mdm_order_live.html", "module": "冷丰WMS", "title": "直播订单" }],
     "global": true }
   ```
   `pages` 可为空数组，`global` 仅在触发阈值时出现。

## 呈现层 1：changelog.html 页面为主体视图

- 每天一个 section，先渲染当天「更新的页面」行：把当天所有 commit 的 `pages` 按页面聚合去重，
  每行显示 module 徽章 + 页面中文名 + 更新次数，点页面名新开页直达；今天（东八区）默认展开明细。
- 「明细」展开的是**更新说明**而非代码变更：类型徽章 + commit 标题一句话 + 作者·时间。
  受众是看原型的产品/业务同事，**不透出 sha / diff / GitHub commit 链接等代码信息**
  （commit 标题是唯一保留的部分——它是「这个页面具体改了什么」的唯一人话描述）；
  页头右上角保留一个「GitHub 提交记录」总入口给开发。
- `pages` 为空的 commit（文档/工具/纯全局改动）收进「其他改动」分组，默认折叠成一行，点开才展示。
- 保留现有行为：今天/昨天 tag、前 10 天分批加载、`lfChangelogSeenSha` 红点逻辑。
- 向后兼容：item 无 `pages` 字段时（CI 尚未重新生成的过渡期）整天回退为现有 commit 流水渲染。

## 呈现层 2：侧边栏「新」角标（js/common.js）

- 复用现有 changelog-entry 浮动入口的 `fetch('changelog.json')` 回调（每页已在请求，不加新请求）：
  从 `days` 取最近 7 天（东八区）所有 item 的 `pages`，得到「近期改过页面」的 repo 路径集合。
- DOMContentLoaded 后扫描侧边栏容器内的 `a[href]`，将 href 解析为 repo 相对路径，命中集合则在链接文案后
  append 小号「新」角标（样式随 common.js 注入）。若此时侧边栏尚未渲染完成，用 MutationObserver 兜底一次。
- 12 个 sidebar 脚本一律不改。

## 呈现层 3：页面变更前后对照图（看对比）

回答「页面上**哪里**变了」：每条「提交×页面」用 git archive 导出该提交的父提交树（改动前）
与提交树（改动后），同环境静态服务并整页截图，像素对比后在**前后两张图的相同位置圈红框**。

- `tools/visual-diff.mjs`：8px 网格比对（容忍轻微渲染抖动）→ 连通域聚类 → 小噪声过滤、
  邻近框合并 → 前后两张图画红框，输出 JPEG(q80)。
- `tools/generate-changelog-diffs.mjs`：读 changelog.json 取近 DIFF_DAYS(默认3) 天的提交×页面，
  幂等生成（已有的跳过），playwright 单浏览器复用批量截图；产物落
  `changelog-assets/<sha7>/<页面slug>.before.jpg / .after.jpg` + `manifest.json`。
- **体积控制**：JPEG 而非 PNG；`regions=0`（界面无可见变化）只记 manifest 结论不存图；
  超过 RETAIN_DAYS(默认14) 天的图与 manifest 项由脚本裁剪。
- `compare.html`：对照查看器，读 manifest，支持「并排」与「滑动对比」两种模式；
  新增页面显示单图（status=added）。
- changelog 页说明行按 manifest 挂入口：`regions>0`→「看对比」；`regions=0`→灰字「无界面变化」
  （悬浮提示改动在交互/弹层里）；`added`→「新增 · 看截图」。
- CI（changelog.yml）：装 fonts-noto-cjk + chromium，daily 依次跑两个生成脚本，
  changelog.json 与 changelog-assets 一并提交。
- **已知边界**：只覆盖页面默认状态的可见变化；弹窗/抽屉/tab 内的改动截不到，
  由「无界面变化」标注 + commit 一句话说明兜底。

## 呈现层 4：按页面人话说明（commit body 约定）

截图对比拍不到弹窗/抽屉/流程类变化，由文字说明兜底。数据源两级：

- **未来提交**：`.cursor/rules/changelog-commit.mdc`（alwaysApply）约定 commit body 按
  `- <页面中文名>: <一句人话>` 写按页面说明，并优先引用代码中的中文业务注释；
  生成脚本解析 `%b` 中的该格式行，按页面 `<title>` 名匹配挂到 `item.notes`。
- **历史提交补录**：`changelog-notes.json`（{sha7: ["页面名: 说明", ...]}），
  body 没写说明的老提交回退用它；近 3 天（07-22~24）的 14 个提交已人工分析 diff+注释补录。
- 页面名匹配不上且非「通用」的行丢弃（防 dev 向内容漏给业务）；「通用」行只在
  「其他改动」/旧格式上下文展示。changelog 页在对应页面的提交行下渲染说明 bullets。

## 验收

- 本地 `node tools/generate-changelog.mjs`：断言样例 commit 的 `pages` 正确（含 js 反查、全局阈值、title 拆分）。
- 本地静态服务器打开 `changelog.html`：页面卡片聚合、明细展开、旧数据回退各验一遍。
- 打开任一 MDM 页面：侧边栏命中页挂「新」角标，未命中页无角标。
- 纯静态原型仓库，无自动化测试框架，验收以脚本输出断言 + 手动过一遍为准。
