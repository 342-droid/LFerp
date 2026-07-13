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
     * 门店订货单单据来源枚举
     */
    window.STORE_ORDER_SHEET_DOC_SOURCES = {
        DEMAND_SUMMARY: '门店订货汇总生成',
        MANUAL: '手动新增',
        AFTER_SALES_RESEND: '售后补送'
    };

    /**
     * sheetNo 为门店订货单号，sheetHeaderStatus 为可选的整单「单据状态」覆写
     * （否则由 purchase_store_order_sheet 按行订单状态聚合推导）；
     * 整单状态枚举：初始、待发货、部分发货、发货完成、已到店、部分收货、已完成、已取消。
     * 整单维度的 docSource、remark、createdBy、updatedAt、updatedBy、sourceOrderNo、relatedOrderNo、poNo 可写在同单任意一行（建议首行），供门店订货单列表展示；
     * sourceOrderNo 为来源单号（如 C 端消费者订单号），可写在多行或同一行以逗号分隔多个单号；relatedOrderNo 为关联单号（如 WMS 出库单号）；poNo 为采购单号。
     * 未写 docSource/remark 时列表默认展示「门店订货汇总生成」。docSource 枚举含门店订货汇总生成、手动新增、售后补送。
     * 销售总价 / 明细「销售金额」：各行写 lineAmount（行小计），列表销售总价为其求和；若某行写 sheetOrderTotal 则整单销售总价以该值为准（应与明细 lineAmount 汇总等业务规则一致）。
     * 明细可写 shippedQty、receivedQty（对应界面「发货量」「收货量」，与 qty 同单位）；未写时详情页对应用「—」。
     * orderSource 枚举含商城/直播间、代采订单；fulfillmentMethod 枚举含快递到店、快递到家、平台配送。
     * 履约方式为快递到店、快递到家时，门店订货单列表/详情展示层会将配送/收货仓库、关联单号置空；采购单号不区分履约方式均正常展示；门店订货汇总详情仍展示行上的仓库信息。
     */
    /**
     * 根据行上的营销类型或历史 skuSource / orderType 推导营销类型
     * @param {Object} row
     * @returns {string}
     */
    /** 商品编码 -> 商品图片（列表展示用；行上可写 skuImage 覆盖） */
    window.PURCHASE_STORE_SKU_IMAGES = {
        SKU001: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=64&h=64&fit=crop',
        SKU002: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=64&h=64&fit=crop',
        SKU003: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=64&h=64&fit=crop'
    };

    /**
     * @param {Object} row
     * @returns {string}
     */
    window.resolvePurchaseStoreSkuImage = function(row) {
        if (row && row.skuImage) {
            return String(row.skuImage).trim();
        }
        var code = row && row.skuCode ? String(row.skuCode).trim() : '';
        var map = window.PURCHASE_STORE_SKU_IMAGES || {};
        return code && map[code] ? map[code] : '';
    };

    window.resolvePurchaseStoreMarketingType = function(row) {
        if (row && row.marketingType) {
            return String(row.marketingType).trim();
        }
        var skuSource = row && row.skuSource ? String(row.skuSource).trim() : '';
        var orderType = row && row.orderType ? String(row.orderType).trim() : '';
        if (skuSource === '积分商品' || skuSource === '积分') {
            return '积分兑换';
        }
        if (skuSource === '拉新商品' || skuSource === '拉新') {
            return '拉新赠品';
        }
        if (skuSource === '福袋商品' || orderType === '福袋订单') {
            return '福袋奖品';
        }
        return '普通售卖';
    };

    window.PURCHASE_STORE_ORDER_LINES = [
        { placeOrderDate: '2026-04-20', paymentDate: '2026-04-20', orderSource: '商城/直播间', fulfillmentMethod: '快递到店', orderStatus: '待发货', liveSession: 'ZB20260420-晚场', deliveryWarehouse: 'W001 南京仓', receivingWarehouse: 'W001 南京仓', storeCode: 'ST001', storeName: '南京新街口店', skuCode: 'SKU001', skuName: '红富士苹果', skuSource: '正常商品', skuCategoryPath: '生鲜 / 水果 / 仁果类', spec: '5kg/箱', qty: 30, qtyUnit: '件', lineAmount: 5400, shippedQty: 0, receivedQty: 0, sheetNo: 'MDH2026042012000037', sheetHeaderStatus: '初始', sourceOrderNo: 'CO202604200001', poNo: 'PO2026042012000001', createdBy: '张敏', updatedAt: '2026-04-20 20:15:00', updatedBy: '李强' },
        { placeOrderDate: '2026-04-20', paymentDate: '2026-04-20', orderSource: '商城/直播间', fulfillmentMethod: '快递到店', orderStatus: '待发货', liveSession: 'ZB20260420-晚场', deliveryWarehouse: 'W001 南京仓', receivingWarehouse: 'W001 南京仓', storeCode: 'ST001', storeName: '南京新街口店', skuCode: 'SKU002', skuName: '香蕉', skuSource: '正常商品', skuCategoryPath: '生鲜 / 水果 / 浆果类', spec: '10kg/箱', qty: 15, qtyUnit: '份', lineAmount: 1125, shippedQty: 0, receivedQty: 0, sheetNo: 'MDH2026042012000037', sourceOrderNo: 'CO202604200002' },
        { placeOrderDate: '2026-04-20', paymentDate: '2026-04-21', orderSource: '商城/直播间', fulfillmentMethod: '快递到家', orderStatus: '退款中', liveSession: 'ZB20260420-早场', deliveryWarehouse: 'W003 上海仓', receivingWarehouse: 'W003 上海仓', storeCode: 'ST002', storeName: '上海徐家汇店', skuCode: 'SKU001', skuName: '红富士苹果', skuSource: '积分商品', skuCategoryPath: '生鲜 / 水果 / 仁果类', spec: '5kg/箱', qty: 20, qtyUnit: '件', lineAmount: 3800, shippedQty: 0, receivedQty: 0, sheetNo: 'MDH2026042015301528', sourceOrderNo: 'CO202604200015', poNo: 'PO2026042012150002', createdBy: '王华', updatedAt: '2026-04-20 19:30:00', updatedBy: '王华' },
        { placeOrderDate: '2026-04-20', paymentDate: '2026-04-20', orderSource: '商城/直播间', fulfillmentMethod: '快递到家', orderStatus: '待发货', liveSession: 'ZB20260420-早场', deliveryWarehouse: 'W003 上海仓', receivingWarehouse: 'W003 上海仓', storeCode: 'ST002', storeName: '上海徐家汇店', skuCode: 'SKU003', skuName: '脐橙', skuSource: '福袋商品', skuCategoryPath: '生鲜 / 水果 / 柑橘类', spec: '礼盒装', qty: 12, qtyUnit: '箱', lineAmount: 1680, shippedQty: 0, receivedQty: 0, sheetNo: 'MDH2026042015301528', sourceOrderNo: 'CO202604200016' },
        { placeOrderDate: '2026-04-21', paymentDate: '2026-04-21', orderSource: '商城/直播间', fulfillmentMethod: '平台配送', orderStatus: '待发货', liveSession: 'ZB20260421-晚场', deliveryWarehouse: 'W002 嘉兴仓', receivingWarehouse: 'W001 南京仓', storeCode: 'ST003', storeName: '杭州西湖店', skuCode: 'SKU001', skuName: '红富士苹果', skuSource: '正常商品', skuCategoryPath: '生鲜 / 水果 / 仁果类', spec: '5kg/箱', qty: 25, qtyUnit: '件', lineAmount: 4125, shippedQty: 25, receivedQty: 25, sheetNo: 'MDH2026042118154291', sheetHeaderStatus: '已完成', sourceOrderNo: 'CO202604210028', relatedOrderNo: 'OBD202604210028', poNo: 'PO2026042110300003', createdBy: '刘洋', updatedAt: '2026-04-22 09:00:00', updatedBy: '陈晨' },
        { placeOrderDate: '2026-04-21', paymentDate: '2026-04-22', orderSource: '商城/直播间', fulfillmentMethod: '平台配送', orderStatus: '退款中', liveSession: 'ZB20260421-晚场', deliveryWarehouse: 'W002 嘉兴仓', receivingWarehouse: 'W001 南京仓', storeCode: 'ST003', storeName: '杭州西湖店', skuCode: 'SKU002', skuName: '香蕉', skuSource: '积分商品', skuCategoryPath: '生鲜 / 水果 / 浆果类', spec: '10kg/箱', qty: 18, qtyUnit: '份', lineAmount: 864, shippedQty: 0, receivedQty: 0, sheetNo: 'MDH2026042118154291', sourceOrderNo: 'CO202604210029' },
        { placeOrderDate: '2026-04-21', paymentDate: '2026-04-21', orderSource: '商城/直播间', fulfillmentMethod: '快递到家', orderStatus: '待发货', liveSession: 'ZB20260421-晚场', deliveryWarehouse: 'W004 北京仓', receivingWarehouse: 'W004 北京仓', storeCode: 'ST003', storeName: '杭州西湖店', skuCode: 'SKU002', skuName: '香蕉', skuSource: '福袋商品', skuCategoryPath: '食品 / 零食 / 膨化食品', spec: '5kg/箱', qty: 10, qtyUnit: '份', lineAmount: 320, shippedQty: 10, receivedQty: 9, sheetNo: 'MDH2026042118154291', sourceOrderNo: 'CO202604210030, CO202604210031' },
        { placeOrderDate: '2026-04-22', paymentDate: '2026-04-22', orderSource: '商城/直播间', fulfillmentMethod: '快递到店', orderStatus: '退款中', liveSession: 'ZB20260420-早场', deliveryWarehouse: 'W001 南京仓', receivingWarehouse: 'W001 南京仓', storeCode: 'ST001', storeName: '南京新街口店', skuCode: 'SKU001', skuName: '红富士苹果', skuSource: '正常商品', skuCategoryPath: '生鲜 / 水果 / 仁果类', spec: '5kg/箱', qty: 5, qtyUnit: '件', lineAmount: 425, shippedQty: 0, receivedQty: 0, sheetNo: 'MDH2026042210300055', sourceOrderNo: 'CO202604220042', poNo: 'PO2026042209000005', createdBy: '赵刚', updatedAt: '2026-04-22 16:45:00', updatedBy: '张敏' },
        { placeOrderDate: '2026-04-22', paymentDate: '2026-04-22', orderSource: '商城/直播间', fulfillmentMethod: '快递到店', orderStatus: '退款中', liveSession: 'ZB20260420-早场', deliveryWarehouse: 'W001 南京仓', receivingWarehouse: 'W001 南京仓', storeCode: 'ST001', storeName: '南京新街口店', skuCode: 'SKU002', skuName: '香蕉', skuSource: '正常商品', skuCategoryPath: '生鲜 / 水果 / 浆果类', spec: '10kg/箱', qty: 3, qtyUnit: '份', lineAmount: 198, shippedQty: 0, receivedQty: 0, sheetNo: 'MDH2026042210300055' },
        { placeOrderDate: '2026-04-24', paymentDate: '2026-04-24', orderSource: '商城/直播间', fulfillmentMethod: '快递到店', orderStatus: '待发货', liveSession: '—', deliveryWarehouse: 'W001 南京仓', receivingWarehouse: 'W001 南京仓', storeCode: 'ST001', storeName: '南京新街口店', skuCode: 'SKU001', skuName: '红富士苹果', skuSource: '正常商品', skuCategoryPath: '生鲜 / 水果 / 仁果类', spec: '5kg/箱', qty: 2, qtyUnit: '件', lineAmount: 170, shippedQty: 0, receivedQty: 0, sheetNo: 'MDH2026042414300088', sheetHeaderStatus: '初始', docSource: '售后补送', sourceOrderNo: 'CO202604200001', remark: '售后补发苹果', createdBy: '客服小张', updatedAt: '2026-04-24 14:30:00', updatedBy: '客服小张' },
        { placeOrderDate: '2026-04-23', paymentDate: '2026-04-23', orderSource: '商城/直播间', fulfillmentMethod: '快递到店', orderStatus: '待发货', liveSession: 'ZB20260421-晚场', deliveryWarehouse: 'W004 北京仓', receivingWarehouse: 'W004 北京仓', storeCode: 'ST002', storeName: '上海徐家汇店', skuCode: 'SKU003', skuName: '脐橙', skuSource: '正常商品', skuCategoryPath: '生鲜 / 水果 / 柑橘类', spec: '礼盒装', qty: 8, qtyUnit: '箱', lineAmount: 1200, shippedQty: 6, receivedQty: 0, sheetNo: 'MDH2026042310050088', sheetHeaderStatus: '部分发货', docSource: '手动新增', poNo: 'PO2026042211000006', createdBy: '王华', updatedAt: '2026-04-23 10:20:00', updatedBy: '王华' },
        { placeOrderDate: '2026-04-23', paymentDate: '2026-04-23', orderSource: '商城/直播间', fulfillmentMethod: '快递到店', orderStatus: '待发货', liveSession: 'ZB20260421-晚场', deliveryWarehouse: 'W004 北京仓', receivingWarehouse: 'W004 北京仓', storeCode: 'ST002', storeName: '上海徐家汇店', skuCode: 'SKU001', skuName: '红富士苹果', skuSource: '正常商品', skuCategoryPath: '生鲜 / 水果 / 仁果类', spec: '5kg/箱', qty: 6, qtyUnit: '件', lineAmount: 1020, shippedQty: 5, receivedQty: 4, sheetNo: 'MDH2026042310050088' },
        { placeOrderDate: '2026-04-23', paymentDate: '2026-04-23', orderSource: '商城/直播间', fulfillmentMethod: '平台配送', orderStatus: '待发货', liveSession: 'ZB20260420-早场', deliveryWarehouse: 'W002 嘉兴仓', receivingWarehouse: 'W001 南京仓', storeCode: 'ST001', storeName: '南京新街口店', skuCode: 'SKU002', skuName: '香蕉', skuSource: '福袋商品', skuCategoryPath: '生鲜 / 水果 / 浆果类', spec: '10kg/箱', qty: 9, qtyUnit: '份', lineAmount: 450, shippedQty: 9, receivedQty: 6, sheetNo: 'MDH2026042311450096', sheetHeaderStatus: '部分收货', sourceOrderNo: 'CO202604230061', relatedOrderNo: 'OBD202604230061', poNo: 'PO2026042308000007', createdBy: '张敏', updatedAt: '2026-04-23 12:05:00', updatedBy: '李强' },
        { placeOrderDate: '2026-04-23', paymentDate: '2026-04-23', orderSource: '商城/直播间', fulfillmentMethod: '平台配送', orderStatus: '待发货', liveSession: 'ZB20260420-早场', deliveryWarehouse: 'W002 嘉兴仓', receivingWarehouse: 'W001 南京仓', storeCode: 'ST001', storeName: '南京新街口店', skuCode: 'SKU001', skuName: '红富士苹果', skuSource: '正常商品', skuCategoryPath: '生鲜 / 水果 / 仁果类', spec: '5kg/箱', qty: 4, qtyUnit: '件', lineAmount: 620, shippedQty: 4, receivedQty: 4, sheetNo: 'MDH2026042311450096' },
        { placeOrderDate: '2026-04-25', paymentDate: '2026-04-25', orderSource: '代采订单', fulfillmentMethod: '快递到店', orderStatus: '待发货', liveSession: 'ZB20260421-晚场', deliveryWarehouse: 'W001 南京仓', receivingWarehouse: 'W001 南京仓', storeCode: 'ST004', storeName: '南京夫子庙店', skuCode: 'SKU001', skuName: '红富士苹果', skuSource: '正常商品', skuCategoryPath: '生鲜 / 水果 / 仁果类', spec: '5kg/箱', qty: 12, qtyUnit: '件', lineAmount: 1999, shippedQty: 12, receivedQty: 10, sheetNo: 'MDH2026042512000001', sheetHeaderStatus: '已到店', sourceOrderNo: 'CO202604250088', poNo: 'PO2026042114000004' },
        { placeOrderDate: '2026-04-25', paymentDate: '2026-04-25', orderSource: '代采订单', fulfillmentMethod: '平台配送', orderStatus: '待发货', liveSession: 'ZB20260420-晚场', deliveryWarehouse: 'W002 嘉兴仓', receivingWarehouse: 'W002 嘉兴仓', storeCode: 'ST005', storeName: '嘉兴秀洲店', skuCode: 'SKU002', skuName: '香蕉', skuSource: '正常商品', skuCategoryPath: '生鲜 / 水果 / 浆果类', spec: '10kg/箱', qty: 6, qtyUnit: '份', lineAmount: 420, shippedQty: 6, receivedQty: 6, sheetNo: 'MDH2026042512000002', sheetHeaderStatus: '发货完成', sourceOrderNo: 'CO202604250099', relatedOrderNo: 'OBD202604250099', poNo: 'PO2026042316000008' }
    ];
})();
