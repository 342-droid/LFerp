/**
 * 平台经营驾驶舱 · 演示数据
 * 规则：消费者 GMV 与 RBT／财务确认收入／货款／佣金／贸易商应收分列；未接入≠0
 */
(function (global) {
  var S = global.MdmOpsCockpitShared || {};
  var PENDING = S.PENDING || { __pending: true, label: '待接入' };
  var UNAVAILABLE = S.UNAVAILABLE || { __pending: true, label: '未获取' };

  function scale(range) {
    if (range === 'today') return 0.08;
    if (range === '7d') return 0.28;
    if (range === 'custom') return 0.65;
    return 1;
  }

  function r2(n) {
    return Math.round(Number(n) * 100) / 100;
  }

  function rangeLabel(range) {
    if (range === 'today') return '今日';
    if (range === '7d') return '近7天';
    if (range === 'custom') return '自定义时段';
    return '近30天';
  }

  function meta(range, caliber) {
    return {
      statRange: rangeLabel(range) + ' · 按支付成功时间（财务确认收入按确认日期）',
      updatedAt: '2026-11-18 10:00（近实时；结算资金按日结批次）',
      caliber: caliber
    };
  }

  function overview(filters) {
    var f = filters || {};
    var s = scale(f.range || '30d');
    var gmv = r2(186420 * s);
    var refund = r2(12860 * s);
    var net = r2(gmv - refund);
    var orders = Math.round(1842 * s);
    var payers = Math.round(1260 * s);
    var aov = orders > 0 ? r2(gmv / orders) : null;
    var activeStores = 86;
    var idleStores = 24;
    var financeRev = r2(24680 * s);
    var pendingSku = Math.round(1260 * s);
    var stockoutSku = Math.round(186 * s);
    var asAmount = r2(9680 * s);
    var asRate = gmv > 0 ? asAmount / gmv : null;
    var alerts = 17;

    var liveGmv = r2(78420 * s);
    var mallGmv = r2(108000 * s);
    var posGmv = PENDING;

    return {
      id: 'overview',
      title: '全景总览',
      meta: meta(
        f.range,
        '首屏仅消费者交易 GMV（直播／商城；POS 待接入）。RBT 不计入 GMV。财务确认收入分列。履约主指标按 SKU 件数。'
      ),
      kpis: [
        { label: '支付 GMV', value: gmv, format: 'money', href: 'mdm_ops_sales_mall.html', hint: '含顾客实付运费；未扣退款' },
        { label: '退款金额', value: refund, format: 'money', hint: '按退款成功时间' },
        { label: '净成交额', value: net, format: 'money', hint: '当期 GMV − 当期退款，可为负' },
        { label: '支付主订单数', value: orders, format: 'int', hint: '主订单去重' },
        { label: '支付人数', value: payers, format: 'int' },
        { label: '客单价', value: aov, format: 'money', hint: 'GMV ÷ 主订单数' },
        { label: '有成交门店数', value: activeStores, format: 'int', href: 'mdm_ops_sales_store.html' },
        { label: '无成交门店数', value: idleStores, format: 'int', href: 'mdm_ops_alert.html' },
        { label: '财务确认收入', value: financeRev, format: 'money', href: 'mdm_ops_settle_finance.html', hint: '按确认日期；≠GMV' },
        { label: '待发货 SKU 件数', value: pendingSku, format: 'int', href: 'mdm_ops_supply_fulfill.html' },
        { label: '缺货 SKU 件数', value: stockoutSku, format: 'int', href: 'mdm_ops_supply_warehouse.html' },
        { label: '售后金额', value: asAmount, format: 'money', href: 'mdm_ops_aftersale.html' },
        { label: '售后率', value: asRate, format: 'pct', hint: '售后金额／支付 GMV（演示）' },
        { label: '经营预警数量', value: alerts, format: 'int', href: 'mdm_ops_alert.html' }
      ],
      trendMetric: 'gmv',
      trends: {
        gmv: [18200, 21400, 19600, 23800, 25100, 22900, 26800].map(function (v) { return r2(v * s); }),
        net: [16800, 19600, 18100, 21900, 23200, 21100, 24600].map(function (v) { return r2(v * s); }),
        orders: [168, 192, 176, 210, 224, 201, 238].map(function (v) { return Math.round(v * s); }),
        payers: [120, 138, 126, 150, 162, 146, 172].map(function (v) { return Math.round(v * s); }),
        finance: [2400, 2800, 2550, 3100, 3280, 2980, 3520].map(function (v) { return r2(v * s); })
      },
      lineMix: [
        { id: 'live', name: '直播', value: liveGmv, href: 'mdm_ops_sales_live.html' },
        { id: 'mall', name: '商城', value: mallGmv, href: 'mdm_ops_sales_mall.html' },
        { id: 'pos', name: 'POS', value: posGmv, href: 'mdm_ops_sales_pos.html' }
      ],
      ranks: {
        store: [
          { code: 'ONS00004', name: '五角场体验店', gmv: r2(22400 * s), orders: Math.round(178 * s) },
          { code: 'ONS00001', name: '西湖中心生鲜店', gmv: r2(18620 * s), orders: Math.round(146 * s) },
          { code: 'ONS00002', name: '东城和平里生鲜店', gmv: r2(9800 * s), orders: Math.round(88 * s) }
        ],
        supplier: [
          { code: 'SUP00001', name: '鲜达优选供应链', shipSku: Math.round(4200 * s), settle: r2(18620 * s) },
          { code: 'SUP00002', name: '绿源生鲜批发', shipSku: Math.round(3100 * s), settle: r2(13200 * s) }
        ],
        trader: [
          { code: 'TR00001', name: '杭州鲜达贸易', demands: 12, remain: r2(28600 * s) },
          { code: 'TR00002', name: '沪上联营贸易', demands: 8, remain: r2(19800 * s) }
        ],
        warehouse: [
          { code: 'WH00001', name: '杭州余杭中心仓', outSku: Math.round(1860 * s), stockout: Math.round(18 * s) },
          { code: 'WH00002', name: '上海嘉定仓', outSku: Math.round(1420 * s), stockout: Math.round(12 * s) }
        ]
      },
      alerts: [
        { level: 'danger', text: '无成交门店 24 家（近30天）', href: 'mdm_ops_alert.html' },
        { level: 'warn', text: '缺货 SKU 件数偏高 · 余杭中心仓', href: 'mdm_ops_supply_warehouse.html' },
        { level: 'warn', text: '联营回收异常 3 笔（还款中进度停滞）', href: 'mdm_ops_rbt_recoup.html' },
        { level: 'info', text: 'POS 业务线待接入，不计入业务线构成合计', href: 'mdm_ops_sales_pos.html' }
      ],
      rbtSummary: {
        note: 'RBT 独立「联营与回收」摘要，不与消费者 GMV 相加',
        metrics: [
          { label: '还款中需求', value: 18, format: 'int' },
          { label: '约定回收', value: r2(111000), format: 'money' },
          { label: '实际回收', value: r2(39700.5 * Math.min(1, s + 0.15)), format: 'money' },
          { label: '剩余应回收', value: r2(71299.5), format: 'money' }
        ],
        href: 'mdm_ops_rbt_recoup.html'
      }
    };
  }

  /** 专题页配置：metrics + sections；pending 显式标注 */
  var TOPICS = {
    live: {
      title: '直播经营',
      group: '销售经营',
      metaCaliber: '直播场次成交按支付成功；引流商城成交归因规则待确认前不可与商城 GMV 重复累计。',
      kpis: [
        { label: '场次', value: 46, format: 'int' },
        { label: '开播时长(小时)', value: 128.5, format: 'int' },
        { label: '触达／观看', value: UNAVAILABLE, format: 'int', hint: '外采数据未获取' },
        { label: '拉新会员', value: 860, format: 'int' },
        { label: '支付 GMV', value: 78420, format: 'money' },
        { label: '退款金额', value: 5120, format: 'money' },
        { label: '净成交额', value: 73300, format: 'money' },
        { label: '支付订单数', value: 620, format: 'int' },
        { label: '客单价', value: 126.48, format: 'money' }
      ],
      notes: ['筛选：直播间／主播／门店／商品／日期（演示）。', '归因未确认前：直播 GMV 与商城 GMV 不交叉加总。'],
      links: [{ label: '商城经营', href: 'mdm_ops_sales_mall.html' }]
    },
    mall: {
      title: '商城经营',
      group: '销售经营',
      metaCaliber: '顾客实付运费计入 GMV；平台补贴运费单列不计入顾客实付。',
      kpis: [
        { label: '支付 GMV', value: 108000, format: 'money' },
        { label: '其中运费实付', value: 3260, format: 'money' },
        { label: '平台补贴运费', value: 1480, format: 'money', hint: '单列，不计入 GMV' },
        { label: '退款金额', value: 7740, format: 'money' },
        { label: '净成交额', value: 100260, format: 'money' },
        { label: '主订单数', value: 1222, format: 'int' },
        { label: '子订单数', value: 2860, format: 'int' },
        { label: '支付人数', value: 980, format: 'int' },
        { label: '客单价', value: 88.38, format: 'money' }
      ],
      notes: ['可按商城渠道、门店、商品、供应商、履约方式下钻（演示入口见门店／供应商专题）。']
    },
    pos: {
      title: 'POS 经营',
      group: '销售经营',
      metaCaliber: 'POS 为未来业务线；堂食／外卖／核销为 POS 下级渠道，不与商城、直播混合分类。',
      kpis: [
        { label: 'POS 销售额', value: PENDING, format: 'money' },
        { label: '交易笔数', value: PENDING, format: 'int' },
        { label: '堂食', value: PENDING, format: 'money' },
        { label: '外卖', value: PENDING, format: 'money' },
        { label: '核销', value: PENDING, format: 'money' },
        { label: '退款', value: PENDING, format: 'money' }
      ],
      notes: ['当前展示「待接入」，禁止用 0 占位。', '接入后支持支付方式、门店、时段、渠道细分。']
    },
    store: {
      title: '门店经营',
      group: '销售经营',
      metaCaliber: '平台内 GMV；佣金／联营扣费／回收独立展示，不可与 GMV 混加。档案启用态≠经营活跃态。',
      kpis: [
        { label: '支付 GMV', value: 61420, format: 'money' },
        { label: '退款', value: 2740, format: 'money' },
        { label: '净成交额', value: 58680, format: 'money' },
        { label: '订单数', value: 528, format: 'int' },
        { label: '支付人数', value: 410, format: 'int' },
        { label: '客单价', value: 116.33, format: 'money' },
        { label: '门店佣金（入账）', value: 6460.3, format: 'money', hint: '≠GMV' },
        { label: '联营实际回收', value: 12800.5, format: 'money', hint: '分列' }
      ],
      tables: [
        {
          title: '门店排行（按 GMV）',
          columns: [
            { key: 'name', label: '门店' },
            { key: 'gmv', label: 'GMV', format: 'money' },
            { key: 'active', label: '活跃态' },
            { key: 'archive', label: '档案态' }
          ],
          rows: [
            { name: '五角场体验店', gmv: 22400, active: '有成交', archive: '启用' },
            { name: '西湖中心生鲜店', gmv: 18620, active: '有成交', archive: '启用' },
            { name: '河东大桥道自提点', gmv: 4200, active: '有成交', archive: '启用' }
          ]
        }
      ]
    },
    goods: {
      title: '商品经营',
      group: '销售经营',
      metaCaliber: '按 SKU／品类汇总销量、金额、退款与售后；清分最小单位为 SKU。',
      kpis: [
        { label: '动销 SKU 数', value: 1860, format: 'int' },
        { label: '支付 GMV', value: 186420, format: 'money' },
        { label: '退款金额', value: 12860, format: 'money' },
        { label: '售后涉及 SKU', value: 240, format: 'int' }
      ],
      tables: [
        {
          title: '商品排行（演示）',
          columns: [
            { key: 'name', label: '商品' },
            { key: 'gmv', label: 'GMV', format: 'money' },
            { key: 'qty', label: '件数', format: 'int' },
            { key: 'refund', label: '退款', format: 'money' }
          ],
          rows: [
            { name: '库尔勒香梨 4kg', gmv: 18600, qty: 820, refund: 960 },
            { name: '赣南脐橙 5斤', gmv: 15200, qty: 1100, refund: 640 }
          ]
        }
      ]
    },
    customer: {
      title: '顾客经营',
      group: '销售经营',
      metaCaliber: '普通运营仅汇总／脱敏；手机号／姓名／地址／完整订单明细需字段级授权。复购率临时正式待知页替换。',
      permNote: '当前演示角色：普通运营（汇总可见，个人明细不可见）。',
      kpis: [
        { label: '支付人数', value: 1260, format: 'int' },
        { label: '新客人数', value: 380, format: 'int' },
        { label: '老客人数', value: 880, format: 'int' },
        { label: '复购率', value: 0.32, format: 'pct', hint: '临时正式 · 待知页替换' },
        { label: '客单价', value: 101.2, format: 'money' },
        { label: '顾客手机号明细', value: PENDING, format: 'text', hint: '字段级权限未授权' }
      ],
      notes: ['导出与页面查看分别授权；不可仅靠藏按钮控制。']
    },
    rbt_demand: {
      title: '需求与接单',
      group: 'RBT联营经营',
      metaCaliber: '沿用知页最新 RBT 状态机；需求金额≠消费者 GMV、≠贸易商应收。',
      kpis: [
        { label: '需求数量', value: 64, format: 'int' },
        { label: '需求商品金额', value: 286000, format: 'money' },
        { label: '需求总金额', value: 312400, format: 'money' },
        { label: '待审核', value: 6, format: 'int' },
        { label: '待接单', value: 8, format: 'int' },
        { label: '待确认签约', value: 4, format: 'int' },
        { label: '待重新确认', value: 1, format: 'int' },
        { label: '待签署', value: 3, format: 'int' },
        { label: '待付款', value: 2, format: 'int' },
        { label: '待复核', value: 5, format: 'int' },
        { label: '还款中', value: 18, format: 'int' },
        { label: '已完成', value: 12, format: 'int' },
        { label: '已作废／已驳回', value: 5, format: 'int' }
      ],
      links: [{ label: '打开 RBT 需求单管理', href: '../RBT/rbt_demand.html' }]
    },
    rbt_recoup: {
      title: '联营投入与回收',
      group: 'RBT联营经营',
      metaCaliber: '实扣＝实际回收同口径不重复累计；剩余＝约定−累计实际回收；预计回收周期≠固定到期日。投入／约定／应扣／实扣／回收分列。',
      kpis: [
        { label: '实际投入金额', value: PENDING, format: 'money', hint: '字段映射待确认' },
        { label: '约定回收总额', value: 111000, format: 'money' },
        { label: '应扣金额', value: 42600, format: 'money' },
        { label: '实扣／实际回收', value: 39700.5, format: 'money' },
        { label: '剩余应回收', value: 71299.5, format: 'money' },
        { label: '应扣与实扣差异', value: 2899.5, format: 'money' },
        { label: '预计回收周期', value: '约 42 天', format: 'text' },
        { label: '回收异常笔数', value: 3, format: 'int' }
      ],
      notes: [
        '日结＋比例付：当日渠道流水×比例；类目比例优先且不与默认叠加。',
        '结算系数用于各方应收，不作每日扣费比例。',
        '联营资金回收与门店经营回本分区，不共用「回本状态」。'
      ]
    },
    rbt_trader: {
      title: '贸易商经营',
      group: 'RBT联营经营',
      metaCaliber: '关联门店 GMV 仅评估经营，不能作为贸易商收入；贸易商收益＝回收，另示应收。',
      kpis: [
        { label: '关联需求数', value: 28, format: 'int' },
        { label: '还款中需求', value: 12, format: 'int' },
        { label: '已完成需求', value: 9, format: 'int' },
        { label: '实际投入', value: PENDING, format: 'money' },
        { label: '实扣／实际回收', value: 28600, format: 'money' },
        { label: '剩余应回收', value: 48400, format: 'money' },
        { label: '关联门店平台 GMV', value: 48200, format: 'money', hint: '非贸易商收入' }
      ],
      tables: [
        {
          title: '贸易商列表（演示）',
          columns: [
            { key: 'name', label: '贸易商' },
            { key: 'demands', label: '需求数', format: 'int' },
            { key: 'remain', label: '剩余回收', format: 'money' },
            { key: 'storeGmv', label: '关联门店GMV', format: 'money' }
          ],
          rows: [
            { name: '杭州鲜达贸易', demands: 12, remain: 28600, storeGmv: 28600 },
            { name: '沪上联营贸易', demands: 8, remain: 19800, storeGmv: 19600 }
          ]
        }
      ]
    },
    supplier: {
      title: '供应商经营',
      group: '供货与履约',
      metaCaliber: '消费者交易金额、货款、结算、到账分列；已结算≠实际到账。履约主指标按 SKU 件数。',
      kpis: [
        { label: '供货订单数', value: 460, format: 'int' },
        { label: '待发货 SKU 件数', value: 860, format: 'int' },
        { label: '已发货 SKU 件数', value: 12600, format: 'int' },
        { label: '商品销售（供货口径）', value: 155480, format: 'money', hint: '≠平台消费者 GMV' },
        { label: '退款／售后金额', value: 4860, format: 'money' },
        { label: '可用库存 SKU', value: 8200, format: 'int' },
        { label: '缺货 SKU 件数', value: 96, format: 'int' },
        { label: '应收金额', value: 41280, format: 'money' },
        { label: '已结算金额', value: 28600, format: 'money' },
        { label: '待到账金额', value: 4500, format: 'money' },
        { label: '实际到账金额', value: 24100, format: 'money' }
      ]
    },
    warehouse: {
      title: '仓库经营',
      group: '供货与履约',
      metaCaliber: '主指标 SKU 件数；待发货订单数为辅助。',
      kpis: [
        { label: '待出库 SKU 件数', value: 105, format: 'int' },
        { label: '已出库 SKU 件数', value: 4260, format: 'int' },
        { label: '到店 SKU 件数', value: 3840, format: 'int' },
        { label: '可用库存', value: 18600, format: 'int' },
        { label: '在途库存', value: 1260, format: 'int' },
        { label: '缺货 SKU 件数', value: 52, format: 'int' },
        { label: '待发货订单数（辅助）', value: 86, format: 'int' }
      ]
    },
    fulfill: {
      title: '履约时效',
      group: '供货与履约',
      metaCaliber: '主指标按 SKU 件数。准时率承诺／实际事件未最终确认前展示「规则待确认」，不生成正式数值。门店「核销数」≠公司统一准时率标准。',
      kpis: [
        { label: '供应商发货 SKU', value: 12600, format: 'int' },
        { label: '仓库发货 SKU', value: 9800, format: 'int' },
        { label: '到店 SKU', value: 9200, format: 'int' },
        { label: '客户签收 SKU', value: 4100, format: 'int' },
        { label: '自提核销 SKU', value: 4800, format: 'int' },
        { label: '对应订单数（辅助）', value: 1680, format: 'int' },
        { label: '供应商发货准时率', value: { __pending: true, label: '规则待确认' }, format: 'text' },
        { label: '仓库发货准时率', value: { __pending: true, label: '规则待确认' }, format: 'text' },
        { label: '到店准时率', value: { __pending: true, label: '规则待确认' }, format: 'text' }
      ],
      notes: ['生鲜直播「当天下单次日自提」与快递到家须分别定义承诺节点。']
    },
    finance: {
      title: '财务确认收入',
      group: '结算与资金',
      metaCaliber: '统计日期＝确认日期，不以支付／下单／到账替代。与 GMV、需求金额、贸易商应收、货款、门店佣金分列。',
      kpis: [
        { label: '财务确认收入', value: 24680, format: 'money' },
        { label: '确认条件／冲销细则', value: PENDING, format: 'text', hint: '规则待确认' },
        { label: '按业务线拆分', value: PENDING, format: 'text' }
      ]
    },
    settle_ar: {
      title: '应收与到账',
      group: '结算与资金',
      metaCaliber: '应收认账单／合同；结算单已是实收。待到账仅覆盖钱包路径（口径部分确认）。',
      kpis: [
        { label: '应收金额', value: 56800, format: 'money' },
        { label: '已结算金额', value: 41200, format: 'money' },
        { label: '待到账金额', value: 6800, format: 'money' },
        { label: '实际到账金额', value: 34400, format: 'money' },
        { label: '财务确认收入', value: 24680, format: 'money' }
      ]
    },
    settle_deduct: {
      title: '扣费与回收',
      group: '结算与资金',
      metaCaliber: '应扣／实扣／实际回收分列；实扣＝实际回收。回退／冲正仅成功流水影响累计。',
      kpis: [
        { label: '应扣金额', value: 42600, format: 'money' },
        { label: '实扣／实际回收', value: 39700.5, format: 'money' },
        { label: '剩余应回收', value: 71299.5, format: 'money' },
        { label: '回退／冲正影响', value: PENDING, format: 'money', hint: '流水键待确认' }
      ]
    },
    settle_diff: {
      title: '对账差异',
      group: '结算与资金',
      metaCaliber: '展示差异金额与原因分类；未接入原因码时显示待接入。',
      kpis: [
        { label: '差异笔数', value: 7, format: 'int' },
        { label: '差异金额', value: 1860.4, format: 'money' },
        { label: '原因码分布', value: PENDING, format: 'text' }
      ]
    },
    aftersale: {
      title: '售后分析',
      group: '售后分析',
      metaCaliber: '质量问题／履约问题两大类；按商品、门店、供应商、仓库、业务线、渠道分析。',
      kpis: [
        { label: '售后数量', value: 186, format: 'int' },
        { label: '涉及金额', value: 9680, format: 'money' },
        { label: '退款金额', value: 8420, format: 'money' },
        { label: '售后率', value: 0.052, format: 'pct' },
        { label: '质量问题', value: 96, format: 'int' },
        { label: '履约问题', value: 90, format: 'int' }
      ]
    },
    alert: {
      title: '经营预警',
      group: '经营预警',
      metaCaliber: '一期提示需关注；处理状态机不做。',
      kpis: [
        { label: '预警总数', value: 17, format: 'int' },
        { label: '成交下降', value: 4, format: 'int' },
        { label: '无成交门店', value: 24, format: 'int' },
        { label: '退款异常', value: 3, format: 'int' },
        { label: '库存不足', value: 5, format: 'int' },
        { label: '履约异常', value: 2, format: 'int' },
        { label: '回收异常', value: 3, format: 'int' }
      ],
      tables: [
        {
          title: '预警列表（演示）',
          columns: [
            { key: 'type', label: '类型' },
            { key: 'obj', label: '对象' },
            { key: 'level', label: '级别' },
            { key: 'time', label: '发现时间' }
          ],
          rows: [
            { type: '无成交', obj: '河东大桥道自提点', level: '中', time: '2026-11-18' },
            { type: '回收异常', obj: 'XQ00023', level: '高', time: '2026-11-17' },
            { type: '缺货', obj: '杭州余杭中心仓', level: '中', time: '2026-11-18' }
          ]
        }
      ]
    }
  };

  function topic(id, filters) {
    var conf = TOPICS[id];
    if (!conf) return null;
    var range = (filters && filters.range) || '30d';
    return {
      id: id,
      title: conf.title,
      group: conf.group,
      meta: meta(range, conf.metaCaliber),
      permNote: conf.permNote || '',
      kpis: conf.kpis || [],
      notes: conf.notes || [],
      links: conf.links || [],
      tables: conf.tables || []
    };
  }

  global.MdmOpsCockpitData = {
    overview: overview,
    topic: topic,
    TOPICS: TOPICS
  };
})(window);
