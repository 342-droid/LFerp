/**
 * C 端会员 — 右侧详情抽屉（与其它档案抽屉同交互）：板块菜单 + 多 Tab 内容。
 */
import { el } from './dom.js';
import { button, textInput, selectInput, fieldRow, paginationBar } from './erp-ui.js';
import { createSettlementUploadSection } from './drawer-settlement-uploads.js';

export function removeMemberDetailDrawer() {
  document.querySelectorAll('[data-member-detail-drawer]').forEach((n) => n.remove());
}

/**
 * 有值时推荐人姓名用警示色；无数据不加样式。
 * @param {string} v
 * @returns {string | undefined}
 */
function refDangerMod(v) {
  if (v == null || v === '' || v === '—') return undefined;
  return 'member-detail-text--danger';
}

/**
 * @param {Record<string, unknown>} member 列表行数据
 * @param {'detail'|'growth'|'assets'|'stores'|'watch'|'orders'} [initialTab]
 */
export function openMemberDetailDrawer(member, initialTab = 'detail') {
  removeMemberDetailDrawer();

  const rec = enrichMemberRecord(member);

  const backdrop = el('div', 'store-drawer-backdrop');
  backdrop.setAttribute('data-member-detail-drawer', '1');

  const drawer = el('aside', 'store-drawer store-drawer--member-wide');
  drawer.setAttribute('data-member-detail-drawer', '1');

  const shut = () => {
    backdrop.remove();
    drawer.remove();
  };

  const header = el('div', 'store-drawer__header');
  header.appendChild(el('h2', 'store-drawer__title', '会员详情'));
  const btnClose = el('button', 'store-drawer__close');
  btnClose.type = 'button';
  btnClose.innerHTML = '&times;';
  btnClose.addEventListener('click', shut);
  header.appendChild(btnClose);

  const hero = el('div', 'store-drawer__hero');
  const nameRow = el('div', 'store-drawer__name-row');
  nameRow.appendChild(el('span', 'store-drawer__name', rec.nickname));
  hero.appendChild(nameRow);
  hero.appendChild(
    el('div', 'store-drawer__meta', `会员ID：${rec.id}${rec.phone ? ` · ${rec.phone}` : ''}`),
  );

  const tabsWrap = el('div', 'store-drawer__tabs');
  const tabIds = ['detail', 'growth', 'assets', 'stores', 'watch', 'orders'];
  const tabLabels = ['会员详情', '成长值', '会员资产', '绑定门店', '观看记录', '订单记录'];

  const bodyHost = el('div', 'store-drawer__body');

  const panels = {
    detail: panelMemberDetail(rec),
    growth: panelMemberGrowth(rec),
    assets: panelMemberAssets(),
    stores: panelBindStores(),
    watch: panelWatchRecords(),
    orders: panelOrderRecords(),
  };

  const tabs = tabIds.map((id, i) => {
    const btn = el('button', 'store-drawer__tab', tabLabels[i]);
    btn.type = 'button';
    btn.addEventListener('click', () => showTab(id));
    tabsWrap.appendChild(btn);
    return btn;
  });

  function showTab(id) {
    tabIds.forEach((tid, j) => {
      tabs[j].classList.toggle('is-active', tid === id);
    });
    bodyHost.replaceChildren(panels[id]);
  }

  drawer.appendChild(header);
  drawer.appendChild(hero);
  drawer.appendChild(tabsWrap);
  drawer.appendChild(bodyHost);

  const idx = tabIds.indexOf(initialTab);
  showTab(tabIds[idx >= 0 ? idx : 0]);

  backdrop.addEventListener('click', shut);
  drawer.addEventListener('click', (e) => e.stopPropagation());

  document.body.appendChild(backdrop);
  document.body.appendChild(drawer);
}

/**
 * @param {Record<string, unknown>} m
 */
