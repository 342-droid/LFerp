(function () {
  'use strict';

  var params = new URLSearchParams(location.search);
  var section = params.get('section') || 'overview';
  var view = params.get('view') || 'overview';
  if (section === 'erp') section = 'overview';
  if (['overview', 'store'].indexOf(section) < 0) section = 'overview';

  var erpItems = [
    { id: 'overview', label: '平台经营总概览', src: '../../MDM/mdm_data_biz_overview.html' },
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

  function overviewUrl(period, from, to, page) {
    var query = new URLSearchParams({ section: 'overview', period: period });
    if (period === 'custom') { query.set('from', from); query.set('to', to); }
    if (page > 1) query.set('storePage', String(page));
    return '?' + query.toString();
  }

  function renderPlatformOverview() {
    var Center = window.MdmDataBizCenter;
    var period = ['today', 'yesterday', '7d', '30d', 'custom'].indexOf(params.get('period')) >= 0
      ? params.get('period') : '30d';
    var asOfDay = Center.AS_OF.slice(0, 10);
    var from = params.get('from') || asOfDay;
    var to = params.get('to') || asOfDay;
    if (period === 'custom' && (!/^\d{4}-\d{2}-\d{2}$/.test(from) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to || to > asOfDay)) {
      period = '30d';
      from = asOfDay;
      to = asOfDay;
    }
    var filters = { period: period, from: from, to: to };
    var snap = Center ? Center.erpSnapshot(Object.assign({}, filters, { channel: 'all' })) : null;
    var retail = Center ? Center.erpSnapshot(Object.assign({}, filters, { channel: 'retail' })) : null;
    var proxy = Center ? Center.erpSnapshot(Object.assign({}, filters, { channel: 'proxy' })) : null;
    var pos = Center ? Center.posSnapshot(Object.assign({}, filters, { channel: 'all' })) : { rows: [] };
    if (!snap) {
      placeholder('平台经营总概览', '数据源尚未加载，请刷新页面重试。');
      return;
    }
    var posGmv = pos.rows.reduce(function (sum, row) { return sum + Number(row.billAmount || 0); }, 0);
    var posDineGmv = pos.rows.reduce(function (sum, row) { return sum + Number(row.dineAmount || 0); }, 0);
    var posTakeoutGmv = pos.rows.reduce(function (sum, row) { return sum + Number(row.takeoutAmount || 0); }, 0);
    var retailGmv = Number(retail.salesTotal || 0);
    var proxyGmv = Number(proxy.salesTotal || 0);
    var refundRetail = Number(retail.refundAmount || 0);
    var refundProxy = Number(proxy.refundAmount || 0);
    var retailNetGmv = retailGmv - refundRetail;
    var proxyNetGmv = proxyGmv - refundProxy;
    var totalGmv = posGmv + retailGmv + proxyGmv;
    var totalNetGmv = totalGmv - refundRetail - refundProxy;
    var retailExpected = Number(retail.platformCommissionExpected || 0);
    var proxyExpected = Number(proxy.platformCommissionExpected || 0);
    var retailActual = Number(retail.platformCommissionActual || 0);
    var proxyActual = Number(proxy.platformCommissionActual || 0);
    var storeMap = {};
    function addStore(name, key, value) {
      if (!name) return;
      storeMap[name] = storeMap[name] || { name: name, pos: 0, retail: 0, proxy: 0, refund: 0 };
      storeMap[name][key] += Number(value || 0);
    }
    pos.rows.forEach(function (row) {
      var mapped = (Center.POS_STORE_MAP || []).filter(function (item) { return item.posName === row.storeName; })[0];
      addStore(mapped && mapped.erpName || row.storeName, 'pos', row.billAmount);
    });
    (snap.storeSales || []).forEach(function (row) { addStore(row.storeName, 'retail', row.sales); });
    (snap.storeProxy || []).forEach(function (row) { addStore(row.storeName, 'proxy', row.sales); });
    (snap.aftersaleDetails || []).filter(function (row) { return Number(row.refundAmount) > 0; })
      .forEach(function (row) { addStore(row.storeName, 'refund', row.refundAmount); });
    var stores = Object.keys(storeMap).map(function (name) {
      var row = storeMap[name];
      row.total = row.pos + row.retail + row.proxy;
      row.net = Math.max(0, row.total - row.refund);
      return row;
    }).sort(function (a, b) { return b.total - a.total; });
    var sourceRows = [
      { name: '食亨POS', detail: '堂食 / 外卖（美团外卖、京东秒送、淘宝闪购）', gmv: posGmv, income: null },
      { name: 'ERP · 零售', detail: '商城 / 直播', gmv: retailGmv, netGmv: retailNetGmv, expected: retailExpected, actual: retailActual },
      { name: 'ERP · 代采', detail: '门店进货订单，计入平台 GMV', gmv: proxyGmv, netGmv: proxyNetGmv, expected: proxyExpected, actual: proxyActual }
    ];
    var periods = [
      { key: 'today', label: '今日' }, { key: 'yesterday', label: '昨日' },
      { key: '7d', label: '近7天' }, { key: '30d', label: '近30天' }
    ];
    var dateControls = '<section class="dc-card dc-date-filter"><strong>统计日期</strong><div class="dc-date-options">' +
      periods.map(function (item) { return '<a class="' + (period === item.key ? 'is-active' : '') +
        '" href="' + overviewUrl(item.key, '', '', 1) + '">' + item.label + '</a>'; }).join('') +
      '<button type="button" data-custom-toggle class="' + (period === 'custom' ? 'is-active' : '') + '">自定义</button></div>' +
      '<div class="dc-custom-range" data-custom-range' + (period === 'custom' ? '' : ' hidden') + '>' +
      '<input type="date" data-from max="' + asOfDay + '" value="' + from + '"><span>至</span>' +
      '<input type="date" data-to max="' + asOfDay + '" value="' + to + '">' +
      '<button type="button" data-custom-apply>应用</button><span data-date-error></span></div>' +
      '<small>数据截止 ' + Center.AS_OF.replace('T', ' ').replace('+08:00', '') + '（北京时间）· 原型示例数据</small></section>';
    main.innerHTML =
      '<div class="dc-page-head"><h1>平台经营总概览</h1><p>平台总 GMV = 食亨POS GMV + ERP GMV + 抖音 GMV（有数据时）。退款后净 GMV = GMV - 成功退款金额。</p></div>' +
      dateControls +
      '<section class="dc-card dc-overview-note"><strong>指标口径</strong><p>食亨POS 包含堂食和外卖，外卖包含美团外卖、京东秒送、淘宝闪购；ERP 和抖音订单独立统计，当前无跨系统订单。食亨POS 仅展示门店通过收银系统产生的 GMV；商城、直播和代采展示平台预计收入与实际已入账收入；代采计入平台 GMV，但不计入 BD 佣金。</p></section>' +
      '<section class="dc-overview-kpis">' +
        '<div class="dc-card"><span>平台总 GMV</span><strong>' + money(totalGmv) + '</strong><small>退款后净 GMV ' + money(totalNetGmv) + ' · POS ' + money(posGmv) + ' · 零售 ' + money(retailGmv) + ' · 代采 ' + money(proxyGmv) + '</small></div>' +
        '<div class="dc-card"><span>平台预计收入</span><strong>' + money(retailExpected + proxyExpected) + '</strong><small>零售 ' + money(retailExpected) + ' · 代采 ' + money(proxyExpected) + ' · POS 暂无法计算</small></div>' +
        '<div class="dc-card"><span>平台当前收入</span><strong>' + money(retailActual + proxyActual) + '</strong><small>零售 ' + money(retailActual) + ' · 代采 ' + money(proxyActual) + ' · POS 暂无法计算</small></div>' +
      '</section>' +
      '<section class="dc-card"><h2>收入来源拆分</h2><p class="dc-muted">食亨POS和ERP分项是所属来源的拆分行，不重复计入平台合计；抖音当前示例无记录。</p><table class="dc-table"><thead><tr><th>来源</th><th>明细</th><th>GMV</th><th>退款后净 GMV</th><th>预计收入</th><th>实际已入账</th></tr></thead><tbody>' +
        '<tr><td>食亨POS</td><td>堂食 / 外卖（美团外卖、京东秒送、淘宝闪购）</td><td>' + money(posGmv) + '</td><td>' + money(posGmv) + '</td><td>—</td><td>—</td></tr>' +
        '<tr><td>食亨POS · 堂食</td><td>堂食订单</td><td>' + money(posDineGmv) + '</td><td>' + money(posDineGmv) + '</td><td>—</td><td>—</td></tr>' +
        '<tr><td>食亨POS · 外卖</td><td>美团外卖 / 京东秒送 / 淘宝闪购；渠道金额待原始记录拆分</td><td>' + money(posTakeoutGmv) + '</td><td>' + money(posTakeoutGmv) + '</td><td>—</td><td>—</td></tr>' +
        '<tr><td>ERP</td><td>零售 / 代采</td><td>' + money(retailGmv + proxyGmv) + '</td><td>' + money(retailNetGmv + proxyNetGmv) + '</td><td>' + money(retailExpected + proxyExpected) + '</td><td>' + money(retailActual + proxyActual) + '</td></tr>' +
        '<tr><td>抖音</td><td>独立订单来源，当前示例无记录</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>' +
        sourceRows.slice(1).map(function (row) { return '<tr><td>' + row.name + '</td><td>' + row.detail + '</td><td>' + money(row.gmv) + '</td><td>' + money(row.netGmv) + '</td><td>' + money(row.expected) + '</td><td>' + money(row.actual) + '</td></tr>'; }).join('') +
      '</tbody></table></section>' +
      '<section class="dc-card"><h2>门店经营表</h2><p class="dc-muted">用于判断门店贡献、渠道结构和待补数据；支持分页。代采 GMV 纳入平台总 GMV，但不产生 BD 分佣。</p><table class="dc-table"><thead><tr><th>门店</th><th>POS GMV</th><th>零售 GMV</th><th>代采 GMV</th><th>门店总 GMV</th><th>退款后净 GMV</th><th>决策提示</th></tr></thead><tbody>' +
        stores.slice(Math.max(0, (Number(params.get('storePage')) || 1) - 1) * 10, (Number(params.get('storePage')) || 1) * 10).map(function (row) { var tip = row.total === 0 ? '无有效数据' : row.pos === 0 ? '检查 POS 接入' : row.retail === 0 ? '关注零售经营' : row.proxy > row.retail ? '代采占比较高' : '结构正常'; return '<tr><td>' + row.name + '</td><td>' + money(row.pos) + '</td><td>' + money(row.retail) + '</td><td>' + money(row.proxy) + '</td><td>' + money(row.total) + '</td><td>' + money(row.net) + '</td><td>' + tip + '</td></tr>'; }).join('') +
      '</tbody></table>' + (stores.length > 10 ? '<div class="dc-pagination">第 ' + (Number(params.get('storePage')) || 1) + ' / ' + Math.ceil(stores.length / 10) + ' 页 ' + ((Number(params.get('storePage')) || 1) > 1 ? '<a href="' + overviewUrl(period, from, to, (Number(params.get('storePage')) || 1) - 1) + '">上一页</a>' : '') + ' ' + ((Number(params.get('storePage')) || 1) < Math.ceil(stores.length / 10) ? '<a href="' + overviewUrl(period, from, to, (Number(params.get('storePage')) || 1) + 1) + '">下一页</a>' : '') + '</div>' : '') + '</section>' +
      '<section class="dc-card"><h2>建议关注</h2><ul class="dc-decision-list"><li>优先关注高 GMV 但 POS 或零售数据缺失的门店，确认接入与映射关系。</li><li>零售预计收入与实际入账的差额用于定位清分、结算延迟；POS 暂不生成收入差额。</li><li>代采作为平台收入来源纳入 GMV，但 BD 数据中心不展示代采营业额和佣金。</li></ul></section>';
    main.querySelector('[data-custom-toggle]').addEventListener('click', function () {
      main.querySelector('[data-custom-range]').hidden = false;
    });
    main.querySelector('[data-custom-apply]').addEventListener('click', function () {
      var first = main.querySelector('[data-from]').value;
      var last = main.querySelector('[data-to]').value;
      if (!first || !last || first > last || last > asOfDay) {
        main.querySelector('[data-date-error]').textContent = '请选择有效日期，结束日期不得晚于数据截止日';
        return;
      }
      location.href = overviewUrl('custom', first, last, 1);
    });
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
        if (internal[file]) return './index.html?section=overview&view=' + internal[file];
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

  function renderErpPage(erp, combined) {
    if (combined) main.insertAdjacentHTML('beforeend', '<section class="dc-card dc-erp-intro"><h2>ERP经营数据</h2><p>与平台概览使用同一统计日期；以下为 ERP 业务明细，门店、事业线和订单渠道仅作用于 ERP 明细。</p></section><div data-erp-mount class="dc-loading">正在加载 ERP 经营数据…</div>');
    else main.innerHTML = '<div class="dc-loading">正在加载' + erp.label + '…</div>';
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
                query.set('section', 'overview');
                query.set('view', internal[file]);
                node.setAttribute(attr, './index.html?' + query.toString());
                return;
              }
            }
            node.setAttribute(attr, absolute.href);
          });
        });
        var content = '<div class="dc-erp-content">' + sourceMain.innerHTML + '</div>';
        if (combined) main.querySelector('[data-erp-mount]').outerHTML = content;
        else main.innerHTML = content;
        var scripts = Array.prototype.slice.call(doc.querySelectorAll('script[src]'));
        return scripts.reduce(function (chain, script) {
          return chain.then(function () {
            return loadScript(script.getAttribute('src'), baseUrl);
          });
        }, Promise.resolve());
    }
    function fail(error) {
      var target = combined ? main.querySelector('[data-erp-mount]') : main;
      target.innerHTML = '<section class="dc-card dc-load-error"><h2>页面加载失败</h2><p>' +
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
    var erp = view === 'store-detail'
      ? { id: 'store-detail', label: '单店经营详情', src: '../../MDM/mdm_data_biz_store_detail.html' }
      : erpItems.filter(function (item) { return item.id === view; })[0] || erpItems[0];
    view = erp.id;
    title.textContent = '平台经营数据';
    renderNav(erpItems, 'overview');
    if (view === 'overview') { renderPlatformOverview(); renderErpPage(erp, true); }
    else renderErpPage(erp, false);
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
