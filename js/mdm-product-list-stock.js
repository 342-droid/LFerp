/**
 * 商城 / 代采商品列表 · 剩余库存（【925】）
 * 样式与交互对齐销量列：表头说明气泡 + 点击数字查看库存操作明细。
 * 是否维护库存由商品库存配置决定；未维护时展示「—」。
 */
(function () {
  function escape(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function hashSeed(key) {
    var s = String(key || '');
    var n = 0;
    for (var i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) >>> 0;
    return n;
  }

  /** 履约方式不能单独决定是否维护库存。 */
  function maintainsStock(item) {
    if (!item) return false;
    if (item.stockManaged === false) return false;
    if (item.stockManaged === true || (item.remainStock != null && item.remainStock !== '') || item.sellableStock != null) return true;
    return true;
  }

  function skuRows(channel, item) {
    if (!maintainsStock(item)) return [];
    var detail = window.MdmProductCatalog && window.MdmProductCatalog.getByCode
      ? window.MdmProductCatalog.getByCode(item.code)
      : item;
    var sourceSkus = detail && (detail.specs || detail.skus);
    var expectedCount = Math.max(1, parseInt(item.specCount, 10) || 1);
    if (!Array.isArray(sourceSkus) || sourceSkus.length !== expectedCount) {
      sourceSkus = Array.from({ length: expectedCount }, function (_, index) {
        return {
          skuCode: item.code + '-' + String(index + 1).padStart(2, '0'),
          packaging: item.spec || '规格待维护'
        };
      });
    }
    return sourceSkus.map(function (source, index) {
      var sku = Object.assign({}, source);
      var summary = window.MdmSkuWhStock && window.MdmSkuWhStock.attachToSku
        ? window.MdmSkuWhStock.attachToSku(sku, { channel: channel })
        : null;
      var sellable = summary ? Number(summary.sellableTotal) : Number(sku.sellableStock);
      var reserved = summary ? Number(summary.reservedTotal) : Number(sku.reservedStock);
      var remain = summary ? Number(summary.remainTotal) : Number(sku.remainStock);
      if (!isFinite(sellable) || sellable < 0) sellable = 0;
      if (!isFinite(reserved) || reserved < 0) reserved = 0;
      if (!isFinite(remain) || remain < 0) remain = Math.max(0, sellable - reserved);
      return {
        code: sku.skuCode || sku.code || (item.code + '-' + String(index + 1).padStart(2, '0')),
        spec: sku.specValue || sku.packaging || sku.spec || ('规格' + (index + 1)),
        sellable: Math.round(sellable), reserved: Math.round(reserved), remain: Math.round(remain)
      };
    });
  }

  function remainOf(item, channel) {
    var skus = skuRows(channel || 'mall', item);
    if (!skus.length) return null;
    return skus.reduce(function (total, sku) { return total + sku.remain; }, 0);
  }

  function operationRows(channel, item, remain) {
    if (remain == null) return [];
    var fulfillRemark = channel === 'mall'
      ? (String(item.fulfillmentMode || item.deliveryMode || '').toLowerCase().indexOf('express') !== -1
        ? '供应商发货后释放预占；已售数量不回补剩余'
        : '自提核销后释放预占；已售数量不回补剩余')
      : '门店收货后释放预占；已售数量不回补剩余';
    var ops = [
      { type: '初始可售', delta: remain + 5, operator: '系统', remark: '本渠道可售配置生效' },
      { type: '下单预占', delta: -4, operator: '系统', remark: '下单成功，本渠道预占 +4；支付不重复预占' },
      { type: '取消退占', delta: 4, operator: '系统', remark: '未履约取消，原路释放预占 4' },
      { type: '下单预占', delta: -3, operator: '系统', remark: '下单成功，本渠道预占 +3' },
      { type: '退款退占', delta: 3, operator: '系统', remark: '发货前退款，释放预占 3' },
      { type: '下单预占', delta: -5, operator: '系统', remark: '下单成功，本渠道预占 +5' },
      { type: '履约释放预占', delta: 0, operator: '系统', remark: fulfillRemark },
      { type: '下单预占', delta: -8, operator: '系统', remark: '下单成功，本渠道预占 +8' },
      { type: '入库联动可售', delta: 10, operator: '系统', remark: '按现货配置可售，入库后可售增加 10' },
      { type: '可售调整', delta: -2, operator: '李运营', remark: '本渠道可售手动调减 2' }
    ];
    var cursor = 0;
    var channelLabel = channel === 'mall' ? '商城' : '代采';
    return ops.map(function (op, index) {
      cursor += op.delta;
      var day = 16 + index;
      return {
        time: '2026-11-' + (day < 10 ? '0' + day : day) + ' 1' + (index % 10) + ':2' + (index % 6) + ':0' + (index % 9),
        type: op.type,
        delta: op.delta,
        after: Math.max(0, cursor),
        operator: op.operator,
        remark: op.remark + ' · ' + channelLabel
      };
    }).reverse();
  }

  var products = {};

  window.ProductStock = {
    remainOf: remainOf,
    maintainsStock: maintainsStock,
    render: function (channel, item) {
      var remain = remainOf(item, channel);
      if (remain == null) {
        return '<span class="product-stock-value is-empty">—</span>';
      }
      return '<span class="product-stock-value">' + remain + '</span>';
    }
  };

  var DETAIL_PAGE_SIZES = [5, 10, 20];

  function detailRowsHtml(rows) {
    if (!rows.length) {
      return '<tr><td colspan="6">未维护库存，无操作记录</td></tr>';
    }
    return rows
      .map(function (row) {
        var deltaCls = row.delta > 0 ? 'product-stock-delta is-plus' : row.delta < 0 ? 'product-stock-delta is-minus' : 'product-stock-delta';
        var deltaText = (row.delta > 0 ? '+' : '') + row.delta;
        return (
          '<tr><td>' +
          escape(row.time) +
          '</td><td>' +
          escape(row.type) +
          '</td><td><span class="' +
          deltaCls +
          '">' +
          deltaText +
          '</span></td><td>' +
          row.after +
          '</td><td>' +
          escape(row.operator) +
          '</td><td>' +
          escape(row.remark) +
          '</td></tr>'
        );
      })
      .join('');
  }

  function detailPagerHtml(total, page, size) {
    var pages = Math.max(1, Math.ceil(total / size));
    var html =
      '<span class="product-sales-pager__total">共 ' +
      total +
      ' 条</span><div class="product-pagination__right">' +
      '<select class="product-pagination__size" data-stock-size aria-label="每页条数">' +
      DETAIL_PAGE_SIZES.map(function (n) {
        return '<option value="' + n + '"' + (n === size ? ' selected' : '') + '>' + n + '条/页</option>';
      }).join('') +
      '</select><div class="product-pagination__pages">' +
      '<button type="button" class="product-pagination__btn" data-stock-page="' +
      (page - 1) +
      '"' +
      (page <= 1 ? ' disabled' : '') +
      ' aria-label="上一页">‹</button>';
    for (var i = 1; i <= pages; i++) {
      html +=
        '<button type="button" class="product-pagination__btn' +
        (i === page ? ' is-active' : '') +
        '" data-stock-page="' +
        i +
        '">' +
        i +
        '</button>';
    }
    return (
      html +
      '<button type="button" class="product-pagination__btn" data-stock-page="' +
      (page + 1) +
      '"' +
      (page >= pages ? ' disabled' : '') +
      ' aria-label="下一页">›</button></div></div>'
    );
  }

  function openDetail(product) {
    var skus = skuRows(product.channel, product.item);
    var remain = skus.length ? skus.reduce(function (total, sku) { return total + sku.remain; }, 0) : null;
    var sellableTotal = skus.reduce(function (total, sku) { return total + sku.sellable; }, 0);
    var reservedTotal = skus.reduce(function (total, sku) { return total + sku.reserved; }, 0);
    var rows = operationRows(product.channel, product.item, remain);
    var view = { page: 1, size: DETAIL_PAGE_SIZES[0] };
    var dialog = document.createElement('dialog');
    dialog.className = 'erp-modal product-sales-dialog product-stock-dialog';
    dialog.setAttribute('aria-label', '商品库存操作');
    var summaryHtml =
      remain == null
        ? '<section class="product-sales-summary product-stock-summary--empty"><div>剩余库存<strong>—</strong></div><div>库存维护<strong>未启用</strong></div><div>说明<strong>未维护库存</strong></div></section>'
        : '<section class="product-sales-summary"><div>可售库存<strong>' +
          sellableTotal +
          '</strong></div><div>预占<strong>' +
          reservedTotal +
          '</strong></div><div>剩余库存<strong>' +
          remain +
          '</strong></div></section>';

    dialog.innerHTML =
      '<form method="dialog" class="product-sales-header"><header class="erp-modal__header"><h2 class="erp-modal__title">商品库存操作</h2><div class="erp-modal__header-actions"><button class="erp-modal__header-btn" aria-label="关闭">×</button></div></header></form><div class="erp-modal__body">' +
      '<p>' +
      escape(product.item.name) +
      ' · ' +
      escape(product.item.code) +
      ' · ' +
      (product.channel === 'mall' ? '商城商品' : '代采商品') +
      '</p>' +
      '<p class="product-sales-note">库存流水 · 原型示例数据</p>' +
      summaryHtml +
      '<h3 class="product-stock-sku-title">SPU 下各 SKU 库存</h3><div class="product-sales-scroll"><table><thead><tr><th>SKU 编码</th><th>规格</th><th>可售库存</th><th>预占</th><th>剩余库存</th></tr></thead><tbody>' +
      (skus.length ? skus.map(function (sku) { return '<tr><td>' + escape(sku.code) + '</td><td>' + escape(sku.spec) + '</td><td>' + sku.sellable + '</td><td>' + sku.reserved + '</td><td>' + sku.remain + '</td></tr>'; }).join('') : '<tr><td colspan="5">未维护库存</td></tr>') +
      '</tbody></table></div>' +
      '<p class="product-sales-formula">剩余库存 = 可售库存 − 本渠道预占；表中「变动」是剩余库存的变化。下单成功即预占，付款不重复预占；取消或发货前退款释放对应预占，且不得重复退占。履约释放预占不回补已售剩余。仅当可售按现货计算时，入库联动剩余库存。</p>' +
      '<div class="product-sales-scroll"><table><thead><tr><th>操作时间</th><th>操作类型</th><th>变动</th><th>变动后剩余</th><th>操作人</th><th>说明</th></tr></thead><tbody data-stock-body></tbody></table></div>' +
      '<div class="product-pagination product-sales-pager" data-stock-pager></div>' +
      '</div><form method="dialog" class="erp-modal__footer"><button class="btn btn-secondary">关闭</button></form>';

    function paint() {
      var pages = Math.max(1, Math.ceil(rows.length / view.size));
      if (view.page > pages) view.page = pages;
      if (view.page < 1) view.page = 1;
      var start = (view.page - 1) * view.size;
      dialog.querySelector('[data-stock-body]').innerHTML = detailRowsHtml(rows.slice(start, start + view.size));
      var pager = dialog.querySelector('[data-stock-pager]');
      pager.hidden = !rows.length;
      pager.innerHTML = detailPagerHtml(rows.length, view.page, view.size);
    }

    dialog.addEventListener('click', function (click) {
      var pageBtn = click.target.closest('[data-stock-page]');
      if (pageBtn) {
        if (!pageBtn.disabled) {
          view.page = parseInt(pageBtn.getAttribute('data-stock-page'), 10) || 1;
          paint();
        }
        return;
      }
      if (click.target === dialog) {
        var box = dialog.getBoundingClientRect();
        if (click.clientX < box.left || click.clientX > box.right || click.clientY < box.top || click.clientY > box.bottom) {
          dialog.close();
        }
      }
    });
    dialog.addEventListener('change', function (change) {
      if (!change.target.matches('[data-stock-size]')) return;
      view.size = parseInt(change.target.value, 10) || DETAIL_PAGE_SIZES[0];
      view.page = 1;
      paint();
    });
    dialog.addEventListener('close', function () {
      dialog.remove();
    });
    paint();
    document.body.appendChild(dialog);
    dialog.showModal();
  }

  function helpBubble() {
    return document.getElementById('productStockHelp');
  }

  function closeHelp() {
    var bubble = helpBubble();
    if (!bubble || bubble.hidden) return;
    bubble.hidden = true;
    document.querySelectorAll('.product-stock-help[aria-expanded="true"]').forEach(function (btn) {
      btn.setAttribute('aria-expanded', 'false');
    });
  }

  function openHelp(button) {
    var bubble = helpBubble();
    if (!bubble) return;
    bubble.hidden = false;
    var th = button.closest('th') || button;
    var anchor = th.getBoundingClientRect();
    var width = bubble.offsetWidth;
    var left = anchor.left + anchor.width / 2 - width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    bubble.style.left = left + 'px';
    bubble.style.top = anchor.top - bubble.offsetHeight - 10 + 'px';
    bubble.style.setProperty('--arrow-left', anchor.left + anchor.width / 2 - left + 'px');
    button.setAttribute('aria-expanded', 'true');
  }

  document.addEventListener('click', function (event) {
    var help = event.target.closest('.product-stock-help');
    if (help) {
      var bubble = helpBubble();
      if (bubble && !bubble.hidden) closeHelp();
      else openHelp(help);
      return;
    }
    if (!event.target.closest('#productStockHelp')) closeHelp();
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeHelp();
  });
  window.addEventListener('scroll', closeHelp, true);
  window.addEventListener('resize', closeHelp);
})();
