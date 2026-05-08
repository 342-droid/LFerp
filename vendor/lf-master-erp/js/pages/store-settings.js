/**
 * 资源中心 — 门店档案（新增 / 详情抽屉 / 编辑 / 进件）
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
  openStoreAddModal,
  openStoreEditModal,
  openStoreDetailDrawer,
  openStoreOnboardingModal,
  removeStoreArchiveUi,
} from '../utils/store-archive-ui.js';
import { renderWithdrawPhoneTableCell } from '../utils/withdraw-phone-modal.js';

const HEADERS = [
  '门店ID',
  '主体名称',
  '门店名称',
  '门店合作类型',
  '门店类型',
  '绑定BD',
  '联系人',
  '手机号码',
  '配送仓库',
  '省市区',
  '详细地址',
  '经纬度',
  '可提现手机号',
  '运营状态',
  '进件状态',
  '结算类型',
  '结算周期',
  '分账服务',
  '门店状态',
  '创建时间',
  '操作',
];

const MOCK_RECORDS = [
  {
    storeId: 'ONS307892038169264128',
    subjectName: '冷丰演示门店',
    name: '测试通知',
    shortName: '冷丰-文一西路',
    partnerDivision: '加盟店',
    storeType: '社区生鲜店',
    bd: '—',
    group: '—',
    tag: '—',
    region: '北京市/市辖区/东城区',
    address: '地下车库',
    phone: '178****4646',
    contact: '夏利',
    delivery: '配送',
    channel: '—',
    latlng: '—',
    withdrawPhone: '—',
    withdrawPhoneRaw: '',
    opStatus: '营业中',
    onboardStatus: '—',
    settleType: '—',
    settleCycle: '—',
    splitService: '未开通',
    storeStatus: '冻结',
    createTime: '2026-04-29T22:53:02',
    orgId: '307892034956427264',
    bdName: '—',
    fulfillWarehouse: '华东履约仓 / WH–SH–01',
    customerCount: '0',
    areaM2: '—',
    storeFloors: '1F',
    householdsWithin500m: '约 1200 户',
    dailyOrderVolume: '工作日约 80 单',
    staffCount: '5',
    liveCommerceUnderstanding: '了解社区直播，可配合门店陈列与直播讲解。',
    dailyOpsCooperationNote: '可配合售后、配送交接与社群运营。',
    privateLiveRoiExpectation: '期望 2-3 个月形成稳定复购。',
    privateCommerceFamiliarity: '曾参与社区团购，熟悉基础操作。',
    surroundingCommunityNote: '周边成熟小区多，家庭客群占比高。',
    confidenceReach1000: '老板有多个社群资源，有信心达成。',
    specialCircumstancesNote: '无',
    hasRefrigerator: false,
    hasFreezer: false,
    detailTags: [
      { label: '冻结', kind: 'orange' },
      { label: '已打烊', kind: 'gray' },
    ],
  },
  {
    storeId: 'ONS303445581201',
    subjectName: '冷丰演示门店',
    name: '111',
    shortName: '冷丰-演示店',
    partnerDivision: '合作店',
    storeType: '团购自提点',
    bd: '公司11号',
    group: '1组',
    tag: '红色',
    region: '天津市/市辖区/河东区',
    address: '长三角珠宝产业园A3栋',
    phone: '138****2211',
    contact: '张三',
    delivery: '配送',
    channel: '特约渠道',
    latlng: '117.25,39.12',
    withdrawPhone: '138****2211',
    withdrawPhoneRaw: '13822112211',
    opStatus: '营业中',
    onboardStatus: '已进件',
    settleType: 'T+1',
    settleCycle: '自然周',
    splitService: '开启',
    storeStatus: '正常',
    createTime: '2026-04-20 10:22:11',
    orgId: '307892034956427264',
    bdName: '王小明',
    fulfillWarehouse: '创建门店时选择的履约仓库',
    customerCount: '123121',
    areaM2: '220',
    storeFloors: '1-2F',
    householdsWithin500m: '约 3000 户',
    dailyOrderVolume: '日均约 160 单',
    staffCount: '8',
    liveCommerceUnderstanding: '老板认可直播带货与社群复购模式。',
    dailyOpsCooperationNote: '具备固定店员，可承接日常运营。',
    privateLiveRoiExpectation: '可接受前期投入，关注复购增长。',
    privateCommerceFamiliarity: '熟悉私域社群，做过团购接龙。',
    surroundingCommunityNote: '周边办公与居民混合，午晚高峰明显。',
    confidenceReach1000: '已有老客群基础。',
    specialCircumstancesNote: '需总监确认区域保护边界。',
    hasRefrigerator: true,
    fridgePhotoCount: 2,
    hasFreezer: false,
  },
  {
    storeId: 'ONS303445581202',
    subjectName: '五角场体验店',
    name: 'DDD',
    shortName: '五角场体验',
    partnerDivision: '同行店',
    storeType: '快闪零售',
    bd: '李四',
    group: '2组',
    tag: '蓝色',
    region: '上海市/市辖区/浦东新区',
    address: '张江路88号',
    phone: '186****9001',
    contact: '李四',
    delivery: '自提+配送',
    channel: '标准渠道',
    latlng: '121.58,31.20',
    withdrawPhone: '186****9001',
    withdrawPhoneRaw: '18690019001',
    opStatus: '营业中',
    onboardStatus: '进件中',
    settleType: 'D+1',
    settleCycle: '自然月',
    splitService: '关闭',
    storeStatus: '正常',
    createTime: '2026-04-19 15:01:44',
    orgId: '307892034956427265',
    bdName: '李四',
    fulfillWarehouse: '沪东前置仓',
    customerCount: '882',
    areaM2: '156',
    otherPlatformsCooperation: '已合作美团优选和社区团购平台。',
    broadcastSalesScreenshotsDone: '已上传 3 张',
    hasRefrigerator: true,
    fridgePhotoCount: 2,
    hasFreezer: true,
  },
  {
    storeId: 'ONS303445581203',
    subjectName: '张江快闪店',
    name: '张三',
    shortName: '张江快闪',
    partnerDivision: '加盟店',
    storeType: '社区便利店',
    bd: '张三',
    group: '1组',
    tag: '—',
    region: '浙江省/杭州市/余杭区',
    address: '文一西路969号',
    phone: '—',
    contact: '张三',
    delivery: '自提',
    channel: '特约渠道',
    latlng: '120.05,30.28',
    withdrawPhone: '—',
    withdrawPhoneRaw: '',
    opStatus: '筹备',
    onboardStatus: '未进件',
    settleType: '—',
    settleCycle: '—',
    splitService: '关闭',
    storeStatus: '停用',
    createTime: '2026-04-18 09:33:02',
    orgId: '307892034956427266',
    bdName: '张三',
    fulfillWarehouse: '创建门店时选择的履约仓库',
    customerCount: '12',
    areaM2: '98',
    storeFloors: '1F',
    householdsWithin500m: '约 900 户',
    dailyOrderVolume: '日均约 45 单',
    staffCount: '3',
    liveCommerceUnderstanding: '初步了解，需培训支持。',
    dailyOpsCooperationNote: '可配合基础履约和社群维护。',
    privateLiveRoiExpectation: '希望提升周边复购。',
    privateCommerceFamiliarity: '了解较少。',
    surroundingCommunityNote: '周边年轻租住客较多。',
    confidenceReach1000: '需要 BD 协助拉新。',
    specialCircumstancesNote: '无',
    hasRefrigerator: false,
    hasFreezer: false,
  },
];

function recordToRowCells(rec) {
  return [
    rec.storeId,
    rec.subjectName ?? '—',
    rec.name,
    rec.partnerDivision ?? '—',
    rec.storeType ?? '—',
    rec.bd,
    rec.contact,
    rec.phone,
    rec.fulfillWarehouse ?? '—',
    rec.region,
    rec.address,
    rec.latlng,
    rec.withdrawPhone,
    rec.opStatus,
    rec.onboardStatus,
    rec.settleType,
    rec.settleCycle,
    rec.splitService,
    rec.storeStatus,
    rec.createTime,
  ];
}

/**
 * @param {HTMLElement} container
 */
