/**
 * 直播管理 — 直播场次新建/编辑
 */
(function () {
  'use strict';

  var Demo = window.MdmLiveDemo;
  if (!Demo) return;

  var wp = window.wmsPath || {
    page: function (f) {
      return f;
    }
  };

  var editingId = '';
  var formMode = 'create';
  var sessStatus = '';
  var boundTemplates = [];
  var coverDataUrl = '';
  var saleRegions = {};
  var saleRegionSummary = [];
  var saleStores = {};

  function toast(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type || 'success');
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function qs(name) {
    return new URLSearchParams(window.location.search || '').get(name) || '';
  }

  function detectFormMode() {
    var main = document.querySelector('[data-session-mode]');
    if (main && main.getAttribute('data-session-mode') === 'detail') return 'detail';
    var mode = (qs('mode') || '').toLowerCase();
    if (mode === 'detail' || mode === 'view') return 'detail';
    if (/mdm_live_session_detail/i.test(window.location.pathname || '')) return 'detail';
    return qs('id') ? 'edit' : 'create';
  }

  function isDetailMode() {
    return formMode === 'detail';
  }

  function isLiveLocked() {
    return sessStatus === 'live' && !isDetailMode();
  }

  function templatesLocked() {
    return isDetailMode() || isLiveLocked();
  }

  function setElDisabled(id, on) {
    var el = document.getElementById(id);
    if (el) el.disabled = !!on;
  }

  function applyFieldLocks() {
    var form = document.getElementById('liveSessionForm');
    var tip = document.getElementById('sessionLiveLockTip');
    var tplForm = document.getElementById('fTemplateForm');
    var saveBtn = document.getElementById('sessionFormSave');
    var cancelBtn = document.getElementById('sessionFormCancel');
    var footer = document.querySelector('.mdm-edit-page__footer');

    if (form) {
      form.classList.toggle('lf-live-form--readonly', isDetailMode());
      form.classList.toggle('lf-live-form--live-lock', isLiveLocked());
    }
    if (tip) tip.hidden = !isLiveLocked();
    if (tplForm) tplForm.hidden = templatesLocked();

    if (isDetailMode()) {
      if (form) {
        form.querySelectorAll('input, select, textarea, button').forEach(function (el) {
          if (el.type === 'hidden') return;
          el.disabled = true;
        });
      }
      setElDisabled('fRegionPickBtn', true);
      setElDisabled('fStorePickBtn', true);
      if (saveBtn) saveBtn.hidden = true;
      if (cancelBtn) {
        cancelBtn.disabled = false;
        cancelBtn.textContent = '返回';
      }
      if (footer) footer.classList.add('lf-live-form-footer--detail');
      var ph = document.getElementById('fCoverPlaceholder');
      if (ph && !coverDataUrl) ph.innerHTML = '暂无封面';
      return;
    }

    if (saveBtn) saveBtn.hidden = false;
    if (cancelBtn) cancelBtn.textContent = '取消';
    setElDisabled('fStartAt', false);
    setElDisabled('fActualStartAt', true);
    setElDisabled('fActualEndAt', true);
    setElDisabled('fRoom', isLiveLocked());
    setElDisabled('fAnchorUserId', isLiveLocked());
    setElDisabled('fTplType', templatesLocked());
    setElDisabled('fTplName', templatesLocked() || !(document.getElementById('fTplType') || {}).value);
    setElDisabled('fTplStock', templatesLocked());
    setElDisabled('fTplAddBtn', templatesLocked());
  }

  function findSession(id) {
    for (var i = 0; i < Demo.sessions.length; i++) {
      if (Demo.sessions[i].id === id) return Demo.sessions[i];
    }
    return null;
  }

  function findRoom(id) {
    for (var i = 0; i < Demo.rooms.length; i++) {
      if (Demo.rooms[i].id === id) return Demo.rooms[i];
    }
    return null;
  }

  function toLocalInput(str) {
    if (!str) return '';
    return String(str).replace(' ', 'T').slice(0, 16);
  }

  function fromLocalInput(str) {
    if (!str) return '';
    return String(str).replace('T', ' ') + (str.length === 16 ? ':00' : '');
  }

  function liveTypeLabel(v) {
    var opt = (Demo.liveTypeOptions || []).find(function (o) {
      return o.value === v;
    });
    return opt ? opt.label : v || '—';
  }

  function fillSelects() {
    var slotEl = document.getElementById('fSlot');
    var roomEl = document.getElementById('fRoom');
    var typeEl = document.getElementById('fLiveType');
    var tplTypeEl = document.getElementById('fTplType');

    if (slotEl) {
      slotEl.innerHTML =
        '<option value="">请选择直播时段</option>' +
        Demo.timeslots
          .map(function (s) {
            return '<option value="' + escapeHtml(s.id) + '">' + escapeHtml(s.name) + '</option>';
          })
          .join('');
    }
    if (roomEl) {
      roomEl.innerHTML =
        '<option value="">请选择直播间</option>' +
        Demo.rooms
          .map(function (r) {
            return '<option value="' + escapeHtml(r.id) + '">' + escapeHtml(r.name) + '</option>';
          })
          .join('');
    }
    if (typeEl) {
      typeEl.innerHTML =
        '<option value="">请选择直播类型</option>' +
        (Demo.liveTypeOptions || [])
          .map(function (o) {
            return '<option value="' + escapeHtml(o.value) + '">' + escapeHtml(o.label) + '</option>';
          })
          .join('');
    }
    if (tplTypeEl) {
      tplTypeEl.innerHTML =
        '<option value="">请选择模板类型</option>' +
        (Demo.templateTypeOptions || [])
          .map(function (o) {
            return '<option value="' + escapeHtml(o.value) + '">' + escapeHtml(o.label) + '</option>';
          })
          .join('');
    }

    var vp = document.getElementById('fViewPermission');
    if (vp) {
      vp.innerHTML = (Demo.viewPermissionOptions || [])
        .map(function (o, idx) {
          return (
            '<label class="lf-live-radio">' +
            '<input type="radio" name="viewPermission" value="' +
            escapeHtml(o.value) +
            '"' +
            (idx === 0 ? ' checked' : '') +
            '> ' +
            escapeHtml(o.label) +
            '</label>'
          );
        })
        .join('');
    }
  }

  function cloneMap(map) {
    var out = {};
    Object.keys(map || {}).forEach(function (k) {
      out[k] = map[k];
    });
    return out;
  }

  function resetSaleScope() {
    saleRegions = {};
    saleRegionSummary = [];
    saleStores = {};
  }

  function getSaleStoreCount() {
    if (window.MdmProxyStorePicker && typeof window.MdmProxyStorePicker.count === 'function') {
      return window.MdmProxyStorePicker.count(saleStores);
    }
    return Object.keys(saleStores || {}).length;
  }

  function renderSaleRegionTags() {
    var tagsEl = document.getElementById('fRegionTags');
    if (!tagsEl) return;
    tagsEl.innerHTML = (saleRegionSummary || [])
      .map(function (item) {
        return '<span class="product-proxy-sale-scope__tag">' + escapeHtml(item.label || item.id || '') + '</span>';
      })
      .join('');
  }

  function syncSaleScopeUi() {
    renderSaleRegionTags();
    var count = getSaleStoreCount();
    var countEl = document.getElementById('fStoreCount');
    if (countEl) {
      countEl.hidden = !count;
      countEl.textContent = '已选择 ' + count + ' 个门店';
    }
  }

  function hydrateSaleScope(sess) {
    resetSaleScope();
    if (!sess) {
      syncSaleScopeUi();
      return;
    }
    if (sess.saleRegions && Object.keys(sess.saleRegions).length) {
      saleRegions = cloneMap(sess.saleRegions);
      saleRegionSummary = Array.isArray(sess.saleRegionSummary) ? sess.saleRegionSummary.slice() : [];
      if (
        window.MdmProxyRegionPicker &&
        window.MdmProxyRegionPicker.summarize &&
        !saleRegionSummary.length
      ) {
        saleRegionSummary = window.MdmProxyRegionPicker.summarize(saleRegions);
      }
    } else if (sess.regions && sess.regions.length && window.MdmProxyRegionPicker) {
      var codes = sess.regions.map(function (r) {
        return String(r.code || r.id || '');
      });
      saleRegions = {};
      codes.forEach(function (id) {
        if (id) saleRegions[id] = true;
      });
      saleRegionSummary = window.MdmProxyRegionPicker.summarize
        ? window.MdmProxyRegionPicker.summarize(saleRegions)
        : sess.regions.map(function (r) {
            return { id: r.code || r.id, label: r.label || r.name };
          });
    }
    if (sess.saleStores && Object.keys(sess.saleStores).length) {
      saleStores = cloneMap(sess.saleStores);
    } else if (sess.stores && sess.stores.length) {
      saleStores = {};
      sess.stores.forEach(function (s) {
        if (s && s.id) saleStores[s.id] = true;
      });
    }
    syncSaleScopeUi();
  }

  function selectedStoresForSave() {
    return Object.keys(saleStores || {})
      .map(function (id) {
        var found =
          window.MdmProxyStorePicker && typeof window.MdmProxyStorePicker.getStoreById === 'function'
            ? window.MdmProxyStorePicker.getStoreById(id)
            : null;
        return { id: id, name: found ? found.name : id };
      })
      .filter(Boolean);
  }

  function selectedRegionsForSave() {
    return (saleRegionSummary || []).map(function (item) {
      return { code: item.id, id: item.id, label: item.label, name: item.label };
    });
  }

  function syncAnchorFromRoom() {
    var roomId = (document.getElementById('fRoom') || {}).value || '';
    var room = findRoom(roomId);
    var uidEl = document.getElementById('fAnchorUserId');
    var nameEl = document.getElementById('fAnchorName');
    if (uidEl) uidEl.value = room ? room.anchorUserId || '' : '';
    if (nameEl) nameEl.value = room ? room.anchorName || '' : '';
  }

  function syncScopeVisibility() {
    var liveType = (document.getElementById('fLiveType') || {}).value || '';
    var regionRow = document.getElementById('fRegionRow');
    var storeRow = document.getElementById('fStoreRow');
    var permTip = document.getElementById('fViewPermissionTip');
    if (regionRow) regionRow.hidden = liveType !== 'REGION';
    if (storeRow) storeRow.hidden = liveType !== 'TARGETED';
    if (permTip) {
      if (liveType === 'REGION') {
        permTip.textContent = '在所选城市范围内，限制本场是否仅会员可看。';
      } else if (liveType === 'TARGETED') {
        permTip.textContent = '在所选门店范围内，限制本场是否仅会员可看。';
      } else {
        permTip.textContent = '官方直播仅可限制本场是否仅会员可看。';
      }
    }
  }

  function renderTemplates() {
    var box = document.getElementById('fTemplateList');
    if (!box) return;
    if (!boundTemplates.length) {
      box.innerHTML = '<div class="lf-live-template-empty">当前未绑定营销模板（可为空）</div>';
      return;
    }
    var canUnbind = !templatesLocked();
    box.innerHTML = boundTemplates
      .map(function (t) {
        var meta =
          t.stock != null && t.stock !== ''
            ? '<span class="lf-live-template-tag__meta">发放 ' + escapeHtml(String(t.stock)) + '</span>'
            : '';
        var removeBtn = canUnbind
          ? '<button type="button" class="lf-live-template-tag__remove" data-act="unbind" aria-label="解绑">×</button>'
          : '';
        return (
          '<div class="lf-live-template-tag" data-id="' +
          escapeHtml(t.id) +
          '">' +
          '<span class="lf-live-template-tag__type">' +
          escapeHtml(t.typeName || t.type) +
          '</span>' +
          '<span class="lf-live-template-tag__name">' +
          escapeHtml(t.name) +
          '</span>' +
          meta +
          removeBtn +
          '</div>'
        );
      })
      .join('');
  }

  function fillTplNames() {
    var type = (document.getElementById('fTplType') || {}).value || '';
    var nameEl = document.getElementById('fTplName');
    var stockRow = document.getElementById('fTplStockRow');
    if (!nameEl) return;
    if (!type) {
      nameEl.disabled = true;
      nameEl.innerHTML = '<option value="">请先选择模板类型</option>';
      if (stockRow) stockRow.hidden = true;
      applyFieldLocks();
      return;
    }
    var list = (Demo.marketingTemplatePool || []).filter(function (t) {
      return t.type === type;
    });
    nameEl.disabled = false;
    nameEl.innerHTML =
      '<option value="">请选择模板</option>' +
      list
        .map(function (t) {
          var stockTip = t.stock != null ? '（库存 ' + t.stock + '）' : '';
          return (
            '<option value="' +
            escapeHtml(t.id) +
            '">' +
            escapeHtml(t.name + stockTip) +
            '</option>'
          );
        })
        .join('');
    if (stockRow) stockRow.hidden = !(type === 'COUPON' || type === 'FORTUNE_BAG');
    applyFieldLocks();
  }

  function getViewPermission() {
    var el = document.querySelector('input[name="viewPermission"]:checked');
    return el ? el.value : 'ALL';
  }

  function setViewPermission(v) {
    var el = document.querySelector('input[name="viewPermission"][value="' + v + '"]');
    if (el) el.checked = true;
  }

  function loadForm() {
    editingId = qs('id');
    formMode = detectFormMode();
    sessStatus = '';
    var tab = document.getElementById('sessionFormTab');
    var tencentCard = document.getElementById('tencentCard');
    var sess = editingId ? findSession(editingId) : null;
    sessStatus = sess ? sess.status || '' : '';

    var titleMap = {
      detail: '直播场次详情',
      edit: '编辑直播场次',
      create: '新建直播场次'
    };
    var title = titleMap[formMode] || titleMap.create;
    if (tab) tab.textContent = title;
    document.title = '冷丰WMS - ' + title;

    if (isDetailMode() && !sess) {
      toast('未找到该直播场次', 'warning');
      window.location.href = wp.page('mdm_live_session.html');
      return;
    }

    if (!editingId) {
      if (tencentCard) tencentCard.hidden = true;
      boundTemplates = [];
      renderTemplates();
      syncScopeVisibility();
      resetSaleScope();
      syncSaleScopeUi();
      applyFieldLocks();
      return;
    }

    if (!sess) {
      toast('未找到该直播场次', 'warning');
      window.location.href = wp.page('mdm_live_session.html');
      return;
    }

    if (tencentCard) tencentCard.hidden = false;
    document.getElementById('fName').value = sess.name || '';
    document.getElementById('fSlot').value = sess.slotId || '';
    document.getElementById('fRoom').value = sess.roomId || '';
    document.getElementById('fLiveType').value = sess.liveType || 'OFFICIAL';
    document.getElementById('fAnchorUserId').value = sess.anchorUserId || '';
    document.getElementById('fAnchorName').value = sess.anchorName || '';
    document.getElementById('fStartAt').value = toLocalInput(sess.startAt);
    document.getElementById('fEndAt').value = toLocalInput(sess.endAt);
    var actualStartEl = document.getElementById('fActualStartAt');
    var actualEndEl = document.getElementById('fActualEndAt');
    if (actualStartEl) actualStartEl.value = sess.actualStartAt || '';
    if (actualEndEl) actualEndEl.value = sess.actualEndAt || '';
    document.getElementById('fIntro').value = sess.intro || '';
    document.getElementById('fCover').value = sess.cover || '';
    coverDataUrl = sess.cover || '';
    if (coverDataUrl) showCoverPreview(coverDataUrl);
    document.getElementById('fPushUrl').value = sess.pushUrl || '';
    document.getElementById('fPlayUrl').value = sess.playUrl || '';
    setViewPermission(sess.viewPermission || 'ALL');
    hydrateSaleScope(sess);
    boundTemplates = (sess.templates || []).map(function (t) {
      return Object.assign({}, t);
    });
    renderTemplates();
    syncScopeVisibility();
    applyFieldLocks();
  }

  function showCoverPreview(url) {
    var ph = document.getElementById('fCoverPlaceholder');
    if (!ph) return;
    if (!url) {
      ph.innerHTML = '点击上传封面<br><span>建议 5:3 横图，JPG/PNG</span>';
      return;
    }
    ph.innerHTML = '<img src="' + escapeHtml(url) + '" alt="封面预览">';
  }

  function validate() {
    var name = ((document.getElementById('fName') || {}).value || '').trim();
    var slotId = (document.getElementById('fSlot') || {}).value || '';
    var roomId = (document.getElementById('fRoom') || {}).value || '';
    var liveType = (document.getElementById('fLiveType') || {}).value || '';
    var startAt = fromLocalInput((document.getElementById('fStartAt') || {}).value || '');
    var endAt = fromLocalInput((document.getElementById('fEndAt') || {}).value || '');

    if (!name) return toast('请输入直播场次名称', 'warning'), false;
    if (!slotId) return toast('请选择直播时段', 'warning'), false;
    if (!roomId) return toast('请选择直播间', 'warning'), false;
    if (!liveType) return toast('请选择直播类型', 'warning'), false;
    if (!startAt) return toast('请选择开播时间', 'warning'), false;
    if (!endAt) return toast('请选择结束时间', 'warning'), false;
    if (new Date(endAt.replace(/-/g, '/')).getTime() <= new Date(startAt.replace(/-/g, '/')).getTime()) {
      return toast('结束时间必须晚于开播时间', 'warning'), false;
    }
    if (liveType === 'REGION' && !saleRegionSummary.length) {
      return toast('区域直播请至少选择一个适用城市', 'warning'), false;
    }
    if (liveType === 'TARGETED' && !getSaleStoreCount()) {
      return toast('定向直播请至少选择一个适用门店', 'warning'), false;
    }
    return true;
  }

  function collectPayload() {
    var slotId = document.getElementById('fSlot').value;
    var roomId = document.getElementById('fRoom').value;
    var liveType = document.getElementById('fLiveType').value;
    var slot = Demo.timeslots.find(function (s) {
      return s.id === slotId;
    });
    var room = findRoom(roomId);
    var regions = liveType === 'REGION' ? selectedRegionsForSave() : [];
    var stores = liveType === 'TARGETED' ? selectedStoresForSave() : [];

    return {
      name: document.getElementById('fName').value.trim(),
      slotId: slotId,
      slotName: slot ? slot.name : '',
      roomId: roomId,
      roomName: room ? room.name : '',
      liveType: liveType,
      liveTypeName: liveTypeLabel(liveType),
      anchorUserId: document.getElementById('fAnchorUserId').value.trim(),
      anchorName: document.getElementById('fAnchorName').value.trim(),
      startAt: fromLocalInput(document.getElementById('fStartAt').value),
      endAt: fromLocalInput(document.getElementById('fEndAt').value),
      cover: document.getElementById('fCover').value || coverDataUrl || '',
      intro: document.getElementById('fIntro').value.trim(),
      viewPermission: getViewPermission(),
      regions: regions,
      saleRegions: liveType === 'REGION' ? cloneMap(saleRegions) : {},
      saleRegionSummary: liveType === 'REGION' ? (saleRegionSummary || []).slice() : [],
      stores: stores,
      saleStores: liveType === 'TARGETED' ? cloneMap(saleStores) : {},
      templates: boundTemplates.map(function (t) {
        return Object.assign({}, t);
      })
    };
  }

  function save() {
    if (isDetailMode()) return;
    if (!validate()) return;
    var payload = collectPayload();
    var now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (editingId) {
      var sess = findSession(editingId);
      if (!sess) {
        toast('未找到该直播场次', 'warning');
        return;
      }
      // 直播中：直播间、营销模板保持原值；计划开播时间可改
      if (sess.status === 'live') {
        payload.roomId = sess.roomId;
        payload.roomName = sess.roomName;
        payload.anchorUserId = sess.anchorUserId;
        payload.anchorName = sess.anchorName;
        payload.templates = (sess.templates || []).map(function (t) {
          return Object.assign({}, t);
        });
      }
      payload.actualStartAt = sess.actualStartAt || '';
      payload.actualEndAt = sess.actualEndAt || '';
      Object.assign(sess, payload);
      toast('保存成功');
    } else {
      var id = 'sess-' + Date.now().toString(36);
      Demo.sessions.unshift(
        Object.assign(
          {
            id: id,
            type: 'regular',
            typeName: '常规场',
            status: 'upcoming',
            actualStartAt: '',
            actualEndAt: '',
            autoCloseEnabled: false,
            autoCloseAt: '',
            cViewerDisplay: 'online',
            cViewerInitial: 0,
            cViewerExtraMin: 0,
            cViewerExtraMax: 0,
            pushUrl: 'rtmp://push.demo.lengfeng.com/live/' + id + '?txSecret=****',
            playUrl: 'https://play.demo.lengfeng.com/live/' + id + '.m3u8',
            createStatus: 'ENABLED',
            remark: '',
            createdAt: now
          },
          payload
        )
      );
      if (!Demo.productsBySession[id]) Demo.productsBySession[id] = [];
      if (!Demo.controlMetrics[id]) {
        Demo.controlMetrics[id] = {
          viewers: 0,
          totalViews: 0,
          visitCount: 0,
          peakViewers: 0,
          likes: 0,
          orderCount: 0,
          orderGmv: 0,
          salesAmount: 0,
          recentOrders: [],
          chatMessages: []
        };
      }
      toast('保存成功');
    }
    setTimeout(function () {
      window.location.href = wp.page('mdm_live_session.html');
    }, 400);
  }

  function bindEvents() {
    var back = document.getElementById('sessionFormBack');
    var cancel = document.getElementById('sessionFormCancel');
    var saveBtn = document.getElementById('sessionFormSave');
    var listHref = wp.page('mdm_live_session.html');
    if (back) back.setAttribute('href', listHref);
    if (cancel) {
      cancel.addEventListener('click', function () {
        window.location.href = listHref;
      });
    }
    if (saveBtn) saveBtn.addEventListener('click', save);

    var roomEl = document.getElementById('fRoom');
    if (roomEl) {
      roomEl.addEventListener('change', function () {
        if (isDetailMode() || isLiveLocked()) return;
        syncAnchorFromRoom();
      });
    }
    var typeEl = document.getElementById('fLiveType');
    if (typeEl) typeEl.addEventListener('change', syncScopeVisibility);

    var regionPickBtn = document.getElementById('fRegionPickBtn');
    if (regionPickBtn) {
      regionPickBtn.addEventListener('click', function () {
        if (isDetailMode()) return;
        if (!window.MdmProxyRegionPicker) {
          toast('区域选择组件未加载', 'warning');
          return;
        }
        window.MdmProxyRegionPicker.open({
          selected: saleRegions,
          onConfirm: function (selected, summary) {
            saleRegions = cloneMap(selected);
            saleRegionSummary = Array.isArray(summary) ? summary : [];
            if (window.MdmProxyRegionPicker.summarize && !saleRegionSummary.length) {
              saleRegionSummary = window.MdmProxyRegionPicker.summarize(saleRegions);
            }
            syncSaleScopeUi();
          }
        });
      });
    }

    var storePickBtn = document.getElementById('fStorePickBtn');
    if (storePickBtn) {
      storePickBtn.addEventListener('click', function () {
        if (isDetailMode()) return;
        if (!window.MdmProxyStorePicker) {
          toast('门店选择组件未加载', 'warning');
          return;
        }
        window.MdmProxyStorePicker.open({
          selected: saleStores,
          onConfirm: function (selected) {
            saleStores = cloneMap(selected);
            syncSaleScopeUi();
          }
        });
      });
    }

    var coverBox = document.getElementById('fCoverBox');
    var coverFile = document.getElementById('fCoverFile');
    if (coverBox && coverFile) {
      coverBox.addEventListener('click', function () {
        if (isDetailMode()) return;
        coverFile.click();
      });
      coverFile.addEventListener('change', function () {
        var file = coverFile.files && coverFile.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
          coverDataUrl = String(reader.result || '');
          document.getElementById('fCover').value = coverDataUrl;
          showCoverPreview(coverDataUrl);
          toast('封面已选择（演示占位）');
        };
        reader.readAsDataURL(file);
      });
    }

    var tplType = document.getElementById('fTplType');
    if (tplType) tplType.addEventListener('change', fillTplNames);

    var addBtn = document.getElementById('fTplAddBtn');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        if (templatesLocked()) return;
        var type = (document.getElementById('fTplType') || {}).value || '';
        var tplId = (document.getElementById('fTplName') || {}).value || '';
        if (!type) return toast('请先选择模板类型', 'warning');
        if (!tplId) return toast('请选择模板', 'warning');
        if (type === 'SIGN_IN' && boundTemplates.some(function (t) { return t.type === 'SIGN_IN'; })) {
          return toast('当前场次已绑定签到模板，一个场次只能绑定 1 个签到模板', 'warning');
        }
        var pool = (Demo.marketingTemplatePool || []).find(function (t) {
          return t.id === tplId;
        });
        if (!pool) return toast('未找到所选模板，请重新选择', 'warning');
        if (type === 'COUPON' && boundTemplates.some(function (t) { return t.type === 'COUPON' && t.poolId === pool.id; })) {
          return toast('当前场次已添加该优惠券模板，请勿重复添加', 'warning');
        }
        var stock = null;
        if (type === 'COUPON' || type === 'FORTUNE_BAG') {
          stock = Math.floor(Number((document.getElementById('fTplStock') || {}).value || 0));
          if (!stock || stock < 1) return toast('请填写发放数量', 'warning');
        }
        boundTemplates.push({
          id: 'bind-' + Date.now().toString(36),
          poolId: pool.id,
          type: pool.type,
          typeName: pool.typeName,
          name: pool.name,
          stock: stock
        });
        document.getElementById('fTplType').value = '';
        fillTplNames();
        document.getElementById('fTplStock').value = '1';
        renderTemplates();
        toast('模板绑定成功');
      });
    }

    var tplList = document.getElementById('fTemplateList');
    if (tplList) {
      tplList.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-act="unbind"]');
        if (!btn) return;
        if (templatesLocked()) return;
        var tag = btn.closest('[data-id]');
        if (!tag) return;
        var id = tag.getAttribute('data-id');
        boundTemplates = boundTemplates.filter(function (t) {
          return t.id !== id;
        });
        renderTemplates();
        toast('模板已解绑');
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    fillSelects();
    bindEvents();
    loadForm();
  });
})();
