/**
 * PC 代采订单 · 退运费原型
 * 订单发起，生成订单级售后明细；不选择商品、不改变商品售后状态。
 * 按现有计价规则拆开总运费与类目（常温 / 冷链 / 保价 / 派送 / 上楼），支持按总额退、按类目退。
 */
(function (global) {
  var previousFocus = null;
  var keydownHandler = null;
  var REFUND_TYPE = '仅退款';
  var REFUND_REASON = '退运费';
  var REFUND_SCENE = 'ORDER_FREIGHT';
  var CAT_DEFS = [
    { key: 'ambient', name: '常温运费', kind: 'base' },
    { key: 'cold', name: '冷链运费', kind: 'base' },
    { key: 'insure', name: '保价费', kind: 'extra' },
    { key: 'deliver', name: '派送费', kind: 'extra' },
    { key: 'upstairs', name: '上楼费', kind: 'extra' }
  ];

  function isFreightRefund(item) {
    return !!(
      item &&
      (item.refundScene === REFUND_SCENE || item.type === '退运费')
    );
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function parseMoney(value) {
    var parsed = parseFloat(String(value == null ? '' : value).replace(/[^\d.-]/g, ''));
    return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
  }

  function formatMoney(value) {
    return (Math.round((Number(value) || 0) * 100) / 100).toFixed(2);
  }

  function roundMoney(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
  }

  function nowText() {
    var date = new Date();
    function pad(value) {
      return value < 10 ? '0' + value : String(value);
    }
    return (
      date.getFullYear() +
      '-' +
      pad(date.getMonth() + 1) +
      '-' +
      pad(date.getDate()) +
      ' ' +
      pad(date.getHours()) +
      ':' +
      pad(date.getMinutes()) +
      ':' +
      pad(date.getSeconds())
    );
  }

  function resolveDetail(orderId, row) {
    if (!global.OrderLiveDetail || typeof global.OrderLiveDetail.resolveDetail !== 'function') return null;
    return global.OrderLiveDetail.resolveDetail(orderId, row || null);
  }

  function readStoredExtra(freight, key) {
    if (!freight) return null;
    var aliases = {
      insure: ['insure', 'insureFee'],
      deliver: ['deliver', 'deliverFee'],
      upstairs: ['upstairs', 'upstairsFee']
    };
    var keys = aliases[key] || [key];
    for (var i = 0; i < keys.length; i++) {
      if (freight[keys[i]] != null) return Number(freight[keys[i]]) || 0;
    }
    return null;
  }

  function allocateByWeights(total, weights) {
    var cents = Math.round(Math.max(0, Number(total) || 0) * 100);
    var safe = (weights || []).map(function (w) {
      return Math.max(0, Number(w) || 0);
    });
    var sum = safe.reduce(function (a, b) {
      return a + b;
    }, 0);
    if (!safe.length || !(cents > 0) || !(sum > 0)) {
      return safe.map(function () {
        return 0;
      });
    }
    var raw = safe.map(function (w) {
      return (w / sum) * cents;
    });
    var floors = raw.map(function (v) {
      return Math.floor(v);
    });
    var used = floors.reduce(function (a, b) {
      return a + b;
    }, 0);
    var remain = cents - used;
    var order = raw
      .map(function (v, i) {
        return { i: i, frac: v - floors[i] };
      })
      .sort(function (a, b) {
        return b.frac - a.frac;
      });
    for (var k = 0; k < remain; k++) {
      floors[order[k % order.length].i] += 1;
    }
    return floors.map(function (v) {
      return v / 100;
    });
  }

  function emptyUsedMap() {
    var map = {};
    CAT_DEFS.forEach(function (def) {
      map[def.key] = 0;
    });
    map.freight = 0;
    return map;
  }

  function addUsed(map, key, amount) {
    if (!key) return;
    map[key] = roundMoney((map[key] || 0) + parseMoney(amount));
  }

  function resolveSplit(detail) {
    if (global.OrderLiveDetail && typeof global.OrderLiveDetail.resolveFreightSplit === 'function') {
      return global.OrderLiveDetail.resolveFreightSplit(detail, detail && detail.amounts);
    }
    return null;
  }

  function resolveCategories(detail, original) {
    var freight = (detail && detail.freight) || {};
    var split = resolveSplit(detail);
    var cats = [];
    CAT_DEFS.forEach(function (def) {
      var amount = 0;
      var visible = false;
      if (def.kind === 'base') {
        if (split) {
          visible = def.key === 'ambient' ? !!split.hasAmbient : !!split.hasCold;
          amount = Number(split[def.key]) || 0;
        } else if (freight[def.key] != null) {
          amount = Number(freight[def.key]) || 0;
          visible = amount > 0;
        }
      } else {
        var stored = readStoredExtra(freight, def.key);
        if (stored == null) return;
        amount = stored;
        visible = amount > 0;
      }
      if (visible || amount > 0) {
        cats.push({
          key: def.key,
          name: def.name,
          original: roundMoney(amount)
        });
      }
    });
    var sum = cats.reduce(function (total, cat) {
      return total + cat.original;
    }, 0);
    if (!cats.length || !(sum > 0)) {
      cats = [
        {
          key: 'freight',
          name: '运费',
          original: original
        }
      ];
      sum = original;
    }
    if (original > 0 && Math.abs(sum - original) >= 0.01) {
      if (sum > original) {
        var scaled = allocateByWeights(
          original,
          cats.map(function (cat) {
            return cat.original;
          })
        );
        cats.forEach(function (cat, idx) {
          cat.original = scaled[idx] || 0;
        });
      } else {
        cats[0].original = roundMoney(cats[0].original + (original - sum));
      }
    }
    return cats.filter(function (cat) {
      return cat.original > 0;
    });
  }

  function readAftersaleParts(item) {
    if (item && Array.isArray(item.freightCats) && item.freightCats.length) {
      return item.freightCats
        .map(function (part) {
          return {
            key: part.key,
            amount: parseMoney(part.amount != null ? part.amount : part.current)
          };
        })
        .filter(function (part) {
          return part.key && part.amount > 0;
        });
    }
    return [];
  }

  function hydratePersistedAftersales(orderId, detail) {
    var store = global.FreightRefundAftersaleStore;
    if (!detail || !store || typeof store.read !== 'function') return;
    var records = store.read().filter(function (record) {
      return isFreightRefund(record) && record.orderNo === orderId;
    });
    if (!records.length) return;

    detail.aftersales = Array.isArray(detail.aftersales) ? detail.aftersales : [];
    var existing = {};
    detail.aftersales.forEach(function (item) {
      if (item && item.id) existing[item.id] = true;
    });
    records
      .slice()
      .reverse()
      .forEach(function (record) {
        if (existing[record.id]) return;
        var amount = parseMoney(record.applyAmount);
        detail.aftersales.unshift({
          id: record.id,
          refundNo: record.refundNo,
          productName: '订单运费',
          type: REFUND_TYPE,
          refundScene: REFUND_SCENE,
          status: record.status || '退款中',
          returnQty: '-',
          refundAmount: '¥' + formatMoney(amount),
          refundSubtotal: '¥' + formatMoney(amount),
          refundAlipay: record.refundAlipay || '¥0.00',
          refundWechat: record.refundWechat || '¥0.00',
          refundWallet: record.refundWallet || '¥0.00',
          refundCoupon: '¥0.00',
          refundPoints: 0,
          adjustAmount: '¥0.00',
          reason: REFUND_REASON,
          desc: record.desc || '-',
          refundMode: record.refundMode || 'total',
          freightCats: record.freightCats || []
        });
        existing[record.id] = true;
      });
  }

  function getSummary(orderId, row) {
    var detail = resolveDetail(orderId, row);
    hydratePersistedAftersales(orderId, detail);
    var freight = detail && detail.freight ? detail.freight : {};
    var original = parseMoney(freight.original != null ? freight.original : freight.total);
    if (!(original > 0) && detail && detail.amounts) {
      original = parseMoney(detail.amounts.shipping);
    }
    var refunded = Math.min(original, Math.max(0, parseMoney(freight.refunded)));
    var aftersales = detail && Array.isArray(detail.aftersales) ? detail.aftersales : [];
    var refundedByCat = emptyUsedMap();
    var pendingByCat = emptyUsedMap();
    var storedRefunded = freight.refundedByCat || {};
    Object.keys(storedRefunded).forEach(function (key) {
      addUsed(refundedByCat, key, storedRefunded[key]);
    });
    var pending = aftersales.reduce(
      function (total, item) {
        if (!isFreightRefund(item) || item.status !== '退款中') return total;
        var amount = parseMoney(item.refundSubtotal != null ? item.refundSubtotal : item.refundAmount);
        var parts = readAftersaleParts(item);
        if (parts.length) {
          parts.forEach(function (part) {
            addUsed(pendingByCat, part.key, part.amount);
          });
        } else {
          addUsed(pendingByCat, '__unassigned', amount);
        }
        return total + amount;
      },
      0
    );
    pending = Math.min(Math.max(0, original - refunded), Math.max(0, pending));
    var remaining = Math.max(0, roundMoney(original - refunded - pending));
    var categories = resolveCategories(detail, original);
    var assignedRefunded = categories.reduce(function (total, cat) {
      return total + (refundedByCat[cat.key] || 0);
    }, 0);
    if (!Object.keys(storedRefunded).length || Math.abs(assignedRefunded - refunded) >= 0.01) {
      var refundParts = allocateByWeights(
        refunded,
        categories.map(function (cat) {
          return cat.original;
        })
      );
      categories.forEach(function (cat, idx) {
        refundedByCat[cat.key] = refundParts[idx] || 0;
      });
    }
    var unassignedPending = pendingByCat.__unassigned || 0;
    if (unassignedPending > 0) {
      var pendingParts = allocateByWeights(
        unassignedPending,
        categories.map(function (cat) {
          return Math.max(0, cat.original - (refundedByCat[cat.key] || 0));
        })
      );
      categories.forEach(function (cat, idx) {
        addUsed(pendingByCat, cat.key, pendingParts[idx]);
      });
    }
    categories.forEach(function (cat) {
      cat.refunded = Math.min(cat.original, Math.max(0, refundedByCat[cat.key] || 0));
      cat.pending = Math.min(
        Math.max(0, cat.original - cat.refunded),
        Math.max(0, pendingByCat[cat.key] || 0)
      );
      cat.remaining = Math.max(0, roundMoney(cat.original - cat.refunded - cat.pending));
    });
    var catRemain = categories.reduce(function (total, cat) {
      return total + cat.remaining;
    }, 0);
    if (Math.abs(catRemain - remaining) >= 0.01 && categories.length) {
      categories[categories.length - 1].remaining = Math.max(
        0,
        roundMoney(categories[categories.length - 1].remaining + (remaining - catRemain))
      );
    }
    return {
      orderId: orderId,
      original: original,
      refunded: refunded,
      pending: pending,
      remaining: remaining,
      categories: categories,
      detail: detail
    };
  }

  function rowStatus(row) {
    var tag = row
      ? row.querySelector('.order-status-cell .order-tag') || row.querySelector('td:nth-last-child(2) .order-tag')
      : null;
    return tag ? tag.textContent.trim() : '';
  }

  function isDeliveryRow(row) {
    if (!row) return false;
    if (row.getAttribute('data-fulfillment-mode') === 'warehouse') return true;
    var tag = row.querySelector('.order-tag--scene');
    return !!(tag && tag.textContent.trim() === '配送');
  }

  function isFreightRefundBlockedStatus(status) {
    return status === '待支付' || status === '交易失败' || status === '订单失败';
  }

  /** 配送单除待支付、订单失败外显示入口；快递单不显示 */
  function canShow(orderId, row) {
    if (!document.body || document.body.getAttribute('data-order-page') !== 'proxy') return false;
    if (!isDeliveryRow(row)) return false;
    return !isFreightRefundBlockedStatus(rowStatus(row));
  }

  function canRefund(orderId, row) {
    if (!canShow(orderId, row)) return false;
    var summary = getSummary(orderId, row);
    return summary.original > 0 && summary.remaining > 0;
  }

  function close() {
    var backdrop = document.getElementById('orderFreightRefundBackdrop');
    var shouldRestoreFocus = !!backdrop;
    if (backdrop) backdrop.remove();
    if (keydownHandler) {
      document.removeEventListener('keydown', keydownHandler);
      keydownHandler = null;
    }
    if (
      !document.getElementById('orderDetailBackdrop') &&
      !document.getElementById('orderPlatformAsBackdrop')
    ) {
      document.body.style.overflow = '';
    }
    if (shouldRestoreFocus && previousFocus && previousFocus.isConnected) {
      previousFocus.focus();
    }
    if (shouldRestoreFocus) previousFocus = null;
  }

  function amountCard(label, amount, key, mod) {
    return (
      '<div class="order-as-kv' +
      (mod ? ' ' + mod : '') +
      '">' +
      '<span class="order-as-kv__k">' +
      label +
      '</span>' +
      '<strong class="order-as-kv__v" data-freight-amount="' +
      key +
      '">¥' +
      formatMoney(amount) +
      '</strong>' +
      '</div>'
    );
  }

  function categoryTableHtml(summary) {
    var rows = summary.categories
      .map(function (cat) {
        return (
          '<tr data-freight-cat-row="' +
          escapeHtml(cat.key) +
          '">' +
          '<td>' +
          escapeHtml(cat.name) +
          '</td>' +
          '<td>¥' +
          formatMoney(cat.original) +
          '</td>' +
          '<td>¥' +
          formatMoney(cat.refunded + cat.pending) +
          '</td>' +
          '<td>¥' +
          formatMoney(cat.remaining) +
          '</td>' +
          '<td class="is-cat-only"><input class="order-as-field__control" data-freight-cat="' +
          escapeHtml(cat.key) +
          '" type="text" inputmode="decimal" value="' +
          formatMoney(cat.remaining) +
          '" ' +
          (cat.remaining > 0 ? '' : 'readonly ') +
          'autocomplete="off"></td>' +
          '</tr>'
        );
      })
      .join('');
    return (
      '<div class="order-freight-refund-cats">' +
      '<div class="order-freight-refund-cats__head">' +
      '<h4 class="order-freight-refund-cats__title">运费组成</h4>' +
      '<span class="order-freight-refund-cats__hint">按现有计价规则拆开：常温 / 冷链基础运费，以及保价、派送、上楼等实收类目。</span>' +
      '</div>' +
      '<table class="order-freight-refund-table">' +
      '<thead><tr><th>类目</th><th>原始</th><th>已退 / 处理中</th><th>剩余可退</th><th class="is-cat-only">本次退</th></tr></thead>' +
      '<tbody>' +
      rows +
      '</tbody>' +
      '<tfoot><tr><td>总运费</td><td>¥' +
      formatMoney(summary.original) +
      '</td><td>¥' +
      formatMoney(summary.refunded + summary.pending) +
      '</td><td>¥' +
      formatMoney(summary.remaining) +
      '</td><td class="is-cat-only" data-freight-cat-sum>¥' +
      formatMoney(summary.remaining) +
      '</td></tr></tfoot>' +
      '</table></div>'
    );
  }

  function appendFreightAftersale(detail, amount, desc, payload) {
    var payChannel = detail.tags && detail.tags.payChannel;
    var alipay = payChannel === '支付宝' ? amount : 0;
    var wechat = payChannel === '微信' ? amount : 0;
    var wallet = payChannel === '钱包' ? amount : 0;
    detail.aftersales = Array.isArray(detail.aftersales) ? detail.aftersales : [];
    var aftersaleId = 'AS-FREIGHT-' + Date.now();
    var aftersale = {
      id: aftersaleId,
      refundNo: 'RF-' + String(aftersaleId).slice(-12),
      productName: '订单运费',
      type: REFUND_TYPE,
      refundScene: REFUND_SCENE,
      status: '退款中',
      returnQty: '-',
      refundAmount: '¥' + formatMoney(amount),
      refundSubtotal: '¥' + formatMoney(amount),
      refundAlipay: '¥' + formatMoney(alipay),
      refundWechat: '¥' + formatMoney(wechat),
      refundWallet: '¥' + formatMoney(wallet),
      refundCoupon: '¥0.00',
      refundPoints: 0,
      adjustAmount: '¥0.00',
      reason: REFUND_REASON,
      desc: desc,
      refundMode: payload.mode,
      freightCats: payload.cats
    };
    detail.aftersales.unshift(aftersale);
    return aftersale;
  }

  function applyPrototypeRefund(summary, amount, desc, payload) {
    var detail = summary.detail;
    var aftersale = appendFreightAftersale(detail, amount, desc, payload);
    detail.freight = detail.freight || {};
    detail.freight.original = summary.original;
    detail.freight.refunded = summary.refunded;
    detail.freight.pending = roundMoney(summary.pending + amount);
    detail.freight.remaining = Math.max(0, roundMoney(summary.remaining - amount));
    var pendingByCat = Object.assign({}, detail.freight.pendingByCat || {});
    payload.parts.forEach(function (part) {
      pendingByCat[part.key] = roundMoney((pendingByCat[part.key] || 0) + part.amount);
    });
    detail.freight.pendingByCat = pendingByCat;
    if (global.FreightRefundAftersaleStore) {
      var deliveryType = detail.delivery && detail.delivery.type;
      var fulfillment = deliveryType === 'PICKUP' ? '自提' : deliveryType === 'DELIVERY' ? '配送' : '快递';
      var createdAt = nowText();
      global.FreightRefundAftersaleStore.add({
        id: aftersale.id,
        refundNo: aftersale.refundNo,
        source: '运营代用户发起',
        type: REFUND_TYPE,
        refundScene: REFUND_SCENE,
        status: '退款中',
        orderSource: '代采',
        liveSession: (detail.tags && detail.tags.livePeriod) || '-',
        fulfillment: fulfillment,
        nickname: (detail.customer && detail.customer.nickname) || '-',
        phone: (detail.customer && detail.customer.phone) || '-',
        store: (detail.delivery && detail.delivery.store) || '-',
        storeAddress: (detail.delivery && detail.delivery.address) || '-',
        productName: '订单运费',
        productSpec: '-',
        productSku: '-',
        applyAmount: formatMoney(amount),
        approveAmount: formatMoney(amount),
        refundExecStatus: '退款执行中',
        actualAmount: '0.00',
        couponAmount: '0.00',
        pointsAmount: 0,
        reason: REFUND_REASON,
        desc: desc,
        approver: '超级管理员',
        settleStatus: '待结算',
        occurTime: createdAt,
        approveTime: createdAt,
        applyTime: createdAt,
        updateTime: createdAt,
        orderNo: summary.orderId,
        orderTime: (detail.progress && detail.progress.submitTime) || '-',
        orderAmount: parseMoney(detail.amounts && detail.amounts.payable),
        orderStatus: (detail.progress && detail.progress.status) || '-',
        payChannel: (detail.tags && detail.tags.payChannel) || '-',
        originalFreight: summary.original,
        refundedFreight: summary.refunded,
        pendingFreight: roundMoney(summary.pending + amount),
        refundMode: payload.mode,
        freightCats: payload.cats,
        refundAlipay: aftersale.refundAlipay,
        refundWechat: aftersale.refundWechat,
        refundWallet: aftersale.refundWallet
      });
    }
  }

  function collectCategoryParts(summary, backdrop) {
    return summary.categories.map(function (cat) {
      var input = backdrop.querySelector('[data-freight-cat="' + cat.key + '"]');
      return {
        key: cat.key,
        name: cat.name,
        original: cat.original,
        refunded: cat.refunded,
        pending: cat.pending,
        remaining: cat.remaining,
        amount: input ? parseMoney(input.value) : 0
      };
    });
  }

  function allocateTotalParts(summary, amount) {
    var weights = summary.categories.map(function (cat) {
      return cat.remaining;
    });
    var allocated = allocateByWeights(amount, weights);
    return summary.categories.map(function (cat, idx) {
      return {
        key: cat.key,
        name: cat.name,
        original: cat.original,
        refunded: cat.refunded,
        pending: cat.pending,
        remaining: cat.remaining,
        amount: allocated[idx] || 0
      };
    });
  }

  function snapshotCats(parts) {
    return parts
      .filter(function (part) {
        return part.amount > 0;
      })
      .map(function (part) {
        return {
          key: part.key,
          name: part.name,
          original: part.original,
          refunded: part.refunded,
          pending: part.pending,
          remaining: part.remaining,
          amount: part.amount,
          current: part.amount
        };
      });
  }

  function applyAuto(orderId, row, desc) {
    var summary = getSummary(orderId, row);
    if (!(summary.remaining > 0) || !summary.detail) return 0;
    var amount = summary.remaining;
    var parts = allocateTotalParts(summary, amount);
    applyPrototypeRefund(summary, amount, desc || '订单商品已全部仅退款，运费随最后一笔自动退还', {
      mode: 'total',
      parts: parts.filter(function (part) {
        return part.amount > 0;
      }),
      cats: snapshotCats(parts)
    });
    return amount;
  }

  function open(orderId, row) {
    close();
    previousFocus = document.activeElement;
    var summary = getSummary(orderId, row);
    if (!canRefund(orderId, row)) {
      if (typeof global.showToast === 'function') global.showToast('当前订单暂无可退运费', 'error');
      return;
    }
    var payChannel = summary.detail && summary.detail.tags && summary.detail.tags.payChannel;
    var refundChannel = payChannel && payChannel !== '-' ? payChannel + '（原路退回）' : '原路退回';

    var backdrop = document.createElement('div');
    backdrop.className = 'store-drawer-backdrop order-as-drawer-backdrop';
    backdrop.id = 'orderFreightRefundBackdrop';
    backdrop.innerHTML =
      '<aside class="store-drawer order-as-drawer" id="orderFreightRefundDrawer" role="dialog" aria-modal="true" aria-labelledby="orderFreightRefundTitle" data-freight-mode="total">' +
      '<div class="store-drawer__header order-as-drawer__header">' +
      '<h2 class="store-drawer__title" id="orderFreightRefundTitle">退运费</h2>' +
      '<button type="button" class="store-drawer__close" data-freight-close aria-label="关闭">&times;</button>' +
      '</div>' +
      '<div class="store-drawer__body order-as-drawer__body">' +
      '<div class="order-freight-refund-tip" role="note"><span class="order-freight-refund-tip__icon" aria-hidden="true">i</span>' +
      '<span>仅配送单可退运费（待支付、订单失败除外）。按订单实收计价类目拆开，可按总额退或按类目退。发货前整单取消、以及全部商品仅退款完成时，运费会自动退还，无需再走本入口。</span></div>' +
      '<div class="order-as-occur"><span class="order-as-occur__label">售后发生时间</span>' +
      '<div class="order-as-occur__value"><span class="order-as-occur__icon" aria-hidden="true">🕒</span>' +
      '<span>' +
      escapeHtml(nowText()) +
      '</span></div></div>' +
      '<h3 class="order-as-section-title">运费信息</h3>' +
      '<article class="order-as-item is-selected" aria-label="订单运费退款信息">' +
      '<div class="order-as-item__meta">' +
      '<div class="order-as-kv"><span class="order-as-kv__k">订单号</span><span class="order-as-kv__v">' +
      escapeHtml(orderId) +
      '</span></div>' +
      amountCard('原始总运费', summary.original, 'original') +
      amountCard('退款处理中', summary.pending, 'pending') +
      amountCard('累计成功退运费', summary.refunded, 'refunded') +
      amountCard('剩余可退运费', summary.remaining, 'remaining') +
      '</div>' +
      categoryTableHtml(summary) +
      '<div class="order-as-form">' +
      '<div class="order-freight-refund-mode" role="radiogroup" aria-label="退款方式">' +
      '<label class="order-freight-refund-mode__item"><input type="radio" name="freightRefundMode" value="total" checked>' +
      '<span>按总额退</span></label>' +
      '<label class="order-freight-refund-mode__item"><input type="radio" name="freightRefundMode" value="category">' +
      '<span>按类目退</span></label></div>' +
      '<p class="order-as-form-hint is-total-only">填写本次退还总额，系统按各类目剩余可退比例分摊到常温、冷链、保价、派送、上楼。</p>' +
      '<p class="order-as-form-hint is-cat-only">按计价类目分别填写本次退款，单类目不能超过其剩余可退。</p>' +
      '<div class="order-as-form__row order-as-form__row--4">' +
      '<label class="order-as-field is-total-only"><span class="order-as-field__label"><i>*</i>本次退运费</span>' +
      '<input class="order-as-field__control" id="orderFreightRefundAmount" name="freightRefundAmount" type="text" inputmode="decimal" value="' +
      formatMoney(summary.remaining) +
      '" autocomplete="off"></label>' +
      '<label class="order-as-field"><span class="order-as-field__label">申请类型</span>' +
      '<input class="order-as-field__control" name="aftersaleType" type="text" value="' +
      REFUND_TYPE +
      '" readonly></label>' +
      '<label class="order-as-field"><span class="order-as-field__label">退款原因</span>' +
      '<input class="order-as-field__control" id="orderFreightRefundReason" name="freightRefundReason" type="text" value="' +
      REFUND_REASON +
      '" readonly></label>' +
      '<label class="order-as-field"><span class="order-as-field__label">退款渠道</span>' +
      '<input class="order-as-field__control" name="refundChannel" type="text" value="' +
      escapeHtml(refundChannel) +
      '" readonly></label>' +
      '</div>' +
      '<div class="order-as-form__row">' +
      '<label class="order-as-field"><span class="order-as-field__label"><i>*</i>售后描述</span>' +
      '<span class="order-as-textarea-wrap"><textarea class="order-as-field__control order-as-field__textarea" id="orderFreightRefundDesc" name="freightRefundDesc" maxlength="200" placeholder="请填写退运费说明"></textarea>' +
      '<span class="order-as-textarea-count" data-freight-desc-count>0/200</span></span></label>' +
      '</div>' +
      '<p class="order-freight-refund-error" id="orderFreightRefundError" role="alert"></p>' +
      '</div>' +
      '<div class="order-as-item__foot">运费与采购款同时分账且全部分给平台；本操作仅退还订单运费，不改变商品售后状态及原采购款分账结果。</div>' +
      '</article>' +
      '<label class="order-freight-refund-confirm" for="orderFreightRefundConfirm">' +
      '<input type="checkbox" id="orderFreightRefundConfirm" data-freight-confirm>' +
      '<span>我已确认以上退运费信息无误（提交后将生成退款单，退款成功后不可撤回）</span>' +
      '</label>' +
      '</div>' +
      '<div class="order-as-drawer__footer">' +
      '<div class="order-as-drawer__summary">本次退运费 <em data-freight-submit-total>¥' +
      formatMoney(summary.remaining) +
      '</em></div>' +
      '<div class="order-as-drawer__actions"><button type="button" class="order-detail-btn" data-freight-close>取消</button>' +
      '<button type="button" class="order-detail-btn order-detail-btn--primary" data-freight-submit disabled>提交</button></div>' +
      '</div></aside>';

    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';

    backdrop.addEventListener('click', function (event) {
      if (event.target === backdrop || event.target.closest('[data-freight-close]')) close();
    });

    var drawer = document.getElementById('orderFreightRefundDrawer');
    var amountInput = document.getElementById('orderFreightRefundAmount');
    var descInput = document.getElementById('orderFreightRefundDesc');
    var confirmInput = document.getElementById('orderFreightRefundConfirm');
    var submitButton = backdrop.querySelector('[data-freight-submit]');
    var error = document.getElementById('orderFreightRefundError');
    var totalEl = backdrop.querySelector('[data-freight-submit-total]');
    var catSumEl = backdrop.querySelector('[data-freight-cat-sum]');

    function currentMode() {
      var checked = backdrop.querySelector('input[name="freightRefundMode"]:checked');
      return checked && checked.value === 'category' ? 'category' : 'total';
    }

    function currentAmountAndParts() {
      var mode = currentMode();
      if (mode === 'category') {
        var parts = collectCategoryParts(summary, backdrop);
        var amount = roundMoney(
          parts.reduce(function (total, part) {
            return total + part.amount;
          }, 0)
        );
        return { mode: mode, amount: amount, parts: parts };
      }
      var total = parseMoney(amountInput.value);
      return { mode: mode, amount: total, parts: allocateTotalParts(summary, total) };
    }

    function setMode(mode) {
      if (drawer) drawer.setAttribute('data-freight-mode', mode);
      var radio = backdrop.querySelector('input[name="freightRefundMode"][value="' + mode + '"]');
      if (radio) radio.checked = true;
    }

    function syncModeSwitch(nextMode) {
      var prev = drawer ? drawer.getAttribute('data-freight-mode') : 'total';
      if (nextMode === 'category' && prev === 'total') {
        var allocated = allocateTotalParts(summary, parseMoney(amountInput.value));
        allocated.forEach(function (part) {
          var input = backdrop.querySelector('[data-freight-cat="' + part.key + '"]');
          if (input && !input.readOnly) input.value = formatMoney(part.amount);
        });
      }
      if (nextMode === 'total' && prev === 'category') {
        var parts = collectCategoryParts(summary, backdrop);
        var sum = roundMoney(
          parts.reduce(function (total, part) {
            return total + part.amount;
          }, 0)
        );
        amountInput.value = formatMoney(sum);
      }
      setMode(nextMode);
    }

    function updateSubmitState() {
      var latest = currentAmountAndParts();
      var message = '';
      if (latest.mode === 'category') {
        latest.parts.forEach(function (part) {
          if (part.amount < 0) message = message || part.name + '不能为负数';
          if (part.amount > part.remaining + 0.0001) {
            message = message || part.name + '不能超过剩余可退 ¥' + formatMoney(part.remaining);
          }
        });
        if (!message && !(latest.amount > 0)) message = '请至少填写一个类目的退款金额';
      } else if (!(latest.amount > 0)) {
        message = '本次退运费必须大于 ¥0.00';
      } else if (latest.amount > summary.remaining + 0.0001) {
        message = '本次退运费不能超过剩余可退运费 ¥' + formatMoney(summary.remaining);
      }
      error.textContent = message;
      totalEl.textContent = '¥' + formatMoney(latest.amount);
      if (catSumEl) catSumEl.textContent = '¥' + formatMoney(latest.amount);
      submitButton.disabled = !!message || !confirmInput.checked;
    }

    backdrop.querySelectorAll('input[name="freightRefundMode"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        syncModeSwitch(radio.value === 'category' ? 'category' : 'total');
        updateSubmitState();
      });
    });
    amountInput.addEventListener('input', updateSubmitState);
    amountInput.addEventListener('change', updateSubmitState);
    backdrop.querySelectorAll('[data-freight-cat]').forEach(function (input) {
      input.addEventListener('input', updateSubmitState);
      input.addEventListener('change', updateSubmitState);
    });
    confirmInput.addEventListener('change', updateSubmitState);
    descInput.addEventListener('input', function () {
      backdrop.querySelector('[data-freight-desc-count]').textContent = descInput.value.length + '/200';
    });
    keydownHandler = function (event) {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', keydownHandler);

    submitButton.addEventListener('click', function () {
      var latest = getSummary(orderId, row);
      var draft = currentAmountAndParts();
      var desc = document.getElementById('orderFreightRefundDesc').value.trim();
      error.textContent = '';
      if (draft.mode === 'category') {
        var invalid = '';
        draft.parts.forEach(function (part) {
          var live = latest.categories.filter(function (cat) {
            return cat.key === part.key;
          })[0];
          var remain = live ? live.remaining : 0;
          if (part.amount > remain + 0.0001) {
            invalid = invalid || part.name + '不能超过剩余可退 ¥' + formatMoney(remain);
          }
        });
        if (invalid) {
          error.textContent = invalid;
          return;
        }
        if (!(draft.amount > 0)) {
          error.textContent = '请至少填写一个类目的退款金额';
          return;
        }
      } else {
        if (!(draft.amount > 0)) {
          error.textContent = '本次退运费必须大于 ¥0.00';
          return;
        }
        if (draft.amount > latest.remaining + 0.0001) {
          error.textContent = '本次退运费不能超过剩余可退运费 ¥' + formatMoney(latest.remaining);
          return;
        }
        draft.parts = allocateTotalParts(latest, draft.amount);
      }
      if (!desc) {
        error.textContent = '请填写退款说明';
        return;
      }
      if (!confirmInput.checked) {
        error.textContent = '请先确认退运费信息无误';
        updateSubmitState();
        return;
      }

      applyPrototypeRefund(latest, draft.amount, desc, {
        mode: draft.mode,
        parts: draft.parts.filter(function (part) {
          return part.amount > 0;
        }),
        cats: snapshotCats(draft.parts)
      });
      close();
      if (global.OrderProxyList && typeof global.OrderProxyList.refreshActionLayout === 'function') {
        global.OrderProxyList.refreshActionLayout();
      }
      if (typeof global.showToast === 'function') {
        global.showToast('退运费申请已提交（原型演示）', 'success');
      }
    });

    requestAnimationFrame(function () {
      backdrop.classList.add('is-open');
      if (drawer) drawer.classList.add('is-open');
      amountInput.focus();
      amountInput.select();
    });
  }

  global.OrderFreightRefund = {
    canShow: canShow,
    canRefund: canRefund,
    getSummary: getSummary,
    resolveCategories: resolveCategories,
    applyAuto: applyAuto,
    open: open,
    close: close
  };
})(typeof window !== 'undefined' ? window : this);
