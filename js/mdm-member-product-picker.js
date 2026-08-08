/**
 * 会员 · 选品库商品多选弹窗
 * 列：图片、名称、类目、商品编码、售卖渠道、商品状态；支持分页与筛选
 */
(function (global) {
  'use strict';

  var PAGE_SIZE = 10;

  var STATUS_LABEL = {
    selling: '售卖中',
    pending_sale: '待售卖',
    stopped: '已停售'
  };

  var CHANNEL_LABEL = {
    live: '电商直播',
    proxy: '代采'
  };

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getProducts() {
    if (global.MdmProductCatalog && typeof global.MdmProductCatalog.getScopeProducts === 'function') {
      return global.MdmProductCatalog.getScopeProducts();
    }
    return [];
  }

  function getCategories() {
    if (global.MdmProductCatalog && typeof global.MdmProductCatalog.getCategories === 'function') {
      return global.MdmProductCatalog.getCategories();
    }
    return [];
  }

  function channelText(item) {
    if (item.channel) return String(item.channel);
    var ch = item.saleChannels || [];
    if (!ch.length) return '—';
    return ch.map(function (c) {
      return CHANNEL_LABEL[c] || c;
    }).join('、');
  }

  function statusHtml(status) {
    var key = status || 'selling';
    var label = STATUS_LABEL[key] || key;
    var cls = 'pts-rule-product-status pts-rule-product-status--' + key;
    return '<span class="' + cls + '">' + escapeHtml(label) + '</span>';
  }

  function hasChannel(item, channel) {
    if (!channel) return true;
    var ch = item.saleChannels || [];
    if (ch.length) return ch.indexOf(channel) >= 0;
    var text = String(item.channel || '');
    if (channel === 'live') return text.indexOf('电商直播') >= 0;
    if (channel === 'proxy') return text.indexOf('代采') >= 0;
    return false;
  }

  /**
   * @param {object} options
   * @param {object|string[]} options.selected 已选 id map 或 id 数组
   * @param {function} options.onConfirm function(products: {id,name}[])
   */
  function open(options) {
    options = options || {};
    var catalog = getProducts();
    var cats = getCategories();
    var selectedMap = {};
    if (Array.isArray(options.selected)) {
      options.selected.forEach(function (id) {
        selectedMap[id] = true;
      });
    } else if (options.selected && typeof options.selected === 'object') {
      Object.keys(options.selected).forEach(function (id) {
        if (options.selected[id]) selectedMap[id] = true;
      });
    }

    var filterState = {
      categoryId: '',
      name: '',
      code: '',
      channel: '',
      status: ''
    };
    var page = 1;

    var catOptions = cats.map(function (c) {
      return '<option value="' + escapeHtml(c.id) + '">' + escapeHtml(c.name) + '</option>';
    }).join('');

    var backdrop = document.createElement('div');
    backdrop.className = 'pts-rule-pick-backdrop';
    backdrop.innerHTML =
      '<div class="pts-rule-pick-modal pts-rule-pick-modal--product" role="dialog" aria-modal="true">' +
      '  <div class="pts-rule-pick-modal__header">' +
      '    <h3 class="pts-rule-pick-modal__title">选择商品</h3>' +
      '    <button type="button" class="pts-rule-pick-modal__close" data-pick-close aria-label="关闭">&times;</button>' +
      '  </div>' +
      '  <div class="pts-rule-pick-modal__body">' +
      '    <div class="pts-rule-product-filter">' +
      '      <select class="erp-select pts-rule-product-filter__cat" data-pick-cat title="类目">' +
      '        <option value="">全部类目</option>' + catOptions +
      '      </select>' +
      '      <input class="erp-input" type="text" placeholder="商品名称" data-pick-name>' +
      '      <input class="erp-input" type="text" placeholder="商品编码" data-pick-code>' +
      '      <select class="erp-select pts-rule-product-filter__channel" data-pick-channel title="售卖渠道">' +
      '        <option value="">全部渠道</option>' +
      '        <option value="live">电商直播</option>' +
      '        <option value="proxy">代采</option>' +
      '      </select>' +
      '      <select class="erp-select pts-rule-product-filter__status" data-pick-status title="商品状态">' +
      '        <option value="">全部状态</option>' +
      '        <option value="selling">售卖中</option>' +
      '        <option value="pending_sale">待售卖</option>' +
      '        <option value="stopped">已停售</option>' +
      '      </select>' +
      '      <button type="button" class="erp-btn" data-pick-search>查询</button>' +
      '      <button type="button" class="erp-btn" data-pick-reset>重置</button>' +
      '    </div>' +
      '    <div class="pts-rule-product-table-wrap">' +
      '      <table class="pts-rule-product-table">' +
      '        <thead><tr>' +
      '          <th style="width:40px;"></th>' +
      '          <th style="width:64px;">图片</th>' +
      '          <th>商品名称</th>' +
      '          <th style="width:100px;">类目</th>' +
      '          <th style="width:110px;">商品编码</th>' +
      '          <th style="width:120px;">售卖渠道</th>' +
      '          <th style="width:88px;">商品状态</th>' +
      '        </tr></thead>' +
      '        <tbody data-pick-list></tbody>' +
      '      </table>' +
      '    </div>' +
      '    <div class="pts-rule-product-pager" data-pick-pager></div>' +
      '  </div>' +
      '  <div class="pts-rule-pick-modal__footer">' +
      '    <span class="pts-rule-tip" data-pick-count style="margin:0;margin-right:auto;"></span>' +
      '    <button type="button" class="erp-btn" data-pick-close>取消</button>' +
      '    <button type="button" class="erp-btn erp-btn--primary" data-pick-ok>确定</button>' +
      '  </div>' +
      '</div>';

    var listEl = backdrop.querySelector('[data-pick-list]');
    var pagerEl = backdrop.querySelector('[data-pick-pager]');
    var catEl = backdrop.querySelector('[data-pick-cat]');
    var nameEl = backdrop.querySelector('[data-pick-name]');
    var codeEl = backdrop.querySelector('[data-pick-code]');
    var channelEl = backdrop.querySelector('[data-pick-channel]');
    var statusEl = backdrop.querySelector('[data-pick-status]');
    var countEl = backdrop.querySelector('[data-pick-count]');

    function syncCount() {
      var n = Object.keys(selectedMap).length;
      if (countEl) countEl.textContent = n ? ('已选 ' + n + ' 件商品') : '';
    }

    function matchProduct(it) {
      if (filterState.categoryId && it.categoryId !== filterState.categoryId && it.category !== filterState.categoryId) {
        return false;
      }
      var nameKw = filterState.name.trim().toLowerCase();
      if (nameKw && String(it.name).toLowerCase().indexOf(nameKw) === -1) return false;
      var codeKw = filterState.code.trim().toLowerCase();
      if (codeKw) {
        var code = String(it.code || it.id || '').toLowerCase();
        if (code.indexOf(codeKw) === -1) return false;
      }
      if (!hasChannel(it, filterState.channel)) return false;
      if (filterState.status && it.status !== filterState.status) return false;
      return true;
    }

    function getFiltered() {
      return catalog.filter(matchProduct);
    }

    function renderPager(total) {
      if (!pagerEl) return;
      var totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      if (page > totalPages) page = totalPages;
      if (page < 1) page = 1;
      var start = total ? (page - 1) * PAGE_SIZE + 1 : 0;
      var end = Math.min(page * PAGE_SIZE, total);
      pagerEl.innerHTML =
        '<span class="pts-rule-product-pager__info">共 ' + total + ' 件，当前 ' + start + '-' + end + '</span>' +
        '<div class="pts-rule-product-pager__btns">' +
        '  <button type="button" class="erp-btn" data-page-prev' + (page <= 1 ? ' disabled' : '') + '>上一页</button>' +
        '  <span class="pts-rule-product-pager__page">' + page + ' / ' + totalPages + '</span>' +
        '  <button type="button" class="erp-btn" data-page-next' + (page >= totalPages ? ' disabled' : '') + '>下一页</button>' +
        '</div>';
    }

    function renderList() {
      var filtered = getFiltered();
      var total = filtered.length;
      var totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      if (page > totalPages) page = totalPages;
      var slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
      if (!slice.length) {
        listEl.innerHTML = '<tr><td colspan="7" class="pts-rule-pick-empty">无匹配商品</td></tr>';
        renderPager(total);
        syncCount();
        return;
      }
      listEl.innerHTML = slice.map(function (it) {
        var checked = !!selectedMap[it.id];
        var img = it.image
          ? '<img class="pts-rule-product-thumb" src="' + escapeHtml(it.image) + '" alt="">'
          : '<span class="pts-rule-product-thumb pts-rule-product-thumb--empty">无图</span>';
        return (
          '<tr class="pts-rule-product-row' + (checked ? ' is-checked' : '') + '" data-id="' + escapeHtml(it.id) + '">' +
          '<td><input type="checkbox" value="' + escapeHtml(it.id) + '"' + (checked ? ' checked' : '') + '></td>' +
          '<td>' + img + '</td>' +
          '<td>' + escapeHtml(it.name) + '</td>' +
          '<td>' + escapeHtml(it.category || it.categoryId || '—') + '</td>' +
          '<td>' + escapeHtml(it.code || it.id || '—') + '</td>' +
          '<td>' + escapeHtml(channelText(it)) + '</td>' +
          '<td>' + statusHtml(it.status) + '</td>' +
          '</tr>'
        );
      }).join('');
      renderPager(total);
      syncCount();
    }

    function applyFilter() {
      filterState.categoryId = catEl.value;
      filterState.name = nameEl.value;
      filterState.code = codeEl.value;
      filterState.channel = channelEl.value;
      filterState.status = statusEl.value;
      page = 1;
      renderList();
    }

    function resetFilter() {
      catEl.value = '';
      nameEl.value = '';
      codeEl.value = '';
      channelEl.value = '';
      statusEl.value = '';
      applyFilter();
    }

    renderList();

    backdrop.querySelector('[data-pick-search]').addEventListener('click', applyFilter);
    backdrop.querySelector('[data-pick-reset]').addEventListener('click', resetFilter);
    [nameEl, codeEl].forEach(function (el) {
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') applyFilter();
      });
    });

    pagerEl.addEventListener('click', function (ev) {
      var prev = ev.target.closest('[data-page-prev]');
      var next = ev.target.closest('[data-page-next]');
      if (prev && !prev.disabled) {
        page -= 1;
        renderList();
      }
      if (next && !next.disabled) {
        page += 1;
        renderList();
      }
    });

    listEl.addEventListener('change', function (ev) {
      var input = ev.target;
      if (!input || input.type !== 'checkbox') return;
      var tr = input.closest('tr');
      if (input.checked) {
        selectedMap[input.value] = true;
        if (tr) tr.classList.add('is-checked');
      } else {
        delete selectedMap[input.value];
        if (tr) tr.classList.remove('is-checked');
      }
      syncCount();
    });

    function close() {
      backdrop.remove();
    }

    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop) close();
    });
    backdrop.querySelectorAll('[data-pick-close]').forEach(function (btn) {
      btn.addEventListener('click', close);
    });
    backdrop.querySelector('[data-pick-ok]').addEventListener('click', function () {
      var picked = catalog.filter(function (it) {
        return !!selectedMap[it.id];
      }).map(function (it) {
        return { id: it.id, name: it.name };
      });
      if (typeof options.onConfirm === 'function') options.onConfirm(picked, selectedMap);
      close();
    });

    document.body.appendChild(backdrop);
    nameEl.focus();
  }

  global.MdmMemberProductPicker = {
    open: open,
    PAGE_SIZE: PAGE_SIZE,
    STATUS_LABEL: STATUS_LABEL
  };
})(window);
