/**
 * 丰银宝 · 供应商结算演示数据（账户 / 清分 / 结款单共用）
 * 清分按本商家订单归集；字段对齐 PC 清分台账供应商侧可读信息。
 */
(function (global) {
  var LEDGER = [
    {
      id: '1721',
      orderNo: 'ORD-2610312477895',
      lineNo: '—',
      product: '运费验收-快递常温2.5kg',
      sku: 'SKU00217',
      spec: '2.5kg',
      qty: 1,
      orderType: '代采',
      channel: '代采',
      storeName: '德清乾元天恩冷鲜超市',
      purchase: '0.01',
      sales: '1.00',
      receivable: '0.01',
      refund: '0.00',
      net: '0.01',
      clearStatus: '已清分',
      settleStatus: '待结算',
      postingStatus: '待入账',
      time: '2026-10-31 18:17',
      clearTime: '2026-10-31 18:20',
      settleTime: '—',
      billId: '',
      supplier: '斯斯供应商商家',
      remark: '采购款清分'
    },
    {
      id: '1719',
      orderNo: 'ORD-2610312466502',
      lineNo: 'ORD-2610312466502-1',
      product: '火龙果',
      sku: 'SKU00196',
      spec: '白心 / 袋',
      qty: 2,
      orderType: '零售',
      channel: '商城',
      storeName: '斯斯门店商家2',
      purchase: '0.04',
      sales: '0.06',
      receivable: '0.04',
      refund: '0.00',
      net: '0.04',
      clearStatus: '已清分',
      settleStatus: '待结款',
      postingStatus: '待入账',
      time: '2026-10-31 13:58',
      clearTime: '2026-10-31 14:01',
      settleTime: '—',
      billId: 'ST_353846837167284224',
      supplier: '斯斯供应商商家',
      remark: '履约后起算，本行已达可结算时点'
    },
    {
      id: '1705',
      orderNo: 'ORD-261016200015',
      lineNo: 'ORD-261016200015-2',
      product: '芒果干',
      sku: 'SPU00088',
      spec: '200g',
      qty: 2,
      orderType: '零售',
      channel: '商城',
      storeName: '斯斯门店商家2',
      purchase: '0.64',
      sales: '0.80',
      receivable: '0.64',
      refund: '0.80',
      net: '0.64',
      clearStatus: '已清分',
      settleStatus: '结款中',
      postingStatus: '待入账',
      time: '2026-10-16 09:10',
      clearTime: '2026-10-16 09:15',
      settleTime: '—',
      billId: 'ST_2086759712106688514',
      supplier: '斯斯供应商商家',
      remark: '售后退款中，采购款仍按行清分'
    },
    {
      id: '1708',
      orderNo: 'ORD-261013200012',
      lineNo: 'ORD-261013200012-1',
      product: '白芭乐-快递-ss',
      sku: 'SKU00184',
      spec: '100g / L',
      qty: 1,
      orderType: '零售',
      channel: '商城',
      storeName: '斯斯门店商家2',
      purchase: '0.24',
      sales: '0.30',
      receivable: '0.24',
      refund: '0.00',
      net: '0.24',
      clearStatus: '已清分',
      settleStatus: '已结款',
      postingStatus: '已入账',
      time: '2026-10-13 10:22',
      clearTime: '2026-10-13 10:30',
      settleTime: '2026-10-14 09:00',
      billId: 'ST_2088198765544431618',
      supplier: '斯斯供应商商家',
      remark: '—'
    },
    {
      id: '1716',
      orderNo: 'ORD-2610307754308',
      lineNo: 'ORD-2610307754308-1',
      product: '低糖养乐多',
      sku: 'SPU00204',
      spec: '低糖芒果味 / 箱',
      qty: 3,
      orderType: '代采',
      channel: '代采',
      storeName: '南京马群枢纽供应商店',
      purchase: '1.50',
      sales: '3.00',
      receivable: '1.50',
      refund: '0.00',
      net: '1.50',
      clearStatus: '已清分',
      settleStatus: '已结款',
      postingStatus: '已入账',
      time: '2026-10-30 18:05',
      clearTime: '2026-10-30 18:10',
      settleTime: '2026-10-31 09:20',
      billId: 'ST_351310165011607552',
      supplier: '南京马群枢纽供应商',
      remark: '—'
    },
    {
      id: '1699',
      orderNo: 'ORD-261008200001',
      lineNo: 'ORD-261008200001-1',
      product: '马群-莲藕-快递配送',
      sku: 'SPU00142',
      spec: '粉糯莲藕 / 包',
      qty: 5,
      orderType: '零售',
      channel: '商城',
      storeName: '野子文化',
      purchase: '11.40',
      sales: '12.00',
      receivable: '11.40',
      refund: '0.00',
      net: '11.40',
      clearStatus: '已清分',
      settleStatus: '待结算',
      postingStatus: '待入账',
      time: '2026-10-08 14:20',
      clearTime: '2026-10-08 14:25',
      settleTime: '—',
      billId: '',
      supplier: '南京马群枢纽供应商',
      remark: '—'
    },
    {
      id: '1690',
      orderNo: 'ORD-2609104841852',
      lineNo: '353852301770752223',
      product: '低糖养乐多',
      sku: 'SPU00204',
      spec: '低糖芒果味 / 箱',
      qty: 1,
      orderType: '零售',
      channel: '商城',
      storeName: '斯斯门店商家2',
      purchase: '0.01',
      sales: '0.02',
      receivable: '0.01',
      refund: '0.00',
      net: '0.01',
      clearStatus: '清分异常',
      settleStatus: '待结算',
      postingStatus: '待入账',
      time: '2026-09-10 11:05',
      clearTime: '—',
      settleTime: '—',
      billId: 'ST_358643443066482688',
      supplier: '南京马群枢纽供应商',
      remark: '结算金额异常'
    }
  ];

  var BILLS = [
    {
      id: 'ST_357556279620669440',
      goods: '0.50',
      payable: '0.49',
      net: '0.01',
      paid: '0.00',
      unpaid: '0.01',
      orders: 1,
      status: '待结款',
      created: '2026-09-14 00:01',
      cycle: '2026-09-12',
      auditTime: '2026-09-14 00:01',
      payTime: '—',
      flowNo: '—',
      supplier: '斯斯供应商商家',
      lines: [
        {
          orderNo: 'ORD-2610312477895',
          ledgerId: '1721',
          product: '运费验收-快递常温2.5kg',
          qty: 1,
          goods: '0.50',
          fee: '0.49',
          net: '0.01',
          status: '待结款'
        }
      ]
    },
    {
      id: 'ST_353846837167284224',
      goods: '0.04',
      payable: '0.00',
      net: '0.04',
      paid: '0.02',
      unpaid: '0.02',
      orders: 2,
      status: '部分结款',
      created: '2026-09-03 18:21',
      cycle: '2026-09-03',
      auditTime: '2026-09-03 18:21',
      payTime: '2026-09-06 15:07',
      flowNo: 'HF202609060001',
      supplier: '斯斯供应商商家',
      lines: [
        {
          orderNo: 'ORD-2610312466502',
          ledgerId: '1719',
          product: '火龙果',
          qty: 2,
          goods: '0.03',
          fee: '0.00',
          net: '0.03',
          status: '部分结款'
        },
        {
          orderNo: 'ORD-2610312466502',
          ledgerId: '1719',
          product: '白芭乐-快递-ss',
          qty: 1,
          goods: '0.01',
          fee: '0.00',
          net: '0.01',
          status: '部分结款'
        }
      ]
    },
    {
      id: 'ST_2088198765544431618',
      goods: '0.72',
      payable: '0.48',
      net: '0.24',
      paid: '0.24',
      unpaid: '0.00',
      orders: 1,
      status: '已结款',
      created: '2026-08-15 18:21',
      cycle: '2026-08-14',
      auditTime: '2026-08-15 18:21',
      payTime: '2026-08-16 10:20',
      flowNo: 'HF202608160088',
      supplier: '斯斯供应商商家',
      lines: [
        {
          orderNo: 'ORD-261013200012',
          ledgerId: '1708',
          product: '白芭乐-快递-ss',
          qty: 1,
          goods: '0.72',
          fee: '0.48',
          net: '0.24',
          status: '已结款'
        }
      ]
    },
    {
      id: 'ST_2086759712106688514',
      goods: '0.64',
      payable: '0.00',
      net: '0.64',
      paid: '0.00',
      unpaid: '0.64',
      orders: 1,
      status: '结款中',
      created: '2026-08-10 18:21',
      cycle: '2026-08-10',
      auditTime: '2026-08-10 18:21',
      payTime: '—',
      flowNo: 'HF202608100066',
      supplier: '斯斯供应商商家',
      lines: [
        {
          orderNo: 'ORD-261016200015',
          ledgerId: '1705',
          product: '芒果干',
          qty: 2,
          goods: '0.64',
          fee: '0.00',
          net: '0.64',
          status: '结款中'
        }
      ]
    },
    {
      id: 'ST_358643443066482688',
      goods: '0.04',
      payable: '0.02',
      net: '0.02',
      paid: '0.00',
      unpaid: '0.02',
      orders: 2,
      status: '待结款',
      created: '2026-09-17 00:01',
      cycle: '2026-09-10',
      auditTime: '2026-09-17 00:01',
      payTime: '—',
      flowNo: '—',
      supplier: '南京马群枢纽供应商',
      exception: '未配置供应商结算账户或结算主体',
      lines: [
        {
          orderNo: 'ORD-2609104841852',
          ledgerId: '1690',
          product: '低糖养乐多',
          qty: 1,
          goods: '0.02',
          fee: '0.01',
          net: '0.01',
          status: '待结款'
        },
        {
          orderNo: 'ORD-261008200001',
          ledgerId: '1699',
          product: '马群-莲藕-快递配送',
          qty: 1,
          goods: '0.02',
          fee: '0.01',
          net: '0.01',
          status: '待结款'
        }
      ]
    },
    {
      id: 'ST_351310165011607552',
      goods: '1.50',
      payable: '0.00',
      net: '1.50',
      paid: '1.50',
      unpaid: '0.00',
      orders: 1,
      status: '已结款',
      created: '2026-08-27 18:21',
      cycle: '2026-08-27',
      auditTime: '2026-08-27 18:21',
      payTime: '2026-08-28 09:12',
      flowNo: 'HF202608280055',
      supplier: '南京马群枢纽供应商',
      lines: [
        {
          orderNo: 'ORD-2610307754308',
          ledgerId: '1716',
          product: '低糖养乐多',
          qty: 3,
          goods: '1.50',
          fee: '0.00',
          net: '1.50',
          status: '已结款'
        }
      ]
    }
  ];

  var ACCOUNTS = {
    'sup-ss': { accountName: '小牛供应链有限公司', accountNo: '6666000218008801' },
    'sup-mq': { accountName: '南京冷链物流服务有限公司', accountNo: '6666000219001108' }
  };

  function listLedgerBySupplier(name) {
    return LEDGER.filter(function (x) {
      return x.supplier === name;
    });
  }

  function listBillsBySupplier(name) {
    return BILLS.filter(function (x) {
      return x.supplier === name;
    });
  }

  function findLedger(id, supplierName) {
    var key = String(id || '').trim();
    for (var i = 0; i < LEDGER.length; i++) {
      var row = LEDGER[i];
      if (row.id === key && (!supplierName || row.supplier === supplierName)) return row;
    }
    return null;
  }

  function findBill(id, supplierName) {
    var key = String(id || '').trim();
    for (var i = 0; i < BILLS.length; i++) {
      var row = BILLS[i];
      if (row.id === key && (!supplierName || row.supplier === supplierName)) return row;
    }
    return null;
  }

  global.FybSupplierSettle = {
    accounts: ACCOUNTS,
    listLedgerBySupplier: listLedgerBySupplier,
    listBillsBySupplier: listBillsBySupplier,
    findLedger: findLedger,
    findBill: findBill
  };
})(typeof window !== 'undefined' ? window : this);