export function render(container) {
  removeStoreArchiveUi();
  empty(container);
  const root = el('div', 'erp-page');
  const card = el('div', 'erp-page__card');
  const head = el('div', 'erp-page__head');
  head.appendChild(breadcrumb(['基础数据中心', '资源中心', '门店档案']));
  const toolbar = el('div', 'erp-toolbar');
  toolbar.appendChild(fieldRow('主体名称', textInput('请输入主体名称')));
  toolbar.appendChild(fieldRow('门店名称', textInput('请输入门店名称')));
  toolbar.appendChild(
    fieldRow(
      '运营状态',
      selectInput(
        [
          { value: '', label: '全部' },
          { value: '1', label: '营业中' },
          { value: '2', label: '筹备' },
          { value: '3', label: '停业' },
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
      '门店状态',
      selectInput(
        [
          { value: '', label: '全部' },
          { value: '1', label: '正常' },
          { value: '2', label: '停用' },
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
  const addBtn = button('+ 新增门店', 'primary');
  addBtn.addEventListener('click', () => openStoreAddModal());
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
  const colStoreName = HEADERS.indexOf('门店名称');

  MOCK_RECORDS.forEach((rec, idx) => {
    const tr = el('tr');
    if (idx % 2 === 1) tr.classList.add('erp-table__row--alt');
    const cells = recordToRowCells(rec);
    cells.forEach((text, colIdx) => {
      const td = el('td', '');
      if (colIdx === colStoreName) {
        const a = el('a', 'erp-link', text);
        a.href = '#';
        a.addEventListener('click', (e) => {
          e.preventDefault();
          openStoreDetailDrawer(rec);
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
    const editA = el('a', 'erp-link', '编辑');
    editA.href = '#';
    editA.addEventListener('click', (e) => {
      e.preventDefault();
      openStoreEditModal(rec);
    });
    op.appendChild(editA);
    op.appendChild(document.createTextNode('\u3000'));
    const obA = el('a', 'erp-link', '去进件');
    obA.href = '#';
    obA.addEventListener('click', (e) => {
      e.preventDefault();
      openStoreOnboardingModal(rec);
    });
    op.appendChild(obA);
    tdOp.appendChild(op);
    tr.appendChild(tdOp);
    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  wrap.appendChild(table);
  card.appendChild(wrap);
  card.appendChild(paginationBar({ total: 38, page: 2, pageSize: 20 }));

  root.appendChild(card);
  container.appendChild(root);
}
