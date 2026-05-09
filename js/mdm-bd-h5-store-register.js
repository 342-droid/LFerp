/**
 * 门店扫码 H5：注册 / 补充资料 / 提交后状态 — 对齐 bd-guanli-main
 * StoreRegistrationForm + H5StoreRegisterPage + H5StoreStatusPage
 */
(function () {
  var MOCK_POIS = [
    {
      id: 'poi-xf',
      displayName: '鲜丰水果文一西路店',
      regionCascade: '浙江省 / 杭州市 / 西湖区',
      detailAddress: '文一西路 558 号 1 层临街',
      lng: 120.09841,
      lat: 30.28552,
      mapX: 42,
      mapY: 48
    },
    {
      id: 'poi-oldbbq',
      displayName: '老城烧烤武林店',
      regionCascade: '浙江省 / 杭州市 / 拱墅区',
      detailAddress: '武林广场延安路 508 号',
      lng: 120.16352,
      lat: 30.27622,
      mapX: 55,
      mapY: 38
    },
    {
      id: 'poi-sams',
      displayName: '山姆会员商店奥体店',
      regionCascade: '浙江省 / 杭州市 / 滨江区',
      detailAddress: '飞虹路 1408 号',
      lng: 120.23688,
      lat: 30.21005,
      mapX: 68,
      mapY: 62
    }
  ];
  var REGION_PRESETS = [
    '浙江省 / 杭州市 / 西湖区',
    '浙江省 / 杭州市 / 拱墅区',
    '浙江省 / 杭州市 / 滨江区',
    '浙江省 / 杭州市 / 上城区',
    '浙江省 / 杭州市 / 余杭区',
    '—'
  ];
  var BD_WAREHOUSES = ['华东 RDC-杭州', '杭州城市前置仓', '图书中央仓'];
  var BD_CODE_TO_NAME = { BD20240001: '李泽峰', BD2024LZF: '李泽峰' };

  function qsParse() {
    var p = {};
    location.search
      .slice(1)
      .split('&')
      .forEach(function (x) {
        var a = x.split('=');
        if (a[0]) p[decodeURIComponent(a[0])] = decodeURIComponent((a[1] || '').replace(/\+/g, ' '));
      });
    return p;
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  function resolveBdName(id) {
    if (!id || id === '—') return '—';
    return BD_CODE_TO_NAME[id] || id;
  }

  function defaultWarehouse(bdKey) {
    return BD_WAREHOUSES[0];
  }

  function filterPois(q) {
    var t = String(q || '').trim();
    if (!t) return [];
    var lower = t.toLowerCase();
    return MOCK_POIS.filter(function (p) {
      return (
        p.displayName.indexOf(t) >= 0 ||
        p.displayName.toLowerCase().indexOf(lower) >= 0 ||
        p.detailAddress.indexOf(t) >= 0 ||
        p.regionCascade.indexOf(t) >= 0
      );
    });
  }

  function protectionHint(partnerDivision, regionCascade, detailAddress) {
    var div = String(partnerDivision || '').trim();
    if (!div || div === '同行店') return { show: false, msg: '' };
    var text = String(regionCascade || '') + String(detailAddress || '');
    if (text.indexOf('西湖区') >= 0 && /文一西路|558/.test(text)) {
      return {
        show: true,
        msg:
          '该区域涉及区域保护范围，已有门店建档。请更换选址，或在「特殊情况说明」中备注并经 BD 总监确认后再提交。'
      };
    }
    return { show: false, msg: '' };
  }

  function maskPhone(p) {
    var d = String(p).replace(/\D/g, '');
    if (d.length >= 11) return d.slice(0, 3) + '****' + d.slice(-4);
    return p || '';
  }

  function formatCoords(p) {
    return '经度 ' + p.lng.toFixed(5) + '，纬度 ' + p.lat.toFixed(5) + '（地图选点）';
  }

  function h5BaseUrl() {
    var bp = window.bdPage || function (f) {
      return f;
    };
    var u = bp('mdm_bd_h5.html');
    if (/^https?:/i.test(u)) return u.replace(/#.*$/, '');
    var loc = window.location.pathname.replace(/[^/]+$/, '');
    if (u.indexOf('/') === 0) return window.location.origin + u;
    return window.location.origin + loc + u;
  }

  function navigateStatus(params) {
    var q = new URLSearchParams(params).toString();
    window.location.href = h5BaseUrl().split('?')[0] + '?' + q + '#status';
  }

  function renderBlocked(title, msg) {
    return (
      '<div class="h5-head-bar"><h1>' +
      esc(title) +
      '</h1></div>' +
      '<div class="h5-block-msg"><p>' +
      esc(msg) +
      '</p></div>'
    );
  }

  function renderStatusPage() {
    var q = qsParse();
    var STATUS = {
      pending: {
        title: '申请已提交',
        desc: '门店注册资料已提交至 BD 审核处，请等待 BD 审核。审核结果将由 BD 同步通知。',
        badge: '待审核',
        tone: 'h5-st-icon--amber'
      },
      updated: {
        title: '资料已更新',
        desc: '您提交的门店资料已同步至 BD，请等待 BD 审核。如需继续修改可返回表单。',
        badge: '待审核',
        tone: 'h5-st-icon--sky'
      },
      cancelled: {
        title: '已取消',
        desc: '本次填写已取消，未提交注册。如需注册请重新扫码打开链接。',
        badge: '已取消',
        tone: 'h5-st-icon--muted'
      },
      approved: {
        title: '审核通过',
        desc: '门店资料审核已通过，后续将由 BD 协助完成进件与开店准备。',
        badge: '审核成功',
        tone: 'h5-st-icon--green'
      }
    };
    var raw = q.status || 'pending';
    var meta = STATUS[raw === 'draft' || !STATUS[raw] ? 'pending' : raw];
    var storeName = q.storeName || '您的门店';
    var bdId = q.bdId || '—';
    var storeId = (q.storeId || '').trim();
    var bdName = (q.bdName || '').trim() || resolveBdName(bdId);
    var showId = bdId !== '—' && bdName !== bdId;

    var now = new Date();
    var pad = function (n) {
      return n < 10 ? '0' + n : '' + n;
    };
    var submittedAt =
      now.getFullYear() +
      '-' +
      pad(now.getMonth() + 1) +
      '-' +
      pad(now.getDate()) +
      ' ' +
      pad(now.getHours()) +
      ':' +
      pad(now.getMinutes());

    var backQs = new URLSearchParams();
    if (bdId !== '—') backQs.set('bdId', bdId);
    if (storeId) backQs.set('storeId', storeId);
    var backHref = h5BaseUrl().split('?')[0] + (backQs.toString() ? '?' + backQs.toString() : '') + '#register';

    return (
      '<div class="h5-status-wrap">' +
      '<div class="h5-status-card">' +
      '<div class="h5-st-icon ' +
      meta.tone +
      '">⌛</div>' +
      '<h1 class="h5-st-title">' +
      esc(meta.title) +
      '</h1>' +
      '<p class="h5-st-desc">' +
      esc(meta.desc) +
      '</p>' +
      '<div class="h5-st-meta">' +
      '<div class="h5-st-rowline"><span class="h5-muted">当前状态</span><span class="h5-badge">' +
      esc(meta.badge) +
      '</span></div>' +
      '<div class="h5-st-grid">' +
      '<div class="h5-st-line"><span class="h5-muted">门店名称</span><b>' +
      esc(storeName) +
      '</b></div>' +
      '<div class="h5-st-line"><span class="h5-muted">绑定 BD</span><div class="h5-st-bd">' +
      '<span>' +
      esc(bdName) +
      '</span>' +
      (showId ? '<small>工号 ' + esc(bdId) + '</small>' : '') +
      '</div></div>' +
      '<div class="h5-st-line"><span class="h5-muted">提交时间</span><b>' +
      (raw === 'cancelled' ? '—' : esc(submittedAt)) +
      '</b></div>' +
      '</div></div>' +
      (raw !== 'cancelled'
        ? '<div class="h5-st-actions">' +
          '<button type="button" class="bd-btn bd-btn-outline" id="h5StRefresh">刷新状态</button>' +
          '<button type="button" class="bd-btn bd-btn-primary" id="h5StContinue">继续填写</button>' +
          '</div>'
        : '') +
      '</div></div>'
    );
  }

  function bindStatus(root) {
    var r = document.getElementById('h5StRefresh');
    if (r) r.onclick = function () {
      window.location.reload();
    };
    var c = document.getElementById('h5StContinue');
    if (c)
      c.onclick = function () {
        var q = qsParse();
        var backQs = new URLSearchParams();
        if (q.bdId) backQs.set('bdId', q.bdId);
        if (q.storeId) backQs.set('storeId', q.storeId);
        window.location.href = h5BaseUrl().split('?')[0] + (backQs.toString() ? '?' + backQs.toString() : '') + '#register';
      };
  }

  var BD_STORES_SESSION_KEY = 'lf_bd_stores_v1';

  function bdStoresPageHref() {
    var bp = window.bdPage || function (f) {
      return f;
    };
    return bp('mdm_bd_stores.html');
  }

  function findPoiIdByAddress(detail) {
    var t = String(detail || '').trim();
    if (!t) return null;
    var hit = MOCK_POIS.find(function (p) {
      return t.indexOf(p.detailAddress) >= 0 || p.detailAddress.indexOf(t) >= 0;
    });
    return hit ? hit.id : null;
  }

  function mapJsonStoreToSt(rec) {
    var pid = findPoiIdByAddress(rec.detailAddress);
    var st0 = {
      storeSubject: rec.storeSubject && rec.storeSubject !== '—' ? rec.storeSubject : rec.name || '',
      name: rec.name || '',
      shortName: rec.shortName && rec.shortName !== '—' ? rec.shortName : '',
      warehouse: rec.warehouse || defaultWarehouse('BD20240001'),
      partnerDivision: rec.partnerDivision || '',
      storeTypeDetail: (rec.storeType && rec.storeType !== '—' ? rec.storeType : '') || '',
      hasRef: rec.hasRefrigeratedCabinet || '',
      hasFre: rec.hasFreezerCabinet || '',
      refPhotos: [],
      frePhotos: [],
      mapQuery: rec.name || '',
      selectedPoiId: pid,
      regionCascade: (rec.regionCascade || '').replace(/\s*\/\s*/g, ' / ') || '',
      detailAddress: rec.detailAddress || '',
      gaodeTxt: rec.gaodeLocationText || '',
      frontPhoto: !!rec.frontPhotoUploaded,
      contactPhone: String(rec.contactPhone || '').replace(/\*+/, '0000'),
      verifyCode: '8888',
      contactName: rec.contactName || '',
      storeArea: rec.storeArea || '',
      storeFloors: rec.storeFloors || '',
      vidF: '',
      vidI: '',
      householdsWithin500m: rec.householdsWithin500m || '',
      dailyOrderVolume: rec.dailyOrderVolume || '',
      staffCount: rec.staffCount || '',
      liveCommerceUnderstanding: rec.liveCommerceUnderstanding || '',
      dailyOpsCooperationNote: rec.dailyOpsCooperationNote || '',
      privateLiveRoiExpectation: rec.privateLiveRoiExpectation || '',
      privateCommerceFamiliarity: rec.privateCommerceFamiliarity || '',
      surroundingCommunityNote: rec.surroundingCommunityNote || '',
      confidenceReach1000: rec.confidenceReach1000 || '',
      specialCircumstancesNote:
        rec.specialCircumstancesNote && rec.specialCircumstancesNote !== '—' ? rec.specialCircumstancesNote : '',
      specialPhotos: [],
      otherPlatforms: rec.otherPlatformsCooperation || '',
      broadcastPhotos: [],
      companyCb: !!rec.companyCallbackNotified
    };
    if (!st0.selectedPoiId && st0.regionCascade && st0.detailAddress) {
      st0.selectedPoiId = 'legacy';
    }
    if (!st0.gaodeTxt && st0.selectedPoiId && st0.selectedPoiId !== 'legacy') {
      var po = MOCK_POIS.find(function (x) {
        return x.id === st0.selectedPoiId;
      });
      if (po) st0.gaodeTxt = formatCoords(po);
    }
    return st0;
  }

  function fmtNowBd() {
    var now = new Date();
    var p = function (n) {
      return n < 10 ? '0' + n : '' + n;
    };
    return (
      now.getFullYear() +
      '-' +
      p(now.getMonth() + 1) +
      '-' +
      p(now.getDate()) +
      ' ' +
      p(now.getHours()) +
      ':' +
      p(now.getMinutes())
    );
  }

  function applyStToStoreRecord(st, rec, boundBdName, submitMode, isCreate) {
    var masked = st.contactPhone;
    var contactLine = ((st.contactName || '').trim() + ' ' + (masked || '').trim()).trim() || '—';
    var addrLine =
      [st.regionCascade, (st.detailAddress || '').trim()].join(' ').replace(/\s+/g, ' ').trim() || '—';
    var typeTrim = (st.storeTypeDetail || '').trim();
    var phase;
    if (submitMode === 'draft') {
      phase = isCreate ? 'draft' : rec.phase;
    } else {
      if (isCreate) phase = 'awaiting_leader';
      else if (rec.phase === 'draft') phase = 'awaiting_leader';
      else if (rec.phase === 'awaiting_bd') phase = 'awaiting_leader';
      else phase = rec.phase;
    }
    var out = Object.assign({}, rec, {
      name: (st.name || '').trim() || (isCreate ? '未命名门店' : rec.name),
      storeSubject: (st.storeSubject || '').trim() || '—',
      storeType: typeTrim || rec.storeType || '—',
      shortName: (st.shortName || '').trim() || '—',
      warehouse: st.warehouse || rec.warehouse,
      boundBd: boundBdName,
      partnerDivision: st.partnerDivision || rec.partnerDivision,
      regionCascade: st.regionCascade,
      detailAddress: st.detailAddress,
      contactPhone: masked || rec.contactPhone,
      contactName: st.contactName,
      contact: contactLine,
      address: addrLine,
      withdrawPhone: masked || rec.withdrawPhone || '—',
      hasRefrigeratedCabinet: st.hasRef || undefined,
      hasFreezerCabinet: st.hasFre || undefined,
      frontPhotoUploaded: !!st.frontPhoto,
      gaodeLocationText: st.gaodeTxt,
      storeArea: st.storeArea,
      storeFloors: st.storeFloors,
      householdsWithin500m: st.householdsWithin500m,
      dailyOrderVolume: st.dailyOrderVolume,
      staffCount: st.staffCount,
      liveCommerceUnderstanding: st.liveCommerceUnderstanding,
      dailyOpsCooperationNote: st.dailyOpsCooperationNote,
      privateLiveRoiExpectation: st.privateLiveRoiExpectation,
      privateCommerceFamiliarity: st.privateCommerceFamiliarity,
      surroundingCommunityNote: st.surroundingCommunityNote,
      confidenceReach1000: st.confidenceReach1000,
      specialCircumstancesNote: (st.specialCircumstancesNote || '').trim() || '—',
      otherPlatformsCooperation: (st.otherPlatforms || '').trim() || '—',
      companyCallbackNotified: !!st.companyCb,
      phase: phase
    });
    if (submitMode === 'submit' && !isCreate && rec.phase === 'awaiting_bd' && phase === 'awaiting_leader') {
      if (!out.auditHistory) out.auditHistory = [];
      out.auditHistory = out.auditHistory.concat([
        {
          id: 'h' + Date.now(),
          stage: 'BD初审',
          auditorLabel: 'BD · ' + boundBdName,
          auditedAt: fmtNowBd(),
          result: '通过',
          remark: '资料修订并提交终审'
        }
      ]);
      out.bdApprovedAt = fmtNowBd();
    }
    if (isCreate && submitMode === 'submit') {
      out.submittedAt = fmtNowBd();
    }
    if (isCreate && submitMode === 'draft') {
      out.phase = 'draft';
    }
    return out;
  }

  var _bdStoresLoadedOnce = null;

  function mountBdStoreFormPage() {
    var root = document.getElementById('bd-store-form-root');
    if (!root || document.body.getAttribute('data-bd-store-form') !== '1') return false;

    var storesUrl =
      (document.body.getAttribute('data-json-stores') || '').trim() ||
      new URL('../js/mdm-bd-store-audits.json', location.href).toString();

    function resolveFromSession(base) {
      var raw = sessionStorage.getItem(BD_STORES_SESSION_KEY);
      if (raw) {
        try {
          var o = JSON.parse(raw);
          if (Array.isArray(o) && o.length) return o;
        } catch (e) {}
      }
      return Array.isArray(base) ? base : [];
    }

    function paint(data) {
      var merged = resolveFromSession(data);
      _bdStoresLoadedOnce = merged;
      var h = (location.hash || '').replace(/^#/, '');
      var isCreate = h === 'new' || h === '';
      var editId = null;
      if (h.indexOf('edit/') === 0) editId = parseInt(h.replace(/^edit\//, ''), 10);
      var record = null;
      if (!isCreate && editId != null && !isNaN(editId)) {
        record = merged.find(function (s) {
          return String(s.id) === String(editId);
        });
      }
      var bdCtx = {
        mode: 'bd',
        isCreate: isCreate,
        record: record,
        stores: merged,
        boundBd: '李泽峰'
      };
      renderForm(root, bdCtx);
    }

    if (window.__BD_STORE_AUDITS__) {
      paint(window.__BD_STORE_AUDITS__);
    } else {
      fetch(storesUrl)
        .then(function (r) {
          return r.json();
        })
        .then(paint)
        .catch(function () {
          root.innerHTML = '<p class="bd-empty" style="margin:16px">无法加载门店数据</p>';
        });
    }
    if (!mountBdStoreFormPage._wired) {
      mountBdStoreFormPage._wired = true;
      window.addEventListener('hashchange', function () {
        if (document.body.getAttribute('data-bd-store-form') !== '1') return;
        var base = _bdStoresLoadedOnce ? _bdStoresLoadedOnce.slice() : window.__BD_STORE_AUDITS__ || [];
        paint(Array.isArray(base) ? base : []);
      });
    }
    return true;
  }

  function renderForm(root, bdCtx) {
    bdCtx = bdCtx || null;
    var isBdApp = !!(bdCtx && bdCtx.mode === 'bd');
    var q = qsParse();
    var storeIdRaw = '';
    var supplementMode = false;
    var phaseBlocked = false;
    var boundBd;

    if (isBdApp) {
      if (!bdCtx.isCreate && (!bdCtx.record || bdCtx.record.id == null)) {
        root.innerHTML = renderBlocked('编辑门店', '门店不存在或已被删除。');
        return;
      }
      boundBd = bdCtx.boundBd || '李泽峰';
    } else {
      var bdId = (q.bdId || q.bdEmployeeCode || 'BD20240001').trim();
      storeIdRaw = (q.storeId || '').trim();
      boundBd = bdId;

      if (storeIdRaw === '404') {
        root.innerHTML = renderBlocked('门店资料', '未找到该门店，链接可能已失效。请联系拓展 BD 重新获取补充资料链接。');
        return;
      }
      supplementMode = storeIdRaw === '1';
      phaseBlocked = storeIdRaw === '2';
      if (phaseBlocked) {
        root.innerHTML = renderBlocked(
          '门店资料',
          '当前门店状态无需店长在此补充资料；若有疑问请联系拓展 BD。'
        );
        return;
      }
    }

    var MAX_REF = 5;
    var MAX_SP = 6;
    var MAX_BR = 6;

    var st = {
      storeSubject: '',
      name: '',
      shortName: '',
      warehouse: defaultWarehouse(boundBd),
      partnerDivision: '',
      storeTypeDetail: '',
      hasRef: '',
      hasFre: '',
      refPhotos: [],
      frePhotos: [],
      mapQuery: '',
      selectedPoiId: null,
      regionCascade: '',
      detailAddress: '',
      gaodeTxt: '',
      frontPhoto: false,
      contactPhone: '',
      verifyCode: '',
      contactName: '',
      storeArea: '',
      storeFloors: '',
      vidF: '',
      vidI: '',
      householdsWithin500m: '',
      dailyOrderVolume: '',
      staffCount: '',
      liveCommerceUnderstanding: '',
      dailyOpsCooperationNote: '',
      privateLiveRoiExpectation: '',
      privateCommerceFamiliarity: '',
      surroundingCommunityNote: '',
      confidenceReach1000: '',
      specialCircumstancesNote: '',
      specialPhotos: [],
      otherPlatforms: '',
      broadcastPhotos: [],
      companyCb: false
    };

    if (isBdApp && !bdCtx.isCreate && bdCtx.record) {
      var mapped = mapJsonStoreToSt(bdCtx.record);
      Object.keys(mapped).forEach(function (k) {
        st[k] = mapped[k];
      });
    }

    function policyOn() {
      return !!st.partnerDivision;
    }
    function isFP() {
      return st.partnerDivision === '加盟店' || st.partnerDivision === '合作店';
    }
    function isPeer() {
      return st.partnerDivision === '同行店';
    }

    function poiListHtml() {
      var list = filterPois(st.mapQuery);
      if (!String(st.mapQuery).trim()) {
        return '<p class="h5-hint">输入关键字展示候选列表；点选一行即可完成地图选点。</p>';
      }
      if (!list.length) {
        return '<p class="h5-poi-empty">未找到匹配项，请更换关键字（演示仅含少量示例数据）</p>';
      }
      return list
        .map(function (p) {
          var active = st.selectedPoiId === p.id ? ' is-active' : '';
          return (
            '<button type="button" class="h5-poi-item' +
            active +
            '" data-poi="' +
            esc(p.id) +
            '">' +
            '<div class="h5-poi-title">' +
            esc(p.displayName) +
            '</div>' +
            '<div class="h5-poi-sub">' +
            esc(p.regionCascade + ' · ' + p.detailAddress) +
            '</div></button>'
          );
        })
        .join('');
    }

    function mapMarkerStyle() {
      var p = MOCK_POIS.find(function (x) {
        return x.id === st.selectedPoiId;
      });
      if (!p) return '';
      return 'left:' + p.mapX + '%;top:' + p.mapY + '%;';
    }

    function prot() {
      return protectionHint(st.partnerDivision, st.regionCascade, st.detailAddress);
    }

    function fullRender() {
      var whOpts = BD_WAREHOUSES.slice();
      if (st.warehouse && whOpts.indexOf(st.warehouse) < 0) whOpts.unshift(st.warehouse);
      var pageTitle = supplementMode ? '补充门店资料' : '门店注册';
      var subLbl = supplementMode ? '资料补充' : '扫码注册';
      var heroDesc = supplementMode
        ? '请根据 BD 要求查漏补缺；提交后资料将同步给 BD，仍需等待审核。'
        : '请按实际情况填写门店注册资料，提交后将进入审核流程。';
      if (isBdApp) {
        pageTitle = bdCtx.isCreate ? '添加门店' : '编辑门店';
        subLbl = '门店资料';
        heroDesc =
          '以下内容用于生鲜赋能同行门店入驻审核，须如实填写；资料不全将无法进入审核。加盟店 / 合作店适用区域保护规则（与 PC 后台保护半径一致）。';
      }

      var html =
        '<div class="h5-form-root">' +
        '<div class="h5-head-bar"><h1>' +
        esc(pageTitle) +
        '</h1></div>' +
        '<div class="h5-hero-card">' +
        '<p class="h5-hero-k">' +
        esc(subLbl) +
        '</p>' +
        '<h2 class="h5-hero-t">' +
        esc(st.name.trim() || '未命名门店') +
        '</h2>' +
        '<p class="h5-hero-d">' +
        esc(heroDesc) +
        '</p></div>' +
        '<div class="h5-sections">' +
        secBuilding() +
        secDelivery() +
        (!policyOn() ? '<div class="h5-dash-hint">请先选择「门店合作类型」，系统将展示对应的资料项。</div>' : '') +
        (policyOn() ? secAddr() + secFacade() + secContact() + secFranchise() + secPeer() + secCompany() : '') +
        '</div>' +
        '<div class="h5-footer-bar">' +
        (isBdApp
          ? '<button type="button" class="bd-btn bd-btn-ghost" id="h5Cancel">取消</button>' +
            '<button type="button" class="bd-btn bd-btn-outline" id="h5Draft" style="box-shadow:none">保存资料</button>' +
            '<button type="button" class="bd-btn bd-btn-primary" id="h5Submit">保存并提交</button>'
          : '<button type="button" class="bd-btn bd-btn-ghost" id="h5Cancel">取消</button>' +
            '<button type="button" class="bd-btn bd-btn-primary" id="h5Submit">提交申请</button>') +
        '</div></div>';

      root.innerHTML = html;

      bindFormEvents();
    }

    function secBuilding() {
      return (
        '<section class="h5-sec"><div class="h5-sec-head"><span class="h5-sec-ic">■</span><div><h3 class="h5-sec-t">基础信息</h3>' +
        '<p class="h5-sec-s">名称与负责 BD</p></div></div>' +
        '<div class="h5-sec-body">' +
        field('门店主体', true, '<input type="text" class="h5-input" id="f_subject" placeholder="营业执照主体" />') +
        field('门店名称', true, '<input type="text" class="h5-input" id="f_name" placeholder="请输入门店名称" />') +
        field('门店简称', false, '<input type="text" class="h5-input" id="f_short" placeholder="如：鲜丰-文一西路店" />') +
        field(
          '绑定 BD',
          false,
          '<input type="text" class="h5-input h5-input-dis" readonly value="' +
          esc(boundBd) +
          '" />',
          isBdApp ? '默认当前登录账号，不可更改' : '由链接参数确定'
        ) +
        '</div></section>'
      );
    }

    function secDelivery() {
      var whOpts = BD_WAREHOUSES.slice();
      if (st.warehouse && whOpts.indexOf(st.warehouse) < 0) whOpts.unshift(st.warehouse);
      return (
        '<section class="h5-sec"><div class="h5-sec-head"><span class="h5-sec-ic">◆</span><div><h3 class="h5-sec-t">配送与分类</h3>' +
        '<p class="h5-sec-s">配送仓库默认随绑定 BD；合作类型与设备</p></div></div>' +
        '<div class="h5-sec-body">' +
        field(
          '配送仓库',
          false,
          '<select class="h5-input" id="f_wh">' +
          whOpts
            .map(function (w) {
              return '<option value="' + esc(w) + '">' + esc(w) + '</option>';
            })
            .join('') +
          '</select>',
          '默认：' + esc(defaultWarehouse(boundBd))
        ) +
        field(
          '门店合作类型',
          true,
          '<select class="h5-input" id="f_partner">' +
          '<option value="">加盟店 / 合作店 / 同行店</option>' +
          '<option value="加盟店">加盟店</option><option value="合作店">合作店</option><option value="同行店">同行店</option>' +
          '</select>'
        ) +
        (policyOn()
          ? field(
              '门店类型',
              true,
              '<input type="text" class="h5-input" id="f_storetype" placeholder="如社区生鲜店、团购自提点" />'
            )
          : '') +
        field(
          '有无冷藏柜',
          false,
          '<select class="h5-input" id="f_hasref"><option value="">可选填</option><option value="有">有</option><option value="无">无</option></select>'
        ) +
        field(
          '有无冷冻柜',
          false,
          '<select class="h5-input" id="f_hasfre"><option value="">可选填</option><option value="有">有</option><option value="无">无</option></select>'
        ) +
        refPhotoRow('冷藏柜照片', 'ref', MAX_REF) +
        refPhotoRow('冷冻柜照片', 'fre', MAX_REF) +
        '</div></section>'
      );
    }

    function refPhotoRow(label, kind, max) {
      var count = kind === 'ref' ? st.refPhotos.length : st.freezerPhotos.length;
      var dis = (kind === 'ref' ? st.hasRef : st.hasFre) !== '有';
      return (
        '<div class="h5-field"><label class="h5-lab">' +
        esc(label) +
        ' <span class="h5-hint-r">最多 ' +
        max +
        ' 张</span></label>' +
        '<input type="file" accept="image/*" multiple class="h5-hidden" id="f_file_' +
        kind +
        '" />' +
        '<div class="h5-up-row">' +
        '<button type="button" class="bd-btn bd-btn-outline h5-up-btn" data-up="' +
        kind +
        '"' +
        (dis ? ' disabled' : '') +
        '>上传照片</button>' +
        '<span class="h5-hint-r">' +
        count +
        '/' +
        max +
        '</span></div>' +
        '<div class="h5-thumb-grid" id="th_' +
        kind +
        '"></div></div>'
      );
    }

    function secAddr() {
      var ph = prot();
      return (
        '<section class="h5-sec">' +
        '<div class="h5-sec-head"><span class="h5-sec-ic">📍</span><div><h3 class="h5-sec-t">地址与定位</h3>' +
        '<p class="h5-sec-s">搜索选点、省市区与详细地址</p></div></div>' +
        '<div class="h5-sec-body">' +
        '<p class="h5-rule">同行店无地域保护：同区域内已有同行店时，可继续在同区域开设同行店；同区域内已有加盟店或合作店时，该区域不得再开设加盟店、合作店或同行店。</p>' +
        field('搜索门店位置', false, '<input type="text" class="h5-input" id="f_mapq" placeholder="鲜丰、武林、山姆…" />') +
        '<div class="h5-poi-list" id="poiList">' +
        poiListHtml() +
        '</div>' +
        '<div class="h5-field"><span class="h5-lab">地图落点示意</span>' +
        '<div class="h5-map-mock"><div class="h5-map-pin" id="mapPin" style="' +
        (st.selectedPoiId ? mapMarkerStyle() : 'display:none') +
        '"></div>' +
        (!st.selectedPoiId ? '<span class="h5-map-ph">完成选点后在此显示示意位置</span>' : '') +
        '</div></div>' +
        field(
          '归属于城市区域（省 / 市 / 区）',
          true,
          '<select class="h5-input" id="f_region">' +
          REGION_PRESETS.map(function (r) {
            return '<option value="' + esc(r) + '">' + esc(r) + '</option>';
          }).join('') +
          '</select>'
        ) +
        field('详细地址', true, '<input type="text" class="h5-input" id="f_detail" placeholder="街道、门牌号" />') +
        (ph.show
          ? '<div class="h5-alert h5-alert-warn"><strong>区域保护提醒</strong><p>' + esc(ph.msg) + '</p></div>'
          : '') +
        '<p class="h5-note2">「区域地图 · 保护范围」可视化示意安排在二期；现阶段请以列表选点与 PC 后台区域规则为准。</p>' +
        '</div></section>'
      );
    }

    function secFacade() {
      return (
        '<section class="h5-sec"><div class="h5-sec-head"><span class="h5-sec-ic">▣</span><div><h3 class="h5-sec-t">门头照</h3>' +
        '<p class="h5-sec-s">必传，城管报备</p></div></div>' +
        '<div class="h5-sec-body">' +
        '<div class="h5-facade"><div class="h5-facade-img"></div>' +
        (st.frontPhoto ? '<span class="h5-facade-badge">已上传</span>' : '') +
        '</div>' +
        '<button type="button" class="bd-btn bd-btn-outline" style="width:100%" id="f_front">' +
        (st.frontPhoto ? '更换正门头照片' : '上传正门头照片') +
        '</button></div></section>'
      );
    }

    function secContact() {
      return (
        '<section class="h5-sec"><div class="h5-sec-head"><span class="h5-sec-ic">◎</span><div><h3 class="h5-sec-t">老板 / 联系人</h3>' +
        '<p class="h5-sec-s">手机号验证</p></div></div>' +
        '<div class="h5-sec-body">' +
        '<div class="h5-field"><label class="h5-lab"><span class="req">*</span>老板 / 负责人联系电话</label>' +
        '<div class="h5-row2"><input type="tel" class="h5-input" id="f_phone" placeholder="手机号" />' +
        '<button type="button" class="bd-btn bd-btn-outline" id="f_sms">获取验证码</button></div></div>' +
        field('短信验证码', true, '<input type="text" class="h5-input" id="f_code" maxlength="6" placeholder="4–6 位" />', supplementMode ? '店长补充可演示跳过' : '') +
        field('老板 / 联系人姓名', true, '<input type="text" class="h5-input" id="f_cname" />') +
        '</div></section>'
      );
    }

    function secFranchise() {
      if (!isFP()) return '';
      return (
        '<section class="h5-sec"><div class="h5-sec-head"><span class="h5-sec-ic">☰</span><div><h3 class="h5-sec-t">加盟店/合作店补充</h3>' +
        '<p class="h5-sec-s">面积、视频与经营认知</p></div></div>' +
        '<div class="h5-sec-body">' +
        field('门店面积（㎡）', true, '<input type="text" class="h5-input" id="f_area" inputmode="decimal" />') +
        field('门店楼层', true, '<input type="text" class="h5-input" id="f_floor" placeholder="如 1F" />') +
        ta('实际经营者对直播业务的理解', 'f_liveu') +
        ta('门店日常运营的服务理解与配合', 'f_daily') +
        ta('老板对私域直播投入产出的期望', 'f_roi') +
        ta('了解私域直播或社区团购的程度', 'f_fam') +
        ta('周边小区及居住人群描述', 'f_surr') +
        ta('对是否拉到1000人有信心', 'f_conf') +
        '<div class="h5-field"><label class="h5-lab">特殊情况说明</label>' +
        '<textarea class="h5-ta" id="f_spec" placeholder="如无特殊情况可填写：无"></textarea></div>' +
        specPhotosRow() +
        '</div></section>'
      );
    }

    function ta(lab, id) {
      return (
        '<div class="h5-field"><label class="h5-lab">' +
        esc(lab) +
        '</label><textarea class="h5-ta" id="' +
        id +
        '"></textarea></div>'
      );
    }

    function specPhotosRow() {
      return (
        '<div class="h5-field"><label class="h5-lab">特殊情况配图 <span class="h5-hint-r">' +
        st.specialPhotos.length +
        '/' +
        MAX_SP +
        '</span></label>' +
        '<input type="file" accept="image/*" multiple class="h5-hidden" id="f_specph" />' +
        '<button type="button" class="bd-btn bd-btn-outline" id="f_specbtn">上传图片</button>' +
        '<div class="h5-thumb-grid" id="th_spec"></div></div>'
      );
    }

    function secPeer() {
      if (!isPeer()) return '';
      return (
        '<section class="h5-sec"><div class="h5-sec-head"><span class="h5-sec-ic">☰</span><div><h3 class="h5-sec-t">同行店补充</h3></div></div>' +
        '<div class="h5-sec-body">' +
        '<div class="h5-field"><label class="h5-lab">合作平台现状</label>' +
        '<textarea class="h5-ta" id="f_plat" placeholder="美团、多多买菜等"></textarea></div>' +
        '<div class="h5-field"><label class="h5-lab">近三天上播及销量截图 <span class="h5-hint-r">' +
        st.broadcastPhotos.length +
        '/' +
        MAX_BR +
        '</span></label>' +
        '<input type="file" accept="image/*" multiple class="h5-hidden" id="f_broad" />' +
        '<button type="button" class="bd-btn bd-btn-outline" id="f_broadbtn">上传经营截图</button>' +
        '<div class="h5-thumb-grid" id="th_broad"></div></div>' +
        '</div></section>'
      );
    }

    function secCompany() {
      return (
        '<section class="h5-sec h5-sec--flat"><label class="h5-cb">' +
        '<input type="checkbox" id="f_company" />' +
        '<span><strong class="req">*</strong> 已知晓需接听公司公务来电（17316440268、17339691157）。</span></label></section>'
      );
    }

    function field(lab, req, inner, hint) {
      return (
        '<div class="h5-field"><div class="h5-labrow"><label class="h5-lab">' +
        (req ? '<span class="req">*</span>' : '') +
        esc(lab) +
        '</label>' +
        (hint ? '<span class="h5-hint-r">' + esc(hint) + '</span>' : '') +
        '</div>' +
        inner +
        '</div>'
      );
    }

    function readFormToState() {
      var el = function (id) {
        return document.getElementById(id);
      };
      if (el('f_subject')) st.storeSubject = el('f_subject').value;
      if (el('f_name')) st.name = el('f_name').value;
      if (el('f_short')) st.shortName = el('f_short').value;
      if (el('f_wh')) st.warehouse = el('f_wh').value;
      if (el('f_partner')) st.partnerDivision = el('f_partner').value;
      if (el('f_storetype')) st.storeTypeDetail = el('f_storetype').value;
      if (el('f_hasref')) st.hasRef = el('f_hasref').value;
      if (el('f_hasfre')) st.hasFre = el('f_hasfre').value;
      if (el('f_mapq')) st.mapQuery = el('f_mapq').value;
      if (el('f_region')) st.regionCascade = el('f_region').value;
      if (el('f_detail')) st.detailAddress = el('f_detail').value;
      if (el('f_phone')) st.contactPhone = el('f_phone').value;
      if (el('f_code')) st.verifyCode = el('f_code').value;
      if (el('f_cname')) st.contactName = el('f_cname').value;
      if (el('f_area')) st.storeArea = el('f_area').value;
      if (el('f_floor')) st.storeFloors = el('f_floor').value;
      if (el('f_liveu')) st.liveCommerceUnderstanding = el('f_liveu').value;
      if (el('f_daily')) st.dailyOpsCooperationNote = el('f_daily').value;
      if (el('f_roi')) st.privateLiveRoiExpectation = el('f_roi').value;
      if (el('f_fam')) st.privateCommerceFamiliarity = el('f_fam').value;
      if (el('f_surr')) st.surroundingCommunityNote = el('f_surr').value;
      if (el('f_conf')) st.confidenceReach1000 = el('f_conf').value;
      if (el('f_spec')) st.specialCircumstancesNote = el('f_spec').value;
      if (el('f_plat')) st.otherPlatforms = el('f_plat').value;
      if (el('f_company')) st.companyCb = el('f_company').checked;
    }

    function syncFromDom() {
      readFormToState();
      fullRender();
      fillDomFromState();
    }

    function fillDomFromState() {
      var el = function (id) {
        return document.getElementById(id);
      };
      if (el('f_subject')) el('f_subject').value = st.storeSubject;
      if (el('f_name')) el('f_name').value = st.name;
      if (el('f_short')) el('f_short').value = st.shortName;
      if (el('f_wh')) el('f_wh').value = st.warehouse;
      if (el('f_partner')) el('f_partner').value = st.partnerDivision;
      if (el('f_storetype')) el('f_storetype').value = st.storeTypeDetail;
      if (el('f_hasref')) el('f_hasref').value = st.hasRef;
      if (el('f_hasfre')) el('f_hasfre').value = st.hasFre;
      if (el('f_mapq')) el('f_mapq').value = st.mapQuery;
      if (el('f_region')) el('f_region').value = st.regionCascade;
      if (el('f_detail')) el('f_detail').value = st.detailAddress;
      if (el('f_phone')) el('f_phone').value = st.contactPhone;
      if (el('f_code')) el('f_code').value = st.verifyCode;
      if (el('f_cname')) el('f_cname').value = st.contactName;
      if (el('f_area')) el('f_area').value = st.storeArea;
      if (el('f_floor')) el('f_floor').value = st.storeFloors;
      if (el('f_liveu')) el('f_liveu').value = st.liveCommerceUnderstanding;
      if (el('f_daily')) el('f_daily').value = st.dailyOpsCooperationNote;
      if (el('f_roi')) el('f_roi').value = st.privateLiveRoiExpectation;
      if (el('f_fam')) el('f_fam').value = st.privateCommerceFamiliarity;
      if (el('f_surr')) el('f_surr').value = st.surroundingCommunityNote;
      if (el('f_conf')) el('f_conf').value = st.confidenceReach1000;
      if (el('f_spec')) el('f_spec').value = st.specialCircumstancesNote;
      if (el('f_plat')) el('f_plat').value = st.otherPlatforms;
      if (el('f_company')) el('f_company').checked = st.companyCb;
      renderThumbs('th_ref', st.refPhotos);
      renderThumbs('th_fre', st.freezerPhotos);
      renderThumbs('th_spec', st.specialPhotos);
      renderThumbs('th_broad', st.broadcastPhotos);
    }

    function renderThumbs(hostId, urls) {
      var host = document.getElementById(hostId);
      if (!host) return;
      host.innerHTML = urls
        .map(function (u, i) {
          return (
            '<div class="h5-thumb"><img src="' +
            esc(u) +
            '" alt=""/>' +
            '<button type="button" class="h5-thumb-x" data-x="' +
            hostId +
            '" data-i="' +
            i +
            '">×</button></div>'
          );
        })
        .join('');
    }

    function mergePhotos(arr, files, max) {
      for (var i = 0; i < files.length && arr.length < max; i++) {
        arr.push(URL.createObjectURL(files[i]));
      }
      return arr;
    }

    function persistBdStore(mode) {
      if (!isBdApp || !bdCtx) return;
      var stores = bdCtx.stores.slice();
      var nm = bdCtx.boundBd || '李泽峰';
      if (bdCtx.isCreate) {
        var maxId = stores.reduce(function (m, s) {
          return Math.max(m, Number(s.id) || 0);
        }, 0);
        var newId = maxId + 1;
        var rec = {
          id: newId,
          merchantUid: 'MU-DEMO-' + newId,
          onboardingStatus: '待进件',
          deliveryMode: '—',
          storeCategory: '',
          storeTags: [],
          auditHistory: []
        };
        rec = applyStToStoreRecord(st, rec, nm, mode, true);
        stores.push(rec);
        sessionStorage.setItem(BD_STORES_SESSION_KEY, JSON.stringify(stores));
        bdToast &&
          bdToast(
            mode === 'draft' ? '已暂存' : '已提交',
            mode === 'draft'
              ? '草稿已保存，可继续编辑'
              : '门店已创建并提交至 BD 总监审核（演示）'
          );
        location.href = bdStoresPageHref() + '#workspace/' + newId;
        return;
      }
      var idx = stores.findIndex(function (s) {
        return String(s.id) === String(bdCtx.record.id);
      });
      if (idx < 0) return;
      stores[idx] = applyStToStoreRecord(st, Object.assign({}, stores[idx]), nm, mode, false);
      sessionStorage.setItem(BD_STORES_SESSION_KEY, JSON.stringify(stores));
      bdToast && bdToast(mode === 'draft' ? '已暂存' : '已保存', mode === 'draft' ? '草稿已保存' : '门店资料已更新（演示）');
      location.href = bdStoresPageHref() + '#workspace/' + bdCtx.record.id;
    }

    function validate() {
      if (!st.storeSubject.trim()) {
        window.bdToast && bdToast('请填写门店主体');
        return false;
      }
      if (!st.name.trim()) {
        bdToast('请填写门店名称');
        return false;
      }
      if (!st.partnerDivision) {
        bdToast('请选择门店合作类型');
        return false;
      }
      if (!st.storeTypeDetail.trim()) {
        bdToast('请填写门店类型');
        return false;
      }
      if (!st.regionCascade.trim() || st.regionCascade === '—') {
        bdToast('请选择省市区');
        return false;
      }
      if (!st.detailAddress.trim()) {
        bdToast('请填写详细地址');
        return false;
      }
      var legacyMapOk =
        isBdApp &&
        bdCtx &&
        !bdCtx.isCreate &&
        String(st.regionCascade || '').trim() &&
        String(st.detailAddress || '').trim();
      if ((!st.selectedPoiId || st.selectedPoiId === 'legacy') && !legacyMapOk) {
        bdToast('请完成地图选点', '请在列表中选中 POI');
        return false;
      }
      if (!st.contactPhone.trim()) {
        bdToast('请填写联系电话');
        return false;
      }
      var skipSms = supplementMode;
      if (!skipSms && (!st.verifyCode.trim() || st.verifyCode.length < 4)) {
        bdToast('请填写验证码');
        return false;
      }
      if (!st.contactName.trim()) {
        bdToast('请填写联系人姓名');
        return false;
      }
      if (isFP()) {
        if (!st.storeArea.trim()) {
          bdToast('请填写门店面积');
          return false;
        }
        if (!st.storeFloors.trim()) {
          bdToast('请填写门店楼层');
          return false;
        }
        var ph = prot();
        var sp = st.specialCircumstancesNote.trim();
        if (ph.show) {
          var okText = sp.length > 0 && sp !== '无';
          var hasPic = st.specialPhotos.length > 0;
          if (!okText && !hasPic) {
            bdToast('区域保护：请填写特殊情况说明或上传配图');
            return false;
          }
          if (sp === '无' && !hasPic) {
            bdToast('区域保护：不可仅填「无」而无配图');
            return false;
          }
        }
      }
      if (!st.companyCb) {
        bdToast('请勾选知晓公务来电');
        return false;
      }
      if (!st.frontPhoto) {
        bdToast('请上传门头照片');
        return false;
      }
      return true;
    }

    function bindFormEvents() {
      var el = function (id) {
        return document.getElementById(id);
      };

      function onInp(ids, fn) {
        ids.forEach(function (id) {
          var n = el(id);
          if (n) {
            n.oninput = fn;
            n.onchange = fn;
          }
        });
      }
      onInp(
        [
          'f_subject',
          'f_name',
          'f_short',
          'f_partner',
          'f_storetype',
          'f_hasref',
          'f_hasfre',
          'f_mapq',
          'f_region',
          'f_detail',
          'f_phone',
          'f_code',
          'f_cname',
          'f_area',
          'f_floor',
          'f_liveu',
          'f_daily',
          'f_roi',
          'f_fam',
          'f_surr',
          'f_conf',
          'f_spec',
          'f_plat',
          'f_company'
        ],
        function () {
          readFormToState();
          if (this && this.id === 'f_mapq') {
            document.getElementById('poiList').innerHTML = poiListHtml();
          }
          if (this && this.id === 'f_partner') {
            syncFromDom();
            return;
          }
          if (this && (this.id === 'f_name' || this.id === 'f_subject')) {
            var h2 = document.querySelector('.h5-hero-t');
            if (h2) h2.textContent = st.name.trim() || '未命名门店';
          }
        }
      );

      if (el('f_wh'))
        el('f_wh').onchange = function () {
          readFormToState();
        };

      document.querySelectorAll('.h5-poi-item').forEach(function (b) {
        b.onclick = function () {
          var id = b.getAttribute('data-poi');
          var p = MOCK_POIS.find(function (x) {
            return x.id === id;
          });
          if (!p) return;
          st.selectedPoiId = p.id;
          st.regionCascade = p.regionCascade;
          st.detailAddress = p.detailAddress;
          st.gaodeTxt = formatCoords(p);
          st.mapQuery = p.displayName;
          readFormToState();
          fullRender();
          fillDomFromState();
          document.getElementById('poiList').innerHTML = poiListHtml();
          var pin = document.getElementById('mapPin');
          if (pin) {
            pin.style.cssText = mapMarkerStyle();
            pin.style.display = 'block';
          }
          bdToast && bdToast('已选点', '省市区与地址已更新');
        };
      });

      ['f_file_ref', 'f_file_fre'].forEach(function (fid, idx) {
        var inp = el(fid);
        if (!inp) return;
        inp.onchange = function () {
          readFormToState();
          var files = inp.files;
          var arr = idx === 0 ? st.refPhotos : st.freezerPhotos;
          var kind = idx === 0 ? 'ref' : 'fre';
          var max = MAX_REF;
          if (kind === 'ref' && st.hasRef !== '有') return;
          if (kind === 'fre' && st.hasFre !== '有') return;
          mergePhotos(arr, files, max);
          fullRender();
          fillDomFromState();
          inp.value = '';
        };
        var btn = document.querySelector('[data-up="' + (idx === 0 ? 'ref' : 'fre') + '"]');
        if (btn)
          btn.onclick = function () {
            inp.click();
          };
      });

      var fs = el('f_specph');
      if (fs) {
        fs.onchange = function () {
          readFormToState();
          mergePhotos(st.specialPhotos, fs.files, MAX_SP);
          fullRender();
          fillDomFromState();
          fs.value = '';
        };
      }
      var fsp = el('f_specbtn');
      if (fsp)
        fsp.onclick = function () {
          fs && fs.click();
        };

      var fb = el('f_broad');
      if (fb) {
        fb.onchange = function () {
          readFormToState();
          mergePhotos(st.broadcastPhotos, fb.files, MAX_BR);
          fullRender();
          fillDomFromState();
          fb.value = '';
        };
      }
      var fbb = el('f_broadbtn');
      if (fbb)
        fbb.onclick = function () {
          fb && fb.click();
        };

      document.querySelectorAll('.h5-thumb-x').forEach(function (x) {
        x.onclick = function () {
          var hid = x.getAttribute('data-x');
          var i = parseInt(x.getAttribute('data-i'), 10);
          if (hid === 'th_ref') st.refPhotos.splice(i, 1);
          else if (hid === 'th_fre') st.freezerPhotos.splice(i, 1);
          else if (hid === 'th_spec') st.specialPhotos.splice(i, 1);
          else if (hid === 'th_broad') st.broadcastPhotos.splice(i, 1);
          fullRender();
          fillDomFromState();
        };
      });

      var sms = el('f_sms');
      if (sms)
        sms.onclick = function () {
          bdToast && bdToast('已发送', '演示：短信验证码已发送');
        };

      var front = el('f_front');
      if (front)
        front.onclick = function () {
          st.frontPhoto = true;
          readFormToState();
          fullRender();
          fillDomFromState();
          bdToast && bdToast('已选择文件', '演示：门头照已标记上传');
        };

      var cancel = el('h5Cancel');
      if (cancel)
        cancel.onclick = function () {
          if (isBdApp && bdCtx) {
            if (bdCtx.isCreate) location.href = bdStoresPageHref() + '#list';
            else location.href = bdStoresPageHref() + '#workspace/' + bdCtx.record.id;
            return;
          }
          var p = new URLSearchParams({
            status: 'cancelled',
            bdId: boundBd,
            bdName: resolveBdName(boundBd)
          });
          if (supplementMode) p.set('storeId', storeIdRaw);
          navigateStatus(p);
        };

      var draft = el('h5Draft');
      if (draft)
        draft.onclick = function () {
          readFormToState();
          persistBdStore('draft');
        };

      var sub = el('h5Submit');
      if (sub)
        sub.onclick = function () {
          readFormToState();
          if (isBdApp && bdCtx) {
            if (!validate()) return;
            persistBdStore('submit');
            return;
          }
          if (!validate()) return;
          var p = new URLSearchParams({
            status: supplementMode ? 'updated' : 'pending',
            storeName: st.name.trim(),
            bdId: boundBd,
            bdName: resolveBdName(boundBd)
          });
          p.set('storeId', supplementMode ? storeIdRaw : String(Math.floor(Math.random() * 90000) + 10000));
          navigateStatus(p);
        };
    }

    st.warehouse = defaultWarehouse(boundBd);
    fullRender();
    fillDomFromState();
  }

  function mount() {
    if (document.body.getAttribute('data-bd-store-form') === '1' && mountBdStoreFormPage()) return;
    var root = document.getElementById('h5-root');
    if (!root) return;
    var hash = (location.hash || '').replace(/^#/, '');
    var q = qsParse();
    if (hash === 'status' || q.status) {
      root.innerHTML = renderStatusPage();
      bindStatus(root);
      return;
    }
    renderForm(root);
  }

  window.addEventListener('hashchange', mount);
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
