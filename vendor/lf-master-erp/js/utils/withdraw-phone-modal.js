/**
 * 可提现手机号：添加 / 查看 / 更换（两步验证）— 门店与各资源档案共用
 */
import { el } from './dom.js';
import { button, textInput } from './erp-ui.js';

const MODAL_TITLE = '可提现手机号';

export function isWithdrawPhoneUnset(v) {
  if (v == null) return true;
  const s = String(v).trim();
  if (!s) return true;
  return s === '—' || s === '--' || s === '-' || s === '暂无';
}

/** @param {string} digits */
export function maskWithdrawPhone(digits) {
  const d = String(digits).replace(/\D/g, '');
  if (d.length === 11) return `${d.slice(0, 3)}****${d.slice(-4)}`;
  if (d.length >= 7) return `${d.slice(0, 3)}****${d.slice(-4)}`;
  return digits;
}

export function removeWithdrawPhoneModals() {
  document.querySelectorAll('[data-withdraw-phone-modal]').forEach((n) => n.remove());
}

function removeWithdrawPhoneToasts() {
  document.querySelectorAll('[data-withdraw-phone-toast]').forEach((n) => n.remove());
}

/** @param {string} message */
export function showWithdrawPhoneToast(message) {
  removeWithdrawPhoneToasts();
  const t = el('div', 'withdraw-phone-toast');
  t.setAttribute('data-withdraw-phone-toast', '1');
  t.textContent = message;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('withdraw-phone-toast--show'));
  window.setTimeout(() => {
    t.classList.remove('withdraw-phone-toast--show');
    window.setTimeout(() => t.remove(), 280);
  }, 2600);
}

function sfLabel(text, required) {
  const lab = el('label', 'store-form__label');
  if (required) lab.appendChild(el('span', 'store-form__req', '*'));
  lab.appendChild(document.createTextNode(text));
  return lab;
}

/**
 * @param {Record<string, unknown>} record
 * @param {string} [field]
 */
export function getWithdrawPhoneRaw(record, field = 'withdrawPhone') {
  const rawKey = field === 'withdrawPhone' ? 'withdrawPhoneRaw' : `${field}Raw`;
  const raw = record[rawKey];
  if (raw != null && String(raw).replace(/\D/g, '').length === 11) {
    return String(raw).replace(/\D/g, '');
  }
  const masked = record[field];
  const phoneDisp = record.phone;
  if (
    !isWithdrawPhoneUnset(masked) &&
    !isWithdrawPhoneUnset(phoneDisp) &&
    String(masked) === String(phoneDisp) &&
    record.phoneRaw
  ) {
    const pr = String(record.phoneRaw).replace(/\D/g, '');
    if (pr.length === 11) return pr;
  }
  return '';
}

/**
 * @param {Record<string, unknown>} record
 * @param {string} field
 * @param {string} phoneDigits
 */
export function applyWithdrawPhoneDigits(record, field, phoneDigits) {
  const d = String(phoneDigits).replace(/\D/g, '');
  if (d.length !== 11) return;
  record[field] = maskWithdrawPhone(d);
  const rawKey = field === 'withdrawPhone' ? 'withdrawPhoneRaw' : `${field}Raw`;
  record[rawKey] = d;
}

/**
 * @param {HTMLButtonElement} smsBtn
 * @param {string} idleLabel
 * @param {() => boolean} [validateBeforeSend]
 */
function attachSmsCooldown(smsBtn, idleLabel = '发送验证码', validateBeforeSend) {
  let countdownTimer = 0;
  let left = 0;

  function clearTimer() {
    if (countdownTimer) window.clearInterval(countdownTimer);
    countdownTimer = 0;
  }

  smsBtn.addEventListener('click', () => {
    if (validateBeforeSend && !validateBeforeSend()) return;
    if (left > 0) return;
    left = 60;
    smsBtn.disabled = true;
    smsBtn.textContent = `${left}s`;
    countdownTimer = window.setInterval(() => {
      left -= 1;
      if (left <= 0) {
        clearTimer();
        smsBtn.disabled = false;
        smsBtn.textContent = idleLabel;
      } else {
        smsBtn.textContent = `${left}s`;
      }
    }, 1000);
  });

  return clearTimer;
}

