/* 公共JavaScript - 冷丰WMS系统 */

/**
 * 系统配置
 */
const WMSConfig = {
    // 菜单配置
    menuItems: [
        { href: 'warehouse.html', text: '仓库' },
        { href: 'company.html', text: '货主' },
        { href: 'room.html', text: '仓间' },
        { href: 'zone.html', text: '库区' },
        { href: 'area.html', text: '作业区域' },
        { href: 'location.html', text: '储位' },
        { href: 'warehouse_sku.html', text: '商品' },
        { href: 'carrier.html', text: '承运商' }
    ],
    
    // 仓库数据
    warehouses: [
        { code: 'W001', name: '南京仓' },
        { code: 'W002', name: '嘉兴仓' },
        { code: 'W003', name: '上海仓' },
        { code: 'W004', name: '北京仓' },
        { code: 'W005', name: '广州仓' },
        { code: 'W006', name: '深圳仓' }
    ],
    
    // Toast显示时长
    toastDuration: 3000
};

const SELECTED_WAREHOUSE_KEY = 'selectedWarehouse';

/**
 * 保存选中的仓库
 * @param {{code: string, name: string}} warehouse
 */
function saveSelectedWarehouse(warehouse) {
    if (!warehouse || !warehouse.code || !warehouse.name) return;
    sessionStorage.setItem(SELECTED_WAREHOUSE_KEY, JSON.stringify(warehouse));
}

/**
 * 读取已保存的仓库
 * @returns {{code: string, name: string} | null}
 */
function getSavedWarehouse() {
    const saved = sessionStorage.getItem(SELECTED_WAREHOUSE_KEY);
    if (!saved) return null;

    try {
        const warehouse = JSON.parse(saved);
        if (warehouse && warehouse.code && warehouse.name) {
            return warehouse;
        }
    } catch (e) {
        // 忽略无效缓存
    }

    sessionStorage.removeItem(SELECTED_WAREHOUSE_KEY);
    return null;
}

/**
 * 更新页面上的仓库按钮显示
 * @param {{code: string, name: string} | null} warehouse
 */
function setWarehouseButton(warehouse) {
    const warehouseSelectBtn = document.getElementById('warehouseSelectBtn');
    if (!warehouseSelectBtn) return;

    if (warehouse && warehouse.code && warehouse.name) {
        warehouseSelectBtn.textContent = `${warehouse.code}-${warehouse.name}`;
    } else {
        warehouseSelectBtn.textContent = '请选择仓库';
    }
}

