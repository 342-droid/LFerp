/* 采购单列表页模拟数据 */
(function() {
    'use strict';

    /**
     * 采购单单据来源枚举
     */
    window.PURCHASE_ORDER_DOC_SOURCES = {
        DEMAND_SUMMARY: '采购需求汇总',
        MANUAL: '手动新增'
    };

    /**
     * receiveInfo / receiveName、receiveAddress、receivePhone、receiver 为详情「收货信息」
     */
    window.PURCHASE_ORDER_WAREHOUSE_RECEIVE_INFO = {
        'W001 南京仓': {
            receiveName: 'W001 南京仓',
            receiveAddress: '江苏省南京市江宁区禄口街道冷丰物流园A区',
            receivePhone: '025-88886666',
            receiver: '周仓管'
        },
        'W002 嘉兴仓': {
            receiveName: 'W002 嘉兴仓',
            receiveAddress: '浙江省嘉兴市南湖区大桥镇冷链仓储中心3号库',
            receivePhone: '0573-66668888',
            receiver: '吴收货'
        },
        'W003 上海仓': {
            receiveName: 'W003 上海仓',
            receiveAddress: '上海市嘉定区马陆镇丰茂路88号',
            receivePhone: '021-55667788',
            receiver: '孙主管'
        },
        'W004 北京仓': {
            receiveName: 'W004 北京仓',
            receiveAddress: '北京市大兴区亦庄经济开发区物流基地B座',
            receivePhone: '010-66554433',
            receiver: '郑库管'
        }
    };

    /**
     * @param {Object} row
     * @returns {{ receiveName: string, receiveAddress: string, receivePhone: string, receiver: string }}
     */
    window.resolvePurchaseOrderReceiveInfo = function(row) {
        var empty = '—';
        if (!row) {
            return {
                receiveName: empty,
                receiveAddress: empty,
                receivePhone: empty,
                receiver: empty
            };
        }
        var info = row.receiveInfo && typeof row.receiveInfo === 'object' ? row.receiveInfo : null;
        var warehouse = String(row.warehouse || '').trim();
        var map = window.PURCHASE_ORDER_WAREHOUSE_RECEIVE_INFO || {};
        var fallback = warehouse && map[warehouse] ? map[warehouse] : {};
        var receiveInfo = {
            receiveName: (info && info.receiveName) || row.receiveName || fallback.receiveName || warehouse || empty,
            receiveAddress: (info && info.receiveAddress) || row.receiveAddress || fallback.receiveAddress || empty,
            receivePhone: (info && info.receivePhone) || row.receivePhone || fallback.receivePhone || empty,
            receiver: (info && info.receiver) || row.receiver || fallback.receiver || empty
        };
        return receiveInfo;
    };

    /**
     * orderSource / fulfillmentMethod 枚举见 CommonOptions（零售订单仅平台配送；代采订单支持快递配送、平台配送）。
     * docStatus 枚举见 CommonOptions.purchaseOrderDocStatus：待审核、已驳回、初始（列表展示为待收货）、部分收货、已完成、已取消。
     * sourceOrderNo 为来源单号（门店订货单号 MDH 前缀，可逗号分隔多个）；单据来源为手动新增时列表/详情展示层将来源单号置空；relatedOrderNo 为关联单号（如 WMS 采购入库单号）。
     * 明细行 logisticsNo 支持多个物流单号（逗号/分号/空格分隔）；物流确认按采购单+商品维度维护。
     */
    window.PURCHASE_ORDERS = [
        {
            poNo: 'PO2026042012000001',
            sourceOrderNo: 'MDH2026042012000037',
            relatedOrderNo: 'IBD2026042012000001',
            orderSource: '零售订单',
            fulfillmentMethod: '平台配送',
            warehouse: 'W001 南京仓',
            supplier: '华东果蔬有限公司',
            docStatus: '待审核',
            docSource: '采购需求汇总',
            deliveryDate: '2026-04-28',
            remark: '首批补货',
            createdAt: '2026-04-20 10:12:00',
            createdBy: '张敏',
            lines: [
                { skuCode: 'SKU001', skuName: '红富士苹果', spec: '5kg/箱', skuCategory: '生鲜 / 水果 / 仁果类', qtyUnit: '件', buyer: '张敏', purchaseQty: 100, receivedQty: 0, suggestedUnitPrice: 5.2, actualUnitPrice: 5.0, saleUnitPrice: 4.2, purchaseAmount: 500, saleAmount: 420, prepaidAmount: 100, lineRemark: '' },
                { skuCode: 'SKU002', skuName: '香蕉', spec: '4kg/箱', skuCategory: '生鲜 / 水果 / 浆果类', qtyUnit: '箱', buyer: '李强', purchaseQty: 50, receivedQty: 0, suggestedUnitPrice: 4.5, actualUnitPrice: 4.3, saleUnitPrice: 4.0, purchaseAmount: 215, saleAmount: 200, prepaidAmount: 0, lineRemark: '按箱' }
            ]
        },
        {
            poNo: 'PO2026042012150002',
            sourceOrderNo: 'MDH2026042012000037',
            relatedOrderNo: 'IBD2026042012150002',
            orderSource: '零售订单',
            fulfillmentMethod: '平台配送',
            warehouse: 'W002 嘉兴仓',
            supplier: '浙北农产品合作社',
            docStatus: '部分收货',
            docSource: '采购需求汇总',
            logisticsNo: 'SF1234567890123',
            deliveryDate: '2026-04-26',
            remark: '',
            auditBy: '王主管',
            auditAt: '2026-04-20 16:05:00',
            auditReason: '数量与单价核对无误，审核通过',
            createdAt: '2026-04-20 15:30:22',
            createdBy: '李强',
            updatedAt: '2026-04-21 09:10:00',
            updatedBy: '李强',
            lines: [
                { skuCode: 'SKU003', skuName: '脐橙', spec: '10kg/箱', skuCategory: '生鲜 / 水果 / 柑橘类', qtyUnit: '箱', buyer: '李强', purchaseQty: 80, receivedQty: 45, suggestedUnitPrice: 6.8, actualUnitPrice: 6.5, saleUnitPrice: 6.2, purchaseAmount: 520, saleAmount: 496, prepaidAmount: 150, lineRemark: '礼盒优先发', logisticsNo: 'SF1234567890123,SF1234567890124' },
                { skuCode: 'SKU001', skuName: '红富士苹果', spec: '5kg/箱', skuCategory: '生鲜 / 水果 / 仁果类', qtyUnit: '件', buyer: '李强', purchaseQty: 60, receivedQty: 60, suggestedUnitPrice: 5.2, actualUnitPrice: 5.0, saleUnitPrice: 4.8, purchaseAmount: 300, saleAmount: 288, prepaidAmount: 50, lineRemark: '', logisticsNo: 'YT9876543210987' },
                { skuCode: 'SKU002', skuName: '香蕉', spec: '4kg/箱', skuCategory: '生鲜 / 水果 / 浆果类', qtyUnit: '箱', buyer: '陈晨', purchaseQty: 40, receivedQty: 0, suggestedUnitPrice: 4.5, actualUnitPrice: 4.3, saleUnitPrice: 4.0, purchaseAmount: 172, saleAmount: 160, prepaidAmount: 0, lineRemark: '待发第二批', logisticsNo: 'YT9876543210999' }
            ]
        },
        {
            poNo: 'PO2026042114000004',
            sourceOrderNo: 'MDH2026042512000001',
            relatedOrderNo: 'IBD2026042114000004',
            orderSource: '代采订单',
            fulfillmentMethod: '快递配送',
            warehouse: 'W001 南京仓',
            supplier: '苏果直采中心',
            docStatus: '已取消',
            docSource: '采购需求汇总',
            deliveryDate: '2026-04-27',
            remark: '客户撤单',
            createdAt: '2026-04-21 14:00:18',
            createdBy: '赵刚',
            lines: [
                { skuCode: 'SKU005', skuName: '精品番茄', spec: '500g/袋', skuCategory: '生鲜 / 蔬菜 / 茄果类', qtyUnit: '件', buyer: '赵刚', purchaseQty: 40, receivedQty: 0, suggestedUnitPrice: 8.0, actualUnitPrice: 7.8, saleUnitPrice: 7.2, purchaseAmount: 312, saleAmount: 288, prepaidAmount: 0, lineRemark: '' }
            ]
        },
        {
            poNo: 'PO2026042209000005',
            sourceOrderNo: 'MDH2026042210300055',
            relatedOrderNo: 'IBD2026042209000005',
            orderSource: '零售订单',
            fulfillmentMethod: '平台配送',
            warehouse: 'W004 北京仓',
            supplier: '华北冷链物流',
            docStatus: '已驳回',
            docSource: '采购需求汇总',
            deliveryDate: '2026-04-29',
            remark: '需冷链',
            auditBy: '王主管',
            auditAt: '2026-04-22 11:20:00',
            auditReason: '冷链运力不足，请调整发货仓或拆单后重提',
            createdAt: '2026-04-22 09:00:45',
            createdBy: '刘洋',
            updatedAt: '2026-04-22 11:20:00',
            updatedBy: '王主管',
            lines: [
                { skuCode: 'SKU002', skuName: '香蕉', spec: '4kg/箱', skuCategory: '生鲜 / 水果 / 浆果类', qtyUnit: '件', buyer: '刘洋', purchaseQty: 120, receivedQty: 0, suggestedUnitPrice: 4.5, actualUnitPrice: 4.5, saleUnitPrice: 4.2, purchaseAmount: 540, saleAmount: 504, prepaidAmount: 100, lineRemark: '冷链车' }
            ]
        },
        {
            poNo: 'PO2026042211000006',
            sourceOrderNo: 'MDH2026042311450096',
            relatedOrderNo: 'IBD2026042211000006',
            orderSource: '零售订单',
            fulfillmentMethod: '平台配送',
            warehouse: 'W002 嘉兴仓',
            supplier: '浙北农产品合作社',
            docStatus: '部分收货',
            docSource: '采购需求汇总',
            deliveryDate: '2026-04-25',
            remark: '分批发货',
            createdAt: '2026-04-22 11:05:00',
            createdBy: '陈晨',
            lines: [
                { skuCode: 'SKU001', skuName: '红富士苹果', spec: '5kg/箱', skuCategory: '生鲜 / 水果 / 仁果类', qtyUnit: '件', buyer: '陈晨', purchaseQty: 90, receivedQty: 90, suggestedUnitPrice: 5.2, actualUnitPrice: 5.0, saleUnitPrice: 4.8, purchaseAmount: 450, saleAmount: 432, prepaidAmount: 0, lineRemark: '' },
                { skuCode: 'SKU003', skuName: '脐橙', spec: '10kg/箱', skuCategory: '生鲜 / 水果 / 柑橘类', qtyUnit: '箱', buyer: '李强', purchaseQty: 70, receivedQty: 20, suggestedUnitPrice: 6.8, actualUnitPrice: 6.6, saleUnitPrice: 6.4, purchaseAmount: 462, saleAmount: 448, prepaidAmount: 100, lineRemark: '第二批待收' }
            ]
        },
        {
            poNo: 'PO2026042308000007',
            sourceOrderNo: 'MDH2026042311450096',
            relatedOrderNo: 'IBD2026042308000007',
            orderSource: '零售订单',
            fulfillmentMethod: '平台配送',
            warehouse: 'W003 上海仓',
            supplier: '上海鲜达供应链',
            docStatus: '已完成',
            docSource: '采购需求汇总',
            deliveryDate: '2026-04-23',
            remark: '按门店拆分，当前门店：ST001 南京新街口店',
            receiveInfo: {
                receiveName: 'ST001 南京新街口店',
                receiveAddress: '江苏省南京市玄武区中山路18号',
                receivePhone: '13812345678',
                receiver: '王明'
            },
            createdAt: '2026-04-23 08:15:30',
            createdBy: '张敏',
            lines: [
                { skuCode: 'SKU006', skuName: '精品黄瓜', spec: '2kg/袋', skuCategory: '生鲜 / 蔬菜 / 叶菜类', qtyUnit: '斤', buyer: '张敏', purchaseQty: 150, receivedQty: 150, suggestedUnitPrice: 2.2, actualUnitPrice: 2.1, saleUnitPrice: 2.0, purchaseAmount: 315, saleAmount: 300, prepaidAmount: 50, lineRemark: '' }
            ]
        },
        {
            poNo: 'PO2026042514300009',
            sourceOrderNo: 'MDH2026042512000002',
            relatedOrderNo: 'IBD2026042514300009',
            orderSource: '代采订单',
            fulfillmentMethod: '平台配送',
            warehouse: 'W002 嘉兴仓',
            supplier: '浙北农产品合作社',
            docStatus: '部分收货',
            docSource: '采购需求汇总',
            logisticsNo: 'JD5566778899001',
            deliveryDate: '2026-04-28',
            remark: '代采平台配送，按仓配发',
            createdAt: '2026-04-25 14:30:00',
            createdBy: '刘洋',
            lines: [
                { skuCode: 'SKU002', skuName: '香蕉', spec: '4kg/箱', skuCategory: '生鲜 / 水果 / 浆果类', qtyUnit: '份', buyer: '刘洋', purchaseQty: 60, receivedQty: 30, suggestedUnitPrice: 4.5, actualUnitPrice: 4.4, saleUnitPrice: 4.2, purchaseAmount: 264, saleAmount: 252, prepaidAmount: 80, lineRemark: '代采补货', logisticsNo: 'JD5566778899001' },
                { skuCode: 'SKU001', skuName: '红富士苹果', spec: '5kg/箱', skuCategory: '生鲜 / 水果 / 仁果类', qtyUnit: '件', buyer: '陈晨', purchaseQty: 40, receivedQty: 0, suggestedUnitPrice: 5.2, actualUnitPrice: 5.0, saleUnitPrice: 4.8, purchaseAmount: 200, saleAmount: 192, prepaidAmount: 0, lineRemark: '待二批发运' }
            ]
        },
        {
            poNo: 'PO2026042610150010',
            sourceOrderNo: '',
            relatedOrderNo: 'IBD2026042610150010',
            orderSource: '',
            fulfillmentMethod: '',
            warehouse: 'W001 南京仓',
            supplier: '华东果蔬有限公司',
            docStatus: '初始',
            docSource: '手动新增',
            deliveryDate: '2026-04-30',
            remark: '手工建单补货',
            auditBy: '王主管',
            auditAt: '2026-04-26 11:00:00',
            auditReason: '手工补货单审核通过',
            createdAt: '2026-04-26 10:15:00',
            createdBy: '王华',
            updatedAt: '2026-04-26 11:00:00',
            updatedBy: '王主管',
            lines: [
                { skuCode: 'SKU001', skuName: '红富士苹果', spec: '5kg/箱', skuCategory: '生鲜 / 水果 / 仁果类', qtyUnit: '件', buyer: '王华', purchaseQty: 50, receivedQty: 0, suggestedUnitPrice: 5.2, actualUnitPrice: 5.0, saleUnitPrice: 4.8, purchaseAmount: 250, saleAmount: 240, prepaidAmount: 0, lineRemark: '' }
            ]
        },
        {
            poNo: 'PO2026042710000011',
            sourceOrderNo: 'MDH2026042710000011',
            relatedOrderNo: 'IBD2026042710000011',
            orderSource: '零售订单',
            fulfillmentMethod: '平台配送',
            warehouse: 'W002 嘉兴仓',
            supplier: '浙北农产品合作社',
            docStatus: '待审核',
            docSource: '采购需求汇总',
            deliveryDate: '2026-04-30',
            remark: '周末门店补货',
            createdAt: '2026-04-27 10:00:00',
            createdBy: '李强',
            lines: [
                { skuCode: 'SKU003', skuName: '脐橙', spec: '10kg/箱', skuCategory: '生鲜 / 水果 / 柑橘类', qtyUnit: '箱', buyer: '李强', purchaseQty: 60, receivedQty: 0, suggestedUnitPrice: 6.8, actualUnitPrice: 6.5, saleUnitPrice: 6.2, purchaseAmount: 390, saleAmount: 372, prepaidAmount: 50, lineRemark: '' },
                { skuCode: 'SKU002', skuName: '香蕉', spec: '4kg/箱', skuCategory: '生鲜 / 水果 / 浆果类', qtyUnit: '箱', buyer: '陈晨', purchaseQty: 30, receivedQty: 0, suggestedUnitPrice: 4.5, actualUnitPrice: 4.3, saleUnitPrice: 4.0, purchaseAmount: 129, saleAmount: 120, prepaidAmount: 0, lineRemark: '' }
            ]
        },
        {
            poNo: 'PO2026042714000012',
            sourceOrderNo: 'MDH2026042714000012',
            relatedOrderNo: 'IBD2026042714000012',
            orderSource: '代采订单',
            fulfillmentMethod: '平台配送',
            warehouse: 'W003 上海仓',
            supplier: '上海鲜达供应链',
            docStatus: '待审核',
            docSource: '采购需求汇总',
            deliveryDate: '2026-05-01',
            remark: '代采急单待审',
            createdAt: '2026-04-27 14:00:00',
            createdBy: '刘洋',
            lines: [
                { skuCode: 'SKU005', skuName: '精品番茄', spec: '500g/袋', skuCategory: '生鲜 / 蔬菜 / 茄果类', qtyUnit: '件', buyer: '刘洋', purchaseQty: 80, receivedQty: 0, suggestedUnitPrice: 8.0, actualUnitPrice: 7.8, saleUnitPrice: 7.2, purchaseAmount: 624, saleAmount: 576, prepaidAmount: 100, lineRemark: '优先发货' }
            ]
        },
        {
            poNo: 'PO2026042810000013',
            sourceOrderNo: '',
            relatedOrderNo: 'IBD2026042810000013',
            orderSource: '',
            fulfillmentMethod: '平台配送',
            warehouse: 'W004 北京仓',
            supplier: '华北冷链物流',
            docStatus: '待审核',
            docSource: '手动新增',
            deliveryDate: '2026-05-02',
            remark: '手工建单待审',
            createdAt: '2026-04-28 10:00:00',
            createdBy: '王华',
            lines: [
                { skuCode: 'SKU006', skuName: '精品黄瓜', spec: '2kg/袋', skuCategory: '生鲜 / 蔬菜 / 叶菜类', qtyUnit: '斤', buyer: '王华', purchaseQty: 200, receivedQty: 0, suggestedUnitPrice: 2.2, actualUnitPrice: 2.1, saleUnitPrice: 2.0, purchaseAmount: 420, saleAmount: 400, prepaidAmount: 0, lineRemark: '' },
                { skuCode: 'SKU001', skuName: '红富士苹果', spec: '5kg/箱', skuCategory: '生鲜 / 水果 / 仁果类', qtyUnit: '件', buyer: '王华', purchaseQty: 40, receivedQty: 0, suggestedUnitPrice: 5.2, actualUnitPrice: 5.0, saleUnitPrice: 4.8, purchaseAmount: 200, saleAmount: 192, prepaidAmount: 50, lineRemark: '' }
            ]
        }
    ];
})();
