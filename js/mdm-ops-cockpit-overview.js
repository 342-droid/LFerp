/**
 * 全景总览页
 */
(function () {
  var shared = window.MdmOpsCockpitShared;
  var dataApi = window.MdmOpsCockpitData;
  if (!shared || !dataApi) return;

  var state = {
    range: '30d',
    org: 'all',
    bu: 'all',
    line: 'all',
    channel: 'all',
    store: 'all',
    region: 'all',
    trendMetric: 'gmv'
  };

  var TREND_OPTS = [
    { id: 'gmv', label: '支付 GMV' },
    { id: 'net', label: '净成交额' },
    { id: 'orders', label: '订单数' },
    { id: 'payers', label: '支付人数' },
    { id: 'finance', label: '财务确认收入' }
  ];

  function $(sel) {
    return document.querySelector(sel);
  }

  function renderTrend(pack) {
    var chips = $('[data-ck-trend-chips]');
    if (chips) {
      chips.innerHTML = TREND_OPTS.map(function (opt) {
        return (
          '<button type="button" class="ops-ck-chip' +
          (state.trendMetric === opt.id ? ' is-active' : '') +
          '" data-trend="' +
          opt.id +
          '">' +
          opt.label +
          '</button>'
        );
      }).join('');
    }
    var host = $('[data-ck-trend]');
    if (!host) return;
    var list = (pack.trends && pack.trends[state.trendMetric]) || [];
    if (!list.length) {
      host.innerHTML = '<div class="ops-ck-empty">暂无趋势</div>';
      return;
    }
    var max = Math.max.apply(null, list.concat([1]));
    var fmt = state.trendMetric === 'orders' || state.trendMetric === 'payers' ? 'int' : 'money';
    host.innerHTML = list
      .map(function (v, i) {
        var h = Math.max(4, Math.round((Number(v) / max) * 150));
        return (
          '<div class="ops-ck-trend__col" title="' +
          shared.esc(shared.format(v, fmt)) +
          '"><div class="ops-ck-trend__bar" style="height:' +
          h +
          'px"></div><span class="ops-ck-trend__lbl">D' +
          (i + 1) +
          '</span></div>'
        );
      })
      .join('');
  }

  function renderLineMix(rows) {
    var host = $('[data-ck-line-mix]');
    if (!host) return;
    var known = rows.filter(function (r) {
      return !shared.isPending(r.value);
    });
    var total = known.reduce(function (a, r) {
      return a + Number(r.value || 0);
    }, 0);
    host.innerHTML = rows
      .map(function (row) {
        var pending = shared.isPending(row.value);
        var pct = !pending && total > 0 ? Math.round((row.value / total) * 1000) / 10 : 0;
        return (
          '<div class="ops-ck-bars__row' +
          (pending ? ' is-pending' : '') +
          '">' +
          '<div class="ops-ck-bars__name">' +
          (row.href
            ? '<a href="' + shared.pageHref(row.href) + '">' + shared.esc(row.name) + '</a>'
            : shared.esc(row.name)) +
          '</div>' +
          '<div class="ops-ck-bars__track">' +
          (pending
            ? ''
            : '<div class="ops-ck-bars__fill" style="width:' + pct + '%"></div>') +
          '</div>' +
          '<div class="ops-ck-bars__val">' +
          shared.esc(shared.format(row.value, 'money')) +
          (pending ? '' : ' · ' + pct + '%') +
          '</div></div>'
        );
      })
      .join('');
  }

  function rankTable(title, columns, rows, moreHref) {
    return (
      '<div class="ops-ck-card ops-ck-card--soft">' +
      '<div class="ops-ck-card__head"><h3 class="ops-ck-card__title">' +
      shared.esc(title) +
      '</h3>' +
      (moreHref
        ? '<a class="ops-ck-card__action" href="' + shared.pageHref(moreHref) + '">进入专题 ›</a>'
        : '') +
      '</div><table class="ops-ck-table"><thead><tr>' +
      columns
        .map(function (c) {
          return (
            '<th class="' +
            (c.format === 'money' || c.format === 'int' ? 'is-money' : '') +
            '">' +
            shared.esc(c.label) +
            '</th>'
          );
        })
        .join('') +
      '</tr></thead><tbody>' +
      rows
        .map(function (row) {
          return (
            '<tr>' +
            columns
              .map(function (c) {
                return (
                  '<td class="' +
                  (c.format === 'money' || c.format === 'int' ? 'is-money' : '') +
                  '">' +
                  shared.esc(shared.format(row[c.key], c.format || 'text')) +
                  '</td>'
                );
              })
              .join('') +
            '</tr>'
          );
        })
        .join('') +
      '</tbody></table></div>'
    );
  }

  function render() {
    var pack = dataApi.overview(state);
    shared.renderMeta($('[data-ck-meta]'), pack.meta);
    shared.renderFilters($('[data-ck-filters]'), state, render);

    var kpiHost = $('[data-ck-kpis]');
    if (kpiHost) {
      kpiHost.innerHTML = pack.kpis.map(shared.kpiHtml).join('');
      kpiHost.querySelectorAll('[data-href]').forEach(function (el) {
        el.addEventListener('click', function () {
          location.href = shared.pageHref(el.getAttribute('data-href'));
        });
      });
    }

    renderTrend(pack);
    renderLineMix(pack.lineMix || []);

    var rankHost = $('[data-ck-ranks]');
    if (rankHost) {
      rankHost.innerHTML =
        rankTable(
          '门店排行（按支付 GMV）',
          [
            { key: 'name', label: '门店' },
            { key: 'gmv', label: 'GMV', format: 'money' },
            { key: 'orders', label: '订单', format: 'int' }
          ],
          pack.ranks.store,
          'mdm_ops_sales_store.html'
        ) +
        rankTable(
          '供应商排行（按发货 SKU／结算）',
          [
            { key: 'name', label: '供应商' },
            { key: 'shipSku', label: '发货SKU', format: 'int' },
            { key: 'settle', label: '结算', format: 'money' }
          ],
          pack.ranks.supplier,
          'mdm_ops_supply_supplier.html'
        ) +
        rankTable(
          '贸易商排行（按剩余回收）',
          [
            { key: 'name', label: '贸易商' },
            { key: 'demands', label: '需求数', format: 'int' },
            { key: 'remain', label: '剩余回收', format: 'money' }
          ],
          pack.ranks.trader,
          'mdm_ops_rbt_trader.html'
        ) +
        rankTable(
          '仓库排行（按出库 SKU）',
          [
            { key: 'name', label: '仓库' },
            { key: 'outSku', label: '出库SKU', format: 'int' },
            { key: 'stockout', label: '缺货SKU', format: 'int' }
          ],
          pack.ranks.warehouse,
          'mdm_ops_supply_warehouse.html'
        );
    }

    var alertHost = $('[data-ck-alerts]');
    if (alertHost) {
      alertHost.innerHTML = (pack.alerts || [])
        .map(function (a) {
          var lv =
            a.level === 'danger' ? 'ops-ck-alert--danger' : a.level === 'info' ? 'ops-ck-alert--info' : '';
          return (
            '<div class="ops-ck-alert ' +
            lv +
            '"><span>' +
            shared.esc(a.text) +
            '</span>' +
            (a.href
              ? '<a href="' + shared.pageHref(a.href) + '">查看</a>'
              : '') +
            '</div>'
          );
        })
        .join('');
    }

    var rbt = pack.rbtSummary;
    var rbtHost = $('[data-ck-rbt]');
    var rbtNote = $('[data-ck-rbt-note]');
    if (rbtNote) rbtNote.textContent = rbt.note || '';
    if (rbtHost) {
      rbtHost.innerHTML = (rbt.metrics || [])
        .map(function (m) {
          return (
            '<div class="ops-ck-rbt__item"><div class="ops-ck-rbt__label">' +
            shared.esc(m.label) +
            '</div><div class="ops-ck-rbt__value">' +
            shared.esc(shared.format(m.value, m.format)) +
            '</div></div>'
          );
        })
        .join('');
    }
    var rbtLink = $('[data-ck-rbt-link]');
    if (rbtLink && rbt.href) rbtLink.setAttribute('href', shared.pageHref(rbt.href));
  }

  function bind() {
    var root = $('[data-ck-overview]');
    if (!root) return;
    root.addEventListener('click', function (event) {
      var trendBtn = event.target.closest('[data-trend]');
      if (trendBtn) {
        state.trendMetric = trendBtn.getAttribute('data-trend') || 'gmv';
        render();
      }
    });
  }

  function init() {
    bind();
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