function enrichMemberRecord(m) {
  return {
    id: String(m.id ?? '—'),
    nickname: String(m.nickname ?? '—'),
    avatarText: String(m.avatarText ?? m.nickname?.[0] ?? '—'),
    phone: String(m.phone ?? '—'),
    gender: String(m.gender ?? '—'),
    isMember: String(m.isMember ?? '—'),
    tags: String(m.tags ?? '—'),
    source: String(m.source ?? '—'),
    birthday: String(m.birthday ?? '1992-08-16'),
    district: String(m.district ?? '南京市 · 鼓楼区'),
    bindMethod: String(m.bindMethod ?? '—'),
    channelCount: String(m.channelCount ?? '—'),
    points: String(m.points ?? '—'),
    satisMinutes: String(m.satisMinutes ?? '—'),
    satisFeedback: String(m.satisFeedback ?? '—'),
    growthScore: String(m.growthScore ?? '1485'),
    growthTotal: String(m.growthTotal ?? '3260'),
    amount: String(m.amount ?? '—'),
    orderCount: String(m.orderCount ?? '—'),
    lastConsume: String(m.lastConsume ?? '—'),
    status: String(m.status ?? '—'),
    superiorReferrer: m.superiorReferrer != null ? String(m.superiorReferrer) : '—',
    grandReferrer: m.grandReferrer != null ? String(m.grandReferrer) : '—',
    memberIp: m.memberIp != null ? String(m.memberIp) : '49.65.152.240 江苏南京鼓楼',
    watchTotalMin: m.watchTotalMin != null ? String(m.watchTotalMin) : String(m.satisMinutes ?? '341'),
    liveWatchCount: m.liveWatchCount != null ? String(m.liveWatchCount) : String(m.satisFeedback ?? '342'),
    firstLogin: m.firstLogin != null ? String(m.firstLogin) : '2021-09-09 13:00',
    inviteMemberId: String(m.inviteMemberId ?? 'U10088'),
    inviteNickname: String(m.inviteNickname ?? '邀请达人小王'),
    latestLogin: m.latestLogin != null ? String(m.latestLogin) : '2021-09-19 13:00',
    latestBindStore: m.latestBindStore != null ? String(m.latestBindStore) : '—',
    phoneBrand: m.phoneBrand != null ? String(m.phoneBrand) : '—',
    phoneModel: m.phoneModel != null ? String(m.phoneModel) : '—',
    bindStoreCount: m.bindStoreCount != null ? String(m.bindStoreCount) : String(m.channelCount ?? '2342'),
    level: String(m.level ?? '普通会员'),
  };
}

/**
 * @param {ReturnType<typeof enrichMemberRecord>} rec
 */
function panelMemberDetail(rec) {
  const root = el('div', 'member-drawer-panel');

  root.appendChild(el('div', 'supplier-detail-section-title', '基础信息'));

  const basicHead = el('div', 'member-detail-basic-head');
  const grid = el('div', 'supplier-detail-grid');

  const cells = [
    ['会员ID', rec.id],
    ['会员昵称', rec.nickname],
    ['会员性别', rec.gender],
    ['手机号码', rec.phone],
    ['是否会员', rec.isMember],
    ['会员标签', rec.tags],
    ['会员来源', rec.source],
    ['生日', rec.birthday],
    ['所在城区', rec.district],
    ['绑定方式', rec.bindMethod],
    ['绑定门店数量', rec.bindStoreCount],
    ['上级推荐人', rec.superiorReferrer, refDangerMod(rec.superiorReferrer)],
    ['会员IP', rec.memberIp],
    ['观看总时长(分)', `${rec.watchTotalMin}min`],
    ['观看直播次数', rec.liveWatchCount],
    ['上上级推荐人', rec.grandReferrer, refDangerMod(rec.grandReferrer)],
    ['会员积分', rec.points],
    ['成交金额', `¥${rec.amount}`],
    ['成交订单数', rec.orderCount],
    ['最近消费时间', rec.lastConsume],
    ['第一次登录时间', rec.firstLogin],
    ['注册邀请人', `${rec.inviteMemberId} / ${rec.inviteNickname}`],
    ['最近登录时间', rec.latestLogin],
    ['最近绑定门店名称', rec.latestBindStore],
    ['手机品牌', rec.phoneBrand],
    ['手机型号', rec.phoneModel],
  ];

  cells.forEach(([label, value, mod]) => {
    const cell = el('div', 'supplier-detail-cell');
    cell.appendChild(el('div', 'supplier-detail-cell__label', label));
    const body = el('div', 'supplier-detail-cell__body', value || '—');
    if (mod) body.classList.add(mod);
    cell.appendChild(body);
    grid.appendChild(cell);
  });

  basicHead.appendChild(grid);
  const av = el('div', 'member-detail-avatar-lg', rec.avatarText);
  basicHead.appendChild(av);
  root.appendChild(basicHead);

  root.appendChild(el('div', 'supplier-detail-section-title', '结算信息（暂时不做）'));

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
    inp.readOnly = true;
    inp.disabled = true;
    inp.style.width = '100%';
    body.appendChild(inp);
    cell.appendChild(body);
    settleGrid.appendChild(cell);
  });
  root.appendChild(settleGrid);

  root.appendChild(el('div', 'supplier-detail-section-title', '收货地址'));

  const addrHeaders = ['收件人信息', '收件地址', '收件人联系方式', '地址标签'];
  const addrRows = [
    ['张三', '上海市浦东新区张江路 88 号', '138****2211', '家'],
    ['李四', '杭州市西湖区文三路 256 号', '139****8811', '公司'],
  ];
  root.appendChild(wrapTable(addrHeaders, addrRows, ''));
  root.appendChild(paginationBar({ total: 12, page: 1, pageSize: 10 }));

  return root;
}

