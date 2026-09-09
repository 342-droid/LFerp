/**
 * 丰银宝 · 直播推广身份
 * 店长/员工固定本店；BD 切到某门店后，列表按该店可见范围，分享携带该店 + BD 姓名/手机号。
 */
(function (global) {
  var KEY = 'sa_live_promo_session_v1';
  var STAFF_STORE_ID = 'ONS303445581201';

  var STAFF = {
    id: 'STAFF-001',
    name: '牛店长',
    phone: '13812348001'
  };

  var BD = {
    id: 'BD20240001',
    name: '李泽峰',
    phone: '13822118801'
  };

  var STORES = [
    {
      id: 'ONS303445581201',
      name: '冷丰生鲜超市',
      region: '天津市河东区'
    },
    {
      id: 'ONS-CENTER-01',
      name: '中心店01',
      region: '浙江省杭州市西湖区'
    },
    {
      id: 'ONS-XIXI-SOUTH',
      name: '西溪湿地南门店',
      region: '浙江省杭州市西湖区'
    },
    {
      id: 'ONS-JIANGCUN',
      name: '蒋村公交站店',
      region: '浙江省杭州市西湖区'
    }
  ];

  function readJson(fallback) {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return fallback;
      var data = JSON.parse(raw);
      return data && typeof data === 'object' ? data : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      /* ignore */
    }
  }

  function getStore(id) {
    var sid = String(id || '');
    for (var i = 0; i < STORES.length; i++) {
      if (STORES[i].id === sid) return STORES[i];
    }
    return null;
  }

  function defaultSession() {
    return { role: 'staff', storeId: STAFF_STORE_ID, from: 'store-app' };
  }

  function normalize(raw) {
    var next = Object.assign(defaultSession(), raw || {});
    if (next.role !== 'bd') next.role = 'staff';
    if (next.role === 'staff') next.storeId = STAFF_STORE_ID;
    if (!getStore(next.storeId)) next.storeId = STAFF_STORE_ID;
    if (next.from !== 'bd-app') next.from = 'store-app';
    return next;
  }

  function read() {
    return normalize(readJson(null));
  }

  function write(patch) {
    var next = normalize(Object.assign(read(), patch || {}));
    writeJson(next);
    return next;
  }

  function pageParams() {
    try {
      return new URLSearchParams(location.search || '');
    } catch (e) {
      return new URLSearchParams();
    }
  }

  function applyUrlHints() {
    var params = pageParams();
    var patch = {};
    var from = params.get('from');
    var role = params.get('role');
    var storeId = params.get('storeId');
    if (from === 'bd-app' || role === 'bd') patch.role = 'bd';
    if (from === 'bd-app') patch.from = 'bd-app';
    if (storeId && getStore(storeId)) patch.storeId = storeId;
    if (Object.keys(patch).length) return write(patch);
    return read();
  }

  function maskPhone(phone) {
    var d = String(phone || '').replace(/\D/g, '');
    if (d.length !== 11) return d || '';
    return d.slice(0, 3) + '****' + d.slice(7);
  }

  function identity() {
    var sess = read();
    var store = getStore(sess.storeId) || STORES[0];
    var person = sess.role === 'bd' ? BD : STAFF;
    return {
      role: sess.role,
      from: sess.from,
      storeId: store.id,
      storeName: store.name,
      storeRegion: store.region || '',
      staffId: person.id,
      staffName: person.name,
      staffPhone: person.phone,
      roleLabel: sess.role === 'bd' ? 'BD' : '店长'
    };
  }

  function isBd() {
    return identity().role === 'bd';
  }

  function whoText() {
    var info = identity();
    return (
      '当前门店 ' +
      info.storeName +
      ' · 推广人 ' +
      info.staffName +
      ' ' +
      maskPhone(info.staffPhone)
    );
  }

  function livePromoHref() {
    var info = identity();
    var q = [];
    if (info.from === 'bd-app' || info.role === 'bd') {
      q.push('from=' + (info.from === 'bd-app' ? 'bd-app' : 'store-app'));
      if (info.role === 'bd') q.push('role=bd');
      q.push('storeId=' + encodeURIComponent(info.storeId));
    }
    return 'live-promo.html' + (q.length ? '?' + q.join('&') : '');
  }

  function backHref() {
    var info = identity();
    if (info.from === 'bd-app' || pageParams().get('from') === 'bd-app') {
      if (global.wmsPath && typeof global.wmsPath.page === 'function') {
        return global.wmsPath.page('MDM/mdm_bd_workbench.html');
      }
      return '../../MDM/mdm_bd_workbench.html';
    }
    return 'home.html';
  }

  function persistListUrl() {
    if (!/live-promo\.html/i.test(location.pathname || '')) return;
    var info = identity();
    var url = new URL(location.href);
    if (info.role === 'bd') url.searchParams.set('role', 'bd');
    else url.searchParams.delete('role');
    if (info.from === 'bd-app') url.searchParams.set('from', 'bd-app');
    url.searchParams.set('storeId', info.storeId);
    if (global.history && global.history.replaceState) {
      global.history.replaceState(null, '', url.pathname + url.search + url.hash);
    }
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function mountDemoPanel() {
    if (document.getElementById('sa-lp-demo')) return;
    var info = identity();
    var panel = document.createElement('div');
    panel.id = 'sa-lp-demo';
    panel.className = 'sa-lp-demo';
    var storeOpts = STORES.map(function (s) {
      return (
        '<option value="' +
        esc(s.id) +
        '"' +
        (s.id === info.storeId ? ' selected' : '') +
        '>' +
        esc(s.name) +
        '</option>'
      );
    }).join('');
    panel.innerHTML =
      '<div class="sa-lp-demo__title">直播推广验收开关</div>' +
      '<label class="sa-lp-demo__row">身份' +
      '<select id="saLpDemoRole">' +
      '<option value="staff"' +
      (info.role === 'staff' ? ' selected' : '') +
      '>店长/员工</option>' +
      '<option value="bd"' +
      (info.role === 'bd' ? ' selected' : '') +
      '>BD</option>' +
      '</select></label>' +
      '<label class="sa-lp-demo__row" id="saLpDemoStoreRow">当前门店' +
      '<select id="saLpDemoStore">' +
      storeOpts +
      '</select></label>' +
      '<p class="sa-lp-demo__hint">BD 切到门店后可看该店直播列表；分享绑定该店，推广人是 BD 姓名和手机号。</p>' +
      '<button type="button" class="sa-lp-demo__apply" id="saLpDemoApply">应用并刷新</button>';
    document.body.appendChild(panel);

    function syncStoreRow() {
      var roleEl = document.getElementById('saLpDemoRole');
      var row = document.getElementById('saLpDemoStoreRow');
      var storeEl = document.getElementById('saLpDemoStore');
      var bd = roleEl && roleEl.value === 'bd';
      if (row) row.style.display = bd ? 'flex' : 'none';
      if (storeEl) storeEl.disabled = !bd;
    }
    syncStoreRow();
    var roleEl = document.getElementById('saLpDemoRole');
    if (roleEl) roleEl.addEventListener('change', syncStoreRow);
    var apply = document.getElementById('saLpDemoApply');
    if (apply) {
      apply.addEventListener('click', function () {
        var role = (document.getElementById('saLpDemoRole') || {}).value || 'staff';
        var storeEl = document.getElementById('saLpDemoStore');
        write({
          role: role,
          storeId: role === 'bd' && storeEl ? storeEl.value : STAFF_STORE_ID
        });
        location.reload();
      });
    }
  }

  global.SaLivePromoSession = {
    STORES: STORES,
    STAFF: STAFF,
    BD: BD,
    STAFF_STORE_ID: STAFF_STORE_ID,
    read: read,
    write: write,
    applyUrlHints: applyUrlHints,
    getStore: getStore,
    identity: identity,
    isBd: isBd,
    maskPhone: maskPhone,
    whoText: whoText,
    livePromoHref: livePromoHref,
    backHref: backHref,
    persistListUrl: persistListUrl,
    mountDemoPanel: mountDemoPanel
  };
})(window);
