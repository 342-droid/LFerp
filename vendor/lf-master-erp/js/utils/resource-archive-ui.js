/**
 * 资源中心档案通用 UI：供应商 / 仓库 / 直播间 / 承运商
 * — 新增、编辑、右侧详情（4 Tab）、进件（与门店进件同构）
 */
import { el } from './dom.js';
import { button, textInput, selectInput, fieldRow, dataTable, paginationBar } from './erp-ui.js';
import { createRegionCascader } from './store-archive-ui.js';
import { openUnifiedOnboardingModal } from './unified-onboarding-ui.js';
import {
  gridItemWithdrawPhone,
  mountSupplierDetailMobile,
  mountWithdrawPhoneDetail,
} from './withdraw-phone-modal.js';

export function removeResourceArchiveModals() {
  document
    .querySelectorAll('.resource-archive-modal-backdrop[data-resource-archive-ui]')
    .forEach((n) => n.remove());
}

export function removeResourceArchiveDrawer() {
  document.querySelectorAll('[data-resource-archive-drawer]').forEach((n) => n.remove());
}

export function removeResourceArchiveUi() {
  removeResourceArchiveModals();
  removeResourceArchiveDrawer();
}

function sfLabel(text, required) {
  const lab = el('label', 'store-form__label');
  if (required) lab.appendChild(el('span', 'store-form__req', '*'));
  lab.appendChild(document.createTextNode(text));
  return lab;
}

/** 各档案「主体名称」下拉选项（与主体中心各主体原型对齐） */
const RESOURCE_SUBJECT_BY_KIND = {
  supplier: [
    { value: '', label: '请选择主体名称' },
    { value: '307403295087919104', label: '小牛供应链' },
    { value: '307403295087919105', label: '珠宝集采中心' },
    { value: '307403295087919106', label: '华东辅料仓配' },
    { value: 'm2', label: '演示主体-B' },
  ],
  liveRoom: [
    { value: '', label: '请选择主体名称' },
    { value: '307403295087919301', label: '品牌日播间-A' },
    { value: '307403295087919302', label: '区域直播-沪南' },
    { value: '307403295087919303', label: '工厂溯源专场' },
    { value: 'm2', label: '演示主体-B' },
  ],
  carrier: [
    { value: '', label: '请选择主体名称' },
    { value: '307403295087919401', label: '顺丰同城承运' },
    { value: '307403295087919402', label: '德邦干线承运' },
    { value: '307403295087919403', label: '区域城配联盟' },
    { value: 'm2', label: '演示主体-B' },
  ],
};

/**
 * @param {'supplier'|'liveRoom'|'carrier'} kind
 * @param {string} [currentVal]
 */
function resourceSubjectSelect(kind, currentVal = '') {
  return selectInput(RESOURCE_SUBJECT_BY_KIND[kind], currentVal || '');
}

const LIVE_ROOM_ANCHOR_OPTIONS = [
  { value: '', label: '请选择主播名称' },
  { value: 'ANC5001', label: '周琳' },
  { value: 'ANC5002', label: '吴悦' },
  { value: 'ANC5003', label: '郑可' },
];

/**
 * 直播间档案表单（MDM）：不含门店绑定、渠道、运营状态、累计场次等业务字段。
 * @param {'add'|'edit'} mode
 * @param {Record<string, unknown>} record
 */
