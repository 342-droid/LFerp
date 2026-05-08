/* 采购需求汇总页模拟明细；列表由页面按商品+供应商+采购类型聚合。 */
(function() {
    'use strict';

    window.SKU_CATEGORY_TREE_PURCHASE_DEMAND = {
        生鲜: {
            水果: ['仁果类', '浆果类', '柑橘类'],
            蔬菜: ['叶菜类', '根茎类']
        },
        食品: {
            零食: ['膨化食品', '糖果']
        }
    };

    /**
     * @typedef {Object} PurchaseDemandDetailLine
     * @property {string} purchaseType 市场直采 | 供应商直发
     * @property {string} orderNo 订货单号（门店订货单，MDH 前缀，与 purchase-store-order-data 一致）
     * @property {string} skuCode
     * @property {string} skuName
     * @property {string} skuCategoryPath
     * @property {string} storeCode
     * @property {string} storeName
     * @property {string} deliveryWarehouse
     * @property {string} receivingWarehouse
     * @property {string} supplier
     * @property {number} orderQty 本行订货数
     * @property {number} salePrice 销售单价（元，门店订货售价参考）
     * @property {number} unitPrice 采购单价（元）
     * @property {number} pendingQty 待采购量
     * @property {string} orderTime 订货时间
     * @property {string} orderDate 订货日期 yyyy-MM-dd（筛选）
     * @property {string} [shipDate] 发货日期 yyyy-MM-dd（筛选，可空）
     */
    window.PURCHASE_DEMAND_DETAIL_LINES = [
        { purchaseType: '市场直采', orderNo: 'MDH20260420001', skuCode: 'SKU001', skuName: '红富士苹果', skuCategoryPath: '生鲜 / 水果 / 仁果类', storeCode: 'ST001', storeName: '南京新街口店', deliveryWarehouse: 'W001 南京仓', receivingWarehouse: 'W001 南京仓', supplier: '鲜果源商贸', orderQty: 30, salePrice: 228, unitPrice: 180, pendingQty: 30, orderTime: '2026-04-20 09:30:00', orderDate: '2026-04-20', shipDate: '2026-04-21' },
        { purchaseType: '市场直采', orderNo: 'MDH20260420002', skuCode: 'SKU001', skuName: '红富士苹果', skuCategoryPath: '生鲜 / 水果 / 仁果类', storeCode: 'ST002', storeName: '上海徐家汇店', deliveryWarehouse: 'W003 上海仓', receivingWarehouse: 'W003 上海仓', supplier: '鲜果源商贸', orderQty: 20, salePrice: 228, unitPrice: 180, pendingQty: 12, orderTime: '2026-04-20 11:00:00', orderDate: '2026-04-20', shipDate: '2026-04-22' },
        { purchaseType: '供应商直发', orderNo: 'MDH20260421001', skuCode: 'SKU002', skuName: '香蕉', skuCategoryPath: '生鲜 / 水果 / 浆果类', storeCode: 'ST001', storeName: '南京新街口店', deliveryWarehouse: 'W001 南京仓', receivingWarehouse: 'W001 南京仓', supplier: '绿园果蔬', orderQty: 15, salePrice: 98, unitPrice: 75, pendingQty: 15, orderTime: '2026-04-21 08:15:00', orderDate: '2026-04-21', shipDate: '' },
        { purchaseType: '供应商直发', orderNo: 'MDH20260421002', skuCode: 'SKU002', skuName: '香蕉', skuCategoryPath: '生鲜 / 水果 / 浆果类', storeCode: 'ST003', storeName: '杭州西湖店', deliveryWarehouse: 'W002 嘉兴仓', receivingWarehouse: 'W001 南京仓', supplier: '绿园果蔬', orderQty: 18, salePrice: 98, unitPrice: 75, pendingQty: 8, orderTime: '2026-04-21 14:20:00', orderDate: '2026-04-21', shipDate: '2026-04-23' },
        { purchaseType: '市场直采', orderNo: 'MDH20260422001', skuCode: 'SKU003', skuName: '脐橙', skuCategoryPath: '生鲜 / 水果 / 柑橘类', storeCode: 'ST002', storeName: '上海徐家汇店', deliveryWarehouse: 'W004 北京仓', receivingWarehouse: 'W004 北京仓', supplier: '柑橘专营', orderQty: 12, salePrice: 178, unitPrice: 140, pendingQty: 12, orderTime: '2026-04-22 10:00:00', orderDate: '2026-04-22', shipDate: '2026-04-24' },
        { purchaseType: '市场直采', orderNo: 'MDH20260422002', skuCode: 'SKU001', skuName: '红富士苹果', skuCategoryPath: '生鲜 / 水果 / 仁果类', storeCode: 'ST003', storeName: '杭州西湖店', deliveryWarehouse: 'W002 嘉兴仓', receivingWarehouse: 'W001 南京仓', supplier: '鲜果源商贸', orderQty: 25, salePrice: 228, unitPrice: 180, pendingQty: 25, orderTime: '2026-04-22 16:45:00', orderDate: '2026-04-22', shipDate: '' },
        { purchaseType: '供应商直发', orderNo: 'MDH20260423001', skuCode: 'SKU004', skuName: '薯片组合装', skuCategoryPath: '食品 / 零食 / 膨化食品', storeCode: 'ST001', storeName: '南京新街口店', deliveryWarehouse: 'W001 南京仓', receivingWarehouse: 'W001 南京仓', supplier: '零食汇', orderQty: 100, salePrice: 45, unitPrice: 32, pendingQty: 100, orderTime: '2026-04-23 09:00:00', orderDate: '2026-04-23', shipDate: '2026-04-25' },
        { purchaseType: '供应商直发', orderNo: 'MDH20260423002', skuCode: 'SKU004', skuName: '薯片组合装', skuCategoryPath: '食品 / 零食 / 膨化食品', storeCode: 'ST002', storeName: '上海徐家汇店', deliveryWarehouse: 'W003 上海仓', receivingWarehouse: 'W003 上海仓', supplier: '零食汇', orderQty: 80, salePrice: 45, unitPrice: 32, pendingQty: 45, orderTime: '2026-04-23 10:30:00', orderDate: '2026-04-23', shipDate: '2026-04-25' },
        { purchaseType: '市场直采', orderNo: 'MDH20260423003', skuCode: 'SKU001', skuName: '红富士苹果', skuCategoryPath: '生鲜 / 水果 / 仁果类', storeCode: 'ST004', storeName: '北京朝阳店', deliveryWarehouse: 'W004 北京仓', receivingWarehouse: 'W004 北京仓', supplier: '鲜果源商贸', orderQty: 40, salePrice: 228, unitPrice: 180, pendingQty: 40, orderTime: '2026-04-23 11:10:00', orderDate: '2026-04-23', shipDate: '2026-04-24' },
        { purchaseType: '市场直采', orderNo: 'MDH20260423004', skuCode: 'SKU001', skuName: '红富士苹果', skuCategoryPath: '生鲜 / 水果 / 仁果类', storeCode: 'ST005', storeName: '苏州观前店', deliveryWarehouse: 'W002 嘉兴仓', receivingWarehouse: 'W001 南京仓', supplier: '鲜果源商贸', orderQty: 22, salePrice: 228, unitPrice: 180, pendingQty: 6, orderTime: '2026-04-23 13:00:00', orderDate: '2026-04-23', shipDate: '' },
        { purchaseType: '供应商直发', orderNo: 'MDH20260423005', skuCode: 'SKU002', skuName: '香蕉', skuCategoryPath: '生鲜 / 水果 / 浆果类', storeCode: 'ST004', storeName: '北京朝阳店', deliveryWarehouse: 'W004 北京仓', receivingWarehouse: 'W004 北京仓', supplier: '绿园果蔬', orderQty: 24, salePrice: 98, unitPrice: 75, pendingQty: 24, orderTime: '2026-04-23 08:40:00', orderDate: '2026-04-23', shipDate: '2026-04-26' },
        { purchaseType: '市场直采', orderNo: 'MDH20260423006', skuCode: 'SKU003', skuName: '脐橙', skuCategoryPath: '生鲜 / 水果 / 柑橘类', storeCode: 'ST001', storeName: '南京新街口店', deliveryWarehouse: 'W001 南京仓', receivingWarehouse: 'W001 南京仓', supplier: '柑橘专营', orderQty: 16, salePrice: 178, unitPrice: 140, pendingQty: 10, orderTime: '2026-04-23 15:20:00', orderDate: '2026-04-23', shipDate: '2026-04-24' },
        { purchaseType: '市场直采', orderNo: 'MDH20260418001', skuCode: 'SKU005', skuName: '上海青', skuCategoryPath: '生鲜 / 蔬菜 / 叶菜类', storeCode: 'ST002', storeName: '上海徐家汇店', deliveryWarehouse: 'W003 上海仓', receivingWarehouse: 'W003 上海仓', supplier: '鲜蔬达', orderQty: 50, salePrice: 6.8, unitPrice: 4.5, pendingQty: 50, orderTime: '2026-04-18 06:00:00', orderDate: '2026-04-18', shipDate: '2026-04-18' },
        { purchaseType: '市场直采', orderNo: 'MDH20260419001', skuCode: 'SKU005', skuName: '上海青', skuCategoryPath: '生鲜 / 蔬菜 / 叶菜类', storeCode: 'ST003', storeName: '杭州西湖店', deliveryWarehouse: 'W002 嘉兴仓', receivingWarehouse: 'W001 南京仓', supplier: '鲜蔬达', orderQty: 35, salePrice: 6.8, unitPrice: 4.5, pendingQty: 20, orderTime: '2026-04-19 07:30:00', orderDate: '2026-04-19', shipDate: '2026-04-19' },
        { purchaseType: '供应商直发', orderNo: 'MDH20260420003', skuCode: 'SKU006', skuName: '胡萝卜', skuCategoryPath: '生鲜 / 蔬菜 / 根茎类', storeCode: 'ST001', storeName: '南京新街口店', deliveryWarehouse: 'W001 南京仓', receivingWarehouse: 'W001 南京仓', supplier: '根茎优选', orderQty: 60, salePrice: 4.9, unitPrice: 3.2, pendingQty: 60, orderTime: '2026-04-20 10:00:00', orderDate: '2026-04-20', shipDate: '2026-04-21' },
        { purchaseType: '供应商直发', orderNo: 'MDH20260420004', skuCode: 'SKU006', skuName: '胡萝卜', skuCategoryPath: '生鲜 / 蔬菜 / 根茎类', storeCode: 'ST005', storeName: '苏州观前店', deliveryWarehouse: 'W002 嘉兴仓', receivingWarehouse: 'W001 南京仓', supplier: '根茎优选', orderQty: 45, salePrice: 4.9, unitPrice: 3.2, pendingQty: 30, orderTime: '2026-04-20 12:15:00', orderDate: '2026-04-20', shipDate: '' },
        { purchaseType: '供应商直发', orderNo: 'MDH20260421003', skuCode: 'SKU007', skuName: '牛奶糖', skuCategoryPath: '食品 / 零食 / 糖果', storeCode: 'ST002', storeName: '上海徐家汇店', deliveryWarehouse: 'W003 上海仓', receivingWarehouse: 'W003 上海仓', supplier: '零食汇', orderQty: 200, salePrice: 25, unitPrice: 18, pendingQty: 200, orderTime: '2026-04-21 09:45:00', orderDate: '2026-04-21', shipDate: '2026-04-23' },
        { purchaseType: '供应商直发', orderNo: 'MDH20260422003', skuCode: 'SKU007', skuName: '牛奶糖', skuCategoryPath: '食品 / 零食 / 糖果', storeCode: 'ST004', storeName: '北京朝阳店', deliveryWarehouse: 'W004 北京仓', receivingWarehouse: 'W004 北京仓', supplier: '零食汇', orderQty: 150, salePrice: 25, unitPrice: 18, pendingQty: 80, orderTime: '2026-04-22 11:30:00', orderDate: '2026-04-22', shipDate: '2026-04-24' }
    ];
})();
