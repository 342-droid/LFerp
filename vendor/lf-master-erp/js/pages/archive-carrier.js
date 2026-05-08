/**
 * 资源中心 — 承运商档案
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
  '承运商ID',
  '主体名称',
  '承运商名称',
  '承运商地址',
  '承运商详细地址',
  '承运类型',
  '负责人姓名',
  '手机号码',
  '创建时间',
  '服务区域',
  '结算信息',
  '可提现手机号',
  '进件渠道',
  '进件状态',
  '承运商状态',
  '操作',
];

const MOCK = [
  {
    id: 'CAR20199001',
    subjectName: '顺丰同城承运',
    name: '顺丰同城承运',
    region: '上海市/市辖区/浦东新区',
    regionPath: '上海市 / 市辖区 / 浦东新区',
    detailAddress: '张江路88号集散中心',
    typeLabel: '三方即时配',
    typeKey: 'instant',
    contactName: '刘强',
    phone: '139****1100',
    phoneRaw: '13911001100',
    createTime: '2026-04-24 11:00:00',
    serviceArea: '华东',
    settleInfo: '对公 / 月结',
    withdrawPhone: '139****1100',
    withdrawPhoneRaw: '13911001100',
    channel: '支付宝',
    onboardStatus: '已进件',
    status: '正常',
    orgId: '307403295087919401',
    rSettle: 'order',
    rDeliver: 'both',
    rPay: 'pay_first',
    rCycle: 'month',
  },
  {
    id: 'CAR20199002',
    subjectName: '德邦干线承运',
    name: '德邦干线承运',
    region: '江苏省/苏州市/工业园区',
    regionPath: '江苏省 / 苏州市 / 工业园区',
    detailAddress: '工业园区星湖街328号',
    typeLabel: '干线整车',
    typeKey: 'line',
    contactName: '马涛',
    phone: '137****2200',
    phoneRaw: '13722002200',
    createTime: '2026-04-23 16:30:22',
    serviceArea: '长三角',
    settleInfo: '对公 / T+1',
    withdrawPhone: '137****2200',
    withdrawPhoneRaw: '13722002200',
    channel: '微信',
    onboardStatus: '进件中',
    status: '正常',
    orgId: '307403295087919402',
    rSettle: 'purchase',
    rDeliver: 'delivery',
    rPay: 'goods_first',
    rCycle: 'week',
  },
  {
    id: 'CAR20199003',
    subjectName: '区域城配联盟',
    name: '区域城配联盟',
    region: '浙江省/杭州市/余杭区',
    regionPath: '浙江省 / 杭州市 / 余杭区',
    detailAddress: '余杭区文一西路969号',
    typeLabel: '城配共配',
    typeKey: 'city',
    contactName: '周宁',
    phone: '186****3300',
    phoneRaw: '18633003300',
    createTime: '2026-04-22 09:15:40',
    serviceArea: '浙江',
    settleInfo: '对私 / 周结',
    withdrawPhone: '—',
    withdrawPhoneRaw: '',
    channel: '线下',
    onboardStatus: '未进件',
    status: '冻结',
    orgId: '307403295087919403',
    rSettle: 'order',
    rDeliver: 'pickup',
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
    rec.serviceArea,
    rec.settleInfo,
    rec.withdrawPhone,
    rec.channel,
    rec.onboardStatus,
    rec.status,
  ];
}

const ONBOARD_BY_FILTER = { done: '已进件', ing: '进件中', none: '未进件' };

export function render(container) {
  removeResourceArchiveUi();
  empty(container);
  const rowsState = MOCK.map((r) => ({ ...r }));

  const root = el('div', 'erp-page');
  const card = el('div', 'erp-page__card');
  const head = el('div', 'erp-page__head');
  head.appendChild(breadcrumb(['基础数据中心', '资源中心', '承运商档案']));

  const filterSubject = textInput('请输入主体名称');
  const filterCarrierName = textInput('请输入承运商名称');
  const filterOnboard = selectInput(
    [
      { value: '', label: '全部' },
      { value: 'done', label: '已进件' },
      { value: 'ing', label: '进件中' },
      { value: 'none', label: '未进件' },
    ],
    '',
  );
  const filterType = selectInput(
    [
      { value: '', label: '全部' },
      { value: 'instant', label: '三方即时配' },
      { value: 'line', label: '干线整车' },
      { value: 'city', label: '城配共配' },
    ],
    '',
  );
  const filterCarrierStatus = selectInput(
    [
      { value: '', label: '全部' },
      { value: '1', label: '正常' },
      { value: '2', label: '冻结' },
    ],
    '',
  );

  const toolbar = el('div', 'erp-toolbar');
  toolbar.appendChild(fieldRow('主体名称', filterSubject));
  toolbar.appendChild(fieldRow('承运商名称', filterCarrierName));
  toolbar.appendChild(fieldRow('进件状态', filterOnboard));
  toolbar.appendChild(fieldRow('承运类型', filterType));
  toolbar.appendChild(fieldRow('承运商状态', filterCarrierStatus));
  const ta = el('div', 'erp-toolbar__actions');
  const btnReset = button('重置', 'default');
  const btnQuery = button('查询', 'primary');
  ta.appendChild(btnReset);
  ta.appendChild(btnQuery);
  toolbar.appendChild(ta);
  head.appendChild(toolbar);
  card.appendChild(head);

  const actions = el('div', 'erp-actions-row');
  const addBtn = button('+ 新增承运商', 'primary');
  addBtn.addEventListener('click', () => openResourceAddModal('carrier'));
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
  const colCarrierName = HEADERS.indexOf('承运商名称');

  function filteredRecords() {
    const qSub = filterSubject.value.trim();
    const qName = filterCarrierName.value.trim();
    const qOb = filterOnboard.value;
    const qTy = filterType.value;
    const qSt = filterCarrierStatus.value;
    return rowsState.filter((rec) => {
      if (qSub && !(String(rec.subjectName ?? '').includes(qSub))) return false;
      if (qName && !String(rec.name).includes(qName)) return false;
      if (qOb && rec.onboardStatus !== ONBOARD_BY_FILTER[qOb]) return false;
      if (qTy && rec.typeKey !== qTy) return false;
      if (qSt === '1' && rec.status !== '正常') return false;
      if (qSt === '2' && rec.status !== '冻结') return false;
      return true;
    });
  }

  function paintRows() {
    empty(tbody);
    filteredRecords().forEach((rec, idx) => {
      const tr = el('tr');
      if (idx % 2 === 1) tr.classList.add('erp-table__row--alt');
      rowCells(rec).forEach((text, colIdx) => {
        const td = el('td', '');
        if (colIdx === colCarrierName) {
          const a = el('a', 'erp-link', text);
          a.href = '#';
          a.addEventListener('click', (e) => {
            e.preventDefault();
            openResourceDetailDrawer('carrier', rec);
          });
          td.appendChild(a);
        } else if (colIdx === colWithdrawPhone) {
          renderWithdrawPhoneTableCell(td, rec, { onMutated: paintRows });
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
        openResourceEditModal('carrier', rec);
      });
      op.appendChild(e1);
      op.appendChild(document.createTextNode('\u3000'));
      const e2 = el('a', 'erp-link', '去进件');
      e2.href = '#';
      e2.addEventListener('click', (ev) => {
        ev.preventDefault();
        openResourceOnboardingModal('carrier', rec);
      });
      op.appendChild(e2);
      tdOp.appendChild(op);
      tr.appendChild(tdOp);
      tbody.appendChild(tr);
    });
  }

  btnReset.addEventListener('click', () => {
    filterSubject.value = '';
    filterCarrierName.value = '';
    filterOnboard.value = '';
    filterType.value = '';
    filterCarrierStatus.value = '';
    paintRows();
  });
  btnQuery.addEventListener('click', () => paintRows());

  paintRows();

  table.appendChild(thead);
  table.appendChild(tbody);
  wrap.appendChild(table);
  card.appendChild(wrap);
  card.appendChild(paginationBar({ total: 18, page: 1, pageSize: 20 }));

  const note = el(
    'p',
    'erp-page__note',
    '说明：与同模块供应商、直播间档案等资源档案字段与交互一致；数据关联主体中心「承运商」与履约运力配置。查询条件与列表字段对齐（主体名称、承运商名称、进件状态、承运类型、承运商状态）。',
  );
  root.appendChild(card);
  root.appendChild(note);
  container.appendChild(root);
}