function buildLiveRoomMdmForm(mode, record) {
  const isEdit = mode === 'edit';
  const cfg = CFG.liveRoom;
  const body = el('div', '');

  function row(label, req, node) {
    const r = el('div', 'store-form__row');
    r.appendChild(sfLabel(label, req));
    const c = el('div', 'store-form__control');
    c.appendChild(node);
    r.appendChild(c);
    body.appendChild(r);
  }

  body.appendChild(supplierDetailSectionTitle('基础信息'));

  row(
    '主体名称',
    true,
    resourceSubjectSelect(
      'liveRoom',
      isEdit && record.orgId ? String(record.orgId) : '',
    ),
  );

  row(
    '直播间名称',
    true,
    textInput('请输入直播间名称', isEdit ? String(record.name || '') : ''),
  );

  const typeVal = isEdit && record.typeKey ? String(record.typeKey) : '';
  row(
    cfg.typeLabel,
    true,
    typeSelect(cfg.typePlaceholder, cfg.typeOptions, typeVal),
  );

  const anchorVal = isEdit && record.anchorId ? String(record.anchorId) : '';
  row('主播名称', false, selectInput(LIVE_ROOM_ANCHOR_OPTIONS, anchorVal));

  const coverRow = el('div', 'store-form__row');
  coverRow.appendChild(sfLabel('直播封面', false));
  const coverCtrl = el('div', 'store-form__control');
  coverCtrl.appendChild(el('div', 'store-archive__map-mock', '+ 上传封面'));
  coverCtrl.appendChild(
    el('p', 'erp-page__note', '建议尺寸 750×450px，支持 jpg/png，大小不超过 2MB'),
  );
  coverRow.appendChild(coverCtrl);
  body.appendChild(coverRow);

  const introRow = el('div', 'store-form__row');
  introRow.appendChild(sfLabel('直播简介', false));
  const introCtrl = el('div', 'store-form__control');
  const introTa = el('textarea', 'erp-input store-form__textarea');
  introTa.placeholder = '请输入直播简介（可选）';
  const introVal = isEdit ? String(record.intro || '') : '';
  introTa.value = introVal;
  const introWrap = el('div', 'store-form__textarea-wrap');
  const introCnt = el('div', 'store-form__counter', `${introVal.length} / 500`);
  introTa.maxLength = 500;
  introTa.addEventListener('input', () => {
    introCnt.textContent = `${introTa.value.length} / 500`;
  });
  introWrap.appendChild(introTa);
  introWrap.appendChild(introCnt);
  introCtrl.appendChild(introWrap);
  introRow.appendChild(introCtrl);
  body.appendChild(introRow);

  body.appendChild(supplierDetailSectionTitle('分发与可见范围'));
  const viewKey =
    isEdit && record.viewPermissionKey ? String(record.viewPermissionKey) : '';
  // API may use public/private; radios use all / store_members
  const viewSel =
    viewKey === 'private' ||
    ['store_members', 'member', 'login'].includes(viewKey)
      ? 'store_members'
      : 'all'; // public、空、未知 → 全部用户可见
  body.appendChild(
    radioGroupRow('观看权限', true, 'liveRoom-mdm-view', [
      ['all', '全部用户可见'],
      ['store_members', '仅门店会员可见'],
    ], viewSel),
  );

  body.appendChild(supplierDetailSectionTitle('联系与核验'));
  const phoneRow = el('div', 'store-form__row');
  phoneRow.appendChild(sfLabel('手机号码', true));
  const phoneCtrl = el('div', 'store-form__control');
  const phWrap = el('div', 'store-form__phone-row');
  const phoneDigits = isEdit && record.phoneRaw ? record.phoneRaw : '';
  const phoneInp = textInput('请输入手机号码', phoneDigits);
  const sms = button('获取验证码', 'primary');
  sms.classList.add('erp-btn--sms');
  phWrap.appendChild(phoneInp);
  phWrap.appendChild(sms);
  phoneCtrl.appendChild(phWrap);
  phoneRow.appendChild(phoneCtrl);
  body.appendChild(phoneRow);

  if (!isEdit) {
    row('验证码', true, textInput('请输入验证码'));
  }

  row(
    '负责人',
    true,
    textInput('请输入负责人', isEdit ? String(record.contactName || '') : ''),
  );

  return body;
}

/**
 * @param {string} placeholder
 * @param {Array<{value:string,label:string}>} options
 * @param {string} current
 */
function typeSelect(placeholder, options, current = '') {
  const opts = [{ value: '', label: placeholder }, ...options];
  return selectInput(opts, current);
}

/**
 * @param {string} label
 * @param {boolean} req
 * @param {string} name
 * @param {Array<[string,string]>} items value,label
 * @param {string} [selected]
 */
function radioGroupRow(label, req, name, items, selected) {
  const r = el('div', 'store-form__row');
  r.appendChild(sfLabel(label, req));
  const c = el('div', 'store-form__control');
  const row = el('div', 'store-radio-row');
  items.forEach(([val, lab]) => {
    const lb = el('label', '');
    const inp = el('input');
    inp.type = 'radio';
    inp.name = name;
    inp.value = val;
    if (selected === val) inp.checked = true;
    lb.appendChild(inp);
    lb.appendChild(document.createTextNode(` ${lab}`));
    row.appendChild(lb);
  });
  c.appendChild(row);
  r.appendChild(c);
  return r;
}