function panelMemberAssets() {
  const root = el('div', 'member-drawer-panel');

  root.appendChild(el('div', 'supplier-detail-section-title', '会员积分明细'));
  const ptHeaders = ['时间', '类型', '数据', '余额', '订单编号'];
  const ptRows = [
    ['2024-07-14 16:00', '积分抵扣', '-17.00', '5000.00', 'NO.2311312313'],
    ['2024-07-13 10:00', '观看直播收入', '+17.00', '5017.00', ''],
    ['2024-07-12 09:30', '后台添加', '+100.00', '5000.00', ''],
  ];
  root.appendChild(wrapTable(ptHeaders, ptRows, 'member-drawer-table--center'));
  root.appendChild(paginationBar({ total: 28, page: 1, pageSize: 10 }));

  root.appendChild(el('div', 'supplier-detail-section-title member-detail-section--spaced', '会员优惠券'));
  const cpHeaders = [
    '优惠券类型',
    '优惠券名称',
    '优惠券金额',
    '领取时间',
    '有效期',
    '使用日期',
    '优惠券状态',
    '关联订单',
  ];
  const cpRows = [
    ['平台优惠券', '优惠券名称', '5.00', '2021-12-12 13:00', '2021-12-12 ~ 2021-12-22', '-', '待使用', '-'],
    ['平台优惠券', '优惠券名称', '10.00', '2021-12-10 13:00', '2021-12-10 ~ 2021-12-20', '2021-12-15', '已使用', '23423423422342'],
    ['平台优惠券', '优惠券名称', '3.00', '2020-06-01 13:00', '2020-06-01 ~ 2020-06-05', '-', '已过期', '-'],
  ];
  root.appendChild(wrapTable(cpHeaders, cpRows, 'member-drawer-table--center'));
  root.appendChild(paginationBar({ total: 16, page: 1, pageSize: 10 }));

  return root;
}

/**
 * @param {ReturnType<typeof enrichMemberRecord>} rec
 */
