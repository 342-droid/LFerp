/**
 * 人员中心 — BD 详情右侧抽屉（与门店/资源/会员详情同交互）
 */
import { el } from './dom.js';
import { button, textInput, selectInput, fieldRow, paginationBar } from './erp-ui.js';
import { createSettlementUploadSection } from './drawer-settlement-uploads.js';

export function removeBdDetailDrawer() {
  document.querySelectorAll('[data-bd-detail-drawer]').forEach((n) => n.remove());
}

/**
 * @param {Record<string, unknown>} rec BD 列表行
 * @param {'base'|'locked'|'comm'|'perf'} [initialTab]
 */
export function openBdDetailDrawer(rec, initialTab = 'base') {
  removeBdDetailDrawer();

  const backdrop = el('div', 'store-drawer-backdrop');
  backdrop.setAttribute('data-bd-detail-drawer', '1');

  const drawer = el('aside', 'store-drawer store-drawer--bd-wide');
  drawer.setAttribute('data-bd-detail-drawer', '1');

  const shut = () => {
    backdrop.remove();
    drawer.remove();
  };

  const header = el('div', 'store-drawer__header');
  header.appendChild(el('h2', 'store-drawer__title', 'BD详情'));
  const btnClose = el('button', 'store-drawer__close');
  btnClose.type = 'button';
  btnClose.innerHTML = '&times;';
  btnClose.addEventListener('click', shut);
  header.appendChild(btnClose);

  const hero = el('div', 'store-drawer__hero');
  const nameRow = el('div', 'store-drawer__name-row');
  nameRow.appendChild(el('span', 'store-drawer__name', String(rec.name ?? '—')));
  hero.appendChild(nameRow);
  hero.appendChild(
    el('div', 'store-drawer__meta', `BD推广员ID：${rec.id ?? '—'} · ${rec.phone ?? '—'}`),
  );

  const tabsWrap = el('div', 'store-drawer__tabs');
  const tabIds = ['base', 'locked', 'comm', 'perf'];
  const tabLabels = ['基础信息', '已锁定门店', '分佣明细', '业绩报表'];

  const bodyHost = el('div', 'store-drawer__body');

  const panels = {
    base: panelBase(rec),
    locked: panelLockedStores(),
    comm: panelCommission(),
    perf: panelPerformance(),
  };

  const tabs = tabIds.map((id, i) => {
    const t = el('button', 'store-drawer__tab', tabLabels[i]);
    t.type = 'button';
    t.addEventListener('click', () => showTab(id));
    tabsWrap.appendChild(t);
    return t;
  });

  function showTab(id) {
    tabIds.forEach((tid, j) => {
      tabs[j].classList.toggle('is-active', tid === id);
    });
    bodyHost.replaceChildren(panels[id]);
  }

  const footer = el('div', 'store-drawer__footer');
  const bBack = button('返回', 'default');
  bBack.classList.add('erp-btn--outline-primary');
  bBack.addEventListener('click', shut);
  const bOk = button('确定', 'primary');
  bOk.addEventListener('click', shut);
  footer.appendChild(bBack);
  footer.appendChild(bOk);

  drawer.appendChild(header);
  drawer.appendChild(hero);
  drawer.appendChild(tabsWrap);
  drawer.appendChild(bodyHost);
  drawer.appendChild(footer);

  const idx = tabIds.indexOf(initialTab);
  showTab(tabIds[idx >= 0 ? idx : 0]);

  backdrop.addEventListener('click', shut);
  drawer.addEventListener('click', (e) => e.stopPropagation());

  document.body.appendChild(backdrop);
  document.body.appendChild(drawer);
}

/**
 * @param {Record<string, unknown>} rec
 */
function panelBase(rec) {
  const root = el('div', 'member-drawer-panel');

  root.appendChild(el('div', 'supplier-detail-section-title', '基础信息'));

  const grid = el('div', 'supplier-detail-grid');
  const cells = [
    ['BD推广ID', rec.id],
    ['BD姓名', rec.name],
    ['手机号码', rec.phone],
    ['BD分类', rec.categoryLabel],
    ['BD身份', rec.identityLabel],
    ['BD上级', rec.superiorLabel],
    ['推广门店数量', rec.storeCount],
    ['总分佣金额', rec.totalCommission],
  ];
  cells.forEach(([label, value]) => {
    grid.appendChild(detailCell(label, value));
  });
  const last = el('div', 'supplier-detail-cell supplier-detail-cell--span4');
  last.appendChild(el('div', 'supplier-detail-cell__label', '总提现金额'));
  last.appendChild(
    el('div', 'supplier-detail-cell__body', rec.totalWithdraw != null ? String(rec.totalWithdraw) : '—'),
  );
  grid.appendChild(last);
  root.appendChild(grid);

  root.appendChild(el('div', 'supplier-detail-section-title', '结算信息'));

  root.appendChild(createSettlementUploadSection());

  const settleGrid = el('div', 'supplier-detail-grid');
  [
    ['身份证号', '请输入身份证号'],
    ['银行卡号', '请输入银行卡号'],
    ['开户支行', '请输入开户支行'],
    ['开户名', '请输入开户名'],
    ['开户城市', '省-市-区'],
  ].forEach(([lab, ph]) => {
    const cell = el('div', 'supplier-detail-cell');
    cell.appendChild(el('div', 'supplier-detail-cell__label', lab));
    const body = el('div', 'supplier-detail-cell__body');
    const inp = textInput(ph);
    inp.style.width = '100%';
    body.appendChild(inp);
    cell.appendChild(body);
    settleGrid.appendChild(cell);
  });
  root.appendChild(settleGrid);

  return root;
}

