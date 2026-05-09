# 分页组件使用说明

## 引入文件

在 HTML 页面中引入分页组件脚本：

```html
<script src="js/pagination.js"></script>
```

## 方式一：基础分页组件（适用于API分页）

### HTML 结构

在需要显示分页的位置添加容器：

```html
<div id="pagination-container"></div>
```

### JavaScript 调用

```javascript
document.addEventListener('DOMContentLoaded', () => {
    let currentPage = 1;
    let pageSize = 10;
    const totalItems = 100; // 从后端获取的总记录数
    
    createPagination({
        containerId: 'pagination-container',  // 必填：容器ID
        totalItems: totalItems,               // 必填：总记录数
        currentPage: currentPage,             // 可选：当前页码，默认1
        pageSize: pageSize,                   // 可选：每页条数，默认10
        pageSizeOptions: [10, 50, 100, 300], // 可选：每页条数选项
        pageButtonRange: 3,                   // 可选：页码按钮显示范围（显示当前页前后N页），默认3
        onPageChange: (page) => {
            // 页码改变时的回调
            currentPage = page;
            console.log('切换到第', page, '页');
            // 调用API获取新数据
            // 重新渲染分页
        },
        onPageSizeChange: (newPageSize) => {
            // 每页条数改变时的回调
            pageSize = newPageSize;
            currentPage = 1; // 重置到第一页
            console.log('每页显示', newPageSize, '条');
            // 调用API获取新数据
            // 重新渲染分页
        }
    });
});
```

## 方式二：表格分页组件（适用于前端分页）

这种方式会自动处理表格行的显示/隐藏，无需手动操作DOM。

### HTML 结构

```html
<table class="table">
    <thead>
        <tr>
            <th>列1</th>
            <th>列2</th>
        </tr>
    </thead>
    <tbody id="tableBody">
        <!-- 所有数据行 -->
        <tr><td>数据1</td><td>数据2</td></tr>
        <tr><td>数据3</td><td>数据4</td></tr>
        <!-- ... 更多行 ... -->
    </tbody>
</table>

<div id="pagination-container"></div>
```

### JavaScript 调用

```javascript
document.addEventListener('DOMContentLoaded', () => {
    // 创建表格分页，自动处理行显示
    const pagination = createTablePagination({
        tableBodyId: 'tableBody',                    // 必填：表格tbody的ID
        paginationContainerId: 'pagination-container', // 必填：分页容器ID
        pageSize: 10,                                 // 可选：每页显示条数，默认10
        pageSizeOptions: [10, 50, 100, 300],         // 可选：每页条数选项
        pageButtonRange: 3                            // 可选：页码按钮显示范围，默认3
    });
    
    // 可选：使用返回的方法
    // pagination.refresh();           // 刷新分页
    // pagination.setPageSize(50);     // 设置每页条数
    // pagination.getCurrentPage();    // 获取当前页码
    // pagination.getTotalPages();     // 获取总页数
});
```

## 完整示例

### API分页示例

```javascript
document.addEventListener('DOMContentLoaded', () => {
    let currentPage = 1;
    let pageSize = 10;
    let totalItems = 0;
    
    // 获取数据并渲染分页
    function loadData() {
        // 调用API
        fetch(`/api/data?page=${currentPage}&pageSize=${pageSize}`)
            .then(response => response.json())
            .then(data => {
                totalItems = data.total;
                renderTable(data.items);
                renderPagination();
            });
    }
    
    function renderPagination() {
        createPagination({
            containerId: 'pagination-container',
            totalItems: totalItems,
            currentPage: currentPage,
            pageSize: pageSize,
            pageButtonRange: 3,
            onPageChange: (page) => {
                currentPage = page;
                loadData();
            },
            onPageSizeChange: (newPageSize) => {
                pageSize = newPageSize;
                currentPage = 1;
                loadData();
            }
        });
    }
    
    // 初始加载
    loadData();
});
```

### 前端表格分页示例

```javascript
document.addEventListener('DOMContentLoaded', () => {
    // 一行代码搞定表格分页
    createTablePagination({
        tableBodyId: 'tableBody',
        paginationContainerId: 'pagination-container',
        pageSize: 10
    });
});
```

## 参数说明

### createPagination 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| containerId | string | 是 | - | 分页容器的ID |
| totalItems | number | 是 | 0 | 总记录数 |
| currentPage | number | 否 | 1 | 当前页码 |
| pageSize | number | 否 | 10 | 每页显示条数 |
| pageSizeOptions | array | 否 | [10, 50, 100, 300] | 每页条数选项 |
| pageButtonRange | number | 否 | 3 | 页码按钮显示范围（显示当前页前后N页） |
| onPageChange | function | 否 | () => {} | 页码改变回调函数 |
| onPageSizeChange | function | 否 | () => {} | 每页条数改变回调函数 |

### createTablePagination 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| tableBodyId | string | 是 | - | 表格tbody的ID |
| paginationContainerId | string | 是 | - | 分页容器的ID |
| pageSize | number | 否 | 10 | 每页显示条数 |
| pageSizeOptions | array | 否 | [10, 50, 100, 300] | 每页条数选项 |
| pageButtonRange | number | 否 | 3 | 页码按钮显示范围 |

### createTablePagination 返回值

| 方法 | 说明 |
|------|------|
| refresh() | 刷新分页显示 |
| setPageSize(size) | 设置每页显示条数 |
| getCurrentPage() | 获取当前页码 |
| getTotalPages() | 获取总页数 |

## 新特性

1. **智能页码显示**：根据 `pageButtonRange` 参数显示当前页前后N页，超出范围显示省略号
2. **表格分页组件**：`createTablePagination` 自动处理表格行的显示/隐藏，无需手动操作DOM
3. **跳转功能**：支持输入页码直接跳转
4. **每页条数选择**：支持动态切换每页显示条数

## 注意事项

1. 确保在调用分页组件之前已经引入了 `js/common.js`（因为依赖 `initCustomSelect` 和 `showToast` 函数）
2. 每次数据更新后需要重新调用 `createPagination()` 来更新分页显示（API分页方式）
3. `createTablePagination()` 会自动处理分页更新，无需手动调用
4. 容器ID必须唯一，避免多个分页组件冲突
