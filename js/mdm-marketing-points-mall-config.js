/**
 * 营销-积分商城配置：轮播图 + 积分规则（兑换开关/售后/抵现）读取
 * 与会员-积分规则 mdm_member_points_rule_v1 共用数据源
 */
(function () {
  var RULE_KEY = 'mdm_member_points_rule_v1';
  var BANNER_KEY = 'mdm_marketing_points_mall_banners_v1';
  var MAX_BANNERS = 10;
  var AVAILABLE_POINTS_DEMO = 161;

  var DEFAULT_RULE = {
    enabled: true,
    validityDays: 365,
    ruleDesc: '',
    cash: {
      enabled: true,
      perPointAmount: 0.01,
      maxRatio: 50,
      maxAmount: 100,
      scope: { type: 'all', products: [], categories: [] }
    },
    exchange: {
      enabled: true,
      refundEnabled: true,
      refundValidity: 'keep_original'
    },
    consume: { enabled: true, amountPerPoint: 1 }
  };

  var DEFAULT_BANNERS = [
    {
      id: 'b1',
      title: '积分焕新季',
      image: '../user-app/assets/shop/banner-featured.svg',
      link: ''
    },
    {
      id: 'b2',
      title: '好物随心兑',
      image: '../user-app/assets/restock/product-leaf.svg',
      link: ''
    }
  ];

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function uid() {
    return 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function loadRuleRaw() {
    try {
      var raw = localStorage.getItem(RULE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function normalizeScope(scope) {
    scope = scope || {};
    var type = scope.type || 'all';
    if (
      ['all', 'include_product', 'include_category', 'exclude_product', 'exclude_category'].indexOf(
        type
      ) === -1
    ) {
      type = 'all';
    }
    return {
      type: type,
      products: Array.isArray(scope.products) ? scope.products : [],
      categories: Array.isArray(scope.categories) ? scope.categories : []
    };
  }

  function getRule() {
    var parsed = loadRuleRaw();
    var rule = clone(DEFAULT_RULE);
    if (!parsed) return rule;
    if (typeof parsed.enabled === 'boolean') rule.enabled = parsed.enabled;
    if (parsed.cash) {
      if (typeof parsed.cash.enabled === 'boolean') rule.cash.enabled = parsed.cash.enabled;
      if (parsed.cash.perPointAmount != null) rule.cash.perPointAmount = Number(parsed.cash.perPointAmount);
      if (parsed.cash.maxRatio != null) rule.cash.maxRatio = Number(parsed.cash.maxRatio);
      if (parsed.cash.maxAmount != null) rule.cash.maxAmount = Number(parsed.cash.maxAmount);
      rule.cash.scope = normalizeScope(parsed.cash.scope);
    }
    if (parsed.exchange) {
      if (typeof parsed.exchange.enabled === 'boolean') rule.exchange.enabled = parsed.exchange.enabled;
      if (typeof parsed.exchange.refundEnabled === 'boolean') {
        rule.exchange.refundEnabled = parsed.exchange.refundEnabled;
      }
      rule.exchange.refundValidity = 'keep_original';
    }
    return rule;
  }

  function isExchangeEnabled() {
    var rule = getRule();
    return !!(rule.enabled && rule.exchange && rule.exchange.enabled);
  }

  /** 积分兑换商品是否支持售后（读后台积分规则） */
  function isExchangeRefundEnabled() {
    var rule = getRule();
    if (!(rule.enabled && rule.exchange && rule.exchange.enabled)) return false;
    return !!rule.exchange.refundEnabled;
  }

  function setExchangeEnabled(on) {
    var rule = loadRuleRaw() || clone(DEFAULT_RULE);
    if (!rule.exchange) {
      rule.exchange = { enabled: true, refundEnabled: true, refundValidity: 'keep_original' };
    }
    rule.exchange.enabled = !!on;
    localStorage.setItem(RULE_KEY, JSON.stringify(rule));
  }

  function scopeIncludes(scope, productId, category) {
    scope = normalizeScope(scope);
    var type = scope.type;
    if (type === 'all') return true;
    var id = String(productId || '');
    var cat = String(category || '');
    var products = scope.products || [];
    var categories = scope.categories || [];
    function inProducts() {
      return products.some(function (p) {
        return String(p.id || p.code || p) === id || String(p.name || '') === id;
      });
    }
    function inCategories() {
      return categories.some(function (c) {
        return String(c.id || c.name || c) === cat;
      });
    }
    if (type === 'include_product') return inProducts();
    if (type === 'exclude_product') return !inProducts();
    if (type === 'include_category') return inCategories();
    if (type === 'exclude_category') return !inCategories();
    return true;
  }

  /**
   * 积分抵现：仅普通商品参与；积分兑换商品不计入可抵扣基数
   * @param {{goodsAmount:number, availablePoints?:number, productId?:string, category?:string}[]} mallLines
   */
  function calcCashDeduction(mallLines, availablePoints) {
    var rule = getRule();
    var ptsAvail =
      availablePoints != null ? Number(availablePoints) : AVAILABLE_POINTS_DEMO;
    if (!(rule.enabled && rule.cash && rule.cash.enabled)) {
      return {
        enabled: false,
        eligibleAmount: 0,
        deductAmount: 0,
        pointsUsed: 0,
        maxAmount: 0,
        tip: '积分抵现未开启'
      };
    }
    var per = Number(rule.cash.perPointAmount) || 0;
    var maxRatio = Number(rule.cash.maxRatio) || 0;
    var maxAmountCap = Number(rule.cash.maxAmount) || 0;
    if (!(per > 0)) {
      return {
        enabled: false,
        eligibleAmount: 0,
        deductAmount: 0,
        pointsUsed: 0,
        maxAmount: 0,
        tip: '抵扣比例未配置'
      };
    }

    var eligible = 0;
    (mallLines || []).forEach(function (line) {
      if (!line || line.isPointsExchange) return;
      if (!scopeIncludes(rule.cash.scope, line.productId || line.id, line.category)) return;
      eligible += (Number(line.price) || 0) * (Number(line.qty) || 0);
    });
    eligible = Math.round(eligible * 100) / 100;
    var byRatio = Math.round(((eligible * maxRatio) / 100) * 100) / 100;
    var maxAmount = Math.min(byRatio, maxAmountCap);
    var byPoints = Math.round(ptsAvail * per * 100) / 100;
    var deductAmount = Math.min(maxAmount, byPoints, eligible);
    deductAmount = Math.floor(deductAmount / per) * per;
    deductAmount = Math.round(deductAmount * 100) / 100;
    var pointsUsed = per > 0 ? Math.round(deductAmount / per) : 0;

    return {
      enabled: true,
      eligibleAmount: eligible,
      deductAmount: deductAmount,
      pointsUsed: pointsUsed,
      maxAmount: maxAmount,
      perPointAmount: per,
      maxRatio: maxRatio,
      tip:
        deductAmount > 0
          ? '可用 ' + pointsUsed + ' 积分抵 ¥' + deductAmount.toFixed(2)
          : eligible > 0
            ? '当前无可抵扣积分'
            : '无适用普通商品可抵扣'
    };
  }

  function normalizeBanner(item) {
    item = item || {};
    return {
      id: item.id || uid(),
      title: String(item.title || '').trim(),
      image: String(item.image || '').trim(),
      link: String(item.link || '').trim()
    };
  }

  function loadBanners() {
    try {
      var raw = localStorage.getItem(BANNER_KEY);
      if (!raw) return clone(DEFAULT_BANNERS);
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return clone(DEFAULT_BANNERS);
      return parsed.map(normalizeBanner).slice(0, MAX_BANNERS);
    } catch (e) {
      return clone(DEFAULT_BANNERS);
    }
  }

  function saveBanners(list) {
    var next = (Array.isArray(list) ? list : []).map(normalizeBanner).slice(0, MAX_BANNERS);
    localStorage.setItem(BANNER_KEY, JSON.stringify(next));
    return next;
  }

  window.MdmPointsMallConfig = {
    MAX_BANNERS: MAX_BANNERS,
    AVAILABLE_POINTS_DEMO: AVAILABLE_POINTS_DEMO,
    getRule: getRule,
    isExchangeEnabled: isExchangeEnabled,
    isExchangeRefundEnabled: isExchangeRefundEnabled,
    setExchangeEnabled: setExchangeEnabled,
    calcCashDeduction: calcCashDeduction,
    scopeIncludes: scopeIncludes,
    loadBanners: loadBanners,
    saveBanners: saveBanners,
    createBanner: function () {
      return { id: uid(), title: '', image: '', link: '' };
    }
  };
})();
