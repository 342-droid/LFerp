# -*- coding: utf-8 -*-
import html

LF = "/Users/fuhongbin/Desktop/冷丰Wrok/SOLO Coder/LF/MDM"


def esc(s):
    return html.escape(str(s), quote=False)


def stat(t):
    cls = "active" if t in ("正常", "启用", "开启", "营业中", "在岗", "审核成功", "已进件") else "inactive"
    return f'<span class="status {cls}">{esc(t)}</span>'


COMMON_HEAD = """    <style>
        .subject-name-link { color: #2196F3; text-decoration: none; font-weight: 600; }
        .subject-name-link:hover { text-decoration: underline; color: #1976D2; }
        .flow-box { margin: 14px 0; padding: 12px 14px; background: #fafafa; border: 1px solid #eee; border-radius: 4px; font-size: 13px; color: #555; line-height: 1.65; }
    </style>"""

LINK_LF_MDM = """    <link rel="stylesheet" href="../css/lf-mdm-from-master.css">"""

SCRIPTS_CORE = """    <script src="../js/common.js"></script>
    <script src="../js/pagination.js"></script>
    <script src="../js/form-utils.js"></script>
    <script src="../js/modal-manager.js"></script>
    <script src="../js/page-manager.js"></script>
    <script src="../js/mdm-subject-pagemanager.js"></script>
    <script src="../js/mdm-unified-onboarding-ui.js"></script>
"""

SCRIPTS_PM = (
    SCRIPTS_CORE
    + """    <script src="../js/mdm-erp-lists.js"></script>"""
)

SCRIPTS_LIST = (
    SCRIPTS_CORE
    + """    <script src="../js/mdm-erp-lists.js"></script>"""
)

SCRIPTS_MEMBER_C = (
    SCRIPTS_CORE
    + """    <script src="../js/mdm-member-c-ui.js"></script>
    <script src="../js/mdm-erp-lists.js"></script>"""
)

SCRIPTS_AUDIT_STORE = (
    SCRIPTS_CORE
    + """    <script src="../js/mdm-audit-store-ui.js"></script>
    <script src="../js/mdm-erp-lists.js"></script>"""
)


def pick_script_bundle(tail_js):
    if "MdmSubjectLf" in tail_js:
        return SCRIPTS_PM
    if "initMemberC" in tail_js:
        return SCRIPTS_MEMBER_C
    if "initAuditStoreRegistration" in tail_js:
        return SCRIPTS_AUDIT_STORE
    return SCRIPTS_LIST


def extra_mdm_head(tail_js):
    """冷丰 ERP 原型样式：档案抽屉、进件弹窗、会员/审核等共用。"""
    return "\n" + LINK_LF_MDM


def page_shell(title, tab, crumb, inner, tail_js):
    mdm_css = extra_mdm_head(tail_js)
    scripts = pick_script_bundle(tail_js)
    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{esc(title)}</title>
    <link rel="stylesheet" href="../css/common.css">
    <link rel="stylesheet" href="../css/components.css">{mdm_css}
{COMMON_HEAD}
</head>
<body>
    <div id="sidebar-container"></div>
    <script src="../js/path-prefix.js"></script>
    <script src="../js/mdm-sidebar.js"></script>
    <div id="header-container"></div>
    <div class="container">
        <main class="main-content">
            <div class="content-tabs"><button class="active">{esc(tab)}</button></div>
            <hr class="content-divider">
            <div class="content-title">{crumb}</div>
{inner}
        </main>
    </div>
{scripts}
    <script>
    document.addEventListener('DOMContentLoaded', function () {{
{tail_js}
    }});
    </script>
</body>
</html>"""


def main():
    # super admin
    SA_ROWS = [
        ("MCH88291001", "超管创建仓库042402", "—", "仓库", "王敏", "138****2210", "cg_ck042402", "2026-04-24T19:12:08", "系统", "正常"),
        ("MCH88291002", "小九小九", "李四", "门店", "赵小九", "—", "xj_store01", "2026-04-23T11:03:41", "张三", "正常"),
        ("MCH88291003", "华东供应商一号", "公司11号", "供应商", "刘洋", "159****8891", "sup_hz_01", "2026-04-22T09:55:12", "张三", "冻结"),
        ("MCH88291004", "冷丰演示门店", "—", "门店", "陈晨", "186****3321", "demo_store", "2026-04-21T16:40:00", "系统", "正常"),
        ("MCH88291005", "合作仓-沪南", "李四", "仓库", "周仓", "137****0098", "wh_hz_nan", "2026-04-20T14:22:19", "李四", "正常"),
        ("MCH88291006", "供应商-珠宝集采", "公司11号", "供应商", "钱多多", "—", "sup_jewel", "2026-04-19T10:08:33", "王五", "正常"),
        ("MCH88291007", "门店-五角场", "张三", "门店", "孙丽", "188****7765", "store_wujc", "2026-04-18T08:17:50", "张三", "正常"),
        ("MCH88291008", "测试停用商家", "—", "门店", "测试", "133****0000", "test_off", "2026-04-17T18:01:02", "系统", "停用"),
    ]
    sa_tb = []
    for rid, sn, bd, tp, ct, ph, acc, ctime, op, st in SA_ROWS:
        op_link = '<a href="#" class="mdm-disable-toggle">启用</a>' if st == "停用" else '<a href="#" class="mdm-disable-toggle">禁用</a>'
        sa_tb.append(
            "<tr><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td>"
            '<td class="action-links">%s</td></tr>'
            % (esc(rid), esc(sn), esc(bd), esc(tp), esc(ct), esc(ph), esc(acc), esc(ctime), esc(op), stat(st), op_link)
        )

    sa_inner = """
            <section class="search-section">
                <form class="search-form">
                    <div class="form-group">
                        <label>主体名称:</label>
                        <div class="input-wrapper">
                            <input type="text" id="qSubjectName" placeholder="请输入">
                            <span class="clear-btn">×</span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>主体状态:</label>
                        <select id="qStatus" style="height:36px;min-width:140px;border:1px solid #ddd;border-radius:3px;padding:0 8px;">
                            <option value="">全部</option>
                            <option value="normal">正常</option>
                            <option value="frozen">冻结</option>
                            <option value="stopped">停用</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" id="btnFilterReset">重置</button>
                        <button type="button" class="btn btn-primary" id="btnFilterQuery">查询</button>
                        <button type="button" class="btn btn-secondary" id="mdmSubjectAddBtn">+ 新增商户主体</button>
                    </div>
                </form>
            </section>
            <section class="table-section">
                <div class="table-scroll-container">
                    <table class="table">
                        <thead><tr>
                            <th>主体ID</th><th>主体名称</th><th>绑定BD名称</th><th>主体类型</th><th>联系人</th>
                            <th>手机号码</th><th>登录账号</th><th>创建时间</th><th>最后操作人</th><th>主体状态</th><th>操作</th>
                        </tr></thead>
                        <tbody id="tableBody">
