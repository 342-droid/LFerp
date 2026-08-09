(function () {
  var api = window.StoreWalletDemo;
  if (!api) return;

  var tab = 'all';
  var bizTypeFilter = '';
  var timeRange = '30d';
  var customStart = '';
  var customEnd = '';
  var snap = api.snapshot();

  var TIME_OPTIONS = [
    { id: 'all', name: '全部时间', desc: '不限起止日期' },
    { id: '7d', name: '近7天', desc: '最近一周流水' },
    { id: '30d', name: '近30天', desc: '最近一个月流水' },
    { id: '90d', name: '近3个月', desc: '最近一季度流水' },
    { id: '180d', name: '近半年', desc: '最近六个月流水' },
    { id: 'custom', name: '自定义', desc: '自选起止日期' }
  ];

  function moneyPlain(n) {
    return Number(n).toFixed(2);
  }

  function renderSummary() {
    snap = api.snapshot();
    var total = Number(snap.depositActual || 0) + Number(snap.available || 0);
    var totalWithdraw = Number(snap.withdrawable || 0);
    setText('swTotalAmount', moneyPlain(total));
    setText('swTotalWithdrawable', moneyPlain(totalWithdraw));
    setText('swDepositActual', moneyPlain(snap.depositActual));
    setText('swDepositWithdrawable', '0.00');
    setText('swAvailable', moneyPlain(snap.available));
    setText('swWithdrawable', moneyPlain(snap.withdrawable));
    setText('swGoodsQuota', moneyPlain(snap.goodsQuota));
    var metaEl = document.getElementById('swDepositMeta');
    if (metaEl) {
      var gap = Number(snap.depositGap || 0);
      metaEl.textContent =
        '应保有 ¥' +
        moneyPlain(snap.depositRequired) +
        (gap > 0 ? ' · 缺口 ¥' + moneyPlain(gap) : '');
      metaEl.classList.toggle('is-warn', gap > 0);
    }
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /**
   * 账变类型 / 状态：与 MDM 门店档案·账变记录枚举对齐
   * 收入：账户=入账钱包；支付方式=来源（不可与账户同值）
   * 支出：账户=对手方；付款方式=出款钱包/渠道（不可与账户同值）
   * 售后/责任类扣款：账户=平台，付款方式=保证金账户；保证金不足则失败
   */
  var BIZ_TYPE_MAP = {
    保证金划拨入账: '保证金入账',
    保证金补齐: '保证金补缴',
    平台佣金: '佣金结算',
    佣金入账: '佣金结算',
    订单佣金: '佣金结算',
    提现申请: '提现',
    售后问责: '售后/责任类扣款',
    售后赔付: '售后/责任类扣款',
    保证金出账: '售后/责任类扣款',
    保证金划拨出账: '售后/责任类扣款',
    余额支付: '进货支付',
    进货退款: '退款'
  };
  var INCOME_TYPES = [
    '首次充值',
    '首次入金',
    '保证金入账',
    '保证金划拨入账',
    '佣金结算',
    '订单佣金',
    '平台佣金',
    '佣金入账',
    '充值',
    '提现回退',
    '退款',
    '进货退款'
  ];
  /* 支出筛选：含旧名「售后赔付 / 保证金出账 / 保证金划拨出账」等 → 售后/责任类扣款 */
  var EXPENSE_TYPES = [
    '提现',
    '提现申请',
    '售后赔付',
    '售后问责',
    '售后/责任类扣款',
    '保证金出账',
    '保证金划拨出账',
    '佣金回退',
    '余额支付',
    '进货支付'
  ];
  var LOCK_TYPES = ['保证金补缴', '保证金补齐'];

  function mapLedgerBizType(rawType) {
    var t = String(rawType || '');
    return BIZ_TYPE_MAP[t] || t || '—';
  }

  function matchBizTypeFilter(item) {
    if (!bizTypeFilter) return true;
    var raw = String(item.type || '');
    var mapped = mapLedgerBizType(raw);
    return raw === bizTypeFilter || mapped === bizTypeFilter;
  }

  function matchTab(item) {
    var type = String(item.type || '');
    var mapped = mapLedgerBizType(type);
    if (!matchBizTypeFilter(item)) return false;
    if (tab === 'all') return true;
    if (tab === 'in') {
      return item.dir === 'in' || INCOME_TYPES.indexOf(type) >= 0 || INCOME_TYPES.indexOf(mapped) >= 0;
    }
    if (tab === 'out') {
      return item.dir === 'out' || EXPENSE_TYPES.indexOf(type) >= 0 || EXPENSE_TYPES.indexOf(mapped) >= 0;
    }
    if (tab === 'lock') {
      return item.dir === 'lock' || LOCK_TYPES.indexOf(type) >= 0 || LOCK_TYPES.indexOf(mapped) >= 0;
    }
    return true;
  }

  function parseItemDay(item) {
    var s = String((item && item.time) || '');
    var m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function formatYmd(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function formatMdLabel(ymd) {
    var m = String(ymd || '').match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return '';
    return m[2] + '.' + m[3];
  }

  function parseYmd(ymd) {
    var m = String(ymd || '').match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  function todayYmd() {
    return formatYmd(new Date());
  }

  function defaultCustomRange() {
    var end = new Date();
    var start = new Date();
    start.setDate(start.getDate() - 29);
    return { start: formatYmd(start), end: formatYmd(end) };
  }

  function matchTime(item) {
    var d = parseItemDay(item);
    if (!d) return true;
    if (timeRange === 'all') return true;
    if (timeRange === 'custom') {
      var s = parseYmd(customStart);
      var e = parseYmd(customEnd);
      if (!s || !e) return true;
      var endExclusive = e.getTime() + 86400000 - 1;
      return d.getTime() >= s.getTime() && d.getTime() <= endExclusive;
    }
    var daysMap = { '7d': 7, '30d': 30, '90d': 90, '180d': 180 };
    var days = daysMap[timeRange];
    if (!days) return true;
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var start = new Date(today.getTime() - (days - 1) * 86400000);
    return d.getTime() >= start.getTime() && d.getTime() <= today.getTime() + 86400000 - 1;
  }

  function currentTimeOption() {
    return (
      TIME_OPTIONS.find(function (o) {
        return o.id === timeRange;
      }) || TIME_OPTIONS[2]
    );
  }

  function syncTimeFilterUi() {
    var opt = currentTimeOption();
    var label = document.getElementById('swTimeLabel');
    var btn = document.getElementById('swTimeBtn');
    var text = opt.name;
    if (timeRange === 'custom' && customStart && customEnd) {
      text = formatMdLabel(customStart) + '-' + formatMdLabel(customEnd);
    }
    if (label) label.textContent = text;
    if (btn) btn.classList.toggle('is-active', timeRange !== 'all');
  }

  function showTimePresetView() {
    var sheet = document.getElementById('swTimeSheet');
    var custom = document.getElementById('swTimeCustom');
    var back = document.getElementById('swTimeBack');
    var title = document.getElementById('swTimeSheetTitle');
    if (sheet) sheet.classList.remove('is-custom');
    if (custom) custom.hidden = true;
    if (back) back.hidden = true;
    if (title) title.textContent = '选择时间';
  }

  function showTimeCustomView() {
    var sheet = document.getElementById('swTimeSheet');
    var custom = document.getElementById('swTimeCustom');
    var back = document.getElementById('swTimeBack');
    var title = document.getElementById('swTimeSheetTitle');
    var startInput = document.getElementById('swTimeStart');
    var endInput = document.getElementById('swTimeEnd');
    var err = document.getElementById('swTimeCustomErr');
    var def = defaultCustomRange();
    if (startInput) {
      startInput.value = customStart || def.start;
      startInput.max = todayYmd();
    }
    if (endInput) {
      endInput.value = customEnd || def.end;
      endInput.max = todayYmd();
    }
    if (err) {
      err.hidden = true;
      err.textContent = '';
    }
    if (sheet) sheet.classList.add('is-custom');
    if (custom) custom.hidden = false;
    if (back) back.hidden = false;
    if (title) title.textContent = '自定义时间';
  }

  function renderTimeOptions() {
    var host = document.getElementById('swTimeOptions');
    if (!host) return;
    host.innerHTML = TIME_OPTIONS.map(function (o) {
      var active = o.id === timeRange ? ' is-active' : '';
      var desc = o.desc;
      if (o.id === 'custom' && customStart && customEnd && timeRange === 'custom') {
        desc = formatMdLabel(customStart) + ' 至 ' + formatMdLabel(customEnd);
      }
      return (
        '<button type="button" class="ua-sw-time-opt' +
        active +
        '" role="option" aria-selected="' +
        (o.id === timeRange ? 'true' : 'false') +
        '" data-time-range="' +
        o.id +
        '">' +
        '<span class="ua-sw-time-opt__text">' +
        '<span class="ua-sw-time-opt__name">' +
        o.name +
        '</span>' +
        '<span class="ua-sw-time-opt__desc">' +
        desc +
        '</span>' +
        '</span>' +
        '<span class="ua-sw-time-opt__check" aria-hidden="true"></span>' +
        '</button>'
      );
    }).join('');
  }

  function openTimeSheet() {
    var sheet = document.getElementById('swTimeSheet');
    var btn = document.getElementById('swTimeBtn');
    showTimePresetView();
    renderTimeOptions();
    if (sheet) sheet.hidden = false;
    if (btn) btn.setAttribute('aria-expanded', 'true');
  }

  function closeTimeSheet() {
    var sheet = document.getElementById('swTimeSheet');
    var btn = document.getElementById('swTimeBtn');
    showTimePresetView();
    if (sheet) sheet.hidden = true;
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function applyCustomRange() {
    var startInput = document.getElementById('swTimeStart');
    var endInput = document.getElementById('swTimeEnd');
    var err = document.getElementById('swTimeCustomErr');
    var start = startInput ? startInput.value : '';
    var end = endInput ? endInput.value : '';
    var s = parseYmd(start);
    var e = parseYmd(end);
    if (!s || !e) {
      if (err) {
        err.hidden = false;
        err.textContent = '请选择完整的起止日期';
      }
      return false;
    }
    if (s.getTime() > e.getTime()) {
      if (err) {
        err.hidden = false;
        err.textContent = '开始日期不能晚于结束日期';
      }
      return false;
    }
    customStart = start;
    customEnd = end;
    timeRange = 'custom';
    syncTimeFilterUi();
    closeTimeSheet();
    renderList();
    try {
      var url = new URL(window.location.href);
      url.searchParams.set('time', 'custom');
      url.searchParams.set('start', customStart);
      url.searchParams.set('end', customEnd);
      window.history.replaceState({}, '', url.pathname + url.search);
    } catch (e2) {
      /* ignore */
    }
    return true;
  }

  function syncBizTypeFilterUi() {
    var bar = document.getElementById('swBizFilter');
    var label = document.getElementById('swBizFilterLabel');
    if (!bar) return;
    if (bizTypeFilter) {
      bar.hidden = false;
      if (label) label.textContent = '账变类型：' + mapLedgerBizType(bizTypeFilter);
    } else {
      bar.hidden = true;
    }
  }

  function amtClass(dir) {
    if (dir === 'in') return 'is-in';
    if (dir === 'lock') return 'is-lock';
    return 'is-out';
  }

  function amtPrefix(dir) {
    if (dir === 'in') return '+';
    if (dir === 'out') return '-';
    return '';
  }

  function accountLabel(account, subAccount) {
    var a = String(account || '').trim();
    var sub = String(subAccount || '');
    if (a === '平台') return '平台';
    if (a.indexOf('资金到账') >= 0) return '资金到账账户';
    if (a.indexOf('保证金') >= 0 && a.indexOf('余额') >= 0) return '保证金账户/余额账户';
    if (a.indexOf('保证金') >= 0) return '保证金账户';
    if (a.indexOf('余额') >= 0) {
      if (sub.indexOf('货款') >= 0) return '余额账户-货款';
      return '余额账户';
    }
    /* 提现账户 / 佣金回退商户简称等：原样展示 */
    return a || '—';
  }

  /** 提现：账户=银行名称(卡号后四位)；其它走 accountLabel */
  function accountDisplay(item) {
    if (isWithdrawLedger(item) && mapLedgerBizType(item && item.type) === '提现') {
      var a = String((item && item.account) || '').trim();
      if (a && a.indexOf('资金到账') < 0 && a.indexOf('余额') < 0 && a.indexOf('保证金') < 0) {
        return a;
      }
      return withdrawBankLabel(item);
    }
    return accountLabel(item && item.account, item && item.subAccount);
  }

  function isExpenseLedger(item) {
    var type = String((item && item.type) || '');
    var mapped = mapLedgerBizType(type);
    return (
      (item && item.dir === 'out') ||
      EXPENSE_TYPES.indexOf(type) >= 0 ||
      EXPENSE_TYPES.indexOf(mapped) >= 0
    );
  }

  /** 支出（含提现）：字段名「付款方式」；收入 / 锁定补齐：「支付方式」 */
  function payWayFieldLabel(item) {
    if (isExpenseLedger(item) || isWithdrawLedger(item)) return '付款方式';
    return '支付方式';
  }

  /** 对公展示为「银行名称(卡号后四位)」；支付方式仅：银行卡 / 支付宝 / 微信 */
  function corpBankLabel(item) {
    var bank = String((item && (item.bankName || item.settleBankName)) || '').trim();
    var tail = String((item && (item.bankTail || item.cardTail || item.settleCardTail)) || '').trim();
    if (!bank || !tail) {
      var settle = (snap && snap.settleAccount) || {};
      if (!bank) bank = String(settle.bankName || '').trim();
      if (!tail) tail = String(settle.cardTail || '').trim();
    }
    if (bank && tail) return bank + '(' + tail + ')';
    if (bank) return bank;
    return '';
  }

  function isWithdrawLedger(item) {
    var biz = mapLedgerBizType(item && item.type);
    return biz === '提现' || biz === '提现回退';
  }

  /** 提现到账银行：银行名+卡号后四位（用于账户字段） */
  function withdrawBankLabel(item) {
    var corp = corpBankLabel(item);
    if (corp) return corp;
    var a = String((item && item.account) || '').trim();
    if (a && a.indexOf('资金到账') < 0 && a.indexOf('银行') >= 0) return a;
    var m = String((item && (item.payMethod || item.channel)) || '').trim();
    if (m && m !== '对公账户' && m !== '对公' && m.indexOf('账户') < 0) return m;
    return '—';
  }

  function payMethodLabel(item) {
    var m = String((item && (item.payMethod || item.channel)) || '').trim();
    if (
      m === '平台' ||
      m === '余额账户' ||
      m === '保证金账户' ||
      m === '余额账户/保证金账户'
    ) {
      return m;
    }
    var type = String((item && item.type) || '');
    var mapped = mapLedgerBizType(type);
    /* 提现：付款方式为出款钱包（余额/保证金），不再展示银行 */
    if (mapped === '提现' || type === '提现申请') {
      if (m === '保证金账户' || m === '余额账户/保证金账户') return m;
      return '余额账户';
    }
    if (m) return m;
    /* 旧「保证金出账」默认保证金账户；其余售后/责任类扣款默认余额账户 */
    if (type === '保证金出账') return '保证金账户';
    if (
      mapped === '进货支付' ||
      mapped === '售后/责任类扣款' ||
      type === '余额支付' ||
      type === '佣金回退' ||
      type === '保证金补齐' ||
      type === '保证金划拨出账' ||
      type === '保证金划拨入账'
    ) {
      return '余额账户';
    }
    var no = String((item && item.channelNo) || '');
    if (/^WX/i.test(no)) return '微信';
    if (/^ALI|ZFB/i.test(no)) return '支付宝';
    if (item && item.bankName) {
      var corp = corpBankLabel(item);
      if (corp) return corp;
    }
    return '—';
  }

  /** 状态枚举与 MDM 一致：成功 / 处理中 / 失败；提现不可撤销 */
  function ledgerStatus(item) {
    var raw = item && (item.ledgerStatus || item.status);
    if (raw === '已撤销') {
      return { text: '失败', cls: 'is-fail', action: '' };
    }
    if (raw === '成功' || raw === '处理中' || raw === '失败') {
      return {
        text: raw,
        cls: raw === '成功' ? 'is-ok' : raw === '处理中' ? 'is-pending' : 'is-fail',
        action: ''
      };
    }
    var ws = item && item.withdrawStatus;
    if (ws === 'pending' || ws === 'processing') {
      return { text: '处理中', cls: 'is-pending', action: '' };
    }
    if (ws === 'failed' || ws === 'fail') {
      return { text: '失败', cls: 'is-fail', action: '' };
    }
    if (ws === 'success' || ws === 'done') {
      return { text: '成功', cls: 'is-ok', action: '' };
    }
    var biz = mapLedgerBizType(item && item.type);
    var remark = String((item && item.remark) || '');
    if (biz === '提现' || (item && item.type === '提现申请')) {
      if (/失败/.test(remark)) return { text: '失败', cls: 'is-fail', action: '' };
      if (/已完成|成功到账/.test(remark)) return { text: '成功', cls: 'is-ok', action: '' };
      return { text: '处理中', cls: 'is-pending', action: '' };
    }
    if (item && item.type === '余额支付' && item.payStatus === 'pending') {
      return { text: '处理中', cls: 'is-pending', action: '' };
    }
    if (/充值失败|提现失败/.test(remark)) {
      return { text: '失败', cls: 'is-fail', action: '' };
    }
    return { text: '成功', cls: 'is-ok', action: '' };
  }

  function formatShortTime(t) {
    var s = String(t || '');
    var m = s.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}:\d{2})/);
    if (m) return m[2] + '.' + m[3] + ' ' + m[4];
    return s;
  }

  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderList() {
    var host = document.getElementById('swLedgerList');
    if (!host) return;
    snap = api.snapshot();
    var list = (snap.ledgers || []).filter(function (item) {
      return matchTab(item) && matchTime(item);
    });
    if (!list.length) {
      host.innerHTML = '<div class="ua-sw-empty">该时间范围内暂无流水</div>';
      return;
    }
    host.innerHTML = list
      .map(function (item) {
        var st = ledgerStatus(item);
        var biz = item.bizNo || item.id;
        return (
          '<article class="ua-sw-ledger" data-ledger-id="' +
          escHtml(item.id) +
          '">' +
          '<div class="ua-sw-ledger__head">' +
          '<div class="ua-sw-ledger__id"><em>业务单号:</em>' +
          escHtml(biz) +
          '</div>' +
          '<button type="button" class="ua-sw-ledger__copy" data-sw-copy="' +
          escHtml(biz) +
          '" aria-label="复制业务单号">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' +
          '<rect x="8" y="8" width="11" height="11" rx="2"/>' +
          '<path d="M6 16H5a2 2 0 01-2-2V5a2 2 0 012-2h9a2 2 0 012 2v1"/>' +
          '</svg></button>' +
          '</div>' +
          '<div class="ua-sw-ledger__row"><span class="ua-sw-ledger__k">金额</span>' +
          '<span class="ua-sw-ledger__v ' +
          amtClass(item.dir) +
          '">' +
          amtPrefix(item.dir) +
          api.money(item.amount) +
          '</span></div>' +
          '<div class="ua-sw-ledger__row"><span class="ua-sw-ledger__k">账变类型</span>' +
          '<span class="ua-sw-ledger__v">' +
          escHtml(mapLedgerBizType(item.type)) +
          '</span></div>' +
          '<div class="ua-sw-ledger__row"><span class="ua-sw-ledger__k">账户</span>' +
          '<span class="ua-sw-ledger__v">' +
          escHtml(accountDisplay(item)) +
          '</span></div>' +
          '<div class="ua-sw-ledger__row"><span class="ua-sw-ledger__k">' +
          payWayFieldLabel(item) +
          '</span>' +
          '<span class="ua-sw-ledger__v">' +
          escHtml(payMethodLabel(item)) +
          '</span></div>' +
          '<div class="ua-sw-ledger__row"><span class="ua-sw-ledger__k">交易流水</span>' +
          '<span class="ua-sw-ledger__v">' +
          escHtml(item.channelNo || '—') +
          '</span></div>' +
          '<div class="ua-sw-ledger__foot">' +
          '<span class="ua-sw-ledger__time">' +
          escHtml(formatShortTime(item.time)) +
          '</span>' +
          '<span class="ua-sw-ledger__status ' +
          st.cls +
          '">' +
          escHtml(st.text) +
          '</span>' +
          '</div>' +
          '</article>'
        );
      })
      .join('');
  }

  function bind() {
    /* 演示：确保进件已通过，避免提现被门禁拦住 */
    if (window.StoreOnboardingGate && typeof window.StoreOnboardingGate.ensureDemoApproved === 'function') {
      window.StoreOnboardingGate.ensureDemoApproved(true);
    }
    var params = new URLSearchParams(window.location.search);
    var from = params.get('from') || '';
    var tabParam = params.get('tab') || '';
    var bizParam = params.get('bizType') || params.get('type') || '';
    if (tabParam === 'in' || tabParam === 'out' || tabParam === 'lock' || tabParam === 'all') {
      tab = tabParam;
    }
    if (bizParam) bizTypeFilter = bizParam;
    var timeParam = params.get('time') || '';
    if (TIME_OPTIONS.some(function (o) { return o.id === timeParam; })) {
      timeRange = timeParam;
    }
    if (timeRange === 'custom') {
      customStart = params.get('start') || '';
      customEnd = params.get('end') || '';
      if (!customStart || !customEnd) {
        var def = defaultCustomRange();
        customStart = def.start;
        customEnd = def.end;
      }
    }
    syncBizTypeFilterUi();
    syncTimeFilterUi();
    document.querySelectorAll('[data-sw-tab]').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-sw-tab') === tab);
    });

    var back = document.getElementById('swBack');
    if (back) {
      if (from === 'store-app') {
        back.setAttribute('href', '../../store-app/h5/home.html');
      } else if (from.indexOf('biz-center') >= 0) {
        back.setAttribute('href', '../../store-app/h5/biz-center.html');
      } else if (from.indexOf('restock') >= 0) {
        back.setAttribute('href', 'restock.html?from=store-app&tab=me');
      }
    }

    var HELP = {
      deposit: {
        title: '保证金账户说明',
        lead: '入驻锁定资金，保障履约与售后责任，不可提现。',
        points: [
          '入驻时锁定，不支持提现',
          '存在缺口时，后续入账优先补齐保证金',
          '「售后/责任类扣款」从保证金账户付款至平台；保证金不足时出账失败（不从余额拼扣）'
        ]
      },
      balance: {
        title: '余额账户说明',
        lead: '',
        points: [
          '货款：不可提现，仅用于门店进货支付。',
          '可提款：余额账户中已满足 T+1 解冻规则的资金，可提现至汇付对公账户（不包含货款）。',
          '待解冻：入账未满 T+1 的资金，不可提现，可用于门店进货支付。',
          '进货支付 / 售后·责任类扣款（余额账户付款）/ 佣金回退等：不扣货款，可扣 = 余额 − 货款（可提款 + 待解冻）'
        ]
      },
      goods: {
        title: '货款说明',
        lead: '货款：不可提现，仅用于门店进货支付。',
        points: [
          '不支持提现，仅用于门店进货支付',
          '进货支付、售后/责任类扣款、佣金回退等规则见余额与保证金说明',
          '可提现部分请查看上方「可提款金额」'
        ]
      }
    };

    function closeHelpSheet() {
      var sheet = document.getElementById('swHelpSheet');
      if (sheet) sheet.hidden = true;
    }

    function openHelpSheet(kind) {
      var conf = HELP[kind];
      var sheet = document.getElementById('swHelpSheet');
      var titleEl = document.getElementById('swHelpTitle');
      var bodyEl = document.getElementById('swHelpBody');
      if (!conf || !sheet || !titleEl || !bodyEl) return;
      titleEl.textContent = conf.title;
      bodyEl.innerHTML =
        (conf.lead
          ? '<p class="ua-sw-sheet__lead">' + conf.lead + '</p>'
          : '') +
        '<ul class="ua-sw-sheet__list">' +
        conf.points
          .map(function (p) {
            return '<li>' + p + '</li>';
          })
          .join('') +
        '</ul>';
      sheet.hidden = false;
    }

    document.querySelectorAll('[data-sw-help]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openHelpSheet(btn.getAttribute('data-sw-help'));
      });
    });

    document.querySelectorAll('[data-sw-help-close]').forEach(function (el) {
      el.addEventListener('click', closeHelpSheet);
    });

    document.querySelectorAll('[data-sw-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        tab = btn.getAttribute('data-sw-tab');
        document.querySelectorAll('[data-sw-tab]').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
        renderList();
      });
    });

    var clearBiz = document.getElementById('swBizFilterClear');
    if (clearBiz) {
      clearBiz.addEventListener('click', function () {
        bizTypeFilter = '';
        syncBizTypeFilterUi();
        renderList();
        try {
          var url = new URL(window.location.href);
          url.searchParams.delete('bizType');
          url.searchParams.delete('type');
          window.history.replaceState({}, '', url.pathname + url.search);
        } catch (e) {
          /* ignore */
        }
      });
    }

    var timeBtn = document.getElementById('swTimeBtn');
    if (timeBtn) {
      timeBtn.addEventListener('click', openTimeSheet);
    }
    document.querySelectorAll('[data-sw-time-close]').forEach(function (el) {
      el.addEventListener('click', closeTimeSheet);
    });
    var timeList = document.getElementById('swTimeOptions');
    if (timeList) {
      timeList.addEventListener('click', function (e) {
        var opt = e.target.closest('[data-time-range]');
        if (!opt) return;
        var next = opt.getAttribute('data-time-range') || '30d';
        if (next === 'custom') {
          /* 进入自定义配置时先高亮「自定义」，避免列表未及时隐藏时仍显示「近30天」勾选 */
          timeList.querySelectorAll('[data-time-range]').forEach(function (el) {
            var on = el.getAttribute('data-time-range') === 'custom';
            el.classList.toggle('is-active', on);
            el.setAttribute('aria-selected', on ? 'true' : 'false');
          });
          showTimeCustomView();
          return;
        }
        timeRange = next;
        syncTimeFilterUi();
        closeTimeSheet();
        renderList();
        try {
          var url = new URL(window.location.href);
          url.searchParams.delete('start');
          url.searchParams.delete('end');
          if (timeRange === '30d') url.searchParams.delete('time');
          else url.searchParams.set('time', timeRange);
          window.history.replaceState({}, '', url.pathname + url.search);
        } catch (err) {
          /* ignore */
        }
      });
    }

    var timeBack = document.getElementById('swTimeBack');
    if (timeBack) {
      timeBack.addEventListener('click', function () {
        showTimePresetView();
        renderTimeOptions();
      });
    }

    var customOk = document.getElementById('swTimeCustomOk');
    if (customOk) {
      customOk.addEventListener('click', applyCustomRange);
    }

    ['swTimeStart', 'swTimeEnd'].forEach(function (id) {
      var input = document.getElementById(id);
      if (!input) return;
      input.addEventListener('change', function () {
        var err = document.getElementById('swTimeCustomErr');
        if (err) {
          err.hidden = true;
          err.textContent = '';
        }
        var startInput = document.getElementById('swTimeStart');
        var endInput = document.getElementById('swTimeEnd');
        if (startInput && endInput && startInput.value) {
          endInput.min = startInput.value;
        }
      });
    });

    /* 初始化时若带 tab/bizType/time，列表需按条件渲染 */
    renderList();

    document.getElementById('swLedgerList') &&
      document.getElementById('swLedgerList').addEventListener('click', function (e) {
        var copyBtn = e.target.closest('[data-sw-copy]');
        if (!copyBtn) return;
        e.preventDefault();
        e.stopPropagation();
        var text = copyBtn.getAttribute('data-sw-copy') || '';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(
            function () {
              window.alert('已复制业务单号');
            },
            function () {
              window.alert(text);
            }
          );
        } else {
          window.alert('已复制：' + text);
        }
      });

    document.getElementById('swRechargeBtn') &&
      document.getElementById('swRechargeBtn').addEventListener('click', function () {
        var params = new URLSearchParams(window.location.search);
        var from = params.get('from') || '';
        var q = from ? '?from=' + encodeURIComponent(from) : '';
        window.location.href = 'store-recharge.html' + q;
      });

    document.getElementById('swWithdrawBtn') &&
      document.getElementById('swWithdrawBtn').addEventListener('click', function () {
        var gate = window.StoreOnboardingGate;
        if (gate && !gate.canWithdraw()) {
          var wMsg = gate.withdrawBlockMessage() || '商户进件未完成，暂无法提现';
          gate.blockAndGoOnboarding(wMsg, {
            from: 'store-app',
            returnUrl: 'store-wallet.html' + (window.location.search || '?from=store-app')
          });
          return;
        }
        snap = api.snapshot();
        if (snap.depositGap > 0) {
          window.alert('保证金存在缺口 ' + api.money(snap.depositGap) + '，请先补齐后再提现。');
          return;
        }
        var params = new URLSearchParams(window.location.search);
        var from = params.get('from') || '';
        var q = from ? '?from=' + encodeURIComponent(from) : '';
        window.location.href = 'store-withdraw.html' + q;
      });

    var resetBtn = document.getElementById('swResetDemo');
    if (resetBtn) {
      resetBtn.hidden = false;
      resetBtn.addEventListener('click', function () {
        if (!window.confirm('重置门店钱包演示数据？')) return;
        if (typeof api.resetDemo === 'function') api.resetDemo();
        renderSummary();
        renderList();
      });
    }
  }

  renderSummary();
  renderList();
  bind();
})();
