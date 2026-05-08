/**
 * 工作台首页：产品信息架构（MDM）说明
 */
import { empty, el } from '../utils/dom.js';

const MDM_TREE = [
  '基础数据中心（MDM）',
  '├── 主体中心：门店、供应商、仓库、直播间、承运商',
  '├── 资源中心：门店档案、供应商档案、仓库档案、直播间档案、承运商档案',
  '├── 人员中心：BD、司机、主播',
  '└── 会员中心：C 端会员',
];

const SPEC_ITEMS = [
  '顶栏「基础数据中心」进入 MDM 侧栏；路由在 js/router.js 注册，侧栏在 js/components/layout.js。',
  '列表页样式：css/pages/erp-records.css；通用控件：js/utils/erp-ui.js。',
  '本地开发：npm run dev（Vite），勿用 file:// 打开。',
];

/**
 * @param {HTMLElement} container
 */
export function render(container) {
  empty(container);
  const root = el('div', 'welcome-page');

  const header = el('div', 'welcome-page__header');
  header.appendChild(el('h1', 'welcome-page__title', '冷丰 ERP · 工作台'));
  header.appendChild(
    el(
      'p',
      'welcome-page__sub',
      '基础数据中心（MDM）承载门店、供应商、运力与内容生产等主数据；以下为模块导航与界面说明，列表数据为前端演示数据集。',
    ),
  );
  root.appendChild(header);

  const mdmSection = el('section', 'welcome-page__section');
  mdmSection.appendChild(el('h2', 'welcome-page__section-title', '基础数据中心（MDM）'));
  const pre = el('pre', 'welcome-page__tree');
  pre.textContent = MDM_TREE.join('\n');
  mdmSection.appendChild(pre);
  root.appendChild(mdmSection);

  const specSection = el('section', 'welcome-page__section');
  specSection.appendChild(el('h2', 'welcome-page__section-title', '开发说明'));
  const ul = el('ul', 'welcome-page__spec-list');
  SPEC_ITEMS.forEach((text) => {
    const li = el('li', 'welcome-page__spec-item', text);
    ul.appendChild(li);
  });
  specSection.appendChild(ul);
  root.appendChild(specSection);

  const note = el(
    'p',
    'welcome-page__note',
    '默认页签路由为 dashboard；从顶栏切换到「基础数据中心」后，侧栏首项为「主体中心 — 门店」。',
  );
  root.appendChild(note);

  container.appendChild(root);
}