"""
    sa_inner += "\n".join(sa_tb)
    sa_inner += """
                        </tbody>
                    </table>
                </div>
                <div id="pagination-container"></div>
                <p style="margin-top:12px;font-size:12px;color:#999;line-height:1.6;">
                    说明：本页为 MDM 主体中心（原超管账号能力）。先建立「商家与组织」关系，再由业务生成首家档案。
                </p>
            </section>"""

    tail_sa = """        window.__mdmSaPm = MdmSubjectLf.init({
            pageLabel: '商户',
            subjectTypeLabel: '门店',
            subjectTypeOptions: ['门店', '供应商', '仓库'],
            bindColumnLabel: '绑定BD名称',
            disableConfirmMessage: '确定禁用该商户主体吗？',
            addModalId: 'mdmSuperAdminAdd',
            editModalId: 'mdmSuperAdminDetail',
            addButtonLabel: '+ 新增商户主体'
        });"""

    with open(f"{LF}/mdm_super_admin_accounts.html", "w", encoding="utf-8") as f:
        f.write(page_shell("冷丰WMS - 商户主体建档", "商户主体建档", "基础数据中心 / 主体中心 / 商户主体建档", sa_inner, tail_sa))

    # store archive
    STORE = [
        ["ONS307892038169264128", "冷丰演示门店", "测试通知", "加盟店", "社区生鲜店", "—", "夏利", "178****4646", "华东履约仓 / WH–SH–01", "北京市/市辖区/东城区", "地下车库", "—", "—", "营业中", "—", "—", "—", "关闭", "冻结", "2026-04-29 22:53:02"],
        ["ONS303445581201", "冷丰演示门店", "111", "合作店", "团购自提点", "公司11号", "张三", "138****2211", "创建门店时选择的履约仓库", "天津市/市辖区/河东区", "长三角珠宝产业园A3栋", "117.25,39.12", "138****2211", "营业中", "已进件", "T+1", "自然周", "开启", "正常", "2026-04-20 10:22:11"],
        ["ONS303445581202", "五角场体验店", "DDD", "同行店", "快闪零售", "李四", "李四", "186****9001", "沪东前置仓", "上海市/市辖区/浦东新区", "张江路88号", "121.58,31.20", "186****9001", "营业中", "进件中", "D+1", "自然月", "关闭", "正常", "2026-04-19 15:01:44"],
        ["ONS303445581203", "张江快闪店", "张三", "加盟店", "社区便利店", "张三", "张三", "—", "—", "浙江省/杭州市/余杭区", "文一西路969号", "120.05,30.28", "—", "筹备", "未进件", "—", "—", "关闭", "正常", "2026-04-18 09:33:02"],
    ]
    heads = ["门店ID", "主体名称", "门店名称", "门店合作类型", "门店类型", "绑定BD", "联系人", "手机号码", "配送仓库", "省市区", "详细地址", "经纬度", "可提现手机号", "运营状态", "进件状态", "结算类型", "结算周期", "分账服务", "门店状态", "创建时间"]

    def store_row(cells):
        tds = [esc(x) for x in cells[:18]]
        tds.append(stat(cells[18]))
        tds.append(esc(cells[19]))
        op = '<td class="action-links"><a href="#" class="edit-btn">编辑</a> <a href="#" class="mdm-onboard-btn">去进件</a></td>'
        return "<tr><td>" + "</td><td>".join(tds) + "</td>" + op + "</tr>"

    st_inner = """
            <section class="search-section">
                <form class="search-form">
                    <div class="form-group"><label>主体名称:</label><div class="input-wrapper"><input type="text" id="qSubjectName" placeholder="请输入"><span class="clear-btn">×</span></div></div>
                    <div class="form-group"><label>门店名称:</label><div class="input-wrapper"><input type="text" id="qStoreName" placeholder="请输入"><span class="clear-btn">×</span></div></div>
                    <div class="form-group"><label>门店状态:</label>
                        <select id="qStoreStatus" style="height:36px;min-width:120px;border:1px solid #ddd;border-radius:3px;padding:0 8px;">
                            <option value="">全部</option><option value="normal">正常</option><option value="stopped">停用</option>
                        </select></div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" id="btnFilterReset">重置</button>
                        <button type="button" class="btn btn-primary" id="btnFilterQuery">查询</button>
                        <button type="button" class="btn btn-secondary" id="mdmArchiveStoreAddBtn">+ 新增门店</button>
                    </div>
                </form>
            </section>
            <section class="table-section">
                <div class="table-scroll-container">
                    <table class="table"><thead><tr>"""
    st_inner += "".join(f"<th>{esc(x)}</th>" for x in heads) + "<th>操作</th></tr></thead><tbody id=\"tableBody\">"
    st_inner += "".join(store_row(r) for r in STORE) + "</tbody></table></div><div id=\"pagination-container\"></div></section>"

    with open(f"{LF}/mdm_archive_store.html", "w", encoding="utf-8") as f:
        f.write(page_shell("冷丰WMS - 门店档案", "门店档案", "基础数据中心 / 资源中心 / 门店档案", st_inner, "        MdmErpLists.initArchiveStore();"))

    # supplier
    SUP = [
        ["SUP20188301", "小牛供应链", "超管创建仓库042402", "上海市/市辖区/浦东新区", "张江高科园区B座", "品牌商", "王敏", "138****2210", "2026-04-24 18:20:01", "128", "对公 / 月结", "138****2210", "支付宝", "已进件", "正常"],
        ["SUP20188302", "小牛供应链", "小牛供应链", "江苏省/苏州市/工业园区", "工业园区星湖街328号", "代理商", "牛强", "159****7788", "2026-04-23 12:11:09", "56", "对私 / 周结", "159****7788", "微信", "进件中", "正常"],
        ["SUP20188303", "珠宝集采中心", "珠宝集采中心", "广东省/深圳市/罗湖区", "罗湖区水贝一路", "个人", "钱多多", "—", "2026-04-22 09:45:33", "902", "对公 / T+1", "—", "线下", "未进件", "冻结"],
    ]
    sh = ["供应商ID", "主体名称", "供应商名称", "供应商地址", "供应商详细地址", "供应商类型", "负责人姓名", "手机号码", "创建时间", "供应商商品数量", "结算信息", "可提现手机号", "进件渠道", "进件状态", "供应商状态"]

    def sup_row(c):
        parts = [esc(x) for x in c[:14]]
        parts.append(stat(c[14]))
        op = '<td class="action-links"><a href="#" class="edit-btn">编辑</a> <a href="#" class="mdm-onboard-btn">去进件</a></td>'
        return "<tr><td>" + "</td><td>".join(parts) + "</td>" + op + "</tr>"

    sup_inner = """
