# WMS 前端页面开发规范（Skill 说明）

本 Skill 用于指导在本仓库内进行 **WMS Web 页面的开发与修改**。  
当你（或 AI 助手）在本项目中改动 HTML / CSS / JS 页面时，**默认必须遵循本规范**，除非用户在对话中明确说明需要特殊处理。

---

## 1. 适用场景与优先级

- **适用范围**
  - WMS 系统的所有 HTML 页面重构与新建。
  - 与 `PageManager`、公共模态框、公共样式、公共脚本相关的前端开发。
- **优先级约定**
  - **强制**：页面结构、共享组件使用方式、禁止手写的组件。
  - **推荐**：字段命名风格、样式组织方式、PageManager 参数命名。
  - 如与用户临时要求冲突：**先按用户最新明确要求执行，并在回复中说明与规范不一致的地方。**

---

## 2. 标准 HTML 页面结构

### 2.1 页面模板（必须遵循）

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>冷丰WMS - 页面名称</title>
    <link rel="stylesheet" href="css/common.css">
    <link rel="stylesheet" href="css/components.css">
    <style>
        /* 仅放本页面少量特有样式；复杂样式建议拆到独立 CSS */
    </style>
</head>
<body>
    <div id="sidebar-container"></div>
    <script src="js/wms-sidebar.js"></script>
    <div id="header-container"></div>
    
    <div class="container">
        <main class="main-content">
            <!-- 页面内容 -->
        </main>
    </div>

    <!-- 公共脚本，顺序保持一致 -->
    <script src="js/common.js"></script>
    <script src="js/pagination.js"></script>
    <script src="js/form-utils.js"></script>
    <script src="js/modal-manager.js"></script>
    <script src="js/page-manager.js"></script>
    <script>
        // 页面 JS 逻辑（PageManager 初始化、事件绑定等）
    </script>
