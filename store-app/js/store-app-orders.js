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

  (function parseTabParam() {
    var params = new URLSearchParams(window.location.search);
    var tab = params.get("tab");
    if (tab && ["全部", "待收货", "待提货", "已完成", "排队中"].indexOf(tab) !== -1) {
      currentStatus = tab;
    }
  })();

  var STATUS_TAG_CLASS = {
    待收货: "order-card__tag--pending",
    待提货: "order-card__tag--pickup",
    已完成: "order-card__tag--done",
    部分核销: "order-card__tag--partial",
  };

  var PICKUP_ORDER_STATUSES = ["待提货", "部分核销"];

  function isQueueMode() {
    return currentStatus === "排队中";
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
        return o.customer.indexOf(keyword) !== -1 || o.phone.indexOf(keyword) !== -1;
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

    var tagClass = STATUS_TAG_CLASS[o.status] || "";
    var statusTag =
      '<span class="order-card__tag ' + tagClass + '">' + o.status + "</span>";

    var itemsHtml = "";
    o.items.forEach(function (item) {
      var fullyPicked = isItemFullyPicked(item);
      var doneClass = fullyPicked ? " order-card__item--done" : "";
      var doneMark = fullyPicked ? " ✓" : "";
      var pickupTag = getItemPickupTag(item, o.status);
      itemsHtml +=
        '<div class="order-card__item' + doneClass + '">' +
        '<span class="order-card__item-name' + (fullyPicked ? " order-card__item-name--done" : "") + '">' + item.name + pickupTag + "</span>" +
        '<span class="order-card__item-qty">x' + item.qty + "</span>" +
        '<span class="order-card__item-price' + (fullyPicked ? " order-card__item-price--done" : "") + '">¥' + item.price + doneMark + "</span>" +
        "</div>";
    });

    var refundHtml = "";
    if (o.status === "待提货" && o.refund) {
      refundHtml =
        '<div class="order-card__refund">' +
        "<span>退款数量：" + o.refund.returnQty + "</span>" +
        "<span>退款金额：¥" + o.refund.refundAmount.toFixed(2) + "</span>" +
        "</div>";
    }

    var extraHtml = "";
    if (o.status === "已完成") {
      o.items.forEach(function (item) {
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
      var doneItems = o.items.filter(function (item) { return item._verified; });
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
      o.items.forEach(function (item) {
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

    card.innerHTML =
      '<div class="order-card__header">' +
      '<span class="order-card__no">' + o.orderNo + "</span>" +
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

  var VERIFIABLE_STATUSES = ["待收货", "待提货", "部分核销"];

  function buildVerifyOrderForMember(customer, phone) {
    if (data.verifyOrdersByPhone && data.verifyOrdersByPhone[phone]) {
      return JSON.parse(JSON.stringify(data.verifyOrdersByPhone[phone]));
    }

    var verifiable = allOrders.filter(function (o) {
      return o.phone === phone && VERIFIABLE_STATUSES.indexOf(o.status) !== -1;
    });

    if (verifiable.length === 0) {
      verifiable = allOrders.filter(function (o) {
        return o.customer === customer && VERIFIABLE_STATUSES.indexOf(o.status) !== -1;
      });
    }

    if (verifiable.length === 0) return null;

    return {
      orderNo: verifiable[0].orderNo,
      shared: { customer: customer, phone: phone },
      orders: verifiable.map(function (o) {
        return {
          id: o.id,
          orderNo: o.orderNo,
          createdAt: o.createdAt,
          status: o.status,
          amount: o.amount,
          items: o.items.map(function (item) {
            var copy = {
              name: item.name,
              qty: item.qty,
              price: item.price,
              image: item.image || "https://placehold.co/80x80/f5f5f5/999?text=商品",
            };
            if (item.refund) copy.refund = JSON.parse(JSON.stringify(item.refund));
            if (item.refunding) copy.refunding = item.refunding;
            if (item._verified) {
              copy._verified = item._verified;
              copy._verifyTime = item._verifyTime;
            }
            return copy;
          }),
        };
      }),
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
      searchInput.placeholder = "输入手机号搜索订单";
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
    if (isQueueMode()) {
      renderList(getFilteredQueueRecords(currentQueueFilter, currentKeyword), true);
    } else {
      renderList(getFilteredOrders(currentStatus, currentKeyword), false);
    }
  }

  function switchTab(status) {
    currentStatus = status;
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

  root.addEventListener("click", function (e) {
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

  doRender();
})();
