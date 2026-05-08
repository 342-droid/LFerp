/**
 * 审核中心 — 门店注册审核
 * 承接 BD App / PC 发起的门店注册申请，BD 总监审核通过后生成 MDM 主体与门店档案。
 */
import { empty, el } from '../utils/dom.js';
import { fieldRow, textInput, selectInput, button, breadcrumb, paginationBar } from '../utils/erp-ui.js';

const HEADERS = [
  '申请单号',
  '来源',
  '主体名称',
  '门店名称',
  '绑定BD',
  '联系人',
  '手机号码',
  '审核状态',
  'MDM状态',
  '提交时间',
  '操作',
];

const auditRows = [
  {
    id: 'WF-STORE-20260507001',
    source: 'PC 创建门店',
    subjectName: '冷丰演示门店',
    storeName: '冷丰演示门店文一西路店',
    shortName: '冷丰-文一西路',
    bd: '王强',
    contact: '周敏',
    phone: '138****2201',
    auditStatus: '待审核',
    mdmStatus: '未生成',
    submittedAt: '2026-05-07 15:20',
    storeType: '社区生鲜店',
    partnerDivision: '加盟店',
    warehouse: '华东 RDC-杭州',
    region: '浙江省 / 杭州市 / 西湖区',
    address: '文一西路 558 号 1 层临街',
    latlng: '120.0912,30.2866',
    facadePhoto: [{ type: 'image', name: '门店门头照-文一西路.jpg' }],
    hasRefrigeratedCabinet: '有',
    refrigeratedPhotos: [
      { type: 'image', name: '冷藏柜-1.jpg' },
      { type: 'image', name: '冷藏柜-2.jpg' },
    ],
    hasFreezerCabinet: '无',
    freezerPhotos: '—',
    storeArea: '120',
    storeFloors: '1F',
    videoStorefrontIntro: [{ type: 'video', name: '店门口口述视频.mp4' }],
    videoInteriorIntro: [{ type: 'video', name: '店内口述视频.mp4' }],
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
    specialCircumstancesPhotos: '—',
  },
  {
    id: 'WF-STORE-20260507002',
    source: 'PC 创建门店',
    subjectName: '五角场体验店',
    storeName: '五角场体验店',
    shortName: '五角场体验',
    bd: '李四',
    contact: '孙丽',
    phone: '188****7765',
    auditStatus: '待总监审核',
    mdmStatus: '未生成',
    submittedAt: '2026-05-07 14:58',
    storeType: '团购自提点',
    partnerDivision: '合作店',
    warehouse: '沪东前置仓',
    region: '上海市 / 市辖区 / 杨浦区',
    address: '五角场商圈政通路 99 号',
    latlng: '121.5142,31.3028',
    facadePhoto: [{ type: 'image', name: '五角场门头照.jpg' }],
    hasRefrigeratedCabinet: '有',
    refrigeratedPhotos: [{ type: 'image', name: '冷藏柜照片.jpg' }],
    hasFreezerCabinet: '有',
    freezerPhotos: [{ type: 'image', name: '冷冻柜照片.jpg' }],
    storeArea: '156',
    storeFloors: '1F',
    videoStorefrontIntro: [{ type: 'video', name: '店前两分钟口述.mp4' }],
    videoInteriorIntro: [{ type: 'video', name: '店内一分钟口述.mp4' }],
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
    specialCircumstancesPhotos: [
      { type: 'image', name: '区域保护说明-1.jpg' },
      { type: 'image', name: '区域保护说明-2.jpg' },
    ],
  },
  {
    id: 'WF-STORE-20260506008',
    source: 'PC 创建门店',
    subjectName: '张江快闪店',
    storeName: '张江快闪店',
    shortName: '张江快闪',
    bd: '赵小九',
    contact: '陈晨',
    phone: '186****9001',
    auditStatus: '审核成功',
    mdmStatus: '已生成主体与门店档案',
    submittedAt: '2026-05-06 18:36',
    storeType: '快闪零售',
    partnerDivision: '同行店',
    warehouse: '沪东前置仓',
    region: '上海市 / 市辖区 / 浦东新区',
    address: '张江路 88 号',
    latlng: '121.6321,31.2047',
    facadePhoto: [{ type: 'image', name: '张江快闪门头照.jpg' }],
    hasRefrigeratedCabinet: '无',
    refrigeratedPhotos: '—',
    hasFreezerCabinet: '无',
    freezerPhotos: '—',
    otherPlatformsCooperation: '已合作美团优选和社区团购平台。',
    broadcastSalesScreenshots: [
      { type: 'image', name: '上播销量截图-第1天.jpg' },
      { type: 'image', name: '上播销量截图-第2天.jpg' },
      { type: 'image', name: '上播销量截图-第3天.jpg' },
    ],
  },
];

