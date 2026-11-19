/**
 * 平台数据中心 · 经营数据 · 计算与工具
 */
(function (global) {
  'use strict';

  var raw = global.MdmDataBizData;
  if (!raw) return;

  function parseTs(s) {
    return new Date(s).getTime();
  }

  function asOfDate() {
    return new Date(raw.AS_OF);
  }

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function ymd(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  }

  function cloneDate(d) {
    return new Date(d.getTime());
  }

  function isTestName(name) {
    return /测试|test/i.test(String(name || ''));
  }

  function money(n) {
    if (n == null || n !== n || !isFinite(n)) return '—';
    return (
      '¥' +
      Number(n).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    );
  }

  function intText(n) {
    if (n == null || n !== n || !isFinite(n)) return '—';
    return Number(n).toLocaleString('zh-CN');
  }

  function pctText(n, digits) {
    if (n == null || n !== n || !isFinite(n)) return '—';
    return (Number(n) * 100).toFixed(digits == null ? 1 : digits) + '%';
  }

  function ppText(n) {
    if (n == null || n !== n || !isFinite(n)) return '—';
    var v = Number(n) * 100;
    var sign = v > 0 ? '+' : '';
    return sign + v.toFixed(1) + ' ppt';
  }

  function round2(n) {
    return Math.round(Number(n) * 100) / 100;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** 周期：返回 { start, end, label, compareStart, compareEnd, compareLabel }，end 为开区间右端 */
  function resolvePeriod(key, customFrom, customTo, now) {
    now = now || asOfDate();
    var end = cloneDate(now);
    var start;
    var compareStart;
    var compareEnd;
    var label;
    var compareLabel;

    function setDayRange(dayStart, dayEndExclusive) {
      start = dayStart;
      end = dayEndExclusive;
    }

    if (key === 'today') {
      var today0 = startOfDay(now);
      setDayRange(today0, end);
      var y0 = new Date(today0);
      y0.setDate(y0.getDate() - 1);
      var elapsed = now.getTime() - today0.getTime();
      compareStart = y0;
      compareEnd = new Date(y0.getTime() + elapsed);
      label = '今日';
      compareLabel = '昨日同时段';
    } else if (key === 'yesterday') {
      var t0 = startOfDay(now);
      var yStart = new Date(t0);
      yStart.setDate(yStart.getDate() - 1);
      setDayRange(yStart, t0);
      var pStart = new Date(yStart);
      pStart.setDate(pStart.getDate() - 1);
      compareStart = pStart;
      compareEnd = yStart;
      label = '昨日';
      compareLabel = '前日';
    } else if (key === 'week') {
      /* 已废弃本周：旧调用落到近7天 */
      return resolvePeriod('7d', customFrom, customTo, now);
    } else if (key === 'month') {
      /* 已废弃本月：旧调用落到近30天 */
      return resolvePeriod('30d', customFrom, customTo, now);
    } else if (key === '7d' || key === '30d') {
      /* 近 N 天：截至 asOf 的滚动窗口，对比等长同期（相同已过时段） */
      var days = key === '7d' ? 7 : 30;
      var curEnd = cloneDate(now);
      var curStart = cloneDate(now);
      curStart.setDate(curStart.getDate() - days);
      setDayRange(curStart, curEnd);
      compareEnd = cloneDate(curStart);
      compareStart = cloneDate(curStart);
      compareStart.setDate(compareStart.getDate() - days);
      label = key === '7d' ? '近7天' : '近30天';
      compareLabel = key === '7d' ? '近7天同期' : '近30天同期';
    } else if (key === 'custom') {
      var f = customFrom ? startOfDay(new Date(customFrom + 'T00:00:00')) : startOfDay(now);
      var t = customTo ? startOfDay(new Date(customTo + 'T00:00:00')) : startOfDay(now);
      t.setDate(t.getDate() + 1);
      setDayRange(f, t);
      var len = t.getTime() - f.getTime();
      compareEnd = f;
      compareStart = new Date(f.getTime() - len);
      label = ymd(f) + ' ~ ' + ymd(new Date(t.getTime() - 1));
      compareLabel = '此前等长周期';
    } else {
      return resolvePeriod('today', customFrom, customTo, now);
    }

    return {
      key: key,
      start: start,
      end: end,
      label: label,
      compareStart: compareStart,
      compareEnd: compareEnd,
      compareLabel: compareLabel,
      asOf: now
    };
  }

  function inRange(ts, start, end) {
    return ts >= start.getTime() && ts < end.getTime();
  }

  function storeById(id) {
    for (var i = 0; i < raw.stores.length; i++) {
      if (raw.stores[i].id === id) return raw.stores[i];
    }
    return null;
  }

  /**
   * 行级纳入：剔除测试门店、测试商品行；赠品行金额为0不进成交但保留订单
   * 返回订单加工结果；excludedEntirely 表示整单不计入
   */
  function normalizeOrder(order) {
    if (isTestName(order.storeName)) {
      return { excludedEntirely: true, order: order };
    }
    var keptLines = [];
    var excludedLineIds = {};
    var goodsCash = 0;
    var costKnown = true;
    var costSum = 0;
    var hasPaidSaleLine = false;

    order.lines.forEach(function (line) {
      if (isTestName(line.name)) {
        excludedLineIds[line.id] = true;
        return;
      }
      keptLines.push(line);
      if (!line.gift && Number(line.cashShare) > 0) hasPaidSaleLine = true;
      goodsCash += Number(line.cashShare) || 0;
      if (line.cost == null || line.cost !== line.cost) costKnown = false;
      else costSum += Number(line.cost) || 0;
    });

    if (!keptLines.length || (!hasPaidSaleLine && order.saleKind !== 'points_cashmix' && order.saleKind !== 'points_pure')) {
      /* 全部商品排除，或无可计销售行 */
      if (!keptLines.length) return { excludedEntirely: true, order: order };
    }

    /* 纯积分／零元营销不进正常销售金额，但 points_cashmix 的现金部分单独标记 */
    var includeInNormalSales =
      order.saleKind === 'normal' && hasPaidSaleLine;

    /* 运费：优先系统分摊；否则按商品实付占比；剔除测试行份额 */
    var freightKeep = 0;
    var freightMissingSplit = false;
    if (Number(order.cashFreight) > 0) {
      var totalGoods = order.lines.reduce(function (s, l) {
        return s + (Number(l.cashShare) || 0);
      }, 0);
      var keptGoodsBase = order.lines.reduce(function (s, l) {
        if (excludedLineIds[l.id]) return s;
        return s + (Number(l.cashShare) || 0);
      }, 0);

      if (order.freightAlloc && order.freightAlloc.length) {
        order.freightAlloc.forEach(function (a) {
          if (!excludedLineIds[a.lineId]) freightKeep += Number(a.freightShare) || 0;
        });
        freightKeep = round2(freightKeep);
      } else if (totalGoods > 0) {
        freightKeep = round2((Number(order.cashFreight) * keptGoodsBase) / totalGoods);
      } else {
        freightMissingSplit = true;
        freightKeep = null;
      }
    }

    return {
      excludedEntirely: false,
      includeInNormalSales: includeInNormalSales,
      isPointsCashmix: order.saleKind === 'points_cashmix',
      isPointsPure: order.saleKind === 'points_pure',
      order: order,
      keptLines: keptLines,
      excludedLineIds: excludedLineIds,
      goodsCash: round2(goodsCash),
      freightCash: freightKeep,
      freightMissingSplit: freightMissingSplit,
      costKnown: costKnown,
      costSum: costKnown ? round2(costSum) : null,
      hasPaidSaleLine: hasPaidSaleLine
    };
  }

  function refundsForOrder(orderId) {
    return raw.refunds.filter(function (r) {
      return r.orderId === orderId;
    });
  }

  /**
   * 视角 A：对一批支付订单计算退款后净商品实付、剩余成本、毛利、关联平台所得
   */
  function metricsForPaidOrders(normList, asOfTs) {
    var payGoods = 0;
    var payFreight = 0;
    var refundGoods = 0;
    var refundFreight = 0;
    var orderIds = {};
    var consumers = {};
    var proxyStores = {};
    var retailStores = {};
    var marginSum = 0;
    var marginDenom = 0;
    var marginPending = 0;
    var marginReady = 0;
    var platformRetailGoods = 0;
    var platformProxyGoods = 0;
    var platformProxyFreight = 0;
    var settlePending = 0;
    var settleReady = 0;
    var detailRows = [];

    normList.forEach(function (n) {
      if (n.excludedEntirely) return;
      var o = n.order;
      var countOrder =
        n.includeInNormalSales || n.isPointsCashmix === false
          ? n.includeInNormalSales
          : false;
      /* 正常销售订单计入成交；积分补差不进正常客单价分母/分子，但可单独列 */
      if (n.includeInNormalSales) {
        payGoods += n.goodsCash;
        if (n.freightCash != null) payFreight += n.freightCash;
        orderIds[o.id] = true;
        if (o.biz === 'retail' && o.consumerId) consumers[o.consumerId] = true;
        if (o.biz === 'proxy') proxyStores[o.storeId] = true;
        if (o.biz === 'retail') retailStores[o.storeId] = true;
      }

      /* 成本与毛利：对正常销售订单计算 */
      if (n.includeInNormalSales) {
        var lineState = {};
        n.keptLines.forEach(function (line) {
          lineState[line.id] = {
            cash: Number(line.cashShare) || 0,
            cost: line.cost,
            qty: Number(line.qty) || 0,
            purchaseQty: Number(line.purchaseQty) || 0,
            gift: !!line.gift
          };
        });

        refundsForOrder(o.id).forEach(function (rf) {
          if (parseTs(rf.completeTime) > asOfTs) return;
          if (n.excludedLineIds[rf.lineId]) return;
          refundGoods += Number(rf.goodsAmount) || 0;
          refundFreight += Number(rf.freightAmount) || 0;

          if (rf.mode === 'freight_only') return;
          if (rf.mode === 'full' && rf.lineId && lineState[rf.lineId]) {
            lineState[rf.lineId].cash = 0;
            lineState[rf.lineId].cost = 0;
            lineState[rf.lineId].qty = 0;
            lineState[rf.lineId].purchaseQty = 0;
          } else if (rf.mode === 'qty_partial' && rf.lineId && lineState[rf.lineId]) {
            var st = lineState[rf.lineId];
            var qRefund = Number(rf.qtyRefund) || 0;
            var pqRefund = Number(rf.purchaseQtyRefund) || qRefund;
            if (st.qty > 0) {
              var unitCash = st.cash / st.qty;
              st.cash = round2(st.cash - unitCash * qRefund);
              st.qty = Math.max(0, st.qty - qRefund);
            }
            if (st.cost != null && st.purchaseQty > 0) {
              var unitCost = st.cost / st.purchaseQty;
              st.cost = round2(st.cost - unitCost * pqRefund);
              st.purchaseQty = Math.max(0, st.purchaseQty - pqRefund);
            }
          } else if (rf.mode === 'amount_only' && rf.lineId && lineState[rf.lineId]) {
            lineState[rf.lineId].cash = round2(
              Math.max(0, lineState[rf.lineId].cash - (Number(rf.goodsAmount) || 0))
            );
            /* 成本不变 */
          }
        });

        var netGoods = 0;
        var remainCost = 0;
        var costOk = true;
        Object.keys(lineState).forEach(function (lid) {
          var st = lineState[lid];
          if (st.gift) return;
          netGoods += st.cash;
          if (st.cost == null || st.cost !== st.cost) costOk = false;
          else remainCost += Number(st.cost) || 0;
        });
        netGoods = round2(netGoods);
        remainCost = round2(remainCost);

        var rowMargin = null;
        if (!costOk) {
          marginPending += 1;
        } else {
          rowMargin = round2(netGoods - remainCost);
          marginSum += rowMargin;
          marginDenom += netGoods;
          marginReady += 1;
        }

        detailRows.push({
          orderId: o.id,
          biz: o.biz,
          channel: o.channel,
          storeId: o.storeId,
          storeName: o.storeName,
          payTime: o.payTime,
          payGoods: n.goodsCash,
          payFreight: n.freightCash,
          netGoods: netGoods,
          remainCost: costOk ? remainCost : null,
          margin: rowMargin,
          consumerId: o.consumerId
        });
      }

      /* 平台所得：关联本支付单、且结算创建 ≤ asOf */
      raw.settlements.forEach(function (s) {
        if (s.orderId !== o.id) return;
        if (parseTs(s.createdAt) > asOfTs) return;
        if (isTestName(o.storeName)) return;
        /* 测试商品行对应所得：演示用订单级所得，若订单含测试行按商品实付占比缩放 */
        var share = Number(s.platformShare) || 0;
        var scale = 1;
        if (n.goodsCash > 0 && o.lines) {
          var allGoods = o.lines.reduce(function (sum, l) {
            return sum + (Number(l.cashShare) || 0);
          }, 0);
          if (allGoods > 0 && n.goodsCash < allGoods) scale = n.goodsCash / allGoods;
        }
        if (n.freightCash != null && s.kind === 'freight' && Number(o.cashFreight) > 0) {
          scale = n.freightCash / Number(o.cashFreight);
        }
        share = round2(share * scale);
        if (s.kind === 'goods' && o.biz === 'retail') platformRetailGoods += share;
        else if (s.kind === 'goods' && o.biz === 'proxy') platformProxyGoods += share;
        else if (s.kind === 'freight') platformProxyFreight += share;
        settleReady += 1;
      });
    });

    /* 未形成结算的正常订单计数 */
    normList.forEach(function (n) {
      if (!n.includeInNormalSales) return;
      var hasSettle = raw.settlements.some(function (s) {
        return s.orderId === n.order.id && parseTs(s.createdAt) <= asOfTs;
      });
      if (!hasSettle) settlePending += 1;
    });

    var orderCount = Object.keys(orderIds).length;
    var marginRate =
      marginDenom > 0 && marginPending === 0 ? marginSum / marginDenom : marginDenom > 0 ? marginSum / marginDenom : null;
    /* 有成本缺失时毛利率仍可用已形成部分计算，但页面展示完成情况 */

    return {
      payGoods: round2(payGoods),
      payFreight: round2(payFreight),
      payTotal: round2(payGoods + payFreight),
      refundGoods: round2(refundGoods),
      refundFreight: round2(refundFreight),
      orderCount: orderCount,
      consumerCount: Object.keys(consumers).length,
      retailStoreCount: Object.keys(retailStores).length,
      proxyStoreCount: Object.keys(proxyStores).length,
      bothStoreCount: Object.keys(retailStores).filter(function (id) {
        return proxyStores[id];
      }).length,
      aov:
        orderCount > 0
          ? round2(
              /* 零售客单价用商品支付；代采进货客单价不含运费——分业务线时再算 */
              payGoods / orderCount
            )
          : null,
      marginSum:
        orderCount === 0
          ? null
          : marginPending === orderCount
            ? null
            : round2(marginSum),
      marginDenom: round2(marginDenom),
      marginRate: orderCount === 0 || marginDenom <= 0 ? null : marginSum / marginDenom,
      marginPending: marginPending,
      marginReady: marginReady,
      platformRetailGoods: round2(platformRetailGoods),
      platformProxyGoods: round2(platformProxyGoods),
      platformProxyFreight: round2(platformProxyFreight),
      platformTotal: round2(platformRetailGoods + platformProxyGoods + platformProxyFreight),
      settlePending: settlePending,
      settleReady: settleReady,
      detailRows: detailRows,
      retailStoreSet: retailStores,
      proxyStoreSet: proxyStores
    };
  }

  function filterNormOrders(opts) {
    opts = opts || {};
    var list = [];
    raw.orders.forEach(function (o) {
      if (opts.biz && o.biz !== opts.biz) return;
      if (opts.channel && o.channel !== opts.channel) return;
      if (opts.storeId && o.storeId !== opts.storeId) return;
      if (opts.storeIds && opts.storeIds.length && opts.storeIds.indexOf(o.storeId) < 0) return;
      var n = normalizeOrder(o);
      if (n.excludedEntirely) return;
      list.push(n);
    });
    return list;
  }

  function paidInPeriod(normList, start, end) {
    return normList.filter(function (n) {
      return inRange(parseTs(n.order.payTime), start, end);
    });
  }

  /** 视角 B：按事件发生（退款／结算仅统计传入订单集合内） */
  function metricsEventView(normList, start, end) {
    var payGoods = 0;
    var payFreight = 0;
    var refundGoods = 0;
    var refundFreight = 0;
    var platformRetailGoods = 0;
    var platformProxyGoods = 0;
    var platformProxyFreight = 0;
    var orderIds = {};
    var scopeIds = {};
    var scopeNorm = {};

    normList.forEach(function (n) {
      scopeIds[n.order.id] = true;
      scopeNorm[n.order.id] = n;
      if (!n.includeInNormalSales) return;
      if (inRange(parseTs(n.order.payTime), start, end)) {
        payGoods += n.goodsCash;
        if (n.freightCash != null) payFreight += n.freightCash;
        orderIds[n.order.id] = true;
      }
    });

    raw.refunds.forEach(function (rf) {
      if (!scopeIds[rf.orderId]) return;
      if (!inRange(parseTs(rf.completeTime), start, end)) return;
      var n = scopeNorm[rf.orderId];
      var order = n.order;
      if (n.excludedEntirely || !n.includeInNormalSales) return;
      if (rf.lineId && n.excludedLineIds[rf.lineId]) return;
      refundGoods += Number(rf.goodsAmount) || 0;
      var fr = Number(rf.freightAmount) || 0;
      if (fr && n.freightCash != null && Number(order.cashFreight) > 0) {
        fr = round2((fr * n.freightCash) / Number(order.cashFreight));
      }
      refundFreight += fr;
    });

    raw.settlements.forEach(function (s) {
      if (!scopeIds[s.orderId]) return;
      if (!inRange(parseTs(s.createdAt), start, end)) return;
      var n = scopeNorm[s.orderId];
      var order = n.order;
      if (n.excludedEntirely) return;
      var share = Number(s.platformShare) || 0;
      if (s.kind === 'freight' && n.freightCash != null && Number(order.cashFreight) > 0) {
        share = round2((share * n.freightCash) / Number(order.cashFreight));
      } else if (s.kind === 'goods') {
        var allGoods = order.lines.reduce(function (sum, l) {
          return sum + (Number(l.cashShare) || 0);
        }, 0);
        if (allGoods > 0 && n.goodsCash < allGoods) share = round2((share * n.goodsCash) / allGoods);
      }
      if (s.kind === 'goods' && order.biz === 'retail') platformRetailGoods += share;
      else if (s.kind === 'goods' && order.biz === 'proxy') platformProxyGoods += share;
      else if (s.kind === 'freight') platformProxyFreight += share;
    });

    return {
      payGoods: round2(payGoods),
      payFreight: round2(payFreight),
      payTotal: round2(payGoods + payFreight),
      refundGoods: round2(refundGoods),
      refundFreight: round2(refundFreight),
      netTotal: round2(payGoods + payFreight - refundGoods - refundFreight),
      orderCount: Object.keys(orderIds).length,
      platformRetailGoods: round2(platformRetailGoods),
      platformProxyGoods: round2(platformProxyGoods),
      platformProxyFreight: round2(platformProxyFreight),
      platformTotal: round2(platformRetailGoods + platformProxyGoods + platformProxyFreight)
    };
  }

  function deltaPack(cur, prev) {
    /* 对比基数为 0／缺失，或本期缺失时不展示增减，统一为 — */
    if (cur == null || prev == null || prev === 0) {
      return { value: null, rate: null };
    }
    return { value: round2(cur - prev), rate: (cur - prev) / Math.abs(prev) };
  }

  function formatDelta(pack, isMoney, compact) {
    if (!pack || (pack.value == null && pack.rate == null)) {
      return compact ? '—' : '较对比期 —';
    }
    if (pack.rate == null && pack.value == null) {
      return compact ? '—' : '较对比期 —';
    }
    var v =
      pack.value == null
        ? '—'
        : isMoney
          ? (pack.value > 0 ? '+' : '') + money(pack.value)
          : (pack.value > 0 ? '+' : '') + intText(pack.value);
    var r = pack.rate == null ? '—' : (pack.rate > 0 ? '+' : '') + (pack.rate * 100).toFixed(1) + '%';
    var cls = pack.value > 0 ? 'up' : pack.value < 0 ? 'down' : '';
    var body = '<span class="' + cls + '">' + v + (compact && r === '—' ? '' : '（' + r + '）') + '</span>';
    return compact ? body : '较对比期 ' + body;
  }

  function storeFilterIds(filters) {
    filters = filters || {};
    return raw.stores
      .filter(function (s) {
        if (isTestName(s.name)) return false;
        if (filters.line && s.line !== filters.line) return false;
        if (filters.brand && s.brand !== filters.brand) return false;
        if (filters.coopType && s.coopType !== filters.coopType) return false;
        return true;
      })
      .map(function (s) {
        return s.id;
      });
  }

  function buildStoreRanking(period, filters) {
    var ids = storeFilterIds(filters);
    var rows = [];
    ids.forEach(function (sid) {
      var st = storeById(sid);
      var retailNorm = filterNormOrders({ biz: 'retail', storeId: sid });
      var proxyNorm = filterNormOrders({ biz: 'proxy', storeId: sid });
      var retailPaid = paidInPeriod(retailNorm, period.start, period.end);
      var proxyPaid = paidInPeriod(proxyNorm, period.start, period.end);
      var retailPrevPaid = paidInPeriod(retailNorm, period.compareStart, period.compareEnd);
      var proxyPrevPaid = paidInPeriod(proxyNorm, period.compareStart, period.compareEnd);
      var r = metricsForPaidOrders(retailPaid, period.asOf.getTime());
      var p = metricsForPaidOrders(proxyPaid, period.asOf.getTime());
      var rPrev = metricsForPaidOrders(retailPrevPaid, period.asOf.getTime());
      var pPrev = metricsForPaidOrders(proxyPrevPaid, period.asOf.getTime());

      var retailDays = {};
      retailPaid.forEach(function (n) {
        if (!n.includeInNormalSales) return;
        retailDays[ymd(new Date(n.order.payTime))] = true;
      });
      var proxyDays = {};
      var proxyDayList = [];
      proxyPaid.forEach(function (n) {
        if (!n.includeInNormalSales) return;
        var d = ymd(new Date(n.order.payTime));
        if (!proxyDays[d]) {
          proxyDays[d] = true;
          proxyDayList.push(d);
        }
      });
      proxyDayList.sort();
      var gaps = [];
      for (var i = 1; i < proxyDayList.length; i++) {
        var a = new Date(proxyDayList[i - 1] + 'T00:00:00');
        var b = new Date(proxyDayList[i] + 'T00:00:00');
        gaps.push(Math.round((b - a) / 86400000));
      }
      var avgGap =
        gaps.length > 0
          ? round2(
              gaps.reduce(function (s, x) {
                return s + x;
              }, 0) / gaps.length
            )
          : null;

      var retailHas = r.orderCount > 0;
      var proxyHas = p.orderCount > 0;
      var retailHasPrev = rPrev.orderCount > 0;
      var proxyHasPrev = pPrev.orderCount > 0;

      /* 分业务所得：有结算才展示金额；部分结算打标；无结算 → null（—） */
      var retailPlat = r.settleReady > 0 ? r.platformRetailGoods : null;
      var retailPlatPrev = rPrev.settleReady > 0 ? rPrev.platformRetailGoods : null;
      var proxyPlatGoods = p.settleReady > 0 ? p.platformProxyGoods : null;
      var proxyPlatFreight = p.settleReady > 0 ? p.platformProxyFreight : null;
      var proxyPlat =
        p.settleReady > 0 ? round2(p.platformProxyGoods + p.platformProxyFreight) : null;
      var proxyPlatPrev =
        pPrev.settleReady > 0
          ? round2(pPrev.platformProxyGoods + pPrev.platformProxyFreight)
          : null;
      var totalReady = r.settleReady + p.settleReady;
      var totalPending = r.settlePending + p.settlePending;
      var platformTotalVal =
        totalReady > 0 ? round2((retailPlat || 0) + (proxyPlat || 0)) : null;
      var platformTotalPrevVal =
        rPrev.settleReady + pPrev.settleReady > 0
          ? round2((retailPlatPrev || 0) + (proxyPlatPrev || 0))
          : null;

      rows.push({
        storeId: sid,
        storeName: st.name,
        line: st.line,
        brand: st.brand,
        coopType: st.coopType,
        /* 无成交 → null（展示 —）；有成交且金额为 0 → 0；成本未齐 → margin null */
        retailPay: retailHas ? r.payGoods : null,
        retailPayPrev: retailHasPrev ? rPrev.payGoods : null,
        retailOrders: retailHas ? r.orderCount : null,
        retailConsumers: retailHas ? r.consumerCount : null,
        retailAov: retailHas && r.orderCount ? round2(r.payGoods / r.orderCount) : null,
        retailMargin: r.marginSum,
        retailMarginPrev: rPrev.marginSum,
        retailMarginRate: r.marginRate,
        retailMarginPending: r.marginPending,
        retailDays: Object.keys(retailDays).length,
        retailLastPay: null,
        proxyPay: proxyHas ? p.payGoods : null,
        proxyPayPrev: proxyHasPrev ? pPrev.payGoods : null,
        proxyOrders: proxyHas ? p.orderCount : null,
        proxyAov: proxyHas && p.orderCount ? round2(p.payGoods / p.orderCount) : null,
        proxyMargin: p.marginSum,
        proxyMarginPrev: pPrev.marginSum,
        proxyMarginRate: p.marginRate,
        proxyMarginPending: p.marginPending,
        proxyDays: Object.keys(proxyDays).length,
        proxyLastPay: proxyDayList.length ? proxyDayList[proxyDayList.length - 1] : null,
        proxyAvgGap: avgGap,
        /* 零售／代采所得分列；合计仅累加已形成部分 */
        platformRetail: retailPlat,
        platformRetailPrev: retailPlatPrev,
        platformRetailPartial: r.settleReady > 0 && r.settlePending > 0,
        platformRetailSettlePending: r.settlePending,
        platformRetailSettleReady: r.settleReady,
        platformProxyGoods: proxyPlatGoods,
        platformProxyFreight: proxyPlatFreight,
        platformProxy: proxyPlat,
        platformProxyPrev: proxyPlatPrev,
        platformProxyPartial: p.settleReady > 0 && p.settlePending > 0,
        platformProxySettlePending: p.settlePending,
        platformProxySettleReady: p.settleReady,
        platformTotal: platformTotalVal,
        platformTotalPrev: platformTotalPrevVal,
        platformTotalPartial: totalReady > 0 && totalPending > 0,
        settleReady: totalReady,
        settlePending: totalPending
      });
    });

    rows.forEach(function (row) {
      var retailNorm = filterNormOrders({ biz: 'retail', storeId: row.storeId });
      var retailPaid = paidInPeriod(retailNorm, period.start, period.end);
      var days = [];
      retailPaid.forEach(function (n) {
        if (!n.includeInNormalSales) return;
        days.push(ymd(new Date(n.order.payTime)));
      });
      days.sort();
      row.retailLastPay = days.length ? days[days.length - 1] : null;
    });

    return rows;
  }

  /** 周期是否落在同一自然日（今日／昨日／自定义单日） */
  function isSingleDayPeriod(period) {
    var startDay = startOfDay(period.start);
    if (period.end.getTime() <= startDay.getTime()) return false;
    var lastIncluded = new Date(period.end.getTime() - 1);
    return ymd(startDay) === ymd(lastIncluded);
  }

  function hourKey(d) {
    return pad(d.getHours()) + ':00';
  }

  /** metric: total=商品+运费（与支付成交额同口径）| goods | freight */
  function trendAmount(n, metric) {
    var goods = n.goodsCash || 0;
    var freight = n.freightCash || 0;
    if (metric === 'freight') return freight;
    if (metric === 'goods') return goods;
    return goods + freight;
  }

  function trendSeries(normList, period, metric) {
    metric = metric || 'total';
    if (isSingleDayPeriod(period)) {
      return trendSeriesHourly(normList, period, metric);
    }
    var map = {};
    var cursor = startOfDay(period.start);
    while (cursor < period.end) {
      map[ymd(cursor)] = 0;
      cursor = new Date(cursor.getTime() + 86400000);
    }
    paidInPeriod(normList, period.start, period.end).forEach(function (n) {
      if (!n.includeInNormalSales) return;
      var d = ymd(new Date(n.order.payTime));
      if (map[d] == null) map[d] = 0;
      map[d] += trendAmount(n, metric);
    });
    return Object.keys(map)
      .sort()
      .map(function (d) {
        return { date: d, value: round2(map[d]), grain: 'day', tip: d, metric: metric };
      });
  }

  /** 单日：按小时汇总，0–23 点（今日仅到 asOf 所在小时） */
  function trendSeriesHourly(normList, period, metric) {
    metric = metric || 'total';
    var day = startOfDay(period.start);
    var lastHour = 23;
    if (period.end.getTime() < day.getTime() + 86400000) {
      lastHour = Math.max(0, new Date(period.end.getTime() - 1).getHours());
    }
    var map = {};
    var h;
    for (h = 0; h <= lastHour; h++) {
      map[pad(h) + ':00'] = 0;
    }
    paidInPeriod(normList, period.start, period.end).forEach(function (n) {
      if (!n.includeInNormalSales) return;
      var t = new Date(n.order.payTime);
      var key = hourKey(t);
      if (map[key] == null) return;
      map[key] += trendAmount(n, metric);
    });
    var dayLabel = ymd(day);
    return Object.keys(map)
      .sort()
      .map(function (k) {
        return {
          date: k,
          value: round2(map[k]),
          grain: 'hour',
          tip: dayLabel + ' ' + k,
          metric: metric
        };
      });
  }

  function composeOverview(period, view, filters) {
    var storeIds = storeFilterIds(filters);
    var all = filterNormOrders({ storeIds: storeIds });
    var retail = filterNormOrders({ biz: 'retail', storeIds: storeIds });
    var proxy = filterNormOrders({ biz: 'proxy', storeIds: storeIds });

    if (view === 'event') {
      var curE = metricsEventView(all, period.start, period.end);
      var prevE = metricsEventView(all, period.compareStart, period.compareEnd);
      return { view: 'event', current: curE, previous: prevE, period: period };
    }

    var curAll = metricsForPaidOrders(paidInPeriod(all, period.start, period.end), period.asOf.getTime());
    var prevAll = metricsForPaidOrders(
      paidInPeriod(all, period.compareStart, period.compareEnd),
      period.asOf.getTime()
    );
    var curRetail = metricsForPaidOrders(paidInPeriod(retail, period.start, period.end), period.asOf.getTime());
    var curProxy = metricsForPaidOrders(paidInPeriod(proxy, period.start, period.end), period.asOf.getTime());

    /* 客单价分业务线 */
    curRetail.aov = curRetail.orderCount ? round2(curRetail.payGoods / curRetail.orderCount) : null;
    curProxy.aov = curProxy.orderCount ? round2(curProxy.payGoods / curProxy.orderCount) : null;

    return {
      view: 'pay',
      current: curAll,
      previous: prevAll,
      retail: curRetail,
      proxy: curProxy,
      period: period,
      trend: trendSeries(all, period, 'total'),
      retailTrend: trendSeries(retail, period, 'total'),
      proxyTrend: trendSeries(proxy, period, 'total')
    };
  }

  var GLOSSARY = [
    {
      name: '支付成交额',
      text: '支付成功订单的实际货币支付合计：零售商品实付＋代采商品实付＋代采运费实付。不含积分抵扣。表示交易规模，不等于财务营收。趋势图默认与此同口径。'
    },
    {
      name: '支付主订单数',
      text: '按支付成功的主订单ID去重计数。一张主订单可拆成多个供应商子单，支付主订单数仍计1单。明细入口展示与当前指标同一筛选与统计范围的主订单列表。'
    },
    {
      name: '商品交易毛利',
      text: '按同批支付订单：退款调整后的商品实付减去剩余采购成本。不含运费、不扣角色分润。成本未齐显示「—」。负毛利如实展示。不可用「当期支付−当期退款」再扣另一批订单成本。'
    },
    {
      name: '平台分配所得',
      text: '佣金清算中归平台的商品份额，加上承运商结算单中归平台的运费份额。按结算单创建时间计入。不与商品毛利相加。门店排行可按全部业务／零售／代采切换：零售＝零售商品所得；代采＝代采商品＋代采运费所得；全部＝前述已形成部分合计。未形成结算显示「—」，部分已结算单独标识。'
    },
    {
      name: '支付订单归属',
      text: '先按支付成功时间圈定周期内订单，再关联截至数据更新时间的退款、成本、毛利与平台所得。门店经营排行始终按此口径，即使页顶切到「发生日期」。'
    },
    {
      name: '发生日期',
      text: '支付、退款完成、结算创建各按事件发生日统计。当期净成交＝当期支付－当期成功退款，可含历史单本期退。不能与支付归属视角的成本批混算毛利，也不能用本期结算所得÷本期支付额冒充同批所得率。'
    },
    {
      name: '成交门店覆盖',
      text: '有零售成交的门店数、有代采进货的门店数，以及两者均有的门店数。覆盖家数＝有零售∪有代采（并集）。'
    },
    {
      name: '毛利／结算完成情况',
      text: '毛利已形成／成本缺失按主订单计；结算已形成关联指已挂上创建时间不晚于数据截止的结算单，尚未形成指仍无对应结算。'
    },
    {
      name: '客单价',
      text: '零售＝零售支付金额÷零售支付主订单数；代采进货＝代采商品实付÷代采支付主订单数（不含运费）。两线分开展示，零售与代采不可相加为门店营业额。'
    },
    {
      name: '测试排除',
      text: '仅排除门店名称或商品名称含「测试」「test」的对象；主订单按支付成功去重。'
    }
  ];

  global.MdmDataBiz = {
    raw: raw,
    AS_OF: raw.AS_OF,
    DEMO_LABEL: raw.DEMO_LABEL,
    money: money,
    intText: intText,
    pctText: pctText,
    ppText: ppText,
    esc: esc,
    round2: round2,
    ymd: ymd,
    resolvePeriod: resolvePeriod,
    isSingleDayPeriod: isSingleDayPeriod,
    trendSeries: trendSeries,
    composeOverview: composeOverview,
    buildStoreRanking: buildStoreRanking,
    filterNormOrders: filterNormOrders,
    paidInPeriod: paidInPeriod,
    metricsForPaidOrders: metricsForPaidOrders,
    metricsEventView: metricsEventView,
    deltaPack: deltaPack,
    formatDelta: formatDelta,
    storeById: storeById,
    storeFilterIds: storeFilterIds,
    GLOSSARY: GLOSSARY,
    lines: function () {
      var set = {};
      raw.stores.forEach(function (s) {
        if (!isTestName(s.name)) set[s.line] = true;
      });
      return Object.keys(set);
    },
    brands: function (line) {
      var set = {};
      raw.stores.forEach(function (s) {
        if (isTestName(s.name)) return;
        if (line && s.line !== line) return;
        set[s.brand] = true;
      });
      return Object.keys(set);
    }
  };
})(typeof window !== 'undefined' ? window : this);
