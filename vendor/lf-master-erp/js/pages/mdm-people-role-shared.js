/**
 * 人员中心 — 司机 / 主播等角色列表（与 BD 列表对齐：筛选、姓名进详情抽屉、可提现手机号、状态切换）
 */
import { empty, el } from '../utils/dom.js';
import {
  fieldRow,
  textInput,
  selectInput,
  button,
  paginationBar,
  breadcrumb,
  dataTable,
} from '../utils/erp-ui.js';
import {
  renderWithdrawPhoneTableCell,
  removeWithdrawPhoneModals,
  maskWithdrawPhone,
} from '../utils/withdraw-phone-modal.js';

export function removePeopleRoleUi() {
  removeWithdrawPhoneModals();
  document.querySelectorAll('[data-people-role-ui]').forEach((n) => n.remove());
}

function sfModalLabel(text, required) {
  const lab = el('label', 'erp-modal-field__label');
  if (required) lab.appendChild(el('span', 'erp-req', '*'));
  lab.appendChild(document.createTextNode(text));
  return lab;
}

/**
 * @param {string[]} labels
 */
function drawerSummaryBar(labels) {
  const sum = el('div', 'store-summary-bar');
  labels.forEach((t) => sum.appendChild(el('span', '', t)));
  return sum;
}

/**
 * @param {Array<[string, HTMLElement]>} fields
 */
function drawerFilterToolbar(fields) {
  const tb = el('div', 'erp-toolbar member-drawer-filter-toolbar');
  fields.forEach(([lab, ctrl]) => tb.appendChild(fieldRow(lab, ctrl)));
  const ta = el('div', 'erp-toolbar__actions');
  const br = button('重置', 'default');
  br.classList.add('erp-btn--outline-primary');
  ta.appendChild(br);
  ta.appendChild(button('查询', 'primary'));
  tb.appendChild(ta);
  return tb;
}

/**
 * @param {Record<string, unknown>} rec
 * @param {{
 *   detailTitle: string,
 *   metaLine: (r: Record<string, unknown>) => string,
 *   tabLabels: string[],
 *   baseFields: (r: Record<string, unknown>) => [string, unknown][],
 *   detailRoleKind: 'driver'|'anchor',
 * }} cfg
 */
