/**
 * 统一进件流程（门店 / 供应商 / 直播间 / 承运商共用）
 */
import { el } from './dom.js';
import { button, textInput, selectInput } from './erp-ui.js';
import { createRegionCascader } from './store-region-cascader.js';

export function removeUnifiedOnboardingModals() {
  document.querySelectorAll('[data-unified-onboarding]').forEach((n) => n.remove());
}

function sfLabel(text, required) {
  const lab = el('label', 'store-form__label');
  if (required) lab.appendChild(el('span', 'store-form__req', '*'));
  lab.appendChild(document.createTextNode(text));
  return lab;
}

function sectionTitle(text) {
  return el('div', 'unified-onboard-section-title', text);
}

function ogRow(parent, label, req, node) {
  const r = el('div', 'store-form__row');
  r.appendChild(sfLabel(label, req));
  const c = el('div', 'store-form__control');
  c.appendChild(node);
  r.appendChild(c);
  parent.appendChild(r);
}

/** @param {string} [caption] */
function uploadClickBox(caption) {
  const wrap = el('div', '');
  const box = el('div', 'store-upload-box onboard-upload--click');
  box.textContent = '点击上传';
  wrap.appendChild(box);
  if (caption) wrap.appendChild(el('div', 'store-upload-box__cap', caption));
  return wrap;
}

function enterpriseTypeSelect() {
  return selectInput(
    [
      { value: '', label: '请选择经营类型' },
      { value: 'mall', label: '商场及企业' },
      { value: 'food', label: '餐饮' },
      { value: 'retail', label: '零售' },
      { value: 'other', label: '其他' },
    ],
    '',
  );
}

function scenarioTypeSelect() {
  return selectInput(
    [
      { value: '', label: '请选择场景类型' },
      { value: 'offline', label: '线下实体' },
      { value: 'wx', label: '公众号/小程序' },
      { value: 'app', label: 'APP' },
      { value: 'pc', label: 'PC网站' },
    ],
    '',
  );
}

/**
 * @param {{ title: string, merchantShortNameDefault?: string, variant?: 'store' | 'resource' }} opts
 */
