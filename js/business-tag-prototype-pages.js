/** LFerp 各业务页面的标签能力接入层。 */
(function () {
  'use strict';

  var store = window.BusinessTagPrototypeStore;
  var ui = window.BusinessTagPrototypeUI;
  if (!store || !ui) return;

  function ready(callback) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', callback);
    else callback();
  }

  function pageName() {
    return (window.location.pathname.split('/').pop() || '').toLowerCase();
  }

  function queryParam(name) {
    try { return new URLSearchParams(window.location.search || '').get(name) || ''; }
    catch (e) { return ''; }
  }

  function mountCapabilityPage() {
    var root = document.getElementById('businessTagCapabilityApp');
    if (!root) return;
    var groups = [
      {
        scene: 'STORE_MANAGEMENT',
        title: '门店管理',
        desc: '门店业务维护门店标签库，并为门店打标。',
        slots: [{ dimension: 'SELF', name: '门店标签', note: '门店列表、详情与筛选可用' }]
      },
      {
        scene: 'MEMBER_MANAGEMENT',
        title: '会员管理',
        desc: '复用会员360现有会员标签库及会员打标结果，并向其他业务提供只读能力。',
        slots: [{ dimension: 'SELF', name: '会员标签', note: '会员标签及跨模块只读能力可用' }]
      },
      {
        scene: 'AFTER_SALE_MANAGEMENT',
        title: '售后管理',
        desc: '售后管理自己的标签，同时可选择读取下单用户会员标签。',
        slots: [
          { dimension: 'SELF', name: '售后单标签', note: '售后可管理、筛选和批量设置' },
          { dimension: 'ORDER_MEMBER', name: '下单用户会员标签', note: '依赖会员标签能力；按下单会员只读带入' }
        ]
      }
    ];
    root.innerHTML = groups.map(function (group) {
      return '<section class="bt-capability-card" data-business-tag-scene="' + group.scene + '">' +
        '<div class="bt-capability-card__intro"><div class="bt-capability-card__icon" aria-hidden="true">' +
          (group.scene === 'STORE_MANAGEMENT' ? '店' : group.scene === 'MEMBER_MANAGEMENT' ? '会' : '售') +
          '</div><div><h3>' + ui.escapeHtml(group.title) + '</h3><p>' + ui.escapeHtml(group.desc) + '</p></div></div>' +
        '<div class="bt-capability-card__slots">' + group.slots.map(function (slot) {
          var key = group.scene + ':' + slot.dimension;
          return '<div class="bt-capability-slot"><div><strong>' + ui.escapeHtml(slot.name) + '</strong><p>' +
            ui.escapeHtml(slot.note) + '</p></div><label class="bt-switch"><input type="checkbox" role="switch" ' +
            'data-business-tag-capability="' + key + '"' +
            (store.isEnabled(group.scene, slot.dimension) ? ' checked' : '') + '><span aria-hidden="true"></span>' +
            '<em>已开通</em></label></div>';
        }).join('') + '</div></section>';
    }).join('');

    root.querySelectorAll('[data-business-tag-capability]').forEach(function (input) {
      function syncText() {
        var text = input.closest('.bt-switch').querySelector('em');
        if (text) text.textContent = input.checked ? '已开通' : '未开通';
      }
      syncText();
      input.addEventListener('change', function () {
        store.setCapability(input.getAttribute('data-business-tag-capability'), input.checked);
        syncText();
        ui.notify(input.checked ? '标签能力已开通' : '标签能力已关闭');
      });
    });
  }

  function addHeaderAfterText(row, anchorText, key, text) {
    if (!row || row.querySelector('[data-bt-header="' + key + '"]')) return;
    var anchor = Array.prototype.find.call(row.children, function (cell) {
      return cell.textContent.trim() === anchorText;
    });
    var th = document.createElement('th');
    th.textContent = text;
    th.setAttribute('data-bt-header', key);
    row.insertBefore(th, anchor && anchor.nextSibling ? anchor.nextSibling : row.lastElementChild || null);
  }

  function mountAfterSaleList() {
    var tbody = document.getElementById('asTicketTableBody');
    if (!tbody) return;
    var saleEnabled = store.isEnabled('AFTER_SALE_MANAGEMENT', 'SELF');
    var memberEnabled = store.isEnabled('MEMBER_MANAGEMENT', 'SELF') &&
      store.isEnabled('AFTER_SALE_MANAGEMENT', 'ORDER_MEMBER');
    var grid = document.getElementById('asTicketFilterGrid');
    var toolbar = document.querySelector('.aftersale-table-toolbar');
    var headerRow = document.querySelector('#asTicketTable thead tr');
    var saleFilter = null;
    var memberFilter = null;

    if (saleEnabled && grid) {
      saleFilter = document.createElement('div');
      saleFilter.id = 'asAfterSaleTagFilter';
      saleFilter.className = 'aftersale-filter-field bt-filter-host';
      grid.appendChild(saleFilter);
      ui.mountFilter(saleFilter, 'AFTER_SALE', '售后单标签');
    }
    if (memberEnabled && grid) {
      memberFilter = document.createElement('div');
      memberFilter.id = 'asMemberTagFilter';
      memberFilter.className = 'aftersale-filter-field bt-filter-host';
      grid.appendChild(memberFilter);
      ui.mountFilter(memberFilter, 'MEMBER', '下单用户会员标签');
    }

    if (saleEnabled && toolbar) {
      var manage = document.createElement('button');
      manage.type = 'button';
      manage.className = 'aftersale-table-toolbar__btn bt-toolbar-primary';
      manage.id = 'asTicketTagManage';
      manage.textContent = '标签管理';
      toolbar.insertBefore(manage, toolbar.firstChild);
      var batch = document.createElement('button');
      batch.type = 'button';
      batch.className = 'aftersale-table-toolbar__btn';
      batch.id = 'asTicketTagBatch';
      batch.textContent = '批量设置标签';
      toolbar.insertBefore(batch, manage.nextSibling);
      manage.addEventListener('click', function () {
        ui.openManager('AFTER_SALE', '售后单标签库');
      });
      batch.addEventListener('click', function () {
        var ids = Array.prototype.map.call(tbody.querySelectorAll('.bt-row-select:checked'), function (input) {
          return input.closest('tr').getAttribute('data-id');
        }).filter(Boolean);
        if (!ids.length) {
          ui.notify('请先选择售后单', 'error');
          return;
        }
        ui.openBinding('AFTER_SALE', ids, '批量设置售后单标签');
      });
    }

    if (headerRow) {
      if (saleEnabled && !headerRow.querySelector('[data-bt-header="select"]')) {
        var selectTh = document.createElement('th');
        selectTh.setAttribute('data-bt-header', 'select');
        selectTh.className = 'bt-select-col';
        selectTh.innerHTML = '<input type="checkbox" aria-label="全选售后单" data-bt-select-all>';
        headerRow.insertBefore(selectTh, headerRow.firstElementChild);
      }
      if (saleEnabled) addHeaderAfterText(headerRow, '售后状态', 'after-sale', '售后单标签');
      if (memberEnabled) addHeaderAfterText(headerRow, '售后单标签', 'order-member', '下单用户会员标签');
    }

    function memberIdFor(row, index) {
      var link = row.querySelector('.js-as-detail');
      var id = link && link.getAttribute('data-member-id');
      if (!id) id = 'U1000' + ((index % 6) + 1);
      row.setAttribute('data-member-id', id);
      if (link) link.setAttribute('data-member-id', id);
      return id;
    }

    function decorateRows() {
      tbody.querySelectorAll('tr[data-id]').forEach(function (row, index) {
        var resourceId = row.getAttribute('data-id');
        var memberId = memberIdFor(row, index);
        if (saleEnabled) {
          store.ensureDemoBinding('AFTER_SALE', resourceId, index);
          var selectCell = row.querySelector('[data-bt-cell="select"]');
          if (!selectCell) {
            selectCell = document.createElement('td');
            selectCell.setAttribute('data-bt-cell', 'select');
            selectCell.className = 'bt-select-col';
            selectCell.innerHTML = '<input type="checkbox" class="bt-row-select" aria-label="选择售后单 ' + ui.escapeHtml(resourceId) + '">';
            row.insertBefore(selectCell, row.firstElementChild);
          }
          var saleCell = row.querySelector('[data-bt-cell="after-sale"]');
          if (!saleCell) {
            saleCell = document.createElement('td');
            saleCell.setAttribute('data-bt-cell', 'after-sale');
            var saleIndex = Array.prototype.indexOf.call(
              headerRow.children,
              headerRow.querySelector('[data-bt-header="after-sale"]')
            );
            row.insertBefore(saleCell, row.children[saleIndex] || row.lastElementChild || null);
          }
          saleCell.innerHTML = ui.chipsHtml('AFTER_SALE', resourceId) +
            '<button type="button" class="bt-inline-action" data-bt-bind-sale="' + ui.escapeHtml(resourceId) + '">设置</button>';
        }
        if (memberEnabled) {
          var memberCell = row.querySelector('[data-bt-cell="order-member"]');
          if (!memberCell) {
            memberCell = document.createElement('td');
            memberCell.setAttribute('data-bt-cell', 'order-member');
            var memberIndex = Array.prototype.indexOf.call(
              headerRow.children,
              headerRow.querySelector('[data-bt-header="order-member"]')
            );
            row.insertBefore(memberCell, row.children[memberIndex] || row.lastElementChild || null);
          }
          memberCell.innerHTML = ui.chipsHtml('MEMBER', memberId, 'data-member-tag-list') +
            '<span class="bt-readonly">来自会员管理</span>';
        }
      });
    }

    function applyTagFilters() {
      var sale = ui.readFilter(saleFilter);
      var member = ui.readFilter(memberFilter);
      tbody.querySelectorAll('tr[data-id]').forEach(function (row) {
        var saleOk = !saleEnabled || store.matches('AFTER_SALE', row.getAttribute('data-id'), sale.ids, sale.mode);
        var memberOk = !memberEnabled || store.matches('MEMBER', row.getAttribute('data-member-id'), member.ids, member.mode);
        row.style.display = saleOk && memberOk ? '' : 'none';
      });
    }

    function refreshDecorations() {
      decorateRows();
      applyTagFilters();
    }

    decorateRows();
    applyTagFilters();
    var observer = new MutationObserver(function () {
      window.requestAnimationFrame(refreshDecorations);
    });
    observer.observe(tbody, { childList: true });

    var query = document.getElementById('asTicketQuery');
    var reset = document.getElementById('asTicketReset');
    if (query) query.addEventListener('click', refreshDecorations);
    if (reset) reset.addEventListener('click', function () {
      ui.resetFilter(saleFilter);
      ui.resetFilter(memberFilter);
      refreshDecorations();
    });
    ['asTicketPageSize', 'asTicketPages', 'asTicketJumpGo'].forEach(function (id) {
      var element = document.getElementById(id);
      if (element) element.addEventListener(id === 'asTicketPageSize' ? 'change' : 'click', refreshDecorations);
    });
    var all = headerRow && headerRow.querySelector('[data-bt-select-all]');
    if (all) all.addEventListener('change', function () {
      tbody.querySelectorAll('.bt-row-select').forEach(function (input) {
        if (input.closest('tr').style.display !== 'none') input.checked = all.checked;
      });
    });
    tbody.addEventListener('click', function (event) {
      var button = event.target.closest('[data-bt-bind-sale]');
      if (!button) return;
      ui.openBinding('AFTER_SALE', button.getAttribute('data-bt-bind-sale'), '设置售后单标签');
    });
    window.addEventListener('business-tags:changed', refreshDecorations);
  }

  function mountAfterSaleDetail() {
    var body = document.getElementById('asDetailBody');
    if (!body) return;
    var saleEnabled = store.isEnabled('AFTER_SALE_MANAGEMENT', 'SELF');
    var memberEnabled = store.isEnabled('MEMBER_MANAGEMENT', 'SELF') &&
      store.isEnabled('AFTER_SALE_MANAGEMENT', 'ORDER_MEMBER');
    if (!saleEnabled && !memberEnabled) return;
    var resourceId = queryParam('id') || 'AS-333524494855454720';
    var memberId = queryParam('memberId') || 'U10001';
    if (saleEnabled) store.ensureDemoBinding('AFTER_SALE', resourceId, 0);
    var observer;

    function renderCard() {
      if (observer) observer.disconnect();
      var main = body.querySelector('.aftersale-detail-main');
      if (!main) {
        if (observer) observer.observe(body, { childList: true, subtree: true });
        return;
      }
      var card = main.querySelector('[data-business-tag-card]');
      if (!card) {
        card = document.createElement('section');
        card.className = 'aftersale-detail-card bt-detail-card';
        card.setAttribute('data-business-tag-card', '');
        main.insertBefore(card, main.children[1] || null);
      }
      card.innerHTML =
        '<div class="bt-detail-card__head"><h2 class="aftersale-detail-card__title">业务标签</h2>' +
          (saleEnabled ? '<button type="button" class="aftersale-btn aftersale-btn--default" data-bt-detail-bind>管理售后单标签</button>' : '') +
        '</div>' +
        (saleEnabled ? '<div class="bt-detail-row"><span>售后单标签</span><div>' +
          ui.chipsHtml('AFTER_SALE', resourceId, 'data-business-tag-detail') + '</div></div>' : '') +
        (memberEnabled ? '<div class="bt-detail-row"><span>下单用户会员标签</span><div>' +
          ui.chipsHtml('MEMBER', memberId, 'data-member-tag-detail') +
          '<small>只读 · 来自会员管理</small></div></div>' : '');
      if (observer) observer.observe(body, { childList: true, subtree: true });
    }

    body.addEventListener('click', function (event) {
      if (!event.target.closest('[data-bt-detail-bind]')) return;
      ui.openBinding('AFTER_SALE', resourceId, '设置售后单标签');
    });
    observer = new MutationObserver(renderCard);
    renderCard();
    observer.observe(body, { childList: true, subtree: true });
    window.addEventListener('business-tags:changed', renderCard);
  }

  function mountArchiveTags(config) {
    if (!store.isEnabled(config.scene, 'SELF')) return;
    var tbody = document.getElementById('tableBody');
    var form = document.querySelector(config.formSelector || '.search-form');
    if (!tbody || !form) return;
    var actions = form.querySelector('.form-actions');
    var host = document.createElement('div');
    host.id = config.filterId;
    host.className = 'form-group bt-filter-host bt-filter-host--archive';
    form.insertBefore(host, actions || null);
    ui.mountFilter(host, config.type, config.filterLabel);

    if (actions) {
      var manage = document.createElement('button');
      manage.type = 'button';
      manage.className = 'btn btn-secondary';
      manage.textContent = config.managerLabel;
      manage.addEventListener('click', function () { ui.openManager(config.type, config.libraryTitle); });
      actions.appendChild(manage);
    }

    var headerRow = tbody.closest('table').querySelector('thead tr');
    if (headerRow && !headerRow.querySelector('[data-bt-header="archive"]')) {
      var th = document.createElement('th');
      th.textContent = config.columnLabel;
      th.setAttribute('data-bt-header', 'archive');
      th.className = 'bt-archive-col';
      headerRow.appendChild(th);
    }

    function decorateRows() {
      tbody.querySelectorAll('tr').forEach(function (row, index) {
        var idCell = row.querySelector('td');
        var resourceId = idCell && idCell.textContent.trim();
        if (!resourceId) return;
        row.setAttribute('data-bt-resource-id', resourceId);
        store.ensureDemoBinding(config.type, resourceId, index);
        var cell = row.querySelector('[data-bt-cell="archive"]');
        if (!cell) {
          cell = document.createElement('td');
          cell.setAttribute('data-bt-cell', 'archive');
          cell.className = 'bt-archive-col';
          row.appendChild(cell);
        }
        cell.innerHTML = ui.chipsHtml(config.type, resourceId) +
          '<button type="button" class="bt-inline-action" data-bt-bind-archive="' + ui.escapeHtml(resourceId) + '">设置</button>';
      });
    }

    function applyFilter(captureBase) {
      var filter = ui.readFilter(host);
      tbody.querySelectorAll('tr[data-bt-resource-id]').forEach(function (row) {
        if (captureBase) row.setAttribute('data-bt-base-hidden', row.style.display === 'none' ? '1' : '0');
        var baseHidden = row.getAttribute('data-bt-base-hidden') === '1';
        var match = store.matches(config.type, row.getAttribute('data-bt-resource-id'), filter.ids, filter.mode);
        row.style.display = baseHidden || !match ? 'none' : '';
      });
    }

    function refresh(captureBase) {
      decorateRows();
      applyFilter(!!captureBase);
    }

    refresh(true);
    var observer = new MutationObserver(function () { window.requestAnimationFrame(function () { refresh(false); }); });
    observer.observe(tbody, { childList: true });
    var query = document.getElementById('btnFilterQuery');
    var reset = document.getElementById('btnFilterReset');
    if (query) query.addEventListener('click', function () { refresh(true); });
    if (reset) reset.addEventListener('click', function () {
      ui.resetFilter(host);
      refresh(true);
    });
    tbody.addEventListener('click', function (event) {
      var button = event.target.closest('[data-bt-bind-archive]');
      if (!button) return;
      ui.openBinding(config.type, button.getAttribute('data-bt-bind-archive'), '设置' + config.columnLabel);
    });
    window.addEventListener('business-tags:changed', function () { refresh(false); });
  }

  ready(function () {
    var page = pageName();
    if (page === 'basic_settings_system.html') mountCapabilityPage();
    else if (page === 'mdm_aftersale_ticket.html') mountAfterSaleList();
    else if (page === 'mdm_aftersale_ticket_detail.html') mountAfterSaleDetail();
    else if (page === 'mdm_archive_store.html') {
      mountArchiveTags({
        scene: 'STORE_MANAGEMENT', type: 'STORE', filterId: 'storeBusinessTagFilter',
        filterLabel: '门店标签', managerLabel: '门店标签管理', libraryTitle: '门店标签库', columnLabel: '门店标签'
      });
    }
  });
})();