function statusClass(status) {
  if (status === '审核成功' || status === '已生成主体与门店档案') return 'audit-tag audit-tag--success';
  if (status === '审核失败') return 'audit-tag audit-tag--danger';
  if (status === '待审核' || status === '待总监审核') return 'audit-tag audit-tag--warning';
  return 'audit-tag';
}

function statusTag(status) {
  return el('span', statusClass(status), status);
}

function closeAuditModals() {
  document.querySelectorAll('[data-audit-center-modal]').forEach((n) => n.remove());
}

function detailRow(label, value) {
  const row = el('div', 'audit-detail-row');
  row.appendChild(el('span', 'audit-detail-row__label', label));
  const valueEl = el('span', 'audit-detail-row__value');
  if (value instanceof Node) valueEl.appendChild(value);
  else valueEl.textContent = value || '—';
  row.appendChild(valueEl);
  return row;
}

function openMediaPreview(file) {
  const backdrop = el('div', 'erp-modal-backdrop');
  backdrop.dataset.auditCenterModal = '1';
  const modal = el('div', 'erp-modal erp-modal--store-wide');
  const header = el('div', 'erp-modal__header');
  header.appendChild(el('h2', 'erp-modal__title', file.name));
  const actions = el('div', 'erp-modal__header-actions');
  const close = el('button', 'erp-modal__header-btn');
  close.type = 'button';
  close.innerHTML = '<i class="ri-close-line"></i>';
  close.addEventListener('click', () => backdrop.remove());
  actions.appendChild(close);
  header.appendChild(actions);

  const body = el('div', 'erp-modal__body');
  const preview = el('div', 'audit-media-preview');
  if (file.type === 'video') {
    const video = el('video', 'audit-media-preview__video');
    video.controls = true;
    video.autoplay = true;
    video.src = mediaUrl(file);
    preview.appendChild(video);
  } else {
    const img = el('img', 'audit-media-preview__image');
    img.src = mediaUrl(file);
    img.alt = file.name;
    preview.appendChild(img);
  }
  body.appendChild(preview);

  const footer = el('div', 'erp-modal__footer');
  const ok = button('关闭', 'primary');
  ok.addEventListener('click', () => backdrop.remove());
  footer.appendChild(ok);
  modal.appendChild(header);
  modal.appendChild(body);
  modal.appendChild(footer);
  backdrop.appendChild(modal);
  backdrop.addEventListener('click', (ev) => {
    if (ev.target === backdrop) backdrop.remove();
  });
  document.body.appendChild(backdrop);
}

