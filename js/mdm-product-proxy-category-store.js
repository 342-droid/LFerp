/**
 * 代采商城类目 — 共享数据层（扁平表 + 商品绑定）
 */
(function () {
  var ASSET = '../user-app/assets/restock/';
  var STORAGE_KEY = 'mdm_proxy_category_flat_v2';

  var PRIMARY_LIST = [
    { id: 'l1-veg', label: '蔬菜水果', img: ASSET + 'category-icon-veg.svg', treeKey: 'veg' },
    { id: 'l1-meat', label: '鲜肉禽水产', img: ASSET + 'category-icon-meat.svg', treeKey: 'meat' },
    { id: 'l1-frozen', label: '冻肉禽水产', img: ASSET + 'category-icon-frozen.svg', treeKey: 'frozen' },
    { id: 'l1-grain', label: '米面油蛋', img: ASSET + 'category-icon-grain.svg', treeKey: 'grain' },
    { id: 'l1-drink', label: '酒水饮料', img: ASSET + 'category-icon-drink.svg', treeKey: 'drink' },
    { id: 'l1-seasoning', label: '调料调味品', img: ASSET + 'category-icon-seasoning.svg' },
    { id: 'l1-prepared', label: '熟食预制菜', img: ASSET + 'category-icon-prepared.svg' },
    { id: 'l1-semi-frozen', label: '冷冻半成品', img: ASSET + 'category-icon-semi-frozen.svg' },
    { id: 'l1-kitchenware', label: '餐厨用品', img: ASSET + 'category-icon-kitchenware.svg' },
    { id: 'l1-exclusive', label: '快驴独家', img: ASSET + 'category-icon-exclusive.svg' },
    { id: 'l1-tofu', label: '豆腐豆制品', img: ASSET + 'category-icon-tofu.svg' },
    { id: 'l1-staple', label: '主食面点', img: ASSET + 'category-icon-staple.svg' },
    { id: 'l1-dry-spice', label: '干货/香料', img: ASSET + 'category-icon-dry-spice.svg' },
    { id: 'l1-pickle', label: '腌菜酱菜', img: ASSET + 'category-icon-pickle.svg' },
    { id: 'l1-sauce', label: '酱油醋', img: ASSET + 'category-icon-sauce.svg' },
    { id: 'l1-meatball', label: '丸子肠串', img: ASSET + 'category-icon-meatball.svg' },
    { id: 'l1-bakery', label: '焙烤食品', img: ASSET + 'category-icon-bakery.svg' }
  ];

  var CATEGORY_TREE = {
    veg: { secondary: [
      { id: 'hot', label: '爆品', hot: true, tags: ['全部', '今日特价', '高回购'] },
      { id: 'leaf', label: '叶菜类', tags: ['全部', '油麦菜', '生菜', '芹菜', '菠菜', '白菜'] },
      { id: 'root', label: '根茎类', tags: ['全部', '土豆', '胡萝卜', '红薯'] },
      { id: 'melon', label: '茄果瓜类', tags: ['全部', '茄子', '西红柿', '黄瓜'] }
    ]},
    meat: { secondary: [
      { id: 'hot', label: '爆品', hot: true, tags: ['全部', '高回购'] },
      { id: 'pork', label: '猪肉', tags: ['全部', '五花', '里脊', '排骨'] },
      { id: 'beef', label: '牛肉', tags: ['全部', '牛腩', '牛腱'] },
      { id: 'chicken', label: '禽类', tags: ['全部', '鸡腿', '鸡翅'] }
    ]},
    frozen: { secondary: [
      { id: 'hot', label: '爆品', hot: true, tags: ['全部'] },
      { id: 'frozen-meat', label: '冻肉', tags: ['全部', '猪肉', '牛肉'] }
    ]},
    grain: { secondary: [
      { id: 'hot', label: '爆品', hot: true, tags: ['全部'] },
      { id: 'rice', label: '米面', tags: ['全部', '大米', '面粉'] },
      { id: 'egg', label: '蛋品', tags: ['全部', '鸡蛋', '鸭蛋'] }
    ]},
    drink: { secondary: [
      { id: 'hot', label: '爆品', hot: true, tags: ['全部'] },
      { id: 'water', label: '饮用水', tags: ['全部', '矿泉水', '纯净水'] },
      { id: 'soda', label: '碳酸饮料', tags: ['全部', '可乐', '雪碧'] }
    ]}
  };

  var GENERIC_L2 = [
    { label: '爆品推荐', hot: true, tags: ['全部', '今日特价'] },
    { label: '常规品类', tags: ['全部', '热销'] },
    { label: '其他', tags: ['全部', '其他'] }
  ];

  var DEMO_PRODUCTS = [
    { code: 'SPU00085', name: '圆茄 优质', img: ASSET + 'product-eggplant-round.svg' },
    { code: 'SPU00078', name: '长茄子 广茄', img: ASSET + 'product-eggplant-long.svg' },
    { code: 'SPU00088', name: '红壳黄心鲜鸡蛋', img: ASSET + 'product-egg.svg' },
    { code: 'SPU00082', name: '可口可乐摩登罐', img: ASSET + 'product-cola.svg' },
    { code: 'SPU00090', name: '东北大米 5kg', img: ASSET + 'category-icon-grain.svg' },
    { code: 'SPU00067', name: '普罗旺斯西红柿', img: ASSET + 'product-tomato.svg' }
  ];

  var data = { categories: [], productBindings: {} };

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function buildFlatSeed() {
    var list = [];
    var bindings = {};
    var productIdx = 0;

    PRIMARY_LIST.forEach(function (item, idx) {
      var l1Id = item.id;
      list.push({
        id: l1Id,
        name: item.label,
        level: 1,
        parent_id: null,
        path: item.label,
        path_ids: [l1Id],
        icon: item.img,
        sort: (idx + 1) * 10,
        status: idx === 2 ? 'off_shelf' : 'on_shelf',
        is_leaf: false,
        is_hot: false,
        product_count: 0,
        created_at: '2024-08-' + pad(14 - (idx % 10)) + ' 10:' + pad(40 - idx)
      });

      var secList = item.treeKey && CATEGORY_TREE[item.treeKey]
        ? CATEGORY_TREE[item.treeKey].secondary
        : GENERIC_L2;

      secList.forEach(function (sec, si) {
        var l2Id = l1Id + '-l2-' + (sec.id || 'g' + si);
        var l2Name = sec.label;
        list.push({
          id: l2Id,
          name: l2Name,
          level: 2,
          parent_id: l1Id,
          path: item.label + '/' + l2Name,
          path_ids: [l1Id, l2Id],
          icon: '',
          sort: (si + 1) * 10,
          status: 'on_shelf',
          is_leaf: false,
          is_hot: !!sec.hot,
          product_count: 0,
          created_at: '2024-08-' + pad(5 + si) + ' 10:00'
        });

        (sec.tags || []).filter(function (t) { return t !== '全部'; }).forEach(function (tag, ti) {
          var l3Id = l2Id + '-l3-' + ti;
          var l3 = {
            id: l3Id,
            name: tag,
            level: 3,
            parent_id: l2Id,
            path: item.label + '/' + l2Name + '/' + tag,
            path_ids: [l1Id, l2Id, l3Id],
            icon: '',
            sort: (ti + 1) * 10,
            status: 'on_shelf',
            is_leaf: true,
            is_hot: false,
            product_count: 0,
            created_at: '2024-07-' + pad(20 - (ti % 10)) + ' ' + pad(9 + ti) + ':00'
          };
          list.push(l3);

          if (productIdx % 3 === 0 && DEMO_PRODUCTS[productIdx % DEMO_PRODUCTS.length]) {
            bindings[l3Id] = [DEMO_PRODUCTS[productIdx % DEMO_PRODUCTS.length]];
            productIdx += 1;
          }
        });
      });
    });

    recomputeCounts(list, bindings);
    return { categories: list, productBindings: bindings };
  }

  function recomputeCounts(categories, bindings) {
    categories.forEach(function (c) {
      if (c.level === 3) c.product_count = (bindings[c.id] || []).length;
    });
    categories.forEach(function (c) {
      if (c.level === 2) {
        c.product_count = categories
          .filter(function (x) { return x.parent_id === c.id; })
          .reduce(function (s, x) { return s + x.product_count; }, 0);
      }
    });
    categories.forEach(function (c) {
      if (c.level === 1) {
        c.product_count = categories
          .filter(function (x) { return x.parent_id === c.id; })
          .reduce(function (s, x) { return s + x.product_count; }, 0);
      }
    });
  }

  function getNode(id) {
    for (var i = 0; i < data.categories.length; i++) {
      if (data.categories[i].id === id) return data.categories[i];
    }
    return null;
  }

  function getChildren(parentId) {
    return data.categories
      .filter(function (c) { return c.parent_id === parentId; })
      .sort(function (a, b) { return a.sort - b.sort; });
  }

  function collectDescendantIds(id) {
    var ids = [id];
    getChildren(id).forEach(function (child) {
      ids = ids.concat(collectDescendantIds(child.id));
    });
    return ids;
  }

  function hasBindingsOnNode(id) {
    return (data.productBindings[id] || []).length > 0;
  }

  function hasBindingsInTree(id) {
    return collectDescendantIds(id).some(function (did) {
      return hasBindingsOnNode(did);
    });
  }

  function isOnShelfChain(node) {
    var cur = node;
    while (cur) {
      if (cur.status !== 'on_shelf') return false;
      cur = cur.parent_id ? getNode(cur.parent_id) : null;
    }
    return true;
  }

  function isSelectableL3(id) {
    var node = getNode(id);
    if (!node || node.level !== 3 || !node.is_leaf) return false;
    return isOnShelfChain(node);
  }

  function rebuildPath(node) {
    var names = [];
    var ids = [];
    var cur = node;
    while (cur) {
      names.unshift(cur.name);
      ids.unshift(cur.id);
      cur = cur.parent_id ? getNode(cur.parent_id) : null;
    }
    node.path = names.join('/');
    node.path_ids = ids;
    getChildren(node.id).forEach(rebuildPath);
  }

  var store = {
    BLOCK_MSG: '当前类目及下级类目已关联商品，请先解除绑定后再操作',

    load: function () {
      try {
        var raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw) {
          var parsed = JSON.parse(raw);
          data.categories = parsed.categories || [];
          data.productBindings = parsed.productBindings || {};
          recomputeCounts(data.categories, data.productBindings);
          return;
        }
      } catch (e) { /* ignore */ }
      var seed = buildFlatSeed();
      data.categories = seed.categories;
      data.productBindings = seed.productBindings;
      store.save();
    },

    save: function () {
      recomputeCounts(data.categories, data.productBindings);
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
          categories: data.categories,
          productBindings: data.productBindings
        }));
      } catch (e) { /* ignore */ }
    },

    getCategories: function () { return data.categories; },
    getProductBindings: function () { return data.productBindings; },
    getNode: getNode,
    getChildren: getChildren,

    getByLevel: function (level) {
      return data.categories
        .filter(function (c) { return c.level === level; })
        .sort(function (a, b) { return a.sort - b.sort; });
    },

    getBindings: function (l3Id) {
      return (data.productBindings[l3Id] || []).slice();
    },

    bindProduct: function (l3Id, product) {
      if (!l3Id || !product || !product.code) return false;
      if (!data.productBindings[l3Id]) data.productBindings[l3Id] = [];
      if (data.productBindings[l3Id].some(function (p) { return p.code === product.code; })) return false;
      data.productBindings[l3Id].push({
        code: product.code,
        name: product.name || product.code,
        img: product.img || ''
      });
      store.save();
      return true;
    },

    unbindProduct: function (l3Id, code) {
      if (!l3Id || !code) return;
      data.productBindings[l3Id] = (data.productBindings[l3Id] || []).filter(function (p) {
        return p.code !== code;
      });
      store.save();
    },

    rebindProduct: function (oldL3Id, newL3Id, product) {
      if (oldL3Id) store.unbindProduct(oldL3Id, product.code);
      if (newL3Id) store.bindProduct(newL3Id, product);
    },

    collectDescendantIds: collectDescendantIds,
    hasBindingsInTree: hasBindingsInTree,
    canDelete: function (id) { return !hasBindingsInTree(id); },
    canOffShelf: function (id) { return !hasBindingsInTree(id); },

    isSelectableL3: isSelectableL3,

    getSelectableL3List: function () {
      return data.categories.filter(function (c) {
        return c.level === 3 && isSelectableL3(c.id);
      }).sort(function (a, b) { return a.path.localeCompare(b.path, 'zh-CN'); });
    },

    searchSelectableL3: function (keyword) {
      var kw = String(keyword || '').trim().toLowerCase();
      var list = store.getSelectableL3List();
      if (!kw) return list.slice(0, 50);
      return list.filter(function (c) {
        return c.path.toLowerCase().indexOf(kw) >= 0 || c.name.toLowerCase().indexOf(kw) >= 0;
      }).slice(0, 50);
    },

    rebuildPath: rebuildPath,

    addCategory: function (node) {
      data.categories.push(node);
      store.save();
    },

    updateCategory: function (node) {
      rebuildPath(node);
      store.save();
    },

    removeCategoryTree: function (id) {
      var ids = collectDescendantIds(id);
      ids.forEach(function (did) { delete data.productBindings[did]; });
      data.categories = data.categories.filter(function (c) { return ids.indexOf(c.id) < 0; });
      store.save();
      return ids;
    },

    setCategoryStatus: function (id, status) {
      var node = getNode(id);
      if (!node) return;
      node.status = status;
      if (status === 'off_shelf' && node.level < 3) {
        collectDescendantIds(id).forEach(function (did) {
          var n = getNode(did);
          if (n) n.status = 'off_shelf';
        });
      }
      store.save();
    },

    getDemoProducts: function () { return DEMO_PRODUCTS.slice(); }
  };

  window.MdmProxyCategoryStore = store;
  store.load();
})();