/**
 * @param {string} label
 * @param {unknown} value
 */
function detailCell(label, value) {
  const cell = el('div', 'supplier-detail-cell');
  cell.appendChild(el('div', 'supplier-detail-cell__label', label));
  cell.appendChild(
    el('div', 'supplier-detail-cell__body', value != null && value !== '' ? String(value) : '—'),
  );
  return cell;
}

function lockedStoreFilterToolbar() {
  const tb = el('div', 'erp-toolbar member-drawer-filter-toolbar');
  tb.appendChild(fieldRow('店铺名称', textInput('请输入店铺名称')));
  tb.appendChild(fieldRow('手机号码', textInput('请输入手机号码')));
  tb.appendChild(
    fieldRow(
      '进件状态',
      selectInput(
        [
          { value: '', label: '请选择' },
          { value: 'done', label: '已进件' },
          { value: 'ing', label: '进件中' },
          { value: 'none', label: '未进件' },
        ],
        '',
      ),
    ),
  );
  tb.appendChild(
    fieldRow(
      '微信认证',
      selectInput(
        [
          { value: '', label: '请选择' },
          { value: 'yes', label: '已认证' },
          { value: 'no', label: '未认证' },
        ],
        '',
      ),
    ),
  );
  tb.appendChild(
    fieldRow(
      '支付宝认证',
      selectInput(
        [
          { value: '', label: '请选择' },
          { value: 'yes', label: '已认证' },
          { value: 'no', label: '未认证' },
        ],
        '',
      ),
    ),
  );
  const ta = el('div', 'erp-toolbar__actions');
  const br = button('重置', 'default');
  br.classList.add('erp-btn--outline-primary');
  ta.appendChild(br);
  ta.appendChild(button('查询', 'primary'));
  tb.appendChild(ta);
  return tb;
}

function panelLockedStores() {
  const root = el('div', 'member-drawer-panel');
  root.appendChild(el('div', 'supplier-detail-section-title', '已锁定门店'));
  root.appendChild(lockedStoreFilterToolbar());

  const headers = [
    '门店ID',
    '门店名称',
    '门店分组',
    '门店标签',
    '省市区',
    '详细地址',
    '手机号码',
    '联系人',
    '进件状态',
    '微信认证',
    '支付宝认证',
    '配送方式',
  ];
  const rows = [
    [
      'ST-10001',
      '演示旗舰店',
      '华东',
      '重点',
      '上海市/市辖区/浦东新区',
      '张江路88号',
      '138****2211',
      '李店',
      '已进件',
      '已认证',
      '已认证',
      '',
    ],
  ];
  root.appendChild(wrapTableBlueHead(headers, rows, true));
  root.appendChild(paginationBar({ total: 86, page: 1, pageSize: 10 }));
  return root;
}

function panelCommission() {
  const root = el('div', 'member-drawer-panel');
  root.appendChild(el('div', 'supplier-detail-section-title', '分佣明细'));
  root.appendChild(lockedStoreFilterToolbar());

  const headers = [
    '订单ID',
    '下单时间',
    '商品信息',
    '实付金额',
    '买家信息',
    '佣金',
    '交易状态',
    '分佣比例',
  ];
  const rows = [
    [
      'ORD-20260101120001',
      '2026-01-01 12:00',
      '冷鲜牛肉500g×2',
      '¥268.00',
      '用户***12',
      '¥13.40',
      '已完成',
      '5%',
    ],
  ];
  root.appendChild(wrapTableBlueHead(headers, rows, false));
  root.appendChild(paginationBar({ total: 240, page: 1, pageSize: 10 }));
  return root;
}

function panelPerformance() {
  const root = el('div', 'member-drawer-panel');
  root.appendChild(el('div', 'supplier-detail-section-title', '业绩报表'));

  const sum = el('div', 'store-summary-bar');
  sum.appendChild(el('span', '', '成交金额：¥128,600.00'));
  sum.appendChild(el('span', '', '订单数：1,024'));
  sum.appendChild(el('span', '', '退款金额：¥3,200.00'));
  root.appendChild(sum);

  root.appendChild(lockedStoreFilterToolbar());

  const headers = [
    '统计日期',
    '门店名称',
    '成交金额',
    '订单数',
    '退款金额',
    '退款单数',
    '结算方式',
  ];
  const rows = [
    ['2026-04-01', '演示旗舰店', '¥18,200.00', '126', '¥0.00', '0', '全额到账'],
  ];
  root.appendChild(wrapTableBlueHead(headers, rows, false));
  root.appendChild(paginationBar({ total: 90, page: 1, pageSize: 10 }));
  return root;
}

/**
 * @param {string[]} headers
 * @param {string[][]} rows
 * @param {boolean} lastColLink 末列「查看详情」链接
 */
function wrapTableBlueHead(headers, rows, lastColLink) {
  const wrap = el('div', 'erp-table-scroll bd-detail-table--blue-head');
  const table = el('table', 'erp-table');
  const thead = el('thead');
  const trh = el('tr');
  headers.forEach((h) => trh.appendChild(el('th', '', h)));
  thead.appendChild(trh);
  const tbody = el('tbody');
  rows.forEach((cells) => {
    const tr = el('tr');
    cells.forEach((text, ci) => {
      const td = el('td', '');
      const last = ci === cells.length - 1;
      if (lastColLink && last) {
        const a = el('a', 'erp-link', '查看详情');
        a.href = '#';
        a.addEventListener('click', (e) => e.preventDefault());
        td.appendChild(a);
      } else {
        td.textContent = text;
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(thead);
  table.appendChild(tbody);
  wrap.appendChild(table);
  return wrap;
}