// 加载 header 组件
function loadHeader() {
    const headerContainer = document.getElementById('header-container');
    
    if (headerContainer) {
        const wp = window.wmsPath || { page: function (f) { return f; }, asset: function (r) { return r; } };
        const path = window.location.pathname || '';
        const href = window.location.href || '';
        // serve 等会去掉 .html，统一成带后缀的文件名再判断模块
        let pageFile = (path.split('/').pop() || '').toLowerCase().split('?')[0];
        if (pageFile && !pageFile.endsWith('.html')) pageFile += '.html';
        const isTmsPage = pageFile.startsWith('tms_') || path.includes('TMS_index.html') || href.includes('TMS_index.html');
        const isPurchasePage = pageFile === 'purchase_index.html' || pageFile.startsWith('purchase_');
        const isBasicSettingsPage = pageFile === 'basic_settings_index.html' || pageFile.startsWith('basic_settings_');
        const isAuthzDesignerPage = pageFile === 'authz-designer.html';
        const isMobilePage = pageFile === 'mobile_index.html' || pageFile === 'app_login.html';
        const isMdmPage = /\/MDM\//i.test(path) || /\/MDM$/i.test(path) || pageFile.startsWith('mdm_');
        const isMdmAuditPage = pageFile.startsWith('mdm_audit_');
        const isMdmOrderPage = pageFile.startsWith('mdm_order_');
        const isMdmAftersalePage = pageFile.startsWith('mdm_aftersale_');
        const isMdmMarketingPage = pageFile.startsWith('mdm_marketing_');
        const isMdmLivePage = pageFile.startsWith('mdm_live_');
        const isMdmSettlePage = pageFile.startsWith('mdm_settle_');
        const isMdmBdPage = pageFile.startsWith('mdm_bd_');
        const isMdmProductPage = pageFile.startsWith('mdm_product_');
        const isMdmMemberPage = pageFile.startsWith('mdm_member_');
        const isMdmBasePage =
            isMdmPage &&
            !isMdmAuditPage &&
            !isMdmOrderPage &&
            !isMdmAftersalePage &&
            !isMdmMarketingPage &&
            !isMdmLivePage &&
            !isMdmSettlePage;
        const isMdmWorkbenchPage = pageFile === 'mdm_workbench.html';
        const isMdmDataCenterPage =
            isMdmBasePage &&
            !isMdmWorkbenchPage &&
            !isMdmBdPage &&
            !isMdmProductPage &&
            !isMdmMemberPage;
        // 直接使用 header HTML 内容，避免 fetch 问题
        const headerHtml = `
            <!-- 顶部导航栏组件 -->
            <header class="header">
                <button class="sidebar-toggle" id="sidebarToggle">
                    <img src="${wp.asset('image/侧边收起.svg')}" alt="收起侧边栏" style="height: 20px; vertical-align: middle;">
                </button>
                
                <nav class="nav-tabs">
                    <a href="${wp.page('mobile_index.html')}" class="${isMobilePage ? 'active' : ''}">移动端</a>
                    <a href="${wp.page('mdm_workbench.html')}" class="${isMdmWorkbenchPage ? 'active' : ''}">工作台</a>
                    <a href="${wp.page('mdm_party_store.html')}" class="${isMdmDataCenterPage ? 'active' : ''}">业务伙伴</a>
                    <a href="${wp.page('mdm_member_c.html')}" class="${isMdmMemberPage ? 'active' : ''}">会员</a>
                    <a href="${wp.page('mdm_product_selection.html')}" class="${isMdmProductPage ? 'active' : ''}">商品</a>
                    <a href="${wp.page('mdm_audit_store_registration.html')}" class="${isMdmAuditPage ? 'active' : ''}">审核中心</a>
                    <a href="${wp.page('mdm_order_retail.html')}" class="${isMdmOrderPage ? 'active' : ''}">订单</a>
                    <a href="${wp.page('mdm_aftersale_ticket.html')}" class="${isMdmAftersalePage ? 'active' : ''}">售后</a>
                    <a href="${wp.page('mdm_marketing_points_home.html')}" class="${isMdmMarketingPage ? 'active' : ''}">营销</a>
                    <a href="${wp.page('mdm_live_room.html')}" class="${isMdmLivePage ? 'active' : ''}">直播</a>
                    <a href="${wp.page('index.html')}" class="${!isTmsPage && !isPurchasePage && !isBasicSettingsPage && !isAuthzDesignerPage && !isMdmPage && !isMobilePage ? 'active' : ''}">仓储</a>
                    <a href="${wp.page('TMS_index.html')}" class="${isTmsPage ? 'active' : ''}">物流</a>
                    <a href="${wp.page('purchase_index.html')}" class="${isPurchasePage ? 'active' : ''}">采购</a>
                    <a href="${wp.page('mdm_settle_index.html')}" class="${isMdmSettlePage ? 'active' : ''}">财务</a>
                    <a href="${wp.page('basic_settings_miniprogram_agreement.html')}" class="${isBasicSettingsPage ? 'active' : ''}">基础设置</a>
                    <a href="${wp.page('authz-designer.html')}" class="${isAuthzDesignerPage ? 'active' : ''}">权限设计</a>
                </nav>
                
                <div class="header-right">
                    <div class="user-menu" id="userMenu">
                        <div class="user-menu-trigger" id="userMenuTrigger">
                            <img src="${wp.asset('image/头像.png')}" alt="头像">
                            <span class="user-name">用户名</span>
                            <span class="user-menu-arrow">▼</span>
                        </div>
                        <div class="user-menu-dropdown" id="userMenuDropdown">
                            <a href="${wp.page('user_profile.html')}" class="user-menu-item">
                                <span class="user-menu-icon">👤</span>
                                <span>个人中心</span>
                            </a>
                            <div class="user-menu-divider"></div>
                            <a href="javascript:void(0)" class="user-menu-item user-menu-logout" onclick="logout()">
                                <span class="user-menu-icon">🚪</span>
                                <span>退出登录</span>
                            </a>
                        </div>
                    </div>
                </div>
            </header>
        `;
        
        headerContainer.innerHTML = headerHtml;

        /* 一级菜单横向滚动：当前页签滚入可视区 */
        var navTabs = headerContainer.querySelector('.nav-tabs');
        var activeTab = navTabs && navTabs.querySelector('a.active');
        if (activeTab && typeof activeTab.scrollIntoView === 'function') {
            requestAnimationFrame(function () {
                activeTab.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'auto' });
            });
        }
        
        // 添加调试信息
        console.log('Header loaded, sidebarToggle element:', document.getElementById('sidebarToggle'));
        console.log('Header loaded, userMenu element:', document.getElementById('userMenu'));
        
        // 注意：不在这里调用初始化函数，避免重复绑定事件
        // initSidebar() 和 initUserMenu() 将在 initPage() 中统一调用
    }
}

