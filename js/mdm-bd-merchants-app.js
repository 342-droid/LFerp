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
  var STEPS = ['商户信息', '联系方式', '结算账户', '资质上传', '门店照片', '确认提交'];

  var DEMO_IMG =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#e2e8f0"/><stop offset="100%" style="stop-color:#cbd5e1"/></linearGradient><rect fill="url(#g)" width="100%" height="100%" rx="8"/><text x="50%" y="50%" text-anchor="middle" fill="#64748b" font-size="13">证照演示图</text></svg>'
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
      license_pic: false,
      legal_cert_front_pic: false,
      legal_cert_back_pic: false,
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
    ['license_pic', 'legal_cert_front_pic', 'legal_cert_back_pic', 'store_header_pic', 'store_indoor_pic', 'store_cashier_desk_pic'].forEach(function (k) {
      if (typeof ext[k] === 'boolean') base[k] = ext[k];
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

    var licenseInner =
      detailRow('营业执照', esc(onboardingUploadText(ob.license_pic))) +
      detailRow('营业执照名称', esc(nz(m.licenseName || m.regName))) +
      detailRow('注册号/统一信用代码', esc(nz(m.registrationCode || m.licenseCode))) +
      detailRow('公司类型', esc(nz(m.entType || m.merchantCategory))) +
      detailRow('成立日期', esc(nz(m.foundDate))) +
      detailRow('执照有效期', esc(nz((m.licenseValidFrom || m.licenseBeginDate || '—') + ' ~ ' + (m.licenseValidTo || m.licenseEndDate || '—')))) +
      detailRow('注册地址', esc(nz(m.registeredDetailAddress || m.regDetail || m.registeredRegion))) +
      detailRow('实际经营地址', esc(nz(ob.detail_addr)));

    var legalInner =
      detailRow('法人姓名', esc(nz(m.legalPerson || m.legalName))) +
      detailRow('法人手机号', esc(nz(ob.legal_mobile_no))) +
      detailRow('证件类型', esc(nz(m.legalCertType || m.legalIdDocType))) +
      detailRow('身份证号', esc(maskMiddle(m.idNumber))) +
      detailRow('证件有效期', esc(nz((m.idValidFrom || m.legalCertBeginDate || '—') + ' ~ ' + (m.idValidTo || m.legalCertEndDate || '—')))) +
      detailRow('身份证地址', esc(nz(m.legalAddr))) +
      detailRow('身份证人像面', esc(onboardingUploadText(ob.legal_cert_front_pic))) +
      detailRow('身份证国徽面', esc(onboardingUploadText(ob.legal_cert_back_pic)));

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

    var card = ob.card_info || {};
    var settleInner =
      detailRow('开户名/结算户名', esc(nz(card.account_name || m.settlementAccountName))) +
      detailRow('银行账号', esc(maskBank(card.card_no || m.bankAccount))) +
      detailRow('开户银行', esc(nz(card.bank_name || m.bankName))) +
      detailRow('开户支行', esc(nz(card.bank_branch || m.branchName))) +
      detailRow('开户许可证', esc(onboardingUploadText(m.openLicencePic))) +
      detailRow('开户许可证核准号', esc(nz(m.openLicenceNo)));

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
      sectionCard('营业执照信息', '营业执照与地址信息', licenseInner) +
      sectionCard('法人实名信息', '法人身份与证件信息', legalInner) +
      sectionCard('经营配置', '商户经营基础信息', opInner) +
      sectionCard('联系人与账号', '管理员联系方式与登录账号', contactInner) +
      sectionCard('结算账户信息', '开户与结算资料', settleInner) +
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
    if (step === 0) return ['short_name', 'receipt_name', 'detail_addr', 'contact_mobile_no'];
    if (step === 1) return ['legal_mobile_no', 'contact_email'];
    if (step === 2) return ['card_info.account_name', 'card_info.card_no', 'card_info.bank_name', 'card_info.bank_branch'];
    if (step === 3) return ['license_pic', 'legal_cert_front_pic', 'legal_cert_back_pic'];
    if (step === 4) return ['store_header_pic', 'store_indoor_pic', 'store_cashier_desk_pic'];
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

  function renderOnboard() {
    if (!onboardDraft) onboardDraft = makeOnboardDraft();
    var target = route.id ? merchantById(route.id) : null;
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
    var cards =
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
      ) +
      card(
        '银行卡信息配置',
        fieldFull('开户名', 'on_card_account_name', '银行卡户名', getDraftField('card_info.account_name'), 'card_info.account_name') +
          fieldFull('银行卡号', 'on_card_no', '结算账户', getDraftField('card_info.card_no'), 'card_info.card_no') +
          fieldFull('开户银行', 'on_card_bank_name', '银行名称', getDraftField('card_info.bank_name'), 'card_info.bank_name') +
          fieldFull('开户支行', 'on_card_branch_name', '支行名称', getDraftField('card_info.bank_branch'), 'card_info.bank_branch')
      ) +
      card(
        '资质上传',
        '<div style="display:flex;flex-direction:column;gap:10px">' +
          uploadCard('营业执照 F07', 'license_pic') +
          uploadCard('法人身份证人像面 F02', 'legal_cert_front_pic') +
          uploadCard('法人身份证国徽面 F03', 'legal_cert_back_pic') +
          '</div>'
      ) +
      card(
        '经营场地照片',
        '<div style="display:flex;flex-direction:column;gap:10px">' +
          uploadCard('门头/场地照 F22', 'store_header_pic') +
          uploadCard('内景/工作区域照 F24', 'store_indoor_pic') +
          uploadCard('收银台/前台照 F105', 'store_cashier_desk_pic') +
          '</div>'
      );
    var bottomBar =
      '<div style="position:fixed;left:50%;transform:translateX(-50%);bottom:0;z-index:120;width:min(393px,100vw);border-top:1px solid var(--bd-border);background:rgba(255,255,255,.97);backdrop-filter:blur(8px);padding:12px;display:flex;gap:10px;padding-bottom:max(12px,env(safe-area-inset-bottom));box-shadow:0 -6px 18px rgba(15,23,42,.08)">' +
      '<button type="button" class="bd-btn bd-btn-outline" data-on-save style="flex:1;border-radius:12px;box-shadow:none">保存</button>' +
      (canDeleteDraft
        ? '<button type="button" class="bd-btn bd-btn-outline" data-on-delete style="flex:1;border-radius:12px;box-shadow:none;color:var(--bd-destructive);border-color:rgba(248,113,113,.45)">删除</button>'
        : '') +
      '<button type="button" class="bd-btn bd-btn-primary" id="onSubmit" style="flex:1;border-radius:12px">提交审核</button>' +
      '</div>';
    return (
      '<div class="bd-page-bar"><button type="button" class="bd-back" data-backlist>‹</button><h1>商户进件</h1></div>' +
      '<div style="padding:16px 16px calc(108px + env(safe-area-inset-bottom));font-size:13px">' +
      cards +
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
        for (var step = 0; step <= 4; step++) {
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
        setDraftField(key, DEMO_IMG + '#up=' + Date.now());
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