/** @type {Record<string, unknown>} */
const CFG = {
  supplier: {
    addTitle: '新增供应商',
    editTitle: '编辑供应商',
    detailTitle: '供应商详情',
    onboardTitle: '供应商进件',
    nameLabel: '供应商名称',
    typeLabel: '供应商类型',
    typePlaceholder: '请选择供应商类型',
    typeOptions: [
      { value: 'brand', label: '品牌商' },
      { value: 'agent', label: '代理商' },
      { value: 'person', label: '个人' },
    ],
    addressLabel: '供应商地址',
    entityInfoTitle: '商户信息',
    shortNameLabel: '商户简称',
    locationLabel: '商户所在地区',
    sceneSectionUpload: '供应商信息',
    agreementTitle: '供应商协议',
    uploadTriples: [
      ['门头照', '门头照'],
      ['内部照', '内部照'],
      ['收银台照', '收银台照'],
    ],
    metaIdLabel: '供应商ID',
    onboardSection: '供应商进件',
    onboardHeaders: [
      '主体名称',
      '入网渠道',
      '子商户号',
      '银行卡号',
      '进件类型',
      '非法人结算授权',
      '操作',
    ],
    supplierOnboardDetailHeaders: [
      '主体名称',
      '入网渠道',
      '商户号',
      '银行卡号',
      '进件类型',
      '非法人结算授权书',
      '微信认证状态',
      '支付宝认证状态',
      '结算周期',
      '银联二维码登记费率',
      '微信扫码费率',
      '支付宝扫码费率',
      '平台审核状态',
      '三方进件审核状态',
      '审核说明',
      '创建时间',
      '状态',
      '操作',
    ],
    detailDrawerTabs: ['基础信息', '分佣明细', '商品统计', '业绩报表'],
    baseRows: (r) => [
      ['供应商ID', r.id],
      ['主体名称', r.subjectName ?? '—'],
      ['供应商名称', r.name],
      ['供应商类型', r.typeLabel],
      ['供应商地址', r.region],
      ['详细地址', r.detailAddress],
      ['负责人姓名', r.contactName],
      ['手机号码', r.phone],
      ['创建时间', r.createTime],
      ['供应商品数量', r.productCount],
    ],
  },
  liveRoom: {
    addTitle: '新增直播间',
    editTitle: '编辑直播间',
    detailTitle: '直播间详情',
    onboardTitle: '直播间进件',
    nameLabel: '直播间名称',
    typeLabel: '直播类型',
    typePlaceholder: '请选择直播类型',
    typeOptions: [
      { value: 'official', label: '官方直播' },
      { value: 'regional', label: '区域直播' },
      { value: 'targeted', label: '定向直播' },
    ],
    addressLabel: '直播间地址',
    entityInfoTitle: '主体信息',
    shortNameLabel: '直播间简称',
    locationLabel: '主体所在地区',
    sceneSectionUpload: '直播间信息',
    agreementTitle: '直播间协议',
    uploadTriples: [
      ['场景照', '场景照'],
      ['设备照', '设备照'],
      ['背景照', '背景照'],
    ],
    metaIdLabel: '直播间ID',
    onboardSection: '直播间进件',
    onboardHeaders: [
      '主体名称',
      '入网渠道',
      '子商户号',
      '银行卡号',
      '进件类型',
      '非法人结算授权',
      '操作',
    ],
    detailDrawerTabs: ['基础信息', '直播场次（业务）', '场次商品（业务）', '进件与数据'],
    baseRows: (r) => [
      ['直播间ID', r.id],
      ['主体名称', r.subjectName ?? '—'],
      ['直播间名称', r.name],
      ['直播类型', r.typeLabel],
      ['主播ID', r.anchorId ?? '—'],
      ['主播名称', r.anchorName ?? r.anchor ?? '—'],
      ['负责人', r.contactName ?? '—'],
      ['手机号码', r.phone ?? '—'],
      ['观看权限', r.viewPermissionLabel ?? '—'],
      ['直播简介', r.intro ?? '—'],
      ['创建时间', r.createTime],
      ['可提现手机号', ''],
    ],
  },
  carrier: {
    addTitle: '新增承运商',
    editTitle: '编辑承运商',
    detailTitle: '承运商详情',
    onboardTitle: '承运商进件',
    nameLabel: '承运商名称',
    typeLabel: '承运类型',
    typePlaceholder: '请选择承运类型',
    typeOptions: [
      { value: 'instant', label: '三方即时配' },
      { value: 'line', label: '干线整车' },
      { value: 'city', label: '城配共配' },
    ],
    addressLabel: '承运商地址',
    entityInfoTitle: '商户信息',
    shortNameLabel: '承运商简称',
    locationLabel: '承运商所在地区',
    sceneSectionUpload: '承运商信息',
    agreementTitle: '承运商协议',
    uploadTriples: [
      ['网点门头照', '网点门头照'],
      ['车辆资质照', '车辆资质照'],
      ['作业场地照', '作业场地照'],
    ],
    metaIdLabel: '承运商ID',
    onboardSection: '承运商进件',
    onboardHeaders: [
      '主体名称',
      '入网渠道',
      '子商户号',
      '银行卡号',
      '进件类型',
      '非法人结算授权',
      '操作',
    ],
    detailDrawerTabs: ['基础信息', '运单明细', '运力统计', '履约报表'],
    baseRows: (r) => [
      ['承运商ID', r.id],
      ['主体名称', r.subjectName ?? '—'],
      ['承运商名称', r.name],
      ['承运类型', r.typeLabel],
      ['承运商地址', r.region],
      ['详细地址', r.detailAddress],
      ['负责人姓名', r.contactName],
      ['手机号码', r.phone],
      ['创建时间', r.createTime],
      ['服务区域', r.serviceArea],
      ['可提现手机号', ''],
    ],
  },
};

/**
 * @param {keyof typeof CFG} kind
 * @param {'add'|'edit'} mode
 * @param {Record<string, string>} record
 */
