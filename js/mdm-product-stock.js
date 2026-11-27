/**
 * 商城 / 代采商品列表 · 剩余库存（【925】）
 * 商品列表只展示库存数值；库存详情不在列表中展开。
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

  function renderSkuStack(channel, item, field) {
    if (!item || (parseInt(item.specCount, 10) || 1) <= 1) return '';
    return '<div class="product-sku-stack" data-stock-inline-code="' + item.code + '" hidden>' +
      skuRows(channel, item).map(function (sku) {
        return '<div class="product-sku-stack__item">' + (field === 'stock' ? '<span class="product-stock-value">' + sku.remain + '</span>' : field === 'spec' ? sku.spec : sku.code) + '</div>';
      }).join('') + '</div>';
  }

  function renderSkuCode(channel, item) {
    if (!item || (parseInt(item.specCount, 10) || 1) <= 1) return item.code;
    return '<button type="button" class="product-stock-expand" data-stock-expand="' + item.code + '" aria-expanded="false" aria-label="展开' + item.code + '各 SKU 库存">⌄</button>' +
      '<span>' + item.code + '</span>' + renderSkuStack(channel, item, 'code');
  }

  function renderSkuRows(channel, item) {
    if (!item || (parseInt(item.specCount, 10) || 1) <= 1) return '';
    return '<tr class="product-proxy-table__row product-sku-row" data-stock-parent-code="' + item.code + '" hidden>' +
      '<td class="product-sku-row__cell" colspan="99"><div class="product-sku-inline">' +
      '<div class="product-sku-inline__head"><span>SKU 编码</span><span>规格</span><span>剩余库存</span></div>' +
      skuRows(channel, item).map(function (sku) {
        return '<div class="product-sku-inline__item"><span>' + sku.code + '</span><span>' + sku.spec + '</span><span class="product-stock-value">' + sku.remain + '</span></div>';
      }).join('') +
      '</div></td></tr>';
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

  window.ProductStock = {
    remainOf: remainOf,
    maintainsStock: maintainsStock,
    skuRows: skuRows,
    renderSkuCode: renderSkuCode,
    renderSkuStack: renderSkuStack,
    renderSkuRows: renderSkuRows,
    render: function (channel, item) {
      var remain = remainOf(item, channel);
      if (remain == null) {
        return '<span class="product-stock-value is-empty">—</span>';
      }
      return '<span class="product-stock-value">' + remain + '</span>';
    }
  };

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
    var expand = event.target.closest('[data-stock-expand]');
    if (expand) {
      var code = expand.getAttribute('data-stock-expand');
      var open = expand.getAttribute('aria-expanded') !== 'true';
      document.querySelectorAll('[data-stock-inline-code], [data-stock-summary-code]').forEach(function (row) {
        if (row.getAttribute('data-stock-inline-code') === code) row.hidden = !open;
        if (row.getAttribute('data-stock-summary-code') === code) row.hidden = open;
      });
      expand.setAttribute('aria-expanded', open ? 'true' : 'false');
      expand.textContent = open ? '⌃' : '⌄';
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