function openPeopleRoleDetailDrawer(rec, cfg) {
  const kind = cfg.detailRoleKind;
  const tabLabels = cfg.tabLabels;
  removePeopleRoleUi();

  const backdrop = el('div', 'store-drawer-backdrop');
  backdrop.setAttribute('data-people-role-ui', '1');

  const drawer = el('aside', 'store-drawer store-drawer--bd-wide');
  drawer.setAttribute('data-people-role-ui', '1');

  const shut = () => {
    backdrop.remove();
    drawer.remove();
  };

  const header = el('div', 'store-drawer__header');
  header.appendChild(el('h2', 'store-drawer__title', cfg.detailTitle));
  const btnClose = el('button', 'store-drawer__close');
  btnClose.type = 'button';
  btnClose.innerHTML = '&times;';
  btnClose.addEventListener('click', shut);
  header.appendChild(btnClose);

  const hero = el('div', 'store-drawer__hero');
  const nameRow = el('div', 'store-drawer__name-row');
  nameRow.appendChild(el('span', 'store-drawer__name', String(rec.name ?? '—')));
  hero.appendChild(nameRow);
  hero.appendChild(el('div', 'store-drawer__meta', cfg.metaLine(rec)));

  const tabsWrap = el('div', 'store-drawer__tabs');

  const bodyHost = el('div', 'store-drawer__body');

  function detailCell(label, value) {
    const c = el('div', 'supplier-detail-cell');
    c.appendChild(el('div', 'supplier-detail-cell__label', label));
    const body = el('div', 'supplier-detail-cell__body');
    body.textContent = value != null && value !== '' ? String(value) : '—';
    c.appendChild(body);
    return c;
  }

  function panelBase() {
    const root = el('div', 'member-drawer-panel');
    root.appendChild(el('div', 'supplier-detail-section-title', '基础信息'));
    const grid = el('div', 'supplier-detail-grid');
    cfg.baseFields(rec).forEach(([k, v]) => {
      grid.appendChild(detailCell(k, v));
    });
    root.appendChild(grid);

    if (kind === 'driver') {
      root.appendChild(el('div', 'supplier-detail-section-title', '绑定车辆'));
      const vg = el('div', 'supplier-detail-grid');
      [
        ['车牌号', rec.vehiclePlate],
        ['车型', rec.vehicleModel],
        ['核定载重', rec.vehicleRatedLoad],
        ['交强险到期', rec.vehicleCompulsoryDue],
        ['商业险到期', rec.vehicleCommercialDue],
        ['行驶证年检到期', rec.vehicleInspectionDue],
        ['道路运输证号', rec.roadTransportPermitNo],
        ['车辆运营状态', rec.vehicleOperatingStatusLabel],
      ].forEach(([k, v]) => vg.appendChild(detailCell(k, v)));
      root.appendChild(vg);

      root.appendChild(el('div', 'supplier-detail-section-title', '证件信息'));
      const docs = Array.isArray(rec.driverDocuments) ? rec.driverDocuments : [];
      const docRows = docs.map((d) => [
        d.docType,
        d.docNo,
        d.issuer,
        d.validTo,
        d.filingStatus,
      ]);
      if (!docRows.length) {
        docRows.push(['—', '—', '—', '—', '请在「新增/编辑司机」中提交证件信息']);
      }
      root.appendChild(
        dataTable(['证件类型', '证件号码', '发证机关', '有效期至', '备案状态'], docRows),
      );
    }

    return root;
  }

  const nm = String(rec.name ?? '—');
  const rid = String(rec.id ?? '—');

  /** 司机 — 运输记录（城配运单） */
  function panelDriverShipments() {
    const root = el('div', 'member-drawer-panel');
    root.appendChild(el('div', 'supplier-detail-section-title', tabLabels[1]));
    root.appendChild(
      drawerSummaryBar([
        `关联司机：${nm}（${rid}）`,
        '本月完成运单：42',
        '准时签收率：96.2%',
        '在途异常：1',
      ]),
    );
    root.appendChild(
      drawerFilterToolbar([
        ['运单号', textInput('请输入运单号')],
        [
          '运单状态',
          selectInput(
            [
              { value: '', label: '全部' },
              { value: '1', label: '已派车' },
              { value: '2', label: '运输中' },
              { value: '3', label: '已签收' },
              { value: '4', label: '异常' },
            ],
            '',
          ),
        ],
        ['计划发车日期', textInput('YYYY-MM-DD — YYYY-MM-DD')],
      ]),
    );
    root.appendChild(
      dataTable(
        [
          '运单号',
          '线路',
          '始发站点',
          '目的站点',
          '计划发车',
          '签收时间',
          '状态',
          '里程(km)',
          '应付运费',
        ],
        [
          [
            'YD-202604240001',
            '沪保税仓 → 浦东张江站',
            '沪保税DC',
            '张江前置仓',
            '2026-04-24 06:10',
            '2026-04-24 09:05',
            '已签收',
            '38',
            '¥420.00',
          ],
          [
            'YD-202604230088',
            '昆山集散 → 沪南路店',
            '昆山集散',
            '沪南路店',
            '2026-04-23 14:00',
            '—',
            '运输中',
            '62',
            '¥680.00',
          ],
        ],
      ),
    );
    root.appendChild(paginationBar({ total: 42, page: 1, pageSize: 10 }));
    return root;
  }

  /** 司机 — 结算信息 */
  function panelDriverSettlement() {
    const root = el('div', 'member-drawer-panel');
    root.appendChild(el('div', 'supplier-detail-section-title', tabLabels[2]));
    root.appendChild(
      drawerSummaryBar([
        '结算周期：按周（每周五关账）',
        '当前账期应付：¥12,860.00',
        '待申诉扣罚：¥120.00',
      ]),
    );
    root.appendChild(
      drawerFilterToolbar([
        ['结算批次号', textInput('请输入批次号')],
        [
          '结算状态',
          selectInput(
            [
              { value: '', label: '全部' },
              { value: '1', label: '待核对' },
              { value: '2', label: '待付款' },
              { value: '3', label: '已付款' },
            ],
            '',
          ),
        ],
      ]),
    );
    root.appendChild(
      dataTable(
        [
          '结算批次号',
          '账期',
          '应付运费',
          '异常扣罚',
          '补贴',
          '实发金额',
          '结算状态',
          '付款日期',
        ],
        [
          [
            'JS-DV-202604-W03',
            '2026-04-14 ~ 2026-04-20',
            '¥18,200.00',
            '-¥120.00',
            '¥200.00',
            '¥18,280.00',
            '已付款',
            '2026-04-22',
          ],
          [
            'JS-DV-202604-W02',
            '2026-04-07 ~ 2026-04-13',
            '¥15,640.00',
            '¥0.00',
            '¥0.00',
            '¥15,640.00',
            '已付款',
            '2026-04-15',
          ],
        ],
      ),
    );
    root.appendChild(paginationBar({ total: 18, page: 1, pageSize: 10 }));
    return root;
  }

  /** 主播 — 直播场次 */
  function panelAnchorSessions() {
    const root = el('div', 'member-drawer-panel');
    root.appendChild(el('div', 'supplier-detail-section-title', tabLabels[1]));
    root.appendChild(
      drawerSummaryBar([
        `主播：${nm}（${rid}）`,
        '近30日开播场次：24',
        '场均 GMV：¥86,200',
        '场均观看：12.6万',
      ]),
    );
    root.appendChild(
      drawerFilterToolbar([
        ['关联直播间', textInput('请输入直播间名称')],
        [
          '开播渠道',
          selectInput(
            [
              { value: '', label: '全部' },
              { value: 'dy', label: '抖音' },
              { value: 'wx', label: '视频号' },
              { value: 'ks', label: '快手' },
            ],
            '',
          ),
        ],
        ['开播日期', textInput('YYYY-MM-DD — YYYY-MM-DD')],
      ]),
    );
    root.appendChild(
      dataTable(
        [
          '场次编号',
          '直播间',
          '开播时间',
          '时长(分)',
          '渠道',
          '带货 GMV',
          '成交订单',
          '场均观看',
          '场次状态',
        ],
        [
          [
            'LC-20260424210001',
            '品牌日播间-A',
            '2026-04-24 19:30',
            '185',
            '抖音',
            '¥268,000',
            '1,024',
            '18.2万',
            '已下播',
          ],
          [
            'LC-20260423203002',
            '品牌日播间-A',
            '2026-04-23 20:00',
            '160',
            '抖音',
            '¥182,400',
            '756',
            '11.0万',
            '已下播',
          ],
        ],
      ),
    );
    root.appendChild(paginationBar({ total: 24, page: 1, pageSize: 10 }));
    return root;
  }

  /** 主播 — 合约与排期 */
  function panelAnchorContractSchedule() {
    const root = el('div', 'member-drawer-panel');
    root.appendChild(el('div', 'supplier-detail-section-title', tabLabels[2]));
    root.appendChild(el('div', 'supplier-detail-section-title', '合约信息'));
    root.appendChild(
      dataTable(
        [
          '合约编号',
          '合约类型',
          '签约主体（甲方）',
          '生效日期',
          '到期日期',
          '计费方式',
          '合约状态',
        ],
        [
          [
            'CTR-ANC-2026-001',
            '达人带货独家（季度）',
            '上海冷丰科技有限公司',
            '2026-04-01',
            '2026-06-30',
            '底薪 + GMV 阶梯提成',
            '履行中',
          ],
        ],
      ),
    );
    root.appendChild(el('div', 'supplier-detail-section-title', '近期排期'));
    root.appendChild(
      dataTable(
        ['排期日期', '时段', '直播主题', '关联直播间', '运营确认', '主播确认'],
        [
          ['2026-04-26', '19:30-22:00', '会员日宠粉专场', '品牌日播间-A', '已确认', '已确认'],
          ['2026-04-28', '10:00-12:00', '工厂溯源预热', '工厂溯源专场', '已确认', '待确认'],
        ],
      ),
    );
    root.appendChild(paginationBar({ total: 8, page: 1, pageSize: 10 }));
    return root;
  }

  /** 主播 — 结算信息 */
  function panelAnchorSettlement() {
    const root = el('div', 'member-drawer-panel');
    root.appendChild(el('div', 'supplier-detail-section-title', tabLabels[3]));
    root.appendChild(
      drawerSummaryBar([
        '结算周期：自然月',
        '本期应结（税前）：¥42,600.00',
        '代扣个税（演示）：¥3,180.00',
      ]),
    );
    root.appendChild(
      drawerFilterToolbar([
        ['结算单号', textInput('请输入结算单号')],
        [
          '发放状态',
          selectInput(
            [
              { value: '', label: '全部' },
              { value: '1', label: '待审核' },
              { value: '2', label: '待发放' },
              { value: '3', label: '已发放' },
            ],
            '',
          ),
        ],
      ]),
    );
    root.appendChild(
      dataTable(
        [
          '结算单号',
          '结算周期',
          '底薪/保障',
          '场次提成',
          'GMV 分成',
          '奖惩调整',
          '应结金额',
          '个税代缴',
          '实发金额',
          '发放状态',
        ],
        [
          [
            'JS-ANC-202604',
            '2026-04',
            '¥8,000.00',
            '¥16,200.00',
            '¥18,400.00',
            '-¥0.00',
            '¥42,600.00',
            '¥3,180.00',
            '¥39,420.00',
            '待发放',
          ],
        ],
      ),
    );
    root.appendChild(paginationBar({ total: 6, page: 1, pageSize: 10 }));
    return root;
  }

  const tabIds =
    kind === 'driver'
      ? ['base', 'transport', 'settle']
      : ['base', 'sessions', 'contract', 'settle'];

  const panels =
    kind === 'driver'
      ? {
          base: panelBase(),
          transport: panelDriverShipments(),
          settle: panelDriverSettlement(),
        }
      : {
          base: panelBase(),
          sessions: panelAnchorSessions(),
          contract: panelAnchorContractSchedule(),
          settle: panelAnchorSettlement(),
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

  showTab('base');

  backdrop.addEventListener('click', shut);
  drawer.addEventListener('click', (e) => e.stopPropagation());

  document.body.appendChild(backdrop);
  document.body.appendChild(drawer);
}

/**
 * @param {'add'|'edit'} mode
 * @param {Record<string, unknown>} record
 * @param {{
 *   roleLabel: string,
 *   idLabel: string,
 *   deptLabel: string,
 *   deptOptions: Array<{ value: string, label: string }>,
 *   onSaved?: () => void,
 *   onCreate?: (p: Record<string, unknown>) => void,
 *   detailRoleKind?: 'driver'|'anchor',
 * }} cfg
 */
function openRoleFormModal(mode, record, cfg) {
  removePeopleRoleUi();
  const isEdit = mode === 'edit';

  const backdrop = el('div', 'erp-modal-backdrop');
  backdrop.setAttribute('data-people-role-ui', '1');

  const modal = el('div', 'erp-modal erp-modal--withdraw-phone');

  const header = el('div', 'erp-modal__header');
  header.appendChild(
    el('h2', 'erp-modal__title', isEdit ? `编辑${cfg.roleLabel}` : `新增${cfg.roleLabel}`),
  );
  const ha = el('div', 'erp-modal__header-actions');
  const bx = el('button', 'erp-modal__header-btn');
  bx.type = 'button';
  bx.innerHTML = '<i class="ri-close-line"></i>';
  bx.addEventListener('click', () => backdrop.remove());
  ha.appendChild(bx);
  header.appendChild(ha);

  const body = el('div', 'erp-modal__body');

  function rowField(label, required, control) {
    const row = el('div', 'erp-modal-field');
    row.appendChild(sfModalLabel(label, required));
    const c = el('div', 'erp-modal-field__control');
    c.appendChild(control);
    row.appendChild(c);
    body.appendChild(row);
  }

  const nameInp = textInput(
    `请输入姓名`,
    isEdit && record ? String(record.name || '') : '',
  );
  rowField('姓名', true, nameInp);

  const phoneRow = el('div', 'erp-modal-field');
  phoneRow.appendChild(sfModalLabel('手机号码', true));
  const phoneCtrl = el('div', 'erp-modal-field__control');
  const phWrap = el('div', 'erp-modal-phone-row');
  const rawPhone =
    isEdit && record && record.phoneRaw ? String(record.phoneRaw).replace(/\D/g, '') : '';
  const phoneInp = textInput('请输入11位手机号码', rawPhone);
  phoneInp.setAttribute('inputmode', 'numeric');
  phoneInp.setAttribute('maxlength', '11');
  const smsBtn = button('获取验证码', 'primary');
  smsBtn.classList.add('erp-btn--sms');
  let smsLeft = 0;
  let smsTimer = 0;
  smsBtn.addEventListener('click', () => {
    const d = phoneInp.value.replace(/\D/g, '');
    if (d.length !== 11) return;
    if (smsLeft > 0) return;
    smsLeft = 60;
    smsBtn.disabled = true;
    smsBtn.textContent = `${smsLeft}s`;
    smsTimer = window.setInterval(() => {
      smsLeft -= 1;
      if (smsLeft <= 0) {
        window.clearInterval(smsTimer);
        smsTimer = 0;
        smsBtn.disabled = false;
        smsBtn.textContent = '获取验证码';
      } else {
        smsBtn.textContent = `${smsLeft}s`;
      }
    }, 1000);
  });
  phWrap.appendChild(phoneInp);
  phWrap.appendChild(smsBtn);
  phoneCtrl.appendChild(phWrap);
  phoneRow.appendChild(phoneCtrl);
  body.appendChild(phoneRow);

  const codeInp = textInput('请输入验证码', '');
  codeInp.setAttribute('maxlength', '8');
  rowField('验证码', true, codeInp);

  const deptSel = selectInput(
    [{ value: '', label: '请选择' }, ...cfg.deptOptions],
    isEdit && record && record.deptKey ? String(record.deptKey) : '',
  );
  rowField(cfg.deptLabel, true, deptSel);

  const jobSel = selectInput(
    [
      { value: '', label: '请选择' },
      { value: 'on', label: '在岗' },
      { value: 'off', label: '停用' },
    ],
    isEdit && record && record.jobStatusKey ? String(record.jobStatusKey) : '',
  );
  rowField('岗位状态', true, jobSel);

  /** @type {Record<string, HTMLInputElement | HTMLSelectElement> | null} */
  let driverInputs = null;

  if (cfg.detailRoleKind === 'driver') {
    driverInputs = {};
    body.appendChild(el('div', 'supplier-detail-section-title', '绑定车辆'));
    driverInputs.vehiclePlate = textInput(
      '请输入车牌号',
      isEdit && record ? String(record.vehiclePlate ?? '') : '',
    );
    rowField('车牌号', true, driverInputs.vehiclePlate);
    driverInputs.vehicleModel = textInput(
      '如：轻型厢式货车',
      isEdit && record ? String(record.vehicleModel ?? '') : '',
    );
    rowField('车型', true, driverInputs.vehicleModel);
    driverInputs.vehicleRatedLoad = textInput(
      '如：1.45 吨',
      isEdit && record ? String(record.vehicleRatedLoad ?? '') : '',
    );
    rowField('核定载重', false, driverInputs.vehicleRatedLoad);
    driverInputs.vehicleCompulsoryDue = textInput(
      'YYYY-MM-DD',
      isEdit && record ? String(record.vehicleCompulsoryDue ?? '') : '',
    );
    rowField('交强险到期', false, driverInputs.vehicleCompulsoryDue);
    driverInputs.vehicleCommercialDue = textInput(
      'YYYY-MM-DD',
      isEdit && record ? String(record.vehicleCommercialDue ?? '') : '',
    );
    rowField('商业险到期', false, driverInputs.vehicleCommercialDue);
    driverInputs.vehicleInspectionDue = textInput(
      'YYYY-MM-DD',
      isEdit && record ? String(record.vehicleInspectionDue ?? '') : '',
    );
    rowField('行驶证年检到期', false, driverInputs.vehicleInspectionDue);
    driverInputs.roadTransportPermitNo = textInput(
      '道路运输证号',
      isEdit && record ? String(record.roadTransportPermitNo ?? '') : '',
    );
    rowField('道路运输证号', false, driverInputs.roadTransportPermitNo);
    driverInputs.vehicleOperatingStatus = selectInput(
      [
        { value: 'normal', label: '正常' },
        { value: 'suspend', label: '停运' },
        { value: 'repair', label: '维修' },
      ],
      isEdit && record && record.vehicleOperatingStatusKey
        ? String(record.vehicleOperatingStatusKey)
        : 'normal',
    );
    rowField('车辆运营状态', true, driverInputs.vehicleOperatingStatus);

    body.appendChild(el('div', 'supplier-detail-section-title', '证件信息'));
    driverInputs.docDrivingLicenseNo = textInput(
      '行驶证档案编号',
      isEdit && record ? String(record.docDrivingLicenseNo ?? '') : '',
    );
    rowField('行驶证号', true, driverInputs.docDrivingLicenseNo);
    driverInputs.docDrivingLicenseValidTo = textInput(
      'YYYY-MM-DD 或填写「长期」',
      isEdit && record ? String(record.docDrivingLicenseValidTo ?? '') : '',
    );
    rowField('行驶证有效期至', false, driverInputs.docDrivingLicenseValidTo);
    driverInputs.docQualificationNo = textInput(
      '从业资格证号',
      isEdit && record ? String(record.docQualificationNo ?? '') : '',
    );
    rowField('道路运输从业资格证号', true, driverInputs.docQualificationNo);
    driverInputs.docQualificationExpiry = textInput(
      'YYYY-MM-DD',
      isEdit && record ? String(record.docQualificationExpiry ?? '') : '',
    );
    rowField('从业资格证有效期至', false, driverInputs.docQualificationExpiry);
    driverInputs.docCompulsoryPolicyNo = textInput(
      '交强险保单号',
      isEdit && record ? String(record.docCompulsoryPolicyNo ?? '') : '',
    );
    rowField('交强险保单号', false, driverInputs.docCompulsoryPolicyNo);
    driverInputs.docCompulsoryPolicyExpiry = textInput(
      'YYYY-MM-DD',
      isEdit && record ? String(record.docCompulsoryPolicyExpiry ?? '') : '',
    );
    rowField('交强险保单到期', false, driverInputs.docCompulsoryPolicyExpiry);
  }

  function buildDriverVehiclePayload(di) {
    const opSel = di.vehicleOperatingStatus;
    const opLabel =
      opSel.options[opSel.selectedIndex]?.textContent?.trim() || '—';
    const plate = di.vehiclePlate.value.trim();
    const model = di.vehicleModel.value.trim();
    const dlNo = di.docDrivingLicenseNo.value.trim();
    const qNo = di.docQualificationNo.value.trim();
    const driverDocuments = [
      {
        docType: '行驶证',
        docNo: dlNo,
        issuer: '上海市公安局交警总队',
        validTo: di.docDrivingLicenseValidTo.value.trim() || '—',
        filingStatus: '已备案',
      },
      {
        docType: '道路运输从业资格证',
        docNo: qNo,
        issuer: '上海市交通委',
        validTo: di.docQualificationExpiry.value.trim() || '—',
        filingStatus: '已备案',
      },
      {
        docType: '交强险保单',
        docNo: di.docCompulsoryPolicyNo.value.trim() || '—',
        issuer: '承保保险公司',
        validTo: di.docCompulsoryPolicyExpiry.value.trim() || '—',
        filingStatus: di.docCompulsoryPolicyNo.value.trim() ? '有效' : '待补充',
      },
    ];
    return {
      vehiclePlate: plate,
      vehicleModel: model,
      vehicleRatedLoad: di.vehicleRatedLoad.value.trim(),
      vehicleCompulsoryDue: di.vehicleCompulsoryDue.value.trim(),
      vehicleCommercialDue: di.vehicleCommercialDue.value.trim(),
      vehicleInspectionDue: di.vehicleInspectionDue.value.trim(),
      roadTransportPermitNo: di.roadTransportPermitNo.value.trim(),
      vehicleOperatingStatusKey: opSel.value,
      vehicleOperatingStatusLabel: opLabel,
      docDrivingLicenseNo: dlNo,
      docDrivingLicenseValidTo: di.docDrivingLicenseValidTo.value.trim(),
      docQualificationNo: qNo,
      docQualificationExpiry: di.docQualificationExpiry.value.trim(),
      docCompulsoryPolicyNo: di.docCompulsoryPolicyNo.value.trim(),
      docCompulsoryPolicyExpiry: di.docCompulsoryPolicyExpiry.value.trim(),
      driverDocuments,
    };
  }

  const footer = el('div', 'erp-modal__footer');
  const bCancel = button('取消', 'default');
  const bOk = button('确定', 'primary');
  bCancel.addEventListener('click', () => backdrop.remove());
  bOk.addEventListener('click', () => {
    const nm = nameInp.value.trim();
    const digits = phoneInp.value.replace(/\D/g, '');
    const code = codeInp.value.trim();
    if (!nm || digits.length !== 11 || !code) return;
    if (!deptSel.value || !jobSel.value) return;

    let driverExtra = {};
    if (cfg.detailRoleKind === 'driver' && driverInputs) {
      driverExtra = buildDriverVehiclePayload(driverInputs);
      if (
        !driverExtra.vehiclePlate ||
        !driverExtra.vehicleModel ||
        !driverExtra.docDrivingLicenseNo ||
        !driverExtra.docQualificationNo
      ) {
        return;
      }
    }

    const deptLabel =
      deptSel.options[deptSel.selectedIndex]?.textContent?.trim() || '—';
    const jobLabel =
      jobSel.options[jobSel.selectedIndex]?.textContent?.trim() || '—';

    if (isEdit && record) {
      record.name = nm;
      record.phoneRaw = digits;
      record.phone = maskWithdrawPhone(digits);
      record.deptKey = deptSel.value;
      record.deptLabel = deptLabel;
      record.jobStatusKey = jobSel.value;
      record.jobStatusLabel = jobLabel;
      Object.assign(record, driverExtra);
    } else if (cfg.onCreate) {
      cfg.onCreate({
        name: nm,
        phoneRaw: digits,
        phone: maskWithdrawPhone(digits),
        deptKey: deptSel.value,
        deptLabel,
        jobStatusKey: jobSel.value,
        jobStatusLabel: jobLabel,
        ...driverExtra,
      });
    }
    backdrop.remove();
    cfg.onSaved?.();
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
 * @param {{
 *   roleLabel: string,
 *   manageTitle: string,
 *   listTitle: string,
 *   idLabel: string,
 *   deptLabel: string,
 *   detailTitle: string,
 *   detailMeta: (r: Record<string, unknown>) => string,
 *   detailTabs: string[],
 *   detailRoleKind: 'driver'|'anchor',
 *   baseFields: (r: Record<string, unknown>) => [string, unknown][],
 *   deptOptions: Array<{ value: string, label: string }>,
 *   idPrefix: string,
 *   mock: Record<string, unknown>[],
 *   pageFootNote?: string,
 * }} cfg
 */
export function renderPeopleRolePage(container, cfg) {
  removePeopleRoleUi();
  empty(container);

  const rowsState = cfg.mock.map((r) => ({ ...r }));

  const HEADERS = [
    cfg.idLabel,
    '姓名',
    '手机号码',
    cfg.deptLabel,
    '岗位状态',
    '绑定组织',
    '可提现手机号',
    '最近更新',
    '状态',
    '操作',
  ];

  const root = el('div', 'erp-page');
  const card = el('div', 'erp-page__card');
  const head = el('div', 'erp-page__head');
  head.appendChild(breadcrumb(['基础数据中心', '人员中心', cfg.roleLabel]));

  const filterName = textInput(`请输入${cfg.roleLabel}姓名`);
  const filterPhone = textInput('请输入手机号码');
  const filterDept = selectInput([{ value: '', label: '全部' }, ...cfg.deptOptions], '');
  const filterJob = selectInput(
    [
      { value: '', label: '全部' },
      { value: 'on', label: '在岗' },
      { value: 'off', label: '停用' },
    ],
    '',
  );
  const filterEnabled = selectInput(
    [
      { value: '', label: '全部' },
      { value: 'on', label: '开启' },
      { value: 'off', label: '禁用' },
    ],
    '',
  );

  const toolbar = el('div', 'erp-toolbar');
  toolbar.appendChild(fieldRow('姓名', filterName));
  toolbar.appendChild(fieldRow('手机号码', filterPhone));
  toolbar.appendChild(fieldRow(cfg.deptLabel, filterDept));
  toolbar.appendChild(fieldRow('岗位状态', filterJob));
  toolbar.appendChild(fieldRow('状态', filterEnabled));
  const ta = el('div', 'erp-toolbar__actions');
  const btnReset = button('重置', 'default');
  const btnQuery = button('查询', 'primary');
  ta.appendChild(btnReset);
  ta.appendChild(btnQuery);
  toolbar.appendChild(ta);
  head.appendChild(toolbar);
  card.appendChild(head);

  const actions = el('div', 'erp-actions-row');
  const addBtn = button(`添加${cfg.roleLabel}`, 'primary');
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
  const colStatus = HEADERS.indexOf('状态');
  const colOp = HEADERS.indexOf('操作');

  const drawerCfg = {
    detailTitle: cfg.detailTitle,
    metaLine: cfg.detailMeta,
    tabLabels: cfg.detailTabs,
    baseFields: cfg.baseFields,
    detailRoleKind: cfg.detailRoleKind,
  };

  function filteredRows() {
    const qName = filterName.value.trim();
    const qPhone = filterPhone.value.replace(/\D/g, '');
    const qDept = filterDept.value;
    const qJob = filterJob.value;
    const qState = filterEnabled.value;

    return rowsState.filter((rec) => {
      if (qName && !String(rec.name).includes(qName)) return false;
      if (qPhone) {
        const masked = String(rec.phone);
        const raw = rec.phoneRaw ? String(rec.phoneRaw).replace(/\D/g, '') : '';
        if (!masked.includes(qPhone) && !raw.includes(qPhone)) return false;
      }
      if (qDept && rec.deptKey !== qDept) return false;
      if (qJob === 'on' && rec.jobStatusKey !== 'on') return false;
      if (qJob === 'off' && rec.jobStatusKey !== 'off') return false;
      if (qState === 'on' && !rec.enabled) return false;
      if (qState === 'off' && rec.enabled) return false;
      return true;
    });
  }

  function paintRows() {
    empty(tbody);
    filteredRows().forEach((rec, idx) => {
      const tr = el('tr');
      if (idx % 2 === 1) tr.classList.add('erp-table__row--alt');

      const cells = [
        rec.id,
        rec.name,
        rec.phone,
        rec.deptLabel,
        rec.jobStatusLabel,
        rec.org,
        '',
        rec.updateTime,
        '',
        '',
      ];

      cells.forEach((text, colIdx) => {
        const td = el('td', '');
        if (colIdx === colWithdrawPhone) {
          renderWithdrawPhoneTableCell(td, rec, { onMutated: paintRows });
        } else if (colIdx === colStatus) {
          td.classList.add('bd-promoter-status-cell');
          const toggle = el('div', 'bd-promoter-status-toggle');
          const labelOff = el(
            'span',
            `bd-promoter-status-toggle__side${rec.enabled ? '' : ' is-active'}`,
            '禁用',
          );
          const labelOn = el(
            'span',
            `bd-promoter-status-toggle__side${rec.enabled ? ' is-active' : ''}`,
            '开启',
          );
          toggle.appendChild(labelOff);
          toggle.appendChild(labelOn);
          toggle.title = '点击切换启用状态';
          toggle.addEventListener('click', () => {
            rec.enabled = !rec.enabled;
            paintRows();
          });
          td.appendChild(toggle);
        } else if (colIdx === 1) {
          const a = el('a', 'erp-link', String(rec.name));
          a.href = '#';
          a.addEventListener('click', (e) => {
            e.preventDefault();
            openPeopleRoleDetailDrawer(rec, drawerCfg);
          });
          td.appendChild(a);
        } else if (colIdx === colOp) {
          const span = el('span', 'erp-actions-cell');
          const a1 = el('a', 'erp-link', '查看详情');
          a1.href = '#';
          a1.addEventListener('click', (e) => {
            e.preventDefault();
            openPeopleRoleDetailDrawer(rec, drawerCfg);
          });
          span.appendChild(a1);
          span.appendChild(document.createTextNode('\u3000'));
          const a2 = el('a', 'erp-link', '编辑');
          a2.href = '#';
          a2.addEventListener('click', (e) => {
            e.preventDefault();
            openRoleFormModal('edit', rec, {
              roleLabel: cfg.roleLabel,
              idLabel: cfg.idLabel,
              deptLabel: cfg.deptLabel,
              deptOptions: cfg.deptOptions,
              detailRoleKind: cfg.detailRoleKind,
              onSaved: paintRows,
            });
          });
          span.appendChild(a2);
          td.appendChild(span);
        } else {
          td.textContent = text != null && text !== '' ? String(text) : '—';
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  addBtn.addEventListener('click', () => {
    openRoleFormModal('add', {}, {
      roleLabel: cfg.roleLabel,
      idLabel: cfg.idLabel,
      deptLabel: cfg.deptLabel,
      deptOptions: cfg.deptOptions,
      detailRoleKind: cfg.detailRoleKind,
      onCreate: (payload) => {
        const id = `${cfg.idPrefix}-${String(Date.now()).slice(-6)}`;
        rowsState.unshift({
          ...payload,
          id,
          org: '上海冷丰科技有限公司',
          withdrawPhone: '—',
          withdrawPhoneRaw: '',
          updateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
          enabled: true,
        });
      },
      onSaved: paintRows,
    });
  });

  btnReset.addEventListener('click', () => {
    filterName.value = '';
    filterPhone.value = '';
    filterDept.value = '';
    filterJob.value = '';
    filterEnabled.value = '';
    paintRows();
  });
  btnQuery.addEventListener('click', () => paintRows());

  paintRows();

  table.appendChild(thead);
  table.appendChild(tbody);
  wrap.appendChild(table);
  card.appendChild(wrap);
  card.appendChild(paginationBar({ total: rowsState.length + 40, page: 1, pageSize: 20 }));

  const noteText =
    cfg.pageFootNote ??
    (cfg.detailRoleKind === 'driver'
      ? '说明：筛选与列表字段一致；可提现手机号与资源中心档案字段口径一致。司机绑定车辆及证件在「新增/编辑司机」表单中提交并写入主数据，详情抽屉「基础信息」合并展示；运输记录、结算信息为关联业务明细。'
      : '说明：筛选与列表字段一致；可提现手机号与资源中心档案字段口径一致；详情抽屉各 Tab 为 MDM 主数据关联的业务明细。');
  const note = el('p', 'erp-page__note', noteText);
  root.appendChild(card);
  root.appendChild(note);
  container.appendChild(root);
}
