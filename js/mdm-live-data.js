/**
 * 直播管理 — 直播数据
 */
(function () {
  'use strict';

  var Demo = window.MdmLiveDemo;
  if (!Demo) return;

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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatInt(n) {
    return (Number(n) || 0).toLocaleString('zh-CN');
  }

  var METRIC_DEFS = [
    { key: 'duration', label: '直播时长' },
    { key: 'viewers', label: '观看人数', format: 'int' },
    { key: 'commentUsers', label: '评论人数', format: 'int' },
    { key: 'interactRate', label: '互动率' },
    { key: 'danmuCount', label: '弹幕数量', format: 'int' },
    { key: 'danmuUsers', label: '弹幕人数', format: 'int' },
    { key: 'avgStay', label: '平均停留时长' },
    { key: 'goodsClickUsers', label: '商品点击人数', format: 'int' },
    { key: 'totalViewers', label: '累计观看人数', format: 'int' },
    { key: 'salesQty', label: '销量', format: 'int' },
    { key: 'dealUsers', label: '成交人数', format: 'int' },
    { key: 'dealConvertRate', label: '成交转化率' },
    { key: 'dealAmount', label: '成交金额', format: 'amount' },
    { key: 'orderGmv', label: '下单GMV', format: 'amount' }
  ];

  function fillSessionSelect() {
    var sel = document.getElementById('liveDataSession');
    if (!sel) return;
    sel.innerHTML =
      '<option value="">请选择直播场次</option>' +
      Demo.sessions
        .map(function (s) {
          return '<option value="' + escapeHtml(s.id) + '">' + escapeHtml(s.name) + '</option>';
        })
        .join('');
  }

  function metricValue(metrics, def) {
    var raw = metrics[def.key];
    if (def.format === 'amount') return '¥' + formatAmount(raw);
    if (def.format === 'int') return formatInt(raw);
    return String(raw == null ? '—' : raw);
  }

  function render() {
    var sel = document.getElementById('liveDataSession');
    var empty = document.getElementById('liveDataEmpty');
    var panel = document.getElementById('liveDataPanel');
    var metricsEl = document.getElementById('liveDataMetrics');
    var tbody = document.getElementById('liveDataProductBody');
    if (!sel || !empty || !panel) return;

    var sessionId = sel.value;
    if (!sessionId) {
      empty.hidden = false;
      panel.hidden = true;
      return;
    }

    empty.hidden = true;
    panel.hidden = false;

    var pack = Demo.dataMetrics[sessionId] || { metrics: {}, products: [] };
    var metrics = pack.metrics || {};

    if (metricsEl) {
      metricsEl.innerHTML = METRIC_DEFS.map(function (def) {
        return (
          '<div class="lf-live-metric-card">' +
          '<div class="lf-live-metric-card__label">' +
          escapeHtml(def.label) +
          '</div>' +
          '<div class="lf-live-metric-card__value">' +
          escapeHtml(metricValue(metrics, def)) +
          '</div></div>'
        );
      }).join('');
    }

    if (tbody) {
      var products = pack.products || [];
      if (!products.length) {
        tbody.innerHTML =
          '<tr><td colspan="7" style="text-align:center;color:#999;padding:24px;">暂无商品转化数据</td></tr>';
      } else {
        tbody.innerHTML = products
          .map(function (p) {
            return (
              '<tr>' +
              '<td>' +
              escapeHtml(String(p.rank)) +
              '</td>' +
              '<td>' +
              escapeHtml(p.name) +
              '</td>' +
              '<td>' +
              escapeHtml(p.spec || '—') +
              '</td>' +
              '<td>' +
              escapeHtml(p.clickRate || '—') +
              '</td>' +
              '<td>' +
              escapeHtml(formatInt(p.orderCount)) +
              '</td>' +
              '<td>¥' +
              escapeHtml(formatAmount(p.dealAmount)) +
              '</td>' +
              '<td>¥' +
              escapeHtml(formatAmount(p.paidAmount)) +
              '</td></tr>'
            );
          })
          .join('');
      }
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    fillSessionSelect();
    var sel = document.getElementById('liveDataSession');
    if (sel) sel.addEventListener('change', render);
    render();
  });
})();
