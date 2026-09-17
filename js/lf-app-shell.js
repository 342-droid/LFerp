/**
 * 用户 APP / 门店 APP 壳隔离。
 * 进货订单列表、详情、返回不得跨 APP 跳转。
 */
(function (global) {
  var KEY = 'lf_app_shell_v1';

  function pathName() {
    return (global.location && global.location.pathname) || '';
  }

  function searchParams() {
    try {
      return new URLSearchParams((global.location && global.location.search) || '');
    } catch (e) {
      return new URLSearchParams();
    }
  }

  function pathShell() {
    if (/\/store-app\//i.test(pathName())) return 'store-app';
    return '';
  }

  function queryShell() {
    var p = searchParams();
    if (p.get('port') === 'store-app' || p.get('from') === 'store-app') return 'store-app';
    if (p.get('port') === 'user-app' || p.get('from') === 'user-app') return 'user-app';
    return '';
  }

  function read() {
    try {
      return global.sessionStorage.getItem(KEY) || '';
    } catch (e) {
      return '';
    }
  }

  function write(shell) {
    if (!shell) return;
    try {
      global.sessionStorage.setItem(KEY, shell);
    } catch (e) {
      /* ignore */
    }
  }

  function current() {
    return pathShell() || queryShell() || read() || 'user-app';
  }

  function remember(shell) {
    write(shell);
    return current();
  }

  function isStoreApp() {
    return current() === 'store-app';
  }

  function restockOrdersHref() {
    return /\/store-app\//i.test(pathName())
      ? 'restock-orders.html'
      : '../../store-app/h5/restock-orders.html';
  }

  function restockDetailHref(orderNo) {
    var q = orderNo ? '?orderNo=' + encodeURIComponent(orderNo) : '';
    return /\/store-app\//i.test(pathName())
      ? 'restock-order-detail.html' + q
      : '../../store-app/h5/restock-order-detail.html' + q;
  }

  function isRestockOrdersPage() {
    return /restock-orders\.html/i.test(pathName());
  }

  function isRestockDetailPage() {
    return /restock-order-detail\.html/i.test(pathName());
  }

  function userAppH5(file) {
    file = String(file || '');
    return /\/store-app\//i.test(pathName()) ? '../../user-app/h5/' + file : file;
  }

  function userAppAsset(file) {
    file = String(file || '');
    return /\/store-app\//i.test(pathName()) ? '../../user-app/assets/' + file : '../assets/' + file;
  }

  function userAppPage(href) {
    href = String(href || '');
    if (!href || !/\/store-app\//i.test(pathName())) return href;
    if (/user-app\/h5\//.test(href) || /^https?:/i.test(href) || href.charAt(0) === '/') return href;
    return '../../user-app/h5/' + href.replace(/^\.\//, '');
  }

  function resolveAsset(src) {
    src = String(src || '');
    if (!src) return userAppAsset('order-product-1.svg');
    if (!/\/store-app\//i.test(pathName())) return src;
    if (/user-app\//.test(src) || /^https?:/i.test(src) || src.charAt(0) === '/') return src;
    if (src.indexOf('../assets/') === 0) return '../../user-app/assets/' + src.slice(10);
    if (src.indexOf('./assets/') === 0) return '../../user-app/assets/' + src.slice(9);
    if (src.indexOf('assets/') === 0) return '../../user-app/' + src;
    return src;
  }

  function boot() {
    var fromPath = pathShell();
    if (fromPath) {
      write(fromPath);
      return;
    }
    var fromQuery = queryShell();
    if (fromQuery) {
      write(fromQuery);
      return;
    }
    /* 用户 APP 零售入口清门店壳，避免同一页签把进货订单带回用户订单 */
    if (/\/user-app\/h5\/(home|profile|shop)\.html/i.test(pathName())) {
      write('user-app');
    }
  }

  boot();

  global.LfAppShell = {
    KEY: KEY,
    current: current,
    remember: remember,
    isStoreApp: isStoreApp,
    restockOrdersHref: restockOrdersHref,
    restockDetailHref: restockDetailHref,
    isRestockOrdersPage: isRestockOrdersPage,
    isRestockDetailPage: isRestockDetailPage,
    userAppH5: userAppH5,
    userAppAsset: userAppAsset,
    userAppPage: userAppPage,
    resolveAsset: resolveAsset
  };
})(typeof window !== 'undefined' ? window : this);