function buildEntityForm(kind, mode, record) {
  if (kind === 'liveRoom') return buildLiveRoomMdmForm(mode, record);
  const cfg = CFG[kind];
  const isEdit = mode === 'edit';
  const body = el('div', '');

  function row(label, req, node) {
    const r = el('div', 'store-form__row');
    r.appendChild(sfLabel(label, req));
    const c = el('div', 'store-form__control');
    c.appendChild(node);
    r.appendChild(c);
    body.appendChild(r);
  }

  const subSel = resourceSubjectSelect(
    kind,
    isEdit && record.orgId ? String(record.orgId) : '',
  );
  row('主体名称', true, subSel);

  row(
    cfg.nameLabel,
    true,
    textInput(`请输入${cfg.nameLabel}`, isEdit ? record.name || '' : ''),
  );

  const typeVal =
    isEdit && record.typeKey
      ? record.typeKey
      : kind === 'supplier'
        ? ''
        : isEdit && record.typeLabel
          ? cfg.typeOptions.find((o) => o.label === record.typeLabel)?.value || ''
          : '';
  row(
    cfg.typeLabel,
    true,
    typeSelect(cfg.typePlaceholder, cfg.typeOptions, typeVal),
  );

  const regionRow = el('div', 'store-form__row');
  regionRow.appendChild(sfLabel(cfg.addressLabel, true));
  const regionCtrl = el('div', 'store-form__control');
  const path =
    isEdit && record.regionPath
      ? record.regionPath
      : isEdit && record.region
        ? record.region.replace(/\//g, ' / ')
        : '';
  const cascader = createRegionCascader(body, path);
  regionCtrl.appendChild(cascader.wrap);
  regionRow.appendChild(regionCtrl);
  body.appendChild(regionRow);

  const addrRow = el('div', 'store-form__row');
  addrRow.appendChild(sfLabel('详细地址', true));
  const addrCtrl = el('div', 'store-form__control');
  const ta = el('textarea', 'erp-input store-form__textarea');
  ta.placeholder = '请输入详细地址，输入后将自动在地图上定位';
  const addrVal = isEdit ? record.detailAddress || '' : '';
  ta.value = addrVal;
  const taWrap = el('div', 'store-form__textarea-wrap');
  const taCnt = el('div', 'store-form__counter', `${addrVal.length} / 200`);
  ta.maxLength = 200;
  ta.addEventListener('input', () => {
    taCnt.textContent = `${ta.value.length} / 200`;
  });
  taWrap.appendChild(ta);
  taWrap.appendChild(taCnt);
  addrCtrl.appendChild(taWrap);
  addrRow.appendChild(addrCtrl);
  body.appendChild(addrRow);

  const mapRow = el('div', 'store-form__row');
  mapRow.appendChild(sfLabel('', false));
  const mapCtrl = el('div', 'store-form__control');
  mapCtrl.appendChild(el('div', 'store-archive__map-mock', '地图定位示意（高德 · 原型）'));
  if (isEdit) {
    mapCtrl.appendChild(
      el('div', 'store-archive__coord-hint', '当前坐标（演示）：39.928359, 116.416334'),
    );
  }
  mapRow.appendChild(mapCtrl);
  body.appendChild(mapRow);

  const phoneRow = el('div', 'store-form__row');
  phoneRow.appendChild(sfLabel('手机号码', true));
  const phoneCtrl = el('div', 'store-form__control');
  const phWrap = el('div', 'store-form__phone-row');
  const phoneDigits = isEdit && record.phoneRaw ? record.phoneRaw : '';
  const phoneInp = textInput('请输入手机号码', phoneDigits);
  const sms = button('获取验证码', 'primary');
  sms.classList.add('erp-btn--sms');
  phWrap.appendChild(phoneInp);
  phWrap.appendChild(sms);
  phoneCtrl.appendChild(phWrap);
  phoneRow.appendChild(phoneCtrl);
  body.appendChild(phoneRow);

  if (!isEdit) {
    row('验证码', true, textInput('请输入验证码'));
  }

  row('联系人', true, textInput('请输入联系人', isEdit ? record.contactName || '' : ''));

  if (!isEdit) {
    body.appendChild(
      radioGroupRow('结算类型', true, `${kind}-settle`, [
        ['purchase', '采购结算'],
        ['order', '订单结算'],
      ], 'order'),
    );
    body.appendChild(
      radioGroupRow('配送方式', true, `${kind}-deliver`, [
        ['pickup', '自提'],
        ['delivery', '配送'],
        ['both', '自提+配送'],
      ], 'both'),
    );
    body.appendChild(
      radioGroupRow('结款方式', true, `${kind}-pay`, [
        ['goods_first', '先货后款'],
        ['pay_first', '先款后货'],
      ], 'pay_first'),
    );
    body.appendChild(
      radioGroupRow('结算周期', true, `${kind}-cycle`, [
        ['now', '现结'],
        ['day', '日结'],
        ['week', '周结'],
        ['month', '月结'],
      ], 'now'),
    );
  } else {
    body.appendChild(
      radioGroupRow('结算类型', true, `${kind}-settle-e`, [
        ['purchase', '采购结算'],
        ['order', '订单结算'],
      ], record.rSettle || 'purchase'),
    );
    body.appendChild(
      radioGroupRow('配送方式', true, `${kind}-deliver-e`, [
        ['pickup', '自提'],
        ['delivery', '配送'],
        ['both', '自提+配送'],
      ], record.rDeliver || 'pickup'),
    );
    body.appendChild(
      radioGroupRow('结款方式', true, `${kind}-pay-e`, [
        ['goods_first', '先货后款'],
        ['pay_first', '先款后货'],
      ], record.rPay || 'goods_first'),
    );
    body.appendChild(
      radioGroupRow('结算周期', true, `${kind}-cycle-e`, [
        ['now', '现结'],
        ['day', '日结'],
        ['week', '周结'],
        ['month', '月结'],
      ], record.rCycle || 'now'),
    );
  }

  return body;
}

function attachWideModal(title, bodyEl) {
  const backdrop = el('div', 'resource-archive-modal-backdrop store-archive-modal-backdrop');
  backdrop.setAttribute('data-resource-archive-ui', '1');

  const modal = el('div', 'erp-modal erp-modal--store-wide');
  const header = el('div', 'erp-modal__header');
  header.appendChild(el('h2', 'erp-modal__title', title));
  const bx = el('button', 'erp-modal__header-btn');
  bx.type = 'button';
  bx.innerHTML = '<i class="ri-close-line"></i>';
  bx.addEventListener('click', () => backdrop.remove());
  const ha = el('div', 'erp-modal__header-actions');
  ha.appendChild(bx);
  header.appendChild(ha);

  const bodyWrap = el('div', 'erp-modal__body');
  bodyWrap.appendChild(bodyEl);

  const footer = el('div', 'erp-modal__footer');
  const bc = button('取消', 'default');
  const ok = button('确定', 'primary');
  bc.addEventListener('click', () => backdrop.remove());
  ok.addEventListener('click', () => backdrop.remove());
  footer.appendChild(bc);
  footer.appendChild(ok);

  modal.appendChild(header);
  modal.appendChild(bodyWrap);
  modal.appendChild(footer);
  backdrop.appendChild(modal);
  backdrop.addEventListener('click', (ev) => {
    if (ev.target === backdrop) backdrop.remove();
  });
  document.body.appendChild(backdrop);
}

/**
 * @param {keyof typeof CFG} kind
 */
export function openResourceAddModal(kind) {
  removeResourceArchiveUi();
  attachWideModal(CFG[kind].addTitle, buildEntityForm(kind, 'add', {}));
}

/**
 * @param {keyof typeof CFG} kind
 * @param {Record<string, string>} record
 */
export function openResourceEditModal(kind, record) {
  removeResourceArchiveUi();
  attachWideModal(CFG[kind].editTitle, buildEntityForm(kind, 'edit', record));
}

function panelFilters(fields, actions) {
  const bar = el('div', 'erp-toolbar');
  fields.forEach(([lab, ph]) => bar.appendChild(fieldRow(lab, textInput(ph))));
  const ta = el('div', 'erp-toolbar__actions');
  actions.forEach((a) => ta.appendChild(a));
  bar.appendChild(ta);
  return bar;
}

function panelEmptyNote(text) {
  return el('div', 'store-empty', text);
}

function supplierDetailSectionTitle(text) {
  return el('div', 'supplier-detail-section-title', text);
}

function buildSupplierOnboardDemoRow(record) {
  const wx = el('span', '');
  wx.appendChild(document.createTextNode('未认证 '));
  const wxLink = el('a', 'erp-link', '查看认证');
  wxLink.href = '#';
  wx.appendChild(wxLink);

  const op = el('span', 'supplier-detail-table-ops');
  const l1 = el('a', 'erp-link', '查询详情');
  const l2 = el('a', 'erp-link', '编辑');
  l1.href = '#';
  l2.href = '#';
  op.appendChild(l1);
  op.appendChild(document.createTextNode('\u3000'));
  op.appendChild(l2);

  return [
    record.subjectName ?? record.name,
    record.channel || '—',
    'MCH882910332',
    '6222 **** **** 9012',
    '对公/对私/非法人',
    '—',
    wx,
    '已认证',
    'D1',
    '0.38%',
    '0.38%',
    '0.38%',
    '待进件/待审核/审核成功/审核失败',
    '待审核/审核中/审核成功/审核未通过',
    '失败原因',
    record.createTime || '—',
    '审核通过\u3000驳回',
    op,
  ];
}

/** 供应商详情 Tab「基础信息」+「供应商进件」区块（宽表 + 底部操作） */
function panelSupplierDetailBase(kind, record, cfg) {
  const p = el('div', 'supplier-detail-tab');

  p.appendChild(supplierDetailSectionTitle('基础信息'));

  const cellRo = (lab, val) => {
    const c = el('div', 'supplier-detail-cell');
    c.appendChild(el('div', 'supplier-detail-cell__label', lab));
    const body = el('div', 'supplier-detail-cell__body');
    body.textContent = val != null && val !== '' ? String(val) : '—';
    c.appendChild(body);
    return c;
  };

  const cellRadio = (lab, pairs, sel) => {
    const c = el('div', 'supplier-detail-cell');
    c.appendChild(el('div', 'supplier-detail-cell__label', lab));
    const row = el('div', 'supplier-detail-radio-row');
    pairs.forEach(([val, text]) => {
      const lb = el('label', 'supplier-detail-radio');
      const inp = el('input');
      inp.type = 'radio';
      inp.disabled = true;
      inp.checked = val === sel;
      lb.appendChild(inp);
      lb.appendChild(document.createTextNode(` ${text}`));
      row.appendChild(lb);
    });
    c.appendChild(row);
    return c;
  };

  const cellPhone = () => {
    const c = el('div', 'supplier-detail-cell');
    c.appendChild(el('div', 'supplier-detail-cell__label', '手机号码'));
    const body = el('div', 'supplier-detail-cell__body');
    mountSupplierDetailMobile(body, record);
    c.appendChild(body);
    return c;
  };

  const cellWithdrawPhone = () => {
    const c = el('div', 'supplier-detail-cell');
    c.appendChild(el('div', 'supplier-detail-cell__label', '可提现手机号'));
    const body = el('div', 'supplier-detail-cell__body');
    mountWithdrawPhoneDetail(body, record);
    c.appendChild(body);
    return c;
  };

  const grid = el('div', 'supplier-detail-grid');
  const regionDisp = record.region ? String(record.region).replace(/\//g, ' / ') : '—';
  const deliverSel = record.rDeliverUI || 'unified';

  grid.appendChild(cellRo('供应商ID', record.id));
  grid.appendChild(cellRo('主体名称', record.subjectName ?? '—'));
  grid.appendChild(cellRo('供应商名称', record.name));
  grid.appendChild(cellRo('供应商类型', record.typeLabel));
  grid.appendChild(
    cellRadio(
      '结算类型',
      [
        ['purchase', '采购结算'],
        ['order', '订单结算'],
      ],
      record.rSettle || 'order',
    ),
  );

  grid.appendChild(cellRo('供应商地址', regionDisp));
  grid.appendChild(cellRo('详细地址', record.detailAddress));
  grid.appendChild(cellRo('负责人姓名', record.contactName));
  grid.appendChild(
    cellRadio(
      '配送方式',
      [
        ['unified', '统配'],
        ['direct', '直配'],
      ],
      deliverSel,
    ),
  );

  grid.appendChild(cellPhone());
  grid.appendChild(cellWithdrawPhone());
  grid.appendChild(cellRo('创建时间', record.createTime));
  grid.appendChild(cellRo('供应商商品数量', record.productCount));
  grid.appendChild(
    cellRadio(
      '结款方式',
      [
        ['goods_first', '先货后款'],
        ['pay_first', '先款后货'],
      ],
      record.rPay || 'pay_first',
    ),
  );

  grid.appendChild(el('div', 'supplier-detail-cell supplier-detail-cell--span3 supplier-detail-cell--empty'));
  grid.appendChild(
    cellRadio(
      '结算周期',
      [
        ['now', '现结'],
        ['day', '日结'],
        ['week', '周结'],
        ['month', '月结'],
      ],
      record.rCycle || 'now',
    ),
  );

  p.appendChild(grid);

  p.appendChild(supplierDetailSectionTitle(cfg.onboardSection));
  const bar = el('div', 'erp-actions-row supplier-detail-onboard-actions');
  const go = button('去进件', 'primary');
  go.addEventListener('click', () => openResourceOnboardingModal(kind, record));
  bar.appendChild(go);
  p.appendChild(bar);

  const headers = cfg.supplierOnboardDetailHeaders;
  p.appendChild(dataTable(headers, [buildSupplierOnboardDemoRow(record)]));

  return p;
}

/**
 * @param {keyof typeof CFG} kind
 * @param {Record<string, string>} record
 */
export function openResourceDetailDrawer(kind, record) {
  removeResourceArchiveUi();
  const cfg = CFG[kind];

  const backdrop = el('div', 'store-drawer-backdrop');
  backdrop.setAttribute('data-resource-archive-drawer', '1');

  const drawer = el('aside', 'store-drawer');
  drawer.setAttribute('data-resource-archive-drawer', '1');
  if (kind === 'supplier' || kind === 'liveRoom' || kind === 'carrier') {
    drawer.classList.add('store-drawer--supplier-wide');
  }

  const header = el('div', 'store-drawer__header');
  header.appendChild(el('h2', 'store-drawer__title', cfg.detailTitle));
  const btnClose = el('button', 'store-drawer__close');
  btnClose.type = 'button';
  btnClose.innerHTML = '&times;';
  btnClose.addEventListener('click', () => {
    backdrop.remove();
    drawer.remove();
  });
  header.appendChild(btnClose);

  const hero = el('div', 'store-drawer__hero');
  const nameRow = el('div', 'store-drawer__name-row');
  nameRow.appendChild(el('span', 'store-drawer__name', record.name));
  (record.detailTags || []).forEach((t) => {
    nameRow.appendChild(
      el('span', `store-drawer__tag store-drawer__tag--${t.kind}`, t.label),
    );
  });
  hero.appendChild(nameRow);
  hero.appendChild(
    el(
      'div',
      'store-drawer__meta',
      `${cfg.metaIdLabel}：${record.id || '—'} · 所属组织：${record.orgId || '—'}`,
    ),
  );
  if (kind === 'liveRoom') {
    const anchorNm = record.anchorName ?? record.anchor ?? '—';
    const anchorId = record.anchorId ?? '—';
    hero.appendChild(el('div', 'store-drawer__meta', `主播：${anchorNm}（${anchorId}）`));
  }

  const tabsWrap = el('div', 'store-drawer__tabs');
  const tabIds = ['base', 'comm', 'prod', 'perf'];
  const tabLabels =
    cfg.detailDrawerTabs ?? ['基础信息', '分佣明细', '商品统计', '业绩报表'];
  const bodies = {};
  const bodyHost = el('div', 'store-drawer__body');

  function gridItem(label, value) {
    const item = el('div', 'store-detail-grid__item');
    item.appendChild(el('dt', '', label));
    const dd = el('dd', '');
    dd.textContent = value != null && value !== '' ? String(value) : '—';
    item.appendChild(dd);
    return item;
  }

  function panelBase() {
    if (kind === 'supplier') {
      return panelSupplierDetailBase(kind, record, cfg);
    }
    if (kind === 'liveRoom') {
      const p = el('div', '');
      const grid = el('dl', 'store-detail-grid');
      cfg.baseRows(record).forEach(([k, v]) => {
        if (k === '可提现手机号') grid.appendChild(gridItemWithdrawPhone(record));
        else grid.appendChild(gridItem(k, v));
      });
      p.appendChild(grid);
      return p;
    }
    const p = el('div', '');
    const grid = el('dl', 'store-detail-grid');
    cfg.baseRows(record).forEach(([k, v]) => {
      if (k === '可提现手机号') grid.appendChild(gridItemWithdrawPhone(record));
      else grid.appendChild(gridItem(k, v));
    });
    p.appendChild(grid);
    p.appendChild(el('div', 'store-section-title', cfg.onboardSection));
    const bar = el('div', 'erp-actions-row');
    const go = button('去进件', 'primary');
    go.addEventListener('click', () => openResourceOnboardingModal(kind, record));
    bar.appendChild(go);
    p.appendChild(bar);
    p.appendChild(dataTable(cfg.onboardHeaders, []));
    return p;
  }

  bodies.base = panelBase();

  if (kind === 'liveRoom') {
    bodies.comm = el('div', '');
    bodies.comm.appendChild(supplierDetailSectionTitle('直播场次（业务系统）'));
    bodies.comm.appendChild(
      el(
        'p',
        'erp-page__note',
        '业务系统在本直播间下创建场次；列表需业务侧同步后展示（原型示意）。',
      ),
    );
    bodies.comm.appendChild(
      dataTable(['场次编号', '计划开播', '计划结束', '渠道', '状态'], []),
    );
    bodies.comm.appendChild(panelEmptyNote('暂无同步数据'));

    bodies.prod = el('div', '');
    bodies.prod.appendChild(supplierDetailSectionTitle('场次商品（业务系统）'));
    bodies.prod.appendChild(
      el(
        'p',
        'erp-page__note',
        '商品挂在场次下，随场次关联展示（原型示意）。',
      ),
    );
    bodies.prod.appendChild(
      dataTable(['场次编号', '商品ID', '商品名称', '挂场状态'], []),
    );
    bodies.prod.appendChild(panelEmptyNote('暂无同步数据'));

    bodies.perf = el('div', '');
    bodies.perf.appendChild(supplierDetailSectionTitle('直播间进件'));
    const perfBar = el('div', 'erp-actions-row');
    const goPerf = button('去进件', 'primary');
    goPerf.addEventListener('click', () => openResourceOnboardingModal(kind, record));
    perfBar.appendChild(goPerf);
    bodies.perf.appendChild(perfBar);
    bodies.perf.appendChild(dataTable(cfg.onboardHeaders, []));
    bodies.perf.appendChild(
      el('p', 'erp-page__note', '进件与结算信息走统一进件流程（原型示意）。'),
    );
  } else {
    bodies.comm = el('div', '');
    const sum1 = el('div', 'store-summary-bar');
    sum1.appendChild(el('span', '', '累计分佣：¥—'));
    sum1.appendChild(el('span', '', '订单数：—'));
    sum1.appendChild(el('span', '', '商品销售数：—'));
    bodies.comm.appendChild(sum1);
    bodies.comm.appendChild(
      panelFilters(
        [
          ['商品名称', '请输入商品名称'],
          ['订单ID', '请输入订单ID'],
        ],
        [button('重置', 'default'), button('查询', 'primary')],
      ),
    );
    bodies.comm.appendChild(fieldRow('下单时间', textInput('开始日期 — 结束日期')));
    bodies.comm.appendChild(
      dataTable(
        [
          '订单ID',
          '下单时间',
          '商品信息',
          '实付金额',
          '买家信息',
          '佣金',
          '交易状态',
          '分佣比例',
        ],
        [],
      ),
    );
    bodies.comm.appendChild(panelEmptyNote('暂无数据'));

    bodies.prod = el('div', '');
    const sum2 = el('div', 'store-summary-bar');
    [
      '商品成交金额：¥—',
      '商品退款金额：¥—',
      '商品数量：一笔/一件',
      '未核销：—',
      '已核销：—',
      '已过期：—',
      '已退款：—',
      '退款中：—',
    ].forEach((t) => sum2.appendChild(el('span', '', t)));
    bodies.prod.appendChild(sum2);
    bodies.prod.appendChild(
      panelFilters(
        [
          ['商品名称', ''],
          ['商品类目', ''],
        ],
        [button('重置', 'default'), button('查询', 'primary')],
      ),
    );
    const ps = el('div', 'erp-toolbar');
    ps.appendChild(fieldRow('订单状态', selectInput([{ value: '', label: '全部' }], '')));
    ps.appendChild(fieldRow('下单时间', textInput('开始日期 — 结束日期')));
    bodies.prod.appendChild(ps);
    bodies.prod.appendChild(
      dataTable(
        [
          '商品ID',
          '商品信息',
          '商品类目',
          '成交金额',
          '退款金额',
          '商品数量',
          '未核销',
          '已核销',
          '已过期',
          '已退款',
        ],
        [],
      ),
    );
    bodies.prod.appendChild(panelEmptyNote('暂无数据'));

    bodies.perf = el('div', '');
    const sum3 = el('div', 'store-summary-bar');
    ['总成交订单数：—', '总成交金额：¥—', '总退款订单数：—', '总退款金额：¥—'].forEach((t) =>
      sum3.appendChild(el('span', '', t)),
    );
    bodies.perf.appendChild(sum3);
    bodies.perf.appendChild(
      panelFilters([['选择日期', '开始日期 — 结束日期']], [button('重置', 'default'), button('查询', 'primary')]),
    );
    bodies.perf.appendChild(
      dataTable(['日期', '成交订单数', '成交金额', '退款订单数', '退款金额'], []),
    );
    bodies.perf.appendChild(panelEmptyNote('暂无数据'));
  }

  const tabs = tabIds.map((id, i) => {
    const t = el('button', 'store-drawer__tab', tabLabels[i]);
    t.type = 'button';
    t.addEventListener('click', () => {
      tabIds.forEach((tid, j) => tabs[j].classList.toggle('is-active', tid === id));
      bodyHost.replaceChildren(bodies[id]);
    });
    tabsWrap.appendChild(t);
    return t;
  });

  function showTab(id) {
    tabIds.forEach((tid, j) => tabs[j].classList.toggle('is-active', tid === id));
    bodyHost.replaceChildren(bodies[id]);
  }

  drawer.appendChild(header);
  drawer.appendChild(hero);
  drawer.appendChild(tabsWrap);
  drawer.appendChild(bodyHost);

  if (kind === 'supplier' || kind === 'liveRoom' || kind === 'carrier') {
    const footer = el('div', 'store-drawer__footer');
    const closeDrawer = () => {
      backdrop.remove();
      drawer.remove();
    };
    const bBack = button('返回', 'default');
    bBack.classList.add('erp-btn--outline-primary');
    bBack.addEventListener('click', closeDrawer);
    const bOk = button('确定', 'primary');
    bOk.addEventListener('click', closeDrawer);
    footer.appendChild(bBack);
    footer.appendChild(bOk);
    drawer.appendChild(footer);
  }

  showTab('base');

  backdrop.addEventListener('click', () => {
    backdrop.remove();
    drawer.remove();
  });
  drawer.addEventListener('click', (e) => e.stopPropagation());

  document.body.appendChild(backdrop);
  document.body.appendChild(drawer);
}

/**
 * @param {keyof typeof CFG} kind
 * @param {Record<string, string>} record
 */
export function openResourceOnboardingModal(kind, record) {
  removeResourceArchiveModals();
  const cfg = CFG[kind];
  openUnifiedOnboardingModal({
    title: cfg.onboardTitle,
    merchantShortNameDefault: record.name,
    variant: 'resource',
  });
}
