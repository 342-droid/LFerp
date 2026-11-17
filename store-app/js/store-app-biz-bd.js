/**
 * BD · 经营参谋多店总览 / 经营提醒
 */
(function () {
  function $(id) {
    return document.getElementById(id);
  }

  function D() {
    return window.StoreAppBizReportData;
  }

  function groupThousands(intPart) {
    return String(intPart).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function fmtInt(n) {
    return groupThousands(String(Math.round(Number(n) || 0)));
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function pageParams() {
    try {
      return new URLSearchParams(location.search || '');
    } catch (e) {
      return new URLSearchParams();
    }
  }

  function qsKeep(extra) {
    var p = pageParams();
    var out = {
      from: p.get('from') || 'bd-app',
      role: p.get('role') || 'bd'
    };
    Object.keys(extra || {}).forEach(function (k) {
      if (extra[k] != null && extra[k] !== '') out[k] = extra[k];
    });
    return Object.keys(out)
      .map(function (k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(out[k]);
      })
      .join('&');
  }

  function workbenchHref() {
    if (window.wmsPath && typeof window.wmsPath.page === 'function') {
      return window.wmsPath.page('MDM/mdm_bd_workbench.html') + '#home';
    }
    return '../../MDM/mdm_bd_workbench.html#home';
  }

  function tagClass(store) {
    if (!store.hasAlert) return '';
    var danger = (store.alerts || []).some(function (a) {
      return a.level === 'danger';
    });
    return danger ? ' is-danger' : ' is-warn';
  }

  function tagText(store) {
    return store.hasAlert ? '有预警' : '正常';
  }

  function alertSummary(store) {
    if (store.idleDays) return '连续 ' + store.idleDays + ' 天无成交';
    if (!store.alerts || !store.alerts.length) return '';
    return store.alerts
      .map(function (a) {
        if (a.idleDays) return '连续 ' + a.idleDays + ' 天无成交';
        return a.title;
      })
      .join(' · ');
  }

  var state = { filter: 'all' };

  function renderHome() {
    if (!$('bdStoreList')) return;
    var api = D();
    if (!api || !api.buildBdPortfolio) return;

    var back = $('bdBack');
    if (back) back.setAttribute('href', workbenchHref());

    var data = api.buildBdPortfolio(state.filter);
    if ($('bdAsOf')) $('bdAsOf').textContent = '关联门店经营 · 数据截至 ' + (data.asOf || '—');
    if ($('bdStoreCnt')) $('bdStoreCnt').textContent = String(data.storeCount || 0);
    if ($('bdAlertStoreCnt')) $('bdAlertStoreCnt').textContent = String(data.alertStoreCount || 0);
    if ($('bdAlertCnt')) $('bdAlertCnt').textContent = String(data.alertCount || 0);
    var entry = $('bdAlertEntry');
    var hint = $('bdAlertLinkHint');
    if (hint) {
      if (data.alertCount) {
        var preview = (data.alerts || [])
          .slice(0, 2)
          .map(function (a) {
            return a.storeName + '·' + a.title;
          })
          .join('；');
        hint.textContent =
          data.alertCount +
          ' 条提醒，部分门店需你关注' +
          (preview ? ' · ' + preview : '') +
          (data.alertCount > 2 ? ' 等' : '');
      } else {
        hint.textContent = '暂无门店提醒';
      }
    }
    if (entry) entry.classList.toggle('is-warn', !!data.alertCount);

    var host = $('bdStoreList');
    if (!data.stores.length) {
      host.innerHTML =
        '<p class="sa-bd-sub" style="margin:16px 12px">当前筛选下暂无门店</p>';
      return;
    }

    host.innerHTML = data.stores
      .map(function (s) {
        var href = 'biz-center.html?' + qsKeep({ storeId: s.id });
        var tip = alertSummary(s);
        return (
          '<a class="sa-bd-card" href="' +
          href +
          '">' +
          '<div class="sa-bd-card__hd">' +
          '<div class="sa-bd-card__name">' +
          esc(s.name) +
          '</div>' +
          '<span class="sa-bd-card__tag' +
          tagClass(s) +
          '">' +
          tagText(s) +
          '</span>' +
          '</div>' +
          '<div class="sa-bd-card__metrics">' +
          '<div><div class="sa-bd-card__m-t">近7天营业额</div><div class="sa-bd-card__m-v">' +
          fmtInt(s.paid7d) +
          '</div></div>' +
          '<div><div class="sa-bd-card__m-t">预警</div><div class="sa-bd-card__m-v">' +
          (s.alertCount ? String(s.alertCount) + ' 条' : '无') +
          '</div></div>' +
          '<div><div class="sa-bd-card__m-t">RBT</div><div class="sa-bd-card__m-v">' +
          esc(s.rbtStatus || '—') +
          '</div></div>' +
          '</div>' +
          (tip
            ? '<div class="sa-bd-card__alert">' + esc(tip) + '</div>'
            : '') +
          '<span class="sa-bd-card__arrow" aria-hidden="true">›</span>' +
          '</a>'
        );
      })
      .join('');
  }

  function wireHomeFilter() {
    var bar = $('bdFilter');
    if (!bar) return;
    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-filter]');
      if (!btn) return;
      state.filter = btn.getAttribute('data-filter') || 'all';
      bar.querySelectorAll('.sa-rpt-chip').forEach(function (el) {
        el.classList.toggle('is-active', el === btn);
      });
      renderHome();
    });
  }

  function levelClass(level) {
    if (level === 'danger') return ' is-danger';
    if (level === 'warn') return ' is-warn';
    return '';
  }

  function renderAlerts() {
    if (!$('bdAlertList')) return;
    var api = D();
    if (!api || !api.buildBdPortfolio) return;

    var back = $('bdAlertBack');
    if (back) back.setAttribute('href', 'biz-bd-home.html?' + qsKeep());

    var data = api.buildBdPortfolio('all');
    if ($('bdAlertAsOf')) {
      $('bdAlertAsOf').textContent =
        '共 ' + data.alertCount + ' 条提醒 · 数据截至 ' + (data.asOf || '—');
    }

    var host = $('bdAlertList');
    if (!data.alerts.length) {
      host.innerHTML = '<p class="sa-bd-sub" style="margin:16px 12px">暂无经营提醒</p>';
      return;
    }

    host.innerHTML = data.alerts
      .map(function (a) {
        var href = 'biz-center.html?' + qsKeep({ storeId: a.storeId });
        return (
          '<a class="sa-bd-card" href="' +
          href +
          '">' +
          '<div class="sa-bd-card__hd">' +
          '<div class="sa-bd-card__name">' +
          esc(a.storeName) +
          '</div>' +
          '<span class="sa-bd-card__tag' +
          levelClass(a.level) +
          '">' +
          esc(a.title) +
          '</span>' +
          '</div>' +
          '<div class="sa-bd-card__alert" style="margin-top:0;padding-top:0;border:0">' +
          esc(a.tip) +
          '</div>' +
          '<span class="sa-bd-card__arrow" aria-hidden="true">›</span>' +
          '</a>'
        );
      })
      .join('');
  }

  function boot() {
    if ($('bdStoreList')) {
      wireHomeFilter();
      renderHome();
    }
    if ($('bdAlertList')) renderAlerts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
