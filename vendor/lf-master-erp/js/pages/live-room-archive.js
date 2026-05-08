/**
 * MDM — 资源中心：直播间档案（业务直播间主数据，关联主体中心签约主体与人员中心主播）
 */
import { empty, el } from '../utils/dom.js';
import {
  fieldRow,
  textInput,
  selectInput,
  button,
  paginationBar,
  breadcrumb,
  statusTag,
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
  '直播间ID',
  '主体名称',
  '直播间名称',
  '直播类型',
  '主播ID',
  '主播名称',
  '负责人',
  '手机号码',
  '观看权限',
  '创建时间',
  '可提现手机号',
  '状态',
  '操作',
];

const MOCK = [
  {
    id: 'LR-883001',
    subjectName: '品牌日播间-A',
    name: '品牌日播间-A · 早场',
    typeLabel: '官方直播',
    typeKey: 'official',
    anchorId: 'ANC5001',
    anchorName: '周琳',
    viewPermissionLabel: '全部用户可见',
    viewPermissionKey: 'all',
    intro: '品牌官方日播早场，主推新品预售与会员权益讲解。',
    businessSessionsHint:
      '说明：本档案维护直播间主数据；具体开播场次、挂车商品与玩法在业务系统「直播场次」中创建并关联本直播间。',
    createTime: '2026-04-24 09:00:00',
    withdrawPhone: '139****8899',
    withdrawPhoneRaw: '13988991234',
    statusOn: true,
    orgId: '307403295087919301',
    region: '上海市/市辖区/浦东新区',
    regionPath: '上海市 / 市辖区 / 浦东新区',
    detailAddress: '张江直播基地A棚',
    phone: '139****8899',
    phoneRaw: '13988991234',
    contactName: '周琳',
    rSettle: 'order',
    rDeliver: 'both',
    rPay: 'pay_first',
    rCycle: 'now',
  },
  {
    id: 'LR-883002',
    subjectName: '区域直播-沪南',
    name: '区域直播-沪南 · 晚高峰',
    typeLabel: '区域直播',
    typeKey: 'regional',
    anchorId: 'ANC5002',
    anchorName: '吴悦',
    viewPermissionLabel: '仅门店会员可见',
    viewPermissionKey: 'store_members',
    intro: '区域直播晚高峰档，侧重到店核销与同城配送话术。',
    businessSessionsHint:
      '说明：区域直播场次通常按区域/门店维度排期；带货清单与库存占用以业务系统为准。',
    createTime: '2026-04-23 20:15:33',
    withdrawPhone: '136****6677',
    withdrawPhoneRaw: '13666771234',
    statusOn: true,
    orgId: '307403295087919302',
    region: '上海市/市辖区/浦东新区',
    regionPath: '上海市 / 市辖区 / 浦东新区',
    detailAddress: '沪南路演示直播间',
    phone: '136****6677',
    phoneRaw: '13666771234',
    contactName: '吴悦',
    rSettle: 'purchase',
    rDeliver: 'delivery',
    rPay: 'goods_first',
    rCycle: 'week',
  },
  {
    id: 'LR-883003',
    subjectName: '工厂溯源专场',
    name: '工厂溯源专场 · 溯源日',
    typeLabel: '定向直播',
    typeKey: 'targeted',
    anchorId: 'ANC5003',
    anchorName: '郑可',
    viewPermissionLabel: '仅门店会员可见',
    viewPermissionKey: 'store_members',
    intro: '工厂流水线实景讲解，突出原料批次与质检流程。',
    businessSessionsHint:
      '说明：定向直播的营销节奏与坑位费结算不在本档案展示，请在活动/合同模块查看。',
    createTime: '2026-04-22 13:40:18',
    withdrawPhone: '—',
    withdrawPhoneRaw: '',
    statusOn: false,
    orgId: '307403295087919303',
    region: '浙江省/杭州市/余杭区',
    regionPath: '浙江省 / 杭州市 / 余杭区',
    detailAddress: '工厂溯源路演厅',
    phone: '135****5544',
    phoneRaw: '13555441234',
    contactName: '郑可',
    rSettle: 'order',
    rDeliver: 'pickup',
    rPay: 'pay_first',
    rCycle: 'month',
  },
];

