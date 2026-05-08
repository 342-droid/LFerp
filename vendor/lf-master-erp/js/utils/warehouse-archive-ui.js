/**
 * 仓库档案：新增 / 编辑 / 停用启用确认（无进件）
 */
import { el } from './dom.js';
import { button, textInput, selectInput } from './erp-ui.js';
import { createRegionCascader } from './store-archive-ui.js';
import { mountWithdrawPhoneDetail } from './withdraw-phone-modal.js';

export function removeWarehouseArchiveUi() {
  document.querySelectorAll('[data-warehouse-archive-ui]').forEach((n) => n.remove());
}

function sfLabel(text, required) {
  const lab = el('label', 'store-form__label');
  if (required) lab.appendChild(el('span', 'store-form__req', '*'));
  lab.appendChild(document.createTextNode(text));
  return lab;
}

function attachWideModal(title, bodyEl) {
  const backdrop = el('div', 'store-archive-modal-backdrop');
  backdrop.setAttribute('data-warehouse-archive-ui', '1');

  const modal = el('div', 'erp-modal erp-modal--store-wide');
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

/** @param {string} labelOrValue 选项文案或 value */
function warehouseTypeSelect(labelOrValue = '') {
  let v = '';
  if (labelOrValue === 'warehouse' || labelOrValue === '仓库') v = 'warehouse';
  else if (labelOrValue === 'store' || labelOrValue === '门店' || labelOrValue === '门店仓')
    v = 'store';
  else if (labelOrValue === '中心仓' || labelOrValue === '前置仓') v = 'warehouse';
  return selectInput(
    [
      { value: '', label: '请选择仓库类型' },
      { value: 'warehouse', label: '仓库' },
      { value: 'store', label: '门店' },
    ],
    v,
  );
}

const WAREHOUSE_SUBJECT_OPTIONS = [
  { value: '', label: '请选择主体名称' },
  { value: '307403295087919501', label: '沪南一号仓' },
  { value: '307403295087919502', label: '合作仓-苏州' },
  { value: '307403295087919503', label: '自建仓-杭州' },
  { value: '307403295087919504', label: '同城周转仓主体' },
  { value: 'm2', label: '演示主体-B' },
];

function warehouseSubjectSelect(val = '') {
  return selectInput(WAREHOUSE_SUBJECT_OPTIONS, val);
}

function relatedStoreSelect(currentVal = '') {
  return selectInput(
    [
      {
        value: '',
        label: '请选择门店（单选，按照当前权限展示）',
      },
      { value: '1', label: '冷丰演示门店' },
      { value: '2', label: '五角场体验店' },
      { value: '3', label: '仓库商家4.18' },
    ],
    currentVal,
  );
}

/**
 * @param {'add'|'edit'} mode
 * @param {Record<string, unknown>} [record]
 * @param {() => void} [onWithdrawMutated]
 */
function buildWarehouseFormBody(mode, record, onWithdrawMutated) {
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

  if (isEdit && record) {
    const codeInp = textInput('', String(record.code || ''));
    codeInp.readOnly = true;
    codeInp.classList.add('warehouse-form__input--readonly');
    row('仓库编号', false, codeInp);
  }

  const subSel = warehouseSubjectSelect(
    isEdit && record && record.orgId ? String(record.orgId) : '',
  );
  row('主体名称', true, subSel);

  const nameWrap = el('div', 'store-form__input-count');
  const nameInp = textInput(
    '请输入仓库名称',
    isEdit && record ? String(record.name || '') : '',
  );
  nameInp.maxLength = 100;
  const nc = el('span', 'store-form__counter', `${nameInp.value.length} / 100`);
  nameInp.addEventListener('input', () => {
    nc.textContent = `${nameInp.value.length} / 100`;
  });
  nameWrap.appendChild(nameInp);
  nameWrap.appendChild(nc);
  row('仓库名称', true, nameWrap);

  const typeSel = warehouseTypeSelect(isEdit && record ? String(record.typeLabel || '') : '');
  row('仓库类型', true, typeSel);

  const storeSel = relatedStoreSelect('');
  if (isEdit && record && record.relatedStore && record.relatedStore !== '—') {
    const labels = ['冷丰演示门店', '五角场体验店', '仓库商家4.18'];
    const vals = ['1', '2', '3'];
    const idx = labels.indexOf(String(record.relatedStore));
    if (idx >= 0) storeSel.value = vals[idx];
  }
  row('关联门店', true, storeSel);

  row(
    '仓库管理员',
    true,
    textInput(
      '请输入仓库管理员名称',
      isEdit && record ? String(record.admin || '') : '',
    ),
  );
  row(
    '手机号码',
    true,
    textInput(
      '请输入手机号码',
      isEdit && record ? String(record.adminPhoneRaw || record.adminPhone || '') : '',
    ),
  );

  if (isEdit && record) {
    const wr = el('div', 'store-form__row');
    wr.appendChild(sfLabel('可提现手机号', false));
    const wc = el('div', 'store-form__control');
    const holder = el('div', '');
    mountWithdrawPhoneDetail(holder, record, { onMutated: onWithdrawMutated });
    wc.appendChild(holder);
    wr.appendChild(wc);
    body.appendChild(wr);
  }

  const div = el('div', 'warehouse-form__divider');
  div.appendChild(document.createTextNode('地址与面积（选填）'));
  body.appendChild(div);

  const regionRow = el('div', 'store-form__row');
  regionRow.appendChild(sfLabel('仓库地址', false));
  const regionCtrl = el('div', 'store-form__control');
  const path =
    isEdit && record && record.regionPath
      ? String(record.regionPath)
      : isEdit && record && record.region
        ? String(record.region).replace(/\//g, ' / ')
        : '';
  const cascader = createRegionCascader(body, path);
  regionCtrl.appendChild(cascader.wrap);
  regionRow.appendChild(regionCtrl);
  body.appendChild(regionRow);

  const addrRow = el('div', 'store-form__row');
  addrRow.appendChild(sfLabel('详细地址', false));
  const addrCtrl = el('div', 'store-form__control');
  const ta = el('textarea', 'erp-input store-form__textarea');
  ta.placeholder = '请输入详细地址，输入后将自动在地图上定位';
  const addrVal = isEdit && record ? String(record.detailAddress || '') : '';
  ta.value = addrVal;
  ta.maxLength = 200;
  const taWrap = el('div', 'store-form__textarea-wrap');
  const taCnt = el('div', 'store-form__counter', `${addrVal.length} / 200`);
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
  mapRow.appendChild(mapCtrl);
  body.appendChild(mapRow);

  const areaRow = el('div', 'store-form__row');
  areaRow.appendChild(sfLabel('仓库面积（m²）', false));
  const areaCtrl = el('div', 'store-form__control');
  const areaInp = el('input', 'erp-input');
  areaInp.type = 'number';
  areaInp.min = '0';
  areaInp.step = 'any';
  areaInp.placeholder = '请输入仓库面积';
  if (isEdit && record && record.areaNum != null) {
    areaInp.value = String(record.areaNum);
  }
  areaCtrl.appendChild(areaInp);
  areaRow.appendChild(areaCtrl);
  body.appendChild(areaRow);

  return body;
}

export function openWarehouseAddModal() {
  removeWarehouseArchiveUi();
  attachWideModal('新增仓库', buildWarehouseFormBody('add', undefined, undefined));
}

/**
 * @param {Record<string, unknown>} record
 * @param {() => void} [onWithdrawMutated]
 */
export function openWarehouseEditModal(record, onWithdrawMutated) {
  removeWarehouseArchiveUi();
  attachWideModal('编辑仓库', buildWarehouseFormBody('edit', record, onWithdrawMutated));
}

/**
 * @param {{ message: string, onConfirm: () => void }} opts
 */
export function openWarehouseConfirmModal(opts) {
  const backdrop = el('div', 'erp-modal-backdrop');
  backdrop.setAttribute('data-warehouse-archive-ui', '1');

  const modal = el('div', 'erp-modal erp-modal--confirm');
  const header = el('div', 'erp-modal__header');
  header.appendChild(el('h2', 'erp-modal__title', '温馨提示'));
  const headActions = el('div', 'erp-modal__header-actions');
  const btnClose = el('button', 'erp-modal__header-btn');
  btnClose.type = 'button';
  btnClose.innerHTML = '<i class="ri-close-line"></i>';
  btnClose.addEventListener('click', () => backdrop.remove());
  headActions.appendChild(btnClose);
  header.appendChild(headActions);

  const body = el('div', 'erp-modal__body');
  const row = el('div', 'erp-modal-confirm__row');
  row.appendChild(el('div', 'erp-modal-confirm__icon', '!'));
  row.appendChild(el('div', 'erp-modal-confirm__msg', opts.message));
  body.appendChild(row);

  const footer = el('div', 'erp-modal__footer');
  const btnCancel = button('取消', 'default');
  const btnOk = button('确定', 'primary');
  btnCancel.addEventListener('click', () => backdrop.remove());
  btnOk.addEventListener('click', () => {
    opts.onConfirm();
    backdrop.remove();
  });
  footer.appendChild(btnCancel);
  footer.appendChild(btnOk);

  modal.appendChild(header);
  modal.appendChild(body);
  modal.appendChild(footer);
  backdrop.appendChild(modal);
  backdrop.addEventListener('click', (ev) => {
    if (ev.target === backdrop) backdrop.remove();
  });
  document.body.appendChild(backdrop);
}