<section class="search-section"><form class="search-form">
<div class="form-group"><label>主体名称:</label><div class="input-wrapper"><input id="qSubjectName" type="text"><span class="clear-btn">×</span></div></div>
<div class="form-group"><label>供应商名称:</label><div class="input-wrapper"><input id="qResourceName" type="text"><span class="clear-btn">×</span></div></div>
<div class="form-group"><label>供应商状态:</label><select id="qResStatus" style="height:36px;border:1px solid #ddd;border-radius:3px;"><option value="">全部</option><option value="normal">正常</option><option value="frozen">冻结</option></select></div>
<div class="form-actions"><button type="button" class="btn btn-secondary" id="btnFilterReset">重置</button><button type="button" class="btn btn-primary" id="btnFilterQuery">查询</button><button type="button" id="mdmArchiveSupAddBtn" class="btn btn-secondary">+ 新增供应商</button></div>
</form></section>
<section class="table-section"><div class="table-scroll-container"><table class="table"><thead><tr>"""
    sup_inner += "".join(f"<th>{esc(x)}</th>" for x in sh) + "<th>操作</th></tr></thead><tbody id=\"tableBody\">"
    sup_inner += "".join(sup_row(r) for r in SUP) + "</tbody></table></div><div id=\"pagination-container\"></div></section>"

    with open(f"{LF}/mdm_archive_supplier.html", "w", encoding="utf-8") as f:
        f.write(page_shell("冷丰WMS - 供应商档案", "供应商档案", "基础数据中心 / 资源中心 / 供应商档案", sup_inner, "        MdmErpLists.initArchiveSupplier();"))

    # warehouse
    WH = [
        ["WH001", "沪南一号仓", "主仓库", "仓库", "仓库商家4.18", "小牛", "138****2211", "138****2211", "上海市浦东新区张江路88号", "3200 m²", "2026-04-24 10:22:11", "启用"],
        ["WH304550231884821504", "合作仓-苏州", "前置仓-华东一号库演示超长名称", "仓库", "冷丰演示门店", "周仓", "137****0098", "137****0098", "上海市浦东新区张江路1688号", "180 m²", "2026-04-23 15:01:44", "启用"],
        ["WH-ONS-88303", "自建仓-杭州", "合作仓-苏州", "仓库", "—", "钱多多", "159****7788", "—", "江苏省苏州市工业园区星湖街328号", "5600 m²", "2026-04-22 09:33:02", "停用"],
        ["WH004", "同城周转仓主体", "同城周转仓", "门店", "五角场体验店", "孙丽", "188****7765", "188****7765", "上海市杨浦区国定路506号", "96 m²", "2026-04-21 08:30:00", "启用"],
    ]
    whh = ["仓库编号", "主体名称", "仓库名称", "仓库类型", "关联门店", "仓库管理员", "手机号码", "可提现手机号", "仓库位置", "仓库面积", "创建时间", "状态"]

    def wh_row(c):
        parts = [esc(x) for x in c[:11]]
        parts.append(stat(c[11]))
        st = c[11]
        lab = '<a href="#" class="mdm-disable-toggle">停用</a>' if st == "启用" else '<a href="#" class="mdm-disable-toggle">启用</a>'
        op = f'<td class="action-links">{lab} <a href="#" class="edit-btn">编辑</a></td>'
        return "<tr><td>" + "</td><td>".join(parts) + "</td>" + op + "</tr>"

    wh_inner = """
