/**
 * 门店订单 · 快递物流跟踪（结构与文案对齐用户 APP 订单跟踪）
 * 一单多快递时展示「包裹1 / 包裹2」页签
 */
(function () {
  var activeIdx = 0;
  var currentOrder = null;

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getQuery() {
    try {
      return new URLSearchParams(window.location.search);
    } catch (e) {
      return { get: function () { return ""; } };
    }
  }

  function readPending() {
    try {
      var raw = sessionStorage.getItem("pendingExpressOrder");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function resolveOrder() {
    var id = getQuery().get("id") || "";
    var pending = readPending();
    if (pending && (!id || pending.id === id)) return pending;
    var list = (window.LFMockData && window.LFMockData.orders) || [];
    return list.find(function (o) { return o.id === id; }) || pending;
  }

  function getPackageSources(order) {
    if (order && Array.isArray(order.packages) && order.packages.length) return order.packages;
    if (order && order.express) return [order.express];
    return [];
  }

  function buildPackage(order, express) {
    var items = (express && express.items && express.items.length) ? express.items : ((order && order.items) || []);
    var totalQty = items.reduce(function (sum, item) { return sum + (Number(item.qty) || 0); }, 0);
    return {
      status: (express && express.logisticsStatus) || (order && order.status) || "快递",
      courier: (express && express.courier) || "快递配送",
      trackingNo: (express && express.trackingNo) || "",
      totalQty: totalQty,
      products: items.map(function (item) {
        return { img: item.image || "", badge: item.qty > 1 ? item.qty : 0 };
      }),
      timeline: (express && express.timeline) || [],
    };
  }

  function getPackageList(order) {
    return getPackageSources(order).map(function (src) {
      return buildPackage(order, src);
    });
  }

  function renderProducts(pkg) {
    var scroll = document.getElementById("logisticsProductsScroll");
    var totalEl = document.getElementById("logisticsProductsTotal");
    if (!scroll) return;
    scroll.innerHTML = (pkg.products || []).map(function (p) {
      var badge = p.badge ? '<span class="ua-ol-products__badge">' + p.badge + "</span>" : "";
      return (
        '<div class="ua-ol-products__item' + (p.badge ? " ua-ol-products__item--badge" : "") + '">' +
        '<img src="' + escapeHtml(p.img) + '" alt="">' +
        badge +
        "</div>"
      );
    }).join("");
    if (totalEl) totalEl.textContent = "共" + (pkg.totalQty || 0) + "件";
  }

  function renderTimeline(timeline) {
    var container = document.getElementById("logisticsTimeline");
    if (!container) return;
    container.innerHTML = (timeline || []).map(function (item) {
      if (item.type === "address") {
        return (
          '<div class="ua-ol-tl-row ua-ol-tl-row--address">' +
          '<div class="ua-ol-tl-time ua-ol-tl-time--empty">—</div>' +
          '<div class="ua-ol-tl-axis"><span class="ua-ol-tl-node ua-ol-tl-node--receive">收</span></div>' +
          '<div class="ua-ol-tl-content"><div class="ua-ol-tl-desc ua-ol-tl-desc--address">' +
          escapeHtml(item.text) +
          "</div></div></div>"
        );
      }
      var nodeCls = "ua-ol-tl-node" + (item.active ? " ua-ol-tl-node--active" : "");
      var titleCls = "ua-ol-tl-title" + (item.active ? " ua-ol-tl-title--active" : "");
      return (
        '<div class="ua-ol-tl-row">' +
        '<div class="ua-ol-tl-time">' + escapeHtml(item.time || "").replace("\n", "<br>") + "</div>" +
        '<div class="ua-ol-tl-axis"><span class="' + nodeCls + '"></span></div>' +
        '<div class="ua-ol-tl-content">' +
        '<div class="' + titleCls + '">' + escapeHtml(item.title || "") + "</div>" +
        (item.desc ? '<div class="ua-ol-tl-desc">' + escapeHtml(item.desc) + "</div>" : "") +
        "</div></div>"
      );
    }).join("");
  }

  function renderPkgTabs(list) {
    var tabsEl = document.getElementById("logisticsPkgTabs");
    if (!tabsEl) return;
    if (list.length <= 1) {
      tabsEl.hidden = true;
      tabsEl.innerHTML = "";
      return;
    }
    tabsEl.hidden = false;
    tabsEl.innerHTML = list.map(function (pkg, idx) {
      return (
        '<button type="button" class="ua-ol-pkg-tab' +
        (idx === activeIdx ? " is-active" : "") +
        '" data-pkg-tab="' + idx + '">包裹' + (idx + 1) +
        "<small>" + escapeHtml(pkg.courier) + "</small></button>"
      );
    }).join("");
  }

  function copyTrackingNo(no) {
    if (!no) {
      window.LFToast && window.LFToast.show("暂无运单号");
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(no).then(function () {
        window.LFToast && window.LFToast.show("已复制运单号");
      }).catch(function () {
        window.LFToast && window.LFToast.show("已复制运单号");
      });
      return;
    }
    window.LFToast && window.LFToast.show("已复制运单号");
  }

  function renderPackage(idx) {
    var list = getPackageList(currentOrder);
    if (!list.length) return;
    activeIdx = Math.max(0, Math.min(idx, list.length - 1));
    var pkg = list[activeIdx];

    var statusEl = document.getElementById("logisticsMainStatus");
    var courierEl = document.getElementById("logisticsCourierName");
    var noEl = document.getElementById("logisticsTrackingNo");
    if (statusEl) statusEl.textContent = pkg.status;
    if (courierEl) courierEl.textContent = pkg.courier;
    if (noEl) noEl.textContent = pkg.trackingNo || "尚未生成运单号";

    renderPkgTabs(list);
    renderProducts(pkg);
    renderTimeline(pkg.timeline);

    var copyBtn = document.getElementById("logisticsCopyBtn");
    if (copyBtn) copyBtn.hidden = !pkg.trackingNo;
  }

  function render(order) {
    var empty = document.getElementById("logisticsMainStatus");
    currentOrder = order;
    if (!order) {
      if (empty) empty.textContent = "未找到该快递单";
      return;
    }
    var pkgParam = parseInt(getQuery().get("pkg") || "0", 10);
    renderPackage(isNaN(pkgParam) ? 0 : pkgParam);

    var tabsEl = document.getElementById("logisticsPkgTabs");
    if (tabsEl) {
      tabsEl.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-pkg-tab]");
        if (!btn) return;
        renderPackage(parseInt(btn.getAttribute("data-pkg-tab"), 10) || 0);
      });
    }

    var copyBtn = document.getElementById("logisticsCopyBtn");
    if (copyBtn) {
      copyBtn.onclick = function () {
        var list = getPackageList(currentOrder);
        var pkg = list[activeIdx] || list[0];
        copyTrackingNo(pkg && pkg.trackingNo);
      };
    }
  }

  render(resolveOrder());
})();