function mediaUrl(file) {
  if (file.url) return file.url;
  if (file.type === 'video') return 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="360" height="240" viewBox="0 0 360 240">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#dbeafe"/>
          <stop offset="1" stop-color="#eff6ff"/>
        </linearGradient>
      </defs>
      <rect width="360" height="240" rx="18" fill="url(#g)"/>
      <circle cx="72" cy="70" r="24" fill="#93c5fd"/>
      <path d="M40 196l82-82 54 54 36-36 108 108H40z" fill="#60a5fa" opacity=".55"/>
      <text x="180" y="218" text-anchor="middle" font-size="15" font-family="Arial, sans-serif" fill="#1d4ed8">${file.name}</text>
    </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function mediaGrid(files) {
  if (!Array.isArray(files) || files.length === 0) return '—';
  const wrap = el('div', 'audit-media-grid');
  files.forEach((file) => {
    const card = el('div', 'audit-media-card');
    if (file.type === 'video') {
      const video = el('video', 'audit-media-card__video');
      video.controls = true;
      video.preload = 'metadata';
      video.src = mediaUrl(file);
      card.appendChild(video);
    } else {
      const img = el('img', 'audit-media-card__image');
      img.src = mediaUrl(file);
      img.alt = file.name;
      img.addEventListener('click', () => openMediaPreview(file));
      card.appendChild(img);
    }
    const caption = el('div', 'audit-media-card__caption', file.name);
    card.appendChild(caption);
    wrap.appendChild(card);
  });
  return wrap;
}

function appendRegistrationFields(body, row) {
  const isFranchiseOrPartner = row.partnerDivision === '加盟店' || row.partnerDivision === '合作店';
  const isPeerStore = row.partnerDivision === '同行店';

  body.appendChild(el('div', 'supplier-detail-section-title', '主体字段'));
  body.appendChild(detailRow('主体名称', row.subjectName));
  body.appendChild(detailRow('绑定BD', row.bd));
  body.appendChild(detailRow('主体类型', '门店'));
  body.appendChild(detailRow('联系人', row.contact));
  body.appendChild(detailRow('手机号码', row.phone));

  body.appendChild(el('div', 'supplier-detail-section-title', '门店档案字段'));
  body.appendChild(detailRow('门店名称', row.storeName));
  body.appendChild(detailRow('门店简称', row.shortName));
  body.appendChild(detailRow('门店合作类型', row.partnerDivision));
  body.appendChild(detailRow('门店类型', row.storeType));
  body.appendChild(detailRow('配送仓库', row.warehouse));
  body.appendChild(detailRow('省市区', row.region));
  body.appendChild(detailRow('详细地址', row.address));
  body.appendChild(detailRow('经纬度', row.latlng));
  body.appendChild(detailRow('门店门头照', mediaGrid(row.facadePhoto)));
  body.appendChild(detailRow('有无冷藏柜', row.hasRefrigeratedCabinet));
  body.appendChild(detailRow('冷藏柜照片', mediaGrid(row.refrigeratedPhotos)));
  body.appendChild(detailRow('有无冷冻柜', row.hasFreezerCabinet));
  body.appendChild(detailRow('冷冻柜照片', mediaGrid(row.freezerPhotos)));

  if (isFranchiseOrPartner) {
    body.appendChild(el('div', 'supplier-detail-section-title', '加盟店 / 合作店补充资料'));
    body.appendChild(detailRow('门店面积（㎡）', row.storeArea));
    body.appendChild(detailRow('门店楼层', row.storeFloors));
    body.appendChild(detailRow('店门口口述视频', mediaGrid(row.videoStorefrontIntro)));
    body.appendChild(detailRow('店内口述视频', mediaGrid(row.videoInteriorIntro)));
    body.appendChild(detailRow('门店方圆500米入住户数', row.householdsWithin500m));
    body.appendChild(detailRow('日均客单量', row.dailyOrderVolume));
    body.appendChild(detailRow('店内工作人员总数', row.staffCount));
    body.appendChild(detailRow('实际经营者对直播业务的理解', row.liveCommerceUnderstanding));
    body.appendChild(detailRow('门店日常运营服务理解与配合', row.dailyOpsCooperationNote));
    body.appendChild(detailRow('私域直播投入产出期望', row.privateLiveRoiExpectation));
    body.appendChild(detailRow('私域直播/社区团购熟悉程度', row.privateCommerceFamiliarity));
    body.appendChild(detailRow('周边小区及居住人群描述', row.surroundingCommunityNote));
    body.appendChild(detailRow('拉到1000人信心说明', row.confidenceReach1000));
    body.appendChild(detailRow('特殊情况说明', row.specialCircumstancesNote));
    body.appendChild(detailRow('特殊情况配图', mediaGrid(row.specialCircumstancesPhotos)));
  }

  if (isPeerStore) {
    body.appendChild(el('div', 'supplier-detail-section-title', '同行店补充资料'));
    body.appendChild(detailRow('已合作其他平台情况', row.otherPlatformsCooperation));
    body.appendChild(detailRow('近三天上播及销量截图', mediaGrid(row.broadcastSalesScreenshots)));
  }
}

function approveAudit(row) {
  if (row.auditStatus === '待审核') {
    row.auditStatus = '待总监审核';
    row.mdmStatus = '未生成';
    return;
  }
  if (row.auditStatus === '待总监审核') {
    row.auditStatus = '审核成功';
    row.mdmStatus = '已生成主体与门店档案';
  }
}

function rejectAudit(row) {
  row.auditStatus = '审核失败';
  row.mdmStatus = '未生成';
}

function submitEditedAudit(row) {
  row.auditStatus = '待总监审核';
  row.mdmStatus = '未生成';
}

function editRow(label, control) {
  const row = el('div', 'audit-detail-row');
  row.appendChild(el('span', 'audit-detail-row__label', label));
  const value = el('span', 'audit-detail-row__value');
  value.appendChild(control);
  row.appendChild(value);
  return row;
}

function appendEditableFields(body, row) {
  body.appendChild(el('div', 'supplier-detail-section-title', '主体字段'));
  body.appendChild(editRow('主体名称', textInput('请输入主体名称', row.subjectName)));
  body.appendChild(editRow('绑定BD', textInput('请输入绑定BD', row.bd)));
  body.appendChild(detailRow('主体类型', '门店'));
  body.appendChild(editRow('联系人', textInput('请输入联系人', row.contact)));
  body.appendChild(editRow('手机号码', textInput('请输入手机号码', row.phone)));

  body.appendChild(el('div', 'supplier-detail-section-title', '门店档案字段'));
  body.appendChild(editRow('门店名称', textInput('请输入门店名称', row.storeName)));
  body.appendChild(editRow('门店简称', textInput('请输入门店简称', row.shortName)));
  body.appendChild(
    editRow(
      '门店合作类型',
      selectInput(
        [
          { value: '加盟店', label: '加盟店' },
          { value: '合作店', label: '合作店' },
          { value: '同行店', label: '同行店' },
        ],
        row.partnerDivision,
      ),
    ),
  );
  body.appendChild(editRow('门店类型', textInput('请输入门店类型', row.storeType)));
  body.appendChild(editRow('配送仓库', textInput('请输入配送仓库', row.warehouse)));
  body.appendChild(editRow('省市区', textInput('请输入省市区', row.region)));
  body.appendChild(editRow('详细地址', textInput('请输入详细地址', row.address)));
}

function openAuditDetail(row) {
  closeAuditModals();
  const backdrop = el('div', 'erp-modal-backdrop');
  backdrop.dataset.auditCenterModal = '1';
  const modal = el('div', 'erp-modal erp-modal--store-wide');
  const header = el('div', 'erp-modal__header');
  header.appendChild(el('h2', 'erp-modal__title', '门店注册审核详情'));
  const actions = el('div', 'erp-modal__header-actions');
  const close = el('button', 'erp-modal__header-btn');
  close.type = 'button';
  close.innerHTML = '<i class="ri-close-line"></i>';
  close.addEventListener('click', () => backdrop.remove());
  actions.appendChild(close);
  header.appendChild(actions);

  const body = el('div', 'erp-modal__body');
  appendRegistrationFields(body, row);
  body.appendChild(el('div', 'supplier-detail-section-title', '状态信息'));
  body.appendChild(detailRow('审核状态', row.auditStatus));
  body.appendChild(detailRow('MDM状态', row.mdmStatus));

  const footer = el('div', 'erp-modal__footer');
  const ok = button('关闭', 'primary');
  ok.addEventListener('click', () => backdrop.remove());
  footer.appendChild(ok);
  modal.appendChild(header);
  modal.appendChild(body);
  modal.appendChild(footer);
  backdrop.appendChild(modal);
  backdrop.addEventListener('click', (ev) => {
    if (ev.target === backdrop) backdrop.remove();
  });
  document.body.appendChild(backdrop);
}

function openAuditReview(row, onDone, startInEdit = false) {
  closeAuditModals();
  const backdrop = el('div', 'erp-modal-backdrop');
  backdrop.dataset.auditCenterModal = '1';
  const modal = el('div', 'erp-modal erp-modal--store-wide');
  const header = el('div', 'erp-modal__header');
  header.appendChild(el('h2', 'erp-modal__title', '审核门店注册申请'));
  const actions = el('div', 'erp-modal__header-actions');
  const close = el('button', 'erp-modal__header-btn');
  close.type = 'button';
  close.innerHTML = '<i class="ri-close-line"></i>';
  close.addEventListener('click', () => backdrop.remove());
  actions.appendChild(close);
  header.appendChild(actions);

  const body = el('div', 'erp-modal__body');
  const footer = el('div', 'erp-modal__footer');

  const renderReview = () => {
    body.replaceChildren();
    footer.replaceChildren();
    body.appendChild(detailRow('当前环节', row.auditStatus === '待审核' ? 'BD 审核' : 'BD 总监终审'));
    body.appendChild(detailRow('审核状态', row.auditStatus));
    appendRegistrationFields(body, row);

    const cancel = button('取消', 'default');
    cancel.addEventListener('click', () => backdrop.remove());
    footer.appendChild(cancel);

    if (row.auditStatus === '待审核') {
      const edit = button('编辑', 'default');
      edit.addEventListener('click', renderEdit);
      const reject = button('驳回', 'default');
      reject.addEventListener('click', () => {
        rejectAudit(row);
        backdrop.remove();
        onDone();
      });
      const approve = button('审核通过', 'primary');
      approve.addEventListener('click', () => {
        approveAudit(row);
        backdrop.remove();
        onDone();
      });
      footer.appendChild(edit);
      footer.appendChild(reject);
      footer.appendChild(approve);
    } else if (row.auditStatus === '待总监审核') {
      const reject = button('驳回', 'default');
      reject.addEventListener('click', () => {
        rejectAudit(row);
        backdrop.remove();
        onDone();
      });
      const approve = button('审核通过', 'primary');
      approve.addEventListener('click', () => {
        approveAudit(row);
        backdrop.remove();
        onDone();
      });
      footer.appendChild(reject);
      footer.appendChild(approve);
    }
  };

  const renderEdit = () => {
    body.replaceChildren();
    footer.replaceChildren();
    body.appendChild(detailRow('当前状态', '编辑资料'));
    appendEditableFields(body, row);

    const cancel = button('取消', 'default');
    cancel.addEventListener('click', () => {
      if (startInEdit && row.auditStatus === '审核失败') backdrop.remove();
      else renderReview();
    });
    const save = button('保存资料', 'default');
    save.addEventListener('click', () => {
      if (startInEdit && row.auditStatus === '审核失败') {
        backdrop.remove();
        onDone();
      } else {
        renderReview();
      }
    });
    const submit = button('保存并提交', 'primary');
    submit.addEventListener('click', () => {
      submitEditedAudit(row);
      backdrop.remove();
      onDone();
    });
    footer.appendChild(cancel);
    footer.appendChild(save);
    footer.appendChild(submit);
  };

  if (startInEdit) renderEdit();
  else renderReview();

  modal.appendChild(header);
  modal.appendChild(body);
  modal.appendChild(footer);
  backdrop.appendChild(modal);
  backdrop.addEventListener('click', (ev) => {
    if (ev.target === backdrop) backdrop.remove();
  });
  document.body.appendChild(backdrop);
}

function renderFlowCard() {
  const card = el('div', 'audit-flow');
  [
    ['发起申请', 'PC 创建门店'],
    ['生成统一申请单', '审核中心接收申请，状态为待总监审核'],
    ['BD 总监审核', '通过则进入 MDM，驳回则回写审核失败'],
    ['MDM 生效', '生成主体 Org、门店 Store，并建立 Org-Store 关系'],
  ].forEach(([title, desc], index) => {
    const step = el('div', 'audit-flow__step');
    step.appendChild(el('div', 'audit-flow__num', String(index + 1)));
    step.appendChild(el('div', 'audit-flow__title', title));
    step.appendChild(el('div', 'audit-flow__desc', desc));
    card.appendChild(step);
  });
  return card;
}

function renderTable(host, rows) {
  empty(host);
  const wrap = el('div', 'erp-table-scroll');
  const table = el('table', 'erp-table');
  const thead = el('thead');
  const trh = el('tr');
  HEADERS.forEach((h) => trh.appendChild(el('th', '', h)));
  thead.appendChild(trh);
  const tbody = el('tbody');

  rows.forEach((row, idx) => {
    const tr = el('tr');
    if (idx % 2 === 1) tr.classList.add('erp-table__row--alt');
    [
      row.id,
      row.source,
      row.subjectName,
      row.storeName,
      row.bd,
      row.contact,
      row.phone,
      statusTag(row.auditStatus),
      statusTag(row.mdmStatus),
      row.submittedAt,
    ].forEach((cell) => {
      const td = el('td', '');
      if (cell instanceof Node) td.appendChild(cell);
      else td.textContent = cell;
      tr.appendChild(td);
    });

    const tdOp = el('td', '');
    const op = el('span', 'erp-actions-cell');
    const detail = el('a', 'erp-link', '详情');
    detail.href = '#';
    detail.addEventListener('click', (e) => {
      e.preventDefault();
      openAuditDetail(row);
    });
    op.appendChild(detail);

    if (row.auditStatus === '待审核' || row.auditStatus === '待总监审核') {
      op.appendChild(document.createTextNode('\u3000'));
      const audit = el('a', 'erp-link', '审核');
      audit.href = '#';
      audit.addEventListener('click', (e) => {
        e.preventDefault();
        openAuditReview(row, () => renderTable(host, rows));
      });
      op.appendChild(audit);
    } else if (row.auditStatus === '审核失败') {
      op.appendChild(document.createTextNode('\u3000'));
      const edit = el('a', 'erp-link', '编辑');
      edit.href = '#';
      edit.addEventListener('click', (e) => {
        e.preventDefault();
        openAuditReview(row, () => renderTable(host, rows), true);
      });
      op.appendChild(edit);
    }
    tdOp.appendChild(op);
    tr.appendChild(tdOp);
    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  wrap.appendChild(table);
  host.appendChild(wrap);
}

export function render(container) {
  closeAuditModals();
  empty(container);
  const root = el('div', 'erp-page');
  const card = el('div', 'erp-page__card');
  const head = el('div', 'erp-page__head');
  head.appendChild(breadcrumb(['审核中心', '门店审核', '门店注册审核']));

  const toolbar = el('div', 'erp-toolbar');
  toolbar.appendChild(fieldRow('主体名称', textInput('请输入主体名称')));
  toolbar.appendChild(fieldRow('门店名称', textInput('请输入门店名称')));
  toolbar.appendChild(
    fieldRow(
      '审核状态',
      selectInput(
        [
          { value: '', label: '全部' },
          { value: 'pending', label: '待审核' },
          { value: 'leaderPending', label: '待总监审核' },
          { value: 'success', label: '审核成功' },
          { value: 'failed', label: '审核失败' },
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
  card.appendChild(renderFlowCard());

  const tableHost = el('div');
  renderTable(tableHost, auditRows);
  card.appendChild(tableHost);
  card.appendChild(paginationBar({ total: auditRows.length, page: 1, pageSize: 20 }));

  root.appendChild(card);
  container.appendChild(root);
}
