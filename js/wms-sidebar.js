/* WMS 侧边栏组件加载脚本（wms-sidebar.js） */
(function() {
    const wp = window.wmsPath || { page: function (f) { return f; }, asset: function (r) { return r; } };
    const pageHref = function (f) { return wp.page(f); };
    const assetHref = function (r) { return wp.asset(r); };
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // 基础信息菜单项
    const basicMenuItems = [
        { href: 'warehouse.html', text: '仓库' },
        { href: 'company.html', text: '货主' },
        { href: 'room.html', text: '仓间' },
        { href: 'zone.html', text: '库区' },
        { href: 'area.html', text: '作业区域' },
        { href: 'location.html', text: '储位' },
        { href: 'lpn.html', text: '容器' },
        { href: 'warehouse_sku.html', text: '商品' },
        { href: 'carrier.html', text: '承运商' },
        { href: 'delivery_hub.html', text: '站点' }
    ];
    
    // 权限管理菜单项
    const permissionMenuItems = [
        { href: 'profile.html', text: '作业档案' },
        { href: 'user_profile.html', text: '用户-作业档案' },
        { href: 'user_company.html', text: '用户-货主' }
    ];
    
    // 策略管理菜单项
    const strategyMenuItems = [
        { href: 'warehouse_company.html', text: '仓库-货主' },
        { href: 'ibd_strategy.html', text: '入库策略' },
        { href: 'wave_flow.html', text: '波次流程' },
        { href: 'wave_template.html', text: '波次模板' },
        { href: 'allocation_strategy.html', text: '分配策略' },
        { href: 'turn_strategy.html', text: '周转策略' },
        { href: 'task_engine.html', text: '任务引擎' },
        { href: 'inventory_rule.html', text: '库存规则' }
    ];
    
    // 库存管理菜单项
    const inventoryMenuItems = [
        { href: 'inventory.html', text: '库存查询' },
        { href: 'inventory-log.html', text: '库存日志' }
    ];
    
    // 任务管理菜单项
    const taskMenuItems = [
        { href: 'task_group.html', text: '任务组' },
        { href: 'task.html', text: '任务' }
    ];
    
    // 入库管理菜单项
    const inboundMenuItems = [
        { href: 'ibd_receipt.html', text: '入库单' }
    ];
    
    // 出库管理菜单项
    const outboundMenuItems = [
        { href: 'obd_outbound.html', text: '出库单' },
        { href: 'obd_wave.html', text: '波次管理' },
        { href: 'obd_sorting.html', text: '分拣单' },
        { href: 'obd_carton.html', text: '包裹管理' },
        { href: 'obd_distribution.html', text: '发货管理' }
    ];

    // 库内管理菜单项
    const innerWarehouseInventoryMenuItems = [
        { href: 'inventory_plan.html', text: '盘点计划' },
        { href: 'inventory_sheet.html', text: '盘点单' }
    ];
    
    // 异常管理菜单项
    const exceptionMenuItems = [
        { href: 'obd_outbound_exception.html', text: '出库异常' }
    ];

    // 判断当前页面属于哪个菜单
    const isBasicPage = basicMenuItems.some(item => item.href === currentPage);
    const isPermissionPage = permissionMenuItems.some(item => item.href === currentPage);
    const isStrategyPage = strategyMenuItems.some(item => item.href === currentPage);
    const isInventoryPage = inventoryMenuItems.some(item => item.href === currentPage);
    const isTaskPage = taskMenuItems.some(item => item.href === currentPage);
    const isInboundPage = inboundMenuItems.some(item => item.href === currentPage);
    const isOutboundPage = outboundMenuItems.some(item => item.href === currentPage);
    const isInnerWarehouseInventoryPage = innerWarehouseInventoryMenuItems.some(item => item.href === currentPage);
    const isInventoryAdjustPage = currentPage === 'inventory_adjustment.html';
    const isInnerWarehousePage = isInnerWarehouseInventoryPage || isInventoryAdjustPage;
    const isExceptionPage = exceptionMenuItems.some(item => item.href === currentPage);

    const basicMenuHtml = basicMenuItems.map(item => 
        '<li><a href="' + pageHref(item.href) + '"' + (item.href === currentPage ? ' class="active"' : '') + '>' + item.text + '</a></li>'
    ).join('');
    
    const permissionMenuHtml = permissionMenuItems.map(item => 
        '<li><a href="' + pageHref(item.href) + '"' + (item.href === currentPage ? ' class="active"' : '') + '>' + item.text + '</a></li>'
    ).join('');
    
    const strategyMenuHtml = strategyMenuItems.map(item => 
        '<li><a href="' + pageHref(item.href) + '"' + (item.href === currentPage ? ' class="active"' : '') + '>' + item.text + '</a></li>'
    ).join('');
    
    const inventoryMenuHtml = inventoryMenuItems.map(item => 
        '<li><a href="' + pageHref(item.href) + '"' + (item.href === currentPage ? ' class="active"' : '') + '>' + item.text + '</a></li>'
    ).join('');
    
    const inboundMenuHtml = inboundMenuItems.map(item => 
        '<li><a href="' + pageHref(item.href) + '"' + (item.href === currentPage ? ' class="active"' : '') + '>' + item.text + '</a></li>'
    ).join('');
    
    const outboundMenuHtml = outboundMenuItems.map(item => 
        '<li><a href="' + pageHref(item.href) + '"' + (item.href === currentPage ? ' class="active"' : '') + '>' + item.text + '</a></li>'
    ).join('');

    const innerWarehouseInventoryMenuHtml = innerWarehouseInventoryMenuItems.map(item =>
        '<li><a href="' + pageHref(item.href) + '"' + (item.href === currentPage ? ' class="active"' : '') + '>' + item.text + '</a></li>'
    ).join('');
    
    const exceptionMenuHtml = exceptionMenuItems.map(item =>
        '<li><a href="' + pageHref(item.href) + '"' + (item.href === currentPage ? ' class="active"' : '') + '>' + item.text + '</a></li>'
    ).join('');

    const taskMenuHtml = taskMenuItems.map(item =>
        '<li><a href="' + pageHref(item.href) + '"' + (item.href === currentPage ? ' class="active"' : '') + '>' + item.text + '</a></li>'
    ).join('');
    
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
        sidebarContainer.innerHTML = 
            '<aside class="sidebar" id="sidebar">' +
            '<div class="sidebar-header">' +
            '<img src="' + assetHref('image/冷丰图标.png') + '" alt="冷丰WMS">' +
            '<span>冷丰WMS</span>' +
            '</div>' +
            '<div class="warehouse-selector">' +
            '<button id="warehouseSelectBtn">请选择仓库</button>' +
            '</div>' +
            '<ul class="sidebar-menu">' +
            '<li class="menu-item">' +
            '<a href="#" class="menu-link" onclick="toggleSubmenu(this)">' +
            '<img src="' + assetHref('image/基础信息.svg') + '" alt="基础信息" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
            '<span>基础信息</span>' +
            '<button class="menu-toggle">▼</button>' +
            '</a>' +
            '<ul class="submenu' + (isBasicPage ? ' expanded' : '') + '">' + basicMenuHtml + '</ul>' +
            '</li>' +
            '<li class="menu-item">' +
            '<a href="#" class="menu-link" onclick="toggleSubmenu(this)">' +
            '<img src="' + assetHref('image/权限管理.svg') + '" alt="权限管理" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
            '<span>权限管理</span>' +
            '<button class="menu-toggle">▼</button>' +
            '</a>' +
            '<ul class="submenu' + (isPermissionPage ? ' expanded' : '') + '">' + permissionMenuHtml + '</ul>' +
            '</li>' +
            '<li class="menu-item">' +
            '<a href="#" class="menu-link" onclick="toggleSubmenu(this)">' +
            '<img src="' + assetHref('image/策略管理.svg') + '" alt="策略管理" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
            '<span>策略管理</span>' +
            '<button class="menu-toggle">▼</button>' +
            '</a>' +
            '<ul class="submenu' + (isStrategyPage ? ' expanded' : '') + '">' + strategyMenuHtml + '</ul>' +
            '</li>' +
            '<li class="menu-item">' +
            '<a href="#" class="menu-link" onclick="toggleSubmenu(this)">' +
            '<img src="' + assetHref('image/任务管理.svg') + '" alt="任务管理" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
            '<span>任务管理</span>' +
            '<button class="menu-toggle">▼</button>' +
            '</a>' +
            '<ul class="submenu' + (isTaskPage ? ' expanded' : '') + '">' + taskMenuHtml + '</ul>' +
            '</li>' +
            '<li class="menu-item">' +
            '<a href="#" class="menu-link" onclick="toggleSubmenu(this)">' +
            '<img src="' + assetHref('image/入库管理.svg') + '" alt="入库管理" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
            '<span>入库管理</span>' +
            '<button class="menu-toggle">▼</button>' +
            '</a>' +
            '<ul class="submenu' + (isInboundPage ? ' expanded' : '') + '">' + inboundMenuHtml + '</ul>' +
            '</li>' +
            '<li class="menu-item">' +
            '<a href="#" class="menu-link" onclick="toggleSubmenu(this)">' +
            '<img src="' + assetHref('image/出库管理.svg') + '" alt="出库管理" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
            '<span>出库管理</span>' +
            '<button class="menu-toggle">▼</button>' +
            '</a>' +
            '<ul class="submenu' + (isOutboundPage ? ' expanded' : '') + '">' + outboundMenuHtml + '</ul>' +
            '</li>' +
            '<li class="menu-item">' +
            '<a href="#" class="menu-link" onclick="toggleSubmenu(this)">' +
            '<img src="' + assetHref('image/库存管理.svg') + '" alt="库内管理" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
            '<span>库内管理</span>' +
            '<button class="menu-toggle">▼</button>' +
            '</a>' +
            '<ul class="submenu' + (isInnerWarehousePage ? ' expanded' : '') + '">' +
            '<li>' +
            '<a href="#" class="menu-link" onclick="toggleSubmenu(this)">' +
            '<span>盘点管理</span>' +
            '<button class="menu-toggle">▼</button>' +
            '</a>' +
            '<ul class="submenu' + (isInnerWarehouseInventoryPage ? ' expanded' : '') + '">' + innerWarehouseInventoryMenuHtml + '</ul>' +
            '</li>' +
            '<li><a href="' + pageHref('inventory_adjustment.html') + '"' + (isInventoryAdjustPage ? ' class="active"' : '') + '>库存调整单</a></li>' +
            '</ul>' +
            '</li>' +
            '<li class="menu-item">' +
            '<a href="#" class="menu-link" onclick="toggleSubmenu(this)">' +
            '<img src="' + assetHref('image/库存管理.svg') + '" alt="库存管理" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
            '<span>库存管理</span>' +
            '<button class="menu-toggle">▼</button>' +
            '</a>' +
            '<ul class="submenu' + (isInventoryPage ? ' expanded' : '') + '">' + inventoryMenuHtml + '</ul>' +
            '</li>' +
            '<li class="menu-item">' +
            '<a href="#" class="menu-link" onclick="toggleSubmenu(this)">' +
            '<img src="' + assetHref('image/任务管理.svg') + '" alt="异常管理" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
            '<span>异常管理</span>' +
            '<button class="menu-toggle">▼</button>' +
            '</a>' +
            '<ul class="submenu' + (isExceptionPage ? ' expanded' : '') + '">' + exceptionMenuHtml + '</ul>' +
            '</li>' +
            '</ul>' +
            '</aside>';
    }
})();
