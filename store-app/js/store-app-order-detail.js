/**
 * 核销详情页：
 * 1. 一码多订单：支持勾选核销与单品核销；
 * 2. 扫码展示已截单且允许核销的待发货/待收货/待提货订单；
 * 3. 已全部完成时：显示"全部已完成"提示；
 * 4. 订单管理批量核销：多用户分组展示，核销规则与扫码一致；
 * 5. 移除预约收货时间字段。
 */
(function () {
  var content = document.getElementById("detail-content");
  var btnBack = document.getElementById("btn-back");

  var raw = sessionStorage.getItem("pendingVerifyOrder");
  var orderData;
  if (raw) {
    try {
      orderData = JSON.parse(raw);
    } catch (e) {
      content.innerHTML = '<div class="detail-empty">订单数据异常</div>';
      return;
    }
  } else if (window.LFMockData && window.LFMockData.pendingVerifyOrder) {
    orderData = JSON.parse(JSON.stringify(window.LFMockData.pendingVerifyOrder));
  } else {
    content.innerHTML = '<div class="detail-empty">无订单信息，请从工作台扫码进入</div>';
    return;
  }

  var isMultiUser = orderData.mode === "multi-user";
  var groups;
  if (isMultiUser && Array.isArray(orderData.groups) && orderData.groups.length) {
    groups = orderData.groups;
  } else {
    groups = [{
      shared: orderData.shared || {},
      orders: (orderData.orders || []).slice(),
    }];
  }
  var shared = (groups[0] && groups[0].shared) || {};
  var orders = [];
  groups.forEach(function (g) {
    (g.orders || []).forEach(function (o) {
      orders.push(o);
    });
  });

  var titleEl = document.getElementById("detail-title");
  if (titleEl && isMultiUser) titleEl.textContent = "批量核销";
  if (isMultiUser) document.title = "批量核销 · 门店APP";

  function getItemRefund(item) {
    if (!item) return null;
    if (item.refund) return item.refund;
    if (item.refunded || item.refundQty != null || item.refundAmount != null) {
      return {
        returnQty: item.refundQty != null ? item.refundQty : item.qty,
        refundAmount: item.refundAmount != null ? item.refundAmount : item.price * item.qty,
      };
    }
    return null;
  }

  function getRemainingQty(item) {
    var refund = getItemRefund(item);
    if (!refund) return item.qty;
    return Math.max(0, item.qty - refund.returnQty);
  }

  function getTotalPickupQty(item) {
    return getRemainingQty(item);
  }

  function getVerifiedQty(item) {
    return item._verifiedQty || 0;
  }

  function getPendingPickupQty(item) {
    return Math.max(0, getTotalPickupQty(item) - getVerifiedQty(item));
  }

  function isSelectableItem(item) {
    return getPendingPickupQty(item) > 0 && !isApprovedAftersaleItem(item);
  }

  function getDisplayQty(item) {
    return getPendingPickupQty(item);
  }

  function getOrderPickupAmount(o) {
    return o.items.reduce(function (sum, item) {
      var qty = getDisplayQty(item);
      if (qty <= 0) return sum;
      return sum + item.price * qty;
    }, 0);
  }

  function isItemPickupDone(item) {
    return getPendingPickupQty(item) <= 0;
  }

  var APPROVED_AFTERSALE_STATUSES = ["退款中", "待退货", "待收货", "退款异常"];

  function getItemAftersaleStatus(item) {
    if (!item) return "";
    if (item.refundStatus) return item.refundStatus;
    if (item.aftersaleStatus) return item.aftersaleStatus;
    if (item.refunding) return "退款中";
    return "";
  }

  function isApprovedAftersaleItem(item) {
    return APPROVED_AFTERSALE_STATUSES.indexOf(getItemAftersaleStatus(item)) !== -1;
  }

  function isPendingAftersaleItem(item) {
    return getItemAftersaleStatus(item) === "待审批";
  }

  function isRefundingItem(item) {
    return isApprovedAftersaleItem(item) || isPendingAftersaleItem(item);
  }

  function getItemAftersaleTag(item) {
    if (!isRefundingItem(item)) return "";
    return '<span class="detail-item__status-tag detail-item__status-tag--refunding">退款中</span>';
  }

  function getPickupAmount(item) {
    return item.price * getPendingPickupQty(item);
  }

  function getPendingItems() {
    var list = [];
    orders.forEach(function (o) {
      o.items.forEach(function (item, idx) {
        if (isSelectableItem(item)) {
          list.push({ orderId: o.id, itemIdx: idx, item: item });
        }
      });
    });
    return list;
  }

  function getSelectedItems() {
    var list = [];
    orders.forEach(function (o) {
      o.items.forEach(function (item, idx) {
        if (item._checked && isSelectableItem(item)) {
          list.push({ orderId: o.id, itemIdx: idx, item: item });
        }
      });
    });
    return list;
  }

  function getSelectedAmount() {
    return getSelectedItems().reduce(function (sum, entry) {
      return sum + getPickupAmount(entry.item);
    }, 0);
  }

  function hasPendingAftersaleSelected() {
    return getSelectedItems().some(function (entry) {
      return isPendingAftersaleItem(entry.item);
    });
  }

  function hasApprovedAftersaleSelected() {
    return getSelectedItems().some(function (entry) {
      return isApprovedAftersaleItem(entry.item);
    });
  }

  function isOrderAllChecked(o) {
    var selectable = o.items.filter(isSelectableItem);
    if (selectable.length === 0) return false;
    return selectable.every(function (item) { return item._checked; });
  }

  function isOrderFullyPickedUp(o) {
    var pickable = o.items.filter(function (item) {
      return getTotalPickupQty(item) > 0;
    });
    if (pickable.length === 0) return true;
    return pickable.every(isItemPickupDone);
  }

  function getVisibleOrders() {
    return orders.filter(function (o) {
      return !isOrderFullyPickedUp(o);
    });
  }

  function getItemPickupStatusTag(item) {
    var verifiedQty = getVerifiedQty(item);
    var pendingQty = getPendingPickupQty(item);
    if (verifiedQty <= 0) return "";
    if (pendingQty > 0) {
      return '<span class="detail-item__status-tag detail-item__status-tag--partial-pickup">部分提货' + verifiedQty + "</span>";
    }
    return '<span class="detail-item__status-tag detail-item__status-tag--picked">已提货</span>';
  }

  // 同步 Mock 中商品级退款/退款中信息，避免 sessionStorage 缓存导致数据缺失
  (function syncRefundFromMock() {
    var mock = window.LFMockData;
    if (!mock) return;
    var sources = (mock.pendingVerifyOrder && mock.pendingVerifyOrder.orders || []).concat(mock.orders || []);
    orders.forEach(function (o) {
      var matched = sources.find(function (m) { return m.orderNo === o.orderNo; });
      if (!matched) return;

      o.items.forEach(function (item, idx) {
        var mockItem = matched.items && matched.items[idx];
        if (!mockItem) return;
        if (!getItemRefund(item) && getItemRefund(mockItem)) {
          item.refund = getItemRefund(mockItem);
        }
        if (!isRefundingItem(item) && isRefundingItem(mockItem)) {
          item.refunding = mockItem.refunding;
          item.refundStatus = mockItem.refundStatus;
        }
        if (mockItem._verifiedQty != null && item._verifiedQty == null) {
          item._verifiedQty = mockItem._verifiedQty;
          item._lastVerifyTime = mockItem._lastVerifyTime;
        }
      });

      // 兼容旧版订单级退款：按金额匹配到对应商品
      if (matched.refund && !o.items.some(getItemRefund)) {
        var target = o.items.find(function (it) {
          return it.price === matched.refund.refundAmount || it.price * it.qty === matched.refund.refundAmount;
        });
        if (target) target.refund = matched.refund;
      }
    });
  })();

  orders.forEach(function (o) {
    o.items.forEach(function (item) {
      if (item._checked === undefined) {
        item._checked = isSelectableItem(item);
      }
    });
  });

  var STATUS_TAG_CLASS = {
    待收货: "detail-tag--pending",
    待提货: "detail-tag--pickup",
    待取货: "detail-tag--pickup",
    已完成: "detail-tag--done",
    部分核销: "detail-tag--partial",
    已取货: "detail-tag--done",
  };

  /* ---- 渲染每个子订单卡片 ---- */
  function renderOrderCard(o) {
    var isVerified = o.status === "已完成";
    var hasSelectableItems = o.items.some(isSelectableItem);
    var tagClass = STATUS_TAG_CLASS[o.status] || "";
    var allChecked = isOrderAllChecked(o);
    var orderCb = hasSelectableItems
      ? '<input type="checkbox" class="order-cb" data-order-id="' + o.id + '" ' + (allChecked ? "checked" : "") + ' />'
      : "";

    // 商品行
    var itemsHtml = "";
    o.items.forEach(function (item, idx) {
      var totalQty = getTotalPickupQty(item);
      if (totalQty <= 0) return;

      var verifiedQty = getVerifiedQty(item);
      var pendingQty = getPendingPickupQty(item);
      var itemDone = pendingQty <= 0;
      var itemPartial = verifiedQty > 0 && pendingQty > 0;
      var itemCanVerify = isSelectableItem(item);
      var itemCb = itemCanVerify
        ? '<input type="checkbox" class="item-cb" data-order-id="' + o.id + '" data-item-idx="' + idx + '" ' + (item._checked ? "checked" : "") + ' />'
        : "";
      var aftersale = isRefundingItem(item);
      var approvedAftersale = isApprovedAftersaleItem(item);
      var itemClass =
        "detail-item" +
        (itemDone ? " detail-item--done" : "") +
        (itemPartial ? " detail-item--partial" : "") +
        (aftersale ? " detail-item--refunding" : "");
      var tagHtml = getItemPickupStatusTag(item);
      if (aftersale) tagHtml += getItemAftersaleTag(item);
      var metaHtml = "x" + totalQty + " · ¥" + item.price;
      var displayAmount = item.price * (itemDone ? totalQty : pendingQty);
      var actionHtml = itemCanVerify || (approvedAftersale && pendingQty > 0)
        ? '<button type="button" class="detail-item__verify-btn" data-order-id="' + o.id + '" data-item-idx="' + idx + '">核销</button>'
        : "";

      itemsHtml +=
        "<div class=\"" + itemClass + "\">" +
        itemCb +
        '<img class="detail-item__img" src="' + (item.image || "https://placehold.co/80x80/f5f5f5/999?text=商品") + '" alt="' + item.name + '" />' +
        '<div class="detail-item__info">' +
        '<div class="detail-item__name' + (itemDone ? " detail-item__name--done" : "") + '">' + item.name + tagHtml + "</div>" +
        '<div class="detail-item__meta">' + metaHtml + "</div>" +
        "</div>" +
        '<div class="detail-item__aside">' +
        '<div class="detail-item__sub' + (itemDone ? " detail-item__sub--done" : "") + '">¥' + displayAmount.toFixed(2) + (itemDone ? " ✓" : "") + "</div>" +
        actionHtml +
        "</div>" +
        "</div>";
    });

    // 核销时间
    var verifyTimeHtml = "";
    if (isVerified && o.verifyTime) {
      verifyTimeHtml =
        '<div class="detail-info-row detail-info-row--sub">' +
        '<span class="detail-info-row__label">核销时间</span>' +
        '<span class="detail-info-row__value detail-info-row__value--done">' + o.verifyTime + "</span>" +
        "</div>";
    }

    return (
      '<div class="detail-order-card' + (isVerified ? " detail-order-card--done" : "") + '" data-order-id="' + o.id + '">' +
      // 卡片头部
      '<div class="detail-order-card__head">' +
      '<div class="detail-order-card__title-row">' +
      orderCb +
      '<span class="detail-tag ' + tagClass + '">' + o.status + "</span>" +
      "</div>" +
      '<div class="detail-order-card__meta">' +
      '<span class="detail-order-card__orderno">订单号：' + (o.orderNo || "—") + "</span>" +
      '<span class="detail-order-card__time">下单时间：' + (o.createdAt || "—") + "</span>" +
      "</div>" +
      "</div>" +
      // 商品列表
      '<div class="detail-items-list">' + itemsHtml + "</div>" +
      // 底部金额 + 核销时间
      '<div class="detail-order-card__footer">' +
      verifyTimeHtml +
      '<div class="detail-order-card__amount-row">' +
      '<span class="detail-amount-label">订单金额</span>' +
      '<span class="detail-amount-value">¥' + getOrderPickupAmount(o).toFixed(2) + "</span>" +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  function renderBuyerCard(buyer) {
    buyer = buyer || {};
    return (
      '<div class="detail-buyer-card">' +
      '<div class="detail-buyer-row">' +
      '<span class="detail-buyer-row__label">买家姓名</span>' +
      '<span class="detail-buyer-row__value">' + (buyer.customer || "—") + "</span>" +
      "</div>" +
      '<div class="detail-buyer-row">' +
      '<span class="detail-buyer-row__label">手机号码</span>' +
      '<a href="tel:' + (buyer.phone || "").replace(/\*+/g, "0") + '" class="detail-buyer-row__value detail-buyer-row__value--link">' + (buyer.phone || "—") + "</a>" +
      "</div>" +
      "</div>"
    );
  }

  function renderAll() {
    var allOrdersDone = orders.length > 0 && orders.every(isOrderFullyPickedUp);
    var doneHint = isMultiUser ? "所选订单已全部核销" : "该核销码下全部订单已完成";

    var hasRemainingPickup = orders.some(function (o) {
      return (o.items || []).some(function (item) {
        return getPendingPickupQty(item) > 0;
      });
    });
    var selCount = getSelectedItems().length;
    var selAmount = getSelectedAmount();
    var ordersHtml = "";

    groups.forEach(function (g) {
      var visible = (g.orders || []).filter(function (o) {
        return !isOrderFullyPickedUp(o);
      });
      if (visible.length === 0 && !allOrdersDone) return;
      if (visible.length === 0) return;
      ordersHtml += '<div class="detail-buyer-group">';
      ordersHtml += renderBuyerCard(g.shared);
      ordersHtml += '<div class="detail-orders-list">';
      visible.forEach(function (o) {
        ordersHtml += renderOrderCard(o);
      });
      ordersHtml += "</div></div>";
    });

    if (!isMultiUser && !ordersHtml) {
      ordersHtml =
        '<div class="detail-buyer-group">' +
        renderBuyerCard(shared) +
        '<div class="detail-orders-list"></div></div>';
    }

    var actionHtml = "";
    if (allOrdersDone || !hasRemainingPickup) {
      actionHtml =
        '<div class="detail-verified-hint">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>' +
        "<span>" + doneHint + "</span>" +
        "</div>";
    } else {
      actionHtml =
        '<div class="detail-action-bar">' +
        '<span class="detail-action-tip">已选 <strong id="sel-count">' + selCount + '</strong> 件商品，合计 ¥<strong id="sel-amount">' + selAmount.toFixed(2) + "</strong></span>" +
        '<button type="button" class="detail-verify-btn detail-verify-btn--small" id="btn-verify-selected"' + (selCount === 0 ? " disabled" : "") + ">确认核销</button>" +
        "</div>";
    }

    content.innerHTML =
      '<div class="detail-card">' +
      ordersHtml +
      actionHtml +
      "</div>";

    bindEvents();
  }

  var verifyConfirmModal = document.getElementById("verify-confirm-modal");
  var verifyCancelBtn = document.getElementById("btn-verify-cancel");
  var verifyConfirmBtn = document.getElementById("btn-verify-confirm");
  var verifyBlockedModal = document.getElementById("verify-blocked-modal");
  var verifyBlockedOkBtn = document.getElementById("btn-verify-blocked-ok");
  var pickupQtyModal = document.getElementById("pickup-qty-modal");
  var pickupQtyInput = document.getElementById("pickup-qty-input");
  var pickupQtyHint = document.getElementById("pickup-qty-hint");
  var pickupQtyItemName = document.getElementById("pickup-qty-item-name");
  var pickupQtyMinusBtn = document.getElementById("pickup-qty-minus");
  var pickupQtyPlusBtn = document.getElementById("pickup-qty-plus");
  var pickupQtyCancelBtn = document.getElementById("btn-pickup-qty-cancel");
  var pickupQtyConfirmBtn = document.getElementById("btn-pickup-qty-confirm");
  var pendingSingleVerify = null;
  var pendingSelectedVerify = false;
  var pendingPickupQty = 1;

  function openVerifyConfirmModal() {
    if (!verifyConfirmModal) return;
    verifyConfirmModal.classList.add("is-open");
    verifyConfirmModal.setAttribute("aria-hidden", "false");
  }

  function closeVerifyConfirmModal() {
    if (!verifyConfirmModal) return;
    verifyConfirmModal.classList.remove("is-open");
    verifyConfirmModal.setAttribute("aria-hidden", "true");
    pendingSingleVerify = null;
    pendingSelectedVerify = false;
    pendingPickupQty = 1;
  }

  function openVerifyBlockedModal() {
    if (!verifyBlockedModal) return;
    verifyBlockedModal.classList.add("is-open");
    verifyBlockedModal.setAttribute("aria-hidden", "false");
  }

  function closeVerifyBlockedModal() {
    if (!verifyBlockedModal) return;
    verifyBlockedModal.classList.remove("is-open");
    verifyBlockedModal.setAttribute("aria-hidden", "true");
  }

  function persistOrderToMock(order) {
    var mock = window.LFMockData && window.LFMockData.orders;
    if (!mock) return;
    var target = mock.find(function (m) {
      return m.id === order.id || m.orderNo === order.orderNo;
    });
    if (!target) return;
    (target.items || []).forEach(function (item, idx) {
      var src = order.items[idx];
      if (!src) return;
      if (src._verifiedQty != null) item._verifiedQty = src._verifiedQty;
      if (src._lastVerifyTime) item._lastVerifyTime = src._lastVerifyTime;
      if (src._verified) item._verified = src._verified;
      if (src._verifyTime) item._verifyTime = src._verifyTime;
      if (src.refunding === false) {
        item.refunding = false;
        item.refundStatus = null;
      }
    });
    if (isOrderFullyPickedUp(order)) {
      target.status = "已完成";
      target.verifyTime = order.verifyTime;
    } else if (order.items.some(function (item) {
      return getVerifiedQty(item) > 0 || item._verified;
    })) {
      target.status = "部分核销";
    }
    if (typeof window.LFSaveStoreOrders === "function") window.LFSaveStoreOrders();
  }

  function persistSession() {
    if (!orderData) return;
    if (isMultiUser) {
      orderData.groups = groups;
    } else {
      orderData.orders = orders;
      orderData.shared = shared;
    }
    try {
      sessionStorage.setItem("pendingVerifyOrder", JSON.stringify(orderData));
    } catch (e) {
      /* ignore */
    }
  }

  function updateOrderStatus(order, verifyTime) {
    if (isOrderFullyPickedUp(order)) {
      order.verifyTime = verifyTime;
    }
    persistOrderToMock(order);
    persistSession();
  }

  function getVerifyTime() {
    var now = new Date();
    var pad = function (n) { return String(n).padStart(2, "0"); };
    return now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate()) + " " + pad(now.getHours()) + ":" + pad(now.getMinutes());
  }

  function markItemVerified(item, qty, verifyTime) {
    var totalQty = getTotalPickupQty(item);
    var nextVerifiedQty = getVerifiedQty(item) + qty;
    item._verifiedQty = Math.min(nextVerifiedQty, totalQty);
    item._lastVerifyTime = verifyTime;
    item._checked = getPendingPickupQty(item) > 0 ? item._checked : false;

    if (getPendingPickupQty(item) <= 0) {
      item._verified = true;
      item._verifyTime = verifyTime;
    }

    if (isRefundingItem(item)) {
      item.refunding = false;
      item.refundStatus = null;
    }
  }

  function performVerifyItem(orderId, itemIdx, pickupQty) {
    var order = orders.find(function (o) { return o.id === orderId; });
    if (!order || order.items[itemIdx] === undefined) return;

    var item = order.items[itemIdx];
    if (!isSelectableItem(item)) return;

    var qty = pickupQty || getPendingPickupQty(item);
    qty = Math.min(Math.max(1, qty), getPendingPickupQty(item));
    var verifyTime = getVerifyTime();

    markItemVerified(item, qty, verifyTime);
    updateOrderStatus(order, verifyTime);

    renderAll();
    if (window.LFToast) {
      var verifiedQty = getVerifiedQty(item);
      var msg = getPendingPickupQty(item) > 0 ? "部分提货" + verifiedQty : "已提货";
      window.LFToast.show(msg);
    }
  }

  function performVerifySelected() {
    var selected = getSelectedItems();
    if (selected.length === 0) return;

    var verifyTime = getVerifyTime();

    var touchedOrders = {};
    selected.forEach(function (entry) {
      markItemVerified(entry.item, getPendingPickupQty(entry.item), verifyTime);
      touchedOrders[entry.orderId] = true;
    });

    orders.forEach(function (o) {
      if (touchedOrders[o.id]) updateOrderStatus(o, verifyTime);
    });

    renderAll();
    if (window.LFToast) {
      window.LFToast.show("核销成功");
    }
  }

  function closePickupQtyModal() {
    if (!pickupQtyModal) return;
    pickupQtyModal.classList.remove("is-open");
    pickupQtyModal.setAttribute("aria-hidden", "true");
    pendingSingleVerify = null;
    pendingPickupQty = 1;
  }

  function openPickupQtyModal(orderId, itemIdx) {
    if (!pickupQtyModal) return;
    var order = orders.find(function (o) { return o.id === orderId; });
    if (!order || order.items[itemIdx] === undefined) return;

    var item = order.items[itemIdx];
    var pendingQty = getPendingPickupQty(item);
    if (pendingQty <= 0) return;

    pendingSingleVerify = { orderId: orderId, itemIdx: itemIdx };
    pendingPickupQty = pendingQty;

    if (pickupQtyItemName) pickupQtyItemName.textContent = item.name;
    if (pickupQtyInput) {
      pickupQtyInput.min = "1";
      pickupQtyInput.max = String(pendingQty);
      pickupQtyInput.value = String(pendingQty);
    }
    if (pickupQtyHint) {
      pickupQtyHint.textContent = "共 " + getTotalPickupQty(item) + " 件，已提货 " + getVerifiedQty(item) + " 件，本次最多可提 " + pendingQty + " 件";
    }

    pickupQtyModal.classList.add("is-open");
    pickupQtyModal.setAttribute("aria-hidden", "false");
  }

  function getPickupQtyInputValue() {
    if (!pickupQtyInput || !pendingSingleVerify) return 1;
    var order = orders.find(function (o) { return o.id === pendingSingleVerify.orderId; });
    if (!order) return 1;
    var item = order.items[pendingSingleVerify.itemIdx];
    if (!item) return 1;

    var maxQty = getPendingPickupQty(item);
    var value = parseInt(pickupQtyInput.value, 10);
    if (isNaN(value) || value < 1) value = 1;
    if (value > maxQty) value = maxQty;
    pickupQtyInput.value = String(value);
    return value;
  }

  function requestVerifyItem(orderId, itemIdx) {
    var order = orders.find(function (o) { return o.id === orderId; });
    if (!order || order.items[itemIdx] === undefined) return;

    var item = order.items[itemIdx];
    if (isApprovedAftersaleItem(item)) {
      openVerifyBlockedModal();
      return;
    }
    if (!isSelectableItem(item)) return;

    var totalQty = getTotalPickupQty(item);
    if (totalQty > 1) {
      openPickupQtyModal(orderId, itemIdx);
      return;
    }

    if (isPendingAftersaleItem(item)) {
      pendingSelectedVerify = false;
      pendingPickupQty = 1;
      pendingSingleVerify = { orderId: orderId, itemIdx: itemIdx };
      openVerifyConfirmModal();
    } else {
      performVerifyItem(orderId, itemIdx, 1);
    }
  }

  function confirmPickupQtyVerify() {
    if (!pendingSingleVerify) return;

    var target = {
      orderId: pendingSingleVerify.orderId,
      itemIdx: pendingSingleVerify.itemIdx,
    };
    var qty = getPickupQtyInputValue();
    var order = orders.find(function (o) { return o.id === target.orderId; });
    var item = order && order.items[target.itemIdx];
    var needsRefundConfirm = item && isPendingAftersaleItem(item);

    closePickupQtyModal();

    if (!item || !isSelectableItem(item)) return;

    if (needsRefundConfirm) {
      pendingPickupQty = qty;
      pendingSingleVerify = target;
      openVerifyConfirmModal();
      return;
    }

    performVerifyItem(target.orderId, target.itemIdx, qty);
  }

  function requestVerifySelected() {
    if (getSelectedItems().length === 0) return;

    if (hasApprovedAftersaleSelected()) {
      openVerifyBlockedModal();
      return;
    }

    if (hasPendingAftersaleSelected()) {
      pendingSingleVerify = null;
      pendingSelectedVerify = true;
      openVerifyConfirmModal();
    } else {
      performVerifySelected();
    }
  }

  function bindEvents() {
    content.querySelectorAll(".order-cb").forEach(function (cb) {
      cb.addEventListener("change", function () {
        var orderId = cb.dataset.orderId;
        var order = orders.find(function (o) { return o.id === orderId; });
        if (order) {
          order.items.forEach(function (item) {
            if (isSelectableItem(item)) item._checked = cb.checked;
          });
          renderAll();
        }
      });
    });

    content.querySelectorAll(".item-cb").forEach(function (cb) {
      cb.addEventListener("change", function () {
        var orderId = cb.dataset.orderId;
        var itemIdx = parseInt(cb.dataset.itemIdx, 10);
        var order = orders.find(function (o) { return o.id === orderId; });
        if (order && order.items[itemIdx] !== undefined) {
          order.items[itemIdx]._checked = cb.checked;
          renderAll();
        }
      });
    });

    content.querySelectorAll(".detail-item__verify-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        requestVerifyItem(btn.dataset.orderId, parseInt(btn.dataset.itemIdx, 10));
      });
    });

    var verifySelectedBtn = document.getElementById("btn-verify-selected");
    if (verifySelectedBtn) {
      verifySelectedBtn.addEventListener("click", requestVerifySelected);
    }

    if (btnBack) {
      btnBack.addEventListener("click", function (e) {
        e.preventDefault();
        history.back();
      });
    }
  }

  if (verifyCancelBtn) {
    verifyCancelBtn.addEventListener("click", closeVerifyConfirmModal);
  }

  if (verifyConfirmBtn) {
    verifyConfirmBtn.addEventListener("click", function () {
      var singleTarget = pendingSingleVerify;
      var selectedBatch = pendingSelectedVerify;
      var qty = pendingPickupQty;
      closeVerifyConfirmModal();
      if (singleTarget) {
        performVerifyItem(singleTarget.orderId, singleTarget.itemIdx, qty);
      } else if (selectedBatch) {
        performVerifySelected();
      }
    });
  }

  if (pickupQtyCancelBtn) {
    pickupQtyCancelBtn.addEventListener("click", closePickupQtyModal);
  }

  if (pickupQtyConfirmBtn) {
    pickupQtyConfirmBtn.addEventListener("click", confirmPickupQtyVerify);
  }

  if (pickupQtyMinusBtn) {
    pickupQtyMinusBtn.addEventListener("click", function () {
      if (!pickupQtyInput) return;
      pickupQtyInput.value = String(Math.max(1, getPickupQtyInputValue() - 1));
    });
  }

  if (pickupQtyPlusBtn) {
    pickupQtyPlusBtn.addEventListener("click", function () {
      if (!pickupQtyInput || !pendingSingleVerify) return;
      var order = orders.find(function (o) { return o.id === pendingSingleVerify.orderId; });
      var item = order && order.items[pendingSingleVerify.itemIdx];
      if (!item) return;
      pickupQtyInput.value = String(Math.min(getPendingPickupQty(item), getPickupQtyInputValue() + 1));
    });
  }

  if (pickupQtyInput) {
    pickupQtyInput.addEventListener("change", getPickupQtyInputValue);
  }

  if (pickupQtyModal) {
    pickupQtyModal.addEventListener("click", function (e) {
      if (e.target === pickupQtyModal) closePickupQtyModal();
    });
  }

  if (verifyConfirmModal) {
    verifyConfirmModal.addEventListener("click", function (e) {
      if (e.target === verifyConfirmModal) closeVerifyConfirmModal();
    });
  }
  if (verifyBlockedOkBtn) {
    verifyBlockedOkBtn.addEventListener("click", closeVerifyBlockedModal);
  }
  if (verifyBlockedModal) {
    verifyBlockedModal.addEventListener("click", function (e) {
      if (e.target === verifyBlockedModal) closeVerifyBlockedModal();
    });
  }

  renderAll();
})();
