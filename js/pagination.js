/* 分页组件 */

/**
 * 创建分页组件
 * @param {Object} options - 配置选项
 * @param {string} options.containerId - 分页容器的ID
 * @param {number} options.totalItems - 总记录数
 * @param {number} options.currentPage - 当前页码（默认1）
 * @param {number} options.pageSize - 每页显示条数（默认10）
 * @param {Array} options.pageSizeOptions - 每页条数选项（默认[10, 50, 100, 300]）
 * @param {number} options.pageButtonRange - 页码按钮显示范围（默认3，表示显示当前页前后3页）
 * @param {Function} options.onPageChange - 页码改变回调函数
 * @param {Function} options.onPageSizeChange - 每页条数改变回调函数
 */
function createPagination(options) {
    const {
        containerId,
        totalItems = 0,
        currentPage = 1,
        pageSize = 10,
        pageSizeOptions = [10, 50, 100, 300],
        pageButtonRange = 3,
        onPageChange = () => {},
        onPageSizeChange = () => {}
    } = options;
    
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('分页容器不存在:', containerId);
        return;
    }
    
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const selectId = containerId + '-page-size-select';
    const dropdownId = containerId + '-page-size-dropdown';
    const jumpInputId = containerId + '-jump-input';
    
    // 生成页码按钮 - 显示当前页及前后N页
    const generatePageButtons = () => {
        let buttons = '';
        
        // 上一页
        buttons += `<span class="page-btn ${currentPage === 1 ? 'disabled' : ''}" data-page="${currentPage - 1}">‹</span>`;
        
        // 计算显示的页码范围
        const startPage = Math.max(1, currentPage - pageButtonRange);
        const endPage = Math.min(totalPages, currentPage + pageButtonRange);
        
        // 如果起始页不是第1页，显示第1页和省略号
        if (startPage > 1) {
            buttons += `<span class="page-btn" data-page="1">1</span>`;
            if (startPage > 2) {
                buttons += `<span class="page-btn disabled">...</span>`;
            }
        }
        
        // 显示页码按钮
        for (let i = startPage; i <= endPage; i++) {
            buttons += `<span class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</span>`;
        }
        
        // 如果结束页不是最后一页，显示省略号和最后一页
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                buttons += `<span class="page-btn disabled">...</span>`;
            }
            buttons += `<span class="page-btn" data-page="${totalPages}">${totalPages}</span>`;
        }
        
        // 下一页
        buttons += `<span class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" data-page="${currentPage + 1}">›</span>`;
        
        return buttons;
    };
    
    // 生成每页条数选项
    const generatePageSizeOptions = () => {
        return pageSizeOptions.map(size => 
            `<div class="select-option" data-value="${size}">${size}</div>`
        ).join('');
    };
    
    // 渲染分页HTML
    container.innerHTML = `
        <div class="pagination">
            <div class="pagination-info">共${totalItems}条记录 第${currentPage} / ${totalPages}页</div>
            <div class="pagination-controls">
                <div class="page-numbers">
                    ${generatePageButtons()}
                </div>
                <span>${pageSize}条/页</span>
                <div class="custom-select-wrapper" style="display: inline-block; vertical-align: middle; width: 80px;">
                    <div class="custom-select pagination-select-custom" style="width: 100%;">
                        <input type="text" id="${selectId}" placeholder="${pageSize}" value="${pageSize}" style="width: 100%; padding-right: 40px;">
                        <span class="select-arrow">▼</span>
                        <span class="clear-btn">×</span>
                        <div class="select-dropdown" id="${dropdownId}">
                            ${generatePageSizeOptions()}
                        </div>
                    </div>
                </div>
                <div class="jump-to">
                    <span>跳至</span>
                    <input type="text" id="${jumpInputId}">
                    <span>页</span>
                </div>
            </div>
        </div>
    `;
    
    // 绑定页码点击事件
    container.querySelectorAll('.page-btn:not(.disabled)').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.dataset.page);
            if (page && page !== currentPage && page >= 1 && page <= totalPages) {
                onPageChange(page);
            }
        });
    });
    
    // 初始化每页条数下拉框
    if (typeof initCustomSelect === 'function') {
        initCustomSelect(selectId, dropdownId);
    }
    
    // 监听每页条数变化
    const selectInput = document.getElementById(selectId);
    if (selectInput) {
        selectInput.addEventListener('change', () => {
            const newPageSize = parseInt(selectInput.value);
            if (newPageSize && !isNaN(newPageSize)) {
                onPageSizeChange(newPageSize);
            }
        });
    }
    
    // 跳转页码
    const jumpInput = document.getElementById(jumpInputId);
    if (jumpInput) {
        jumpInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const page = parseInt(jumpInput.value);
                if (page && page >= 1 && page <= totalPages) {
                    onPageChange(page);
                    jumpInput.value = '';
                } else {
                    if (typeof showToast === 'function') {
                        showToast('请输入有效的页码');
                    } else {
                        alert('请输入有效的页码');
                    }
                }
            }
        });
    }
}

/**
 * 创建表格分页（直接操作表格行）
 * @param {Object} options - 配置选项
 * @param {string} options.tableBodyId - 表格tbody的ID
 * @param {string} options.paginationContainerId - 分页容器的ID
 * @param {number} options.pageSize - 每页显示条数（默认10）
 * @param {Array} options.pageSizeOptions - 每页条数选项（默认[10, 50, 100, 300]）
 * @param {number} options.pageButtonRange - 页码按钮显示范围（默认3）
 */
function createTablePagination(options) {
    const {
        tableBodyId,
        paginationContainerId,
        pageSize = 10,
        pageSizeOptions = [10, 50, 100, 300],
        pageButtonRange = 3
    } = options;
    
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) {
        console.error('表格tbody不存在:', tableBodyId);
        return;
    }
    
    // 获取所有原始行数据
    const allRows = Array.from(tableBody.querySelectorAll('tr'));
    let currentPage = 1;
    let itemsPerPage = pageSize;
    
    // 渲染分页
    function render() {
        const totalItems = allRows.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
        
        // 清空当前表格
        tableBody.innerHTML = '';
        
        // 计算当前页显示的行范围
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentRows = allRows.slice(startIndex, endIndex);
        
        // 添加当前页行
        currentRows.forEach(row => {
            tableBody.appendChild(row.cloneNode(true));
        });
        
        // 渲染分页组件
        createPagination({
            containerId: paginationContainerId,
            totalItems: totalItems,
            currentPage: currentPage,
            pageSize: itemsPerPage,
            pageSizeOptions: pageSizeOptions,
            pageButtonRange: pageButtonRange,
            onPageChange: (page) => {
                currentPage = page;
                render();
            },
            onPageSizeChange: (newPageSize) => {
                itemsPerPage = newPageSize;
                currentPage = 1; // 重置到第一页
                render();
            }
        });
    }
    
    // 初始渲染
    render();
    
    // 返回刷新函数，供外部调用
    return {
        refresh: render,
        setPageSize: (size) => {
            itemsPerPage = size;
            currentPage = 1;
            render();
        },
        getCurrentPage: () => currentPage,
        getTotalPages: () => Math.ceil(allRows.length / itemsPerPage)
    };
}