function panelMemberGrowth(rec) {
  const root = el('div', 'member-drawer-panel');
  root.appendChild(el('div', 'supplier-detail-section-title', '成长值'));

  const summary = el('div', 'member-growth-summary');
  [
    ['当前等级', rec.level || '—'],
    ['成长值', rec.growthScore || '—'],
    ['累计成长值', rec.growthTotal || '—'],
  ].forEach(([label, value]) => {
    const card = el('div', 'member-growth-summary__item');
    card.appendChild(el('div', 'member-growth-summary__label', label));
    card.appendChild(el('div', 'member-growth-summary__value', value));
    summary.appendChild(card);
  });
  root.appendChild(summary);

  const allRows = [
    {
      occurAt: '2026-07-20 14:20:03',
      acquireType: '购物消费',
      acquireSub: '订单完成',
      change: '+86',
      afterValue: String(rec.growthScore || '1485'),
      status: '有效',
      refNo: 'ORD-3212689201598341',
      remark: '订单实付 ¥86.00',
    },
    {
      occurAt: '2026-07-18 08:01:12',
      acquireType: '用户活跃',
      acquireSub: '每日签到',
      change: '+5',
      afterValue: '1399',
      status: '有效',
      refNo: '—',
      remark: '每日签到',
    },
    {
      occurAt: '2026-06-12 19:33:41',
      acquireType: '购物消费',
      acquireSub: '订单完成',
      change: '+129',
      afterValue: '1394',
      status: '有效',
      refNo: 'ORD-3212689201588561',
      remark: '订单实付 ¥129.50',
    },
    {
      occurAt: '2026-05-24 21:15:08',
      acquireType: '购物消费',
      acquireSub: '售后完成',
      change: '-30',
      afterValue: '1265',
      status: '有效',
      refNo: 'AS202605240018',
      remark: '售后退款扣减成长值',
    },
    {
      occurAt: '2025-12-01 10:00:00',
      acquireType: '手工调整',
      acquireSub: '手工增加',
      change: '+200',
      afterValue: '980',
      status: '过期',
      refNo: '—',
      remark: '活动补偿',
    },
  ];

  const state = { timeStart: '', timeEnd: '', acquireType: '', status: '' };

  const toolbar = el('div', 'erp-toolbar member-drawer-filter-toolbar');
  const timeStart = textInput('');
  timeStart.type = 'datetime-local';
  timeStart.step = '1';
  const timeEnd = textInput('');
  timeEnd.type = 'datetime-local';
  timeEnd.step = '1';
  const timeWrap = el('div', 'member-growth-time-range');
  timeWrap.appendChild(timeStart);
  timeWrap.appendChild(el('span', 'member-growth-time-range__sep', '至'));
  timeWrap.appendChild(timeEnd);
  toolbar.appendChild(fieldRow('获取时间', timeWrap));
  toolbar.appendChild(
    fieldRow(
      '获取方式',
      selectInput(
        [
          { value: '', label: '全部' },
          { value: '购物消费', label: '购物消费' },
          { value: '用户活跃', label: '用户活跃' },
          { value: '手工调整', label: '手工调整' },
        ],
        '',
      ),
    ),
  );
  toolbar.appendChild(
    fieldRow(
      '状态',
      selectInput(
        [
          { value: '', label: '全部' },
          { value: '有效', label: '有效' },
          { value: '过期', label: '过期' },
        ],
        '',
      ),
    ),
  );
  const ta = el('div', 'erp-toolbar__actions');
  const btnReset = button('重置', 'default');
  btnReset.classList.add('erp-btn--outline-primary');
  const btnQuery = button('查询', 'primary');
  ta.appendChild(btnReset);
  ta.appendChild(btnQuery);
  toolbar.appendChild(ta);
  root.appendChild(toolbar);

  const tableHost = el('div', 'member-growth-table-host');
  root.appendChild(tableHost);
  const pageHost = el('div', 'member-growth-page-host');
  root.appendChild(pageHost);

  const typeSel = toolbar.querySelectorAll('select')[0];
  const statusSel = toolbar.querySelectorAll('select')[1];

  function toComparable(v) {
    return String(v || '').replace('T', ' ').slice(0, 19);
  }

  function getFiltered() {
    return allRows.filter((row) => {
      if (state.timeStart && toComparable(row.occurAt) < toComparable(state.timeStart)) return false;
      if (state.timeEnd && toComparable(row.occurAt) > toComparable(state.timeEnd)) return false;
      if (state.acquireType && row.acquireType !== state.acquireType) return false;
      if (state.status && row.status !== state.status) return false;
      return true;
    });
  }

  function renderList() {
    const filtered = getFiltered();
    tableHost.replaceChildren();
    pageHost.replaceChildren();
    const headers = ['获取时间', '获取方式', '明细类型', '变动值', '变动后成长值', '状态', '关联单号', '备注'];
    const rows = filtered.map((row) => [
      row.occurAt,
      row.acquireType,
      row.acquireSub,
      row.change,
      row.afterValue,
      row.status,
      row.refNo,
      row.remark,
    ]);
    tableHost.appendChild(
      wrapTable(headers, rows.length ? rows : [['—', '—', '—', '—', '—', '—', '—', '暂无匹配明细']], 'member-drawer-table--wide'),
    );
    pageHost.appendChild(paginationBar({ total: filtered.length, page: 1, pageSize: 10 }));
  }

  btnQuery.addEventListener('click', () => {
    state.timeStart = timeStart.value || '';
    state.timeEnd = timeEnd.value || '';
    state.acquireType = typeSel ? typeSel.value : '';
    state.status = statusSel ? statusSel.value : '';
    if (state.timeStart && state.timeEnd && toComparable(state.timeStart) > toComparable(state.timeEnd)) {
      window.alert('获取时间起始不能晚于结束时间');
      return;
    }
    renderList();
  });

  btnReset.addEventListener('click', () => {
    timeStart.value = '';
    timeEnd.value = '';
    if (typeSel) typeSel.value = '';
    if (statusSel) statusSel.value = '';
    state.timeStart = '';
    state.timeEnd = '';
    state.acquireType = '';
    state.status = '';
    renderList();
  });

  renderList();
  return root;
}

