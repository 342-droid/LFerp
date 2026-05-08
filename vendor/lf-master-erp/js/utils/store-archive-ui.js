/**
 * 门店档案：新增 / 编辑 / 详情抽屉 / 进件 — 静态原型 DOM
 */
import { el } from './dom.js';
import { button, textInput, selectInput, fieldRow, dataTable, paginationBar } from './erp-ui.js';
import { createRegionCascader } from './store-region-cascader.js';
import { openUnifiedOnboardingModal } from './unified-onboarding-ui.js';
import { mountSupplierDetailMobile, mountWithdrawPhoneDetail } from './withdraw-phone-modal.js';

export { REGION_TREE, createRegionCascader } from './store-region-cascader.js';

export function removeStoreArchiveModals() {
  document.querySelectorAll('.store-archive-modal-backdrop[data-store-archive-ui]').forEach((n) => n.remove());
}

export function removeStoreArchiveDrawer() {
  document.querySelectorAll('[data-store-archive-drawer]').forEach((n) => n.remove());
}

/** 关闭门店档案相关弹窗与右侧抽屉（切换列表/重新打开详情时用） */
export function removeStoreArchiveUi() {
  removeStoreArchiveModals();
  removeStoreArchiveDrawer();
}

/**
 * @param {string} text
 * @param {boolean} required
 */
function sfLabel(text, required) {
  const lab = el('label', 'store-form__label');
  if (required) lab.appendChild(el('span', 'store-form__req', '*'));
  lab.appendChild(document.createTextNode(text));
  return lab;
}

/**
 * @param {string} title
 * @param {HTMLElement} body
 * @param {boolean} wide
 */
function attachModalShell(title, body, wide) {
  const backdrop = el('div', 'store-archive-modal-backdrop');
  backdrop.dataset.storeArchiveUi = '1';

  const modal = el('div', wide ? 'erp-modal erp-modal--store-wide' : 'erp-modal');
  let fullscreen = false;

  const header = el('div', 'erp-modal__header');
  header.appendChild(el('h2', 'erp-modal__title', title));
  const actions = el('div', 'erp-modal__header-actions');
  const btnFs = el('button', 'erp-modal__header-btn');
  btnFs.type = 'button';
  btnFs.innerHTML = '<i class="ri-fullscreen-line"></i>';
  btnFs.addEventListener('click', () => {
    fullscreen = !fullscreen;
    modal.classList.toggle('erp-modal--fullscreen', fullscreen);
    btnFs.innerHTML = fullscreen
      ? '<i class="ri-fullscreen-exit-line"></i>'
      : '<i class="ri-fullscreen-line"></i>';
  });
  const btnX = el('button', 'erp-modal__header-btn');
  btnX.type = 'button';
  btnX.innerHTML = '<i class="ri-close-line"></i>';
  btnX.addEventListener('click', () => backdrop.remove());
  actions.appendChild(btnFs);
  actions.appendChild(btnX);
  header.appendChild(actions);

  const bodyWrap = el('div', 'erp-modal__body');
  bodyWrap.appendChild(body);

  const footer = el('div', 'erp-modal__footer');
  const btnCancel = button('取消', 'default');
  const btnOk = button('确定', 'primary');
  btnCancel.addEventListener('click', () => backdrop.remove());
  btnOk.addEventListener('click', () => backdrop.remove());
  footer.appendChild(btnCancel);
  footer.appendChild(btnOk);

  modal.appendChild(header);
  modal.appendChild(bodyWrap);
  modal.appendChild(footer);
  backdrop.appendChild(modal);

  backdrop.addEventListener('click', (ev) => {
    if (ev.target === backdrop) backdrop.remove();
  });

  document.body.appendChild(backdrop);
  return backdrop;
}

