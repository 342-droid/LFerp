/**
 * 门店 APP · 商户进件
 * - 填写页四步与 BD APP（mdm_bd_merchants）一致
 * - 审核链路与 PC 门店进件一致：BD → BD总监 → 财务 → 汇付 → 结果
 * - 门店仅进件 1 次；提交后写入 mdm_unified_onboarding_records_v1
 */
(function () {
  var KEY = 'mdm_unified_onboarding_records_v1';
  var STEPS = ['执照信息', '商户信息', '结算信息', '门店场地'];
  var FLOW = [
    { id: 'start', name: '发起进件', tip: '门店填写并提交资料' },
    { id: 'bd', name: 'BD审核', tip: 'BD 预审资料完整性' },
    { id: 'leader', name: 'BD总监审核', tip: '总监复核通过后流转财务' },
    { id: 'finance', name: '财务审核', tip: '财务复核结算信息' },
    { id: 'huifu', name: '汇付审核', tip: '推送汇付，接口回写结果' },
    { id: 'result', name: '进件结果', tip: '审核成功 / 审核失败' }
  ];

  /* 当前登录门店（演示，字段对齐 BD 商户详情） */
  var STORE = {
    id: 'MU20260315001',
    merchantNo: 'MU20260315001',
    name: '鲜丰-文一西路',
    shortName: '鲜丰水果文一店',
    subjectName: '杭州鲜丰水果有限公司',
    phone: '13812348001',
    address: '杭州市余杭区文一西路969号',
    licenseName: '杭州鲜丰水果有限公司',
    registrationCode: '91330110MA2XXXXXX',
    licenseValidFrom: '2020-06-01',
    licenseValidTo: '长期',
    registeredAddress: '杭州市余杭区文一西路969号',
    legalPerson: '陈大华',
    idNumber: '532101199003145212',
    idValidFrom: '2022-03-07',
    idValidTo: '2042-03-07',
    settlementAccountName: '杭州鲜丰水果有限公司',
    bankAccount: '6222020212345678888',
    bankName: '招商银行',
    branchName: '杭州城西支行',
    contactName: '陈大华',
    loginAccount: 'store_xfwyl',
    sceneType: '线下门店',
    businessType: '餐饮',
    mccIndustry: '5812 餐饮场所',
    settlementBodyType: '独立结算',
    headHuifuId: '—',
    reqSeqId: 'REQ' + '20260315001',
    extMerId: 'EXT-MU20260315001',
    creator: '门店负责人',
    channel: '门店 APP'
  };

  var RECORD_KEY = 'storeapp::store::' + STORE.id;

  var DEMO_IMG =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect fill="#e2e8f0" width="100%" height="100%" rx="8"/><text x="50%" y="50%" text-anchor="middle" fill="#64748b" font-size="13">证照演示图</text></svg>'
    );
  var BUSINESS_LICENSE_IMG =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300"><rect width="480" height="300" fill="#efe3c9"/><text x="240" y="150" text-anchor="middle" font-size="28" fill="#6f4f26" font-weight="700">营业执照</text></svg>'
    );
  var LEGAL_ID_FRONT_IMG =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="420" height="260"><rect width="420" height="260" rx="10" fill="#c7edf4"/><text x="210" y="130" text-anchor="middle" fill="#247c9a" font-size="20" font-weight="700">身份证人像面</text></svg>'
    );
  var LEGAL_ID_BACK_IMG =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="420" height="260"><rect width="420" height="260" rx="10" fill="#d2f0f2"/><text x="210" y="130" text-anchor="middle" fill="#333" font-size="20" font-weight="700">身份证国徽面</text></svg>'
    );
  var OPEN_LICENSE_IMG =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300"><rect width="480" height="300" fill="#f2f0ea"/><text x="240" y="150" text-anchor="middle" fill="#877e72" font-size="22" font-weight="700">开户许可证</text></svg>'
    );

  var state = {
    view: 'hub', /* hub | form | detail */
    step: 0,
    draft: null
  };

  function $(id) {
    return document.getElementById(id);
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function toast(msg) {
    var shell = document.querySelector('.sa-ob-shell');
    var el = document.querySelector('.sa-ob-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'sa-ob-toast';
      (shell || document.body).appendChild(el);
    }
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.hidden = true;
    }, 1800);
  }

  function cloneObj(obj) {
    return JSON.parse(JSON.stringify(obj || {}));
  }

  function readAll() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}') || {};
    } catch (e) {
      return {};
    }
  }

  function writeAll(all) {
    try {
      localStorage.setItem(KEY, JSON.stringify(all || {}));
    } catch (e) {
      /* ignore */
    }
  }

  function getRecord() {
    return readAll()[RECORD_KEY] || null;
  }

  function saveRecord(patch) {
    var all = readAll();
    var prev = all[RECORD_KEY] || {};
    all[RECORD_KEY] = Object.assign({}, prev, patch, {
      recordKey: RECORD_KEY,
      key: RECORD_KEY,
      updatedAt: Date.now()
    });
    writeAll(all);
    return all[RECORD_KEY];
  }

  function makeDraft(fromRecord) {
    var fields = (fromRecord && fromRecord.fields) || {};
    var base = {
      bind_type: '门店',
      bind_subject_id: '',
      bind_store_id: STORE.id,
      short_name: fields.short_name || STORE.shortName,
      receipt_name: fields.receipt_name || STORE.shortName,
      detail_addr: fields.detail_addr || STORE.address,
      legal_mobile_no: fields.legal_mobile_no || STORE.phone,
      contact_mobile_no: fields.contact_mobile_no || STORE.phone,
      contact_email: fields.contact_email || 'store@lf-demo.com',
      card_info: {
        account_name: (fields.card_info && fields.card_info.account_name) || STORE.settlementAccountName,
        card_no: (fields.card_info && fields.card_info.card_no) || STORE.bankAccount,
        bank_name: (fields.card_info && fields.card_info.bank_name) || STORE.bankName,
        bank_branch: (fields.card_info && fields.card_info.bank_branch) || STORE.branchName
      },
      /* 执照/法人：门店档案已有，演示默认已带出（与 BD 一致） */
      license_pic: fields.license_pic != null ? fields.license_pic : true,
      legal_cert_front_pic: fields.legal_cert_front_pic != null ? fields.legal_cert_front_pic : true,
      legal_cert_back_pic: fields.legal_cert_back_pic != null ? fields.legal_cert_back_pic : true,
      open_license_pic: fields.open_license_pic != null ? fields.open_license_pic : '',
      store_header_pic: fields.store_header_pic || '',
      store_indoor_pic: fields.store_indoor_pic || '',
      store_cashier_desk_pic: fields.store_cashier_desk_pic || ''
    };
    return base;
  }

  function getDraftField(path) {
    var cur = state.draft || {};
    String(path || '')
      .split('.')
      .forEach(function (k) {
        if (cur == null) return;
        cur = cur[k];
      });
    return cur == null ? '' : cur;
  }

  function setDraftField(path, value) {
    if (!state.draft) state.draft = makeDraft(getRecord());
    var keys = String(path || '').split('.');
    var cur = state.draft;
    for (var i = 0; i < keys.length - 1; i++) {
      if (!cur[keys[i]] || typeof cur[keys[i]] !== 'object') cur[keys[i]] = {};
      cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]] = value;
  }

  function displayMeta(rec) {
    if (!rec) {
      return {
        phase: 'none',
        badge: '未进件',
        title: '尚未提交进件资料',
        desc: ''
      };
    }
    if (rec.status === 'draft') {
      return {
        phase: 'draft',
        badge: '草稿',
        title: '进件资料未提交',
        desc: '已保存草稿，可继续完善后提交审核。'
      };
    }
    if (rec.auditStatus === '审核成功' || rec.status === 'approved') {
      return {
        phase: 'ok',
        badge: '进件成功',
        title: '进件已完成',
        desc: '汇付审核通过，本店进件流程结束，无需再次进件。'
      };
    }
    if (rec.auditStatus === '审核失败' || rec.status === 'rejected') {
      return {
        phase: 'fail',
        badge: '进件失败',
        title: '审核未通过',
        desc: '请按驳回原因修改资料后重新提交。',
        rejectReason: rec.rejectReason || '资料不完整'
      };
    }
    return {
      phase: 'pending',
      badge: '进件中',
      title: rec.nextAuditNode ? '当前：' + rec.nextAuditNode : '审核中',
      desc: '资料已提交，请等待审核结果。'
    };
  }

  function flowState(rec) {
    var audit = (rec && rec.auditStatus) || '';
    var status = (rec && rec.status) || '';
    var current = -1;
    if (!rec || status === 'draft') current = 0;
    else if (audit === '待BD审核') current = 1;
    else if (audit === '待总监审核') current = 2;
    else if (audit === '待财务审核') current = 3;
    else if (audit === '待汇付审核') current = 4;
    else if (audit === '审核成功' || status === 'approved') current = 5;
    else if (audit === '审核失败' || status === 'rejected') {
      /* 驳回停在发起后的审核环节，标失败 */
      current = 1;
    }
    return FLOW.map(function (node, idx) {
      var cls = 'is-todo';
      if (audit === '审核失败' || status === 'rejected') {
        if (idx === 0) cls = 'is-done';
        else if (idx === current) cls = 'is-fail';
      } else if (current >= 5) {
        cls = 'is-done';
      } else if (idx < current) {
        cls = 'is-done';
      } else if (idx === current) {
        cls = status === 'draft' || !rec ? 'is-current' : 'is-current';
      }
      return { node: node, cls: cls, idx: idx };
    });
  }

  function canEdit(rec) {
    if (!rec) return true;
    if (rec.status === 'draft') return true;
    if (rec.auditStatus === '审核失败' || rec.status === 'rejected') return true;
    return false;
  }

  function canViewOnceDone(rec) {
    return !!(rec && (rec.auditStatus === '审核成功' || rec.status === 'approved'));
  }

  function formatTs(ts) {
    if (!ts) return '—';
    var d = new Date(ts);
    if (isNaN(d.getTime())) return '—';
    return (
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0') +
      ' ' +
      String(d.getHours()).padStart(2, '0') +
      ':' +
      String(d.getMinutes()).padStart(2, '0')
    );
  }

  function nz(v) {
    var t = String(v == null ? '' : v).trim();
    return t ? t : '—';
  }

  function detailRow(label, val) {
    return (
      '<div style="display:flex;gap:10px;padding:12px 0;border-bottom:1px solid rgba(229,231,235,.6)">' +
      '<span style="width:6.8rem;flex-shrink:0;font-size:12px;color:var(--bd-muted);padding-top:2px">' +
      esc(label) +
      '</span>' +
      '<div style="flex:1;text-align:right;font-size:13px;font-weight:600;line-height:1.4;word-break:break-word">' +
      val +
      '</div></div>'
    );
  }

  function sectionCard(title, sub, inner) {
    return (
      '<div class="bd-archive-card" style="margin-bottom:12px">' +
      '<div style="padding:11px 14px;background:rgba(249,250,251,.85);border-bottom:1px solid var(--bd-border)">' +
      '<h3 style="margin:0;font-size:14px;font-weight:700">' +
      esc(title) +
      '</h3>' +
      (sub
        ? '<p style="margin:4px 0 0;font-size:11px;color:var(--bd-muted);line-height:1.35">' +
          esc(sub) +
          '</p>'
        : '') +
      '</div>' +
      '<div style="padding:0 14px 6px">' +
      inner +
      '</div></div>'
    );
  }

  function onboardingUploadText(flag) {
    return flag ? '已上传' : '待上传';
  }

  /* ——— 表单渲染（对齐 BD APP） ——— */

  function formModuleCard(title, inner) {
    return (
      '<div class="bd-archive-card bd-form-module-card" style="margin-bottom:12px">' +
      '<div style="padding:11px 14px;background:rgba(249,250,251,.85);border-bottom:1px solid var(--bd-border)">' +
      '<h3 style="margin:0;font-size:14px;font-weight:700">' +
      esc(title) +
      '</h3></div>' +
      '<div class="bd-form-module-body">' +
      inner +
      '</div></div>'
    );
  }

  function licenseParamRow(label, value, required) {
    return (
      '<div class="bd-license-param-row">' +
      '<span class="bd-license-param-label">' +
      (required ? '<i>*</i>' : '') +
      esc(label) +
      '</span><strong>' +
      esc(value || '—') +
      '</strong></div>'
    );
  }

  function photoCard(title, desc, src) {
    return (
      '<div class="bd-license-photo-card">' +
      '<div class="bd-license-photo-copy"><h3>' +
      esc(title) +
      '</h3><p><i>*</i> ' +
      esc(desc) +
      '</p></div>' +
      '<button type="button" class="bd-license-photo-frame" data-ob-preview="' +
      esc(src) +
      '">' +
      '<span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>' +
      '<img src="' +
      esc(src) +
      '" alt="' +
      esc(title) +
      '">' +
      '<span class="bd-license-view">查看图片</span></button></div>'
    );
  }

  function fieldFull(label, id, placeholder, value, draftKey) {
    return (
      '<label style="display:block;margin-bottom:14px;font-size:13px;font-weight:600;color:var(--bd-text)">' +
      '<i style="margin-right:4px;color:var(--bd-destructive);font-style:normal;font-weight:900">*</i>' +
      esc(label) +
      '<input id="' +
      id +
      '" placeholder="' +
      esc(placeholder || '') +
      '" value="' +
      esc(value || '') +
      '" data-ob-field="' +
      esc(draftKey) +
      '" style="display:block;width:100%;margin-top:6px;padding:11px;border:1px solid var(--bd-border);border-radius:12px;font-size:14px;font-weight:400"/></label>'
    );
  }

  function uploadCard(label, key) {
    var current = getDraftField(key);
    var uploaded = !!current;
    var src =
      typeof current === 'string' && /^(data:image|https?:\/\/)/.test(current) ? current : uploaded ? DEMO_IMG : '';
    return (
      '<div style="border:1px solid var(--bd-border);border-radius:12px;padding:12px;background:#fff">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px">' +
      '<span style="font-size:13px;font-weight:700"><i style="margin-right:4px;color:var(--bd-destructive);font-style:normal;font-weight:900">*</i>' +
      esc(label) +
      '</span>' +
      '<span style="font-size:11px;padding:2px 8px;border-radius:999px;background:' +
      (uploaded ? 'rgba(22,163,74,.12);color:#15803d' : 'rgba(148,163,184,.12);color:#64748b') +
      '">' +
      (uploaded ? '已上传' : '未上传') +
      '</span></div>' +
      '<div style="margin-top:8px;font-size:11px;color:var(--bd-muted)">点击上传（演示）</div>' +
      (uploaded
        ? '<button type="button" data-ob-preview="' +
          esc(src) +
          '" style="margin-top:10px;width:100%;border:none;background:none;padding:0;cursor:pointer;text-align:left">' +
          '<div style="position:relative;width:100%;aspect-ratio:16/10;border-radius:10px;overflow:hidden;border:1px solid var(--bd-border);background:#f8fafc">' +
          '<img src="' +
          esc(src) +
          '" alt="" style="width:100%;height:100%;object-fit:cover;display:block"/>' +
          '<span style="position:absolute;right:10px;bottom:10px;font-size:10px;background:rgba(255,255,255,.95);padding:3px 8px;border-radius:6px;color:var(--bd-muted)">点击放大</span>' +
          '</div></button>'
        : '') +
      '<div style="margin-top:10px;display:flex;justify-content:flex-end">' +
      '<button type="button" class="bd-btn bd-btn-outline" data-ob-upload="' +
      esc(key) +
      '" style="border-radius:10px;box-shadow:none;padding:6px 12px;font-size:12px">' +
      (uploaded ? '更换照片' : '上传照片') +
      '</button></div></div>'
    );
  }

  function renderSteps() {
    return (
      '<div class="bd-onboard-steps">' +
      STEPS.map(function (label, idx) {
        return (
          '<button type="button" class="' +
          (idx === state.step ? 'active' : idx < state.step ? 'done' : '') +
          '" data-ob-step="' +
          idx +
          '"><span>' +
          (idx + 1) +
          '</span><em>' +
          esc(label) +
          '</em></button>'
        );
      }).join('') +
      '</div>'
    );
  }

  function renderStepBody() {
    if (state.step === 0) {
      return (
        formModuleCard(
          '营业执照信息',
          photoCard('营业执照', '上传营业执照', BUSINESS_LICENSE_IMG) +
            '<div class="bd-license-param-card">' +
            licenseParamRow('营业执照名称', STORE.licenseName, true) +
            licenseParamRow('证件代码', STORE.registrationCode, true) +
            licenseParamRow('执照起始日期', STORE.licenseValidFrom, true) +
            licenseParamRow('执照有效期', STORE.licenseValidTo === '长期' ? '长期有效' : STORE.licenseValidTo, true) +
            licenseParamRow('注册地址', STORE.registeredAddress, true) +
            '</div>'
        ) +
        formModuleCard(
          '法人基本信息',
          '<div class="bd-legal-cert-type-card"><span><i>*</i>证件类型</span><strong>身份证</strong><b>›</b></div>' +
            '<div class="bd-license-photo-card bd-id-photo-card">' +
            '<div class="bd-license-photo-copy"><h3>人像面</h3><p><i>*</i> 上传身份证人像面</p></div>' +
            '<button type="button" class="bd-license-photo-frame bd-id-photo-frame" data-ob-preview="' +
            esc(LEGAL_ID_FRONT_IMG) +
            '"><span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span><img src="' +
            esc(LEGAL_ID_FRONT_IMG) +
            '" alt="人像面"><span class="bd-license-view">查看图片</span></button></div>' +
            '<div class="bd-license-photo-card bd-id-photo-card">' +
            '<div class="bd-license-photo-copy"><h3>国徽面</h3><p><i>*</i> 上传身份证国徽面</p></div>' +
            '<button type="button" class="bd-license-photo-frame bd-id-photo-frame" data-ob-preview="' +
            esc(LEGAL_ID_BACK_IMG) +
            '"><span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span><img src="' +
            esc(LEGAL_ID_BACK_IMG) +
            '" alt="国徽面"><span class="bd-license-view">查看图片</span></button></div>' +
            '<div class="bd-license-param-card bd-id-param-card">' +
            licenseParamRow('法人姓名', STORE.legalPerson, true) +
            licenseParamRow('身份证号', STORE.idNumber, true) +
            licenseParamRow('身份证起始日期', STORE.idValidFrom, true) +
            licenseParamRow('身份证有效期', STORE.idValidTo, true) +
            '</div>'
        )
      );
    }
    if (state.step === 1) {
      return (
        formModuleCard(
          '商户信息',
          '<div style="margin-bottom:14px;padding:12px;border-radius:12px;background:#fafafa;border:1px solid var(--bd-border)">' +
            '<div style="font-size:12px;color:var(--bd-muted);margin-bottom:4px">进件类型</div>' +
            '<div style="font-size:14px;font-weight:700">门店 · ' +
            esc(STORE.name) +
            '（' +
            esc(STORE.id) +
            '）</div>' +
            '<div style="margin-top:6px;font-size:11px;color:var(--bd-muted)">门店端固定绑定本店，无需选择</div></div>' +
            fieldFull('商户简称', 'on_short_name', '账单展示名称', getDraftField('short_name'), 'short_name') +
            fieldFull('小票名称', 'on_receipt_name', '小票展示名称', getDraftField('receipt_name'), 'receipt_name') +
            fieldFull('实际经营地址', 'on_detail_addr', '经营详细地址', getDraftField('detail_addr'), 'detail_addr') +
            fieldFull('法人手机号', 'on_legal_mobile_no', '法人联系方式', getDraftField('legal_mobile_no'), 'legal_mobile_no')
        ) +
        formModuleCard(
          '联系人信息',
          fieldFull(
            '管理员手机号',
            'on_contact_mobile_no',
            '登录/通知手机号',
            getDraftField('contact_mobile_no'),
            'contact_mobile_no'
          ) +
            fieldFull('管理员邮箱', 'on_contact_email', '汇付通知邮箱', getDraftField('contact_email'), 'contact_email')
        )
      );
    }
    if (state.step === 2) {
      var openSrc =
        typeof getDraftField('open_license_pic') === 'string' &&
        /^(data:image|https?:\/\/)/.test(getDraftField('open_license_pic'))
          ? getDraftField('open_license_pic')
          : OPEN_LICENSE_IMG;
      return formModuleCard(
        '开户许可证',
        '<div class="bd-license-photo-card bd-open-license-card">' +
          '<div class="bd-license-photo-copy"><h3>开户许可证</h3><p><i>*</i> 上传开户许可证</p>' +
          '<button type="button" class="bd-open-license-upload" data-ob-upload="open_license_pic">更换图片</button></div>' +
          '<button type="button" class="bd-license-photo-frame bd-open-license-frame" data-ob-preview="' +
          esc(openSrc) +
          '"><span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span><img src="' +
          esc(openSrc) +
          '" alt="开户许可证"><span class="bd-license-view">查看图片</span></button></div>' +
          '<div class="bd-open-license-bank-fields editable">' +
          fieldFull(
            '开户名',
            'on_card_account_name',
            '银行卡户名',
            getDraftField('card_info.account_name'),
            'card_info.account_name'
          ) +
          fieldFull('银行卡号', 'on_card_no', '结算账户', getDraftField('card_info.card_no'), 'card_info.card_no') +
          fieldFull(
            '开户银行',
            'on_card_bank_name',
            '银行名称',
            getDraftField('card_info.bank_name'),
            'card_info.bank_name'
          ) +
          fieldFull(
            '开户支行',
            'on_card_branch_name',
            '支行名称',
            getDraftField('card_info.bank_branch'),
            'card_info.bank_branch'
          ) +
          '</div>'
      );
    }
    return formModuleCard(
      '门店场地',
      '<div style="display:flex;flex-direction:column;gap:10px">' +
        uploadCard('门头/场地照 F22', 'store_header_pic') +
        uploadCard('内景/工作区域照 F24', 'store_indoor_pic') +
        uploadCard('收银台/前台照 F105', 'store_cashier_desk_pic') +
        '</div>'
    );
  }

  function fieldLabelMap(key) {
    var map = {
      short_name: '商户简称',
      receipt_name: '小票名称',
      detail_addr: '实际经营地址',
      legal_mobile_no: '法人手机号',
      contact_mobile_no: '管理员手机号',
      contact_email: '管理员邮箱',
      'card_info.account_name': '开户名',
      'card_info.card_no': '银行卡号',
      'card_info.bank_name': '开户银行',
      'card_info.bank_branch': '开户支行',
      open_license_pic: '开户许可证',
      license_pic: '营业执照',
      legal_cert_front_pic: '法人身份证人像面',
      legal_cert_back_pic: '法人身份证国徽面',
      store_header_pic: '门头/场地照',
      store_indoor_pic: '内景/工作区域照',
      store_cashier_desk_pic: '收银台/前台照'
    };
    return map[key] || key;
  }

  function requiredStepFields(step) {
    if (step === 0) return ['license_pic', 'legal_cert_front_pic', 'legal_cert_back_pic'];
    if (step === 1) {
      return ['short_name', 'receipt_name', 'detail_addr', 'legal_mobile_no', 'contact_mobile_no', 'contact_email'];
    }
    if (step === 2) {
      return [
        'card_info.account_name',
        'card_info.card_no',
        'card_info.bank_name',
        'card_info.bank_branch',
        'open_license_pic'
      ];
    }
    if (step === 3) return ['store_header_pic', 'store_indoor_pic', 'store_cashier_desk_pic'];
    return [];
  }

  function validateStep(step) {
    var req = requiredStepFields(step);
    for (var i = 0; i < req.length; i++) {
      var k = req[i];
      var v = getDraftField(k);
      if (typeof v === 'boolean') {
        if (!v) {
          toast('请补全' + fieldLabelMap(k));
          return false;
        }
      } else if (!String(v || '').trim()) {
        toast('请填写' + fieldLabelMap(k));
        return false;
      }
    }
    return true;
  }

  /** 商户详情（对齐 BD APP mdm_bd_merchants 详情，只读） */
  function renderDetail() {
    var rec = getRecord() || {};
    var ob = rec.fields || makeDraft(rec);
    var shortName = ob.short_name || STORE.shortName;
    var openSrc =
      typeof ob.open_license_pic === 'string' && /^(data:image|https?:\/\/)/.test(ob.open_license_pic)
        ? ob.open_license_pic
        : OPEN_LICENSE_IMG;
    var card = ob.card_info || {};

    var headerTop =
      '<div style="border:1px solid var(--bd-border);border-radius:16px;padding:14px;background:#fff;margin-bottom:12px;box-shadow:0 1px 10px rgba(15,23,42,.06)">' +
      '<p style="margin:0;font-size:15px;font-weight:800;line-height:1.3">' +
      esc(nz(STORE.licenseName || STORE.name)) +
      '</p>' +
      '<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:10px;font-size:11px;color:var(--bd-muted);align-items:center">' +
      '<span>商户编号 ' +
      esc(nz(STORE.merchantNo)) +
      '</span>' +
      '<button type="button" data-ob-copy="' +
      esc(nz(STORE.merchantNo)) +
      '" style="border:none;background:rgba(255,106,0,.1);color:#ff6a00;font-size:10px;padding:3px 8px;border-radius:6px;cursor:pointer">复制</button></div>' +
      '<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:8px;font-size:11px;align-items:center">' +
      '<span>简称 ' +
      esc(nz(shortName)) +
      '</span>' +
      '<span style="font-size:10px;font-weight:700;padding:4px 9px;border-radius:999px;white-space:nowrap;background:rgba(22,163,74,.12);color:#15803d">进件成功</span></div></div>';

    var onboardInfoInner =
      detailRow('审核环节', esc('汇付审核通过')) +
      detailRow('进件渠道', esc(nz(rec.channel || STORE.channel))) +
      detailRow('创建时间', esc(nz(formatTs(rec.submittedAt || rec.updatedAt)))) +
      detailRow('提交汇付时间', esc(nz(formatTs(rec.submittedAt)))) +
      detailRow('汇付审核完成时间', esc(nz(formatTs(rec.onboardingCompletedAt || rec.updatedAt)))) +
      detailRow('MCC行业', esc(nz(STORE.mccIndustry))) +
      detailRow('请求流水号', esc(nz(STORE.reqSeqId))) +
      detailRow('外部商户号', esc(nz(STORE.extMerId))) +
      detailRow('创建人', esc(nz(rec.createdBy || STORE.creator))) +
      detailRow('备注', esc(nz(rec.remarks || '全链路审核通过')));

    var relationInner =
      detailRow('进件类型', esc(nz(ob.bind_type || '门店'))) +
      detailRow('绑定门店', esc(nz(STORE.name + ' · ' + STORE.id))) +
      detailRow('上级汇付号', esc(nz(STORE.headHuifuId))) +
      detailRow('结算主体类型', esc(nz(rec.settlementBodyType || STORE.settlementBodyType)));

    var opInner =
      detailRow('商户简称', esc(nz(ob.short_name || STORE.shortName))) +
      detailRow('小票名称', esc(nz(ob.receipt_name || STORE.shortName))) +
      detailRow('场景类型', esc(nz(STORE.sceneType))) +
      detailRow('经营类型', esc(nz(STORE.businessType)));

    var contactInner =
      detailRow('管理员姓名', esc(nz(STORE.contactName))) +
      detailRow('管理员手机号', esc(nz(ob.contact_mobile_no || STORE.phone))) +
      detailRow('管理员邮箱', esc(nz(ob.contact_email))) +
      detailRow('登录账号', esc(nz(STORE.loginAccount)));

    var placeInner =
      detailRow('经营场所名称', esc(nz(STORE.name))) +
      detailRow('门头/场地照', esc(onboardingUploadText(ob.store_header_pic))) +
      detailRow('内景/工作区域照', esc(onboardingUploadText(ob.store_indoor_pic))) +
      detailRow('收银台/前台照', esc(onboardingUploadText(ob.store_cashier_desk_pic)));

    var licenseBlock =
      formModuleCard(
        '营业执照信息',
        photoCard('营业执照', '上传营业执照', BUSINESS_LICENSE_IMG) +
          '<div class="bd-license-param-card">' +
          licenseParamRow('营业执照名称', STORE.licenseName, true) +
          licenseParamRow('证件代码', STORE.registrationCode, true) +
          licenseParamRow('执照起始日期', STORE.licenseValidFrom, true) +
          licenseParamRow(
            '执照有效期',
            STORE.licenseValidTo === '长期' ? '长期有效' : STORE.licenseValidTo,
            true
          ) +
          licenseParamRow('注册地址', STORE.registeredAddress, true) +
          '</div>'
      ) +
      formModuleCard(
        '法人基本信息',
        '<div class="bd-legal-cert-type-card"><span><i>*</i>证件类型</span><strong>身份证</strong><b>›</b></div>' +
          '<div class="bd-license-photo-card bd-id-photo-card">' +
          '<div class="bd-license-photo-copy"><h3>人像面</h3><p><i>*</i> 上传身份证人像面</p></div>' +
          '<button type="button" class="bd-license-photo-frame bd-id-photo-frame" data-ob-preview="' +
          esc(LEGAL_ID_FRONT_IMG) +
          '"><span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span><img src="' +
          esc(LEGAL_ID_FRONT_IMG) +
          '" alt="人像面"><span class="bd-license-view">查看图片</span></button></div>' +
          '<div class="bd-license-photo-card bd-id-photo-card">' +
          '<div class="bd-license-photo-copy"><h3>国徽面</h3><p><i>*</i> 上传身份证国徽面</p></div>' +
          '<button type="button" class="bd-license-photo-frame bd-id-photo-frame" data-ob-preview="' +
          esc(LEGAL_ID_BACK_IMG) +
          '"><span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span><img src="' +
          esc(LEGAL_ID_BACK_IMG) +
          '" alt="国徽面"><span class="bd-license-view">查看图片</span></button></div>' +
          '<div class="bd-license-param-card bd-id-param-card">' +
          licenseParamRow('法人姓名', STORE.legalPerson, true) +
          licenseParamRow('身份证号', STORE.idNumber, true) +
          licenseParamRow('身份证起始日期', STORE.idValidFrom, true) +
          licenseParamRow('身份证有效期', STORE.idValidTo, true) +
          '</div>'
      );

    var openBlock = formModuleCard(
      '开户许可证',
      '<div class="bd-license-photo-card bd-open-license-card">' +
        '<div class="bd-license-photo-copy"><h3>开户许可证</h3><p><i>*</i> 上传开户许可证</p></div>' +
        '<button type="button" class="bd-license-photo-frame bd-open-license-frame" data-ob-preview="' +
        esc(openSrc) +
        '"><span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span><img src="' +
        esc(openSrc) +
        '" alt="开户许可证"><span class="bd-license-view">查看图片</span></button></div>' +
        '<div class="bd-open-license-bank-fields">' +
        licenseParamRow('开户名', card.account_name || STORE.settlementAccountName, true) +
        licenseParamRow('银行卡号', card.card_no || STORE.bankAccount, true) +
        licenseParamRow('开户银行', card.bank_name || STORE.bankName, true) +
        licenseParamRow('开户支行', card.bank_branch || STORE.branchName, true) +
        '</div>'
    );

    return (
      '<header class="sa-ob-nav">' +
      '<a href="home.html" class="sa-ob-nav__back" aria-label="返回">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 6l-6 6 6 6"/></svg></a>' +
      '<h1 class="sa-ob-nav__title">商户详情</h1></header>' +
      '<div class="sa-ob-scroll sa-ob-scroll--hub" style="padding-bottom:28px">' +
      headerTop +
      sectionCard('进件流程信息', '审核流转与关键时间', onboardInfoInner) +
      sectionCard('主体关系', '主体复用与结算关系', relationInner) +
      licenseBlock +
      sectionCard('经营配置', '商户经营基础信息', opInner) +
      sectionCard('联系人与账号', '管理员联系方式与登录账号', contactInner) +
      openBlock +
      sectionCard('经营场地资料', '场地名称与图片资料', placeInner) +
      '</div>'
    );
  }

  function renderHub() {
    var rec = getRecord();
    var meta = displayMeta(rec);
    var nodes = flowState(rec);
    var actions = '';
    if (canEdit(rec)) {
      actions =
        '<button type="button" class="sa-ob-btn sa-ob-btn--primary" id="saObGoForm">' +
        (meta.phase === 'fail' ? '修改并重新提交' : meta.phase === 'draft' ? '继续填写' : '填写进件资料') +
        '</button>';
    } else if (canViewOnceDone(rec)) {
      actions = '<button type="button" class="sa-ob-btn sa-ob-btn--ghost" id="saObViewDetail">查看商户详情</button>';
    } else {
      actions =
        '<button type="button" class="sa-ob-btn sa-ob-btn--ghost" disabled style="opacity:.55">审核中，暂不可修改</button>';
    }

    return (
      '<header class="sa-ob-nav">' +
      '<a href="home.html" class="sa-ob-nav__back" aria-label="返回">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 6l-6 6 6 6"/></svg></a>' +
      '<h1 class="sa-ob-nav__title">商户进件</h1></header>' +
      '<div class="sa-ob-scroll sa-ob-scroll--hub">' +
      '<section class="sa-ob-status">' +
      '<span class="sa-ob-status__badge is-' +
      meta.phase +
      '">' +
      esc(meta.badge) +
      '</span>' +
      '<h2 class="sa-ob-status__title">' +
      esc(meta.title) +
      '</h2>' +
      (meta.desc
        ? '<p class="sa-ob-status__desc">' + esc(meta.desc) + '</p>'
        : '') +
      (meta.rejectReason
        ? '<p class="sa-ob-status__reject">驳回原因：' + esc(meta.rejectReason) + '</p>'
        : '') +
      '</section>' +
      '<section class="sa-ob-flow">' +
      '<h3 class="sa-ob-flow__head">审核流程</h3>' +
      '<ul class="sa-ob-flow__list">' +
      nodes
        .map(function (n) {
          return (
            '<li class="' +
            n.cls +
            '"><span class="sa-ob-flow__dot">' +
            (n.cls === 'is-done' ? '✓' : n.idx + 1) +
            '</span><div class="sa-ob-flow__main"><div class="sa-ob-flow__name">' +
            esc(n.node.name) +
            '</div><div class="sa-ob-flow__tip">' +
            esc(n.node.tip) +
            '</div></div></li>'
          );
        })
        .join('') +
      '</ul></section>' +
      '<div class="sa-ob-hub-actions">' +
      actions +
      '</div></div>'
    );
  }

  function renderForm(readonly) {
    if (!state.draft) state.draft = makeDraft(getRecord());
    var footer = readonly
      ? '<div class="sa-ob-footer"><button type="button" class="bd-btn bd-btn-outline" data-ob-back-hub>返回</button></div>'
      : '<div class="sa-ob-footer">' +
        '<button type="button" class="bd-btn bd-btn-outline" data-ob-save>保存</button>' +
        (state.step > 0
          ? '<button type="button" class="bd-btn bd-btn-outline" data-ob-prev>上一步</button>'
          : '<button type="button" class="bd-btn bd-btn-outline" data-ob-back-hub>返回</button>') +
        (state.step < STEPS.length - 1
          ? '<button type="button" class="bd-btn bd-btn-primary" data-ob-next>下一步</button>'
          : '<button type="button" class="bd-btn bd-btn-primary" data-ob-submit>提交审核</button>') +
        '</div>';

    return (
      '<header class="sa-ob-nav">' +
      '<button type="button" class="sa-ob-nav__back" data-ob-back-hub aria-label="返回">‹</button>' +
      '<h1 class="sa-ob-nav__title">商户进件</h1></header>' +
      '<div class="sa-ob-scroll">' +
      (readonly ? '<p class="sa-ob-readonly-tip">进件已完成，资料只读查看</p>' : '') +
      renderSteps() +
      renderStepBody() +
      '</div>' +
      footer
    );
  }

  function mount() {
    var root = $('saObRoot');
    if (!root) return;
    var rec = getRecord();
    if (state.view === 'form' && !canEdit(rec) && !canViewOnceDone(rec)) {
      state.view = 'hub';
    }
    /* 进件成功默认进商户详情（与 BD APP 一致） */
    if (canViewOnceDone(rec) && state.view === 'hub') {
      state.view = 'detail';
    }
    if (state.view === 'form' && canViewOnceDone(rec) && !canEdit(rec)) {
      state.view = 'detail';
    }
    var html = renderHub();
    if (state.view === 'detail') html = renderDetail();
    else if (state.view === 'form') html = renderForm(false);
    root.innerHTML = html;
    wire();
  }

  function openForm() {
    var rec = getRecord();
    if (!canEdit(rec)) {
      if (canViewOnceDone(rec)) {
        state.view = 'detail';
        mount();
        return;
      }
      toast('当前状态不可修改');
      return;
    }
    state.view = 'form';
    state.step = 0;
    state.draft = makeDraft(rec);
    mount();
  }

  function openDetail() {
    state.view = 'detail';
    mount();
  }

  function saveDraft() {
    saveRecord({
      status: 'draft',
      title: '商户进件',
      variant: 'store',
      merchantShortName: getDraftField('short_name') || STORE.shortName,
      subjectName: STORE.subjectName,
      channel: '门店 APP',
      createdBy: '门店负责人',
      fields: cloneObj(state.draft),
      submittedAt: null,
      auditStatus: '',
      nextAuditNode: '',
      auditChain: '门店 -> BD -> 财务 -> 汇付'
    });
    toast('已保存草稿');
  }

  function submit() {
    for (var step = 0; step < STEPS.length; step++) {
      if (!validateStep(step)) {
        state.step = step;
        mount();
        return;
      }
    }
    var now = Date.now();
    /* 提交后进入审核；详情页仅在审核成功后展示。充值绑卡只需已提交证照。 */
    saveRecord({
      status: 'submitted',
      title: '商户进件',
      variant: 'store',
      merchantShortName: getDraftField('short_name') || STORE.shortName,
      subjectName: STORE.subjectName,
      settlementBodyType: STORE.settlementBodyType || '独立结算',
      channel: '门店 APP',
      createdBy: '门店负责人',
      fields: cloneObj(state.draft),
      submittedAt: now,
      auditStatus: '待BD审核',
      nextAuditNode: 'BD审核',
      auditChain: '门店 -> BD -> 财务 -> 汇付',
      remarks: '门店侧发起，待BD审核',
      rejectReason: '',
      identityVerifyFail: false
    });
    toast('提交成功，已进入审核');
    state.draft = null;
    state.view = 'hub';
    mount();
  }

  function wire() {
    var go = $('saObGoForm');
    if (go) {
      go.addEventListener('click', function () {
        openForm();
      });
    }
    var viewDetail = $('saObViewDetail');
    if (viewDetail) {
      viewDetail.addEventListener('click', openDetail);
    }

    document.querySelectorAll('[data-ob-back-hub]').forEach(function (el) {
      el.addEventListener('click', function () {
        var rec = getRecord();
        state.view = canViewOnceDone(rec) ? 'detail' : 'hub';
        mount();
      });
    });

    document.querySelectorAll('[data-ob-step]').forEach(function (b) {
      b.addEventListener('click', function () {
        var next = Number(b.getAttribute('data-ob-step'));
        if (isNaN(next) || next === state.step) return;
        if (next > state.step) {
          for (var s = state.step; s < next; s++) {
            if (!validateStep(s)) return;
          }
        }
        state.step = next;
        mount();
      });
    });

    document.querySelectorAll('[data-ob-prev]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.step = Math.max(0, state.step - 1);
        mount();
      });
    });

    document.querySelectorAll('[data-ob-next]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (!validateStep(state.step)) return;
        state.step = Math.min(STEPS.length - 1, state.step + 1);
        mount();
      });
    });

    document.querySelectorAll('[data-ob-save]').forEach(function (b) {
      b.addEventListener('click', saveDraft);
    });

    document.querySelectorAll('[data-ob-submit]').forEach(function (b) {
      b.addEventListener('click', submit);
    });

    document.querySelectorAll('[data-ob-field]').forEach(function (inp) {
      inp.addEventListener('input', function () {
        setDraftField(inp.getAttribute('data-ob-field'), inp.value);
      });
    });

    document.querySelectorAll('[data-ob-upload]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-ob-upload');
        var demoSrc = key === 'open_license_pic' ? OPEN_LICENSE_IMG : DEMO_IMG;
        setDraftField(key, demoSrc + '#up=' + Date.now());
        toast('已上传（演示）');
        mount();
      });
    });

    document.querySelectorAll('[data-ob-preview]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var src = btn.getAttribute('data-ob-preview') || DEMO_IMG;
        var img = $('saObImgView');
        var modal = $('saObImgModal');
        if (img) img.src = src;
        if (modal) modal.hidden = false;
      });
    });

    document.querySelectorAll('[data-ob-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var t = btn.getAttribute('data-ob-copy') || '';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(t).then(
            function () {
              toast('已复制');
            },
            function () {
              toast(t);
            }
          );
        } else {
          toast(t);
        }
      });
    });

    document.querySelectorAll('[data-ob-img-close]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var modal = $('saObImgModal');
        if (modal) modal.hidden = true;
      });
    });
    var modal = $('saObImgModal');
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) modal.hidden = true;
      });
    }
  }

  function clearStoreRecord() {
    var all = readAll();
    delete all[RECORD_KEY];
    writeAll(all);
  }

  function applyDemoQuery() {
    var params = new URLSearchParams(window.location.search);
    var demo = params.get('demo') || '';
    /* demo=clear 清空；demo=none 强制未申请；其余按持久化状态展示 */
    if (demo === 'clear' || demo === 'none') {
      clearStoreRecord();
      state.view = 'hub';
      return;
    }
    if (!demo) return;
    if (demo === 'pending') {
      state.draft = makeDraft(null);
      setDraftField('open_license_pic', OPEN_LICENSE_IMG);
      setDraftField('store_header_pic', DEMO_IMG);
      setDraftField('store_indoor_pic', DEMO_IMG);
      setDraftField('store_cashier_desk_pic', DEMO_IMG);
      saveRecord({
        status: 'submitted',
        title: '商户进件',
        variant: 'store',
        merchantShortName: STORE.shortName,
        subjectName: STORE.subjectName,
        channel: '门店 APP',
        createdBy: '门店负责人',
        fields: cloneObj(state.draft),
        submittedAt: Date.now() - 3600 * 1000,
        auditStatus: '待BD审核',
        nextAuditNode: 'BD审核',
        auditChain: '门店 -> BD -> 财务 -> 汇付'
      });
      state.draft = null;
    }
    if (demo === 'success') {
      state.draft = makeDraft(null);
      setDraftField('open_license_pic', OPEN_LICENSE_IMG);
      setDraftField('store_header_pic', DEMO_IMG);
      setDraftField('store_indoor_pic', DEMO_IMG);
      setDraftField('store_cashier_desk_pic', DEMO_IMG);
      saveRecord({
        status: 'approved',
        title: '商户进件',
        variant: 'store',
        merchantShortName: STORE.shortName,
        subjectName: STORE.subjectName,
        settlementBodyType: STORE.settlementBodyType,
        channel: '门店 APP',
        createdBy: STORE.creator,
        fields: cloneObj(state.draft),
        submittedAt: Date.now() - 86400000,
        auditStatus: '审核成功',
        nextAuditNode: '审核完成',
        onboardingCompletedAt: Date.now() - 80000000,
        remarks: '全链路审核通过'
      });
      state.draft = null;
      state.view = 'detail';
    }
    if (demo === 'fail') {
      state.draft = makeDraft(null);
      setDraftField('open_license_pic', OPEN_LICENSE_IMG);
      setDraftField('store_header_pic', DEMO_IMG);
      setDraftField('store_indoor_pic', DEMO_IMG);
      setDraftField('store_cashier_desk_pic', DEMO_IMG);
      saveRecord({
        status: 'rejected',
        title: '商户进件',
        variant: 'store',
        merchantShortName: STORE.shortName,
        subjectName: STORE.subjectName,
        channel: '门店 APP',
        fields: cloneObj(state.draft),
        submittedAt: Date.now() - 86400000,
        auditStatus: '审核失败',
        nextAuditNode: '审核驳回',
        rejectReason: '证照信息不完整，请补齐后重提'
      });
      state.draft = null;
    }
    /* 已提交但身份校验失败（演示绑卡拦截） */
    if (demo === 'idfail') {
      state.draft = makeDraft(null);
      setDraftField('open_license_pic', OPEN_LICENSE_IMG);
      setDraftField('store_header_pic', DEMO_IMG);
      setDraftField('store_indoor_pic', DEMO_IMG);
      setDraftField('store_cashier_desk_pic', DEMO_IMG);
      saveRecord({
        status: 'submitted',
        title: '商户进件',
        variant: 'store',
        merchantShortName: STORE.shortName,
        subjectName: STORE.subjectName,
        channel: '门店 APP',
        createdBy: '门店负责人',
        fields: cloneObj(state.draft),
        submittedAt: Date.now() - 3600 * 1000,
        auditStatus: '待BD审核',
        nextAuditNode: 'BD审核',
        identityVerifyFail: true
      });
      state.draft = null;
    }
  }

  applyDemoQuery();
  (function initView() {
    var params = new URLSearchParams(window.location.search);
    var qView = params.get('view') || '';
    var demo = params.get('demo') || '';
    var rec = getRecord();
    if (qView === 'hub' || qView === 'form' || qView === 'detail') {
      state.view = qView;
      return;
    }
    /* 审核成功 → 商户详情；否则状态页 */
    if (demo === 'success' || canViewOnceDone(rec)) {
      state.view = 'detail';
    } else {
      state.view = 'hub';
    }
  })();
  mount();
})();
