/**
 * MDM — 主体中心：门店/供应商/仓库主体列表通用页
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

/**
 * @param {HTMLElement} backdrop
 */
function removeBackdrop(backdrop) {
  backdrop.remove();
}

/**
 * @param {() => void} [onUnmount]
 */
function closePartyModals(onUnmount) {
  document.querySelectorAll('[data-mdm-party-modal]').forEach((node) => node.remove());
  if (typeof onUnmount === 'function') onUnmount();
}

/**
 * @param {{ message: string, onConfirm: () => void }} opts
 */
function openConfirmModal(opts) {
  const backdrop = el('div', 'erp-modal-backdrop');
  backdrop.dataset.mdmPartyModal = '1';

  const modal = el('div', 'erp-modal erp-modal--confirm');
  const header = el('div', 'erp-modal__header');
  header.appendChild(el('h2', 'erp-modal__title', '温馨提示'));
  const headActions = el('div', 'erp-modal__header-actions');
  const btnClose = el('button', 'erp-modal__header-btn');
  btnClose.type = 'button';
  btnClose.title = '关闭';
  btnClose.innerHTML = '<i class="ri-close-line"></i>';
  btnClose.addEventListener('click', () => removeBackdrop(backdrop));
  headActions.appendChild(btnClose);
  header.appendChild(headActions);

  const body = el('div', 'erp-modal__body');
  const row = el('div', 'erp-modal-confirm__row');
  const icon = el('div', 'erp-modal-confirm__icon', '!');
  const msg = el('div', 'erp-modal-confirm__msg', opts.message);
  row.appendChild(icon);
  row.appendChild(msg);
  body.appendChild(row);

  const footer = el('div', 'erp-modal__footer');
  const btnCancel = button('取消', 'default');
  const btnOk = button('确定', 'primary');
  btnCancel.addEventListener('click', () => removeBackdrop(backdrop));
  btnOk.addEventListener('click', () => {
    opts.onConfirm();
    removeBackdrop(backdrop);
  });
  footer.appendChild(btnCancel);
  footer.appendChild(btnOk);

  modal.appendChild(header);
  modal.appendChild(body);
  modal.appendChild(footer);
  backdrop.appendChild(modal);

  backdrop.addEventListener('click', (ev) => {
    if (ev.target === backdrop) removeBackdrop(backdrop);
  });

  document.body.appendChild(backdrop);
}

/**
 * @param {{
 *   title: string,
 *   subjectTypeLabel: string,
 *   showBindBd: boolean,
 *   compactStoreSubjectForm?: boolean,
 *   contactPersonLabel?: string,
 * }} cfg
 */
