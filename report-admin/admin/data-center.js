(function () {
  'use strict';

  var params = new URLSearchParams(location.search);
  var section = params.get('section') || 'overview';
  var view = params.get('view') || 'overview';
  if (['overview', 'erp', 'store'].indexOf(section) < 0) section = 'overview';

  var erpItems = [
    { id: 'overview', label: '经营总览', src: '../../MDM/mdm_data_biz_overview.html' },
    { id: 'rbt', label: 'RBT', src: '../../MDM/mdm_data_biz_rbt.html' },
    { id: 'supplier', label: '供应商分析', src: '../../MDM/mdm_data_biz_supplier.html' },
    { id: 'stores', label: '门店分析', src: '../../MDM/mdm_data_biz_stores.html' },
    { id: 'marketing', label: '营销活动', src: '../../MDM/mdm_data_biz_marketing.html' }
  ];
  var storeItems = [
    { id: 'overview', label: '概览', path: '/admin/' },
    { id: 'stores', label: '门店', path: '/admin/stores' },
    { id: 'batches', label: '写入记录', path: '/admin/batches' },
    { id: 'access', label: '访问统计', path: '/admin/access' },
    { id: 'audit', label: '操作日志', path: '/admin/audit' },
    { id: 'users', label: '账号与密钥', path: '/admin/users' }
  ];

  document.querySelectorAll('[data-primary]').forEach(function (link) {
    link.classList.toggle('is-active', link.getAttribute('data-primary') === section);
  });

  var title = document.querySelector('[data-sidebar-title]');
  var nav = document.querySelector('[data-sidebar-nav]');
  var main = document.querySelector('[data-main]');

  function renderNav(items, group) {
    nav.innerHTML = items.map(function (item) {
      var active = item.id === view;
      return '<a class="' + (active ? 'is-active' : '') + '" href="?section=' + group + '&view=' + item.id + '">' + item.label + '</a>';
    }).join('');
  }

  function placeholder(pageTitle, description, extra) {
    main.innerHTML =
      '<div class="dc-page-head"><h1>' + pageTitle + '</h1><p>' + description + '</p></div>' +
      '<section class="dc-card dc-placeholder"><div><div class="dc-placeholder__icon">⌁</div>' +
      '<h2>页面已预留</h2><p>' + description + '</p>' + (extra || '') + '</div></section>';
  }

  function money(value) {
    if (value == null || value === '') return '—';
    return '¥' + Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function renderPlatformOverview() {
    var Center = window.MdmDataBizCenter;
    var period = params.get('period') || '30d';
    var snap = Center ? Center.erpSnapshot({ period: period, channel: 'all' }) : null;
    var pos = Center ? Center.posSnapshot({ period: period, channel: 'all' }) : { rows: [] };
    if (!snap) {
      placeholder('平台经营总览', '数据源尚未加载，请刷新页面重试。');
      return;
    }
    var posGmv = pos.rows.reduce(function (sum, row) { return sum + Number(row.billAmount || 0); }, 0);
    var retailGmv = (snap.mix || []).filter(function (row) { return row.name === '零售GMV'; }).reduce(function (sum, row) { return sum + Number(row.value || 0); }, 0);
    var proxyGmv = (snap.mix || []).filter(function (row) { return row.name === '代采GMV'; }).reduce(function (sum, row) { return sum + Number(row.value || 0); }, 0);
    var grossRetailGmv = retailGmv;
    var grossProxyGmv = proxyGmv;
    var refundTotal = (snap.orderDetails || []).reduce(function (sum, row) { return sum + Number(row.refundAmount || 0); }, 0);
    if (!refundTotal) refundTotal = Number(snap.refundAmount || 0);
    var refundRetail = refundTotal * 0.72;
    var refundProxy = refundTotal * 0.28;
    var retailNetGmv = Math.max(0, grossRetailGmv - refundRetail);
    var proxyNetGmv = Math.max(0, grossProxyGmv - refundProxy);
    var totalGmv = posGmv + grossRetailGmv + grossProxyGmv;
    var totalNetGmv = posGmv + retailNetGmv + proxyNetGmv;
    var retailExpected = Number(snap.platformCommissionExpected || 0) * 0.72;
    var proxyExpected = Number(snap.platformCommissionExpected || 0) * 0.28;
    var retailActual = Number(snap.platformCommissionActual || 0) * 0.72;
    var proxyActual = Number(snap.platformCommissionActual || 0) * 0.28;
    var storeMap = {};
    function addStore(name, key, value) {
      if (!name) return;
      storeMap[name] = storeMap[name] || { name: name, pos: 0, retail: 0, proxy: 0, refund: 0 };
      storeMap[name][key] += Number(value || 0);
    }
    pos.rows.forEach(function (row) { addStore(row.storeName, 'pos', row.billAmount); });
    (snap.storeSales || []).forEach(function (row) { addStore(row.storeName, 'retail', row.sales); addStore(row.storeName, 'refund', row.refundAmount); });
    (snap.storeProxy || []).forEach(function (row) { addStore(row.storeName, 'proxy', row.sales); addStore(row.storeName, 'refund', row.refundAmount); });
    var stores = Object.keys(storeMap).map(function (name) {
      var row = storeMap[name];
      row.total = row.pos + row.retail + row.proxy;
      row.net = Math.max(0, row.total - row.refund);
      return row;
    }).sort(function (a, b) { return b.total - a.total; });
    var sourceRows = [
      { name: 'POS', detail: '京东秒送 / 美团外卖 / 淘宝闪购 / 堂食 / 抖音', gmv: posGmv, income: null },
      { name: '零售', detail: '商城 / 直播', gmv: retailGmv, netGmv: retailNetGmv, expected: retailExpected, actual: retailActual },
      { name: '代采', detail: '门店进货订单，计入平台 GMV', gmv: proxyGmv, netGmv: proxyNetGmv, expected: proxyExpected, actual: proxyActual }
    ];
    main.innerHTML =
      '<div class="dc-page-head"><h1>平台经营总览</h1><p>平台总 GMV = POS GMV + 零售 GMV + 代采 GMV。退款后净 GMV = GMV - 成功退款金额。</p></div>' +
      '<section class="dc-card dc-overview-note"><strong>指标口径</strong><p>POS 仅展示门店通过收银系统产生的 GMV；商城、直播和代采展示平台预计收入与实际已入账收入；代采计入平台 GMV，但不计入 BD 佣金。</p></section>' +
      '<section class="dc-overview-kpis">' +
        '<div class="dc-card"><span>平台总 GMV</span><strong>' + money(totalGmv) + '</strong><small>退款后净 GMV ' + money(totalNetGmv) + ' · POS ' + money(posGmv) + ' · 零售 ' + money(retailGmv) + ' · 代采 ' + money(proxyGmv) + '</small></div>' +
        '<div class="dc-card"><span>平台预计收入</span><strong>' + money(retailExpected + proxyExpected) + '</strong><small>零售 ' + money(retailExpected) + ' · 代采 ' + money(proxyExpected) + ' · POS 暂无法计算</small></div>' +
        '<div class="dc-card"><span>平台当前收入</span><strong>' + money(retailActual + proxyActual) + '</strong><small>零售 ' + money(retailActual) + ' · 代采 ' + money(proxyActual) + ' · POS 暂无法计算</small></div>' +
      '</section>' +
      '<section class="dc-card"><h2>收入来源拆分</h2><table class="dc-table"><thead><tr><th>来源</th><th>明细</th><th>GMV</th><th>退款后净 GMV</th><th>预计收入</th><th>实际已入账</th></tr></thead><tbody>' +
        '<tr><td>POS</td><td>京东秒送 / 美团外卖 / 淘宝闪购 / 堂食 / 抖音</td><td>' + money(posGmv) + '</td><td>' + money(posGmv) + '</td><td>—</td><td>—</td></tr>' +
        sourceRows.slice(1).map(function (row) { return '<tr><td>' + row.name + '</td><td>' + row.detail + '</td><td>' + money(row.gmv) + '</td><td>' + money(row.netGmv) + '</td><td>' + money(row.expected) + '</td><td>' + money(row.actual) + '</td></tr>'; }).join('') +
      '</tbody></table></section>' +
      '<section class="dc-card"><h2>门店经营表</h2><p class="dc-muted">用于判断门店贡献、渠道结构和待补数据；支持分页。代采 GMV 纳入平台总 GMV，但不产生 BD 分佣。</p><table class="dc-table"><thead><tr><th>门店</th><th>POS GMV</th><th>零售 GMV</th><th>代采 GMV</th><th>门店总 GMV</th><th>退款后净 GMV</th><th>决策提示</th></tr></thead><tbody>' +
        stores.slice(Math.max(0, (Number(params.get('storePage')) || 1) - 1) * 10, (Number(params.get('storePage')) || 1) * 10).map(function (row) { var tip = row.total === 0 ? '无有效数据' : row.pos === 0 ? '检查 POS 接入' : row.retail === 0 ? '关注零售经营' : row.proxy > row.retail ? '代采占比较高' : '结构正常'; return '<tr><td>' + row.name + '</td><td>' + money(row.pos) + '</td><td>' + money(row.retail) + '</td><td>' + money(row.proxy) + '</td><td>' + money(row.total) + '</td><td>' + money(row.net) + '</td><td>' + tip + '</td></tr>'; }).join('') +
      '</tbody></table>' + (stores.length > 10 ? '<div class="dc-pagination">第 ' + (Number(params.get('storePage')) || 1) + ' / ' + Math.ceil(stores.length / 10) + ' 页 ' + ((Number(params.get('storePage')) || 1) > 1 ? '<a href="?section=overview&period=' + period + '&storePage=' + ((Number(params.get('storePage')) || 1) - 1) + '">上一页</a>' : '') + ' ' + ((Number(params.get('storePage')) || 1) < Math.ceil(stores.length / 10) ? '<a href="?section=overview&period=' + period + '&storePage=' + ((Number(params.get('storePage')) || 1) + 1) + '">下一页</a>' : '') + '</div>' : '') + '</section>' +
      '<section class="dc-card"><h2>建议关注</h2><ul class="dc-decision-list"><li>优先关注高 GMV 但 POS 或零售数据缺失的门店，确认接入与映射关系。</li><li>零售预计收入与实际入账的差额用于定位清分、结算延迟；POS 暂不生成收入差额。</li><li>代采作为平台收入来源纳入 GMV，但 BD 数据中心不展示代采营业额和佣金。</li></ul></section>';
  }

  function ensureBusinessPath() {
    window.wmsPath = window.wmsPath || {
      page: function (file) {
        var internal = {
          'mdm_data_biz_overview.html': 'overview',
          'mdm_data_biz_rbt.html': 'rbt',
          'mdm_data_biz_supplier.html': 'supplier',
          'mdm_data_biz_stores.html': 'stores',
          'mdm_data_biz_marketing.html': 'marketing',
          'mdm_data_biz_store_detail.html': 'store-detail'
        };
        if (internal[file]) return './index.html?section=erp&view=' + internal[file];
        if (/^mdm/i.test(file)) return '../../MDM/' + file;
        if (/^rbt/i.test(file)) return '../../RBT/' + file;
        if (file === 'index.html') return '../../index.html';
        return '../../SCM/' + file;
      },
      asset: function (resource) {
        return '../../' + String(resource || '').replace(/^\//, '');
      }
    };
  }

  function appendStyle(href, baseUrl) {
    var absolute = new URL(href, baseUrl).href;
    if (document.querySelector('link[data-erp-style="' + absolute + '"]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = absolute;
    link.setAttribute('data-erp-style', absolute);
    document.head.appendChild(link);
  }

  function loadScript(src, baseUrl) {
    var absolute = new URL(src, baseUrl).href;
    var pathname = new URL(absolute).pathname;
    if (/\/(path-prefix|mdm-sidebar|common|pg-prd-float)\.js$/.test(pathname)) {
      return Promise.resolve();
    }
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = absolute;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  function renderErpPage(erp) {
    main.innerHTML = '<div class="dc-loading">正在加载' + erp.label + '…</div>';
    ensureBusinessPath();
    var sourceParams = new URLSearchParams(location.search);
    sourceParams.delete('section');
    sourceParams.delete('view');
    if (!sourceParams.get('period')) sourceParams.set('period', '30d');
    sourceParams.set('embed', 'data-center');
    var sourceUrl = new URL(erp.src + '?' + sourceParams.toString(), location.href).href;
    function consumeDocument(doc, baseUrl) {
        doc.querySelectorAll('link[rel="stylesheet"][href]').forEach(function (link) {
          appendStyle(link.getAttribute('href'), baseUrl);
        });
        var sourceMain = doc.querySelector('.main-content') || doc.querySelector('[data-ldb-root]');
        if (!sourceMain) throw new Error('未找到页面主体');
        sourceMain.querySelectorAll('.content-tabs,.content-divider').forEach(function (node) {
          node.remove();
        });
        sourceMain.querySelectorAll('[href],[src]').forEach(function (node) {
          ['href', 'src'].forEach(function (attr) {
            var value = node.getAttribute(attr);
            if (!value || /^(#|javascript:|data:|https?:|mailto:|tel:)/i.test(value)) return;
            var absolute = new URL(value, baseUrl);
            if (attr === 'href') {
              var file = absolute.pathname.split('/').pop();
              var internal = {
                'mdm_data_biz_overview.html': 'overview',
                'mdm_data_biz_rbt.html': 'rbt',
                'mdm_data_biz_supplier.html': 'supplier',
                'mdm_data_biz_stores.html': 'stores',
                'mdm_data_biz_marketing.html': 'marketing',
                'mdm_data_biz_store_detail.html': 'store-detail'
              };
              if (internal[file]) {
                var query = new URLSearchParams(absolute.search);
                query.set('section', 'erp');
                query.set('view', internal[file]);
                node.setAttribute(attr, './index.html?' + query.toString());
                return;
              }
            }
            node.setAttribute(attr, absolute.href);
          });
        });
        main.innerHTML = '<div class="dc-erp-content">' + sourceMain.innerHTML + '</div>';
        var scripts = Array.prototype.slice.call(doc.querySelectorAll('script[src]'));
        return scripts.reduce(function (chain, script) {
          return chain.then(function () {
            return loadScript(script.getAttribute('src'), baseUrl);
          });
        }, Promise.resolve());
    }
    function fail(error) {
      main.innerHTML = '<section class="dc-card dc-load-error"><h2>页面加载失败</h2><p>' +
        String(error && error.message ? error.message : error) +
        '</p><a href="' + sourceUrl + '">打开原页面</a></section>';
    }
    if (location.protocol === 'file:') {
      /* file:// 禁止 fetch 读取另一个本地文件；用一次性隐藏载体读取后立即移除，页面仍直接渲染主体。 */
      var carrier = document.createElement('iframe');
      carrier.setAttribute('aria-hidden', 'true');
      carrier.style.cssText = 'position:absolute;width:1px;height:1px;left:-9999px;border:0;opacity:0;';
      carrier.onload = function () {
        setTimeout(function () {
          try {
            var doc = carrier.contentDocument;
            consumeDocument(doc, sourceUrl).then(function () { carrier.remove(); }).catch(function (e) { carrier.remove(); fail(e); });
          } catch (e) {
            carrier.remove();
            fail(e);
          }
        }, 0);
      };
      carrier.onerror = function () { carrier.remove(); fail(new Error('无法读取本地页面')); };
      document.body.appendChild(carrier);
      carrier.src = sourceUrl;
      return;
    }
    fetch(sourceUrl)
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.text().then(function (html) { return { html: html, url: response.url }; });
      })
      .then(function (payload) {
        var doc = new DOMParser().parseFromString(payload.html, 'text/html');
        return consumeDocument(doc, payload.url);
      })
      .catch(fail);
  }

  if (section === 'overview') {
    view = 'overview';
    title.textContent = '概览';
    renderNav([{ id: 'overview', label: '平台概览' }], 'overview');
    renderPlatformOverview();
    return;
  }

  if (section === 'erp') {
    var erp = view === 'store-detail'
      ? { id: 'store-detail', label: '单店经营详情', src: '../../MDM/mdm_data_biz_store_detail.html' }
      : erpItems.filter(function (item) { return item.id === view; })[0] || erpItems[0];
    view = erp.id;
    title.textContent = 'ERP经营数据';
    renderNav(erpItems, 'erp');
    renderErpPage(erp);
    return;
  }

  var report = storeItems.filter(function (item) { return item.id === view; })[0] || storeItems[0];
  view = report.id;
  title.textContent = '门店报表';
  renderNav(storeItems, 'store');
  placeholder(
    '门店报表 · ' + report.label,
    '沿用现有门店报表能力；正式接入数据中台后，此处直接复用原页面、权限和数据口径。',
    '<a class="dc-store-link" href="https://report-admin.lengfenghl.org.cn' + report.path + '" target="_blank" rel="noopener">打开现有' + report.label + '</a>'
  );
})();
