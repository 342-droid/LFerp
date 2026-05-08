/* 与 purchase_store_demand_summary.html 共用的模拟数据；门店订货单等页面从同一来源读取。 */
(function() {
    'use strict';

    window.SKU_CATEGORY_TREE = {
        生鲜: {
            水果: ['仁果类', '浆果类', '柑橘类'],
            蔬菜: ['叶菜类', '根茎类']
        },
        食品: {
            零食: ['膨化食品', '糖果']
        }
    };

    /**
     * 生成门店订货单号：MDH + 年月日时分秒(14 位) + 2 位随机码
     * @returns {string}
     */
    window.generateMdhStoreOrderSheetNo = function() {
        var d = new Date();
        function pad2(n) { return (n < 10 ? '0' : '') + n; }
        var ts = '' + d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) +
            pad2(d.getHours()) + pad2(d.getMinutes()) + pad2(d.getSeconds());
        var rnd = ('0' + Math.floor(Math.random() * 100)).slice(-2);
        return 'MDH' + ts + rnd;
    };

    /**
     * 门店订货汇总/订货单行明细；deliveryWarehouse 为配送仓库；receivingWarehouse 一般与配送仓一致，配送仓为「W002 嘉兴仓」时收货仓为「W001 南京仓」；
     * sheetNo 为门店订货单号，sheetHeaderStatus 为可选的整单「单据状态」覆写
     * （否则由 purchase_store_order_sheet 按行订单状态聚合推导）；
     * 整单状态枚举：初始、待发货、部分发货、发货完成、已到店、部分收货、已完成、已取消。
     * 整单维度的 docSource、remark、createdBy、updatedAt、updatedBy 可写在同单任意一行（建议首行），供门店订货单列表展示；
     * 未写 docSource/remark 时列表默认展示「门店订货汇总生成」。
     * 销售总价 / 明细「销售金额」：各行写 lineAmount（行小计），列表销售总价为其求和；若某行写 sheetOrderTotal 则整单销售总价以该值为准（应与明细 lineAmount 汇总等业务规则一致）。
     * 明细可写 shippedQty、receivedQty（对应界面「发货量」「收货量」，与 qty 同单位）；未写时详情页对应用「—」。
     */
    window.PURCHASE_STORE_ORDER_LINES = [
        { placeOrderDate: '2026-04-20', paymentDate: '2026-04-20', orderSource: '直播间', orderStatus: '待发货', liveSession: 'ZB20260420-晚场', deliveryWarehouse: 'W001 南京仓', receivingWarehouse: 'W001 南京仓', storeCode: 'ST001', storeName: '南京新街口店', skuCode: 'SKU001', skuName: '红富士苹果', skuSource: '正常商品', skuCategoryPath: '生鲜 / 水果 / 仁果类', spec: '5kg/箱', qty: 30, qtyUnit: '件', lineAmount: 5400, shippedQty: 0, receivedQty: 0, sheetNo: 'MDH2026042012000037', sheetHeaderStatus: '初始', createdBy: '张敏', updatedAt: '2026-04-20 20:15:00', updatedBy: '李强' },
        { placeOrderDate: '2026-04-20', paymentDate: '2026-04-20', orderSource: '直播间', orderStatus: '待发货', liveSession: 'ZB20260420-晚场', deliveryWarehouse: 'W001 南京仓', receivingWarehouse: 'W001 南京仓', storeCode: 'ST001', storeName: '南京新街口店', skuCode: 'SKU002', skuName: '香蕉', skuSource: '正常商品', skuCategoryPath: '生鲜 / 水果 / 浆果类', spec: '10kg/箱', qty: 15, qtyUnit: '份', lineAmount: 1125, shippedQty: 0, receivedQty: 0, sheetNo: 'MDH2026042012000037' },
        { placeOrderDate: '2026-04-20', paymentDate: '2026-04-21', orderSource: '商城', orderStatus: '退款中', liveSession: 'ZB20260420-早场', deliveryWarehouse: 'W003 上海仓', receivingWarehouse: 'W003 上海仓', storeCode: 'ST002', storeName: '上海徐家汇店', skuCode: 'SKU001', skuName: '红富士苹果', skuSource: '积分商品', skuCategoryPath: '生鲜 / 水果 / 仁果类', spec: '5kg/箱', qty: 20, qtyUnit: '件', lineAmount: 3800, shippedQty: 0, receivedQty: 0, sheetNo: 'MDH2026042015301528', createdBy: '王华', updatedAt: '2026-04-20 19:30:00', updatedBy: '王华' },
        { placeOrderDate: '2026-04-20', paymentDate: '2026-04-20', orderSource: '商城', orderStatus: '待发货', liveSession: 'ZB20260420-早场', deliveryWarehouse: 'W003 上海仓', receivingWarehouse: 'W003 上海仓', storeCode: 'ST002', storeName: '上海徐家汇店', skuCode: 'SKU003', skuName: '脐橙', skuSource: '福袋商品', skuCategoryPath: '生鲜 / 水果 / 柑橘类', spec: '礼盒装', qty: 12, qtyUnit: '箱', lineAmount: 1680, shippedQty: 0, receivedQty: 0, sheetNo: 'MDH2026042015301528' },
        { placeOrderDate: '2026-04-21', paymentDate: '2026-04-21', orderSource: '直播间', orderStatus: '待发货', liveSession: 'ZB20260421-晚场', deliveryWarehouse: 'W002 嘉兴仓', receivingWarehouse: 'W001 南京仓', storeCode: 'ST003', storeName: '杭州西湖店', skuCode: 'SKU001', skuName: '红富士苹果', skuSource: '正常商品', skuCategoryPath: '生鲜 / 水果 / 仁果类', spec: '5kg/箱', qty: 25, qtyUnit: '件', lineAmount: 4125, shippedQty: 25, receivedQty: 25, sheetNo: 'MDH2026042118154291', sheetHeaderStatus: '已完成', createdBy: '刘洋', updatedAt: '2026-04-22 09:00:00', updatedBy: '陈晨' },
        { placeOrderDate: '2026-04-21', paymentDate: '2026-04-22', orderSource: '直播间', orderStatus: '退款中', liveSession: 'ZB20260421-晚场', deliveryWarehouse: 'W002 嘉兴仓', receivingWarehouse: 'W001 南京仓', storeCode: 'ST003', storeName: '杭州西湖店', skuCode: 'SKU002', skuName: '香蕉', skuSource: '积分商品', skuCategoryPath: '生鲜 / 水果 / 浆果类', spec: '10kg/箱', qty: 18, qtyUnit: '份', lineAmount: 864, shippedQty: 0, receivedQty: 0, sheetNo: 'MDH2026042118154291' },
        { placeOrderDate: '2026-04-21', paymentDate: '2026-04-21', orderSource: '商城', orderStatus: '待发货', liveSession: 'ZB20260421-晚场', deliveryWarehouse: 'W004 北京仓', receivingWarehouse: 'W004 北京仓', storeCode: 'ST003', storeName: '杭州西湖店', skuCode: 'SKU002', skuName: '香蕉', skuSource: '福袋商品', skuCategoryPath: '食品 / 零食 / 膨化食品', spec: '5kg/箱', qty: 10, qtyUnit: '份', lineAmount: 320, shippedQty: 10, receivedQty: 9, sheetNo: 'MDH2026042118154291' },
        { placeOrderDate: '2026-04-22', paymentDate: '2026-04-22', orderSource: '商城', orderStatus: '退款中', liveSession: 'ZB20260420-早场', deliveryWarehouse: 'W001 南京仓', receivingWarehouse: 'W001 南京仓', storeCode: 'ST001', storeName: '南京新街口店', skuCode: 'SKU001', skuName: '红富士苹果', skuSource: '正常商品', skuCategoryPath: '生鲜 / 水果 / 仁果类', spec: '5kg/箱', qty: 5, qtyUnit: '件', lineAmount: 425, shippedQty: 0, receivedQty: 0, sheetNo: 'MDH2026042210300055', createdBy: '赵刚', updatedAt: '2026-04-22 16:45:00', updatedBy: '张敏' },
        { placeOrderDate: '2026-04-22', paymentDate: '2026-04-22', orderSource: '商城', orderStatus: '退款中', liveSession: 'ZB20260420-早场', deliveryWarehouse: 'W001 南京仓', receivingWarehouse: 'W001 南京仓', storeCode: 'ST001', storeName: '南京新街口店', skuCode: 'SKU002', skuName: '香蕉', skuSource: '正常商品', skuCategoryPath: '生鲜 / 水果 / 浆果类', spec: '10kg/箱', qty: 3, qtyUnit: '份', lineAmount: 198, shippedQty: 0, receivedQty: 0, sheetNo: 'MDH2026042210300055' },
        { placeOrderDate: '2026-04-23', paymentDate: '2026-04-23', orderSource: '直播间', orderStatus: '待发货', liveSession: 'ZB20260421-晚场', deliveryWarehouse: 'W004 北京仓', receivingWarehouse: 'W004 北京仓', storeCode: 'ST002', storeName: '上海徐家汇店', skuCode: 'SKU003', skuName: '脐橙', skuSource: '正常商品', skuCategoryPath: '生鲜 / 水果 / 柑橘类', spec: '礼盒装', qty: 8, qtyUnit: '箱', lineAmount: 1200, shippedQty: 6, receivedQty: 0, sheetNo: 'MDH2026042310050088', sheetHeaderStatus: '部分发货', docSource: '手动新增', createdBy: '王华', updatedAt: '2026-04-23 10:20:00', updatedBy: '王华' },
        { placeOrderDate: '2026-04-23', paymentDate: '2026-04-23', orderSource: '直播间', orderStatus: '待发货', liveSession: 'ZB20260421-晚场', deliveryWarehouse: 'W004 北京仓', receivingWarehouse: 'W004 北京仓', storeCode: 'ST002', storeName: '上海徐家汇店', skuCode: 'SKU001', skuName: '红富士苹果', skuSource: '正常商品', skuCategoryPath: '生鲜 / 水果 / 仁果类', spec: '5kg/箱', qty: 6, qtyUnit: '件', lineAmount: 1020, shippedQty: 5, receivedQty: 4, sheetNo: 'MDH2026042310050088' },
        { placeOrderDate: '2026-04-23', paymentDate: '2026-04-23', orderSource: '商城', orderStatus: '待发货', liveSession: 'ZB20260420-早场', deliveryWarehouse: 'W002 嘉兴仓', receivingWarehouse: 'W001 南京仓', storeCode: 'ST001', storeName: '南京新街口店', skuCode: 'SKU002', skuName: '香蕉', skuSource: '福袋商品', skuCategoryPath: '生鲜 / 水果 / 浆果类', spec: '10kg/箱', qty: 9, qtyUnit: '份', lineAmount: 450, shippedQty: 9, receivedQty: 6, sheetNo: 'MDH2026042311450096', sheetHeaderStatus: '部分收货', createdBy: '张敏', updatedAt: '2026-04-23 12:05:00', updatedBy: '李强' },
        { placeOrderDate: '2026-04-23', paymentDate: '2026-04-23', orderSource: '商城', orderStatus: '待发货', liveSession: 'ZB20260420-早场', deliveryWarehouse: 'W002 嘉兴仓', receivingWarehouse: 'W001 南京仓', storeCode: 'ST001', storeName: '南京新街口店', skuCode: 'SKU001', skuName: '红富士苹果', skuSource: '正常商品', skuCategoryPath: '生鲜 / 水果 / 仁果类', spec: '5kg/箱', qty: 4, qtyUnit: '件', lineAmount: 620, shippedQty: 4, receivedQty: 4, sheetNo: 'MDH2026042311450096' },
        { placeOrderDate: '2026-04-25', paymentDate: '2026-04-25', orderSource: '商城', orderStatus: '待发货', liveSession: 'ZB20260421-晚场', deliveryWarehouse: 'W001 南京仓', receivingWarehouse: 'W001 南京仓', storeCode: 'ST004', storeName: '南京夫子庙店', skuCode: 'SKU001', skuName: '红富士苹果', skuSource: '正常商品', skuCategoryPath: '生鲜 / 水果 / 仁果类', spec: '5kg/箱', qty: 12, qtyUnit: '件', lineAmount: 1999, shippedQty: 12, receivedQty: 10, sheetNo: 'MDH2026042512000001', sheetHeaderStatus: '已到店' },
        { placeOrderDate: '2026-04-25', paymentDate: '2026-04-25', orderSource: '直播间', orderStatus: '待发货', liveSession: 'ZB20260420-晚场', deliveryWarehouse: 'W002 嘉兴仓', receivingWarehouse: 'W002 嘉兴仓', storeCode: 'ST005', storeName: '嘉兴秀洲店', skuCode: 'SKU002', skuName: '香蕉', skuSource: '正常商品', skuCategoryPath: '生鲜 / 水果 / 浆果类', spec: '10kg/箱', qty: 6, qtyUnit: '份', lineAmount: 420, shippedQty: 6, receivedQty: 6, sheetNo: 'MDH2026042512000002', sheetHeaderStatus: '发货完成' }
    ];
})();
