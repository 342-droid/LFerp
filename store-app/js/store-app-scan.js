/**
 * 订单核销：扫描会员条码，跳转核销详情页
 */
(function (global) {
  var mockDataRef = null;
  var modalEl = null;

  function open() {
    if (!modalEl) return;
    modalEl.classList.add("is-open");
    modalEl.setAttribute("aria-hidden", "false");
  }

  function close() {
    if (!modalEl) return;
    modalEl.classList.remove("is-open");
    modalEl.setAttribute("aria-hidden", "true");
  }

  function goVerifyDetail() {
    var data = mockDataRef || global.LFMockData;
    if (!data || !data.pendingVerifyOrder) {
      global.LFToast && global.LFToast.show("暂无待核销订单");
      return;
    }
    close();
    var o = JSON.parse(JSON.stringify(data.pendingVerifyOrder));
    if (o && Array.isArray(o.orders) && global.LFStoreVerifyPolicy && typeof global.LFStoreVerifyPolicy.isVerifiable === "function") {
      o.orders = o.orders.filter(function (order) {
        return global.LFStoreVerifyPolicy.isVerifiable(order);
      });
    }
    if (!o || !o.orders || !o.orders.length) {
      global.LFToast && global.LFToast.show("该用户暂无可核销订单");
      return;
    }
    global.sessionStorage.setItem("pendingVerifyOrder", JSON.stringify(o));
    global.location.href = "order-detail.html";
  }

  function init(mockData, options) {
    mockDataRef = mockData;
    var openBtn = options.openButton;
    modalEl = options.modal;
    var simulateBtn = options.simulateButton;
    var cancelBtn = options.cancelButton;
    if (!modalEl) return;

    if (openBtn) {
      openBtn.addEventListener("click", function (e) {
        e.preventDefault();
        open();
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", close);
    }

    modalEl.addEventListener("click", function (e) {
      if (e.target === modalEl) close();
    });

    if (simulateBtn) {
      simulateBtn.addEventListener("click", goVerifyDetail);
    }
  }

  global.LFScan = { init: init, open: open, close: close };
})(window);
