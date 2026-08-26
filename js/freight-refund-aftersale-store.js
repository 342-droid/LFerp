/**
 * 退运费原型跨页数据：订单页提交后，售后列表/详情在同一浏览器标签页读取。
 * 仅用于静态原型演示，不替代服务端售后单存储。
 */
(function (global) {
  var KEY = 'lferp.freightRefundAftersales.v1';
  var MAX_RECORDS = 20;

  function normalize(record) {
    if (!record) return null;
    if (record.refundScene === 'ORDER_FREIGHT' || record.type === '退运费') {
      return Object.assign({}, record, {
        type: '仅退款',
        reason: '退运费',
        refundScene: 'ORDER_FREIGHT'
      });
    }
    return record;
  }

  function read() {
    try {
      var parsed = JSON.parse(global.sessionStorage.getItem(KEY) || '[]');
      return Array.isArray(parsed) ? parsed.map(normalize).filter(Boolean) : [];
    } catch (error) {
      return [];
    }
  }

  function write(records) {
    try {
      global.sessionStorage.setItem(KEY, JSON.stringify((records || []).slice(0, MAX_RECORDS)));
    } catch (error) {
      // 静态原型在禁用存储时仍允许当前订单页继续演示。
    }
  }

  function add(record) {
    if (!record || !record.id) return;
    var records = read().filter(function (item) {
      return item && item.id !== record.id;
    });
    records.unshift(normalize(record));
    write(records);
  }

  function find(id) {
    var records = read();
    for (var index = 0; index < records.length; index++) {
      if (records[index].id === id) return records[index];
    }
    return null;
  }

  global.FreightRefundAftersaleStore = {
    key: KEY,
    read: read,
    add: add,
    find: find
  };
})(typeof window !== 'undefined' ? window : this);