<section class="search-section"><form class="search-form">
<div class="form-group"><label>主体名称:</label><div class="input-wrapper"><input id="qSubjectName"><span class="clear-btn">×</span></div></div>
<div class="form-group"><label>仓库名称:</label><div class="input-wrapper"><input id="qResourceName"><span class="clear-btn">×</span></div></div>
<div class="form-group"><label>仓库类型:</label><select id="qWhType"><option value="">全部</option><option value="w">仓库</option><option value="s">门店</option></select></div>
<div class="form-group"><label>状态:</label><select id="qWhStatus"><option value="">全部</option><option value="on">启用</option><option value="off">停用</option></select></div>
<div class="form-actions"><button type="button" class="btn btn-secondary" id="btnFilterReset">重置</button><button type="button" class="btn btn-primary" id="btnFilterQuery">查询</button><button type="button" id="mdmArchiveWhAddBtn" class="btn btn-secondary">+ 新增仓库</button></div>
</form></section>
<section class="table-section"><div class="table-scroll-container"><table class="table"><thead><tr>"""
    wh_inner += "".join(f"<th>{esc(x)}</th>" for x in whh) + "<th>操作</th></tr></thead><tbody id=\"tableBody\">"
    wh_inner += "".join(wh_row(r) for r in WH) + "</tbody></table></div><div id=\"pagination-container\"></div>"
    wh_inner += "<p style=\"margin-top:10px;font-size:12px;color:#999;\">说明：仓库档案无进件；停用/启用二次确认。</p></section>"

    with open(f"{LF}/mdm_archive_warehouse.html", "w", encoding="utf-8") as f:
        f.write(page_shell("冷丰WMS - 仓库档案", "仓库档案", "基础数据中心 / 资源中心 / 仓库档案", wh_inner, "        MdmErpLists.initArchiveWarehouse();"))

    # live room
    LV = [
        ["LR-883001", "品牌日播间-A", "品牌日播间-A · 早场", "官方直播", "ANC5001", "周琳", "周琳", "139****8899", "全部用户可见", "2026-04-24 09:00:00", "139****8899", "启用"],
        ["LR-883002", "区域直播-沪南", "区域直播-沪南 · 晚高峰", "区域直播", "ANC5002", "吴悦", "吴悦", "136****6677", "仅门店会员可见", "2026-04-23 20:15:33", "136****6677", "启用"],
        ["LR-883003", "工厂溯源专场", "工厂溯源专场 · 溯源日", "定向直播", "ANC5003", "郑可", "郑可", "135****5544", "仅门店会员可见", "2026-04-22 13:40:18", "—", "停用"],
    ]
    lh = ["直播间ID", "主体名称", "直播间名称", "直播类型", "主播ID", "主播名称", "负责人", "手机号码", "观看权限", "创建时间", "可提现手机号", "状态"]

    def lv_row(c):
        parts = [esc(x) for x in c[:11]]
        parts.append(stat(c[11]))
        op = '<td class="action-links"><a href="#" class="edit-btn">编辑</a> <a href="#" class="mdm-onboard-btn">去进件</a></td>'
        return "<tr><td>" + "</td><td>".join(parts) + "</td>" + op + "</tr>"

    lv_inner = """
