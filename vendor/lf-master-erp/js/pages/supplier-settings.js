/**
 * 资源中心 — 供应商档案
 */
import { empty, el } from '../utils/dom.js';
import {
  fieldRow,
  textInput,
  selectInput,
  button,
  paginationBar,
  breadcrumb,
} from '../utils/erp-ui.js';
import {
  openResourceAddModal,
  openResourceEditModal,
  openResourceDetailDrawer,
  openResourceOnboardingModal,
  removeResourceArchiveUi,
} from '../utils/resource-archive-ui.js';
import { renderWithdrawPhoneTableCell } from '../utils/withdraw-phone-modal.js';

const HEADERS = [
  '供应商ID',
  '主体名称',
  '供应商名称',
  '供应商地址',
  '供应商详细地址',
  '供应商类型',
  '负责人姓名',
  '手机号码',
  '创建时间',
  '供应商商品数量',
  '结算信息',
  '可提现手机号',
  '进件渠道',
  '进件状态',
  '供应商状态',
  '操作',
];

const MOCK = [
  {
    id: 'SUP20188301',
    subjectName: '小牛供应链',
    name: '超管创建仓库042402',
    region: '上海市/市辖区/浦东新区',
    regionPath: '上海市 / 市辖区 / 浦东新区',
    detailAddress: '张江高科园区B座',
    typeLabel: '品牌商',
    typeKey: 'brand',
    contactName: '王敏',
    phone: '138****2210',
    phoneRaw: '13822102210',
    createTime: '2026-04-24 18:20:01',
    productCount: '128',
    settleInfo: '对公 / 月结',
    withdrawPhone: '138****2210',
    withdrawPhoneRaw: '13822102210',
    channel: '支付宝',
    onboardStatus: '已进件',
    status: '正常',
    orgId: '307403295087919104',
    detailTags: [{ label: '已打烊', kind: 'gray' }],
    rSettle: 'order',
    rDeliver: 'both',
    rDeliverUI: 'unified',
    rPay: 'pay_first',
    rCycle: 'month',
  },
  {
    id: 'SUP20188302',
    subjectName: '小牛供应链',
    name: '小牛供应链',
    region: '江苏省/苏州市/工业园区',
    regionPath: '江苏省 / 苏州市 / 工业园区',
    detailAddress: '工业园区星湖街328号',
    typeLabel: '代理商',
    typeKey: 'agent',
    contactName: '牛强',
    phone: '159****7788',
    phoneRaw: '15977881234',
    createTime: '2026-04-23 12:11:09',
    productCount: '56',
    settleInfo: '对私 / 周结',
    withdrawPhone: '159****7788',
    withdrawPhoneRaw: '15977881234',
    channel: '微信',
    onboardStatus: '进件中',
    status: '正常',
    orgId: '307403295087919104',
    rSettle: 'purchase',
    rDeliver: 'delivery',
    rDeliverUI: 'direct',
    rPay: 'goods_first',
    rCycle: 'week',
  },
  {
    id: 'SUP20188303',
    subjectName: '珠宝集采中心',
    name: '珠宝集采中心',
    region: '广东省/深圳市/罗湖区',
    regionPath: '广东省 / 深圳市 / 罗湖区',
    detailAddress: '罗湖区水贝一路',
    typeLabel: '个人',
    typeKey: 'person',
    contactName: '钱多多',
    phone: '—',
    phoneRaw: '',
    createTime: '2026-04-22 09:45:33',
    productCount: '902',
    settleInfo: '对公 / T+1',
    withdrawPhone: '—',
    withdrawPhoneRaw: '',
    channel: '线下',
    onboardStatus: '未进件',
    status: '冻结',
    orgId: '307403295087919105',
    rSettle: 'order',
    rDeliver: 'pickup',
    rDeliverUI: 'unified',
    rPay: 'pay_first',
    rCycle: 'now',
  },
];

function rowCells(rec) {
  return [
    rec.id,
    rec.subjectName ?? '—',
    rec.name,
    rec.region,
    rec.detailAddress,
    rec.typeLabel,
    rec.contactName,
    rec.phone,
    rec.createTime,
    rec.productCount,
    rec.settleInfo,
    rec.withdrawPhone,
    rec.channel,
    rec.onboardStatus,
    rec.status,
  ];
}

