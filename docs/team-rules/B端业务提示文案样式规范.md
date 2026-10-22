# B 端业务提示文案样式规范

| 项 | 内容 |
|----|------|
| **规则名称** | B 端业务提示文案样式规范 |
| **规则制定人** | 征征 |
| **制定日期** | 2026-08-06 |
| **适用范围** | B 端（MDM / 营销等）页面级、区块级业务说明提示 |
| **状态** | 生效 |

> 制定人姓名若需更正，直接改本表「规则制定人」，并同步更新 `README.md` 索引。

## 规则说明

后续新增或改造 **页面级 / 区块级业务提示文案**（活动规则说明、策略说明、列表页顶部说明等），除非另有说明，一律遵循：

1. **统一样式**：引入 `css/lf-mdm-biz-tip.css`，容器使用 class `mdm-biz-tip`（`role="note"` 可选）。
2. **视觉特征**：浅橙底（`#fff7f0`）+ 浅橙边框（`#ffe0c2`）；正文灰色；需强调的标签/关键词用 `<strong>`（橙色 `#ff7019`）。
3. **不要**再自建灰底灰框提示条（如旧的 `mkt-rg-page-tip`），也不要另写一套相近色值。

卡片内紧贴标题、无需底边距时，可加修饰类 `mdm-biz-tip--flush`。

## 例外

- **字段下方辅助说明**（如「滚动有效期：自获得之日起…」）：仍用各页既有灰色小字 tip（如 `pts-rule-tip`、`mkt-rg-tip`），不属于本规范。
- 错误提示、校验失败、危险操作警告等，按现有错误/警告组件处理，不套用本样式。

## 参考落地

- 样式源：`css/lf-mdm-biz-tip.css`
- 成长值规则 · 升降级策略：`MDM/mdm_member_level_rule.html`
- 注册有礼列表 / 表单：`MDM/mdm_marketing_register_gift.html`、`MDM/mdm_marketing_register_gift_form.html`
- 现金红包列表：`MDM/mdm_marketing_cash_redpack.html`

## Agent 镜像

Cursor 自动应用：`.cursor/rules/mdm-biz-tip.mdc`
