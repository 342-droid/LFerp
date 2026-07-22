/**
 * 会员分群 — 筛选人群弹窗
 * 用法：CrmAudienceFilter.open({ conditions, logic, onConfirm })
 */
(function (global) {
  'use strict';

  var NUMBER_OPS = ['gte', 'lte', 'between'];

  var CATEGORIES = [
    { id: 'basic', name: '基础资料', desc: '按性别、年龄、注册时间、等级、成长值、地区、门店、来源等筛选' },
    { id: 'tag', name: '会员标签', desc: '按标签组/标签值圈选会员，支持包含任意或全部匹配' },
    { id: 'consume', name: '消费', desc: '按累计消费/售后、首次与最近消费、购买与加购商品等筛选' },
    { id: 'action', name: '行动', desc: '按直播观看、浏览、加购、领券、登录等行为筛选' },
    { id: 'preference', name: '偏好', desc: '按浏览类目、价格带、渠道、时段及购买时段偏好筛选' }
  ];

  var TAG_GROUPS = [
    {
      id: 'TG10001',
      name: '活跃度',
      rule: '单选',
      tags: [
        { id: 'TV10001', name: '高活跃' },
        { id: 'TV10002', name: '中活跃' },
        { id: 'TV10003', name: '低活跃' }
      ]
    },
    {
      id: 'TG10002',
      name: '消费偏好',
      rule: '多选',
      tags: [
        { id: 'TV10004', name: '储值' },
        { id: 'TV10005', name: '复购' }
      ]
    },
    {
      id: 'TG10003',
      name: '生命周期',
      rule: '单选',
      tags: [
        { id: 'TV10006', name: '新客' },
        { id: 'TV10007', name: '老客' },
        { id: 'TV10008', name: '沉睡' }
      ]
    }
  ];

  var DEMO_PRODUCTS = [
    { id: 'P10001', name: '冷冻巴沙鱼柳 500g' },
    { id: 'P10002', name: '鲜活大闸蟹 2.0两' },
    { id: 'P10003', name: '挪威三文鱼刺身' },
    { id: 'P10004', name: '精选牛腱子 1kg' },
    { id: 'P10005', name: '进口车厘子 JJ级' },
    { id: 'P10006', name: '有机西兰花 400g' },
    { id: 'P10007', name: '手打虾滑 250g' },
    { id: 'P10008', name: '冻榴莲肉 300g' }
  ];

  var DEMO_CATEGORIES = [
    { id: 'seafood', name: '海鲜水产' },
    { id: 'meat', name: '肉禽蛋' },
    { id: 'fruit', name: '水果' },
    { id: 'veg', name: '蔬菜' },
    { id: 'frozen', name: '冷冻食品' },
    { id: 'snack', name: '休闲零食' }
  ];

  var FIELDS = {
    basic: [
      {
        id: 'gender',
        name: '性别',
        type: 'enum',
        multiple: true,
        options: [
          { value: 'male', label: '男' },
          { value: 'female', label: '女' },
          { value: 'unknown', label: '未知' }
        ]
      },
      { id: 'age', name: '年龄', type: 'number', unit: '岁', operators: NUMBER_OPS, hint: '可自由填写数字区间' },
      { id: 'register_time', name: '注册时间', type: 'datetime', hint: '可选年月日时分秒区间' },
      {
        id: 'member_level',
        name: '会员等级',
        type: 'enum',
        multiple: true,
        options: [
          { value: 'L1', label: '普通会员' },
          { value: 'L2', label: '银卡' },
          { value: 'L3', label: '金卡' },
          { value: 'L4', label: '黑金' }
        ]
      },
      { id: 'growth_value', name: '成长值', type: 'number', unit: '分', operators: NUMBER_OPS },
      {
        id: 'region',
        name: '所在地区',
        type: 'region_picker',
        hint: '可多选省市区，支持包含或排除'
      },
      {
        id: 'bind_store',
        name: '绑定门店',
        type: 'store_picker',
        hint: '支持搜索与多选'
      },
      {
        id: 'member_source',
        name: '会员来源',
        type: 'enum',
        multiple: true,
        options: [
          { value: 'app', label: 'APP 注册' },
          { value: 'mini', label: '小程序' },
          { value: 'h5', label: 'H5' },
          { value: 'store', label: '门店导购' },
          { value: 'activity', label: '活动拉新' },
          { value: 'import', label: '批量导入' }
        ]
      }
    ],
    tag: [
      { id: 'member_tag', name: '会员标签', type: 'tag' }
    ],
    consume: [
      {
        id: 'total_amount',
        name: '累计消费金额',
        type: 'number',
        unit: '元',
        operators: NUMBER_OPS,
        tip: '为累计支付订单金额，不扣除售后金额'
      },
      {
        id: 'total_count',
        name: '累计消费次数',
        type: 'number',
        unit: '次',
        operators: NUMBER_OPS,
        tip: '为累计支付订单次数，不扣除售后次数'
      },
      {
        id: 'aftersale_amount',
        name: '累计售后金额',
        type: 'number',
        unit: '元',
        operators: NUMBER_OPS,
        tip: '为售后完成的实退金额'
      },
      {
        id: 'aftersale_count',
        name: '累计售后次数',
        type: 'number',
        unit: '次',
        operators: NUMBER_OPS,
        tip: '为售后完成的次数'
      },
      {
        id: 'avg_order_amount',
        name: '客单价',
        type: 'number',
        unit: '元',
        operators: NUMBER_OPS,
        tip: '为累计消费金额÷累计消费次数'
      },
      { id: 'last_pay_days', name: '最近消费距今', type: 'number', unit: '天', operators: NUMBER_OPS },
      {
        id: 'first_pay',
        name: '首次消费',
        type: 'scoped_event',
        hint: '可筛选支付时间、支付金额、支付件数，至少启用一项',
        metrics: [
          { id: 'pay_time', name: '支付时间', type: 'datetime' },
          { id: 'pay_amount', name: '支付金额', type: 'number', unit: '元', operators: NUMBER_OPS },
          { id: 'pay_qty', name: '支付件数', type: 'number', unit: '件', operators: NUMBER_OPS }
        ]
      },
      {
        id: 'buy_product',
        name: '购买商品',
        type: 'scoped_event',
        hasTimeRange: true,
        target: 'product_or_category',
        hint: '指定时间内，按指定商品或商品类目筛选购买次数、购买件数',
        metrics: [
          { id: 'buy_count', name: '购买次数', type: 'number', unit: '次', operators: NUMBER_OPS },
          { id: 'buy_qty', name: '购买件数', type: 'number', unit: '件', operators: NUMBER_OPS }
        ]
      },
      {
        id: 'cart_product',
        name: '加购商品',
        type: 'scoped_event',
        hasTimeRange: true,
        target: 'product',
        hint: '指定时间内，按指定商品筛选加购次数、加购件数',
        metrics: [
          { id: 'cart_count', name: '加购次数', type: 'number', unit: '次', operators: NUMBER_OPS },
          { id: 'cart_qty', name: '加购件数', type: 'number', unit: '件', operators: NUMBER_OPS }
        ]
      },
      {
        id: 'last_pay',
        name: '最近一笔消费',
        type: 'scoped_event',
        hint: '可筛选支付时间、支付金额、支付件数，至少启用一项',
        metrics: [
          { id: 'pay_time', name: '支付时间', type: 'datetime' },
          { id: 'pay_amount', name: '支付金额', type: 'number', unit: '元', operators: NUMBER_OPS },
          { id: 'pay_qty', name: '支付件数', type: 'number', unit: '件', operators: NUMBER_OPS }
        ]
      }
    ],
    action: [
      { id: 'live_watch_count', name: '累计观看直播次数', type: 'number', unit: '次', operators: NUMBER_OPS },
      { id: 'live_session_count', name: '累计观看直播场次次数', type: 'number', unit: '场', operators: NUMBER_OPS },
      {
        id: 'live_watch_no_order',
        name: '最近观看直播未下单',
        type: 'compound',
        tip: '为晚于最近支付时间的观看直播数据',
        hint: '可按次数、场次数、观看时长组合筛选，至少填写一项',
        metrics: [
          { id: 'count', name: '次数', unit: '次', operators: NUMBER_OPS },
          { id: 'session', name: '场次数', unit: '场', operators: NUMBER_OPS },
          { id: 'duration', name: '观看时长', unit: '分钟', operators: NUMBER_OPS }
        ]
      },
      {
        id: 'browse_no_buy',
        name: '浏览未下单',
        type: 'compound',
        tip: '为晚于最近支付时间的第一条浏览商品详情记录为开始时间',
        hint: '可按次数、距今时长组合筛选，至少填写一项',
        metrics: [
          { id: 'count', name: '次数', unit: '次', operators: NUMBER_OPS },
          { id: 'days', name: '距今时长', unit: '天', operators: NUMBER_OPS }
        ]
      },
      {
        id: 'cart_no_pay',
        name: '加购未支付',
        type: 'compound',
        tip: '为晚于最近支付时间的第一条加购记录为开始时间',
        hint: '可按次数、距今时长组合筛选，至少填写一项',
        metrics: [
          { id: 'count', name: '次数', unit: '次', operators: NUMBER_OPS },
          { id: 'days', name: '距今时长', unit: '天', operators: NUMBER_OPS }
        ]
      },
      {
        id: 'coupon_unused',
        name: '领券未使用',
        type: 'enum',
        multiple: false,
        options: [
          { value: 'any', label: '有未使用券' },
          { value: 'expiring_3d', label: '3 天内到期' },
          { value: 'expiring_7d', label: '7 天内到期' }
        ]
      },
      { id: 'last_login_days', name: '最近登录距今', type: 'number', unit: '天', operators: NUMBER_OPS },
      { id: 'joined_activity', name: '参与活动', type: 'pending', hint: '该能力待开发，暂不可配置' }
    ],
    preference: [
      {
        id: 'browse_category',
        name: '浏览商品类目',
        type: 'enum',
        multiple: true,
        tip: '为基础商品库里的类目',
        options: [
          { value: 'seafood', label: '海鲜水产' },
          { value: 'meat', label: '肉禽蛋' },
          { value: 'fruit', label: '水果' },
          { value: 'veg', label: '蔬菜' },
          { value: 'frozen', label: '冷冻食品' },
          { value: 'snack', label: '休闲零食' }
        ]
      },
      {
        id: 'browse_price_band',
        name: '浏览价格带偏好',
        type: 'number',
        unit: '元',
        operators: NUMBER_OPS,
        tip: '为浏览商品时的价格，多规格取最低的价格',
        hint: '设置方式同累计消费金额'
      },
      {
        id: 'browse_channel',
        name: '浏览渠道偏好',
        type: 'enum',
        multiple: true,
        options: [
          { value: 'app', label: 'APP' },
          { value: 'mini', label: '小程序' },
          { value: 'h5', label: 'H5' },
          { value: 'store', label: '到店' }
        ]
      },
      {
        id: 'browse_period',
        name: '浏览时段偏好',
        type: 'number',
        unit: '时',
        operators: NUMBER_OPS,
        hint: '按小时 0–23 设置，方式同累计消费金额'
      },
      {
        id: 'buy_period',
        name: '购买时段偏好',
        type: 'number',
        unit: '时',
        operators: NUMBER_OPS,
        hint: '按小时 0–23 设置，方式同累计消费金额'
      }
    ]
  };

  var OP_LABELS = {
    gte: '大于等于',
    lte: '小于等于',
    eq: '等于',
    between: '介于'
  };

  var MATCH_LABELS = {
    any: '包含任意',
    all: '包含全部',
    none: '不包含'
  };

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function tipIcon(tip) {
    if (!tip) return '';
    return '<span class="crm-af__tip" title="' + escapeHtml(tip) + '" aria-label="' + escapeHtml(tip) + '">?</span>';
  }

  function fieldTitleHtml(field) {
    return escapeHtml(field.name) + tipIcon(field.tip);
  }

  function uid() {
    return 'c' + Date.now().toString(36) + Math.floor(Math.random() * 1000);
  }

  function findField(fieldId) {
    var cats = Object.keys(FIELDS);
    for (var i = 0; i < cats.length; i++) {
      var list = FIELDS[cats[i]];
      for (var j = 0; j < list.length; j++) {
        if (list[j].id === fieldId) {
          return { categoryId: cats[i], field: list[j] };
        }
      }
    }
    return null;
  }

  function findCategory(id) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].id === id) return CATEGORIES[i];
    }
    return CATEGORIES[0];
  }

  function cloneConditions(list) {
    return JSON.parse(JSON.stringify(list || []));
  }

  function formatNumber(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function toDatetimeLocal(value) {
    if (!value) return '';
    return String(value).replace(' ', 'T').slice(0, 19);
  }

  function fromDatetimeLocal(value) {
    if (!value) return '';
    var v = String(value).replace('T', ' ');
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(v)) v += ':00';
    return v;
  }

  function formatNumberRule(operator, value, min, max, unit) {
    var u = unit || '';
    if (operator === 'between') {
      return '介于 ' + (min == null || min === '' ? '?' : min) + ' ~ ' + (max == null || max === '' ? '?' : max) + u;
    }
    return (OP_LABELS[operator] || operator) + ' ' + (value == null || value === '' ? '?' : value) + u;
  }

  function estimateCount(conditions, logic) {
    if (!conditions.length) return 128560;
    var base = 128560;
    var factor = logic === 'or' ? 0.72 : 0.38;
    for (var i = 0; i < conditions.length; i++) {
      factor *= logic === 'or' ? 0.92 : 0.78;
    }
    return Math.max(12, Math.round(base * factor * (0.85 + (conditions.length % 5) * 0.03)));
  }

  function summarizeCondition(cond) {
    var found = findField(cond.fieldId);
    if (!found) return { name: cond.fieldId, text: '', categoryName: '' };
    var field = found.field;
    var cat = findCategory(found.categoryId);
    var text = '';

    if (field.type === 'tag') {
      var names = (cond.values || []).map(function (id) {
        for (var g = 0; g < TAG_GROUPS.length; g++) {
          for (var t = 0; t < TAG_GROUPS[g].tags.length; t++) {
            if (TAG_GROUPS[g].tags[t].id === id) return TAG_GROUPS[g].tags[t].name;
          }
        }
        return id;
      });
      text = (MATCH_LABELS[cond.match] || '包含任意') + '：' + names.join('、');
    } else if (field.type === 'number') {
      text = formatNumberRule(cond.operator, cond.value, cond.min, cond.max, field.unit);
    } else if (field.type === 'datetime') {
      text = (cond.start || '?') + ' 至 ' + (cond.end || '?');
    } else if (field.type === 'enum') {
      var optMap = {};
      (field.options || []).forEach(function (o) { optMap[o.value] = o.label; });
      var labels = (cond.values || []).map(function (v) { return optMap[v] || v; });
      text = (field.multiple ? '包含：' : '') + labels.join('、');
    } else if (field.type === 'region_picker') {
      var modeText = cond.mode === 'exclude' ? '排除' : '包含';
      var regionLabels = (cond.labels && cond.labels.length)
        ? cond.labels
        : Object.keys(cond.selected || {});
      text = modeText + '：' + (regionLabels.length ? regionLabels.join('、') : '未选择');
    } else if (field.type === 'store_picker') {
      var storeLabels = (cond.labels && cond.labels.length)
        ? cond.labels
        : Object.keys(cond.selected || {});
      text = '已选 ' + storeLabels.length + ' 家：' + storeLabels.slice(0, 3).join('、') +
        (storeLabels.length > 3 ? '…' : '');
    } else if (field.type === 'compound') {
      var metricMap = {};
      (field.metrics || []).forEach(function (m) { metricMap[m.id] = m; });
      text = (cond.metrics || []).map(function (m) {
        var meta = metricMap[m.id] || { name: m.id, unit: '' };
        return meta.name + ' ' + formatNumberRule(m.operator, m.value, m.min, m.max, meta.unit);
      }).join('；');
    } else if (field.type === 'scoped_event') {
      var parts = [];
      if (field.hasTimeRange) {
        parts.push('时间 ' + (cond.timeStart || '?') + ' 至 ' + (cond.timeEnd || '?'));
      }
      if (field.target === 'product' || (field.target === 'product_or_category' && cond.targetMode !== 'category')) {
        var pNames = (cond.products || []).map(function (p) { return p.name || p.id; });
        parts.push('商品：' + (pNames.length ? pNames.join('、') : '未选'));
      } else if (field.target === 'product_or_category' && cond.targetMode === 'category') {
        var cNames = (cond.categories || []).map(function (c) { return c.name || c.id; });
        parts.push('类目：' + (cNames.length ? cNames.join('、') : '未选'));
      }
      var sMetricMap = {};
      (field.metrics || []).forEach(function (m) { sMetricMap[m.id] = m; });
      (cond.metrics || []).forEach(function (m) {
        var meta = sMetricMap[m.id] || { name: m.id, unit: '', type: m.type };
        if (m.type === 'datetime' || meta.type === 'datetime') {
          parts.push(meta.name + ' ' + (m.start || '?') + ' 至 ' + (m.end || '?'));
        } else {
          parts.push(meta.name + ' ' + formatNumberRule(m.operator, m.value, m.min, m.max, meta.unit));
        }
      });
      text = parts.join('；');
    } else if (field.type === 'pending') {
      text = '待开发';
    }

    return {
      categoryName: cat.name,
      name: field.name,
      text: text
    };
  }

  function validateNumberDraft(draft, label) {
    if (draft.operator === 'between') {
      if (draft.min === '' || draft.min == null || draft.max === '' || draft.max == null) {
        return '请填写完整' + (label || '') + '区间';
      }
      if (Number(draft.min) > Number(draft.max)) return (label || '最小值') + '不能大于最大值';
    } else if (draft.value === '' || draft.value == null) {
      return '请填写' + (label || '数值');
    }
    return '';
  }

  function validateDraft(field, draft) {
    if (field.type === 'pending') return '「参与活动」待开发，暂不可添加';
    if (field.type === 'tag') {
      if (!draft.values || !draft.values.length) return '请至少选择一个标签';
      return '';
    }
    if (field.type === 'number') return validateNumberDraft(draft);
    if (field.type === 'datetime') {
      if (!draft.start || !draft.end) return '请选择完整的注册时间区间';
      if (draft.start > draft.end) return '开始时间不能晚于结束时间';
      return '';
    }
    if (field.type === 'enum') {
      if (!draft.values || !draft.values.length) return '请至少选择一项';
      return '';
    }
    if (field.type === 'region_picker') {
      if (!draft.selected || !Object.keys(draft.selected).length) return '请选择所在地区';
      return '';
    }
    if (field.type === 'store_picker') {
      if (!draft.selected || !Object.keys(draft.selected).length) return '请选择绑定门店';
      return '';
    }
    if (field.type === 'compound') {
      var enabled = (draft.metrics || []).filter(function (m) { return m.enabled; });
      if (!enabled.length) return '请至少启用并填写一项指标';
      for (var i = 0; i < enabled.length; i++) {
        var err = validateNumberDraft(enabled[i], enabled[i].name || '');
        if (err) return err;
      }
      return '';
    }
    if (field.type === 'scoped_event') {
      if (field.hasTimeRange) {
        if (!draft.timeStart || !draft.timeEnd) return '请选择完整的指定时间区间';
        if (draft.timeStart > draft.timeEnd) return '开始时间不能晚于结束时间';
      }
      if (field.target === 'product') {
        if (!draft.products || !draft.products.length) return '请选择指定商品';
      } else if (field.target === 'product_or_category') {
        if (draft.targetMode === 'category') {
          if (!draft.categories || !draft.categories.length) return '请选择指定商品类目';
        } else if (!draft.products || !draft.products.length) {
          return '请选择指定商品';
        }
      }
      var enabledMetrics = (draft.metrics || []).filter(function (m) { return m.enabled; });
      if (!enabledMetrics.length) return '请至少启用并填写一项指标';
      for (var j = 0; j < enabledMetrics.length; j++) {
        var metric = enabledMetrics[j];
        if (metric.type === 'datetime') {
          if (!metric.start || !metric.end) return '请填写完整' + (metric.name || '') + '区间';
          if (metric.start > metric.end) return (metric.name || '开始时间') + '不能晚于结束时间';
        } else {
          var mErr = validateNumberDraft(metric, metric.name || '');
          if (mErr) return mErr;
        }
      }
      return '';
    }
    return '';
  }

  function draftToCondition(field, categoryId, draft) {
    var cond = {
      id: uid(),
      categoryId: categoryId,
      fieldId: field.id,
      type: field.type
    };
    if (field.type === 'tag') {
      cond.match = draft.match || 'any';
      cond.values = draft.values.slice();
    } else if (field.type === 'number') {
      cond.operator = draft.operator;
      if (draft.operator === 'between') {
        cond.min = Number(draft.min);
        cond.max = Number(draft.max);
      } else {
        cond.value = Number(draft.value);
      }
    } else if (field.type === 'datetime') {
      cond.start = draft.start;
      cond.end = draft.end;
    } else if (field.type === 'enum') {
      cond.values = draft.values.slice();
    } else if (field.type === 'region_picker') {
      cond.mode = draft.mode === 'exclude' ? 'exclude' : 'include';
      cond.selected = JSON.parse(JSON.stringify(draft.selected || {}));
      cond.labels = (draft.labels || []).slice();
    } else if (field.type === 'store_picker') {
      cond.selected = JSON.parse(JSON.stringify(draft.selected || {}));
      cond.labels = (draft.labels || []).slice();
    } else if (field.type === 'compound') {
      cond.metrics = (draft.metrics || []).filter(function (m) { return m.enabled; }).map(function (m) {
        var item = { id: m.id, operator: m.operator };
        if (m.operator === 'between') {
          item.min = Number(m.min);
          item.max = Number(m.max);
        } else {
          item.value = Number(m.value);
        }
        return item;
      });
    } else if (field.type === 'scoped_event') {
      if (field.hasTimeRange) {
        cond.timeStart = draft.timeStart;
        cond.timeEnd = draft.timeEnd;
      }
      if (field.target === 'product') {
        cond.targetMode = 'product';
        cond.products = (draft.products || []).map(function (p) {
          return { id: p.id, name: p.name };
        });
      } else if (field.target === 'product_or_category') {
        cond.targetMode = draft.targetMode === 'category' ? 'category' : 'product';
        if (cond.targetMode === 'category') {
          cond.categories = (draft.categories || []).map(function (c) {
            return { id: c.id, name: c.name };
          });
          cond.products = [];
        } else {
          cond.products = (draft.products || []).map(function (p) {
            return { id: p.id, name: p.name };
          });
          cond.categories = [];
        }
      }
      cond.metrics = (draft.metrics || []).filter(function (m) { return m.enabled; }).map(function (m) {
        if (m.type === 'datetime') {
          return { id: m.id, type: 'datetime', start: m.start, end: m.end };
        }
        var item = { id: m.id, type: 'number', operator: m.operator };
        if (m.operator === 'between') {
          item.min = Number(m.min);
          item.max = Number(m.max);
        } else {
          item.value = Number(m.value);
        }
        return item;
      });
    }
    return cond;
  }

  function toast(msg, type) {
    if (typeof showToast === 'function') {
      showToast(msg, type || 'warning');
      return;
    }
    window.alert(msg);
  }

  function initNumberDraft(operators) {
    return {
      operator: (operators && operators[0]) || 'gte',
      value: '',
      min: '',
      max: ''
    };
  }

  function initScopedMetricDraft(meta) {
    if (meta.type === 'datetime') {
      return {
        id: meta.id,
        name: meta.name,
        type: 'datetime',
        enabled: false,
        start: '',
        end: ''
      };
    }
    return {
      id: meta.id,
      name: meta.name,
      type: 'number',
      enabled: false,
      operator: (meta.operators && meta.operators[0]) || 'gte',
      value: '',
      min: '',
      max: ''
    };
  }

  function initScopedEventDraft(field) {
    var draft = {
      metrics: (field.metrics || []).map(initScopedMetricDraft)
    };
    if (field.hasTimeRange) {
      draft.timeStart = '';
      draft.timeEnd = '';
    }
    if (field.target === 'product') {
      draft.targetMode = 'product';
      draft.products = [];
    } else if (field.target === 'product_or_category') {
      draft.targetMode = 'product';
      draft.products = [];
      draft.categories = [];
    }
    return draft;
  }

  function initDraftFromField(field) {
    if (!field) return null;
    if (field.type === 'tag') return { match: 'any', values: [] };
    if (field.type === 'number') return initNumberDraft(field.operators);
    if (field.type === 'datetime') return { start: '', end: '' };
    if (field.type === 'enum') return { values: [] };
    if (field.type === 'region_picker') return { mode: 'include', selected: {}, labels: [] };
    if (field.type === 'store_picker') return { selected: {}, labels: [] };
    if (field.type === 'compound') {
      return {
        metrics: (field.metrics || []).map(function (m) {
          return {
            id: m.id,
            name: m.name,
            enabled: false,
            operator: (m.operators && m.operators[0]) || 'gte',
            value: '',
            min: '',
            max: ''
          };
        })
      };
    }
    if (field.type === 'scoped_event') return initScopedEventDraft(field);
    if (field.type === 'pending') return {};
    return {};
  }

  function conditionToDraft(cond, field) {
    if (!cond || !field) return initDraftFromField(field);
    if (field.type === 'tag') {
      return { match: cond.match || 'any', values: (cond.values || []).slice() };
    }
    if (field.type === 'number') {
      return {
        operator: cond.operator || 'gte',
        value: cond.value != null ? String(cond.value) : '',
        min: cond.min != null ? String(cond.min) : '',
        max: cond.max != null ? String(cond.max) : ''
      };
    }
    if (field.type === 'datetime') {
      return { start: cond.start || '', end: cond.end || '' };
    }
    if (field.type === 'enum') {
      return { values: (cond.values || []).slice() };
    }
    if (field.type === 'region_picker') {
      return {
        mode: cond.mode === 'exclude' ? 'exclude' : 'include',
        selected: JSON.parse(JSON.stringify(cond.selected || {})),
        labels: (cond.labels || []).slice()
      };
    }
    if (field.type === 'store_picker') {
      return {
        selected: JSON.parse(JSON.stringify(cond.selected || {})),
        labels: (cond.labels || []).slice()
      };
    }
    if (field.type === 'compound') {
      var map = {};
      (cond.metrics || []).forEach(function (m) { map[m.id] = m; });
      return {
        metrics: (field.metrics || []).map(function (meta) {
          var cur = map[meta.id];
          if (!cur) {
            return {
              id: meta.id,
              name: meta.name,
              enabled: false,
              operator: (meta.operators && meta.operators[0]) || 'gte',
              value: '',
              min: '',
              max: ''
            };
          }
          return {
            id: meta.id,
            name: meta.name,
            enabled: true,
            operator: cur.operator || 'gte',
            value: cur.value != null ? String(cur.value) : '',
            min: cur.min != null ? String(cur.min) : '',
            max: cur.max != null ? String(cur.max) : ''
          };
        })
      };
    }
    if (field.type === 'scoped_event') {
      var metricMap = {};
      (cond.metrics || []).forEach(function (m) { metricMap[m.id] = m; });
      var draft = {
        metrics: (field.metrics || []).map(function (meta) {
          var cur = metricMap[meta.id];
          if (!cur) return initScopedMetricDraft(meta);
          if (meta.type === 'datetime') {
            return {
              id: meta.id,
              name: meta.name,
              type: 'datetime',
              enabled: true,
              start: cur.start || '',
              end: cur.end || ''
            };
          }
          return {
            id: meta.id,
            name: meta.name,
            type: 'number',
            enabled: true,
            operator: cur.operator || 'gte',
            value: cur.value != null ? String(cur.value) : '',
            min: cur.min != null ? String(cur.min) : '',
            max: cur.max != null ? String(cur.max) : ''
          };
        })
      };
      if (field.hasTimeRange) {
        draft.timeStart = cond.timeStart || '';
        draft.timeEnd = cond.timeEnd || '';
      }
      if (field.target === 'product') {
        draft.targetMode = 'product';
        draft.products = (cond.products || []).map(function (p) {
          return { id: p.id, name: p.name };
        });
      } else if (field.target === 'product_or_category') {
        draft.targetMode = cond.targetMode === 'category' ? 'category' : 'product';
        draft.products = (cond.products || []).map(function (p) {
          return { id: p.id, name: p.name };
        });
        draft.categories = (cond.categories || []).map(function (c) {
          return { id: c.id, name: c.name };
        });
      }
      return draft;
    }
    return initDraftFromField(field);
  }

  function findConditionByField(conditions, fieldId) {
    for (var i = 0; i < (conditions || []).length; i++) {
      if (conditions[i].fieldId === fieldId) return conditions[i];
    }
    return null;
  }

  function renderNumberValueInputs(draft, unit, opAttr, minAttr, maxAttr, valAttr) {
    if (draft.operator === 'between') {
      return (
        '<input class="crm-af__input" type="number" ' + minAttr + ' value="' + escapeHtml(draft.min) + '" placeholder="最小值">' +
        '<span class="crm-af__range-sep">至</span>' +
        '<input class="crm-af__input" type="number" ' + maxAttr + ' value="' + escapeHtml(draft.max) + '" placeholder="最大值">' +
        (unit ? '<span class="crm-af__unit">' + escapeHtml(unit) + '</span>' : '')
      );
    }
    return (
      '<input class="crm-af__input" type="number" ' + valAttr + ' value="' + escapeHtml(draft.value) + '" placeholder="请输入">' +
      (unit ? '<span class="crm-af__unit">' + escapeHtml(unit) + '</span>' : '')
    );
  }

  function renderOpSelect(operators, selected, attr) {
    return (
      '<select class="crm-af__select" ' + attr + '>' +
      (operators || NUMBER_OPS).map(function (op) {
        return '<option value="' + op + '"' + (selected === op ? ' selected' : '') + '>' + (OP_LABELS[op] || op) + '</option>';
      }).join('') +
      '</select>'
    );
  }

  function open(options) {
    options = options || {};
    var state = {
      categoryId: options.categoryId || 'basic',
      fieldId: null,
      logic: options.logic === 'or' ? 'or' : 'and',
      conditions: cloneConditions(options.conditions || []),
      draft: null
    };

    var firstFields = FIELDS[state.categoryId] || [];
    if (firstFields.length) {
      state.fieldId = firstFields[0].id;
      var existingFirst = findConditionByField(state.conditions, state.fieldId);
      state.draft = existingFirst
        ? conditionToDraft(existingFirst, firstFields[0])
        : initDraftFromField(firstFields[0]);
    }

    var existing = document.querySelector('[data-crm-audience-filter]');
    if (existing) existing.remove();

    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop crm-audience-filter-backdrop';
    backdrop.setAttribute('data-crm-audience-filter', '1');
    backdrop.innerHTML =
      '<div class="erp-modal crm-audience-filter-modal" role="dialog" aria-modal="true" aria-labelledby="crmAfTitle">' +
      '  <div class="erp-modal__header">' +
      '    <h2 class="erp-modal__title" id="crmAfTitle">筛选人群</h2>' +
      '    <div class="erp-modal__header-actions">' +
      '      <button type="button" class="erp-modal__header-btn" data-af-close aria-label="关闭">&times;</button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="erp-modal__body">' +
      '    <div class="crm-af__layout">' +
      '      <aside class="crm-af__sidebar" id="crmAfSidebar"></aside>' +
      '      <div class="crm-af__main">' +
      '        <div class="crm-af__main-head">' +
      '          <h3 class="crm-af__main-title" id="crmAfMainTitle"></h3>' +
      '          <p class="crm-af__main-desc" id="crmAfMainDesc"></p>' +
      '        </div>' +
      '        <div class="crm-af__fields" id="crmAfFields"></div>' +
      '        <div class="crm-af__editor" id="crmAfEditor"></div>' +
      '      </div>' +
      '      <aside class="crm-af__aside">' +
      '        <div class="crm-af__aside-head">' +
      '          <h3 class="crm-af__aside-title">已选条件 <span id="crmAfCondCount">0</span></h3>' +
      '          <button type="button" class="crm-af__aside-clear" id="crmAfClear" disabled>清空</button>' +
      '        </div>' +
      '        <div class="crm-af__logic-bar">' +
      '          <span>条件关系</span>' +
      '          <div class="crm-af__logic-toggle" id="crmAfLogic">' +
      '            <button type="button" class="crm-af__logic-btn is-active" data-logic="and">且</button>' +
      '            <button type="button" class="crm-af__logic-btn" data-logic="or">或</button>' +
      '          </div>' +
      '        </div>' +
      '        <div class="crm-af__conditions" id="crmAfConditions"></div>' +
      '      </aside>' +
      '    </div>' +
      '  </div>' +
      '  <div class="erp-modal__footer">' +
      '    <div class="crm-af__footer">' +
      '      <div class="crm-af__estimate">' +
      '        <span>预估覆盖</span>' +
      '        <span class="crm-af__estimate-num" id="crmAfEstimate">0</span>' +
      '        <span>人</span>' +
      '        <span class="crm-af__estimate-hint">（演示数据）</span>' +
      '      </div>' +
      '      <div class="crm-af__footer-actions">' +
      '        <button type="button" class="erp-btn" data-af-cancel>取消</button>' +
      '        <button type="button" class="erp-btn erp-btn--primary" data-af-ok>确定</button>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '</div>';

    document.body.appendChild(backdrop);

    function close() {
      backdrop.remove();
    }

    function countByCategory(catId) {
      return state.conditions.filter(function (c) { return c.categoryId === catId; }).length;
    }

    function usedFieldIds() {
      var map = {};
      state.conditions.forEach(function (c) { map[c.fieldId] = true; });
      return map;
    }

    function currentField() {
      var list = FIELDS[state.categoryId] || [];
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === state.fieldId) return list[i];
      }
      return list[0] || null;
    }

    function renderSidebar() {
      backdrop.querySelector('#crmAfSidebar').innerHTML = CATEGORIES.map(function (cat) {
        var active = cat.id === state.categoryId ? ' is-active' : '';
        var n = countByCategory(cat.id);
        var badge = n ? '<span class="crm-af__nav-count">' + n + '</span>' : '';
        return (
          '<button type="button" class="crm-af__nav-item' + active + '" data-cat="' + cat.id + '">' +
          '  <span>' + escapeHtml(cat.name) + '</span>' + badge +
          '</button>'
        );
      }).join('');
    }

    function renderFields() {
      var cat = findCategory(state.categoryId);
      backdrop.querySelector('#crmAfMainTitle').textContent = cat.name;
      backdrop.querySelector('#crmAfMainDesc').textContent = cat.desc;

      var used = usedFieldIds();
      var list = FIELDS[state.categoryId] || [];
      backdrop.querySelector('#crmAfFields').innerHTML = list.map(function (f) {
        var cls = 'crm-af__field-chip';
        if (f.id === state.fieldId) cls += ' is-active';
        if (used[f.id]) cls += ' is-used';
        if (f.type === 'pending') cls += ' is-pending';
        return '<button type="button" class="' + cls + '" data-field="' + f.id + '"' +
          (f.tip ? ' title="' + escapeHtml(f.tip) + '"' : '') + '>' +
          escapeHtml(f.name) + tipIcon(f.tip) +
          (f.type === 'pending' ? '<span class="crm-af__pending-badge">待开发</span>' : '') +
          '</button>';
      }).join('');
    }

    function renderHint(field) {
      if (!field.hint) return '';
      return '<p class="crm-af__hint">' + escapeHtml(field.hint) + '</p>';
    }

    function renderTagEditor(draft) {
      var groupsHtml = TAG_GROUPS.map(function (g) {
        var tags = g.tags.map(function (t) {
          var checked = draft.values.indexOf(t.id) >= 0 ? ' is-checked' : '';
          return (
            '<label class="crm-af__tag' + checked + '">' +
            '  <input type="checkbox" data-tag-id="' + t.id + '"' + (checked ? ' checked' : '') + ' hidden>' +
            '  ' + escapeHtml(t.name) +
            '</label>'
          );
        }).join('');
        return (
          '<div class="crm-af__tag-group">' +
          '  <p class="crm-af__tag-group-name">' + escapeHtml(g.name) + ' · ' + escapeHtml(g.rule) + '</p>' +
          '  <div class="crm-af__tag-grid">' + tags + '</div>' +
          '</div>'
        );
      }).join('');

      return (
        '<div class="crm-af__editor-panel">' +
        '  <p class="crm-af__editor-label">选择标签</p>' +
        '  <div class="crm-af__row">' +
        '    <span class="crm-af__row-label">匹配方式</span>' +
        '    <div class="crm-af__row-body">' +
        '      <div class="crm-af__match-row">' +
        '        <select class="crm-af__select" data-draft-match>' +
        '          <option value="any"' + (draft.match === 'any' ? ' selected' : '') + '>包含任意</option>' +
        '          <option value="all"' + (draft.match === 'all' ? ' selected' : '') + '>包含全部</option>' +
        '          <option value="none"' + (draft.match === 'none' ? ' selected' : '') + '>不包含</option>' +
        '        </select>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '  <div class="crm-af__row">' +
        '    <span class="crm-af__row-label">标签值</span>' +
        '    <div class="crm-af__row-body">' + groupsHtml + '</div>' +
        '  </div>' +
        '  <div class="crm-af__editor-actions">' +
        '    <button type="button" class="erp-btn erp-btn--primary" data-af-add>添加条件</button>' +
        '  </div>' +
        '</div>'
      );
    }

    function renderNumberEditor(field, draft) {
      return (
        '<div class="crm-af__editor-panel">' +
        '  <p class="crm-af__editor-label">' + fieldTitleHtml(field) + '</p>' +
        renderHint(field) +
        '  <div class="crm-af__row">' +
        '    <span class="crm-af__row-label">条件</span>' +
        '    <div class="crm-af__row-body">' +
        '      <div class="crm-af__match-row">' +
        renderOpSelect(field.operators, draft.operator, 'data-draft-op') +
        renderNumberValueInputs(draft, field.unit, 'data-draft-op', 'data-draft-min', 'data-draft-max', 'data-draft-value') +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '  <div class="crm-af__editor-actions">' +
        '    <button type="button" class="erp-btn erp-btn--primary" data-af-add>添加条件</button>' +
        '  </div>' +
        '</div>'
      );
    }

    function renderDatetimeEditor(field, draft) {
      return (
        '<div class="crm-af__editor-panel">' +
        '  <p class="crm-af__editor-label">' + fieldTitleHtml(field) + '</p>' +
        renderHint(field) +
        '  <div class="crm-af__row">' +
        '    <span class="crm-af__row-label">时间区间</span>' +
        '    <div class="crm-af__row-body">' +
        '      <div class="crm-af__datetime-row">' +
        '        <span class="crm-af__datetime-wrap' + (draft.start ? ' has-value' : '') + '">' +
        '          <input class="crm-af__input crm-af__input--datetime" type="datetime-local" step="1" data-draft-start value="' + escapeHtml(toDatetimeLocal(draft.start)) + '">' +
        '          <button type="button" class="crm-af__datetime-clear" data-clear-draft="start" aria-label="清空">×</button>' +
        '        </span>' +
        '        <span class="crm-af__range-sep">至</span>' +
        '        <span class="crm-af__datetime-wrap' + (draft.end ? ' has-value' : '') + '">' +
        '          <input class="crm-af__input crm-af__input--datetime" type="datetime-local" step="1" data-draft-end value="' + escapeHtml(toDatetimeLocal(draft.end)) + '">' +
        '          <button type="button" class="crm-af__datetime-clear" data-clear-draft="end" aria-label="清空">×</button>' +
        '        </span>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '  <div class="crm-af__editor-actions">' +
        '    <button type="button" class="erp-btn erp-btn--primary" data-af-add>添加条件</button>' +
        '  </div>' +
        '</div>'
      );
    }

    function renderRegionPickerEditor(field, draft) {
      var count = Object.keys(draft.selected || {}).length;
      var summary = count
        ? ((draft.mode === 'exclude' ? '排除 ' : '包含 ') + count + ' 个区域' +
          (draft.labels && draft.labels.length ? '：' + draft.labels.slice(0, 2).join('、') + (draft.labels.length > 2 ? '…' : '') : ''))
        : '请选择省市区';
      return (
        '<div class="crm-af__editor-panel">' +
        '  <p class="crm-af__editor-label">' + fieldTitleHtml(field) + '</p>' +
        renderHint(field) +
        '  <div class="crm-af__row">' +
        '    <span class="crm-af__row-label">匹配方式</span>' +
        '    <div class="crm-af__row-body">' +
        '      <div class="crm-af__radio-row">' +
        '        <label class="crm-af__radio"><input type="radio" name="crmAfRegionMode" data-region-mode="include"' + (draft.mode !== 'exclude' ? ' checked' : '') + '><span>包含地区</span></label>' +
        '        <label class="crm-af__radio"><input type="radio" name="crmAfRegionMode" data-region-mode="exclude"' + (draft.mode === 'exclude' ? ' checked' : '') + '><span>排除地区</span></label>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '  <div class="crm-af__row">' +
        '    <span class="crm-af__row-label">省市区</span>' +
        '    <div class="crm-af__row-body">' +
        '      <button type="button" class="crm-af__picker-trigger" data-open-region>' + escapeHtml(summary) + '</button>' +
        '    </div>' +
        '  </div>' +
        '  <div class="crm-af__editor-actions">' +
        '    <button type="button" class="erp-btn erp-btn--primary" data-af-add>添加条件</button>' +
        '  </div>' +
        '</div>'
      );
    }

    function renderStorePickerEditor(field, draft) {
      var count = Object.keys(draft.selected || {}).length;
      var summary = count
        ? ('已选 ' + count + ' 家门店' +
          (draft.labels && draft.labels.length ? '：' + draft.labels.slice(0, 2).join('、') + (draft.labels.length > 2 ? '…' : '') : ''))
        : '请选择绑定门店（支持搜索多选）';
      return (
        '<div class="crm-af__editor-panel">' +
        '  <p class="crm-af__editor-label">' + fieldTitleHtml(field) + '</p>' +
        renderHint(field) +
        '  <div class="crm-af__row">' +
        '    <span class="crm-af__row-label">门店</span>' +
        '    <div class="crm-af__row-body">' +
        '      <button type="button" class="crm-af__picker-trigger" data-open-store>' + escapeHtml(summary) + '</button>' +
        '    </div>' +
        '  </div>' +
        '  <div class="crm-af__editor-actions">' +
        '    <button type="button" class="erp-btn erp-btn--primary" data-af-add>添加条件</button>' +
        '  </div>' +
        '</div>'
      );
    }

    function renderEnumEditor(field, draft) {
      var opts = (field.options || []).map(function (o) {
        var checked = draft.values.indexOf(o.value) >= 0;
        if (field.multiple) {
          return (
            '<label class="crm-af__check">' +
            '  <input type="checkbox" data-enum-val="' + escapeHtml(o.value) + '"' + (checked ? ' checked' : '') + '>' +
            '  <span>' + escapeHtml(o.label) + '</span>' +
            '</label>'
          );
        }
        return (
          '<label class="crm-af__radio">' +
          '  <input type="radio" name="crmAfEnum" data-enum-val="' + escapeHtml(o.value) + '"' + (checked ? ' checked' : '') + '>' +
          '  <span>' + escapeHtml(o.label) + '</span>' +
          '</label>'
        );
      }).join('');

      return (
        '<div class="crm-af__editor-panel">' +
        '  <p class="crm-af__editor-label">' + fieldTitleHtml(field) + '</p>' +
        '  <div class="crm-af__row">' +
        '    <span class="crm-af__row-label">选项</span>' +
        '    <div class="crm-af__row-body">' +
        '      <div class="' + (field.multiple ? 'crm-af__check-row' : 'crm-af__radio-row') + '">' + opts + '</div>' +
        '    </div>' +
        '  </div>' +
        '  <div class="crm-af__editor-actions">' +
        '    <button type="button" class="erp-btn erp-btn--primary" data-af-add>添加条件</button>' +
        '  </div>' +
        '</div>'
      );
    }

    function renderCompoundEditor(field, draft) {
      var metricMeta = {};
      (field.metrics || []).forEach(function (m) { metricMeta[m.id] = m; });

      var rows = (draft.metrics || []).map(function (m) {
        var meta = metricMeta[m.id] || { name: m.id, unit: '', operators: NUMBER_OPS };
        var disabled = m.enabled ? '' : ' is-disabled';
        return (
          '<div class="crm-af__metric-row' + disabled + '" data-metric-id="' + m.id + '">' +
          '  <label class="crm-af__metric-enable">' +
          '    <input type="checkbox" data-metric-enable="' + m.id + '"' + (m.enabled ? ' checked' : '') + '>' +
          '    <span>' + escapeHtml(meta.name) + '</span>' +
          '  </label>' +
          '  <div class="crm-af__match-row">' +
          renderOpSelect(meta.operators, m.operator, 'data-metric-op="' + m.id + '"' + (m.enabled ? '' : ' disabled')) +
          (m.operator === 'between'
            ? (
              '<input class="crm-af__input" type="number" data-metric-min="' + m.id + '" value="' + escapeHtml(m.min) + '" placeholder="最小值"' + (m.enabled ? '' : ' disabled') + '>' +
              '<span class="crm-af__range-sep">至</span>' +
              '<input class="crm-af__input" type="number" data-metric-max="' + m.id + '" value="' + escapeHtml(m.max) + '" placeholder="最大值"' + (m.enabled ? '' : ' disabled') + '>'
            )
            : (
              '<input class="crm-af__input" type="number" data-metric-value="' + m.id + '" value="' + escapeHtml(m.value) + '" placeholder="请输入"' + (m.enabled ? '' : ' disabled') + '>'
            )) +
          (meta.unit ? '<span class="crm-af__unit">' + escapeHtml(meta.unit) + '</span>' : '') +
          '  </div>' +
          '</div>'
        );
      }).join('');

      return (
        '<div class="crm-af__editor-panel">' +
        '  <p class="crm-af__editor-label">' + fieldTitleHtml(field) + '</p>' +
        renderHint(field) +
        '  <div class="crm-af__metric-list">' + rows + '</div>' +
        '  <div class="crm-af__editor-actions">' +
        '    <button type="button" class="erp-btn erp-btn--primary" data-af-add>添加条件</button>' +
        '  </div>' +
        '</div>'
      );
    }

    function renderScopedMetricRows(field, draft) {
      var metricMeta = {};
      (field.metrics || []).forEach(function (m) { metricMeta[m.id] = m; });

      return (draft.metrics || []).map(function (m) {
        var meta = metricMeta[m.id] || { name: m.id, unit: '', operators: NUMBER_OPS, type: m.type };
        var disabled = m.enabled ? '' : ' is-disabled';
        var body = '';
        if (meta.type === 'datetime' || m.type === 'datetime') {
          body =
            '<div class="crm-af__datetime-row">' +
            '  <span class="crm-af__datetime-wrap' + (m.start ? ' has-value' : '') + '">' +
            '    <input class="crm-af__input crm-af__input--datetime" type="datetime-local" step="1" data-metric-start="' + m.id + '" value="' + escapeHtml(toDatetimeLocal(m.start)) + '"' + (m.enabled ? '' : ' disabled') + '>' +
            '    <button type="button" class="crm-af__datetime-clear" data-clear-metric="' + m.id + '" data-clear-which="start" aria-label="清空"' + (m.enabled ? '' : ' disabled') + '>×</button>' +
            '  </span>' +
            '  <span class="crm-af__range-sep">至</span>' +
            '  <span class="crm-af__datetime-wrap' + (m.end ? ' has-value' : '') + '">' +
            '    <input class="crm-af__input crm-af__input--datetime" type="datetime-local" step="1" data-metric-end="' + m.id + '" value="' + escapeHtml(toDatetimeLocal(m.end)) + '"' + (m.enabled ? '' : ' disabled') + '>' +
            '    <button type="button" class="crm-af__datetime-clear" data-clear-metric="' + m.id + '" data-clear-which="end" aria-label="清空"' + (m.enabled ? '' : ' disabled') + '>×</button>' +
            '  </span>' +
            '</div>';
        } else {
          body =
            '<div class="crm-af__match-row">' +
            renderOpSelect(meta.operators, m.operator, 'data-metric-op="' + m.id + '"' + (m.enabled ? '' : ' disabled')) +
            (m.operator === 'between'
              ? (
                '<input class="crm-af__input" type="number" data-metric-min="' + m.id + '" value="' + escapeHtml(m.min) + '" placeholder="最小值"' + (m.enabled ? '' : ' disabled') + '>' +
                '<span class="crm-af__range-sep">至</span>' +
                '<input class="crm-af__input" type="number" data-metric-max="' + m.id + '" value="' + escapeHtml(m.max) + '" placeholder="最大值"' + (m.enabled ? '' : ' disabled') + '>'
              )
              : (
                '<input class="crm-af__input" type="number" data-metric-value="' + m.id + '" value="' + escapeHtml(m.value) + '" placeholder="请输入"' + (m.enabled ? '' : ' disabled') + '>'
              )) +
            (meta.unit ? '<span class="crm-af__unit">' + escapeHtml(meta.unit) + '</span>' : '') +
            '</div>';
        }
        return (
          '<div class="crm-af__metric-row' + disabled + '" data-metric-id="' + m.id + '">' +
          '  <label class="crm-af__metric-enable">' +
          '    <input type="checkbox" data-metric-enable="' + m.id + '"' + (m.enabled ? ' checked' : '') + '>' +
          '    <span>' + escapeHtml(meta.name) + '</span>' +
          '  </label>' +
          body +
          '</div>'
        );
      }).join('');
    }

    function renderScopedEventEditor(field, draft) {
      var blocks = '';

      if (field.hasTimeRange) {
        blocks +=
          '<div class="crm-af__row">' +
          '  <span class="crm-af__row-label">指定时间</span>' +
          '  <div class="crm-af__row-body">' +
          '    <div class="crm-af__datetime-row">' +
          '      <span class="crm-af__datetime-wrap' + (draft.timeStart ? ' has-value' : '') + '">' +
          '        <input class="crm-af__input crm-af__input--datetime" type="datetime-local" step="1" data-scope-time-start value="' + escapeHtml(toDatetimeLocal(draft.timeStart)) + '">' +
          '        <button type="button" class="crm-af__datetime-clear" data-clear-scope-time="start" aria-label="清空">×</button>' +
          '      </span>' +
          '      <span class="crm-af__range-sep">至</span>' +
          '      <span class="crm-af__datetime-wrap' + (draft.timeEnd ? ' has-value' : '') + '">' +
          '        <input class="crm-af__input crm-af__input--datetime" type="datetime-local" step="1" data-scope-time-end value="' + escapeHtml(toDatetimeLocal(draft.timeEnd)) + '">' +
          '        <button type="button" class="crm-af__datetime-clear" data-clear-scope-time="end" aria-label="清空">×</button>' +
          '      </span>' +
          '    </div>' +
          '  </div>' +
          '</div>';
      }

      if (field.target === 'product' || field.target === 'product_or_category') {
        var mode = draft.targetMode === 'category' ? 'category' : 'product';
        var modeHtml = '';
        if (field.target === 'product_or_category') {
          modeHtml =
            '<div class="crm-af__radio-row crm-af__target-mode">' +
            '  <label class="crm-af__radio"><input type="radio" name="crmAfTargetMode" data-target-mode="product"' + (mode === 'product' ? ' checked' : '') + '><span>指定商品</span></label>' +
            '  <label class="crm-af__radio"><input type="radio" name="crmAfTargetMode" data-target-mode="category"' + (mode === 'category' ? ' checked' : '') + '><span>指定商品类目</span></label>' +
            '</div>';
        }
        var summary = '';
        var openAttr = '';
        if (mode === 'category') {
          var cats = draft.categories || [];
          summary = cats.length
            ? ('已选 ' + cats.length + ' 个类目：' + cats.slice(0, 2).map(function (c) { return c.name; }).join('、') + (cats.length > 2 ? '…' : ''))
            : '请选择商品类目';
          openAttr = 'data-open-category';
        } else {
          var products = draft.products || [];
          summary = products.length
            ? ('已选 ' + products.length + ' 个商品：' + products.slice(0, 2).map(function (p) { return p.name; }).join('、') + (products.length > 2 ? '…' : ''))
            : '请选择商品';
          openAttr = 'data-open-product';
        }
        blocks +=
          '<div class="crm-af__row">' +
          '  <span class="crm-af__row-label">筛选对象</span>' +
          '  <div class="crm-af__row-body">' +
          modeHtml +
          '    <button type="button" class="crm-af__picker-trigger" ' + openAttr + '>' + escapeHtml(summary) + '</button>' +
          '  </div>' +
          '</div>';
      }

      blocks += '<div class="crm-af__metric-list">' + renderScopedMetricRows(field, draft) + '</div>';

      return (
        '<div class="crm-af__editor-panel">' +
        '  <p class="crm-af__editor-label">' + fieldTitleHtml(field) + '</p>' +
        renderHint(field) +
        blocks +
        '  <div class="crm-af__editor-actions">' +
        '    <button type="button" class="erp-btn erp-btn--primary" data-af-add>添加条件</button>' +
        '  </div>' +
        '</div>'
      );
    }

    function openDemoMultiPick(options) {
      options = options || {};
      var title = options.title || '请选择';
      var items = options.items || [];
      var selectedMap = {};
      (options.selected || []).forEach(function (it) {
        selectedMap[it.id] = true;
      });

      var old = document.querySelector('[data-crm-af-pick]');
      if (old) old.remove();

      var modal = document.createElement('div');
      modal.className = 'erp-modal-backdrop crm-af-pick-backdrop';
      modal.setAttribute('data-crm-af-pick', '1');
      modal.innerHTML =
        '<div class="erp-modal crm-af-pick-modal" role="dialog" aria-modal="true">' +
        '  <div class="erp-modal__header">' +
        '    <h2 class="erp-modal__title">' + escapeHtml(title) + '</h2>' +
        '    <div class="erp-modal__header-actions">' +
        '      <button type="button" class="erp-modal__header-btn" data-pick-close aria-label="关闭">&times;</button>' +
        '    </div>' +
        '  </div>' +
        '  <div class="erp-modal__body">' +
        '    <div class="crm-af-pick__search">' +
        '      <input type="search" class="crm-af__input" data-pick-keyword placeholder="搜索名称">' +
        '    </div>' +
        '    <div class="crm-af-pick__list" data-pick-list></div>' +
        '  </div>' +
        '  <div class="erp-modal__footer">' +
        '    <button type="button" class="erp-btn" data-pick-close>取消</button>' +
        '    <button type="button" class="erp-btn erp-btn--primary" data-pick-ok>确定</button>' +
        '  </div>' +
        '</div>';
      document.body.appendChild(modal);

      function renderList(keyword) {
        var kw = String(keyword || '').trim().toLowerCase();
        var listEl = modal.querySelector('[data-pick-list]');
        var filtered = items.filter(function (it) {
          if (!kw) return true;
          return String(it.name).toLowerCase().indexOf(kw) >= 0 || String(it.id).toLowerCase().indexOf(kw) >= 0;
        });
        if (!filtered.length) {
          listEl.innerHTML = '<div class="crm-af-pick__empty">暂无匹配项</div>';
          return;
        }
        listEl.innerHTML = filtered.map(function (it) {
          return (
            '<label class="crm-af-pick__item">' +
            '  <input type="checkbox" data-pick-id="' + escapeHtml(it.id) + '"' + (selectedMap[it.id] ? ' checked' : '') + '>' +
            '  <span class="crm-af-pick__name">' + escapeHtml(it.name) + '</span>' +
            '  <span class="crm-af-pick__id">' + escapeHtml(it.id) + '</span>' +
            '</label>'
          );
        }).join('');
      }

      renderList('');

      modal.addEventListener('input', function (ev) {
        if (ev.target.matches('[data-pick-keyword]')) {
          renderList(ev.target.value);
        }
      });

      modal.addEventListener('change', function (ev) {
        var cb = ev.target.closest('[data-pick-id]');
        if (!cb) return;
        var id = cb.getAttribute('data-pick-id');
        if (cb.checked) selectedMap[id] = true;
        else delete selectedMap[id];
      });

      modal.addEventListener('click', function (ev) {
        if (ev.target === modal || ev.target.closest('[data-pick-close]')) {
          modal.remove();
          return;
        }
        if (ev.target.closest('[data-pick-ok]')) {
          var picked = items.filter(function (it) { return selectedMap[it.id]; });
          modal.remove();
          if (typeof options.onConfirm === 'function') options.onConfirm(picked);
        }
      });
    }

    function renderPendingEditor(field) {
      return (
        '<div class="crm-af__editor-panel">' +
        '  <p class="crm-af__editor-label">' + fieldTitleHtml(field) + '</p>' +
        '  <div class="crm-af__pending-box">' +
        '    <div class="crm-af__pending-title">待开发</div>' +
        '    <p class="crm-af__hint">' + escapeHtml(field.hint || '该能力暂未开放') + '</p>' +
        '  </div>' +
        '</div>'
      );
    }

    function renderEditor() {
      var field = currentField();
      var editor = backdrop.querySelector('#crmAfEditor');
      if (!field) {
        editor.innerHTML =
          '<div class="crm-af__editor-empty">' +
          '  <div class="crm-af__editor-empty-icon">◇</div>' +
          '  <div>请选择左侧筛选维度</div>' +
          '</div>';
        return;
      }
      if (!state.draft) state.draft = initDraftFromField(field);

      if (field.type === 'tag') editor.innerHTML = renderTagEditor(state.draft);
      else if (field.type === 'number') editor.innerHTML = renderNumberEditor(field, state.draft);
      else if (field.type === 'datetime') editor.innerHTML = renderDatetimeEditor(field, state.draft);
      else if (field.type === 'enum') editor.innerHTML = renderEnumEditor(field, state.draft);
      else if (field.type === 'region_picker') editor.innerHTML = renderRegionPickerEditor(field, state.draft);
      else if (field.type === 'store_picker') editor.innerHTML = renderStorePickerEditor(field, state.draft);
      else if (field.type === 'compound') editor.innerHTML = renderCompoundEditor(field, state.draft);
      else if (field.type === 'scoped_event') editor.innerHTML = renderScopedEventEditor(field, state.draft);
      else if (field.type === 'pending') editor.innerHTML = renderPendingEditor(field);
    }

    function renderConditions() {
      var wrap = backdrop.querySelector('#crmAfConditions');
      var countEl = backdrop.querySelector('#crmAfCondCount');
      var clearBtn = backdrop.querySelector('#crmAfClear');
      var logicLabel = state.logic === 'or' ? '或' : '且';

      countEl.textContent = String(state.conditions.length);
      clearBtn.disabled = !state.conditions.length;

      backdrop.querySelectorAll('#crmAfLogic .crm-af__logic-btn').forEach(function (btn) {
        btn.classList.toggle('is-active', btn.getAttribute('data-logic') === state.logic);
      });

      if (!state.conditions.length) {
        wrap.innerHTML = '<div class="crm-af__cond-empty">暂无筛选条件<br>从左侧选择维度并添加条件</div>';
      } else {
        wrap.innerHTML =
          '<div class="crm-af__cond-list">' +
          state.conditions.map(function (cond, idx) {
            var s = summarizeCondition(cond);
            var logicAttr = idx === 0 ? '' : ' data-logic="' + logicLabel + '"';
            return (
              '<div class="crm-af__cond-card"' + logicAttr + ' data-cond-id="' + cond.id + '">' +
              '  <div class="crm-af__cond-meta">' +
              '    <span class="crm-af__cond-cat">' + escapeHtml(s.categoryName) + '</span>' +
              '    <button type="button" class="crm-af__cond-remove" data-remove-cond="' + cond.id + '" aria-label="删除">&times;</button>' +
              '  </div>' +
              '  <p class="crm-af__cond-name">' + escapeHtml(s.name) + '</p>' +
              '  <p class="crm-af__cond-text">' + escapeHtml(s.text) + '</p>' +
              '</div>'
            );
          }).join('') +
          '</div>';
      }

      backdrop.querySelector('#crmAfEstimate').textContent = formatNumber(estimateCount(state.conditions, state.logic));
    }

    function refresh() {
      renderSidebar();
      renderFields();
      renderEditor();
      renderConditions();
    }

    function selectCategory(catId) {
      state.categoryId = catId;
      var list = FIELDS[catId] || [];
      state.fieldId = list.length ? list[0].id : null;
      var field = currentField();
      var existing = findConditionByField(state.conditions, state.fieldId);
      state.draft = existing ? conditionToDraft(existing, field) : initDraftFromField(field);
      refresh();
    }

    function selectField(fieldId) {
      state.fieldId = fieldId;
      var field = currentField();
      var existing = findConditionByField(state.conditions, fieldId);
      state.draft = existing ? conditionToDraft(existing, field) : initDraftFromField(field);
      refresh();
    }

    function syncDraftFromDom() {
      var field = currentField();
      if (!field || !state.draft) return;

      if (field.type === 'tag') {
        var matchEl = backdrop.querySelector('[data-draft-match]');
        if (matchEl) state.draft.match = matchEl.value;
        state.draft.values = [];
        backdrop.querySelectorAll('[data-tag-id]').forEach(function (input) {
          if (input.checked) state.draft.values.push(input.getAttribute('data-tag-id'));
        });
      } else if (field.type === 'number') {
        var opEl = backdrop.querySelector('[data-draft-op]');
        if (opEl) state.draft.operator = opEl.value;
        var minEl = backdrop.querySelector('[data-draft-min]');
        var maxEl = backdrop.querySelector('[data-draft-max]');
        var valEl = backdrop.querySelector('[data-draft-value]');
        if (minEl) state.draft.min = minEl.value;
        if (maxEl) state.draft.max = maxEl.value;
        if (valEl) state.draft.value = valEl.value;
      } else if (field.type === 'datetime') {
        var startEl = backdrop.querySelector('[data-draft-start]');
        var endEl = backdrop.querySelector('[data-draft-end]');
        if (startEl) state.draft.start = fromDatetimeLocal(startEl.value);
        if (endEl) state.draft.end = fromDatetimeLocal(endEl.value);
      } else if (field.type === 'enum') {
        state.draft.values = [];
        backdrop.querySelectorAll('[data-enum-val]').forEach(function (input) {
          if (input.checked) state.draft.values.push(input.getAttribute('data-enum-val'));
        });
      } else if (field.type === 'region_picker') {
        var modeInclude = backdrop.querySelector('[data-region-mode="include"]');
        var modeExclude = backdrop.querySelector('[data-region-mode="exclude"]');
        if (modeExclude && modeExclude.checked) state.draft.mode = 'exclude';
        else if (modeInclude && modeInclude.checked) state.draft.mode = 'include';
      } else if (field.type === 'compound') {
        (state.draft.metrics || []).forEach(function (m) {
          var enableEl = backdrop.querySelector('[data-metric-enable="' + m.id + '"]');
          var mop = backdrop.querySelector('[data-metric-op="' + m.id + '"]');
          var mmin = backdrop.querySelector('[data-metric-min="' + m.id + '"]');
          var mmax = backdrop.querySelector('[data-metric-max="' + m.id + '"]');
          var mval = backdrop.querySelector('[data-metric-value="' + m.id + '"]');
          if (enableEl) m.enabled = enableEl.checked;
          if (mop) m.operator = mop.value;
          if (mmin) m.min = mmin.value;
          if (mmax) m.max = mmax.value;
          if (mval) m.value = mval.value;
        });
      } else if (field.type === 'scoped_event') {
        var ts = backdrop.querySelector('[data-scope-time-start]');
        var te = backdrop.querySelector('[data-scope-time-end]');
        if (ts) state.draft.timeStart = fromDatetimeLocal(ts.value);
        if (te) state.draft.timeEnd = fromDatetimeLocal(te.value);
        var modeProduct = backdrop.querySelector('[data-target-mode="product"]');
        var modeCategory = backdrop.querySelector('[data-target-mode="category"]');
        if (modeCategory && modeCategory.checked) state.draft.targetMode = 'category';
        else if (modeProduct && modeProduct.checked) state.draft.targetMode = 'product';
        (state.draft.metrics || []).forEach(function (m) {
          var enableEl2 = backdrop.querySelector('[data-metric-enable="' + m.id + '"]');
          if (enableEl2) m.enabled = enableEl2.checked;
          if (m.type === 'datetime') {
            var ms = backdrop.querySelector('[data-metric-start="' + m.id + '"]');
            var me = backdrop.querySelector('[data-metric-end="' + m.id + '"]');
            if (ms) m.start = fromDatetimeLocal(ms.value);
            if (me) m.end = fromDatetimeLocal(me.value);
          } else {
            var mop2 = backdrop.querySelector('[data-metric-op="' + m.id + '"]');
            var mmin2 = backdrop.querySelector('[data-metric-min="' + m.id + '"]');
            var mmax2 = backdrop.querySelector('[data-metric-max="' + m.id + '"]');
            var mval2 = backdrop.querySelector('[data-metric-value="' + m.id + '"]');
            if (mop2) m.operator = mop2.value;
            if (mmin2) m.min = mmin2.value;
            if (mmax2) m.max = mmax2.value;
            if (mval2) m.value = mval2.value;
          }
        });
      }
    }

    function addCondition() {
      var field = currentField();
      if (!field) return;
      if (field.type === 'pending') {
        toast('「参与活动」待开发，暂不可添加', 'warning');
        return;
      }
      syncDraftFromDom();
      var err = validateDraft(field, state.draft);
      if (err) {
        toast(err, 'warning');
        return;
      }
      state.conditions = state.conditions.filter(function (c) { return c.fieldId !== field.id; });
      state.conditions.push(draftToCondition(field, state.categoryId, state.draft));
      // 保留已选值：从刚写入的条件回显，避免清空编辑区
      var saved = findConditionByField(state.conditions, field.id);
      state.draft = saved ? conditionToDraft(saved, field) : state.draft;
      refresh();
    }

    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop) close();

      var catBtn = ev.target.closest('[data-cat]');
      if (catBtn) {
        selectCategory(catBtn.getAttribute('data-cat'));
        return;
      }

      var fieldBtn = ev.target.closest('[data-field]');
      if (fieldBtn) {
        selectField(fieldBtn.getAttribute('data-field'));
        return;
      }

      var logicBtn = ev.target.closest('[data-logic]');
      if (logicBtn && logicBtn.closest('#crmAfLogic')) {
        state.logic = logicBtn.getAttribute('data-logic');
        renderConditions();
        return;
      }

      if (ev.target.closest('[data-af-add]')) {
        addCondition();
        return;
      }

      var clearDt = ev.target.closest('[data-clear-draft]');
      if (clearDt) {
        var which = clearDt.getAttribute('data-clear-draft');
        if (which === 'start') state.draft.start = '';
        if (which === 'end') state.draft.end = '';
        renderEditor();
        return;
      }

      var clearScopeTime = ev.target.closest('[data-clear-scope-time]');
      if (clearScopeTime) {
        syncDraftFromDom();
        var whichScope = clearScopeTime.getAttribute('data-clear-scope-time');
        if (whichScope === 'start') state.draft.timeStart = '';
        if (whichScope === 'end') state.draft.timeEnd = '';
        renderEditor();
        return;
      }

      var clearMetricDt = ev.target.closest('[data-clear-metric]');
      if (clearMetricDt) {
        syncDraftFromDom();
        var mid = clearMetricDt.getAttribute('data-clear-metric');
        var whichM = clearMetricDt.getAttribute('data-clear-which');
        (state.draft.metrics || []).forEach(function (m) {
          if (m.id !== mid) return;
          if (whichM === 'start') m.start = '';
          if (whichM === 'end') m.end = '';
        });
        renderEditor();
        return;
      }

      if (ev.target.closest('[data-open-product]')) {
        syncDraftFromDom();
        openDemoMultiPick({
          title: '选择商品',
          items: DEMO_PRODUCTS,
          selected: state.draft.products || [],
          onConfirm: function (picked) {
            state.draft.products = picked.map(function (p) {
              return { id: p.id, name: p.name };
            });
            renderEditor();
          }
        });
        return;
      }

      if (ev.target.closest('[data-open-category]')) {
        syncDraftFromDom();
        openDemoMultiPick({
          title: '选择商品类目',
          items: DEMO_CATEGORIES,
          selected: state.draft.categories || [],
          onConfirm: function (picked) {
            state.draft.categories = picked.map(function (c) {
              return { id: c.id, name: c.name };
            });
            renderEditor();
          }
        });
        return;
      }

      if (ev.target.closest('[data-open-region]')) {
        syncDraftFromDom();
        if (!window.MdmProxyRegionPicker) {
          toast('区域选择组件未加载', 'warning');
          return;
        }
        window.MdmProxyRegionPicker.open({
          selected: state.draft.selected || {},
          layout: 'columns',
          compactHeight: true,
          onConfirm: function (selected, summaryItems) {
            state.draft.selected = selected || {};
            state.draft.labels = (summaryItems || []).map(function (it) { return it.label; });
            renderEditor();
          }
        });
        return;
      }

      if (ev.target.closest('[data-open-store]')) {
        syncDraftFromDom();
        if (!window.MdmProxyStorePicker) {
          toast('门店选择组件未加载', 'warning');
          return;
        }
        window.MdmProxyStorePicker.open({
          selected: state.draft.selected || {},
          flatFilter: true,
          compactHeight: true,
          onConfirm: function (selected, stores) {
            state.draft.selected = selected || {};
            state.draft.labels = (stores || []).map(function (s) { return s.name; });
            renderEditor();
          }
        });
        return;
      }

      var removeBtn = ev.target.closest('[data-remove-cond]');
      if (removeBtn) {
        var rid = removeBtn.getAttribute('data-remove-cond');
        state.conditions = state.conditions.filter(function (c) { return c.id !== rid; });
        refresh();
        return;
      }

      if (ev.target.closest('#crmAfClear')) {
        state.conditions = [];
        refresh();
        return;
      }

      var tagLabel = ev.target.closest('.crm-af__tag');
      if (tagLabel) {
        var input = tagLabel.querySelector('input');
        if (input) {
          input.checked = !input.checked;
          tagLabel.classList.toggle('is-checked', input.checked);
          syncDraftFromDom();
        }
        return;
      }

      if (ev.target.closest('[data-af-close]') || ev.target.closest('[data-af-cancel]')) {
        close();
        return;
      }

      if (ev.target.closest('[data-af-ok]')) {
        if (!state.conditions.length) {
          toast('请至少添加一个筛选条件', 'warning');
          return;
        }
        var payload = {
          logic: state.logic,
          conditions: cloneConditions(state.conditions),
          estimate: estimateCount(state.conditions, state.logic),
          summary: state.conditions.map(function (c) {
            var s = summarizeCondition(c);
            return s.name + ' ' + s.text;
          })
        };
        function finishConfirm() {
          if (typeof options.onConfirm === 'function') options.onConfirm(payload);
          close();
        }
        if (typeof options.beforeConfirm === 'function') {
          options.beforeConfirm(payload, function (ok) {
            if (ok) finishConfirm();
          });
          return;
        }
        finishConfirm();
      }
    });

    backdrop.addEventListener('change', function (ev) {
      var t = ev.target;

      if (t.matches('[data-draft-op]') || t.matches('[data-metric-op]') || t.matches('[data-metric-enable]') || t.matches('[data-target-mode]')) {
        syncDraftFromDom();
        renderEditor();
        return;
      }

      if (
        t.matches('[data-draft-match]') ||
        t.matches('[data-enum-val]') ||
        t.matches('[data-draft-min]') ||
        t.matches('[data-draft-max]') ||
        t.matches('[data-draft-value]') ||
        t.matches('[data-draft-start]') ||
        t.matches('[data-draft-end]') ||
        t.matches('[data-region-mode]') ||
        t.matches('[data-metric-min]') ||
        t.matches('[data-metric-max]') ||
        t.matches('[data-metric-value]') ||
        t.matches('[data-metric-start]') ||
        t.matches('[data-metric-end]') ||
        t.matches('[data-scope-time-start]') ||
        t.matches('[data-scope-time-end]')
      ) {
        syncDraftFromDom();
        if (
          t.matches('[data-draft-start]') ||
          t.matches('[data-draft-end]') ||
          t.matches('[data-region-mode]') ||
          t.matches('[data-metric-start]') ||
          t.matches('[data-metric-end]') ||
          t.matches('[data-scope-time-start]') ||
          t.matches('[data-scope-time-end]')
        ) {
          renderEditor();
        }
      }
    });

    refresh();

    return { close: close };
  }

  global.CrmAudienceFilter = {
    open: open,
    CATEGORIES: CATEGORIES,
    FIELDS: FIELDS,
    summarizeCondition: summarizeCondition
  };
})(window);