// [已废弃] loadSidebar() 已被 wms-sidebar.js 替代，不再需要

// 侧边栏折叠功能
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarContainer = document.getElementById('sidebar-container');
    const sidebarToggle = document.getElementById('sidebarToggle');
    
    if (sidebarToggle && sidebar) {
        // 移除可能存在的旧事件监听器
        const newToggleBtn = sidebarToggle.cloneNode(true);
        sidebarToggle.parentNode.replaceChild(newToggleBtn, sidebarToggle);
        
        // 绑定新的事件监听器
        newToggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            if (sidebarContainer) {
                sidebarContainer.classList.toggle('collapsed');
            }
        });
    }
}

// 子菜单展开/折叠
function toggleSubmenu(element) {
    const submenu = element.nextElementSibling;
    const toggle = element.querySelector('.menu-toggle');
    
    if (submenu && submenu.classList.contains('submenu')) {
        submenu.classList.toggle('expanded');
        if (toggle) {
            toggle.textContent = submenu.classList.contains('expanded') ? '▼' : '▶';
        }
    }
}

// Toast提示
function showToast(message, type = 'error') {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.className = 'toast ' + type;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, WMSConfig.toastDuration);
}

/**
 * 批量初始化下拉框
 * @param {Array} selects - [{inputId, dropdownId}]
 */
function initCustomSelects(selects) {
    selects.forEach(({ inputId, dropdownId }) => {
        initCustomSelect(inputId, dropdownId);
    });
}

/**
 * 渲染自定义下拉选项
 * @param {string} dropdownId
 * @param {{value: string, text: string}[]} options
 */
function renderSelectOptions(dropdownId, options = []) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;

    dropdown.innerHTML = options.map(
        (opt) => `<div class="select-option" data-value="${opt.value}">${opt.text}</div>`
    ).join('');
}

// 自定义下拉选择框初始化
function initCustomSelect(inputId, dropdownId) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    
    if (!input || !dropdown) return;
    
    const clearBtn = input.parentElement.querySelector('.clear-btn');
    
    // 点击输入框显示下拉
    input.addEventListener('click', (e) => {
        e.stopPropagation();
        if (input.disabled) return;
        
        // 关闭其他下拉框
        document.querySelectorAll('.select-dropdown.show').forEach(d => {
            if (d !== dropdown) d.classList.remove('show');
        });
        
        dropdown.classList.toggle('show');
    });
    
    // 输入框输入时过滤选项
    input.addEventListener('input', (e) => {
        const value = e.target.value.toLowerCase();
        dropdown.classList.add('show');
        
        // 动态获取选项，支持选项被更新的情况
        dropdown.querySelectorAll('.select-option').forEach(option => {
            const text = option.textContent.toLowerCase();
            option.style.display = text.includes(value) ? 'block' : 'none';
        });
    });
    
    // 使用事件委托处理选项点击，支持动态更新的选项
    dropdown.addEventListener('click', (e) => {
        const option = e.target.closest('.select-option');
        if (option) {
            e.stopPropagation();
            input.value = option.textContent;
            input.dataset.value = option.dataset.value;
            dropdown.classList.remove('show');
            
            // 触发change事件
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });
    
    // 清除按钮
    if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            input.value = '';
            input.dataset.value = '';
            dropdown.classList.remove('show');
            
            // 显示所有选项（动态获取）
            dropdown.querySelectorAll('.select-option').forEach(option => {
                option.style.display = 'block';
            });
            
            input.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }
}

