/* 售后专用侧栏：售后管理 — 售后单 / 退款单 */
(function () {
  var wp = window.wmsPath || {
    page: function (f) {
      return f;
    },
    asset: function (r) {
      return r;
    }
  };
  var pageHref = function (f) {
    return wp.page(f);
  };
  var assetHref = function (r) {
    return wp.asset(r);
  };
  var currentPage = window.location.pathname.split('/').pop() || 'mdm_aftersale_ticket.html';

  var manageGroup = {
    title: '售后管理',
    items: [
      { href: 'mdm_aftersale_ticket.html', text: '售后单' },
      { href: 'mdm_aftersale_refund.html', text: '退款单' }
    ]
  };

  function pageMatches(href) {
    return currentPage === String(href || '');
  }

  function isGroupActive(group) {
    return group.items.some(function (item) {
      return pageMatches(item.href);
    });
  }

  function renderSubmenuItems(items) {
    return items
      .map(function (item) {
        var active = pageMatches(item.href);
        return (
          '<li><a href="' +
          pageHref(item.href) +
          '"' +
          (active ? ' class="active"' : '') +
          '>' +
          item.text +
          '</a></li>'
        );
      })
      .join('');
  }

  var isManageSection = isGroupActive(manageGroup);
  var sidebarContainer = document.getElementById('sidebar-container');
  if (!sidebarContainer) return;

  sidebarContainer.innerHTML =
    '<aside class="sidebar aftersale-sidebar" id="sidebar">' +
    '<div class="sidebar-header">' +
    '<img src="' +
    assetHref('image/冷丰图标.png') +
    '" alt="冷丰售后">' +
    '<span>冷丰售后</span>' +
    '</div>' +
    '<ul class="sidebar-menu aftersale-sidebar-menu">' +
    '<li class="menu-item aftersale-side-group">' +
    '<a href="#" class="menu-link aftersale-side-group__head" onclick="toggleSubmenu(this); return false;">' +
    '<img src="' +
    assetHref('image/任务管理.svg') +
    '" alt="" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
    '<span class="aftersale-side-group__title">售后管理</span>' +
    '<button type="button" class="menu-toggle" aria-label="展开">' +
    (isManageSection ? '▼' : '▶') +
    '</button>' +
    '</a>' +
    '<ul class="submenu aftersale-side-submenu' +
    (isManageSection ? ' expanded' : '') +
    '">' +
    renderSubmenuItems(manageGroup.items) +
    '</ul></li>' +
    '</ul></aside>';
})();
