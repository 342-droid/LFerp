/**
 * 门店订单列表（Mock）+ 排队中记录
 */
(function () {
  var data = window.LFMockData;
  var root = document.getElementById("order-list");
  var emptyEl = document.getElementById("order-list-empty");
  var tabBtns = document.querySelectorAll(".order-tabs__btn");
  var searchInput = document.getElementById("order-search-input");
  var queueSubTabs = document.getElementById("queue-sub-tabs");
  var queueSubBtns = queueSubTabs ? queueSubTabs.querySelectorAll(".queue-sub-tabs__btn") : [];
  if (!data || !root) return;

  var allOrders = data.orders || [];
  var allQueueRecords = data.queueRecords || [];
  var currentStatus = "全部";
  var currentQueueFilter = "全部";
  var currentKeyword = "";
  var batchMode = false;
  var selectedItems = {};
  var btnOrdersBack = document.getElementById("btn-orders-back");
  var btnBatchCancel = document.getElementById("btn-batch-cancel");
  var btnBatchEnter = document.getElementById("btn-batch-enter");
  var btnBatchSelectAll = document.getElementById("btn-batch-select-all");
  var ordersTitle = document.getElementById("orders-title");
  var batchBar = document.getElementById("batch-bar");
  var batchCountEl = document.getElementById("batch-count");
  var btnBatchGo = document.getElementById("btn-batch-go");
  var verifyConfirmModal = document.getElementById("verify-confirm-modal");
  var verifyCancelBtn = document.getElementById("btn-verify-cancel");
  var verifyConfirmBtn = document.getElementById("btn-verify-confirm");
  var verifyBlockedModal = document.getElementById("verify-blocked-modal");
  var verifyBlockedOkBtn = document.getElementById("btn-verify-blocked-ok");

  (function parseTabParam() {
    var params = new URLSearchParams(window.location.search);
    var tab = params.get("tab");
    if (tab && ["全部", "待收货", "待提货", "已完成", "排队中"].indexOf(tab) !== -1) {
      currentStatus = tab;
    }
  })();

  var STATUS_TAG_CLASS = {
    待发货: "order-card__tag--ship",
    待收货: "order-card__tag--pending",
    待提货: "order-card__tag--pickup",
    已完成: "order-card__tag--done",
    部分核销: "order-card__tag--partial",
  };

  var PICKUP_ORDER_STATUSES = ["待提货", "部分核销"];

  function isQueueMode() {
    return currentStatus === "排队中";
  }

  function textIncludes(hay, needle) {
    return String(hay || "").toLowerCase().indexOf(String(needle || "").toLowerCase()) !== -1;
  }

  function getMatchedItemIndexes(o, keyword) {
    var idxs = [];
    (o.items || []).forEach(function (item, idx) {
      if (textIncludes(item.name, keyword)) idxs.push(idx);
    });
    return idxs;
  }

  function isItemVisible(o, idx) {
    return !o._visibleItemIdxs || o._visibleItemIdxs.indexOf(idx) !== -1;
  }

  function getFilteredOrders(status, keyword) {
    var list = allOrders;
    if (status === "待提货") {
      list = list.filter(function (o) {
        return o.status === "待提货" || o.status === "部分核销";
      });
    } else if (status !== "全部") {
      list = list.filter(function (o) { return o.status === status; });
    }
    if (keyword) {
      list = list.filter(function (o) {
        var buyerHit = textIncludes(o.customer, keyword) || textIncludes(o.phone, keyword);
        var itemHit = getMatchedItemIndexes(o, keyword).length > 0;
        return buyerHit || itemHit;
      }).map(function (o) {
        var itemIdxs = getMatchedItemIndexes(o, keyword);
        if (itemIdxs.length === 0) return o;
        var copy = Object.assign({}, o);
        copy._visibleItemIdxs = itemIdxs;
        return copy;
      });
    }
    return list;
  }

  function getFilteredQueueRecords(filter, keyword) {
    var list = allQueueRecords;
    if (filter === "已到店") {
      list = list.filter(function (q) {
        return q.source === "scan" && q.queueStatus === "已到店";
      });
    } else if (filter === "未到店") {
      list = list.filter(function (q) {
        return q.source === "appointment" && q.queueStatus === "未到店";
      });
    }
    if (keyword) {
      list = list.filter(function (q) {
        return q.customer.indexOf(keyword) !== -1 || q.phone.indexOf(keyword) !== -1;
      });
    }
    return list;
  }

  function getItemVerifiedQty(item) {
    return item._verifiedQty || 0;
  }

  function getItemPendingQty(item) {
    return Math.max(0, item.qty - getItemVerifiedQty(item));
  }

  function isItemFullyPicked(item) {
    if (item._verified) return true;
    return getItemVerifiedQty(item) > 0 && getItemPendingQty(item) <= 0;
  }

  function getItemPickupTag(item, orderStatus) {
    if (PICKUP_ORDER_STATUSES.indexOf(orderStatus) === -1) return "";
    var verifiedQty = getItemVerifiedQty(item);
    var pendingQty = getItemPendingQty(item);
    if (verifiedQty > 0 && pendingQty > 0) {
      return '<span class="order-card__item-pickup-tag order-card__item-pickup-tag--partial">部分提货' + verifiedQty + "</span>";
    }
    return "";
  }

  function renderOrderCard(o) {
    var card = document.createElement("article");
    card.className = "order-card";
    card.setAttribute("data-order-id", o.id);

    if (batchMode) {
      if (isVerifiableOrder(o)) {
        card.classList.add("is-batch-selectable");
        if (isOrderAnySelected(o)) card.classList.add("is-selected");
      } else {
        card.classList.add("is-batch-disabled");
      }
    }

    var tagClass = STATUS_TAG_CLASS[o.status] || "";
    var statusTag =
      '<span class="order-card__tag ' + tagClass + '">' + o.status + "</span>";

    var itemsHtml = "";
    o.items.forEach(function (item, idx) {
      if (!isItemVisible(o, idx)) return;
      var fullyPicked = isItemFullyPicked(item);
      var selectable = batchMode && isVerifiableOrder(o) && isItemSelectable(item);
      var selected = selectable && isItemSelected(o.id, idx);
      var blocked = batchMode && isVerifiableOrder(o) && isApprovedAftersaleItem(item) && getItemSelectableQty(item) > 0;
      var doneClass = fullyPicked ? " order-card__item--done" : "";
      var itemClass = "order-card__item" + doneClass +
        (selectable ? " is-item-selectable" : "") +
        (selected ? " is-item-selected" : "") +
        (blocked ? " is-item-blocked" : "");
      var doneMark = fullyPicked ? " ✓" : "";
      var pickupTag = getItemPickupTag(item, o.status);
      var aftersaleTag = getItemAftersaleTag(item);
      var specText = formatItemSpec(item.spec);
      var imgSrc = item.image || "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=160&h=160&fit=crop";
      var itemCb = selectable
        ? '<input type="checkbox" class="order-card__item-cb" data-order-id="' + o.id + '" data-item-idx="' + idx + '" ' + (selected ? "checked" : "") + " />"
        : "";
      itemsHtml +=
        '<div class="' + itemClass + '" data-order-id="' + o.id + '" data-item-idx="' + idx + '">' +
        itemCb +
        '<img class="order-card__item-img" src="' + escapeHtml(imgSrc) + '" alt="" />' +
        '<div class="order-card__item-main">' +
        '<div class="order-card__item-name' + (fullyPicked ? " order-card__item-name--done" : "") + '"><span class="order-card__item-name-text">' + escapeHtml(item.name) + "</span>" + pickupTag + aftersaleTag + "</div>" +
        (specText ? '<div class="order-card__item-spec">' + escapeHtml(specText) + "</div>" : "") +
        "</div>" +
        '<span class="order-card__item-qty">x' + item.qty + "</span>" +
        '<span class="order-card__item-price' + (fullyPicked ? " order-card__item-price--done" : "") + '">¥' + item.price + doneMark + "</span>" +
        "</div>";
    });

    var refundHtml = "";
    if (o.status === "待提货" && o.refund && !o._visibleItemIdxs) {
      refundHtml =
        '<div class="order-card__refund">' +
        "<span>退款数量：" + o.refund.returnQty + "</span>" +
        "<span>退款金额：¥" + o.refund.refundAmount.toFixed(2) + "</span>" +
        "</div>";
    }

    var extraHtml = "";
    if (o.status === "已完成") {
      o.items.forEach(function (item, idx) {
        if (!isItemVisible(o, idx)) return;
        var t = item._verifyTime || o.verifyTime || "—";
        extraHtml +=
          '<div class="order-card__item-verify">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>' +
          '<span class="order-card__item-verify-name">' + item.name + '</span>' +
          '<span class="order-card__item-verify-time">' + t + "</span>" +
          "</div>";
      });
    }

    if (o.status === "部分核销") {
      var doneItems = o.items.filter(function (item, idx) {
        return item._verified && isItemVisible(o, idx);
      });
      doneItems.forEach(function (item) {
        var t = item._verifyTime || "—";
        extraHtml +=
          '<div class="order-card__item-verify order-card__item-verify--partial">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>' +
          '<span class="order-card__item-verify-name">' + item.name + '</span>' +
          '<span class="order-card__item-verify-time">' + t + "</span>" +
          "</div>";
      });
    }

    if (o.status === "待提货") {
      o.items.forEach(function (item, idx) {
        if (!isItemVisible(o, idx)) return;
        var verifiedQty = getItemVerifiedQty(item);
        var pendingQty = getItemPendingQty(item);
        if (verifiedQty <= 0) return;
        var t = item._lastVerifyTime || item._verifyTime || "—";
        var timeText = pendingQty > 0 ? "部分提货" + verifiedQty + " · " + t : t;
        extraHtml +=
          '<div class="order-card__item-verify">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>' +
          '<span class="order-card__item-verify-name">' + item.name + "</span>" +
          '<span class="order-card__item-verify-time">' + timeText + "</span>" +
          "</div>";
      });
    }

    var checkHtml = "";
    if (batchMode && isVerifiableOrder(o) && getOrderSelectableItems(o).length > 0) {
      checkHtml =
        '<label class="order-card__check">' +
        '<input type="checkbox" class="order-card__cb" data-order-id="' + o.id + '" ' +
        (isOrderAllSelected(o) ? "checked" : "") + " />" +
        "</label>";
    }

    card.innerHTML =
      '<div class="order-card__header">' +
      '<div class="order-card__header-left">' +
      checkHtml +
      '<span class="order-card__no">' + o.orderNo + "</span>" +
      "</div>" +
      statusTag +
      "</div>" +
      '<div class="order-card__body">' +
      '<div class="order-card__meta">' +
      '<span>下单时间：' + o.createdAt + "</span>" +
      '<span class="order-card__amount">¥' + o.amount.toFixed(2) + "</span>" +
      "</div>" +
      refundHtml +
      '<div class="order-card__items">' + itemsHtml + "</div>" +
      '<div class="order-card__customer">' +
      '<span>买家：' + o.customer + "</span>" +
      '<button type="button" class="order-card__call-btn" data-phone="' + o.phone + '" aria-label="拨打 ' + o.phone + '">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />' +
      "</svg>" +
      '<span class="order-card__phone">' + o.phone + "</span>" +
      "</button>" +
      "</div>" +
      (extraHtml ? '<div class="order-card__extra-list">' + extraHtml + "</div>" : "") +
      "</div>";

    return card;
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatItemSpec(spec) {
    var text = String(spec || "").trim();
    if (!text) return "";
    return /^规格[:：]/.test(text) ? text : "规格：" + text;
  }

  var VERIFIABLE_STATUSES = ["待发货", "待收货", "待提货", "部分核销"];

  function isVerifiableOrder(o) {
    if (!o || VERIFIABLE_STATUSES.indexOf(o.status) === -1) return false;
    if (window.LFStoreVerifyPolicy && typeof window.LFStoreVerifyPolicy.isVerifiable === "function") {
      return window.LFStoreVerifyPolicy.isVerifiable(o);
    }
    return o.status === "待提货" || o.status === "部分核销";
  }

  function itemKey(orderId, idx) {
    return orderId + ":" + idx;
  }

  function getItemRefundQty(item) {
    if (item && item.refund && item.refund.returnQty != null) return item.refund.returnQty;
    if (item && item.refundQty != null) return item.refundQty;
    return 0;
  }

  function getItemSelectableQty(item) {
    return Math.max(0, item.qty - getItemRefundQty(item) - getItemVerifiedQty(item));
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
    return '<span class="order-card__item-refunding-tag">退款中</span>';
  }

  function isItemSelectable(item) {
    return getItemSelectableQty(item) > 0 && !isApprovedAftersaleItem(item);
  }

  function isItemSelected(orderId, idx) {
    return !!selectedItems[itemKey(orderId, idx)];
  }

  function getOrderSelectableItems(o) {
    var list = [];
    (o.items || []).forEach(function (item, idx) {
      if (!isItemVisible(o, idx)) return;
      if (isItemSelectable(item)) list.push({ item: item, idx: idx });
    });
    return list;
  }

  function isOrderAllSelected(o) {
    var selectable = getOrderSelectableItems(o);
    return selectable.length > 0 && selectable.every(function (entry) {
      return isItemSelected(o.id, entry.idx);
    });
  }

  function isOrderAnySelected(o) {
    return getOrderSelectableItems(o).some(function (entry) {
      return isItemSelected(o.id, entry.idx);
    });
  }

  function copyItemForVerify(item) {
    var copy = {
      name: item.name,
      qty: item.qty,
      price: item.price,
      image: item.image || "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=160&h=160&fit=crop",
    };
    if (item.spec) copy.spec = item.spec;
    if (item.refund) copy.refund = JSON.parse(JSON.stringify(item.refund));
    if (item.refunded) copy.refunded = item.refunded;
    if (item.refundQty != null) copy.refundQty = item.refundQty;
    if (item.refundAmount != null) copy.refundAmount = item.refundAmount;
    if (item.refunding) copy.refunding = item.refunding;
    if (item.refundStatus) copy.refundStatus = item.refundStatus;
    if (item._verified) copy._verified = item._verified;
    if (item._verifyTime) copy._verifyTime = item._verifyTime;
    if (item._verifiedQty != null) copy._verifiedQty = item._verifiedQty;
    if (item._lastVerifyTime) copy._lastVerifyTime = item._lastVerifyTime;
    if (item._checked != null) copy._checked = item._checked;
    return copy;
  }

  function copyOrderForVerify(o, selectedIdxs) {
    return {
      id: o.id,
      orderNo: o.orderNo,
      createdAt: o.createdAt,
      status: o.status,
      cutoff: o.cutoff,
      amount: o.amount,
      customer: o.customer,
      phone: o.phone,
      items: (o.items || []).map(function (item, idx) {
        var copy = copyItemForVerify(item);
        if (selectedIdxs) copy._checked = selectedIdxs.indexOf(idx) !== -1 && isItemSelectable(item);
        return copy;
      }),
    };
  }

  function getVisibleVerifiableOrders() {
    return getFilteredOrders(currentStatus, currentKeyword).filter(function (o) {
      return isVerifiableOrder(o) && getOrderSelectableItems(o).length > 0;
    });
  }

  function getVisibleSelectableEntries() {
    var list = [];
    getVisibleVerifiableOrders().forEach(function (o) {
      getOrderSelectableItems(o).forEach(function (entry) {
        list.push({ order: o, idx: entry.idx, item: entry.item });
      });
    });
    return list;
  }

  function getSelectedCount() {
    return getVisibleSelectableEntries().filter(function (entry) {
      return isItemSelected(entry.order.id, entry.idx);
    }).length;
  }

  function getSelectedOrdersWithItems() {
    var byId = {};
    var list = [];
    getVisibleSelectableEntries().forEach(function (entry) {
      if (!isItemSelected(entry.order.id, entry.idx)) return;
      var orderId = entry.order.id;
      var idx = entry.idx;
      var order = allOrders.find(function (o) { return o.id === orderId; });
      if (!order || !isVerifiableOrder(order) || !order.items[idx] || !isItemSelectable(order.items[idx])) return;
      if (!byId[orderId]) {
        byId[orderId] = { order: order, idxs: [] };
        list.push(byId[orderId]);
      }
      byId[orderId].idxs.push(idx);
    });
    return list;
  }

  function buildBatchVerifyPayload(selected) {
    var groupsMap = {};
    var keys = [];
    selected.forEach(function (entry) {
      var o = entry.order;
      var key = o.phone || o.customer || o.id;
      if (!groupsMap[key]) {
        groupsMap[key] = {
          shared: { customer: o.customer, phone: o.phone },
          orders: [],
        };
        keys.push(key);
      }
      groupsMap[key].orders.push(copyOrderForVerify(o, entry.idxs));
    });
    return {
      mode: "multi-user",
      groups: keys.map(function (k) { return groupsMap[k]; }),
    };
  }

  function updateBatchBar() {
    var count = getSelectedCount();
    if (batchCountEl) batchCountEl.textContent = String(count);
    if (btnBatchGo) btnBatchGo.disabled = count === 0;
    if (btnBatchSelectAll) {
      var visible = getVisibleSelectableEntries();
      var allSelected = visible.length > 0 && visible.every(function (entry) {
        return isItemSelected(entry.order.id, entry.idx);
      });
      btnBatchSelectAll.textContent = allSelected ? "取消全选" : "全选";
    }
  }

  function updateBatchUI() {
    if (btnBatchCancel) btnBatchCancel.hidden = !batchMode;
    if (btnBatchEnter) btnBatchEnter.hidden = batchMode || isQueueMode();
    if (btnBatchSelectAll) btnBatchSelectAll.hidden = !batchMode;
    if (batchBar) batchBar.hidden = !batchMode;
    if (ordersTitle) ordersTitle.textContent = batchMode ? "选择商品" : "门店订单";
    updateBatchBar();
  }

  function enterBatchMode() {
    if (isQueueMode()) return;
    if (getVisibleVerifiableOrders().length === 0) {
      window.LFToast && window.LFToast.show("当前没有可核销商品");
      return;
    }
    batchMode = true;
    updateBatchUI();
    doRender();
  }

  function exitBatchMode() {
    batchMode = false;
    selectedItems = {};
    updateBatchUI();
    doRender();
  }

  function setItemSelected(orderId, idx, next) {
    var key = itemKey(orderId, idx);
    if (next) selectedItems[key] = true;
    else delete selectedItems[key];
  }

  function getFilteredOrderById(orderId) {
    return getFilteredOrders(currentStatus, currentKeyword).find(function (o) {
      return o.id === orderId;
    });
  }

  function toggleSelectItem(orderId, idx, force) {
    var order = getFilteredOrderById(orderId) || allOrders.find(function (o) { return o.id === orderId; });
    if (!order || !isVerifiableOrder(order) || !order.items[idx] || !isItemVisible(order, idx) || !isItemSelectable(order.items[idx])) return;
    var next = force !== undefined ? force : !isItemSelected(orderId, idx);
    setItemSelected(orderId, idx, next);
    updateBatchBar();
    doRender();
  }

  function toggleSelectOrder(orderId, force) {
    var order = getFilteredOrderById(orderId) || allOrders.find(function (o) { return o.id === orderId; });
    if (!isVerifiableOrder(order)) return;
    var selectable = getOrderSelectableItems(order);
    if (selectable.length === 0) return;
    var next = force !== undefined ? force : !isOrderAllSelected(order);
    selectable.forEach(function (entry) {
      setItemSelected(orderId, entry.idx, next);
    });
    updateBatchBar();
    doRender();
  }

  function getTotalPickupQty(item) {
    return Math.max(0, item.qty - getItemRefundQty(item));
  }

  function getPendingPickupQty(item) {
    return getItemSelectableQty(item);
  }

  function isOrderFullyPickedUp(order) {
    var pickable = (order.items || []).filter(function (item) {
      return getTotalPickupQty(item) > 0;
    });
    if (pickable.length === 0) return true;
    return pickable.every(function (item) {
      return getPendingPickupQty(item) <= 0;
    });
  }

  function getVerifyTime() {
    var now = new Date();
    var pad = function (n) { return String(n).padStart(2, "0"); };
    return now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate()) + " " + pad(now.getHours()) + ":" + pad(now.getMinutes());
  }

  function markItemVerified(item, qty, verifyTime) {
    var totalQty = getTotalPickupQty(item);
    item._verifiedQty = Math.min(getItemVerifiedQty(item) + qty, totalQty);
    item._lastVerifyTime = verifyTime;
    if (getPendingPickupQty(item) <= 0) {
      item._verified = true;
      item._verifyTime = verifyTime;
    }
    if (isRefundingItem(item)) {
      item.refunding = false;
      item.refundStatus = null;
    }
  }

  function persistVerifiedOrder(order, verifyTime) {
    if (isOrderFullyPickedUp(order)) {
      order.status = "已完成";
      order.verifyTime = verifyTime;
    } else if ((order.items || []).some(function (item) {
      return getItemVerifiedQty(item) > 0 || item._verified;
    })) {
      order.status = "部分核销";
    }
  }

  function hasPendingAftersaleSelected() {
    return getSelectedOrdersWithItems().some(function (entry) {
      return entry.idxs.some(function (idx) {
        return isPendingAftersaleItem(entry.order.items[idx]);
      });
    });
  }

  function hasApprovedAftersaleSelected() {
    return getSelectedOrdersWithItems().some(function (entry) {
      return entry.idxs.some(function (idx) {
        return isApprovedAftersaleItem(entry.order.items[idx]);
      });
    });
  }

  function openVerifyConfirmModal() {
    if (!verifyConfirmModal) return;
    verifyConfirmModal.classList.add("is-open");
    verifyConfirmModal.setAttribute("aria-hidden", "false");
  }

  function closeVerifyConfirmModal() {
    if (!verifyConfirmModal) return;
    verifyConfirmModal.classList.remove("is-open");
    verifyConfirmModal.setAttribute("aria-hidden", "true");
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

  function performBatchVerifySelected() {
    var selected = getSelectedOrdersWithItems();
    if (selected.length === 0) return;

    var verifyTime = getVerifyTime();
    selected.forEach(function (entry) {
      entry.idxs.forEach(function (idx) {
        var item = entry.order.items[idx];
        if (!isItemSelectable(item)) return;
        markItemVerified(item, getPendingPickupQty(item), verifyTime);
      });
      persistVerifiedOrder(entry.order, verifyTime);
    });
    if (typeof window.LFSaveStoreOrders === "function") window.LFSaveStoreOrders();

    selectedItems = {};
    window.LFToast && window.LFToast.show("核销成功");
    if (getVisibleVerifiableOrders().length === 0) {
      exitBatchMode();
    } else {
      updateBatchUI();
      doRender();
    }
  }

  function requestBatchVerify() {
    var selected = getSelectedOrdersWithItems();
    if (selected.length === 0) {
      window.LFToast && window.LFToast.show("请先选择要核销的商品");
      return;
    }
    if (hasApprovedAftersaleSelected()) {
      openVerifyBlockedModal();
      return;
    }
    if (hasPendingAftersaleSelected()) {
      openVerifyConfirmModal();
    } else {
      performBatchVerifySelected();
    }
  }

  function buildVerifyOrderForMember(customer, phone) {
    if (data.verifyOrdersByPhone && data.verifyOrdersByPhone[phone]) {
      var preset = JSON.parse(JSON.stringify(data.verifyOrdersByPhone[phone]));
      preset.orders = (preset.orders || []).filter(isVerifiableOrder);
      return preset.orders.length ? preset : null;
    }

    var verifiable = allOrders.filter(function (o) {
      return o.phone === phone && isVerifiableOrder(o);
    });

    if (verifiable.length === 0) {
      verifiable = allOrders.filter(function (o) {
        return o.customer === customer && isVerifiableOrder(o);
      });
    }

    if (verifiable.length === 0) return null;

    return {
      orderNo: verifiable[0].orderNo,
      shared: { customer: customer, phone: phone },
      orders: verifiable.map(copyOrderForVerify),
    };
  }

  function goToVerifyPage(customer, phone) {
    var verifyData = buildVerifyOrderForMember(customer, phone);
    if (!verifyData) {
      window.LFToast && window.LFToast.show("该用户暂无可核销订单");
      return;
    }
    sessionStorage.setItem("pendingVerifyOrder", JSON.stringify(verifyData));
    window.location.href = "order-detail.html";
  }

  function renderQueueCardHead(q, tags) {
    var tagsHtml = tags
      .map(function (tag) {
        return '<span class="queue-card__tag ' + tag.class + '">' + tag.text + "</span>";
      })
      .join("");
    return (
      '<div class="queue-card__head">' +
      '<div class="queue-card__user">' +
      '<button type="button" class="queue-card__avatar-btn" data-queue-verify data-customer="' + escapeHtml(q.customer) + '" data-phone="' + escapeHtml(q.phone) + '" aria-label="查看' + escapeHtml(q.customer) + '的核销订单">' +
      '<img class="queue-card__avatar" src="' + (q.avatar || "https://placehold.co/80x80/f5f5f5/999?text=客") + '" alt="' + q.customer + '" />' +
      "</button>" +
      '<div class="queue-card__info">' +
      '<div class="queue-card__name">' + q.customer + "</div>" +
      '<div class="queue-card__phone">' + q.phone + "</div>" +
      "</div>" +
      "</div>" +
      '<div class="queue-card__tags">' + tagsHtml + "</div>" +
      "</div>"
    );
  }

  function renderQueueNoteField(q) {
    return (
      '<label class="queue-card__note">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
      '<textarea class="queue-card__note-input" data-queue-id="' + q.id + '" rows="1" placeholder="编辑门店备注">' + escapeHtml(q.note) + "</textarea>" +
      "</label>"
    );
  }

  function renderMemberMessageHtml(q) {
    var msg = (q.memberMessage || "").trim();
    if (!msg) return "";
    return '<div class="queue-card__message">留言：' + escapeHtml(msg) + "</div>";
  }

  function renderArrivedQueueBody(q) {
    return (
      '<div class="queue-card__queue-data">' +
      '<div class="queue-card__queue-no-row">' +
      '<span class="queue-card__queue-label">排队号：</span>' +
      '<span class="queue-card__queue-no">' + (q.queueNo != null ? q.queueNo : "—") + "</span>" +
      "</div>" +
      '<div class="queue-card__arrive-time">到店时间：' + (q.arriveTime || "—") + "</div>" +
      "</div>" +
      renderMemberMessageHtml(q) +
      renderQueueNoteField(q) +
      '<div class="queue-card__meta-row">' +
      "<span>排队时间：" + (q.queueTime || "—") + "</span>" +
      '<span class="queue-card__wait">等待：' + (q.waitMinutes != null ? q.waitMinutes : 0) + "分钟</span>" +
      "</div>"
    );
  }

  function renderArrivedQueueCard(q) {
    var card = document.createElement("article");
    card.className = "queue-card queue-card--arrived";
    card.setAttribute("data-queue-id", q.id);

    card.innerHTML =
      renderQueueCardHead(q, [{ class: "queue-card__tag--arrived", text: q.queueStatus }]) +
      renderArrivedQueueBody(q) +
      '<div class="queue-card__actions">' +
      '<button type="button" class="queue-card__action-btn queue-card__action-btn--outline" data-queue-action="skip" data-queue-id="' + q.id + '">过号</button>' +
      '<button type="button" class="queue-card__action-btn queue-card__action-btn--call" data-queue-action="call" data-queue-id="' + q.id + '">叫号</button>' +
      '<button type="button" class="queue-card__action-btn queue-card__action-btn--done" data-queue-action="done" data-queue-id="' + q.id + '">标记完成</button>' +
      "</div>";

    return card;
  }

  function renderCallingQueueCard(q) {
    var card = document.createElement("article");
    card.className = "queue-card queue-card--arrived queue-card--calling";
    card.setAttribute("data-queue-id", q.id);

    card.innerHTML =
      renderQueueCardHead(q, [
        { class: "queue-card__tag--arrived", text: "已到店" },
        { class: "queue-card__tag--calling", text: "叫号中..." },
      ]) +
      renderArrivedQueueBody(q) +
      '<div class="queue-card__caller">叫号人：' +
      escapeHtml(q.callerName || "店员") +
      " (" +
      (q.callTime || "—") +
      ")</div>" +
      '<div class="queue-card__actions">' +
      '<button type="button" class="queue-card__action-btn queue-card__action-btn--outline" data-queue-action="skip" data-queue-id="' + q.id + '">过号</button>' +
      '<button type="button" class="queue-card__action-btn queue-card__action-btn--cancel-call" data-queue-action="cancel-call" data-queue-id="' + q.id + '">取消叫号</button>' +
      '<button type="button" class="queue-card__action-btn queue-card__action-btn--done" data-queue-action="done" data-queue-id="' + q.id + '">标记完成</button>' +
      "</div>";

    return card;
  }

  function renderAppointmentQueueCard(q) {
    var card = document.createElement("article");
    card.className = "queue-card queue-card--appointment";
    card.setAttribute("data-queue-id", q.id);

    card.innerHTML =
      renderQueueCardHead(q, [{ class: "queue-card__tag--pending", text: q.queueStatus }]) +
      renderQueueNoteField(q) +
      '<div class="queue-card__footer">' +
      "<span class=\"queue-card__time\">预约时间：" + (q.appointmentTime || "—") + "</span>" +
      '<button type="button" class="queue-card__cancel-btn" data-queue-id="' + q.id + '">取消预约</button>' +
      "</div>";

    return card;
  }

  function renderQueueCard(q) {
    if (q.source === "scan") {
      if (q.callStatus === "calling") {
        return renderCallingQueueCard(q);
      }
      return renderArrivedQueueCard(q);
    }
    return renderAppointmentQueueCard(q);
  }

  function formatTimeHM() {
    var now = new Date();
    var hh = String(now.getHours()).padStart(2, "0");
    var mm = String(now.getMinutes()).padStart(2, "0");
    return hh + ":" + mm;
  }

  function clearCallingState(record) {
    delete record.callStatus;
    delete record.callerName;
    delete record.callTime;
  }

  function renderList(items, isQueue) {
    root.innerHTML = "";
    if (emptyEl) {
      emptyEl.textContent = isQueue ? "暂无排队记录" : "暂无此类订单";
      emptyEl.style.display = items.length === 0 ? "block" : "none";
    }
    items.forEach(function (item) {
      root.appendChild(isQueue ? renderQueueCard(item) : renderOrderCard(item));
    });
    if (isQueue) bindQueueNoteInputs();
  }

  function bindQueueNoteInputs() {
    root.querySelectorAll(".queue-card__note-input").forEach(function (input) {
      input.style.height = "auto";
      input.style.height = input.scrollHeight + "px";
    });
  }

  function updateQueueSubTabsUI() {
    if (!queueSubTabs) return;
    queueSubTabs.hidden = !isQueueMode();
    queueSubBtns.forEach(function (btn) {
      var active = btn.getAttribute("data-queue-filter") === currentQueueFilter;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function updateSearchUI() {
    if (!searchInput) return;
    if (isQueueMode()) {
      searchInput.placeholder = "输入手机号或姓名搜索";
    } else {
      searchInput.placeholder = "输入手机号或商品名称搜索";
    }
  }

  function updateQueueTabCount() {
    var queueTab = Array.prototype.find.call(tabBtns, function (btn) {
      return btn.getAttribute("data-status") === "排队中";
    });
    if (!queueTab) return;
    var count = allQueueRecords.length;
    queueTab.textContent = count > 0 ? "排队中(" + count + ")" : "排队中";
  }

  function doRender() {
    updateQueueTabCount();
    updateQueueSubTabsUI();
    updateSearchUI();
    updateBatchUI();
    if (isQueueMode()) {
      renderList(getFilteredQueueRecords(currentQueueFilter, currentKeyword), true);
    } else {
      renderList(getFilteredOrders(currentStatus, currentKeyword), false);
    }
  }

  function switchTab(status) {
    currentStatus = status;
    if (isQueueMode() && batchMode) {
      exitBatchMode();
    }
    if (!isQueueMode()) {
      currentQueueFilter = "全部";
    }
    tabBtns.forEach(function (btn) {
      var active = btn.getAttribute("data-status") === status;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    doRender();
  }

  function switchQueueFilter(filter) {
    currentQueueFilter = filter;
    queueSubBtns.forEach(function (btn) {
      var active = btn.getAttribute("data-queue-filter") === filter;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    doRender();
  }

  tabBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      switchTab(btn.getAttribute("data-status"));
    });
  });

  queueSubBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      switchQueueFilter(btn.getAttribute("data-queue-filter"));
    });
  });

  if (currentStatus !== "全部") {
    switchTab(currentStatus);
  }

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      currentKeyword = searchInput.value.trim();
      doRender();
    });
  }

  root.addEventListener("input", function (e) {
    var input = e.target.closest(".queue-card__note-input");
    if (!input) return;
    input.style.height = "auto";
    input.style.height = input.scrollHeight + "px";
  });

  root.addEventListener(
    "blur",
    function (e) {
      var input = e.target.closest(".queue-card__note-input");
      if (!input) return;
      var qid = input.getAttribute("data-queue-id");
      var record = allQueueRecords.find(function (q) { return q.id === qid; });
      if (record) record.note = input.value.trim();
    },
    true
  );

  if (btnBatchEnter) {
    btnBatchEnter.addEventListener("click", enterBatchMode);
  }
  if (btnBatchCancel) {
    btnBatchCancel.addEventListener("click", exitBatchMode);
  }
  if (btnBatchSelectAll) {
    btnBatchSelectAll.addEventListener("click", function () {
      var visible = getVisibleSelectableEntries();
      var allSelected = visible.length > 0 && visible.every(function (entry) {
        return isItemSelected(entry.order.id, entry.idx);
      });
      visible.forEach(function (entry) {
        setItemSelected(entry.order.id, entry.idx, !allSelected);
      });
      updateBatchBar();
      doRender();
    });
  }
  if (btnBatchGo) {
    btnBatchGo.addEventListener("click", requestBatchVerify);
  }

  if (verifyCancelBtn) {
    verifyCancelBtn.addEventListener("click", closeVerifyConfirmModal);
  }
  if (verifyConfirmBtn) {
    verifyConfirmBtn.addEventListener("click", function () {
      closeVerifyConfirmModal();
      performBatchVerifySelected();
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

  root.addEventListener("change", function (e) {
    if (!batchMode) return;
    var itemCb = e.target.closest(".order-card__item-cb");
    if (itemCb) {
      toggleSelectItem(itemCb.getAttribute("data-order-id"), parseInt(itemCb.getAttribute("data-item-idx"), 10), itemCb.checked);
      return;
    }
    var cb = e.target.closest(".order-card__cb");
    if (!cb) return;
    toggleSelectOrder(cb.getAttribute("data-order-id"), cb.checked);
  });

  root.addEventListener("click", function (e) {
    if (batchMode) {
      if (e.target.closest(".order-card__check") || e.target.closest(".order-card__item-cb")) return;
      var itemRow = e.target.closest(".order-card__item");
      if (itemRow && !e.target.closest(".order-card__call-btn")) {
        var rowOrderId = itemRow.getAttribute("data-order-id");
        var rowItemIdx = parseInt(itemRow.getAttribute("data-item-idx"), 10);
        var rowOrder = getFilteredOrderById(rowOrderId) || allOrders.find(function (o) { return o.id === rowOrderId; });
        var rowItem = rowOrder && rowOrder.items && rowOrder.items[rowItemIdx];
        if (rowItem && isApprovedAftersaleItem(rowItem) && getItemSelectableQty(rowItem) > 0) {
          openVerifyBlockedModal();
          return;
        }
        if (itemRow.classList.contains("is-item-selectable")) {
          toggleSelectItem(rowOrderId, rowItemIdx);
        }
        return;
      }
    }

    var avatarBtn = e.target.closest("[data-queue-verify]");
    if (avatarBtn) {
      goToVerifyPage(
        avatarBtn.getAttribute("data-customer"),
        avatarBtn.getAttribute("data-phone")
      );
      return;
    }

    var callBtn = e.target.closest(".order-card__call-btn");
    if (callBtn) {
      window.LFToast && window.LFToast.show("拨打电话：" + callBtn.getAttribute("data-phone"));
      return;
    }

    var cancelBtn = e.target.closest(".queue-card__cancel-btn");
    if (cancelBtn) {
      var cancelId = cancelBtn.getAttribute("data-queue-id");
      allQueueRecords = allQueueRecords.filter(function (q) { return q.id !== cancelId; });
      window.LFToast && window.LFToast.show("已取消预约");
      doRender();
      return;
    }

    var actionBtn = e.target.closest("[data-queue-action]");
    if (actionBtn) {
      var actionId = actionBtn.getAttribute("data-queue-id");
      var action = actionBtn.getAttribute("data-queue-action");
      var record = allQueueRecords.find(function (q) { return q.id === actionId; });
      if (!record) return;

      if (action === "skip") {
        allQueueRecords = allQueueRecords.filter(function (q) { return q.id !== actionId; });
        window.LFToast && window.LFToast.show("已过号");
        doRender();
      } else if (action === "call") {
        record.callStatus = "calling";
        record.callerName = "店员";
        record.callTime = formatTimeHM();
        window.LFToast && window.LFToast.show("叫号：请 " + record.customer + " 到柜台");
        doRender();
      } else if (action === "cancel-call") {
        clearCallingState(record);
        window.LFToast && window.LFToast.show("已取消叫号");
        doRender();
      } else if (action === "done") {
        allQueueRecords = allQueueRecords.filter(function (q) { return q.id !== actionId; });
        window.LFToast && window.LFToast.show("已标记完成");
        doRender();
      }
    }
  });

  function mountVerifyDemoPanel() {
    var api = window.LFStoreVerifyDemo;
    if (!api || document.getElementById("sa-verify-demo")) return;
    var current = api.getScene();
    var switches = (window.LFStoreVerifyPolicy && window.LFStoreVerifyPolicy.getSwitches && window.LFStoreVerifyPolicy.getSwitches()) || { platform: true, store: true };
    var panel = document.createElement("div");
    panel.id = "sa-verify-demo";
    panel.className = "sa-verify-demo";
    panel.innerHTML =
      '<div class="sa-verify-demo__title">核销验收开关</div>' +
      '<label class="sa-verify-demo__row">场景' +
      '<select id="sa-verify-demo-scene">' +
      api.scenes.map(function (scene) {
        return '<option value="' + scene.id + '"' + (scene.id === current ? " selected" : "") + ">" + scene.label + "</option>";
      }).join("") +
      "</select></label>" +
      '<label class="sa-verify-demo__row"><input type="checkbox" id="sa-verify-demo-platform"' + (switches.platform ? " checked" : "") + "> 平台·待发货订单核销</label>" +
      '<label class="sa-verify-demo__row"><input type="checkbox" id="sa-verify-demo-store"' + (switches.store ? " checked" : "") + "> 门店·待发货订单核销</label>" +
      '<p class="sa-verify-demo__hint">两处都开且订单已截单时，待发货/待收货/待提货均可核销</p>' +
      '<button type="button" class="sa-verify-demo__apply" id="sa-verify-demo-apply">应用并刷新</button>';
    document.body.appendChild(panel);
    document.getElementById("sa-verify-demo-apply").addEventListener("click", function () {
      var select = document.getElementById("sa-verify-demo-scene");
      var platformEl = document.getElementById("sa-verify-demo-platform");
      var storeEl = document.getElementById("sa-verify-demo-store");
      api.applyAndReload(select ? select.value : current, {
        platform: !!(platformEl && platformEl.checked),
        store: !!(storeEl && storeEl.checked),
      });
    });
  }

  mountVerifyDemoPanel();
  doRender();
})();
