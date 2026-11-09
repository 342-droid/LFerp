/* 商品销量原型：明细为验收示例，正式接入时由订单服务返回。 */
(function () {
  function escape(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  var orderExamples = {
  "mall": [
    {
      "order": "ORD-3212689201598341",
      "status": "交易失败",
      "paid": 0,
      "refund": 0,
      "aftersale": "无售后"
    },
    {
      "order": "ORD-3212689201588561",
      "status": "待发货",
      "paid": 5,
      "refund": 0,
      "aftersale": "无售后"
    },
    {
      "order": "ORD-3212689201599501",
      "status": "待核销",
      "paid": 5,
      "refund": 0,
      "aftersale": "无售后"
    },
    {
      "order": "ORD-3212689201588561-B",
      "status": "待接单",
      "paid": 5,
      "refund": 0,
      "aftersale": "无售后"
    },
    {
      "order": "ORD-3212689201599201",
      "status": "待提货",
      "paid": 5,
      "refund": 0,
      "aftersale": "无售后"
    },
    {
      "order": "ORD-3212689201584693",
      "status": "待收货",
      "paid": 5,
      "refund": 0,
      "aftersale": "无售后"
    },
    {
      "order": "ORD-3212689201562037-A",
      "status": "待支付",
      "paid": 0,
      "refund": 0,
      "aftersale": "无售后"
    },
    {
      "order": "ORD-3212689201560682",
      "status": "交易成功",
      "paid": 5,
      "refund": 2,
      "aftersale": "退款成功"
    }
  ],
  "proxy": [
    {
      "order": "ORD-3212689201599701",
      "status": "待发货",
      "paid": 5,
      "refund": 0,
      "aftersale": "无售后"
    },
    {
      "order": "ORD-3212689201598341",
      "status": "交易失败",
      "paid": 0,
      "refund": 0,
      "aftersale": "无售后"
    },
    {
      "order": "ORD-3212689201588561",
      "status": "待接单",
      "paid": 5,
      "refund": 0,
      "aftersale": "无售后"
    },
    {
      "order": "ORD-3212689201588561-B",
      "status": "待支付",
      "paid": 0,
      "refund": 0,
      "aftersale": "无售后"
    },
    {
      "order": "ORD-3212689201599001",
      "status": "待收货",
      "paid": 5,
      "refund": 0,
      "aftersale": "无售后"
    },
    {
      "order": "ORD-3212689201560682",
      "status": "交易成功",
      "paid": 5,
      "refund": 2,
      "aftersale": "退款成功"
    }
  ]
};

  function records(channel, item) {
    if (item.status === 'draft') return [];
    return orderExamples[channel].map(function (row) {
      return Object.assign({}, row, { sku: item.spec || '默认规格' });
    });
  }

  function totals(rows) {
    return rows.reduce(function (sum, row) {
      sum.paid += row.paid;
      sum.refund += row.refund;
      return sum;
    }, { paid: 0, refund: 0 });
  }

  var products = {};
  window.ProductSales = {
    render: function (channel, item) {
      var key = channel + ':' + item.code + ':' + item.name;
      products[key] = { channel: channel, item: item };
      var sum = totals(records(channel, item));
      return '<button type="button" class="product-sales-link" data-sales-key="' + escape(key) +
        '" aria-label="查看' + escape(item.name) + '销量明细">' + (sum.paid - sum.refund) + '</button>';
    }
  };

  var DETAIL_PAGE_SIZES = [5, 10, 20];

  function detailRowsHtml(rows) {
    if (!rows.length) return '<tr><td colspan="7">暂无成交记录，销量为 0</td></tr>';
    return rows.map(function (row) {
      return '<tr><td><span class="product-sales-order">' + escape(row.order) + '</span></td><td>' + escape(row.sku) + '</td><td>' +
        escape(row.status) + '</td><td>' + escape(row.aftersale) + '</td><td>' + row.paid + '</td><td>' + row.refund + '</td><td>' +
        (row.paid - row.refund) + '</td></tr>';
    }).join('');
  }

  function detailPagerHtml(total, page, size) {
    var pages = Math.max(1, Math.ceil(total / size));
    var html = '<span class="product-sales-pager__total">共 ' + total + ' 条</span><div class="product-pagination__right">' +
      '<select class="product-pagination__size" data-sales-size aria-label="每页条数">' +
      DETAIL_PAGE_SIZES.map(function (n) { return '<option value="' + n + '"' + (n === size ? ' selected' : '') + '>' + n + '条/页</option>'; }).join('') +
      '</select><div class="product-pagination__pages">' +
      '<button type="button" class="product-pagination__btn" data-sales-page="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + ' aria-label="上一页">‹</button>';
    for (var i = 1; i <= pages; i++) {
      html += '<button type="button" class="product-pagination__btn' + (i === page ? ' is-active' : '') + '" data-sales-page="' + i + '">' + i + '</button>';
    }
    return html + '<button type="button" class="product-pagination__btn" data-sales-page="' + (page + 1) + '"' + (page >= pages ? ' disabled' : '') + ' aria-label="下一页">›</button></div></div>';
  }

  function openDetail(product) {
    var rows = records(product.channel, product.item);
    var sum = totals(rows);
    var view = { page: 1, size: DETAIL_PAGE_SIZES[0] };
    var dialog = document.createElement('dialog');
    dialog.className = 'erp-modal product-sales-dialog';
    dialog.setAttribute('aria-label', '商品销量明细');
    dialog.innerHTML = '<form method="dialog" class="product-sales-header"><header class="erp-modal__header"><h2 class="erp-modal__title">商品销量明细</h2><div class="erp-modal__header-actions"><button class="erp-modal__header-btn" aria-label="关闭">×</button></div></header></form><div class="erp-modal__body">' +
      '<p>' + escape(product.item.name) + ' · ' + escape(product.item.code) + ' · ' +
      (product.channel === 'mall' ? '商城商品' : '代采商品') + '</p>' +
      '<p class="product-sales-note">累计统计 · 原型示例数据</p>' +
      '<section class="product-sales-summary"><div>成交数量<strong>' + sum.paid +
      '</strong></div><div>退款数量<strong>' + sum.refund + '</strong></div><div>净销量<strong>' +
      (sum.paid - sum.refund) + '</strong></div></section>' +
      '<p class="product-sales-formula">销量 = 支付成功数量 − 退款成功的商品数量。仅退运费或差价不扣销量，订单状态与售后状态分开展示。</p>' +
      '<div class="product-sales-scroll"><table><thead><tr><th>订单号</th><th>规格</th><th>订单状态</th><th>售后状态</th>' +
      '<th>成交</th><th>退款</th><th>净销量</th></tr></thead><tbody data-sales-body></tbody></table></div>' +
      '<div class="product-pagination product-sales-pager" data-sales-pager></div>' +
      '</div><form method="dialog" class="erp-modal__footer"><button class="btn btn-secondary">关闭</button></form>';

    function paint() {
      var pages = Math.max(1, Math.ceil(rows.length / view.size));
      if (view.page > pages) view.page = pages;
      if (view.page < 1) view.page = 1;
      var start = (view.page - 1) * view.size;
      dialog.querySelector('[data-sales-body]').innerHTML = detailRowsHtml(rows.slice(start, start + view.size));
      var pager = dialog.querySelector('[data-sales-pager]');
      pager.hidden = !rows.length;
      pager.innerHTML = detailPagerHtml(rows.length, view.page, view.size);
    }

    dialog.addEventListener('click', function (click) {
      var pageBtn = click.target.closest('[data-sales-page]');
      if (pageBtn) {
        if (!pageBtn.disabled) { view.page = parseInt(pageBtn.getAttribute('data-sales-page'), 10) || 1; paint(); }
        return;
      }
      if (click.target === dialog) {
        var box = dialog.getBoundingClientRect();
        if (click.clientX < box.left || click.clientX > box.right || click.clientY < box.top || click.clientY > box.bottom) dialog.close();
      }
    });
    dialog.addEventListener('change', function (change) {
      if (!change.target.matches('[data-sales-size]')) return;
      view.size = parseInt(change.target.value, 10) || DETAIL_PAGE_SIZES[0];
      view.page = 1;
      paint();
    });
    dialog.addEventListener('close', function () { dialog.remove(); });
    paint();
    document.body.appendChild(dialog);
    dialog.showModal();
  }

  /* 销量说明：表头「销量」上方的气泡，点击 ⓘ 打开，再次点击、点空白处或 Esc 关闭 */
  function helpBubble() { return document.getElementById('productSalesHelp'); }

  function closeHelp() {
    var bubble = helpBubble();
    if (!bubble || bubble.hidden) return;
    bubble.hidden = true;
    document.querySelectorAll('.product-sales-help[aria-expanded="true"]').forEach(function (btn) { btn.setAttribute('aria-expanded', 'false'); });
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
    bubble.style.top = (anchor.top - bubble.offsetHeight - 10) + 'px';
    bubble.style.setProperty('--arrow-left', (anchor.left + anchor.width / 2 - left) + 'px');
    button.setAttribute('aria-expanded', 'true');
  }

  document.addEventListener('click', function (event) {
    var help = event.target.closest('.product-sales-help');
    if (help) {
      var bubble = helpBubble();
      if (bubble && !bubble.hidden) closeHelp(); else openHelp(help);
      return;
    }
    if (!event.target.closest('#productSalesHelp')) closeHelp();
    var button = event.target.closest('[data-sales-key]');
    if (!button) return;
    var product = products[button.dataset.salesKey];
    if (product) openDetail(product);
  });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeHelp(); });
  window.addEventListener('scroll', closeHelp, true);
  window.addEventListener('resize', closeHelp);
})();
