/**
 * 营销记录 — 领券记录（localStorage）
 * Key: mdm_mall_marketing_record_v3
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'mdm_mall_marketing_record_v3';
  var COLLECT_METHOD_MANUAL = '后台人工发券';
  var COLLECT_METHOD_LIVE = '直播发券';
  var COLLECT_METHOD_BAG = '福袋发券';
  var COLLECT_METHOD_SIGNIN = '签到发券';
  var COUPON_TYPE = '商品优惠券';
  var SCENE_OPTIONS = [
    COLLECT_METHOD_LIVE,
    COLLECT_METHOD_BAG,
    COLLECT_METHOD_SIGNIN,
    COLLECT_METHOD_MANUAL
  ];
  var ACTIVITY_FILTER_META = {};
  ACTIVITY_FILTER_META[COLLECT_METHOD_LIVE] = {
    label: '直播场次ID',
    ids: ['sess-001', 'sess-002', 'sess-003', 'sess-004']
  };
  ACTIVITY_FILTER_META[COLLECT_METHOD_BAG] = {
    label: '福袋模板ID',
    ids: ['tpl-b1', 'tpl-pool-b1', 'tpl-pool-b2']
  };
  ACTIVITY_FILTER_META[COLLECT_METHOD_SIGNIN] = {
    label: '签到模板ID',
    ids: ['tpl-s1', 'tpl-pool-s1']
  };

  var COUPON_META = {
    满50减5券: { faceValue: '5元', threshold: '50元', templateId: 'TPL10001', channel: '全渠道', validPeriod: '领取后7天有效' },
    满100减15券: { faceValue: '15元', threshold: '100元', templateId: 'TPL10002', channel: 'APP/小程序', validPeriod: '2026-01-01~12-31' },
    满200减30券: { faceValue: '30元', threshold: '200元', templateId: 'TPL10003', channel: '全渠道', validPeriod: '2026-03-01~09-30' },
    满300减50券: { faceValue: '50元', threshold: '300元', templateId: 'TPL10004', channel: '门店自提', validPeriod: '领取后15天有效' },
    生日专属券: { faceValue: '10元', threshold: '无门槛', templateId: 'TPL10005', channel: '全渠道', validPeriod: '生日当月有效' },
    免运费券: { faceValue: '免运费', threshold: '无门槛', templateId: 'TPL10006', channel: '快递配送', validPeriod: '领取后3天有效' },
    新人专享券: { faceValue: '8元', threshold: '无门槛', templateId: 'TPL10007', channel: 'APP/小程序', validPeriod: '领取后30天有效' },
    周末专享券: { faceValue: '9折', threshold: '5元', templateId: 'TPL10008', channel: '全渠道', validPeriod: '每周五~周日' },
    生鲜满减券: { faceValue: '12元', threshold: '5元', templateId: 'TPL10009', channel: '全渠道', validPeriod: '2026-04-01~10-31' }
  };

  var SEED = [
    {
      id: 'LC20260803001',
      userId: 'U10001',
      nickname: '小程序用户A',
      phone: '138****2211',
      couponName: '满50减5券',
      type: COUPON_TYPE,
      faceValue: '5元',
      threshold: '50元',
      templateId: 'TPL10001',
      collectAt: '2026-08-03 20:15:08',
      collectMethod: COLLECT_METHOD_LIVE,
      activityId: 'sess-001',
      status: '未使用',
      remark: '—',
      channel: '全渠道',
      validPeriod: '领取后7天有效',
      orderNos: []
    },
    {
      id: 'LC20260722001',
      userId: 'U10001',
      nickname: '小程序用户A',
      phone: '138****2211',
      couponName: '生鲜满减券',
      type: COUPON_TYPE,
      faceValue: '12元',
      threshold: '5元',
      templateId: 'TPL10009',
      collectAt: '2026-07-22 19:40:11',
      collectMethod: COLLECT_METHOD_BAG,
      activityId: 'tpl-b1',
      status: '已使用',
      remark: '—',
      channel: '全渠道',
      validPeriod: '2026-04-01~10-31',
      orderNos: ['ORD-3212689201598341']
    },
    {
      id: 'LC20260614001',
      userId: 'U10001',
      nickname: '小程序用户A',
      phone: '138****2211',
      couponName: '周末专享券',
      type: COUPON_TYPE,
      faceValue: '9折',
      threshold: '5元',
      templateId: 'TPL10008',
      collectAt: '2026-06-14 21:08:44',
      collectMethod: COLLECT_METHOD_SIGNIN,
      activityId: 'tpl-s1',
      status: '已过期',
      remark: '—',
      channel: '全渠道',
      validPeriod: '每周五~周日',
      orderNos: []
    },
    {
      id: 'MR20260801001',
      userId: 'U10001',
      nickname: '小程序用户A',
      phone: '138****2211',
      couponName: '满50减5券',
      type: COUPON_TYPE,
      faceValue: '5元',
      threshold: '50元',
      templateId: 'TPL10001',
      collectAt: '2026-08-01 10:22:11',
      collectMethod: COLLECT_METHOD_MANUAL,
      activityId: '—',
      status: '未使用',
      remark: '张三 / zhangsan',
      channel: '全渠道',
      validPeriod: '领取后7天有效',
      orderNos: []
    },
    {
      id: 'MR20260801002',
      userId: 'U10001',
      nickname: '小程序用户A',
      phone: '138****2211',
      couponName: '免运费券',
      type: COUPON_TYPE,
      faceValue: '免运费',
      threshold: '无门槛',
      templateId: 'TPL10006',
      collectAt: '2026-08-01 10:22:11',
      collectMethod: COLLECT_METHOD_MANUAL,
      activityId: '—',
      /* 核销后退货退回：券回到未使用，原核销订单仍保留 */
      status: '未使用',
      remark: '张三 / zhangsan',
      channel: '快递配送',
      validPeriod: '领取后3天有效',
      orderNos: ['ORD-3212689201598341']
    },
    {
      id: 'MR20260801003',
      userId: 'U10001',
      nickname: '小程序用户A',
      phone: '138****2211',
      couponName: '满100减15券',
      type: COUPON_TYPE,
      faceValue: '15元',
      threshold: '100元',
      templateId: 'TPL10002',
      collectAt: '2026-08-01 11:08:20',
      collectMethod: COLLECT_METHOD_MANUAL,
      activityId: '—',
      /* 核销 → 售后退回 → 再次核销：保留两条核销订单 */
      status: '已使用',
      remark: '张三 / zhangsan',
      channel: 'APP/小程序',
      validPeriod: '2026-01-01~12-31',
      orderNos: ['ORD-3212689201588561', 'ORD-3212689201599001']
    },
    {
      id: 'LC20260811001',
      userId: 'U10002',
      nickname: 'APP会员B',
      phone: '139****9033',
      couponName: '满50减5券',
      type: COUPON_TYPE,
      faceValue: '5元',
      threshold: '50元',
      templateId: 'TPL10001',
      collectAt: '2026-08-11 19:22:40',
      collectMethod: COLLECT_METHOD_LIVE,
      activityId: 'sess-001',
      status: '未使用',
      remark: '—',
      channel: '全渠道',
      validPeriod: '领取后7天有效',
      orderNos: []
    },
    {
      id: 'MR20260805001',
      userId: 'U10002',
      nickname: 'APP会员B',
      phone: '139****9033',
      couponName: '满100减15券',
      type: COUPON_TYPE,
      faceValue: '15元',
      threshold: '100元',
      templateId: 'TPL10002',
      collectAt: '2026-08-05 14:08:33',
      collectMethod: COLLECT_METHOD_MANUAL,
      activityId: '—',
      status: '未使用',
      remark: '李四 / lisi',
      channel: 'APP/小程序',
      validPeriod: '2026-01-01~12-31',
      orderNos: []
    },
    {
      id: 'MR20260812001',
      userId: 'U10002',
      nickname: 'APP会员B',
      phone: '139****9033',
      couponName: '周末专享券',
      type: COUPON_TYPE,
      faceValue: '9折',
      threshold: '5元',
      templateId: 'TPL10008',
      collectAt: '2026-08-12 11:03:44',
      collectMethod: COLLECT_METHOD_MANUAL,
      activityId: '—',
      status: '已使用',
      remark: '李四 / lisi',
      channel: '全渠道',
      validPeriod: '每周五~周日',
      orderNos: ['ORD-3212689201588561']
    },
    {
      id: 'LC20260812001',
      userId: 'U10004',
      nickname: '演示会员4',
      phone: '137****1004',
      couponName: '生鲜满减券',
      type: COUPON_TYPE,
      faceValue: '12元',
      threshold: '5元',
      templateId: 'TPL10009',
      collectAt: '2026-08-12 08:40:12',
      collectMethod: COLLECT_METHOD_BAG,
      activityId: 'tpl-pool-b1',
      status: '已使用',
      remark: '—',
      channel: '全渠道',
      validPeriod: '2026-04-01~10-31',
      orderNos: ['ORD-3212689201599003']
    },
    {
      id: 'MR20260808001',
      userId: 'U10004',
      nickname: '演示会员4',
      phone: '137****1004',
      couponName: '生日专属券',
      type: COUPON_TYPE,
      faceValue: '10元',
      threshold: '无门槛',
      templateId: 'TPL10005',
      collectAt: '2026-08-08 09:15:02',
      collectMethod: COLLECT_METHOD_MANUAL,
      activityId: '—',
      status: '已过期',
      remark: '演示运营 / admin',
      channel: '全渠道',
      validPeriod: '生日当月有效',
      orderNos: []
    },
    {
      id: 'MR20260810001',
      userId: 'U10006',
      nickname: '演示会员6',
      phone: '136****1006',
      couponName: '新人专享券',
      type: COUPON_TYPE,
      faceValue: '8元',
      threshold: '无门槛',
      templateId: 'TPL10007',
      collectAt: '2026-08-10 16:40:18',
      collectMethod: COLLECT_METHOD_MANUAL,
      activityId: '—',
      status: '未使用',
      remark: '王五 / wangwu',
      channel: 'APP/小程序',
      validPeriod: '领取后30天有效',
      orderNos: []
    },
    {
      id: 'LC20260811002',
      userId: 'U10008',
      nickname: '演示会员8',
      phone: '135****1008',
      couponName: '满200减30券',
      type: COUPON_TYPE,
      faceValue: '30元',
      threshold: '200元',
      templateId: 'TPL10003',
      collectAt: '2026-08-11 20:05:33',
      collectMethod: COLLECT_METHOD_SIGNIN,
      activityId: 'tpl-pool-s1',
      status: '未使用',
      remark: '—',
      channel: '全渠道',
      validPeriod: '2026-03-01~09-30',
      orderNos: []
    },
    {
      id: 'MR20260812002',
      userId: 'U10008',
      nickname: '演示会员8',
      phone: '135****1008',
      couponName: '生鲜满减券',
      type: COUPON_TYPE,
      faceValue: '12元',
      threshold: '5元',
      templateId: 'TPL10009',
      collectAt: '2026-08-12 18:21:09',
      collectMethod: COLLECT_METHOD_MANUAL,
      activityId: '—',
      status: '未使用',
      remark: '演示运营 / admin',
      channel: '全渠道',
      validPeriod: '2026-04-01~10-31',
      orderNos: []
    }
  ];

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function pad3(n) {
    var s = String(n);
    while (s.length < 3) s = '0' + s;
    return s;
  }

  function nowText() {
    var d = new Date();
    return (
      d.getFullYear() +
      '-' +
      pad(d.getMonth() + 1) +
      '-' +
      pad(d.getDate()) +
      ' ' +
      pad(d.getHours()) +
      ':' +
      pad(d.getMinutes()) +
      ':' +
      pad(d.getSeconds())
    );
  }

  function normalizeOrderNos(row) {
    var out = [];
    function push(v) {
      var s = String(v || '').trim();
      if (!s || s === '—') return;
      if (out.indexOf(s) === -1) out.push(s);
    }
    if (!row) return out;
    if (Array.isArray(row.orderNos)) row.orderNos.forEach(push);
    else if (row.orderNo) push(row.orderNo);
    return out;
  }

  function formatOrderNos(row) {
    var nos = Array.isArray(row) ? normalizeOrderNos({ orderNos: row }) : normalizeOrderNos(row);
    return nos.length ? nos.join('\n') : '—';
  }

  function formatOrderNosHtml(row) {
    var nos = Array.isArray(row) ? normalizeOrderNos({ orderNos: row }) : normalizeOrderNos(row);
    if (!nos.length) return '—';
    return nos
      .map(function (no) {
        return String(no)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      })
      .join('<br>');
  }

  function normalizeCouponStatus(st) {
    var s = String(st || '').trim();
    if (!s || s === '待使用') return '未使用';
    return s;
  }

  function normalizeCollectMethod(method) {
    var s = String(method || '').trim();
    if (s === '后台手工发券') return COLLECT_METHOD_MANUAL;
    if (
      s === COLLECT_METHOD_LIVE ||
      s === COLLECT_METHOD_BAG ||
      s === COLLECT_METHOD_SIGNIN ||
      s === COLLECT_METHOD_MANUAL
    ) {
      return s;
    }
    return COLLECT_METHOD_MANUAL;
  }

  function defaultActivityId(method) {
    if (method === COLLECT_METHOD_LIVE) return 'sess-001';
    if (method === COLLECT_METHOD_BAG) return 'tpl-b1';
    if (method === COLLECT_METHOD_SIGNIN) return 'tpl-s1';
    return '';
  }

  function normalizeActivityId(method, activityId) {
    if (method === COLLECT_METHOD_MANUAL) return '';
    var id = String(activityId || '').trim();
    if (!id || id === '—') return defaultActivityId(method);
    return id;
  }

  /* 直播场次ID / 福袋模板ID / 签到模板ID；后台人工发券为空 */
  function formatActivityId(row) {
    var method = normalizeCollectMethod(row && row.collectMethod);
    if (method === COLLECT_METHOD_MANUAL) return '';
    var id = String((row && row.activityId) || '').trim();
    if (!id || id === '—') return '';
    return id;
  }

  function getActivityFilterMeta(method) {
    var key = String(method || '').trim();
    if (!key || key === COLLECT_METHOD_MANUAL) return null;
    return ACTIVITY_FILTER_META[key] || null;
  }

  function listActivityFilterIds(method) {
    var meta = getActivityFilterMeta(method);
    if (!meta) return [];
    var seen = {};
    var ids = [];
    function push(id) {
      var s = String(id || '').trim();
      if (!s || s === '—' || seen[s]) return;
      seen[s] = true;
      ids.push(s);
    }
    (meta.ids || []).forEach(push);
    try {
      loadList().forEach(function (row) {
        if (normalizeCollectMethod(row.collectMethod) !== normalizeCollectMethod(method)) return;
        push(formatActivityId(row));
      });
    } catch (e) { /* ignore */ }
    return ids;
  }

  function fillActivityFilterSelect(selectEl, method) {
    if (!selectEl) return null;
    var meta = getActivityFilterMeta(method);
    while (selectEl.firstChild) selectEl.removeChild(selectEl.firstChild);
    var all = document.createElement('option');
    all.value = '';
    all.textContent = '全部';
    selectEl.appendChild(all);
    if (!meta) {
      selectEl.value = '';
      return null;
    }
    listActivityFilterIds(method).forEach(function (id) {
      var o = document.createElement('option');
      o.value = id;
      o.textContent = id;
      selectEl.appendChild(o);
    });
    selectEl.value = '';
    return meta;
  }

  function normalizeRow(row) {
    if (!row || typeof row !== 'object') return row;
    var meta = COUPON_META[row.couponName] || {};
    var method = normalizeCollectMethod(row.collectMethod);
    return {
      id: row.id,
      userId: row.userId,
      nickname: row.nickname,
      phone: row.phone,
      couponName: row.couponName,
      type: row.type || COUPON_TYPE,
      faceValue: row.faceValue || meta.faceValue || '—',
      threshold: row.threshold || meta.threshold || '—',
      templateId: row.templateId || meta.templateId || 'TPL00000',
      collectAt: row.collectAt,
      collectMethod: method,
      activityId: normalizeActivityId(method, row.activityId),
      status: normalizeCouponStatus(row.status),
      remark: row.remark || '—',
      channel: row.channel || meta.channel || '全渠道',
      validPeriod: row.validPeriod || meta.validPeriod || '—',
      orderNos: normalizeOrderNos(row)
    };
  }

  function loadList() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        saveList(SEED);
        return SEED.slice().map(normalizeRow);
      }
      var parsed = JSON.parse(raw);
      var source = Array.isArray(parsed) ? parsed : SEED.slice();
      var hadLegacy = source.some(function (row) {
        return row && String(row.status || '') === '待使用';
      });
      var list = source.map(normalizeRow);
      if (hadLegacy) saveList(list);
      return list;
    } catch (e) {
      return SEED.slice().map(normalizeRow);
    }
  }

  function saveList(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list || []));
    } catch (e) { /* ignore */ }
  }

  function couponMeta(coupon) {
    var name = (coupon && (coupon.label || coupon.value || coupon.couponName)) || '';
    var mapped = COUPON_META[name] || {};
    var amount = coupon && coupon.amount ? String(coupon.amount) : '';
    var faceValue = mapped.faceValue;
    if (!faceValue && amount) {
      faceValue = amount.indexOf('减') === 0 ? amount.replace(/^减/, '') : amount;
    }
    return {
      couponName: name || '—',
      type: COUPON_TYPE,
      faceValue: faceValue || (coupon && coupon.amount) || '—',
      threshold: (coupon && coupon.threshold) || mapped.threshold || '—',
      templateId: mapped.templateId || 'TPL00000',
      channel: (coupon && coupon.channel) || mapped.channel || '全渠道',
      validPeriod: (coupon && coupon.validPeriod) || mapped.validPeriod || '—'
    };
  }

  function formatRemark(operatorName, operatorAccount) {
    var name = String(operatorName || '').trim() || '演示运营';
    var account = String(operatorAccount || '').trim() || 'admin';
    return name + ' / ' + account;
  }

  function nextId(list, at, prefixHead) {
    var d = at ? new Date(String(at).replace(/-/g, '/')) : new Date();
    if (isNaN(d.getTime())) d = new Date();
    var head = prefixHead || 'MR';
    var prefix = head + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
    var max = 0;
    (list || []).forEach(function (row) {
      if (!row || !row.id) return;
      if (String(row.id).indexOf(prefix) !== 0) return;
      var n = Number(String(row.id).slice(prefix.length));
      if (!isNaN(n) && n > max) max = n;
    });
    return prefix + pad3(max + 1);
  }

  function filterList(filter) {
    var list = loadList();
    var f = filter || {};
    var userId = String(f.userId || '').trim().toLowerCase();
    var nickname = String(f.nickname || '').trim().toLowerCase();
    var phone = String(f.phone || '').trim();
    var status = String(f.status || '').trim();
    var collectMethod = String(f.collectMethod || '').trim();
    var activityId = String(f.activityId || '').trim();
    return list.filter(function (row) {
      if (userId && String(row.userId || '').toLowerCase().indexOf(userId) === -1) return false;
      if (nickname && String(row.nickname || '').toLowerCase().indexOf(nickname) === -1) return false;
      if (phone && String(row.phone || '').indexOf(phone) === -1) return false;
      if (status && String(row.status || '') !== status) return false;
      if (collectMethod && String(row.collectMethod || '') !== collectMethod) return false;
      if (collectMethod && collectMethod !== COLLECT_METHOD_MANUAL && activityId && String(row.activityId || '') !== activityId) {
        return false;
      }
      return true;
    });
  }

  /**
   * 会员管理人工发券后写入记录；qty 张券写 qty 条。
   */
  function addManualIssue(opts) {
    opts = opts || {};
    var qty = Math.max(1, Number(opts.qty) || 1);
    var meta = couponMeta(opts.coupon || {
      label: opts.couponName,
      amount: opts.faceValue,
      threshold: opts.threshold
    });
    var collectAt = opts.collectAt || nowText();
    var remark = formatRemark(opts.operatorName, opts.operatorAccount);
    var list = loadList();
    var added = [];
    for (var i = 0; i < qty; i++) {
      var row = {
        id: nextId(list.concat(added), collectAt, 'MR'),
        userId: String(opts.userId || '—'),
        nickname: String(opts.nickname || '—'),
        phone: String(opts.phone || '—'),
        couponName: meta.couponName,
        type: meta.type,
        faceValue: meta.faceValue,
        threshold: meta.threshold,
        templateId: meta.templateId,
        collectAt: collectAt,
        collectMethod: COLLECT_METHOD_MANUAL,
        activityId: '',
        status: normalizeCouponStatus(opts.status),
        remark: remark,
        channel: meta.channel || (opts.coupon && opts.coupon.channel) || '全渠道',
        validPeriod: meta.validPeriod || (opts.coupon && opts.coupon.validPeriod) || '—',
        orderNos: normalizeOrderNos(opts)
      };
      added.push(row);
    }
    saveList(added.concat(list));
    return added;
  }

  global.MdmMallMarketingRecordStore = {
    COLLECT_METHOD: COLLECT_METHOD_MANUAL,
    COLLECT_METHOD_MANUAL: COLLECT_METHOD_MANUAL,
    COLLECT_METHOD_LIVE: COLLECT_METHOD_LIVE,
    COLLECT_METHOD_BAG: COLLECT_METHOD_BAG,
    COLLECT_METHOD_SIGNIN: COLLECT_METHOD_SIGNIN,
    SCENE_OPTIONS: SCENE_OPTIONS,
    loadList: loadList,
    saveList: saveList,
    filterList: filterList,
    addManualIssue: addManualIssue,
    formatRemark: formatRemark,
    formatOrderNos: formatOrderNos,
    formatOrderNosHtml: formatOrderNosHtml,
    formatActivityId: formatActivityId,
    getActivityFilterMeta: getActivityFilterMeta,
    listActivityFilterIds: listActivityFilterIds,
    fillActivityFilterSelect: fillActivityFilterSelect,
    normalizeCollectMethod: normalizeCollectMethod,
    normalizeOrderNos: normalizeOrderNos,
    couponMeta: couponMeta
  };
})(window);
