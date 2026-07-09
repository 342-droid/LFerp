/* 商品专用侧栏：选品库 / 商品类目 / 商品品牌 / 商城商品 / 代采商品 */
(function () {
  var wp = window.wmsPath || { page: function (f) { return f; }, asset: function (r) { return r; } };
  var pageHref = function (f) { return wp.page(f); };
  var assetHref = function (r) { return wp.asset(r); };
  var currentPage = window.location.pathname.split('/').pop() || 'mdm_product_selection.html';

  var flatItems = [
    { href: 'mdm_product_selection.html', text: '选品库', alsoActive: ['mdm_product_audit.html'] },
    { href: 'mdm_product_category.html', text: '商品类目' },
    { href: 'mdm_product_brand.html', text: '商品品牌' }
  ];

  var sideGroups = [
    {
      title: '商城商品',
      items: [{ href: 'mdm_product_mall.html', text: '商城商品' }]
    },
    {
      title: '代采商品',
      items: [
        { href: 'mdm_product_proxy_list.html', text: '商品列表' },
        { href: 'mdm_product_proxy_category.html', text: '类目管理' },
        { href: 'mdm_product_proxy_tag.html', text: '标签管理' }
      ]
    }
  ];

  function pageMatches(href) {
    return currentPage === String(href || '');
  }

  function itemActive(item) {
    if (pageMatches(item.href)) return true;
    if (item.alsoActive && item.alsoActive.some(pageMatches)) return true;
    return false;
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
          '<li><a href="' + pageHref(item.href) + '"' + (active ? ' class="active"' : '') + '>' + item.text + '</a></li>'
        );
      })
      .join('');
  }

  function renderSideGroup(group) {
    var expanded = isGroupActive(group);
    return (
      '<li class="product-side-group">' +
      '<a href="#" class="product-side-group__head" onclick="toggleSubmenu(this); return false;">' +
      '<span>' + group.title + '</span>' +
      '<button type="button" class="menu-toggle" aria-label="展开">' + (expanded ? '▼' : '▶') + '</button>' +
      '</a>' +
      '<ul class="submenu product-side-submenu' + (expanded ? ' expanded' : '') + '">' +
      renderSubmenuItems(group.items) +
      '</ul></li>'
    );
  }

  var flatHtml = flatItems
    .map(function (item) {
      var active = itemActive(item);
      return (
        '<li class="product-side-item' + (active ? ' product-side-item--active' : '') + '">' +
        '<a href="' + pageHref(item.href) + '">' + item.text + '</a></li>'
      );
    })
    .join('');

  var groupsHtml = sideGroups.map(renderSideGroup).join('');

  var sidebarContainer = document.getElementById('sidebar-container');
  if (!sidebarContainer) return;

  sidebarContainer.innerHTML =
    '<aside class="sidebar product-sidebar" id="sidebar">' +
    '<div class="sidebar-header">' +
    '<img src="' + assetHref('image/冷丰图标.png') + '" alt="冷丰商品">' +
    '<span>冷丰商品</span>' +
    '</div>' +
    '<ul class="product-sidebar-menu">' +
    flatHtml +
    groupsHtml +
    '</ul></aside>';
})();
