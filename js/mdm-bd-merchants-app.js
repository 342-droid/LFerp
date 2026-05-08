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
  var STEPS = ['商户信息', '法人信息', '补充信息', '门店信息', '结算信息', '商户认证'];

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
          '</span><span>费率: ' +
          esc(m.rate) +
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
      '<div style="position:absolute;bottom:calc(12px + env(safe-area-inset-bottom, 0px));right:16px;z-index:40">' +
      '<button type="button" class="bd-btn bd-btn-primary" data-onboard style="border-radius:999px;box-shadow:0 4px 16px rgba(37,99,235,.35)">＋ 商户进件</button></div>'
    );
  }

  function statusStyle(st) {
    if (st === '进件成功') return ';background:rgba(22,163,74,.12);color:#15803d';
    if (st === '待审核' || st === '审核中') return ';background:rgba(245,158,11,.15);color:#b45309';
    if (st === '已驳回') return ';background:rgba(220,38,38,.12);color:#b91c1c';
    return '';
  }

  function renderDetail(id) {
    var m = merchantById(id);
    if (!m)
      return (
        '<div class="bd-page-bar"><button type="button" class="bd-back" data-backlist>‹</button><h1>商户详情</h1></div><div class="bd-empty">商户不存在</div>'
      );
    var effPhase =
      m.reviewPhase || (m.status === '待审核' ? 'awaiting_bd' : undefined);
    var bdCanAct = m.status === '待审核' && effPhase === 'awaiting_bd';
    var awaitingLeader = m.status === '审核中' && effPhase === 'awaiting_leader';
    var auditStepLabel =
      m.status === '待审核' && effPhase === 'awaiting_bd'
        ? 'BD 预审'
        : m.status === '审核中' && effPhase === 'awaiting_leader'
          ? 'BD 负责人终审'
          : m.status === '审核中'
            ? '渠道/后台审核'
            : m.status === '进件成功'
              ? '已通过'
              : m.status === '已驳回'
                ? '已驳回'
                : '—';
    var bottomPad =
      bdCanAct || awaitingLeader || m.status === '已驳回' ? 'calc(120px + env(safe-area-inset-bottom))' : '24px';

    var banner = '';
    if (awaitingLeader) {
      banner =
        '<div style="margin:12px;padding:11px;border-radius:12px;border:1px solid rgba(251,191,36,.65);background:rgba(254,249,231,.95);font-size:12px;line-height:1.55;margin-bottom:12px">您已完成 <strong>BD 预审</strong>，资料已流转至<strong> BD 负责人</strong>终审。对外仍为<strong>「审核中」</strong>；驳回/终审由负责人操作，本账号只读。</div>';
    }

    var rejectBlk = '';
    if (m.rejectReason && String(m.rejectReason).trim()) {
      rejectBlk =
        '<div style="border:1px solid rgba(248,113,113,.45);border-radius:16px;padding:14px;background:rgba(254,226,226,.35);margin-bottom:12px">' +
        '<p style="margin:0;font-size:12px;font-weight:700;color:var(--bd-destructive)">驳回原因</p>' +
        '<p style="margin:8px 0 0;font-size:13px;line-height:1.55">' +
        esc(m.rejectReason) +
        '</p></div>';
    }

    var head =
      '<div style="border:1px solid var(--bd-border);border-radius:16px;padding:14px;background:#fff;margin-bottom:12px;box-shadow:0 1px 10px rgba(15,23,42,.06)">' +
      '<p style="margin:0;font-size:15px;font-weight:800;line-height:1.3">' +
      esc(m.name) +
      '</p>' +
      '<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:10px;font-size:11px;color:var(--bd-muted);align-items:center">' +
      '<span>商户编号 ' +
      esc(m.merchantNo) +
      '</span>' +
      '<button type="button" data-copy-no="' +
      esc(m.merchantNo) +
      '" style="border:none;background:rgba(37,99,235,.08);color:var(--bd-primary);font-size:10px;padding:3px 8px;border-radius:6px;cursor:pointer">复制</button></div>' +
      '<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:8px;font-size:11px;align-items:center">' +
      '<span>简称 ' +
      esc(m.shortName) +
      '</span>' +
      '<span style="font-size:10px;font-weight:700;padding:4px 9px;border-radius:999px;white-space:nowrap' +
      statusStyle(m.status) +
      '">' +
      esc(m.status) +
      '</span></div></div>';

    var s1 =
      detailRow('审核环节', '<span>' + esc(auditStepLabel) + '</span>') +
      detailRow('进件渠道', esc(m.channel)) +
      detailRow('进件日期', esc(m.applicationDate)) +
      detailRow('商户落地日期', esc((m.merchantDate || '').trim() ? m.merchantDate : '—')) +
      detailRow('签约费率', esc(m.rate)) +
      detailRow('支付认证', esc(m.paymentAuth)) +
      detailRow('行业（参考）', esc(m.industry));

    var licInner =
      detailRow('商户类别', esc(m.merchantCategory)) +
      '<div style="border-bottom:1px solid rgba(229,231,235,.6)">' +
      photoThumb('营业执照') +
      '</div>' +
      detailRow('营业执照名称', esc(m.licenseName)) +
      detailRow('注册号/代码', '<span style="font-family:monospace;font-size:11px">' + esc(m.registrationCode) + '</span>') +
      detailRow('执照有效期', esc(m.licenseValidFrom + ' 至 ' + m.licenseValidTo)) +
      detailRow('注册地址', esc(m.registeredRegion)) +
      detailRow('详细地址', esc(m.registeredDetailAddress)) +
      detailRow('证件类型', esc(m.licenseDocumentType));

    var legalInner =
      detailRow('证件类型', esc(m.legalIdDocType)) +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;border-bottom:1px solid rgba(229,231,235,.55);padding-bottom:8px;margin-bottom:4px">' +
      '<div>' +
      photoThumb('身份证人像面') +
      '</div><div>' +
      photoThumb('身份证国徽面') +
      '</div></div>' +
      detailRow('法人姓名', esc(m.legalPerson)) +
      detailRow('身份证号', '<span style="font-family:monospace;font-size:11px">' + esc(m.idNumber) + '</span>') +
      detailRow(
        '证件有效期限',
        esc(m.idValidFrom + ' 至 ' + m.idValidTo)
      ) +
      detailRow('签发机关', esc(m.idIssuingAuthority));

    var baseInner =
      detailRow('商户经营名称', esc(m.operatingName)) +
      detailRow('商户经营地区', esc(m.operatingRegion)) +
      detailRow('经营详细地址', esc(m.operatingDetailAddress)) +
      detailRow('商户类型', esc(m.merchantTypeLabel)) +
      detailRow('联系人姓名', esc(m.contact)) +
      detailRow('手机号码', esc(m.phone));

    var settleInner =
      detailRow('账户类型', esc(settlementAccountLabel(m.settlementType))) +
      '<div style="border-bottom:1px solid rgba(229,231,235,.6)">' +
      photoThumb(settlementCredLabel(m)) +
      '</div>' +
      detailRow('开户名/结算户名', esc(m.settlementAccountName)) +
      detailRow(
        '开户账号/结算账号',
        '<span style="font-family:monospace;font-size:11px">' + esc(m.bankAccount) + '</span>'
      ) +
      detailRow('开户银行', esc(m.bankName)) +
      detailRow('开户支行', esc(m.branchName)) +
      detailRow('是否法人结算', m.isLegalPersonSettlement ? '是' : '否');

    if (!m.isLegalPersonSettlement && (m.settlorName || m.settlorIdNumber)) {
      settleInner +=
        '<div style="border-top:1px dashed rgba(229,231,235,.95);margin-top:10px;padding-top:10px"><p style="margin:0 0 10px;font-size:11px;font-weight:700">非法人结算补充</p>';
      if (m.settlorName) settleInner += detailRow('结算人姓名', esc(m.settlorName));
      if (m.settlorIdNumber)
        settleInner += detailRow(
          '结算人证件号',
          '<span style="font-family:monospace;font-size:11px">' +
            esc(m.settlorIdNumber) +
            '</span>'
        );
      settleInner +=
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">' +
        photoThumb('结算人人像面') +
        photoThumb('结算人国徽面') +
        '</div>' +
        photoThumb('法人授权函') +
        '</div>';
    }

    var storeInner =
      '<div style="display:flex;flex-direction:column;gap:12px;padding:10px 0">' +
      photoThumb('门头照') +
      photoThumb('内景照') +
      photoThumb('收银台照') +
      '</div>' +
      '<div>' +
      detailRow('门店名称', esc(m.storeName)) +
      '</div>';

    var agreeInner =
      detailRow('商户协议类型', esc(m.agreementType)) +
      detailRow('电子签名', esc(m.eSignStatus)) +
      detailRow('实名认证', esc(m.realNameAuthStatus));

    var body =
      '<div class="bd-page-bar"><button type="button" class="bd-back" data-backlist>‹</button><h1>商户详情</h1></div>' +
      banner +
      '<div style="padding:12px;padding-bottom:' +
      bottomPad +
      '">' +
      head +
      rejectBlk +
      sectionCard('进件概要', '渠道与审核进度相关字段', s1) +
      sectionCard('执照信息', '主体与营业执照', licInner) +
      sectionCard('法人信息', '法人身份证件', legalInner) +
      sectionCard('基本信息', '门店经营与联系人', baseInner) +
      sectionCard('结算信息', '结算账户与开户行', settleInner) +
      sectionCard('门店信息', '门头、内景与收银台', storeInner) +
      sectionCard('协议与认证', '签约与实名状态', agreeInner) +
      '</div>';

    var bar = '';
    if (bdCanAct) {
      bar =
        '<div style="position:absolute;bottom:0;left:0;right:0;z-index:42;border-top:1px solid var(--bd-border);background:rgba(255,255,255,.97);backdrop-filter:blur(8px);padding:12px;display:flex;gap:10px;padding-bottom:max(12px,env(safe-area-inset-bottom))">' +
        '<button type="button" class="bd-btn bd-btn-outline" style="flex:1;border-radius:12px;box-shadow:none;color:var(--bd-destructive);border-color:rgba(248,113,113,.5)" data-mer-reject>驳回</button>' +
        '<button type="button" class="bd-btn bd-btn-primary" style="flex:1;border-radius:12px" data-mer-pass>预审通过</button>' +
        '</div>';
    } else if (awaitingLeader) {
      bar =
        '<div style="position:absolute;bottom:0;left:0;right:0;z-index:42;border-top:1px solid var(--bd-border);background:rgba(255,255,255,.97);padding:12px;display:flex;gap:10px;padding-bottom:max(12px,env(safe-area-inset-bottom))">' +
        '<button type="button" class="bd-btn bd-btn-outline" style="flex:1;border-radius:12px;box-shadow:none;opacity:.45" disabled>驳回</button>' +
        '<button type="button" class="bd-btn bd-btn-primary" style="flex:1;border-radius:12px;opacity:.45" disabled>审核通过</button>' +
        '</div>';
    } else if (m.status === '已驳回') {
      bar =
        '<div style="position:absolute;bottom:0;left:0;right:0;z-index:42;border-top:1px solid var(--bd-border);background:rgba(255,255,255,.97);padding:12px;padding-bottom:max(12px,env(safe-area-inset-bottom))">' +
        '<button type="button" class="bd-btn bd-btn-primary" style="width:100%;border-radius:12px" data-mer-resubmit>⟳ 重新提交</button></div>';
    }

    return body + bar;
  }

  function fieldFull(label, id, placeholder) {
    return (
      '<label style="display:block;margin-bottom:14px;font-size:13px;font-weight:600;color:var(--bd-text)">' +
      esc(label) +
      '<input id="' +
      id +
      '" placeholder="' +
      esc(placeholder || '') +
      '" style="display:block;width:100%;margin-top:6px;padding:11px;border:1px solid var(--bd-border);border-radius:12px;font-size:14px;font-weight:400"/></label>'
    );
  }

  function renderOnboard() {
    var dots = STEPS.map(function (_, i) {
      return (
        '<div style="display:flex;align-items:center">' +
        '<div style="width:24px;height:24px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;background:' +
        (i <= onboardStep ? 'var(--bd-primary)' : '#e5e7eb') +
        ';color:' +
        (i <= onboardStep ? '#fff' : '#9ca3af') +
        '">' +
        (i + 1) +
        '</div>' +
        (i < STEPS.length - 1
          ? '<div style="width:10px;height:3px;background:' +
            (i < onboardStep ? 'var(--bd-primary)' : '#e5e7eb') +
            ';border-radius:2px;margin:0 4px"></div>'
          : '') +
        '</div>'
      );
    }).join('');
    var stepBody = '';
    if (onboardStep === 0)
      stepBody =
        '<label style="display:block;margin-bottom:12px;font-size:13px;font-weight:600">商户类型<select id="on_mertype" style="display:block;width:100%;margin-top:6px;padding:11px;border:1px solid var(--bd-border);border-radius:12px">' +
        '<option>企业</option><option>个人</option><option>小微商户</option></select></label>' +
        '<label style="font-size:13px;font-weight:600;display:block;margin-bottom:8px">营业执照</label>' +
        '<div style="border:2px dashed var(--bd-border);border-radius:14px;padding:36px;text-align:center;color:var(--bd-muted);font-size:12px;background:#fafafa">📷 点击上传（演示）</div>' +
        fieldFull('企业名称', 'on_ent', '与企业执照一致');
    else if (onboardStep === 1)
      stepBody =
        fieldFull('法人姓名', 'on_lp', '') +
        fieldFull('身份证号码', 'on_idcard', '') +
        fieldFull('手机号', 'on_mob', '');
    else if (onboardStep === 2)
      stepBody =
        fieldFull('行业', 'on_industry', '') + fieldFull('经营地址摘要', 'on_addr', '');
    else if (onboardStep === 3)
      stepBody =
        '<label style="font-weight:600;font-size:13px;display:block;margin-bottom:8px">门店照片</label>' +
        '<div style="border:2px dashed var(--bd-border);border-radius:14px;padding:26px;text-align:center;font-size:12px;color:var(--bd-muted);margin-bottom:14px;background:#fafafa">门头 / 内景 / 收银台（演示）</div>' +
        fieldFull('门店名称', 'on_store', '');
    else if (onboardStep === 4)
      stepBody =
        '<label style="display:block;margin-bottom:12px;font-size:13px;font-weight:600">结算账户类型<select id="on_stype" style="display:block;width:100%;margin-top:6px;padding:11px;border:1px solid var(--bd-border);border-radius:12px">' +
        '<option>对公</option><option>对私法人</option></select></label>' +
        fieldFull('开户名', 'on_accname', '') +
        fieldFull('银行账号', 'on_accnum', '');
    else
      stepBody =
        '<p style="margin:0 0 14px;font-size:13px;color:var(--bd-muted);line-height:1.55">勾选以下事项即表示信息与证照一致并已阅读进件须知。</p>' +
        '<label style="display:flex;gap:10px;margin-bottom:10px;font-size:13px;line-height:1.45"><input type="checkbox"/> 资料属实，如遇虚假愿承担法律责任</label>' +
        '<label style="display:flex;gap:10px;margin-bottom:10px;font-size:13px;line-height:1.45"><input type="checkbox"/> 已收款账户与报备一致</label>';
    var navBtns =
      '<div style="display:flex;gap:10px;margin-top:20px">' +
      (onboardStep > 0
        ? '<button type="button" class="bd-btn bd-btn-outline" data-on-prev style="flex:1;border-radius:12px;box-shadow:none">上一步</button>'
        : '<span style="flex:1"></span>') +
      (onboardStep < STEPS.length - 1
        ? '<button type="button" class="bd-btn bd-btn-primary" data-on-next style="flex:1;border-radius:12px">下一步</button>'
        : '<button type="button" class="bd-btn bd-btn-primary" id="onSubmit" style="flex:1;border-radius:12px">提交审核</button>') +
      '</div>';
    return (
      '<div class="bd-page-bar"><button type="button" class="bd-back" data-backlist>‹</button><h1>商户进件</h1></div>' +
      '<div style="padding:16px 16px 32px;font-size:13px">' +
      '<div style="overflow-x:auto;padding-bottom:8px">' +
      dots +
      '</div>' +
      '<p style="text-align:center;font-weight:700;margin:8px 0 4px">' +
      esc(STEPS[onboardStep]) +
      '</p>' +
      '<p style="text-align:center;font-size:11px;color:var(--bd-muted)">步骤 ' +
      (onboardStep + 1) +
      ' / ' +
      STEPS.length +
      '</p>' +
      '<div style="margin-top:14px">' +
      stepBody +
      navBtns +
      '</div></div>'
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
        route.view = 'onboard';
        onboardStep = 0;
        mount();
      };
    });
    r.querySelectorAll('[data-mym]').forEach(function (b) {
      b.onclick = function () {
        route.view = 'my';
        mount();
      };
    });
    r.querySelectorAll('[data-on-next]').forEach(function (b) {
      b.onclick = function () {
        if (onboardStep < STEPS.length - 1) onboardStep++;
        mount();
      };
    });
    r.querySelectorAll('[data-on-prev]').forEach(function (b) {
      b.onclick = function () {
        if (onboardStep > 0) onboardStep--;
        mount();
      };
    });
    var sub = $('#onSubmit');
    if (sub) {
      sub.onclick = function () {
        window.bdToast && window.bdToast('提交成功', '商户进件资料已提交，请等待审核');
        route.view = 'list';
        onboardStep = 0;
        mount();
      };
    }
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
        window.bdToast && window.bdToast('BD 预审通过', '已流转至 BD 负责人终审');
        mount();
      };
    });
    r.querySelectorAll('[data-mer-resubmit]').forEach(function (b) {
      b.onclick = function () {
        window.bdToast &&
          window.bdToast('请在渠道侧补充资料（演示）', '与 bd-guanli 一致可重新推送进件');
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
      route = { view: 'onboard', tab: keepTab, id: null };
    } else if (h === 'my') route = { view: 'my', tab: keepTab, id: null };
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