// 点击外部关闭下拉框
document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-select')) {
        document.querySelectorAll('.select-dropdown.show').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    }
});

// 清除按钮功能初始化
function initClearButtons() {
    document.querySelectorAll('.input-wrapper .clear-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const input = this.previousElementSibling;
            if (input) {
                input.value = '';
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    });
    
    // 自定义下拉框的清空按钮
    document.querySelectorAll('.custom-select .clear-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const input = this.parentElement.querySelector('input');
            if (input) {
                input.value = '';
                input.dataset.value = '';
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    });
}

// 仓库选择模态框
function initWarehouseSelector() {
    const warehouseSelectBtn = document.getElementById('warehouseSelectBtn');
    const warehouseSelectModal = document.getElementById('warehouseSelectModal');
    const warehouseSelectCancelBtn = document.getElementById('warehouseSelectCancelBtn');
    const warehouseList = document.getElementById('warehouseList');
    
    if (!warehouseSelectBtn || !warehouseSelectModal) return;
    
    // 渲染仓库列表
    function renderWarehouseList() {
        if (!warehouseList) return;
        
        warehouseList.innerHTML = WMSConfig.warehouses.map(wh => `
            <div class="warehouse-item" data-code="${wh.code}" data-name="${wh.name}">
                <span class="warehouse-item-code">${wh.code}</span>
                <span class="warehouse-item-name">${wh.name}</span>
            </div>
        `).join('');

        const savedWarehouse = getSavedWarehouse();
        
        // 绑定点击事件
        warehouseList.querySelectorAll('.warehouse-item').forEach(item => {
            if (savedWarehouse && item.dataset.code === savedWarehouse.code) {
                item.classList.add('selected');
            }

            item.addEventListener('click', () => {
                const code = item.dataset.code;
                const name = item.dataset.name;
                
                setWarehouseButton({ code, name });
                warehouseSelectModal.style.display = 'none';
                
                // 更新选中状态
                warehouseList.querySelectorAll('.warehouse-item').forEach(i => {
                    i.classList.remove('selected');
                });
                item.classList.add('selected');

                // 保存选中的仓库，确保切换菜单后仍保留
                saveSelectedWarehouse({ code, name });
                
                // 触发仓库变更事件
                document.dispatchEvent(new CustomEvent('warehouseChange', {
                    detail: { code, name }
                }));
            });
        });
    }
    
    warehouseSelectBtn.addEventListener('click', () => {
        renderWarehouseList();
        warehouseSelectModal.style.display = 'block';
    });
    
    if (warehouseSelectCancelBtn) {
        warehouseSelectCancelBtn.addEventListener('click', () => {
            warehouseSelectModal.style.display = 'none';
        });
    }
    
    // 点击模态框外部关闭
    warehouseSelectModal.addEventListener('click', (e) => {
        if (e.target === warehouseSelectModal) {
            warehouseSelectModal.style.display = 'none';
        }
    });

    // 页面初始化时恢复仓库选择
    const savedWarehouse = getSavedWarehouse();
    if (savedWarehouse) {
        setWarehouseButton(savedWarehouse);
    }
}

/**
 * 获取当前选中的仓库
 */
function getCurrentWarehouse() {
    const btn = document.getElementById('warehouseSelectBtn');
    if (btn && btn.textContent !== '请选择仓库') {
        const text = btn.textContent;
        const [code, ...nameParts] = text.split('-');
        return { code, name: nameParts.join('-') };
    }

    return getSavedWarehouse();
}

// [已废弃] initPagination() 已被 pagination.js 的 createTablePagination 替代，不再需要

// 通用模态框关闭功能
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// ESC键关闭所有模态框
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAllModals();
        // 关闭仓库选择模态框
        const warehouseModal = document.getElementById('warehouseSelectModal');
        if (warehouseModal) {
            warehouseModal.style.display = 'none';
        }
    }
});