function openAddSubjectModal(cfg) {
  const backdrop = el('div', 'erp-modal-backdrop');
  backdrop.dataset.mdmPartyModal = '1';

  const modal = el('div', 'erp-modal');
  let fullscreen = false;

  const header = el('div', 'erp-modal__header');
  header.appendChild(el('h2', 'erp-modal__title', cfg.title));
  const headActions = el('div', 'erp-modal__header-actions');
  const btnFs = el('button', 'erp-modal__header-btn');
  btnFs.type = 'button';
  btnFs.title = '全屏';
  btnFs.innerHTML = '<i class="ri-fullscreen-line"></i>';
  btnFs.addEventListener('click', () => {
    fullscreen = !fullscreen;
    modal.classList.toggle('erp-modal--fullscreen', fullscreen);
    btnFs.innerHTML = fullscreen
      ? '<i class="ri-fullscreen-exit-line"></i>'
      : '<i class="ri-fullscreen-line"></i>';
  });
  const btnClose = el('button', 'erp-modal__header-btn');
  btnClose.type = 'button';
  btnClose.title = '关闭';
  btnClose.innerHTML = '<i class="ri-close-line"></i>';
  btnClose.addEventListener('click', () => removeBackdrop(backdrop));
  headActions.appendChild(btnFs);
  headActions.appendChild(btnClose);
  header.appendChild(headActions);

  const body = el('div', 'erp-modal__body');

  function labelRow(text, required) {
    const lab = el('label', 'erp-modal-field__label');
    if (required) lab.appendChild(el('span', 'erp-req', '*'));
    lab.appendChild(document.createTextNode(text));
    return lab;
  }

  const rowName = el('div', 'erp-modal-field');
  rowName.appendChild(labelRow('主体名称', true));
  const cName = el('div', 'erp-modal-field__control');
  cName.appendChild(textInput('请输入主体名称'));
  rowName.appendChild(cName);
  body.appendChild(rowName);

  if (cfg.showBindBd) {
    const rowBd = el('div', 'erp-modal-field');
    rowBd.appendChild(labelRow('绑定BD', true));
    const cBd = el('div', 'erp-modal-field__control');
    cBd.appendChild(
      selectInput(
        [
          { value: '', label: '请选择绑定BD' },
          { value: '1', label: '赵小九' },
          { value: '2', label: '李四' },
          { value: '3', label: '张三' },
          { value: '4', label: '王五' },
        ],
        '',
      ),
    );
    rowBd.appendChild(cBd);
    body.appendChild(rowBd);
  }

  const rowType = el('div', 'erp-modal-field');
  rowType.appendChild(labelRow('主体类型', true));
  const cType = el('div', 'erp-modal-field__control');
  const typeSel = selectInput([{ value: 't', label: cfg.subjectTypeLabel }], 't');
  typeSel.disabled = true;
  cType.appendChild(typeSel);
  rowType.appendChild(cType);
  body.appendChild(rowType);

  const rowContact = el('div', 'erp-modal-field');
  rowContact.appendChild(labelRow(cfg.contactPersonLabel ?? '联系人', true));
  const cContact = el('div', 'erp-modal-field__control');
  cContact.appendChild(
    textInput(`请输入${cfg.contactPersonLabel ?? '联系人'}`),
  );
  rowContact.appendChild(cContact);
  body.appendChild(rowContact);

  const rowPhone = el('div', 'erp-modal-field');
  rowPhone.appendChild(labelRow('手机号码', true));
  const cPhone = el('div', 'erp-modal-field__control');
  const phoneRow = el('div', 'erp-modal-phone-row');
  const phoneInp = textInput('请输入手机号码');
  const smsBtn = button('获取验证码', 'primary');
  smsBtn.classList.add('erp-btn--sms');
  smsBtn.addEventListener('click', () => {
    /* 原型：无后端 */
  });
  phoneRow.appendChild(phoneInp);
  phoneRow.appendChild(smsBtn);
  cPhone.appendChild(phoneRow);
  rowPhone.appendChild(cPhone);
  body.appendChild(rowPhone);

  const rowCode = el('div', 'erp-modal-field');
  rowCode.appendChild(labelRow('验证码', true));
  const cCode = el('div', 'erp-modal-field__control');
  cCode.appendChild(textInput('请输入验证码'));
  rowCode.appendChild(cCode);
  body.appendChild(rowCode);

  if (!cfg.compactStoreSubjectForm) {
    const rowLogin = el('div', 'erp-modal-field');
    rowLogin.appendChild(labelRow('登录账号', false));
    const cLogin = el('div', 'erp-modal-field__control');
    cLogin.appendChild(textInput('请输入登录账号'));
    rowLogin.appendChild(cLogin);
    body.appendChild(rowLogin);
  }

  const footer = el('div', 'erp-modal__footer');
  const btnCancel = button('取消', 'default');
  const btnSave = button('保存', 'primary');
  btnCancel.addEventListener('click', () => removeBackdrop(backdrop));
  btnSave.addEventListener('click', () => removeBackdrop(backdrop));
  footer.appendChild(btnCancel);
  footer.appendChild(btnSave);

  modal.appendChild(header);
  modal.appendChild(body);
  modal.appendChild(footer);
  backdrop.appendChild(modal);

  backdrop.addEventListener('click', (ev) => {
    if (ev.target === backdrop) removeBackdrop(backdrop);
  });

  document.body.appendChild(backdrop);
}

/**
 * @param {string[]} headers
 * @param {string[][]} rows
 * @param {(idx: number, row: string[]) => HTMLElement} lastCellFn
 * @param {{ linkNameCol?: number, onNameClick?: (row: string[], displayIdx: number) => void }} [opts]
 */
