/**
 * 供应链菜单专用：商品单位枚举
 * 仅供顶部「供应链」下页面使用，勿复用到商品/营销等其他模块。
 * 一级分类若配置了商品单位，业务下拉仅允许选该分类下的单位；未配置时回退全量枚举。
 */
(function (global) {
  var UNITS = [
    '箱', '件', '垛', '提', '瓶', '罐', '盒', 'ml', '袋', '包', '克', '颗', 'kg', '斤', '筐',
    '个', '只', '尾', '桶', '片', '泵瓶', '支', '卷', '条', '双', '副', '台', '套', '块',
    '平方米', '本', '册', '张', '粒', '棵', '次', '单'
  ];

  function allUnits() {
    return UNITS.slice();
  }

  function withSelected(base, selected) {
    var units = (base || []).slice();
    if (selected && units.indexOf(selected) < 0) units.unshift(selected);
    return units;
  }

  /** 按分类（任意级）解析可选单位名列表；一级未配置则返回全量 */
  function forCategory(categoryId) {
    var store = global.MasterDataCategoryStore;
    if (!store || !categoryId || typeof store.listGoodsUnitNames !== 'function') {
      return allUnits();
    }
    var names = store.listGoodsUnitNames(categoryId);
    if (names && names.length) return names.slice();
    return allUnits();
  }

  function forCategoryName(l4Name) {
    var store = global.MasterDataCategoryStore;
    if (!store || !l4Name) return allUnits();
    var node = null;
    (store.getCategories() || []).some(function (item) {
      if (item.level === 4 && item.name === l4Name) {
        node = item;
        return true;
      }
      return false;
    });
    return forCategory(node && node.id);
  }

  global.MasterDataGoodsUnits = {
    list: allUnits(),
    withSelected: function (selected) {
      return withSelected(allUnits(), selected);
    },
    forCategory: forCategory,
    forCategoryName: forCategoryName,
    withSelectedForCategory: function (categoryId, selected) {
      return withSelected(forCategory(categoryId), selected);
    },
    withSelectedForCategoryName: function (l4Name, selected) {
      return withSelected(forCategoryName(l4Name), selected);
    }
  };
})(window);