/**
 * @param {HTMLElement} td
 * @param {Record<string, unknown>} record
 * @param {{ field?: string, onMutated?: () => void }} [options]
 */
export function renderWithdrawPhoneTableCell(td, record, options = {}) {
  const field = options.field || 'withdrawPhone';
  td.replaceChildren();
  if (isWithdrawPhoneUnset(record[field])) {
    const a = el('a', 'erp-link withdraw-phone-pending', '待添加');
    a.href = '#';
    a.addEventListener('click', (e) => {
      e.preventDefault();
      openWithdrawPhoneAddModal({
        onConfirm: ({ phone }) => {
          applyWithdrawPhoneDigits(record, field, phone);
          renderWithdrawPhoneTableCell(td, record, options);
          options.onMutated?.();
        },
      });
    });
    td.appendChild(a);
    return;
  }
  const a = el('a', 'erp-link withdraw-phone-view-link', String(record[field]));
  a.href = '#';
  a.addEventListener('click', (e) => {
    e.preventDefault();
    openWithdrawPhoneViewModal({
      record,
      field,
      onChanged: () => {
        renderWithdrawPhoneTableCell(td, record, options);
        options.onMutated?.();
      },
    });
  });
  td.appendChild(a);
}

/**
 * @param {HTMLElement} dd
 * @param {Record<string, unknown>} record
 * @param {{ field?: string, onMutated?: () => void }} [options]
 */
export function mountWithdrawPhoneDetail(dd, record, options = {}) {
  const field = options.field || 'withdrawPhone';

  function paint() {
    dd.replaceChildren();
    const v = record[field];
    if (isWithdrawPhoneUnset(v)) {
      const a = el('a', 'erp-link withdraw-phone-pending', '待添加');
      a.href = '#';
      a.addEventListener('click', (e) => {
        e.preventDefault();
        openWithdrawPhoneAddModal({
          onConfirm: ({ phone }) => {
            applyWithdrawPhoneDigits(record, field, phone);
            paint();
            options.onMutated?.();
          },
        });
      });
      dd.appendChild(a);
      return;
    }
    const a = el('a', 'erp-link withdraw-phone-view-link', String(v));
    a.href = '#';
    a.addEventListener('click', (e) => {
      e.preventDefault();
      openWithdrawPhoneViewModal({
        record,
        field,
        onChanged: () => {
          paint();
          options.onMutated?.();
        },
      });
    });
    dd.appendChild(a);
  }

  paint();
}

/**
 * @param {HTMLElement} dd
 * @param {Record<string, unknown>} record
 */
export function mountSupplierDetailMobile(dd, record) {
  function displayText() {
    const p = record.phone;
    const w = record.withdrawPhone;
    if (!isWithdrawPhoneUnset(p)) return String(p);
    if (!isWithdrawPhoneUnset(w)) return String(w);
    return null;
  }

  function paint() {
    dd.replaceChildren();
    const d = displayText();
    if (d) {
      dd.textContent = d;
      return;
    }
    const a = el('a', 'erp-link withdraw-phone-pending', '待添加');
    a.href = '#';
    a.addEventListener('click', (e) => {
      e.preventDefault();
      openWithdrawPhoneAddModal({
        onConfirm: ({ phone }) => {
          const digits = String(phone).replace(/\D/g, '');
          const m = maskWithdrawPhone(digits);
          record.phone = m;
          record.withdrawPhone = m;
          record.phoneRaw = digits;
          record.withdrawPhoneRaw = digits;
          paint();
        },
      });
    });
    dd.appendChild(a);
  }

  paint();
}

/** @param {Record<string, unknown>} record */
export function gridItemWithdrawPhone(record) {
  const item = el('div', 'store-detail-grid__item');
  item.appendChild(el('dt', '', '可提现手机号'));
  const dd = el('dd', '');
  mountWithdrawPhoneDetail(dd, record);
  item.appendChild(dd);
  return item;
}

