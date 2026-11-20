/**
 * 供应商 · 数据中心可配置常量（风险标签 / 沉默门店 / 能力开关）
 * 业务逻辑只读本文件，勿在页面脚本里写死阈值。
 */
(function (global) {
  global.StoreAppBizSupplierConfig = {
    /** 毛利不在本平台计算，界面不展示毛利相关指标 */

    /**
     * 发货准时率（Q-FUL-03：实际≤承诺）——现网无预计发货／交货日期等承诺侧字段，
     * 仅有实际发货事件，无法计算；界面不展示。待承诺时点落库后再开。
     */
    SHIP_ON_TIME: {
      metricKey: 'FUL_OTD_RATE',
      rule: 'actual_lte_promise',
      enabled: false,
      blockedReason: 'no_promise_fields'
    },

    /**
     * 趋势图粒度随顶栏时段（无独立日／周开关）
     * today→hour；7d／30d→day；custom：跨度≤14 天→day，否则→week
     */
    TREND_GRAIN_BY_RANGE: {
      today: 'hour',
      '7d': 'day',
      '30d': 'day',
      customDayMax: 14
    },

    /** 商品风险标签阈值 */
    RISK: {
      /** 库存 ≤ 该值 → 缺货 */
      outOfStockQty: 0,
      /** 0 < 库存 ≤ 该值 → 低库存 */
      lowStockQty: 20,
      /** 售后率（%）≥ 该值 → 高售后 */
      highAftersaleRatePct: 8
    },

    /** 沉默采购门店：筛选周期内曾有采购，且最近采购距今 ≥ N 天 */
    SILENT_STORE: {
      /** 近 N 天无采购视为沉默（可配置） */
      idleDays: 30,
      definition:
        '在筛选周期内曾有采购记录，但最近一次采购距今已超过 idleDays 天的关联门店'
    },

    /**
     * 售后原因：与 C 端申请页 user-app-order-refund.js · REASONS 文案对齐
     * 统计按用户／门店提交落库的原因原文聚合，不做「品质／物流」粗分桶。
     */
    AFTERSALE_REASONS: {
      pre_ship: [
        '订单信息拍错（规格/颜色等）',
        '我不想要了',
        '地址/电话信息填写错误',
        '没用/少用优惠',
        '缺货'
      ],
      not_received: ['不喜欢/不想要', '空包裹', '未按约定时间发货'],
      received: [
        '商品信息描述不符',
        '退运费',
        '质量问题',
        '少件/漏发/少配件',
        '包装/商品破损/污渍',
        '未按约定时间发货',
        '发票问题',
        '卖家发错货'
      ],
      return_refund: [
        '七天无理由退换货',
        '大小/尺寸/重量与商品描述不符',
        '颜色/图案/款式与商品描述不符',
        '少件/漏发/少配件',
        '包装/商品破损/污渍',
        '不喜欢/不想要',
        '质量问题',
        '做工粗糙/有瑕疵',
        '卖家发错货',
        '发票问题',
        '假冒品牌'
      ],
      restock: [
        '收到商品破损/污渍等',
        '包裹少件/漏发',
        '卖家发错货',
        '物流一直未送到',
        '协商一致'
      ],
      exchange: [
        '规格/颜色拍错',
        '大小/尺寸/重量与商品描述不符',
        '质量问题',
        '卖家发错货',
        '商品信息描述不符'
      ]
    },

    /** 环比：无上一周期数据时展示文案 */
    COMPARE_EMPTY: '--',

    /**
     * 演示层接口契约（正式环境由后端按供应商主体隔离校验）
     * 前端不得仅靠本地筛选冒充权限。
     */
    API_CONTRACT: [
      {
        key: 'overview',
        path: 'GET /api/supplier/biz/overview',
        need: 'range + supplierId；返回核心指标与环比'
      },
      {
        key: 'trends',
        path: 'GET /api/supplier/biz/trends',
        need: 'range + grain(day|week)；成交额／订单／销量／售后金额／售后率序列'
      },
      {
        key: 'products',
        path: 'GET /api/supplier/biz/products',
        need: 'range + sort + keyword；SKU 排行与库存／动销门店'
      },
      {
        key: 'fulfillment',
        path: 'GET /api/supplier/biz/fulfillment-aftersale',
        need: '履约指标 + 售后类型／原因汇总（只读）'
      },
      {
        key: 'stores',
        path: 'GET /api/supplier/biz/stores',
        need: '门店贡献／区域／沉默门店；禁止消费者 PII'
      },
      {
        key: 'settle',
        path: 'GET /api/supplier/biz/settle-summary',
        need: '应收／可结算／结算中／已结算／冲销／对账差异'
      }
    ],

    /** 相对现有订单／售后／结算接口仍缺失的字段（正式实现勿用演示数顶替） */
    BACKEND_GAPS: [
      {
        field: 'gmv / orderCount / qty 按供应商聚合 + 环比',
        suggest: 'overview 接口；分母为本供应商供货订单',
        reuse: '可聚合 supplier-orders，缺环比对照窗'
      },
      {
        field: '趋势按日／周序列',
        suggest: 'trends 接口；空／错由后端状态码表达',
        reuse: '订单／售后明细可衍生，缺现成序列 API'
      },
      {
        field: '动销门店数、区域分布',
        suggest: 'products / stores 聚合',
        reuse: '订单含 storeName，缺标准区域码'
      },
      {
        field: '发货准时率',
        suggest: '需预计发货／交货日期等承诺侧字段；现网仅有实际发货事件，指标暂不上屏',
        reuse: '实际发货事件可复用；承诺侧未落库'
      },
      {
        field: '平均发货时长、缺货取消、配送异常',
        suggest: '时长可用下单／可发→实际发货；异常需枚举',
        reuse: '实际发货事件有；异常分类待齐'
      },
      {
        field: '可结算金额／结算中／冲销／对账差异',
        suggest: 'settle-summary；与结算中心同源',
        reuse: '结算中心有台账／结款单，缺总览聚合与差异数'
      },
      {
        field: '沉默采购门店列表',
        suggest: 'stores?silent=1&idleDays=',
        reuse: '可自订单最近采购日计算，缺专用接口'
      }
    ]
  };
})(window);
