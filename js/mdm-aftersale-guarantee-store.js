/**
 * 售后保障期主数据（平台兜底 → 类目默认 → SPU 覆盖）
 */
(function (global) {
  var KEY = 'lf_aftersale_guarantee_v1';

  var DEFAULT = {
    platformDays: 7,
    categories: [
      { id: 'CAT-318568861735600128', name: '新鲜蔬菜', days: 3, inheritParent: false },
      { id: 'CAT-318570755371581440', name: '时令水果', days: 3, inheritParent: false },
      { id: 'CAT-318570903677976576', name: '肉禽蛋', days: 5, inheritParent: false },
      { id: 'CAT-318571213641236480', name: '水产海鲜', days: 2, inheritParent: false },
      { id: 'CAT-318571881810640896', name: '休闲零食', days: 7, inheritParent: false },
      { id: 'CAT-318572119849975808', name: '粮油调味', days: 15, inheritParent: false },
      { id: 'CAT-318572335181348864', name: '酒水饮料', days: 15, inheritParent: false },
      { id: 'CAT-318572583630946304', name: '乳饮面包', days: 5, inheritParent: false },
      { id: 'CAT-318572832655163392', name: '方便速食', days: 7, inheritParent: false }
    ],
    spus: [
      {
        id: 'SPU00196',
        name: '火龙果',
        categoryId: 'CAT-318570755371581440',
        categoryName: '时令水果',
        mode: 'custom',
        days: 2
      },
      {
        id: 'SPU00184',
        name: '白芭乐-快递-ss',
        categoryId: 'CAT-318570755371581440',
        categoryName: '时令水果',
        mode: 'category',
        days: null
      },
      {
        id: 'SPU00204',
        name: '低糖养乐多',
        categoryId: 'CAT-318572583630946304',
        categoryName: '乳饮面包',
        mode: 'custom',
        days: 10
      }
    ]
  };

  function safeParse(raw) {
    try {
      var v = JSON.parse(raw);
      return v && typeof v === 'object' ? v : null;
    } catch (e) {
      return null;
    }
  }

  function cloneDefault() {
    return JSON.parse(JSON.stringify(DEFAULT));
  }

  function load() {
    var raw = null;
    try {
      raw = global.localStorage && global.localStorage.getItem(KEY);
    } catch (e) {
      raw = null;
    }
    var saved = raw ? safeParse(raw) : null;
    if (!saved) return cloneDefault();
    var out = cloneDefault();
    if (typeof saved.platformDays === 'number' && saved.platformDays >= 0) {
      out.platformDays = saved.platformDays;
    }
    if (Array.isArray(saved.categories) && saved.categories.length) {
      out.categories = saved.categories;
    }
    if (Array.isArray(saved.spus)) {
      out.spus = saved.spus;
    }
    return out;
  }

  function save(data) {
    try {
      if (global.localStorage) global.localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {}
    return data;
  }

  function categoryDays(state, categoryId) {
    var list = (state && state.categories) || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === categoryId) return Number(list[i].days) || 0;
    }
    return Number(state && state.platformDays) || 0;
  }

  /** 生效保障天数：SPU 覆盖 > 类目 > 平台兜底 */
  function resolveDays(state, spuId, categoryId) {
    var spus = (state && state.spus) || [];
    for (var i = 0; i < spus.length; i++) {
      if (spus[i].id === spuId) {
        if (spus[i].mode === 'custom' && spus[i].days != null) {
          return Number(spus[i].days) || 0;
        }
        return categoryDays(state, spus[i].categoryId || categoryId);
      }
    }
    if (categoryId) return categoryDays(state, categoryId);
    return Number(state && state.platformDays) || 0;
  }

  global.LFAftersaleGuaranteeStore = {
    KEY: KEY,
    load: load,
    save: save,
    resolveDays: resolveDays,
    categoryDays: categoryDays,
    cloneDefault: cloneDefault
  };
})(typeof window !== 'undefined' ? window : this);