<section class="search-section"><form class="search-form">
<div class="form-group"><label>主体名称:</label><div class="input-wrapper"><input id="qSubjectName"><span class="clear-btn">×</span></div></div>
<div class="form-group"><label>直播间名称:</label><div class="input-wrapper"><input id="qResourceName"><span class="clear-btn">×</span></div></div>
<div class="form-group"><label>直播类型:</label><select id="qLiveType"><option value="">全部</option><option value="official">官方直播</option><option value="regional">区域直播</option><option value="targeted">定向直播</option></select></div>
<div class="form-actions"><button type="button" class="btn btn-secondary" id="btnFilterReset">重置</button><button type="button" class="btn btn-primary" id="btnFilterQuery">查询</button><button type="button" id="mdmArchiveLiveAddBtn" class="btn btn-secondary">+ 新增直播间</button></div>
</form></section>
<section class="table-section"><div class="table-scroll-container"><table class="table"><thead><tr>"""
    lv_inner += "".join(f"<th>{esc(x)}</th>" for x in lh) + "<th>操作</th></tr></thead><tbody id=\"tableBody\">"
    lv_inner += "".join(lv_row(r) for r in LV) + "</tbody></table></div><div id=\"pagination-container\"></div>"
    lv_inner += "<p style=\"margin-top:10px;font-size:12px;color:#999;\">维护直播间主数据；场次与货品在营运系统。</p></section>"

    with open(f"{LF}/mdm_archive_live_room.html", "w", encoding="utf-8") as f:
        f.write(page_shell("冷丰WMS - 直播间档案", "直播间档案", "基础数据中心 / 资源中心 / 直播间档案", lv_inner, "        MdmErpLists.initArchiveLiveRoom();"))

    # carrier
    CAR = [
        ["CAR20199001", "顺丰同城承运", "顺丰同城承运", "上海市/市辖区/浦东新区", "张江路88号集散中心", "三方即时配", "刘强", "139****1100", "2026-04-24 11:00:00", "华东", "对公 / 月结", "139****1100", "支付宝", "已进件", "正常"],
        ["CAR20199002", "德邦干线承运", "德邦干线承运", "江苏省/苏州市/工业园区", "星湖街328号", "干线整车", "马涛", "137****2200", "2026-04-23 16:30:22", "长三角", "对公 / T+1", "137****2200", "微信", "进件中", "正常"],
        ["CAR20199003", "区域城配联盟", "区域城配联盟", "浙江省/杭州市/余杭区", "文一西路969号", "城配共配", "周宁", "186****3300", "2026-04-22 09:15:40", "浙江", "对私 / 周结", "—", "线下", "未进件", "冻结"],
    ]
    ch = ["承运商ID", "主体名称", "承运商名称", "承运商地址", "承运商详细地址", "承运类型", "负责人姓名", "手机号码", "创建时间", "服务区域", "结算信息", "可提现手机号", "进件渠道", "进件状态", "承运商状态"]

    def car_row(c):
        parts = [esc(x) for x in c[:14]]
        parts.append(stat(c[14]))
        op = '<td class="action-links"><a href="#" class="edit-btn">编辑</a> <a href="#" class="mdm-onboard-btn">去进件</a></td>'
        return "<tr><td>" + "</td><td>".join(parts) + "</td>" + op + "</tr>"

    car_inner = """
<section class="search-section"><form class="search-form">
<div class="form-group"><label>主体名称:</label><div class="input-wrapper"><input id="qSubjectName"><span class="clear-btn">×</span></div></div>
<div class="form-group"><label>承运商名称:</label><div class="input-wrapper"><input id="qResourceName"><span class="clear-btn">×</span></div></div>
<div class="form-group"><label>承运商状态:</label><select id="qResStatus"><option value="">全部</option><option value="normal">正常</option><option value="frozen">冻结</option></select></div>
<div class="form-actions"><button type="button" class="btn btn-secondary" id="btnFilterReset">重置</button><button type="button" class="btn btn-primary" id="btnFilterQuery">查询</button><button type="button" id="mdmArchiveCarAddBtn" class="btn btn-secondary">+ 新增承运商</button></div>
</form></section>
<section class="table-section"><div class="table-scroll-container"><table class="table"><thead><tr>"""
    car_inner += "".join(f"<th>{esc(x)}</th>" for x in ch) + "<th>操作</th></tr></thead><tbody id=\"tableBody\">"
    car_inner += "".join(car_row(r) for r in CAR) + "</tbody></table></div><div id=\"pagination-container\"></div></section>"

    with open(f"{LF}/mdm_archive_carrier.html", "w", encoding="utf-8") as f:
        f.write(page_shell("冷丰WMS - 承运商档案", "承运商档案", "基础数据中心 / 资源中心 / 承运商档案", car_inner, "        MdmErpLists.initArchiveCarrier();"))

    # BD
    BD_ROWS = [
        ["BD-PROMO-883001", "张伟", "186****9001", "一级BD", "正式", "李总监", "28", "¥128,600.00", "¥96,200.00"],
        ["BD-PROMO-883002", "刘芳", "159****7788", "二级BD", "试用", "王经理", "12", "¥42,300.00", "¥18,000.00"],
        ["BD-PROMO-883003", "陈浩", "137****0098", "渠道BD", "合作", "无上级", "6", "¥9,800.00", "¥2,400.00"],
    ]
    bdh = ["BD推广员ID", "BD姓名", "手机号码", "BD分类", "BD身份", "BD上级", "推广门店数量", "总分佣金额", "总提现金额", "结算信息", "可提现手机号", "创建时间", "状态", "操作"]
    rows_bd = ""
    for i, r in enumerate(BD_ROWS):
        settle = '<a href="#" class="mdm-bd-settle">查看信息</a>'
        st_mark = stat("开启" if i != 2 else "禁用")
        op = '<a href="#" class="mdm-peop-detail">查看详情</a>\u3000<a href="#" class="edit-btn">编辑</a>'
        rows_bd += (
            "<tr><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td>"
            "<td>%s</td><td>%s</td><td>%s</td><td>%s</td><td class=\"action-links\">%s</td></tr>\n"
            % (
                esc(r[0]),
                esc(r[1]),
                esc(r[2]),
                esc(r[3]),
                esc(r[4]),
                esc(r[5]),
                esc(r[6]),
                esc(r[7]),
                esc(r[8]),
                settle,
                esc(r[2]),
                esc("2026-04-24 10:22:11"),
                st_mark,
                op,
            )
        )

    bd_inner = """
