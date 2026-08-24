/* 售后专用侧栏：售后管理 / 举报与意见反馈 */
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

  function pageBase(name) {
    return String(name || '')
      .split('?')[0]
      .split('#')[0]
      .replace(/\.html$/i, '')
      .split('/')
      .pop() || '';
  }

  var currentPage = pageBase(window.location.pathname.split('/').pop()) || 'mdm_aftersale_ticket';

  var manageGroup = {
    title: '售后管理',
    icon: '任务管理',
    items: [
      { href: 'mdm_aftersale_ticket.html', text: '售后单' },
      { href: 'mdm_aftersale_refund.html', text: '退款单' }
    ]
  };

  var feedbackGroup = {
    title: '举报与意见反馈',
    icon: '任务管理',
    items: [
      { href: 'mdm_aftersale_report.html', text: '举报管理' },
      { href: 'mdm_aftersale_feedback.html', text: '意见反馈' }
    ]
  };

  function pageMatches(href) {
    return currentPage === pageBase(href);
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

  function renderGroup(group) {
    var expanded = true;
    return (
      '<li class="menu-item aftersale-side-group">' +
      '<a href="#" class="menu-link aftersale-side-group__head" onclick="toggleSubmenu(this); return false;">' +
      '<img src="' +
      assetHref('image/' + group.icon + '.svg') +
      '" alt="" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
      '<span class="aftersale-side-group__title">' +
      group.title +
      '</span>' +
      '<button type="button" class="menu-toggle" aria-label="展开">' +
      (expanded ? '▼' : '▶') +
      '</button>' +
      '</a>' +
      '<ul class="submenu aftersale-side-submenu' +
      (expanded ? ' expanded' : '') +
      '">' +
      renderSubmenuItems(group.items) +
      '</ul></li>'
    );
  }

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
    renderGroup(manageGroup) +
    renderGroup(feedbackGroup) +
    '</ul></aside>';

  var PAGE_TABS = [
    { href: 'mdm_aftersale_ticket.html', text: '售后单' },
    { href: 'mdm_aftersale_refund.html', text: '退款单' },
    { href: 'mdm_aftersale_report.html', text: '举报管理' },
    { href: 'mdm_aftersale_feedback.html', text: '意见反馈' }
  ];

  function mountPageTabs() {
    var host = document.getElementById('aftersalePageTabs');
    if (!host) return;
    var home =
      '<a href="../index.html" class="aftersale-page-tabs__item">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 10.5L12 4l8 6.5V19a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-8.5z"/></svg>' +
      '首页</a>';
    var items = PAGE_TABS.map(function (item) {
      var active = pageMatches(item.href);
      var close = '<button type="button" class="aftersale-page-tabs__close" aria-label="关闭">×</button>';
      if (active) {
        return '<span class="aftersale-page-tabs__item aftersale-page-tabs__item--active">' + item.text + close + '</span>';
      }
      return (
        '<a href="' +
        pageHref(item.href) +
        '" class="aftersale-page-tabs__item">' +
        item.text +
        close +
        '</a>'
      );
    }).join('');
    host.innerHTML = home + items;
  }

  function bootTabs() {
    mountPageTabs();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootTabs);
  } else {
    bootTabs();
  }
})();
