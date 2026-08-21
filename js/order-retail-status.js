/**
 * 零售订单状态
 * 列表/筛选：待支付、待发货、待收货、待提货、交易成功、交易失败；另有筛选项「发起退货/退款」
 * 兼容历史文案：已创建→待支付，已支付→待发货，已完成→交易成功，已关闭/已取消→交易失败
 */
(function (global) {
  var DISPLAY_MAP = {
    已创建: '待支付',
    已支付: '待发货',
    已完成: '交易成功',
    已关闭: '交易失败',
    已取消: '交易失败'
  };

  var FILTER_ALIASES = {
    待支付: ['待支付', '已创建'],
    待发货: ['待发货', '已支付'],
    待收货: ['待收货'],
    待提货: ['待提货', '部分提货'],
    交易成功: ['交易成功', '已完成'],
    交易失败: ['交易失败', '已关闭', '已取消']
  };

  var TAG_CLASS = {
    待支付: 'order-tag--pending-pay',
    待发货: 'order-tag--pending-ship',
    待收货: 'order-tag--receipt',
    待提货: 'order-tag--pickup',
    交易成功: 'order-tag--success',
    交易失败: 'order-tag--failed'
  };

  function display(status) {
    var s = String(status || '').trim();
    return DISPLAY_MAP[s] || s;
  }

  function isSuccess(status) {
    return display(status) === '交易成功';
  }

  function isFailed(status) {
    return display(status) === '交易失败';
  }

  function isUnpaid(status) {
    return display(status) === '待支付';
  }

  function isTerminal(status) {
    return isSuccess(status) || isFailed(status);
  }

  function matchesFilter(rowStatus, selectedLabels) {
    var labels = selectedLabels || [];
    return labels.some(function (label) {
      var aliases = FILTER_ALIASES[label] || [label];
      return aliases.indexOf(rowStatus) >= 0 || aliases.indexOf(display(rowStatus)) >= 0;
    });
  }

  function tagClass(status) {
    return TAG_CLASS[display(status)] || 'order-tag--pending-pay';
  }

  function isRetailPage() {
    return !!(global.document && global.document.body &&
      global.document.body.getAttribute('data-order-page') === 'retail');
  }

  global.OrderRetailStatus = {
    display: display,
    isSuccess: isSuccess,
    isFailed: isFailed,
    isUnpaid: isUnpaid,
    isTerminal: isTerminal,
    matchesFilter: matchesFilter,
    tagClass: tagClass,
    isRetailPage: isRetailPage
  };
})(window);
