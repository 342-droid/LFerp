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
    title.textContent = '经营总览';
    renderNav([{ id: 'overview', label: '经营总览' }], 'overview');
    renderErpPage(erpItems[0]);
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
