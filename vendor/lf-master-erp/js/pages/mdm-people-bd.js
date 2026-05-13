/**
 * 人员中心 — BD推广员列表（筛选 / 表格 / 添加编辑 / 可提现手机号与资源档案一致）
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
  renderWithdrawPhoneTableCell,
  removeWithdrawPhoneModals,
  maskWithdrawPhone,
} from '../utils/withdraw-phone-modal.js';
import { openBdDetailDrawer, removeBdDetailDrawer } from '../utils/bd-detail-drawer.js';

function removeBdPromoterUi() {
  removeWithdrawPhoneModals();
  removeBdDetailDrawer();
  document.querySelectorAll('[data-bd-promoter-ui]').forEach((n) => n.remove());
}

function sfModalLabel(text, required) {
  const lab = el('label', 'erp-modal-field__label');
  if (required) lab.appendChild(el('span', 'erp-req', '*'));
  lab.appendChild(document.createTextNode(text));
  return lab;
}

function bdCategorySelect(val = '') {
  return selectInput(
    [
      { value: '', label: '请选择' },
      { value: 'l1', label: '一级BD' },
      { value: 'l2', label: '二级BD' },
      { value: 'channel', label: '渠道BD' },
    ],
    val,
  );
}

function bdIdentitySelect(val = '') {
  return selectInput(
    [
      { value: '', label: '请选择' },
      { value: 'formal', label: '正式' },
      { value: 'probation', label: '试用' },
      { value: 'partner', label: '合作' },
    ],
    val,
  );
}

function bdSuperiorSelect(val = '') {
  return selectInput(
    [
      { value: '', label: '请选择' },
      { value: '1', label: '李总监' },
      { value: '2', label: '王经理' },
      { value: '3', label: '无上级' },
    ],
    val,
  );
}

/**
 * @param {'add'|'edit'} mode
 * @param {Record<string, unknown>} [record]
 * @param {{
 *   onSaved?: () => void,
 *   onCreate?: (p: Record<string, unknown>) => void,
 * }} [hooks]
 */