export function render(container) {
  removeResourceArchiveUi();
  empty(container);
  const rowsState = MOCK.map((r) => ({ ...r }));

  const root = el('div', 'erp-page');
  const card = el('div', 'erp-page__card');
  const head = el('div', 'erp-page__head');
  head.appendChild(breadcrumb(['基础数据中心', '资源中心', '直播间档案']));

  const filterSubject = textInput('请输入主体名称');
  const filterLiveName = textInput('请输入直播间名称');
  const filterType = selectInput(
    [
      { value: '', label: '全部' },
      { value: 'official', label: '官方直播' },
      { value: 'regional', label: '区域直播' },
      { value: 'targeted', label: '定向直播' },
    ],
    '',
  );

  const toolbar = el('div', 'erp-toolbar');
  toolbar.appendChild(fieldRow('主体名称', filterSubject));
  toolbar.appendChild(fieldRow('直播间名称', filterLiveName));
  toolbar.appendChild(fieldRow('直播类型', filterType));
  const ta = el('div', 'erp-toolbar__actions');
  const btnReset = button('重置', 'default');
  const btnQuery = button('查询', 'primary');
  ta.appendChild(btnReset);
  ta.appendChild(btnQuery);
  toolbar.appendChild(ta);
  head.appendChild(toolbar);
  card.appendChild(head);

  const actions = el('div', 'erp-actions-row');
  const addBtn = button('+ 新增直播间', 'primary');
  addBtn.addEventListener('click', () => openResourceAddModal('liveRoom'));
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
  const colLiveName = HEADERS.indexOf('直播间名称');

  function filteredRecords() {
    const qSub = filterSubject.value.trim();
    const qName = filterLiveName.value.trim();
    const qType = filterType.value;
    return rowsState.filter((rec) => {
      if (qSub && !(String(rec.subjectName ?? '').includes(qSub))) return false;
      if (qName && !String(rec.name).includes(qName)) return false;
      if (qType && rec.typeKey !== qType) return false;
      return true;
    });
  }

  function paintRows() {
    empty(tbody);
    filteredRecords().forEach((rec, idx) => {
      const tr = el('tr');
      if (idx % 2 === 1) tr.classList.add('erp-table__row--alt');
      const cells = [
        rec.id,
        rec.subjectName ?? '—',
        rec.name,
        rec.typeLabel ?? '—',
        rec.anchorId ?? '—',
        rec.anchorName ?? '—',
        rec.contactName ?? '—',
        rec.phone ?? '—',
        rec.viewPermissionLabel ?? '—',
        rec.createTime,
        rec.withdrawPhone,
      ];
      cells.forEach((text, colIdx) => {
        const td = el('td', '');
        if (colIdx === colLiveName) {
          const a = el('a', 'erp-link', text);
          a.href = '#';
          a.addEventListener('click', (e) => {
            e.preventDefault();
            openResourceDetailDrawer('liveRoom', rec);
          });
          td.appendChild(a);
        } else if (colIdx === colWithdrawPhone) {
          renderWithdrawPhoneTableCell(td, rec, { onMutated: paintRows });
        } else {
          td.textContent = text;
        }
        tr.appendChild(td);
      });
      const stTd = el('td', '');
      stTd.appendChild(statusTag(rec.statusOn ? '启用' : '停用', rec.statusOn));
      tr.appendChild(stTd);
      const tdOp = el('td', '');
      const op = el('span', 'erp-actions-cell');
      const e1 = el('a', 'erp-link', '编辑');
      e1.href = '#';
      e1.addEventListener('click', (ev) => {
        ev.preventDefault();
        openResourceEditModal('liveRoom', rec);
      });
      op.appendChild(e1);
      op.appendChild(document.createTextNode('\u3000'));
      const e2 = el('a', 'erp-link', '去进件');
      e2.href = '#';
      e2.addEventListener('click', (ev) => {
        ev.preventDefault();
        openResourceOnboardingModal('liveRoom', rec);
      });
      op.appendChild(e2);
      tdOp.appendChild(op);
      tr.appendChild(tdOp);
      tbody.appendChild(tr);
    });
  }

  btnReset.addEventListener('click', () => {
    filterSubject.value = '';
    filterLiveName.value = '';
    filterType.value = '';
    paintRows();
  });
  btnQuery.addEventListener('click', () => paintRows());

  paintRows();

  table.appendChild(thead);
  table.appendChild(tbody);
  wrap.appendChild(table);
  card.appendChild(wrap);
  card.appendChild(paginationBar({ total: 36, page: 1, pageSize: 20 }));

  const note = el(
    'p',
    'erp-page__note',
    '说明：本页为「直播间」业务主数据（名称、直播类型、主播、观看权限等），需关联主体中心「直播间主体」签约主体；人员中心「主播」提供主播主数据（主播ID 一致）。开播场次、挂车商品、玩法策略等在业务系统维护，不在此档案重复录入。',
  );
  root.appendChild(card);
  root.appendChild(note);
  container.appendChild(root);
}