/** 主体名称下拉（与主体中心 — 门店主体对齐，原型） */
function subjectNameSelect() {
  return selectInput(
    [
      { value: '', label: '请选择主体名称' },
      { value: '307892034956427264', label: '冷丰演示门店' },
      { value: '307892034956427265', label: '五角场体验店' },
      { value: '307892034956427266', label: '张江快闪店' },
      { value: 'm2', label: '演示主体-B' },
    ],
    '',
  );
}

function bdSelect(placeholder) {
  return selectInput(
    [
      { value: '', label: placeholder },
      { value: '1', label: '赵小九' },
      { value: '2', label: '李四' },
      { value: '3', label: '张三' },
    ],
    '',
  );
}

function warehouseSelect() {
  return selectInput(
    [
      { value: '', label: '请选择配送仓库' },
      { value: 'wh1', label: '沪南一号仓' },
      { value: 'wh2', label: '苏州合作仓' },
    ],
    '',
  );
}

function partnerDivisionSelect() {
  return selectInput(
    [
      { value: '', label: '请选择门店合作类型' },
      { value: 'franchise', label: '加盟店' },
      { value: 'partner', label: '合作店' },
      { value: 'peer', label: '同行店' },
    ],
    '',
  );
}

function yesNoSelect(placeholder = '请选择') {
  return selectInput(
    [
      { value: '', label: placeholder },
      { value: 'yes', label: '有' },
      { value: 'no', label: '无' },
    ],
    '',
  );
}

function textareaInput(placeholder, value = '') {
  const ta = el('textarea', 'erp-input store-form__textarea');
  ta.placeholder = placeholder;
  ta.value = value;
  ta.maxLength = 500;
  return ta;
}

function uploadMock(label, hint = '支持 JPG/PNG，单张图片不超过 5M') {
  const up = el('div', 'store-form__upload');
  up.appendChild(button(label, 'primary'));
  up.appendChild(el('div', 'store-form__upload-hint', hint));
  return up;
}

function sectionHint(text) {
  return el('div', 'store-form__section-hint', text);
}

function controlledSection(kind) {
  const section = el('div', '');
  section.dataset.partnerSection = kind;
  section.style.display = 'none';
  return section;
}

/**
 * @param {import('./store-archive-ui.js').StoreArchiveRecord} [store]
 * @param {'add'|'edit'} mode
 */
