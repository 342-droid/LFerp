/**
 * BD 门店模块单页：对齐 bd-guanli-main /leads 及子路由交互
 * 数据：../js/mdm-bd-store-audits.json
 */
(function () {
  var CURRENT_BD = '李泽峰';
  var AUDIT_ROLE = 'bd';

  var STATUS_TABS = ['全部', '待提交', '待审核', '待总监审核', '审核中', '审核成功', '审核失败'];
  var stores = [];
  var statusFilter = '全部';
  var searchQuery = '';
  var route = { name: 'list', id: null, sub: null };

  function qs(sel) {
    return document.querySelector(sel);
  }

  function getPhaseDisplay(phase) {
    switch (phase) {
      case 'draft':
        return '待提交';
      case 'approved':
        return '审核成功';
      case 'rejected':
        return '审核失败';
      case 'awaiting_leader':
        return '待总监审核';
      default:
        return '待审核';
    }
  }

  function accountDisplayStatus(store) {
    if (store.phase === 'awaiting_leader' && AUDIT_ROLE === 'leader') return '待审核';
    return getPhaseDisplay(store.phase);
  }

  function onboardingDisplay(store) {
    if (store.phase === 'awaiting_bd') return '待进件';
    return store.onboardingStatus || '—';
  }

  function canSee(store) {
    if (AUDIT_ROLE === 'leader' && store.phase === 'awaiting_bd') return false;
    return true;
  }

  function canAudit(store) {
    if (store.phase === 'awaiting_bd')
      return AUDIT_ROLE === 'bd' && (!CURRENT_BD || store.boundBd === CURRENT_BD);
    if (store.phase === 'awaiting_leader') return AUDIT_ROLE === 'leader';
    return false;
  }

  function canShare(store) {
    if (AUDIT_ROLE !== 'bd') return false;
    if (store.phase !== 'draft' && store.phase !== 'awaiting_bd') return false;
    return !CURRENT_BD || store.boundBd === CURRENT_BD;
  }

  function dash(v) {
    var t = (v || '').toString().trim();
    return !t || t === '—' ? '—' : t;
  }

  function fmtTs() {
    var now = new Date();
    var p = function (n) {
      return String(n).padStart(2, '0');
    };
    return now.getFullYear() + '-' + p(now.getMonth() + 1) + '-' + p(now.getDate()) + ' ' + p(now.getHours()) + ':' + p(now.getMinutes());
  }

  function getStore(id) {
    return stores.find(function (s) {
      return String(s.id) === String(id);
    });
  }

  function badgeClass(status) {
    if (status === '审核成功') return 'background:rgba(16,185,129,.15);color:#047857';
    if (status === '审核失败') return 'background:rgba(220,38,38,.12);color:#dc2626';
    if (status === '待总监审核' || status === '审核中') return 'background:rgba(245,158,11,.15);color:#b45309';
    if (status === '待提交') return 'background:rgba(14,165,233,.12);color:#0369a1';
    return 'background:rgba(100,116,139,.12);color:#334155';
  }

  function chipsHTML(store) {
    var out = [];
    if (store.partnerDivision) {
      out.push(
        '<span class="bd-chip-partner">' +
          escapeHtml(store.partnerDivision) +
          '</span>'
      );
    }
    if (store.storeType && store.storeType !== '—') {
      out.push('<span class="bd-chip-storetype">' + escapeHtml(store.storeType) + '</span>');
    }
    return out.length
      ? out.join('')
      : '<span style="font-size:10px;color:var(--bd-muted)">暂无类型信息</span>';
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function visibleList() {
    return stores.filter(canSee);
  }

  function counts() {
    var c = {};
    STATUS_TABS.forEach(function (t) {
      c[t] = 0;
    });
    visibleList().forEach(function (s) {
      var d = accountDisplayStatus(s);
      c['全部']++;
      c[d]++;
    });
    return c;
  }

  function matchesSearch(store) {
    var q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    var blob = [store.name, store.boundBd, store.storeSubject, store.address, store.regionCascade, store.detailAddress]
      .map(function (x) {
        return (x || '').toString().toLowerCase();
      })
      .join('\n');
    return blob.indexOf(q) >= 0;
  }

  function filteredStores() {
    var cnt = counts();
    var list = visibleList().filter(function (s) {
      if (statusFilter === '全部') return true;
      return accountDisplayStatus(s) === statusFilter;
    });
    list = list.filter(matchesSearch);
    list.sort(function (a, b) {
      function rank(s) {
        var d = accountDisplayStatus(s);
        if (d === '待提交') return 0;
        if (d === '待审核') return 1;
        if (d === '待总监审核') return 2;
        return 3;
      };
      var ra = rank(a);
      var rb = rank(b);
      if (ra !== rb) return ra - rb;
      return (b.submittedAt || '').localeCompare(a.submittedAt || '');
    });
    return { list: list, cnt: cnt };
  }

  function renderList() {
    var fr = filteredStores();
    var tabs = STATUS_TABS.map(function (tab) {
      var active = tab === statusFilter ? ' bd-active' : '';
      return (
        '<button type="button" class="bd-status-tab' +
        active +
        '" data-tab="' +
        escapeHtml(tab) +
        '">' +
        escapeHtml(tab) +
        '<span class="c">' +
        fr.cnt[tab] +
        '</span></button>'
      );
    }).join('');

    var cards = fr.list
      .map(function (store) {
        var d = accountDisplayStatus(store);
        var showAudit = canAudit(store);
        var whClass = store.warehouseNeedsAttention ? ' style="color:var(--bd-destructive);font-weight:700"' : '';
        return (
          '<article class="bd-store-card" data-id="' +
          store.id +
          '">' +
          '<div class="bd-store-head">' +
          '<div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">' +
          '<div style="min-width:0"><h3 style="margin:0;font-size:16px;font-weight:800">' +
          escapeHtml((store.name || '').trim() || '未命名门店') +
          '</h3>' +
          '<p style="margin:6px 0 0;font-size:10px;color:var(--bd-muted);font-variant-numeric:tabular-nums">门店编号 ' +
          escapeHtml(store.merchantUid || '') +
          '</p></div>' +
          '<span class="bd-store-badge" style="' +
          badgeClass(d) +
          '">' +
          escapeHtml(d) +
          '</span></div>' +
          '<div class="bd-chip-row">' +
          chipsHTML(store) +
          '</div></div>' +
          '<div class="bd-info-grid">' +
          cell('进件状态', onboardingDisplay(store)) +
          cell('门店联系人', dash(store.contact)) +
          cell('绑定 BD', dash(store.boundBd)) +
          cell('门店主体', dash(store.storeSubject)) +
          '<div class="bd-info-cell" style="grid-column:1/-1"><span class="l">配送仓库</span><div class="v"' +
          whClass +
          '>' +
          escapeHtml(dash(store.warehouse)) +
          '</div></div>' +
          '<div class="bd-info-cell" style="grid-column:1/-1"><span class="l">可提现手机</span><div class="v">' +
          (!store.withdrawPhone || !String(store.withdrawPhone).trim()
            ? '<span style="color:var(--bd-primary);font-weight:700">待添加</span>'
            : escapeHtml(store.withdrawPhone)) +
          '</div></div>' +
          '<div class="bd-info-cell" style="grid-column:1/-1"><span class="l">门店地址</span><div class="v" style="font-weight:400;opacity:.9;line-height:1.35">' +
          escapeHtml(dash(store.address)) +
          '</div></div>' +
          '</div>' +
          (showAudit
            ? '<div style="border-top:1px solid rgba(229,231,235,.6);background:rgba(37,99,235,.06);padding:10px" data-stop="1">' +
              '<button type="button" class="bd-btn bd-btn-primary" style="width:100%;box-shadow:none;border-radius:12px" data-audit="' +
              store.id +
              '">审核资料</button></div>'
            : '') +
          '</article>'
        );
      })
      .join('');

    if (!fr.list.length) {
      cards =
        '<div class="bd-empty"><p style="margin:0 0 8px;font-weight:700">暂无门店</p><p style="margin:0;font-size:12px;color:var(--bd-muted)">点击右下角添加门店或切换筛选</p></div>';
    }

    return (
      '<div class="bd-page-bar"><button type="button" class="bd-back" data-back-wb>‹</button><h1>门店管理</h1></div>' +
      '<div class="bd-search-wrap"><input type="search" placeholder="搜索门店名称、BD名称" id="bdLeadSearch" value="' +
      escapeHtml(searchQuery) +
      '"/></div>' +
      '<div class="bd-status-tabs" id="bdStatusTabs">' +
      tabs +
      '</div>' +
      '<div class="bd-store-card-list">' +
      cards +
      '</div>' +
      '<div class="bd-fab-row">' +
      '<button type="button" class="bd-btn bd-btn-outline" id="bdBtnQr"><span>▦</span> 门店入驻码</button>' +
      '<button type="button" class="bd-btn bd-btn-primary" id="bdBtnAdd"><span>+</span> 添加门店</button>' +
      '</div>' +
      '<div style="height:28px"></div>'
    );
  }

  function cell(label, val) {
    return (
      '<div class="bd-info-cell"><span class="l">' +
      escapeHtml(label) +
      '</span><div class="v">' +
      escapeHtml(val) +
      '</div></div>'
    );
  }

  function agreementSectionHTML(store, always) {
    var show =
      always ||
      store.phase === 'awaiting_leader' ||
      store.companyAgreementStatus === '待签署' ||
      store.companyAgreementStatus === '已签署';
    if (!show) return '';
    var statusDisplay =
      store.phase === 'awaiting_leader' && !store.companyAgreementStatus
        ? '待终审完成后自动生成'
        : dash(store.companyAgreementStatus);
    return (
      archiveCard(
        '📄',
        '门店与公司协议',
        '合作协议生成、签署与合同查阅',
        fieldBlock('协议状态', statusDisplay) +
          fieldBlock('协议编号', dash(store.companyAgreementNo)) +
          fieldBlock('生成时间', dash(store.companyAgreementGeneratedAt)) +
          fieldBlock('签署完成时间', dash(store.companyAgreementSignedAt)) +
          fieldBlock(
            '在线签署',
            store.companyAgreementSignUrl
              ? '<a href="' +
                escapeHtml(store.companyAgreementSignUrl) +
                '" target="_blank" rel="noopener" style="color:var(--bd-primary)">打开三方签署页（演示）</a>'
              : '—'
          ) +
          fieldBlock(
            '已签署合同',
            store.companyAgreementPdfUrl
              ? '<a href="' +
                escapeHtml(store.companyAgreementPdfUrl) +
                '" target="_blank" rel="noopener" style="color:var(--bd-primary)">查看 PDF（演示）</a>'
              : '—'
          )
      )
    );
  }

  function archiveCard(emoji, title, desc, fields) {
    return (
      '<div class="bd-archive-card"><div class="bd-archive-head">' +
      '<div style="width:40px;height:40px;border-radius:12px;background:var(--bd-primary-soft);display:flex;align-items:center;justify-content:center;font-size:20px">' +
      emoji +
      '</div><div style="min-width:0">' +
      '<h2>' +
      escapeHtml(title) +
      '</h2>' +
      (desc ? '<p>' + escapeHtml(desc) + '</p>' : '') +
      '</div></div><div class="bd-archive-fields">' +
      fields +
      '</div></div>'
    );
  }

  function mapPreview(store) {
    var ok = dash(store.regionCascade) !== '—' && dash(store.detailAddress) !== '—';
    if (!ok) {
      return '<div class="bd-map-preview" style="display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--bd-muted)">暂无地址信息，无法展示落点示意</div>';
    }
    return '<div class="bd-map-preview"><span class="bd-map-marker"></span></div>';
  }

  function archiveBody(store, appendAgreement) {
    var div = store.partnerDivision;
    var policy = div === '加盟店' || div === '合作店' || div === '同行店';
    var fr = div === '加盟店' || div === '合作店';
    var peer = div === '同行店';
    var parts = [];

    parts.push(
      archiveCard(
        '🏢',
        '基础信息',
        '名称与负责 BD',
        fieldBlock('门店主体', archiveText(store.storeSubject), true) +
          fieldBlock('门店名称', archiveText(store.name)) +
          fieldBlock('门店简称', archiveText(store.shortName)) +
          fieldBlock('绑定 BD', archiveText(store.boundBd)) +
          fieldBlock('门店编号', '<span style="font-family:monospace;font-size:12px">' + archiveText(store.merchantUid) + '</span>') +
          fieldBlock('审核通过时间', archiveText(store.approvedAt))
      )
    );

    var whStyle = store.warehouseNeedsAttention ? ' style="color:var(--bd-destructive);font-weight:700"' : '';
    parts.push(
      archiveCard(
        '📦',
        '配送与分类',
        '配送仓库默认随绑定 BD，可手动调整；门店合作类型与设备归类',
        fieldBlock('配送仓库', '<span' + whStyle + '>' + archiveText(store.warehouse) + '</span>') +
          fieldBlock('门店合作类型', archiveText(store.partnerDivision)) +
          (policy ? fieldBlock('门店类型', archiveText(store.storeType)) : '') +
          fieldBlock('有无冷藏柜', archiveText(store.hasRefrigeratedCabinet)) +
          fieldBlock('有无冷冻柜', archiveText(store.hasFreezerCabinet)) +
          fieldBlock('冷藏柜照片', archiveText(store.refrigeratedPhotoUploaded ? '已上传' : '—')) +
          fieldBlock('冷冻柜照片', archiveText(store.freezerPhotoUploaded ? '已上传' : '—'))
      )
    );

    if (policy) {
      parts.push(
        archiveCard(
          '📍',
          '地址与定位',
          '城市区域、详细地址与地图落点示意',
          fieldBlock('归属于城市区域（省 / 市 / 区）', archiveText(store.regionCascade)) +
            fieldBlock('详细地址', archiveText(store.detailAddress)) +
            '<div class="bd-field"><span class="lab">地图落点示意</span><div class="val" style="margin-top:6px">' +
            mapPreview(store) +
            '</div></div>'
        )
      );

      parts.push(
        archiveCard(
          '🖼',
          '门头照',
          '必传。用于便于放货和城管报备。',
          fieldBlock(
            '正门头照片',
            '<img class="bd-storefront-photo" alt="门头示意" src="data:image/svg+xml,' +
              encodeURIComponent(
                '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="160"><rect fill="#e5e7eb" width="100%" height="100%"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#64748b" font-size="14">门头示意</text></svg>'
              ) +
              '"/>' +
              (store.frontPhotoUploaded
                ? '<span style="display:inline-block;margin-top:6px;font-size:10px;font-weight:700;color:var(--bd-success)">已上传</span>'
                : '')
          )
        )
      );

      parts.push(
        archiveCard(
          '👤',
          '老板 / 联系人',
          '手机号验证与姓名（档案不落验证码）',
          fieldBlock('老板 / 负责人联系电话', archiveText(store.contactPhone), true) +
            fieldBlock('老板 / 联系人姓名', archiveText(store.contactName), true)
        )
      );

      if (fr) {
        parts.push(
          archiveCard(
            '📋',
            '影像与门店信息',
            '门店面积、楼层与店前店内口述视频',
            fieldBlock('门店店前左右两分钟（口述介绍）视频', archiveText(store.videoStorefrontIntroUrl ? '（视频）' : store.videoStorefrontIntroDone ? '已提交' : '—')) +
              fieldBlock('门店店内一分钟视频（口述介绍）', archiveText(store.videoInteriorIntroUrl ? '（视频）' : store.videoInteriorIntroDone ? '已提交' : '—')) +
              fieldBlock('门店面积（㎡）', archiveText(store.storeArea && store.storeArea !== '—' ? store.storeArea + ' ㎡' : '—'), true) +
              fieldBlock('门店楼层', archiveText(store.storeFloors), true)
          )
        );
        parts.push(
          archiveCard(
            '📋',
            '门店经营与认知',
            '门店经营情况与认知说明',
            fieldBlock('门店方圆五百米的总户数（实际入住户数）', archiveText(store.householdsWithin500m)) +
              fieldBlock('门店日均客单量', archiveText(store.dailyOrderVolume)) +
              fieldBlock('店内工作人员总数', archiveText(store.staffCount)) +
              fieldBlock('实际经营者对直播业务的理解', archiveText(store.liveCommerceUnderstanding)) +
              fieldBlock('门店日常运营的服务理解与配合', archiveText(store.dailyOpsCooperationNote)) +
              fieldBlock('老板对私域直播投入产出的期望（文字描述）', archiveText(store.privateLiveRoiExpectation)) +
              fieldBlock('老板了解私域直播或社区团购的程度（文字描述）', archiveText(store.privateCommerceFamiliarity)) +
              fieldBlock('店老板对周边小区的描述：（主要是周边小区类型和居住人群的描述）', archiveText(store.surroundingCommunityNote)) +
              fieldBlock('店老板对是否拉到1000人有信心', archiveText(store.confidenceReach1000))
          )
        );
        parts.push(
          archiveCard(
            '📋',
            '特殊情况说明',
            '选填；触发区域保护提醒时须用文字或图片补充说明。',
            fieldBlock('说明内容', archiveText(store.specialCircumstancesNote)) + fieldBlock('配图', '—')
          )
        );
      }
      if (peer) {
        parts.push(
          archiveCard(
            '📋',
            '同行店补充资料',
            '请如实填写以下资料',
            fieldBlock('合作平台现状：说明目前门店已合作的其他平台情况。', archiveText(store.otherPlatformsCooperation)) +
              fieldBlock('经营数据截图：需提供手机后台截图，包含前三天的上播数据及销量明细。', '—')
          )
        );
      }
    }

    var tail = appendAgreement ? agreementSectionHTML(store, false) : '';
    return '<div class="bd-archive-stack" style="padding:12px 12px 100px">' + parts.join('') + tail + '</div>';
  }

  function archiveText(v) {
    var t = (v || '').toString().trim();
    return !t || t === '—' ? '—' : t;
  }

  function fieldBlock(label, val, req) {
    return (
      '<div class="bd-field"><div class="row"><span class="lab">' +
      (req ? '<span class="req">*</span>' : '') +
      escapeHtml(label) +
      '</span></div><div class="val">' +
      (typeof val === 'string' && val.indexOf('<') >= 0 ? val : escapeHtml(String(val))) +
      '</div></div>'
    );
  }

  function renderWorkspace(id) {
    var store = getStore(id);
    if (!store) return '<p class="bd-empty">门店不存在</p>';
    var d = accountDisplayStatus(store);
    var onb = onboardingDisplay(store);
    var auditApproved = d === '审核成功';
    var alerts = '';
    if (store.phase === 'approved' && store.onboardingStatus === '待进件') {
      alerts +=
        '<div class="bd-audit-banner blue" style="margin:10px 12px">门店<strong>资料审核已通过</strong>，当前尚未发起<strong>商户进件</strong>。请尽快引导商户完成进件。<button type="button" style="margin-left:6px;border:none;background:none;color:var(--bd-primary);font-weight:700;cursor:pointer;text-decoration:underline" data-go-onboard>去进件</button></div>';
    }
    if (store.phase === 'draft') {
      alerts +=
        '<div class="bd-audit-banner blue" style="margin:10px 12px">当前为草稿（待提交），尚未进入审核流程。请点右上角「编辑资料」完善后使用「保存并提交」。</div>';
    }
    if (store.phase === 'awaiting_bd') {
      alerts +=
        '<div class="bd-audit-banner blue" style="margin:10px 12px">该门店待您 <strong>BD 初审</strong>。' +
        (canAudit(store)
          ? '<button type="button" style="margin-left:6px;border:none;background:none;color:var(--bd-primary);font-weight:700;cursor:pointer;text-decoration:underline" data-go-audit>去审核</button>'
          : '') +
        '</div>';
    }
    if (store.phase === 'awaiting_leader') {
      alerts +=
        '<div class="bd-audit-banner amber" style="margin:10px 12px">该门店处于 <strong>BD 总监终审</strong>，资料不可修改。' +
        (canAudit(store)
          ? '<button type="button" style="margin-left:6px;border:none;background:none;color:#b45309;font-weight:700;cursor:pointer;text-decoration:underline" data-go-audit>去审核</button>'
          : '') +
        '</div>';
    }

    var topBtns = '';
    if (canShare(store)) {
      topBtns +=
        '<button type="button" class="bd-btn bd-btn-outline" style="padding:6px 10px;font-size:12px;border-radius:8px" data-share>转发</button>';
    }
    topBtns +=
      '<button type="button" class="bd-btn bd-btn-outline" style="padding:6px 10px;font-size:12px;border-radius:8px"' +
      (store.phase === 'awaiting_leader' ? ' disabled' : '') +
      ' data-edit>编辑资料</button>';

    var created = store.approvedAt && store.approvedAt.trim() ? store.approvedAt : '—';

    var agreementCard = '';
    if (
      auditApproved &&
      (store.companyAgreementStatus === '待签署' || store.companyAgreementStatus === '已签署')
    ) {
      agreementCard =
        '<div style="margin:0 12px 12px;padding:14px;border-radius:16px;border:1px solid rgba(229,231,235,.7);background:#fff">' +
        '<h3 style="margin:0 0 10px;font-size:14px;font-weight:700">门店协议</h3>' +
        '<div style="font-size:12px"><span style="color:var(--bd-muted)">协议状态 </span>' +
        '<span style="font-weight:700">' +
        escapeHtml(store.companyAgreementStatus) +
        '</span></div>' +
        (store.companyAgreementNo
          ? '<button type="button" style="margin-top:10px;width:100%;text-align:left;padding:10px;border-radius:10px;border:1px solid var(--bd-border);background:rgba(249,250,251,.8);cursor:pointer" data-open-contract><span style="font-size:11px;color:var(--bd-muted);display:block">协议编号</span><span style="font-family:monospace;color:var(--bd-primary);font-weight:700">' +
            escapeHtml(store.companyAgreementNo) +
            '</span><span style="font-size:10px;color:var(--bd-muted)">点击查看合同</span></button>'
          : '') +
        '</div>';
    }

    var statsBlock = '';
    if (auditApproved) {
      statsBlock =
        '<div style="margin:0 12px 14px;padding:14px;border-radius:16px;border:1px solid rgba(229,231,235,.6);background:#fff">' +
        '<h3 style="margin:0 0 12px;font-size:14px;font-weight:700">门店数据</h3>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
        statTile('累计交易金额', '¥125.7万') +
        statTile('累计交易笔数', '8,520') +
        statTile('累计使用次数', '365') +
        statTile('商户产生订单', '9,200') +
        '</div>' +
        '<div style="margin-top:12px;border-radius:12px;border:1px solid rgba(229,231,235,.55);padding:12px;background:rgba(249,250,251,.35)">' +
        '<div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:11px;color:var(--bd-muted);font-weight:600">交易趋势</span>' +
        '<span style="font-size:11px;border-radius:8px;background:rgba(229,231,235,.5);padding:3px"><b style="padding:4px 8px;background:#fff;border-radius:7px;display:inline-block">日</b> <span style="opacity:.5">月</span></span></div>' +
        '<div style="display:flex;align-items:flex-end;gap:4px;height:120px;margin-top:10px">' +
        [40, 55, 35, 62, 48, 70]
          .map(function (h) {
            return (
              '<div style="flex:1;border-radius:4px 4px 0 0;background:rgba(37,99,235,.28);height:' +
              h +
              '%"></div>'
            );
          })
          .join('') +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--bd-muted);margin-top:6px;font-variant-numeric:tabular-nums">' +
        ['03-20', '03-22', '03-24', '03-26', '03-28', '03-31'].map(function (d) {
          return '<span>' + d + '</span>';
        }).join('') +
        '</div></div>' +
        '</div>';
    }

    return (
      '<div class="bd-page-bar"><button type="button" class="bd-back" data-back-list>‹</button><h1>门店档案</h1>' +
      '<button type="button" style="margin-left:auto;border:none;background:none;font-size:12px;color:var(--bd-muted);cursor:pointer" data-open-history="' +
      store.id +
      '">审核记录</button></div>' +
      '<div style="margin:12px">' +
      alerts +
      '<div style="border-radius:16px;padding:16px;background:#fff;box-shadow:0 2px 16px rgba(15,23,42,.08);border:1px solid rgba(229,231,235,.55)">' +
      '<div style="display:flex;justify-content:space-between;gap:8px">' +
      '<h2 style="margin:0;font-size:17px;font-weight:800;line-height:1.3">' +
      escapeHtml(store.name) +
      '</h2><div style="display:flex;flex-wrap:wrap;gap:6px">' +
      topBtns +
      '</div></div>' +
      '<div style="margin-top:14px;font-size:13px;display:flex;flex-direction:column;gap:12px">' +
      '<div><span style="color:var(--bd-muted);font-size:12px">创建时间：</span><span style="font-weight:600;font-variant-numeric:tabular-nums">' +
      escapeHtml(created) +
      '</span></div>' +
      '<div><div style="font-size:11px;font-weight:600;color:var(--bd-muted);margin-bottom:8px">当前状态</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      '<button type="button" data-open-history="' +
      store.id +
      '" style="border:none;border-radius:999px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer;' +
      badgeClass(d) +
      '">资料审核 · ' +
      escapeHtml(d) +
      '</button>' +
      '<span style="border-radius:999px;padding:5px 10px;font-size:11px;font-weight:700' +
      (onb === '进件成功' ? badgeClass('审核成功') : onb === '进件中' ? badgeClass('审核中') : 'background:rgba(100,116,139,.08);color:#475569') +
      '">进件 · ' +
      escapeHtml(onb) +
      '</span></div></div></div></div>' +
      agreementCard +
      statsBlock +
      archiveBody(store, false) +
      '</div>'
    );
  }

  function statTile(label, val) {
    return (
      '<div style="display:flex;gap:10px;padding:12px;border-radius:14px;border:1px solid rgba(229,231,235,.45)">' +
      '<div style="width:38px;height:38px;border-radius:50%;background:var(--bd-primary-soft)"></div>' +
      '<div style="min-width:0">' +
      '<div style="font-size:11px;color:var(--bd-muted)">' +
      escapeHtml(label) +
      '</div>' +
      '<div style="font-size:13px;font-weight:700;margin-top:4px">' +
      escapeHtml(val) +
      '</div></div></div>'
    );
  }

  function renderAudit(id) {
    var store = getStore(id);
    if (!store) return '<p class="bd-empty">门店不存在</p>';
    var bdStage = store.phase === 'awaiting_bd';
    var leaderStage = store.phase === 'awaiting_leader';
    var showActions = canAudit(store);
    var banner = '';
    if (bdStage) {
      banner =
        '<div class="bd-audit-banner blue" style="margin:10px 12px"><strong>当前环节：BD 初审</strong><span style="color:var(--bd-muted)">（可在底部「编辑资料」修改门店信息后提交；或使用驳回/审核通过）</span></div>';
    }
    if (leaderStage) {
      banner =
        '<div class="bd-audit-banner amber" style="margin:10px 12px"><strong>当前环节：BD 总监终审</strong><span style="display:block;margin-top:6px">资料不可修改；请根据 BD 提交资料完成终审。</span></div>';
    }
    var rejectBox = '';
    if (store.rejectReason) {
      rejectBox =
        '<div style="margin:10px 12px;padding:12px;border-radius:12px;border:1px solid rgba(220,38,38,.25);background:rgba(220,38,38,.05)">' +
        '<p style="margin:0;font-size:12px;font-weight:700;color:var(--bd-destructive)">最新驳回原因</p>' +
        '<p style="margin:8px 0 0;font-size:14px">' +
        escapeHtml(store.rejectReason) +
        '</p>' +
        (store.systemFailureDetail
          ? '<button type="button" style="margin-top:10px;width:100%;padding:8px;border-radius:8px;border:1px solid var(--bd-border);background:#fff;cursor:pointer;font-size:12px" data-sysfail>查看系统失败详情</button>'
          : '') +
        '</div>';
    }
    var actions = '';
    if (showActions) {
      if (bdStage && canShare(store)) {
        actions =
          '<div class="bd-audit-actions grid-2">' +
          '<button type="button" class="bd-btn bd-btn-outline" style="border-radius:12px;box-shadow:none" data-ed>编辑资料</button>' +
          '<button type="button" class="bd-btn bd-btn-outline" style="border-radius:12px;box-shadow:none" data-fw>转发</button>' +
          '<button type="button" class="bd-btn bd-btn-outline" style="border-radius:12px;box-shadow:none" data-rej>驳回</button>' +
          '<button type="button" class="bd-btn bd-btn-primary" style="border-radius:12px" data-apr>审核通过</button>' +
          '</div>';
      } else if (bdStage) {
        actions =
          '<div class="bd-audit-actions" style="grid-template-columns:1fr 1fr 1fr;display:grid;gap:8px">' +
          '<button type="button" class="bd-btn bd-btn-outline" style="border-radius:12px;box-shadow:none" data-ed>编辑资料</button>' +
          '<button type="button" class="bd-btn bd-btn-outline" style="border-radius:12px;box-shadow:none" data-rej>驳回</button>' +
          '<button type="button" class="bd-btn bd-btn-primary" style="border-radius:12px" data-apr>审核通过</button>' +
          '</div>';
      } else {
        actions =
          '<div class="bd-audit-actions" style="display:flex;gap:8px">' +
          '<button type="button" class="bd-btn bd-btn-outline" style="flex:1;border-radius:12px;box-shadow:none" data-rej>驳回</button>' +
          '<button type="button" class="bd-btn bd-btn-primary" style="flex:1;border-radius:12px" data-apr>审核通过</button>' +
          '</div>';
      }
    }
    return (
      '<div class="bd-page-bar"><button type="button" class="bd-back" data-back-ws>‹</button><h1>审核资料</h1></div>' +
      banner +
      rejectBox +
      '<div style="margin:8px 10px 100px;border-radius:12px;border:1px solid rgba(229,231,235,.75);background:#fff;padding:6px">' +
      archiveBody(store, true) +
      '</div>' +
      actions
    );
  }

  function renderHistory(id) {
    var store = getStore(id);
    if (!store) return '<p class="bd-empty">门店不存在</p>';
    var rows = (store.auditHistory || [])
      .map(function (h) {
        return (
          '<div style="padding:12px;border-bottom:1px solid var(--bd-border)">' +
          '<div style="display:flex;justify-content:space-between;font-size:12px"><strong>' +
          escapeHtml(h.stage) +
          '</strong><span style="color:var(--bd-muted);font-variant-numeric:tabular-nums">' +
          escapeHtml(h.auditedAt) +
          '</span></div>' +
          '<div style="font-size:11px;color:var(--bd-muted);margin-top:4px">' +
          escapeHtml(h.auditorLabel) +
          ' · ' +
          escapeHtml(h.result) +
          '</div>' +
          '<div style="font-size:13px;margin-top:8px">' +
          escapeHtml(h.remark) +
          '</div></div>'
        );
      })
      .join('');
    if (!rows) rows = '<div class="bd-empty" style="margin:12px">暂无审核记录</div>';
    return (
      '<div class="bd-page-bar"><button type="button" class="bd-back" data-back-ws>‹</button><h1>资料审核记录</h1></div>' +
      '<div style="margin:12px;border-radius:12px;border:1px solid var(--bd-border);background:#fff;overflow:hidden">' +
      rows +
      '</div>'
    );
  }

  function renderAgreements() {
    var rel = stores.filter(function (s) {
      return s.companyAgreementStatus === '待签署' || s.companyAgreementStatus === '已签署';
    });
    var tab = route.sub || '全部';
    var filtered = rel.filter(function (s) {
      if (tab === '全部') return true;
      return s.companyAgreementStatus === tab;
    });
    var cAll = rel.length;
    var cP = rel.filter(function (s) {
      return s.companyAgreementStatus === '待签署';
    }).length;
    var cS = rel.filter(function (s) {
      return s.companyAgreementStatus === '已签署';
    }).length;
    var tabs =
      ['全部', '待签署', '已签署']
        .map(function (t) {
          var n = t === '全部' ? cAll : t === '待签署' ? cP : cS;
          return (
            '<button type="button" class="bd-status-tab' +
            (tab === t ? ' bd-active' : '') +
            '" data-ag-tab="' +
            t +
            '">' +
            t +
            '<span class="c">' +
            n +
            '</span></button>'
          );
        })
        .join('');
    var cards = filtered
      .map(function (s) {
        return (
          '<div class="bd-store-card" style="cursor:default;margin-bottom:10px" data-id="' +
          s.id +
          '">' +
          '<div style="padding:14px;display:flex;gap:10px">' +
          '<div style="width:40px;height:40px;border-radius:10px;background:var(--bd-primary-soft);display:flex;align-items:center;justify-content:center">🏢</div>' +
          '<div style="flex:1;min-width:0">' +
          '<div style="font-weight:700">' +
          escapeHtml(s.name) +
          '</div>' +
          '<div style="font-size:11px;color:var(--bd-muted);margin-top:4px">' +
          escapeHtml(s.merchantUid) +
          '</div>' +
          '<div style="margin-top:8px"><span class="bd-store-badge" style="' +
          badgeClass(s.companyAgreementStatus === '已签署' ? '审核成功' : '待提交') +
          '">' +
          escapeHtml(s.companyAgreementStatus) +
          '</span></div></div>' +
          '<button type="button" class="bd-btn bd-btn-outline" style="padding:8px 12px;font-size:12px;align-self:center;border-radius:10px;box-shadow:none" data-open-ws="' +
          s.id +
          '">档案</button></div></div>'
        );
      })
      .join('');
    if (!cards) cards = '<div class="bd-empty" style="margin:12px">暂无协议门店</div>';
    return (
      '<div class="bd-page-bar"><button type="button" class="bd-back" data-back-wb>‹</button><h1>协议管理</h1></div>' +
      '<div class="bd-status-tabs" style="margin-top:8px">' +
      tabs +
      '</div>' +
      '<div style="padding:12px 12px 40px">' +
      cards +
      '</div>'
    );
  }

  function renderEdit(id) {
    var store = getStore(id);
    if (!store) return '<p class="bd-empty">门店不存在</p>';
    return (
      '<div class="bd-page-bar"><button type="button" class="bd-back" data-back-ws>‹</button><h1>编辑资料</h1></div>' +
      '<div style="padding:12px 14px 80px">' +
      '<p style="font-size:12px;color:var(--bd-muted);margin:0 0 12px">演示：以下为关键字段编辑，对齐 bd-guanli StoreEditPage 主信息。</p>' +
      '<div class="bd-field" style="margin-bottom:14px">' +
      '<label class="lab"><span class="req">*</span> 门店主体</label>' +
      '<input id="edf_subject" style="margin-top:6px;width:100%;padding:10px;border:1px solid var(--bd-border);border-radius:10px;font-size:14px" value="' +
      escapeHtml(store.storeSubject || '') +
      '"/></div>' +
      '<div class="bd-field" style="margin-bottom:14px">' +
      '<label class="lab">门店名称</label>' +
      '<input id="edf_name" style="margin-top:6px;width:100%;padding:10px;border:1px solid var(--bd-border);border-radius:10px;font-size:14px" value="' +
      escapeHtml(store.name || '') +
      '"/></div>' +
      '<div class="bd-field" style="margin-bottom:14px">' +
      '<label class="lab">详细地址</label>' +
      '<input id="edf_detail" style="margin-top:6px;width:100%;padding:10px;border:1px solid var(--bd-border);border-radius:10px;font-size:14px" value="' +
      escapeHtml(store.detailAddress || '') +
      '"/></div>' +
      '<div class="bd-field" style="margin-bottom:14px">' +
      '<label class="lab">绑定 BD（只读）</label>' +
      '<input readonly style="margin-top:6px;width:100%;padding:10px;border:1px solid var(--bd-border);border-radius:10px;font-size:14px;background:#f9fafb" value="' +
      escapeHtml(store.boundBd || '') +
      '"/></div>' +
      '</div>' +
      '<div class="bd-audit-actions" style="display:flex;gap:8px">' +
      '<button type="button" class="bd-btn bd-btn-outline" style="flex:1;border-radius:12px;box-shadow:none;font-size:14px" id="edfSaveDraft">保存草稿</button>' +
      '<button type="button" class="bd-btn bd-btn-primary" style="flex:1;border-radius:12px;font-size:14px" id="edfSubmit">保存并提交</button>' +
      '</div>'
    );
  }

  function mount() {
    var root = qs('#bd-stores-root');
    if (!root) return;
    var html = '';
    if (route.name === 'list') html = renderList();
    else if (route.name === 'workspace') html = renderWorkspace(route.id);
    else if (route.name === 'audit') html = renderAudit(route.id);
    else if (route.name === 'history') html = renderHistory(route.id);
    else if (route.name === 'agreements') html = renderAgreements();
    else if (route.name === 'edit') html = renderEdit(route.id);
    root.innerHTML = html;
    wire();
  }

  function wire() {
    var root = qs('#bd-stores-root');
    root.querySelectorAll('[data-back-list]').forEach(function (b) {
      b.onclick = function () {
        route = { name: 'list' };
        mount();
      };
    });
    root.querySelectorAll('[data-back-ws]').forEach(function (b) {
      b.onclick = function () {
        route = { name: 'workspace', id: route.id };
        mount();
      };
    });
    root.querySelectorAll('[data-back-wb]').forEach(function (b) {
      b.onclick = function () {
        location.href = (window.bdPage || function (x) {
          return x;
        })('mdm_bd_workbench.html');
      };
    });
    var search = qs('#bdLeadSearch');
    if (search) {
      search.oninput = function () {
        searchQuery = search.value;
      };
      search.onkeydown = function (e) {
        if (e.key === 'Enter') mount();
      };
    }
    var tabs = qs('#bdStatusTabs');
    if (tabs) {
      tabs.querySelectorAll('.bd-status-tab').forEach(function (btn) {
        btn.onclick = function () {
          statusFilter = btn.getAttribute('data-tab') || '全部';
          mount();
        };
      });
    }
    root.querySelectorAll('.bd-store-card').forEach(function (card) {
      if (card.getAttribute('data-stop')) return;
      card.onclick = function (e) {
        if ((e.target && e.target.closest && e.target.closest('[data-stop]')) || (e.target && e.target.closest('[data-audit]')))
          return;
        var id = card.getAttribute('data-id');
        if (id) {
          route = { name: 'workspace', id: Number(id) };
          mount();
        }
      };
    });
    root.querySelectorAll('[data-audit]').forEach(function (b) {
      b.onclick = function (ev) {
        ev.stopPropagation();
        route = { name: 'audit', id: Number(b.getAttribute('data-audit')) };
        mount();
      };
    });
    var btnQr = qs('#bdBtnQr');
    if (btnQr) {
      btnQr.onclick = function () {
        location.href = (window.bdPage || function (x) {
          return x;
        })('mdm_bd_personal.html#store-qr');
      };
    }
    var btnAdd = qs('#bdBtnAdd');
    if (btnAdd) {
      btnAdd.onclick = function () {
        route = { name: 'edit', id: getStore(8) ? 8 : stores[stores.length - 1].id };
        mount();
      };
    }
    root.querySelectorAll('[data-go-audit]').forEach(function (b) {
      b.onclick = function () {
        route = { name: 'audit', id: route.name === 'workspace' ? route.id : route.id };
        mount();
      };
    });
    root.querySelectorAll('[data-go-onboard]').forEach(function (b) {
      b.onclick = function () {
        location.href = (window.bdPage || function (x) {
          return x;
        })('mdm_bd_merchants.html#onboarding');
      };
    });
    root.querySelectorAll('[data-open-history]').forEach(function (b) {
      b.onclick = function () {
        var sid = Number(b.getAttribute('data-open-history'));
        route = { name: 'history', id: sid || route.id };
        mount();
      };
    });
    root.querySelectorAll('[data-edit],[data-ed]').forEach(function (b) {
      b.onclick = function () {
        route = { name: 'edit', id: route.id };
        mount();
      };
    });
    root.querySelectorAll('[data-share],[data-fw]').forEach(function (b) {
      b.onclick = function () {
        window.bdToast && window.bdToast('已复制补充资料链接（演示）');
      };
    });
    root.querySelectorAll('[data-open-contract]').forEach(function (b) {
      b.onclick = function () {
        var store = getStore(route.id);
        if (store && store.companyAgreementPdfUrl) window.open(store.companyAgreementPdfUrl, '_blank');
        else if (store && store.companyAgreementSignUrl) window.open(store.companyAgreementSignUrl, '_blank');
        else window.bdToast && window.bdToast('暂无可查看的合同链接');
      };
    });
    root.querySelectorAll('[data-sysfail]').forEach(function (b) {
      b.onclick = function () {
        var store = getStore(route.id);
        alert(store && store.systemFailureDetail ? store.systemFailureDetail : '—');
      };
    });
    root.querySelectorAll('[data-rej]').forEach(function (b) {
      b.onclick = function () {
        qs('#bdModalReject').classList.add('bd-show');
      };
    });
    root.querySelectorAll('[data-apr]').forEach(function (b) {
      b.onclick = function () {
        qs('#bdModalApprove').classList.add('bd-show');
      };
    });
    root.querySelectorAll('[data-ag-tab]').forEach(function (b) {
      b.onclick = function () {
        route = { name: 'agreements', sub: b.getAttribute('data-ag-tab') };
        mount();
      };
    });
    root.querySelectorAll('[data-open-ws]').forEach(function (b) {
      b.onclick = function (ev) {
        ev.stopPropagation();
        route = { name: 'workspace', id: Number(b.getAttribute('data-open-ws')) };
        mount();
      };
    });
    var saveD = qs('#edfSaveDraft');
    if (saveD) {
      saveD.onclick = function () {
        var st = getStore(route.id);
        if (!st) return;
        st.storeSubject = (qs('#edf_subject') || {}).value;
        st.name = (qs('#edf_name') || {}).value;
        st.detailAddress = (qs('#edf_detail') || {}).value;
        st.address =
          String(st.regionCascade || '').replace(/\s*\/\s*/g, '') && st.detailAddress
            ? String(st.regionCascade).replace(/\//g, ' / ') + ' ' + st.detailAddress
            : st.address;
        window.bdToast && window.bdToast('草稿已保存（演示）');
        route = { name: 'workspace', id: st.id };
        mount();
      };
    }
    var saveS = qs('#edfSubmit');
    if (saveS) {
      saveS.onclick = function () {
        var st = getStore(route.id);
        if (!st) return;
        st.storeSubject = (qs('#edf_subject') || {}).value;
        st.name = (qs('#edf_name') || {}).value;
        st.detailAddress = (qs('#edf_detail') || {}).value;
        if (st.phase === 'draft') {
          st.phase = 'awaiting_bd';
          st.submittedAt = fmtTs();
        }
        window.bdToast && window.bdToast('已提交审核（演示）');
        route = { name: 'workspace', id: st.id };
        mount();
      };
    }
  }

  function openModalClose() {
    ['#bdModalReject', '#bdModalApprove'].forEach(function (sel) {
      var m = qs(sel);
      if (m) {
        m.classList.remove('bd-show');
        var ta = m.querySelector('textarea');
        if (ta) ta.value = '';
      }
    });
  }

  function confirmReject() {
    var store = getStore(route.id);
    var ta = qs('#bdRejectTa');
    if (!store || !ta || !ta.value.trim()) {
      window.bdToast && window.bdToast('请填写驳回说明');
      return;
    }
    store.phase = 'rejected';
    store.rejectReason = ta.value.trim();
    store.systemFailureDetail = undefined;
    openModalClose();
    window.bdToast && window.bdToast('已驳回');
    route = { name: 'list' };
    mount();
  }

  function confirmApprove() {
    var store = getStore(route.id);
    var ta = qs('#bdApproveTa');
    if (!store) return;
    var remark = ta ? ta.value.trim() : '';
    var at = fmtTs();
    if (!store.auditHistory) store.auditHistory = [];
    if (store.phase === 'awaiting_bd') {
      store.phase = 'awaiting_leader';
      store.bdApprovedAt = at;
      store.auditHistory.push({
        id: 'h' + Date.now(),
        stage: 'BD初审',
        auditorLabel: 'BD · ' + store.boundBd,
        auditedAt: at,
        result: '通过',
        remark: remark || '—',
      });
      window.bdToast && window.bdToast('审核通过', '已进入 BD 总监审核');
    } else if (store.phase === 'awaiting_leader') {
      store.phase = 'approved';
      store.approvedAt = at;
      store.companyAgreementStatus = '待签署';
      store.companyAgreementNo = 'HT-DEMO-' + store.id;
      store.companyAgreementGeneratedAt = at;
      store.companyAgreementSignUrl = 'https://esign.example.com/sign?demo=' + store.id;
      store.auditHistory.push({
        id: 'h' + Date.now(),
        stage: 'BD总监终审',
        auditorLabel: 'BD 总监 · 李敏',
        auditedAt: at,
        result: '通过',
        remark: remark || '—',
      });
      window.bdToast && window.bdToast('审核完成', '已生成合作协议（演示）');
    }
    openModalClose();
    route = { name: 'workspace', id: store.id };
    mount();
  }

  function parseHash() {
    var h = (location.hash || '').replace(/^#/, '');
    if (h === 'agreements') route = { name: 'agreements', sub: '全部' };
    else if (h === 'list' || !h) route = { name: 'list' };
    else if (h.indexOf('workspace/') === 0) route = { name: 'workspace', id: Number(h.split('/')[1]) };
    else if (h.indexOf('audit/') === 0) route = { name: 'audit', id: Number(h.split('/')[1]) };
    else if (h.indexOf('edit/') === 0) route = { name: 'edit', id: Number(h.split('/')[1]) };
    else if (h.indexOf('history/') === 0) route = { name: 'history', id: Number(h.split('/')[1]) };
  }

  function init() {
    function bootstrap(data) {
      stores = JSON.parse(JSON.stringify(Array.isArray(data) ? data : []));
      parseHash();
      mount();
      window.addEventListener('hashchange', function () {
        parseHash();
        mount();
      });
    }
    if (window.__BD_STORE_AUDITS__) {
      bootstrap(window.__BD_STORE_AUDITS__);
    } else {
      fetch(
        (document.body.getAttribute('data-json-stores') || '').trim() ||
          new URL('../js/mdm-bd-store-audits.json', location.href).toString()
      )
        .then(function (r) {
          return r.json();
        })
        .then(bootstrap)
        .catch(function () {
          qs('#bd-stores-root').innerHTML = '<p class="bd-empty">无法加载门店数据</p>';
        });
    }

    var rej = qs('#bdModalReject');
    if (rej) {
      rej.querySelectorAll('[data-close]').forEach(function (b) {
        b.onclick = openModalClose;
      });
      qs('#bdConfirmReject').onclick = confirmReject;
    }
    var apr = qs('#bdModalApprove');
    if (apr) {
      apr.querySelectorAll('[data-close]').forEach(function (b) {
        b.onclick = openModalClose;
      });
      qs('#bdConfirmApprove').onclick = confirmApprove;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
