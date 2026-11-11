/**
 * 基础设置 · 合同管理（法大大电子签原型）
 * 演示数据写入 localStorage，刷新后仍可验收。
 */
(function (global) {
  'use strict';

  var STORE_KEY = 'lf_contract_proto_v1';
  var wp = global.wmsPath || { page: function (f) { return f; } };

  var STORE_PARTNER_TYPES = ['加盟店', '联营店', '直营店'];

  var CATALOG_VERSION = 'fdd-20261109-one-tpl';

  var SCENES = [
    { id: 'store', name: '门店合作', partyType: '门店', partyKind: 'corp', partyHint: '企业/个体户', fill: ['门店名称', '统一社会信用代码', '经营负责人', '门店地址', '联系电话'] },
    { id: 'supplier', name: '供应商合作', partyType: '供应商', partyKind: 'corp', partyHint: '企业/个体户', fill: ['供应商名称', '统一社会信用代码', '法定代表人', '注册地址', '联系电话'] }
  ];

  var FILL_CODES = {
    '门店名称': 'store_name',
    '统一社会信用代码': 'credit_code',
    '经营负责人': 'manager_name',
    '门店地址': 'store_address',
    '联系电话': 'mobile',
    '供应商名称': 'supplier_name',
    '法定代表人': 'legal_person',
    '注册地址': 'reg_address',
    '结款方式': 'pay_method',
    '结算策略': 'settle_strategy',
    '结算起算节点': 'settle_trigger',
    '结算周期': 'settle_cycle'
  };

  var SEALS = [
    { id: 'SEAL-LF-001', name: '冷丰合同专用章' },
    { id: 'SEAL-LF-002', name: '冷丰财务专用章' }
  ];

  function corpActors(partyRole) {
    return [
      { actorId: '甲方', role: '平台方', actorType: 'corp', signMode: 'auto', keyword: '甲方签署' },
      { actorId: '乙方', role: partyRole, actorType: 'corp', signMode: 'manual', keyword: '乙方签署' }
    ];
  }

  /** 法大大一份签署任务模板。多份合同是这份模板里的文档，不能把多个模板合成一条任务。 */
  var REMOTE_TEMPLATES = [
    {
      id: 'STPL-ST-JOIN', name: '冷丰加盟门店合作签署模板', scene: 'store', launch: 'auto', signInOrder: true,
      partnerTypes: ['加盟店'], actors: corpActors('门店'),
      fill: ['门店名称', '统一社会信用代码', '经营负责人', '门店地址', '联系电话'],
      docs: [
        { id: 'DOC-ST-BRAND', name: '冷丰品牌合作合同', bodyId: 'TPL001' },
        { id: 'DOC-ST-CLEAR', name: '冷丰加盟门店资金清分结算合同', bodyId: 'TPL002' }
      ]
    },
    {
      id: 'STPL-ST-BRAND', name: '冷丰门店品牌合作签署模板', scene: 'store', launch: 'auto', signInOrder: true,
      partnerTypes: ['联营店', '直营店'], actors: corpActors('门店'),
      fill: ['门店名称', '统一社会信用代码', '经营负责人', '门店地址', '联系电话'],
      docs: [
        { id: 'DOC-ST-BRAND', name: '冷丰品牌合作合同', bodyId: 'TPL001' }
      ]
    },
    {
      id: 'STPL-SUP-IN', name: '冷丰平台供应商入驻签署模板', scene: 'supplier', launch: 'auto', signInOrder: true,
      actors: corpActors('供应商'),
      fill: ['供应商名称', '统一社会信用代码', '法定代表人', '注册地址', '联系电话'],
      docs: [
        { id: 'DOC-SUP-IN', name: '冷丰平台供应商入驻合作协议', bodyId: 'TPL003' },
        { id: 'DOC-SUP-CLEAR', name: '冷丰平台供应商资金清分结算合同', bodyId: 'TPL004' }
      ]
    },
    {
      id: 'STPL-SUP-MAN', name: '冷丰平台供应商补充合作确认书', scene: 'supplier', launch: 'manual', signInOrder: false,
      actors: corpActors('供应商'),
      fill: ['供应商名称', '统一社会信用代码', '联系电话'],
      docs: [
        { id: 'DOC-SUP-MAN', name: '冷丰平台供应商补充合作确认书', bodyId: '' }
      ]
    },
    {
      id: 'STPL-SUP-003', name: '冷丰平台供应商结算信息变更补充协议', scene: 'supplier', launch: 'supplement', signInOrder: true,
      actors: corpActors('供应商'),
      fill: ['供应商名称', '统一社会信用代码', '法定代表人', '注册地址', '联系电话', '结款方式', '结算策略', '结算起算节点', '结算周期'],
      docs: [
        { id: 'DOC-SUP-SETTLE', name: '冷丰平台供应商结算信息变更补充协议', bodyId: 'TPL007' }
      ]
    }
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
    return corpActors(sceneOf(sceneId).partyType);
  }

  function remoteOfId(remoteId) {
    return REMOTE_TEMPLATES.filter(function (item) { return item.id === remoteId; })[0] || null;
  }

  function cloneRemote(remote) {
    return {
      name: remote.name,
      scene: remote.scene,
      remoteId: remote.id,
      remoteName: remote.name,
      status: 'on',
      autoStart: remote.launch === 'auto',
      autoStartOnboard: false,
      kind: remote.launch === 'supplement' ? 'supplement' : '',
      signInOrder: !!remote.signInOrder,
      actors: (remote.actors || []).map(function (actor) { return Object.assign({}, actor); }),
      docs: (remote.docs || []).map(function (doc) { return Object.assign({}, doc); }),
      fill: (remote.fill || []).slice(),
      storePartnerTypes: remote.partnerTypes ? remote.partnerTypes.slice() : [],
      storePartnerType: remote.partnerTypes && remote.partnerTypes[0] ? remote.partnerTypes[0] : '',
      bizLines: [],
      brandNames: [],
      updatedAt: '2026-11-09 13:40'
    };
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
        businessId: 'BIZ-LF-COOP-001',
        sealId: 'SEAL-LF-001',
        sealName: '冷丰合同专用章',
        connectedAt: '2026-08-20 10:12:00'
      },
      catalogVersion: CATALOG_VERSION,
      templates: [
        Object.assign({ id: 'TPL001' }, cloneRemote(remoteOfId('STPL-ST-JOIN'))),
        Object.assign({ id: 'TPL002' }, cloneRemote(remoteOfId('STPL-ST-BRAND'))),
        Object.assign({ id: 'TPL003' }, cloneRemote(remoteOfId('STPL-SUP-IN'))),
        Object.assign({ id: 'TPL008' }, cloneRemote(remoteOfId('STPL-SUP-MAN'))),
        Object.assign({ id: 'TPL007' }, cloneRemote(remoteOfId('STPL-SUP-003')))
      ],
      parties: [
        { id: 'P001', type: 'store', partnerDivision: '加盟店', name: '鲜丰水果文一西路店', identNo: '91330106MA2A11111A', contact: '周敏 138****2201', identStatus: 'done', authStatus: 'done', fadadaId: 'C-XF-001', authAt: '2026-08-18 11:20' },
        { id: 'P002', type: 'store', partnerDivision: '联营店', name: '老城烧烤武林店', identNo: '91330105MA2B22222B', contact: '马东 139****8832', identStatus: 'done', authStatus: 'none', fadadaId: '', authAt: '' },
        { id: 'P003', type: 'supplier', name: '杭州鲜达供应链有限公司', identNo: '91330100MA2C33333C', contact: '陈可 137****6608', identStatus: 'done', authStatus: 'done', fadadaId: 'C-XD-003', authAt: '2026-08-15 09:02' },
        { id: 'P004', type: 'supplier', name: '宁波绿源食品有限公司', identNo: '91330200MA2D44444D', contact: '林悦 136****4410', identStatus: 'done', authStatus: 'pending', fadadaId: '', authAt: '2026-08-25 18:10' },
        { id: 'P011', type: 'store', partnerDivision: '直营店', name: '中心店01', identNo: '91330106MA2E55555E', contact: '牛店长 13812348001', identStatus: 'done', authStatus: 'none', fadadaId: '', authAt: '' },
        { id: 'P012', type: 'store', partnerDivision: '加盟店', name: '蒋村公交站店', identNo: '91330106MA2F66666F', contact: '赵启 13700001111', identStatus: 'done', authStatus: 'done', fadadaId: 'C-JC-012', authAt: '2026-10-12 11:00' },
        { id: 'P013', type: 'store', partnerDivision: '联营店', name: '西溪湿地南门店', identNo: '91330106MA2G77777G', contact: '陈夏 13600002222', identStatus: 'done', authStatus: 'done', fadadaId: 'C-XX-013', authAt: '2026-10-08 10:12' },
        { id: 'P014', type: 'supplier', name: '华东辅料仓配', identNo: '91330100MA2H88888H', contact: '周宁 13500003333', identStatus: 'done', authStatus: 'done', fadadaId: 'C-HD-014', authAt: '2026-09-20 09:00' }
      ],
      tasks: [
        { id: 'CT20260826001', name: '鲜丰水果文一西路店 · 冷丰品牌合作合同、冷丰加盟门店资金清分结算合同', scene: 'store', templateId: 'TPL001', storePartnerType: '加盟店', partyId: 'P001', status: 'sign_completed', platformSign: 'signed', signedDocIds: ['DOC-ST-BRAND', 'DOC-ST-CLEAR'], initiator: '李泽峰', createdAt: '2026-08-18 14:02', deadline: '2026-08-25 14:02', finishedAt: '2026-08-18 16:20', fadadaTaskId: 'ST-88001', signUrl: '' },
        { id: 'CT20260826002', name: '老城烧烤武林店 · 冷丰品牌合作合同', scene: 'store', templateId: 'TPL002', storePartnerType: '联营店', partyId: 'P002', status: 'sign_progress', platformSign: 'pending', signedDocIds: [], initiator: '李明', createdAt: '2026-08-25 10:16', deadline: '2026-09-01 10:16', finishedAt: '', fadadaTaskId: 'ST-88002', signUrl: '' },
        { id: 'CT20260826003', name: '杭州鲜达供应链有限公司 · 冷丰平台供应商入驻合作协议、冷丰平台供应商资金清分结算合同', scene: 'supplier', templateId: 'TPL003', partyId: 'P003', status: 'sign_progress', platformSign: 'signed', signedDocIds: ['DOC-SUP-IN'], initiator: '采购-周宁', createdAt: '2026-08-24 09:40', deadline: '2026-11-30 09:40', finishedAt: '', fadadaTaskId: 'ST-88003', signUrl: '' },
        { id: 'CT20260826007', name: '宁波绿源食品有限公司 · 冷丰平台供应商入驻合作协议、冷丰平台供应商资金清分结算合同', scene: 'supplier', templateId: 'TPL003', partyId: 'P004', status: 'terminated', platformSign: 'signed', signedDocIds: [], initiator: '采购-周宁', createdAt: '2026-08-20 16:30', deadline: '2026-08-27 16:30', finishedAt: '2026-08-21 10:02', fadadaTaskId: 'ST-88007', signUrl: '' },
        { id: 'CT20261027001', name: '中心店01 · 冷丰品牌合作合同', scene: 'store', templateId: 'TPL002', storePartnerType: '直营店', partyId: 'P011', status: 'sign_progress', platformSign: 'failed', signedDocIds: [], initiator: '李泽峰', createdAt: '2026-10-26 09:30', deadline: '2026-11-16 09:30', finishedAt: '', fadadaTaskId: 'ST-88011', signUrl: '' },
        { id: 'CT20261027002', name: '蒋村公交站店 · 冷丰品牌合作合同、冷丰加盟门店资金清分结算合同', scene: 'store', templateId: 'TPL001', storePartnerType: '加盟店', partyId: 'P012', status: 'cancelled', platformSign: 'pending', signedDocIds: [], initiator: '李明', createdAt: '2026-10-12 11:20', deadline: '2026-10-19 11:20', finishedAt: '2026-10-13 16:05', fadadaTaskId: 'ST-88012', signUrl: '' },
        { id: 'CT20261027003', name: '西溪湿地南门店 · 冷丰品牌合作合同', scene: 'store', templateId: 'TPL002', storePartnerType: '联营店', partyId: 'P013', status: 'voiding', platformSign: 'signed', signedDocIds: ['DOC-ST-BRAND'], initiator: '李泽峰', createdAt: '2026-10-08 14:10', deadline: '2026-10-15 14:10', finishedAt: '', fadadaTaskId: 'ST-88013', signUrl: '', abolishTaskId: '' },
        { id: 'CT20261027004', name: '华东辅料仓配 · 冷丰平台供应商入驻合作协议、冷丰平台供应商资金清分结算合同', scene: 'supplier', templateId: 'TPL003', partyId: 'P014', status: 'voided', platformSign: 'signed', signedDocIds: ['DOC-SUP-IN', 'DOC-SUP-CLEAR'], initiator: '采购-周宁', createdAt: '2026-09-28 10:00', deadline: '2026-10-05 10:00', finishedAt: '2026-10-18 09:40', fadadaTaskId: 'ST-88014', signUrl: '' }
      ]
    };
  }

  /** 客户端注册协议不进合同管理，只在注册页供查阅。 */
  var REGISTER_AGREEMENTS = [
    { id: 'TPL005', name: '冷丰平台用户注册服务协议' },
    { id: 'TPL006', name: '冷丰平台隐私政策' }
  ];

  function registerAgreements() {
    return REGISTER_AGREEMENTS.map(function (item) { return Object.assign({}, item); });
  }

  function isUserContractRecord(row) {
    if (!row) return false;
    if (row.scene === 'user' || row.type === 'user' || row.signChannel === 'checkbox') return true;
    if (row.id === 'TPL005' || row.id === 'TPL006' || row.remoteId === 'STPL-USER-001' || row.remoteId === 'STPL-USER-002') return true;
    return String(row.bizRef || '').indexOf('user-reg:') === 0;
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

  function scopeExtraLabel(tpl) {
    if (!tpl || tpl.scene !== 'store') return '';
    var bits = [];
    var lines = nameList(tpl.bizLines);
    var brands = nameList(tpl.brandNames);
    if (lines.length) bits.push(lines.join('、'));
    if (brands.length) bits.push(brands.join('、'));
    var launch = [];
    if (tpl.autoStart !== false && tpl.kind !== 'supplement') launch.push('入驻审核后');
    if (tpl.autoStartOnboard) launch.push('进件成功后');
    if (!launch.length && tpl.kind !== 'supplement') launch.push('手动发起');
    if (launch.length) bits.push(launch.join('、'));
    return bits.length ? '<div class="ct-field-tip" style="margin:2px 0 0">' + esc(bits.join(' · ')) + '</div>' : '';
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

  function readChecked(boxId) {
    return Array.prototype.map.call(document.querySelectorAll('#' + boxId + ' input:checked'), function (el) {
      return el.value;
    });
  }

  function writeChecked(boxId, values) {
    var set = values || [];
    document.querySelectorAll('#' + boxId + ' input').forEach(function (el) {
      el.checked = set.indexOf(el.value) >= 0;
    });
  }

  function nameList(value) {
    if (!Array.isArray(value)) return [];
    return value.map(function (item) { return String(item || '').trim(); }).filter(Boolean);
  }

  function renderBizLineChecks() {
    var box = document.getElementById('ctBizLine');
    if (!box) return;
    var lines = window.StoreBizStructure ? window.StoreBizStructure.lines() : [];
    box.innerHTML = lines.length
      ? lines.map(function (line) {
        return '<label class="pts-rule-check-label"><input type="checkbox" value="' + esc(line) + '"> ' + esc(line) + '</label>';
      }).join('')
      : '<span class="ct-field-tip">没有事业线枚举</span>';
  }

  function renderBrandChecks() {
    var box = document.getElementById('ctBrandName');
    if (!box || !window.StoreBizStructure) return;
    var picked = readChecked('ctBizLine');
    var prev = readChecked('ctBrandName');
    var lines = picked.length ? picked : window.StoreBizStructure.lines();
    var brands = [];
    lines.forEach(function (line) {
      window.StoreBizStructure.brands(line).forEach(function (name) {
        if (brands.indexOf(name) < 0) brands.push(name);
      });
    });
    box.innerHTML = brands.map(function (name) {
      return '<label class="pts-rule-check-label"><input type="checkbox" value="' + esc(name) + '"> ' + esc(name) + '</label>';
    }).join('');
    writeChecked('ctBrandName', prev);
  }

  function scopeHit(selected, value) {
    if (!selected || !selected.length) return true;
    return selected.indexOf(String(value || '').trim()) >= 0;
  }

  function migrateStoreContracts(data) {
    if (data.catalogVersion !== CATALOG_VERSION) {
      var fresh = seed();
      data.templates = fresh.templates;
      data.parties = fresh.parties;
      data.tasks = fresh.tasks;
      data.catalogVersion = CATALOG_VERSION;
      saveStore(data);
    }
    return stripUserRegisterScene(ensureSettleSupplementTemplate(data));
  }

  /** 用户注册已不走合同管理：清掉历史模板、主体和签署任务，不影响门店、供应商数据。 */
  function stripUserRegisterScene(data) {
    if (!data) return data;
    var templates = (data.templates || []).filter(function (row) { return !isUserContractRecord(row); });
    var parties = (data.parties || []).filter(function (row) { return !isUserContractRecord(row); });
    var tasks = (data.tasks || []).filter(function (row) { return !isUserContractRecord(row); });
    var changed = templates.length !== (data.templates || []).length
      || parties.length !== (data.parties || []).length
      || tasks.length !== (data.tasks || []).length;
    data.templates = templates;
    data.parties = parties;
    data.tasks = tasks;
    if (changed) saveStore(data);
    return data;
  }

  /** 已落库环境补齐结算变更补充协议模板，不整包重置签署任务 */
  function ensureSettleSupplementTemplate(data) {
    if (!data || !Array.isArray(data.templates)) return data;
    var has = data.templates.some(function (t) {
      return t && (t.id === 'TPL007' || t.remoteId === 'STPL-SUP-003');
    });
    if (has) return data;
    var remote = remoteOfId('STPL-SUP-003');
    if (!remote) return data;
    data.templates.push(Object.assign({ id: 'TPL007' }, cloneRemote(remote)));
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
      return stripUserRegisterScene(ensureDemoTaskStatuses(migrateStoreContracts(data)));
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
      if (!task || isUserContractRecord(task)) return;
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
    var docs = docsOfTpl(tpl);
    var shown = docs.length ? docs : [{ name: tpl.name, bodyId: tpl.id }];
    openContractDocs({
      eyebrow: '合同模板 · ' + sceneOf(tpl.scene).name,
      meta: '模板正文，乙方留空，只供查阅',
      docs: shown.map(function (doc) {
        var body = contractBodyOf({ id: doc.bodyId, name: doc.name });
        return { name: doc.name, body: body || '这份文档的正文在法大大模板中，本系统不维护条款。' };
      })
    });
  }

  function openTaskContract(task, activeId) {
    openTaskContractLocal(task, activeId);
  }

  function docContractBody(doc) {
    var body = contractBodyOf({
      id: (doc && (doc.bodyId || doc.id)) || '',
      name: doc && doc.name,
      remoteId: doc && doc.remoteId
    });
    return body || '这份文档的正文在法大大模板中，本系统不维护条款。';
  }

  function openTaskContractLocal(task, activeId) {
    if (!task) return;
    var party = findParty(task.partyId);
    var tpls = taskTemplates(task);
    var docs = (tpls.length ? tpls : [{ id: task.templateId, name: task.name || '合同' }]).map(function (tpl) {
      var body = fillContractParty(docContractBody(tpl), party);
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
    if (task && task.platformSign === 'failed') return '自动签失败';
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
    var tpl = findTpl(task.templateId);
    var orderLabel = tpl && tpl.signInOrder ? '顺序签署' : '无序签署';
    var sender = senderOfBody(doc && doc.body) || (state.config && state.config.corpName) || '—';
    var taskNo = task.fadadaTaskId || task.id || '';
    var platformDone = task.platformSign === 'signed' || task.status === 'sign_completed';
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
      signerCard(orderLabel, sender, platformDone ? '已签署' : (task.platformSign === 'failed' ? '自动签失败' : '待自动签'), platformDone ? (task.createdAt || '') : '') +
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

  /** 签署中超过法大大截止时间后，展示为已逾期。待对方授权不是法大大任务状态。 */
  function displayStatus(task) {
    if (!task) return '';
    var status = task.status === 'rejected' ? 'terminated' : (task.status || '');
    if (status === 'wait_auth' || status === 'draft') status = 'sign_progress';
    if (status === 'sign_progress' && deadlinePassed(task)) return 'overdue';
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

  function docsOfTpl(tpl) {
    if (!tpl) return [];
    if (Array.isArray(tpl.docs) && tpl.docs.length) return tpl.docs;
    var remote = remoteOfId(tpl.remoteId);
    return remote && remote.docs ? remote.docs : [];
  }

  function taskDocs(task) {
    if (!task) return [];
    if (Array.isArray(task.docs) && task.docs.length) return task.docs;
    return docsOfTpl(findTpl(task.templateId));
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
    setVal('ctBusinessId', cfg.businessId);
    fillSelect(document.getElementById('ctSealName'), SEALS.map(function (seal) {
      return { value: seal.id, label: seal.name + '（' + seal.id + '）' };
    }), cfg.sealId || SEALS[0].id);
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
        var businessId = String((document.getElementById('ctBusinessId') || {}).value || '').trim();
        var sealId = (document.getElementById('ctSealName') || {}).value || '';
        var seal = SEALS.filter(function (item) { return item.id === sealId; })[0];
        if (!businessId) return toast('请填写自动签场景码', 'error');
        if (!seal) return toast('请选择法大大印章', 'error');
        state.config.corpName = String(corpName).trim();
        state.config.corpIdentNo = document.getElementById('ctCorpIdentNo').value;
        state.config.businessId = businessId;
        state.config.sealId = seal.id;
        state.config.sealName = seal.name;
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
      var names = list.map(function (t) {
        var mark = t.kind === 'supplement' ? '（补充协议，单独发起）' : '';
        return '· ' + t.name + '（' + docsOfTpl(t).length + ' 份文档）' + mark;
      }).join('<br>');
      return '<div class="ct-scene-card" data-scene="' + esc(s.id) + '" role="button" tabindex="0" title="点击筛选该场景模板">' +
        '<div class="ct-scene-card__name">' + esc(s.name) + '</div>' +
        '<div class="ct-scene-card__meta">相对方：' + esc(s.partyType) + '（' + esc(s.partyHint) + '）<br>启用签署模板 <strong>' + list.length + '</strong> 份' +
        (names ? '<div class="ct-scene-card__list">' + names + '</div>' : '') +
        '</div></div>';
    }).join('');
    box.querySelectorAll('.ct-scene-card[data-scene]').forEach(function (card) {
      card.addEventListener('click', function () {
        var sceneSel = document.getElementById('qTplScene');
        if (!sceneSel) return;
        sceneSel.value = card.getAttribute('data-scene') || '';
        renderTemplateTable();
      });
    });
  }

  function renderTemplateTable() {
    var qName = ((document.getElementById('qTplName') || {}).value || '').trim();
    var qScene = (document.getElementById('qTplScene') || {}).value || '';
    var qStatus = (document.getElementById('qTplStatus') || {}).value || '';
    var rows = state.templates.filter(function (t) {
      if (isUserContractRecord(t)) return false;
      if (qName && String(t.name).indexOf(qName) < 0 && String(t.remoteId).indexOf(qName) < 0) return false;
      if (qScene && t.scene !== qScene) return false;
      if (qStatus && t.status !== qStatus) return false;
      return true;
    });
    var tb = document.getElementById('ctTplBody');
    if (!tb) return;
    if (!rows.length) {
      tb.innerHTML = '<tr><td colspan="9" class="ct-empty">没有符合条件的签署模板</td></tr>';
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
      var kindTag = t.kind === 'supplement'
        ? ' <span class="ct-tag ct-tag--info" title="结算信息变更后单独下发，不与入驻一并发起">补充协议</span>'
        : '';
      var toggle = t.status === 'on' ? '停用' : '启用';
      return '<tr data-id="' + esc(t.id) + '"' + (t.kind === 'supplement' ? ' class="ct-tpl-row--sup"' : '') + '>' +
        '<td><button type="button" class="ct-link" data-act="detail">' + esc(t.name) + '</button>' + kindTag + '</td>' +
        '<td>' + esc(sceneOf(t.scene).name) + '</td>' +
        '<td>' + esc(partnerTypeLabel(t)) + scopeExtraLabel(t) + '</td>' +
        '<td>' + esc(t.remoteId) + '<div class="ct-field-tip" style="margin:2px 0 0">' + esc(t.remoteName) + '</div></td>' +
        '<td>' + esc(docsOfTpl(t).map(function (doc) { return doc.name; }).join('、') || '—') + '</td>' +
        '<td>' + esc(actors) + '</td>' +
        '<td>' + st + '</td>' +
        '<td>' + esc(t.updatedAt) + '</td>' +
        '<td class="erp-actions-cell"><span class="ct-ops">' +
        '<button type="button" class="ct-link" data-act="detail">详情</button>' +
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
    actor = actor || { actorId: '', role: '', actorType: 'corp', signMode: 'manual', keyword: '' };
    return '<tr>' +
      '<td>' + esc(actor.actorId || '—') + '</td>' +
      '<td>' + esc(actor.role || '—') + '</td>' +
      '<td>' + (actor.actorType === 'person' ? '个人' : '企业') + '</td>' +
      '<td>' + (actor.signMode === 'auto' ? '自动签' : '手动签') + '</td>' +
      '<td>' + esc(actor.keyword || '—') + '</td>' +
      '</tr>';
  }

  function renderFillChecks(fields) {
    var box = document.getElementById('ctFillList');
    if (!box) return;
    var list = fields || [];
    if (!list.length) {
      box.innerHTML = '<span class="ct-field-tip">该模板没有需要从档案填充的控件</span>';
      return;
    }
    box.innerHTML = list.map(function (field) {
      return '<div>' + esc(field) + ' → <code>' + esc(FILL_CODES[field] || field) + '</code></div>';
    }).join('');
  }

  function renderRemoteDocs(remote) {
    var box = document.getElementById('ctDocList');
    if (!box) return;
    var docs = remote && remote.docs ? remote.docs : [];
    box.innerHTML = docs.length
      ? docs.map(function (doc) {
        return '<div>' + esc(doc.name) + ' <span class="ct-field-tip">' + esc(doc.id) + '</span></div>';
      }).join('')
      : '<span class="ct-field-tip">该签署模板没有文档</span>';
  }

  function paintRemote(remoteId) {
    var remote = remoteOfId(remoteId);
    var actors = remote ? remote.actors : [];
    var actorBody = document.getElementById('ctActorBody');
    if (actorBody) actorBody.innerHTML = actors.map(actorRowHtml).join('');
    renderFillChecks(remote ? remote.fill : []);
    renderRemoteDocs(remote);
    var order = document.getElementById('ctSignOrder');
    if (order) {
      order.checked = !!(remote && remote.signInOrder);
      order.disabled = true;
    }
    var auto = document.getElementById('ctAutoStart');
    var onboard = document.getElementById('ctAutoStartOnboard');
    var supplement = !!(remote && remote.launch === 'supplement');
    if (auto && remote) {
      auto.checked = remote.launch === 'auto';
      auto.disabled = supplement;
    }
    if (onboard && remote) {
      if (supplement) onboard.checked = false;
      onboard.disabled = supplement;
    }
  }

  function applySceneDefaults(sceneId, keepRemote) {
    var remoteSel = document.getElementById('ctRemoteTpl');
    var options = REMOTE_TEMPLATES.filter(function (item) { return item.scene === sceneId; }).map(function (item) {
      return { value: item.id, label: item.name + '（' + item.id + '）' };
    });
    if (!options.length) options = [{ value: '', label: '该场景暂无法大大模板' }];
    var next = keepRemote || options[0].value;
    fillSelect(remoteSel, options, next);
    paintRemote(next);
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
    var onboardBox = document.getElementById('ctAutoStartOnboard');
    if (onboardBox) onboardBox.checked = tpl ? !!tpl.autoStartOnboard : false;
    document.getElementById('ctSignOrder').checked = tpl ? !!tpl.signInOrder : true;
    var statusOn = document.getElementById('ctTplOn');
    var statusOff = document.getElementById('ctTplOff');
    if (tpl && tpl.status === 'off') statusOff.checked = true;
    else statusOn.checked = true;
    applySceneDefaults(tpl ? tpl.scene : 'store', tpl ? tpl.remoteId : '');
    if (tpl && tpl.autoStart === false) document.getElementById('ctAutoStart').checked = false;
    if (onboardBox && tpl) onboardBox.checked = !!tpl.autoStartOnboard;
    renderBizLineChecks();
    writeChecked('ctBizLine', tpl ? nameList(tpl.bizLines) : []);
    renderBrandChecks();
    writeChecked('ctBrandName', tpl ? nameList(tpl.brandNames) : []);
    var bizBox = document.getElementById('ctBizLine');
    if (bizBox && !bizBox.getAttribute('data-bound')) {
      bizBox.setAttribute('data-bound', '1');
      bizBox.addEventListener('change', renderBrandChecks);
    }
    writePartnerTypes(tpl ? partnerTypesOf(tpl) : (remoteOfId(document.getElementById('ctRemoteTpl').value) || {}).partnerTypes || ['加盟店']);
    function syncPartnerTypeRow(sceneId) {
      var row = document.getElementById('ctPartnerTypeRow');
      var bizRow = document.getElementById('ctBizLineRow');
      var brandRow = document.getElementById('ctBrandRow');
      var show = sceneId === 'store';
      if (row) row.style.display = show ? '' : 'none';
      if (bizRow) bizRow.style.display = show ? '' : 'none';
      if (brandRow) brandRow.style.display = show ? '' : 'none';
    }
    syncPartnerTypeRow(tpl ? tpl.scene : 'store');
    document.getElementById('ctTplScene').addEventListener('change', function () {
      var sceneId = this.value;
      syncPartnerTypeRow(sceneId);
      applySceneDefaults(sceneId);
      var picked = remoteOfId(document.getElementById('ctRemoteTpl').value);
      if (picked && picked.partnerTypes) writePartnerTypes(picked.partnerTypes);
      if (!tpl && !document.getElementById('ctTplName').value) {
        var remote = REMOTE_TEMPLATES.filter(function (r) { return r.scene === sceneId; })[0];
        document.getElementById('ctTplName').value = remote
          ? remote.name.replace(/（.*）/, '')
          : sceneOf(sceneId).name + '合同';
      }
    });
    var addActor = document.getElementById('ctAddActor');
    if (addActor) addActor.style.display = 'none';
    document.getElementById('ctRemoteTpl').addEventListener('change', function () {
      paintRemote(this.value);
      var remote = remoteOfId(this.value);
      if (remote && remote.partnerTypes) writePartnerTypes(remote.partnerTypes);
      if (!document.getElementById('ctTplName').value || !tpl) {
        document.getElementById('ctTplName').value = remote ? remote.name : '';
      }
    });
    if (viewMode) {
      document.querySelectorAll('#ctTplScene, #ctTplName, #ctRemoteTpl, #ctTplOn, #ctTplOff, #ctAutoStart, #ctAutoStartOnboard, #ctSignOrder').forEach(function (el) {
        el.disabled = true;
      });
      document.querySelectorAll('#ctStorePartnerType input, #ctBizLine input, #ctBrandName input, #ctActorBody input, #ctActorBody select, #ctFillList input').forEach(function (el) {
        el.disabled = true;
      });
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
        openTemplateContract(tpl);
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
      var remote = remoteOfId(remoteId);
      if (!remote || !remote.docs || !remote.docs.length) return toast('该签署模板没有文档，无法保存', 'error');
      if ((remote.actors || []).some(function (actor) { return !actor.actorId; })) {
        return toast('参与方标识与法大大模板不一致，无法保存', 'error');
      }
      var payload = {
        name: name,
        scene: scene,
        remoteId: remoteId,
        remoteName: remote.name,
        status: document.getElementById('ctTplOn').checked ? 'on' : 'off',
        autoStart: remote.launch === 'supplement' ? false : document.getElementById('ctAutoStart').checked,
        autoStartOnboard: remote.launch === 'supplement' ? false : !!(document.getElementById('ctAutoStartOnboard') || {}).checked,
        kind: remote.launch === 'supplement' ? 'supplement' : '',
        signInOrder: !!remote.signInOrder,
        actors: remote.actors.map(function (actor) { return Object.assign({}, actor); }),
        docs: remote.docs.map(function (doc) { return Object.assign({}, doc); }),
        fill: remote.fill.slice(),
        storePartnerTypes: storePartnerTypes,
        storePartnerType: storePartnerTypes[0] || '',
        bizLines: scene === 'store' ? readChecked('ctBizLine') : [],
        brandNames: scene === 'store' ? readChecked('ctBrandName') : [],
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
      if (isUserContractRecord(p)) return false;
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
        toast('已解除授权。已发起的任务不受影响，下次要用企业身份识别时再重新授权', 'success');
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
      if (isUserContractRecord(t)) return false;
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
        '<td class="erp-actions-cell"><span class="ct-ops">' + taskOpsHtml(t) + '</span></td></tr>';
    }).join('');
    refreshRowNo();
  }

  function taskOpsHtml(task) {
    var shown = displayStatus(task);
    var ops = [
      '<button type="button" class="ct-link" data-act="read">查看合同</button>',
      '<button type="button" class="ct-link" data-act="view">任务详情</button>'
    ];
    if (shown === 'sign_progress') {
      ops.push('<button type="button" class="ct-link" data-act="urge">催签</button>');
      ops.push('<button type="button" class="ct-link" data-act="copy">复制链接</button>');
      ops.push('<button type="button" class="ct-link" data-act="qr">二维码</button>');
      ops.push('<button type="button" class="ct-link is-danger" data-act="cancel">撤销</button>');
    }
    if (shown === 'overdue') ops.push('<button type="button" class="ct-link" data-act="postpone">延期</button>');
    if (shown === 'sign_completed') {
      ops.push('<button type="button" class="ct-link" data-act="copy">复制链接</button>');
      ops.push('<button type="button" class="ct-link" data-act="qr">二维码</button>');
      ops.push('<button type="button" class="ct-link" data-act="download">下载</button>');
      ops.push('<button type="button" class="ct-link" data-act="abolish">发起作废</button>');
    }
    if (shown === 'cancelled' || shown === 'terminated' || shown === 'voided') {
      ops.push('<button type="button" class="ct-link" data-act="retry">重新发起</button>');
    }
    return ops.join('');
  }

  function updateTaskTabs() {
    document.querySelectorAll('.ct-tabs__item[data-status]').forEach(function (btn) {
      var st = btn.getAttribute('data-status');
      var pool = state.tasks.filter(function (t) { return !isUserContractRecord(t); });
      var count = st ? pool.filter(function (t) { return displayStatus(t) === st; }).length : pool.length;
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
      toast('法大大签署短链已复制，一年内有效', 'success');
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
      openTaskContract(task);
      return;
    }
    if (act === 'urge') {
      if (displayStatus(task) !== 'sign_progress') return toast('已逾期的任务不能催签，请先延期', 'error');
      toast('已向对方发送催签通知（演示 urge）', 'success');
      return;
    }
    if (act === 'postpone') {
      task.deadline = addDaysText(nowText(), 7);
      saveStore(state);
      toast('已延期 7 天，任务回到签署中', 'success');
      if (document.getElementById('ctTaskBody')) {
        updateTaskTabs();
        renderTaskTable();
      }
      return;
    }
    if (act === 'abolish') {
      if (task.status !== 'sign_completed') return toast('只有已完成的任务可以发起作废', 'error');
      if (!global.confirm('作废需原签署方再签一份解除协议。签完后原任务才变为已作废。确定发起？')) return;
      var createdAt = nowText();
      var abolish = {
        id: nextTaskId(),
        name: '解除协议 · ' + task.name,
        scene: task.scene,
        kind: 'abolish',
        templateId: '',
        docs: [{ id: 'DOC-ABOLISH', name: '解除协议', bodyId: '' }],
        partyId: task.partyId,
        status: 'sign_progress',
        platformSign: 'pending',
        signedDocIds: [],
        initiator: '当前用户',
        createdAt: createdAt,
        deadline: addDaysText(createdAt, 7),
        finishedAt: '',
        fadadaTaskId: 'ST-ABO' + Date.now().toString().slice(-6),
        signUrl: '',
        originalTaskId: task.id
      };
      abolish.signUrl = fadadaSignUrl(abolish);
      task.status = 'voiding';
      task.abolishTaskId = abolish.id;
      state.tasks.unshift(abolish);
      saveStore(state);
      toast('已发起作废。解除协议进入签署中，原任务变为作废中', 'success');
      if (document.getElementById('ctTaskBody')) {
        updateTaskTabs();
        renderTaskTable();
      }
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
      if (task.status !== 'sign_completed') return toast('签署完成后才可下载', 'error');
      toast('已获取签署文档下载地址（演示 get-download-url）', 'success');
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

  function taskDocIds(task) {
    return taskDocs(task).map(function (doc) { return doc.id; });
  }

  function taskTemplates(task) {
    var kind = '';
    var tpl = task && findTpl(task.templateId);
    if (tpl) kind = tpl.kind || '';
    if (task && task.kind) kind = task.kind;
    return taskDocs(task).map(function (doc) {
      return { id: doc.id, name: doc.name, bodyId: doc.bodyId || '', kind: kind };
    });
  }

  function isSettleConfirmTpl(tpl) {
    return !!(tpl && tpl.kind === 'supplement');
  }

  /* 未设任何自动触发、且不是结算变更确认后下发的协议，才在发起页标成手动发起。 */
  function isManualOnlyTpl(tpl) {
    return !!(tpl && tpl.autoStart === false && !tpl.autoStartOnboard && !isSettleConfirmTpl(tpl));
  }

  /* 入驻审核通过，或进件成功，按模板上的发起规则各取一份。 */
  function templatesForSign(sceneId, partnerType, extra) {
    extra = extra || {};
    var trigger = extra.trigger || 'audit';
    return state.templates.filter(function (t) {
      if (t.scene !== sceneId || t.status !== 'on') return false;
      if (isSettleConfirmTpl(t)) return false;
      if (trigger === 'onboard') {
        if (!t.autoStartOnboard) return false;
      } else if (t.autoStart === false) return false;
      if (sceneId !== 'store') return true;
      if (partnerTypesOf(t).indexOf(partnerType || '加盟店') < 0) return false;
      if (!scopeHit(nameList(t.bizLines), extra.bizLine)) return false;
      if (!scopeHit(nameList(t.brandNames), extra.brandName)) return false;
      return true;
    });
  }

  /* 手动发起页：该场景已从法大大同步并启用的协议都列出，含未设自动触发的。 */
  function templatesForManual(sceneId, partnerType) {
    return state.templates.filter(function (t) {
      if (t.scene !== sceneId || t.status !== 'on') return false;
      if (sceneId !== 'store') return true;
      return partnerTypesOf(t).indexOf(partnerType || '加盟店') >= 0;
    });
  }

  function createBlockReason(tpl) {
    var remote = tpl && remoteOfId(tpl.remoteId);
    var docs = docsOfTpl(tpl);
    var actors = (tpl && tpl.actors && tpl.actors.length) ? tpl.actors : (remote && remote.actors) || [];
    if (!remote || !docs.length) return '该签署模板没有文档，任务未创建';
    if (!actors.length || actors.some(function (actor) { return !actor.actorId; })) {
      return '参与方标识与法大大模板不一致，任务未创建';
    }
    var needsAuto = actors.some(function (actor) { return actor.signMode === 'auto'; });
    if (needsAuto && (!state.config.businessId || !state.config.sealId)) {
      return '平台自动签未配置场景码或印章，任务未创建';
    }
    return '';
  }

  function findSettleSupplementTpl() {
    return state.templates.filter(function (t) {
      return t && t.status === 'on' && (t.id === 'TPL007' || t.remoteId === 'STPL-SUP-003' || t.kind === 'supplement');
    })[0] || null;
  }

  /**
   * 供应商结算信息变更后下发补充协议。同一供应商只展示一条未关闭记录。
   * 任务已提交后不能改控件，再次发放会撤销旧法大大任务并新建。
   */
  function issueSupplierSettleSupplement(opts) {
    opts = opts || {};
    var partyName = String(opts.name || '').trim();
    if (!partyName) return null;
    ensureSettleSupplementTemplate(state);
    var tpl = findSettleSupplementTpl();
    if (!tpl) {
      toast('未配置结算信息变更补充协议模板', 'error');
      return null;
    }
    var block = createBlockReason(tpl);
    if (block) {
      toast(block, 'error');
      return null;
    }
    var bizRef = opts.bizRef || ('supplier-settle-sup:' + (opts.supplierId || partyName));
    var existing = state.tasks.filter(function (t) {
      return t && t.bizRef === bizRef && !taskIsClosed(t.status);
    })[0];
    if (existing) {
      var oldFadadaId = existing.fadadaTaskId;
      existing.status = 'sign_progress';
      existing.finishedAt = '';
      existing.signedDocIds = [];
      existing.templateSignedAt = {};
      existing.platformSign = 'pending';
      existing.settleSnapshot = opts.settleSnapshot || existing.settleSnapshot || null;
      existing.updatedAt = nowText();
      existing.deadline = addDaysText(nowText(), 7);
      existing.replacedFadadaTaskId = oldFadadaId;
      existing.fadadaTaskId = 'ST-SUP' + Date.now().toString().slice(-6);
      existing.signUrl = '';
      existing.signUrl = fadadaSignUrl(existing);
      existing.reissueNote = '已撤销法大大任务 ' + (oldFadadaId || '（无任务号）') + '，按新结算快照重新创建';
      saveStore(state);
      return existing;
    }
    var party = upsertParty({
      type: 'supplier',
      name: partyName,
      identNo: opts.identNo || '',
      contact: opts.contact || '',
      address: opts.address || '',
      authStatus: 'done'
    });
    var createdAt = nowText();
    var task = {
      id: nextTaskId(),
      name: party.name + ' · ' + tpl.name,
      scene: 'supplier',
      kind: 'settle_supplement',
      templateId: tpl.id,
      agreementNames: docsOfTpl(tpl).map(function (doc) { return doc.name; }).join('、') || tpl.name,
      partyId: party.id,
      status: 'sign_progress',
      platformSign: 'pending',
      signedDocIds: [],
      initiator: opts.initiator || '供应商档案·结算变更',
      createdAt: createdAt,
      deadline: addDaysText(createdAt, 7),
      finishedAt: '',
      fadadaTaskId: 'ST-SUP' + Date.now().toString().slice(-6),
      signUrl: '',
      bizRef: bizRef,
      settleSnapshot: opts.settleSnapshot || null,
      sms: true,
      pushApp: true
    };
    task.signUrl = fadadaSignUrl(task);
    state.tasks.unshift(task);
    saveStore(state);
    return task;
  }

  function readTaskTemplateId() {
    var picked = document.querySelector('#ctTaskTpl input:checked');
    return picked ? picked.value : '';
  }

  function fillPartyOptions(sceneId, selected) {
    var sel = document.getElementById('ctTaskParty');
    var list = state.parties.filter(function (p) { return p.type === sceneId; });
    fillSelect(sel, [{ value: '', label: '请选择' + sceneOf(sceneId).partyType }].concat(list.map(function (p) {
      var mark = p.authStatus === 'done' ? '已授权' : ((AUTH_STATUS[p.authStatus] || AUTH_STATUS.none).label);
      return { value: p.id, label: p.name + '（' + mark + '）' };
    })), selected || '');
  }

  function paintTaskDocs(tpl) {
    var box = document.getElementById('ctTaskDocs');
    if (!box) return;
    var docs = docsOfTpl(tpl);
    box.textContent = docs.length
      ? ('纳入本任务的文档：' + docs.map(function (doc) { return doc.name; }).join('、'))
      : '该模板没有文档，不能发起';
  }

  function launchTagHtml(item) {
    var tags = [];
    if (item && item.autoStart !== false) tags.push('<span class="ct-tag ct-tag--ok">入驻审核后</span>');
    if (item && item.autoStartOnboard) tags.push('<span class="ct-tag ct-tag--ok">进件成功后</span>');
    if (!tags.length) tags.push('<span class="ct-tag ct-tag--muted">手动发起</span>');
    return tags.join('');
  }

  function fillTplOptions(sceneId, selectedId) {
    var box = document.getElementById('ctTaskTpl');
    if (!box) return;
    var partnerType = sceneId === 'store' ? ((document.getElementById('ctTaskPartner') || {}).value || '加盟店') : '';
    var list = templatesForManual(sceneId, partnerType);
    var fallback = list.filter(function (item) { return !isManualOnlyTpl(item) && !isSettleConfirmTpl(item); })[0];
    var selected = selectedId || (fallback ? fallback.id : (list[0] && list[0].id));
    if (!list.length) {
      box.innerHTML = '<span class="ct-field-tip">该场景暂无已启用的法大大签署模板</span>';
      paintTaskDocs(null);
      return;
    }
    box.innerHTML = list.map(function (item) {
      var checked = item.id === selected ? ' checked' : '';
      var tag = isSettleConfirmTpl(item)
        ? '<span class="ct-tag ct-tag--info">变更确认后触发</span>'
        : launchTagHtml(item);
      return '<label class="pts-rule-check-label"><input type="radio" name="ctTaskTplPick" value="' + esc(item.id) + '"' + checked + '> ' + esc(item.name) + tag + '</label>';
    }).join('');
    paintTaskDocs(findTpl(selected));
  }

  function updatePartyHint() {
    var box = document.getElementById('ctPartyHint');
    if (!box) return;
    var party = findParty(document.getElementById('ctTaskParty').value);
    if (!party) {
      box.innerHTML = '';
      box.style.display = 'none';
      return;
    }
    box.style.display = 'block';
    if (party.authStatus === 'done') {
      box.className = 'mdm-biz-tip';
      box.innerHTML = '当前主体 <strong>已授权</strong>，法大大 ID：' + esc(party.fadadaId) + '。授权用于识别企业，不是发起前置。';
    } else {
      box.className = 'mdm-biz-tip';
      box.innerHTML = '当前主体尚未企业授权，仍可发起。对方打开签署链接时在法大大完成实名。';
    }
  }

  function currentTaskParty() {
    return findParty(document.getElementById('ctTaskParty').value);
  }

  function syncTaskName() {
    var party = currentTaskParty();
    var tpl = findTpl(readTaskTemplateId());
    var names = docsOfTpl(tpl).map(function (doc) { return doc.name; });
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
    refreshByScene(retry ? retry.templateId : '');
    if (retry) {
      document.getElementById('ctTaskName').value = retry.name.replace(/（重新发起）$/, '') + '（重新发起）';
    }
    document.getElementById('ctTaskScene').addEventListener('change', function () {
      retry = null;
      document.getElementById('ctTaskName').value = '';
      refreshByScene('');
    });
    if (partnerSel) {
      partnerSel.addEventListener('change', function () {
        fillTplOptions(document.getElementById('ctTaskScene').value, '');
        syncTaskName();
      });
    }
    document.getElementById('ctTaskTpl').addEventListener('change', function () {
      paintTaskDocs(findTpl(readTaskTemplateId()));
      syncTaskName();
    });
    document.getElementById('ctTaskParty').addEventListener('change', function () {
      var party = findParty(this.value);
      if (party && party.partnerDivision && partnerSel && document.getElementById('ctTaskScene').value === 'store') {
        partnerSel.value = party.partnerDivision;
        fillTplOptions('store', '');
      }
      updatePartyHint();
      syncTaskName();
    });
    document.getElementById('ctTaskCancel').addEventListener('click', function () {
      go('basic_settings_contract_task.html');
    });
    document.getElementById('ctTaskSave').addEventListener('click', function () {
      var scene = document.getElementById('ctTaskScene').value;
      var templateId = readTaskTemplateId();
      var tpl = findTpl(templateId);
      if (!tpl) return toast('请选择一份签署模板', 'error');
      var block = createBlockReason(tpl);
      if (block) return toast(block, 'error');
      var docs = docsOfTpl(tpl);
      var agreementLabel = docs.map(function (doc) { return doc.name; }).join('、');
      var partyId = document.getElementById('ctTaskParty').value;
      if (!partyId) return toast('请选择签署相对方', 'error');
      var party = findParty(partyId);
      var name = String(document.getElementById('ctTaskName').value || '').trim();
      if (!name && party) {
        name = party.name + ' · ' + agreementLabel;
        document.getElementById('ctTaskName').value = name;
      }
      if (!name) return toast('请填写合同名称', 'error');
      var sms = document.getElementById('ctTaskSms').checked;
      var deadlineInput = normalizeDeadline(document.getElementById('ctTaskDeadline').value);
      var createdAt = nowText();
      var createdTask = {
        id: nextTaskId(),
        name: name,
        scene: scene,
        templateId: tpl.id,
        agreementNames: agreementLabel,
        storePartnerType: scene === 'store' && partnerSel ? partnerSel.value : '',
        partyId: party.id,
        status: 'sign_progress',
        platformSign: 'pending',
        signedDocIds: [],
        initiator: '当前用户',
        createdAt: createdAt,
        deadline: deadlineInput || addDaysText(createdAt, 7),
        finishedAt: '',
        fadadaTaskId: 'ST-' + Date.now().toString().slice(-6),
        signUrl: '',
        sms: sms,
        notifyType: sms ? ['start'] : []
      };
      if (tpl.kind === 'supplement') {
        createdTask.kind = 'settle_supplement';
        createdTask.pushApp = true;
      }
      createdTask.signUrl = fadadaSignUrl(createdTask);
      state.tasks.unshift(createdTask);
      saveStore(state);
      toast('已发起 1 条签署任务，包含 ' + docs.length + ' 份文档', 'success');
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
    var docs = taskDocs(task);
    var set = function (id, html) {
      var el = document.getElementById(id);
      if (el) el.innerHTML = html;
    };
    set('ctDetailTitle', esc(task.name));
    set('ctDetailStatus', tagHtml(TASK_STATUS, displayStatus(task)));
    set('ctKvId', esc(task.id));
    set('ctKvFdd', esc(task.fadadaTaskId || '尚未同步'));
    set('ctKvScene', esc(sceneOf(task.scene).name));
    set('ctKvTpl', esc((tpl ? tpl.name : '—') + (docs.length ? '（' + docs.map(function (doc) { return doc.name; }).join('、') + '）' : '')));
    set('ctKvParty', esc(party ? party.name : '—'));
    set('ctKvInitiator', esc(task.initiator));
    set('ctKvCreated', esc(task.createdAt));
    set('ctKvDeadline', esc(deadlineText(task)));
    set('ctKvFinished', esc(task.finishedAt || '—'));
    var actors = (tpl && tpl.actors) ? tpl.actors : defaultActors(task.scene);
    var shown = displayStatus(task);
    var actorHtml = actors.map(function (actor) {
      var isPlatform = actor.signMode === 'auto' || actor.actorId === '甲方';
      var st;
      if (isPlatform) {
        if (task.platformSign === 'failed') st = '<span class="ct-tag ct-tag--danger">自动签失败</span>';
        else if (task.platformSign === 'signed' || task.status === 'sign_completed') st = '<span class="ct-tag ct-tag--ok">已自动签署</span>';
        else st = '<span class="ct-tag ct-tag--warn">待自动签</span>';
      } else if (shown === 'sign_completed') st = tagHtml(TASK_STATUS, 'sign_completed');
      else if (shown === 'cancelled' || shown === 'terminated' || shown === 'voided' || shown === 'voiding' || shown === 'overdue') st = tagHtml(TASK_STATUS, shown);
      else st = '<span class="ct-tag ct-tag--info">待签署</span>';
      var who = isPlatform ? state.config.corpName : (party ? party.name : actor.role);
      var mode = actor.signMode === 'auto' ? '自动签' : '手动签';
      return '<tr><td>' + esc((actor.actorId ? actor.actorId + ' · ' : '') + actor.role) + '</td><td>' + esc(who) + '</td><td>' + (actor.actorType === 'person' ? '个人' : '企业') + '</td><td>' + mode + '</td><td>' + st + '</td></tr>';
    }).join('');
    set('ctActorDetailBody', actorHtml);
    var fileHtml = (docs.length ? docs : [{ id: '', name: '合同' }]).map(function (doc) {
      var signed = doc.id && isTemplateSigned(task, doc.id);
      var canDl = task.status === 'sign_completed';
      return '<div class="ct-file-row"><div>' + esc(doc.name) + '.pdf<div class="ct-field-tip">' + (signed ? '已签' : '待签') + '</div></div>' +
        '<span class="ct-ops"><button type="button" class="ct-link" data-act="read">查看合同</button>' +
        (canDl ? '<button type="button" class="ct-link" data-act="download">下载</button>' : '<span class="ct-tag ct-tag--muted">签署完成后可下载</span>') +
        '</span></div>';
    }).join('');
    if (task.status === 'sign_completed') {
      var evidence = task.evidenceStatus === 'pending'
        ? '<span class="ct-tag ct-tag--warn">生成中</span>'
        : (task.evidenceStatus === 'ready'
          ? '<button type="button" class="ct-link" data-act="download">下载</button>'
          : '<button type="button" class="ct-link" data-act="evidence">申请证据报告</button>');
      fileHtml += '<div class="ct-file-row"><div>证据报告<div class="ct-field-tip">申请后等待生成，不随签署完成立即出具</div></div><span class="ct-ops">' + evidence + '</span></div>';
    }
    set('ctFileList', fileHtml);
    var logs = [
      { t: task.createdAt, d: '创建签署任务' + (task.fadadaTaskId ? '，法大大任务号 ' + task.fadadaTaskId : '') + '（回调 sign-task-start）' }
    ];
    if (task.platformSign === 'failed') logs.push({ t: task.createdAt, d: '平台自动签失败（回调 sign-task-sign-failed）' });
    else if (task.platformSign === 'signed' || task.status === 'sign_completed') logs.push({ t: task.createdAt, d: '平台方自动签成功（回调 sign-task-signed）' });
    else logs.push({ t: task.createdAt, d: '等待平台自动签回调，创建成功时不视为已签署' });
    if (task.reissueNote) logs.push({ t: task.updatedAt || task.createdAt, d: task.reissueNote });
    if (task.status === 'sign_completed') logs.push({ t: task.finishedAt, d: '全部文档签署完成（回调 sign-task-finished）' });
    if (task.status === 'terminated' || task.status === 'rejected') logs.push({ t: task.finishedAt, d: '对方拒签，任务已终止（回调 sign-task-sign-rejected）' });
    if (task.status === 'cancelled') logs.push({ t: task.finishedAt, d: '发起方撤销任务（回调 sign-task-canceled）' });
    if (task.status === 'voiding') logs.push({ t: task.updatedAt || nowText(), d: '已发起作废，等待原签署方签署解除协议' + (task.abolishTaskId ? '（' + task.abolishTaskId + '）' : '') });
    if (task.status === 'voided') logs.push({ t: task.finishedAt, d: '解除协议签署完成，原任务已作废（回调 sign-task-abolish）' });
    if (shown === 'overdue') logs.push({ t: deadlineText(task), d: '超过截止时间，任务已逾期（回调 sign-task-expire）' });
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
      var beforeStatus = task.status;
      var beforeDeadline = task.deadline;
      handleTaskAct(act, task);
      if (act === 'cancel' && task.status === 'cancelled') go('basic_settings_contract_task.html');
      if (act === 'postpone' && task.deadline !== beforeDeadline) global.location.reload();
      if (act === 'abolish' && task.status !== beforeStatus) global.location.reload();
    });
    var fileList = document.getElementById('ctFileList');
    if (fileList) {
      fileList.addEventListener('click', function (e) {
        var read = e.target.closest('[data-act="read"]');
        if (read) {
          openTaskContract(task);
          return;
        }
        var evidence = e.target.closest('[data-act="evidence"]');
        if (evidence) {
          task.evidenceStatus = 'pending';
          saveStore(state);
          evidence.outerHTML = '<span class="ct-tag ct-tag--warn">生成中</span>';
          toast('已申请证据报告，生成后由回调通知', 'success');
          return;
        }
        var btn = e.target.closest('[data-act="download"]');
        if (!btn) return;
        handleTaskAct('download', task);
      });
    }
    var shownNow = displayStatus(task);
    var urge = document.querySelector('#ctDetailOps [data-act="urge"]');
    var copy = document.querySelector('#ctDetailOps [data-act="copy"]');
    var dl = document.querySelector('#ctDetailOps [data-act="download"]');
    var cancel = document.querySelector('#ctDetailOps [data-act="cancel"]');
    var postpone = document.querySelector('#ctDetailOps [data-act="postpone"]');
    var abolish = document.querySelector('#ctDetailOps [data-act="abolish"]');
    if (urge) urge.style.display = shownNow === 'sign_progress' ? '' : 'none';
    if (copy) copy.style.display = (shownNow === 'sign_progress' || shownNow === 'sign_completed') ? '' : 'none';
    if (dl) dl.style.display = task.status === 'sign_completed' ? '' : 'none';
    if (cancel) cancel.style.display = shownNow === 'sign_progress' ? '' : 'none';
    if (postpone) postpone.style.display = shownNow === 'overdue' ? '' : 'none';
    if (abolish) abolish.style.display = task.status === 'sign_completed' ? '' : 'none';
  }

  function htmlPageUrl(query) {
    return global.location.origin + '/SCM/contract_sign.html?' + query;
  }

  function ensureFadadaTaskId(task) {
    if (!task) return '';
    if (!task.fadadaTaskId) {
      var digits = String(task.id || '').replace(/\D/g, '');
      task.fadadaTaskId = 'ST-' + (digits.slice(-6) || String(Date.now()).slice(-6));
    }
    return task.fadadaTaskId;
  }

  /** 转发给对方、生成二维码用短链，一年有效。 */
  function fadadaSignUrl(task) {
    var taskId = ensureFadadaTaskId(task);
    if (!taskId) return '';
    return 'https://test.fddurl.cn/' + String(taskId).replace(/[^A-Za-z0-9]/g, '').slice(-8);
  }

  /** App 内打开时当场再取长链，不复用创建时存下的短链。 */
  function fadadaEmbedUrl(task) {
    var taskId = ensureFadadaTaskId(task);
    if (!taskId) return '';
    return 'https://uat-sign.fadada.com/connect/sign?signTaskId=' + encodeURIComponent(taskId) + '&ticket=' + Date.now();
  }

  function fadadaPreviewUrl(task) {
    var taskId = ensureFadadaTaskId(task);
    if (!taskId) return '';
    return 'https://uat-sign.fadada.com/preview?signTaskId=' + encodeURIComponent(taskId);
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

  /* 入驻审核通过或进件成功：按场景和发起规则带出已启用协议，生成一条法大大签署任务。用户注册不进合同管理。 */
  function generateCoopTask(opts) {
    opts = opts || {};
    var scene = opts.scene;
    var partyName = String(opts.name || '').trim();
    if (!scene || scene === 'user' || !partyName) return null;
    var bizRef = opts.bizRef || '';
    if (bizRef) {
      var existing = state.tasks.filter(function (t) {
        return t.bizRef === bizRef && !taskIsClosed(t.status);
      })[0];
      if (existing) {
        if (!existing.agreementNames) {
          existing.agreementNames = taskDocs(existing).map(function (doc) { return doc.name; }).join('、');
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
    var tpl = templatesForSign(scene, partnerType, {
      trigger: opts.trigger || 'audit',
      bizLine: opts.bizLine || '',
      brandName: opts.brandName || ''
    })[0];
    if (!tpl) return null;
    var block = createBlockReason(tpl);
    if (block) {
      toast(block, 'error');
      return null;
    }
    var party = upsertParty({
      type: scene,
      name: partyName,
      partnerDivision: partnerType,
      identNo: opts.identNo || '',
      contact: opts.contact || opts.phone || '',
      address: opts.address || '',
      authStatus: opts.authStatus || 'none'
    });
    var names = docsOfTpl(tpl).map(function (doc) { return doc.name; });
    var status = opts.status || 'sign_progress';
    var createdAt = nowText();
    var task = {
      id: nextTaskId(),
      name: party.name + ' · ' + names.join('、'),
      scene: scene,
      templateId: tpl.id,
      agreementNames: names.join('、'),
      storePartnerType: partnerType,
      partyId: party.id,
      status: status,
      platformSign: status === 'sign_completed' ? 'signed' : 'pending',
      signedDocIds: status === 'sign_completed' ? docsOfTpl(tpl).map(function (doc) { return doc.id; }) : [],
      initiator: opts.initiator || '系统',
      createdAt: createdAt,
      deadline: addDaysText(createdAt, 7),
      finishedAt: status === 'sign_completed' ? createdAt : '',
      fadadaTaskId: 'ST-' + Date.now().toString().slice(-6),
      signUrl: '',
      bizRef: bizRef,
      sms: true,
      notifyType: ['start']
    };
    task.signUrl = fadadaSignUrl(task);
    state.tasks.unshift(task);
    saveStore(state);
    return task;
  }

  function signUserByRegister() {
    return null;
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

  function listSupplierTasks(supplierName) {
    var name = String(supplierName || '').trim();
    return state.tasks.filter(function (t) {
      if (t.scene !== 'supplier') return false;
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
    var ids = taskDocIds(task);
    if (!task) return [];
    var signed = Array.isArray(task.signedDocIds) ? task.signedDocIds : [];
    if (task.status === 'sign_completed' && !signed.length) return ids;
    return signed.filter(function (id) { return ids.indexOf(id) >= 0; });
  }

  function isTemplateSigned(task, tplId) {
    return !!(task && tplId && signedTemplateIdsOf(task).indexOf(tplId) >= 0);
  }

  /** 已签 1/2；全部签完才是已签署。 */
  function signProgressLabel(task) {
    if (!task) return '待签署';
    var ids = taskDocIds(task);
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
    var ids = taskDocIds(task);
    if (ids.indexOf(tplId) < 0) return task;
    if (isTemplateSigned(task, tplId)) return task;
    var signed = signedTemplateIdsOf(task).slice();
    signed.push(tplId);
    task.signedDocIds = signed;
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
    taskDocIds(task).forEach(function (id) {
      if (!pendingId && !isTemplateSigned(task, id)) pendingId = id;
    });
    if (!pendingId) return task;
    return markTemplateSigned(taskId, pendingId);
  }

  function partyTasks(scene, name) {
    var partyName = String(name || '').trim();
    return state.tasks.filter(function (task) {
      if (isUserContractRecord(task) || task.scene !== scene) return false;
      var party = findParty(task.partyId);
      return !!(party && party.name === partyName);
    }).sort(function (a, b) {
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    });
  }

  function partyContractStatus(scene, name) {
    var list = partyTasks(scene, name);
    if (!list.length) return '未发起';
    return (TASK_STATUS[displayStatus(list[0])] || {}).label || '未发起';
  }

  function storeContractCompleted(name) {
    return partyTasks('store', name).some(function (task) {
      return displayStatus(task) === 'sign_completed';
    });
  }

  function storeCommerceLabel(name, storeId) {
    var ref = name && typeof name === 'object' ? name : { name: name, storeId: storeId };
    if (window.LfLowMargin && typeof window.LfLowMargin.commerceLabel === 'function') {
      return window.LfLowMargin.commerceLabel(ref);
    }
    return { text: '未放开', title: '保证金余额未达到应保有金额。' };
  }

  function renderPartyTaskPanel(scene, name) {
    var wrap = document.createElement('div');
    wrap.className = 'supplier-detail-tab';
    var note = document.createElement('p');
    note.className = 'erp-page__note mdm-detail-note';
    var gate = scene === 'store' ? storeCommerceLabel(name) : null;
    note.textContent = '列出推送给「' + (name || '—') + '」的签署任务。查看、催签、延期、撤销、下载、作废与合同管理的签署任务相同。'
      + (gate ? '低利润商品与营销活动：' + gate.text + '。' + gate.title : '');
    wrap.appendChild(note);
    var table = document.createElement('table');
    table.className = 'table';
    var tasks = partyTasks(scene, name);
    var body = tasks.length
      ? tasks.map(function (task) {
        var shown = displayStatus(task);
        var meta = TASK_STATUS[shown] || { label: shown || '—' };
        return '<tr data-id="' + esc(task.id) + '">' +
          '<td>' + esc(task.id) + '</td>' +
          '<td>' + esc(task.name) + '</td>' +
          '<td>' + esc(meta.label) + '</td>' +
          '<td>' + esc(task.createdAt || '—') + '</td>' +
          '<td class="erp-actions-cell"><span class="ct-ops">' + taskOpsHtml(task) + '</span></td>' +
          '</tr>';
      }).join('')
      : '<tr><td colspan="5">还没有推送签署任务</td></tr>';
    table.innerHTML = '<thead><tr><th>任务编号</th><th>合同</th><th>任务状态</th><th>创建时间</th><th>操作</th></tr></thead><tbody>' + body + '</tbody>';
    table.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var row = btn.closest('tr');
      handleTaskAct(btn.getAttribute('data-act'), findTask(row && row.getAttribute('data-id')), btn);
    });
    wrap.appendChild(table);
    return wrap;
  }

  global.LfContract = {
    htmlSignUrl: htmlSignUrl,
    fadadaSignUrl: fadadaSignUrl,
    fadadaEmbedUrl: fadadaEmbedUrl,
    fadadaPreviewUrl: fadadaPreviewUrl,
    htmlTplUrl: htmlTplUrl,
    htmlSceneUrl: function (sceneId) { return htmlPageUrl('scene=' + encodeURIComponent(sceneId || '')); },
    copyText: copyText,
    generateCoopTask: generateCoopTask,
    issueSupplierSettleSupplement: issueSupplierSettleSupplement,
    signUserByRegister: signUserByRegister,
    listStoreTasks: listStoreTasks,
    listSupplierTasks: listSupplierTasks,
    templatesOfScene: templatesOfScene,
    markTaskSigned: markTaskSigned,
    markTemplateSigned: markTemplateSigned,
    isTemplateSigned: isTemplateSigned,
    signProgressLabel: signProgressLabel,
    findTask: findTask,
    findParty: findParty,
    findTpl: findTpl,
    partyContractStatus: partyContractStatus,
    storeContractCompleted: storeContractCompleted,
    storeCommerceLabel: storeCommerceLabel,
    renderPartyTaskPanel: renderPartyTaskPanel,
    registerAgreements: registerAgreements,
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
