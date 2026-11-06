/**
 * 营销活动 — 秒杀列表
 */
(function () {
  'use strict';

  var Store = window.MdmMarketingSeckillStore;
  if (!Store) return;

  var wp = window.wmsPath || {
    page: function (f) {
      return f;
    }
  };

  var page = 1;
  var pageSize = 10;
  var goodsExpanded = {};
  var logState = { activityId: '', page: 1, pageSize: 10 };

  function toast(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type || 'info');
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setHidden(el, hidden) {
    if (!el) return;
    if (hidden) el.setAttribute('hidden', '');
    else el.removeAttribute('hidden');
  }

  function readFilter() {
    return {
      id: (document.getElementById('qSkId') || {}).value || '',
      name: (document.getElementById('qSkName') || {}).value || '',
      timeStart: (document.getElementById('qSkTimeStart') || {}).value || '',
      timeEnd: (document.getElementById('qSkTimeEnd') || {}).value || '',
      productName: (document.getElementById('qSkProduct') || {}).value || '',
      productCode: (document.getElementById('qSkCode') || {}).value || '',
      status: (document.getElementById('qSkStatus') || {}).value || ''
    };
  }

  function formHref(id, mode) {
    var base = wp.page('mdm_marketing_seckill_form.html');
    var qs = [];
    if (id) qs.push('id=' + encodeURIComponent(id));
    if (mode) qs.push('mode=' + encodeURIComponent(mode));
    if (!qs.length) return base;
    return base + (base.indexOf('?') >= 0 ? '&' : '?') + qs.join('&');
  }

  function statusClass(st) {
    if (st === 'active') return 'mdm-status mdm-status--ok';
    if (st === 'upcoming') return 'mdm-status mdm-status--warn';
    if (st === 'disabled') return 'mdm-status mdm-status--muted';
    return 'mdm-status mdm-status--muted';
  }

  function syncDatetimeClear(wrapId, inputId) {
    var wrap = document.getElementById(wrapId);
    var input = document.getElementById(inputId);
    if (!wrap || !input) return;
    wrap.classList.toggle('has-value', !!input.value);
  }

  function bindDatetimeClears() {
    [
      ['qSkTimeStartWrap', 'qSkTimeStart'],
      ['qSkTimeEndWrap', 'qSkTimeEnd']
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

    document.querySelectorAll('#skFilterForm .mkt-rg-datetime-clear').forEach(function (btn) {
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

  function formatPrice(n) {
    if (n == null || n === '') return '—';
    var v = Number(n);
    if (isNaN(v)) return '—';
    return '¥' + v.toFixed(2);
  }

  function thumbHtml(item) {
    if (item && item.img) {
      return '<span class="mkt-sk-thumb"><img src="' + escapeHtml(item.img) + '" alt=""></span>';
    }
    var ch = String((item && item.name) || '?').charAt(0);
    return '<span class="mkt-sk-thumb">' + escapeHtml(ch) + '</span>';
  }

  function renderPagination(total) {
    if (typeof createPagination !== 'function') return;
    var totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
    if (page > totalPages) page = totalPages;
    createPagination({
      containerId: 'pagination-container',
      totalItems: total,
      currentPage: page,
      pageSize: pageSize,
      pageSizeOptions: [10, 20, 50],
      onPageChange: function (p) {
        page = p;
        render();
      },
      onPageSizeChange: function (s) {
        pageSize = s;
        page = 1;
        render();
      }
    });
  }

  function opsHtml(item, st) {
    var html = '';
    if (st === 'disabled') {
      html += '<a href="' + escapeHtml(formHref(item.id, 'edit')) + '" data-act="edit">编辑</a>';
    }
    html += '<a href="' + escapeHtml(formHref(item.id, 'view')) + '" data-act="view">查看</a>';
    if (st === 'disabled') {
      html += '<a href="#" data-act="enable">启用</a>';
    }
    if (st === 'upcoming' || st === 'active') {
      html += '<a href="#" data-act="disable">禁用</a>';
    }
    html += '<a href="#" data-act="log">操作日志</a>';
    return html;
  }

  function render() {
    var tbody = document.getElementById('skTableBody');
    if (!tbody) return;
    var rows = Store.filterList(readFilter());
    renderPagination(rows.length);
    var start = (page - 1) * pageSize;
    var pageRows = rows.slice(start, start + pageSize);
    if (!pageRows.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="mkt-sk-empty">暂无符合条件的秒杀活动</td></tr>';
      return;
    }
    tbody.innerHTML = pageRows
      .map(function (item) {
        var st = Store.computeStatus(item);
        var count = (item.products || []).length;
        return (
          '<tr data-id="' +
          escapeHtml(item.id) +
          '">' +
          '<td>' +
          escapeHtml(item.id || '—') +
          '</td>' +
          '<td>' +
          escapeHtml(item.name) +
          '</td>' +
          '<td>' +
          escapeHtml(Store.formatRange(item)) +
          '</td>' +
          '<td>' +
          (count
            ? '<button type="button" class="mkt-sk-goods-link" data-act="goods">' +
              count +
              '</button>'
            : '0') +
          '</td>' +
          '<td><span class="' +
          statusClass(st) +
          '">' +
          escapeHtml(Store.statusLabel(st)) +
          '</span></td>' +
          '<td class="action-links">' +
          opsHtml(item, st) +
          '</td></tr>'
        );
      })
      .join('');
  }

  function priceRange(product) {
    var skus = Store.skusOf(product);
    var prices = skus
      .map(function (s) {
        return Number(s.salePrice != null ? s.salePrice : s.price);
      })
      .filter(function (n) {
        return !isNaN(n);
      });
    if (!prices.length) return '—';
    var min = Math.min.apply(null, prices);
    var max = Math.max.apply(null, prices);
    if (min === max) return formatPrice(min);
    return formatPrice(min) + ' ~ ' + formatPrice(max);
  }

  function stockSum(product) {
    return Store.skusOf(product).reduce(function (sum, s) {
      return sum + Store.activityStockOf(s);
    }, 0);
  }

  function renderGoodsModal(item) {
    var tbody = document.getElementById('skGoodsTableBody');
    var title = document.getElementById('skGoodsTitle');
    if (title) title.textContent = '活动商品 · ' + (item.name || item.id);
    if (!tbody) return;
    var products = item.products || [];
    if (!products.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="mkt-sk-empty">暂无活动商品</td></tr>';
      return;
    }
    tbody.innerHTML = products
      .map(function (p) {
        var skus = Store.skusOf(p);
        var expanded = !!goodsExpanded[p.id];
        var countBtn =
          '<button type="button" class="mkt-sk-sku-count" data-act="expand-sku" data-pid="' +
          escapeHtml(p.id) +
          '">' +
          skus.length +
          '</button>';
        var parent =
          '<tr data-pid="' +
          escapeHtml(p.id) +
          '">' +
          '<td>' +
          escapeHtml(p.sku || '—') +
          '</td>' +
          '<td>' +
          thumbHtml(p) +
          '</td>' +
          '<td>' +
          escapeHtml(p.name || '—') +
          '</td>' +
          '<td>' +
          escapeHtml(p.category || '—') +
          '</td>' +
          '<td>' +
          countBtn +
          '</td>' +
          '<td>' +
          escapeHtml(priceRange(p)) +
          '</td>' +
          '<td>' +
          stockSum(p) +
          '</td></tr>';
        if (!expanded) return parent;
        var children = skus
          .map(function (sku) {
            return (
              '<tr class="mkt-sk-sku-child">' +
              '<td>' +
              escapeHtml(sku.id || '—') +
              '</td>' +
              '<td></td>' +
              '<td colspan="2">' +
              escapeHtml(sku.displayName || sku.specName || '默认规格') +
              '</td>' +
              '<td>SKU</td>' +
              '<td>' +
              formatPrice(sku.salePrice != null ? sku.salePrice : sku.price) +
              '</td>' +
              '<td>' +
              Store.activityStockOf(sku) +
              '</td></tr>'
            );
          })
          .join('');
        return parent + children;
      })
      .join('');
  }

  function openGoods(item) {
    goodsExpanded = {};
    renderGoodsModal(item);
    var backdrop = document.getElementById('skGoodsBackdrop');
    backdrop.setAttribute('data-id', item.id);
    setHidden(backdrop, false);
  }

  function closeGoods() {
    setHidden(document.getElementById('skGoodsBackdrop'), true);
  }

  var FIELD_LABEL = {
    name: '活动名称',
    status: '状态',
    products: '活动商品'
  };

  function renderLogs() {
    var tbody = document.getElementById('tplLogTableBody');
    if (!tbody) return;
    var data = Store.listLogs(logState.activityId, logState.page, logState.pageSize);
    if (!data.list.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="mkt-sk-empty">暂无数据</td></tr>';
    } else {
      tbody.innerHTML = data.list
        .map(function (row) {
          return (
            '<tr>' +
            '<td>' +
            escapeHtml(row.timestamp) +
            '</td>' +
            '<td>' +
            escapeHtml(Store.ACTION_LABEL[row.action] || row.action || '—') +
            '</td>' +
            '<td>' +
            escapeHtml(row.operator || '—') +
            '</td>' +
            '<td><span class="mkt-tpl-log-method">' +
            escapeHtml([row.httpMethod, row.requestUri].filter(Boolean).join(' ') || '—') +
            '</span></td>' +
            '<td style="text-align:center"><span class="mkt-tpl-tag ' +
            (row.success ? 'mkt-tpl-tag--success' : 'mkt-tpl-tag--warning') +
            '">' +
            (row.success ? '成功' : '失败') +
            '</span></td>' +
            '<td><button type="button" class="mkt-tpl-name" data-act="log-detail" data-id="' +
            escapeHtml(row.id) +
            '">查看详情</button></td></tr>'
          );
        })
        .join('');
    }
    if (typeof createPagination === 'function') {
      createPagination({
        containerId: 'tplLogPagination',
        totalItems: data.total,
        currentPage: logState.page,
        pageSize: logState.pageSize,
        pageSizeOptions: [10, 20, 50],
        onPageChange: function (p) {
          logState.page = p;
          renderLogs();
        },
        onPageSizeChange: function (s) {
          logState.pageSize = s;
          logState.page = 1;
          renderLogs();
        }
      });
    }
  }

  function openLog(item) {
    logState.activityId = item.id;
    logState.page = 1;
    document.getElementById('tplLogTitle').textContent = '操作日志 · ' + (item.name || item.id);
    setHidden(document.getElementById('tplLogDrawer'), false);
    renderLogs();
  }

  function closeLog() {
    setHidden(document.getElementById('tplLogDrawer'), true);
    setHidden(document.getElementById('tplLogDetailBackdrop'), true);
  }

  function openLogDetail(id) {
    var row = Store.findLog(id);
    var body = document.getElementById('tplLogDetailBody');
    if (!body) return;
    if (!row) {
      toast('未找到该条操作日志', 'error');
      return;
    }
    var changes = row.changes || [];
    var pretty;
    try {
      pretty = JSON.stringify(JSON.parse(row.requestParams), null, 2);
    } catch (e) {
      pretty = String(row.requestParams || '—');
    }
    body.innerHTML =
      '<div class="mkt-tpl-log-detail__head">' +
      '<span class="mkt-tpl-tag ' +
      (row.success ? 'mkt-tpl-tag--success' : 'mkt-tpl-tag--warning') +
      '">' +
      (row.success ? '成功' : '失败') +
      '</span>' +
      '<span class="mkt-tpl-log-detail__action">' +
      escapeHtml(Store.ACTION_LABEL[row.action] || row.action || '—') +
      '</span></div>' +
      '<div class="mkt-tpl-log-detail__meta">' +
      '<div><dt>操作时间</dt><dd>' +
      escapeHtml(row.timestamp || '—') +
      '</dd></div>' +
      '<div><dt>操作人</dt><dd>' +
      escapeHtml(row.operator || '—') +
      '</dd></div>' +
      '<div><dt>查询对象</dt><dd>' +
      escapeHtml([row.resource, row.resourceId].filter(Boolean).join('-') || '—') +
      '</dd></div>' +
      '<div><dt>客户端IP</dt><dd>' +
      escapeHtml(row.clientIp || '—') +
      '</dd></div>' +
      '<div><dt>来源服务</dt><dd>' +
      escapeHtml(row.service || '—') +
      '</dd></div>' +
      '<div><dt>耗时</dt><dd>' +
      escapeHtml(row.elapsedMs != null ? row.elapsedMs + ' ms' : '—') +
      '</dd></div></div>' +
      '<div class="mkt-tpl-log-detail__section-title">变更明细 <span class="mkt-tpl-log-detail__count">（共 ' +
      changes.length +
      ' 个字段）</span></div>' +
      (changes.length
        ? '<table class="table"><thead><tr><th>字段</th><th>变更前</th><th>变更后</th></tr></thead><tbody>' +
          changes
            .map(function (c) {
              return (
                '<tr><td>' +
                escapeHtml(FIELD_LABEL[c.field] || c.field) +
                '</td><td class="mkt-tpl-log-old">' +
                escapeHtml(c.oldValue == null || c.oldValue === '' ? '—' : c.oldValue) +
                '</td><td class="mkt-tpl-log-new">' +
                escapeHtml(c.newValue == null || c.newValue === '' ? '—' : c.newValue) +
                '</td></tr>'
              );
            })
            .join('') +
          '</tbody></table>'
        : '<div class="mkt-sk-empty">无字段级变更</div>') +
      '<div class="mkt-tpl-log-detail__section-title">请求参数</div>' +
      '<div class="mkt-tpl-log-uri">' +
      escapeHtml((row.httpMethod || '') + ' ' + (row.requestUri || '')) +
      '</div>' +
      '<pre class="mkt-tpl-log-params">' +
      escapeHtml(pretty) +
      '</pre>';
    setHidden(document.getElementById('tplLogDetailBackdrop'), false);
  }

  function bindClearBtns() {
    document.querySelectorAll('#skFilterForm .input-wrapper .clear-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var input = btn.parentElement && btn.parentElement.querySelector('input');
        if (input) {
          input.value = '';
          input.focus();
        }
      });
    });
  }

  function bindEvents() {
    var queryBtn = document.getElementById('skFilterQuery');
    var resetBtn = document.getElementById('skFilterReset');
    var addBtn = document.getElementById('skAddBtn');
    if (queryBtn) {
      queryBtn.addEventListener('click', function () {
        page = 1;
        render();
      });
    }
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        Store.startWorking(Store.emptyItem());
        window.location.href = formHref('', 'create');
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        ['qSkId', 'qSkName', 'qSkProduct', 'qSkCode', 'qSkStatus', 'qSkTimeStart', 'qSkTimeEnd'].forEach(
          function (id) {
            var el = document.getElementById(id);
            if (el) el.value = '';
          }
        );
        syncDatetimeClear('qSkTimeStartWrap', 'qSkTimeStart');
        syncDatetimeClear('qSkTimeEndWrap', 'qSkTimeEnd');
        page = 1;
        render();
      });
    }

    var tbody = document.getElementById('skTableBody');
    if (tbody) {
      tbody.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-act]');
        if (!btn) return;
        var act = btn.getAttribute('data-act');
        if (act === 'edit' || act === 'view') return;
        ev.preventDefault();
        var tr = btn.closest('tr[data-id]');
        var id = tr && tr.getAttribute('data-id');
        if (!id) return;
        var item = Store.getById(id);
        if (!item) {
          toast('活动不存在', 'warning');
          render();
          return;
        }
        if (act === 'goods') {
          openGoods(item);
          return;
        }
        if (act === 'enable') {
          if (!window.confirm('确认启用活动「' + item.name + '」吗？')) return;
          Store.setEnabled(id, true);
          toast('已启用', 'success');
          render();
          return;
        }
        if (act === 'disable') {
          if (!window.confirm('确认禁用活动「' + item.name + '」吗？')) return;
          Store.setEnabled(id, false);
          toast('已禁用', 'success');
          render();
          return;
        }
        if (act === 'log') {
          openLog(item);
        }
      });
    }

    var goodsBody = document.getElementById('skGoodsTableBody');
    if (goodsBody) {
      goodsBody.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-act="expand-sku"]');
        if (!btn) return;
        var pid = btn.getAttribute('data-pid');
        goodsExpanded[pid] = !goodsExpanded[pid];
        var backdrop = document.getElementById('skGoodsBackdrop');
        var item = Store.getById(backdrop && backdrop.getAttribute('data-id'));
        if (item) renderGoodsModal(item);
      });
    }

    ['skGoodsClose', 'skGoodsOk'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('click', closeGoods);
    });
    var goodsBackdrop = document.getElementById('skGoodsBackdrop');
    if (goodsBackdrop) {
      goodsBackdrop.addEventListener('click', function (ev) {
        if (ev.target === goodsBackdrop) closeGoods();
      });
    }

    var logMask = document.getElementById('tplLogMask');
    var logClose = document.getElementById('tplLogClose');
    if (logMask) logMask.addEventListener('click', closeLog);
    if (logClose) logClose.addEventListener('click', closeLog);
    var logBody = document.getElementById('tplLogTableBody');
    if (logBody) {
      logBody.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-act="log-detail"]');
        if (!btn) return;
        openLogDetail(btn.getAttribute('data-id'));
      });
    }
    ['tplLogDetailClose', 'tplLogDetailOk'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', function () {
          setHidden(document.getElementById('tplLogDetailBackdrop'), true);
        });
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindClearBtns();
    bindDatetimeClears();
    bindEvents();
    render();
  });
})();