// 表格勾选框功能
function initTableCheckbox(tableId = 'tableBody') {
    const table = document.querySelector('.table');
    if (!table) return;
    
    const tbody = document.getElementById(tableId);
    if (!tbody) return;
    
    const thead = table.querySelector('thead tr');
    const allCheckboxClass = 'checkbox-all';
    const rowCheckboxClass = 'checkbox-row';
    
    // 获取所有行勾选框
    function getRowCheckboxes() {
        return Array.from(tbody.querySelectorAll(`.${rowCheckboxClass}`));
    }
    
    // 获取全选勾选框
    function getAllCheckbox() {
        return thead.querySelector(`.${allCheckboxClass}`);
    }
    
    // 更新全选勾选框状态
    function updateAllCheckbox() {
        const allCheckbox = getAllCheckbox();
        if (!allCheckbox) return;
        
        const rowCheckboxes = getRowCheckboxes();
        const checkedCount = rowCheckboxes.filter(cb => cb.checked).length;
        
        allCheckbox.checked = checkedCount > 0 && checkedCount === rowCheckboxes.length;
        allCheckbox.indeterminate = checkedCount > 0 && checkedCount < rowCheckboxes.length;
        
        // 更新批量操作区域
        updateBatchActions(checkedCount);
    }
    
    // 更新批量操作区域
    function updateBatchActions(count) {
        let batchActions = document.querySelector('.batch-actions');
        
        if (count > 0) {
            if (!batchActions) {
                // 创建批量操作区域
                batchActions = document.createElement('div');
                batchActions.className = 'batch-actions';
                batchActions.innerHTML = `
                    <span class="batch-actions-info">已选择 <strong>${count}</strong> 项</span>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="clearAllCheckboxes()">取消选择</button>
                `;
                
                const tableSection = document.querySelector('.table-section');
                if (tableSection) {
                    tableSection.insertBefore(batchActions, tableSection.firstChild);
                }
            } else {
                batchActions.querySelector('.batch-actions-info strong').textContent = count;
            }
            batchActions.classList.add('show');
        } else if (batchActions) {
            batchActions.classList.remove('show');
        }
    }
    
    // 全选/反选
    const allCheckbox = getAllCheckbox();
    if (allCheckbox) {
        allCheckbox.addEventListener('change', (e) => {
            const checked = e.target.checked;
            getRowCheckboxes().forEach(cb => {
                cb.checked = checked;
            });
            updateBatchActions(checked ? getRowCheckboxes().length : 0);
        });
    }
    
    // 行勾选框事件
    tbody.addEventListener('change', (e) => {
        if (e.target.classList.contains(rowCheckboxClass)) {
            updateAllCheckbox();
        }
    });
    
    // 初始化状态
    updateAllCheckbox();
}

// 清除所有勾选
function clearAllCheckboxes() {
    document.querySelectorAll('.checkbox-row').forEach(cb => {
        cb.checked = false;
    });
    
    const allCheckbox = document.querySelector('.checkbox-all');
    if (allCheckbox) {
        allCheckbox.checked = false;
        allCheckbox.indeterminate = false;
    }
    
    const batchActions = document.querySelector('.batch-actions');
    if (batchActions) {
        batchActions.classList.remove('show');
    }
}

// 获取选中的行数据
function getSelectedRows() {
    const selectedRows = [];
    document.querySelectorAll('.checkbox-row:checked').forEach(checkbox => {
        const row = checkbox.closest('tr');
        const cells = row.querySelectorAll('td');
        const rowData = {};
        
        cells.forEach((cell, index) => {
            if (index > 0) { // 跳过勾选框列
                rowData[`col${index}`] = cell.textContent.trim();
            }
        });
        
        selectedRows.push(rowData);
    });
    
    return selectedRows;
}

/**
 * 检查登录状态（不强制跳转登录页）。
 * @returns {boolean}
 */
function checkLoginStatus() {
    return true;
}

/**
 * 获取当前登录用户信息
 * @returns {Object|null} 用户信息
 */
function getCurrentUser() {
    const userStr = sessionStorage.getItem('currentUser');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            return null;
        }
    }
    return null;
}