function modalShell(title, bodyEl, footerEl) {
  removeWithdrawPhoneModals();

  const backdrop = el('div', 'store-archive-modal-backdrop');
  backdrop.setAttribute('data-withdraw-phone-modal', '1');

  const modal = el('div', 'erp-modal erp-modal--withdraw-phone');

  const header = el('div', 'erp-modal__header');
  header.appendChild(el('h2', 'erp-modal__title', title));
  const bx = el('button', 'erp-modal__header-btn');
  bx.type = 'button';
  bx.innerHTML = '<i class="ri-close-line"></i>';
  const ha = el('div', 'erp-modal__header-actions');
  ha.appendChild(bx);
  header.appendChild(ha);

  modal.appendChild(header);
  modal.appendChild(bodyEl);
  modal.appendChild(footerEl);

  backdrop.appendChild(modal);
  backdrop.addEventListener('click', (ev) => {
    if (ev.target === backdrop) backdrop.remove();
  });
  document.body.appendChild(backdrop);

  function closeModal() {
    backdrop.remove();
  }

  bx.addEventListener('click', () => closeModal());
  return { backdrop, modal, closeModal };
}

/**
 * @param {{ onConfirm?: (p: { phone: string, code: string }) => void }} opts
 */
export function openWithdrawPhoneAddModal(opts = {}) {
  const body = el('div', 'erp-modal__body');

  const phoneRow = el('div', 'store-form__row');
  phoneRow.appendChild(sfLabel('提现手机号', true));
  const phoneCtrl = el('div', 'store-form__control');
  const phWrap = el('div', 'store-form__phone-row');
  const phoneInp = textInput('请输入提现手机号', '');
  phoneInp.setAttribute('inputmode', 'numeric');
  phoneInp.setAttribute('maxlength', '11');
  const smsBtn = button('获取验证码', 'primary');
  smsBtn.classList.add('erp-btn--sms');
  phWrap.appendChild(phoneInp);
  phWrap.appendChild(smsBtn);
  phoneCtrl.appendChild(phWrap);
  phoneRow.appendChild(phoneCtrl);
  body.appendChild(phoneRow);

  const clearSms = attachSmsCooldown(smsBtn, '获取验证码', () => {
    const raw = phoneInp.value.replace(/\D/g, '');
    if (raw.length !== 11) {
      showWithdrawPhoneToast('请输入11位提现手机号');
      return false;
    }
    return true;
  });

  const codeRow = el('div', 'store-form__row');
  codeRow.appendChild(sfLabel('验证码', true));
  const codeCtrl = el('div', 'store-form__control');
  const codeInp = textInput('请输入验证码', '');
  codeInp.setAttribute('maxlength', '8');
  codeCtrl.appendChild(codeInp);
  codeRow.appendChild(codeCtrl);
  body.appendChild(codeRow);

  const footer = el('div', 'erp-modal__footer');
  const bCancel = button('取消', 'default');
  const bOk = button('确定', 'primary');

  const { closeModal } = modalShell(MODAL_TITLE, body, footer);

  bCancel.addEventListener('click', () => {
    clearSms();
    closeModal();
  });
  bOk.addEventListener('click', () => {
    const phone = phoneInp.value.replace(/\D/g, '');
    const code = codeInp.value.trim();
    if (phone.length !== 11) {
      showWithdrawPhoneToast('请输入11位提现手机号');
      return;
    }
    if (!code) {
      showWithdrawPhoneToast('请输入验证码');
      return;
    }
    if (code === '000000') {
      showWithdrawPhoneToast('验证码已失效');
      return;
    }
    if (code.length < 4) {
      showWithdrawPhoneToast('验证失败，请重新输入');
      return;
    }
    opts.onConfirm?.({ phone, code });
    clearSms();
    closeModal();
  });

  footer.appendChild(bCancel);
  footer.appendChild(bOk);
}

/**
 * @param {{ record: Record<string, unknown>, field?: string, onChanged?: () => void }} opts
 */