function subjectDataTable(headers, rows, lastCellFn, opts) {
  const linkCol = opts?.linkNameCol;
  const onLink = opts?.onNameClick;
  const wrap = el('div', 'erp-table-scroll');
  const table = el('table', 'erp-table');
  const thead = el('thead');
  const trh = el('tr');
  headers.forEach((h) => {
    trh.appendChild(el('th', '', h));
  });
  thead.appendChild(trh);
  const tbody = el('tbody');
  rows.forEach((cells, idx) => {
    const tr = el('tr');
    if (idx % 2 === 1) tr.classList.add('erp-table__row--alt');
    cells.forEach((c, colIdx) => {
      const td = el('td', '');
      if (colIdx === linkCol && typeof onLink === 'function') {
        const a = el('a', 'erp-link', String(c));
        a.href = '#';
        a.addEventListener('click', (e) => {
          e.preventDefault();
          onLink(cells, idx);
        });
        td.appendChild(a);
      } else {
        td.textContent = c;
      }
      tr.appendChild(td);
    });
    const tdOp = el('td', '');
    tdOp.appendChild(lastCellFn(idx, cells));
    tr.appendChild(tdOp);
    tbody.appendChild(tr);
  });
  table.appendChild(thead);
  table.appendChild(tbody);
  wrap.appendChild(table);
  return { wrap, tbody };
}

/**
 * @param {string[]} headers
 * @param {string[]} row
 * @param {string} title
 */
function openPartySubjectDetailModal(headers, row, title) {
  closePartyModals();
  const backdrop = el('div', 'erp-modal-backdrop');
  backdrop.dataset.mdmPartyModal = '1';
  const modal = el('div', 'erp-modal erp-modal--withdraw-phone');
  const header = el('div', 'erp-modal__header');
  header.appendChild(el('h2', 'erp-modal__title', `${title}详情`));
  const ha = el('div', 'erp-modal__header-actions');
  const bx = el('button', 'erp-modal__header-btn');
  bx.type = 'button';
  bx.innerHTML = '<i class="ri-close-line"></i>';
  bx.addEventListener('click', () => removeBackdrop(backdrop));
  ha.appendChild(bx);
  header.appendChild(ha);

  const body = el('div', 'erp-modal__body');
  headers.forEach((h, i) => {
    const rowEl = el('div', 'erp-modal-field');
    const lab = el('label', 'erp-modal-field__label', h);
    rowEl.appendChild(lab);
    const c = el('div', 'erp-modal-field__control');
    const inp = textInput('', String(row[i] ?? '—'));
    inp.readOnly = true;
    c.appendChild(inp);
    rowEl.appendChild(c);
    body.appendChild(rowEl);
  });

  const footer = el('div', 'erp-modal__footer');
  const close = button('关闭', 'primary');
  close.addEventListener('click', () => removeBackdrop(backdrop));
  footer.appendChild(close);

  modal.appendChild(header);
  modal.appendChild(body);
  modal.appendChild(footer);
  backdrop.appendChild(modal);
  backdrop.addEventListener('click', (ev) => {
    if (ev.target === backdrop) removeBackdrop(backdrop);
  });
  document.body.appendChild(backdrop);
}

/**
 * @param {{
 *   pageLabel: string,
 *   idLabel: string,
 *   nameLabel: string,
 *   addLabel: string,
 *   addModalTitle: string,
 *   subjectTypeLabel: string,
 *   showBindBd: boolean,
 *   bindColumnLabel?: string,
 *   manageTitle?: string,
 *   listTitle?: string,
 *   disableConfirmMessage: string,
 *   mock: string[][],
 *   pageFootNote?: string,
 *   contactPersonLabel?: string,
 *   compactStoreSubjectForm?: boolean,
 * }} cfg
 */
