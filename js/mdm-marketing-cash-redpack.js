/**
 * 营销活动 — 现金红包首页（总控 + 发放明细）
 */
(function () {
  'use strict';

  var Store = window.MdmMarketingCashRedpackStore;
  if (!Store) return;

  var wp = window.wmsPath || {
    page: function (f) {
      return f;
    }
  };

  var ON_DESC =
    '现金红包已开启，可在支持红包发放的活动中配置该项；红包超过设定小时未领取将自动撤销。';
  var OFF_DESC =
    '现金红包已关闭，所有能发现金红包的活动中该项均为禁用，无法勾选和编辑修改。';

  var configEditing = false;

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatAmount(n) {
    var v = Number(n) || 0;
    return v.toLocaleString('zh-CN', {
      minimumFractionDigits: v % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    });
  }

  function toast(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type || 'info');
  }

  function avatarHtml(item) {
    if (item.userAvatar) {
      return (
        '<span class="mkt-cr-user__avatar"><img src="' +
        escapeHtml(item.userAvatar) +
        '" alt=""></span>'
      );
    }
    var ch = String(item.userName || '用').charAt(0);
    return '<span class="mkt-cr-user__avatar" aria-hidden="true">' + escapeHtml(ch) + '</span>';
  }

  function statusClass(st) {
    if (st === 'claimed') return 'mdm-status mdm-status--ok';
    if (st === 'pending') return 'mdm-status mdm-status--warn';
    if (st === 'failed') return 'mdm-status mdm-status--danger';
    return 'mdm-status mdm-status--muted';
  }

  function setSystemOn(on) {
    var switchBtn = document.getElementById('crSystemSwitch');
    var statusEl = document.getElementById('crSystemStatus');
    var descEl = document.getElementById('crSystemDesc');
    var hoursEl = document.getElementById('crExpireHours');
    var claimLimit = document.getElementById('crClaimLimit');
    if (!switchBtn) return;
    switchBtn.classList.toggle('mkt-points-switch--on', on);
    switchBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (statusEl) statusEl.textContent = on ? '已开启' : '已关闭';
    if (descEl) descEl.textContent = on ? ON_DESC : OFF_DESC;
    var locked = !on || !configEditing;
    if (hoursEl) hoursEl.disabled = locked;
    if (claimLimit) claimLimit.disabled = locked;
    var saveBtn = document.getElementById('crExpireSaveBtn');
    if (saveBtn) saveBtn.textContent = configEditing ? '保存' : '修改';
  }

  function showCount(n) {
    if (n === '' || n == null || Number(n) === 0) return '';
    return String(n);
  }

  function showLimit(n) {
    var v = Math.round(Number(n));
    if (isNaN(v) || v < 0) return '0';
    return String(v);
  }

  function applySettingsToUi() {
    var s = Store.getSettings();
    setSystemOn(!!s.enabled);
    var hoursEl = document.getElementById('crExpireHours');
    if (hoursEl) hoursEl.value = String(s.expireHours);
    var liveEl = document.getElementById('crLiveLimit');
    var dailyEl = document.getElementById('crDailyLimit');
    var totalEl = document.getElementById('crTotalLimit');
    if (liveEl) liveEl.value = showLimit(s.liveLimit);
    if (dailyEl) dailyEl.value = showLimit(s.dailyLimit);
    if (totalEl) totalEl.value = showLimit(s.totalLimit);
    var mode = document.querySelector('input[name="crDailyMode"][value="' + (s.dailyMode === 'order_today' ? 'order_today' : 'fixed') + '"]');
    if (mode) mode.checked = true;
    renderDailyTiers(s.dailyTiers && s.dailyTiers.length ? s.dailyTiers : [{ amount: '', count: '' }]);
    syncDailyMode();
    applyTotalRange(s.totalDayRange || 0);
  }

  function syncDailyMode() {
    var mode = document.querySelector('input[name="crDailyMode"]:checked');
    var order = !!(mode && mode.value === 'order_today');
    var fixed = document.getElementById('crDailyFixed');
    var panel = document.getElementById('crDailyOrder');
    if (fixed) fixed.hidden = order;
    if (panel) panel.hidden = !order;
  }

  function renderDailyTiers(rows) {
    var host = document.getElementById('crDailyTierList');
    if (!host) return;
    var list = rows && rows.length ? rows.slice(0, 20) : [{ amount: '', count: '' }];
    host.innerHTML = list
      .map(function (row, index) {
        var last = index === list.length - 1;
        var ops = '';
        if (list.length > 1) ops += '<button type="button" class="mkt-cr-daily-remove" data-daily-remove="' + index + '">删除</button>';
        if (last) ops += '<button type="button" class="mkt-cr-daily-add" data-daily-add="1" aria-label="新增">+</button>';
        return (
          '<div class="mkt-cr-daily-tier" data-daily-tier>' +
          '<input class="mkt-cr-daily-order__input" data-daily-amount type="number" min="0.01" step="0.01" placeholder="请输入下单金额" value="' +
          escapeHtml(row.amount === 0 || row.amount ? row.amount : '') +
          '">' +
          '<input class="mkt-cr-daily-order__input" data-daily-count type="number" min="0" step="1" placeholder="请输入每日限领次数" value="' +
          escapeHtml(showCount(row.count)) +
          '">' +
          '<span class="mkt-cr-daily-tier__ops">' +
          ops +
          '</span></div>'
        );
      })
      .join('');
  }

  function readDailyTierInputs() {
    var rows = [];
    document.querySelectorAll('[data-daily-tier]').forEach(function (row) {
      rows.push({
        amount: (row.querySelector('[data-daily-amount]') || {}).value || '',
        count: (row.querySelector('[data-daily-count]') || {}).value || ''
      });
    });
    return rows;
  }

  function readDailyOrderTiers() {
    var rows = readDailyTierInputs();
    if (rows.length > 20) return { ok: false, message: '最多配置20条' };
    var out = [];
    var seen = {};
    for (var i = 0; i < rows.length; i++) {
      var amountText = String(rows[i].amount || '').trim();
      var countText = String(rows[i].count || '').trim();
      if (!amountText && !countText) continue;
      if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(amountText) || !(Number(amountText) > 0)) {
        return { ok: false, message: '请输入下单金额' };
      }
      var count = countText === '' ? 0 : Store.clampClaimCount(countText);
      if (count == null) return { ok: false, message: '请输入大于等于 0 的整数' };
      var key = String(Math.round(Number(amountText) * 100));
      if (seen[key]) return { ok: false, message: '下单金额不可重复' };
      seen[key] = true;
      out.push({ amount: amountText, count: count });
    }
    return { ok: true, tiers: out };
  }

  function applyTotalRange(days) {
    var rangeEl = document.getElementById('crTotalRange');
    var daysEl = document.getElementById('crTotalRangeDays');
    var unitEl = document.getElementById('crTotalRangeUnit');
    if (!rangeEl) return;
    var n = Math.round(Number(days) || 0);
    var preset = { 0: true, 7: true, 30: true, 90: true, 180: true, 365: true };
    var custom = n > 0 && !preset[n];
    rangeEl.value = custom ? 'custom' : String(n);
    if (daysEl) {
      daysEl.hidden = !custom;
      daysEl.value = custom ? String(n) : '';
    }
    if (unitEl) unitEl.hidden = !custom;
  }

  function readTotalRange() {
    var rangeEl = document.getElementById('crTotalRange');
    var daysEl = document.getElementById('crTotalRangeDays');
    if (!rangeEl || rangeEl.value !== 'custom') return { ok: true, days: Number(rangeEl && rangeEl.value) || 0 };
    var days = Store.clampClaimCount(daysEl ? daysEl.value : '');
    if (days == null || days < 1 || days > 3650) return { ok: false, message: '累计天数请填写 1-3650 的整数' };
    return { ok: true, days: days };
  }

  function renderHomeStats() {
    var stats = Store.getHomeStats();
    var map = {
      crStatTodayAmount: formatAmount(stats.today.amount),
      crStatTodayUsers: String(stats.today.userCount),
      crStatTodayActs: String(stats.today.activityCount),
      crStatTotalAmount: formatAmount(stats.total.amount),
      crStatTotalUsers: String(stats.total.userCount),
      crStatTotalActs: String(stats.total.activityCount)
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = map[id];
    });
  }

  function renderActivityCards() {
    var grid = document.getElementById('crActivityGrid');
    if (!grid) return;
    var list = Store.getGrantActivities();
    grid.innerHTML = list
      .map(function (act) {
        var manual = act.type === 'manual';
        var icon = manual
          ? '<path d="M16 11a3 3 0 10-2.8-4H9.8A3 3 0 107 11c-2.2.5-4 2.4-4 4.7V18h6.2M13 18v-2.2c0-1.6.8-3 2-3.9M17 13v6M14 16h6"/>'
          : '<path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 5v5.4l3.3 2-.8 1.2L11 13V7h2z"/>';
        return (
          '<article class="mkt-points-card" data-nav="' +
          escapeHtml(act.href || '') +
          '">' +
          '<div class="mkt-points-card__icon mkt-points-card__icon--earn' +
          (manual ? ' mkt-points-card__icon--manual' : '') +
          '">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true">' +
          icon +
          '</svg>' +
          '</div>' +
          '<div class="mkt-points-card__body">' +
          '<h3 class="mkt-points-card__name">' +
          escapeHtml(act.name) +
          '</h3>' +
          '<p class="mkt-points-card__desc">' +
          escapeHtml(act.desc || '') +
          '</p>' +
          '</div></article>'
        );
      })
      .join('');

    grid.querySelectorAll('.mkt-points-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var nav = card.getAttribute('data-nav');
        if (nav) window.location.href = wp.page(nav);
      });
    });
  }

  function syncSceneOptions() {
    var actEl = document.getElementById('qCrActivityType');
    var sceneEl = document.getElementById('qCrScene');
    if (!sceneEl) return;
    var act = actEl ? actEl.value : '';
    var prev = sceneEl.value;
    var scenes = Store.scenesForActivity(act);
    var html = '<option value="">全部</option>';
    scenes.forEach(function (s) {
      html +=
        '<option value="' +
        escapeHtml(s) +
        '">' +
        escapeHtml(Store.sceneLabel(s)) +
        '</option>';
    });
    sceneEl.innerHTML = html;
    if (prev && scenes.indexOf(prev) >= 0) sceneEl.value = prev;
  }

  function readFilter() {
    return {
      user: (document.getElementById('qCrUser') || {}).value || '',
      activityType: (document.getElementById('qCrActivityType') || {}).value || '',
      activityId: (document.getElementById('qCrActivityId') || {}).value || '',
      scene: (document.getElementById('qCrScene') || {}).value || '',
      status: (document.getElementById('qCrStatus') || {}).value || '',
      port: (document.getElementById('qCrPort') || {}).value || '',
      outBillNo: (document.getElementById('qCrOutBillNo') || {}).value || '',
      transferBillNo: (document.getElementById('qCrTransferBillNo') || {}).value || '',
      timeStart: (document.getElementById('qCrTimeStart') || {}).value || '',
      timeEnd: (document.getElementById('qCrTimeEnd') || {}).value || '',
      amountMin: (document.getElementById('qCrAmountMin') || {}).value || '',
      amountMax: (document.getElementById('qCrAmountMax') || {}).value || ''
    };
  }

  function renderFilterStats(rows) {
    var stats = Store.calcStats(rows);
    var a = document.getElementById('crFilterStatAmount');
    var u = document.getElementById('crFilterStatUsers');
    var c = document.getElementById('crFilterStatActs');
    if (a) a.textContent = formatAmount(stats.amount);
    if (u) u.textContent = String(stats.userCount);
    if (c) c.textContent = String(stats.activityCount);
  }

  function renderDetailTable() {
    var tbody = document.getElementById('crTableBody');
    if (!tbody) return;
    var rows = Store.filterList(readFilter());
    renderFilterStats(rows);
    if (!rows.length) {
      tbody.innerHTML =
        '<tr><td colspan="11" style="text-align:center;color:#999;padding:24px;">暂无符合条件的红包记录</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map(function (item) {
        var statusHtml =
          '<div class="mkt-cr-status-cell">' +
          '<span class="' +
          statusClass(item.status) +
          '">' +
          escapeHtml(Store.statusLabel(item.status)) +
          '</span>';
        if (item.status === 'failed' && item.failReason) {
          statusHtml +=
            '<span class="mkt-cr-status-cell__reason">失败原因：' +
            escapeHtml(item.failReason) +
            '</span>';
        }
        statusHtml += '</div>';

        var opHtml = '—';
        if (item.status === 'pending') {
          opHtml =
            '<button type="button" class="mkt-cr-op" data-revoke="' +
            escapeHtml(item.id) +
            '">撤销发放</button>';
        } else if (item.status === 'failed') {
          opHtml =
            '<button type="button" class="mkt-cr-op" data-redispatch="' +
            escapeHtml(item.id) +
            '">重新发放</button>';
        }

        return (
          '<tr data-id="' +
          escapeHtml(item.id) +
          '">' +
          '<td><div class="mkt-cr-billno" title="' +
          escapeHtml(item.outBillNo || '') +
          '">' +
          escapeHtml(item.outBillNo || '—') +
          '</div></td>' +
          '<td>' +
          escapeHtml(item.grantedAt || '—') +
          '</td>' +
          '<td><div class="mkt-cr-user">' +
          avatarHtml(item) +
          '<div class="mkt-cr-user__meta">' +
          '<div class="mkt-cr-user__name">' +
          escapeHtml(item.userName) +
          '</div>' +
          '<div class="mkt-cr-user__id">ID：' +
          escapeHtml(item.userId) +
          '</div>' +
          '<div class="mkt-cr-user__id">OpenID：' +
          escapeHtml(item.openId || '—') +
          '</div>' +
          '</div></div></td>' +
          '<td>' +
          escapeHtml(formatAmount(item.amount)) +
          ' 元</td>' +
          '<td><div class="mkt-cr-activity__name">' +
          escapeHtml(Store.packetTitle ? Store.packetTitle(item) : item.activityName || '—') +
          '</div><div class="mkt-cr-activity__type">' +
          escapeHtml(Store.activityTypeLabel(item.activityType)) +
          '</div><div class="mkt-cr-activity__id">活动ID：' +
          escapeHtml(item.activityId || '—') +
          '</div></td>' +
          '<td>' +
          escapeHtml(Store.sceneLabel(item.scene)) +
          '</td>' +
          '<td>' +
          escapeHtml(Store.claimPortText(item)) +
          '</td>' +
          '<td>' +
          statusHtml +
          '</td>' +
          '<td>' +
          escapeHtml(item.claimAt || '—') +
          '</td>' +
          '<td><div class="mkt-cr-billno" title="' +
          escapeHtml(item.transferBillNo || '') +
          '">' +
          escapeHtml(item.transferBillNo || '—') +
          '</div></td>' +
          '<td>' +
          opHtml +
          '</td>' +
          '</tr>'
        );
      })
      .join('');
  }

  function syncDatetimeClear(wrapId, inputId) {
    var wrap = document.getElementById(wrapId);
    var input = document.getElementById(inputId);
    if (!wrap || !input) return;
    wrap.classList.toggle('has-value', !!input.value);
  }

  function bindDatetimeClears() {
    [
      ['qCrTimeStartWrap', 'qCrTimeStart'],
      ['qCrTimeEndWrap', 'qCrTimeEnd']
    ].forEach(function (pair) {
      var wrapId = pair[0];
      var inputId = pair[1];
      var input = document.getElementById(inputId);
      if (input) {
        input.addEventListener('input', function () {
          syncDatetimeClear(wrapId, inputId);
        });
        input.addEventListener('change', function () {
          syncDatetimeClear(wrapId, inputId);
        });
      }
      syncDatetimeClear(wrapId, inputId);
    });

    document.querySelectorAll('#crFilterForm .mkt-rg-datetime-clear').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-clear-for');
        var input = id && document.getElementById(id);
        if (!input) return;
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
      });
    });
  }

  function bindClearBtns() {
    document.querySelectorAll('#crFilterForm .input-wrapper .clear-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var input = btn.parentElement && btn.parentElement.querySelector('input');
        if (input) {
          input.value = '';
          input.focus();
        }
      });
    });
  }

  function switchTab(key) {
    var root = document.getElementById('cashRedpackRoot');
    if (!root) return;
    var tabs = root.querySelectorAll('.mkt-points-tabs__item');
    tabs.forEach(function (t) {
      var active = t.getAttribute('data-tab') === key;
      t.classList.toggle('mkt-points-tabs__item--active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    var home = document.getElementById('crHomeWrap');
    var detail = document.getElementById('crDetailWrap');
    if (home) home.hidden = key !== 'home';
    if (detail) detail.hidden = key !== 'detail';
    if (key === 'detail') renderDetailTable();
    if (key === 'home') renderHomeStats();
  }

  function bindHomeEvents() {
    var switchBtn = document.getElementById('crSystemSwitch');
    if (switchBtn) {
      switchBtn.addEventListener('click', function () {
        var next = !switchBtn.classList.contains('mkt-points-switch--on');
        Store.saveSettings({ enabled: next });
        setSystemOn(next);
        toast(next ? '现金红包已开启' : '现金红包已关闭', 'success');
      });
    }

    document.querySelectorAll('input[name="crDailyMode"]').forEach(function (radio) {
      radio.addEventListener('change', syncDailyMode);
    });
    var orderPanel = document.getElementById('crDailyOrder');
    if (orderPanel) {
      orderPanel.addEventListener('click', function (e) {
        var add = e.target.closest('[data-daily-add]');
        var remove = e.target.closest('[data-daily-remove]');
        if (!add && !remove) return;
        var rows = readDailyTierInputs();
        if (add) {
          if (rows.length >= 20) {
            toast('最多配置20条', 'warning');
            return;
          }
          rows.push({ amount: '', count: '' });
        } else {
          rows.splice(Number(remove.getAttribute('data-daily-remove')), 1);
          if (!rows.length) rows.push({ amount: '', count: '' });
        }
        renderDailyTiers(rows);
      });
    }

    var rangeEl = document.getElementById('crTotalRange');
    if (rangeEl) {
      rangeEl.addEventListener('change', function () {
        var custom = rangeEl.value === 'custom';
        var daysEl = document.getElementById('crTotalRangeDays');
        var unitEl = document.getElementById('crTotalRangeUnit');
        if (daysEl) daysEl.hidden = !custom;
        if (unitEl) unitEl.hidden = !custom;
      });
    }

    var hoursEl = document.getElementById('crExpireHours');
    var saveBtn = document.getElementById('crExpireSaveBtn');
    if (hoursEl && saveBtn) {
      saveBtn.addEventListener('click', function () {
        var switchBtn = document.getElementById('crSystemSwitch');
        var systemOn = !!(switchBtn && switchBtn.classList.contains('mkt-points-switch--on'));
        if (!configEditing) {
          if (!systemOn) {
            toast('请先开启现金红包', 'warning');
            return;
          }
          configEditing = true;
          setSystemOn(true);
          return;
        }
        var claimLimit = document.getElementById('crClaimLimit');
        if (!systemOn || (hoursEl && hoursEl.disabled) || (claimLimit && claimLimit.disabled)) {
          toast('请先开启现金红包', 'warning');
          return;
        }
        var liveEl = document.getElementById('crLiveLimit');
        var dailyEl = document.getElementById('crDailyLimit');
        var totalEl = document.getElementById('crTotalLimit');
        var live = Store.clampClaimCount(liveEl ? liveEl.value : 0);
        var daily = Store.clampClaimCount(dailyEl ? dailyEl.value : 0);
        var total = Store.clampClaimCount(totalEl ? totalEl.value : 0);
        if (live == null || daily == null || total == null) {
          toast('请输入大于等于 0 的整数', 'warning');
          return;
        }
        var modeEl = document.querySelector('input[name="crDailyMode"]:checked');
        var orderMode = !!(modeEl && modeEl.value === 'order_today');
        var dailyTiers = readDailyOrderTiers();
        if (orderMode && !dailyTiers.ok) {
          toast(dailyTiers.message, 'warning');
          return;
        }
        var range = readTotalRange();
        if (!range.ok) {
          toast(range.message, 'warning');
          return;
        }
        var savedTiers = Store.getSettings().dailyTiers || [];
        var nextTiers = dailyTiers.ok ? dailyTiers.tiers : savedTiers;
        var v = Store.clampExpireHours(hoursEl.value);
        hoursEl.value = String(v);
        Store.saveSettings({
          expireHours: v,
          liveLimit: live,
          dailyMode: orderMode ? 'order_today' : 'fixed',
          dailyLimit: daily,
          dailyTiers: nextTiers,
          totalLimit: total,
          totalDayRange: range.days
        });
        configEditing = false;
        applySettingsToUi();
        toast('已保存', 'success');
      });
    }
  }

  function bindDetailEvents() {
    var queryBtn = document.getElementById('crFilterQuery');
    var resetBtn = document.getElementById('crFilterReset');
    var actEl = document.getElementById('qCrActivityType');

    if (actEl) {
      actEl.addEventListener('change', function () {
        syncSceneOptions();
      });
    }

    if (queryBtn) queryBtn.addEventListener('click', renderDetailTable);
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        [
          'qCrUser',
          'qCrActivityType',
          'qCrActivityId',
          'qCrScene',
          'qCrStatus',
          'qCrPort',
          'qCrOutBillNo',
          'qCrTransferBillNo',
          'qCrTimeStart',
          'qCrTimeEnd',
          'qCrAmountMin',
          'qCrAmountMax'
        ].forEach(function (id) {
          var el = document.getElementById(id);
          if (el) el.value = '';
        });
        syncSceneOptions();
        syncDatetimeClear('qCrTimeStartWrap', 'qCrTimeStart');
        syncDatetimeClear('qCrTimeEndWrap', 'qCrTimeEnd');
        renderDetailTable();
      });
    }

    var tbody = document.getElementById('crTableBody');
    if (tbody) {
      tbody.addEventListener('click', function (e) {
        var revokeBtn = e.target && e.target.closest ? e.target.closest('[data-revoke]') : null;
        if (revokeBtn) {
          var revokeId = revokeBtn.getAttribute('data-revoke');
          if (!revokeId) return;
          if (!window.confirm('确认撤销该笔红包发放？撤销后用户将无法领取。')) return;
          var revoked = Store.revokeRecord(revokeId);
          if (revoked) {
            toast('已撤销发放', 'success');
            renderDetailTable();
            renderHomeStats();
          }
          return;
        }

        var retryBtn = e.target && e.target.closest ? e.target.closest('[data-redispatch]') : null;
        if (!retryBtn) return;
        var retryId = retryBtn.getAttribute('data-redispatch');
        if (!retryId) return;
        if (!window.confirm('确认重新发放该笔红包？将使用新的商户单号再次调用微信转账。')) return;
        /* 演示：无余额不足开关时默认成功；可在 localStorage 写 mdm_cr_demo_balance_fail=1 模拟失败 */
        var demoFail = false;
        try {
          demoFail = localStorage.getItem('mdm_cr_demo_balance_fail') === '1';
        } catch (err) {}
        var result = Store.redispatchRecord(retryId, { insufficient: demoFail });
        if (result && result.ok) {
          toast('重新发放成功，状态已变为待领取', 'success');
          renderDetailTable();
          renderHomeStats();
          return;
        }
        toast((result && result.message) || '重新发放失败', 'warning');
        renderDetailTable();
        renderHomeStats();
      });
    }
  }

  function bindTabs() {
    var root = document.getElementById('cashRedpackRoot');
    if (!root) return;
    root.querySelectorAll('.mkt-points-tabs__item').forEach(function (tab) {
      tab.addEventListener('click', function () {
        switchTab(tab.getAttribute('data-tab'));
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    applySettingsToUi();
    renderHomeStats();
    renderActivityCards();
    syncSceneOptions();
    bindClearBtns();
    bindDatetimeClears();
    bindHomeEvents();
    bindDetailEvents();
    bindTabs();

    var params = new URLSearchParams(window.location.search || '');
    var activityId = params.get('activityId');
    if (activityId) {
      var actInput = document.getElementById('qCrActivityId');
      if (actInput) actInput.value = activityId;
      switchTab('detail');
    }
    if (params.get('tab') === 'detail') switchTab('detail');
    var granted = params.get('granted');
    if (granted) {
      switchTab('detail');
      toast('已向 ' + granted + ' 位用户发放红包', 'success');
      params.delete('granted');
      var qs = params.toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
    }
  });
})();
