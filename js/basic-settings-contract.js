/**
 * 基础设置 · 合同管理（法大大电子签原型）
 * 演示数据写入 localStorage，刷新后仍可验收。
 */
(function (global) {
  'use strict';

  var STORE_KEY = 'lf_contract_proto_v1';
  var wp = global.wmsPath || { page: function (f) { return f; } };

  var STORE_PARTNER_TYPES = ['加盟店', '联营店', '直营店'];

  var CATALOG_VERSION = 'real-20261026';

  var SCENES = [
    { id: 'store', name: '门店合作', partyType: '门店', partyKind: 'corp', partyHint: '企业/个体户', fill: ['门店名称', '统一社会信用代码', '经营负责人', '门店地址', '联系电话'] },
    { id: 'supplier', name: '供应商合作', partyType: '供应商', partyKind: 'corp', partyHint: '企业/个体户', fill: ['供应商名称', '统一社会信用代码', '法定代表人', '注册地址', '联系电话'] },
    { id: 'user', name: '用户注册', partyType: '用户', partyKind: 'person', partyHint: '个人', fill: ['手机号', '姓名'] }
  ];

  var REMOTE_TEMPLATES = [
    { id: 'STPL-ST-001', name: '冷丰品牌合作合同', scene: 'store' },
    { id: 'STPL-ST-002', name: '冷丰加盟门店资金清分结算合同', scene: 'store' },
    { id: 'STPL-SUP-001', name: '冷丰平台供应商入驻合作协议', scene: 'supplier' },
    { id: 'STPL-SUP-002', name: '冷丰平台供应商资金清分结算合同', scene: 'supplier' },
    { id: 'STPL-USER-001', name: '冷丰平台用户注册服务协议', scene: 'user' },
    { id: 'STPL-USER-002', name: '冷丰平台隐私政策', scene: 'user' }
  ];

  var TASK_STATUS = {
    wait_auth: { label: '待对方授权', cls: 'ct-tag--warn' },
    sign_progress: { label: '签署中', cls: 'ct-tag--info' },
    sign_completed: { label: '已完成', cls: 'ct-tag--ok' },
    overdue: { label: '已逾期', cls: 'ct-tag--danger' },
    cancelled: { label: '已撤销', cls: 'ct-tag--muted' },
    terminated: { label: '已终止', cls: 'ct-tag--danger' },
    voiding: { label: '作废中', cls: 'ct-tag--warn' },
    voided: { label: '已作废', cls: 'ct-tag--muted' }
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
    return [
      { role: '平台方', actorType: 'corp', signMode: 'auto', keyword: '甲方签署' },
      { role: scene.partyType, actorType: scene.partyKind === 'person' ? 'person' : 'corp', signMode: 'manual', keyword: '乙方签署' }
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
      catalogVersion: CATALOG_VERSION,
      templates: [
        { id: 'TPL001', name: '冷丰品牌合作合同', scene: 'store', storePartnerType: '加盟店', storePartnerTypes: ['加盟店', '联营店', '直营店'], remoteId: 'STPL-ST-001', remoteName: '冷丰品牌合作合同', status: 'on', autoStart: true, signInOrder: true, actors: defaultActors('store'), fill: ['门店名称', '统一社会信用代码', '经营负责人', '门店地址', '联系电话'], updatedAt: '2026-10-26 22:40' },
        { id: 'TPL002', name: '冷丰加盟门店资金清分结算合同', scene: 'store', storePartnerType: '加盟店', storePartnerTypes: ['加盟店'], remoteId: 'STPL-ST-002', remoteName: '冷丰加盟门店资金清分结算合同', status: 'on', autoStart: true, signInOrder: true, actors: defaultActors('store'), fill: ['门店名称', '统一社会信用代码', '经营负责人', '门店地址', '联系电话'], updatedAt: '2026-10-26 22:40' },
        { id: 'TPL003', name: '冷丰平台供应商入驻合作协议', scene: 'supplier', remoteId: 'STPL-SUP-001', remoteName: '冷丰平台供应商入驻合作协议', status: 'on', autoStart: true, signInOrder: true, actors: defaultActors('supplier'), fill: ['供应商名称', '统一社会信用代码', '法定代表人', '注册地址', '联系电话'], updatedAt: '2026-10-26 22:40' },
        { id: 'TPL004', name: '冷丰平台供应商资金清分结算合同', scene: 'supplier', remoteId: 'STPL-SUP-002', remoteName: '冷丰平台供应商资金清分结算合同', status: 'on', autoStart: true, signInOrder: true, actors: defaultActors('supplier'), fill: ['供应商名称', '统一社会信用代码', '法定代表人', '注册地址', '联系电话'], updatedAt: '2026-10-26 22:40' },
        { id: 'TPL005', name: '冷丰平台用户注册服务协议', scene: 'user', remoteId: 'STPL-USER-001', remoteName: '冷丰平台用户注册服务协议', status: 'on', autoStart: true, signInOrder: true, actors: defaultActors('user'), fill: ['手机号', '姓名'], updatedAt: '2026-10-26 22:40' },
        { id: 'TPL006', name: '冷丰平台隐私政策', scene: 'user', remoteId: 'STPL-USER-002', remoteName: '冷丰平台隐私政策', status: 'on', autoStart: true, signInOrder: true, actors: defaultActors('user'), fill: ['手机号', '姓名'], updatedAt: '2026-10-26 22:40' }
      ],
      parties: [
        { id: 'P001', type: 'store', partnerDivision: '加盟店', name: '鲜丰水果文一西路店', identNo: '91330106MA2A11111A', contact: '周敏 138****2201', identStatus: 'done', authStatus: 'done', fadadaId: 'C-XF-001', authAt: '2026-08-18 11:20' },
        { id: 'P002', type: 'store', partnerDivision: '联营店', name: '老城烧烤武林店', identNo: '91330105MA2B22222B', contact: '马东 139****8832', identStatus: 'done', authStatus: 'none', fadadaId: '', authAt: '' },
        { id: 'P003', type: 'supplier', name: '杭州鲜达供应链有限公司', identNo: '91330100MA2C33333C', contact: '陈可 137****6608', identStatus: 'done', authStatus: 'done', fadadaId: 'C-XD-003', authAt: '2026-08-15 09:02' },
        { id: 'P004', type: 'supplier', name: '宁波绿源食品有限公司', identNo: '91330200MA2D44444D', contact: '林悦 136****4410', identStatus: 'done', authStatus: 'pending', fadadaId: '', authAt: '2026-08-25 18:10' },
        { id: 'P009', type: 'user', name: '周敏', identNo: '138****2201', contact: '138****2201', identStatus: 'done', authStatus: 'done', fadadaId: 'U-ZM-009', authAt: '2026-08-18 09:12' },
        { id: 'P010', type: 'user', name: '马东', identNo: '139****8832', contact: '139****8832', identStatus: 'done', authStatus: 'none', fadadaId: '', authAt: '' },
        { id: 'P011', type: 'store', partnerDivision: '直营店', name: '中心店01', identNo: '91330106MA2E55555E', contact: '牛店长 13812348001', identStatus: 'done', authStatus: 'none', fadadaId: '', authAt: '' },
        { id: 'P012', type: 'store', partnerDivision: '加盟店', name: '蒋村公交站店', identNo: '91330106MA2F66666F', contact: '赵启 13700001111', identStatus: 'done', authStatus: 'done', fadadaId: 'C-JC-012', authAt: '2026-10-12 11:00' },
        { id: 'P013', type: 'store', partnerDivision: '联营店', name: '西溪湿地南门店', identNo: '91330106MA2G77777G', contact: '陈夏 13600002222', identStatus: 'done', authStatus: 'done', fadadaId: 'C-XX-013', authAt: '2026-10-08 10:12' },
        { id: 'P014', type: 'supplier', name: '华东辅料仓配', identNo: '91330100MA2H88888H', contact: '周宁 13500003333', identStatus: 'done', authStatus: 'done', fadadaId: 'C-HD-014', authAt: '2026-09-20 09:00' }
      ],
      tasks: [
        { id: 'CT20260826001', name: '鲜丰水果文一西路店 · 冷丰品牌合作合同、冷丰加盟门店资金清分结算合同', scene: 'store', templateId: 'TPL001', templateIds: ['TPL001', 'TPL002'], storePartnerType: '加盟店', partyId: 'P001', status: 'sign_completed', initiator: '李泽峰', createdAt: '2026-08-18 14:02', deadline: '2026-08-25 14:02', finishedAt: '2026-08-18 16:20', fadadaTaskId: 'ST-88001', signUrl: 'https://uat-sign.fadada.com/task/ST-88001' },
        { id: 'CT20260826002', name: '老城烧烤武林店 · 冷丰品牌合作合同', scene: 'store', templateId: 'TPL001', templateIds: ['TPL001'], storePartnerType: '联营店', partyId: 'P002', status: 'wait_auth', initiator: '李明', createdAt: '2026-08-25 10:16', deadline: '2026-09-01 10:16', finishedAt: '', fadadaTaskId: 'ST-88002', signUrl: '' },
        { id: 'CT20260826003', name: '杭州鲜达供应链有限公司 · 冷丰平台供应商入驻合作协议、冷丰平台供应商资金清分结算合同', scene: 'supplier', templateId: 'TPL003', templateIds: ['TPL003', 'TPL004'], partyId: 'P003', status: 'sign_progress', initiator: '采购-周宁', createdAt: '2026-08-24 09:40', deadline: '2026-08-31 09:40', finishedAt: '', fadadaTaskId: 'ST-88003', signUrl: 'https://uat-sign.fadada.com/task/ST-88003' },
        { id: 'CT20260826007', name: '宁波绿源食品有限公司 · 冷丰平台供应商入驻合作协议、冷丰平台供应商资金清分结算合同', scene: 'supplier', templateId: 'TPL003', templateIds: ['TPL003', 'TPL004'], partyId: 'P004', status: 'terminated', initiator: '采购-周宁', createdAt: '2026-08-20 16:30', deadline: '2026-08-27 16:30', finishedAt: '2026-08-21 10:02', fadadaTaskId: 'ST-88007', signUrl: '' },
        { id: 'CT20261027001', name: '中心店01 · 冷丰品牌合作合同', scene: 'store', templateId: 'TPL001', templateIds: ['TPL001'], storePartnerType: '直营店', partyId: 'P011', status: 'wait_auth', initiator: '李泽峰', createdAt: '2026-10-26 09:30', deadline: '2026-11-10 09:30', finishedAt: '', fadadaTaskId: '', signUrl: '' },
        { id: 'CT20261027002', name: '蒋村公交站店 · 冷丰品牌合作合同', scene: 'store', templateId: 'TPL001', templateIds: ['TPL001'], storePartnerType: '加盟店', partyId: 'P012', status: 'cancelled', initiator: '李明', createdAt: '2026-10-12 11:20', deadline: '2026-10-19 11:20', finishedAt: '2026-10-13 16:05', fadadaTaskId: 'ST-88012', signUrl: '' },
        { id: 'CT20261027003', name: '西溪湿地南门店 · 冷丰品牌合作合同', scene: 'store', templateId: 'TPL001', templateIds: ['TPL001'], storePartnerType: '联营店', partyId: 'P013', status: 'voiding', initiator: '李泽峰', createdAt: '2026-10-08 14:10', deadline: '2026-10-15 14:10', finishedAt: '', fadadaTaskId: 'ST-88013', signUrl: '' },
        { id: 'CT20261027004', name: '华东辅料仓配 · 冷丰平台供应商入驻合作协议', scene: 'supplier', templateId: 'TPL003', templateIds: ['TPL003'], partyId: 'P014', status: 'voided', initiator: '采购-周宁', createdAt: '2026-09-28 10:00', deadline: '2026-10-05 10:00', finishedAt: '2026-10-18 09:40', fadadaTaskId: 'ST-88014', signUrl: '' },
        { id: 'CT20260826005', name: '周敏 · 冷丰平台用户注册服务协议、冷丰平台隐私政策', scene: 'user', templateId: 'TPL005', templateIds: ['TPL005', 'TPL006'], partyId: 'P009', status: 'sign_completed', initiator: '系统', createdAt: '2026-08-19 09:12', deadline: '2026-08-26 09:12', finishedAt: '2026-08-19 09:13', fadadaTaskId: 'ST-88005', signUrl: 'https://uat-sign.fadada.com/task/ST-88005' }
      ]
    };
  }

  function partnerTypesOf(tpl) {
    if (!tpl) return [];
    var raw = Array.isArray(tpl.storePartnerTypes) ? tpl.storePartnerTypes.slice() : [];
    if (!raw.length && tpl.storePartnerType) raw = String(tpl.storePartnerType).split(/[、,，]/);
    return STORE_PARTNER_TYPES.filter(function (t) { return raw.indexOf(t) >= 0; });
  }

  function partnerTypeLabel(tpl) {
    if (!tpl || tpl.scene !== 'store') return '—';
    var types = partnerTypesOf(tpl);
    return types.length ? types.join('、') : '—';
  }

  function readPartnerTypes() {
    return Array.prototype.map.call(document.querySelectorAll('#ctStorePartnerType input:checked'), function (el) {
      return el.value;
    });
  }

  function writePartnerTypes(types) {
    var set = types && types.length ? types : ['加盟店'];
    document.querySelectorAll('#ctStorePartnerType input').forEach(function (el) {
      el.checked = set.indexOf(el.value) >= 0;
    });
  }

  function migrateStoreContracts(data) {
    if (data.catalogVersion === CATALOG_VERSION) return data;
    var fresh = seed();
    data.templates = fresh.templates;
    data.parties = fresh.parties;
    data.tasks = fresh.tasks;
    data.catalogVersion = CATALOG_VERSION;
    saveStore(data);
    return data;
  }

  function loadStore() {
    try {
      var raw = global.localStorage.getItem(STORE_KEY);
      if (!raw) return seed();
      var parsed = JSON.parse(raw);
      var base = seed();
      var data = {
        config: Object.assign(base.config, parsed.config || {}),
        catalogVersion: parsed.catalogVersion || '',
        templates: parsed.templates && parsed.templates.length ? parsed.templates : base.templates,
        parties: parsed.parties && parsed.parties.length ? parsed.parties : base.parties,
        tasks: parsed.tasks && parsed.tasks.length ? parsed.tasks : base.tasks
      };
      return ensureDemoTaskStatuses(migrateStoreContracts(data));
    } catch (e) {
      return seed();
    }
  }

  function ensureDemoTaskStatuses(data) {
    if (!data || !Array.isArray(data.tasks)) return data;
    var changed = false;
    data.tasks.forEach(function (task) {
      if (task && task.status === 'rejected') {
        task.status = 'terminated';
        changed = true;
      }
    });
    var fresh = seed();
    var partyIds = {};
    (data.parties || []).forEach(function (party) { partyIds[party.id] = true; });
    fresh.parties.forEach(function (party) {
      if (partyIds[party.id]) return;
      data.parties.push(party);
      changed = true;
    });
    var taskIds = {};
    data.tasks.forEach(function (task) { taskIds[task.id] = true; });
    fresh.tasks.forEach(function (task) {
      if (taskIds[task.id]) return;
      if (String(task.id).indexOf('CT20261027') !== 0) return;
      data.tasks.push(task);
      changed = true;
    });
    data.tasks.forEach(function (task) {
      if (!task) return;
      var url = fadadaSignUrl(task);
      if (task.signUrl !== url) {
        task.signUrl = url;
        changed = true;
      }
    });
    if (changed) saveStore(data);
    return data;
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

  function contractBodyOf(tpl) {
    var bag = global.LF_CONTRACT_BODIES || {};
    var names = global.LF_CONTRACT_BODY_NAMES || {};
    if (!tpl) return '';
    if (bag[tpl.id]) return bag[tpl.id];
    if (tpl.remoteId && bag[tpl.remoteId]) return bag[tpl.remoteId];
    var name = String(tpl.name || tpl.remoteName || '');
    if (names[name] && bag[names[name]]) return bag[names[name]];
    var hit = Object.keys(names).filter(function (key) {
      return name && (name.indexOf(key) >= 0 || key.indexOf(name) >= 0);
    }).sort(function (a, b) { return b.length - a.length; })[0];
    return hit ? (bag[names[hit]] || '') : '';
  }

  function fillContractParty(text, party) {
    if (!text || !party || !party.name) return text || '';
    var lines = String(text).split('\n');
    var end = lines.findIndex(function (line) {
      return line.indexOf('鉴于') === 0 || line.indexOf('第一条') === 0 || line.indexOf('第一章') === 0;
    });
    if (end < 0) end = Math.min(lines.length, 24);
    var identFilled = false;
    var phoneFilled = false;
    var addressFilled = false;
    var person = String(party.contact || '').split(/\s+/)[0] || '';
    for (var i = 0; i < end; i++) {
      var line = lines[i];
      if (/^乙方(（[^）]*）)?：\s*$/.test(line.trim())) {
        lines[i] = line.replace(/：\s*$/, '：' + party.name);
        continue;
      }
      if (!identFilled && /^统一社会信用代码(（[^）]*）|\/个体工商户注册号)?：\s*$/.test(line.trim())) {
        lines[i] = line.replace(/：\s*$/, '：' + (party.identNo || ''));
        identFilled = true;
        continue;
      }
      if (!phoneFilled && /^联系电话：\s*$/.test(line.trim())) {
        lines[i] = line.replace(/：\s*$/, '：' + (party.contact || ''));
        phoneFilled = true;
        continue;
      }
      if (!addressFilled && /(地址|住所)：\s*$/.test(line.trim()) && party.address) {
        lines[i] = line.replace(/：\s*$/, '：' + party.address);
        addressFilled = true;
        continue;
      }
      if (person && /^(实际经营负责人|法定代表人|经营负责人)：\s*$/.test(line.trim())) {
        lines[i] = line.replace(/：\s*$/, '：' + person);
      }
    }
    return lines.join('\n');
  }

  function cnDate(raw) {
    var m = String(raw || '').match(/(\d{4})-(\d{2})-(\d{2})/);
    return m ? (m[1] + '年' + m[2] + '月' + m[3] + '日') : '';
  }

  function companyOnLine(text, role) {
    var lines = String(text || '').split('\n');
    var i;
    var line;
    var matched;
    var name;
    var fallback = '';
    for (i = 0; i < lines.length; i++) {
      line = lines[i].trim();
      if (line.indexOf(role) !== 0) continue;
      matched = line.match(/：\s*(.*)$/);
      if (!matched) continue;
      name = matched[1].replace(/[_\s　]+$/g, '').trim();
      if (!name) continue;
      if (line.indexOf('盖章') >= 0) return name;
      if (!fallback) fallback = name;
    }
    return fallback;
  }

  function signerName(party) {
    if (!party) return '';
    if (party.type === 'user') return party.name || '';
    return String(party.contact || '').split(/\s+/)[0] || '';
  }

  function sealModel(task, party, tpl, body) {
    var signedAt = (task.templateSignedAt && tpl && task.templateSignedAt[tpl.id]) || task.finishedAt || '';
    var partyA = companyOnLine(body, '甲方');
    if (!partyA) {
      var subject = String(body || '').match(/适用主体：([^\n]+)/);
      partyA = subject ? subject[1].trim() : '';
    }
    return {
      partyA: partyA,
      partyB: party && party.type !== 'user' ? (party.name || '') : '',
      person: signerName(party),
      phone: party && party.type === 'user' ? (party.contact || party.name || '') : '',
      dateA: cnDate(task.createdAt),
      dateB: cnDate(signedAt || task.finishedAt || task.createdAt),
      timeB: signedAt || task.finishedAt || '',
      user: task.scene === 'user'
    };
  }

  function sealMark(name, index) {
    var uid = 'ctSealArc' + index + String(Math.random()).slice(2, 8);
    return '<span class="ct-seal' + (index > 1 ? ' ct-seal--next' : '') + '" aria-label="已盖章">' +
      '<svg viewBox="0 0 120 120" width="112" height="112">' +
      '<circle cx="60" cy="60" r="56" fill="rgba(255,255,255,0.55)" stroke="#c41e1e" stroke-width="3"/>' +
      '<circle cx="60" cy="60" r="51" fill="none" stroke="#c41e1e" stroke-width="1"/>' +
      '<defs><path id="' + uid + '" d="M14,66 A46,46 0 0,1 106,66"/></defs>' +
      '<text fill="#c41e1e" font-size="10" font-weight="700">' +
      '<textPath href="#' + uid + '" startOffset="50%" text-anchor="middle">' + esc(name) + '</textPath></text>' +
      '<text x="60" y="66" text-anchor="middle" fill="#c41e1e" font-size="18">★</text>' +
      '<text x="60" y="86" text-anchor="middle" fill="#c41e1e" font-size="13" font-weight="700">合同专用章</text>' +
      '</svg></span>';
  }

  function fillSignDate(raw, date) {
    if (!date) return raw;
    if (/年/.test(raw) && /月/.test(raw) && /日/.test(raw)) {
      return raw.replace(/^(\s*日期：).*/, '$1' + date);
    }
    return raw.replace(/：\s*$/, '：' + date);
  }

  function signLineHtml(raw, extra) {
    return '<span class="ct-signline">' + esc(raw) + (extra || '') + '</span>';
  }

  function renderSealedContract(text, seal) {
    var lines = String(text || '').split('\n');
    var inPage = false;
    var hadPage = false;
    var dateSlot = 0;
    var sealIndex = 0;
    var html = lines.map(function (raw) {
      var trimmed = raw.trim();
      if (trimmed.indexOf('以下无正文') >= 0) {
        inPage = true;
        hadPage = true;
      }
      if (inPage && trimmed.indexOf('附件') === 0) inPage = false;
      if (!inPage || trimmed.indexOf('以下无正文') >= 0) return esc(raw);
      if (/甲方/.test(trimmed) && /盖章/.test(trimmed)) {
        sealIndex += 1;
        return signLineHtml(raw, seal.partyA ? sealMark(seal.partyA, sealIndex) : '');
      }
      if (/乙方/.test(trimmed) && /盖章|签字/.test(trimmed)) {
        var shown = raw;
        if (seal.partyB && /：\s*[_＿\s　]*$/.test(trimmed)) {
          shown = raw.replace(/：\s*[_＿\s　]*$/, '：' + seal.partyB);
        }
        sealIndex += 1;
        return signLineHtml(shown, seal.partyB ? sealMark(seal.partyB, sealIndex) : '');
      }
      if (/授权代表签字/.test(trimmed)) {
        var platformLine = raw.replace(/[_\s　]+$/g, '');
        if (!/：$/.test(platformLine.trim())) platformLine = platformLine.replace(/：.*$/, '：');
        return signLineHtml(platformLine, '<span class="ct-sign-note">平台自动盖章</span>');
      }
      if (/签字/.test(trimmed)) {
        var personLine = raw.replace(/[_\s　]+$/g, '');
        if (!/：$/.test(personLine.trim())) personLine = personLine.replace(/：.*$/, '：');
        return signLineHtml(personLine, seal.person ? '<span class="ct-sign-name">' + esc(seal.person) + '</span>' : '');
      }
      if (/^日期/.test(trimmed)) {
        dateSlot += 1;
        return esc(fillSignDate(raw, dateSlot === 1 ? seal.dateA : seal.dateB));
      }
      return esc(raw);
    });
    if (!hadPage && seal.user) {
      html.push('');
      html.push(signLineHtml('平台方（盖章）：' + (seal.partyA || ''), seal.partyA ? sealMark(seal.partyA, 1) : ''));
      html.push(signLineHtml('用户署名：', seal.person ? '<span class="ct-sign-name">' + esc(seal.person) + '</span>' : ''));
      if (seal.phone) html.push(esc('手机号：' + seal.phone));
      html.push(esc('签署时间：' + (seal.timeB || seal.dateB || '')));
      html.push(esc('签署方式：注册时勾选同意'));
    }
    return html.join('\n');
  }

  function ensureContractViewer() {
    var mask = document.getElementById('ctDocMask');
    if (mask && document.getElementById('ctDocSide')) return mask;
    if (mask) mask.remove();
    mask = document.createElement('div');
    mask.id = 'ctDocMask';
    mask.className = 'ct-doc-mask';
    mask.hidden = true;
    mask.innerHTML =
      '<div class="ct-doc" role="dialog" aria-modal="true" aria-labelledby="ctDocTitle">' +
      '<div class="ct-doc__head"><div><div class="ct-doc__eyebrow" id="ctDocEyebrow"></div>' +
      '<div class="ct-doc__title" id="ctDocTitle"></div><div class="ct-doc__meta" id="ctDocMeta"></div></div>' +
      '<button type="button" class="ct-doc__close" data-ct-doc-close>关闭</button></div>' +
      '<div class="ct-doc__tabs" id="ctDocTabs"></div>' +
      '<div class="ct-doc__layout">' +
      '<div class="ct-doc__paper" id="ctDocBody"></div>' +
      '<aside class="ct-doc__side" id="ctDocSide" hidden><div class="ct-doc__side-title">详情</div>' +
      '<div id="ctDocDetail"></div></aside></div></div>';
    document.body.appendChild(mask);
    mask.addEventListener('click', function (e) {
      var copyBtn = e.target.closest('[data-ct-copy]');
      if (!copyBtn) return;
      copyText(copyBtn.getAttribute('data-ct-copy') || '').then(function () {
        toast('任务编号已复制', 'success');
      });
    });
    mask.addEventListener('click', function (e) {
      if (e.target === mask || e.target.closest('[data-ct-doc-close]')) closeContractViewer();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !mask.hidden) closeContractViewer();
    });
    return mask;
  }

  function closeContractViewer() {
    var mask = document.getElementById('ctDocMask');
    if (mask) mask.hidden = true;
    document.body.style.overflow = '';
  }

  function openContractDocs(opts) {
    var docs = (opts && opts.docs) || [];
    var mask = ensureContractViewer();
    var tabs = document.getElementById('ctDocTabs');
    var eyebrow = document.getElementById('ctDocEyebrow');
    var title = document.getElementById('ctDocTitle');
    var meta = document.getElementById('ctDocMeta');
    var paper = document.getElementById('ctDocBody');
    var index = opts && opts.index > 0 ? opts.index : 0;
    if (index >= docs.length) index = 0;
    function show(i) {
      index = i;
      var doc = docs[i] || { name: '合同', body: '' };
      if (eyebrow) eyebrow.textContent = opts.eyebrow || '合同正文';
      if (title) title.textContent = doc.name || '合同';
      if (meta) meta.textContent = opts.meta || '';
      if (tabs) {
        tabs.innerHTML = docs.length > 1 ? docs.map(function (item, n) {
          return '<button type="button" class="ct-doc__tab' + (n === i ? ' is-active' : '') + '" data-ct-doc-tab="' + n + '">' + esc(item.name) + '</button>';
        }).join('') : '';
      }
      if (paper) {
        if (doc.seal) paper.innerHTML = renderSealedContract(doc.body || '', doc.seal);
        else paper.textContent = doc.body || '这份协议还没有收录正文。';
        paper.scrollTop = 0;
      }
      paintContractDetail(opts, doc);
    }
    if (tabs) {
      tabs.onclick = function (e) {
        var btn = e.target.closest('[data-ct-doc-tab]');
        if (!btn) return;
        show(Number(btn.getAttribute('data-ct-doc-tab')) || 0);
      };
    }
    show(index);
    mask.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function openTemplateContract(tpl) {
    if (!tpl) return;
    var body = contractBodyOf(tpl);
    openContractDocs({
      eyebrow: '合同模板 · ' + sceneOf(tpl.scene).name,
      meta: tpl.scene === 'store' ? ('适用合作类型：' + partnerTypeLabel(tpl)) : '按模板原文展示',
      docs: [{ name: tpl.name, body: body }]
    });
  }

  function openTaskContract(task, activeId) {
    if (!task) return;
    var party = findParty(task.partyId);
    var tpls = taskTemplates(task);
    var docs = (tpls.length ? tpls : [{ id: task.templateId, name: task.name || '合同' }]).map(function (tpl) {
      var body = fillContractParty(contractBodyOf(tpl), party);
      var signed = isTemplateSigned(task, tpl.id);
      return {
        id: tpl.id,
        name: tpl.name || '合同',
        body: body,
        seal: signed ? sealModel(task, party, tpl, body) : null
      };
    });
    var index = 0;
    if (activeId) {
      docs.forEach(function (doc, i) {
        if (doc.id === activeId) index = i;
      });
    }
    var status = (TASK_STATUS[displayStatus(task)] || {}).label || '';
    openContractDocs({
      eyebrow: '签署任务 · ' + task.id,
      meta: [sceneOf(task.scene).name, party ? party.name : '', status].filter(Boolean).join(' · '),
      docs: docs,
      index: index,
      task: task,
      party: party
    });
  }

  function senderOfBody(body) {
    var lines = String(body || '').split('\n');
    var i;
    var line;
    var matched;
    var name;
    var sealed = '';
    for (i = 0; i < lines.length; i++) {
      line = lines[i].trim();
      if (line.indexOf('甲方') !== 0) continue;
      matched = line.match(/：\s*(.*)$/);
      if (!matched) continue;
      name = matched[1].replace(/[_\s　]+$/g, '').trim();
      if (!name) continue;
      if (line.indexOf('盖章') >= 0) {
        if (!sealed) sealed = name;
        continue;
      }
      return name;
    }
    return sealed || ((String(body || '').match(/适用主体：([^\n]+)/) || [])[1] || '').trim();
  }

  function signerState(done, task) {
    if (done) return '已签署';
    var shown = displayStatus(task);
    if (shown === 'overdue') return '已逾期';
    if (shown === 'cancelled' || shown === 'terminated' || shown === 'voiding' || shown === 'voided') {
      return (TASK_STATUS[shown] || {}).label || '待签署';
    }
    if (task && task.status === 'wait_auth') return '待授权';
    return '待签署';
  }

  function detailLine(label, value, extra) {
    return '<div class="ct-side-line"><span>' + esc(label) + '</span><b>' + esc(value || '—') + (extra || '') + '</b></div>';
  }

  function signerCard(orderLabel, name, stateLabel, doneAt) {
    var done = stateLabel === '已签署';
    return '<section class="ct-side-sign">' +
      '<div class="ct-side-sign__top"><span>签署</span><span>' + esc(orderLabel) + '</span></div>' +
      '<div class="ct-side-sign__who"><span>' + esc(name || '—') + '</span>' +
      '<em class="' + (done ? 'is-done' : '') + '">' + esc(stateLabel) + '</em></div>' +
      detailLine('完成时间', doneAt || '—') +
      detailLine('IP属地', '上海') +
      '</section>';
  }

  function paintContractDetail(opts, doc) {
    var side = document.getElementById('ctDocSide');
    var box = document.getElementById('ctDocDetail');
    var dialog = document.querySelector('#ctDocMask .ct-doc');
    var task = opts && opts.task;
    if (!side || !box || !dialog) return;
    if (!task) {
      side.hidden = true;
      dialog.classList.remove('ct-doc--with-side');
      return;
    }
    var party = opts.party;
    var shown = displayStatus(task);
    var statusMeta = TASK_STATUS[shown] || { label: shown || '—', cls: 'ct-tag--muted' };
    var tpl = findTpl(doc && doc.id);
    var orderLabel = tpl && tpl.signInOrder ? '顺序签署' : '无序签署';
    var sender = senderOfBody(doc && doc.body) || (state.config && state.config.corpName) || '—';
    var taskNo = task.fadadaTaskId || task.id || '';
    var platformDone = task.status !== 'draft';
    var partyDone = !!(doc && doc.id && isTemplateSigned(task, doc.id));
    var partyDoneAt = partyDone ? ((task.templateSignedAt && task.templateSignedAt[doc.id]) || task.finishedAt || '') : '';
    var dotCls = shown === 'sign_completed' ? 'is-ok' : (shown === 'overdue' || shown === 'terminated' || shown === 'voided' ? 'is-bad' : (shown === 'sign_progress' || shown === 'voiding' ? 'is-info' : 'is-warn'));
    box.innerHTML =
      detailLine('主题', task.name || (doc && doc.name) || '—') +
      '<div class="ct-side-line"><span>状态</span><b><i class="ct-side-dot ' + dotCls + '"></i>' + esc(statusMeta.label) + '</b></div>' +
      detailLine('任务编号', taskNo, taskNo ? '<button type="button" class="ct-side-copy" data-ct-copy="' + esc(taskNo) + '">复制</button>' : '') +
      detailLine('发件人', sender) +
      detailLine('创建者', task.initiator || '—') +
      detailLine('发起时间', task.createdAt || '—') +
      detailLine('截止时间', deadlineText(task)) +
      detailLine('定稿方式', '自动定稿') +
      detailLine('IP属地', '上海') +
      signerCard(orderLabel, sender, signerState(platformDone, task), platformDone ? (task.createdAt || '') : '') +
      signerCard(orderLabel, party ? party.name : '—', signerState(partyDone, task), partyDoneAt);
    side.hidden = false;
    dialog.classList.add('ct-doc--with-side');
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

  /** 发起时未填签署截止，按发起时间顺延 7 天。 */
  function addDaysText(raw, days) {
    var matched = String(raw || '').match(/(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
    if (!matched) return '';
    var date = new Date(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]), Number(matched[4] || 0), Number(matched[5] || 0));
    date.setDate(date.getDate() + days);
    function p(n) { return String(n).padStart(2, '0'); }
    return date.getFullYear() + '-' + p(date.getMonth() + 1) + '-' + p(date.getDate()) + ' ' + p(date.getHours()) + ':' + p(date.getMinutes());
  }

  function normalizeDeadline(value) {
    var text = String(value || '').trim();
    if (!text) return '';
    var matched = text.match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
    return matched ? (matched[1] + '-' + matched[2] + '-' + matched[3] + ' ' + matched[4] + ':' + matched[5]) : text;
  }

  function deadlineText(task) {
    if (!task) return '—';
    return normalizeDeadline(task.deadline) || addDaysText(task.createdAt, 7) || '—';
  }

  function deadlinePassed(task) {
    var matched = deadlineText(task).match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
    if (!matched) return false;
    var at = new Date(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]), Number(matched[4]), Number(matched[5]));
    return at.getTime() < Date.now();
  }

  /** 列表和筛选用的状态。待授权、签署中超过截止时间后显示已逾期。 */
  function displayStatus(task) {
    if (!task) return '';
    var status = task.status === 'rejected' ? 'terminated' : (task.status || '');
    if ((status === 'wait_auth' || status === 'sign_progress' || status === 'draft') && deadlinePassed(task)) return 'overdue';
    if (status === 'draft') return 'wait_auth';
    return status;
  }

  function taskIsClosed(status) {
    return status === 'cancelled' || status === 'rejected' || status === 'terminated' || status === 'voided' || status === 'voiding' || status === 'draft';
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
      tb.innerHTML = '<tr><td colspan="9" class="ct-empty">没有符合条件的合同模板</td></tr>';
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
        '<td><button type="button" class="ct-link" data-act="detail">' + esc(t.name) + '</button></td>' +
        '<td>' + esc(sceneOf(t.scene).name) + '</td>' +
        '<td>' + esc(partnerTypeLabel(t)) + '</td>' +
        '<td>' + esc(t.remoteId) + '<div class="ct-field-tip" style="margin:2px 0 0">' + esc(t.remoteName) + '</div></td>' +
        '<td>' + esc(actors) + '</td>' +
        '<td>' + st + '</td>' +
        '<td>' + esc(t.updatedAt) + '</td>' +
        '<td class="erp-actions-cell"><span class="ct-ops">' +
        '<button type="button" class="ct-link" data-act="detail">详情</button>' +
        '<button type="button" class="ct-link" data-act="copy-html">复制链接</button>' +
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
        if (btn.getAttribute('data-act') === 'detail') {
          go('basic_settings_contract_template_form.html', 'id=' + encodeURIComponent(id) + '&view=1');
          return;
        }
        if (btn.getAttribute('data-act') === 'copy-html') {
          copyText(htmlTplUrl(tpl.id)).then(function () {
            toast('合同正文链接已复制，可转发给门店或供应商查阅', 'success');
          });
          return;
        }
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
    var viewMode = qs('view') === '1' && !!id;
    var tpl = id ? findTpl(id) : null;
    if (viewMode && !tpl) viewMode = false;
    var title = document.getElementById('ctFormTitle');
    if (title) title.textContent = viewMode ? '合同模板绑定详情' : (tpl ? '编辑合同模板' : '新增合同模板绑定');
    if (viewMode) document.title = '冷丰WMS - 合同模板绑定详情';
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
    writePartnerTypes(tpl ? partnerTypesOf(tpl) : STORE_PARTNER_TYPES.slice());
    function syncPartnerTypeRow(sceneId) {
      var row = document.getElementById('ctPartnerTypeRow');
      if (row) row.style.display = sceneId === 'store' ? '' : 'none';
    }
    syncPartnerTypeRow(tpl ? tpl.scene : 'store');
    document.getElementById('ctTplScene').addEventListener('change', function () {
      var sceneId = this.value;
      syncPartnerTypeRow(sceneId);
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
    if (viewMode) {
      document.querySelectorAll('#ctTplScene, #ctTplName, #ctRemoteTpl, #ctTplOn, #ctTplOff, #ctAutoStart, #ctSignOrder').forEach(function (el) {
        el.disabled = true;
      });
      document.querySelectorAll('#ctStorePartnerType input, #ctActorBody input, #ctActorBody select, #ctFillList input').forEach(function (el) {
        el.disabled = true;
      });
      var addActor = document.getElementById('ctAddActor');
      if (addActor) addActor.style.display = 'none';
      document.querySelectorAll('[data-act="del-actor"]').forEach(function (btn) { btn.style.display = 'none'; });
      var remoteSel = document.getElementById('ctRemoteTpl');
      var remote = REMOTE_TEMPLATES.filter(function (r) { return r.id === (tpl.remoteId || remoteSel.value); })[0];
      var link = document.createElement('button');
      link.type = 'button';
      link.className = 'ct-link';
      link.id = 'ctRemoteTplLink';
      link.style.fontSize = '14px';
      link.style.lineHeight = '36px';
      link.textContent = remote ? (remote.name + '（' + remote.id + '）') : (tpl.remoteName || tpl.name);
      remoteSel.style.display = 'none';
      remoteSel.parentNode.insertBefore(link, remoteSel);
      var tip = document.getElementById('ctRemoteTplTip');
      if (tip) tip.style.display = 'none';
      link.addEventListener('click', function () {
        openTemplateContract({
          id: tpl.id,
          name: remote ? remote.name : (tpl.remoteName || tpl.name),
          remoteId: tpl.remoteId,
          remoteName: remote ? remote.name : tpl.remoteName,
          scene: tpl.scene,
          storePartnerTypes: partnerTypesOf(tpl)
        });
      });
      var copyLink = document.createElement('button');
      copyLink.type = 'button';
      copyLink.className = 'ct-link';
      copyLink.id = 'ctRemoteTplCopy';
      copyLink.style.marginLeft = '12px';
      copyLink.style.fontSize = '14px';
      copyLink.style.lineHeight = '36px';
      copyLink.textContent = '复制链接';
      remoteSel.parentNode.insertBefore(copyLink, remoteSel);
      copyLink.addEventListener('click', function () {
        copyText(htmlTplUrl(tpl.id)).then(function () {
          toast('合同正文链接已复制，可转发给对方查阅', 'success');
        });
      });
      var saveBtn = document.getElementById('ctTplSave');
      if (saveBtn) {
        saveBtn.textContent = '编辑';
        saveBtn.addEventListener('click', function (e) {
          e.stopImmediatePropagation();
          go('basic_settings_contract_template_form.html', 'id=' + encodeURIComponent(id));
        }, true);
      }
      var cancelBtn = document.getElementById('ctTplCancel');
      if (cancelBtn) cancelBtn.textContent = '返回';
    }
    document.getElementById('ctTplCancel').addEventListener('click', function () {
      go('basic_settings_contract_template.html');
    });
    document.getElementById('ctTplSave').addEventListener('click', function () {
      if (viewMode) return;
      var name = String(document.getElementById('ctTplName').value || '').trim();
      var scene = document.getElementById('ctTplScene').value;
      var remoteId = document.getElementById('ctRemoteTpl').value;
      if (!name) return toast('请填写模板名称', 'error');
      if (!remoteId) return toast('请选择法大大签署模板', 'error');
      var storePartnerTypes = scene === 'store' ? readPartnerTypes() : [];
      if (scene === 'store' && !storePartnerTypes.length) return toast('请选择适用合作类型', 'error');
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
        storePartnerTypes: storePartnerTypes,
        storePartnerType: storePartnerTypes[0] || '',
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
        var person = sceneOf(p.type).partyKind === 'person';
        p.fadadaId = p.fadadaId || ((person ? 'U-' : 'C-') + p.id);
        saveStore(state);
        toast(person ? '已完成个人授权（演示 getUserAuthUrl）' : '已完成企业授权（演示 getCorpAuthUrl）', 'success');
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
      if (tab && displayStatus(t) !== tab) return false;
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
    closeTaskQr();
    if (!rows.length) {
      tb.innerHTML = '<tr><td colspan="10" class="ct-empty">没有符合条件的签署任务</td></tr>';
      refreshRowNo();
      return;
    }
    tb.innerHTML = rows.map(function (t) {
      var party = findParty(t.partyId);
      var ops = [
        '<button type="button" class="ct-link" data-act="read">查看合同</button>',
        '<button type="button" class="ct-link" data-act="view">任务详情</button>'
      ];
      if (t.status === 'wait_auth') ops.push('<button type="button" class="ct-link" data-act="auth">去授权</button>');
      if (t.status === 'sign_progress') ops.push('<button type="button" class="ct-link" data-act="urge">催签</button>');
      if (!taskIsClosed(t.status) || t.status === 'sign_completed') {
        ops.push('<button type="button" class="ct-link" data-act="copy">复制链接</button>');
        ops.push('<button type="button" class="ct-link" data-act="qr">二维码</button>');
      }
      if (t.status === 'sign_completed') ops.push('<button type="button" class="ct-link" data-act="download">下载</button>');
      if (t.status === 'wait_auth' || t.status === 'sign_progress' || t.status === 'draft') {
        ops.push('<button type="button" class="ct-link is-danger" data-act="cancel">撤销</button>');
      }
      if (t.status === 'cancelled' || t.status === 'terminated' || t.status === 'rejected' || t.status === 'voided') {
        ops.push('<button type="button" class="ct-link" data-act="retry">重新发起</button>');
      }
      return '<tr data-id="' + esc(t.id) + '">' +
        '<td><button type="button" class="ct-link" data-act="view">' + esc(t.id) + '</button></td>' +
        '<td><button type="button" class="ct-link" data-act="read">' + esc(t.name) + '</button></td>' +
        '<td>' + esc(sceneOf(t.scene).name) + '</td>' +
        '<td>' + esc(party ? party.name : '—') + '</td>' +
        '<td>' + tagHtml(TASK_STATUS, displayStatus(t)) + '</td>' +
        '<td>' + esc(t.initiator) + '</td>' +
        '<td>' + esc(t.createdAt) + '</td>' +
        '<td>' + esc(deadlineText(t)) + '</td>' +
        '<td>' + esc(t.finishedAt || '—') + '</td>' +
        '<td class="erp-actions-cell"><span class="ct-ops">' + ops.join('') + '</span></td></tr>';
    }).join('');
    refreshRowNo();
  }

  function updateTaskTabs() {
    document.querySelectorAll('.ct-tabs__item[data-status]').forEach(function (btn) {
      var st = btn.getAttribute('data-status');
      var count = st ? state.tasks.filter(function (t) { return displayStatus(t) === st; }).length : state.tasks.length;
      var label = btn.getAttribute('data-label');
      btn.textContent = label + ' ' + count;
    });
  }

  function closeTaskQr() {
    var pop = document.getElementById('ctQrPop');
    if (pop) pop.remove();
  }

  function copyTaskLink(task) {
    var url = fadadaSignUrl(task);
    task.signUrl = url;
    saveStore(state);
    copyText(url).then(function () {
      toast('法大大签署链接已复制，可转发给对方', 'success');
    });
  }

  function downloadTaskQr(task) {
    var canvas = document.querySelector('#ctQrMount canvas');
    if (!canvas) {
      toast('二维码还没生成', 'error');
      return;
    }
    var link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = '签署链接-' + task.id + '.png';
    link.addEventListener('click', function (e) { e.stopPropagation(); });
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast('二维码已开始下载', 'success');
  }

  function placeTaskQr(pop, anchor, allowScroll) {
    if (!pop || !anchor || !anchor.isConnected) {
      closeTaskQr();
      return;
    }
    var rect = anchor.getBoundingClientRect();
    var width = pop.offsetWidth || 248;
    var height = pop.offsetHeight || 300;
    if (allowScroll && (rect.bottom + height + 12 > global.innerHeight || rect.top < 0 || rect.right > global.innerWidth - 8)) {
      anchor.scrollIntoView({ block: 'center', inline: 'nearest' });
      rect = anchor.getBoundingClientRect();
    }
    var left = rect.left + rect.width / 2 - width / 2;
    var top = rect.bottom + 6;
    var maxLeft = Math.max(8, global.innerWidth - width - 8);
    if (left > maxLeft) left = maxLeft;
    if (left < 8) left = 8;
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
    var caret = pop.querySelector('.ct-qr-pop__caret');
    if (caret) {
      var caretLeft = rect.left + rect.width / 2 - left - 7;
      caret.style.left = Math.max(18, Math.min(width - 30, caretLeft)) + 'px';
      caret.style.marginLeft = '0';
    }
  }

  function openTaskQr(anchor, task) {
    var existing = document.getElementById('ctQrPop');
    if (existing && existing.getAttribute('data-task') === task.id) {
      closeTaskQr();
      return;
    }
    closeTaskQr();
    if (!global.QRCode) {
      toast('二维码组件未加载', 'error');
      return;
    }
    var url = fadadaSignUrl(task);
    task.signUrl = url;
    saveStore(state);
    var pop = document.createElement('div');
    pop.id = 'ctQrPop';
    pop.className = 'ct-qr-pop';
    pop.setAttribute('data-task', task.id);
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', '签署二维码');
    pop.innerHTML =
      '<div class="ct-qr-pop__body">' +
      '<i class="ct-qr-pop__caret"></i>' +
      '<div class="ct-qr-pop__card"><div id="ctQrMount"></div></div></div>';
    pop._qrAnchor = anchor;
    document.body.appendChild(pop);
    var mount = document.getElementById('ctQrMount');
    new global.QRCode(mount, {
      text: url,
      width: 220,
      height: 220,
      colorDark: '#111111',
      colorLight: '#ffffff',
      correctLevel: global.QRCode.CorrectLevel.M
    });
    mount.removeAttribute('title');
    placeTaskQr(pop, anchor, true);
    pop.addEventListener('click', function (e) {
      if (e.target.closest('#ctQrMount')) downloadTaskQr(task);
    });
  }

  function handleTaskAct(act, task, btn) {
    if (!task) return;
    if (act === 'view') {
      go('basic_settings_contract_task_detail.html', 'id=' + encodeURIComponent(task.id));
      return;
    }
    if (act === 'read') {
      openTaskContract(task, '');
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
      copyTaskLink(task);
      return;
    }
    if (act === 'qr') {
      openTaskQr(btn, task);
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
      handleTaskAct(btn.getAttribute('data-act'), findTask(btn.closest('tr').getAttribute('data-id')), btn);
    });
    if (!document.body.getAttribute('data-ct-qr-bound')) {
      document.body.setAttribute('data-ct-qr-bound', '1');
      document.addEventListener('click', function (e) {
        var pop = document.getElementById('ctQrPop');
        if (!pop) return;
        if (pop.contains(e.target)) return;
        if (e.target.closest && e.target.closest('[data-act="qr"]')) return;
        closeTaskQr();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeTaskQr();
      });
      document.addEventListener('scroll', function () {
        var pop = document.getElementById('ctQrPop');
        if (pop && pop._qrAnchor) placeTaskQr(pop, pop._qrAnchor);
      }, true);
      global.addEventListener('resize', closeTaskQr);
    }
  }

  function taskTemplateIds(task) {
    if (!task) return [];
    if (Array.isArray(task.templateIds) && task.templateIds.length) return task.templateIds.slice();
    return task.templateId ? [task.templateId] : [];
  }

  function taskTemplates(task) {
    return taskTemplateIds(task).map(findTpl).filter(Boolean);
  }

  function templatesForSign(sceneId, partnerType) {
    return state.templates.filter(function (t) {
      if (t.scene !== sceneId || t.status !== 'on') return false;
      if (sceneId !== 'store') return true;
      return partnerTypesOf(t).indexOf(partnerType || '加盟店') >= 0;
    });
  }

  function readTaskTemplateIds() {
    return Array.prototype.map.call(document.querySelectorAll('#ctTaskTpl input:checked'), function (el) {
      return el.value;
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

  function fillTplOptions(sceneId, selectedIds) {
    var box = document.getElementById('ctTaskTpl');
    if (!box) return;
    var partnerType = sceneId === 'store' ? ((document.getElementById('ctTaskPartner') || {}).value || '加盟店') : '';
    var list = templatesForSign(sceneId, partnerType);
    var selected = selectedIds && selectedIds.length ? selectedIds : list.map(function (t) { return t.id; });
    if (!list.length) {
      box.innerHTML = '<span class="ct-field-tip">该场景暂无启用协议</span>';
      return;
    }
    box.innerHTML = list.map(function (t) {
      var checked = selected.indexOf(t.id) >= 0 ? ' checked' : '';
      return '<label class="pts-rule-check-label"><input type="checkbox" value="' + esc(t.id) + '"' + checked + '> ' + esc(t.name) + '</label>';
    }).join('');
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
      box.innerHTML = '当前主体尚未完成授权，提交时会先引导对方完成' + (sceneOf(party.type).partyKind === 'person' ? '个人' : '企业') + '授权，任务进入「待对方授权」。也可先到「签署主体」发起授权。';
    }
  }

  function syncTaskName() {
    var party = findParty(document.getElementById('ctTaskParty').value);
    var names = readTaskTemplateIds().map(findTpl).filter(Boolean).map(function (t) { return t.name; });
    var input = document.getElementById('ctTaskName');
    if (!input || !party || !names.length) return;
    input.value = party.name + ' · ' + names.join('、');
  }

  function initTaskForm() {
    var retryId = qs('retry');
    var retry = retryId ? findTask(retryId) : null;
    fillSelect(document.getElementById('ctTaskScene'), SCENES.map(function (s) {
      return { value: s.id, label: s.name };
    }), retry ? retry.scene : 'store');
    var partnerSel = document.getElementById('ctTaskPartner');
    if (partnerSel) partnerSel.value = retry && retry.storePartnerType ? retry.storePartnerType : '加盟店';
    function syncPartnerRow(sceneId) {
      var row = document.getElementById('ctTaskPartnerRow');
      if (row) row.style.display = sceneId === 'store' ? '' : 'none';
    }
    function refreshByScene(selectedIds) {
      var sceneId = document.getElementById('ctTaskScene').value;
      syncPartnerRow(sceneId);
      fillTplOptions(sceneId, selectedIds);
      fillPartyOptions(sceneId, retry && retry.scene === sceneId ? retry.partyId : '');
      updatePartyHint();
      syncTaskName();
    }
    refreshByScene(retry ? taskTemplateIds(retry) : null);
    if (retry) {
      document.getElementById('ctTaskName').value = retry.name.replace(/（重新发起）$/, '') + '（重新发起）';
    }
    document.getElementById('ctTaskScene').addEventListener('change', function () {
      retry = null;
      document.getElementById('ctTaskName').value = '';
      refreshByScene(null);
    });
    if (partnerSel) {
      partnerSel.addEventListener('change', function () {
        fillTplOptions(document.getElementById('ctTaskScene').value, null);
        syncTaskName();
      });
    }
    document.getElementById('ctTaskTpl').addEventListener('change', syncTaskName);
    document.getElementById('ctTaskParty').addEventListener('change', function () {
      var party = findParty(this.value);
      if (party && party.partnerDivision && partnerSel && document.getElementById('ctTaskScene').value === 'store') {
        partnerSel.value = party.partnerDivision;
        fillTplOptions('store', null);
      }
      updatePartyHint();
      syncTaskName();
    });
    document.getElementById('ctTaskCancel').addEventListener('click', function () {
      go('basic_settings_contract_task.html');
    });
    document.getElementById('ctTaskSave').addEventListener('click', function () {
      var scene = document.getElementById('ctTaskScene').value;
      var templateIds = readTaskTemplateIds();
      var partyId = document.getElementById('ctTaskParty').value;
      var name = String(document.getElementById('ctTaskName').value || '').trim();
      if (!templateIds.length) return toast('请至少勾选一份协议', 'error');
      if (!partyId) return toast('请选择签署相对方', 'error');
      if (!name) return toast('请填写合同名称', 'error');
      var party = findParty(partyId);
      var status = party && party.authStatus === 'done' ? 'sign_progress' : 'wait_auth';
      var fadadaTaskId = status === 'sign_progress' ? 'ST-' + Date.now().toString().slice(-6) : '';
      var createdAt = nowText();
      var createdTask = {
        id: nextTaskId(),
        name: name,
        scene: scene,
        templateId: templateIds[0],
        templateIds: templateIds,
        agreementNames: templateIds.map(function (tid) {
          var item = findTpl(tid);
          return item ? item.name : tid;
        }).join('、'),
        storePartnerType: scene === 'store' && partnerSel ? partnerSel.value : '',
        partyId: partyId,
        status: status,
        initiator: '当前用户',
        createdAt: createdAt,
        deadline: normalizeDeadline(document.getElementById('ctTaskDeadline').value) || addDaysText(createdAt, 7),
        finishedAt: '',
        fadadaTaskId: fadadaTaskId,
        signUrl: '',
        sms: document.getElementById('ctTaskSms').checked
      };
      createdTask.signUrl = fadadaSignUrl(createdTask);
      state.tasks.unshift(createdTask);
      saveStore(state);
      if (status === 'wait_auth') toast('已创建 ' + templateIds.length + ' 份协议，等待相对方完成授权后再签署', 'success');
      else toast('已发起 ' + templateIds.length + ' 份协议（演示）', 'success');
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
    var tpls = taskTemplates(task);
    var tpl = tpls[0] || findTpl(task.templateId);
    var set = function (id, html) {
      var el = document.getElementById(id);
      if (el) el.innerHTML = html;
    };
    set('ctDetailTitle', esc(task.name));
    set('ctDetailStatus', tagHtml(TASK_STATUS, displayStatus(task)));
    set('ctKvId', esc(task.id));
    set('ctKvFdd', esc(task.fadadaTaskId || '尚未同步'));
    set('ctKvScene', esc(sceneOf(task.scene).name));
    set('ctKvTpl', esc(tpls.length ? tpls.map(function (item) { return item.name; }).join('、') : '—'));
    set('ctKvParty', esc(party ? party.name : '—'));
    set('ctKvInitiator', esc(task.initiator));
    set('ctKvCreated', esc(task.createdAt));
    set('ctKvDeadline', esc(deadlineText(task)));
    set('ctKvFinished', esc(task.finishedAt || '—'));
    var actors = (tpl && tpl.actors) ? tpl.actors : defaultActors(task.scene);
    var actorHtml = actors.map(function (a, i) {
      var isPlatform = i === 0;
      var shown = displayStatus(task);
      var st;
      if (shown === 'sign_completed') st = tagHtml(TASK_STATUS, 'sign_completed');
      else if (!isPlatform && (shown === 'cancelled' || shown === 'terminated' || shown === 'voided' || shown === 'voiding' || shown === 'overdue' || shown === 'wait_auth')) st = tagHtml(TASK_STATUS, shown);
      else if (isPlatform && shown !== 'wait_auth') st = '<span class="ct-tag ct-tag--ok">已自动签署</span>';
      else if (shown === 'wait_auth') st = tagHtml(TASK_STATUS, 'wait_auth');
      else st = tagHtml(TASK_STATUS, 'sign_progress');
      var who = isPlatform ? state.config.corpName : (party ? party.name : a.role);
      return '<tr><td>' + esc(a.role) + '</td><td>' + esc(who) + '</td><td>' + (a.actorType === 'person' ? '个人' : '企业') + '</td><td>' + (a.signMode === 'auto' ? '自动签' : '手动签') + '</td><td>' + st + '</td></tr>';
    }).join('');
    set('ctActorDetailBody', actorHtml);
    var files = (tpls.length ? tpls : [{ name: '合同' }]).map(function (item) {
      return { name: item.name, fileName: item.name + '.pdf', kind: '签署文件', tplId: item.id || '' };
    });
    files.push({ name: '签署完成报告', fileName: '签署完成报告.pdf', kind: '出证文件', onlyDone: true, tplId: '' });
    set('ctFileList', files.filter(function (f) {
      return !f.onlyDone || task.status === 'sign_completed';
    }).map(function (f) {
      var canDl = task.status === 'sign_completed';
      var readBtn = f.tplId
        ? '<button type="button" class="ct-link" data-act="read" data-tpl="' + esc(f.tplId) + '">查看合同</button>'
        : '';
      return '<div class="ct-file-row"><div>' + esc(f.fileName) + '<div class="ct-field-tip">' + esc(f.kind) + '</div></div>' +
        '<span class="ct-ops">' + readBtn +
        (canDl ? '<button type="button" class="ct-link" data-act="download">下载</button>' : '<span class="ct-tag ct-tag--muted">签署完成后可下载</span>') +
        '</span></div>';
    }).join(''));
    var logs = [
      { t: task.createdAt, d: '创建签署任务' + (task.fadadaTaskId ? '，法大大任务号 ' + task.fadadaTaskId : '') }
    ];
    if (task.status !== 'draft') logs.push({ t: task.createdAt, d: party && party.authStatus === 'done' ? '相对方已授权，任务进入签署' : '等待相对方授权' });
    if (task.status === 'sign_progress' || task.status === 'sign_completed') logs.push({ t: task.createdAt, d: '平台方已自动盖章' });
    if (task.status === 'sign_completed') logs.push({ t: task.finishedAt, d: '全部签署完成，已回写业务状态（回调 sign_completed）' });
    if (task.status === 'terminated' || task.status === 'rejected') logs.push({ t: task.finishedAt, d: '任务已终止（回调 task_terminated）' });
    if (task.status === 'cancelled') logs.push({ t: task.finishedAt, d: '发起方撤销任务' });
    if (task.status === 'voiding') logs.push({ t: task.createdAt, d: '已发起作废，等待确认' });
    if (task.status === 'voided') logs.push({ t: task.finishedAt, d: '合同已作废' });
    if (displayStatus(task) === 'overdue') logs.push({ t: deadlineText(task), d: '已过签署截止时间，任务逾期' });
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
        var read = e.target.closest('[data-act="read"]');
        if (read) {
          openTaskContract(task, read.getAttribute('data-tpl') || '');
          return;
        }
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
    if (copy) copy.style.display = taskIsClosed(task.status) && task.status !== 'sign_completed' ? 'none' : '';
    if (dl) dl.style.display = task.status === 'sign_completed' ? '' : 'none';
    if (cancel) cancel.style.display = (task.status === 'sign_progress' || task.status === 'wait_auth' || task.status === 'draft') ? '' : 'none';
  }

  function htmlPageUrl(query) {
    return global.location.origin + '/SCM/contract_sign.html?' + query;
  }

  /** 对方打开的签署页是法大大任务页，不是本系统的签署交互页。 */
  function fadadaSignUrl(task) {
    if (!task) return '';
    if (!task.fadadaTaskId) {
      var digits = String(task.id || '').replace(/\D/g, '');
      task.fadadaTaskId = 'ST-' + (digits.slice(-6) || String(Date.now()).slice(-6));
    }
    return 'https://uat-sign.fadada.com/task/' + encodeURIComponent(task.fadadaTaskId);
  }

  function htmlSignUrl(task, tplId) {
    var query = 'task=' + encodeURIComponent(task && task.id ? task.id : '');
    if (tplId) query += '&tpl=' + encodeURIComponent(tplId);
    return htmlPageUrl(query);
  }

  function htmlTplUrl(tplId) {
    return htmlPageUrl('tpl=' + encodeURIComponent(tplId || ''));
  }

  function copyText(text) {
    return new Promise(function (resolve) {
      function finish() { resolve(text); }
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', 'readonly');
        ta.style.position = 'fixed';
        ta.style.top = '0';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try { document.execCommand('copy'); } catch (err) {}
        ta.remove();
        finish();
      }
      if (global.navigator.clipboard && global.navigator.clipboard.writeText) {
        global.navigator.clipboard.writeText(text).then(finish, fallback);
      } else fallback();
    });
  }

  function nextPartyId() {
    var n = state.parties.reduce(function (max, p) {
      var m = String(p.id || '').match(/(\d+)$/);
      return m ? Math.max(max, Number(m[1])) : max;
    }, 0);
    return 'P' + String(n + 1).padStart(3, '0');
  }

  function upsertParty(spec) {
    var name = String(spec.name || '').trim();
    var found = state.parties.filter(function (p) {
      return p.type === spec.type && p.name === name;
    })[0];
    if (found) {
      if (spec.partnerDivision) found.partnerDivision = spec.partnerDivision;
      if (spec.identNo) found.identNo = spec.identNo;
      if (spec.contact) found.contact = spec.contact;
      if (spec.address) found.address = spec.address;
      if (spec.authStatus === 'done' && found.authStatus !== 'done') {
        found.authStatus = 'done';
        found.authAt = nowText();
      }
      return found;
    }
    var party = {
      id: nextPartyId(),
      type: spec.type,
      name: name,
      partnerDivision: spec.partnerDivision || '',
      identNo: spec.identNo || '',
      contact: spec.contact || '',
      address: spec.address || '',
      identStatus: 'done',
      authStatus: spec.authStatus || 'done',
      fadadaId: '',
      authAt: nowText()
    };
    state.parties.unshift(party);
    return party;
  }

  /* 入驻审核通过、用户注册勾选：按场景带出已启用协议，生成一条签署任务。 */
  function generateCoopTask(opts) {
    opts = opts || {};
    var scene = opts.scene;
    var partyName = String(opts.name || '').trim();
    if (!scene || !partyName) return null;
    var bizRef = opts.bizRef || '';
    if (bizRef) {
      var existing = state.tasks.filter(function (t) {
        return t.bizRef === bizRef && !taskIsClosed(t.status);
      })[0];
      if (existing) {
        if (!existing.agreementNames) {
          existing.agreementNames = taskTemplates(existing).map(function (t) { return t.name; }).join('、');
        }
        var keptUrl = fadadaSignUrl(existing);
        if (existing.signUrl !== keptUrl) {
          existing.signUrl = keptUrl;
          saveStore(state);
        }
        return existing;
      }
    }
    var partnerType = scene === 'store' ? (opts.partnerType || '加盟店') : '';
    var tpls = templatesForSign(scene, partnerType);
    if (!tpls.length) return null;
    var party = upsertParty({
      type: scene,
      name: partyName,
      partnerDivision: partnerType,
      identNo: opts.identNo || '',
      contact: opts.contact || opts.phone || '',
      address: opts.address || '',
      authStatus: 'done'
    });
    var names = tpls.map(function (t) { return t.name; });
    var status = opts.status || 'sign_progress';
    var createdAt = nowText();
    var task = {
      id: nextTaskId(),
      name: party.name + ' · ' + names.join('、'),
      scene: scene,
      templateId: tpls[0].id,
      templateIds: tpls.map(function (t) { return t.id; }),
      agreementNames: names.join('、'),
      storePartnerType: partnerType,
      partyId: party.id,
      status: status,
      initiator: opts.initiator || '系统',
      createdAt: createdAt,
      deadline: addDaysText(createdAt, 7),
      finishedAt: status === 'sign_completed' ? createdAt : '',
      fadadaTaskId: 'ST-' + Date.now().toString().slice(-6),
      signUrl: '',
      bizRef: bizRef,
      sms: true
    };
    task.signUrl = fadadaSignUrl(task);
    state.tasks.unshift(task);
    saveStore(state);
    return task;
  }

  function signUserByRegister(phone, displayName) {
    var mobile = String(phone || '').trim();
    if (!mobile) return null;
    return generateCoopTask({
      scene: 'user',
      bizRef: 'user-reg:' + mobile,
      name: displayName || mobile,
      phone: mobile,
      contact: mobile,
      identNo: mobile,
      initiator: '用户注册',
      status: 'sign_completed'
    });
  }

  function listStoreTasks(storeName) {
    var name = String(storeName || '').trim();
    return state.tasks.filter(function (t) {
      if (t.scene !== 'store') return false;
      if (taskIsClosed(t.status)) return false;
      if (!name) return true;
      var party = findParty(t.partyId);
      return !!(party && party.name === name);
    });
  }

  function templatesOfScene(sceneId) {
    return state.templates.filter(function (t) {
      return t.scene === sceneId && t.status === 'on';
    });
  }

  function syncSignedBiz(task) {
    if (!task || task.status !== 'sign_completed' || !task.bizRef) return;
    if (task.bizRef.indexOf('bd-store:') !== 0) return;
    try {
      var raw = sessionStorage.getItem('lf_bd_stores_v1');
      if (!raw) return;
      var list = JSON.parse(raw);
      if (!Array.isArray(list)) return;
      var id = task.bizRef.slice('bd-store:'.length);
      list.forEach(function (item) {
        if (!item || String(item.id) !== String(id)) return;
        item.companyAgreementStatus = '已签署';
        item.companyAgreementSignUrl = task.signUrl;
        item.companyAgreementTaskId = task.id;
      });
      sessionStorage.setItem('lf_bd_stores_v1', JSON.stringify(list));
    } catch (err) {}
  }

  function signedTemplateIdsOf(task) {
    var ids = taskTemplateIds(task);
    if (!task) return [];
    if (task.status === 'sign_completed' && !(Array.isArray(task.signedTemplateIds) && task.signedTemplateIds.length)) {
      return ids;
    }
    var signed = Array.isArray(task.signedTemplateIds) ? task.signedTemplateIds : [];
    return signed.filter(function (id) { return ids.indexOf(id) >= 0; });
  }

  function isTemplateSigned(task, tplId) {
    return !!(task && tplId && signedTemplateIdsOf(task).indexOf(tplId) >= 0);
  }

  /** 已签 1/2；全部签完才是已签署。用户注册勾选写入的整单完成，两份都算已签。 */
  function signProgressLabel(task) {
    if (!task) return '待签署';
    var ids = taskTemplateIds(task);
    var signed = signedTemplateIdsOf(task);
    if (!ids.length) return task.status === 'sign_completed' ? '已签署' : '待签署';
    if (signed.length >= ids.length) return '已签署';
    if (!signed.length) return '待签署';
    return '已签 ' + signed.length + '/' + ids.length;
  }

  function markTemplateSigned(taskId, tplId) {
    var task = findTask(taskId);
    if (!task || !tplId) return null;
    if (taskIsClosed(task.status)) return task;
    var ids = taskTemplateIds(task);
    if (ids.indexOf(tplId) < 0) return task;
    if (isTemplateSigned(task, tplId)) return task;
    var signed = signedTemplateIdsOf(task).slice();
    signed.push(tplId);
    task.signedTemplateIds = signed;
    task.templateSignedAt = task.templateSignedAt || {};
    task.templateSignedAt[tplId] = nowText();
    if (ids.every(function (id) { return signed.indexOf(id) >= 0; })) {
      task.status = 'sign_completed';
      task.finishedAt = nowText();
      var party = findParty(task.partyId);
      if (party && party.authStatus !== 'done') {
        party.authStatus = 'done';
        party.authAt = task.finishedAt;
      }
      syncSignedBiz(task);
    }
    saveStore(state);
    return task;
  }

  function markTaskSigned(taskId, tplId) {
    if (tplId) return markTemplateSigned(taskId, tplId);
    var task = findTask(taskId);
    if (!task) return null;
    var pendingId = '';
    taskTemplateIds(task).forEach(function (id) {
      if (!pendingId && !isTemplateSigned(task, id)) pendingId = id;
    });
    if (!pendingId) return task;
    return markTemplateSigned(taskId, pendingId);
  }

  global.LfContract = {
    htmlSignUrl: htmlSignUrl,
    fadadaSignUrl: fadadaSignUrl,
    htmlTplUrl: htmlTplUrl,
    htmlSceneUrl: function (sceneId) { return htmlPageUrl('scene=' + encodeURIComponent(sceneId || '')); },
    copyText: copyText,
    generateCoopTask: generateCoopTask,
    signUserByRegister: signUserByRegister,
    listStoreTasks: listStoreTasks,
    templatesOfScene: templatesOfScene,
    markTaskSigned: markTaskSigned,
    markTemplateSigned: markTemplateSigned,
    isTemplateSigned: isTemplateSigned,
    signProgressLabel: signProgressLabel,
    findTask: findTask,
    findParty: findParty,
    findTpl: findTpl,
    taskTemplates: taskTemplates,
    contractBodyOf: contractBodyOf,
    fillContractParty: fillContractParty
  };

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