function panelBindStores() {
  const root = el('div', 'member-drawer-panel');
  root.appendChild(el('div', 'supplier-detail-section-title', '绑定门店'));
  const headers = [
    '门店名称',
    '省市区',
    '详细地址',
    '绑定方式',
    '绑定时间',
    '观看时长',
    '消费金额',
    '下单次数',
    '退款金额',
    '退款次数',
  ];
  const rows = [
    ['—', '—', '—', '—', '—', '—', '—', '—', '—', '—'],
  ];
  root.appendChild(wrapTable(headers, rows, ''));
  root.appendChild(paginationBar({ total: 0, page: 1, pageSize: 10 }));
  return root;
}

function panelWatchRecords() {
  const root = el('div', 'member-drawer-panel');

  root.appendChild(el('div', 'supplier-detail-section-title', '观看记录'));

  const toolbar = el('div', 'erp-toolbar member-drawer-filter-toolbar');
  toolbar.appendChild(fieldRow('门店名称', textInput('请输入门店名称')));
  const rangePh = textInput('请选择观看时间（支持区间）');
  rangePh.readOnly = true;
  toolbar.appendChild(fieldRow('观看时间', rangePh));
  const ta = el('div', 'erp-toolbar__actions');
  const b1 = button('重置', 'default');
  b1.classList.add('erp-btn--outline-primary');
  ta.appendChild(b1);
  ta.appendChild(button('查询', 'primary'));
  toolbar.appendChild(ta);
  root.appendChild(toolbar);

  const headers = [
    '观看时间',
    '门店名称',
    '直播间名称',
    '直播场次ID',
    '观看时长',
    '下单次数',
    '点赞次数',
    '分享次数',
    '互动次数',
    '累计消费金额',
    '下单商品类目',
  ];
  const rows = [
    [
      '2020-01-01 13:00',
      '演示门店A',
      '品牌日播间',
      'SES-10001',
      '32min',
      '1',
      '12',
      '2',
      '5',
      '¥199.00',
      '饮品 / 乳品',
    ],
  ];
  root.appendChild(wrapTable(headers, rows, 'member-drawer-table--wide'));
  root.appendChild(paginationBar({ total: 56, page: 1, pageSize: 10 }));

  return root;
}

function panelOrderRecords() {
  const root = el('div', 'member-drawer-panel');

  root.appendChild(el('div', 'supplier-detail-section-title', '订单记录'));

  const toolbar = el('div', 'erp-toolbar member-drawer-filter-toolbar');
  toolbar.appendChild(fieldRow('订单号', textInput('请输入订单号')));
  const ot = textInput('请选择订单时间');
  ot.readOnly = true;
  toolbar.appendChild(fieldRow('生成订单时间', ot));
  toolbar.appendChild(
    fieldRow(
      '交易状态',
      selectInput(
        [
          { value: '', label: '请选择' },
          { value: 'paid', label: '已支付' },
          { value: 'refund', label: '已退款' },
        ],
        '',
      ),
    ),
  );
  toolbar.appendChild(fieldRow('直播间ID', textInput('请输入直播间ID')));
  const ta = el('div', 'erp-toolbar__actions');
  const br = button('重置', 'default');
  br.classList.add('erp-btn--outline-primary');
  ta.appendChild(br);
  ta.appendChild(button('查询', 'primary'));
  toolbar.appendChild(ta);
  root.appendChild(toolbar);

  const headers = ['订单号', '关联直播间ID', '订单时间', '实付金额', '生成订单时间', '交易状态'];
  const rows = [['ORD-202001011300001', 'LR-88302', '2020-01-01 13:00', '¥128.00', '2020-01-01 12:55', '已支付']];
  root.appendChild(wrapTable(headers, rows, ''));
  root.appendChild(paginationBar({ total: 120, page: 1, pageSize: 10 }));

  return root;
}

/**
 * @param {string[]} headers
 * @param {string[][]} rows
 * @param {string} wrapExtraClass
 */
function wrapTable(headers, rows, wrapExtraClass) {
  const wrap = el('div', 'erp-table-scroll');
  if (wrapExtraClass) wrap.classList.add(...wrapExtraClass.split(' ').filter(Boolean));
  const table = el('table', 'erp-table');
  const thead = el('thead');
  const trh = el('tr');
  headers.forEach((h) => trh.appendChild(el('th', '', h)));
  thead.appendChild(trh);
  const tbody = el('tbody');
  rows.forEach((cells) => {
    const tr = el('tr');
    cells.forEach((text) => {
      const td = el('td', '');
      td.textContent = text;
      if (String(text).includes('\n')) {
        td.style.whiteSpace = 'pre-wrap';
        td.style.verticalAlign = 'top';
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
