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

  /** 收入含平台佣金；支出含佣金回退 */
  var INCOME_TYPES = ['平台佣金', '佣金入账', '首次充值', '首次入金', '充值', '支付退回', '保证金划拨入账'];
  var EXPENSE_TYPES = ['佣金回退', '余额支付', '售后问责', '提现申请', '保证金划拨出账'];

  function matchTab(item) {
    var type = String(item.type || '');
    if (bizTypeFilter && type !== bizTypeFilter) return false;
    if (tab === 'all') return true;
    if (tab === 'in') {
      return item.dir === 'in' || INCOME_TYPES.indexOf(type) >= 0;
    }
    if (tab === 'out') {
      return item.dir === 'out' || EXPENSE_TYPES.indexOf(type) >= 0;
    }
    if (tab === 'lock') return item.dir === 'lock';
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
      if (label) label.textContent = '业务类型：' + bizTypeFilter;
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

  function accountLabel(account) {
    var a = String(account || '');
    if (a.indexOf('保证金') >= 0 && a.indexOf('余额') >= 0) return '保证金账户/余额账户';
    if (a.indexOf('保证金') >= 0) return '保证金账户';
    if (a.indexOf('余额') >= 0) return '余额账户';
    return a || '—';
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

  function payMethodLabel(item) {
    var type = String((item && item.type) || '');
    /* 保证金划拨 / 补齐：支付方式为余额账户 */
    if (
      type === '保证金补齐' ||
      type === '保证金划拨出账' ||
      type === '保证金划拨入账' ||
      String((item && item.payMethod) || '') === '余额账户'
    ) {
      return '余额账户';
    }
    var m = String((item && (item.payMethod || item.channel)) || '').trim();
    var no = String((item && item.channelNo) || '');
    if (m === '支付宝' || m === '微信') return m;
    if (/^WX/i.test(no) || m.indexOf('微信') >= 0) return '微信';
    if (/^ALI|ZFB/i.test(no) || m.indexOf('支付宝') >= 0) return '支付宝';
    /* 对公账户 / 银行名 → 统一成 银行(后四位) */
    if (
      !m ||
      m === '对公账户' ||
      m === '对公' ||
      m.indexOf('银行') >= 0 ||
      (item && item.bankName)
    ) {
      var corp = corpBankLabel(item);
      if (corp) return corp;
    }
    if (m && m !== '对公账户' && m !== '对公') return m;
    return '—';
  }

  function ledgerStatus(item) {
    if (item.type === '提现申请') {
      return { text: '处理中', cls: 'is-pending', action: '' };
    }
    if (item.dir === 'lock') {
      return { text: '已锁定', cls: 'is-lock', action: '' };
    }
    if (item.type === '余额支付') {
      return { text: '支付成功', cls: 'is-ok', action: '' };
    }
    if (item.type === '保证金划拨出账') {
      return { text: '划拨成功', cls: '', action: '' };
    }
    if (item.type === '保证金划拨入账') {
      return { text: '入账成功', cls: 'is-ok', action: '' };
    }
    if (item.type === '首次充值') {
      return { text: '入账成功', cls: 'is-ok', action: '' };
    }
    if (item.thawStatus === 'pending') {
      return { text: '待解冻·T+1', cls: 'is-pending', action: '' };
    }
    if (item.type === '平台佣金' || item.type === '佣金入账') {
      return { text: item.thawStatus === 'ready' ? '可提现' : '入账成功', cls: 'is-ok', action: '' };
    }
    if (item.type === '佣金回退') {
      return { text: '已回退', cls: '', action: '' };
    }
    if (item.dir === 'in') {
      if (item.thawStatus === 'ready') return { text: '可提现', cls: 'is-ok', action: '' };
      return { text: '入账成功', cls: 'is-ok', action: '' };
    }
    return { text: '已完成', cls: '', action: '' };
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
          '<div class="ua-sw-ledger__row"><span class="ua-sw-ledger__k">业务类型</span>' +
          '<span class="ua-sw-ledger__v">' +
          escHtml(item.type) +
          '</span></div>' +
          '<div class="ua-sw-ledger__row"><span class="ua-sw-ledger__k">账户</span>' +
          '<span class="ua-sw-ledger__v">' +
          escHtml(accountLabel(item.account)) +
          '</span></div>' +
          '<div class="ua-sw-ledger__row"><span class="ua-sw-ledger__k">支付方式</span>' +
          '<span class="ua-sw-ledger__v">' +
          escHtml(payMethodLabel(item)) +
          '</span></div>' +
          '<div class="ua-sw-ledger__row"><span class="ua-sw-ledger__k">支付流水</span>' +
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
          '售后问责等可能占用保证金，形成缺口',
          '存在缺口时，后续入账优先补齐保证金'
        ]
      },
      balance: {
        title: '余额账户说明',
        lead: '用于进货支付；提现仅限已满 T+1 的可提款。',
        points: [
          '可提款：已满 T+1，可提现至汇付对公账户',
          '入账未满 T+1 的金额不可提现（可支付进货）',
          '货款：不可提现，进货时优先扣减'
        ]
      },
      goods: {
        title: '货款说明',
        lead: '货款不可提现，用于保障进货周转。',
        points: [
          '首次充值划入的货款额度，不支持提现',
          '进货支付时优先扣减货款；相关退款可恢复货款水位',
          '可提现部分请查看上方「可提款」金额'
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
        '<p class="ua-sw-sheet__lead">' +
        conf.lead +
        '</p><ul class="ua-sw-sheet__list">' +
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
