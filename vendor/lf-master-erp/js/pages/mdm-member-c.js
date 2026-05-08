/**
 * 会员中心 — C端会员（会员列表）
 * 筛选：会员ID / 绑定方式 / 手机号码 / 查询；表格列与操作；发放扣除积分、派送优惠券弹窗。
 */
import { empty, el } from '../utils/dom.js';
import { breadcrumb, button, textInput, selectInput } from '../utils/erp-ui.js';
import { openMemberDetailDrawer, removeMemberDetailDrawer } from '../utils/member-detail-drawer.js';

let removeMemberCUi = () => {};

function sfModalLabel(text, required) {
  const lab = el('label', 'erp-modal-field__label');
  if (required) lab.appendChild(el('span', 'erp-req', '*'));
  lab.appendChild(document.createTextNode(text));
  return lab;
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {{ page: number, pageSize: number, total: number, onPage: (p: number) => void }} opts
 */
function createPaginationBar(opts) {
  const { page, pageSize, total, onPage } = opts;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  const bar = el('div', 'erp-pagination');
  bar.appendChild(el('span', 'erp-pagination__total', `共 ${total} 条`));
  const mid = el('div', 'erp-pagination__mid');
  mid.appendChild(el('span', 'erp-pagination__hint', `${pageSize} 条/页`));
  const pages = el('div', 'erp-pagination__pages');
  const windowStart = Math.max(1, Math.min(page - 1, maxPage - 2));
  for (let p = windowStart; p <= Math.min(maxPage, windowStart + 2); p += 1) {
    const b = el('button', `erp-page-btn${p === page ? ' is-active' : ''}`, String(p));
    b.type = 'button';
    b.addEventListener('click', () => onPage(p));
    pages.appendChild(b);
  }
  mid.appendChild(pages);
  bar.appendChild(mid);
  const right = el('div', 'erp-pagination__right');
  right.appendChild(el('span', 'erp-pagination__goto-label', '前往'));
  const inp = el('input', 'erp-pagination__goto-input');
  inp.type = 'number';
  inp.min = '1';
  inp.max = String(maxPage);
  inp.value = String(Math.min(page, maxPage));
  inp.addEventListener('change', () => {
    const v = Math.min(maxPage, Math.max(1, Number(inp.value) || 1));
    onPage(v);
  });
  right.appendChild(inp);
  right.appendChild(el('span', 'erp-pagination__goto-label', '页'));
  bar.appendChild(right);
  return bar;
}

const BIND_OPTIONS = [
  { value: '', label: '全部' },
  { value: '微信', label: '微信' },
  { value: '手机', label: '手机' },
  { value: '隐私', label: '隐私' },
];

const HEADERS = [
  '会员ID',
  '会员昵称',
  '会员头像',
  '手机号码',
  '性别',
  '是否会员',
  '会员标签',
  '会员来源',
  '绑定方式',
  '绑定渠道数量',
  '会员积分',
  '满意度时长(分)',
  '满意度反馈次数(建议)',
  '会员成长分',
  '成交金额',
  '成交订单数',
  '最近消费时间',
  '状态',
  '操作',
];

const MOCK_MEMBERS = [
  {
    id: 'U10001',
    nickname: '小程序用户A',
    avatarText: '程',
    phone: '138****2211',
    gender: '女',
    isMember: '是',
    tags: '高活跃',
    source: '微信小程序',
    bindMethod: '微信',
    channelCount: '2',
    points: '12580',
    satisMinutes: '128',
    satisFeedback: '3',
    growthScore: '860',
    amount: '3688.00',
    orderCount: '12',
    lastConsume: '2026-04-25 14:20:03',
    status: '正常',
  },
  {
    id: 'U10002',
    nickname: 'APP会员B',
    avatarText: 'B',
    phone: '139****9033',
    gender: '男',
    isMember: '是',
    tags: '储值',
    source: 'APP',
    bindMethod: '手机',
    channelCount: '1',
    points: '5320',
    satisMinutes: '45',
    satisFeedback: '1',
    growthScore: '420',
    amount: '1299.50',
    orderCount: '5',
    lastConsume: '2026-04-22 09:15:44',
    status: '正常',
  },
  {
    id: 'U10003',
    nickname: '访客C',
    avatarText: '访',
    phone: '—',
    gender: '未知',
    isMember: '否',
    tags: '—',
    source: '微信小程序',
    bindMethod: '隐私',
    channelCount: '0',
    points: '0',
    satisMinutes: '0',
    satisFeedback: '0',
    growthScore: '10',
    amount: '0.00',
    orderCount: '0',
    lastConsume: '—',
    status: '冻结',
  },
];

for (let i = 4; i <= 14; i += 1) {
  const id = `U100${i < 10 ? `0${i}` : i}`;
  MOCK_MEMBERS.push({
    id,
    nickname: `演示会员${i}`,
    avatarText: String(i % 10),
    phone: `137****${1000 + i}`,
    gender: i % 2 ? '男' : '女',
    isMember: i % 4 === 0 ? '否' : '是',
    tags: i % 3 === 0 ? '新客' : '复购',
    source: i % 2 ? 'APP' : '微信小程序',
    bindMethod: ['微信', '手机', '隐私'][i % 3],
    channelCount: String(i % 4),
    points: String(i * 820),
    satisMinutes: String(i * 11),
    satisFeedback: String(i % 5),
    growthScore: String(100 + i * 20),
    amount: (i * 199.5).toFixed(2),
    orderCount: String(i % 8),
    lastConsume: `2026-04-${10 + (i % 18)} 12:00:00`,
    status: i % 11 === 0 ? '冻结' : '正常',
  });
}

const MOCK_COUPONS = [
  {
    id: 'cp1',
    name: '全场通用减额券',
    type: '通用商品优惠券',
    usage: '满减',
    content: '无门槛减0.1元',
    collectCount: '不限',
    status: '进行中',
    stock: '999',
    unavailable: '—',
  },
  {
    id: 'cp2',
    name: '新品专享券',
    type: '通用商品优惠券',
    usage: '折扣',
    content: '满100减15',
    collectCount: '每人3次',
    status: '进行中',
    stock: '120',
    unavailable: '—',
  },
  {
    id: 'cp3',
    name: '节日回馈券',
    type: '通用商品优惠券',
    usage: '满减',
    content: '满200减40',
    collectCount: '每人1次',
    status: '未开始',
    stock: '50',
    unavailable: '未到使用时间',
  },
];

function filterMembers(list, q) {
  const id = (q.memberId || '').trim().toLowerCase();
  const phone = (q.phone || '').trim().toLowerCase();
  const bind = q.bindMethod || '';
  return list.filter((m) => {
    if (id && !String(m.id).toLowerCase().includes(id)) return false;
    if (phone && !String(m.phone).toLowerCase().includes(phone)) return false;
    if (bind && m.bindMethod !== bind) return false;
    return true;
  });
}

function formatMoney(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return escapeHtml(String(v ?? ''));
  return escapeHtml(n.toFixed(2));
}

function openPointsModal(member) {
  removeMemberCUi();
  const backdrop = el('div', 'erp-modal-backdrop');
  backdrop.setAttribute('data-member-c-ui', '1');
  const modal = el('div', 'erp-modal erp-modal--member-c-points');
  const header = el('div', 'erp-modal__header');
  header.appendChild(el('h2', 'erp-modal__title', '发放/扣除积分'));
  const bx = el('button', 'erp-modal__header-btn');
  bx.type = 'button';
  bx.innerHTML = '<i class="ri-close-line"></i>';
  bx.addEventListener('click', () => backdrop.remove());
  const ha = el('div', 'erp-modal__header-actions');
  ha.appendChild(bx);
  header.appendChild(ha);

  const body = el('div', 'erp-modal__body');

  const rowType = el('div', 'erp-modal-field');
  rowType.appendChild(sfModalLabel('类型', false));
  const typeCtrl = el('div', 'erp-modal-field__control');
  const radioRow = el('div', 'member-c-radio-row');
  const rIssue = document.createElement('input');
  rIssue.type = 'radio';
  rIssue.name = 'mc-points-type';
  rIssue.value = 'issue';
  rIssue.checked = true;
  const rDeduct = document.createElement('input');
  rDeduct.type = 'radio';
  rDeduct.name = 'mc-points-type';
  rDeduct.value = 'deduct';
  const labIssue = el('label', 'member-c-radio-label');
  labIssue.appendChild(rIssue);
  labIssue.appendChild(document.createTextNode(' 发放'));
  const labDeduct = el('label', 'member-c-radio-label');
  labDeduct.appendChild(rDeduct);
  labDeduct.appendChild(document.createTextNode(' 扣除'));
  radioRow.appendChild(labIssue);
  radioRow.appendChild(labDeduct);
  typeCtrl.appendChild(radioRow);
  rowType.appendChild(typeCtrl);
  body.appendChild(rowType);

  const rowQty = el('div', 'erp-modal-field');
  rowQty.appendChild(sfModalLabel('数量', false));
  const qtyCtrl = el('div', 'erp-modal-field__control');
  const qtyInp = el('input', 'erp-input');
  qtyInp.type = 'number';
  qtyInp.min = '1';
  qtyInp.step = '1';
  qtyInp.placeholder = '请输入发放/扣除积分数量';
  qtyCtrl.appendChild(qtyInp);
  rowQty.appendChild(qtyCtrl);
  body.appendChild(rowQty);

  const rowReason = el('div', 'erp-modal-field');
  rowReason.appendChild(sfModalLabel('原因', false));
  const reasonCtrl = el('div', 'erp-modal-field__control');
  const ta = el('textarea', 'erp-textarea');
  ta.maxLength = 150;
  ta.rows = 4;
  ta.placeholder = '请输入发放/扣除原因';
  const counter = el('div', 'member-c-textarea-counter');
  const cntSpan = el('span', '', '0');
  counter.appendChild(cntSpan);
  counter.appendChild(document.createTextNode('/150'));
  const syncCnt = () => {
    cntSpan.textContent = String((ta.value || '').length);
  };
  ta.addEventListener('input', syncCnt);
  reasonCtrl.appendChild(ta);
  reasonCtrl.appendChild(counter);
  rowReason.appendChild(reasonCtrl);
  body.appendChild(rowReason);

  const footer = el('div', 'erp-modal__footer');
  const bCancel = button('取消', 'default');
  const bOk = button('确定', 'primary');
  bCancel.addEventListener('click', () => backdrop.remove());
  bOk.addEventListener('click', () => {
    const type = backdrop.querySelector('input[name="mc-points-type"]:checked')?.value || 'issue';
    const qty = qtyInp.value.trim();
    const reason = (ta.value || '').trim();
    if (!qty || Number(qty) <= 0) {
      alert('请输入有效的积分数量');
      return;
    }
    if (!reason) {
      alert('请输入原因');
      return;
    }
    const label = type === 'deduct' ? '扣除' : '发放';
    alert(`已提交${label}积分：会员 ${member.id}，数量 ${qty}`);
    backdrop.remove();
  });

  footer.appendChild(bCancel);
  footer.appendChild(bOk);

  modal.appendChild(header);
  modal.appendChild(body);
  modal.appendChild(footer);
  backdrop.appendChild(modal);
  backdrop.addEventListener('click', (ev) => {
    if (ev.target === backdrop) backdrop.remove();
  });
  document.body.appendChild(backdrop);
  syncCnt();
}

function openCouponDispatchModal(member) {
  removeMemberCUi();
  const backdrop = el('div', 'erp-modal-backdrop');
  backdrop.setAttribute('data-member-c-ui', '1');
  const modal = el('div', 'erp-modal erp-modal--member-c-coupon');
  const header = el('div', 'erp-modal__header');
  header.appendChild(el('h2', 'erp-modal__title', '派送优惠券'));
  const bx = el('button', 'erp-modal__header-btn');
  bx.type = 'button';
  bx.innerHTML = '<i class="ri-close-line"></i>';
  bx.addEventListener('click', () => backdrop.remove());
  const ha = el('div', 'erp-modal__header-actions');
  ha.appendChild(bx);
  header.appendChild(ha);

  const body = el('div', 'erp-modal__body');
  const tabs = el('div', 'member-coupon-tabs');
  const tab1 = el('button', 'member-coupon-tab is-active');
  tab1.type = 'button';
  tab1.textContent = '商品优惠券';
  tabs.appendChild(tab1);
  body.appendChild(tabs);

  const toolbar = el('div', 'erp-toolbar member-coupon-toolbar');
  const searchInp = textInput('请输入优惠券名称');
  searchInp.classList.add('member-coupon-search');
  searchInp.style.maxWidth = '280px';
  const searchBtn = button('搜索', 'default');
  toolbar.appendChild(searchInp);
  toolbar.appendChild(searchBtn);
  body.appendChild(toolbar);

  const scroll = el('div', 'erp-table-scroll member-c-table-scroll');
  const table = el('table', 'erp-table');
  const thead = el('thead');
  const trh = el('tr');
  ['名称', '类型', '使用方式', '优惠内容', '领取次数', '状态', '库存数', '不可用说明', '操作'].forEach(
    (h) => {
      trh.appendChild(el('th', '', h));
    },
  );
  thead.appendChild(trh);
  const tbody = el('tbody');
  table.appendChild(thead);
  table.appendChild(tbody);
  scroll.appendChild(table);
  body.appendChild(scroll);

  const pagHost = el('div', 'member-coupon-pagination');
  body.appendChild(pagHost);

  let couponPage = 1;
  const couponPageSize = 10;
  let couponKeyword = '';

  function filteredCoupons() {
    const k = couponKeyword.trim().toLowerCase();
    return MOCK_COUPONS.filter((c) => !k || String(c.name).toLowerCase().includes(k));
  }

  function paintCouponTable() {
    const all = filteredCoupons();
    const total = all.length;
    const maxPage = Math.max(1, Math.ceil(total / couponPageSize));
    if (couponPage > maxPage) couponPage = maxPage;
    const start = (couponPage - 1) * couponPageSize;
    const slice = all.slice(start, start + couponPageSize);

    empty(tbody);
    slice.forEach((c) => {
      const tr = el('tr');
      const cells = [
        c.name,
        c.type,
        c.usage,
        c.content,
        c.collectCount,
        c.status,
        c.stock,
        c.unavailable,
      ];
      cells.forEach((text) => tr.appendChild(el('td', '', text)));
      const tdOp = el('td');
      const issueLink = el('a', 'erp-link', '发放');
      issueLink.href = '#';
      issueLink.addEventListener('click', (e) => {
        e.preventDefault();
        alert(`已向会员 ${member.id} 发放优惠券：${c.name}`);
      });
      tdOp.appendChild(issueLink);
      tr.appendChild(tdOp);
      tbody.appendChild(tr);
    });

    empty(pagHost);
    pagHost.appendChild(
      createPaginationBar({
        page: couponPage,
        pageSize: couponPageSize,
        total,
        onPage: (p) => {
          couponPage = p;
          paintCouponTable();
        },
      }),
    );
  }

  searchBtn.addEventListener('click', () => {
    couponKeyword = searchInp.value || '';
    couponPage = 1;
    paintCouponTable();
  });
  searchInp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      couponKeyword = searchInp.value || '';
      couponPage = 1;
      paintCouponTable();
    }
  });

  paintCouponTable();

  const footer = el('div', 'erp-modal__footer');
  const bCancel = button('取消', 'default');
  const bOk = button('确定', 'primary');
  bCancel.addEventListener('click', () => backdrop.remove());
  bOk.addEventListener('click', () => {
    alert(`已确认派送（演示）：会员 ${member.id}`);
    backdrop.remove();
  });
  footer.appendChild(bCancel);
  footer.appendChild(bOk);

  modal.appendChild(header);
  modal.appendChild(body);
  modal.appendChild(footer);
  backdrop.appendChild(modal);
  backdrop.addEventListener('click', (ev) => {
    if (ev.target === backdrop) backdrop.remove();
  });
  document.body.appendChild(backdrop);
}

