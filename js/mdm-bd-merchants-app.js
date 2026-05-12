(function () {
  var merchants = [];
  var myMerchants = [
    { id: 1, name: '茶百道-人民路店', status: '正常营业', date: '2024-01-15', revenue: '¥3,260', storeId: 'MD20240101', contact: '张经理', phone: '138****1234', address: '杭州市西湖区人民路88号' },
    { id: 2, name: '星辰咖啡馆', status: '正常营业', date: '2024-02-20', revenue: '¥2,180', storeId: 'MD20240035', contact: '王老板', phone: '139****5678', address: '杭州市拱墅区莫干山路166号' },
    { id: 3, name: '鲜果时光-中山店', status: '正常营业', date: '2024-03-01', revenue: '¥1,850', storeId: 'MD20240088', contact: '李店长', phone: '137****9012', address: '杭州市上城区中山中路200号' },
    { id: 4, name: '麦香面包坊', status: '审核中', date: '2024-03-25', revenue: '—', storeId: 'MD20240120', contact: '赵师傅', phone: '136****3456', address: '杭州市滨江区江南大道500号' },
    { id: 5, name: '老王烧烤', status: '正常营业', date: '2023-11-10', revenue: '¥4,520', storeId: 'MD20230188', contact: '王大叔', phone: '135****7890', address: '杭州市余杭区文一西路800号' },
    { id: 6, name: '川味小馆', status: '已暂停', date: '2023-09-05', revenue: '¥890', storeId: 'MD20230099', contact: '陈老板', phone: '133****2345', address: '杭州市萧山区市心中路300号' },
  ];
  var route = { view: 'list', tab: 'all', id: null };
  var search = '';
  var onboardStep = 0;
  var onboardDraft = null;
  var STEPS = ['执照信息', '商户信息', '结算信息', '门店场地'];

  var DEMO_IMG =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#e2e8f0"/><stop offset="100%" style="stop-color:#cbd5e1"/></linearGradient><rect fill="url(#g)" width="100%" height="100%" rx="8"/><text x="50%" y="50%" text-anchor="middle" fill="#64748b" font-size="13">证照演示图</text></svg>'
    );
  var BUSINESS_LICENSE_IMG =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300" viewBox="0 0 480 300"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#efe3c9"/><stop offset=".55" stop-color="#f8f1df"/><stop offset="1" stop-color="#dcccae"/></linearGradient><pattern id="wm" width="80" height="42" patternUnits="userSpaceOnUse"><text x="0" y="24" font-size="14" fill="#d6ba82" opacity=".32">SCJDG</text></pattern></defs><rect width="480" height="300" fill="#d8d8d8"/><rect x="25" y="24" width="430" height="252" rx="4" fill="url(#bg)" stroke="#9e9279" stroke-width="5"/><rect x="42" y="42" width="396" height="218" fill="url(#wm)" opacity=".8"/><circle cx="240" cy="48" r="22" fill="#d72929"/><text x="240" y="54" text-anchor="middle" font-size="12" fill="#ffe7aa">国徽</text><text x="240" y="93" text-anchor="middle" font-size="30" font-weight="700" fill="#6f4f26">营业执照</text><text x="240" y="119" text-anchor="middle" font-size="12" fill="#8b6f43">（副本）</text><g font-size="13" fill="#53483b"><text x="78" y="142">名称  云南立扬后勤管理服务有限公司</text><text x="78" y="166">类型  有限责任公司</text><text x="78" y="190">统一社会信用代码  91530602MADJAY451L</text><text x="78" y="214">住所  云南省昭通市昭阳区太平街道办事处昭通大道</text></g><g font-size="10" fill="#675a49"><text x="78" y="238">经营范围：单位后勤管理服务；餐饮管理；物业管理；日用百货销售。</text><text x="78" y="253">登记机关：昭通市昭阳区市场监督管理局</text></g><rect x="365" y="70" width="48" height="48" fill="#1f2937"/><rect x="371" y="76" width="8" height="8" fill="#fff"/><rect x="390" y="76" width="16" height="8" fill="#fff"/><rect x="371" y="96" width="16" height="16" fill="#fff"/><rect x="397" y="101" width="9" height="17" fill="#fff"/><circle cx="357" cy="230" r="34" fill="none" stroke="#c94b38" stroke-width="5" opacity=".75"/><text x="360" y="235" text-anchor="middle" font-size="11" fill="#c94b38" opacity=".85">登记机关</text><text x="385" y="257" font-size="12" fill="#675a49">2024年5月13日</text></svg>'
    );
  var LEGAL_ID_FRONT_IMG =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="420" height="260" viewBox="0 0 420 260"><defs><linearGradient id="card" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c7edf4"/><stop offset=".5" stop-color="#e6f8fb"/><stop offset="1" stop-color="#b9e1ef"/></linearGradient><pattern id="line" width="24" height="18" patternUnits="userSpaceOnUse"><path d="M0 14C8 6 15 23 24 10" fill="none" stroke="#8ccddf" stroke-width="1" opacity=".35"/></pattern></defs><rect width="420" height="260" rx="10" fill="url(#card)"/><rect width="420" height="260" rx="10" fill="url(#line)"/><g fill="#247c9a" font-size="15" font-weight="700"><text x="58" y="63">姓名  陈大华</text><text x="58" y="96">性别  男       民族  汉</text><text x="58" y="129">出生  1990 年 3 月 14 日</text><text x="58" y="163">住址  云南省昭通市昭阳区田坝乡</text><text x="100" y="187">幸福村民委员会上马发山村18号</text></g><rect x="292" y="48" width="90" height="112" rx="4" fill="#d8e8eb" stroke="#71bfd2" stroke-width="3"/><circle cx="337" cy="83" r="22" fill="#1f2937"/><path d="M300 158c9-37 65-37 74 0" fill="#7aa6ac"/><path d="M315 77c12-22 49-10 41 16-8 22-33 15-41-16z" fill="#111827" opacity=".45"/><g fill="#1e6c87"><text x="58" y="228" font-size="16" font-weight="700">公民身份号码</text><text x="183" y="229" font-size="19" font-weight="800" letter-spacing="2">532101199003145212</text></g></svg>'
    );
  var LEGAL_ID_BACK_IMG =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="420" height="260" viewBox="0 0 420 260"><defs><linearGradient id="card" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d2f0f2"/><stop offset=".55" stop-color="#f1fbfb"/><stop offset="1" stop-color="#bfe4eb"/></linearGradient><pattern id="wave" width="36" height="22" patternUnits="userSpaceOnUse"><path d="M0 16C12 4 24 26 36 10" fill="none" stroke="#8ec9d4" stroke-width="1" opacity=".32"/></pattern></defs><rect width="420" height="260" rx="10" fill="url(#card)"/><rect width="420" height="260" rx="10" fill="url(#wave)"/><circle cx="72" cy="76" r="34" fill="#d53b42"/><text x="72" y="83" text-anchor="middle" font-size="13" fill="#ffe6aa">国徽</text><text x="250" y="74" text-anchor="middle" font-size="22" fill="#333" font-weight="700" letter-spacing="8">中华人民共和国</text><text x="254" y="118" text-anchor="middle" font-size="36" fill="#333" font-weight="800" letter-spacing="12">居民身份证</text><g fill="#333" font-size="15" font-weight="700"><text x="115" y="178">签发机关  昭通市公安局昭阳分局</text><text x="115" y="211">有效期限  2022.03.07-2042.03.07</text></g></svg>'
    );
  var OPEN_LICENSE_IMG =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300" viewBox="0 0 480 300"><defs><linearGradient id="paper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f2f0ea"/><stop offset=".55" stop-color="#faf8f2"/><stop offset="1" stop-color="#ded9ce"/></linearGradient><pattern id="wave" width="36" height="22" patternUnits="userSpaceOnUse"><path d="M0 16C10 5 22 26 36 9" fill="none" stroke="#c9c2b6" stroke-width="1" opacity=".28"/></pattern></defs><rect width="480" height="300" fill="#e6e2d8"/><rect x="38" y="20" width="404" height="260" rx="2" fill="url(#paper)" stroke="#bfb7aa" stroke-width="2"/><rect x="38" y="20" width="404" height="260" fill="url(#wave)"/><g fill="#877e72" font-size="15"><text x="72" y="55">账户名称： 云南立扬后勤管理服务有限公司</text><text x="72" y="93">账号： 53050163613700000992</text><text x="72" y="131">开户银行： 中国建设银行股份有限公司昭通珠泉支行</text><text x="72" y="169">法定代表人： 陈大华</text><text x="72" y="207">基本存款账户编号： J3450003001011</text></g><circle cx="250" cy="229" r="47" fill="none" stroke="#bd3f47" stroke-width="6" opacity=".7"/><path d="M410 20c-18 54-18 142 0 260" fill="none" stroke="#cbc5bc" stroke-width="3"/><path d="M58 20v260" stroke="#85827d" stroke-width="3"/></svg>'
    );

  function $(s) {
    return document.querySelector(s);
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }
  function page(x) {
    return (window.bdPage || function (a) {
      return a;
    })(x);
  }

  function settlementAccountLabel(t) {
    switch (t) {
      case '对公':
        return '对公账户';
      case '对私法人':
        return '对私账户（法人结算）';
      case '对私非法人':
        return '对私账户（非法人结算）';
      default:
        return t || '—';
    }
  }

  function settlementCredLabel(m) {
    return m.settlementType === '对公' ? '开户许可证' : '银行卡照片';
  }

  function merchantById(id) {
    return merchants.find(function (x) {
      return String(x.id) === String(id);
    });
  }

  function merchantByShortName(shortName) {
    var q = String(shortName || '').trim();
    if (!q) return null;
    return merchants.find(function (x) {
      return (
        String(x.shortName || '').trim() === q ||
        String(x.name || '').trim() === q ||
        String(x.merchantNo || '').trim() === q
      );
    }) || null;
  }

  function ensureMerchantFromPayload(payload) {
    var p = payload || {};
    var shortName = String(p.shortName || p.name || '').trim();
    var byName = merchantByShortName(shortName);
    if (byName) {
      if (p.onboardingFields) byName.onboardingFields = cloneObj(p.onboardingFields);
      if (p.onboardingStatus) byName.onboardingStatus = p.onboardingStatus;
      if (p.onboardingSubmittedAt) byName.onboardingSubmittedAt = p.onboardingSubmittedAt;
      return byName;
    }
    var id = 'virtual-' + String(p.merchantNo || shortName || Date.now());
    var one = {
      id: id,
      name: p.name || shortName || '未命名商户',
      shortName: shortName || p.name || '—',
      businessLicense: '—',
      merchantNo: p.merchantNo || '—',
      status: p.onboardingStatus === 'submitted' ? '进件成功' : '审核中',
      rate: '—',
      paymentAuth: '—',
      channel: '汇付天下',
      applicationDate: p.onboardingSubmittedAt || '—',
      merchantDate: '—',
      contact: '—',
      phone: p.phone || '—',
      legalPerson: '—',
      idNumber: '—',
      industry: '—',
      address: p.address || '—',
      bankAccount: '—',
      bankName: '—',
      settlementType: '对公',
      merchantCategory: '—',
      licenseName: '—',
      registrationCode: '—',
      licenseValidFrom: '—',
      licenseValidTo: '—',
      licenseDocumentType: '—',
      registeredRegion: '—',
      registeredDetailAddress: '—',
      legalIdDocType: '—',
      idValidFrom: '—',
      idValidTo: '—',
      idIssuingAuthority: '—',
      operatingName: p.name || shortName || '—',
      operatingRegion: '—',
      operatingDetailAddress: p.address || '—',
      merchantTypeLabel: '—',
      settlementAccountName: '—',
      branchName: '—',
      isLegalPersonSettlement: true,
      storeName: p.name || shortName || '—',
      agreementType: '电子协议',
      eSignStatus: '—',
      realNameAuthStatus: '—',
      onboardingFields: cloneObj(p.onboardingFields || {}),
      onboardingStatus: p.onboardingStatus || '',
      onboardingSubmittedAt: p.onboardingSubmittedAt || '',
    };
    merchants.unshift(one);
    return one;
  }

  function cloneObj(obj) {
    return JSON.parse(JSON.stringify(obj || {}));
  }

  function buildOnboardingFieldsFromMerchant(src) {
    src = src || {};
    return {
      short_name: src.shortName || src.name || '',
      receipt_name: src.shortName || src.name || '',
      detail_addr: src.operatingDetailAddress || src.address || '',
      legal_mobile_no: '',
      contact_mobile_no: src.phone || '',
      contact_email: '',
      card_info: {
        account_name: src.settlementAccountName || '',
        card_no: src.bankAccount || '',
        bank_name: src.bankName || '',
        bank_branch: src.branchName || '',
      },
      license_pic: !!(src.licenseName || src.businessLicense || src.registrationCode),
      legal_cert_front_pic: !!(src.legalPerson || src.idNumber),
      legal_cert_back_pic: !!(src.legalPerson || src.idNumber),
      open_license_pic: !!(src.openLicencePic || src.settlementAccountName || src.bankAccount),
      store_header_pic: !!src.storeName,
      store_indoor_pic: false,
      store_cashier_desk_pic: false,
    };
  }

  function resolveOnboardingFields(src) {
    var base = buildOnboardingFieldsFromMerchant(src);
    var ext = src && src.onboardingFields ? src.onboardingFields : {};
    if (ext.short_name) base.short_name = ext.short_name;
    if (ext.receipt_name) base.receipt_name = ext.receipt_name;
    if (ext.detail_addr) base.detail_addr = ext.detail_addr;
    if (ext.legal_mobile_no) base.legal_mobile_no = ext.legal_mobile_no;
    if (ext.contact_mobile_no) base.contact_mobile_no = ext.contact_mobile_no;
    if (ext.contact_email) base.contact_email = ext.contact_email;
    if (ext.card_info) {
      base.card_info = {
        account_name: ext.card_info.account_name || base.card_info.account_name,
        card_no: ext.card_info.card_no || base.card_info.card_no,
        bank_name: ext.card_info.bank_name || base.card_info.bank_name,
        bank_branch: ext.card_info.bank_branch || base.card_info.bank_branch,
      };
    }
    ['license_pic', 'legal_cert_front_pic', 'legal_cert_back_pic', 'open_license_pic', 'store_header_pic', 'store_indoor_pic', 'store_cashier_desk_pic'].forEach(function (k) {
      if (typeof ext[k] === 'boolean' || typeof ext[k] === 'string') base[k] = ext[k];
    });
    if (window.MdmUnifiedOnboardingUi && typeof window.MdmUnifiedOnboardingUi.getSummary === 'function') {
      var key = 'bdapp::merchant::' + String((src && (src.merchantNo || src.id)) || '');
      var sum = window.MdmUnifiedOnboardingUi.getSummary(key, base);
      if (sum && sum.fields) {
        base = Object.assign({}, base, sum.fields);
        base.card_info = Object.assign({}, base.card_info || {}, sum.fields.card_info || {});
      }
    }
    return base;
  }

  function resolveOnboardingMeta(src) {
    var m = src || {};
    var out = {
      status: m.onboardingStatus || '',
      auditStatus: m.onboardingAuditStatus || '',
      nextAuditNode: m.onboardingNextAuditNode || '',
      submittedAt: m.onboardingSubmittedAt || '',
      updatedAt: m.onboardingUpdatedAt || '',
    };
    if (window.MdmUnifiedOnboardingUi && typeof window.MdmUnifiedOnboardingUi.getSummary === 'function') {
      var key = 'bdapp::merchant::' + String((m && (m.merchantNo || m.id)) || '');
      var sum = window.MdmUnifiedOnboardingUi.getSummary(key, {});
      if (sum && sum.status) out.status = sum.status;
      if (sum && sum.auditStatus) out.auditStatus = sum.auditStatus;
      if (sum && sum.nextAuditNode) out.nextAuditNode = sum.nextAuditNode;
      if (sum && sum.submittedAt) out.submittedAt = sum.submittedAt;
      if (sum && sum.updatedAt) out.updatedAt = sum.updatedAt;
    }
    return out;
  }

  function makeOnboardDraft() {
    var src = merchantById(route.id) || merchants[0] || {};
    return resolveOnboardingFields(src);
  }

  function goOnboardEditor() {
    if (!route.id && merchants.length) route.id = merchants[0].id;
    route.view = 'onboard';
    onboardStep = 0;
    onboardDraft = makeOnboardDraft();
    mount();
  }

  function filteredList() {
    return merchants.filter(function (m) {
      var q = search.trim();
      var ok = !q || m.name.includes(q) || (m.shortName && m.shortName.includes(q)) || m.merchantNo.includes(q);
      if (!ok) return false;
      if (route.tab === 'pending') return m.status === '待审核';
      if (route.tab === 'onboarding') return m.status === '审核中' || m.status === '已驳回';
      if (route.tab === 'settled') return m.status === '进件成功';
      return true;
    });
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
      (sub ? '<p style="margin:4px 0 0;font-size:11px;color:var(--bd-muted);line-height:1.35">' + esc(sub) + '</p>' : '') +
      '</div>' +
      '<div style="padding:0 14px 6px">' +
      inner +
      '</div></div>'
    );
  }

  function formModuleCard(title, inner) {
    return (
      '<div class="bd-archive-card bd-form-module-card" style="margin-bottom:12px">' +
      '<div style="padding:11px 14px;background:rgba(249,250,251,.85);border-bottom:1px solid var(--bd-border)">' +
      '<h3 style="margin:0;font-size:14px;font-weight:700">' +
      esc(title) +
      '</h3>' +
      '</div>' +
      '<div class="bd-form-module-body">' +
      inner +
      '</div></div>'
    );
  }

  function photoThumb(label) {
    return (
      '<button type="button" class="bd-mer-photo" data-mer-photo="1" style="width:100%;border:none;background:none;padding:12px 0;text-align:left;cursor:pointer">' +
      '<span style="display:block;font-size:11px;font-weight:600;color:var(--bd-muted);margin-bottom:8px">' +
      esc(label) +
      '</span>' +
      '<div style="position:relative;width:100%;aspect-ratio:16/10;border-radius:12px;border:1px solid var(--bd-border);overflow:hidden;background:#f8fafc">' +
      '<img src="' +
      DEMO_IMG +
      '" alt="" style="width:100%;height:100%;object-fit:cover"/>' +
      '<span style="position:absolute;bottom:10px;right:10px;font-size:9px;background:rgba(255,255,255,.94);padding:3px 8px;border-radius:6px;color:var(--bd-muted);font-weight:600">查看大图</span>' +
      '</div></button>'
    );
  }

  function businessLicenseData(m) {
    m = m || {};
    var validTo = m.licenseValidTo || m.licenseEndDate || '';
    return {
      name: m.licenseName || m.regName || m.name || '云南立扬后勤管理服务有限公司',
      code: m.registrationCode || m.licenseCode || m.businessLicense || '91530602MADJAY451L',
      startDate: m.licenseValidFrom || m.licenseBeginDate || m.foundDate || '2024-05-13',
      validDate: validTo === '长期' ? '长期有效' : validTo || '长期有效',
      address: m.registeredDetailAddress || m.regDetail || m.registeredRegion || '云南省昭通市昭阳区太平街道办事处昭通大道',
      image: BUSINESS_LICENSE_IMG,
    };
  }

  function licenseParamRow(label, value, required) {
    return (
      '<div class="bd-license-param-row">' +
      '<span class="bd-license-param-label">' +
      (required ? '<i>*</i>' : '') +
      esc(label) +
      '</span>' +
      '<strong>' +
      esc(value || '—') +
      '</strong></div>'
    );
  }

  function businessLicensePhotoCard(data) {
    return (
      '<div class="bd-license-photo-card">' +
      '<div class="bd-license-photo-copy">' +
      '<h3>营业执照</h3>' +
      '<p><i>*</i> 上传营业执照</p>' +
      '</div>' +
      '<button type="button" class="bd-license-photo-frame" data-on-preview="' +
      esc(data.image) +
      '">' +
      '<span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>' +
      '<img src="' +
      esc(data.image) +
      '" alt="营业执照">' +
      '<span class="bd-license-view">查看图片</span>' +
      '</button>' +
      '</div>'
    );
  }

  function renderBusinessLicenseInfo(m) {
    var data = businessLicenseData(m);
    return formModuleCard(
      '营业执照信息',
      businessLicensePhotoCard(data) +
      '<div class="bd-license-param-card">' +
      licenseParamRow('营业执照名称', data.name, true) +
      licenseParamRow('证件代码', data.code, true) +
      licenseParamRow('执照起始日期', data.startDate, true) +
      licenseParamRow('执照有效期', data.validDate, true) +
      licenseParamRow('注册地址', data.address, true) +
      '</div>'
    );
  }

  function legalIdData(m) {
    m = m || {};
    var validTo = m.idValidTo || m.legalCertEndDate || '2042-03-07';
    return {
      certType: m.legalCertType || m.legalIdDocType || '身份证',
      name: m.legalPerson || m.legalName || '陈大华',
      number: m.idNumber || m.legalCertNo || '532101199003145212',
      startDate: m.idValidFrom || m.legalCertBeginDate || '2022-03-07',
      validDate: validTo === '长期' ? '长期有效' : validTo,
      frontImage: LEGAL_ID_FRONT_IMG,
      backImage: LEGAL_ID_BACK_IMG,
    };
  }

  function legalIdPhotoCard(title, desc, src) {
    return (
      '<div class="bd-license-photo-card bd-id-photo-card">' +
      '<div class="bd-license-photo-copy">' +
      '<h3>' +
      esc(title) +
      '</h3>' +
      '<p><i>*</i> ' +
      esc(desc) +
      '</p>' +
      '</div>' +
      '<button type="button" class="bd-license-photo-frame bd-id-photo-frame" data-on-preview="' +
      esc(src) +
      '">' +
      '<span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>' +
      '<img src="' +
      esc(src) +
      '" alt="' +
      esc(title) +
      '">' +
      '<span class="bd-license-view">查看图片</span>' +
      '</button>' +
      '</div>'
    );
  }

  function renderLegalIdInfo(m) {
    var data = legalIdData(m);
    return formModuleCard(
      '法人基本信息',
      '<div class="bd-legal-cert-type-card">' +
      '<span><i>*</i>证件类型</span>' +
      '<strong>' +
      esc(data.certType) +
      '</strong><b>›</b></div>' +
      legalIdPhotoCard('人像面', '上传身份证人像面', data.frontImage) +
      legalIdPhotoCard('国徽面', '上传身份证国徽面', data.backImage) +
      '<div class="bd-license-param-card bd-id-param-card">' +
      licenseParamRow('法人姓名', data.name, true) +
      licenseParamRow('身份证号', data.number, true) +
      licenseParamRow('身份证起始日期', data.startDate, true) +
      licenseParamRow('身份证有效期', data.validDate, true) +
      '</div>'
    );
  }

  function openLicenseData(m, fields) {
    m = m || {};
    fields = fields || resolveOnboardingFields(m);
    var card = fields.card_info || {};
    var current = fields.open_license_pic || m.openLicencePic;
    var src =
      typeof current === 'string' && /^(data:image|https?:\/\/)/.test(current)
        ? current
        : OPEN_LICENSE_IMG;
    return {
      accountName: card.account_name || m.settlementAccountName || '云南立扬后勤管理服务有限公司',
      cardNo: card.card_no || m.bankAccount || '53050163613700000992',
      bankName: card.bank_name || m.bankName || '中国建设银行',
      bankBranch: card.bank_branch || m.branchName || '中国建设银行股份有限公司昭通珠泉支行',
      settlementType: m.settlementType || '对公',
      image: src,
    };
  }

  function renderOpenLicenseInfo(m, fields, editable) {
    var data = openLicenseData(m, fields);
    var bankFields = editable
      ? fieldFull('开户名', 'on_card_account_name', '银行卡户名', data.accountName, 'card_info.account_name') +
        fieldFull('银行卡号', 'on_card_no', '结算账户', data.cardNo, 'card_info.card_no') +
        fieldFull('开户银行', 'on_card_bank_name', '银行名称', data.bankName, 'card_info.bank_name') +
        fieldFull('开户支行', 'on_card_branch_name', '支行名称', data.bankBranch, 'card_info.bank_branch')
      : licenseParamRow('开户名', data.accountName, true) +
        licenseParamRow('银行卡号', data.cardNo, true) +
        licenseParamRow('开户银行', data.bankName, true) +
        licenseParamRow('开户支行', data.bankBranch, true);
    return formModuleCard(
      '开户许可证',
      '<div class="bd-license-photo-card bd-open-license-card">' +
      '<div class="bd-license-photo-copy">' +
      '<h3>开户许可证</h3>' +
      '<p><i>*</i> 上传开户许可证</p>' +
      (editable ? '<button type="button" class="bd-open-license-upload" data-on-upload="open_license_pic">更换图片</button>' : '') +
      '</div>' +
      '<button type="button" class="bd-license-photo-frame bd-open-license-frame" data-on-preview="' +
      esc(data.image) +
      '">' +
      '<span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>' +
      '<img src="' +
      esc(data.image) +
      '" alt="开户许可证">' +
      '<span class="bd-license-view">查看图片</span>' +
      '</button>' +
      '</div>' +
      '<div class="bd-open-license-bank-fields' +
      (editable ? ' editable' : '') +
      '">' +
      bankFields +
      '</div>'
    );
  }

  function renderList() {
    var pend = merchants.filter(function (m) {
      return m.status === '待审核';
    }).length;
    var onboard = merchants.filter(function (m) {
      return m.status === '审核中' || m.status === '已驳回';
    }).length;
    var ok = merchants.filter(function (m) {
      return m.status === '进件成功';
    }).length;
    var rows = filteredList();
    var sorted = rows
      .filter(function (m) {
        return m.status === '待审核';
      })
      .concat(
        rows.filter(function (m) {
          return m.status !== '待审核';
        })
      );
    var tabs = [
      { k: 'all', l: '全部', n: merchants.length },
      { k: 'pending', l: '待审核', n: pend },
      { k: 'onboarding', l: '进件中', n: onboard },
      { k: 'settled', l: '进件成功', n: ok },
    ];
    var th = tabs
      .map(function (t) {
        return (
          '<button type="button" class="bd-status-tab' +
          (route.tab === t.k ? ' bd-active' : '') +
          '" data-tab="' +
          t.k +
          '" style="flex:1;text-align:center">' +
          esc(t.l) +
          '<span class="c">' +
          t.n +
          '</span></button>'
        );
      })
      .join('');
    var cards = sorted
      .map(function (m) {
        return (
          '<div class="bd-store-card" data-mid="' +
          m.id +
          '" style="margin-bottom:10px;cursor:pointer">' +
          '<div style="padding:14px;display:flex;gap:12px">' +
          '<div style="width:42px;height:42px;border-radius:10px;background:var(--bd-primary-soft);display:flex;align-items:center;justify-content:center">🏪</div>' +
          '<div style="flex:1;min-width:0">' +
          '<div style="display:flex;gap:8px"><span style="font-size:14px;font-weight:700;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
          esc(m.name) +
          '</span>' +
          '<span style="font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px;white-space:nowrap' +
          statusStyle(m.status) +
          '">' +
          esc(m.status) +
          '</span></div>' +
          '<div style="font-size:11px;color:var(--bd-muted);margin-top:6px">商户编号 ' +
          esc(m.merchantNo) +
          '</div>' +
          '<div style="display:flex;gap:16px;margin-top:8px;font-size:11px;color:var(--bd-muted)">' +
          '<span>简称: ' +
          esc(m.shortName) +
          '</span></div>' +
          '<div style="display:flex;gap:16px;margin-top:4px;font-size:11px;color:var(--bd-muted)">' +
          '<span>渠道: ' +
          esc(m.channel) +
          '</span><span>进件: ' +
          esc(m.applicationDate) +
          '</span></div></div></div></div>'
        );
      })
      .join('');
    if (!cards) cards = '<div class="bd-empty" style="margin:16px">暂无商户数据</div>';
    return (
      '<div class="bd-page-bar"><button type="button" class="bd-back" data-home>‹</button><h1>商户进件</h1>' +
      '<button type="button" style="margin-left:auto;font-size:11px;border:1px solid var(--bd-border);padding:4px 10px;border-radius:8px;background:#fff;cursor:pointer" data-mym>我的商户</button></div>' +
      '<div class="bd-search-wrap" style="margin-top:4px"><input type="search" id="bdMerSearch" placeholder="搜索商户名称/编号" value="' +
      esc(search) +
      '"/></div>' +
      '<div class="bd-status-tabs" style="display:flex">' +
      th +
      '</div>' +
      '<div style="padding:12px 14px 96px">' +
      cards +
      '</div>' +
      '<div style="position:fixed;left:50%;transform:translateX(-50%);bottom:calc(12px + env(safe-area-inset-bottom, 0px));z-index:120;width:min(393px,100vw);display:flex;justify-content:flex-end;padding:0 16px;pointer-events:none">' +
      '<button type="button" class="bd-btn bd-btn-primary" data-onboard style="border-radius:999px;box-shadow:0 4px 16px rgba(37,99,235,.35);pointer-events:auto">＋ 商户进件</button></div>'
    );
  }

  function statusStyle(st) {
    if (st === '进件成功') return ';background:rgba(22,163,74,.12);color:#15803d';
    if (st === '待审核' || st === '审核中') return ';background:rgba(245,158,11,.15);color:#b45309';
    if (st === '已驳回') return ';background:rgba(220,38,38,.12);color:#b91c1c';
    return '';
  }

  function onboardingUploadText(flag) {
    return flag ? '已上传' : '待上传';
  }

  function onboardingCardInfoText(card) {
    var c = card || {};
    var parts = [];
    if (c.account_name) parts.push(c.account_name);
    if (c.card_no) parts.push(c.card_no);
    if (c.bank_name) parts.push(c.bank_name);
    if (c.bank_branch) parts.push(c.bank_branch);
    return parts.length ? parts.join(' / ') : '待填写';
  }

  function onboardingStatusText(st) {
    if (st === '待BD审核') return '待BD审核';
    if (st === '待财务审核') return '待财务审核';
    if (st === '待汇付审核') return '待汇付审核';
    if (st === '审核成功') return '审核成功';
    if (st === '审核失败') return '审核失败';
    if (st === 'submitted') return '已提交';
    if (st === 'draft') return '未提交';
    if (st === 'rejected') return '审核失败';
    return '未发起';
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

  function renderDetail(id) {
    var m = merchantById(id);
    if (!m)
      return (
        '<div class="bd-page-bar"><button type="button" class="bd-back" data-backlist>‹</button><h1>商户详情</h1></div><div class="bd-empty">商户不存在</div>'
      );
    var effPhase =
      m.reviewPhase || (m.status === '待审核' ? 'awaiting_bd' : undefined);
    var om = resolveOnboardingMeta(m);
    var bdCanAct = m.status === '待审核' && effPhase === 'awaiting_bd';
    var awaitingLeader = m.status === '审核中' && effPhase === 'awaiting_leader';
    var auditStepLabel =
      m.status === '待审核' && effPhase === 'awaiting_bd'
        ? 'BD 预审'
        : m.status === '审核中' && effPhase === 'awaiting_leader'
          ? 'BD 总监审核'
          : m.status === '审核中'
            ? (om.nextAuditNode || '财务审核')
            : m.status === '进件成功'
              ? '汇付审核通过'
              : m.status === '已驳回'
                ? '已驳回'
                : '—';
    var bottomPad =
      bdCanAct || awaitingLeader || m.status === '已驳回' ? 'calc(120px + env(safe-area-inset-bottom))' : '24px';

    var banner = '';
    if (m.status === '审核中' || awaitingLeader) {
      banner =
        '<div style="margin:12px;padding:11px;border-radius:12px;border:1px solid rgba(251,191,36,.65);background:rgba(254,249,231,.95);font-size:12px;line-height:1.55;margin-bottom:12px">' +
        '审核链路：<strong>商户提交</strong> → <strong>BD 预审（支持编辑）</strong> → <strong>BD 总监审核</strong> → <strong>财务审核</strong> → <strong>汇付系统审核</strong>。' +
        '对外仍为<strong>「审核中」</strong>；驳回/终审由商户负责人或BD操作。' +
        '</div>';
    }

    var ob = resolveOnboardingFields(m);
    function nz(v) {
      var t = String(v == null ? '' : v).trim();
      return t ? t : '—';
    }
    function maskMiddle(v) {
      var s = String(v == null ? '' : v).replace(/\s+/g, '');
      if (!s) return '—';
      if (s.length <= 7) return s;
      return s.slice(0, 3) + '****' + s.slice(-4);
    }
    function maskBank(v) {
      var s = String(v == null ? '' : v).replace(/\s+/g, '');
      if (!s) return '—';
      if (s.length <= 8) return s;
      return s.slice(0, 4) + ' **** **** ' + s.slice(-4);
    }
    function flowStatusText() {
      var a = om.auditStatus || '';
      if (a === '审核成功') return '成功';
      if (a === '审核失败') return '失败';
      if (a === '待BD审核' || a === '待总监审核' || a === '待财务审核' || a === '待汇付审核') return '审核中';
      if (om.status === 'draft') return '草稿';
      if (om.status === 'submitted') return '审核中';
      if (om.status === 'rejected') return '失败';
      return '草稿';
    }

    var headerTop =
      '<div style="border:1px solid var(--bd-border);border-radius:16px;padding:14px;background:#fff;margin-bottom:12px;box-shadow:0 1px 10px rgba(15,23,42,.06)">' +
      '<p style="margin:0;font-size:15px;font-weight:800;line-height:1.3">' +
      esc(nz(m.licenseName || m.name)) +
      '</p>' +
      '<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:10px;font-size:11px;color:var(--bd-muted);align-items:center">' +
      '<span>商户编号 ' +
      esc(nz(m.merchantNo)) +
      '</span>' +
      '<button type="button" data-copy-no="' +
      esc(nz(m.merchantNo)) +
      '" style="border:none;background:rgba(37,99,235,.08);color:var(--bd-primary);font-size:10px;padding:3px 8px;border-radius:6px;cursor:pointer">复制</button></div>' +
      '<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:8px;font-size:11px;align-items:center">' +
      '<span>简称 ' +
      esc(nz(ob.short_name || m.shortName)) +
      '</span>' +
      '<span style="font-size:10px;font-weight:700;padding:4px 9px;border-radius:999px;white-space:nowrap' +
      statusStyle(m.status) +
      '">' +
      esc(m.status) +
      '</span></div></div>';

    var onboardInfoInner =
      detailRow('审核环节', esc(nz(om.nextAuditNode || auditStepLabel))) +
      detailRow('进件渠道', esc(nz(m.onboardingChannel || m.channel || 'BD APP'))) +
      detailRow('创建时间', esc(nz(formatTs(m.onboardingCreatedAt || m.applicationDate)))) +
      detailRow('提交汇付时间', esc(nz(formatTs(om.submittedAt || m.onboardingSubmittedAt)))) +
      detailRow('汇付审核完成时间', esc(nz(formatTs(m.onboardingCompletedAt || m.huifuAuditCompletedAt)))) +
      detailRow('MCC行业', esc(nz(m.mccIndustry || m.industry))) +
      detailRow('请求流水号', esc(nz(m.reqSeqId))) +
      detailRow('外部商户号', esc(nz(m.extMerId))) +
      detailRow('创建人', esc(nz(m.creator || m.createdBy || m.contact))) +
      detailRow('备注', esc(nz(m.remarks)));

    var relationInner =
      detailRow('上级汇付号', esc(nz(m.headHuifuId))) +
      detailRow('结算主体类型', esc(nz(m.settlementBodyType || (m.isLegalPersonSettlement ? '独立结算' : '集团结算'))));

    var opInner =
      detailRow('商户简称', esc(nz(ob.short_name))) +
      detailRow('小票名称', esc(nz(ob.receipt_name))) +
      detailRow('场景类型', esc(nz(m.sceneType))) +
      detailRow('经营类型', esc(nz(m.businessType)));

    var contactInner =
      detailRow('管理员姓名', esc(nz(m.contactName || m.contact))) +
      detailRow('管理员手机号', esc(nz(ob.contact_mobile_no))) +
      detailRow('管理员邮箱', esc(nz(ob.contact_email))) +
      detailRow('登录账号', esc(nz(m.loginName || m.loginAccount)));

    var placeInner =
      detailRow('经营场所名称', esc(nz(m.storeName || m.operatingName || m.name))) +
      detailRow('门头/场地照', esc(onboardingUploadText(ob.store_header_pic))) +
      detailRow('内景/工作区域照', esc(onboardingUploadText(ob.store_indoor_pic))) +
      detailRow('收银台/前台照', esc(onboardingUploadText(ob.store_cashier_desk_pic)));

    var body =
      '<div class="bd-page-bar"><button type="button" class="bd-back" data-backlist>‹</button><h1>商户详情</h1></div>' +
      banner +
      '<div style="padding:12px;padding-bottom:' +
      bottomPad +
      '">' +
      headerTop +
      sectionCard('进件流程信息', '审核流转与关键时间', onboardInfoInner) +
      sectionCard('主体关系', '主体复用与结算关系', relationInner) +
      renderBusinessLicenseInfo(m) +
      renderLegalIdInfo(m) +
      sectionCard('经营配置', '商户经营基础信息', opInner) +
      sectionCard('联系人与账号', '管理员联系方式与登录账号', contactInner) +
      renderOpenLicenseInfo(m, ob) +
      sectionCard('经营场地资料', '场地名称与图片资料', placeInner) +
      '</div>';

    var bar = '';
    if (bdCanAct) {
      bar =
        '<div style="position:fixed;left:50%;transform:translateX(-50%);bottom:0;z-index:120;width:min(393px,100vw);border-top:1px solid var(--bd-border);background:rgba(255,255,255,.97);backdrop-filter:blur(8px);padding:12px;display:flex;gap:10px;padding-bottom:max(12px,env(safe-area-inset-bottom));box-shadow:0 -6px 18px rgba(15,23,42,.08)">' +
        '<button type="button" class="bd-btn bd-btn-outline" style="flex:1;border-radius:12px;box-shadow:none;color:var(--bd-destructive);border-color:rgba(248,113,113,.5)" data-mer-reject>驳回</button>' +
        '<button type="button" class="bd-btn bd-btn-primary" style="flex:1;border-radius:12px" data-mer-pass>审核通过</button>' +
        '<button type="button" class="bd-btn bd-btn-outline" style="flex:1;border-radius:12px;box-shadow:none" data-mer-edit>编辑</button>' +
        '</div>';
    } else if (awaitingLeader) {
      bar =
        '<div style="position:fixed;left:50%;transform:translateX(-50%);bottom:0;z-index:120;width:min(393px,100vw);border-top:1px solid var(--bd-border);background:rgba(255,255,255,.97);padding:12px;display:flex;gap:10px;padding-bottom:max(12px,env(safe-area-inset-bottom));box-shadow:0 -6px 18px rgba(15,23,42,.08)">' +
        '<button type="button" class="bd-btn bd-btn-outline" style="flex:1;border-radius:12px;box-shadow:none;opacity:.45" disabled>驳回</button>' +
        '<button type="button" class="bd-btn bd-btn-primary" style="flex:1;border-radius:12px;opacity:.45" disabled>审核通过</button>' +
        '</div>';
    } else if (m.status === '已驳回') {
      bar =
        '<div style="position:fixed;left:50%;transform:translateX(-50%);bottom:0;z-index:120;width:min(393px,100vw);border-top:1px solid var(--bd-border);background:rgba(255,255,255,.97);padding:12px;padding-bottom:max(12px,env(safe-area-inset-bottom));box-shadow:0 -6px 18px rgba(15,23,42,.08)">' +
        '<button type="button" class="bd-btn bd-btn-primary" style="width:100%;border-radius:12px" data-mer-resubmit>⟳ 重新提交</button></div>';
    }

    return body + bar;
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
      '"' +
      (draftKey ? ' data-on-field="' + esc(draftKey) + '"' : '') +
      ' style="display:block;width:100%;margin-top:6px;padding:11px;border:1px solid var(--bd-border);border-radius:12px;font-size:14px;font-weight:400"/></label>'
    );
  }

  function getDraftField(path) {
    var cur = onboardDraft || {};
    String(path || '').split('.').forEach(function (k) {
      if (cur == null) return;
      cur = cur[k];
    });
    return cur == null ? '' : cur;
  }

  function setDraftField(path, value) {
    if (!onboardDraft) onboardDraft = makeOnboardDraft();
    var keys = String(path || '').split('.');
    var cur = onboardDraft;
    for (var i = 0; i < keys.length - 1; i++) {
      if (!cur[keys[i]] || typeof cur[keys[i]] !== 'object') cur[keys[i]] = {};
      cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]] = value;
  }

  function requiredStepFields(step) {
    if (step === 0) return ['license_pic', 'legal_cert_front_pic', 'legal_cert_back_pic'];
    if (step === 1) return ['short_name', 'receipt_name', 'detail_addr', 'legal_mobile_no', 'contact_mobile_no', 'contact_email'];
    if (step === 2) return ['card_info.account_name', 'card_info.card_no', 'card_info.bank_name', 'card_info.bank_branch', 'open_license_pic'];
    if (step === 3) return ['store_header_pic', 'store_indoor_pic', 'store_cashier_desk_pic'];
    return [];
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
      license_pic: '营业执照(F07)',
      legal_cert_front_pic: '法人身份证人像面(F02)',
      legal_cert_back_pic: '法人身份证国徽面(F03)',
      store_header_pic: '门头/场地照(F22)',
      store_indoor_pic: '内景/工作区域照(F24)',
      store_cashier_desk_pic: '收银台/前台照(F105)',
    };
    return map[key] || key;
  }

  function validateStep(step) {
    var req = requiredStepFields(step);
    for (var i = 0; i < req.length; i++) {
      var k = req[i];
      var v = getDraftField(k);
      if (typeof v === 'boolean') {
        if (!v) {
          window.bdToast && window.bdToast('请补全' + fieldLabelMap(k));
          return false;
        }
      } else if (!String(v || '').trim()) {
        window.bdToast && window.bdToast('请填写' + fieldLabelMap(k));
        return false;
      }
    }
    return true;
  }

  function uploadCard(label, key, tip) {
    var current = onboardDraft && getDraftField(key);
    var uploaded = !!current;
    var src =
      typeof current === 'string' && /^(data:image|https?:\/\/)/.test(current)
        ? current
        : uploaded
          ? DEMO_IMG
          : '';
    return (
      '<div style="border:1px solid var(--bd-border);border-radius:12px;padding:12px;background:#fff">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px">' +
      '<span style="font-size:13px;font-weight:700">' +
      '<i style="margin-right:4px;color:var(--bd-destructive);font-style:normal;font-weight:900">*</i>' +
      esc(label) +
      '</span>' +
      '<span style="font-size:11px;padding:2px 8px;border-radius:999px;background:' +
      (uploaded ? 'rgba(22,163,74,.12);color:#15803d' : 'rgba(148,163,184,.12);color:#64748b') +
      '">' +
      (uploaded ? '已上传' : '未上传') +
      '</span></div>' +
      '<div style="margin-top:8px;font-size:11px;color:var(--bd-muted)">' +
      esc(tip || '点击上传（演示）') +
      '</div>' +
      (uploaded
        ? '<button type="button" data-on-preview="' +
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
      '<button type="button" class="bd-btn bd-btn-outline" data-on-upload="' +
      esc(key) +
      '" style="border-radius:10px;box-shadow:none;padding:6px 12px;font-size:12px">' +
      (uploaded ? '更换照片' : '上传照片') +
      '</button></div>' +
      '</div>'
    );
  }

  function renderOnboardSteps() {
    return (
      '<div class="bd-onboard-steps">' +
      STEPS.map(function (label, idx) {
        return (
          '<button type="button" class="' +
          (idx === onboardStep ? 'active' : idx < onboardStep ? 'done' : '') +
          '" data-on-step="' +
          idx +
          '">' +
          '<span>' +
          (idx + 1) +
          '</span><em>' +
          esc(label) +
          '</em></button>'
        );
      }).join('') +
      '</div>'
    );
  }

  function renderOnboard() {
    if (!onboardDraft) onboardDraft = makeOnboardDraft();
    var target = route.id ? merchantById(route.id) : null;
    var licenseSource = target || merchants[0] || {};
    var canDeleteDraft = !!(target && target.onboardingStatus === 'draft');
    function card(title, inner) {
      return (
        '<div class="bd-archive-card" style="margin-bottom:12px">' +
        '<div style="padding:11px 14px;background:rgba(249,250,251,.85);border-bottom:1px solid var(--bd-border)">' +
        '<h3 style="margin:0;font-size:14px;font-weight:700">' +
        esc(title) +
        '</h3>' +
        '</div>' +
        '<div style="padding:12px 14px 6px">' +
        inner +
        '</div></div>'
      );
    }
    if (onboardStep < 0) onboardStep = 0;
    if (onboardStep >= STEPS.length) onboardStep = STEPS.length - 1;
    var stepBody = '';
    if (onboardStep === 0) {
      stepBody = renderBusinessLicenseInfo(licenseSource) + renderLegalIdInfo(licenseSource);
    } else if (onboardStep === 1) {
      stepBody =
        card(
          '商户信息',
        fieldFull('商户简称', 'on_short_name', '账单展示名称', getDraftField('short_name'), 'short_name') +
          fieldFull('小票名称', 'on_receipt_name', '小票展示名称', getDraftField('receipt_name'), 'receipt_name') +
          fieldFull('实际经营地址', 'on_detail_addr', '经营详细地址', getDraftField('detail_addr'), 'detail_addr') +
          fieldFull('法人手机号', 'on_legal_mobile_no', '法人联系方式', getDraftField('legal_mobile_no'), 'legal_mobile_no')
        ) +
        card(
          '联系人信息',
          fieldFull('管理员手机号', 'on_contact_mobile_no', '登录/通知手机号', getDraftField('contact_mobile_no'), 'contact_mobile_no') +
            fieldFull('管理员邮箱', 'on_contact_email', '汇付通知邮箱', getDraftField('contact_email'), 'contact_email')
        );
    } else if (onboardStep === 2) {
      stepBody = renderOpenLicenseInfo(licenseSource, onboardDraft, true);
    } else {
      stepBody = card(
        '门店场地',
        '<div style="display:flex;flex-direction:column;gap:10px">' +
          uploadCard('门头/场地照 F22', 'store_header_pic') +
          uploadCard('内景/工作区域照 F24', 'store_indoor_pic') +
          uploadCard('收银台/前台照 F105', 'store_cashier_desk_pic') +
          '</div>'
      );
    }
    var bottomBar =
      '<div style="position:fixed;left:50%;transform:translateX(-50%);bottom:0;z-index:120;width:min(393px,100vw);border-top:1px solid var(--bd-border);background:rgba(255,255,255,.97);backdrop-filter:blur(8px);padding:12px;display:flex;gap:10px;padding-bottom:max(12px,env(safe-area-inset-bottom));box-shadow:0 -6px 18px rgba(15,23,42,.08)">' +
      '<button type="button" class="bd-btn bd-btn-outline" data-on-save style="flex:1;border-radius:12px;box-shadow:none">保存</button>' +
      (canDeleteDraft
        ? '<button type="button" class="bd-btn bd-btn-outline" data-on-delete style="flex:1;border-radius:12px;box-shadow:none;color:var(--bd-destructive);border-color:rgba(248,113,113,.45)">删除</button>'
        : '') +
      (onboardStep > 0
        ? '<button type="button" class="bd-btn bd-btn-outline" data-on-prev style="flex:1;border-radius:12px;box-shadow:none">上一步</button>'
        : '') +
      (onboardStep < STEPS.length - 1
        ? '<button type="button" class="bd-btn bd-btn-primary" data-on-next style="flex:1;border-radius:12px">下一步</button>'
        : '<button type="button" class="bd-btn bd-btn-primary" id="onSubmit" style="flex:1;border-radius:12px">提交审核</button>') +
      '</div>';
    return (
      '<div class="bd-page-bar"><button type="button" class="bd-back" data-backlist>‹</button><h1>商户进件</h1></div>' +
      '<div style="padding:16px 16px calc(108px + env(safe-area-inset-bottom));font-size:13px">' +
      renderOnboardSteps() +
      stepBody +
      '</div>' +
      bottomBar
    );
  }

  function renderMy() {
    var cards = myMerchants
      .map(function (m) {
        return (
          '<div class="bd-store-card" data-mydialog="' +
          m.id +
          '" style="margin-bottom:10px;cursor:pointer">' +
          '<div style="padding:14px;display:flex;gap:12px">' +
          '<div style="width:42px;height:42px;border-radius:10px;background:var(--bd-primary-soft);display:flex;align-items:center;justify-content:center">🏪</div>' +
          '<div style="flex:1;min-width:0">' +
          '<div style="display:flex;align-items:center;gap:8px"><span style="font-weight:700;font-size:14px">' +
          esc(m.name) +
          '</span><span style="font-size:10px;padding:2px 8px;border-radius:6px' +
          (m.status === '正常营业'
            ? ';background:rgba(22,163,74,.12);color:#15803d'
            : m.status === '审核中'
              ? ';background:rgba(245,158,11,.15);color:#b45309'
              : ';background:#f3f4f6') +
          '">' +
          esc(m.status) +
          '</span></div>' +
          '<div style="font-size:11px;color:var(--bd-muted);margin-top:6px">入驻时间: ' +
          esc(m.date) +
          '</div></div>' +
          '<div style="text-align:right"><div style="font-weight:700">' +
          esc(m.revenue) +
          '</div><div style="font-size:10px;color:var(--bd-muted)">累计分润</div></div></div></div>'
        );
      })
      .join('');
    return (
      '<div class="bd-page-bar"><button type="button" class="bd-back" data-backlist>‹</button><h1>我的商户</h1></div>' +
      '<div style="padding:14px">' +
      cards +
      '</div>' +
      '<div class="bd-modal" id="bdMyMerModal"><div class="bd-modal-box" id="bdMyMerBox"></div></div>'
    );
  }

  function mount() {
    var r = $('#bd-merchants-root');
    if (!r) return;
    var h = '';
    if (route.view === 'list') h = renderList();
    else if (route.view === 'detail') h = renderDetail(route.id);
    else if (route.view === 'onboard') h = renderOnboard();
    else if (route.view === 'my') h = renderMy();
    r.innerHTML = h;
    wire();
    bindMerchantModals();
  }

  function bindMerchantModals() {
    if (bindMerchantModals.ok) return;
    bindMerchantModals.ok = true;
    var rejOk = $('#bdMerRejectOk');
    if (rejOk) {
      rejOk.onclick = function () {
        var ta = $('#bdMerRejectTa');
        var txt = (ta && ta.value && ta.value.trim()) || '';
        if (!txt) {
          window.bdToast && window.bdToast('请填写驳回原因');
          return;
        }
        var m = merchantById(route.id);
        if (m) {
          m.status = '已驳回';
          m.rejectReason = txt;
          delete m.reviewPhase;
        }
        var rejM = $('#bdMerRejectModal');
        if (rejM) rejM.classList.remove('bd-show');
        window.bdToast && window.bdToast('已驳回');
        mount();
      };
    }
    var rejModal = $('#bdMerRejectModal');
    if (rejModal) {
      var closeRej = rejModal.querySelector('[data-close-rej]');
      if (closeRej)
        closeRej.onclick = function () {
          rejModal.classList.remove('bd-show');
        };
    }
    var imgModal = $('#bdMerImgModal');
    if (imgModal) {
      imgModal.onclick = function (e) {
        if (e.target.id === 'bdMerImgModal') imgModal.classList.remove('bd-show');
      };
    }
    var imgClose = $('#bdMerImgClose');
    if (imgClose) {
      imgClose.onclick = function (e) {
        e.stopPropagation();
        if (imgModal) imgModal.classList.remove('bd-show');
      };
    }
  }

  function wire() {
    var r = $('#bd-merchants-root');
    r.querySelectorAll('[data-home]').forEach(function (b) {
      b.onclick = function () {
        location.href = page('mdm_bd_workbench.html#home');
      };
    });
    r.querySelectorAll('[data-backlist]').forEach(function (b) {
      b.onclick = function () {
        route.view = 'list';
        mount();
      };
    });
    r.querySelectorAll('[data-tab]').forEach(function (b) {
      b.onclick = function () {
        route.tab = b.getAttribute('data-tab');
        mount();
      };
    });
    var inp = $('#bdMerSearch');
    if (inp) {
      inp.oninput = function () {
        search = inp.value;
      };
    }
    r.querySelectorAll('[data-mid]').forEach(function (card) {
      card.onclick = function () {
        route = { view: 'detail', id: card.getAttribute('data-mid'), tab: route.tab };
        mount();
      };
    });
    r.querySelectorAll('[data-onboard]').forEach(function (b) {
      b.onclick = function () {
        goOnboardEditor();
      };
    });
    r.querySelectorAll('[data-mym]').forEach(function (b) {
      b.onclick = function () {
        route.view = 'my';
        mount();
      };
    });
    var sub = $('#onSubmit');
    if (sub) {
      sub.onclick = function () {
        for (var step = 0; step < STEPS.length; step++) {
          if (!validateStep(step)) return;
        }
        var target = route.id ? merchantById(route.id) : null;
        if (target) {
          target.onboardingFields = cloneObj(onboardDraft);
          target.onboardingStatus = 'submitted';
          target.onboardingAuditStatus = '待总监审核';
          target.onboardingNextAuditNode = 'BD总监审核';
          target.onboardingSubmittedAt = Date.now();
          target.onboardingUpdatedAt = Date.now();
          // BD 自提单据直接进入 BD 总监审核环节
          target.status = '审核中';
          target.reviewPhase = 'awaiting_leader';
          if (window.MdmUnifiedOnboardingUi && typeof window.MdmUnifiedOnboardingUi.makeRecordKey === 'function') {
            var recordKey = 'bdapp::merchant::' + String(target.merchantNo || target.id || '');
            try {
              var all = JSON.parse(localStorage.getItem('mdm_unified_onboarding_records_v1') || '{}');
              all[recordKey] = {
                recordKey: recordKey,
                status: 'submitted',
                auditStatus: '待总监审核',
                nextAuditNode: 'BD总监审核',
                title: '商户进件',
                variant: 'resource',
                merchantShortName: target.shortName || target.name || '',
                fields: cloneObj(onboardDraft),
                updatedAt: Date.now(),
                submittedAt: Date.now(),
              };
              localStorage.setItem('mdm_unified_onboarding_records_v1', JSON.stringify(all));
            } catch (e) {}
          }
        }
        window.bdToast && window.bdToast('提交成功', '已直达 BD 总监审核');
        route.view = 'list';
        onboardStep = 0;
        onboardDraft = null;
        mount();
      };
    }
    r.querySelectorAll('[data-on-step]').forEach(function (b) {
      b.onclick = function () {
        var nextStep = Number(b.getAttribute('data-on-step'));
        if (isNaN(nextStep) || nextStep === onboardStep) return;
        if (nextStep > onboardStep) {
          for (var step = onboardStep; step < nextStep; step++) {
            if (!validateStep(step)) return;
          }
        }
        onboardStep = nextStep;
        mount();
      };
    });
    r.querySelectorAll('[data-on-prev]').forEach(function (b) {
      b.onclick = function () {
        onboardStep = Math.max(0, onboardStep - 1);
        mount();
      };
    });
    r.querySelectorAll('[data-on-next]').forEach(function (b) {
      b.onclick = function () {
        if (!validateStep(onboardStep)) return;
        onboardStep = Math.min(STEPS.length - 1, onboardStep + 1);
        mount();
      };
    });
    r.querySelectorAll('[data-on-save]').forEach(function (b) {
      b.onclick = function () {
        var target = route.id ? merchantById(route.id) : null;
        if (!target) {
          window.bdToast && window.bdToast('未定位到商户，无法保存');
          return;
        }
        target.onboardingFields = cloneObj(onboardDraft);
        target.onboardingStatus = 'draft';
        target.onboardingUpdatedAt = Date.now();
        var recordKey = 'bdapp::merchant::' + String(target.merchantNo || target.id || '');
        try {
          var all = JSON.parse(localStorage.getItem('mdm_unified_onboarding_records_v1') || '{}');
          all[recordKey] = {
            recordKey: recordKey,
            status: 'draft',
            title: '商户进件',
            variant: 'resource',
            merchantShortName: target.shortName || target.name || '',
            fields: cloneObj(onboardDraft),
            updatedAt: Date.now(),
            submittedAt: null,
          };
          localStorage.setItem('mdm_unified_onboarding_records_v1', JSON.stringify(all));
        } catch (e) {}
        window.bdToast && window.bdToast('已保存草稿');
        mount();
      };
    });
    r.querySelectorAll('[data-on-delete]').forEach(function (b) {
      b.onclick = function () {
        var target = route.id ? merchantById(route.id) : null;
        if (!target || target.onboardingStatus !== 'draft') {
          window.bdToast && window.bdToast('仅未提交草稿可删除');
          return;
        }
        delete target.onboardingFields;
        delete target.onboardingStatus;
        delete target.onboardingUpdatedAt;
        delete target.onboardingSubmittedAt;
        var recordKey = 'bdapp::merchant::' + String(target.merchantNo || target.id || '');
        try {
          var all = JSON.parse(localStorage.getItem('mdm_unified_onboarding_records_v1') || '{}');
          delete all[recordKey];
          localStorage.setItem('mdm_unified_onboarding_records_v1', JSON.stringify(all));
        } catch (e) {}
        onboardDraft = makeOnboardDraft();
        window.bdToast && window.bdToast('草稿已删除');
        mount();
      };
    });
    r.querySelectorAll('[data-on-field]').forEach(function (inp) {
      inp.oninput = function () {
        setDraftField(inp.getAttribute('data-on-field'), inp.value);
      };
    });
    r.querySelectorAll('[data-on-upload]').forEach(function (btn) {
      btn.onclick = function () {
        var key = btn.getAttribute('data-on-upload');
        var demoSrc = key === 'open_license_pic' ? OPEN_LICENSE_IMG : DEMO_IMG;
        setDraftField(key, demoSrc + '#up=' + Date.now());
        window.bdToast && window.bdToast('已上传（演示）');
        mount();
      };
    });
    r.querySelectorAll('[data-on-preview]').forEach(function (btn) {
      btn.onclick = function () {
        var src = btn.getAttribute('data-on-preview') || DEMO_IMG;
        var img = $('#bdMerImgView');
        if (img) img.src = src;
        $('#bdMerImgModal').classList.add('bd-show');
      };
    });
    r.querySelectorAll('[data-copy-no]').forEach(function (b) {
      b.onclick = function (ev) {
        ev.preventDefault();
        var t = b.getAttribute('data-copy-no') || '';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(t).then(function () {
            window.bdToast && window.bdToast('已复制');
          }, function () {
            window.prompt('复制', t);
          });
        } else window.prompt('复制', t);
      };
    });
    r.querySelectorAll('[data-mer-photo]').forEach(function (b) {
      b.onclick = function () {
        var img = $('#bdMerImgView');
        if (img) img.src = DEMO_IMG;
        $('#bdMerImgModal').classList.add('bd-show');
      };
    });
    r.querySelectorAll('[data-mer-reject]').forEach(function (b) {
      b.onclick = function () {
        var ta = $('#bdMerRejectTa');
        if (ta) ta.value = '';
        $('#bdMerRejectModal').classList.add('bd-show');
      };
    });
    r.querySelectorAll('[data-mer-pass]').forEach(function (b) {
      b.onclick = function () {
        var m = merchantById(route.id);
        if (!m) return;
        m.status = '审核中';
        m.reviewPhase = 'awaiting_leader';
        window.bdToast && window.bdToast('审核通过', '已流转至 BD 负责人终审');
        mount();
      };
    });
    r.querySelectorAll('[data-mer-edit]').forEach(function (b) {
      b.onclick = function () {
        goOnboardEditor();
      };
    });
    r.querySelectorAll('[data-mer-resubmit]').forEach(function (b) {
      b.onclick = function () {
        goOnboardEditor();
      };
    });
    r.querySelectorAll('[data-mydialog]').forEach(function (card) {
      card.onclick = function () {
        var id = Number(card.getAttribute('data-mydialog'));
        var m = myMerchants.find(function (x) {
          return x.id === id;
        });
        var box = $('#bdMyMerBox');
        var modal = $('#bdMyMerModal');
        if (!m || !box || !modal) return;
        box.innerHTML =
          '<h3 style="margin:0 0 10px">' +
          esc(m.name) +
          '</h3><p style="font-size:12px;color:var(--bd-muted);margin:0 0 10px">商户详细信息</p>' +
          ['门店编号', '营业状态', '入驻时间', '累计分润', '联系人', '联系电话', '门店地址']
            .map(function (lab, idx) {
              var vals = [m.storeId, m.status, m.date, m.revenue, m.contact, m.phone, m.address];
              return (
                '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--bd-border);font-size:13px">' +
                '<span style="color:var(--bd-muted)">' +
                esc(lab) +
                '</span><span>' +
                esc(vals[idx]) +
                '</span></div>'
              );
            })
            .join('') +
          '<button type="button" style="margin-top:14px;width:100%;padding:10px;border-radius:10px;border:1px solid var(--bd-border);background:#fff;font-weight:600;cursor:pointer" onclick="document.getElementById(\'bdMyMerModal\').classList.remove(\'bd-show\')">关闭</button>';
        modal.classList.add('bd-show');
        modal.onclick = function (e) {
          if (e.target === modal) modal.classList.remove('bd-show');
        };
      };
    });
  }

  bindMerchantModals.ok = false;

  function parseHash() {
    var h = (location.hash || '').replace(/^#/, '');
    var keepTab = route.tab || 'all';
    if (h === 'onboarding') {
      onboardStep = 0;
      onboardDraft = makeOnboardDraft();
      route = { view: 'onboard', tab: keepTab, id: null };
    } else if (h === 'my') route = { view: 'my', tab: keepTab, id: null };
    else if (h.indexOf('detail-by-payload/') === 0) {
      var encodedPayload = h.slice('detail-by-payload/'.length);
      var payloadText = '';
      try {
        payloadText = decodeURIComponent(encodedPayload);
      } catch (e) {
        payloadText = encodedPayload;
      }
      var payload = {};
      try {
        payload = JSON.parse(payloadText || '{}');
      } catch (e) {
        payload = {};
      }
      var item = ensureMerchantFromPayload(payload);
      route = item ? { view: 'detail', tab: keepTab, id: item.id } : { view: 'list', tab: keepTab, id: null };
    }
    else if (h.indexOf('detail-by-short/') === 0) {
      var encoded = h.slice('detail-by-short/'.length);
      var decoded = '';
      try {
        decoded = decodeURIComponent(encoded);
      } catch (e) {
        decoded = encoded;
      }
      var target = merchantByShortName(decoded);
      route = target ? { view: 'detail', tab: keepTab, id: target.id } : { view: 'list', tab: keepTab, id: null };
    }
    else if (h.indexOf('detail/') === 0)
      route = { view: 'detail', tab: keepTab, id: h.split('/')[1] };
    else route = { view: 'list', tab: keepTab, id: null };
  }

  function init() {
    function boot(d) {
      merchants = JSON.parse(JSON.stringify(Array.isArray(d) ? d : []));
      parseHash();
      mount();
      window.addEventListener('hashchange', function () {
        parseHash();
        mount();
      });
    }
    if (window.__BD_MANAGED_MERCHANTS__) {
      boot(window.__BD_MANAGED_MERCHANTS__);
    } else {
      fetch(new URL('../js/mdm-bd-managed-merchants.json', location.href).toString())
        .then(function (x) {
          return x.json();
        })
        .then(boot)
        .catch(function () {
          $('#bd-merchants-root').innerHTML = '<div class="bd-empty">无法加载商户数据</div>';
        });
    }
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