/**
 * 退出登录
 */
function logout() {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('showWarehouseSelector');
    window.location.href = (window.wmsPath || { page: function (f) { return f; } }).page('login.html');
}

/**
 * 登录后自动显示仓库选择器
 */
function showWarehouseSelectorAfterLogin() {
    const shouldShow = sessionStorage.getItem('showWarehouseSelector');
    if (shouldShow === 'true') {
        sessionStorage.removeItem('showWarehouseSelector');
        
        // 延迟显示，确保页面加载完成
        setTimeout(() => {
            const warehouseSelectModal = document.getElementById('warehouseSelectModal');
            const warehouseList = document.getElementById('warehouseList');
            
            if (warehouseSelectModal && warehouseList) {
                // 渲染仓库列表
                warehouseList.innerHTML = WMSConfig.warehouses.map(wh => `
                    <div class="warehouse-item" data-code="${wh.code}" data-name="${wh.name}">
                        <span class="warehouse-item-code">${wh.code}</span>
                        <span class="warehouse-item-name">${wh.name}</span>
                    </div>
                `).join('');
                
                // 绑定点击事件
                warehouseList.querySelectorAll('.warehouse-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const code = item.dataset.code;
                        const name = item.dataset.name;
                        const warehouseSelectBtn = document.getElementById('warehouseSelectBtn');
                        
                        if (warehouseSelectBtn) {
                            setWarehouseButton({ code, name });
                        }
                        warehouseSelectModal.style.display = 'none';
                        
                        // 更新选中状态
                        warehouseList.querySelectorAll('.warehouse-item').forEach(i => {
                            i.classList.remove('selected');
                        });
                        item.classList.add('selected');
                        
                        // 保存选中的仓库
                        saveSelectedWarehouse({ code, name });
                        
                        // 触发仓库变更事件
                        document.dispatchEvent(new CustomEvent('warehouseChange', {
                            detail: { code, name }
                        }));
                        
                        showToast(`已切换到 ${name}`, 'success');
                    });
                });
                
                warehouseSelectModal.style.display = 'block';
            }
        }, 300);
    }
}

/**
 * 更新页面上的用户名显示
 */
function updateUserDisplay() {
    // 暂时固定显示"用户名"，后续可扩展
}

/**
 * 初始化用户菜单
 */
function initUserMenu() {
    const userMenu = document.getElementById('userMenu');
    const userMenuTrigger = document.getElementById('userMenuTrigger');
    
    if (!userMenu || !userMenuTrigger) return;
    
    // 移除可能存在的旧事件监听器
    const newTrigger = userMenuTrigger.cloneNode(true);
    userMenuTrigger.parentNode.replaceChild(newTrigger, userMenuTrigger);
    
    // 绑定新的事件监听器
    newTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        userMenu.classList.toggle('open');
    });
    
    // 点击外部关闭菜单（这个事件监听器绑定到document，需要特殊处理）
    // 先移除可能存在的旧监听器
    if (window.userMenuClickHandler) {
        document.removeEventListener('click', window.userMenuClickHandler);
    }
    
    // 创建新的监听器并保存引用
    window.userMenuClickHandler = (e) => {
        if (!userMenu.contains(e.target)) {
            userMenu.classList.remove('open');
        }
    };
    document.addEventListener('click', window.userMenuClickHandler);
    
    // ESC键关闭菜单
    if (window.userMenuKeyHandler) {
        document.removeEventListener('keydown', window.userMenuKeyHandler);
    }
    
    window.userMenuKeyHandler = (e) => {
        if (e.key === 'Escape') {
            userMenu.classList.remove('open');
        }
    };
    document.addEventListener('keydown', window.userMenuKeyHandler);
}

/**
 * 自动注入共享HTML组件（仓库选择模态框、Toast容器）
 */
