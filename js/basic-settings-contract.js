/**
 * 基础设置 · 合同管理（法大大电子签原型）
 * 演示数据写入 localStorage，刷新后仍可验收。
 */
(function (global) {
  'use strict';

  var STORE_KEY = 'lf_contract_proto_v1';
  var wp = global.wmsPath || { page: function (f) { return f; } };

  var SCENES = [
    { id: 'store', name: '门店入驻', partyType: '门店', partyHint: '企业/个体户', fill: ['门店名称', '统一社会信用代码', '法人姓名', '经营地址', '联系人手机'] },
    { id: 'supplier', name: '供应商合作', partyType: '供应商', partyHint: '企业', fill: ['供应商名称', '统一社会信用代码', '法人姓名', '结算账户'] },
    { id: 'warehouse', name: '仓库合作', partyType: '仓库', partyHint: '企业', fill: ['仓库名称', '仓库地址', '仓库管理员'] },
    { id: 'employee', name: '员工入职', partyType: '员工', partyHint: '个人', fill: ['员工姓名', '证件号码', '岗位', '入职日期'] }
  ];

  var REMOTE_TEMPLATES = [
    { id: 'STPL-MD-001', name: '门店合作协议（标准版）', scene: 'store' },
    { id: 'STPL-MD-002', name: '加盟经营合同（标准版）', scene: 'store' },
    { id: 'STPL-SP-001', name: '供应商采购框架协议', scene: 'supplier' },
    { id: 'STPL-WH-001', name: '仓储服务合同', scene: 'warehouse' },
    { id: 'STPL-HR-001', name: '劳动合同（标准版）', scene: 'employee' },
    { id: 'STPL-HR-002', name: '保密与竞业限制协议', scene: 'employee' }
  ];

  var TASK_STATUS = {
    draft: { label: '待发起', cls: 'ct-tag--muted' },
    wait_auth: { label: '待对方授权', cls: 'ct-tag--warn' },
    sign_progress: { label: '签署中', cls: 'ct-tag--info' },
    sign_completed: { label: '已完成', cls: 'ct-tag--ok' },
    rejected: { label: '已拒签', cls: 'ct-tag--danger' },
    cancelled: { label: '已撤销', cls: 'ct-tag--muted' }
  };

  var AUTH_STATUS = {
    none: { label: '未授权', cls: 'ct-tag--muted' },
    pending: { label: '授权中', cls: 'ct-tag--warn' },
    done: { label: '已授权', cls: 'ct-tag--ok' },
    expired: { label: '已失效', cls: 'ct-tag--danger' }
  };

  var IDENT_STATUS = {
    none: { label: '未实名', cls: 'ct-tag--muted' },
    done: { label: '已实名', cls: 'ct-tag--ok' }
  };

  function sceneOf(id) {
    return SCENES.filter(function (s) { return s.id === id; })[0] || SCENES[0];
  }

  function defaultActors(sceneId) {
    var scene = sceneOf(sceneId);
    if (sceneId === 'employee') {
      return [
        { role: '平台方', actorType: 'corp', signMode: 'auto', keyword: '甲方签署' },
        { role: '员工', actorType: 'person', signMode: 'manual', keyword: '乙方签署' }
      ];
    }
    return [
      { role: '平台方', actorType: 'corp', signMode: 'auto', keyword: '甲方签署' },
      { role: scene.partyType, actorType: 'corp', signMode: 'manual', keyword: '乙方签署' }
    ];
  }

  function seed() {
    return {
      config: {
        env: 'uat',
        appId: '80001234',
        appSecret: 'demo-secret-****',
        openCorpId: 'OC-LENGFENG-001',
        serverUrl: 'https://uat-api.fadada.com/api/v5',
        callbackUrl: 'https://erp.lengfeng.example/api/contract/fadada/callback',
        corpName: '浙江冷丰供应链科技有限公司',
        corpIdentNo: '91330000MA2XXXXX1X',
        corpAuthStatus: 'done',
        sealName: '冷丰合同专用章',
        connectedAt: '2026-08-20 10:12:00'
      },
      templates: [
        { id: 'TPL001', name: '门店合作协议', scene: 'store', remoteId: 'STPL-MD-001', remoteName: '门店合作协议（标准版）', status: 'on', autoStart: true, signInOrder: true, actors: defaultActors('store'), fill: ['门店名称', '统一社会信用代码', '法人姓名', '经营地址', '联系人手机'], updatedAt: '2026-08-21 14:20' },
        { id: 'TPL002', name: '加盟经营合同', scene: 'store', remoteId: 'STPL-MD-002', remoteName: '加盟经营合同（标准版）', status: 'on', autoStart: true, signInOrder: true, actors: defaultActors('store'), fill: ['门店名称', '统一社会信用代码', '法人姓名'], updatedAt: '2026-08-21 14:22' },
        { id: 'TPL003', name: '供应商采购框架协议', scene: 'supplier', remoteId: 'STPL-SP-001', remoteName: '供应商采购框架协议', status: 'on', autoStart: true, signInOrder: true, actors: defaultActors('supplier'), fill: ['供应商名称', '统一社会信用代码', '法人姓名', '结算账户'], updatedAt: '2026-08-22 09:10' },
        { id: 'TPL004', name: '仓储服务合同', scene: 'warehouse', remoteId: 'STPL-WH-001', remoteName: '仓储服务合同', status: 'on', autoStart: true, signInOrder: false, actors: defaultActors('warehouse'), fill: ['仓库名称', '仓库地址', '仓库管理员'], updatedAt: '2026-08-22 11:05' },
        { id: 'TPL005', name: '劳动合同', scene: 'employee', remoteId: 'STPL-HR-001', remoteName: '劳动合同（标准版）', status: 'on', autoStart: true, signInOrder: true, actors: defaultActors('employee'), fill: ['员工姓名', '证件号码', '岗位', '入职日期'], updatedAt: '2026-08-23 16:40' },
        { id: 'TPL006', name: '保密协议', scene: 'employee', remoteId: 'STPL-HR-002', remoteName: '保密与竞业限制协议', status: 'off', autoStart: false, signInOrder: true, actors: defaultActors('employee'), fill: ['员工姓名', '证件号码'], updatedAt: '2026-08-23 16:48' }
      ],
      parties: [
        { id: 'P001', type: 'store', name: '鲜丰水果文一西路店', identNo: '91330106MA2A11111A', contact: '周敏 138****2201', identStatus: 'done', authStatus: 'done', fadadaId: 'C-XF-001', authAt: '2026-08-18 11:20' },
        { id: 'P002', type: 'store', name: '老城烧烤武林店', identNo: '91330105MA2B22222B', contact: '马东 139****8832', identStatus: 'done', authStatus: 'none', fadadaId: '', authAt: '' },
        { id: 'P003', type: 'supplier', name: '杭州鲜达供应链有限公司', identNo: '91330100MA2C33333C', contact: '陈可 137****6608', identStatus: 'done', authStatus: 'done', fadadaId: 'C-XD-003', authAt: '2026-08-15 09:02' },
        { id: 'P004', type: 'supplier', name: '宁波绿源食品有限公司', identNo: '91330200MA2D44444D', contact: '林悦 136****4410', identStatus: 'done', authStatus: 'pending', fadadaId: '', authAt: '2026-08-25 18:10' },
        { id: 'P005', type: 'warehouse', name: '华东 RDC-杭州', identNo: '91330108MA2E55555E', contact: '王仓 135****7701', identStatus: 'done', authStatus: 'done', fadadaId: 'C-WH-005', authAt: '2026-08-12 15:33' },
        { id: 'P006', type: 'warehouse', name: '杭州城市前置仓', identNo: '91330110MA2F66666F', contact: '赵磊 134****2290', identStatus: 'none', authStatus: 'none', fadadaId: '', authAt: '' },
        { id: 'P007', type: 'employee', name: '张三', identNo: '330106199001011234', contact: '店长 138****9001', identStatus: 'done', authStatus: 'done', fadadaId: 'U-ZS-007', authAt: '2026-08-19 08:40' },
        { id: 'P008', type: 'employee', name: '李四', identNo: '330102199503053216', contact: '仓管 139****2288', identStatus: 'none', authStatus: 'none', fadadaId: '', authAt: '' }
      ],
      tasks: [
        { id: 'CT20260826001', name: '鲜丰水果文一西路店 · 门店合作协议', scene: 'store', templateId: 'TPL001', partyId: 'P001', status: 'sign_completed', initiator: '李泽峰', createdAt: '2026-08-18 14:02', finishedAt: '2026-08-18 16:20', fadadaTaskId: 'ST-88001', signUrl: 'https://uat-sign.fadada.com/task/ST-88001' },
        { id: 'CT20260826002', name: '老城烧烤武林店 · 加盟经营合同', scene: 'store', templateId: 'TPL002', partyId: 'P002', status: 'wait_auth', initiator: '李明', createdAt: '2026-08-25 10:16', finishedAt: '', fadadaTaskId: 'ST-88002', signUrl: '' },
        { id: 'CT20260826003', name: '杭州鲜达供应链 · 采购框架协议', scene: 'supplier', templateId: 'TPL003', partyId: 'P003', status: 'sign_progress', initiator: '采购-周宁', createdAt: '2026-08-24 09:40', finishedAt: '', fadadaTaskId: 'ST-88003', signUrl: 'https://uat-sign.fadada.com/task/ST-88003' },
        { id: 'CT20260826004', name: '华东 RDC-杭州 · 仓储服务合同', scene: 'warehouse', templateId: 'TPL004', partyId: 'P005', status: 'sign_completed', initiator: '仓储-孙悦', createdAt: '2026-08-13 11:08', finishedAt: '2026-08-13 15:42', fadadaTaskId: 'ST-88004', signUrl: 'https://uat-sign.fadada.com/task/ST-88004' },
        { id: 'CT20260826005', name: '张三 · 劳动合同', scene: 'employee', templateId: 'TPL005', partyId: 'P007', status: 'sign_completed', initiator: '人事-吴倩', createdAt: '2026-08-19 09:12', finishedAt: '2026-08-19 09:48', fadadaTaskId: 'ST-88005', signUrl: 'https://uat-sign.fadada.com/task/ST-88005' },
        { id: 'CT20260826006', name: '李四 · 劳动合同', scene: 'employee', templateId: 'TPL005', partyId: 'P008', status: 'wait_auth', initiator: '人事-吴倩', createdAt: '2026-08-26 09:05', finishedAt: '', fadadaTaskId: '', signUrl: '' },
        { id: 'CT20260826007', name: '宁波绿源食品 · 采购框架协议', scene: 'supplier', templateId: 'TPL003', partyId: 'P004', status: 'rejected', initiator: '采购-周宁', createdAt: '2026-08-20 16:30', finishedAt: '2026-08-21 10:02', fadadaTaskId: 'ST-88007', signUrl: '' },
        { id: 'CT20260826008', name: '杭州城市前置仓 · 仓储服务合同', scene: 'warehouse', templateId: 'TPL004', partyId: 'P006', status: 'cancelled', initiator: '仓储-孙悦', createdAt: '2026-08-16 13:20', finishedAt: '2026-08-16 17:55', fadadaTaskId: 'ST-88008', signUrl: '' }
      ]
    };
  }

  function loadStore() {
    try {
      var raw = global.localStorage.getItem(STORE_KEY);
      if (!raw) return seed();
      var parsed = JSON.parse(raw);
      var base = seed();
      return {
        config: Object.assign(base.config, parsed.config || {}),
        templates: parsed.templates && parsed.templates.length ? parsed.templates : base.templates,
        parties: parsed.parties && parsed.parties.length ? parsed.parties : base.parties,
        tasks: parsed.tasks && parsed.tasks.length ? parsed.tasks : base.tasks
      };
    } catch (e) {
      return seed();
    }
  }

  function saveStore(data) {
    global.localStorage.setItem(STORE_KEY, JSON.stringify(data));
  }

  var state = loadStore();

  function toast(msg, type) {
    if (typeof global.showToast === 'function') global.showToast(msg, type || 'success');
    else global.alert(msg);
  }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function qs(name) {
    var p = new URLSearchParams(global.location.search);
    return p.get(name) || '';
  }

  function go(file, query) {
    var url = wp.page(file);
    if (query) url += (url.indexOf('?') >= 0 ? '&' : '?') + query;
    global.location.href = url;
  }

  function nowText() {
    var d = new Date();
    function p(n) { return String(n).padStart(2, '0'); }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  function nextTaskId() {
    var n = state.tasks.reduce(function (max, t) {
      var m = String(t.id || '').match(/(\d+)$/);
      return m ? Math.max(max, Number(m[1])) : max;
    }, 20260826000);
    return 'CT' + (n + 1);
  }

  function nextTplId() {
    var n = state.templates.reduce(function (max, t) {
      var m = String(t.id || '').match(/(\d+)$/);
      return m ? Math.max(max, Number(m[1])) : max;
    }, 0);
    return 'TPL' + String(n + 1).padStart(3, '0');
  }

  function findParty(id) {
    return state.parties.filter(function (p) { return p.id === id; })[0];
  }

  function findTpl(id) {
    return state.templates.filter(function (t) { return t.id === id; })[0];
  }

  function findTask(id) {
    return state.tasks.filter(function (t) { return t.id === id; })[0];
  }

  function tagHtml(map, key) {
    var item = map[key] || { label: key || '—', cls: 'ct-tag--muted' };
    return '<span class="ct-tag ' + item.cls + '">' + esc(item.label) + '</span>';
  }

  function partyTypeLabel(type) {
    var s = SCENES.filter(function (x) { return x.id === type; })[0];
    return s ? s.partyType : type;
  }

  function refreshRowNo() {
    global.dispatchEvent(new Event('lf-table-row-no:refresh'));
  }

  function bindQueryReset(form, onQuery, onReset) {
    if (!form) return;
    var q = form.querySelector('[data-ct-query]');
    var r = form.querySelector('[data-ct-reset]');
    if (q) q.addEventListener('click', onQuery);
    if (r) r.addEventListener('click', onReset);
  }

  /* ---------- 接入配置 ---------- */
  function initConfig() {
    var cfg = state.config;
    var setVal = function (id, v) {
      var el = document.getElementById(id);
      if (el) el.value = v == null ? '' : v;
    };
    setVal('ctEnv', cfg.env);
    setVal('ctAppId', cfg.appId);
    setVal('ctAppSecret', cfg.appSecret);
    setVal('ctOpenCorpId', cfg.openCorpId);
    setVal('ctServerUrl', cfg.serverUrl);
    setVal('ctCallbackUrl', cfg.callbackUrl);
    setVal('ctCorpName', cfg.corpName);
    setVal('ctCorpIdentNo', cfg.corpIdentNo);
    setVal('ctSealName', cfg.sealName);
    var authEl = document.getElementById('ctCorpAuth');
    if (authEl) authEl.innerHTML = tagHtml(AUTH_STATUS, cfg.corpAuthStatus);
    var conn = document.getElementById('ctConnected');
    if (conn) {
      conn.innerHTML = cfg.connectedAt
        ? '<span class="ct-status-dot is-ok">已连通 · 最近一次 ' + esc(cfg.connectedAt) + '</span>'
        : '<span class="ct-status-dot is-off">未连通</span>';
    }
    var ping = document.getElementById('ctPingBtn');
    if (ping) {
      ping.addEventListener('click', function () {
        state.config.connectedAt = nowText();
        saveStore(state);
        toast('已获取服务访问凭证（演示 getAccessToken）', 'success');
        initConfig();
      });
    }
    var authBtn = document.getElementById('ctAuthBtn');
    if (authBtn) {
      authBtn.addEventListener('click', function () {
        state.config.corpAuthStatus = 'done';
        saveStore(state);
        toast('已打开企业授权页并完成授权（演示 getCorpAuthUrl）', 'success');
        initConfig();
      });
    }
    var saveBtn = document.getElementById('ctSaveBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var appId = (document.getElementById('ctAppId') || {}).value || '';
        var callback = (document.getElementById('ctCallbackUrl') || {}).value || '';
        var corpName = (document.getElementById('ctCorpName') || {}).value || '';
        if (!String(appId).trim()) return toast('请填写 AppId', 'error');
        if (!String(callback).trim()) return toast('请填写事件回调地址', 'error');
        if (!String(corpName).trim()) return toast('请填写平台企业名称', 'error');
        state.config.env = document.getElementById('ctEnv').value;
        state.config.appId = String(appId).trim();
        state.config.appSecret = document.getElementById('ctAppSecret').value;
        state.config.openCorpId = document.getElementById('ctOpenCorpId').value;
        state.config.serverUrl = document.getElementById('ctServerUrl').value;
        state.config.callbackUrl = String(callback).trim();
        state.config.corpName = String(corpName).trim();
        state.config.corpIdentNo = document.getElementById('ctCorpIdentNo').value;
        state.config.sealName = document.getElementById('ctSealName').value;
        saveStore(state);
        toast('接入配置已保存', 'success');
      });
    }
    var cancelBtn = document.getElementById('ctCancelBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        initConfig();
        toast('已还原未保存修改', 'success');
      });
    }
  }

  /* ---------- 合同模板 ---------- */
  function renderSceneCards() {
    var box = document.getElementById('ctSceneCards');
    if (!box) return;
    box.innerHTML = SCENES.map(function (s) {
      var list = state.templates.filter(function (t) { return t.scene === s.id && t.status === 'on'; });
      return '<div class="ct-scene-card">' +
        '<div class="ct-scene-card__name">' + esc(s.name) + '</div>' +
        '<div class="ct-scene-card__meta">相对方：' + esc(s.partyType) + '（' + esc(s.partyHint) + '）<br>启用模板 <strong>' + list.length + '</strong> 份</div>' +
        '</div>';
    }).join('');
  }

  function renderTemplateTable() {
    var qName = ((document.getElementById('qTplName') || {}).value || '').trim();
    var qScene = (document.getElementById('qTplScene') || {}).value || '';
    var qStatus = (document.getElementById('qTplStatus') || {}).value || '';
    var rows = state.templates.filter(function (t) {
      if (qName && String(t.name).indexOf(qName) < 0 && String(t.remoteId).indexOf(qName) < 0) return false;
      if (qScene && t.scene !== qScene) return false;
      if (qStatus && t.status !== qStatus) return false;
      return true;
    });
    var tb = document.getElementById('ctTplBody');
    if (!tb) return;
    if (!rows.length) {
      tb.innerHTML = '<tr><td colspan="8" class="ct-empty">没有符合条件的合同模板</td></tr>';
      refreshRowNo();
      return;
    }
    tb.innerHTML = rows.map(function (t) {
      var actors = (t.actors || []).map(function (a) {
        return a.role + '·' + (a.signMode === 'auto' ? '自动签' : '手动签');
      }).join('；');
      var st = t.status === 'on'
        ? '<span class="ct-tag ct-tag--ok">启用</span>'
        : '<span class="ct-tag ct-tag--muted">停用</span>';
      var toggle = t.status === 'on' ? '停用' : '启用';
      return '<tr data-id="' + esc(t.id) + '">' +
        '<td><button type="button" class="ct-link" data-act="edit">' + esc(t.name) + '</button></td>' +
        '<td>' + esc(sceneOf(t.scene).name) + '</td>' +
        '<td>' + esc(t.remoteId) + '<div class="ct-field-tip" style="margin:2px 0 0">' + esc(t.remoteName) + '</div></td>' +
        '<td>' + esc(actors) + '</td>' +
        '<td>' + st + '</td>' +
        '<td>' + esc(t.updatedAt) + '</td>' +
        '<td class="erp-actions-cell"><span class="ct-ops">' +
        '<button type="button" class="ct-link" data-act="edit">编辑</button>' +
        '<button type="button" class="ct-link" data-act="toggle">' + toggle + '</button>' +
        '</span></td></tr>';
    }).join('');
    refreshRowNo();
  }

  function initTemplateList() {
    renderSceneCards();
    var sceneSel = document.getElementById('qTplScene');
    if (sceneSel && !sceneSel.getAttribute('data-filled')) {
      sceneSel.innerHTML = '<option value="">全部</option>' + SCENES.map(function (s) {
        return '<option value="' + s.id + '">' + esc(s.name) + '</option>';
      }).join('');
      sceneSel.setAttribute('data-filled', '1');
    }
    renderTemplateTable();
    bindQueryReset(document.getElementById('ctTplFilter'), renderTemplateTable, function () {
      document.getElementById('qTplName').value = '';
      document.getElementById('qTplScene').value = '';
      document.getElementById('qTplStatus').value = '';
      renderTemplateTable();
    });
    var addBtn = document.getElementById('ctTplAddBtn');
    if (addBtn) addBtn.addEventListener('click', function () { go('basic_settings_contract_template_form.html'); });
    var syncBtn = document.getElementById('ctTplSyncBtn');
    if (syncBtn) {
      syncBtn.addEventListener('click', function () {
        toast('已从法大大同步签署模板列表（演示 getSignTemplateList）', 'success');
      });
    }
    var tb = document.getElementById('ctTplBody');
    if (tb) {
      tb.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-act]');
        if (!btn) return;
        var tr = btn.closest('tr');
        var id = tr && tr.getAttribute('data-id');
        var tpl = findTpl(id);
        if (!tpl) return;
        if (btn.getAttribute('data-act') === 'edit') {
          go('basic_settings_contract_template_form.html', 'id=' + encodeURIComponent(id));
          return;
        }
        tpl.status = tpl.status === 'on' ? 'off' : 'on';
        tpl.updatedAt = nowText();
        saveStore(state);
        toast(tpl.status === 'on' ? '模板已启用' : '模板已停用', 'success');
        renderSceneCards();
        renderTemplateTable();
      });
    }
  }

  function fillSelect(el, options, value) {
    if (!el) return;
    el.innerHTML = options.map(function (o) {
      return '<option value="' + esc(o.value) + '">' + esc(o.label) + '</option>';
    }).join('');
    if (value != null) el.value = value;
  }

  function actorRowHtml(actor) {
    actor = actor || { role: '', actorType: 'corp', signMode: 'manual', keyword: '' };
    return '<tr>' +
      '<td><input class="erp-input" data-k="role" value="' + esc(actor.role) + '" placeholder="如平台方 / 门店"></td>' +
      '<td><select class="erp-select" data-k="actorType"><option value="corp"' + (actor.actorType === 'corp' ? ' selected' : '') + '>企业</option><option value="person"' + (actor.actorType === 'person' ? ' selected' : '') + '>个人</option></select></td>' +
      '<td><select class="erp-select" data-k="signMode"><option value="auto"' + (actor.signMode === 'auto' ? ' selected' : '') + '>自动签（平台章）</option><option value="manual"' + (actor.signMode === 'manual' ? ' selected' : '') + '>手动签</option></select></td>' +
      '<td><input class="erp-input" data-k="keyword" value="' + esc(actor.keyword) + '" placeholder="如乙方签署"></td>' +
      '<td><button type="button" class="ct-link is-danger" data-act="del-actor">删除</button></td>' +
      '</tr>';
  }

  function collectActors() {
    var rows = document.querySelectorAll('#ctActorBody tr');
    var out = [];
    rows.forEach(function (tr) {
      out.push({
        role: (tr.querySelector('[data-k="role"]') || {}).value || '',
        actorType: (tr.querySelector('[data-k="actorType"]') || {}).value || 'corp',
        signMode: (tr.querySelector('[data-k="signMode"]') || {}).value || 'manual',
        keyword: (tr.querySelector('[data-k="keyword"]') || {}).value || ''
      });
    });
    return out;
  }

  function renderFillChecks(sceneId, selected) {
    var box = document.getElementById('ctFillList');
    if (!box) return;
    var fields = sceneOf(sceneId).fill;
    var sel = selected || fields.slice();
    box.innerHTML = fields.map(function (f) {
      var checked = sel.indexOf(f) >= 0 ? ' checked' : '';
      return '<label><input type="checkbox" value="' + esc(f) + '"' + checked + '> ' + esc(f) + '</label>';
    }).join('');
  }

  function applySceneDefaults(sceneId, keepRemote) {
    var remoteSel = document.getElementById('ctRemoteTpl');
    var options = REMOTE_TEMPLATES.filter(function (r) { return r.scene === sceneId; }).map(function (r) {
      return { value: r.id, label: r.name + '（' + r.id + '）' };
    });
    if (!options.length) options = [{ value: '', label: '该场景暂无法大大模板' }];
    fillSelect(remoteSel, options, keepRemote || options[0].value);
    document.getElementById('ctActorBody').innerHTML = defaultActors(sceneId).map(actorRowHtml).join('');
    renderFillChecks(sceneId);
  }

  function initTemplateForm() {
    var id = qs('id');
    var tpl = id ? findTpl(id) : null;
    var title = document.getElementById('ctFormTitle');
    if (title) title.textContent = tpl ? '编辑合同模板' : '新增合同模板绑定';
    fillSelect(document.getElementById('ctTplScene'), SCENES.map(function (s) {
      return { value: s.id, label: s.name };
    }), tpl ? tpl.scene : 'store');
    document.getElementById('ctTplName').value = tpl ? tpl.name : '';
    document.getElementById('ctAutoStart').checked = tpl ? !!tpl.autoStart : true;
    document.getElementById('ctSignOrder').checked = tpl ? !!tpl.signInOrder : true;
    var statusOn = document.getElementById('ctTplOn');
    var statusOff = document.getElementById('ctTplOff');
    if (tpl && tpl.status === 'off') statusOff.checked = true;
    else statusOn.checked = true;
    applySceneDefaults(tpl ? tpl.scene : 'store', tpl ? tpl.remoteId : '');
    if (tpl) {
      document.getElementById('ctActorBody').innerHTML = (tpl.actors || defaultActors(tpl.scene)).map(actorRowHtml).join('');
      renderFillChecks(tpl.scene, tpl.fill);
      if (document.getElementById('ctRemoteTpl')) document.getElementById('ctRemoteTpl').value = tpl.remoteId;
    }
    document.getElementById('ctTplScene').addEventListener('change', function () {
      var sceneId = this.value;
      applySceneDefaults(sceneId);
      if (!tpl && !document.getElementById('ctTplName').value) {
        var remote = REMOTE_TEMPLATES.filter(function (r) { return r.scene === sceneId; })[0];
        document.getElementById('ctTplName').value = remote
          ? remote.name.replace(/（.*）/, '')
          : sceneOf(sceneId).name + '合同';
      }
    });
    document.getElementById('ctAddActor').addEventListener('click', function () {
      document.getElementById('ctActorBody').insertAdjacentHTML('beforeend', actorRowHtml({ role: '', actorType: 'corp', signMode: 'manual', keyword: '' }));
    });
    document.getElementById('ctActorBody').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act="del-actor"]');
      if (!btn) return;
      var trs = document.querySelectorAll('#ctActorBody tr');
      if (trs.length <= 1) return toast('至少保留一个签署方', 'error');
      btn.closest('tr').remove();
    });
    document.getElementById('ctTplCancel').addEventListener('click', function () {
      go('basic_settings_contract_template.html');
    });
    document.getElementById('ctTplSave').addEventListener('click', function () {
      var name = String(document.getElementById('ctTplName').value || '').trim();
      var scene = document.getElementById('ctTplScene').value;
      var remoteId = document.getElementById('ctRemoteTpl').value;
      if (!name) return toast('请填写模板名称', 'error');
      if (!remoteId) return toast('请选择法大大签署模板', 'error');
      var actors = collectActors();
      if (!actors.length || actors.some(function (a) { return !String(a.role).trim(); })) {
        return toast('请完整填写签署方角色', 'error');
      }
      var fill = Array.prototype.map.call(document.querySelectorAll('#ctFillList input:checked'), function (el) { return el.value; });
      var remote = REMOTE_TEMPLATES.filter(function (r) { return r.id === remoteId; })[0];
      var payload = {
        name: name,
        scene: scene,
        remoteId: remoteId,
        remoteName: remote ? remote.name : remoteId,
        status: document.getElementById('ctTplOn').checked ? 'on' : 'off',
        autoStart: document.getElementById('ctAutoStart').checked,
        signInOrder: document.getElementById('ctSignOrder').checked,
        actors: actors,
        fill: fill,
        updatedAt: nowText()
      };
      if (tpl) Object.assign(tpl, payload);
      else {
        payload.id = nextTplId();
        state.templates.unshift(payload);
      }
      saveStore(state);
      toast(tpl ? '模板绑定已保存' : '已新增模板绑定', 'success');
      go('basic_settings_contract_template.html');
    });
  }

  /* ---------- 签署主体 ---------- */
  function renderPartyTable() {
    var tab = (document.querySelector('.ct-tabs__item.is-active') || {}).getAttribute('data-type') || '';
    var qName = ((document.getElementById('qPartyName') || {}).value || '').trim();
    var qAuth = (document.getElementById('qPartyAuth') || {}).value || '';
    var rows = state.parties.filter(function (p) {
      if (tab && p.type !== tab) return false;
      if (qName && String(p.name).indexOf(qName) < 0 && String(p.identNo).indexOf(qName) < 0) return false;
      if (qAuth && p.authStatus !== qAuth) return false;
      return true;
    });
    var tb = document.getElementById('ctPartyBody');
    if (!tb) return;
    if (!rows.length) {
      tb.innerHTML = '<tr><td colspan="8" class="ct-empty">没有符合条件的签署主体</td></tr>';
      refreshRowNo();
      return;
    }
    tb.innerHTML = rows.map(function (p) {
      var canAuth = p.authStatus !== 'done';
      var authBtn = canAuth
        ? '<button type="button" class="ct-link" data-act="auth">发起授权</button>'
        : '<button type="button" class="ct-link" data-act="unbind">解除授权</button>';
      return '<tr data-id="' + esc(p.id) + '">' +
        '<td>' + esc(p.name) + '</td>' +
        '<td>' + esc(partyTypeLabel(p.type)) + '</td>' +
        '<td>' + esc(p.identNo) + '</td>' +
        '<td>' + esc(p.contact) + '</td>' +
        '<td>' + tagHtml(IDENT_STATUS, p.identStatus) + '</td>' +
        '<td>' + tagHtml(AUTH_STATUS, p.authStatus) + '</td>' +
        '<td>' + esc(p.fadadaId || '—') + '</td>' +
        '<td>' + esc(p.authAt || '—') + '</td>' +
        '<td class="erp-actions-cell"><span class="ct-ops">' + authBtn + '</span></td></tr>';
    }).join('');
    refreshRowNo();
  }

  function initParty() {
    document.querySelectorAll('.ct-tabs__item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.ct-tabs__item').forEach(function (x) { x.classList.remove('is-active'); });
        btn.classList.add('is-active');
        renderPartyTable();
      });
    });
    bindQueryReset(document.getElementById('ctPartyFilter'), renderPartyTable, function () {
      document.getElementById('qPartyName').value = '';
      document.getElementById('qPartyAuth').value = '';
      renderPartyTable();
    });
    renderPartyTable();
    document.getElementById('ctPartyBody').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var id = btn.closest('tr').getAttribute('data-id');
      var p = findParty(id);
      if (!p) return;
      if (btn.getAttribute('data-act') === 'auth') {
        p.identStatus = 'done';
        p.authStatus = 'done';
        p.authAt = nowText();
        p.fadadaId = p.fadadaId || ((p.type === 'employee' ? 'U-' : 'C-') + p.id);
        saveStore(state);
        toast(p.type === 'employee' ? '已完成个人授权（演示 getUserAuthUrl）' : '已完成企业授权（演示 getCorpAuthUrl）', 'success');
      } else {
        p.authStatus = 'none';
        p.fadadaId = '';
        p.authAt = '';
        saveStore(state);
        toast('已解除授权，下次签署需重新授权', 'success');
      }
      renderPartyTable();
    });
  }

  /* ---------- 签署任务 ---------- */
  function renderTaskTable() {
    var tab = (document.querySelector('.ct-tabs__item.is-active') || {}).getAttribute('data-status') || '';
    var qKw = ((document.getElementById('qTaskKw') || {}).value || '').trim();
    var qScene = (document.getElementById('qTaskScene') || {}).value || '';
    var rows = state.tasks.filter(function (t) {
      if (tab && t.status !== tab) return false;
      if (qScene && t.scene !== qScene) return false;
      if (qKw) {
        var party = findParty(t.partyId);
        var blob = [t.id, t.name, t.fadadaTaskId, party && party.name].join(' ');
        if (blob.indexOf(qKw) < 0) return false;
      }
      return true;
    });
    var tb = document.getElementById('ctTaskBody');
    if (!tb) return;
    if (!rows.length) {
      tb.innerHTML = '<tr><td colspan="9" class="ct-empty">没有符合条件的签署任务</td></tr>';
      refreshRowNo();
      return;
    }
    tb.innerHTML = rows.map(function (t) {
      var party = findParty(t.partyId);
      var ops = ['<button type="button" class="ct-link" data-act="view">查看</button>'];
      if (t.status === 'wait_auth') ops.push('<button type="button" class="ct-link" data-act="auth">去授权</button>');
      if (t.status === 'sign_progress') {
        ops.push('<button type="button" class="ct-link" data-act="urge">催签</button>');
        ops.push('<button type="button" class="ct-link" data-act="copy">复制链接</button>');
      }
      if (t.status === 'sign_completed') ops.push('<button type="button" class="ct-link" data-act="download">下载</button>');
      if (t.status === 'wait_auth' || t.status === 'sign_progress' || t.status === 'draft') {
        ops.push('<button type="button" class="ct-link is-danger" data-act="cancel">撤销</button>');
      }
      if (t.status === 'rejected' || t.status === 'cancelled') {
        ops.push('<button type="button" class="ct-link" data-act="retry">重新发起</button>');
      }
      return '<tr data-id="' + esc(t.id) + '">' +
        '<td><button type="button" class="ct-link" data-act="view">' + esc(t.id) + '</button></td>' +
        '<td>' + esc(t.name) + '</td>' +
        '<td>' + esc(sceneOf(t.scene).name) + '</td>' +
        '<td>' + esc(party ? party.name : '—') + '</td>' +
        '<td>' + tagHtml(TASK_STATUS, t.status) + '</td>' +
        '<td>' + esc(t.initiator) + '</td>' +
        '<td>' + esc(t.createdAt) + '</td>' +
        '<td>' + esc(t.finishedAt || '—') + '</td>' +
        '<td class="erp-actions-cell"><span class="ct-ops">' + ops.join('') + '</span></td></tr>';
    }).join('');
    refreshRowNo();
  }

  function updateTaskTabs() {
    document.querySelectorAll('.ct-tabs__item[data-status]').forEach(function (btn) {
      var st = btn.getAttribute('data-status');
      var count = st ? state.tasks.filter(function (t) { return t.status === st; }).length : state.tasks.length;
      var label = btn.getAttribute('data-label');
      btn.textContent = label + ' ' + count;
    });
  }

  function handleTaskAct(act, task) {
    if (!task) return;
    if (act === 'view') {
      go('basic_settings_contract_task_detail.html', 'id=' + encodeURIComponent(task.id));
      return;
    }
    if (act === 'auth') {
      go('basic_settings_contract_party.html');
      return;
    }
    if (act === 'urge') {
      toast('已向对方发送催签通知（演示 urge）', 'success');
      return;
    }
    if (act === 'copy') {
      var url = task.signUrl || ('https://uat-sign.fadada.com/task/' + (task.fadadaTaskId || task.id));
      if (global.navigator.clipboard && global.navigator.clipboard.writeText) {
        global.navigator.clipboard.writeText(url).then(function () {
          toast('签署链接已复制', 'success');
        }, function () { toast(url, 'success'); });
      } else toast(url, 'success');
      return;
    }
    if (act === 'download') {
      toast('已开始下载已签署文件（演示 getOwnerDownloadUrl）', 'success');
      return;
    }
    if (act === 'cancel') {
      if (!global.confirm('撤销后任务将终止，确定撤销该签署任务？')) return;
      task.status = 'cancelled';
      task.finishedAt = nowText();
      saveStore(state);
      toast('签署任务已撤销', 'success');
      if (document.getElementById('ctTaskBody')) {
        updateTaskTabs();
        renderTaskTable();
      }
      return;
    }
    if (act === 'retry') {
      go('basic_settings_contract_task_form.html', 'retry=' + encodeURIComponent(task.id));
    }
  }

  function initTaskList() {
    var sceneSel = document.getElementById('qTaskScene');
    if (sceneSel && !sceneSel.getAttribute('data-filled')) {
      sceneSel.innerHTML = '<option value="">全部</option>' + SCENES.map(function (s) {
        return '<option value="' + s.id + '">' + esc(s.name) + '</option>';
      }).join('');
      sceneSel.setAttribute('data-filled', '1');
    }
    updateTaskTabs();
    renderTaskTable();
    document.querySelectorAll('.ct-tabs__item[data-status]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.ct-tabs__item[data-status]').forEach(function (x) { x.classList.remove('is-active'); });
        btn.classList.add('is-active');
        renderTaskTable();
      });
    });
    bindQueryReset(document.getElementById('ctTaskFilter'), renderTaskTable, function () {
      document.getElementById('qTaskKw').value = '';
      document.getElementById('qTaskScene').value = '';
      renderTaskTable();
    });
    var addBtn = document.getElementById('ctTaskAddBtn');
    if (addBtn) addBtn.addEventListener('click', function () { go('basic_settings_contract_task_form.html'); });
    document.getElementById('ctTaskBody').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      handleTaskAct(btn.getAttribute('data-act'), findTask(btn.closest('tr').getAttribute('data-id')));
    });
  }

  function fillPartyOptions(sceneId, selected) {
    var sel = document.getElementById('ctTaskParty');
    var list = state.parties.filter(function (p) { return p.type === sceneId; });
    fillSelect(sel, [{ value: '', label: '请选择' + sceneOf(sceneId).partyType }].concat(list.map(function (p) {
      var mark = p.authStatus === 'done' ? '已授权' : ((AUTH_STATUS[p.authStatus] || AUTH_STATUS.none).label);
      return { value: p.id, label: p.name + '（' + mark + '）' };
    })), selected || '');
  }

  function fillTplOptions(sceneId, selected) {
    var sel = document.getElementById('ctTaskTpl');
    var list = state.templates.filter(function (t) { return t.scene === sceneId && t.status === 'on'; });
    fillSelect(sel, [{ value: '', label: list.length ? '请选择合同模板' : '该场景暂无启用模板' }].concat(list.map(function (t) {
      return { value: t.id, label: t.name };
    })), selected || '');
  }

  function updatePartyHint() {
    var party = findParty(document.getElementById('ctTaskParty').value);
    var box = document.getElementById('ctPartyHint');
    if (!box) return;
    if (!party) {
      box.innerHTML = '';
      box.style.display = 'none';
      return;
    }
    box.style.display = 'block';
    if (party.authStatus === 'done') {
      box.className = 'mdm-biz-tip';
      box.innerHTML = '当前主体 <strong>已授权</strong>，可直接发起签署。法大大 ID：' + esc(party.fadadaId) + '。';
    } else {
      box.className = 'ct-warn-banner';
      box.innerHTML = '当前主体尚未完成授权，提交时会先引导对方完成' + (party.type === 'employee' ? '个人' : '企业') + '授权，任务进入「待对方授权」。也可先到「签署主体」发起授权。';
    }
  }

  function initTaskForm() {
    var retryId = qs('retry');
    var retry = retryId ? findTask(retryId) : null;
    fillSelect(document.getElementById('ctTaskScene'), SCENES.map(function (s) {
      return { value: s.id, label: s.name };
    }), retry ? retry.scene : 'store');
    function refreshByScene() {
      var sceneId = document.getElementById('ctTaskScene').value;
      fillTplOptions(sceneId, retry && retry.scene === sceneId ? retry.templateId : '');
      fillPartyOptions(sceneId, retry && retry.scene === sceneId ? retry.partyId : '');
      updatePartyHint();
    }
    refreshByScene();
    if (retry) {
      document.getElementById('ctTaskName').value = retry.name.replace(/（重新发起）$/, '') + '（重新发起）';
    }
    document.getElementById('ctTaskScene').addEventListener('change', function () {
      retry = null;
      document.getElementById('ctTaskName').value = '';
      refreshByScene();
    });
    document.getElementById('ctTaskTpl').addEventListener('change', function () {
      var tpl = findTpl(this.value);
      var party = findParty(document.getElementById('ctTaskParty').value);
      if (tpl && party && !document.getElementById('ctTaskName').value) {
        document.getElementById('ctTaskName').value = party.name + ' · ' + tpl.name;
      }
    });
    document.getElementById('ctTaskParty').addEventListener('change', function () {
      updatePartyHint();
      var tpl = findTpl(document.getElementById('ctTaskTpl').value);
      var party = findParty(this.value);
      if (tpl && party) document.getElementById('ctTaskName').value = party.name + ' · ' + tpl.name;
    });
    document.getElementById('ctTaskCancel').addEventListener('click', function () {
      go('basic_settings_contract_task.html');
    });
    document.getElementById('ctTaskSave').addEventListener('click', function () {
      var scene = document.getElementById('ctTaskScene').value;
      var tplId = document.getElementById('ctTaskTpl').value;
      var partyId = document.getElementById('ctTaskParty').value;
      var name = String(document.getElementById('ctTaskName').value || '').trim();
      if (!tplId) return toast('请选择合同模板', 'error');
      if (!partyId) return toast('请选择签署相对方', 'error');
      if (!name) return toast('请填写合同名称', 'error');
      var party = findParty(partyId);
      var status = party && party.authStatus === 'done' ? 'sign_progress' : 'wait_auth';
      var fadadaTaskId = status === 'sign_progress' ? 'ST-' + Date.now().toString().slice(-6) : '';
      state.tasks.unshift({
        id: nextTaskId(),
        name: name,
        scene: scene,
        templateId: tplId,
        partyId: partyId,
        status: status,
        initiator: '当前用户',
        createdAt: nowText(),
        finishedAt: '',
        fadadaTaskId: fadadaTaskId,
        signUrl: fadadaTaskId ? 'https://uat-sign.fadada.com/task/' + fadadaTaskId : '',
        sms: document.getElementById('ctTaskSms').checked
      });
      saveStore(state);
      if (status === 'wait_auth') toast('任务已创建，等待相对方完成授权后再签署', 'success');
      else toast('已创建并启动签署任务（演示 create-with-template）', 'success');
      go('basic_settings_contract_task.html');
    });
  }

  function initTaskDetail() {
    var task = findTask(qs('id'));
    if (!task) {
      toast('签署任务不存在', 'error');
      go('basic_settings_contract_task.html');
      return;
    }
    var party = findParty(task.partyId);
    var tpl = findTpl(task.templateId);
    var set = function (id, html) {
      var el = document.getElementById(id);
      if (el) el.innerHTML = html;
    };
    set('ctDetailTitle', esc(task.name));
    set('ctDetailStatus', tagHtml(TASK_STATUS, task.status));
    set('ctKvId', esc(task.id));
    set('ctKvFdd', esc(task.fadadaTaskId || '尚未同步'));
    set('ctKvScene', esc(sceneOf(task.scene).name));
    set('ctKvTpl', esc(tpl ? tpl.name : '—'));
    set('ctKvParty', esc(party ? party.name : '—'));
    set('ctKvInitiator', esc(task.initiator));
    set('ctKvCreated', esc(task.createdAt));
    set('ctKvFinished', esc(task.finishedAt || '—'));
    var actors = (tpl && tpl.actors) ? tpl.actors : defaultActors(task.scene);
    var actorHtml = actors.map(function (a, i) {
      var isPlatform = i === 0;
      var st;
      if (task.status === 'sign_completed') st = tagHtml(TASK_STATUS, 'sign_completed');
      else if (task.status === 'cancelled') st = tagHtml(TASK_STATUS, 'cancelled');
      else if (task.status === 'rejected' && !isPlatform) st = tagHtml(TASK_STATUS, 'rejected');
      else if (isPlatform) st = '<span class="ct-tag ct-tag--ok">已自动签署</span>';
      else if (task.status === 'wait_auth') st = tagHtml(TASK_STATUS, 'wait_auth');
      else st = tagHtml(TASK_STATUS, 'sign_progress');
      var who = isPlatform ? state.config.corpName : (party ? party.name : a.role);
      return '<tr><td>' + esc(a.role) + '</td><td>' + esc(who) + '</td><td>' + (a.actorType === 'person' ? '个人' : '企业') + '</td><td>' + (a.signMode === 'auto' ? '自动签' : '手动签') + '</td><td>' + st + '</td></tr>';
    }).join('');
    set('ctActorDetailBody', actorHtml);
    var files = [
      { name: (tpl ? tpl.name : '合同') + '.pdf', kind: '签署文件' },
      { name: '签署完成报告.pdf', kind: '出证文件', onlyDone: true }
    ];
    set('ctFileList', files.filter(function (f) {
      return !f.onlyDone || task.status === 'sign_completed';
    }).map(function (f) {
      var canDl = task.status === 'sign_completed';
      return '<div class="ct-file-row"><div>' + esc(f.name) + '<div class="ct-field-tip">' + esc(f.kind) + '</div></div>' +
        (canDl ? '<button type="button" class="ct-link" data-act="download">下载</button>' : '<span class="ct-tag ct-tag--muted">签署完成后可下载</span>') +
        '</div>';
    }).join(''));
    var logs = [
      { t: task.createdAt, d: '创建签署任务' + (task.fadadaTaskId ? '，法大大任务号 ' + task.fadadaTaskId : '') }
    ];
    if (task.status !== 'draft') logs.push({ t: task.createdAt, d: party && party.authStatus === 'done' ? '相对方已授权，任务进入签署' : '等待相对方授权' });
    if (task.status === 'sign_progress' || task.status === 'sign_completed') logs.push({ t: task.createdAt, d: '平台方已自动盖章' });
    if (task.status === 'sign_completed') logs.push({ t: task.finishedAt, d: '全部签署完成，已回写业务状态（回调 sign_completed）' });
    if (task.status === 'rejected') logs.push({ t: task.finishedAt, d: '相对方拒签，任务终止（回调 task_terminated）' });
    if (task.status === 'cancelled') logs.push({ t: task.finishedAt, d: '发起方撤销任务' });
    if (task.status === 'wait_auth') logs.push({ t: task.createdAt, d: '已创建任务，待相对方完成授权后获取签署链接' });
    set('ctTimeline', logs.map(function (x) {
      return '<li><div class="ct-timeline__t">' + esc(x.t) + '</div>' + esc(x.d) + '</li>';
    }).join(''));

    document.getElementById('ctDetailBack').addEventListener('click', function () {
      go('basic_settings_contract_task.html');
    });
    document.getElementById('ctDetailOps').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var act = btn.getAttribute('data-act');
      if (act === 'download') {
        if (task.status !== 'sign_completed') return toast('签署完成后才可下载', 'error');
      }
      handleTaskAct(act, task);
      if (act === 'cancel') go('basic_settings_contract_task.html');
    });
    var fileList = document.getElementById('ctFileList');
    if (fileList) {
      fileList.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-act="download"]');
        if (!btn) return;
        handleTaskAct('download', task);
      });
    }
    var urge = document.querySelector('#ctDetailOps [data-act="urge"]');
    var copy = document.querySelector('#ctDetailOps [data-act="copy"]');
    var dl = document.querySelector('#ctDetailOps [data-act="download"]');
    var cancel = document.querySelector('#ctDetailOps [data-act="cancel"]');
    if (urge) urge.style.display = task.status === 'sign_progress' ? '' : 'none';
    if (copy) copy.style.display = task.status === 'sign_progress' ? '' : 'none';
    if (dl) dl.style.display = task.status === 'sign_completed' ? '' : 'none';
    if (cancel) cancel.style.display = (task.status === 'sign_progress' || task.status === 'wait_auth' || task.status === 'draft') ? '' : 'none';
  }

  function init() {
    var page = document.body.getAttribute('data-ct-page');
    if (page === 'config') initConfig();
    else if (page === 'template') initTemplateList();
    else if (page === 'template-form') initTemplateForm();
    else if (page === 'party') initParty();
    else if (page === 'task') initTaskList();
    else if (page === 'task-form') initTaskForm();
    else if (page === 'task-detail') initTaskDetail();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
