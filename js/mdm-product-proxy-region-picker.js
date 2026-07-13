/**
 * 代采商品 — 省市区区域选择器
 */
(function () {
  var REGION_TREE = [
    {
      id: '110000',
      name: '北京市',
      children: [{
        id: '110100',
        name: '市辖区',
        children: [
          { id: '110101', name: '东城区' },
          { id: '110102', name: '西城区' },
          { id: '110105', name: '朝阳区' },
          { id: '110106', name: '丰台区' },
          { id: '110107', name: '石景山区' },
          { id: '110108', name: '海淀区' },
          { id: '110109', name: '门头沟区' },
          { id: '110111', name: '房山区' },
          { id: '110112', name: '通州区' },
          { id: '110113', name: '顺义区' },
          { id: '110114', name: '昌平区' },
          { id: '110115', name: '大兴区' },
          { id: '110116', name: '怀柔区' },
          { id: '110117', name: '平谷区' },
          { id: '110118', name: '密云区' },
          { id: '110119', name: '延庆区' }
        ]
      }]
    },
    {
      id: '120000',
      name: '天津市',
      children: [{
        id: '120100',
        name: '市辖区',
        children: [
          { id: '120101', name: '和平区' },
          { id: '120102', name: '河东区' },
          { id: '120103', name: '河西区' },
          { id: '120104', name: '南开区' },
          { id: '120105', name: '河北区' },
          { id: '120106', name: '红桥区' },
          { id: '120110', name: '东丽区' },
          { id: '120111', name: '西青区' },
          { id: '120112', name: '津南区' },
          { id: '120113', name: '北辰区' },
          { id: '120114', name: '武清区' },
          { id: '120115', name: '宝坻区' },
          { id: '120116', name: '滨海新区' },
          { id: '120117', name: '宁河区' },
          { id: '120118', name: '静海区' },
          { id: '120119', name: '蓟州区' }
        ]
      }]
    },
    {
      id: '130000',
      name: '河北省',
      children: [
        { id: '130100', name: '石家庄市', children: makeDistricts('1301', ['长安区', '桥西区', '新华区', '裕华区', '藁城区']) },
        { id: '130200', name: '唐山市', children: makeDistricts('1302', ['路南区', '路北区', '古冶区', '开平区', '丰南区']) },
        { id: '130300', name: '秦皇岛市', children: makeDistricts('1303', ['海港区', '山海关区', '北戴河区', '抚宁区']) },
        { id: '130400', name: '邯郸市', children: makeDistricts('1304', ['邯山区', '丛台区', '复兴区', '峰峰矿区']) }
      ]
    },
    {
      id: '310000',
      name: '上海市',
      children: [{
        id: '310100',
        name: '市辖区',
        children: makeDistricts('3101', ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区', '闵行区'])
      }]
    },
    {
      id: '440000',
      name: '广东省',
      children: [
        { id: '440100', name: '广州市', children: makeDistricts('4401', ['荔湾区', '越秀区', '海珠区', '天河区', '白云区']) },
        { id: '440300', name: '深圳市', children: makeDistricts('4403', ['罗湖区', '福田区', '南山区', '宝安区', '龙岗区']) }
      ]
    }
  ];

  function makeDistricts(prefix, names) {
    return names.map(function (name, i) {
      return { id: prefix + String(i + 1).padStart(2, '0'), name: name };
    });
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function nodeByPath(pathIds) {
    var nodes = REGION_TREE;
    var node = null;
    for (var i = 0; i < pathIds.length; i++) {
      node = null;
      for (var j = 0; j < nodes.length; j++) {
        if (nodes[j].id === pathIds[i]) {
          node = nodes[j];
          break;
        }
      }
      if (!node) return null;
      nodes = node.children || [];
    }
    return node;
  }

  function getChildrenByPath(pathIds) {
    if (!pathIds.length) return REGION_TREE;
    var node = nodeByPath(pathIds);
    return node && node.children ? node.children : [];
  }

  function getLeaves(node) {
    if (!node) return [];
    if (!node.children || !node.children.length) return [node];
    var list = [];
    node.children.forEach(function (child) {
      list = list.concat(getLeaves(child));
    });
    return list;
  }

  function getSubtreeIds(node) {
    return getLeaves(node).map(function (n) { return n.id; });
  }

  function findNodeAndPath(id, nodes, trail) {
    nodes = nodes || REGION_TREE;
    trail = trail || [];
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.id === id) return { node: n, path: trail.concat([n.id]) };
      if (n.children) {
        var found = findNodeAndPath(id, n.children, trail.concat([n.id]));
        if (found) return found;
      }
    }
    return null;
  }

  function countSelected(node, selected) {
    var leaves = getLeaves(node);
    var picked = 0;
    leaves.forEach(function (leaf) {
      if (selected[leaf.id]) picked += 1;
    });
    return { picked: picked, total: leaves.length };
  }

  function isChecked(node, selected) {
    var c = countSelected(node, selected);
    return c.total > 0 && c.picked === c.total;
  }

  function isIndeterminate(node, selected) {
    var c = countSelected(node, selected);
    return c.picked > 0 && c.picked < c.total;
  }

  function summarizeSelections(selected) {
    var items = [];
    REGION_TREE.forEach(function (province) {
      var c = countSelected(province, selected);
      if (!c.picked) return;
      if (c.picked === c.total) {
        items.push({ id: province.id, label: province.name + '（全省）', removeIds: getSubtreeIds(province) });
        return;
      }
      (province.children || []).forEach(function (city) {
        var cc = countSelected(city, selected);
        if (!cc.picked) return;
        if (cc.picked === cc.total) {
          items.push({ id: city.id, label: province.name + ' / ' + city.name + '（全市）', removeIds: getSubtreeIds(city) });
          return;
        }
        getLeaves(city).forEach(function (leaf) {
          if (selected[leaf.id]) {
            items.push({ id: leaf.id, label: province.name + ' / ' + city.name + ' / ' + leaf.name, removeIds: [leaf.id] });
          }
        });
      });
    });
    return items;
  }

  function cloneSelected(map) {
    var out = {};
    Object.keys(map || {}).forEach(function (k) { out[k] = true; });
    return out;
  }

  function renderBreadcrumb(pathIds, pathNames) {
    var parts = ['<button type="button" class="proxy-region-picker__crumb" data-crumb-index="0">全部</button>'];
    for (var i = 0; i < pathIds.length; i++) {
      parts.push('<span class="proxy-region-picker__crumb-sep">/</span>');
      parts.push(
        '<button type="button" class="proxy-region-picker__crumb' + (i === pathIds.length - 1 ? ' is-current' : '') +
        '" data-crumb-index="' + (i + 1) + '">' + escapeHtml(pathNames[i]) + '</button>'
      );
    }
    return parts.join('');
  }

  function renderLeftList(pathIds, selected) {
    var nodes = getChildrenByPath(pathIds);
    if (!nodes.length) return '<div class="proxy-region-picker__empty">暂无下级区域</div>';

    return nodes.map(function (node) {
      var c = countSelected(node, selected);
      var checked = isChecked(node, selected);
      var indeterminate = isIndeterminate(node, selected);
      var hasChild = node.children && node.children.length;
      var active = checked || indeterminate;
      return (
        '<div class="proxy-region-picker__row' + (active ? ' is-active' : '') + (hasChild ? ' has-child' : '') + '" data-node-id="' + node.id + '">' +
        '  <label class="proxy-region-picker__check-wrap">' +
        '    <input type="checkbox" class="proxy-region-picker__check" data-node-id="' + node.id + '"' +
        (checked ? ' checked' : '') + (indeterminate ? ' data-indeterminate="1"' : '') + '>' +
        '  </label>' +
        '  <span class="proxy-region-picker__name">' + escapeHtml(node.name) + '</span>' +
        (hasChild ? '  <span class="proxy-region-picker__count' + (active ? ' is-active' : '') + '">' + c.picked + '/' + c.total + '</span>' : '') +
        (hasChild ? '<button type="button" class="proxy-region-picker__arrow" data-drill-id="' + node.id + '" aria-label="进入">›</button>' : '<span class="proxy-region-picker__arrow proxy-region-picker__arrow--placeholder"></span>') +
        '</div>'
      );
    }).join('');
  }

  function renderRightList(selected) {
    var items = summarizeSelections(selected);
    if (!items.length) {
      return '<div class="proxy-region-picker__selected-empty">暂未选择区域</div>';
    }
    return items.map(function (item) {
      return (
        '<div class="proxy-region-picker__selected-item" data-remove-id="' + escapeHtml(item.id) + '">' +
        '  <span class="proxy-region-picker__selected-label">' + escapeHtml(item.label) + '</span>' +
        '  <button type="button" class="proxy-region-picker__selected-remove" data-remove-id="' + escapeHtml(item.id) + '" aria-label="移除">&times;</button>' +
        '</div>'
      );
    }).join('');
  }

  function applyIndeterminate(root) {
    root.querySelectorAll('.proxy-region-picker__check[data-indeterminate="1"]').forEach(function (input) {
      input.indeterminate = true;
    });
  }

  function openRegionPicker(options) {
    options = options || {};
    var initial = cloneSelected(options.selected || {});
    var state = {
      pathIds: [],
      pathNames: [],
      selected: cloneSelected(initial)
    };

    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop proxy-region-picker-backdrop';
    backdrop.setAttribute('data-proxy-region-picker', '1');
    backdrop.innerHTML =
      '<div class="erp-modal proxy-region-picker-modal">' +
      '  <div class="erp-modal__header">' +
      '    <h2 class="erp-modal__title">选择区域</h2>' +
      '    <div class="erp-modal__header-actions">' +
      '      <button type="button" class="erp-modal__header-btn" data-region-close aria-label="关闭">&times;</button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="erp-modal__body proxy-region-picker__body">' +
      '    <div class="proxy-region-picker__panel proxy-region-picker__panel--left">' +
      '      <div class="proxy-region-picker__left-head" id="proxyRegionLeftHead">' +
      (state.pathIds.length ? renderBreadcrumb(state.pathIds, state.pathNames) : '<span class="proxy-region-picker__tab is-active">全部</span>') +
      '      </div>' +
      '      <div class="proxy-region-picker__list" id="proxyRegionLeftList"></div>' +
      '    </div>' +
      '    <div class="proxy-region-picker__panel proxy-region-picker__panel--right">' +
      '      <div class="proxy-region-picker__right-head">已选区域</div>' +
      '      <div class="proxy-region-picker__selected" id="proxyRegionRightList"></div>' +
      '    </div>' +
      '  </div>' +
      '  <div class="erp-modal__footer">' +
      '    <button type="button" class="erp-btn" data-region-cancel>取消</button>' +
      '    <button type="button" class="erp-btn erp-btn--primary" data-region-ok>确定</button>' +
      '  </div>' +
      '</div>';

    function close() {
      backdrop.remove();
    }

    function refresh() {
      var leftHead = backdrop.querySelector('#proxyRegionLeftHead');
      var leftList = backdrop.querySelector('#proxyRegionLeftList');
      var rightList = backdrop.querySelector('#proxyRegionRightList');
      if (leftHead) {
        leftHead.innerHTML = state.pathIds.length
          ? renderBreadcrumb(state.pathIds, state.pathNames)
          : '<span class="proxy-region-picker__tab is-active">全部</span>';
      }
      if (leftList) leftList.innerHTML = renderLeftList(state.pathIds, state.selected);
      if (rightList) rightList.innerHTML = renderRightList(state.selected);
      applyIndeterminate(backdrop);
    }

    function toggleNode(nodeId, checked) {
      var found = findNodeAndPath(nodeId);
      if (!found) return;
      getSubtreeIds(found.node).forEach(function (id) {
        if (checked) state.selected[id] = true;
        else delete state.selected[id];
      });
      refresh();
    }

    function removeSummaryItem(removeId) {
      var items = summarizeSelections(state.selected);
      var target = null;
      for (var i = 0; i < items.length; i++) {
        if (items[i].id === removeId) {
          target = items[i];
          break;
        }
      }
      if (!target) return;
      target.removeIds.forEach(function (id) { delete state.selected[id]; });
      refresh();
    }

    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop) close();
    });
    backdrop.querySelector('[data-region-close]').addEventListener('click', close);
    backdrop.querySelector('[data-region-cancel]').addEventListener('click', close);
    backdrop.querySelector('[data-region-ok]').addEventListener('click', function () {
      if (typeof options.onConfirm === 'function') {
        options.onConfirm(cloneSelected(state.selected), summarizeSelections(state.selected));
      }
      close();
    });

    backdrop.addEventListener('click', function (e) {
      var crumb = e.target.closest('[data-crumb-index]');
      if (crumb) {
        var idx = parseInt(crumb.getAttribute('data-crumb-index'), 10) || 0;
        state.pathIds = state.pathIds.slice(0, idx);
        state.pathNames = state.pathNames.slice(0, idx);
        refresh();
        return;
      }

      var drill = e.target.closest('[data-drill-id]');
      if (drill) {
        e.preventDefault();
        e.stopPropagation();
        var nodeId = drill.getAttribute('data-drill-id');
        var found = findNodeAndPath(nodeId);
        if (found && found.node.children && found.node.children.length) {
          state.pathIds = found.path;
          state.pathNames = found.path.map(function (pid) {
            var f = findNodeAndPath(pid);
            return f ? f.node.name : pid;
          });
          refresh();
        }
        return;
      }

      var row = e.target.closest('.proxy-region-picker__row.has-child');
      if (row && !e.target.closest('.proxy-region-picker__check-wrap') && !e.target.closest('[data-drill-id]')) {
        var rowId = row.getAttribute('data-node-id');
        var foundRow = findNodeAndPath(rowId);
        if (foundRow && foundRow.node.children && foundRow.node.children.length) {
          state.pathIds = foundRow.path;
          state.pathNames = foundRow.path.map(function (pid) {
            var f = findNodeAndPath(pid);
            return f ? f.node.name : pid;
          });
          refresh();
        }
      }

      var removeBtn = e.target.closest('[data-remove-id]');
      if (removeBtn && removeBtn.classList.contains('proxy-region-picker__selected-remove')) {
        removeSummaryItem(removeBtn.getAttribute('data-remove-id'));
      }
    });

    backdrop.addEventListener('change', function (e) {
      var checkbox = e.target.closest('.proxy-region-picker__check');
      if (!checkbox) return;
      toggleNode(checkbox.getAttribute('data-node-id'), checkbox.checked);
    });

    document.body.appendChild(backdrop);
    refresh();
  }

  window.MdmProxyRegionPicker = {
    open: openRegionPicker,
    summarize: summarizeSelections,
    cloneSelected: cloneSelected
  };
})();