export function openWithdrawPhoneViewModal(opts) {
  const { record, field = 'withdrawPhone', onChanged } = opts;
  const masked = String(record[field] || '');
  const body = el('div', 'erp-modal__body');

  const row = el('div', 'store-form__row');
  row.appendChild(sfLabel('提现手机号', false));
  const ctrl = el('div', 'store-form__control');
  const ro = textInput('', masked);
  ro.readOnly = true;
  ro.classList.add('withdraw-phone-readonly');
  ctrl.appendChild(ro);
  row.appendChild(ctrl);
  body.appendChild(row);

  const changeBtn = button('更换提现手机号码', 'primary');
  changeBtn.type = 'button';
  changeBtn.classList.add('withdraw-phone-change-entry', 'erp-btn--block');
  body.appendChild(changeBtn);

  const footer = el('div', 'erp-modal__footer');
  const bCancel = button('取消', 'default');
  const bOk = button('确定', 'primary');

  const { closeModal } = modalShell(MODAL_TITLE, body, footer);

  bCancel.addEventListener('click', () => closeModal());
  bOk.addEventListener('click', () => closeModal());

  changeBtn.addEventListener('click', () => {
    closeModal();
    const rawOld = getWithdrawPhoneRaw(record, field);
    openWithdrawPhoneChangeWizard({
      maskedOld: masked,
      rawOld,
      onComplete: ({ phone }) => {
        applyWithdrawPhoneDigits(record, field, phone);
        onChanged?.();
      },
    });
  });

  footer.appendChild(bCancel);
  footer.appendChild(bOk);
}

/**
 * @param {{ maskedOld: string, rawOld: string, onComplete: (p: { phone: string }) => void }} opts
 */
