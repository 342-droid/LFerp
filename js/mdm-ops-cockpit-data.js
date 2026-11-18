/**
 * 全景总览 · 演示数据（逐页落地 · 当前仅本页）
 *
 * 平台营业额 = 用户零售(商城|直播) + 代采实付 + POS/食亨(待接入)
 * 平台收益 ≈ 订单分账所得 + 联营冷丰所得
 * 未接入 ≠ 0
 */
(function (global) {
  var S = global.MdmOpsCockpitShared || {};
  var PENDING = S.PENDING || { __pending: true, label: '待接入' };

  function scale(range) {
    if (range === 'today') return 0.08;
    if (range === '7d') return 0.28;
    if (range === 'custom') return 0.65;
    return 1;
  }

  function r2(n) {
    return Math.round(Number(n) * 100) / 100;
  }

  function rangeLabel(range) {
    if (range === 'today') return '今日';
    if (range === '7d') return '近7天';
    if (range === 'custom') return '自定义时段';
    return '近30天';
  }

  var DEMO_NOW_HOUR = 18;

  function trendLabels(range) {
    var labels = [];
    if (range === 'today') {
      for (var h = 0; h <= DEMO_NOW_HOUR; h++) labels.push(h + '时');
      return labels;
    }
    var end = new Date(2026, 10, 18);
    for (var i = 6; i >= 0; i--) {
      var d = new Date(end.getTime() - i * 86400000);
      labels.push(d.getMonth() + 1 + '/' + d.getDate());
    }
    return labels;
  }

  function hourlyDemo(dayTotal, asInt) {
    var n = DEMO_NOW_HOUR + 1;
    var weights = [];
    var sumW = 0;
    for (var i = 0; i < n; i++) {
      var w = 0.35;
      if (i >= 9 && i <= 11) w = 1.2;
      if (i >= 12 && i <= 13) w = 0.9;
      if (i >= 14 && i <= 16) w = 1.1;
      if (i >= 17 && i <= 18) w = 1.35;
      if (i < 7) w = 0.15;
      weights.push(w);
      sumW += w;
    }
    var out = [];
    var acc = 0;
    for (var j = 0; j < n; j++) {
      var v = (dayTotal * weights[j]) / sumW;
      if (j === n - 1) v = Math.max(0, dayTotal - acc);
      else acc += asInt ? Math.round(v) : r2(v);
      out.push(asInt ? Math.round(v) : r2(v));
    }
    return out;
  }

  function trendSeries(range, values, asInt, factor) {
    var s = scale(range) * (factor == null ? 1 : factor);
    if (range === 'today') {
      var dayTotal = values[values.length - 1];
      var total = asInt ? Math.round(dayTotal * s) : r2(dayTotal * s);
      return hourlyDemo(total, asInt);
    }
    var labels = trendLabels(range);
    return values
      .map(function (v) {
        return asInt ? Math.round(v * s) : r2(v * s);
      })
      .slice(-labels.length);
  }

  function parseParty(party) {
    var raw = party || 'all';
    if (raw === 'all') return { type: 'all', id: '', name: '全部' };
    var parts = String(raw).split(':');
    var type = parts[0] || '';
    var id = parts[1] || '';
    var list = (S.PARTY_OPTIONS || []).filter(function (p) {
      return p.type === type && p.id === id;
    });
    return {
      type: type,
      id: id,
      name: list[0] ? list[0].name : id
    };
  }

  /** 演示用主体权重：选中具体主体后缩放到该主体量级 */
  function partyWeight(partyInfo) {
    if (partyInfo.type === 'all') return 1;
    if (partyInfo.type === '门店') {
      if (partyInfo.id === 'ONS00004') return 0.12;
      if (partyInfo.id === 'ONS00001') return 0.1;
      if (partyInfo.id === 'ONS00002') return 0.052;
      return 0.08;
    }
    if (partyInfo.type === '供应商') {
      if (partyInfo.id === 'SUP00001') return 0.42;
      return 0.3;
    }
    if (partyInfo.type === '仓库') {
      if (partyInfo.id === 'WH00001') return 0.55;
      return 0.4;
    }
    if (partyInfo.type === '贸易商') {
      if (partyInfo.id === 'TR00001') return 0.55;
      return 0.4;
    }
    return 1;
  }

  function facts(filters) {
    var f = filters || {};
    var s = scale(f.range || '30d');
    var partyInfo = parseParty(f.party);
    var pw = partyWeight(partyInfo);
    var source = f.source || 'all';
    var fulfill = f.fulfill || 'all';

    var mall = r2(108000 * s * pw);
    var live = r2(78420 * s * pw);
    var proxy = r2(42800 * s * pw);
    var retailRefund = r2(12860 * s * pw);
    var proxyRefund = r2(860 * s * pw);
    var proxyPlatComm = r2(9200 * s * pw);
    var retailPlatSettled = r2(28620 * s * pw);
    /* 联营回收分列：整体＝贸易商＋服务商＋平台；冷丰所得＝平台累计实际回收 */
    var rbtAgreed = r2(72000 * s * pw);
    var rbtTraderAgreed = r2(rbtAgreed * 0.62);
    var rbtPlatAgreed = r2(rbtAgreed * 0.35);
    var rbtSvcAgreed = r2(rbtAgreed - rbtTraderAgreed - rbtPlatAgreed);
    var rbtRecoup = r2(39700 * Math.min(1, s + 0.15) * pw);
    var rbtTraderActual = r2(rbtRecoup * 0.58);
    var rbtSvcActual = r2(rbtRecoup * 0.045);
    var rbtPlatActual = r2(rbtRecoup - rbtTraderActual - rbtSvcActual);
    var rbtRemain = r2(Math.max(0, rbtAgreed - rbtRecoup));
    var rbtTraderRemain = r2(Math.max(0, rbtTraderAgreed - rbtTraderActual));
    var rbtPlatRemain = r2(Math.max(0, rbtPlatAgreed - rbtPlatActual));
    var rbtTraderSpend = r2(28600 * s * pw);
    var rbtStorePay = r2(rbtRecoup);
    var rbtTrader = rbtTraderActual;
    var rbtSvc = rbtSvcActual;
    var rbtLengfeng = rbtPlatActual;

    /* 履约：仅切零售构成演示比例 */
    if (fulfill === 'pickup') {
      mall = r2(mall * 0.55);
      live = r2(live * 0.4);
      retailRefund = r2(retailRefund * 0.48);
      retailPlatSettled = r2(retailPlatSettled * 0.48);
    } else if (fulfill === 'express') {
      mall = r2(mall * 0.45);
      live = r2(live * 0.6);
      retailRefund = r2(retailRefund * 0.52);
      retailPlatSettled = r2(retailPlatSettled * 0.52);
    }

    var retail = r2(mall + live);
    var includeRetail = source === 'all' || source === 'retail';
    var includeProxy = source === 'all' || source === 'proxy';
    var includePos = source === 'all' || source === 'pos';

    if (!includeRetail) {
      mall = 0;
      live = 0;
      retail = 0;
      retailRefund = 0;
      retailPlatSettled = 0;
    }
    if (!includeProxy) {
      proxy = 0;
      proxyRefund = 0;
      proxyPlatComm = 0;
    }

    /* 主体类型语义：仓库仅履约（金额全置空）；贸易商偏 RBT；供应商偏代采／供货 */
    if (partyInfo.type === '仓库') {
      mall = null;
      live = null;
      retail = null;
      proxy = null;
      retailPlatSettled = null;
      proxyPlatComm = null;
      retailRefund = null;
      proxyRefund = null;
      rbtLengfeng = null;
      rbtRecoup = null;
      rbtRemain = null;
      rbtAgreed = null;
      rbtTraderSpend = null;
      rbtTraderAgreed = null;
      rbtTraderActual = null;
      rbtTraderRemain = null;
      rbtSvcActual = null;
      rbtPlatAgreed = null;
      rbtPlatActual = null;
      rbtPlatRemain = null;
    } else if (partyInfo.type === '贸易商') {
      mall = r2(mall * 0.08);
      live = r2(live * 0.08);
      retail = r2(mall + live);
      proxy = r2(proxy * 0.05);
      retailPlatSettled = r2(retailPlatSettled * 0.08);
      proxyPlatComm = r2(proxyPlatComm * 0.05);
    } else if (partyInfo.type === '供应商') {
      mall = r2(mall * 0.35);
      live = r2(live * 0.25);
      retail = r2(mall + live);
      /* 联营冷丰所得与供应商无关 */
      rbtLengfeng = null;
      rbtRecoup = null;
      rbtRemain = null;
      rbtAgreed = null;
      rbtTraderSpend = null;
      rbtTraderAgreed = null;
      rbtTraderActual = null;
      rbtTraderRemain = null;
      rbtSvcActual = null;
      rbtPlatAgreed = null;
      rbtPlatActual = null;
      rbtPlatRemain = null;
    } else if (partyInfo.type === '门店') {
      /* RBT 回收仅平台（全部）可见；门店侧不展示 */
      rbtLengfeng = null;
      rbtRecoup = null;
      rbtRemain = null;
      rbtAgreed = null;
      rbtTraderSpend = null;
      rbtTraderAgreed = null;
      rbtTraderActual = null;
      rbtTraderRemain = null;
      rbtSvcActual = null;
      rbtPlatAgreed = null;
      rbtPlatActual = null;
      rbtPlatRemain = null;
    }

    var pos = includePos ? PENDING : { __pending: true, label: '未选中' };
    /* POS 分佣：食亨对接后计入平台收益；未接入不得展示为 0 */
    var posComm = includePos ? PENDING : { __pending: true, label: '未选中' };
    if (partyInfo.type === '供应商' || partyInfo.type === '仓库' || partyInfo.type === '贸易商') {
      pos = { __pending: true, label: '—' };
      posComm = { __pending: true, label: '—' };
    }
    if (partyInfo.type === '门店') {
      /* 门店视角仍展示 POS 分佣待接入，不伪造金额 */
      posComm = includePos ? PENDING : { __pending: true, label: '未选中' };
    }
    if (source === 'pos') {
      mall = 0;
      live = 0;
      retail = 0;
      proxy = 0;
      retailRefund = 0;
      proxyRefund = 0;
      retailPlatSettled = 0;
      proxyPlatComm = 0;
      if (rbtLengfeng != null) rbtLengfeng = 0;
      if (rbtRecoup != null) rbtRecoup = 0;
      if (rbtRemain != null) rbtRemain = 0;
      if (rbtAgreed != null) rbtAgreed = 0;
      if (rbtTraderSpend != null) rbtTraderSpend = 0;
      if (rbtTraderAgreed != null) rbtTraderAgreed = 0;
      if (rbtTraderActual != null) rbtTraderActual = 0;
      if (rbtTraderRemain != null) rbtTraderRemain = 0;
      if (rbtSvcActual != null) rbtSvcActual = 0;
      if (rbtPlatAgreed != null) rbtPlatAgreed = 0;
      if (rbtPlatActual != null) rbtPlatActual = 0;
      if (rbtPlatRemain != null) rbtPlatRemain = 0;
      pos = PENDING;
      posComm = PENDING;
    }

    var isWarehouse = partyInfo.type === '仓库';
    var platformRevClearing =
      retailPlatSettled == null || proxyPlatComm == null
        ? null
        : r2(retailPlatSettled + proxyPlatComm);
    var platformGmv =
      retail == null || proxy == null ? null : r2(retail + proxy);
    var rbtForTotal = rbtLengfeng == null ? 0 : rbtLengfeng;

    /* 门店主体：成交门店数口径不适用 → — */
    var activeStores = null;
    var idleStores = null;
    if (partyInfo.type === 'all') {
      activeStores = Math.max(1, Math.round(86 * pw));
      idleStores = Math.max(0, Math.round(24 * pw));
    } else if (partyInfo.type === '贸易商') {
      activeStores = Math.max(1, Math.round(12 * pw));
      idleStores = Math.max(0, Math.round(4 * pw));
    } else if (partyInfo.type === '供应商') {
      activeStores = Math.max(1, Math.round(28 * pw));
      idleStores = Math.max(0, Math.round(6 * pw));
    }

    var pendingSku = Math.round(
      1260 * s * pw * (partyInfo.type === '门店' ? 0.12 : 1)
    );
    var shippedSku = Math.round(3840 * s * pw);
    var outboundOrders = Math.round(620 * s * pw);
    var pickupReady = Math.round(186 * s * pw);
    var stockoutSku = Math.max(1, Math.round(42 * s * pw));
    var ontimeRate = 0.926;
    var avgOutboundHours = r2(6.4 / Math.max(0.5, Math.min(1.2, s + 0.4)));

    if (fulfill === 'pickup') {
      pickupReady = Math.round(pickupReady * 1.35);
      pendingSku = Math.round(pendingSku * 0.7);
      shippedSku = Math.round(shippedSku * 0.75);
    } else if (fulfill === 'express') {
      pickupReady = Math.round(pickupReady * 0.35);
      pendingSku = Math.round(pendingSku * 1.15);
      shippedSku = Math.round(shippedSku * 1.1);
    }

    /* 退款＝支付退款成功金额；售后＝售后单涉及金额（两套口径，不可互替） */
    var refundTotal =
      retailRefund == null || proxyRefund == null
        ? null
        : r2(retailRefund + proxyRefund);
    var asAmount =
      refundTotal == null
        ? null
        : r2(
            Math.min(
              refundTotal * 0.72,
              9680 * s * pw * (includeRetail || includeProxy ? 1 : 0.2)
            )
          );

    /* 单门店：成交门店家数口径不适用 → — */
    if (partyInfo.type === '门店') {
      activeStores = null;
      idleStores = null;
    }
    /* 仓库：仅履约指标有值；金额／门店／退款／售后全空 */
    if (isWarehouse) {
      activeStores = null;
      idleStores = null;
      platformGmv = null;
      platformRevClearing = null;
      pos = { __pending: true, label: '—' };
      posComm = { __pending: true, label: '—' };
      refundTotal = null;
      asAmount = null;
      pendingSku = Math.round(1260 * s * pw);
    } else {
      shippedSku = null;
      outboundOrders = null;
      pickupReady = null;
      stockoutSku = null;
      ontimeRate = null;
      avgOutboundHours = null;
    }

    /* alertCount 在 overview 里按实际预警列表回填 */
    var alertCount = 0;

    return {
      partyInfo: partyInfo,
      factor: pw,
      isWarehouse: isWarehouse,
      mall: mall,
      live: live,
      retail: retail,
      retailRefund: retailRefund,
      proxy: proxy,
      proxyRefund: proxyRefund,
      pos: pos,
      posComm: posComm,
      platformGmv: platformGmv,
      retailPlatSettled: retailPlatSettled,
      proxyPlatComm: proxyPlatComm,
      platformRevClearing: platformRevClearing,
      rbtLengfeng: rbtLengfeng,
      rbtAgreed: rbtAgreed,
      rbtRecoup: rbtRecoup,
      rbtRemain: rbtRemain,
      rbtTraderSpend: rbtTraderSpend,
      rbtTraderAgreed: rbtTraderAgreed,
      rbtTraderActual: rbtTraderActual,
      rbtTraderRemain: rbtTraderRemain,
      rbtSvcActual: rbtSvcActual,
      rbtPlatAgreed: rbtPlatAgreed,
      rbtPlatActual: rbtPlatActual,
      rbtPlatRemain: rbtPlatRemain,
      platformRevTotal:
        platformRevClearing == null ? null : r2(platformRevClearing + rbtForTotal),
      activeStores: activeStores,
      idleStores: idleStores,
      pendingSku: pendingSku,
      shippedSku: shippedSku,
      outboundOrders: outboundOrders,
      pickupReady: pickupReady,
      stockoutSku: stockoutSku,
      ontimeRate: ontimeRate,
      avgOutboundHours: avgOutboundHours,
      asAmount: asAmount,
      refundTotal: refundTotal,
      alertCount: alertCount,
      source: source,
      fulfill: fulfill
    };
  }

  /**
   * 营业额分账账单：各角色分走金额合计必须对齐平台营业额。
   * 零售：供货款＋门店分佣＋BD 分佣＋运费＋平台所得 = 用户零售
   * 代采：供货款＋平台佣金 = 代采实付
   * 联营 RBT 不进本账单（不计入营业额）
   */
  function buildRoleBill(x) {
    if (x.isWarehouse || x.partyInfo.type === '仓库') {
      return {
        note: '仓库主体仅看履约，不产出营业额分账账单。',
        gmv: null,
        retail: null,
        proxy: null,
        rows: [],
        sumRetail: null,
        sumProxy: null,
        sumTotal: null,
        diff: null,
        balanced: true,
        refundNote: '',
        hidden: true
      };
    }
    var retail = Number(x.retail) || 0;
    var proxy = Number(x.proxy) || 0;
    var gmv = r2(retail + proxy);
    var platRetail = Number(x.retailPlatSettled) || 0;
    var platProxy = Number(x.proxyPlatComm) || 0;

    /* 零售：先锁平台所得，剩余按演示比例分给供／店／BD／运费，末项吃尾差 */
    var retailRest = Math.max(0, r2(retail - platRetail));
    var rSupplier = r2(retailRest * 0.78);
    var rStore = r2(retailRest * 0.12);
    var rBd = r2(retailRest * 0.05);
    var rFreight = r2(retailRest - rSupplier - rStore - rBd);
    /* 代采：平台佣金锁定，剩余全部为供货款 */
    var pSupplier = r2(Math.max(0, proxy - platProxy));

    if (retail <= 0) {
      platRetail = 0;
      rSupplier = 0;
      rStore = 0;
      rBd = 0;
      rFreight = 0;
    }
    if (proxy <= 0) {
      platProxy = 0;
      pSupplier = 0;
    }

    function row(role, item, retailAmt, proxyAmt, note) {
      var r = retailAmt == null ? null : r2(retailAmt);
      var p = proxyAmt == null ? null : r2(proxyAmt);
      var total =
        r == null && p == null ? null : r2((r == null ? 0 : r) + (p == null ? 0 : p));
      return {
        role: role,
        item: item,
        retail: r,
        proxy: p,
        total: total,
        share: gmv > 0 && total != null ? total / gmv : null,
        note: note || ''
      };
    }

    var rows = [
      row('供应商', '货款', rSupplier, pSupplier, '采购成本／代采货款'),
      row('门店', '分佣', rStore, null, '零售清分；代采门店为买方不分佣'),
      row('BD', '分佣', rBd, null, '零售清分'),
      row('承运商／运费', '运费', rFreight, 0, '履约运费（演示）'),
      row('平台', '订单分账所得', platRetail, platProxy, '清分收款方＝平台且已入账')
    ];

    /* 主体视角：无关角色仍展示金额以便对账，但加标注 */
    if (x.partyInfo.type === '供应商') {
      rows.forEach(function (r) {
        if (r.role !== '供应商' && r.role !== '平台') {
          r.note = (r.note ? r.note + '；' : '') + '当前为供应商视角，仅供对账';
        }
      });
    } else if (x.partyInfo.type === '门店') {
      rows.forEach(function (r) {
        if (r.role !== '门店' && r.role !== '平台' && r.role !== '供应商') {
          r.note = (r.note ? r.note + '；' : '') + '当前为门店视角，仅供对账';
        }
      });
    } else if (x.partyInfo.type === '仓库') {
      rows.forEach(function (r) {
        if (r.role === '承运商／运费') {
          r.note = '仓库履约相关运费';
        } else {
          r.note = (r.note ? r.note + '；' : '') + '仓库不直接分账，金额为经本仓履约订单的清分汇总';
        }
      });
    } else if (x.partyInfo.type === '贸易商') {
      rows.forEach(function (r) {
        r.note =
          (r.note ? r.note + '；' : '') +
          '贸易商联营回收不在本账单；下列为关联订单清分演示';
      });
    }

    var sumRetail = r2(
      rows.reduce(function (a, r) {
        return a + (r.retail == null ? 0 : r.retail);
      }, 0)
    );
    var sumProxy = r2(
      rows.reduce(function (a, r) {
        return a + (r.proxy == null ? 0 : r.proxy);
      }, 0)
    );
    var sumTotal = r2(sumRetail + sumProxy);
    var diff = r2(sumTotal - gmv);

    return {
      note:
        '账单按清分角色汇总：供应商货款、门店／BD 分佣、运费、平台所得。零售与代采分列后合计应对齐平台营业额；联营冷丰所得（RBT）不计入营业额，不在本表。',
      gmv: gmv,
      retail: retail,
      proxy: proxy,
      rows: rows,
      sumRetail: sumRetail,
      sumProxy: sumProxy,
      sumTotal: sumTotal,
      diff: diff,
      balanced: Math.abs(diff) < 0.01,
      refundNote:
        x.refundTotal == null
          ? ''
          : '退款 ' +
            (x.refundTotal === 0
              ? '¥0.00'
              : '¥' +
                Number(x.refundTotal).toLocaleString('zh-CN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })) +
            ' 另计，不冲减本表营业额分账合计。'
    };
  }

  function overview(filters) {
    var f = filters || {};
    var range = f.range || '30d';
    var x = facts(f);
    var s = scale(range);
    var tf = x.factor;
    if (x.source === 'retail') tf *= 0.81;
    else if (x.source === 'proxy') tf *= 0.19;
    else if (x.source === 'pos') tf *= 0.05;
    if (x.fulfill === 'pickup' || x.fulfill === 'express') tf *= 0.5;

    var gmvNote =
      '平台营业额＝用户零售＋代采进货＋POS／食亨。下列为主构成；商城／直播是用户零售的下级明细。';
    if (x.partyInfo.type === '仓库') {
      gmvNote =
        '当前主体：仓库 · ' +
        x.partyInfo.name +
        '。仓库仅看履约（出库／自提／缺货／及时率），不含营业额与收益金额。';
    } else if (x.partyInfo.type !== 'all') {
      gmvNote = '当前主体：' + x.partyInfo.type + ' · ' + x.partyInfo.name + '。' + gmvNote;
    }
    if (x.partyInfo.type !== '仓库') {
      if (x.source === 'retail') gmvNote = '已筛：仅零售订单（商城＋直播）。';
      if (x.source === 'proxy') gmvNote = '已筛：仅代采进货订单。';
      if (x.source === 'pos') gmvNote = '已筛：仅 POS／食亨（待接入）。';
    }
    if (x.fulfill === 'pickup') gmvNote += ' 履约：自提。';
    if (x.fulfill === 'express') gmvNote += ' 履约：快递。';
    var gmvRetailNote = '用户零售明细：商城下单＋直播下单（二者相加＝用户零售）。';

    /**
     * 经营对象排行随主体类型切换：
     * 全部＝门店／供应商／贸易商；门店＝本店会员；供应商＝门店＋平台用户；
     * 仓库＝无；贸易商＝门店经营状态＋回本周期
     */
    var rankBlocks = [];
    var fScale = x.factor == null ? 1 : x.factor;
    if (x.partyInfo.type === '门店') {
      rankBlocks = [
        {
          title: '门店会员（按成交额）',
          empty: '',
          cols: [
            { key: 'name', label: '会员', format: 'text' },
            { key: 'gmv', label: '成交额', format: 'money' },
            { key: 'orders', label: '订单', format: 'int' },
            { key: 'lastAt', label: '最近成交', format: 'text' }
          ],
          rows: [
            {
              name: '张**（尾号3821）',
              gmv: r2(2860 * s * fScale * 8),
              orders: Math.max(1, Math.round(12 * s)),
              lastAt: '11/17'
            },
            {
              name: '李**（尾号9056）',
              gmv: r2(2140 * s * fScale * 8),
              orders: Math.max(1, Math.round(9 * s)),
              lastAt: '11/16'
            },
            {
              name: '王**（尾号4410）',
              gmv: r2(1680 * s * fScale * 8),
              orders: Math.max(1, Math.round(7 * s)),
              lastAt: '11/15'
            },
            {
              name: '陈**（尾号2288）',
              gmv: r2(1320 * s * fScale * 8),
              orders: Math.max(1, Math.round(5 * s)),
              lastAt: '11/14'
            },
            {
              name: '赵**（尾号6712）',
              gmv: r2(980 * s * fScale * 8),
              orders: Math.max(1, Math.round(4 * s)),
              lastAt: '11/12'
            }
          ]
        }
      ];
    } else if (x.partyInfo.type === '供应商') {
      rankBlocks = [
        {
          title: '门店（按进货／零售贡献）',
          cols: [
            { key: 'name', label: '门店', format: 'text' },
            { key: 'proxy', label: '代采进货', format: 'money' },
            { key: 'retail', label: '零售贡献', format: 'money' },
            { key: 'orders', label: '订单', format: 'int' }
          ],
          rows: [
            {
              name: '五角场体验店',
              proxy: r2(6800 * s * fScale),
              retail: r2(9200 * s * fScale),
              orders: Math.max(1, Math.round(86 * s))
            },
            {
              name: '西湖中心生鲜店',
              proxy: r2(5200 * s * fScale),
              retail: r2(7400 * s * fScale),
              orders: Math.max(1, Math.round(62 * s))
            },
            {
              name: '东城和平里生鲜店',
              proxy: r2(3100 * s * fScale),
              retail: r2(4100 * s * fScale),
              orders: Math.max(1, Math.round(38 * s))
            }
          ]
        },
        {
          title: '平台用户（按成交额）',
          cols: [
            { key: 'name', label: '用户', format: 'text' },
            { key: 'gmv', label: '成交额', format: 'money' },
            { key: 'orders', label: '订单', format: 'int' },
            { key: 'channel', label: '来源', format: 'text' }
          ],
          rows: [
            {
              name: '用户U·8821',
              gmv: r2(1860 * s * fScale),
              orders: Math.max(1, Math.round(8 * s)),
              channel: '商城'
            },
            {
              name: '用户U·4410',
              gmv: r2(1520 * s * fScale),
              orders: Math.max(1, Math.round(6 * s)),
              channel: '直播'
            },
            {
              name: '用户U·9056',
              gmv: r2(1180 * s * fScale),
              orders: Math.max(1, Math.round(5 * s)),
              channel: '商城'
            },
            {
              name: '用户U·2288',
              gmv: r2(860 * s * fScale),
              orders: Math.max(1, Math.round(4 * s)),
              channel: '直播'
            }
          ]
        }
      ];
    } else if (x.partyInfo.type === '仓库') {
      rankBlocks = [];
    } else if (x.partyInfo.type === '贸易商') {
      rankBlocks = [
        {
          title: '门店经营状态',
          cols: [
            { key: 'name', label: '门店', format: 'text' },
            { key: 'status', label: '经营状态', format: 'text' },
            { key: 'gmv', label: '关联营业额', format: 'money' },
            { key: 'remain', label: '剩余应回收', format: 'money' }
          ],
          rows: [
            {
              name: '西湖中心生鲜店',
              status: '还款中',
              gmv: r2(18620 * s * fScale),
              remain: r2(12800 * s * fScale)
            },
            {
              name: '五角场体验店',
              status: '还款中',
              gmv: r2(22400 * s * fScale),
              remain: r2(9600 * s * fScale)
            },
            {
              name: '东城和平里生鲜店',
              status: '已回本',
              gmv: r2(9800 * s * fScale),
              remain: 0
            },
            {
              name: '浦东临港生鲜店',
              status: '逾期关注',
              gmv: r2(4200 * s * fScale),
              remain: r2(8600 * s * fScale)
            }
          ]
        },
        {
          title: '回本周期排行',
          cols: [
            { key: 'name', label: '门店', format: 'text' },
            { key: 'cycleDays', label: '回本周期(天)', format: 'int' },
            { key: 'progress', label: '回本进度', format: 'text' },
            { key: 'startAt', label: '起算日', format: 'text' }
          ],
          rows: [
            {
              name: '东城和平里生鲜店',
              cycleDays: 142,
              progress: '100%',
              startAt: '2026-06-28'
            },
            {
              name: '五角场体验店',
              cycleDays: 168,
              progress: '78%',
              startAt: '2026-05-12'
            },
            {
              name: '西湖中心生鲜店',
              cycleDays: 196,
              progress: '62%',
              startAt: '2026-04-08'
            },
            {
              name: '浦东临港生鲜店',
              cycleDays: 240,
              progress: '41%',
              startAt: '2026-03-01'
            }
          ]
        }
      ];
    } else {
      rankBlocks = [
        {
          title: '门店（按零售 GMV）',
          cols: [
            { key: 'name', label: '门店', format: 'text' },
            { key: 'gmv', label: '零售GMV', format: 'money' },
            { key: 'orders', label: '订单', format: 'int' }
          ],
          rows: [
            { name: '五角场体验店', gmv: r2(22400 * s), orders: Math.round(178 * s) },
            { name: '西湖中心生鲜店', gmv: r2(18620 * s), orders: Math.round(146 * s) },
            { name: '东城和平里生鲜店', gmv: r2(9800 * s), orders: Math.round(88 * s) }
          ]
        },
        {
          title: '供应商',
          cols: [
            { key: 'name', label: '供应商', format: 'text' },
            { key: 'shipSku', label: '出库SKU', format: 'int' },
            { key: 'settle', label: '结算额', format: 'money' }
          ],
          rows: [
            {
              name: '鲜达优选供应链',
              shipSku: Math.round(4200 * s),
              settle: r2(18620 * s)
            },
            {
              name: '绿源生鲜批发',
              shipSku: Math.round(3100 * s),
              settle: r2(13200 * s)
            }
          ]
        },
        {
          title: '贸易商（按剩余应回收）',
          cols: [
            { key: 'name', label: '贸易商', format: 'text' },
            { key: 'demands', label: '还款中需求', format: 'int' },
            { key: 'remain', label: '剩余应回收', format: 'money' }
          ],
          rows: [
            { name: '杭州鲜达贸易', demands: 12, remain: r2(28600 * s) },
            { name: '沪上联营贸易', demands: 8, remain: r2(19800 * s) }
          ]
        }
      ];
    }

    var alerts = [];
    var storeName = x.partyInfo.name;
    if (x.partyInfo.type === '仓库') {
      alerts = [
        {
          level: 'warn',
          text: storeName + '：缺货 SKU ' + (x.stockoutSku || 0) + ' 个需补货'
        },
        {
          level: 'warn',
          text: storeName + '：待发货 SKU ' + (x.pendingSku || 0) + ' 积压需关注'
        },
        {
          level: 'info',
          text: storeName + '：履约及时率 ' + ((x.ontimeRate || 0) * 100).toFixed(1) + '%'
        }
      ];
    } else if (x.partyInfo.type === '门店') {
      /* 单店：本店经营预警；RBT／联营回收预警仅平台与贸易商 */
      if (x.source !== 'retail') {
        alerts.push({
          level: 'warn',
          text: storeName + '：代采结算异常 1 笔'
        });
      }
      alerts.push({
        level: 'warn',
        text: storeName + '：待发货积压需关注'
      });
    } else if (x.partyInfo.type === '供应商') {
      alerts.push({
        level: 'warn',
        text: storeName + '：供货结算差异需核对'
      });
      if (x.source !== 'retail') {
        alerts.push({ level: 'warn', text: storeName + '：代采货款待确认' });
      }
    } else if (x.partyInfo.type === '贸易商') {
      alerts.push({
        level: 'warn',
        text:
          storeName +
          '：联营回收异常 ' +
          Math.max(1, Math.round(3 * Math.min(1, x.factor + 0.3))) +
          ' 笔'
      });
    } else {
      if (typeof x.idleStores === 'number' && x.idleStores > 0) {
        alerts.push({
          level: 'danger',
          text: '无成交门店 ' + x.idleStores + ' 家（' + rangeLabel(range) + '）'
        });
      }
      if (x.source !== 'retail') {
        alerts.push({ level: 'warn', text: '代采结算异常若干笔' });
      }
      alerts.push({
        level: 'warn',
        text:
          '联营回收异常 ' +
          Math.max(1, Math.round(3 * Math.min(1, x.factor + 0.3))) +
          ' 笔'
      });
      if (x.source === 'all' || x.source === 'pos') {
        alerts.push({ level: 'info', text: 'POS／食亨待对接（信息不计入预警条数）' });
      }
    }

    /* 经营预警条数：仅计 danger／warn，info 提示不计 */
    var alertCount = alerts.filter(function (a) {
      return a.level === 'danger' || a.level === 'warn';
    }).length;

    /* RBT 回收／联营冷丰：仅平台（全部）与贸易商 */
    var rbtApplicable =
      x.partyInfo.type === 'all' || x.partyInfo.type === '贸易商';
    var isPlatView = x.partyInfo.type === 'all';
    var storeCountHint =
      x.partyInfo.type === '门店'
        ? '已选单门店，成交门店数不适用'
        : x.partyInfo.type === '仓库'
          ? '仓库视角不统计门店成交'
          : '';
    var rbtHint = rbtApplicable
      ? '门店还款扣减贸易商、服务商后'
      : 'RBT／联营冷丰仅平台与贸易商可见';
    var refundHint =
      x.partyInfo.type === '仓库'
        ? '退款与仓库履约无关'
        : '支付退款成功金额（按退款成功时间；含未走售后单的退款）';
    var asHint =
      x.partyInfo.type === '仓库'
        ? '售后与仓库履约无关'
        : '售后单涉及金额（按售后状态；与退款分列，不可相加或互替）';
    var alertHint =
      x.partyInfo.type === '门店'
        ? '本店经营预警条数（非「无成交门店」类平台预警）'
        : x.partyInfo.type === 'all'
          ? '平台经营预警条数（含无成交门店等）'
          : '当前主体相关经营预警条数';

    var rbtTrendFactor = rbtApplicable ? tf : 0;
    var revNote = rbtApplicable
      ? '平台收益＝订单分账所得＋POS分佣＋联营冷丰所得。待接入项不计 0；下列三项为平台全部收益构成。'
      : '当前主体下联营冷丰所得不适用；平台收益暂以订单分账所得为主，POS 分佣待食亨对接后计入。';
    var revClearingNote =
      '订单分账所得明细：零售分账＋代采佣金（二者相加＝订单分账所得）。';

    var gmvLabel = isPlatView ? '平台营业额' : '营业额';
    var revLabel = isPlatView ? '平台收益' : '收益';
    var gmvKpiHint = isPlatView
      ? '用户零售＋门店代采进货'
      : '所选主体口径 · 用户零售＋代采进货';
    var revKpiHint = rbtApplicable
      ? '订单分账剩余＋联营冷丰所得'
      : '所选主体口径 · 仅计订单分账所得';

    var isWh = !!x.isWarehouse || x.partyInfo.type === '仓库';
    var kpis = isWh
      ? [
          {
            label: '待发货 SKU',
            value: x.pendingSku,
            format: 'int',
            hint: '待拣配／待出库'
          },
          {
            label: '已出库 SKU',
            value: x.shippedSku,
            format: 'int',
            hint: '统计期内出库件数'
          },
          {
            label: '出库订单',
            value: x.outboundOrders,
            format: 'int',
            hint: '完成出库的履约单'
          },
          {
            label: '待自提包裹',
            value: x.pickupReady,
            format: 'int',
            hint: '已到店待用户自提'
          },
          {
            label: '缺货 SKU',
            value: x.stockoutSku,
            format: 'int',
            hint: '当前仓缺货需补货'
          },
          {
            label: '履约及时率',
            value: x.ontimeRate,
            format: 'pct',
            hint: '按时出库／签收占比'
          },
          {
            label: '平均出库时效',
            value:
              x.avgOutboundHours == null ? null : x.avgOutboundHours + ' 小时',
            format: 'text',
            hint: '支付到出库小时数（演示）'
          },
          {
            label: '经营预警',
            value: alertCount,
            format: 'int',
            hint: '本仓履约相关预警'
          }
        ]
      : [
          { label: gmvLabel, value: x.platformGmv, format: 'money', hint: gmvKpiHint },
          { label: '用户零售', value: x.retail, format: 'money', hint: '商城下单＋直播下单' },
          { label: '代采实付', value: x.proxy, format: 'money', hint: '门店进货订单金额' },
          { label: 'POS／食亨', value: x.pos, format: 'money', hint: '门店收银，对接后计入' },
          { label: revLabel, value: x.platformRevTotal, format: 'money', hint: revKpiHint },
          {
            label: '订单分账所得',
            value: x.platformRevClearing,
            format: 'money',
            hint: '零售与代采结算后归平台的部分'
          },
          { label: '联营冷丰所得', value: x.rbtLengfeng, format: 'money', hint: rbtHint },
          { label: '退款金额', value: x.refundTotal, format: 'money', hint: refundHint },
          { label: '有成交门店', value: x.activeStores, format: 'int', hint: storeCountHint },
          { label: '无成交门店', value: x.idleStores, format: 'int', hint: storeCountHint },
          { label: '待发货 SKU', value: x.pendingSku, format: 'int' },
          { label: '售后金额', value: x.asAmount, format: 'money', hint: asHint },
          { label: '经营预警', value: alertCount, format: 'int', hint: alertHint }
        ];

    var trends = isWh
      ? {
          pending: trendSeries(
            range,
            [980, 1120, 1050, 1280, 1340, 1210, 1260],
            true,
            tf
          ),
          shipped: trendSeries(
            range,
            [2800, 3100, 2950, 3400, 3600, 3300, 3840],
            true,
            tf
          ),
          outbound: trendSeries(range, [420, 468, 441, 510, 536, 492, 620], true, tf),
          gmv: [],
          revenue: [],
          orders: [],
          rbt: []
        }
      : {
          gmv: trendSeries(
            range,
            [18200, 21400, 19600, 23800, 25100, 22900, 26800],
            false,
            tf
          ),
          revenue: trendSeries(
            range,
            [4200, 4800, 4500, 5100, 5400, 5000, 5800],
            false,
            tf
          ),
          orders: trendSeries(range, [168, 192, 176, 210, 224, 201, 238], true, tf),
          rbt: rbtApplicable
            ? trendSeries(
                range,
                [2800, 3100, 2950, 3300, 3500, 3200, 3600],
                false,
                rbtTrendFactor
              )
            : []
        };

    var fulfillMix = [
      { id: 'pending', name: '待发货 SKU', value: x.pendingSku },
      { id: 'shipped', name: '已出库 SKU', value: x.shippedSku },
      { id: 'pickup', name: '待自提包裹', value: x.pickupReady },
      { id: 'stockout', name: '缺货 SKU', value: x.stockoutSku }
    ];

    return {
      id: 'overview',
      title: '全景总览',
      meta: {
        statRange: rangeLabel(range),
        updatedAt: '2026-11-18 18:00（演示）'
      },
      viewMode: isWh ? 'warehouse' : 'money',
      trendLabels: trendLabels(range),
      kpis: kpis,
      trends: trends,
      gmvTotal: isWh ? null : x.platformGmv,
      gmvMix: isWh
        ? fulfillMix
        : [
            { id: 'retail', name: '用户零售', value: x.retail },
            { id: 'proxy', name: '代采进货', value: x.proxy },
            { id: 'pos', name: 'POS／食亨', value: x.pos }
          ],
      gmvRetailMix: isWh
        ? []
        : [
            { id: 'mall', name: '商城下单', value: x.mall },
            { id: 'live', name: '直播下单', value: x.live }
          ],
      gmvRetailNote: isWh ? '' : gmvRetailNote,
      gmvMixNote: gmvNote,
      revTotal: isWh ? null : x.platformRevTotal,
      revMix: isWh
        ? []
        : [
            { id: 'clearing', name: '订单分账所得', value: x.platformRevClearing },
            { id: 'pos_comm', name: 'POS分佣', value: x.posComm },
            {
              id: 'rbt',
              name: '联营冷丰所得',
              value: rbtApplicable ? x.rbtLengfeng : null
            }
          ],
      revClearingMix: isWh
        ? []
        : [
            { id: 'retail_plat', name: '零售分账', value: x.retailPlatSettled },
            { id: 'proxy_plat', name: '代采佣金', value: x.proxyPlatComm }
          ],
      revClearingNote: isWh ? '' : revClearingNote,
      revMixNote: isWh ? '仓库不含收益构成。' : revNote,
      rbtSummary: {
        hidden: isWh || !rbtApplicable,
        note: isWh
          ? '仓库主体不含联营与回收。'
          : !rbtApplicable
            ? '当前主体（' +
              x.partyInfo.type +
              '）与联营回收无关，下列指标不适用。'
            : '整体约定／实收／剩余分列贸易商、服务商、平台；平台累计实际回收即联营冷丰所得，计入平台收益，不与营业额相加。',
        groups: rbtApplicable
          ? [
              {
                title: '整体',
                metrics: [
                  {
                    label: '还款中需求',
                    value: Math.max(1, Math.round(18 * (x.factor === 1 ? 1 : 0.3))),
                    format: 'int'
                  },
                  { label: '约定回收', value: x.rbtAgreed, format: 'money' },
                  { label: '累计实际回收', value: x.rbtRecoup, format: 'money' },
                  { label: '剩余应回收', value: x.rbtRemain, format: 'money' },
                  {
                    label: '回收异常',
                    value: Math.max(0, Math.round(3 * Math.min(1, x.factor + 0.2))),
                    format: 'int'
                  }
                ]
              },
              {
                title: '贸易商',
                metrics: [
                  { label: '贸易商支出', value: x.rbtTraderSpend, format: 'money', hint: '上游投入（原始售价）' },
                  { label: '贸易商约定回收', value: x.rbtTraderAgreed, format: 'money' },
                  { label: '累计实际回收', value: x.rbtTraderActual, format: 'money' },
                  { label: '剩余应回收', value: x.rbtTraderRemain, format: 'money' }
                ]
              },
              {
                title: '服务商',
                metrics: [
                  { label: '服务商实际回收', value: x.rbtSvcActual, format: 'money' }
                ]
              },
              {
                title: '平台',
                metrics: [
                  { label: '平台约定回收', value: x.rbtPlatAgreed, format: 'money' },
                  {
                    label: '累计实际回收',
                    value: x.rbtPlatActual,
                    format: 'money',
                    hint: '即联营冷丰所得'
                  },
                  { label: '剩余应回收', value: x.rbtPlatRemain, format: 'money' }
                ]
              }
            ]
          : []
      },
      ranks: {
        blocks: rankBlocks,
        emptyNote:
          x.partyInfo.type === '仓库' ? '仓库主体无经营对象排行' : '当前筛选下暂无排行数据'
      },
      roleBill: buildRoleBill(x),
      alerts: alerts,
      board: buildBoard(x, isWh, isPlatView, rbtApplicable, alertCount, gmvLabel, revLabel)
    };
  }

  function deltaPack(base, dodRate, wowRate) {
    var v = typeof base === 'number' ? base : null;
    if (v == null || !isFinite(v)) {
      return { dod: null, wow: null, avg7: null };
    }
    return {
      dod: dodRate,
      wow: wowRate,
      avg7: r2(v * 0.92)
    };
  }

  /** 模块排序＋相对柱长，方便一眼分出好坏 */
  function rankModules(list) {
    var ranked = (list || [])
      .slice()
      .sort(function (a, b) {
        if (a.pending && !b.pending) return 1;
        if (b.pending && !a.pending) return -1;
        var sa = a.invert ? -Number(a.score) || 0 : Number(a.score) || 0;
        var sb = b.invert ? -Number(b.score) || 0 : Number(b.score) || 0;
        return sb - sa;
      });
    var maxScore = 0;
    ranked.forEach(function (m) {
      if (m.pending) return;
      var s = Math.abs(Number(m.score) || 0);
      if (s > maxScore) maxScore = s;
    });
    var active = ranked.filter(function (m) {
      return !m.pending;
    });
    return ranked.map(function (m, i) {
      m.rank = i + 1;
      m.best = !m.pending && i === 0;
      m.worst = !m.pending && active.length > 1 && m === active[active.length - 1];
      m.rel =
        m.pending || maxScore <= 0
          ? 0
          : Math.max(0.06, Math.min(1, Math.abs(Number(m.score) || 0) / maxScore));
      return m;
    });
  }

  /** 看板：主指标＋副卡＋模块对比（直观看出哪块最好） */
  function buildBoard(x, isWh, isPlatView, rbtApplicable, alertCount, gmvLabel, revLabel) {
    if (isWh) {
      var modulesWh = rankModules([
        {
          id: 'shipped',
          name: '已出库',
          metric: 'SKU',
          value: x.shippedSku,
          format: 'int',
          score: x.shippedSku || 0
        },
        {
          id: 'pending',
          name: '待发货积压',
          metric: 'SKU（越低越好）',
          value: x.pendingSku,
          format: 'int',
          score: x.pendingSku || 0,
          invert: true
        },
        {
          id: 'pickup',
          name: '待自提',
          metric: '包裹',
          value: x.pickupReady,
          format: 'int',
          score: x.pickupReady || 0
        },
        {
          id: 'ontime',
          name: '履约及时率',
          metric: '及时率',
          value: x.ontimeRate,
          format: 'pct',
          score: (x.ontimeRate || 0) * 10000
        }
      ]);
      return {
        hero: {
          label: '履约及时率',
          value: x.ontimeRate,
          format: 'pct',
          hint: '本仓按时履约占比',
          compare: deltaPack((x.ontimeRate || 0) * 100, 0.012, -0.008)
        },
        secondary: [
          { label: '待发货 SKU', value: x.pendingSku, format: 'int', compare: deltaPack(x.pendingSku, -0.04, 0.02) },
          { label: '已出库 SKU', value: x.shippedSku, format: 'int', compare: deltaPack(x.shippedSku, 0.05, 0.03) },
          { label: '出库订单', value: x.outboundOrders, format: 'int', compare: deltaPack(x.outboundOrders, 0.03, -0.01) },
          { label: '经营预警', value: alertCount, format: 'int', compare: null }
        ],
        modules: modulesWh,
        moreKpis: []
      };
    }

    /* 模块对比只放经营业务线；订单分账是收益清分结果，放「收益构成」 */
    var retailScore = Number(x.retail) || 0;
    var proxyScore = Number(x.proxy) || 0;
    var rbtScore = rbtApplicable ? Number(x.rbtRecoup) || 0 : -1;
    var modules = [
      {
        id: 'retail',
        name: '用户零售',
        metric: '营业额',
        value: x.retail,
        format: 'money',
        score: retailScore,
        shareOf: 'gmv'
      },
      {
        id: 'proxy',
        name: '代采进货',
        metric: '实付',
        value: x.proxy,
        format: 'money',
        score: proxyScore,
        shareOf: 'gmv'
      },
      {
        id: 'pos',
        name: 'POS／食亨',
        metric: '营业额',
        value: x.pos,
        format: 'money',
        score: -1,
        pending: true
      }
    ];
    if (rbtApplicable) {
      modules.push({
        id: 'rbt',
        name: '联营回收',
        metric: '实际回收',
        value: x.rbtRecoup,
        format: 'money',
        score: rbtScore,
        shareOf: 'rbt'
      });
    }
    modules = rankModules(
      modules.filter(function (m) {
        return m.pending || m.score >= 0;
      })
    );
    modules.forEach(function (m) {
      if (m.shareOf === 'gmv' && x.platformGmv > 0 && typeof m.value === 'number') {
        m.share = m.value / x.platformGmv;
      } else if (m.shareOf === 'rbt' && x.rbtAgreed > 0 && typeof m.value === 'number') {
        m.share = m.value / x.rbtAgreed;
      }
    });

    var heroValue = x.platformRevTotal != null ? x.platformRevTotal : x.platformGmv;
    var heroLabel = x.platformRevTotal != null ? revLabel : gmvLabel;
    return {
      hero: {
        label: heroLabel,
        value: heroValue,
        format: 'money',
        hint: isPlatView ? '订单分账＋联营冷丰（待接入不计 0）' : '当前主体口径收益',
        compare: deltaPack(heroValue, 0.032, -0.011)
      },
      secondary: [
        {
          label: gmvLabel,
          value: x.platformGmv,
          format: 'money',
          compare: deltaPack(x.platformGmv, 0.028, 0.015)
        },
        {
          label: '支付订单数',
          value: Math.max(
            1,
            Math.round(
              ((typeof x.retail === 'number' ? x.retail : 0) +
                (typeof x.proxy === 'number' ? x.proxy : 0)) /
                120
            )
          ),
          format: 'int',
          compare: deltaPack(100, 0.04, -0.02)
        },
        {
          label: '退款金额',
          value: x.refundTotal,
          format: 'money',
          compare: deltaPack(x.refundTotal, -0.05, 0.02)
        },
        {
          label: '经营预警',
          value: alertCount,
          format: 'int',
          compare: null
        }
      ],
      modules: modules,
      moreKpis: [
        { label: '用户零售', value: x.retail, format: 'money' },
        { label: '代采实付', value: x.proxy, format: 'money' },
        { label: 'POS／食亨', value: x.pos, format: 'money' },
        { label: '订单分账所得', value: x.platformRevClearing, format: 'money' },
        { label: '联营冷丰所得', value: x.rbtLengfeng, format: 'money' },
        { label: '售后金额', value: x.asAmount, format: 'money' },
        { label: '有成交门店', value: x.activeStores, format: 'int' },
        { label: '无成交门店', value: x.idleStores, format: 'int' },
        { label: '待发货 SKU', value: x.pendingSku, format: 'int' }
      ]
    };
  }

  global.MdmOpsCockpitData = {
    overview: overview,
    PENDING: PENDING
  };
})(window);
