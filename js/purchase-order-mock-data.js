/* 采购单列表页模拟数据 */
(function() {
    'use strict';

    /**
     * 采购单；lines 含 qtyUnit、skuCategory（详情「商品分类」）
     */
    window.PURCHASE_ORDERS = [
        {
            poNo: 'PO2026042012000001',
            warehouse: 'W001 南京仓',
            supplier: '华东果蔬有限公司',
            docStatus: '初始',
            docSource: '采购需求汇总生成',
            deliveryDate: '2026-04-28',
            buyer: '张敏',
            remark: '首批补货',
            createdAt: '2026-04-20 10:12:00',
            createdBy: '张敏',
            lines: [
                { skuCode: 'SKU001', skuName: '红富士苹果', skuCategory: '生鲜 / 水果 / 仁果类', qtyUnit: '件', purchaseQty: 100, receivedQty: 0, suggestedUnitPrice: 5.2, actualUnitPrice: 5.0, saleUnitPrice: 4.2, purchaseAmount: 500, saleAmount: 420, prepaidAmount: 100, lineRemark: '' },
                { skuCode: 'SKU002', skuName: '香蕉', skuCategory: '生鲜 / 水果 / 浆果类', qtyUnit: '箱', purchaseQty: 50, receivedQty: 0, suggestedUnitPrice: 4.5, actualUnitPrice: 4.3, saleUnitPrice: 4.0, purchaseAmount: 215, saleAmount: 200, prepaidAmount: 0, lineRemark: '按箱' }
            ]
        },
        {
            poNo: 'PO2026042012150002',
            warehouse: 'W002 嘉兴仓',
            supplier: '浙北农产品合作社',
            docStatus: '部分收货',
            docSource: '采购需求汇总生成',
            deliveryDate: '2026-04-26',
            buyer: '李强',
            remark: '',
            createdAt: '2026-04-20 15:30:22',
            createdBy: '李强',
            lines: [
                { skuCode: 'SKU003', skuName: '脐橙', skuCategory: '生鲜 / 水果 / 柑橘类', qtyUnit: '箱', purchaseQty: 80, receivedQty: 45, suggestedUnitPrice: 6.8, actualUnitPrice: 6.5, saleUnitPrice: 6.2, purchaseAmount: 520, saleAmount: 496, prepaidAmount: 150, lineRemark: '礼盒优先发' }
            ]
        },
        {
            poNo: 'PO2026042110300003',
            warehouse: 'W003 上海仓',
            supplier: '上海鲜达供应链',
            docStatus: '已完成',
            docSource: '手动新增',
            deliveryDate: '2026-04-24',
            buyer: '王华',
            remark: '合同价已确认',
            createdAt: '2026-04-21 10:30:00',
            createdBy: '王华',
            lines: [
                { skuCode: 'SKU001', skuName: '红富士苹果', skuCategory: '生鲜 / 水果 / 仁果类', qtyUnit: '件', purchaseQty: 60, receivedQty: 60, suggestedUnitPrice: 5.2, actualUnitPrice: 5.1, saleUnitPrice: 4.8, purchaseAmount: 306, saleAmount: 288, prepaidAmount: 60, lineRemark: '' },
                { skuCode: 'SKU004', skuName: '山东大蒜', skuCategory: '生鲜 / 蔬菜 / 根茎类', qtyUnit: '斤', purchaseQty: 200, receivedQty: 200, suggestedUnitPrice: 3.0, actualUnitPrice: 2.95, saleUnitPrice: 2.8, purchaseAmount: 590, saleAmount: 560, prepaidAmount: 200, lineRemark: '净重计价' }
            ]
        },
        {
            poNo: 'PO2026042114000004',
            warehouse: 'W001 南京仓',
            supplier: '苏果直采中心',
            docStatus: '已取消',
            docSource: '手动新增',
            deliveryDate: '2026-04-27',
            buyer: '赵刚',
            remark: '客户撤单',
            createdAt: '2026-04-21 14:00:18',
            createdBy: '赵刚',
            lines: [
                { skuCode: 'SKU005', skuName: '精品番茄', skuCategory: '生鲜 / 蔬菜 / 茄果类', qtyUnit: '件', purchaseQty: 40, receivedQty: 0, suggestedUnitPrice: 8.0, actualUnitPrice: 7.8, saleUnitPrice: 7.2, purchaseAmount: 312, saleAmount: 288, prepaidAmount: 0, lineRemark: '' }
            ]
        },
        {
            poNo: 'PO2026042209000005',
            warehouse: 'W004 北京仓',
            supplier: '华北冷链物流',
            docStatus: '初始',
            docSource: '采购需求汇总生成',
            deliveryDate: '2026-04-29',
            buyer: '刘洋',
            remark: '需冷链',
            createdAt: '2026-04-22 09:00:45',
            createdBy: '刘洋',
            lines: [
                { skuCode: 'SKU002', skuName: '香蕉', skuCategory: '生鲜 / 水果 / 浆果类', qtyUnit: '件', purchaseQty: 120, receivedQty: 0, suggestedUnitPrice: 4.5, actualUnitPrice: 4.5, saleUnitPrice: 4.2, purchaseAmount: 540, saleAmount: 504, prepaidAmount: 100, lineRemark: '冷链车' }
            ]
        },
        {
            poNo: 'PO2026042211000006',
            warehouse: 'W002 嘉兴仓',
            supplier: '浙北农产品合作社',
            docStatus: '部分收货',
            docSource: '采购需求汇总生成',
            deliveryDate: '2026-04-25',
            buyer: '陈晨',
            remark: '分批发货',
            createdAt: '2026-04-22 11:05:00',
            createdBy: '陈晨',
            lines: [
                { skuCode: 'SKU001', skuName: '红富士苹果', skuCategory: '生鲜 / 水果 / 仁果类', qtyUnit: '件', purchaseQty: 90, receivedQty: 90, suggestedUnitPrice: 5.2, actualUnitPrice: 5.0, saleUnitPrice: 4.8, purchaseAmount: 450, saleAmount: 432, prepaidAmount: 0, lineRemark: '' },
                { skuCode: 'SKU003', skuName: '脐橙', skuCategory: '生鲜 / 水果 / 柑橘类', qtyUnit: '箱', purchaseQty: 70, receivedQty: 20, suggestedUnitPrice: 6.8, actualUnitPrice: 6.6, saleUnitPrice: 6.4, purchaseAmount: 462, saleAmount: 448, prepaidAmount: 100, lineRemark: '第二批待收' }
            ]
        },
        {
            poNo: 'PO2026042308000007',
            warehouse: 'W003 上海仓',
            supplier: '上海鲜达供应链',
            docStatus: '已完成',
            docSource: '采购需求汇总生成',
            deliveryDate: '2026-04-23',
            buyer: '张敏',
            remark: '按门店拆分，当前门店：ST001 南京新街口店',
            createdAt: '2026-04-23 08:15:30',
            createdBy: '张敏',
            lines: [
                { skuCode: 'SKU006', skuName: '精品黄瓜', skuCategory: '生鲜 / 蔬菜 / 叶菜类', qtyUnit: '斤', purchaseQty: 150, receivedQty: 150, suggestedUnitPrice: 2.2, actualUnitPrice: 2.1, saleUnitPrice: 2.0, purchaseAmount: 315, saleAmount: 300, prepaidAmount: 50, lineRemark: '' }
            ]
        },
        {
            poNo: 'PO2026042316000008',
            warehouse: 'W001 南京仓',
            supplier: '华东果蔬有限公司',
            docStatus: '初始',
            docSource: '手动新增',
            deliveryDate: '2026-04-30',
            buyer: '李强',
            remark: '临时加单',
            createdAt: '2026-04-23 16:20:00',
            createdBy: '李强',
            lines: [
                { skuCode: 'SKU007', skuName: '进口车厘子', skuCategory: '生鲜 / 水果 / 浆果类', qtyUnit: '箱', purchaseQty: 30, receivedQty: 0, suggestedUnitPrice: 88, actualUnitPrice: 85, saleUnitPrice: 80, purchaseAmount: 2550, saleAmount: 2400, prepaidAmount: 500, lineRemark: 'J级' }
            ]
        }
    ];
})();
