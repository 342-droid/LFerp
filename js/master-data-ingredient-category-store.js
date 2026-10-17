/**
 * 主数据 · 配料类别数据
 * 配料类别页维护，基础商品库配料表的类别下拉取同一份数据。
 * 同一浏览器会话内保留增删改，新开会话恢复初始类别。
 */
(function () {
  var STORAGE_KEY = 'lf-master-data-ingredient-categories';

  function seedCategories() {
    return [
      { id: 'c1', name: '面皮原料', status: 'active' },
      { id: 'c2', name: '馅料主料', status: 'active' },
      { id: 'c3', name: '馅料辅料', status: 'active' },
      { id: 'c4', name: '加工辅料', status: 'active' },
      { id: 'c5', name: '调味料', status: 'active' },
      { id: 'c6', name: '发酵辅料', status: 'active' }
    ];
  }

  var categories = null;

  function load() {
    if (categories) return categories;
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          categories = parsed;
          return categories;
        }
      }
    } catch (err) {}
    categories = seedCategories();
    return categories;
  }

  function save() {
    if (!categories) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
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

  window.MasterDataIngredientCategoryStore = {
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
      return 'c' + (max + 1);
    }
  };
})();
