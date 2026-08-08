/**
 * 门店钱包演示数据（H5 钱包 / 进货收银台 / PC 门店档案共用）
 * 余额账户资金规则：
 * - 货款：不可提现，仅用于门店进货支付
 * - 可提款：已满足 T+1 解冻，可提现至汇付对公账户（不含货款）
 * - 待解冻：入账未满 T+1，不可提现，可用于门店进货支付
 * - 售后赔付 / 佣金回退 / 保证金出账等：不扣货款，
 *   可扣 = 余额账户中余额 − 货款（可提款 + 待解冻）
 * - 进货支付底层扣款顺序：货款 → 余额(可提现+待解冻) → 支付宝/微信
 * - 混合支付：先冻结积分+余额，先验三方回调，再解冻划拨余额、扣减积分
 */
(function (global) {
  var STORAGE_KEY = 'lf_store_wallet_demo_v17';
  /* 零售：售后赔付 / 佣金回退 / 保证金出账 —— 不扣货款，扣余额剩余层 */
  var NON_GOODS_BALANCE_EXPENSE = {
    售后赔付: true,
    佣金回退: true,
    保证金出账: true,
    保证金划拨出账: true
  };

  var DEFAULT = {
    storeName: '悠悠生鲜超市',
    merchantNo: 'HF8886202608001',
    balancePayStatus: '已开通',
    ruleSnapshot: { D: 2000, L: 8000, version: '加盟资金规则-v2026.07' },
    depositRequired: 2000,
    depositActual: 2000,
    /* 可用余额 = 货款 + 可提现 + 待解冻 = 10000；货款不可提现 */
    goodsQuota: 6000,
    withdrawable: 3000,
    /* 已入账未满 T+1，不可提现，可进货支付 */
    pending: 1000,
    /* 混合支付冻结占用（演示） */
    frozenGoodsQuota: 0,
    frozenWithdrawable: 0,
    frozenPending: 0,
    freezeRecord: null,
    commissionTotal: 3260.5,
    /* 已完成首次充值（含保证金划拨） */
    firstRechargeDone: true,
    /* 充值额度：单笔 5000 / 单日 5 万 */
    rechargeSingleLimit: 5000,
    rechargeDailyLimit: 50000,
    rechargeDailyUsed: 0,
    rechargeDailyDate: '',
    /* 门店汇付开户对公结算账户（提现到账） */
    settleAccount: {
      settleType: '对公',
      accountName: '悠悠生鲜超市',
      bankName: '中国建设银行',
      bankBranch: '杭州西湖支行',
      cardNo: '33050161663700000992',
      cardTail: '0992',
      arriveTip: '汇付开户对公账户，预计24小时内到账'
    }
  };

  function round2(n) {
    return Math.round(Number(n) * 100) / 100;
  }

  /** 支付方式仅：支付宝 / 微信 / 银行名称(卡号后四位) */
  function formatPayMethod(channel, settle, meta) {
    var ch = String(channel || '').trim();
    if (ch === '支付宝' || ch === '微信') return ch;
    if (meta && meta.methodId === 'alipay') return '支付宝';
    if (meta && meta.methodId === 'wechat') return '微信';
    var s = settle || {};
    var bank = String(s.bankName || (meta && meta.bankName) || '').trim();
    var tail = String(s.cardTail || (meta && meta.bankTail) || '').trim();
    if (bank && tail) return bank + '(' + tail + ')';
    if (bank) return bank;
    if (ch && ch !== '对公账户' && ch !== '对公') return ch;
    return '—';
  }

  function defaultLedgers() {
    /* 首次充值 10000→余额，再自动划拨 2000 至保证金（出账+入账） */
    return [
      {
        id: 'L001-A',
        time: '2026-07-28 10:12:03',
        type: '首次充值',
        dir: 'in',
        amount: 10000,
        account: '余额',
        bizNo: 'FI-20260728-001',
        channelNo: 'HF-IN-8899001',
        payMethod: '中国建设银行(0992)',
        bankName: '中国建设银行',
        bankTail: '0992',
        remark: '首次充值 10000 至余额账户'
      },
      {
        id: 'L001-B',
        time: '2026-07-28 10:12:04',
        type: '保证金划拨出账',
        dir: 'out',
        amount: 2000,
        account: '余额',
        bizNo: 'FI-20260728-001',
        channelNo: 'HF-IN-8899001',
        payMethod: '余额账户',
        remark: '首次充值后自动划拨保证金 2000'
      },
      {
        id: 'L001-C',
        time: '2026-07-28 10:12:04',
        type: '保证金划拨入账',
        dir: 'in',
        amount: 2000,
        account: '保证金',
        bizNo: 'FI-20260728-001',
        channelNo: 'HF-IN-8899001',
        payMethod: '余额账户',
        remark: '保证金划拨入账 2000（不可提现）'
      },
      {
        id: 'L004',
        time: '2026-07-30 14:22:11',
        type: '余额支付',
        dir: 'out',
        amount: 3000,
        account: '余额',
        bizNo: 'PO-20260730-8821',
        channelNo: 'BAL-DELAY-3001',
        payMethod: '微信',
        remark: '进货核销货款水位（不可提现层优先）'
      },
      {
        /* 支付失败：整笔流水状态失败，未入账（收入无「支付退回」） */
        id: 'L005',
        time: '2026-07-31 11:08:20',
        type: '充值',
        dir: 'in',
        amount: 500,
        account: '余额',
        bizNo: 'CZ-20260731-12',
        channelNo: 'HF-FAIL-12',
        payMethod: '微信',
        ledgerStatus: '失败',
        remark: '充值失败·通道未到账，资金未入账'
      },
      {
        id: 'L006',
        time: '2026-08-01 09:18:44',
        type: '平台佣金',
        dir: 'in',
        amount: 860.5,
        account: '余额',
        bizNo: 'CM-20260801-1102',
        channelNo: 'SPLIT-1102',
        payMethod: '支付宝',
        thawStatus: 'ready',
        remark: '零售订单平台佣金入账（已满 T+1，可提现）'
      },
      {
        id: 'L007',
        time: '2026-08-01 16:05:02',
        type: '充值',
        dir: 'in',
        amount: 1000,
        account: '余额',
        bizNo: 'CZ-20260801-55',
        channelNo: 'WX-PAY-77881',
        payMethod: '微信',
        thawStatus: 'ready',
        remark: '门店后续充值（已满 T+1；有缺口时先补保证金）'
      },
      {
        id: 'L007B',
        time: '2026-08-03 14:22:08',
        type: '平台佣金',
        dir: 'in',
        amount: 320,
        account: '余额',
        bizNo: 'CM-20260803-3301',
        channelNo: 'SPLIT-3301',
        payMethod: '支付宝',
        thawStatus: 'pending',
        remark: '当日佣金入账·未满 T+1，计入待解冻'
      },
      {
        /* 零售售后赔付：不扣货款，扣余额剩余（可提现/待解冻） */
        id: 'L008',
        time: '2026-08-02 11:30:18',
        type: '售后赔付',
        dir: 'out',
        amount: 200,
        account: '余额',
        subAccount: '可提现',
        bizNo: 'AS-20260802-09',
        channelNo: 'ADJ-09',
        payMethod: '余额账户',
        remark: '售后赔付·不扣货款，扣余额账户剩余（总额−货款）'
      },
      {
        /* 保证金出账：先扣余额剩余（不含货款），不足再扣保证金本金 */
        id: 'L009',
        time: '2026-08-02 14:05:00',
        type: '保证金出账',
        dir: 'out',
        amount: 300,
        account: '余额',
        subAccount: '可提现',
        bizNo: 'DP-OUT-20260802-12',
        channelNo: 'ADJ-12',
        payMethod: '余额账户',
        remark: '保证金出账·先扣余额剩余（不含货款）；不足时扣保证金本金'
      },
      {
        id: 'L010',
        time: '2026-08-02 15:10:00',
        type: '佣金回退',
        dir: 'out',
        amount: 120,
        account: '余额',
        subAccount: '可提现',
        bizNo: 'CM-R-20260802-03',
        channelNo: 'SPLIT-R-03',
        payMethod: '余额账户',
        remark: '佣金回退·不扣货款，扣余额账户剩余（总额−货款）'
      },
      {
        id: 'L011',
        time: '2026-08-02 18:40:00',
        type: '平台佣金',
        dir: 'in',
        amount: 400,
        account: '余额',
        bizNo: 'CM-20260802-2201',
        channelNo: 'SPLIT-2201',
        payMethod: '支付宝',
        remark: '平台佣金入账优先补齐保证金缺口 300，剩余进可提现'
      },
      {
        id: 'L012',
        time: '2026-08-02 18:40:00',
        type: '保证金补齐',
        dir: 'lock',
        amount: 300,
        account: '保证金',
        bizNo: 'CM-20260802-2201',
        channelNo: 'FILL-300',
        payMethod: '余额账户',
        remark: '平台佣金入账自动补齐保证金缺口'
      },
      {
        id: 'L013',
        time: '2026-08-02 20:05:33',
        type: '提现申请',
        dir: 'out',
        amount: 200,
        account: '余额',
        bizNo: 'WD-20260802-01',
        channelNo: 'WD-PEND-01',
        payMethod: '中国建设银行(0992)',
        bankName: '中国建设银行',
        bankTail: '0992',
        ledgerStatus: '处理中',
        withdrawStatus: 'pending',
        remark: '可提现部分出款，待渠道确认'
      },
      {
        id: 'L014',
        time: '2026-08-03 09:12:00',
        type: '提现申请',
        dir: 'out',
        amount: 150,
        account: '余额',
        bizNo: 'WD-20260803-02',
        channelNo: 'WD-FAIL-02',
        payMethod: '中国建设银行(0992)',
        bankName: '中国建设银行',
        bankTail: '0992',
        ledgerStatus: '失败',
        withdrawStatus: 'failed',
        remark: '提现失败·银行退回，资金未生效'
      },
      {
        /* 提现一经发起不可撤销；状态仅：成功 / 处理中 / 失败 */
        id: 'L015',
        time: '2026-08-03 11:40:18',
        type: '提现申请',
        dir: 'out',
        amount: 80,
        account: '余额',
        bizNo: 'WD-20260803-03',
        channelNo: 'WD-OK-03',
        payMethod: '中国建设银行(0992)',
        bankName: '中国建设银行',
        bankTail: '0992',
        ledgerStatus: '成功',
        withdrawStatus: 'success',
        remark: '提现成功·已到账汇付对公账户'
      }
    ];
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          /* 原型迭代：旧缓存缺新流水类型时重置演示台账 */
          if (!Array.isArray(parsed.ledgers) || parsed.ledgers.length < 8) {
            parsed.ledgers = defaultLedgers();
            parsed.depositActual = DEFAULT.depositActual;
            parsed.goodsQuota = DEFAULT.goodsQuota;
            parsed.withdrawable = DEFAULT.withdrawable;
            parsed.pending = DEFAULT.pending;
            parsed.commissionTotal = DEFAULT.commissionTotal;
            save(parsed);
          }
          return Object.assign({}, DEFAULT, parsed);
        }
      }
    } catch (e) {
      /* ignore */
    }
    var fresh = Object.assign({}, DEFAULT, { ledgers: defaultLedgers() });
    save(fresh);
    return fresh;
  }

  function save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      /* ignore */
    }
  }

  function snapshot(data) {
    var d = data || load();
    var gap = round2(Math.max(0, d.depositRequired - d.depositActual));
    var pending = round2(d.pending || 0);
    var fq = round2(d.frozenGoodsQuota || 0);
    var fw = round2(d.frozenWithdrawable || 0);
    var fp = round2(d.frozenPending || 0);
    var goodsQuota = round2(Math.max(0, Number(d.goodsQuota || 0) - fq));
    var withdrawable = round2(Math.max(0, Number(d.withdrawable || 0) - fw));
    var pendingAvail = round2(Math.max(0, pending - fp));
    /* 进货可用 = 货款 + 可提现 + 待解冻（扣冻结占用）；提现仅看可提现 */
    var available = round2(goodsQuota + withdrawable + pendingAvail);
    var settle = Object.assign({}, DEFAULT.settleAccount, d.settleAccount || {});
    return {
      storeName: d.storeName,
      merchantNo: d.merchantNo,
      balancePayStatus: d.balancePayStatus,
      ruleSnapshot: d.ruleSnapshot,
      depositRequired: d.depositRequired,
      depositActual: d.depositActual,
      depositGap: gap,
      goodsQuota: goodsQuota,
      withdrawable: withdrawable,
      available: available,
      pending: pendingAvail,
      frozenAmount: round2(fq + fw + fp),
      freezeRecord: d.freezeRecord || null,
      /* 货款不可提现，仅可用于门店进货 */
      goodsQuotaWithdrawable: 0,
      commissionTotal: round2(d.commissionTotal || 0),
      rechargeSingleLimit: Number(d.rechargeSingleLimit || DEFAULT.rechargeSingleLimit),
      rechargeDailyLimit: Number(d.rechargeDailyLimit || DEFAULT.rechargeDailyLimit),
      rechargeDailyRemain: rechargeDailyRemain(d),
      settleAccount: settle,
      ledgers: (d.ledgers || []).slice()
    };
  }

  function formatNow() {
    var t = new Date();
    function p(n) {
      return n < 10 ? '0' + n : String(n);
    }
    return (
      t.getFullYear() +
      '-' +
      p(t.getMonth() + 1) +
      '-' +
      p(t.getDate()) +
      ' ' +
      p(t.getHours()) +
      ':' +
      p(t.getMinutes()) +
      ':' +
      p(t.getSeconds())
    );
  }

  function todayKey() {
    var t = new Date();
    function p(n) {
      return n < 10 ? '0' + n : String(n);
    }
    return t.getFullYear() + '-' + p(t.getMonth() + 1) + '-' + p(t.getDate());
  }

  function normalizeRechargeDaily(d) {
    var day = todayKey();
    if (d.rechargeDailyDate !== day) {
      d.rechargeDailyDate = day;
      d.rechargeDailyUsed = 0;
    }
    if (d.rechargeSingleLimit == null) d.rechargeSingleLimit = DEFAULT.rechargeSingleLimit;
    if (d.rechargeDailyLimit == null) d.rechargeDailyLimit = DEFAULT.rechargeDailyLimit;
    return d;
  }

  function rechargeDailyRemain(data) {
    var d = data || load();
    var day = todayKey();
    var used = d.rechargeDailyDate === day ? Number(d.rechargeDailyUsed || 0) : 0;
    var limit = Number(
      d.rechargeDailyLimit != null ? d.rechargeDailyLimit : DEFAULT.rechargeDailyLimit
    );
    return round2(Math.max(0, limit - used));
  }

  /** 充值演示：优先补齐保证金缺口，其余进待解冻（T+1 后可提） */
  function applyRecharge(amount, meta) {
    var amt = round2(amount);
    var d = normalizeRechargeDaily(load());
    var singleLimit = Number(d.rechargeSingleLimit || 5000);
    var dailyRemain = rechargeDailyRemain(d);
    if (!(amt > 0)) {
      return { ok: false, message: '请输入正确的充值金额', snapshot: snapshot(d), filledGap: 0, toPending: 0 };
    }
    if (amt > singleLimit + 0.001) {
      return {
        ok: false,
        message: '单笔最高可充值¥' + singleLimit,
        snapshot: snapshot(d),
        filledGap: 0,
        toPending: 0
      };
    }
    if (amt > dailyRemain + 0.001) {
      return {
        ok: false,
        message: '超过单日剩余额度¥' + dailyRemain.toFixed(2),
        snapshot: snapshot(d),
        filledGap: 0,
        toPending: 0
      };
    }
    var channel = (meta && (meta.channel || meta.bankName)) || '对公账户';
    var settle = Object.assign({}, DEFAULT.settleAccount, d.settleAccount || {});
    var payMethod = formatPayMethod(channel, settle, meta);
    var gap = round2(Math.max(0, d.depositRequired - d.depositActual));
    var fill = Math.min(gap, amt);
    var rest = round2(amt - fill);
    var bizNo = 'CZ-' + Date.now().toString().slice(-8);
    var channelNo = 'RC-' + Date.now().toString().slice(-6);
    var now = formatNow();
    d.rechargeDailyUsed = round2(Number(d.rechargeDailyUsed || 0) + amt);

    /* 首次充值：全额入余额 → 自动划拨保证金（出账+入账）→ 剩余计入货款 */
    if (!d.firstRechargeDone) {
      d.firstRechargeDone = true;
      if (fill > 0) {
        d.depositActual = round2(d.depositActual + fill);
        d.ledgers.unshift({
          id: 'R' + Date.now() + 'C',
          time: now,
          type: '保证金划拨入账',
          dir: 'in',
          amount: fill,
          account: '保证金',
          bizNo: bizNo,
          channelNo: channelNo,
          payMethod: '余额账户',
          remark: '保证金划拨入账 ' + fill + '（不可提现）'
        });
        d.ledgers.unshift({
          id: 'R' + Date.now() + 'B',
          time: now,
          type: '保证金划拨出账',
          dir: 'out',
          amount: fill,
          account: '余额',
          bizNo: bizNo,
          channelNo: channelNo,
          payMethod: '余额账户',
          remark: '首次充值后自动划拨保证金 ' + fill
        });
      }
      d.ledgers.unshift({
        id: 'R' + Date.now() + 'A',
        time: now,
        type: '首次充值',
        dir: 'in',
        amount: amt,
        account: '余额',
        bizNo: bizNo,
        channelNo: channelNo,
        bankName: settle.bankName,
        bankTail: settle.cardTail,
        channel: channel,
        payMethod: payMethod,
        remark: '首次充值 ' + amt + ' 至余额账户'
      });
      if (rest > 0) d.goodsQuota = round2((d.goodsQuota || 0) + rest);
      save(d);
      return {
        ok: true,
        snapshot: snapshot(d),
        filledGap: fill,
        toPending: 0,
        toGoodsQuota: rest,
        firstRecharge: true
      };
    }

    /* 后续充值：有缺口先补齐，剩余进待解冻 */
    if (fill > 0) {
      d.depositActual = round2(d.depositActual + fill);
      d.ledgers.unshift({
        id: 'R' + Date.now() + 'D',
        time: now,
        type: '保证金补齐',
        dir: 'lock',
        amount: fill,
        account: '保证金',
        bizNo: bizNo,
        channelNo: 'RC-FILL-' + Date.now().toString().slice(-4),
        payMethod: '余额账户',
        channel: channel,
        remark: '充值优先从余额账户补齐保证金缺口'
      });
    }
    if (rest > 0) {
      d.pending = round2((d.pending || 0) + rest);
      d.ledgers.unshift({
        id: 'R' + Date.now(),
        time: now,
        type: '充值',
        dir: 'in',
        amount: rest,
        account: '余额',
        bizNo: bizNo,
        channelNo: channelNo,
        bankName: settle.bankName,
        bankTail: settle.cardTail,
        channel: channel,
        payMethod: payMethod,
        thawStatus: 'pending',
        remark: payMethod + '充值·未满 T+1，计入待解冻'
      });
    }
    save(d);
    return {
      ok: true,
      snapshot: snapshot(d),
      filledGap: fill,
      toPending: rest
    };
  }

  /** 提现演示：扣减可提现余额并记流水 */
  function applyWithdraw(amount, meta) {
    var amt = round2(amount);
    var d = load();
    if (!(amt > 0)) {
      return { ok: false, message: '请输入正确的提现金额', snapshot: snapshot(d) };
    }
    var gap = round2(Math.max(0, d.depositRequired - d.depositActual));
    if (gap > 0) {
      return { ok: false, message: '保证金存在缺口，请先补齐后再提现', snapshot: snapshot(d) };
    }
    var canWithdraw = round2(
      Math.max(0, Number(d.withdrawable || 0) - Number(d.frozenWithdrawable || 0))
    );
    if (amt > canWithdraw + 0.001) {
      return { ok: false, message: '提现金额不能超过可提现余额（货款不可提现）', snapshot: snapshot(d) };
    }
    var settle = Object.assign({}, DEFAULT.settleAccount, d.settleAccount || {}, meta || {});
    var bankName = settle.bankName || '对公账户';
    var bankTail = settle.cardTail || '';
    var accountName = settle.accountName || d.storeName || '';
    d.withdrawable = round2(d.withdrawable - amt);
    d.ledgers.unshift({
      id: 'W' + Date.now(),
      time: formatNow(),
      type: '提现申请',
      dir: 'out',
      amount: amt,
      account: '余额',
      bizNo: 'WD-' + Date.now().toString().slice(-8),
      channelNo: 'HF-' + (bankTail || Date.now().toString().slice(-4)),
      bankName: bankName,
      bankTail: bankTail,
      accountName: accountName,
      payMethod: formatPayMethod('对公账户', settle, meta),
      settleType: settle.settleType || '对公',
      withdrawStatus: 'pending',
      remark:
        '提现至汇付对公账户·' +
        bankName +
        (bankTail ? '(' + bankTail + ')' : '') +
        (accountName ? '·' + accountName : '')
    });
    save(d);
    return { ok: true, snapshot: snapshot(d) };
  }

  /** 按进货顺序拆分扣款：货款 → 余额(可提现) → 待解冻 */
  function splitRestockDebit(d, amount) {
    var amt = round2(amount);
    var q = round2(Math.max(0, Number(d.goodsQuota || 0) - Number(d.frozenGoodsQuota || 0)));
    var w = round2(Math.max(0, Number(d.withdrawable || 0) - Number(d.frozenWithdrawable || 0)));
    var p = round2(Math.max(0, Number(d.pending || 0) - Number(d.frozenPending || 0)));
    var avail = round2(q + w + p);
    if (amt > avail + 0.001) amt = avail;
    var left = amt;
    var fromQ = Math.min(q, left);
    left = round2(left - fromQ);
    var fromW = Math.min(w, left);
    left = round2(left - fromW);
    var fromP = left;
    return {
      amount: amt,
      fromGoodsQuota: round2(fromQ),
      fromWithdrawable: round2(fromW),
      fromPending: round2(fromP)
    };
  }

  /**
   * 混合支付：冻结积分+余额占用（先验三方回调，再 commit 解冻划拨）
   * meta: { balanceAmount, pointsAmount, channel }
   */
  function freezeRestockPay(meta) {
    var d = load();
    if (d.freezeRecord) {
      return { ok: false, message: '存在未完成的支付冻结', snapshot: snapshot(d) };
    }
    var balanceAmount = round2((meta && meta.balanceAmount) || 0);
    var pointsAmount = Number((meta && meta.pointsAmount) || 0) || 0;
    var split = splitRestockDebit(d, balanceAmount);
    d.frozenGoodsQuota = round2(split.fromGoodsQuota);
    d.frozenWithdrawable = round2(split.fromWithdrawable);
    d.frozenPending = round2(split.fromPending);
    d.freezeRecord = {
      id: 'FZ' + Date.now(),
      time: formatNow(),
      balanceAmount: split.amount,
      pointsAmount: pointsAmount,
      fromGoodsQuota: split.fromGoodsQuota,
      fromWithdrawable: split.fromWithdrawable,
      fromPending: split.fromPending,
      channel: (meta && meta.channel) || '',
      status: 'frozen'
    };
    save(d);
    return { ok: true, freeze: d.freezeRecord, snapshot: snapshot(d) };
  }

  /** 三方回调成功后：解冻并划拨余额、记流水（积分由收银台侧扣减） */
  function commitRestockPayFreeze(meta) {
    var d = load();
    var rec = d.freezeRecord;
    if (!rec) {
      var amt = round2((meta && meta.balanceAmount) || 0);
      return { ok: true, snapshot: applyRestockPay(amt, meta), mode: 'direct' };
    }
    var fromQ = round2(rec.fromGoodsQuota || 0);
    var fromW = round2(rec.fromWithdrawable || 0);
    var fromP = round2(rec.fromPending || 0);
    var amt = round2(rec.balanceAmount || 0);
    d.goodsQuota = round2(Number(d.goodsQuota || 0) - fromQ);
    d.withdrawable = round2(Number(d.withdrawable || 0) - fromW);
    d.pending = round2(Number(d.pending || 0) - fromP);
    d.frozenGoodsQuota = 0;
    d.frozenWithdrawable = 0;
    d.frozenPending = 0;
    var channelLabel =
      (meta && meta.channelLabel) ||
      (rec.channel === 'alipay' ? '支付宝' : rec.channel === 'wechat' ? '微信' : '混合支付');
    d.ledgers.unshift({
      id: 'L' + Date.now(),
      time: formatNow(),
      type: '余额支付',
      dir: 'out',
      amount: amt,
      account: '余额',
      bizNo: 'PO-' + Date.now().toString().slice(-8),
      channelNo: 'BAL-DELAY-' + Date.now().toString().slice(-4),
      payMethod: channelLabel,
      remark:
        '进货支付解冻划拨·货款¥' +
        fromQ.toFixed(2) +
        '+余额¥' +
        round2(fromW + fromP).toFixed(2) +
        (rec.pointsAmount > 0 ? '·积分' + rec.pointsAmount : '')
    });
    d.freezeRecord = null;
    save(d);
    return {
      ok: true,
      snapshot: snapshot(d),
      mode: 'commit',
      pointsAmount: Number(rec.pointsAmount) || 0,
      split: { fromGoodsQuota: fromQ, fromWithdrawable: fromW, fromPending: fromP }
    };
  }

  /** 三方失败 / 取消：释放冻结 */
  function releaseRestockPayFreeze() {
    var d = load();
    if (!d.freezeRecord) return { ok: true, snapshot: snapshot(d) };
    d.frozenGoodsQuota = 0;
    d.frozenWithdrawable = 0;
    d.frozenPending = 0;
    d.freezeRecord = null;
    save(d);
    return { ok: true, snapshot: snapshot(d) };
  }

  /**
   * 进货支付演示：扣减余额
   * 顺序：货款 → 余额(可提现) → 待解冻；渠道腿由收银台走支付宝/微信
   */
  function applyRestockPay(balanceAmount, meta) {
    var amt = round2(balanceAmount);
    if (amt <= 0) return snapshot();
    var d = load();
    var split = splitRestockDebit(d, amt);
    d.goodsQuota = round2(Number(d.goodsQuota || 0) - split.fromGoodsQuota);
    d.withdrawable = round2(Number(d.withdrawable || 0) - split.fromWithdrawable);
    d.pending = round2(Number(d.pending || 0) - split.fromPending);
    var channelLabel =
      (meta && meta.channelLabel) ||
      (meta && meta.channel === 'alipay'
        ? '支付宝'
        : meta && meta.channel === 'wechat'
          ? '微信'
          : '微信');
    d.ledgers.unshift({
      id: 'L' + Date.now(),
      time: formatNow(),
      type: '余额支付',
      dir: 'out',
      amount: split.amount,
      account: '余额',
      bizNo: 'PO-' + Date.now().toString().slice(-8),
      channelNo: 'BAL-DELAY-' + Date.now().toString().slice(-4),
      payMethod: channelLabel,
      remark:
        '进货支付·货款¥' +
        split.fromGoodsQuota.toFixed(2) +
        '+余额¥' +
        round2(split.fromWithdrawable + split.fromPending).toFixed(2)
    });
    save(d);
    return snapshot(d);
  }

  /**
   * 零售支出：售后赔付 / 佣金回退 / 保证金出账
   * - 不扣货款；先扣「余额 − 货款」= 可提现 + 待解冻
   * - 「保证金出账」在余额不足时，差额再扣保证金本金（可形成缺口）
   */
  function applyNonGoodsBalanceExpense(type, amount, meta) {
    var expenseType = String(type || '').trim();
    if (!NON_GOODS_BALANCE_EXPENSE[expenseType]) {
      return { ok: false, message: '该支出类型不走余额剩余层扣款', snapshot: snapshot() };
    }
    var amt = round2(amount);
    var d = load();
    var w = round2(Math.max(0, Number(d.withdrawable || 0) - Number(d.frozenWithdrawable || 0)));
    var p = round2(Math.max(0, Number(d.pending || 0) - Number(d.frozenPending || 0)));
    var pool = round2(w + p);
    var allowDepositFallback =
      expenseType === '保证金出账' || expenseType === '保证金划拨出账';
    var depositAvail = round2(Math.max(0, Number(d.depositActual || 0)));
    if (!(amt > 0)) {
      return { ok: false, message: '金额无效', snapshot: snapshot(d) };
    }
    if (!allowDepositFallback && amt > pool + 0.001) {
      return {
        ok: false,
        message: '余额剩余不足（不含货款，当前可扣¥' + pool.toFixed(2) + '）',
        snapshot: snapshot(d)
      };
    }
    if (allowDepositFallback && amt > pool + depositAvail + 0.001) {
      return {
        ok: false,
        message:
          '余额与保证金不足（当前可扣余额¥' +
          pool.toFixed(2) +
          '+保证金¥' +
          depositAvail.toFixed(2) +
          '）',
        snapshot: snapshot(d)
      };
    }
    var fromBal = Math.min(pool, amt);
    var fromW = Math.min(w, fromBal);
    var fromP = round2(fromBal - fromW);
    var fromDeposit = round2(Math.max(0, amt - fromBal));
    d.withdrawable = round2(Number(d.withdrawable || 0) - fromW);
    d.pending = round2(Number(d.pending || 0) - fromP);
    if (fromDeposit > 0.001) {
      d.depositActual = round2(Number(d.depositActual || 0) - fromDeposit);
    }
    var account =
      fromDeposit > 0.001 && fromBal > 0.001
        ? '余额/保证金'
        : fromDeposit > 0.001
          ? '保证金'
          : '余额';
    var sub =
      fromDeposit > 0.001 && fromBal <= 0.001
        ? '保证金本金'
        : fromW > 0.001 && fromP > 0.001
          ? '可提现/待解冻'
          : fromP > 0.001
            ? '待解冻'
            : fromW > 0.001
              ? '可提现'
              : '保证金本金';
    var remarkParts = [];
    if (fromBal > 0.001) {
      remarkParts.push(
        '余额剩余¥' + fromBal.toFixed(2) + '（可提现¥' + fromW.toFixed(2) + '+待解冻¥' + fromP.toFixed(2) + '）'
      );
    }
    if (fromDeposit > 0.001) {
      remarkParts.push('保证金本金¥' + fromDeposit.toFixed(2));
    }
    d.ledgers.unshift({
      id: 'E' + Date.now(),
      time: formatNow(),
      type: expenseType,
      dir: 'out',
      amount: amt,
      account: account,
      subAccount: sub,
      bizNo: (meta && meta.bizNo) || 'EX-' + Date.now().toString().slice(-8),
      channelNo: (meta && meta.channelNo) || '',
      payMethod: fromDeposit > 0.001 ? '余额账户/保证金账户' : '余额账户',
      remark:
        (meta && meta.remark) ||
        expenseType + '·不扣货款，' + remarkParts.join('；')
    });
    save(d);
    return {
      ok: true,
      snapshot: snapshot(d),
      split: {
        fromWithdrawable: fromW,
        fromPending: fromP,
        fromDeposit: fromDeposit,
        fromGoodsQuota: 0
      }
    };
  }

  /** @deprecated 旧名兼容：现为不扣货款的余额剩余层扣款 */
  function applyGoodsQuotaExpense(type, amount, meta) {
    return applyNonGoodsBalanceExpense(type, amount, meta);
  }

  function money(n) {
    return '¥' + round2(n).toFixed(2);
  }

  function resetDemo() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      /* ignore */
    }
    return snapshot();
  }

  global.StoreWalletDemo = {
    load: load,
    save: save,
    snapshot: snapshot,
    applyRestockPay: applyRestockPay,
    freezeRestockPay: freezeRestockPay,
    commitRestockPayFreeze: commitRestockPayFreeze,
    releaseRestockPayFreeze: releaseRestockPayFreeze,
    applyNonGoodsBalanceExpense: applyNonGoodsBalanceExpense,
    applyGoodsQuotaExpense: applyGoodsQuotaExpense,
    NON_GOODS_BALANCE_EXPENSE: NON_GOODS_BALANCE_EXPENSE,
    applyWithdraw: applyWithdraw,
    applyRecharge: applyRecharge,
    rechargeDailyRemain: rechargeDailyRemain,
    money: money,
    resetDemo: resetDemo,
    STORAGE_KEY: STORAGE_KEY
  };
})(typeof window !== 'undefined' ? window : this);
