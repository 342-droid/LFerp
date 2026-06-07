/**
 * 模态框管理器 - 统一管理模态框的创建和操作
 */

class ModalManager {
    constructor() {
        this.modals = new Map();
    }

    /**
     * 创建通用模态框HTML
     * @param {Object} config - 模态框配置
     */
    static createModalHTML(config) {
        const {
            id,
            title,
            width = '60%',
            fields = [],
            showFooter = true,
            footerButtons = ['save', 'cancel']
        } = config;

        const fieldsHTML = fields.map(field => ModalManager.createFieldHTML(field)).join('');
        
        const footerHTML = showFooter ? `
            <div class="modal-footer">
                ${footerButtons.includes('save') ? `<button type="button" class="btn btn-primary" id="${id}SaveBtn">保存</button>` : ''}
                ${footerButtons.includes('cancel') ? `<button type="button" class="btn btn-secondary" id="${id}CancelBtn">取消</button>` : ''}
                ${footerButtons.includes('close') ? `<button type="button" class="btn btn-secondary" id="${id}CloseBtn">关闭</button>` : ''}
            </div>
        ` : '';

        return `
            <div id="${id}" class="modal">
                <div class="modal-content" style="width: ${width};">
                    <div class="modal-header">
                        <h2 class="modal-title">${title}</h2>
                        <span class="close" id="${id}CloseX">&times;</span>
                    </div>
                    <form class="modal-form">
                        ${fieldsHTML}
                    </form>
                    ${footerHTML}
                </div>
            </div>
        `;
    }

    /**
     * 创建表单字段HTML
     */
    static createFieldHTML(field) {
        const {
            type = 'text',
            id,
            label,
            required = false,
            disabled = false,
            placeholder = '请输入',
            options = [],
            width,
            labelWidth
        } = field;

        const requiredMark = required ? '<span style="color: red;">*</span>' : '';
        const styleAttr = width ? `style="width: ${width};"` : '';
        const labelStyle = labelWidth ? `style="width: ${labelWidth};"` : '';

        switch (type) {
            case 'text':
            case 'number':
                return `
                    <div class="modal-form-group" ${styleAttr}>
                        <label ${labelStyle}>${label} ${requiredMark}</label>
                        <div class="input-wrapper">
                            <input type="${type}" id="${id}" placeholder="${placeholder}" ${disabled ? 'disabled' : ''}>
                            <span class="clear-btn">×</span>
                        </div>
                    </div>
                `;

            case 'select':
                return `
                    <div class="modal-form-group custom-select-wrapper" ${styleAttr}>
                        <label ${labelStyle}>${label} ${requiredMark}</label>
                        <div class="custom-select">
                            <input type="text" id="${id}" placeholder="请选择" ${disabled ? 'disabled' : ''}>
                            <span class="select-arrow">▼</span>
                            <span class="clear-btn">×</span>
                            <div class="select-dropdown" id="${id}Dropdown">
                                ${options.map(opt => `<div class="select-option" data-value="${opt.value}">${opt.text}</div>`).join('')}
                            </div>
                        </div>
                    </div>
                `;

            case 'textarea':
                return `
                    <div class="modal-form-group" style="width: 100%;">
                        <label ${labelStyle}>${label} ${requiredMark}</label>
                        <textarea id="${id}" placeholder="${placeholder}" rows="4" style="flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 3px; outline: none; resize: vertical;"></textarea>
                    </div>
                `;

            case 'radio':
                return `
                    <div class="modal-form-group" ${styleAttr}>
                        <label ${labelStyle}>${label} ${requiredMark}</label>
                        <div class="radio-group">
                            ${options.map(opt => `
                                <div class="radio-option">
                                    <input type="radio" id="${id}${opt.value}" name="${id}" value="${opt.value}">
                                    <label for="${id}${opt.value}">${opt.text}</label>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;

            case 'triple-input':
                return `
                    <div class="modal-form-group" ${styleAttr}>
                        <label ${labelStyle}>${label} ${requiredMark}</label>
                        <div class="row-column-layer-inputs">
                            ${field.inputs.map((input, i) => `
                                <div class="input-wrapper">
                                    <input type="number" id="${input.id}" placeholder="${input.placeholder}" min="0" ${input.step ? `step="${input.step}"` : ''}>
                                    <span class="clear-btn">×</span>
                                </div>
                                ${i < field.inputs.length - 1 ? '<span class="separator">-</span>' : ''}
                            `).join('')}
                        </div>
                    </div>
                `;

            default:
                return '';
        }
    }