<section class="search-section"><form class="search-form">
<div class="form-group"><label>BD姓名:</label><div class="input-wrapper"><input id="qPersonName"><span class="clear-btn">×</span></div></div>
<div class="form-group"><label>手机号码:</label><div class="input-wrapper"><input id="qPhone"><span class="clear-btn">×</span></div></div>
<div class="form-group"><label>BD分类:</label><select id="qBdCategory"><option value="">全部</option><option value="一级">一级BD</option><option value="二级">二级BD</option><option value="渠道">渠道BD</option></select></div>
<div class="form-group"><label>BD身份:</label><select id="qBdIdentity"><option value="">全部</option><option value="正式">正式</option><option value="试用">试用</option><option value="合作">合作</option></select></div>
<div class="form-group"><label>状态:</label><select id="qEnabled"><option value="">全部</option><option value="on">开启</option><option value="off">禁用</option></select></div>
<div class="form-actions"><button type="button" class="btn btn-secondary" id="btnFilterReset">重置</button><button type="button" class="btn btn-primary" id="btnFilterQuery">查询</button><button type="button" id="mdmPeopleBdAddBtn" class="btn btn-primary">添加BD推广员</button></div>
</form></section>
<section class="table-section"><div class="table-scroll-container"><table class="table"><thead><tr>"""
    bd_inner += "".join(f"<th>{esc(x)}</th>" for x in bdh) + "</tr></thead><tbody id=\"tableBody\">" + rows_bd + "</tbody></table></div><div id=\"pagination-container\"></div></section>"

    with open(f"{LF}/mdm_people_bd.html", "w", encoding="utf-8") as f:
        f.write(page_shell("冷丰WMS - BD推广员", "BD推广员", "基础数据中心 / 人员中心 / BD推广员管理 / BD推广员列表", bd_inner, "        MdmErpLists.initPeopleBd();"))

    # driver / anchor simplified in second part...

    DRV = [
        ["DRV8001", "赵强", "138****2210", "城配车队-沪", "在岗", "上海冷丰科技有限公司", "138****2210", "2026-04-24 07:30:00"],
        ["DRV8002", "钱伟", "188****7765", "城配车队-苏", "在岗", "上海冷丰科技有限公司", "188****7765", "2026-04-23 19:12:33"],
        ["DRV8003", "孙杰", "133****0000", "城配车队-浙", "停用", "上海冷丰科技有限公司", "—", "2026-04-19 11:05:22"],
    ]
    drh = ["司机ID", "姓名", "手机号码", "所属车队", "岗位状态", "绑定组织", "可提现手机号", "最近更新", "状态", "操作"]
    drv_body = ""
    for r, dk in zip(DRV, ["fleet_sh", "fleet_su", "fleet_zj"]):
        op = '<a href="#" class="mdm-peop-detail">查看详情</a>\u3000<a href="#" class="edit-btn">编辑</a>'
        st = stat("开启" if r[4] == "在岗" else "禁用")
        drv_body += (
            '<tr data-dept-key="%s"><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td>'
            "<td>%s</td><td class=\"action-links\">%s</td></tr>\n"
            % (
                dk,
                esc(r[0]),
                esc(r[1]),
                esc(r[2]),
                esc(r[3]),
                esc(r[4]),
                esc(r[5]),
                esc(r[6]),
                esc(r[7]),
                st,
                op,
            )
        )

    drv_inner = """
<section class="search-section"><form class="search-form">
<div class="form-group"><label>姓名:</label><div class="input-wrapper"><input id="qPersonName"><span class="clear-btn">×</span></div></div>
<div class="form-group"><label>手机号码:</label><div class="input-wrapper"><input id="qPhone"></div></div>
<div class="form-group"><label>所属车队:</label><select id="qDept"><option value="">全部</option><option value="fleet_sh">城配车队-沪</option><option value="fleet_su">城配车队-苏</option><option value="fleet_zj">城配车队-浙</option></select></div>
<div class="form-group"><label>岗位状态:</label><select id="qJobStatus"><option value="">全部</option><option value="on">在岗</option><option value="off">停用</option></select></div>
<div class="form-group"><label>状态:</label><select id="qEnabled"><option value="">全部</option><option value="on">开启</option><option value="off">禁用</option></select></div>
<div class="form-actions"><button type="button" class="btn btn-secondary" id="btnFilterReset">重置</button><button type="button" class="btn btn-primary" id="btnFilterQuery">查询</button><button type="button" id="mdmPeopleDrvAddBtn" class="btn btn-primary">添加司机</button></div>
</form></section>
<section class="table-section"><div class="table-scroll-container"><table class="table"><thead><tr>"""
    drv_inner += "".join(f"<th>{esc(x)}</th>" for x in drh) + "</tr></thead><tbody id=\"tableBody\">" + drv_body + "</tbody></table></div><div id=\"pagination-container\"></div></section>"

    with open(f"{LF}/mdm_people_driver.html", "w", encoding="utf-8") as f:
        f.write(page_shell("冷丰WMS - 司机", "司机", "基础数据中心 / 人员中心 / 司机管理 / 司机列表", drv_inner, "        MdmErpLists.initPeopleDriver();"))

    ANC = [
        ["ANC5001", "周琳", "139****8899", "内容运营中心", "在岗", "上海冷丰科技有限公司", "139****8899", "2026-04-24 21:00:00"],
        ["ANC5002", "吴悦", "136****6677", "内容运营中心", "在岗", "上海冷丰科技有限公司", "136****6677", "2026-04-23 22:40:18"],
        ["ANC5003", "郑可", "135****5544", "直播培训组", "在岗", "上海冷丰科技有限公司", "—", "2026-04-22 18:09:55"],
    ]
    anh = ["主播ID", "姓名", "手机号码", "所属组别", "岗位状态", "绑定组织", "可提现手机号", "最近更新", "状态", "操作"]
    anc_body = ""
    for r in ANC:
        dk = "content" if "内容" in r[3] else "train"
        op = '<a href="#" class="mdm-peop-detail">查看详情</a>\u3000<a href="#" class="edit-btn">编辑</a>'
        anc_body += (
            '<tr data-dept-key="%s"><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td>'
            "<td>%s</td><td class=\"action-links\">%s</td></tr>\n"
            % (
                dk,
                esc(r[0]),
                esc(r[1]),
                esc(r[2]),
                esc(r[3]),
                esc(r[4]),
                esc(r[5]),
                esc(r[6]),
                esc(r[7]),
                stat("开启"),
                op,
            )
        )

    anc_inner = """
