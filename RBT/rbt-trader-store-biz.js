/**
 * 贸易商端 · 门店经营概览与本笔联营回收（演示）
 * 对齐体系 §6.6：GMV 系指标 + 本笔回收；不展示佣金／提现／进货。
 */
(function (global) {
  function round2(n) {
    return Math.round((Number(n) || 0) * 100) / 100;
  }

  function money(n) {
    var v = round2(n);
    var parts = v.toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  /** 按门店编码的经营演示（近 30／90／365 天） */
  var STORE_BIZ = {
    ONS00001: {
      name: '西湖中心生鲜店',
      ranges: {
        '30d': { paid: 18620, refund: 820, orders: 146, activeDays: 22, lastPayDate: '2026-11-14', trend: [420, 510, 380, 620, 710, 580, 640] },
        '90d': { paid: 51200, refund: 2100, orders: 410, activeDays: 68, lastPayDate: '2026-11-14', trend: [12, 14, 11, 16, 15, 18, 17] },
        '12m': { paid: 186000, refund: 8200, orders: 1520, activeDays: 248, lastPayDate: '2026-11-14', trend: [14, 15, 13, 16, 18, 17, 19] }
      }
    },
    ONS00002: {
      name: '东城和平里生鲜店',
      ranges: {
        '30d': { paid: 9800, refund: 460, orders: 88, activeDays: 18, lastPayDate: '2026-11-13', trend: [280, 260, 300, 240, 310, 290, 270] },
        '90d': { paid: 28600, refund: 1200, orders: 250, activeDays: 55, lastPayDate: '2026-11-13', trend: [8, 9, 7, 10, 9, 11, 10] },
        '12m': { paid: 98000, refund: 4100, orders: 860, activeDays: 210, lastPayDate: '2026-11-13', trend: [7, 8, 8, 9, 10, 9, 11] }
      }
    },
    ONS00003: {
      name: '河东大桥道自提点',
      ranges: {
        '30d': { paid: 4200, refund: 180, orders: 52, activeDays: 14, lastPayDate: '2026-11-12', trend: [120, 90, 140, 110, 130, 100, 150] },
        '90d': { paid: 12800, refund: 520, orders: 160, activeDays: 48, lastPayDate: '2026-11-12', trend: [4, 5, 3, 6, 5, 4, 6] },
        '12m': { paid: 42000, refund: 1800, orders: 520, activeDays: 180, lastPayDate: '2026-11-12', trend: [3, 4, 4, 5, 5, 4, 6] }
      }
    },
    ONS00004: {
      name: '五角场体验店',
      ranges: {
        '30d': { paid: 22400, refund: 960, orders: 178, activeDays: 24, lastPayDate: '2026-11-14', trend: [600, 720, 580, 810, 760, 690, 800] },
        '90d': { paid: 62000, refund: 2800, orders: 490, activeDays: 72, lastPayDate: '2026-11-14', trend: [16, 18, 15, 20, 19, 17, 21] },
        '12m': { paid: 210000, refund: 9200, orders: 1680, activeDays: 260, lastPayDate: '2026-11-14', trend: [15, 16, 17, 18, 19, 18, 20] }
      }
    },
    ONS00005: {
      name: '余杭仓前便利店',
      ranges: {
        '30d': { paid: 6400, refund: 320, orders: 64, activeDays: 16, lastPayDate: '2026-11-11', trend: [180, 160, 200, 150, 210, 170, 190] },
        '90d': { paid: 18200, refund: 900, orders: 190, activeDays: 50, lastPayDate: '2026-11-11', trend: [5, 6, 4, 7, 6, 5, 7] },
        '12m': { paid: 64000, refund: 2800, orders: 620, activeDays: 190, lastPayDate: '2026-11-11', trend: [4, 5, 5, 6, 6, 5, 7] }
      }
    }
  };

  /** 本笔联营回收：对齐演示里支付中／已完成单号；签约前状态走空态 */
  var DEMAND_JV = {
    XQ00024: {
      agreed: 28600,
      actual: 12800.5,
      remain: 15799.5,
      status: '支付中',
      estDays: 42,
      estDate: '2026-12-26',
      dailyRows: [
        { d: '11-14', a: 420.5 },
        { d: '11-13', a: 386 },
        { d: '11-12', a: 512.3 },
        { d: '11-11', a: 298 },
        { d: '11-10', a: 176.2 },
        { d: '11-09', a: 402 },
        { d: '11-08', a: 355 },
        { d: '11-07', a: 468 },
        { d: '11-06', a: 291 },
        { d: '11-05', a: 330 },
        { d: '11-04', a: 415 },
        { d: '11-03', a: 280 },
        { d: '11-02', a: 390 },
        { d: '11-01', a: 445 },
        { d: '10-31', a: 318 },
        { d: '10-30', a: 372 },
        { d: '10-29', a: 401 },
        { d: '10-28', a: 256 },
        { d: '10-27', a: 338 },
        { d: '10-26', a: 410 }
      ]
    },
    XQ00023: {
      agreed: 19800,
      actual: 6200,
      remain: 13600,
      status: '支付中',
      estDays: 58,
      estDate: '2027-01-11',
      dailyRows: [
        { d: '11-14', a: 210 },
        { d: '11-13', a: 180 },
        { d: '11-12', a: 240 },
        { d: '11-11', a: 165 },
        { d: '11-10', a: 198 },
        { d: '11-09', a: 220 },
        { d: '11-08', a: 175 },
        { d: '11-07', a: 205 },
        { d: '11-06', a: 190 },
        { d: '11-05', a: 230 },
        { d: '11-04', a: 160 },
        { d: '11-03', a: 185 },
        { d: '11-02', a: 210 },
        { d: '11-01', a: 155 },
        { d: '10-31', a: 200 },
        { d: '10-30', a: 170 },
        { d: '10-29', a: 195 },
        { d: '10-28', a: 145 }
      ]
    }
  };

  var DAILY_PREVIEW = 5;

  function normalizeRange(range) {
    if (range === '90d' || range === '12m') return range;
    return '30d';
  }

  /* 开业大礼包：各方完成签署后（待复核及之后）门店才可能开业，才有经营概览 */
  function isSignedComplete(status) {
    var s = String(status || '');
    return s === '待复核' || s === '支付中' || s === '已完成';
  }

  /* 待接单不展示本笔联营回收模块；接单后未进入支付仅空态；支付中／已完成才有进度 */
  function shouldShowJvModule(demand) {
    if (!demand || !demand.code) return false;
    var status = String(demand.status || '');
    if (status === '待接单' || status === '待审核' || !demand.traderName) return false;
    return true;
  }

  function overviewReadyForDemand(demand) {
    return !!(demand && isSignedComplete(demand.status));
  }

  function buildStoreOverview(storeCode, range, opts) {
    var o = opts || {};
    var store = STORE_BIZ[storeCode] || {
      name: (o.storeName || storeCode || '门店'),
      ranges: {
        '30d': { paid: 0, refund: 0, orders: 0, activeDays: 0, lastPayDate: '', trend: [] },
        '90d': { paid: 0, refund: 0, orders: 0, activeDays: 0, lastPayDate: '', trend: [] },
        '12m': { paid: 0, refund: 0, orders: 0, activeDays: 0, lastPayDate: '', trend: [] }
      }
    };
    var key = normalizeRange(range);
    var ready = o.ready !== false;
    if (!ready) {
      return {
        storeCode: storeCode,
        storeName: store.name || o.storeName || storeCode,
        range: key,
        ready: false,
        tip:
          o.tip ||
          '开业大礼包需求下，门店在各方完成签署并开始营业后才有经营数据，签署完成前暂无可查看概览',
        paid: null,
        refund: null,
        net: null,
        orders: null,
        aov: null,
        activeDays: null,
        lastPayDate: '',
        trend: []
      };
    }
    var row = (store.ranges && store.ranges[key]) || store.ranges['30d'];
    var paid = row.paid;
    var refund = row.refund;
    var orders = row.orders;
    var aov = orders > 0 ? round2(paid / orders) : null;
    return {
      storeCode: storeCode,
      storeName: store.name,
      range: key,
      ready: true,
      paid: paid,
      refund: refund,
      net: round2(paid - refund),
      orders: orders,
      aov: aov,
      activeDays: row.activeDays,
      lastPayDate: row.lastPayDate,
      trend: (row.trend || []).slice()
    };
  }

  function buildDemandJv(demand) {
    if (!demand || !demand.code) {
      return { show: false, started: false, reason: 'missing' };
    }
    var status = String(demand.status || '');
    if (!shouldShowJvModule(demand)) {
      return {
        show: false,
        started: false,
        reason: 'pending-accept',
        tip: ''
      };
    }
    /* 接单后、进入日结付款前：模块可展示，但不伪造已扣款 */
    if (
      status === '待确认签约' ||
      status === '待签署' ||
      status === '待复核' ||
      status === '待审核'
    ) {
      return {
        show: true,
        started: false,
        reason: 'not-started',
        tip: '本笔尚未开始日结付款，进入付款后可查看付完进度'
      };
    }
    var jv = DEMAND_JV[demand.code];
    if (!jv) {
      if (status === '已完成') {
        return {
          show: true,
          started: true,
          agreed: 0,
          actual: 0,
          remain: 0,
          status: '已完成付款',
          estDays: 0,
          estLabel: '已付完',
          dailyRows: []
        };
      }
      if (status === '支付中') {
        return {
          show: true,
          started: false,
          reason: 'not-started',
          tip: '本笔尚未开始日结付款，进入付款后可查看付完进度'
        };
      }
      return { show: false, started: false, reason: 'not-started', tip: '' };
    }
    var estLabel =
      jv.remain <= 0
        ? jv.paybackCycle || '已付完'
        : '约 ' + jv.estDays + ' 天付完' + (jv.estDate ? '（预计 ' + jv.estDate + '）' : '');
    return {
      show: true,
      started: true,
      agreed: jv.agreed,
      actual: jv.actual,
      remain: jv.remain,
      status: jv.status,
      estDays: jv.estDays,
      estDate: jv.estDate || '',
      estLabel: estLabel,
      dailyRows: (jv.dailyRows || []).slice()
    };
  }

  /* 仅本人已接单相关门店（不含待接单可见门店） */
  function listVisibleStores(opts) {
    var o = opts || {};
    var accepted = o.accepted || [];
    var map = {};
    accepted.forEach(function (item) {
      if (!item || !item.storeCode) return;
      var code = item.storeCode;
      if (!map[code]) {
        map[code] = {
          storeCode: code,
          storeName: item.storeName || code,
          demandCount: 0,
          mineCount: 0,
          sampleDemandCode: item.code,
          overviewReady: false
        };
      }
      map[code].demandCount += 1;
      map[code].mineCount += 1;
      if (isSignedComplete(item.status)) {
        map[code].overviewReady = true;
        if (!map[code].signedDemandCode) map[code].signedDemandCode = item.code;
      }
      if (
        item.status === '支付中' ||
        DEMAND_JV[item.code]
      ) {
        map[code].activeDemandCode = item.code;
      }
    });
    return Object.keys(map)
      .map(function (k) {
        var row = map[k];
        var ready = !!row.overviewReady;
        var ov = buildStoreOverview(row.storeCode, '30d', {
          ready: ready,
          storeName: row.storeName
        });
        var jv = null;
        if (row.activeDemandCode) {
          jv = buildDemandJv({
            code: row.activeDemandCode,
            status: '支付中',
            traderName: 'mine'
          });
        }
        return {
          storeCode: row.storeCode,
          storeName: row.storeName,
          overviewReady: ready,
          paid30d: ready ? ov.paid : null,
          activeDays: ready ? ov.activeDays : null,
          lastPayDate: ready ? ov.lastPayDate : '',
          demandCount: row.demandCount,
          mineCount: row.mineCount,
          jvRemain: jv && jv.started ? jv.remain : null,
          jvEstLabel: jv && jv.started ? jv.estLabel : '',
          sampleDemandCode: row.signedDemandCode || row.sampleDemandCode,
          activeDemandCode: row.activeDemandCode || row.signedDemandCode || ''
        };
      })
      .sort(function (a, b) {
        return (b.mineCount || 0) - (a.mineCount || 0) || String(a.storeName).localeCompare(String(b.storeName));
      });
  }

  /** 演示「今天」；与门店一键履约演示日对齐 */
  var DEMO_AS_OF = '2026-11-23';

  var CUSTOM_RANGE_PRESETS = [];

  function numOf(value) {
    var n = Number(String(value == null ? '' : value).replace(/,/g, '').replace(/^¥/, ''));
    return isFinite(n) ? n : 0;
  }

  function demandEnded(demand) {
    var s = String((demand && demand.status) || '');
    return s === '已完成' || s === '已作废' || s === '已驳回';
  }

  /** POS 营业额二级拆分（演示比例，合计＝POS 营业额） */
  var POS_TURNOVER_MODULES = [
    { id: 'dine', label: '堂食', share: 0.52 },
    { id: 'takeout', label: '外卖', share: 0.33 },
    { id: 'stored', label: '储值卡', share: 0.15 }
  ];

  function splitPosModules(total) {
    var amount = round2(total);
    if (!(amount > 0)) {
      return POS_TURNOVER_MODULES.map(function (mod) {
        return { id: mod.id, label: mod.label, turnover: 0 };
      });
    }
    var parts = POS_TURNOVER_MODULES.map(function (mod) {
      return {
        id: mod.id,
        label: mod.label,
        turnover: round2(amount * mod.share)
      };
    });
    /* 尾差补到堂食，保证三块合计等于 POS 总额 */
    var sum = round2(
      parts.reduce(function (acc, row) {
        return acc + row.turnover;
      }, 0)
    );
    parts[0].turnover = round2(parts[0].turnover + (amount - sum));
    return parts;
  }

  /** 经营拆分渠道：仅 POS／直播／商城；手动履约不计入渠道营业额与收入 */
  var BIZ_CHANNELS = [
    { id: 'POS', label: 'POS' },
    { id: '直播', label: '直播' },
    { id: '商城', label: '商城' }
  ];

  function normalizeBizChannel(channel) {
    var name = String(channel || '').trim();
    if (name === 'POS' || name === '直播' || name === '商城') return name;
    return '';
  }

  function emptyChannelPack() {
    var pack = {};
    BIZ_CHANNELS.forEach(function (ch) {
      pack[ch.id] = { turnover: 0, credit: 0 };
    });
    return pack;
  }

  function ymdOf(raw) {
    var m = String(raw || '').match(/(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : '';
  }

  /* 签完合同日：取已签合同各方签署日的最晚一天；没有则退到支付日。 */
  function contractDoneDate(demand) {
    var api = global.RbtDemandData;
    var latest = '';
    if (api && typeof api.signContracts === 'function') {
      api.signContracts(demand).forEach(function (contract) {
        if (!contract || contract.signStatus !== '已签署') return;
        (contract.parties || []).forEach(function (party) {
          var day = ymdOf(party && party.signedAt);
          if (day && day > latest) latest = day;
        });
      });
    }
    if (latest) return latest;
    return ymdOf(demand && demand.paidAt);
  }

  function clampDay(day, from, to) {
    var d = ymdOf(day);
    if (!d) return '';
    if (from && d < from) return from;
    if (to && d > to) return to;
    return d;
  }

  /**
   * 收款单据 · 门店经营情况（本笔）
   * 营业额＝POS／直播／商城渠道营业流水。贸易商端不展示收入。
   * 可查区间：签完合同 → 已结单（履约中截至演示当日）；已结束后冻结，不再并入后续。
   * opts.rangeMode=overview|custom；opts.from/to 自定义；opts.focusDate 点选单日。
   */
  function buildCollectStoreBiz(demand, opts) {
    opts = opts || {};
    var daily = global.RbtDailyFulfill;
    var emptyChannels = BIZ_CHANNELS.map(function (ch) {
      return {
        id: ch.id,
        label: ch.label,
        turnoverTotal: null,
        creditTotal: null,
        focusTurnover: null,
        focusCredit: null,
        series: []
      };
    });
    var empty = {
      ready: false,
      frozen: false,
      rangeMode: 'overview',
      windowFrom: '',
      windowTo: '',
      from: '',
      to: '',
      storeCode: (demand && demand.storeCode) || '',
      storeName: (demand && demand.storeName) || '',
      turnoverTotal: null,
      creditTotal: null,
      focusLabel: '当日',
      focusDate: '',
      focusTurnover: null,
      focusCredit: null,
      focusChannels: emptyChannels.map(function (ch) {
        return {
          id: ch.id,
          label: ch.label,
          turnover: null,
          credit: null
        };
      }),
      channels: emptyChannels,
      series: [],
      tip: '本笔尚未进入履约，暂无门店经营数据'
    };
    if (!demand || !demand.code) return empty;
    var status = String(demand.status || '');
    if (status !== '门店付款中' && status !== '还款中' && status !== '已完成') {
      return empty;
    }
    var facts = daily && typeof daily.opsFacts === 'function' ? daily.opsFacts(demand) : [];
    var splits = daily && typeof daily.payeeSplit === 'function' ? daily.payeeSplit(demand) : [];
    var byDate = {};
    function ensureDate(date) {
      if (!byDate[date]) byDate[date] = emptyChannelPack();
      return byDate[date];
    }
    facts.forEach(function (row) {
      if (!row || !row.date || row.kind === 'manual') return;
      var ch = normalizeBizChannel(row.channel);
      if (!ch) return;
      ensureDate(row.date)[ch].turnover = round2(ensureDate(row.date)[ch].turnover + numOf(row.turnover));
    });
    splits.forEach(function (row) {
      if (!row || !row.date || row.kind === 'manual') return;
      var ch = normalizeBizChannel(row.channel);
      if (!ch) return;
      ensureDate(row.date)[ch].credit = round2(ensureDate(row.date)[ch].credit + numOf(row.trader));
    });
    var allDates = Object.keys(byDate).sort();
    var frozen = demandEnded(demand);
    var dataEnd = allDates.length ? allDates[allDates.length - 1] : '';
    var windowFrom = contractDoneDate(demand) || (allDates[0] || '');
    var windowTo = frozen ? dataEnd || windowFrom : DEMO_AS_OF;
    if (windowFrom && windowTo && windowFrom > windowTo) windowFrom = windowTo;
    var rangeMode = opts.rangeMode === 'custom' ? 'custom' : 'overview';
    var from = rangeMode === 'custom' ? clampDay(opts.from || windowFrom, windowFrom, windowTo) : windowFrom;
    var to = rangeMode === 'custom' ? clampDay(opts.to || windowTo, windowFrom, windowTo) : windowTo;
    if (from && to && from > to) {
      var swap = from;
      from = to;
      to = swap;
    }
    var dates = allDates.filter(function (d) {
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
    var series = dates.map(function (date) {
      var pack = byDate[date] || emptyChannelPack();
      var turnover = 0;
      var credit = 0;
      var channels = {};
      BIZ_CHANNELS.forEach(function (ch) {
        var cell = pack[ch.id] || { turnover: 0, credit: 0 };
        channels[ch.id] = {
          turnover: round2(cell.turnover),
          credit: round2(cell.credit)
        };
        turnover = round2(turnover + cell.turnover);
        credit = round2(credit + cell.credit);
      });
      return { date: date, turnover: turnover, credit: credit, channels: channels };
    });
    var channelTotals = {};
    BIZ_CHANNELS.forEach(function (ch) {
      channelTotals[ch.id] = { turnover: 0, credit: 0 };
    });
    series.forEach(function (row) {
      BIZ_CHANNELS.forEach(function (ch) {
        var cell = row.channels[ch.id] || { turnover: 0, credit: 0 };
        channelTotals[ch.id].turnover = round2(channelTotals[ch.id].turnover + cell.turnover);
        channelTotals[ch.id].credit = round2(channelTotals[ch.id].credit + cell.credit);
      });
    });
    var turnoverTotal = round2(
      BIZ_CHANNELS.reduce(function (sum, ch) {
        return sum + channelTotals[ch.id].turnover;
      }, 0)
    );
    var creditTotal = round2(
      BIZ_CHANNELS.reduce(function (sum, ch) {
        return sum + channelTotals[ch.id].credit;
      }, 0)
    );
    var picked = clampDay(opts.focusDate, from, to);
    var focusDate = picked;
    var focusLabel = picked ? '单日' : rangeMode === 'custom' ? '时段合计' : frozen ? '结束日' : '当日';
    var focusRow = null;
    if (picked) {
      series.forEach(function (row) {
        if (row.date === picked) focusRow = row;
      });
      if (!focusRow) {
        focusRow = {
          date: picked,
          turnover: 0,
          credit: 0,
          channels: emptyChannelPack()
        };
      }
    } else if (!frozen && rangeMode === 'overview') {
      focusDate = DEMO_AS_OF;
      focusLabel = '当日';
      series.forEach(function (row) {
        if (row.date === focusDate) focusRow = row;
      });
    }
    if (!picked && !focusRow && series.length) {
      focusRow = series[series.length - 1];
      focusDate = focusRow.date;
      focusLabel = frozen ? '结束日' : rangeMode === 'custom' ? '时段末日' : '最近营业日';
    }
    if (!picked && rangeMode === 'custom' && series.length) {
      /* 自定义时段默认看合计，明细区展示时段末日拆分，点图可改单日 */
      focusLabel = '时段末日';
    }
    var channels = BIZ_CHANNELS.map(function (ch) {
      var total = channelTotals[ch.id];
      var chSeries = series.map(function (row) {
        var cell = row.channels[ch.id] || { turnover: 0, credit: 0 };
        return { date: row.date, turnover: cell.turnover, credit: cell.credit };
      });
      var focusCell =
        focusRow && focusRow.channels && focusRow.channels[ch.id]
          ? focusRow.channels[ch.id]
          : { turnover: 0, credit: 0 };
      var turnoverTotal = series.length ? total.turnover : null;
      return {
        id: ch.id,
        label: ch.label,
        turnoverTotal: turnoverTotal,
        creditTotal: series.length ? total.credit : null,
        focusTurnover: focusRow ? focusCell.turnover : null,
        focusCredit: focusRow ? focusCell.credit : null,
        posModules: ch.id === 'POS' ? splitPosModules(turnoverTotal || 0) : null,
        series: chSeries
      };
    });
    var tip = frozen ? '需求已结束，经营数据已冻结，不再跟踪后续营业额。' : '';
    return {
      ready: true,
      hasSeries: series.length > 0,
      frozen: frozen,
      rangeMode: rangeMode,
      windowFrom: windowFrom,
      windowTo: windowTo,
      from: from,
      to: to,
      storeCode: demand.storeCode || '',
      storeName: demand.storeName || '',
      turnoverTotal: series.length ? turnoverTotal : 0,
      creditTotal: series.length ? creditTotal : 0,
      focusLabel: focusLabel,
      focusDate: focusDate || '',
      focusTurnover: focusRow ? focusRow.turnover : null,
      focusCredit: focusRow ? focusRow.credit : null,
      focusChannels: channels.map(function (ch) {
        return {
          id: ch.id,
          label: ch.label,
          turnover: ch.focusTurnover,
          credit: ch.focusCredit
        };
      }),
      channels: channels,
      series: series,
      tip: tip
    };
  }

  global.RbtTraderStoreBiz = {
    money: money,
    round2: round2,
    DEMO_AS_OF: DEMO_AS_OF,
    CUSTOM_RANGE_PRESETS: CUSTOM_RANGE_PRESETS,
    BIZ_CHANNELS: BIZ_CHANNELS,
    POS_TURNOVER_MODULES: POS_TURNOVER_MODULES,
    DAILY_PREVIEW: DAILY_PREVIEW,
    isSignedComplete: isSignedComplete,
    shouldShowJvModule: shouldShowJvModule,
    overviewReadyForDemand: overviewReadyForDemand,
    demandEnded: demandEnded,
    buildStoreOverview: buildStoreOverview,
    buildDemandJv: buildDemandJv,
    buildCollectStoreBiz: buildCollectStoreBiz,
    listVisibleStores: listVisibleStores,
    RANGE_OPTIONS: [
      { id: '30d', label: '近30天' },
      { id: '90d', label: '近90天' },
      { id: '12m', label: '近12个月' }
    ]
  };
})(window);