function buildStoreFormBody(store, mode) {
  const body = el('div', '');
  const isEdit = mode === 'edit';

  function row(label, required, control) {
    const r = el('div', 'store-form__row');
    r.appendChild(sfLabel(label, required));
    const c = el('div', 'store-form__control');
    c.appendChild(control);
    r.appendChild(c);
    body.appendChild(r);
  }

  function sectionRow(section, label, required, control) {
    const r = el('div', 'store-form__row');
    r.appendChild(sfLabel(label, required));
    const c = el('div', 'store-form__control');
    c.appendChild(control);
    r.appendChild(c);
    section.appendChild(r);
  }

  const subSel = subjectNameSelect();
  if (isEdit && store && store.orgId) subSel.value = String(store.orgId);

  row('主体名称', true, subSel);

  row('联系人', true, textInput('请输入联系人', isEdit && store ? store.contact : ''));

  const phoneRow = el('div', 'store-form__phone-row');
  const phoneInp = textInput(
    '请输入手机号码',
    isEdit && store ? store.phone.replace(/\*/g, '6') : '',
  );
  const sms = button('获取验证码', 'primary');
  sms.classList.add('erp-btn--sms');
  phoneRow.appendChild(phoneInp);
  phoneRow.appendChild(sms);
  row('手机号码', true, phoneRow);
  row('验证码', true, textInput(isEdit ? '不修改手机号码无需填写' : '请输入验证码'));

  const nameWrap = el('div', 'store-form__input-count');
  const nameInp = textInput('请输入门店名称', isEdit && store ? store.name : '');
  const nameCnt = el('span', 'store-form__counter', `${(isEdit && store ? store.name : '').length} / 50`);
  nameInp.maxLength = 50;
  nameInp.addEventListener('input', () => {
    nameCnt.textContent = `${nameInp.value.length} / 50`;
  });
  nameWrap.appendChild(nameInp);
  nameWrap.appendChild(nameCnt);
  row('门店名称', true, nameWrap);

  row('门店简称', false, textInput('请输入门店简称'));

  const partnerSel = partnerDivisionSelect();
  row('门店合作类型', true, partnerSel);

  row('门店类型', true, textInput('如社区生鲜店、团购自提点等'));

  row('配送仓库', true, warehouseSelect());

  const regionRow = el('div', 'store-form__row');
  regionRow.appendChild(sfLabel('门店地址', true));
  const regionCtrl = el('div', 'store-form__control');
  const cascader = createRegionCascader(
    body,
    isEdit && store ? store.region.replace(/\//g, ' / ') : '',
  );
  if (isEdit && store) cascader.setValue(store.region.replace(/\//g, ' / '));
  regionCtrl.appendChild(cascader.wrap);
  regionRow.appendChild(regionCtrl);
  body.appendChild(regionRow);

  const addrRow = el('div', 'store-form__row');
  addrRow.appendChild(sfLabel('详细地址', true));
  const addrCtrl = el('div', 'store-form__control');
  const ta = el('textarea', 'erp-input store-form__textarea');
  ta.placeholder = '请输入详细地址，输入后将自动在地图上定位';
  const addrVal = isEdit && store ? store.address : '';
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

  const map = el('div', 'store-archive__map-mock', '地图定位示意（高德 · 原型）');
  const mapRow = el('div', 'store-form__row');
  mapRow.appendChild(sfLabel('', false));
  const mapCtrl = el('div', 'store-form__control');
  mapCtrl.appendChild(map);
  if (isEdit) {
    mapCtrl.appendChild(
      el(
        'div',
        'store-archive__coord-hint',
        '当前坐标：39.928359, 116.416334（可在地图上点击手动微调 · 演示）',
      ),
    );
  }
  mapRow.appendChild(mapCtrl);
  body.appendChild(mapRow);

  const uploadRow = el('div', 'store-form__row');
  uploadRow.appendChild(sfLabel('门店门头照', true));
  const upCtrl = el('div', 'store-form__control');
  upCtrl.appendChild(uploadMock('+ 点击上传'));
  uploadRow.appendChild(upCtrl);
  body.appendChild(uploadRow);

  row('有无冷藏柜', false, yesNoSelect('请选择有无冷藏柜'));
  row('冷藏柜照片', false, uploadMock('+ 上传冷藏柜照片', '最多 5 张'));
  row('有无冷冻柜', false, yesNoSelect('请选择有无冷冻柜'));
  row('冷冻柜照片', false, uploadMock('+ 上传冷冻柜照片', '最多 5 张'));

  const franchiseSection = controlledSection('franchise');
  franchiseSection.appendChild(sectionHint('加盟店 / 合作店补充资料'));
  sectionRow(franchiseSection, '门店面积', true, textInput('请输入门店面积（㎡）', isEdit && store ? store.areaM2 ?? '' : ''));
  sectionRow(franchiseSection, '门店楼层', true, textInput('请输入门店楼层'));
  sectionRow(franchiseSection, '店门口口述视频', false, uploadMock('+ 上传店门口视频', '店前两分钟口述视频'));
  sectionRow(franchiseSection, '店内口述视频', false, uploadMock('+ 上传店内视频', '店内一分钟口述视频'));
  sectionRow(franchiseSection, '门店方圆500米入住户数', false, textInput('请输入实际入住总户数'));
  sectionRow(franchiseSection, '日均客单量', false, textInput('请输入日均客单量'));
  sectionRow(franchiseSection, '店内工作人员总数', false, textInput('请输入工作人员总数'));
  sectionRow(franchiseSection, '实际经营者对直播业务的理解', false, textareaInput('请输入老板对直播业务的理解'));
  sectionRow(franchiseSection, '门店日常运营服务理解与配合', false, textareaInput('请输入日常运营服务理解与配合情况'));
  sectionRow(franchiseSection, '私域直播投入产出期望', false, textareaInput('请输入老板对私域直播 ROI 的期望'));
  sectionRow(franchiseSection, '私域直播/社区团购熟悉程度', false, textareaInput('请输入了解程度'));
  sectionRow(franchiseSection, '周边小区及居住人群描述', false, textareaInput('请输入周边小区及人群描述'));
  sectionRow(franchiseSection, '拉到1000人信心说明', false, textareaInput('请输入信心说明'));
  sectionRow(franchiseSection, '特殊情况说明', false, textareaInput('如涉及区域保护、特殊沟通，请填写说明'));
  sectionRow(franchiseSection, '特殊情况配图', false, uploadMock('+ 上传特殊情况配图', '最多 6 张'));
  body.appendChild(franchiseSection);

  const peerSection = controlledSection('peer');
  peerSection.appendChild(sectionHint('同行店补充资料'));
  sectionRow(peerSection, '已合作其他平台情况', false, textareaInput('目前门店已合作的其他平台情况'));
  sectionRow(peerSection, '近三天上播及销量截图', false, uploadMock('+ 上传经营截图', '最多 6 张'));
  body.appendChild(peerSection);

  const syncPartnerSections = () => {
    const v = partnerSel.value;
    franchiseSection.style.display = v === 'franchise' || v === 'partner' ? '' : 'none';
    peerSection.style.display = v === 'peer' ? '' : 'none';
  };
  partnerSel.addEventListener('change', syncPartnerSections);
  syncPartnerSections();

  if (isEdit) {
    row(
      '运营状态',
      true,
      selectInput(
        [
          { value: 'OPEN', label: '营业中' },
          { value: 'CLOSED', label: 'CLOSED' },
          { value: 'PREP', label: '筹备' },
        ],
        'CLOSED',
      ),
    );
  }

  return body;
}

/** @typedef {{
 *   storeId: string,
 *   subjectName: string,
 *   name: string,
 *   bd: string,
 *   group: string,
 *   tag: string,
 *   region: string,
 *   address: string,
 *   phone: string,
 *   contact: string,
 *   delivery: string,
 *   channel: string,
 *   latlng: string,
 *   withdrawPhone: string,
 *   opStatus: string,
 *   onboardStatus: string,
 *   settleType: string,
 *   settleCycle: string,
 *   splitService: string,
 *   storeStatus: string,
 *   createTime: string,
 *   orgId: string,
 *   detailTags?: Array<{ label: string, kind: 'orange'|'gray' }>,
 *   bdName?: string,
 *   fulfillWarehouse?: string,
 *   customerCount?: string,
 *   storeWarehouseText?: string,
 *   areaM2?: string,
 *   hasRefrigerator?: boolean,
 *   fridgePhotoCount?: number,
 *   hasFreezer?: boolean,
 * }} StoreArchiveRecord */

const STORE_ONBOARD_DETAIL_HEADERS = [
  '商户名称',
  '入网渠道',
  '商户号',
  '银行卡号',
  '进件类型',
  '非法人结算授权书',
  '微信认证状态',
  '支付宝认证状态',
  '结算周期',
  '收款二维码借记费率',
  '微信扫码费率',
  '支付宝扫码费率',
  '平台审核状态',
  '三方进件审核状态',
  '审核说明',
  '创建时间',
  '状态',
  '操作',
];

function storeDetailSectionTitle(text) {
  return el('div', 'supplier-detail-section-title', text);
}

/**
 * @param {StoreArchiveRecord} store
 */
function buildStoreOnboardDemoRow(store) {
  const wx = el('span', '');
  wx.appendChild(document.createTextNode('未认证 '));
  const wxLink = el('a', 'erp-link', '查看认证');
  wxLink.href = '#';
  wx.appendChild(wxLink);

  const op = el('span', 'supplier-detail-table-ops');
  ['审核通过', '驳回', '查询详情', '编辑'].forEach((txt, i) => {
    if (i) op.appendChild(document.createTextNode('\u3000'));
    const a = el('a', 'erp-link', txt);
    a.href = '#';
    op.appendChild(a);
  });

  return [
    store.name,
    store.channel || '—',
    'MCH772910001',
    '6225 **** **** 6601',
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
    store.createTime || '—',
    '审核通过\u3000驳回',
    op,
  ];
}

export function openStoreAddModal() {
  removeStoreArchiveUi();
  const body = buildStoreFormBody(undefined, 'add');
  attachModalShell('添加门店', body, true);
}

/**
 * @param {StoreArchiveRecord} store
 */
export function openStoreEditModal(store) {
  removeStoreArchiveUi();
  const body = buildStoreFormBody(store, 'edit');
  attachModalShell('编辑门店', body, true);
}

/**
 * @param {StoreArchiveRecord} store
 */
export function openStoreDetailDrawer(store) {
  removeStoreArchiveUi();

  const backdrop = el('div', 'store-drawer-backdrop');
  backdrop.setAttribute('data-store-archive-drawer', '1');

  const drawer = el('aside', 'store-drawer');
  drawer.setAttribute('data-store-archive-drawer', '1');
  drawer.classList.add('store-drawer--store-wide');

  const header = el('div', 'store-drawer__header');
  header.appendChild(el('h2', 'store-drawer__title', '门店详情'));
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
  nameRow.appendChild(el('span', 'store-drawer__name', store.name));
  const tags = store.detailTags || [];
  tags.forEach((t) => {
    const span = el('span', `store-drawer__tag store-drawer__tag--${t.kind}`, t.label);
    nameRow.appendChild(span);
  });
  hero.appendChild(nameRow);
  hero.appendChild(
    el(
      'div',
      'store-drawer__meta',
      `门店ID：${store.storeId} · 所属组织：${store.orgId}`,
    ),
  );

  const tabsWrap = el('div', 'store-drawer__tabs');
  const tabIds = ['base', 'cust', 'comm', 'prod', 'perf'];
  const tabLabels = ['基础信息', '绑定客户', '分佣明细', '商品统计', '业绩报表'];
  const bodies = {};

  const bodyHost = el('div', 'store-drawer__body');

  function panelBase() {
    const p = el('div', 'supplier-detail-tab');

    const cellRo = (lab, val) => {
      const c = el('div', 'supplier-detail-cell');
      c.appendChild(el('div', 'supplier-detail-cell__label', lab));
      const body = el('div', 'supplier-detail-cell__body');
      body.textContent = val != null && val !== '' ? String(val) : '—';
      c.appendChild(body);
      return c;
    };

    const cellPhone = () => {
      const c = el('div', 'supplier-detail-cell');
      c.appendChild(el('div', 'supplier-detail-cell__label', '手机号码'));
      const body = el('div', 'supplier-detail-cell__body');
      mountSupplierDetailMobile(body, store);
      c.appendChild(body);
      return c;
    };

    const cellWithdrawPhone = () => {
      const c = el('div', 'supplier-detail-cell');
      c.appendChild(el('div', 'supplier-detail-cell__label', '可提现手机号'));
      const body = el('div', 'supplier-detail-cell__body');
      mountWithdrawPhoneDetail(body, store);
      c.appendChild(body);
      return c;
    };

    const cellFacadeThumb = () => {
      const c = el('div', 'supplier-detail-cell');
      c.appendChild(el('div', 'supplier-detail-cell__label', '门店门头照'));
      const wrap = el('div', 'store-detail-thumb-row');
      wrap.appendChild(el('div', 'store-detail-thumb store-detail-thumb--lg'));
      c.appendChild(wrap);
      return c;
    };

    const cellCold = (lab, has, thumbs) => {
      const c = el('div', 'supplier-detail-cell');
      c.appendChild(el('div', 'supplier-detail-cell__label', lab));
      const row = el('div', 'store-detail-fridge-row');
      row.appendChild(el('span', 'store-detail-yesno', has ? '有' : '无'));
      const n = typeof thumbs === 'number' ? thumbs : 0;
      if (has && n > 0) {
        for (let i = 0; i < n; i += 1) {
          row.appendChild(el('div', 'store-detail-thumb store-detail-thumb--sm'));
        }
      }
      c.appendChild(row);
      return c;
    };

    const cellWarehouseRed = () => {
      const block = el('div', 'supplier-detail-cell supplier-detail-cell--span4');
      block.appendChild(el('div', 'supplier-detail-cell__label', '门店仓库'));
      const body = el('div', 'supplier-detail-cell__body');
      const wh =
        store.storeWarehouseText != null && store.storeWarehouseText !== ''
          ? String(store.storeWarehouseText)
          : '—';
      body.textContent = wh;
      if (wh !== '—') body.classList.add('store-detail-warehouse-red');
      block.appendChild(body);
      return block;
    };

    p.appendChild(storeDetailSectionTitle('基础信息'));

    const grid = el('div', 'supplier-detail-grid');
    const regionDisp = store.region ? store.region.replace(/\//g, ' / ') : '—';
    const partnerDivision = store.partnerDivision || '—';
    const isFranchiseOrPartner = partnerDivision === '加盟店' || partnerDivision === '合作店';
    const isPeerStore = partnerDivision === '同行店';

    grid.appendChild(cellRo('门店ID', store.storeId));
    grid.appendChild(cellRo('主体名称', store.subjectName ?? '—'));
    grid.appendChild(cellRo('联系人', store.contact));
    grid.appendChild(cellPhone());

    grid.appendChild(cellRo('门店名称', store.name));
    grid.appendChild(cellRo('门店简称', store.shortName ?? '—'));
    grid.appendChild(cellRo('门店合作类型', partnerDivision));
    grid.appendChild(cellRo('门店类型', store.storeType ?? '—'));

    grid.appendChild(cellRo('绑定BD', store.bd));
    grid.appendChild(
      cellRo('配送仓库', store.fulfillWarehouse || '创建门店时选择的履约仓库'),
    );
    grid.appendChild(cellRo('省市区', regionDisp));
    grid.appendChild(cellRo('详细地址', store.address));

    grid.appendChild(cellRo('经纬度', store.latlng || '—'));
    grid.appendChild(cellFacadeThumb());
    grid.appendChild(cellWithdrawPhone());

    grid.appendChild(
      cellCold('冷藏柜', !!store.hasRefrigerator, store.fridgePhotoCount ?? 2),
    );
    grid.appendChild(cellCold('冷冻柜', !!store.hasFreezer, 0));

    if (isFranchiseOrPartner) {
      grid.appendChild(cellRo('门店面积（㎡）', store.areaM2 ?? '—'));
      grid.appendChild(cellRo('门店楼层', store.storeFloors ?? '—'));
      grid.appendChild(cellRo('店门口口述视频', store.videoStorefrontIntroDone ? '已上传' : '—'));
      grid.appendChild(cellRo('店内口述视频', store.videoInteriorIntroDone ? '已上传' : '—'));
      grid.appendChild(cellRo('门店方圆500米入住户数', store.householdsWithin500m ?? '—'));
      grid.appendChild(cellRo('日均客单量', store.dailyOrderVolume ?? '—'));
      grid.appendChild(cellRo('店内工作人员总数', store.staffCount ?? '—'));
      grid.appendChild(cellRo('实际经营者对直播业务的理解', store.liveCommerceUnderstanding ?? '—'));
      grid.appendChild(cellRo('门店日常运营服务理解与配合', store.dailyOpsCooperationNote ?? '—'));
      grid.appendChild(cellRo('私域直播投入产出期望', store.privateLiveRoiExpectation ?? '—'));
      grid.appendChild(cellRo('私域直播/社区团购熟悉程度', store.privateCommerceFamiliarity ?? '—'));
      grid.appendChild(cellRo('周边小区及居住人群描述', store.surroundingCommunityNote ?? '—'));
      grid.appendChild(cellRo('拉到1000人信心说明', store.confidenceReach1000 ?? '—'));
      grid.appendChild(cellRo('特殊情况说明', store.specialCircumstancesNote ?? '—'));
      grid.appendChild(cellRo('特殊情况配图', store.specialCircumstancesPhotosDone ?? '—'));
    }

    if (isPeerStore) {
      grid.appendChild(cellRo('已合作其他平台情况', store.otherPlatformsCooperation ?? '—'));
      grid.appendChild(cellRo('近三天上播及销量截图', store.broadcastSalesScreenshotsDone ?? '—'));
    }

    grid.appendChild(cellRo('创建时间', store.createTime));

    p.appendChild(grid);

    p.appendChild(storeDetailSectionTitle('商户进件'));
    const onboardBar = el('div', 'erp-actions-row supplier-detail-onboard-actions');
    const goBtn = button('去进件', 'primary');
    goBtn.addEventListener('click', () => openStoreOnboardingModal(store));
    onboardBar.appendChild(goBtn);
    p.appendChild(onboardBar);

    p.appendChild(dataTable(STORE_ONBOARD_DETAIL_HEADERS, [buildStoreOnboardDemoRow(store)]));
    return p;
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

  bodies.base = panelBase();

  bodies.cust = el('div', '');
  bodies.cust.appendChild(
    panelFilters(
      [
        ['用户ID', '请输入用户ID'],
        ['手机号码', '请输入手机号码'],
      ],
      [button('重置', 'default'), button('查询', 'primary')],
    ),
  );
  bodies.cust.appendChild(
    dataTable(
      [
        '用户ID',
        '用户昵称',
        '用户头像',
        '手机号码',
        '下单次数',
        '累计下单金额',
        '观看时长',
        '用户等级',
        '用户当前积分',
      ],
      [],
    ),
  );
  bodies.cust.appendChild(panelEmptyNote('暂无数据'));
  bodies.cust.appendChild(paginationBar({ total: 0, page: 1, pageSize: 20 }));

  bodies.comm = el('div', '');
  const sum1 = el('div', 'store-summary-bar');
  sum1.appendChild(el('span', '', '累计分佣：¥—'));
  sum1.appendChild(el('span', '', '订单数：—'));
  sum1.appendChild(el('span', '', '商品销售数：—'));
  bodies.comm.appendChild(sum1);
  bodies.comm.appendChild(
    panelFilters(
      [
        ['商品名称', ''],
        ['订单ID', ''],
      ],
      [button('重置', 'default'), button('查询', 'primary')],
    ),
  );
  const dateRow = el('div', 'erp-toolbar');
  dateRow.appendChild(fieldRow('下单时间', textInput('开始日期 — 结束日期')));
  bodies.comm.appendChild(dateRow);
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
    '商品数量：—',
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

  let active = 'base';

  function showTab(id) {
    active = id;
    tabIds.forEach((tid, i) => {
      tabs[i].classList.toggle('is-active', tid === id);
    });
    bodyHost.replaceChildren(bodies[id]);
  }

  const tabs = tabIds.map((id, i) => {
    const t = el('button', 'store-drawer__tab', tabLabels[i]);
    t.type = 'button';
    t.addEventListener('click', () => showTab(id));
    tabsWrap.appendChild(t);
    return t;
  });

  drawer.appendChild(header);
  drawer.appendChild(hero);
  drawer.appendChild(tabsWrap);
  drawer.appendChild(bodyHost);

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
 * @param {StoreArchiveRecord} store
 */
export function openStoreOnboardingModal(store) {
  removeStoreArchiveModals();
  openUnifiedOnboardingModal({
    title: '门店进件',
    merchantShortNameDefault: store.name,
    variant: 'store',
  });
}
