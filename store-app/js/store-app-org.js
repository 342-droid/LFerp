/**
 * 丰银宝组织切换：门店视角 ↔ 供应商视角
 * 本地 key 独立于 B 端 lfCurrentOrgId，避免互相覆盖。
 */
(function (global) {
  var KEY = 'fybCurrentOrgId';

  var ORGS = [
    { id: 'store-lengfeng', role: 'store', name: '冷丰生鲜超市', short: '店' },
    { id: 'sup-ss', role: 'supplier', name: '斯斯供应商商家', short: '供' },
    { id: 'sup-mq', role: 'supplier', name: '南京马群枢纽供应商', short: '供' }
  ];

  function list() {
    return ORGS.slice();
  }

  function find(id) {
    return ORGS.filter(function (o) {
      return o.id === id;
    })[0];
  }

  function current() {
    var saved = '';
    try {
      saved = localStorage.getItem(KEY) || '';
    } catch (e) {
      saved = '';
    }
    return find(saved) || ORGS[0];
  }

  function setCurrent(id) {
    var org = find(id) || ORGS[0];
    try {
      localStorage.setItem(KEY, org.id);
      if (org.role === 'supplier') {
        localStorage.setItem('spSettleSupplierId', org.id);
      }
    } catch (e) {}
    try {
      global.dispatchEvent(
        new CustomEvent('fyb-org-change', { detail: { org: org } })
      );
    } catch (e2) {}
    return org;
  }

  function isSupplier(org) {
    var o = org || current();
    return !!(o && o.role === 'supplier');
  }

  function isStore(org) {
    return !isSupplier(org);
  }

  function ensureStoreModeOrRedirect(homeHref) {
    if (isSupplier()) {
      location.replace(homeHref || 'home.html');
      return false;
    }
    return true;
  }

  function ensureSupplierModeOrRedirect(homeHref) {
    if (!isSupplier()) {
      location.replace(homeHref || 'home.html');
      return false;
    }
    return true;
  }

  /** 底部组织切换面板 */
  function openSwitcher(opts) {
    opts = opts || {};
    var existing = document.querySelector('.fyb-org-mask');
    if (existing) existing.remove();

    var cur = current();
    var mask = document.createElement('div');
    mask.className = 'fyb-org-mask';
    mask.setAttribute('role', 'dialog');
    mask.setAttribute('aria-label', '切换组织');

    var sheet = document.createElement('div');
    sheet.className = 'fyb-org-sheet';
    sheet.innerHTML =
      '<div class="fyb-org-sheet__handle" aria-hidden="true"></div>' +
      '<h2 class="fyb-org-sheet__title">切换组织</h2>' +
      '<p class="fyb-org-sheet__tip">门店视角处理核销进货；供应商视角查看订单、结算与合同。</p>' +
      '<ul class="fyb-org-sheet__list" role="listbox"></ul>' +
      '<button type="button" class="fyb-org-sheet__cancel">取消</button>';

    var ul = sheet.querySelector('.fyb-org-sheet__list');
    list().forEach(function (org) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'fyb-org-item' + (org.id === cur.id ? ' is-active' : '');
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', org.id === cur.id ? 'true' : 'false');
      btn.innerHTML =
        '<span class="fyb-org-item__avatar">' +
        (org.short || org.name.slice(0, 1)) +
        '</span>' +
        '<span class="fyb-org-item__main">' +
        '<strong>' +
        org.name +
        '</strong>' +
        '<em>' +
        (org.role === 'supplier' ? '供应商' : '门店') +
        '</em>' +
        '</span>' +
        (org.id === cur.id ? '<span class="fyb-org-item__check" aria-hidden="true">✓</span>' : '');
      btn.addEventListener('click', function () {
        var next = setCurrent(org.id);
        mask.remove();
        if (typeof opts.onSelect === 'function') opts.onSelect(next, cur);
      });
      li.appendChild(btn);
      ul.appendChild(li);
    });

    sheet.querySelector('.fyb-org-sheet__cancel').addEventListener('click', function () {
      mask.remove();
    });
    mask.addEventListener('click', function (e) {
      if (e.target === mask) mask.remove();
    });

    mask.appendChild(sheet);
    document.body.appendChild(mask);
    requestAnimationFrame(function () {
      mask.classList.add('is-open');
    });
  }

  global.FybOrg = {
    KEY: KEY,
    list: list,
    find: find,
    current: current,
    setCurrent: setCurrent,
    isSupplier: isSupplier,
    isStore: isStore,
    openSwitcher: openSwitcher,
    ensureStoreModeOrRedirect: ensureStoreModeOrRedirect,
    ensureSupplierModeOrRedirect: ensureSupplierModeOrRedirect
  };
})(typeof window !== 'undefined' ? window : this);