export function render(container) {
  removeResourceArchiveUi();
  empty(container);
  const root = el('div', 'erp-page');
  const card = el('div', 'erp-page__card');
  const head = el('div', 'erp-page__head');
  head.appendChild(breadcrumb(['基础数据中心', '资源中心', '供应商档案']));
  const toolbar = el('div', 'erp-toolbar');
  toolbar.appendChild(fieldRow('主体名称', textInput('请输入主体名称')));
  toolbar.appendChild(fieldRow('供应商名称', textInput('请输入供应商名称')));
  toolbar.appendChild(
    fieldRow(
      '进件状态',
      selectInput(
        [
          { value: '', label: '全部' },
          { value: 'done', label: '已进件' },
          { value: 'ing', label: '进件中' },
          { value: 'none', label: '未进件' },
        ],
        '',
      ),
    ),
  );
  toolbar.appendChild(
    fieldRow(
      '分账服务',
      selectInput(
        [
          { value: '', label: '全部' },
          { value: 'on', label: '开启' },
          { value: 'off', label: '关闭' },
        ],
        '',
      ),
    ),
  );
  toolbar.appendChild(
    fieldRow(
      '供应商状态',
      selectInput(
        [
          { value: '', label: '全部' },
          { value: '1', label: '正常' },
          { value: '2', label: '冻结' },
        ],
        '',
      ),
    ),
  );
  const ta = el('div', 'erp-toolbar__actions');
  ta.appendChild(button('重置', 'default'));
  ta.appendChild(button('查询', 'primary'));
  toolbar.appendChild(ta);
  head.appendChild(toolbar);
  card.appendChild(head);

  const actions = el('div', 'erp-actions-row');
  const addBtn = button('+ 新增供应商', 'primary');
  addBtn.addEventListener('click', () => openResourceAddModal('supplier'));
  actions.appendChild(addBtn);
  card.appendChild(actions);

  const wrap = el('div', 'erp-table-scroll');
  const table = el('table', 'erp-table');
  const thead = el('thead');
  const trh = el('tr');
  HEADERS.forEach((h) => trh.appendChild(el('th', '', h)));
  thead.appendChild(trh);
  const tbody = el('tbody');
  const colWithdrawPhone = HEADERS.indexOf('可提现手机号');
  const colResourceName = HEADERS.indexOf('供应商名称');

  MOCK.forEach((rec, idx) => {
    const tr = el('tr');
    if (idx % 2 === 1) tr.classList.add('erp-table__row--alt');
    rowCells(rec).forEach((text, colIdx) => {
      const td = el('td', '');
      if (colIdx === colResourceName) {
        const a = el('a', 'erp-link', text);
        a.href = '#';
        a.addEventListener('click', (e) => {
          e.preventDefault();
          openResourceDetailDrawer('supplier', rec);
        });
        td.appendChild(a);
      } else if (colIdx === colWithdrawPhone) {
        renderWithdrawPhoneTableCell(td, rec);
      } else {
        td.textContent = text;
      }
      tr.appendChild(td);
    });
    const tdOp = el('td', '');
    const op = el('span', 'erp-actions-cell');
    const e1 = el('a', 'erp-link', '编辑');
    e1.href = '#';
    e1.addEventListener('click', (ev) => {
      ev.preventDefault();
      openResourceEditModal('supplier', rec);
    });
    op.appendChild(e1);
    op.appendChild(document.createTextNode('\u3000'));
    const e2 = el('a', 'erp-link', '去进件');
    e2.href = '#';
    e2.addEventListener('click', (ev) => {
      ev.preventDefault();
      openResourceOnboardingModal('supplier', rec);
    });
    op.appendChild(e2);
    tdOp.appendChild(op);
    tr.appendChild(tdOp);
    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  wrap.appendChild(table);
  card.appendChild(wrap);
  card.appendChild(paginationBar({ total: 23, page: 1, pageSize: 20 }));

  root.appendChild(card);
  container.appendChild(root);
}
