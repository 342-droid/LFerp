(function () {
  'use strict';

  var STORAGE_KEY = 'lf-shop-h5-stores';
  var MAX_CABINET = 5;
  var MAX_SPECIAL = 6;
  var MAX_BROADCAST = 6;

  var BD_LINKABLE_WAREHOUSES = ['华东 RDC-杭州', '杭州城市前置仓', '图书中央仓'];
  var BD_EMPLOYEE_CODE_TO_NAME = { BD20240001: '李泽峰' };

  var MOCK_STORE_POIS = [
    {
      id: 'poi-xf',
      displayName: '鲜丰水果文一西路店',
      regionCascade: '浙江省 / 杭州市 / 西湖区',
      detailAddress: '文一西路 558 号 1 层临街',
      lng: 120.09841,
      lat: 30.28552,
      mapX: 42,
      mapY: 48,
    },
    {
      id: 'poi-oldbbq',
      displayName: '老城烧烤武林店',
      regionCascade: '浙江省 / 杭州市 / 拱墅区',
      detailAddress: '武林广场延安路 508 号',
      lng: 120.16352,
      lat: 30.27622,
      mapX: 55,
      mapY: 38,
    },
    {
      id: 'poi-sams',
      displayName: '山姆会员商店奥体店',
      regionCascade: '浙江省 / 杭州市 / 滨江区',
      detailAddress: '飞虹路 1408 号',
      lng: 120.23688,
      lat: 30.21005,
      mapX: 68,
      mapY: 62,
    },
  ];

  function resolveBdDisplayName(id) {
    var key = (id || '').trim();
    if (!key || key === '—') return '—';
    return BD_EMPLOYEE_CODE_TO_NAME[key] || key;
  }

  function getDefaultWarehouseForBd(boundBd) {
    var table = {
      王强: '华东 RDC-杭州',
      李明: '杭州城市前置仓',
      赵丽: '华东 RDC-杭州',
      周杰: '图书中央仓',
      吴敏: '杭州城市前置仓',
      张芳: '华东 RDC-杭州',
      '当前 BD': '华东 RDC-杭州',
      李泽峰: '华东 RDC-杭州',
    };
    var k = (boundBd || '').trim();
    if (table[k]) return table[k];
    return BD_LINKABLE_WAREHOUSES[0];
  }

  function getRegionalProtectionHint(partnerDivision, regionCascade, detailAddress) {
    var div = (partnerDivision || '').trim();
    if (!div || div === '同行店') return { showWarning: false, message: '' };
    var text = (regionCascade || '') + (detailAddress || '');
    if (text.indexOf('西湖区') >= 0 && /文一西路|558/.test(text)) {
      return {
        showWarning: true,
        message:
          '该区域涉及区域保护范围，已有门店建档。请更换选址，或在「特殊情况说明」中备注并经 BD 总监确认后再提交。',
      };
    }
    return { showWarning: false, message: '' };
  }

  function filterMockStorePois(query) {
    var t = (query || '').trim();
    if (!t) return [];
    var lower = t.toLowerCase();
    return MOCK_STORE_POIS.filter(function (p) {
      return (
        p.displayName.indexOf(t) >= 0 ||
        p.displayName.toLowerCase().indexOf(lower) >= 0 ||
        p.detailAddress.indexOf(t) >= 0 ||
        p.regionCascade.indexOf(t) >= 0
      );
    });
  }

  function formatCoordsFromPoi(p) {
    return '经度 ' + p.lng.toFixed(5) + '，纬度 ' + p.lat.toFixed(5) + '（地图选点）';
  }

  function loadStores() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var o = JSON.parse(raw);
      return Array.isArray(o.stores) ? o.stores : [];
    } catch (e) {
      return [];
    }
  }

  function saveStores(stores) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ stores: stores }));
  }

  function getStore(id) {
    var list = loadStores();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function upsertStore(row) {
    var list = loadStores();
    var idx = -1;
    for (var i = 0; i < list.length; i++) if (list[i].id === row.id) idx = i;
    if (idx >= 0) list[idx] = row;
    else list.push(row);
    saveStores(list);
  }

  function nextId() {
    var list = loadStores();
    var m = 0;
    for (var i = 0; i < list.length; i++) m = Math.max(m, list[i].id || 0);
    return m + 1;
  }

  /** 演示：便于打开补充链接体验 */
  function ensureDemoSupplementStore() {
    var list = loadStores();
    if (list.some(function (s) { return s.id === 9001; })) return;
    list.push({
      id: 9001,
      phase: 'awaiting_bd',
      storeSubject: '演示主体有限公司',
      name: '演示 · 待补充门店',
      shortName: '演示店',
      boundBd: 'BD20240001',
      warehouse: getDefaultWarehouseForBd('BD20240001'),
      partnerDivision: '加盟店',
      storeTypeDetail: '社区生鲜店',
      regionCascade: '浙江省 / 杭州市 / 西湖区',
      detailAddress: '文一西路 558 号 1 层临街',
      gaodeLocationText: formatCoordsFromPoi(MOCK_STORE_POIS[0]),
      selectedPoiId: 'poi-xf',
      contactPhone: '13800138000',
      contactName: '演示联系人',
      storeArea: '120',
      storeFloors: '1F',
      householdsWithin500m: '',
      dailyOrderVolume: '',
      staffCount: '',
      liveCommerceUnderstanding: '',
      dailyOpsCooperationNote: '',
      privateLiveRoiExpectation: '',
      privateCommerceFamiliarity: '',
      surroundingCommunityNote: '',
      confidenceReach1000: '',
      specialCircumstancesNote: '无',
      otherPlatformsCooperation: '',
      mapPoiQuery: MOCK_STORE_POIS[0].displayName,
      companyCallbackNotified: true,
      frontPhotoUploaded: true,
      hasRefrigeratedCabinet: '',
      hasFreezerCabinet: '',
    });
    saveStores(list);
  }

  var state = {
    mode: 'create',
    supplementStoreId: null,
    existingStore: null,
    selectedPoiId: null,
    gaodeLocationText: '',
    refrigeratedUrls: [],
    freezerUrls: [],
    specialUrls: [],
    broadcastUrls: [],
    frontPhotoUploaded: false,
    videoStorefrontUrl: null,
    videoInteriorUrl: null,
  };

  function toast(msg, isErr) {
    var el = document.createElement('div');
    el.className = 'shop-h5-toast' + (isErr ? ' err' : '');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () {
      el.remove();
    }, 2400);
  }

  function toastLines(title, desc, isErr) {
    toast(desc ? title + '：' + desc : title, isErr);
  }

  function $(id) {
    return document.getElementById(id);
  }

  function showOnly(which) {
    var nf = $('notfoundView');
    var pb = $('phaseBlockView');
    var fs = $('formScroll');
    var ft = $('formFooter');
    nf.classList.toggle('shop-h5-hidden', which !== 'nf');
    pb.classList.toggle('shop-h5-hidden', which !== 'pb');
    fs.classList.toggle('shop-h5-hidden', which !== 'form');
    ft.classList.toggle('shop-h5-hidden', which !== 'form');
    if (which === 'nf') $('pageTitle').textContent = '门店资料';
    if (which === 'pb') $('pageTitle').textContent = '门店资料';
  }

  function revokeUrls(arr) {
    arr.forEach(function (u) {
      if (u && String(u).indexOf('blob:') === 0) URL.revokeObjectURL(u);
    });
  }

  function mergePhotos(existing, files, max) {
    var next = existing.slice();
    var list = Array.prototype.slice.call(files || []);
    for (var i = 0; i < list.length; i++) {
      if (next.length >= max) break;
      next.push(URL.createObjectURL(list[i]));
    }
    return next.slice(0, max);
  }

  function renderPhotoGrid(containerId, urls, onRemove) {
    var root = $(containerId);
    root.innerHTML = '';
    urls.forEach(function (src, idx) {
      var wrap = document.createElement('div');
      wrap.className = 'shop-h5-thumb';
      var img = document.createElement('img');
      img.src = src;
      img.alt = '';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'shop-h5-thumb-remove';
      btn.textContent = '×';
      btn.onclick = function () {
        onRemove(idx);
      };
      wrap.appendChild(img);
      wrap.appendChild(btn);
      root.appendChild(wrap);
    });
  }

  function updateProtectionUi() {
    var pd = $('partnerDivision').value;
    var rc = $('regionCascade').value;
    var da = $('detailAddress').value;
    var hint = getRegionalProtectionHint(pd, rc, da);
    var box = $('protectionAlert');
    if (hint.showWarning) {
      box.classList.remove('shop-h5-hidden');
      $('protectionAlertMsg').textContent = hint.message;
    } else box.classList.add('shop-h5-hidden');
  }

  function syncWarehouseHint() {
    var bd = $('boundBd').value || '当前 BD';
    var def = getDefaultWarehouseForBd(resolveBdDisplayName(bd) !== '—' ? resolveBdDisplayName(bd) : bd);
    $('warehouseHint').textContent = '默认：' + def + '（与当前 BD 关联）';
  }

    function fillWarehouseSelect() {
      var sel = $('warehouse');
      var pending = (sel.dataset.pending || '').trim();
      var set = {};
      BD_LINKABLE_WAREHOUSES.forEach(function (w) {
        set[w] = true;
      });
      if (pending && pending !== '—') set[pending] = true;
      sel.innerHTML = '';
      Object.keys(set).forEach(function (w) {
        var o = document.createElement('option');
        o.value = w;
        o.textContent = w;
        sel.appendChild(o);
      });
      var bdVal = $('boundBd').value;
      var def = getDefaultWarehouseForBd(bdVal);
      if (pending && set[pending]) sel.value = pending;
      else sel.value = def;
    }

  function togglePolicyPanels() {
    var v = $('partnerDivision').value;
    var policy = !!v;
    $('policyPlaceholder').classList.toggle('shop-h5-hidden', policy);
    $('policyPanels').classList.toggle('shop-h5-hidden', !policy);
    $('storeTypeRow').classList.toggle('shop-h5-hidden', !policy);
    var fr = v === '加盟店' || v === '合作店';
    var peer = v === '同行店';
    $('blockFranchise').classList.toggle('shop-h5-hidden', !fr);
    $('blockPeer').classList.toggle('shop-h5-hidden', !peer);
    updateProtectionUi();
  }

  function refreshPoiList() {
    var q = $('mapPoiQuery').value.trim();
    var wrap = $('poiListWrap');
    var listEl = $('poiList');
    var emptyHint = $('poiEmptyHint');
    if (!q) {
      wrap.classList.add('shop-h5-hidden');
      emptyHint.classList.remove('shop-h5-hidden');
      listEl.innerHTML = '';
      return;
    }
    emptyHint.classList.add('shop-h5-hidden');
    wrap.classList.remove('shop-h5-hidden');
    var items = filterMockStorePois(q);
    listEl.innerHTML = '';
    if (items.length === 0) {
      var p = document.createElement('p');
      p.className = 'shop-h5-note';
      p.style.padding = '16px';
      p.style.fontSize = '11px';
      p.textContent = '未找到匹配项，请更换关键字（演示仅含少量示例数据）';
      listEl.appendChild(p);
      return;
    }
    items.forEach(function (p) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'shop-h5-poi-item' + (state.selectedPoiId === p.id ? ' active' : '');
      btn.innerHTML =
        '<div style="font-size:12px;font-weight:600;color:#111">' +
        p.displayName +
        '</div><div style="font-size:10px;color:#6b7280;margin-top:4px">' +
        p.regionCascade +
        ' · ' +
        p.detailAddress +
        '</div>';
      btn.onclick = function () {
        state.selectedPoiId = p.id;
        $('regionCascade').value = p.regionCascade;
        $('detailAddress').value = p.detailAddress;
        state.gaodeLocationText = formatCoordsFromPoi(p);
        $('mapPoiQuery').value = p.displayName;
        $('legacyPoiNote').classList.add('shop-h5-hidden');
        $('mapPin').classList.remove('shop-h5-hidden');
        $('mapPlaceholder').classList.add('shop-h5-hidden');
        $('mapPin').style.left = p.mapX + '%';
        $('mapPin').style.top = p.mapY + '%';
        refreshPoiList();
        updateProtectionUi();
        toast('已选点：省市区与详细地址已根据地图 POI 更新（演示）');
      };
      listEl.appendChild(btn);
    });
  }

  function setCabinetHandlers() {
    $('hasRefrigeratedCabinet').onchange = function () {
      if (this.value === '无' && state.refrigeratedUrls.length) {
        if (!confirm('当前已上传冷藏柜照片，切换为“无”将清空已上传照片，是否继续？')) {
          this.value = '有';
          return;
        }
        revokeUrls(state.refrigeratedUrls);
        state.refrigeratedUrls = [];
        $('refrigeratedCount').textContent = '0';
        renderPhotoGrid('refrigeratedGrid', state.refrigeratedUrls, function rem(ix) {
          revokeUrls([state.refrigeratedUrls[ix]]);
          state.refrigeratedUrls.splice(ix, 1);
          $('refrigeratedCount').textContent = String(state.refrigeratedUrls.length);
          renderPhotoGrid('refrigeratedGrid', state.refrigeratedUrls, rem);
        });
      }
      $('btnRefrigeratedPick').disabled = this.value !== '有';
    };
    $('hasFreezerCabinet').onchange = function () {
      if (this.value === '无' && state.freezerUrls.length) {
        if (!confirm('当前已上传冷冻柜照片，切换为“无”将清空已上传照片，是否继续？')) {
          this.value = '有';
          return;
        }
        revokeUrls(state.freezerUrls);
        state.freezerUrls = [];
        $('freezerCount').textContent = '0';
        renderPhotoGrid('freezerGrid', state.freezerUrls, function rem(ix) {
          revokeUrls([state.freezerUrls[ix]]);
          state.freezerUrls.splice(ix, 1);
          $('freezerCount').textContent = String(state.freezerUrls.length);
          renderPhotoGrid('freezerGrid', state.freezerUrls, rem);
        });
      }
      $('btnFreezerPick').disabled = this.value !== '有';
    };
  }

  function navigateStatus(params) {
    var base = 'status.html';
    var qs = new URLSearchParams(params).toString();
    location.href = qs ? base + '?' + qs : base;
  }

  function collectPayloadFromForm() {
    var partnerDivision = $('partnerDivision').value;
    var isFranchiseOrPartner = partnerDivision === '加盟店' || partnerDivision === '合作店';
    var isPeerStore = partnerDivision === '同行店';
    var nameOut = $('name').value.trim() || '未命名门店';
    var warehouse = $('warehouse').value.trim() || getDefaultWarehouseForBd($('boundBd').value);
    return {
      storeSubject: $('storeSubject').value.trim(),
      name: nameOut,
      shortName: $('shortName').value.trim(),
      boundBd: $('boundBd').value.trim(),
      warehouse: warehouse,
      partnerDivision: partnerDivision || undefined,
      storeTypeDetail: $('storeTypeDetail').value.trim(),
      regionCascade: $('regionCascade').value.trim(),
      detailAddress: $('detailAddress').value.trim(),
      gaodeLocationText: state.gaodeLocationText.trim(),
      selectedPoiId: state.selectedPoiId,
      contactPhone: $('contactPhone').value.trim(),
      contactName: $('contactName').value.trim(),
      verifyCode: $('verifyCode').value.trim(),
      companyCallbackNotified: $('companyCallbackNotified').checked,
      frontPhotoUploaded: state.frontPhotoUploaded,
      hasRefrigeratedCabinet: $('hasRefrigeratedCabinet').value,
      hasFreezerCabinet: $('hasFreezerCabinet').value,
      storeArea: $('storeArea').value.trim(),
      storeFloors: $('storeFloors').value.trim(),
      householdsWithin500m: $('householdsWithin500m').value.trim(),
      dailyOrderVolume: $('dailyOrderVolume').value.trim(),
      staffCount: $('staffCount').value.trim(),
      liveCommerceUnderstanding: $('liveCommerceUnderstanding').value.trim(),
      dailyOpsCooperationNote: $('dailyOpsCooperationNote').value.trim(),
      privateLiveRoiExpectation: $('privateLiveRoiExpectation').value.trim(),
      privateCommerceFamiliarity: $('privateCommerceFamiliarity').value.trim(),
      surroundingCommunityNote: $('surroundingCommunityNote').value.trim(),
      confidenceReach1000: $('confidenceReach1000').value.trim(),
      specialCircumstancesNote: $('specialCircumstancesNote').value.trim(),
      otherPlatformsCooperation: $('otherPlatformsCooperation').value.trim(),
      isFranchiseOrPartner: isFranchiseOrPartner,
      isPeerStore: isPeerStore,
    };
  }

  function validateSubmit(isSupplement) {
    var f = collectPayloadFromForm();
    if (!f.storeSubject) return toastLines('请填写门店主体', '', true), false;
    if (!$('name').value.trim()) return toastLines('请填写门店名称', '', true), false;
    if (!f.partnerDivision) return toastLines('请选择门店合作类型（加盟店/合作店/同行店）', '', true), false;

    var isCreate = state.mode === 'create';
    var mapOk = isCreate
      ? !!state.selectedPoiId && state.selectedPoiId !== 'legacy'
      : !!state.selectedPoiId &&
        (state.selectedPoiId !== 'legacy' ||
          (f.gaodeLocationText.length > 0 && f.detailAddress.trim().length > 0));

    if (f.partnerDivision) {
      if (!f.storeTypeDetail) return toastLines('请填写门店类型', '', true), false;
      if (!f.regionCascade || f.regionCascade === '—')
        return toastLines('请选择门店地址（省市区）', '', true), false;
      if (!f.detailAddress.trim() || f.detailAddress === '—')
        return toastLines('请填写详细地址', '', true), false;
      if (!mapOk)
        return (
          toastLines(
            '请完成地图选点',
            isCreate ? '请搜索门店名称或地址，在列表中选中以完成地图落点' : '若历史资料未匹配演示 POI，请保持原有地址记录完整',
            true
          ),
          false
        );
    }

    if (f.partnerDivision) {
      if (!f.contactPhone.trim()) return toastLines('请填写老板 / 负责人联系电话', '', true), false;
      var requireSms = !isSupplement;
      if (requireSms && (!f.verifyCode.trim() || f.verifyCode.length < 4))
        return toastLines('请填写验证码', '', true), false;
      if (!f.contactName.trim() || f.contactName === '—')
        return toastLines('请填写老板 / 联系人姓名', '', true), false;
    }

    if (f.isFranchiseOrPartner) {
      if (!f.storeArea) return toastLines('请填写门店面积', '', true), false;
      if (!f.storeFloors) return toastLines('请填写门店楼层', '', true), false;
      var hint = getRegionalProtectionHint(f.partnerDivision, f.regionCascade, f.detailAddress);
      if (hint.showWarning) {
        var specialTrim = (f.specialCircumstancesNote || '').trim();
        var textOk = specialTrim.length > 0 && specialTrim !== '无';
        var hasPic = state.specialUrls.length > 0;
        if (!textOk && !hasPic)
          return (
            toastLines(
              '该区域涉及区域保护范围',
              '请在「特殊情况说明」中填写文字或上传配图，说明与总监沟通等情况（不可留空且不可仅填「无」而无配图）',
              true
            ),
            false
          );
        if (specialTrim === '无' && !hasPic)
          return (
            toastLines(
              '该区域涉及区域保护范围',
              '不可仅在正文填写「无」而无配图；请补充说明或上传相关截图',
              true
            ),
            false
          );
      }
    }

    if (!f.companyCallbackNotified)
      return toastLines('请勾选：已知晓需接听公司公务来电（17316440268、17339691157）', '', true), false;
    if (!f.frontPhotoUploaded) return toastLines('请上传门头照片', '', true), false;

    return true;
  }

  function hydrateFromStore(s) {
    $('storeSubject').value = s.storeSubject || '';
    $('name').value = s.name || '';
    $('shortName').value = s.shortName || '';
    $('boundBd').value = s.boundBd || '';
    $('warehouse').dataset.pending = s.warehouse || '';
    fillWarehouseSelect();
    $('partnerDivision').value = s.partnerDivision || '';
    $('storeTypeDetail').value = s.storeTypeDetail || '';
    $('regionCascade').value = s.regionCascade || '';
    $('detailAddress').value = s.detailAddress || '';
    state.gaodeLocationText = s.gaodeLocationText || '';
    state.selectedPoiId = s.selectedPoiId || null;
    $('mapPoiQuery').value = s.mapPoiQuery || '';
    $('contactPhone').value = s.contactPhone || '';
    $('contactName').value = s.contactName || '';
    $('companyCallbackNotified').checked = !!s.companyCallbackNotified;
    state.frontPhotoUploaded = !!s.frontPhotoUploaded;
    $('frontUploadedBadge').classList.toggle('shop-h5-hidden', !state.frontPhotoUploaded);
    $('hasRefrigeratedCabinet').value = s.hasRefrigeratedCabinet || '';
    $('hasFreezerCabinet').value = s.hasFreezerCabinet || '';
    $('storeArea').value = s.storeArea || '';
    $('storeFloors').value = s.storeFloors || '';
    $('householdsWithin500m').value = s.householdsWithin500m || '';
    $('dailyOrderVolume').value = s.dailyOrderVolume || '';
    $('staffCount').value = s.staffCount || '';
    $('liveCommerceUnderstanding').value = s.liveCommerceUnderstanding || '';
    $('dailyOpsCooperationNote').value = s.dailyOpsCooperationNote || '';
    $('privateLiveRoiExpectation').value = s.privateLiveRoiExpectation || '';
    $('privateCommerceFamiliarity').value = s.privateCommerceFamiliarity || '';
    $('surroundingCommunityNote').value = s.surroundingCommunityNote || '';
    $('confidenceReach1000').value = s.confidenceReach1000 || '';
    $('specialCircumstancesNote').value = s.specialCircumstancesNote || '';
    $('otherPlatformsCooperation').value = s.otherPlatformsCooperation || '';
    syncWarehouseHint();
    togglePolicyPanels();
    if (state.selectedPoiId === 'legacy') {
      $('legacyPoiNote').classList.remove('shop-h5-hidden');
      $('mapPin').classList.remove('shop-h5-hidden');
      $('mapPlaceholder').classList.add('shop-h5-hidden');
      $('mapPin').style.left = '50%';
      $('mapPin').style.top = '50%';
    } else if (state.selectedPoiId) {
      var p = null;
      for (var pi = 0; pi < MOCK_STORE_POIS.length; pi++) {
        if (MOCK_STORE_POIS[pi].id === state.selectedPoiId) {
          p = MOCK_STORE_POIS[pi];
          break;
        }
      }
      if (p) {
        $('mapPoiQuery').value = p.displayName;
        $('mapPin').classList.remove('shop-h5-hidden');
        $('mapPlaceholder').classList.add('shop-h5-hidden');
        $('mapPin').style.left = p.mapX + '%';
        $('mapPin').style.top = p.mapY + '%';
      }
    }
    refreshPoiList();
    $('heroTitle').textContent = $('name').value.trim() || '未命名门店';
    $('btnRefrigeratedPick').disabled = $('hasRefrigeratedCabinet').value !== '有';
    $('btnFreezerPick').disabled = $('hasFreezerCabinet').value !== '有';
    updateProtectionUi();
  }

  function phaseAllowsOwnerSupplement(phase) {
    return phase === 'draft' || phase === 'awaiting_bd';
  }

  function init() {
    var params = new URLSearchParams(location.search);
    var storeIdRaw = (params.get('storeId') || '').trim();
    var bdFromUrl =
      (params.get('bdId') || '').trim() ||
      (params.get('bdEmployeeCode') || '').trim();

    $('btnBack').onclick = function () {
      history.back();
    };

    $('name').addEventListener('input', function () {
      $('heroTitle').textContent = this.value.trim() || '未命名门店';
    });

    $('partnerDivision').addEventListener('change', function () {
      togglePolicyPanels();
      syncWarehouseHint();
    });

    $('regionCascade').addEventListener('change', updateProtectionUi);
    $('detailAddress').addEventListener('input', updateProtectionUi);

    $('mapPoiQuery').addEventListener('input', function () {
      refreshPoiList();
    });

    $('btnSms').onclick = function () {
      toast('已发送：演示短信验证码已发送');
    };

    $('btnFrontPhoto').onclick = function () {
      state.frontPhotoUploaded = true;
      $('frontUploadedBadge').classList.remove('shop-h5-hidden');
      toast('已选择文件：演示门头照已标记为已上传');
    };

    $('btnRefrigeratedPick').onclick = function () {
      $('refrigeratedFiles').click();
    };
    $('refrigeratedFiles').onchange = function () {
      var old = state.refrigeratedUrls.length;
      state.refrigeratedUrls = mergePhotos(state.refrigeratedUrls, this.files, MAX_CABINET);
      $('refrigeratedCount').textContent = String(state.refrigeratedUrls.length);
      renderPhotoGrid('refrigeratedGrid', state.refrigeratedUrls, function rem(ix) {
        revokeUrls([state.refrigeratedUrls[ix]]);
        state.refrigeratedUrls.splice(ix, 1);
        $('refrigeratedCount').textContent = String(state.refrigeratedUrls.length);
        renderPhotoGrid('refrigeratedGrid', state.refrigeratedUrls, rem);
      });
      toast(state.refrigeratedUrls.length > old ? '上传成功' : '已达上限');
      this.value = '';
    };

    $('btnFreezerPick').onclick = function () {
      $('freezerFiles').click();
    };
    $('freezerFiles').onchange = function () {
      var old = state.freezerUrls.length;
      state.freezerUrls = mergePhotos(state.freezerUrls, this.files, MAX_CABINET);
      $('freezerCount').textContent = String(state.freezerUrls.length);
      renderPhotoGrid('freezerGrid', state.freezerUrls, function rem(ix) {
        revokeUrls([state.freezerUrls[ix]]);
        state.freezerUrls.splice(ix, 1);
        $('freezerCount').textContent = String(state.freezerUrls.length);
        renderPhotoGrid('freezerGrid', state.freezerUrls, rem);
      });
      toast(state.freezerUrls.length > old ? '上传成功' : '已达上限');
      this.value = '';
    };

    $('btnSpecialPhotos').onclick = function () {
      $('specialPhotosFiles').click();
    };
    $('specialPhotosFiles').onchange = function () {
      var old = state.specialUrls.length;
      state.specialUrls = mergePhotos(state.specialUrls, this.files, MAX_SPECIAL);
      $('specialPhotosCount').textContent = String(state.specialUrls.length);
      renderPhotoGrid('specialPhotosGrid', state.specialUrls, function rem(ix) {
        revokeUrls([state.specialUrls[ix]]);
        state.specialUrls.splice(ix, 1);
        $('specialPhotosCount').textContent = String(state.specialUrls.length);
        renderPhotoGrid('specialPhotosGrid', state.specialUrls, rem);
      });
      toast(state.specialUrls.length > old ? '已添加图片' : '已达上限');
      this.value = '';
    };

    $('btnBroadcastPick').onclick = function () {
      $('broadcastFiles').click();
    };
    $('broadcastFiles').onchange = function () {
      var old = state.broadcastUrls.length;
      state.broadcastUrls = mergePhotos(state.broadcastUrls, this.files, MAX_BROADCAST);
      $('broadcastCount').textContent = String(state.broadcastUrls.length);
      renderPhotoGrid('broadcastGrid', state.broadcastUrls, function rem(ix) {
        revokeUrls([state.broadcastUrls[ix]]);
        state.broadcastUrls.splice(ix, 1);
        $('broadcastCount').textContent = String(state.broadcastUrls.length);
        renderPhotoGrid('broadcastGrid', state.broadcastUrls, rem);
      });
      toast(state.broadcastUrls.length > old ? '已添加图片' : '已达上限');
      this.value = '';
    };

    $('btnVideoStorefront').onclick = function () {
      $('videoStorefrontFile').click();
    };
    $('videoStorefrontFile').onchange = function () {
      var file = this.files && this.files[0];
      if (!file) return;
      if (state.videoStorefrontUrl && state.videoStorefrontUrl.indexOf('blob:') === 0)
        URL.revokeObjectURL(state.videoStorefrontUrl);
      state.videoStorefrontUrl = URL.createObjectURL(file);
      $('videoStorefrontPreview').src = state.videoStorefrontUrl;
      $('videoStorefrontPreview').classList.remove('shop-h5-hidden');
      toast('已添加视频：' + file.name);
      this.value = '';
    };

    $('btnVideoInterior').onclick = function () {
      $('videoInteriorFile').click();
    };
    $('videoInteriorFile').onchange = function () {
      var file = this.files && this.files[0];
      if (!file) return;
      if (state.videoInteriorUrl && state.videoInteriorUrl.indexOf('blob:') === 0)
        URL.revokeObjectURL(state.videoInteriorUrl);
      state.videoInteriorUrl = URL.createObjectURL(file);
      $('videoInteriorPreview').src = state.videoInteriorUrl;
      $('videoInteriorPreview').classList.remove('shop-h5-hidden');
      toast('已添加视频：' + file.name);
      this.value = '';
    };

    setCabinetHandlers();

    $('btnCancel').onclick = function () {
      var bd = $('boundBd').value.trim() || '—';
      var p = { status: 'cancelled', bdId: bd };
      var dn = resolveBdDisplayName(bd);
      if (dn !== '—') p.bdName = dn;
      if (state.mode === 'supplement') p.storeId = String(state.supplementStoreId);
      navigateStatus(p);
    };

    $('btnSubmit').onclick = function () {
      var isSupplement = state.mode === 'supplement';
      if (!validateSubmit(isSupplement)) return;

      var f = collectPayloadFromForm();
      var bd = f.boundBd || bdFromUrl || '当前 BD';
      var bdDisplay = resolveBdDisplayName(bd);

      if (state.mode === 'create') {
        var newId = nextId();
        upsertStore({
          id: newId,
          phase: 'awaiting_bd',
          storeSubject: f.storeSubject,
          name: f.name,
          shortName: f.shortName,
          boundBd: bd,
          warehouse: f.warehouse,
          partnerDivision: f.partnerDivision,
          storeTypeDetail: f.storeTypeDetail,
          regionCascade: f.regionCascade,
          detailAddress: f.detailAddress,
          gaodeLocationText: f.gaodeLocationText,
          selectedPoiId: state.selectedPoiId,
          mapPoiQuery: $('mapPoiQuery').value.trim(),
          contactPhone: f.contactPhone,
          contactName: f.contactName,
          companyCallbackNotified: f.companyCallbackNotified,
          frontPhotoUploaded: true,
          hasRefrigeratedCabinet: f.hasRefrigeratedCabinet,
          hasFreezerCabinet: f.hasFreezerCabinet,
          storeArea: f.storeArea,
          storeFloors: f.storeFloors,
          householdsWithin500m: f.householdsWithin500m,
          dailyOrderVolume: f.dailyOrderVolume,
          staffCount: f.staffCount,
          liveCommerceUnderstanding: f.liveCommerceUnderstanding,
          dailyOpsCooperationNote: f.dailyOpsCooperationNote,
          privateLiveRoiExpectation: f.privateLiveRoiExpectation,
          privateCommerceFamiliarity: f.privateCommerceFamiliarity,
          surroundingCommunityNote: f.surroundingCommunityNote,
          confidenceReach1000: f.confidenceReach1000,
          specialCircumstancesNote: f.specialCircumstancesNote,
          otherPlatformsCooperation: f.otherPlatformsCooperation,
        });
        toast('已提交：门店注册申请已提交，请等待审核');
        var q = { status: 'pending', storeName: f.name, bdId: bd, storeId: String(newId) };
        if (bdDisplay !== '—') q.bdName = bdDisplay;
        navigateStatus(q);
        return;
      }

      var sid = state.supplementStoreId;
      var prev = getStore(sid);
      if (!prev) return toastLines('提交失败', '门店数据丢失', true);
      upsertStore(
        Object.assign({}, prev, {
          storeSubject: f.storeSubject,
          name: f.name,
          shortName: f.shortName,
          warehouse: f.warehouse,
          partnerDivision: f.partnerDivision,
          storeTypeDetail: f.storeTypeDetail,
          regionCascade: f.regionCascade,
          detailAddress: f.detailAddress,
          gaodeLocationText: f.gaodeLocationText,
          selectedPoiId: state.selectedPoiId,
          mapPoiQuery: $('mapPoiQuery').value.trim(),
          contactPhone: f.contactPhone,
          contactName: f.contactName,
          companyCallbackNotified: f.companyCallbackNotified,
          frontPhotoUploaded: f.frontPhotoUploaded,
          hasRefrigeratedCabinet: f.hasRefrigeratedCabinet,
          hasFreezerCabinet: f.hasFreezerCabinet,
          storeArea: f.storeArea,
          storeFloors: f.storeFloors,
          householdsWithin500m: f.householdsWithin500m,
          dailyOrderVolume: f.dailyOrderVolume,
          staffCount: f.staffCount,
          liveCommerceUnderstanding: f.liveCommerceUnderstanding,
          dailyOpsCooperationNote: f.dailyOpsCooperationNote,
          privateLiveRoiExpectation: f.privateLiveRoiExpectation,
          privateCommerceFamiliarity: f.privateCommerceFamiliarity,
          surroundingCommunityNote: f.surroundingCommunityNote,
          confidenceReach1000: f.confidenceReach1000,
          specialCircumstancesNote: f.specialCircumstancesNote,
          otherPlatformsCooperation: f.otherPlatformsCooperation,
          phase: prev.phase === 'draft' ? 'awaiting_bd' : prev.phase === 'awaiting_bd' ? 'awaiting_bd' : prev.phase,
        })
      );
      toast('已提交：资料已更新，请等待 BD 审核');
      var q2 = { status: 'updated', storeName: f.name, bdId: bd, storeId: String(sid) };
      if (bdDisplay !== '—') q2.bdName = bdDisplay;
      navigateStatus(q2);
    };

    ensureDemoSupplementStore();

    var boundBd = bdFromUrl || '当前 BD';
    $('boundBd').value = boundBd;
    $('warehouse').dataset.pending = getDefaultWarehouseForBd(boundBd);
    fillWarehouseSelect();
    syncWarehouseHint();

    if (storeIdRaw) {
      var n = Number(storeIdRaw);
      if (!Number.isFinite(n)) {
        showOnly('nf');
        return;
      }
      var st = getStore(n);
      if (!st) {
        showOnly('nf');
        return;
      }
      if (!phaseAllowsOwnerSupplement(st.phase)) {
        showOnly('pb');
        return;
      }
      state.mode = 'supplement';
      state.supplementStoreId = n;
      state.existingStore = st;
      $('pageTitle').textContent = '补充门店资料';
      $('heroTag').textContent = '资料补充';
      $('heroDesc').textContent =
        '请根据 BD 要求查漏补缺；提交后资料将同步给 BD，仍需等待审核。';
      $('bdHint').textContent = '由 BD 转发链接确定，不可更改';
      $('verifyRow').classList.add('shop-h5-hidden');
      hydrateFromStore(st);
      showOnly('form');
      return;
    }

    state.mode = 'create';
    $('pageTitle').textContent = '门店注册';
    $('heroTag').textContent = '扫码注册';
    $('heroDesc').textContent = '请按实际情况填写门店注册资料，提交后将进入审核流程。';
    $('bdHint').textContent = '默认当前登录账号，不可更改';
    $('verifyRow').classList.remove('shop-h5-hidden');
    togglePolicyPanels();
    $('btnRefrigeratedPick').disabled = $('hasRefrigeratedCabinet').value !== '有';
    $('btnFreezerPick').disabled = $('hasFreezerCabinet').value !== '有';
    showOnly('form');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