<section class="search-section"><form class="search-form">
<div class="form-group"><label>姓名:</label><div class="input-wrapper"><input id="qPersonName"><span class="clear-btn">×</span></div></div>
<div class="form-group"><label>手机号码:</label><div class="input-wrapper"><input id="qPhone"></div></div>
<div class="form-group"><label>所属组别:</label><select id="qDept"><option value="">全部</option><option value="content">内容运营中心</option><option value="train">直播培训组</option></select></div>
<div class="form-group"><label>岗位状态:</label><select id="qJobStatus"><option value="">全部</option><option value="on">在岗</option><option value="off">停用</option></select></div>
<div class="form-group"><label>状态:</label><select id="qEnabled"><option value="">全部</option><option value="on">开启</option><option value="off">禁用</option></select></div>
<div class="form-actions"><button type="button" class="btn btn-secondary" id="btnFilterReset">重置</button><button type="button" class="btn btn-primary" id="btnFilterQuery">查询</button><button type="button" id="mdmPeopleAncAddBtn" class="btn btn-primary">添加主播</button></div>
</form></section>
<section class="table-section"><div class="table-scroll-container"><table class="table"><thead><tr>"""
    anc_inner += "".join(f"<th>{esc(x)}</th>" for x in anh) + "</tr></thead><tbody id=\"tableBody\">" + anc_body + "</tbody></table></div><div id=\"pagination-container\"></div></section>"

    with open(f"{LF}/mdm_people_anchor.html", "w", encoding="utf-8") as f:
        f.write(page_shell("冷丰WMS - 主播", "主播", "基础数据中心 / 人员中心 / 主播管理 / 主播列表", anc_inner, "        MdmErpLists.initPeopleAnchor();"))

    MH = ["会员ID", "会员昵称", "会员头像", "手机号码", "性别", "是否会员", "会员标签", "会员来源", "绑定方式", "绑定渠道数量", "会员积分", "满意度时长(分)", "满意度反馈次数(建议)", "会员成长分", "成交金额", "成交订单数", "最近消费时间", "状态", "操作"]

    def mem_row(m):
        op = '<a href="#" class="mdm-mem-detail">查看详情</a>\u3000<a href="#" class="mdm-mem-coupon">优惠券</a>\u3000<a href="#" class="mdm-mem-points">积分</a>'
        amt = "%.2f" % m["amt"]
        st = stat(m["st"])
        av = '<span style="display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;border-radius:50%;background:#e3f2fd;">{}</span>'.format(
            esc(m["av"])
        )
        vals = [
            esc(m["id"]),
            esc(m["nick"]),
            av,
            esc(m["ph"]),
            esc(m["g"]),
            esc(m["mem"]),
            esc(m["tag"]),
            esc(m["src"]),
            esc(m["bind"]),
            esc(str(m["bc"])),
            esc(str(m["pt"])),
            esc(str(m["sm"])),
            esc(str(m["fb"])),
            esc(str(m["gr"])),
            esc(amt),
            esc(str(m["oc"])),
            esc(m["lc"]),
            st,
        ]
        return "<tr><td>" + "</td><td>".join(vals) + '</td><td class="action-links">' + op + "</td></tr>"

    members = [
        dict(id="U10001", nick="小程序用户A", av="程", ph="138****2211", g="女", mem="是", tag="高活跃", src="微信小程序", bind="微信", bc=2, pt=12580, sm=128, fb=3, gr=860, amt=3688.0, oc=12, lc="2026-04-25 14:20:03", st="正常"),
        dict(id="U10002", nick="APP会员B", av="B", ph="139****9033", g="男", mem="是", tag="储值", src="APP", bind="手机", bc=1, pt=5320, sm=45, fb=1, gr=420, amt=1299.5, oc=5, lc="2026-04-22 09:15:44", st="正常"),
        dict(id="U10003", nick="访客C", av="访", ph="—", g="未知", mem="否", tag="—", src="微信小程序", bind="隐私", bc=0, pt=0, sm=0, fb=0, gr=10, amt=0.0, oc=0, lc="—", st="冻结"),
        dict(id="U10004", nick="演示会员4", av="4", ph="137****1004", g="男", mem="是", tag="复购", src="APP", bind="微信", bc=3, pt=3280, sm=44, fb=4, gr=180, amt=798.0, oc=6, lc="2026-04-20 14:11:03", st="正常"),
        dict(id="U10005", nick="演示会员5", av="5", ph="137****1005", g="女", mem="否", tag="新客", src="微信小程序", bind="手机", bc=2, pt=820, sm=22, fb=2, gr=320, amt=399.0, oc=4, lc="2026-04-19 09:03:51", st="冻结"),
    ]

    mem_inner = """
