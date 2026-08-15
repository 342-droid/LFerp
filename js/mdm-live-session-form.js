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
  var boundTemplates = [];
  var coverDataUrl = '';

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

    var regEl = document.getElementById('fRegions');
    if (regEl) {
      regEl.innerHTML = (Demo.demoRegions || [])
        .map(function (r) {
          return (
            '<label class="lf-live-check">' +
            '<input type="checkbox" name="region" value="' +
            escapeHtml(r.code) +
            '" data-label="' +
            escapeHtml(r.label) +
            '"> ' +
            escapeHtml(r.label) +
            '</label>'
          );
        })
        .join('');
    }

    var storeEl = document.getElementById('fStores');
    if (storeEl) {
      storeEl.innerHTML = (Demo.demoStores || [])
        .map(function (s) {
          return (
            '<label class="lf-live-check">' +
            '<input type="checkbox" name="store" value="' +
            escapeHtml(s.id) +
            '" data-label="' +
            escapeHtml(s.name) +
            '"> ' +
            escapeHtml(s.name) +
            '</label>'
          );
        })
        .join('');
    }
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
    if (regionRow) regionRow.hidden = liveType !== 'REGION';
    if (storeRow) storeRow.hidden = liveType !== 'TARGETED';
  }

  function renderTemplates() {
    var box = document.getElementById('fTemplateList');
    if (!box) return;
    if (!boundTemplates.length) {
      box.innerHTML = '<div class="lf-live-template-empty">当前未绑定营销模板（可为空）</div>';
      return;
    }
    box.innerHTML = boundTemplates
      .map(function (t) {
        var meta =
          t.stock != null && t.stock !== ''
            ? '<span class="lf-live-template-tag__meta">发放 ' + escapeHtml(String(t.stock)) + '</span>'
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
          '<button type="button" class="lf-live-template-tag__remove" data-act="unbind" aria-label="解绑">×</button>' +
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
  }

  function setCheckedValues(name, values) {
    var set = {};
    (values || []).forEach(function (v) {
      set[String(v)] = true;
    });
    document.querySelectorAll('input[name="' + name + '"]').forEach(function (el) {
      el.checked = !!set[el.value];
    });
  }

  function getCheckedItems(name) {
    var items = [];
    document.querySelectorAll('input[name="' + name + '"]:checked').forEach(function (el) {
      items.push({
        id: el.value,
        code: el.value,
        name: el.getAttribute('data-label') || el.value,
        label: el.getAttribute('data-label') || el.value
      });
    });
    return items;
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
    var tab = document.getElementById('sessionFormTab');
    var tencentCard = document.getElementById('tencentCard');
    var sess = editingId ? findSession(editingId) : null;

    if (tab) tab.textContent = sess ? '编辑直播场次' : '新建直播场次';
    document.title = sess ? '冷丰WMS - 编辑直播场次' : '冷丰WMS - 新建直播场次';

    if (!editingId) {
      if (tencentCard) tencentCard.hidden = true;
      boundTemplates = [];
      renderTemplates();
      syncScopeVisibility();
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
    document.getElementById('fIntro').value = sess.intro || '';
    document.getElementById('fCover').value = sess.cover || '';
    coverDataUrl = sess.cover || '';
    if (coverDataUrl) showCoverPreview(coverDataUrl);
    document.getElementById('fPushUrl').value = sess.pushUrl || '';
    document.getElementById('fPlayUrl').value = sess.playUrl || '';
    setViewPermission(sess.viewPermission || 'ALL');
    setCheckedValues(
      'region',
      (sess.regions || []).map(function (r) {
        return r.code || r.id;
      })
    );
    setCheckedValues(
      'store',
      (sess.stores || []).map(function (s) {
        return s.id;
      })
    );
    boundTemplates = (sess.templates || []).map(function (t) {
      return Object.assign({}, t);
    });
    renderTemplates();
    syncScopeVisibility();
    updateStoreHint();
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

  function updateStoreHint() {
    var hint = document.getElementById('fStoreHint');
    if (!hint) return;
    var n = getCheckedItems('store').length;
    hint.textContent = n ? '已选择 ' + n + ' 个门店' : '请选择门店';
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
    if (liveType === 'REGION' && !getCheckedItems('region').length) {
      return toast('区域直播请至少选择一个适用区域', 'warning'), false;
    }
    if (liveType === 'TARGETED' && !getCheckedItems('store').length) {
      return toast('定向直播请至少选择一个关联门店', 'warning'), false;
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
    var regions = liveType === 'REGION' ? getCheckedItems('region') : [];
    var stores =
      liveType === 'TARGETED'
        ? getCheckedItems('store').map(function (s) {
            return { id: s.id, name: s.name };
          })
        : [];

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
      stores: stores,
      templates: boundTemplates.map(function (t) {
        return Object.assign({}, t);
      })
    };
  }

  function save() {
    if (!validate()) return;
    var payload = collectPayload();
    var now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (editingId) {
      var sess = findSession(editingId);
      if (!sess) {
        toast('未找到该直播场次', 'warning');
        return;
      }
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
    if (roomEl) roomEl.addEventListener('change', syncAnchorFromRoom);
    var typeEl = document.getElementById('fLiveType');
    if (typeEl) typeEl.addEventListener('change', syncScopeVisibility);

    document.getElementById('fStores').addEventListener('change', updateStoreHint);

    var coverBox = document.getElementById('fCoverBox');
    var coverFile = document.getElementById('fCoverFile');
    if (coverBox && coverFile) {
      coverBox.addEventListener('click', function () {
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