/**
 * @param {HTMLElement} container
 */
export function render(container) {
  removeMemberCUi();
  empty(container);

  let members = [...MOCK_MEMBERS];
  let query = { memberId: '', bindMethod: '', phone: '' };
  let page = 1;
  const pageSize = 10;

  const root = el('div', 'erp-page');
  root.appendChild(breadcrumb(['基础数据中心', '会员中心', '会员管理', '会员列表']));

  const card = el('div', 'erp-page__card');
  const head = el('div', 'erp-page__head');

  const toolbar = el('div', 'erp-toolbar');
  const filterMemberId = textInput('会员ID');
  const filterBind = selectInput(BIND_OPTIONS, '');
  filterBind.style.minWidth = '120px';
  const filterPhone = textInput('请输入手机号码');

  toolbar.appendChild(fieldRowInline('会员ID', filterMemberId));
  toolbar.appendChild(fieldRowInline('绑定方式', filterBind));
  toolbar.appendChild(fieldRowInline('手机号码', filterPhone));

  const ta = el('div', 'erp-toolbar__actions');
  const searchBtn = button('查询', 'primary');
  ta.appendChild(searchBtn);
  toolbar.appendChild(ta);
  head.appendChild(toolbar);
  card.appendChild(head);

  const wrapScroll = el('div', 'erp-table-scroll member-c-table-scroll');
  const table = el('table', 'erp-table');
  const thead = el('thead');
  const trh = el('tr');
  HEADERS.forEach((h) => trh.appendChild(el('th', '', h)));
  thead.appendChild(trh);
  const tbody = el('tbody');
  table.appendChild(thead);
  table.appendChild(tbody);
  wrapScroll.appendChild(table);
  card.appendChild(wrapScroll);

  const pagHost = el('div');
  card.appendChild(pagHost);

  root.appendChild(card);
  container.appendChild(root);

  function fieldRowInline(label, control) {
    const fr = el('div', 'erp-field');
    fr.appendChild(el('span', 'erp-field__label', label));
    const inner = el('div', 'erp-field__control');
    inner.appendChild(control);
    fr.appendChild(inner);
    return fr;
  }

  function filtered() {
    return filterMembers(members, query);
  }

  function paint() {
    const all = filtered();
    const total = all.length;
    const maxPage = Math.max(1, Math.ceil(total / pageSize));
    if (page > maxPage) page = maxPage;
    const start = (page - 1) * pageSize;
    const slice = all.slice(start, start + pageSize);

    empty(tbody);
    slice.forEach((m, idx) => {
      const tr = el('tr');
      if (idx % 2 === 1) tr.classList.add('erp-table__row--alt');

      tr.appendChild(el('td', '', m.id));

      const tdNick = el('td');
      const nickLink = el('a', 'erp-link', m.nickname);
      nickLink.href = '#';
      nickLink.addEventListener('click', (e) => {
        e.preventDefault();
        openMemberDetailDrawer(m, 'detail');
      });
      tdNick.appendChild(nickLink);
      tr.appendChild(tdNick);

      const tdAv = el('td');
      tdAv.appendChild(el('span', 'member-c-avatar', m.avatarText));
      tr.appendChild(tdAv);

      tr.appendChild(el('td', '', m.phone));
      tr.appendChild(el('td', '', m.gender));
      tr.appendChild(el('td', '', m.isMember));
      tr.appendChild(el('td', '', m.tags));
      tr.appendChild(el('td', '', m.source));
      tr.appendChild(el('td', '', m.bindMethod));
      tr.appendChild(el('td', '', m.channelCount));
      tr.appendChild(el('td', '', m.points));
      tr.appendChild(el('td', '', m.satisMinutes));
      tr.appendChild(el('td', '', m.satisFeedback));
      tr.appendChild(el('td', '', m.growthScore));

      const tdAmt = el('td');
      tdAmt.innerHTML = formatMoney(m.amount);
      tr.appendChild(tdAmt);

      tr.appendChild(el('td', '', m.orderCount));
      tr.appendChild(el('td', '', m.lastConsume));

      const tdSt = el('td');
      const tag = el(
        'span',
        m.status === '正常' ? 'erp-tag erp-tag--on' : 'erp-tag erp-tag--off',
        m.status,
      );
      tdSt.appendChild(tag);
      tr.appendChild(tdSt);

      const tdOp = el('td');
      tdOp.className = 'erp-actions-cell';
      const a1 = el('a', 'erp-link', '查看详情');
      a1.href = '#';
      const a2 = el('a', 'erp-link', '优惠券');
      a2.href = '#';
      const a3 = el('a', 'erp-link', '积分');
      a3.href = '#';
      a1.addEventListener('click', (e) => {
        e.preventDefault();
        openMemberDetailDrawer(m, 'detail');
      });
      a2.addEventListener('click', (e) => {
        e.preventDefault();
        openCouponDispatchModal(m);
      });
      a3.addEventListener('click', (e) => {
        e.preventDefault();
        openPointsModal(m);
      });
      tdOp.appendChild(a1);
      tdOp.appendChild(document.createTextNode('\u3000'));
      tdOp.appendChild(a2);
      tdOp.appendChild(document.createTextNode('\u3000'));
      tdOp.appendChild(a3);
      tr.appendChild(tdOp);

      tbody.appendChild(tr);
    });

    empty(pagHost);
    pagHost.appendChild(
      createPaginationBar({
        page,
        pageSize,
        total,
        onPage: (p) => {
          page = p;
          paint();
        },
      }),
    );
  }

  searchBtn.addEventListener('click', () => {
    query = {
      memberId: filterMemberId.value || '',
      bindMethod: filterBind.value || '',
      phone: filterPhone.value || '',
    };
    page = 1;
    paint();
  });

  paint();

  removeMemberCUi = () => {
    document.querySelectorAll('[data-member-c-ui="1"]').forEach((node) => node.remove());
    removeMemberDetailDrawer();
  };
}