export function openWithdrawPhoneChangeWizard(opts) {
  const { maskedOld, onComplete } = opts;

  removeWithdrawPhoneModals();

  const backdrop = el('div', 'store-archive-modal-backdrop');
  backdrop.setAttribute('data-withdraw-phone-modal', '1');

  const modal = el('div', 'erp-modal erp-modal--withdraw-phone erp-modal--withdraw-phone-change');

  const header = el('div', 'erp-modal__header');
  header.appendChild(el('h2', 'erp-modal__title', MODAL_TITLE));
  const bx = el('button', 'erp-modal__header-btn');
  bx.type = 'button';
  bx.innerHTML = '<i class="ri-close-line"></i>';
  const ha = el('div', 'erp-modal__header-actions');
  ha.appendChild(bx);
  header.appendChild(ha);

  const body = el('div', 'erp-modal__body withdraw-phone-change-body');
  const footer = el('div', 'erp-modal__footer erp-modal__footer--stack');

  modal.appendChild(header);
  modal.appendChild(body);
  modal.appendChild(footer);
  backdrop.appendChild(modal);
  backdrop.addEventListener('click', (ev) => {
    if (ev.target === backdrop) backdrop.remove();
  });
  document.body.appendChild(backdrop);

  function closeAll() {
    backdrop.remove();
  }

  bx.addEventListener('click', () => closeAll());

  let step = 1;

  function renderStep() {
    body.replaceChildren();
    footer.replaceChildren();

    const stepper = el('div', 'withdraw-phone-stepper');
    const s1 = el('div', `withdraw-phone-stepper__dot${step === 1 ? ' withdraw-phone-stepper__dot--on' : ''}`, '1');
    const line = el('div', `withdraw-phone-stepper__line${step === 2 ? ' withdraw-phone-stepper__line--on' : ''}`);
    const s2 = el('div', `withdraw-phone-stepper__dot${step === 2 ? ' withdraw-phone-stepper__dot--on' : ''}`, '2');
    stepper.appendChild(s1);
    stepper.appendChild(line);
    stepper.appendChild(s2);
    body.appendChild(stepper);

    const labs = el('div', 'withdraw-phone-stepper__labels');
    labs.appendChild(el('span', `withdraw-phone-stepper__lab${step === 1 ? ' withdraw-phone-stepper__lab--on' : ''}`, '提现手机号验证'));
    labs.appendChild(el('span', `withdraw-phone-stepper__lab${step === 2 ? ' withdraw-phone-stepper__lab--on' : ''}`, '修改手机号码'));
    body.appendChild(labs);

    if (step === 1) {
      const phoneRow = el('div', 'store-form__row');
      phoneRow.appendChild(sfLabel('手机号', false));
      const pc = el('div', 'store-form__control');
      const pi = textInput('', maskedOld);
      pi.readOnly = true;
      pi.classList.add('withdraw-phone-readonly');
      pc.appendChild(pi);
      phoneRow.appendChild(pc);
      body.appendChild(phoneRow);

      const codeRow = el('div', 'store-form__row');
      codeRow.appendChild(sfLabel('验证码', true));
      const cc = el('div', 'store-form__control');
      const inline = el('div', 'withdraw-phone-inline-code');
      const c1 = textInput('请输入验证码', '');
      c1.setAttribute('maxlength', '8');
      const sms1 = el('button', 'withdraw-phone-inline-code__btn', '发送验证码');
      sms1.type = 'button';
      inline.appendChild(c1);
      inline.appendChild(sms1);
      cc.appendChild(inline);
      codeRow.appendChild(cc);
      body.appendChild(codeRow);

      attachSmsCooldown(sms1, '发送验证码');

      const nextBtn = button('下一步', 'primary');
      nextBtn.type = 'button';
      nextBtn.classList.add('erp-btn--block');
      nextBtn.disabled = true;

      function syncNext() {
        nextBtn.disabled = c1.value.trim().length < 4;
      }
      c1.addEventListener('input', syncNext);
      syncNext();

      nextBtn.addEventListener('click', () => {
        const code = c1.value.trim();
        if (code === '000000') {
          showWithdrawPhoneToast('验证码已失效');
          return;
        }
        if (code.length < 4) {
          showWithdrawPhoneToast('验证失败，请重新输入');
          return;
        }
        step = 2;
        renderStep();
      });

      footer.appendChild(nextBtn);
      return;
    }

    const newPhoneRow = el('div', 'store-form__row');
    newPhoneRow.appendChild(sfLabel('新的提现手机号', true));
    const npc = el('div', 'store-form__control');
    const np = textInput('请输入新的提现手机号', '');
    np.setAttribute('inputmode', 'numeric');
    np.setAttribute('maxlength', '11');
    npc.appendChild(np);
    newPhoneRow.appendChild(npc);
    body.appendChild(newPhoneRow);

    const codeRow2 = el('div', 'store-form__row');
    codeRow2.appendChild(sfLabel('验证码', true));
    const cc2 = el('div', 'store-form__control');
    const inline2 = el('div', 'withdraw-phone-inline-code');
    const c2 = textInput('请输入验证码', '');
    c2.setAttribute('maxlength', '8');
    const sms2 = el('button', 'withdraw-phone-inline-code__btn', '发送验证码');
    sms2.type = 'button';
    inline2.appendChild(c2);
    inline2.appendChild(sms2);
    cc2.appendChild(inline2);
    codeRow2.appendChild(cc2);
    body.appendChild(codeRow2);

      attachSmsCooldown(sms2, '发送验证码', () => {
        const digits = np.value.replace(/\D/g, '');
        if (digits.length !== 11) {
          showWithdrawPhoneToast('请先填写11位新的提现手机号');
          return false;
        }
        return true;
      });

    const okBtn = button('确认', 'primary');
    okBtn.type = 'button';
    okBtn.classList.add('erp-btn--block');
    okBtn.disabled = true;

    function syncOk() {
      const digits = np.value.replace(/\D/g, '');
      okBtn.disabled = digits.length !== 11 || c2.value.trim().length < 4;
    }
    np.addEventListener('input', syncOk);
    c2.addEventListener('input', syncOk);
    syncOk();

    okBtn.addEventListener('click', () => {
      const phone = np.value.replace(/\D/g, '');
      const code = c2.value.trim();
      if (phone.length !== 11) {
        showWithdrawPhoneToast('请输入11位手机号');
        return;
      }
      if (code === '000000') {
        showWithdrawPhoneToast('验证码已失效');
        return;
      }
      if (code.length < 4) {
        showWithdrawPhoneToast('验证失败，请重新输入');
        return;
      }
      onComplete({ phone });
      closeAll();
    });

    footer.appendChild(okBtn);
  }

  renderStep();
}

/**
 * @param {{ onConfirm?: (p: { phone: string, code: string }) => void }} opts
 */
export function openWithdrawPhoneModal(opts = {}) {
  openWithdrawPhoneAddModal(opts);
}