</body>
</html>
```

### 2.2 必需组成部分（强制）

- **必需 DOM 容器**
  - `sidebar-container`：左侧菜单容器。
  - `header-container`：顶部头部容器。
  - `container` + `main-content`：主内容区域。
- **必需脚本**
  - `common.js`, `pagination.js`, `form-utils.js`, `modal-manager.js`, `page-manager.js`。
- **禁止手写的共享组件（强制禁止）**
  - 仓库选择模态框
  - Toast 提示
  - 删除确认模态框
  - 新增 / 编辑模态框
  
以上组件一律通过公共脚本或 `PageManager` 自动注入，不在 HTML 中写死。

---

## 3. PageManager 配置规范

### 3.1 基础结构

```javascript
const page = new PageManager({
    entityName: '实体名称',
    statusColumnIndex: 状态列索引, // 填表格中“状态”列的索引，没有可省略
    
    // 搜索区域下拉框配置
    customSelects: [
        { inputId: 'searchField', dropdownId: 'searchFieldDropdown' }
    ],
    
    // 字段定义（驱动自动生成新增/编辑模态框）
    fields: [
        { 
            id: 'fieldId',
            label: '字段标签',
            type: 'text|select|number|textarea|radio|triple-input|raw',
            required: true|false,
            editDisabled: true|false,   // 仅编辑禁用
            disabled: true|false,       // 新增 + 编辑都禁用
            options: CommonOptions.xxx, // select / radio 对应选项
            labelWidth: '指定宽度'      // 需要特殊宽度时才配置
        }
    ],
    
    // 新增模态框
    addModal: {
        triggerBtnId: 'addBtn',  // 触发按钮 ID
        defaults: { fieldName: '默认值' },
        validations: [
            { id: 'fieldId', message: '错误消息', required: true }
        ],
        onSave: () => {
            // 保存逻辑（必填：至少占位）
        }
    },
    
    // 编辑模态框
    editModal: {
        validations: [
            { id: 'fieldId', message: '错误消息', required: true }
        ],
        onSave: () => {
            // 保存逻辑
        },
        mapRowToForm: (row) => {
            // 表格行 -> 表单映射
        }
    },
    
    // 删除模态框（如果默认行为够用，可保持空对象）
    deleteModal: {}
});
```

### 3.2 使用约定

- **字段定义优先**：新增 / 编辑模态框的结构尽量通过 `fields` 推导，不在 HTML 中手写。
- **事件逻辑内聚**：与“行操作”强相关的逻辑，优先写在 `onSave`、`mapRowToForm` 等回调中。
- **命名清晰**：`entityName` 使用业务含义清晰的中文或统一英文，便于日志与提示。

---

## 4. 字段类型与禁用规则

### 4.1 支持的字段类型

- **text**：单行文本输入。
- **number**：数字输入。
- **select**：下拉选择，配合 `options: CommonOptions.xxx`。
- **textarea**：多行输入。
- **radio**：单选按钮组。
- **triple-input**：三输入组合（如「排-列-层」）。
- **raw**：原始 HTML，用于复杂布局或特殊内容（谨慎使用）。

### 4.2 禁用属性说明

- **editDisabled**
  - 仅在 **编辑模态框** 中禁用，对新增无影响。
  - 典型场景：主键、编码类字段只允许新增时填写。
- **disabled**
  - 在 **新增** 和 **编辑** 模态框中都禁用。
  - 典型场景：只展示不允许修改的系统字段。

---

## 5. 公共选项（CommonOptions）

### 5.1 预定义选项（优先使用）

- `CommonOptions.warehouse`：仓库。
- `CommonOptions.isEnabled`：是否启用。
- `CommonOptions.lpnStatus`：容器状态。
- `CommonOptions.lpnType`：容器类型。
- `CommonOptions.manageMode`：管理模式。
- `CommonOptions.sourceTrigger`：来源触发。
- `CommonOptions.company`：货主。
- `CommonOptions.profile`：作业档案。

如需新增公共选项，优先补充到 `CommonOptions` 中，而不是在页面里写死。

---

## 6. 事件与自定义逻辑

### 6.1 按钮类行为

- **新增按钮**
  - 通过 `addModal.triggerBtnId` 关联。
  - 逻辑中应自动设置“当前仓库”等上下文字段。
- **编辑按钮**
  - 通过 `PageManager` 提供的行操作自动处理。
- **删除按钮**
  - 使用 `PageManager` 内置的删除确认模态框逻辑。

### 6.2 自定义业务逻辑

- 在 `PageManager` 初始化完成后，按需添加自定义事件监听。
- 保持“公共逻辑在公共文件，自定义逻辑在页面脚本中”的边界清晰。

---

## 7. 共享组件与复用原则

### 7.1 共享组件来源

- 仓库选择模态框：`common.js` 注入。
- Toast 提示：`common.js` 注入。
- 删除确认模态框：`PageManager` 注入。
- 新增 / 编辑模态框：由 `PageManager` 根据 `fields` 自动生成。

### 7.2 使用原则（强制 + 推荐）

1. **优先使用现有公共组件**：在写新页面前，先看是否已有类似功能。
2. **避免重复实现**：不要再自己写一套表单验证、模态框、Toast。
3. **抽象复用**：多页面公用的逻辑，沉淀到公共脚本 / 公共样式。
4. **统一调用方式**：调用方式保持与现有页面一致，避免“同类功能多种写法”。

### 7.3 严禁事项

- 在 HTML 中手写上述共享组件 DOM。
- 在多个页面中复制粘贴同一段业务逻辑而不抽象公共函数。

---

## 8. 样式规范

### 8.1 CSS 组织方式

- **`common.css`**：全局通用样式（布局、基础颜色、表格通用样式等）。
- **`components.css`**：可复用组件样式（按钮组、搜索栏、模态框结构等）。
- **页面内 `<style>`**：
  - 仅放与本页面强绑定、复用价值低的样式。
  - 较多、较复杂时建议抽出为单独 CSS 文件。

### 8.2 视觉一致性（推荐）

- 标签宽度、间距、字体大小与现有页面保持一致。
- 新增组件尽量复用既有 class，而不是新起一套风格。

---

## 9. 开发与代码审查清单

### 9.1 新页面开发步骤（建议当作 Checklist）

1. 基于 **标准 HTML 模板** 创建页面。
2. 定义 `PageManager` 配置（包含 `fields`、`addModal`、`editModal` 等）。
3. 使用 `CommonOptions` 中的预定义选项填充下拉 / 单选。
4. 配置必要的校验规则与保存回调。
5. 确认未手写任何共享组件 DOM。
6. 自测页面：新增 / 编辑 / 删除 / 搜索 / 分页等完整链路。

### 9.2 Code Review 关注点

- 是否使用了标准页面结构与公共脚本。
- 是否通过 `PageManager` 配置驱动，而不是大量手写模态框。
- 是否避免手写仓库选择、Toast、删除确认等共享组件。
- 字段类型、`required` 与 `disabled` / `editDisabled` 是否合理。
- 样式是否复用了既有 class、是否存在重复逻辑可抽取。

---

遵循本规范可以显著提升 **页面一致性、可维护性与可扩展性**，减少重复代码，提高开发效率。  