    /**
     * 创建删除确认模态框
     */
    static createDeleteConfirmModal(entityName, modalId = 'confirmDeleteModal') {
        return `
            <div id="${modalId}" class="modal">
                <div class="modal-content" style="width: 400px;">
                    <div class="modal-header">
                        <h2 class="modal-title">删除确认</h2>
                        <span class="close" id="${modalId}CloseBtn">&times;</span>
                    </div>
                    <div class="confirm-modal">
                        <div class="warning-icon">⚠️</div>
                        <p>确认删除${entityName}吗？</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" id="confirmDeleteBtn">确定</button>
                        <button type="button" class="btn btn-secondary" id="cancelDeleteBtn">取消</button>
                    </div>
                </div>
            </div>
        `;
    }
}

/**
 * 常用下拉选项
 */
const CommonOptions = {
    isEnabled: [
        { value: 'yes', text: '启用' },
        { value: 'no', text: '禁用' }
    ],
    yesNo: [
        { value: 'yes', text: '是' },
        { value: 'no', text: '否' }
    ],
    warehouseType: [
        { value: 'warehouse', text: '仓库' },
        { value: 'store', text: '门店' }
    ],
    siteType: [
        { value: 'warehouse', text: '仓库' },
        { value: 'store', text: '门店' },
        { value: 'carrier', text: '承运商' }
    ],
    temperatureLayer: [
        { value: 'normal', text: '常温' },
        { value: 'cold', text: '冷藏' },
        { value: 'frozen', text: '冷冻' }
    ],
    locationType: [
        { value: 'picking', text: '拣选位' },
        { value: 'storage', text: '存储位' },
        { value: 'temporary', text: '暂存位' },
        { value: 'shipping', text: '发货位' },
        { value: 'exception', text: '异常位' },
        { value: 'pending', text: '待处理位' },
        { value: 'return', text: '退货位' }
    ],
    locationCategory: [
        { value: 'floor', text: '地推' },
        { value: 'heavy', text: '重型货架' },
        { value: 'light', text: '轻型货架' }
    ],
    volumeValidationRule: [
        { value: 'volume', text: '按体积' },
        { value: 'specification', text: '按规格' },
        { value: 'none', text: '不校验' }
    ],
    // 仓库选项
    warehouse: [
        { value: 'W001-南京仓', text: 'W001-南京仓' },
        { value: 'W002-嘉兴仓', text: 'W002-嘉兴仓' },
        { value: 'W003-上海仓', text: 'W003-上海仓' },
        { value: 'W004-北京仓', text: 'W004-北京仓' },
        { value: 'W005-广州仓', text: 'W005-广州仓' },
        { value: 'W006-深圳仓', text: 'W006-深圳仓' }
    ],
    // 容器状态选项
    lpnStatus: [
        { value: 'idle', text: '空闲' },
        { value: 'occupied', text: '占用' }
    ],
    // 容器型号选项
    lpnModel: [
        { value: 'PT001-纸箱', text: 'PT001-标准纸箱' },
        { value: 'PT002-周转箱', text: 'PT002-塑料周转箱' }
    ],
    // 容器类型选项
    lpnType: [
        { value: 'carton', text: '纸箱' },
        { value: 'box', text: '周转箱' },
        { value: 'pallet', text: '托盘' },
        { value: 'cart', text: '笼车' }
    ],
    // 管理模式选项
    manageMode: [
        { value: 'once', text: '一次使用' },
        { value: 'cycle', text: '循环使用' }
    ],
    // 作业档案选项
    profile: [
        { value: 'P001-标准作业档案', text: 'P001-标准作业档案' },
        { value: 'P002-冷链作业档案', text: 'P002-冷链作业档案' },
        { value: 'P003-快消品作业档案', text: 'P003-快消品作业档案' }
    ],
    // 货主选项
    company: [
        { value: 'Y001-南京货主', text: 'Y001-南京货主' },
        { value: 'Y002-北京货主', text: 'Y002-北京货主' },
        { value: 'Y003-上海货主', text: 'Y003-上海货主' },
        { value: 'Y004-广州货主', text: 'Y004-广州货主' },
        { value: 'Y005-深圳货主', text: 'Y005-深圳货主' },
        { value: 'Y006-杭州货主', text: 'Y006-杭州货主' }
    ],
    // 来源触发选项
    sourceTrigger: [
        { value: 'receive_confirm', text: '收货确认' },
        { value: 'receive_cancel', text: '收货取消' },
        { value: 'pick_occupied', text: '库存占用' },
        { value: 'occupy_cancel', text: '取消占用' },
        { value: 'pick_finish', text: '拣货完成' },
        { value: 'sort_finish', text: '分拣完成' },
        { value: 'ship_finish', text: '发货完成' },
        { value: 'exception_accept', text: '异常受理' },
        { value: 'exception_recover', text: '异常恢复' },
        { value: 'exception_shortage', text: '异常缺货' },
        { value: 'in_warehouse_reshelf', text: '库内返架' },
        { value: 'putaway_finish', text: '上架完成' },
        { value: 'count_surplus', text: '盘点盘盈' },
        { value: 'count_shortage', text: '盘点盘亏' }
    ],
    // 库存来源类型选项
    inventorySourceType: [
        { value: 'receive', text: '收货' },
        { value: 'pick', text: '拣货' },
        { value: 'sort', text: '分拣' },
        { value: 'exception', text: '异常' },
        { value: 'in_warehouse_reshelf', text: '库内返架' }
    ],
    // 任务类型选项
    taskType: [
        { value: 'qc', text: '质检' },
        { value: 'putaway', text: '上架' },
        { value: 'picking', text: '拣货' },
        { value: 'inventory', text: '盘点' }
    ],
    // 任务来源类型选项
    taskSourceType: [
        { value: 'purchase', text: '采购入库' },
        { value: 'warehouseDistributionInbound', text: '仓配入库' },
        { value: 'reverseDistributionInbound', text: '返配入库' },
        { value: 'transferInbound', text: '调拨入库' },
        { value: 'customerReturnInbound', text: '客退入库' },
        { value: 'salesOutbound', text: '销售出库' },
        { value: 'warehouseDistributionOutbound', text: '仓配出库' },
        { value: 'reverseDistributionOutbound', text: '返配出库' },
        { value: 'supplierReturnOutbound', text: '退供出库' },
        { value: 'transferOutbound', text: '调拨出库' }
    ],
    // 任务来源业务类型选项
    taskSourceBizType: [
        { value: 'purchaseDirectDelivery', text: '采购直送' },
        { value: 'warehouseDistributionInbound', text: '仓配入库' },
        { value: 'storeReturn', text: '门店退货' },
        { value: 'warehouseTransfer', text: '仓库调拨' },
        { value: 'liveReturn', text: '直播退货' },
        { value: 'liveOrder', text: '直播订单' },
        { value: 'distributionOutbound', text: '配送出库' },
        { value: 'warehouseSupplierReturn', text: '仓库退供' }
    ],
    // 入库类型选项
    inboundType: [
        { value: '采购入库', text: '采购入库' },
        { value: '仓配入库', text: '仓配入库' },
        { value: '返配入库', text: '返配入库' },
        { value: '调拨入库', text: '调拨入库' },
        { value: '客退入库', text: '客退入库' }
    ],
    // 入库业务类型选项
    inboundBusinessType: [
        { value: '仓配入库', text: '仓配入库' },
        { value: '门店退货', text: '门店退货' },
        { value: '仓库调拨', text: '仓库调拨' },
        { value: '直播退货', text: '直播退货' },
        { value: '采购直送', text: '采购直送' }
    ],
    // 入库收货单状态
    ibdReceiptStatus: [
        { value: '初始', text: '初始' },
        { value: '收货中', text: '收货中' }
    ],
    // 超时关单时间维度
    timeoutCloseTimeDimension: [
        { value: 'createTime', text: '创建时间' },
        { value: 'businessStart', text: '营业开始时间' },
        { value: 'businessEnd', text: '营业结束时间' }
    ],
    // 超时关单操作
    timeoutCloseAction: [
        { value: 'actual', text: '按实收量关单' },
        { value: 'plan', text: '按计划量关单' }
    ],
    // 波次流程类型选项
    flowType: [
        { value: '摘果', text: '摘果' },
        { value: '播种', text: '播种' },
        { value: '一键出库', text: '一键出库' }
    ],
    // 出库类型选项
    outboundType: [
        { value: '销售出库', text: '销售出库' },
        { value: '仓配出库', text: '仓配出库' },
        { value: '返配出库', text: '返配出库' },
        { value: '退供出库', text: '退供出库' },
        { value: '调拨出库', text: '调拨出库' }
    ],
    // 出库业务类型选项
    outboundBizType: [
        { value: '直播订单', text: '直播订单' },
        { value: '商城订单', text: '商城订单' },
        { value: '配送出库', text: '配送出库' },
        { value: '门店退货', text: '门店退货' },
        { value: '仓库退供', text: '仓库退供' },
        { value: '仓库调拨', text: '仓库调拨' }
    ],
    // 出库状态选项
    outboundStatus: [
        { value: '初始', text: '初始' },
        { value: '已集波', text: '已集波' },
        { value: '开始分配', text: '开始分配' },
        { value: '分配完成', text: '分配完成' },
        { value: '开始拣货', text: '开始拣货' },
        { value: '拣货完成', text: '拣货完成' },
        { value: '开始分拣', text: '开始分拣' },
        { value: '分拣完成', text: '分拣完成' },
        { value: '开始复核', text: '开始复核' },
        { value: '复核完成', text: '复核完成' },
        { value: '开始装载', text: '开始装载' },
        { value: '装载完成', text: '装载完成' },
        { value: '开始发货', text: '开始发货' },
        { value: '发货完成', text: '发货完成' },
        { value: '过账失败', text: '过账失败' },
        { value: '已取消', text: '已取消' }
    ],
    // 地点选项
    location: [
        { value: 'L001-南京地点', text: 'L001-南京地点' },
        { value: 'L002-北京地点', text: 'L002-北京地点' },
        { value: 'L003-上海地点', text: 'L003-上海地点' },
        { value: 'L004-广州地点', text: 'L004-广州地点' },
        { value: 'L005-深圳地点', text: 'L005-深圳地点' }
    ],
    // 营销类型选项
    marketingType: [
        { value: '普通售卖', text: '普通售卖' },
        { value: '拉新赠品', text: '拉新赠品' },
        { value: '福袋奖品', text: '福袋奖品' },
        { value: '积分兑换', text: '积分兑换' }
    ],
    // 库存调整类型选项
    adjustmentType: [
        { value: '拣货异常', text: '拣货异常' },
        { value: '分拣异常', text: '分拣异常' },
        { value: '复核异常', text: '复核异常' },
        { value: '快递库调', text: '快递库调' }
    ]
};

// 导出到全局
window.ModalManager = ModalManager;
window.CommonOptions = CommonOptions;