function injectSharedComponents() {
    // 注入仓库选择模态框（如果页面上不存在）
    if (!document.getElementById('warehouseSelectModal')) {
        const warehouseModalHtml = `
            <div id="warehouseSelectModal" class="warehouse-select-modal">
                <div class="warehouse-select-modal-content">
                    <div class="warehouse-select-modal-title">选择仓库</div>
                    <div class="warehouse-list" id="warehouseList"></div>
                    <div class="warehouse-select-modal-footer">
                        <button type="button" class="btn btn-secondary" id="warehouseSelectCancelBtn">取消</button>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', warehouseModalHtml);
    }
    // 注入 Toast 容器（如果页面上不存在）
    if (!document.getElementById('toast')) {
        document.body.insertAdjacentHTML('beforeend', '<div class="toast" id="toast"></div>');
    }
}

// 页面初始化
function initPage() {
    // 检查登录状态
    if (!checkLoginStatus()) {
        return;
    }
    
    // 自动注入共享HTML组件
    injectSharedComponents();
    
    // 加载 header 组件
    loadHeader();
    
    // 初始化侧边栏功能（侧边栏HTML已经由 wms-sidebar.js 创建）
    initSidebar();
    
    // 初始化其他功能
    initClearButtons();
    initWarehouseSelector();
    initUserMenu();
    updateUserDisplay();
    
    // 登录后显示仓库选择器
    showWarehouseSelectorAfterLogin();
}

// 确保初始化函数在DOM加载完成后执行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
} else {
    // DOM已经加载完成，直接执行
    initPage();
}

/**
 * 更新日志全站入口：固定在桌面端侧边栏底部，changelog.json 有新提交时显示红点。
 * shop-h5 / user-app 手机端原型不加载 common.js，天然不受影响；这里再做一层路径防御。
 */
(function () {
    if (/\/(shop-h5|user-app|store-app)\//i.test(window.location.pathname)) return;

    function assetHref(p) {
        return (window.wmsPath && window.wmsPath.asset) ? window.wmsPath.asset(p) : p;
    }

    var NEW_BADGE_DAYS = 7;

    /** 最近 N 天有改动的页面，在侧边栏对应链接后挂「新」角标 */
    function badgeRecentPages(data) {
        if (!data.days || !data.days.length) return;
        var cutoff = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' })
            .format(new Date(Date.now() - (NEW_BADGE_DAYS - 1) * 86400000));
        // 站点根路径（本地 / 与 GitHub Pages /LFerp/ 都适配）
        var base = new URL(assetHref('changelog.json'), window.location.href).pathname
            .replace(/changelog\.json$/, '');
        var recent = {};
        var any = false;
        data.days.forEach(function (day) {
            if (day.date < cutoff) return;
            day.items.forEach(function (it) {
                (it.pages || []).forEach(function (p) {
                    recent[base + p.file] = true;
                    any = true;
                });
            });
        });
        if (!any) return;

        function apply() {
            var container = document.getElementById('sidebar-container');
            if (!container) return true; // 本页没有侧边栏
            var links = container.querySelectorAll('a[href]');
            if (!links.length) return false; // 侧边栏还没渲染完
            Array.prototype.forEach.call(links, function (a) {
                var href = a.getAttribute('href');
                if (!href || href.charAt(0) === '#') return;
                if (a.querySelector('.lf-new-badge')) return;
                var path;
                try { path = new URL(href, window.location.href).pathname; } catch (e) { return; }
                if (!recent[path]) return;
                var badge = document.createElement('span');
                badge.className = 'lf-new-badge';
                badge.textContent = '新';
                a.appendChild(badge);
            });
            return true;
        }

        if (apply()) return;
        var mo = new MutationObserver(function () {
            if (apply()) mo.disconnect();
        });
        mo.observe(document.getElementById('sidebar-container'), { childList: true, subtree: true });
        setTimeout(function () { mo.disconnect(); }, 10000);
    }

    function initChangelogEntry() {
        if (document.getElementById('changelog-entry')) return;

        var style = document.createElement('style');
        style.textContent = [
            '#changelog-entry {',
            '    position: relative; z-index: 1; flex-shrink: 0;',
            '    display: flex; align-items: center; gap: 6px;',
            '    min-height: 40px; margin: 0 8px 10px; padding: 10px 14px;',
            '    background: rgba(255,255,255,0.08); color: #fff; text-decoration: none;',
            '    font-size: 14px; border-radius: 5px;',
            '    transition: background-color 0.2s ease;',
            '}',
            '#changelog-entry:hover { background: rgba(255,255,255,0.14); }',
            '.sidebar.collapsed #changelog-entry {',
            '    justify-content: center; gap: 0; margin: 0 6px 10px; padding: 10px 0;',
            '}',
            '.sidebar.collapsed #changelog-entry .changelog-entry-label { display: none; }',
            '#changelog-entry .changelog-entry-dot {',
            '    position: absolute; top: 4px; right: 6px;',
            '    width: 8px; height: 8px; border-radius: 50%;',
            '    background: #f5222d; border: 1px solid #fff;',
            '}',
            '.lf-new-badge {',
            '    display: inline-block; margin-left: 6px; vertical-align: middle;',
            '    font-size: 10px; line-height: 14px; color: #fff; background: #f5222d;',
            '    border-radius: 7px; padding: 0 5px; font-weight: normal;',
            '}'
        ].join('\n');
        document.head.appendChild(style);

        var link = document.createElement('a');
        link.id = 'changelog-entry';
        link.href = assetHref('changelog.html');
        link.title = '查看最近更新';
        link.innerHTML = '<span aria-hidden="true">📋</span><span class="changelog-entry-label">更新日志</span><span class="changelog-entry-dot" hidden></span>';

        function mountEntry() {
            var sidebar = document.querySelector('#sidebar-container .sidebar');
            if (!sidebar) return false;
            sidebar.appendChild(link);
            return true;
        }

        if (!mountEntry()) {
            var sidebarContainer = document.getElementById('sidebar-container');
            if (!sidebarContainer) return;
            var observer = new MutationObserver(function () {
                if (mountEntry()) observer.disconnect();
            });
            observer.observe(sidebarContainer, { childList: true, subtree: true });
            setTimeout(function () { observer.disconnect(); }, 10000);
        }

        fetch(assetHref('changelog.json'), { cache: 'no-cache' })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (data) {
                if (!data || !data.latestSha) return;
                var seen = null;
                try { seen = localStorage.getItem('lfChangelogSeenSha'); } catch (e) { /* 隐私模式忽略 */ }
                if (seen !== data.latestSha) {
                    link.querySelector('.changelog-entry-dot').hidden = false;
                }
                badgeRecentPages(data);
            })
            .catch(function () { /* file:// 或数据未生成时静默 */ });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChangelogEntry);
    } else {
        initChangelogEntry();
    }
})();

/* 后台列表序号（仓储/采购/物流除外）：按侧栏自动启停 */
(function () {
    function assetUrl(rel) {
        var wp = window.wmsPath;
        if (wp && typeof wp.asset === 'function') return wp.asset(rel);
        var p = String(window.location && window.location.pathname || '').replace(/\\/g, '/');
        if (/\/(MDM|SCM|CRM)(\/|$)/i.test(p)) return '../' + rel;
        return rel;
    }
    function loadRowNo() {
        if (window.LfTableRowNo || document.getElementById('lf-table-row-no-js')) return;
        var s = document.createElement('script');
        s.id = 'lf-table-row-no-js';
        s.src = assetUrl('js/lf-table-row-no.js') + '?v=20260819-desc';
        s.async = false;
        (document.body || document.head).appendChild(s);
    }
    function loadFabDock() {
        if (window.LfFileCenterNotify || document.getElementById('lf-fab-dock-js')) return;
        if (/\/(shop-h5|user-app|store-app)\//i.test(window.location.pathname || '')) return;
        var s = document.createElement('script');
        s.id = 'lf-fab-dock-js';
        s.src = assetUrl('js/lf-fab-dock.js') + '?v=20260816-fab1';
        s.async = false;
        (document.body || document.head).appendChild(s);
    }
    function loadPrdFloat() {
        if (document.getElementById('pg-prd-float-js')) return;
        if (/\/(shop-h5|user-app|store-app)\//i.test(window.location.pathname || '')) return;
        var s = document.createElement('script');
        s.id = 'pg-prd-float-js';
        s.src = assetUrl('js/pg-prd-float.js') + '?v=20260820-prd3';
        s.async = true;
        s.onerror = function () {};
        (document.body || document.head).appendChild(s);
    }
    function boot() {
        loadRowNo();
        loadFabDock();
        loadPrdFloat();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