function openBdFormModal(mode, record, hooks = {}) {
  removeBdPromoterUi();
  const isEdit = mode === 'edit';

  const backdrop = el('div', 'erp-modal-backdrop');
  backdrop.setAttribute('data-bd-promoter-ui', '1');

  const modal = el('div', 'erp-modal erp-modal--withdraw-phone');

  const header = el('div', 'erp-modal__header');
  header.appendChild(el('h2', 'erp-modal__title', isEdit ? '编辑BD推广员' : '添加BD推广员'));
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
    '请输入BD姓名',
    isEdit && record ? String(record.name || '') : '',
  );
  rowField('BD姓名', true, nameInp);

  const phoneRow = el('div', 'erp-modal-field');
  phoneRow.appendChild(sfModalLabel('手机号码', true));
  const phoneCtrl = el('div', 'erp-modal-field__control');
  const phWrap = el('div', 'erp-modal-phone-row');
  const rawPhone =
    isEdit && record && record.phoneRaw ? String(record.phoneRaw).replace(/\D/g, '') : '';
  const phoneInp = textInput('请输入手机号码', rawPhone);
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

  const catSel = bdCategorySelect(
    isEdit && record && record.categoryKey ? String(record.categoryKey) : '',
  );
  rowField('BD分类', true, catSel);

  const idSel = bdIdentitySelect(
    isEdit && record && record.identityKey ? String(record.identityKey) : '',
  );
  rowField('BD身份', true, idSel);

  const supSel = bdSuperiorSelect(
    isEdit && record && record.superiorKey ? String(record.superiorKey) : '',
  );
  rowField('BD上级', true, supSel);

  const footer = el('div', 'erp-modal__footer');
  const bCancel = button('取消', 'default');
  const bOk = button('确定', 'primary');
  bCancel.addEventListener('click', () => backdrop.remove());
  bOk.addEventListener('click', () => {
    const nm = nameInp.value.trim();
    const digits = phoneInp.value.replace(/\D/g, '');
    const code = codeInp.value.trim();
    if (!nm || digits.length !== 11 || !code) return;
    if (!catSel.value || !idSel.value || !supSel.value) return;

    const categoryLabel =
      catSel.options[catSel.selectedIndex]?.textContent?.trim() || '—';
    const identityLabel =
      idSel.options[idSel.selectedIndex]?.textContent?.trim() || '—';
    const superiorLabel =
      supSel.options[supSel.selectedIndex]?.textContent?.trim() || '—';

    if (isEdit && record) {
      record.name = nm;
      record.phoneRaw = digits;
      record.phone = maskWithdrawPhone(digits);
      record.categoryKey = catSel.value;
      record.identityKey = idSel.value;
      record.superiorKey = supSel.value;
      record.categoryLabel = categoryLabel;
      record.identityLabel = identityLabel;
      record.superiorLabel = superiorLabel;
    } else if (hooks.onCreate) {
      hooks.onCreate({
        name: nm,
        phoneRaw: digits,
        phone: maskWithdrawPhone(digits),
        categoryKey: catSel.value,
        categoryLabel,
        identityKey: idSel.value,
        identityLabel,
        superiorKey: supSel.value,
        superiorLabel,
      });
    }
    backdrop.remove();
    hooks.onSaved?.();
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

const HEADERS = [
  'BD推广员ID',
  'BD姓名',
  '手机号码',
  'BD分类',
  'BD身份',
  'BD上级',
  '推广门店数量',
  '总分佣金额',
  '总提现金额',
  '结算信息',
  '可提现手机号',
  '创建时间',
  '状态',
  '操作',
];

const MOCK_TEMPLATE = [
  {
    id: 'BD-PROMO-883001',
    name: '张伟',
    phone: '186****9001',
    phoneRaw: '18690019001',
    categoryKey: 'l1',
    categoryLabel: '一级BD',
    identityKey: 'formal',
    identityLabel: '正式',
    superiorKey: '1',
    superiorLabel: '李总监',
    storeCount: '28',
    totalCommission: '¥128,600.00',
    totalWithdraw: '¥96,200.00',
    withdrawPhone: '138****2211',
    withdrawPhoneRaw: '13822112211',
    createTime: '2026-04-24 10:22:11',
    enabled: true,
  },
  {
    id: 'BD-PROMO-883002',
    name: '刘芳',
    phone: '159****7788',
    phoneRaw: '15977881234',
    categoryKey: 'l2',
    categoryLabel: '二级BD',
    identityKey: 'probation',
    identityLabel: '试用',
    superiorKey: '2',
    superiorLabel: '王经理',
    storeCount: '12',
    totalCommission: '¥42,300.00',
    totalWithdraw: '¥18,000.00',
    withdrawPhone: '—',
    withdrawPhoneRaw: '',
    createTime: '2026-04-23 16:30:22',
    enabled: true,
  },
  {
    id: 'BD-PROMO-883003',
    name: '陈浩',
    phone: '137****0098',
    phoneRaw: '13700980098',
    categoryKey: 'channel',
    categoryLabel: '渠道BD',
    identityKey: 'partner',
    identityLabel: '合作',
    superiorKey: '3',
    superiorLabel: '无上级',
    storeCount: '6',
    totalCommission: '¥9,800.00',
    totalWithdraw: '¥2,400.00',
    withdrawPhone: '137****0098',
    withdrawPhoneRaw: '13700980098',
    createTime: '2026-04-20 09:15:40',
    enabled: false,
  },
];

/**
 * @param {HTMLElement} container
 */
export function render(container) {
  removeBdPromoterUi();
  empty(container);

  const rowsState = MOCK_TEMPLATE.map((r) => ({ ...r }));

  const root = el('div', 'erp-page');
  const card = el('div', 'erp-page__card');
  const head = el('div', 'erp-page__head');
  head.appendChild(breadcrumb(['基础数据中心', '人员中心', 'BD']));

  const filterName = textInput('请输入BD姓名');
  const filterPhone = textInput('请输入手机号码');
  const filterCategory = selectInput(
    [
      { value: '', label: '全部' },
      { value: 'l1', label: '一级BD' },
      { value: 'l2', label: '二级BD' },
      { value: 'channel', label: '渠道BD' },
    ],
    '',
  );
  const filterIdentity = selectInput(
    [
      { value: '', label: '全部' },
      { value: 'formal', label: '正式' },
      { value: 'probation', label: '试用' },
      { value: 'partner', label: '合作' },
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
  toolbar.appendChild(fieldRow('BD姓名', filterName));
  toolbar.appendChild(fieldRow('手机号码', filterPhone));
  toolbar.appendChild(fieldRow('BD分类', filterCategory));
  toolbar.appendChild(fieldRow('BD身份', filterIdentity));
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
  const addBtn = button('添加BD推广员', 'primary');
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
  const colSettle = HEADERS.indexOf('结算信息');

  function filteredRows() {
    const qName = filterName.value.trim();
    const qPhone = filterPhone.value.replace(/\D/g, '');
    const qCat = filterCategory.value;
    const qIden = filterIdentity.value;
    const qState = filterEnabled.value;

    return rowsState.filter((rec) => {
      if (qName && !String(rec.name).includes(qName)) return false;
      if (qPhone) {
        const masked = String(rec.phone);
        const raw = rec.phoneRaw ? String(rec.phoneRaw).replace(/\D/g, '') : '';
        if (!masked.includes(qPhone) && !raw.includes(qPhone)) return false;
      }
      if (qCat && rec.categoryKey !== qCat) return false;
      if (qIden && rec.identityKey !== qIden) return false;
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
        rec.categoryLabel,
        rec.identityLabel,
        rec.superiorLabel,
        rec.storeCount,
        rec.totalCommission,
        rec.totalWithdraw,
        '',
        '',
        rec.createTime,
        '',
        '',
      ];

      cells.forEach((text, colIdx) => {
        const td = el('td', '');
        if (colIdx === colSettle) {
          const a = el('a', 'erp-link', '查看信息');
          a.href = '#';
          a.addEventListener('click', (e) => {
            e.preventDefault();
            removeBdPromoterUi();
            const tip = el('div', 'erp-modal-backdrop');
            tip.setAttribute('data-bd-promoter-ui', '1');
            const m = el('div', 'erp-modal erp-modal--confirm');
            const mh = el('div', 'erp-modal__header');
            mh.appendChild(el('h2', 'erp-modal__title', '结算信息'));
            const mx = el('button', 'erp-modal__header-btn');
            mx.type = 'button';
            mx.innerHTML = '<i class="ri-close-line"></i>';
            mx.addEventListener('click', () => tip.remove());
            const mha = el('div', 'erp-modal__header-actions');
            mha.appendChild(mx);
            mh.appendChild(mha);
            const mb = el('div', 'erp-modal__body');
            mb.appendChild(
              el(
                'p',
                'erp-page__note',
                `${rec.name}：结算周期 T+1；开户行演示支行；账户名与 BD 实名一致（原型）。`,
              ),
            );
            const mf = el('div', 'erp-modal__footer');
            const ok = button('知道了', 'primary');
            ok.addEventListener('click', () => tip.remove());
            mf.appendChild(ok);
            m.appendChild(mh);
            m.appendChild(mb);
            m.appendChild(mf);
            tip.appendChild(m);
            tip.addEventListener('click', (ev) => {
              if (ev.target === tip) tip.remove();
            });
            document.body.appendChild(tip);
          });
          td.appendChild(a);
        } else if (colIdx === colWithdrawPhone) {
          renderWithdrawPhoneTableCell(td, rec, { onMutated: paintRows });
        } else if (colIdx === colStatus) {
          td.classList.add('bd-promoter-status-cell');
          const toggle = el('div', 'bd-promoter-status-toggle');
          const labelOff = el('span', `bd-promoter-status-toggle__side${rec.enabled ? '' : ' is-active'}`, '禁用');
          const labelOn = el('span', `bd-promoter-status-toggle__side${rec.enabled ? ' is-active' : ''}`, '开启');
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
            openBdDetailDrawer(rec, 'base');
          });
          td.appendChild(a);
        } else if (colIdx === colOp) {
          const span = el('span', 'erp-actions-cell');
          const a1 = el('a', 'erp-link', '查看详情');
          a1.href = '#';
          a1.addEventListener('click', (e) => {
            e.preventDefault();
            openBdDetailDrawer(rec, 'base');
          });
          span.appendChild(a1);
          span.appendChild(document.createTextNode('\u3000'));
          const a2 = el('a', 'erp-link', '编辑');
          a2.href = '#';
          a2.addEventListener('click', (e) => {
            e.preventDefault();
            openBdFormModal('edit', rec, { onSaved: paintRows });
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
    openBdFormModal('add', undefined, {
      onCreate: (payload) => {
        rowsState.unshift({
          ...payload,
          id: `BD-PROMO-${Date.now()}`,
          storeCount: '0',
          totalCommission: '¥0.00',
          totalWithdraw: '¥0.00',
          withdrawPhone: '—',
          withdrawPhoneRaw: '',
          createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
          enabled: true,
        });
      },
      onSaved: paintRows,
    });
  });

  btnReset.addEventListener('click', () => {
    filterName.value = '';
    filterPhone.value = '';
    filterCategory.value = '';
    filterIdentity.value = '';
    filterEnabled.value = '';
    paintRows();
  });
  btnQuery.addEventListener('click', () => paintRows());

  paintRows();

  table.appendChild(thead);
  table.appendChild(tbody);
  wrap.appendChild(table);
  card.appendChild(wrap);
  card.appendChild(paginationBar({ total: 56, page: 1, pageSize: 20 }));

  const note = el(
    'p',
    'erp-page__note',
    '说明：筛选条件与列表字段一致（姓名、手机号码、分类、身份、状态）；可提现手机号交互与资源中心档案一致。',
  );
  root.appendChild(card);
  root.appendChild(note);
  container.appendChild(root);
}
