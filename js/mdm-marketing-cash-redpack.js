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
    if (!switchBtn) return;
    switchBtn.classList.toggle('mkt-points-switch--on', on);
    switchBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (statusEl) statusEl.textContent = on ? '已开启' : '已关闭';
    if (descEl) descEl.textContent = on ? ON_DESC : OFF_DESC;
    if (hoursEl) hoursEl.disabled = !on;
    var saveBtn = document.getElementById('crExpireSaveBtn');
    if (saveBtn) saveBtn.disabled = !on;
  }

  function applySettingsToUi() {
    var s = Store.getSettings();
    setSystemOn(!!s.enabled);
    var hoursEl = document.getElementById('crExpireHours');
    if (hoursEl) hoursEl.value = String(s.expireHours);
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
        return (
          '<article class="mkt-points-card" data-nav="' +
          escapeHtml(act.href || '') +
          '">' +
          '<div class="mkt-points-card__icon mkt-points-card__icon--earn">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 5v5.4l3.3 2-.8 1.2L11 13V7h2z"/></svg>' +
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
          '</div></div></td>' +
          '<td>' +
          escapeHtml(formatAmount(item.amount)) +
          ' 元</td>' +
          '<td><div class="mkt-cr-activity__type">' +
          escapeHtml(Store.activityTypeLabel(item.activityType)) +
          '</div><div class="mkt-cr-activity__id">活动ID：' +
          escapeHtml(item.activityId || '—') +
          '</div></td>' +
          '<td>' +
          escapeHtml(Store.sceneLabel(item.scene)) +
          '</td>' +
          '<td>' +
          escapeHtml(Store.portLabel(item.port)) +
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

    var hoursEl = document.getElementById('crExpireHours');
    var saveBtn = document.getElementById('crExpireSaveBtn');
    if (hoursEl && saveBtn) {
      saveBtn.addEventListener('click', function () {
        if (hoursEl.disabled) {
          toast('请先开启现金红包', 'warning');
          return;
        }
        var v = Store.clampExpireHours(hoursEl.value);
        hoursEl.value = String(v);
        Store.saveSettings({ expireHours: v });
        toast('失效时间已保存', 'success');
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
    if (params.get('tab') === 'detail') switchTab('detail');
  });
})();