export function renderSubjectPage(container, cfg) {
  closePartyModals();
  empty(container);
  const rowsState = cfg.mock.map((r) => [...r]);

  const addModalTitle = cfg.addModalTitle ?? `添加${cfg.pageLabel}主体`;
  const subjectTypeLabel = cfg.subjectTypeLabel ?? cfg.pageLabel;
  const showBindBd = cfg.showBindBd ?? false;
  const disableConfirmMessage =
    cfg.disableConfirmMessage ?? `确定禁用此${cfg.pageLabel}吗？`;
  const bindColumnLabel = cfg.bindColumnLabel ?? '绑定BD名称';
  const manageSegment = cfg.manageTitle ?? `${cfg.pageLabel}主体管理`;
  const listSegment = cfg.listTitle ?? `${cfg.pageLabel}主体列表`;
  const contactPersonLabel = cfg.contactPersonLabel ?? '联系人';

  const root = el('div', 'erp-page');
  const card = el('div', 'erp-page__card');
  const head = el('div', 'erp-page__head');
  head.appendChild(breadcrumb(['基础数据中心', '主体中心', manageSegment, listSegment]));

  const nameInp = textInput(`请输入${cfg.nameLabel}`);
  const statusSel = selectInput(
    [
      { value: '', label: '全部' },
      { value: '1', label: '正常' },
      { value: '2', label: '冻结' },
      { value: '3', label: '停用' },
    ],
    '',
  );

  const toolbar = el('div', 'erp-toolbar');
  toolbar.appendChild(fieldRow(cfg.nameLabel, nameInp));
  toolbar.appendChild(fieldRow('状态', statusSel));
  const ta = el('div', 'erp-toolbar__actions');
  const btnReset = button('重置', 'default');
  const btnQuery = button('查询', 'primary');
  ta.appendChild(btnReset);
  ta.appendChild(btnQuery);
  toolbar.appendChild(ta);
  head.appendChild(toolbar);
  card.appendChild(head);

  const actions = el('div', 'erp-actions-row');
  const addBtn = button(`+ 新增${cfg.addLabel}`, 'primary');
  addBtn.addEventListener('click', () => {
    openAddSubjectModal({
      title: addModalTitle,
      subjectTypeLabel,
      showBindBd,
      contactPersonLabel,
      compactStoreSubjectForm: cfg.compactStoreSubjectForm,
    });
  });
  actions.appendChild(addBtn);
  card.appendChild(actions);

  const headers = [
    cfg.idLabel,
    cfg.nameLabel,
    bindColumnLabel,
    '主体类型',
    contactPersonLabel,
    '手机号码',
    '登录账号',
    '创建时间',
    '最后操作人',
    '状态',
    '操作',
  ];
  const detailHeaders = headers.slice(0, -1);

  const tableHost = el('div');
  card.appendChild(tableHost);

  function filteredRows() {
    const qName = nameInp.value.trim();
    const qStatus = statusSel.value;
    return rowsState.filter((row) => {
      if (qName && !String(row[1]).includes(qName)) return false;
      if (qStatus === '1' && row[9] !== '正常') return false;
      if (qStatus === '2' && row[9] !== '冻结') return false;
      if (qStatus === '3' && row[9] !== '停用') return false;
      return true;
    });
  }

  function paintTable() {
    empty(tableHost);
    const filtered = filteredRows();
    const { wrap } = subjectDataTable(headers, filtered, (_displayIdx, cells) => {
      const actualIdx = rowsState.findIndex((r) => r[0] === cells[0]);
      const span = el('span', 'erp-actions-cell');
      if (actualIdx < 0) return span;
      const status = rowsState[actualIdx][9];
      const link = el('a', 'erp-link', status === '停用' ? '启用' : '禁用');
      link.href = '#';
      link.addEventListener('click', (e) => {
        e.preventDefault();
        if (rowsState[actualIdx][9] === '停用') {
          rowsState[actualIdx][9] = '正常';
          paintTable();
          return;
        }
        openConfirmModal({
          message: disableConfirmMessage,
          onConfirm: () => {
            rowsState[actualIdx][9] = '停用';
            paintTable();
          },
        });
      });
      span.appendChild(link);
      return span;
    }, {
      linkNameCol: 1,
      onNameClick: (row) => openPartySubjectDetailModal(detailHeaders, row, cfg.pageLabel),
    });
    tableHost.appendChild(wrap);
  }

  btnReset.addEventListener('click', () => {
    nameInp.value = '';
    statusSel.value = '';
    paintTable();
  });
  btnQuery.addEventListener('click', () => paintTable());

  paintTable();
  card.appendChild(paginationBar({ total: 55, page: 1, pageSize: 20 }));

  root.appendChild(card);
  if (cfg.pageFootNote) {
    root.appendChild(el('p', 'erp-page__note', cfg.pageFootNote));
  }
  container.appendChild(root);
}
