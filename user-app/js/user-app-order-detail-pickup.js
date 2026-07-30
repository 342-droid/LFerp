/**
 * 零售自提订单详情：
 * - 透出售后进度条（同门店/通用订单详情）
 * - 订单状态：全额退款/退货→已取消；有待提→待自提；剩余已提完→已完成（无「无需自提」）
 * - 核销方式：门店扫用户会员码（用户端不展示核销码）
 */
(function () {
  function getParams() {
    return new URLSearchParams(window.location.search);
  }

  function getApi() {
    return window.UAOrderRefund || null;
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getOrderNo() {
    var el = document.getElementById('pickupOrderNoText');
    var api = getApi();
    return (
      (el && el.textContent && el.textContent.trim()) ||
      (api && api.DEMO_ORDER_NO) ||
      '1089765423471123'
    );
  }

  function getAftersaleBarIcon(kind) {
    if (kind === 'closed') {
      return (
        '<span class="ua-od-as-bar__icon" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M7 7l10 10M17 7L7 17"/></svg>' +
        '</span>'
      );
    }
    if (kind === 'success') {
      return (
        '<span class="ua-od-as-bar__icon ua-od-as-bar__icon--success" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L19 7"/></svg>' +
        '</span>'
      );
    }
    return (
      '<span class="ua-od-as-bar__icon ua-od-as-bar__icon--progress" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h7l-1 8 10-14h-7l1-6z"/></svg>' +
      '</span>'
    );
  }

  function buildRefundSelectHref(itemIndex) {
    return (
      'order-refund-select.html?scene=post_ship&status=pickup&delivery=pickup&item=' +
      encodeURIComponent(String(itemIndex))
    );
  }

  function buildAftersaleDetailExtra() {
    return {
      from: '',
      status: 'pickup',
      delivery: 'pickup',
      scene: 'post_ship',
      supplier: ''
    };
  }

  function collectItemSnapshots() {
    var items = [];
    document.querySelectorAll('.ua-od-product[data-item-index]').forEach(function (card) {
      items.push({
        itemIndex: parseInt(card.getAttribute('data-item-index') || '0', 10),
        orderQty: parseInt(card.getAttribute('data-order-qty') || '1', 10),
        pickedQty: parseInt(card.getAttribute('data-picked-qty') || '0', 10),
        card: card
      });
    });
    return items;
  }

  function renderItemAftersaleBars(itemEl, itemIndex) {
    var api = getApi();
    var wrap = itemEl.querySelector('.ua-od-as-bars');
    if (!wrap || !api || !api.getAftersaleDisplayBars) return;

    var bars = (api.getAftersaleDisplayBars(itemIndex, getOrderNo()) || []).filter(
      function (bar) {
        return bar.group !== 'exchange';
      }
    );
    if (!bars.length) {
      wrap.innerHTML = '';
      return;
    }

    wrap.innerHTML = bars
      .map(function (bar) {
        var rec = bar.record;
        var view = api.getAftersaleProgressView(rec);
        var asIds = (bar.records || [rec])
          .map(function (r) {
            return r.id;
          })
          .filter(Boolean)
          .join(',');
        var descHtml = '';

        if (bar.kind === 'merged_refund_success') {
          view.icon = 'success';
          view.title = '退款成功';
          view.showAmount = true;
          view.desc = '金额';
          view.amountText = '¥' + Number(bar.amount || 0).toFixed(2);
        }

        if (view.showAmount) {
          descHtml =
            escapeHtml(view.desc) +
            '<em class="ua-od-as-bar__amount">' +
            escapeHtml(view.amountText) +
            '</em>';
        } else if (view.desc) {
          descHtml = escapeHtml(view.desc);
        }

        return (
          '<button type="button" class="ua-od-as-bar" data-as-id="' +
          escapeHtml(rec.id) +
          '" data-as-kind="' +
          escapeHtml(bar.kind || 'single') +
          '" data-as-ids="' +
          escapeHtml(asIds) +
          '" data-item-index="' +
          itemIndex +
          '">' +
          getAftersaleBarIcon(view.icon) +
          '<span class="ua-od-as-bar__title">' +
          escapeHtml(view.title) +
          '</span>' +
          (descHtml
            ? '<span class="ua-od-as-bar__divider" aria-hidden="true"></span>' +
              '<span class="ua-od-as-bar__desc">' +
              descHtml +
              '</span>'
            : '<span class="ua-od-as-bar__desc"></span>') +
          '<svg class="ua-od-as-bar__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>' +
          '</button>'
        );
      })
      .join('');
  }

  function openAftersaleFromBar(barEl) {
    var api = getApi();
    if (!api || !barEl) return;
    var asId = barEl.getAttribute('data-as-id');
    var asKind = barEl.getAttribute('data-as-kind') || 'single';
    var asIds = barEl.getAttribute('data-as-ids') || '';
    var itemIndex = parseInt(barEl.getAttribute('data-item-index') || '0', 10);
    var extra = buildAftersaleDetailExtra();

    if (asKind === 'merged_refund_success' && api.buildAftersaleListHref) {
      window.location.href = api.buildAftersaleListHref({
        fromDetail: '1',
        status: 'pickup',
        delivery: 'pickup',
        asItem: String(itemIndex),
        asFilter: 'done',
        asIds: asIds || asId
      });
      return;
    }

    var records = api.getAftersaleRecordsByItem
      ? api.getAftersaleRecordsByItem(itemIndex, getOrderNo())
      : [];
    var rec = records.find(function (r) {
      return r.id === asId;
    });
    if (!rec) return;
    window.location.href = api.buildAftersaleDetailHref(rec, extra);
  }

  function applyPickupQtyRules() {
    var api = getApi();
    var orderNo = getOrderNo();
    var snapshots = collectItemSnapshots();
    var pickedMap = {};

    snapshots.forEach(function (it) {
      pickedMap[String(it.itemIndex)] = it.pickedQty;
      var card = it.card;
      var remaining =
        api && api.getItemRemainingPickupQty
          ? api.getItemRemainingPickupQty(it.itemIndex, it.orderQty, it.pickedQty, orderNo)
          : Math.max(0, it.orderQty - it.pickedQty);

      card.setAttribute('data-remain-qty', String(remaining));
      card.classList.toggle('is-no-pickup', remaining <= 0);

      var qtyEl = card.querySelector('[data-pickup-qty]');
      if (qtyEl) {
        qtyEl.textContent =
          '规格：' + (card.getAttribute('data-spec') || '') + '　数量：' + it.orderQty;
      }

      var tagEl = card.querySelector('.ua-od-product__tag');
      var refundBtn = card.querySelector('.ua-od-refund-btn');
      var donePicked = it.pickedQty >= it.orderQty && it.orderQty > 0;
      var refunded =
        api && api.getItemRefundedPickupQty
          ? Math.min(api.getItemRefundedPickupQty(it.itemIndex, orderNo), it.orderQty)
          : 0;
      var fullyRefunded = refunded >= it.orderQty && it.orderQty > 0;
      var canAftersale =
        !api ||
        typeof api.canShowAftersaleEntry !== 'function' ||
        api.canShowAftersaleEntry(it.itemIndex, orderNo);

      if (remaining <= 0) {
        if (tagEl) {
          if (donePicked && !fullyRefunded) {
            tagEl.hidden = false;
            tagEl.className = 'ua-od-product__tag ua-od-product__tag--done';
            tagEl.textContent = '已提货';
          } else {
            /* 已退完不展示「无需自提」类标签 */
            tagEl.hidden = true;
            tagEl.textContent = '';
          }
        }
        if (refundBtn) refundBtn.hidden = true;
      } else {
        if (tagEl && !tagEl.classList.contains('ua-od-product__tag--partial') && !donePicked) {
          tagEl.hidden = false;
          tagEl.className = 'ua-od-product__tag';
          tagEl.textContent = '商品已到提货点请尽快提货';
        }
        if (refundBtn) {
          /* 可退/可补耗尽时隐藏入口（与数量池规则一致） */
          refundBtn.hidden = !canAftersale;
          if (canAftersale) {
            refundBtn.setAttribute('href', buildRefundSelectHref(it.itemIndex));
          }
        }
      }

      if (refundBtn && !refundBtn.hidden) {
        refundBtn.setAttribute('href', buildRefundSelectHref(it.itemIndex));
      }

      renderItemAftersaleBars(card, it.itemIndex);
    });

    if (api && typeof api.saveItemPickedQtyMap === 'function') {
      api.saveItemPickedQtyMap(pickedMap);
    }

    var orderStatus =
      api && api.resolveRetailOrderFulfillmentStatus
        ? api.resolveRetailOrderFulfillmentStatus(snapshots, orderNo, 'pickup')
        : 'pickup';
    syncPickupHeader(orderStatus);
  }

  function syncPickupHeader(orderStatus) {
    var titleEl = document.querySelector('.ua-od-pickup__title');
    var subEl = document.querySelector('.ua-od-pickup__sub');
    var voidTip = document.getElementById('pickupVerifyVoidTip');
    var backEl = document.querySelector('.ua-orders-back');
    var shell = document.querySelector('.ua-order-detail-page');

    if (voidTip) voidTip.hidden = true;

    if (shell) {
      shell.setAttribute('data-order-status', orderStatus);
      shell.classList.toggle('is-order-closed', orderStatus === 'closed');
      shell.classList.toggle('is-order-completed', orderStatus === 'completed');
    }

    if (orderStatus === 'closed') {
      if (titleEl) titleEl.textContent = '已取消';
      if (subEl) subEl.textContent = '订单商品已全部退款，订单已取消';
      if (backEl) backEl.setAttribute('href', 'orders.html');
      return;
    }

    if (orderStatus === 'completed') {
      if (titleEl) titleEl.textContent = '已完成';
      if (subEl) subEl.textContent = '商品已提货完成';
      if (backEl) backEl.setAttribute('href', 'orders.html');
      return;
    }

    if (titleEl) titleEl.textContent = '待自提';
    if (subEl) subEl.textContent = '商品已到提货点，到店出示会员码由门店核销提货';
    if (backEl) backEl.setAttribute('href', 'orders.html?tab=pickup');
  }

  function bindEvents() {
    document.querySelectorAll('.ua-od-as-bars').forEach(function (wrap) {
      wrap.addEventListener('click', function (e) {
        var bar = e.target.closest('.ua-od-as-bar');
        if (!bar) return;
        openAftersaleFromBar(bar);
      });
    });

    document.querySelectorAll('.ua-od-refund-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        var card = btn.closest('.ua-od-product[data-item-index]');
        if (!card) return;
        var itemIndex = parseInt(card.getAttribute('data-item-index') || '0', 10);
        var api = getApi();
        if (api && api.hasOpenAftersaleOfGroup && api.hasOpenAftersaleOfGroup(itemIndex, 'refund')) {
          e.preventDefault();
          window.alert('该商品已有进行中的退款/退货售后，请先处理完成后再申请');
        }
      });
    });

    var copyBtn = document.querySelector('.ua-od-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var text = getOrderNo();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text);
        }
        window.alert('已复制订单编号（演示）');
      });
    }
  }

  function ensureDeliveryParam() {
    var params = getParams();
    if (!params.get('delivery')) {
      params.set('delivery', 'pickup');
      history.replaceState(null, '', location.pathname + '?' + params.toString());
    }
  }

  function init() {
    ensureDeliveryParam();
    applyPickupQtyRules();
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
