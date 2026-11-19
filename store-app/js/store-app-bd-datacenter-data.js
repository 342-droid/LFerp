/**
 * BD 数据中心演示数据。
 * 门店业务只含当前负责门店；佣金只含系统记在本人名下的 BD 佣金。
 * 已交接门店不再进入业务统计，历史佣金仍可按原记录查看。
 * 名称含「测试 / test」的门店、商品排除。不看订单号和备注。
 */
(function (global) {
  function K() {
    return global.StoreAppRoleDc;
  }
  var ME = 'BD-LZF';
  var BD_NAME = '李泽峰';

  function stores() {
    return [
      { id: 'S-CN', name: '城南生鲜店', scope: 'current' },
      { id: 'S-HP', name: '湖畔优选店', scope: 'current' },
      { id: 'S-BJ', name: '滨江鲜选店', scope: 'current' },
      { id: 'S-XX', name: '西溪社区店', scope: 'current' },
      { id: 'S-TEST', name: '测试门店', scope: 'current' },
      { id: 'S-DC', name: '东城交接店', scope: 'history' }
    ];
  }
  function storeById(id) {
    var list = stores();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function excludedStore(store) {
    return !store || store.test || K().isTestName(store.name);
  }
  function currentStores() {
    return stores().filter(function (s) {
      return s.scope === 'current' && !excludedStore(s);
    });
  }

  var retailCache = null;
  var proxyCache = null;
  function retailOrders() {
    if (retailCache) return retailCache;
    var at = K().at;
    retailCache = [
      { id: 'MR1', store: 'S-CN', customer: 'C01', pay: at(0, '10:12:00'), channel: 'mall', role: 'bd', bd: ME, settle: '待结算', settleAt: '', lines: [{ name: '有机生菜', paid: 120, commission: 12 }, { name: '测试赠菜', paid: 30, commission: 3, test: true }] },
      { id: 'MR2', store: 'S-CN', customer: 'C02', pay: at(0, '18:00:00'), channel: 'live', role: 'bd', bd: ME, settle: '已结算', settleAt: at(0, '19:00:00'), lines: [{ name: '草莓', paid: 80, commission: 8 }] },
      { id: 'MR3', store: 'S-CN', customer: 'C03', pay: at(0, '22:10:00'), channel: 'mall', role: 'bd', bd: ME, settle: '待结算', settleAt: '', lines: [{ name: '晚间牛奶', paid: 50, commission: 5 }] },
      { id: 'MR4', store: 'S-HP', customer: 'C01', pay: at(-1, '11:00:00'), channel: 'mall', role: 'bd', bd: ME, settle: '结算中', settleAt: at(0, '09:00:00'), lines: [{ name: '苹果', paid: 60, commission: 6 }] },
      { id: 'MR5', store: 'S-CN', customer: 'C04', pay: at(-1, '15:20:00'), channel: 'mall', role: 'bd', bd: ME, settle: '已结算', settleAt: at(-1, '16:00:00'), welfare: true, lines: [{ name: '福利鸡蛋', paid: 9.9, commission: 0.99 }] },
      { id: 'MR6', store: 'S-CN', customer: 'C05', pay: at(0, '09:00:00'), channel: 'mall', role: 'bd', bd: ME, freeGift: true, lines: [{ name: '赠品青菜', paid: 0, commission: 0 }] },
      { id: 'MR7', store: 'S-HP', customer: 'C06', pay: at(0, '09:30:00'), channel: 'mall', role: 'bd', bd: ME, pointsOnly: true, lines: [{ name: '积分兑换米', paid: 0, commission: 0 }] },
      { id: 'MR8', store: 'S-CN', customer: 'C07', pay: at(0, '09:40:00'), channel: 'mall', role: 'bd', bd: ME, zeroPromo: true, lines: [{ name: '零元尝鲜', paid: 0, commission: 0 }] },
      { id: 'MR9', store: 'S-HP', customer: 'C08', pay: at(0, '09:50:00'), channel: 'mall', role: 'bd', bd: ME, pointsCashMix: true, lines: [{ name: '积分补差酸奶', paid: 10, commission: 1 }] },
      { id: 'MR10', store: 'S-CN', customer: 'C09', pay: at(0, '14:00:00'), channel: 'mall', role: 'bd', bd: 'BD-OTHER', settle: '待结算', settleAt: '', lines: [{ name: '牛肉', paid: 200, commission: 20 }] },
      { id: 'MR11', store: 'S-HP', customer: 'C02', pay: at(0, '16:00:00'), channel: 'mall', role: 'store_manager', bd: ME, settle: '已结算', settleAt: at(0, '17:00:00'), lines: [{ name: '酸奶', paid: 40, commission: 4 }] },
      { id: 'MR12', store: 'S-CN', customer: 'C02', pay: at(-1, '12:00:00'), channel: 'live', role: 'anchor', bd: ME, settle: '已结算', settleAt: at(-1, '13:00:00'), lines: [{ name: '直播坚果', paid: 70, commission: 7 }] },
      { id: 'MR13', store: 'S-TEST', customer: 'C01', pay: at(0, '10:00:00'), channel: 'mall', role: 'bd', bd: ME, settle: '待结算', settleAt: '', lines: [{ name: '测试店商品', paid: 999, commission: 99 }] },
      { id: 'MR14', store: 'S-DC', customer: 'C01', pay: at(-10, '10:00:00'), channel: 'mall', role: 'bd', bd: ME, settle: '已结算', settleAt: at(-9, '10:00:00'), clawback: 12, clawbackAt: at(-1, '18:00:00'), lines: [{ name: '交接前苹果', paid: 100, commission: 30 }] },
      { id: 'MR15', store: 'S-DC', customer: 'C10', pay: at(-20, '11:00:00'), channel: 'live', role: 'bd', bd: ME, settle: '已结算', settleAt: at(0, '11:30:00'), lines: [{ name: '交接前牛奶', paid: 80, commission: 16 }] },
      { id: 'MR16', store: 'S-DC', customer: 'C11', pay: at(0, '13:00:00'), channel: 'mall', role: 'bd', bd: 'BD-OTHER', settle: '待结算', settleAt: '', lines: [{ name: '交接后牛肉', paid: 500, commission: 50 }] },
      { id: 'MR17', store: 'S-HP', customer: 'C03', pay: at(0, '08:20:00'), channel: 'live', role: 'bd', bd: ME, settle: '待结算', settleAt: '', lines: [{ name: '蓝莓', paid: 45, commission: 4.5 }] },
      { id: 'MR18', store: 'S-CN', customer: 'C04', pay: at(-2, '10:00:00'), channel: 'mall', role: 'bd', bd: ME, settle: '已结算', settleAt: at(-2, '12:00:00'), lines: [{ name: '番茄', paid: 70, commission: 7 }] },
      { id: 'MR19', store: 'S-CN', customer: 'C01', pay: at(-5, '10:00:00'), channel: 'mall', role: 'bd', bd: ME, settle: '已结算', settleAt: at(-4, '10:00:00'), lines: [{ name: '黄瓜', paid: 90, commission: 9 }] },
      { id: 'MR20', store: 'S-HP', customer: 'C04', pay: at(-3, '10:00:00'), channel: 'mall', role: 'bd', bd: ME, settle: '结算失败', settleAt: '', lines: [{ name: '芒果', paid: 55, commission: 5.5 }] },
      { id: 'MR21', store: 'S-CN', customer: 'C12', pay: at(-1, '20:00:00'), channel: 'mall', role: 'bd', bd: ME, configured: false, settle: '', settleAt: '', lines: [{ name: '未配置佣金的鱼', paid: 33, commission: null }] },
      { id: 'MR22', store: 'S-HP', customer: 'C01', pay: at(0, '09:00:00'), channel: 'mall', role: 'bd', bd: ME, settle: '待结算', settleAt: '', remark: '测试备注不排除', lines: [{ name: '葡萄', paid: 40, commission: 4 }] },
      { id: 'MR23', store: 'S-HP', customer: 'C04', pay: at(-1, '22:40:00'), channel: 'mall', role: 'bd', bd: ME, settle: '已结算', settleAt: at(-1, '23:10:00'), lines: [{ name: '夜宵饺子', paid: 100, commission: 10 }] },
      { id: 'MR29', store: 'S-CN', customer: 'C09', pay: at(-12, '10:00:00'), channel: 'mall', role: 'bd', bd: ME, settle: '已结算', settleAt: at(-11, '10:00:00'), lines: [{ name: '年糕', paid: 40, commission: 4 }] },
      { id: 'MR40', store: 'S-CN', customer: 'C01', pay: at(-40, '10:00:00'), channel: 'mall', role: 'bd', bd: ME, settle: '已结算', settleAt: at(-39, '10:00:00'), lines: [{ name: '陈年茶叶', paid: 1000, commission: 100 }] },
      { id: 'MR41', store: 'S-CN', customer: 'C02', pay: at(-1, '18:00:00'), channel: 'mall', role: 'bd', bd: ME, settle: '已取消', settleAt: '', lines: [{ name: '取消结算的鱼丸', paid: 15, commission: 1.5 }] }
    ];
    return retailCache;
  }
  function proxyOrders() {
    if (proxyCache) return proxyCache;
    var at = K().at;
    proxyCache = [
      { id: 'MP1', store: 'S-CN', pay: at(0, '11:00:00'), subCount: 2, lines: [{ name: '白菜', goods: 300, freight: 20 }, { name: '测试萝卜', goods: 80, freight: 5, test: true }] },
      { id: 'MP2', store: 'S-BJ', pay: at(0, '15:00:00'), subCount: 1, lines: [{ name: '冻虾', goods: 150, freight: 0 }] },
      { id: 'MP3', store: 'S-CN', pay: at(-1, '10:00:00'), subCount: 1, lines: [{ name: '土豆', goods: 100, freight: 10 }] },
      { id: 'MP4', store: 'S-CN', pay: at(-3, '10:00:00'), subCount: 3, lines: [{ name: '胡萝卜', goods: 80, freight: 8 }] },
      { id: 'MP5', store: 'S-CN', pay: at(-6, '10:00:00'), subCount: 1, lines: [{ name: '冬瓜', goods: 70, freight: 6 }] },
      { id: 'MP6', store: 'S-BJ', pay: at(-2, '10:00:00'), subCount: 1, lines: [{ name: '带鱼', goods: 40, freight: 4 }] },
      { id: 'MP7', store: 'S-TEST', pay: at(0, '10:00:00'), subCount: 1, lines: [{ name: '测试店进货', goods: 999, freight: 0 }] },
      { id: 'MP8', store: 'S-DC', pay: at(0, '10:00:00'), subCount: 1, lines: [{ name: '交接店进货', goods: 800, freight: 0 }] },
      { id: 'MP9', store: 'S-CN', pay: at(0, '12:00:00'), subCount: 1, freeGift: true, lines: [{ name: '免费赠品进货', goods: 0, freight: 0 }] },
      { id: 'MP10', store: 'S-XX', pay: at(-15, '10:00:00'), subCount: 1, zeroPromo: true, lines: [{ name: '零元营销进货', goods: 0, freight: 0 }] }
    ];
    return proxyCache;
  }

  function blockedOrder(o) {
    return !!(o.freeGift || o.pointsOnly || o.zeroPromo || o.pointsCashMix);
  }
  function activeRetailLines(o) {
    return (o.lines || []).filter(function (l) {
      if (l.test || K().isTestName(l.name)) return false;
      if (l.freeGift || l.pointsOnly || l.zeroPromo || l.pointsCashMix) return false;
      return true;
    });
  }
  function retailPaid(o) {
    var sum = 0;
    activeRetailLines(o).forEach(function (l) {
      sum = K().add(sum, l.paid);
    });
    return sum;
  }
  function countableRetail(o, bounds, storeId) {
    var store = storeById(o.store);
    if (excludedStore(store) || store.scope !== 'current') return false;
    if (storeId && o.store !== storeId) return false;
    if (blockedOrder(o)) return false;
    if (retailPaid(o) <= 0) return false;
    return K().inBounds(o.pay, bounds);
  }
  function proxyValue(o) {
    if (blockedOrder(o)) return null;
    var goods = 0;
    var freight = 0;
    var n = 0;
    (o.lines || []).forEach(function (l) {
      if (l.test || K().isTestName(l.name)) return;
      n += 1;
      goods = K().add(goods, l.goods);
      freight = K().add(freight, l.freight);
    });
    if (!n || (goods <= 0 && freight <= 0)) return null;
    return { goods: goods, freight: freight, total: K().add(goods, freight) };
  }
  function countableProxy(o, bounds, storeId) {
    var store = storeById(o.store);
    if (excludedStore(store) || store.scope !== 'current') return false;
    if (storeId && o.store !== storeId) return false;
    if (!proxyValue(o)) return false;
    return K().inBounds(o.pay, bounds);
  }

  function sourceName(channel) {
    return channel === 'live' ? '直播' : channel === 'proxy' ? '代采' : '商城';
  }
  function settleBucket(status) {
    if (status === '已结算') return 'settled';
    if (status === '待结算' || status === '结算中') return 'pending';
    if (status === '结算失败' || status === '已取消') return 'abnormal';
    return '';
  }
  function commissionOf(o) {
    if (o.role !== 'bd' || o.bd !== ME) return null;
    var store = storeById(o.store);
    if (excludedStore(store)) return null;
    if (o.configured === false) {
      return { amount: null, gross: null, clawback: 0, bucket: '', configured: false };
    }
    var gross = 0;
    var any = false;
    activeRetailLines(o).forEach(function (l) {
      if (l.commission == null) return;
      any = true;
      gross = K().add(gross, l.commission);
    });
    if (!any) return { amount: null, gross: null, clawback: 0, bucket: '', configured: false };
    var claw = Number(o.clawback) || 0;
    return {
      amount: K().round2(gross - claw),
      gross: gross,
      clawback: claw,
      bucket: settleBucket(o.settle),
      configured: true
    };
  }

  function pack(range, custom) {
    var bounds = K().resolveRange(range, custom);
    var prev = K().compareBounds(bounds);
    return { bounds: bounds, prev: prev, compareLabel: prev.label, updatedAt: K().UPDATED_AT };
  }
  function hourMatch(timeStr, hour) {
    if (hour == null) return true;
    return Number(K().hmOf(timeStr).slice(0, 2)) === hour;
  }
  function retailIn(bounds, storeId, day, hour) {
    return retailOrders().filter(function (o) {
      if (!countableRetail(o, bounds, storeId)) return false;
      if (day && K().dateKeyOf(o.pay) !== day) return false;
      return hourMatch(o.pay, hour);
    });
  }
  function proxyIn(bounds, storeId, day, hour) {
    return proxyOrders().filter(function (o) {
      if (!countableProxy(o, bounds, storeId)) return false;
      if (day && K().dateKeyOf(o.pay) !== day) return false;
      return hourMatch(o.pay, hour);
    });
  }

  function summarizeRetail(rows) {
    var paid = 0;
    var users = {};
    var days = {};
    var last = '';
    rows.forEach(function (o) {
      paid = K().add(paid, retailPaid(o));
      if (o.customer) users[o.customer] = true;
      var day = K().dateKeyOf(o.pay);
      if (day) {
        days[day] = true;
        if (!last || day > last) last = day;
      }
    });
    var orders = rows.length;
    return {
      paid: paid,
      orders: orders,
      users: Object.keys(users).length,
      aov: orders > 0 ? K().round2(paid / orders) : null,
      days: Object.keys(days).length,
      last: last || null
    };
  }
  function summarizeProxy(rows) {
    var goods = 0;
    var freight = 0;
    var days = {};
    rows.forEach(function (o) {
      var v = proxyValue(o);
      goods = K().add(goods, v.goods);
      freight = K().add(freight, v.freight);
      var day = K().dateKeyOf(o.pay);
      if (day) days[day] = true;
    });
    var keys = Object.keys(days).sort();
    var interval = null;
    if (keys.length >= 2) interval = K().round2(K().daysBetween(keys[0], keys[keys.length - 1]) / (keys.length - 1));
    var orders = rows.length;
    return {
      goods: goods,
      freight: freight,
      total: K().add(goods, freight),
      orders: orders,
      aov: orders > 0 ? K().round2(goods / orders) : null,
      days: keys.length,
      last: keys.length ? keys[keys.length - 1] : null,
      first: keys.length ? keys[0] : null,
      interval: interval
    };
  }
  function myCommissionRows(bounds, dim) {
    return retailOrders().filter(function (o) {
      if (!commissionOf(o)) return false;
      var store = storeById(o.store);
      if (!store || excludedStore(store)) return false;
      if (dim === 'settle') return o.settleAt && K().inBounds(o.settleAt, bounds);
      return K().inBounds(o.pay, bounds);
    });
  }
  function sumCommission(rows, scope) {
    var picked = rows.filter(function (o) {
      var store = storeById(o.store);
      return scope === 'history' ? store.scope === 'history' : store.scope === 'current';
    });
    if (!picked.length) return { total: null, pending: null, settled: null, rows: [] };
    var total = 0;
    var pending = 0;
    var settled = 0;
    var formed = 0;
    picked.forEach(function (o) {
      var c = commissionOf(o);
      if (c.amount == null || c.bucket === 'abnormal' || !c.bucket) return;
      formed += 1;
      total = K().add(total, c.amount);
      if (c.bucket === 'pending') pending = K().add(pending, c.amount);
      if (c.bucket === 'settled') settled = K().add(settled, c.amount);
    });
    return {
      total: formed ? total : null,
      pending: formed ? pending : null,
      settled: formed ? settled : null,
      rows: picked
    };
  }

  function storeRoll(bounds) {
    return currentStores().map(function (s) {
      var retail = summarizeRetail(retailIn(bounds, s.id));
      var proxy = summarizeProxy(proxyIn(bounds, s.id));
      return { id: s.id, name: s.name, retail: retail, proxy: proxy };
    });
  }
  function businessCounts(bounds) {
    var retailIds = {};
    var proxyIds = {};
    retailIn(bounds).forEach(function (o) {
      retailIds[o.store] = true;
    });
    proxyIn(bounds).forEach(function (o) {
      proxyIds[o.store] = true;
    });
    var both = 0;
    Object.keys(retailIds).forEach(function (id) {
      if (proxyIds[id]) both += 1;
    });
    return {
      responsible: currentStores().length,
      retailStores: Object.keys(retailIds).length,
      proxyStores: Object.keys(proxyIds).length,
      both: both
    };
  }

  function metricValue(bounds, kind, storeId, slot) {
    var day = slot && slot.day;
    var hour = slot ? slot.hour : null;
    if (kind === 'proxyGoods' || kind === 'proxyTotal') {
      var p = summarizeProxy(proxyIn(bounds, storeId, day, hour));
      return kind === 'proxyTotal' ? p.total : p.goods;
    }
    if (kind === 'orders') return retailIn(bounds, storeId, day, hour).length;
    if (kind === 'users') return summarizeRetail(retailIn(bounds, storeId, day, hour)).users;
    if (kind === 'commission') {
      var rows = myCommissionRows(bounds, 'pay').filter(function (o) {
        var store = storeById(o.store);
        if (!store || store.scope !== 'current') return false;
        if (storeId && o.store !== storeId) return false;
        if (day && K().dateKeyOf(o.pay) !== day) return false;
        return hourMatch(o.pay, hour);
      });
      var packSum = sumCommission(rows, 'current');
      return packSum.total == null ? 0 : packSum.total;
    }
    return summarizeRetail(retailIn(bounds, storeId, day, hour)).paid;
  }

  function rankOf(bounds, prev, tab, rank) {
    var key = rank;
    if (tab === 'proxy') {
      if (key !== 'goods' && key !== 'total' && key !== 'orders') key = 'goods';
    } else if (key !== 'paid' && key !== 'orders' && key !== 'users') key = 'paid';
    var rows = storeRoll(bounds).map(function (s) {
      var cur = tab === 'proxy' ? (key === 'orders' ? s.proxy.orders : key === 'total' ? s.proxy.total : s.proxy.goods) : key === 'orders' ? s.retail.orders : key === 'users' ? s.retail.users : s.retail.paid;
      return { id: s.id, name: s.name, value: cur, orders: tab === 'proxy' ? s.proxy.orders : s.retail.orders, extra: s };
    });
    var prevRows = storeRoll(prev);
    rows.forEach(function (row) {
      var p = null;
      prevRows.forEach(function (s) {
        if (s.id === row.id) p = s;
      });
      var prevVal = 0;
      if (p) {
        prevVal = tab === 'proxy' ? (key === 'orders' ? p.proxy.orders : key === 'total' ? p.proxy.total : p.proxy.goods) : key === 'orders' ? p.retail.orders : key === 'users' ? p.retail.users : p.retail.paid;
      }
      row.delta = K().deltaPack(row.value, prevVal);
    });
    rows.sort(function (a, b) {
      if (b.value !== a.value) return b.value - a.value;
      return a.name < b.name ? -1 : 1;
    });
    var label = tab === 'proxy' ? (key === 'orders' ? '支付主订单数' : key === 'total' ? '进货支付总额' : '商品支付金额') : key === 'orders' ? '支付主订单数' : key === 'users' ? '支付人数' : '支付成交额';
    return { key: key, label: label, money: key !== 'orders' && key !== 'users', rows: rows };
  }

  function overview(range, custom) {
    var p = pack(range, custom);
    var curR = summarizeRetail(retailIn(p.bounds));
    var prevR = summarizeRetail(retailIn(p.prev));
    var curP = summarizeProxy(proxyIn(p.bounds));
    var prevP = summarizeProxy(proxyIn(p.prev));
    var curC = sumCommission(myCommissionRows(p.bounds, 'pay'), 'current');
    var prevC = sumCommission(myCommissionRows(p.prev, 'pay'), 'current');
    var counts = businessCounts(p.bounds);
    return {
      bdName: BD_NAME,
      updatedAt: p.updatedAt,
      bounds: p.bounds,
      compareLabel: p.compareLabel,
      counts: counts,
      retail: {
        paid: curR.paid,
        prevPaid: prevR.paid,
        delta: K().deltaPack(curR.paid, prevR.paid),
        orders: curR.orders,
        users: curR.users
      },
      proxy: {
        goods: curP.goods,
        prevGoods: prevP.goods,
        delta: K().deltaPack(curP.goods, prevP.goods),
        freight: curP.freight,
        total: curP.total,
        orders: curP.orders
      },
      commission: {
        total: curC.total,
        prev: prevC.total,
        delta: K().deltaPack(curC.total, prevC.total)
      },
      rank: rankOf(p.bounds, p.prev, 'retail', 'paid'),
      trend: K().buildTrend(p.bounds, function (slot) {
        return metricValue(p.bounds, 'paid', '', slot);
      })
    };
  }

  function storesView(range, custom, tab, rank) {
    var p = pack(range, custom);
    var mode = tab === 'proxy' ? 'proxy' : 'retail';
    var ranked = rankOf(p.bounds, p.prev, mode, rank);
    var retail = summarizeRetail(retailIn(p.bounds));
    var prevRetail = summarizeRetail(retailIn(p.prev));
    var proxy = summarizeProxy(proxyIn(p.bounds));
    var prevProxy = summarizeProxy(proxyIn(p.prev));
    var allProxy = summarizeProxy(proxyOrders().filter(function (o) {
      return countableProxy(o, { startKey: '2000-01-01', endKey: '2999-12-31', cutoffHm: '' });
    }));
    return {
      updatedAt: p.updatedAt,
      bounds: p.bounds,
      compareLabel: p.compareLabel,
      tab: mode,
      retail: retail,
      retailDelta: {
        paid: K().deltaPack(retail.paid, prevRetail.paid),
        orders: K().deltaPack(retail.orders, prevRetail.orders),
        users: K().deltaPack(retail.users, prevRetail.users),
        aov: K().deltaPack(retail.aov, prevRetail.aov)
      },
      proxy: proxy,
      proxyDelta: {
        goods: K().deltaPack(proxy.goods, prevProxy.goods),
        total: K().deltaPack(proxy.total, prevProxy.total),
        orders: K().deltaPack(proxy.orders, prevProxy.orders)
      },
      historyLastPurchase: allProxy.last,
      rank: ranked,
      trend: K().buildTrend(p.bounds, function (slot) {
        return metricValue(p.bounds, mode === 'proxy' ? (ranked.key === 'total' ? 'proxyTotal' : 'proxyGoods') : 'paid', '', slot);
      })
    };
  }

  function storeView(range, custom, storeId, tab) {
    var store = storeById(storeId);
    var p = pack(range, custom);
    if (!store || excludedStore(store)) {
      return { blocked: 'test', name: store ? store.name : '', updatedAt: p.updatedAt, bounds: p.bounds, compareLabel: p.compareLabel };
    }
    if (store.scope !== 'current') {
      return { blocked: 'history', id: store.id, name: store.name, updatedAt: p.updatedAt, bounds: p.bounds, compareLabel: p.compareLabel };
    }
    var mode = tab === 'proxy' ? 'proxy' : 'retail';
    var retail = summarizeRetail(retailIn(p.bounds, store.id));
    var prevRetail = summarizeRetail(retailIn(p.prev, store.id));
    var proxy = summarizeProxy(proxyIn(p.bounds, store.id));
    var prevProxy = summarizeProxy(proxyIn(p.prev, store.id));
    var historyProxy = summarizeProxy(proxyOrders().filter(function (o) {
      return countableProxy(o, { startKey: '2000-01-01', endKey: '2999-12-31', cutoffHm: '' }, store.id);
    }));
    var historyRetail = summarizeRetail(retailOrders().filter(function (o) {
      return countableRetail(o, { startKey: '2000-01-01', endKey: '2999-12-31', cutoffHm: '' }, store.id);
    }));
    return {
      blocked: '',
      id: store.id,
      name: store.name,
      updatedAt: p.updatedAt,
      bounds: p.bounds,
      compareLabel: p.compareLabel,
      tab: mode,
      retail: retail,
      retailDelta: {
        paid: K().deltaPack(retail.paid, prevRetail.paid),
        orders: K().deltaPack(retail.orders, prevRetail.orders),
        users: K().deltaPack(retail.users, prevRetail.users)
      },
      proxy: proxy,
      proxyDelta: {
        goods: K().deltaPack(proxy.goods, prevProxy.goods),
        total: K().deltaPack(proxy.total, prevProxy.total)
      },
      historyLastRetail: historyRetail.last,
      historyLastPurchase: historyProxy.last,
      trend: K().buildTrend(p.bounds, function (slot) {
        return metricValue(p.bounds, mode === 'proxy' ? 'proxyGoods' : 'paid', store.id, slot);
      })
    };
  }

  function analysis(range, custom, scope, dim) {
    var p = pack(range, custom);
    var mode = dim === 'settle' ? 'settle' : 'pay';
    var which = scope === 'history' ? 'history' : 'current';
    var cur = sumCommission(myCommissionRows(p.bounds, mode), which);
    var prev = sumCommission(myCommissionRows(p.prev, mode), which);
    var byStore = {};
    var bySource = {};
    cur.rows.forEach(function (o) {
      var c = commissionOf(o);
      if (c.amount == null || c.bucket === 'abnormal' || !c.bucket) return;
      var name = storeById(o.store).name;
      if (!byStore[name]) byStore[name] = 0;
      byStore[name] = K().add(byStore[name], c.amount);
      var src = sourceName(o.channel);
      if (!bySource[src]) bySource[src] = 0;
      bySource[src] = K().add(bySource[src], c.amount);
    });
    return {
      updatedAt: p.updatedAt,
      bounds: p.bounds,
      compareLabel: p.compareLabel,
      scope: which,
      dim: mode,
      total: cur.total,
      pending: cur.pending,
      settled: cur.settled,
      delta: K().deltaPack(cur.total, prev.total),
      byStore: Object.keys(byStore).map(function (name) {
        return { name: name, amount: byStore[name] };
      }).sort(function (a, b) {
        return b.amount - a.amount;
      }),
      bySource: ['商城', '直播', '代采'].map(function (name) {
        return { name: name, amount: Object.prototype.hasOwnProperty.call(bySource, name) ? bySource[name] : name === '代采' ? null : 0 };
      }),
      trend: K().buildTrend(p.bounds, function (slot) {
        var rows = myCommissionRows(p.bounds, mode).filter(function (o) {
          var store = storeById(o.store);
          if ((which === 'history') !== (store.scope === 'history')) return false;
          var t = mode === 'settle' ? o.settleAt : o.pay;
          if (slot.day && K().dateKeyOf(t) !== slot.day) return false;
          return hourMatch(t, slot.hour);
        });
        var s = sumCommission(rows, which);
        return s.total == null ? 0 : s.total;
      })
    };
  }

  function commissionList(range, custom, scope, dim, source, status, storeId) {
    var view = analysis(range, custom, scope, dim);
    var src = source === '直播' || source === 'live' ? '直播' : source === '商城' || source === 'mall' ? '商城' : 'all';
    var st = status || 'all';
    var rows = view.byStore && sumCommission(myCommissionRows(view.bounds, view.dim), view.scope).rows;
    rows = (rows || []).filter(function (o) {
      if (storeId && o.store !== storeId) return false;
      if (src !== 'all' && sourceName(o.channel) !== src) return false;
      if (st !== 'all' && (o.settle || '未配置') !== st) return false;
      return true;
    });
    var formed = rows.filter(function (o) {
      var c = commissionOf(o);
      return c && c.amount != null && c.bucket && c.bucket !== 'abnormal';
    });
    var total = null;
    var pending = null;
    var settled = null;
    if (rows.length) {
      pending = 0;
      settled = 0;
      if (formed.length) total = 0;
      formed.forEach(function (o) {
        var c = commissionOf(o);
        total = K().add(total, c.amount);
        if (c.bucket === 'pending') pending = K().add(pending, c.amount);
        if (c.bucket === 'settled') settled = K().add(settled, c.amount);
      });
    }
    return {
      updatedAt: view.updatedAt,
      bounds: view.bounds,
      compareLabel: view.compareLabel,
      scope: view.scope,
      dim: view.dim,
      total: total,
      pending: pending,
      settled: settled,
      rows: rows.map(function (o) {
        var c = commissionOf(o);
        var store = storeById(o.store);
        return {
          id: o.id,
          storeId: o.store,
          storeName: store.name,
          history: store.scope === 'history',
          source: sourceName(o.channel),
          pay: o.pay,
          settleAt: o.settleAt || '',
          settle: o.settle || (c.configured ? '' : '未配置'),
          amount: c.amount,
          gross: c.gross,
          clawback: c.clawback || 0,
          clawbackAt: o.clawbackAt || '',
          goods: activeRetailLines(o).map(function (l) {
            return l.name;
          }).join('、') || '—'
        };
      })
    };
  }

  function near(a, b) {
    return Math.abs(Number(a) - Number(b)) < 0.02;
  }
  function selfCheck() {
    var errs = [];
    var today = overview('today');
    var y = storesView('yesterday');
    var d7 = storesView('7d');
    var d30 = storesView('30d');
    var custom = overview('custom', { start: K().DEMO_TODAY, end: K().DEMO_TODAY });
    if (today.counts.responsible !== 4) errs.push('负责门店数');
    if (today.counts.retailStores !== 2 || today.counts.proxyStores !== 2 || today.counts.both !== 1) errs.push('门店覆盖');
    if (!near(today.retail.paid, 525) || today.retail.orders !== 6 || today.retail.users !== 4) errs.push('今日零售');
    if (!near(today.retail.prevPaid, 187.9)) errs.push('今日对比时段');
    if (!near(today.proxy.goods, 450) || today.proxy.orders !== 2) errs.push('今日代采');
    if (!near(today.commission.total, 28.5)) errs.push('今日本人佣金');
    if (!near(y.retail.paid, 287.9)) errs.push('昨日零售');
    if (!near(d7.retail.paid, 502.9) || !near(d30.retail.paid, 542.9)) errs.push('7/30天');
    if (!near(custom.retail.paid, 575)) errs.push('自定义含截止后');
    if (d30.rank.rows.some(function (r) { return r.id === 'S-TEST' || r.id === 'S-DC'; })) errs.push('测试或交接店进入排行');
    var cn = storeView('today', null, 'S-CN', 'retail');
    var hp = storeView('today', null, 'S-HP', 'retail');
    if (cn.retail.users + hp.retail.users === today.retail.users) errs.push('人数未跨店去重');
    if (storeView('today', null, 'S-DC').blocked !== 'history') errs.push('交接店未拦截');
    if (storeView('today', null, 'S-DC').retail) errs.push('交接店仍返回业务');
    if (storeView('today', null, 'S-XX', 'retail').retail.paid !== 0) errs.push('无成交不是0');
    if (storeView('today', null, 'S-XX', 'retail').retail.aov != null) errs.push('无成交客单价应为—');
    var gap = storesView('7d', null, 'proxy');
    var cnProxy = null;
    gap.rank.rows.forEach(function (r) {
      if (r.id === 'S-CN') cnProxy = r.extra.proxy;
    });
    if (!cnProxy || cnProxy.interval == null || !near(cnProxy.interval, 2.5)) errs.push('进货间隔');
    if (storesView('today', null, 'proxy').rank.rows.filter(function (r) { return r.id === 'S-CN'; })[0].extra.proxy.interval != null) errs.push('单日间隔应为空');
    var cur = commissionList('today', null, 'current', 'pay', 'all', 'all');
    var hist = commissionList('today', null, 'history', 'pay', 'all', 'all');
    var histSettle = commissionList('today', null, 'history', 'settle', 'all', 'all');
    if (cur.rows.some(function (r) { return r.storeId === 'S-DC' || r.id === 'MR11' || r.id === 'MR10'; })) errs.push('当前佣金混入');
    if (hist.rows.length) errs.push('今日支付不应有历史佣金');
    if (!histSettle.rows.some(function (r) { return r.id === 'MR15'; })) errs.push('历史结算未保留');
    if (histSettle.rows.some(function (r) { return r.id === 'MR16'; })) errs.push('他人佣金');
    var h30 = commissionList('30d', null, 'history', 'pay', 'all', 'all');
    if (!h30.rows.some(function (r) { return r.id === 'MR14' && near(r.amount, 18); })) errs.push('退款冲回');
    if (commissionList('30d', null, 'current', 'pay').rows.some(function (r) { return r.id === 'MR14'; })) errs.push('历史佣金进入当前');
    if (K().RANGES.some(function (r) { return r.id === 'week' || r.name === '本周'; })) errs.push('出现本周');
    var ids = today.rank.rows.map(function (r) { return r.id; });
    if (ids.indexOf('S-TEST') >= 0) errs.push('测试门店');
    return { ok: errs.length === 0, errors: errs, todayPaid: today.retail.paid, users: today.retail.users };
  }

  global.StoreAppBdDcData = {
    BD_NAME: BD_NAME,
    overview: overview,
    storesView: storesView,
    storeView: storeView,
    analysis: analysis,
    commissionList: commissionList,
    selfCheck: selfCheck,
    tips: {
      overview: '先看当前负责门店的零售成交和代采进货，两笔数不要相加当营业额。负责门店数是现在的负责关系，不是有成交的门店数。本人佣金只统计这些门店里实际归本人的 BD 佣金，不含已交接门店，也不含本人兼任店长或主播的所得。',
      retail: '零售支付成交额只计当前负责门店的有效销售。支付主订单按单去重，供应商子单和包裹不增加订单数。支付人数按消费者跨门店重新去重。免费赠品、纯积分、零元营销、积分加现金补差不计入；福利低价仍计入。',
      proxy: '代采商品支付金额不含运费，运费和进货总额分开看。进货客单价＝商品支付金额÷支付主订单数。平均进货间隔＝（本期最近进货日－本期最早进货日）÷（进货天数－1），按自然日去重；少于 2 个进货日显示—。本期最近进货日只取所选周期。',
      commission: '当前负责门店：这些门店里实际归本人的佣金。历史佣金：已不再负责的门店里，过去归本人的佣金以及后来的结算、退款冲回。两边不重复，交接不会把佣金转给新 BD。按支付时间圈定支付成功订单上的佣金；按结算时间按佣金结算单创建时间。结算中计入待结算。未配置、结算失败、已取消不进合计。账户余额和提现不在这里。',
      note: K().DATA_NOTE
    }
  };
})(typeof window !== 'undefined' ? window : global);
