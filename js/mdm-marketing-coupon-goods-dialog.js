/**
 * 优惠券 — 适用商品 / 指定类目查看弹窗
 */
(function (global) {
  'use strict';

  var PAGE_SIZE = 20;

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function catSourceLabel(src) {
    var Store = global.MdmMarketingCouponStore;
    if (Store && Store.categorySourceLabel) return Store.categorySourceLabel(src);
    return src === 'LIVE' ? '直播' : src === 'MALL' ? '商城' : src || '—';
  }

  function thumbHtml(item) {
    if (item && item.img) {
      return '<span class="mkt-cp-goods-thumb"><img src="' + escapeHtml(item.img) + '" alt=""></span>';
    }
    var ch = String((item && item.name) || '?').charAt(0);
    return '<span class="mkt-cp-goods-thumb">' + escapeHtml(ch) + '</span>';
  }

  function cellHtml(item, idAttr) {
    var Store = global.MdmMarketingCouponStore;
    if (!Store || !item) return '—';
    var scope = (item.config && item.config.itemScope) || 'ALL';
    var attr = idAttr || '';
    if (scope === 'ALL') return '全部商品';
    if (scope === 'CATEGORY') {
      var cats = Store.categoryItemsOf(item);
      return (
        '<button type="button" class="mkt-tpl-name" data-act="view-scope" ' +
        attr +
        '>' +
        '指定类目（' +
        cats.length +
        '）</button>'
      );
    }
    var goods = Store.groupGoodsOf(item);
    return (
      '<button type="button" class="mkt-tpl-name" data-act="view-scope" ' +
      attr +
      '>' +
      (goods.length ? goods.length + '个商品' : '指定商品（0）') +
      '</button>'
    );
  }

  function matchGoods(row, nameKw, codeKw) {
    var name = String(nameKw || '').trim().toLowerCase();
    var code = String(codeKw || '').trim().toLowerCase();
    var okName = !name || String(row.name || '').toLowerCase().indexOf(name) >= 0;
    if (!okName) return false;
    if (!code) return true;
    if (String(row.spuCode || '').toLowerCase().indexOf(code) >= 0) return true;
    return (row.skus || []).some(function (s) {
      return (
        String(s.skuCode || '').toLowerCase().indexOf(code) >= 0 ||
        String(s.skuName || '').toLowerCase().indexOf(code) >= 0
      );
    });
  }

  function matchCat(row, nameKw, sourceKw) {
    var name = String(nameKw || '').trim().toLowerCase();
    var src = String(sourceKw || '').trim();
    if (name && String(row.name || '').toLowerCase().indexOf(name) < 0) return false;
    if (src && String(row.source || '') !== src) return false;
    return true;
  }

  function mountDialog(opts) {
    var existing = document.querySelector('[data-cp-goods-dialog]');
    if (existing) existing.remove();

    var page = 1;
    var expanded = {};
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop mkt-cp-goods-backdrop';
    backdrop.setAttribute('data-cp-goods-dialog', '1');
    backdrop.innerHTML =
      '<div class="erp-modal mkt-cp-goods-modal" role="dialog" aria-modal="true">' +
      '<div class="erp-modal__header">' +
      '<h2 class="erp-modal__title">' +
      escapeHtml(opts.title || '') +
      '</h2>' +
      '<div class="erp-modal__header-actions">' +
      '<button type="button" class="erp-modal__header-btn" data-close aria-label="关闭">&times;</button>' +
      '</div></div>' +
      '<div class="erp-modal__body">' +
      opts.filterHtml +
      '<div class="mkt-cp-scope-table-wrap"><table class="table mkt-cp-scope-table">' +
      '<thead>' +
      opts.headHtml +
      '</thead>' +
      '<tbody id="cpGoodsBody"></tbody></table></div>' +
      '<div id="cpGoodsPager"></div>' +
      '</div>' +
      '<div class="erp-modal__footer">' +
      '<button type="button" class="erp-btn erp-btn--primary" data-close>关闭</button>' +
      '</div></div>';

    function paint() {
      var rows = opts.filtered();
      var total = rows.length;
      var maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1);
      if (page > maxPage) page = maxPage;
      var start = (page - 1) * PAGE_SIZE;
      var slice = rows.slice(start, start + PAGE_SIZE);
      var tbody = backdrop.querySelector('#cpGoodsBody');
      if (!tbody) return;
      tbody.innerHTML = opts.renderRows(slice, start, expanded);
      if (typeof createPagination === 'function') {
        createPagination({
          containerId: 'cpGoodsPager',
          totalItems: total,
          currentPage: page,
          pageSize: PAGE_SIZE,
          pageSizeOptions: [20],
          onPageChange: function (p) {
            page = p;
            paint();
          },
          onPageSizeChange: function () {
            page = 1;
            paint();
          }
        });
      }
    }

    backdrop.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]') || e.target === backdrop) {
        backdrop.remove();
        return;
      }
      if (e.target.closest('[data-query]')) {
        page = 1;
        paint();
        return;
      }
      if (e.target.closest('[data-reset]')) {
        opts.reset(backdrop);
        page = 1;
        paint();
        return;
      }
      var clearBtn = e.target.closest('.clear-btn');
      if (clearBtn) {
        var wrap = clearBtn.closest('.input-wrapper');
        var inp = wrap && wrap.querySelector('input');
        if (inp) inp.value = '';
        page = 1;
        paint();
        return;
      }
      var exp = e.target.closest('[data-act="expand"]');
      if (exp) {
        var id = exp.getAttribute('data-id');
        expanded[id] = !expanded[id];
        paint();
      }
    });

    document.body.appendChild(backdrop);
    paint();
  }

  function openGoods(goods, title) {
    var list = Array.isArray(goods) ? goods : [];
    mountDialog({
      title: title || '适用商品（' + list.length + '个）',
      filterHtml:
        '<div class="mkt-cp-scope-filter">' +
        '<div class="mkt-cp-scope-filter__item"><label>商品名称</label><div class="input-wrapper">' +
        '<input id="cpGoodsName" placeholder="请输入商品名称" autocomplete="off"><span class="clear-btn">×</span></div></div>' +
        '<div class="mkt-cp-scope-filter__item"><label>商品编码</label><div class="input-wrapper">' +
        '<input id="cpGoodsCode" placeholder="商品编码或规格编码" autocomplete="off"><span class="clear-btn">×</span></div></div>' +
        '<div class="mkt-cp-scope-filter__actions">' +
        '<button type="button" class="btn btn-secondary" data-reset>重置</button>' +
        '<button type="button" class="btn btn-primary" data-query>查询</button></div></div>',
      headHtml: '<tr><th style="width:88px">商品图片</th><th>商品名称</th><th style="width:120px">规格数量</th></tr>',
      filtered: function () {
        var nameKw = (document.getElementById('cpGoodsName') || {}).value || '';
        var codeKw = (document.getElementById('cpGoodsCode') || {}).value || '';
        return list.filter(function (row) {
          return matchGoods(row, nameKw, codeKw);
        });
      },
      reset: function (root) {
        var n = root.querySelector('#cpGoodsName');
        var c = root.querySelector('#cpGoodsCode');
        if (n) n.value = '';
        if (c) c.value = '';
      },
      renderRows: function (slice, start, expanded) {
        if (!slice.length) {
          return '<tr><td colspan="3" class="mkt-tpl-empty">未查询到符合条件的商品</td></tr>';
        }
        return slice
          .map(function (row) {
            var n = (row.skus || []).length;
            var isOpen = !!expanded[row.id];
            var specBtn =
              n > 0
                ? '<button type="button" class="mkt-cp-goods-spec' +
                  (isOpen ? ' is-open' : '') +
                  '" data-act="expand" data-id="' +
                  escapeHtml(row.id) +
                  '">' +
                  n +
                  '个规格</button>'
                : '<span class="mkt-cp-goods-spec-empty">0个规格</span>';
            var parent =
              '<tr class="mkt-cp-scope-row"><td>' +
              thumbHtml(row) +
              '</td><td><div class="mkt-cp-goods-name">' +
              escapeHtml(row.name || '—') +
              '</div><div class="mkt-cp-goods-code">' +
              escapeHtml(row.spuCode || '—') +
              '</div></td><td>' +
              specBtn +
              '</td></tr>';
            if (!isOpen || !n) return parent;
            var children = (row.skus || [])
              .map(function (s) {
                return (
                  '<tr class="mkt-cp-goods-child"><td></td><td colspan="2"><span class="mkt-cp-goods-sku">' +
                  escapeHtml((s.skuName || '规格') + '（' + (s.skuCode || '—') + '）') +
                  '</span></td></tr>'
                );
              })
              .join('');
            return parent + children;
          })
          .join('');
      }
    });
  }

  function openCategories(cats, title) {
    var list = Array.isArray(cats) ? cats : [];
    mountDialog({
      title: title || '指定类目（' + list.length + '）',
      filterHtml:
        '<div class="mkt-cp-scope-filter">' +
        '<div class="mkt-cp-scope-filter__item"><label>类目名称</label><div class="input-wrapper">' +
        '<input id="cpCatName" placeholder="请输入类目名称" autocomplete="off"><span class="clear-btn">×</span></div></div>' +
        '<div class="mkt-cp-scope-filter__item"><label>类目归属</label>' +
        '<select id="cpCatSource"><option value="">不限</option><option value="MALL">商城</option><option value="LIVE">直播</option></select></div>' +
        '<div class="mkt-cp-scope-filter__actions">' +
        '<button type="button" class="btn btn-secondary" data-reset>重置</button>' +
        '<button type="button" class="btn btn-primary" data-query>查询</button></div></div>',
      headHtml: '<tr><th style="width:80px">序号</th><th>类目名称</th><th style="width:120px">类目归属</th></tr>',
      filtered: function () {
        var nameKw = (document.getElementById('cpCatName') || {}).value || '';
        var srcKw = (document.getElementById('cpCatSource') || {}).value || '';
        return list.filter(function (row) {
          return matchCat(row, nameKw, srcKw);
        });
      },
      reset: function (root) {
        var n = root.querySelector('#cpCatName');
        var s = root.querySelector('#cpCatSource');
        if (n) n.value = '';
        if (s) s.value = '';
      },
      renderRows: function (slice, start) {
        if (!slice.length) {
          return '<tr><td colspan="3" class="mkt-tpl-empty">未查询到符合条件的类目</td></tr>';
        }
        return slice
          .map(function (row, i) {
            return (
              '<tr class="mkt-cp-scope-row"><td>' +
              (start + i + 1) +
              '</td><td>' +
              escapeHtml(row.name || row.id || '—') +
              '</td><td>' +
              escapeHtml(catSourceLabel(row.source)) +
              '</td></tr>'
            );
          })
          .join('');
      }
    });
  }

  function openFromCoupon(item) {
    var Store = global.MdmMarketingCouponStore;
    if (!Store || !item) return;
    var scope = (item.config && item.config.itemScope) || 'ALL';
    if (scope === 'CATEGORY') {
      var cats = Store.categoryItemsOf(item);
      openCategories(cats, '指定类目（' + cats.length + '）');
      return;
    }
    var goods = Store.groupGoodsOf(item);
    openGoods(goods, '适用商品（' + goods.length + '个）');
  }

  function openFromSkus(skus) {
    var Store = global.MdmMarketingCouponStore;
    var goods = Store && Store.groupSkuItems ? Store.groupSkuItems(skus || []) : [];
    openGoods(goods, '适用商品（' + goods.length + '个）');
  }

  global.MdmMarketingCouponGoodsDialog = {
    cellHtml: cellHtml,
    open: openGoods,
    openGoods: openGoods,
    openCategories: openCategories,
    openFromCoupon: openFromCoupon,
    openFromSkus: openFromSkus
  };
})(window);