<section class="search-section"><form class="search-form">
<div class="form-group"><label>会员ID:</label><div class="input-wrapper"><input id="qMemberId"><span class="clear-btn">×</span></div></div>
<div class="form-group"><label>绑定方式:</label><select id="qBindWay"><option value="">全部</option><option value="微信">微信</option><option value="手机">手机</option><option value="隐私">隐私</option></select></div>
<div class="form-group"><label>手机号码:</label><div class="input-wrapper"><input id="qPhone"></div></div>
<div class="form-actions"><button type="button" class="btn btn-secondary" id="btnFilterReset">重置</button><button type="button" class="btn btn-primary" id="btnFilterQuery">查询</button></div>
</form></section>
<section class="table-section"><div class="table-scroll-container"><table class="table"><thead><tr>"""
    mem_inner += "".join(f"<th>{esc(x)}</th>" for x in MH) + "</tr></thead><tbody id=\"tableBody\">"
    mem_inner += "".join(mem_row(m) for m in members) + "</tbody></table></div><div id=\"pagination-container\"></div></section>"

    with open(f"{LF}/mdm_member_c.html", "w", encoding="utf-8") as f:
        f.write(page_shell("冷丰WMS - C端会员", "C端会员", "基础数据中心 / 会员中心 / C端会员列表", mem_inner, "        MdmErpLists.initMemberC();"))

    AUD = [
        dict(id="WF-STORE-20260507001", src="PC 创建门店", sub="冷丰演示门店", sn="冷丰演示门店文一西路店", bd="王强", ct="周敏", ph="138****2201", ast="待审核", mdm="未生成", ts="2026-05-07 15:20", rv=True),
        dict(id="WF-STORE-20260507002", src="PC 创建门店", sub="五角场体验店", sn="五角场体验店", bd="李四", ct="孙丽", ph="188****7765", ast="待总监审核", mdm="未生成", ts="2026-05-07 14:58", rv=True),
        dict(id="WF-STORE-20260506008", src="PC 创建门店", sub="张江快闪店", sn="张江快闪店", bd="赵小九", ct="陈晨", ph="186****9001", ast="审核成功", mdm="已生成主体与门店档案", ts="2026-05-06 18:36", rv=False),
    ]
    AUDH = ["申请单号", "来源", "主体名称", "门店名称", "绑定BD", "联系人", "手机号码", "审核状态", "MDM状态", "提交时间", "操作"]

    def aud_row(a):
        op = '<a href="#" class="mdm-audit-detail">详情</a>'
        if a["rv"]:
            op += '\u3000<a href="#" class="mdm-audit-review">审核</a>'
        ast = stat(a["ast"])
        if "已生成" in a["mdm"]:
            mdms = '<span class="status active">%s</span>' % esc(a["mdm"])
        else:
            mdms = '<span class="status inactive">%s</span>' % esc(a["mdm"])
        return (
            "<tr><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td>"
            "<td>%s</td><td>%s</td><td>%s</td><td class=\"action-links\">%s</td></tr>"
            % (esc(a["id"]), esc(a["src"]), esc(a["sub"]), esc(a["sn"]), esc(a["bd"]), esc(a["ct"]), esc(a["ph"]), ast, mdms, esc(a["ts"]), op)
        )

    aud_inner = """<section class="search-section"><form class="search-form">
<div class="form-group"><label>主体名称:</label><div class="input-wrapper"><input id="qSubjectName"><span class="clear-btn">×</span></div></div>
<div class="form-group"><label>门店名称:</label><div class="input-wrapper"><input id="qStoreName"><span class="clear-btn">×</span></div></div>
<div class="form-group"><label>审核状态:</label><select id="qAuditStatus"><option value="">全部</option><option value="pending">待审核</option><option value="leaderPending">待总监审核</option><option value="success">审核成功</option><option value="failed">审核失败</option></select></div>
<div class="form-actions"><button type="button" class="btn btn-secondary" id="btnFilterReset">重置</button><button type="button" class="btn btn-primary" id="btnFilterQuery">查询</button></div>
</form></section>
<div class="flow-box"><strong>流程说明：</strong>BD 录入 → 店长确认 → BD 初审 → BD 总监终审 → 自动生成 MDM 档案。</div>
<section class="table-section"><div class="table-scroll-container"><table class="table"><thead><tr>"""
    aud_inner += "".join(f"<th>{esc(x)}</th>" for x in AUDH) + "</tr></thead><tbody id=\"tableBody\">"
    aud_inner += "".join(aud_row(a) for a in AUD) + "</tbody></table></div><div id=\"pagination-container\"></div></section>"

    with open(f"{LF}/mdm_audit_store_registration.html", "w", encoding="utf-8") as f:
        f.write(page_shell("冷丰WMS - 门店注册审核", "门店注册审核", "审核中心 / 门店审核 / 门店注册审核", aud_inner, "        MdmErpLists.initAuditStoreRegistration();"))

    print("generated MDM HTML pages")


if __name__ == "__main__":
    main()