export function openUnifiedOnboardingModal(opts) {
  removeUnifiedOnboardingModals();

  const variant = opts.variant || 'store';
  const backdrop = el(
    'div',
    variant === 'resource'
      ? 'resource-archive-modal-backdrop store-archive-modal-backdrop'
      : 'store-archive-modal-backdrop',
  );
  backdrop.setAttribute('data-unified-onboarding', '1');
  if (variant === 'store') backdrop.dataset.storeArchiveUi = '1';
  else backdrop.setAttribute('data-resource-archive-ui', '1');

  const modal = el('div', 'erp-modal erp-modal--onboarding');
  let fullscreen = false;

  const header = el('div', 'erp-modal__header');
  header.appendChild(el('h2', 'erp-modal__title', opts.title));
  const ha = el('div', 'erp-modal__header-actions');
  const bf = el('button', 'erp-modal__header-btn');
  bf.type = 'button';
  bf.innerHTML = '<i class="ri-fullscreen-line"></i>';
  bf.addEventListener('click', () => {
    fullscreen = !fullscreen;
    modal.classList.toggle('erp-modal--fullscreen', fullscreen);
    bf.innerHTML = fullscreen
      ? '<i class="ri-fullscreen-exit-line"></i>'
      : '<i class="ri-fullscreen-line"></i>';
  });
  const bx = el('button', 'erp-modal__header-btn');
  bx.type = 'button';
  bx.innerHTML = '<i class="ri-close-line"></i>';
  bx.addEventListener('click', () => backdrop.remove());
  ha.appendChild(bf);
  ha.appendChild(bx);
  header.appendChild(ha);

  const body = el('div', 'erp-modal__body');

  /* —— 1 商户类型 —— */
  const s1 = el('section', 'store-onboard-section store-onboard-section--white');
  s1.appendChild(sectionTitle('商户类型'));
  const catRow = el('div', 'store-form__row');
  catRow.appendChild(sfLabel('商户类别', true));
  const radioWrap = el('div', 'store-form__control');
  const radioRow = el('div', 'store-radio-row');
  [['enterprise', '企业'], ['indi', '个体户']].forEach(([val, lab], idx) => {
    const labEl = el('label', '');
    const inp = el('input');
    inp.type = 'radio';
    inp.name = 'uo-merchant-cat';
    inp.value = val;
    if (idx === 0) inp.checked = true;
    labEl.appendChild(inp);
    labEl.appendChild(document.createTextNode(` ${lab}`));
    radioRow.appendChild(labEl);
  });
  radioWrap.appendChild(radioRow);
  catRow.appendChild(radioWrap);
  s1.appendChild(catRow);

  /* —— 2 营业执照信息 —— */
  s1.appendChild(sectionTitle('营业执照信息'));
  const licRow = el('div', 'store-form__row');
  licRow.appendChild(sfLabel('营业执照', true));
  const licCtrl = el('div', 'store-form__control');
  licCtrl.appendChild(uploadClickBox());
  licCtrl.appendChild(el('div', 'store-form__upload-hint', '支持 JPG/PNG，单张不超过 5MB'));
  licRow.appendChild(licCtrl);
  s1.appendChild(licRow);

  const gLic = el('div', 'unified-onboard-grid');
  s1.appendChild(gLic);
  ogRow(gLic, '营业执照名称', false, textInput('请输入营业执照名称'));
  ogRow(gLic, '证件代码', false, textInput('请输入证件代码'));
  ogRow(gLic, '执照起始日期', true, textInput('请选择起始日期'));

  const licExpRow = el('div', 'store-form__row');
  licExpRow.appendChild(sfLabel('执照有效期', false));
  const licExpCtrl = el('div', 'store-form__control store-form__phone-row');
  licExpCtrl.appendChild(textInput('请选择有效期'));
  const longLab = el('label', '');
  const longChk = document.createElement('input');
  longChk.type = 'checkbox';
  longLab.appendChild(longChk);
  longLab.appendChild(document.createTextNode(' 长期'));
  licExpCtrl.appendChild(longLab);
  licExpRow.appendChild(licExpCtrl);
  licExpRow.classList.add('unified-onboard-grid__full');
  gLic.appendChild(licExpRow);

  ogRow(gLic, '注册地址', false, textInput('请输入注册地址'));
  body.appendChild(s1);

  /* —— 3 法人基本信息 —— */
  const s2 = el('section', 'store-onboard-section');
  s2.appendChild(sectionTitle('法人基本信息'));
  const idTypeRow = el('div', 'store-form__row');
  idTypeRow.appendChild(sfLabel('证件类型', true));
  const idTypeCtrl = el('div', 'store-form__control');
  const idRadio = el('div', 'store-radio-row');
  [
    ['idcard', '身份证'],
    ['passport', '护照'],
    ['hkmo', '港澳通行证'],
  ].forEach(([val, lab], idx) => {
    const lb = el('label', '');
    const inp = el('input');
    inp.type = 'radio';
    inp.name = 'uo-id-doc-type';
    inp.value = val;
    if (idx === 0) inp.checked = true;
    lb.appendChild(inp);
    lb.appendChild(document.createTextNode(` ${lab}`));
    idRadio.appendChild(lb);
  });
  idTypeCtrl.appendChild(idRadio);
  idTypeRow.appendChild(idTypeCtrl);
  s2.appendChild(idTypeRow);

  const idUpRow = el('div', 'store-form__row');
  idUpRow.appendChild(sfLabel('上传证件', true));
  const idUpCtrl = el('div', 'store-form__control');
  const idPair = el('div', 'store-upload-grid');
  idPair.appendChild(uploadClickBox('上传身份证人像面'));
  idPair.appendChild(uploadClickBox('上传身份证国徽面'));
  idUpCtrl.appendChild(idPair);
  idUpRow.appendChild(idUpCtrl);
  s2.appendChild(idUpRow);

  const gLegal = el('div', 'unified-onboard-grid');
  s2.appendChild(gLegal);
  ogRow(gLegal, '法人姓名', true, textInput('请输入法人姓名'));
  ogRow(gLegal, '身份证号', true, textInput('请输入证件号码'));
  ogRow(gLegal, '身份证起始日期', true, textInput('请选择起始日期'));
  ogRow(gLegal, '身份证有效期', true, textInput('请选择有效期'));
  body.appendChild(s2);

  /* —— 4 商户信息 —— */
  const s3 = el('section', 'store-onboard-section store-onboard-section--white');
  s3.appendChild(sectionTitle('商户信息'));
  const gMer = el('div', 'unified-onboard-grid');
  s3.appendChild(gMer);
  ogRow(gMer, '商户简称', false, textInput('可输入10个汉字，或20个字母', opts.merchantShortNameDefault || ''));

  const regionOb = el('div', 'store-form__row');
  regionOb.appendChild(sfLabel('商户所在地区', true));
  const rc = el('div', 'store-form__control');
  rc.appendChild(createRegionCascader(body).wrap);
  regionOb.appendChild(rc);
  s3.appendChild(regionOb);

  ogRow(gMer, '详细地址', true, textInput('请输入详细地址'));
  ogRow(gMer, '成立时间', false, textInput('请选择成立时间'));
  ogRow(gMer, '企业类型', true, enterpriseTypeSelect());
  ogRow(gMer, '联系人姓名', true, textInput('请输入联系人姓名'));
    ogRow(gMer, '手机号码', true, textInput('请输入手机号码'));
  ogRow(gMer, '场景类型', true, scenarioTypeSelect());
  ogRow(gMer, '电子邮箱', true, textInput('请输入电子邮箱'));
  body.appendChild(s3);

  /* —— 5 结算信息（随进件类型切换） —— */
  const s4 = el('section', 'store-onboard-section');
  s4.appendChild(sectionTitle('结算信息'));

  const settleIntro = el('div', 'store-form__row');
  settleIntro.appendChild(sfLabel('进件类型', true));
  const settleIntroCtrl = el('div', 'store-form__control');
  const cardRow = el('div', 'onboard-settle-cards');
  const settleRadios = [];
  [
    ['pub', '法人对公进件'],
    ['private', '法人对私进件'],
    ['nonlegal', '非法人进件'],
  ].forEach(([val, lab], i) => {
    const card = el('label', 'onboard-settle-card');
    const inp = el('input');
    inp.type = 'radio';
    inp.name = 'uo-settle-type';
    inp.value = val;
    if (i === 0) inp.checked = true;
    settleRadios.push(inp);
    card.appendChild(inp);
    card.appendChild(el('div', 'onboard-settle-card__label', lab));
    cardRow.appendChild(card);
  });
  settleIntroCtrl.appendChild(cardRow);
  settleIntro.appendChild(settleIntroCtrl);
  s4.appendChild(settleIntro);

  function syncSettleCards() {
    cardRow.querySelectorAll('.onboard-settle-card').forEach((node, i) => {
      const inp = settleRadios[i];
      node.classList.toggle('is-selected', inp.checked);
    });
  }
  settleRadios.forEach((inp, i) => {
    inp.addEventListener('change', () => {
      syncSettleCards();
      renderSettleDynamic();
    });
    const cardEl = cardRow.children[i];
    cardEl.addEventListener('click', (ev) => {
      if (ev.target instanceof HTMLInputElement && ev.target.type === 'radio') return;
      inp.checked = true;
      syncSettleCards();
      renderSettleDynamic();
    });
  });
  syncSettleCards();

  const settleDynamic = el('div', 'onboard-settle-dynamic');
  s4.appendChild(settleDynamic);

  function renderSettleDynamic() {
    settleDynamic.replaceChildren();
    const val =
      body.querySelector('input[name="uo-settle-type"]:checked')?.value || 'pub';

    if (val === 'pub') {
      ogRow(settleDynamic, '开户许可证', true, uploadClickBox());
      ogRow(settleDynamic, '开户名', false, textInput('请输入开户名'));
      ogRow(settleDynamic, '开户城市', false, textInput('请输入开户城市'));
      ogRow(settleDynamic, '银行卡号', false, textInput('请输入银行卡号'));
      ogRow(settleDynamic, '开户支行', false, textInput('请输入开户支行'));
      return;
    }

    if (val === 'private') {
      ogRow(settleDynamic, '银行卡照片', true, uploadClickBox());
      ogRow(settleDynamic, '开户名', false, textInput('请输入开户名'));
      ogRow(settleDynamic, '开户支行', false, textInput('请输入开户支行'));
      ogRow(settleDynamic, '银行卡号', false, textInput('请输入银行卡号'));
      return;
    }

    ogRow(settleDynamic, '银行卡照片', true, uploadClickBox());
    const idPair2 = el('div', 'store-form__row');
    idPair2.appendChild(sfLabel('身份证照片', true));
    const idc = el('div', 'store-form__control');
    const grid = el('div', 'store-upload-grid');
    grid.appendChild(uploadClickBox('上传身份证人像面'));
    grid.appendChild(uploadClickBox('上传身份证国徽面'));
    idc.appendChild(grid);
    idPair2.appendChild(idc);
    settleDynamic.appendChild(idPair2);

    const authRow = el('div', 'store-form__row');
    authRow.appendChild(sfLabel('法人授权函', true));
    const authCtrl = el('div', 'store-form__control');
    authCtrl.appendChild(uploadClickBox());
    authCtrl.appendChild(
      el(
        'div',
        'store-form__upload-hint',
        '下载模板并打印，填写信息并授权签章',
      ),
    );
    const btnRow = el('div', 'onboard-auth-actions');
    const bTpl = button('下载模板', 'default');
    bTpl.classList.add('erp-btn--outline-primary');
    const bEx = button('下载示例', 'default');
    bEx.classList.add('erp-btn--outline-primary');
    btnRow.appendChild(bTpl);
    btnRow.appendChild(bEx);
    authCtrl.appendChild(btnRow);
    authRow.appendChild(authCtrl);
    settleDynamic.appendChild(authRow);

    ogRow(settleDynamic, '身份证号', false, textInput('请输入身份证号'));
    ogRow(settleDynamic, '身份证起始日期', false, textInput('请选择起始日期'));
    ogRow(settleDynamic, '身份证有效期', false, textInput('请选择有效期'));
    ogRow(settleDynamic, '开户名', false, textInput('请输入开户名'));
    ogRow(settleDynamic, '银行卡号', false, textInput('请输入银行卡号'));
    ogRow(settleDynamic, '开户城市', false, textInput('请输入开户城市'));
    ogRow(settleDynamic, '开户支行', false, textInput('请输入开户支行'));
  }

  renderSettleDynamic();

  body.appendChild(s4);

  /* —— 6 门店信息 —— */
  const s5 = el('section', 'store-onboard-section store-onboard-section--white');
  s5.appendChild(sectionTitle('门店信息'));
  const tri = el('div', 'store-upload-grid');
  [
    ['门头照', '门头照'],
    ['内设照', '内设照'],
    ['收银台照', '收银台照'],
  ].forEach(([lab, cap]) => {
    const w = el('div', '');
    w.appendChild(sfLabel(lab, true));
    w.appendChild(uploadClickBox(cap));
    tri.appendChild(w);
  });
  s5.appendChild(tri);

  /* —— 7 门店协议 —— */
  s5.appendChild(sectionTitle('门店协议'));
  const agreeRow = el('div', 'store-form__row');
  agreeRow.appendChild(sfLabel('电子协议', false));
  const agreeCtrl = el('div', 'store-form__control');
  const genBtn = button('生成电子协议', 'primary');
  agreeCtrl.appendChild(genBtn);
  agreeRow.appendChild(agreeCtrl);
  s5.appendChild(agreeRow);
  body.appendChild(s5);

  const footer = el('div', 'erp-modal__footer');
  const bBack = button('返回', 'default');
  bBack.classList.add('erp-btn--outline-primary');
  const bOk = button('确定', 'primary');
  bBack.addEventListener('click', () => backdrop.remove());
  bOk.addEventListener('click', () => backdrop.remove());
  footer.appendChild(bBack);
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
