/**
 * 门店钱包演示数据（H5 钱包 / 进货收银台 / PC 门店档案共用）
 * 口径：保证金账户 D + 余额账户（不可提现货款水位 Q + 可提现）
 */
(function (global) {
  var STORAGE_KEY = 'lf_store_wallet_demo_v3';

  var DEFAULT = {
    storeName: '悠悠生鲜超市',
    merchantNo: 'HF8886202608001',
    balancePayStatus: '已开通',
    ruleSnapshot: { D: 2000, L: 8000, version: '加盟资金规则-v2026.07' },
    depositRequired: 2000,
    depositActual: 2000,
    goodsQuota: 5000,
    withdrawable: 1860.5,
    pending: 0,
    commissionTotal: 3260.5
  };

  function round2(n) {
    return Math.round(Number(n) * 100) / 100;
  }

  function defaultLedgers() {
    /* 首次入金：拆成保证金账户、余额账户两笔展示 */
    return [
      {
        id: 'L001-D',
        time: '2026-07-28 10:12:03',
        type: '首次入金',
        dir: 'in',
        amount: 2000,
        account: '保证金',
        bizNo: 'FI-20260728-001',
        channelNo: 'HF-IN-8899001',
        remark: '公司线下充值到账·锁定保证金 2000（不可提现）'
      },
      {
        id: 'L001-B',
        time: '2026-07-28 10:12:03',
        type: '首次入金',
        dir: 'in',
        amount: 8000,
        account: '余额',
        bizNo: 'FI-20260728-001',
        channelNo: 'HF-IN-8899001',
        remark: '公司线下充值到账·首次货款额度 8000（不可提现货款）'
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
        remark: '进货核销货款水位（不可提现层优先）'
      },
      {
        id: 'L005',
        time: '2026-07-31 11:08:20',
        type: '支付退回',
        dir: 'in',
        amount: 500,
        account: '余额',
        bizNo: 'RF-20260731-12',
        channelNo: 'BAL-REF-12',
        remark: '进货部分退款·余额腿原路退回，货款水位恢复'
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
        remark: '零售订单平台佣金入账（可提现）'
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
        remark: '门店后续充值（可提现；有缺口时先补保证金）'
      },
      {
        id: 'L008',
        time: '2026-08-02 11:30:18',
        type: '售后问责',
        dir: 'out',
        amount: 200,
        account: '余额',
        bizNo: 'AS-20260802-09',
        channelNo: 'ADJ-09',
        remark: '定责赔付：优先扣余额'
      },
      {
        id: 'L009',
        time: '2026-08-02 11:30:19',
        type: '售后问责',
        dir: 'out',
        amount: 300,
        account: '保证金',
        bizNo: 'AS-20260802-09',
        channelNo: 'ADJ-09',
        remark: '余额不足部分扣保证金，形成缺口 300（演示后已补齐）'
      },
      {
        id: 'L010',
        time: '2026-08-02 15:10:00',
        type: '佣金回退',
        dir: 'out',
        amount: 120,
        account: '余额',
        bizNo: 'CM-R-20260802-03',
        channelNo: 'SPLIT-R-03',
        remark: '分佣冲销：优先扣余额'
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
        remark: '可提现部分出款（演示·处理中已完成）'
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
    var available = round2(d.goodsQuota + d.withdrawable);
    return {
      storeName: d.storeName,
      merchantNo: d.merchantNo,
      balancePayStatus: d.balancePayStatus,
      ruleSnapshot: d.ruleSnapshot,
      depositRequired: d.depositRequired,
      depositActual: d.depositActual,
      depositGap: gap,
      goodsQuota: round2(d.goodsQuota),
      withdrawable: round2(d.withdrawable),
      available: available,
      pending: round2(d.pending || 0),
      commissionTotal: round2(d.commissionTotal || 0),
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

  /** 进货支付演示：扣减余额（优先货款水位） */
  function applyRestockPay(balanceAmount) {
    var amt = round2(balanceAmount);
    if (amt <= 0) return snapshot();
    var d = load();
    var avail = round2(d.goodsQuota + d.withdrawable);
    if (amt > avail + 0.001) amt = avail;
    var fromQ = Math.min(d.goodsQuota, amt);
    var fromW = round2(amt - fromQ);
    d.goodsQuota = round2(d.goodsQuota - fromQ);
    d.withdrawable = round2(d.withdrawable - fromW);
    d.ledgers.unshift({
      id: 'L' + Date.now(),
      time: formatNow(),
      type: '余额支付',
      dir: 'out',
      amount: amt,
      account: '余额',
      bizNo: 'PO-' + Date.now().toString().slice(-8),
      channelNo: 'BAL-DELAY-' + Date.now().toString().slice(-4),
      remark: '进货混合支付·余额腿（优先核销不可提现货款）'
    });
    save(d);
    return snapshot(d);
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
    money: money,
    resetDemo: resetDemo,
    STORAGE_KEY: STORAGE_KEY
  };
})(typeof window !== 'undefined' ? window : this);
