/**
 * 主数据 · 商品品牌数据
 * 商品品牌页维护，基础商品库的品牌字段读取同一份数据。
 * 同一浏览器会话内保留增删改，新开会话恢复初始品牌。
 */
(function () {
  var STORAGE_KEY = 'lf-master-data-brands';

  function seedLogo(text, color) {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">' +
      '<rect width="80" height="80" rx="12" fill="' + color + '"/>' +
      '<text x="40" y="52" text-anchor="middle" font-size="28" fill="#ffffff" font-family="PingFang SC, Microsoft YaHei, sans-serif">' + text + '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function seedBrands() {
    return [
      { id: 'b1', name: '冷丰优选', status: 'active', logo: seedLogo('冷', '#ff7019') },
      { id: 'b2', name: '产地直采', status: 'active', logo: seedLogo('产', '#67c23a') },
      { id: 'b3', name: '无品牌', status: 'active', logo: '' },
      { id: 'b4', name: '农夫山泉', status: 'active', logo: seedLogo('农', '#2f6bff') },
      { id: 'b5', name: '金龙鱼', status: 'active', logo: seedLogo('金', '#e6a23c') },
      { id: 'b6', name: '海天', status: 'active', logo: seedLogo('海', '#409eff') },
      { id: 'b7', name: '蒙牛', status: 'disabled', logo: seedLogo('蒙', '#909399') },
      { id: 'b8', name: '伊利', status: 'active', logo: seedLogo('伊', '#f56c6c') }
    ];
  }

  var brands = null;

  function load() {
    if (brands) return brands;
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          brands = parsed;
          return brands;
        }
      }
    } catch (err) {}
    brands = seedBrands();
    return brands;
  }

  function save() {
    if (!brands) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(brands));
    } catch (err) {}
  }

  function isActive(item) {
    return !item || item.status !== 'disabled';
  }

  function namesOf(list) {
    var seen = {};
    var names = [];
    list.forEach(function (item) {
      var name = String(item && item.name || '').trim();
      if (!name || seen[name]) return;
      seen[name] = true;
      names.push(name);
    });
    return names;
  }

  window.MasterDataBrandStore = {
    all: function () {
      return load();
    },
    save: save,
    names: function () {
      return namesOf(load());
    },
    activeNames: function () {
      return namesOf(load().filter(isActive));
    },
    nextId: function () {
      var max = 0;
      load().forEach(function (item) {
        var num = parseInt(String(item.id || '').replace(/\D/g, ''), 10);
        if (!isNaN(num) && num > max) max = num;
      });
      return 'b' + (max + 1);
    }
  };
})();
