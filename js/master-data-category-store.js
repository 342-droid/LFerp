/**
 * 主数据 · 商品分类 — 四级分类（扁平表 + 四级挂载商品）
 */
(function () {
  var ASSET = '../user-app/assets/restock/';

  var DEMO_PRODUCTS = [
    { code: 'SPU00085', sku: '100003', name: '圆茄 优质', img: ASSET + 'product-eggplant-round.svg' },
    { code: 'SPU00078', sku: '100055', name: '长茄子 广茄', img: ASSET + 'product-eggplant-long.svg' },
    { code: 'SPU00088', sku: '100056', name: '红壳黄心鲜鸡蛋', img: ASSET + 'product-egg.svg' },
    { code: 'SPU00082', sku: '120001', name: '可口可乐摩登罐', img: ASSET + 'product-cola.svg' },
    { code: 'SPU00090', sku: '110001', name: '东北大米 5kg', img: ASSET + 'category-icon-grain.svg' },
    { code: 'SPU00067', sku: '100004', name: '普罗旺斯西红柿', img: ASSET + 'product-tomato.svg' }
  ];

  /** 一级 → 二级 → 三级 → 四级名称 */
  var TREE = [
    {
      name: '生鲜食品',
      icon: 'category-icon-veg.svg',
      children: [
        { name: '蔬菜', children: [
          { name: '叶菜类', children: ['生菜', '菠菜', '油麦菜'] },
          { name: '根茎类', children: ['土豆', '胡萝卜', '红薯'] },
          { name: '茄果瓜类', children: ['西红柿', '黄瓜', '茄子'] }
        ]},
        { name: '水果', children: [
          { name: '仁果类', children: ['苹果', '梨'] },
          { name: '柑橘类', children: ['橙子', '柚子'] }
        ]},
        { name: '肉禽水产', children: [
          { name: '猪肉', children: ['五花肉', '里脊', '排骨'] },
          { name: '禽类', children: ['鸡腿', '鸡翅'] }
        ]}
      ]
    },
    {
      name: '粮油调味',
      icon: 'category-icon-grain.svg',
      children: [
        { name: '米面', children: [
          { name: '大米', children: ['东北大米', '泰国香米'] },
          { name: '面粉', children: ['高筋面粉', '低筋面粉'] }
        ]},
        { name: '调味', children: [
          { name: '酱油醋', children: ['生抽', '老抽', '陈醋'] },
          { name: '香料', children: ['花椒', '八角'] }
        ]}
      ]
    },
    {
      name: '酒水饮料',
      icon: 'category-icon-drink.svg',
      status: 'off_shelf',
      children: [
        { name: '饮料', children: [
          { name: '碳酸饮料', children: ['可乐', '雪碧'] },
          { name: '饮用水', children: ['矿泉水', '纯净水'] }
        ]},
        { name: '酒类', children: [
          { name: '啤酒', children: ['工业啤酒', '精酿'] }
        ]}
      ]
    },
    {
      name: '餐厨用品',
      icon: 'category-icon-kitchenware.svg',
      children: [
        { name: '一次性用品', children: [
          { name: '餐具', children: ['纸杯', '纸巾'] }
        ]},
        { name: '清洁', children: [
          { name: '洗洁精', children: ['果蔬净', '餐具净'] },
          { name: '其他', children: [] }
        ]}
      ]
    }
  ];

  /** 演示属性：是否独立货号为真的归到「影响货号」 */
  function attr(name, independentSku, values) {
    return { name: name, independent_sku: independentSku, values: values };
  }

  /** 每个分类都有示例属性；下级会继承上级 */
  var ATTR_SEED = {
    '生鲜食品': [attr('储存条件', false, ['冷藏', '常温', '冷冻']), attr('配送时效', true, ['当日达', '次日达'])],
    '蔬菜': [attr('是否洗净', false, ['已洗净', '未洗净']), attr('产地类型', true, [
      { text: '本地', children: [{ name: '等级', values: ['一级', '二级'] }] },
      '外地'
    ])],
    '叶菜类': [attr('叶片', false, ['嫩叶', '老叶'])],
    '生菜': [attr('结球', false, ['结球', '散叶']), attr('重量', true, ['300g', '500g'])],
    '菠菜': [attr('根茎', false, ['带根', '去根']), attr('重量', true, ['250g', '500g'])],
    '油麦菜': [attr('长度', false, ['短', '长']), attr('重量', true, ['300g', '500g'])],
    '根茎类': [attr('是否去皮', false, ['去皮', '带皮'])],
    '土豆': [attr('品种', false, ['黄心', '白心']), attr('规格', true, ['小', '中', '大'])],
    '胡萝卜': [attr('是否水洗', false, ['水洗', '带泥']), attr('规格', true, ['小', '大'])],
    '红薯': [attr('薯种', false, ['红心', '紫心']), attr('规格', true, ['小', '大'])],
    '茄果瓜类': [attr('是否有机', false, ['有机', '普通'])],
    '西红柿': [attr('果型', false, ['大果', '小果']), attr('成熟度', true, ['硬熟', '软熟'])],
    '黄瓜': [attr('是否刺瘤', false, ['有刺', '无刺']), attr('长度', true, ['短', '长'])],
    '茄子': [
      attr('产地', true, [
        { text: '本地', children: [{ name: '等级', values: ['一级', '二级'] }] },
        '外地'
      ]),
      attr('果型', false, ['圆茄', '长茄']),
      attr('种植方式', false, [
        {
          text: '大棚',
          children: [{
            name: '茬口',
            values: [{
              text: '早春',
              children: [{
                name: '育苗',
                values: [{
                  text: '嫁接',
                  children: [{
                    name: '砧木',
                    values: [{
                      text: '托鲁巴姆',
                      children: [{ name: '苗龄', values: ['45天', '60天'] }]
                    }]
                  }]
                }]
              }]
            }]
          }]
        },
        '露地'
      ])
    ],
    '水果': [attr('成熟度', false, ['偏生', '适中', '偏熟']), attr('规格', true, ['小果', '中果', '大果'])],
    '仁果类': [attr('口感', false, ['脆', '面'])],
    '苹果': [attr('品种', true, ['红富士', '嘎啦']), attr('果径', false, ['75mm', '80mm'])],
    '梨': [attr('品种', true, ['雪梨', '香梨']), attr('果径', false, ['70mm', '80mm'])],
    '柑橘类': [attr('酸甜', false, ['偏酸', '偏甜'])],
    '橙子': [attr('品种', true, ['脐橙', '血橙']), attr('果径', false, ['65mm', '75mm'])],
    '柚子': [attr('品种', true, ['白心', '红心']), attr('重量', false, ['1kg', '1.5kg'])],
    '肉禽水产': [attr('储存温度', false, ['0-4℃', '冷冻']), attr('分割', true, ['整块', '切片'])],
    '猪肉': [attr('肥瘦', false, ['瘦', '五花'])],
    '五花肉': [attr('厚度', true, ['薄', '厚']), attr('部位', false, ['前五花', '后五花'])],
    '里脊': [attr('厚度', true, ['薄片', '厚切']), attr('是否腌制', false, ['鲜肉', '腌制'])],
    '排骨': [attr('切法', true, ['小排', '肋排']), attr('带肉量', false, ['多肉', '少肉'])],
    '禽类': [attr('饲养', false, ['散养', '笼养'])],
    '鸡腿': [attr('是否去骨', true, ['带骨', '去骨']), attr('部位', false, ['琵琶腿', '整腿'])],
    '鸡翅': [attr('部位', true, ['翅中', '翅根']), attr('是否腌制', false, ['鲜', '腌制'])],
    '粮油调味': [attr('包装', false, ['袋装', '瓶装']), attr('保质期', true, ['6个月', '12个月'])],
    '米面': [attr('加工精度', false, ['精制', '粗制'])],
    '大米': [attr('稻种', false, ['粳米', '籼米'])],
    '东北大米': [
      attr('规格', true, ['5kg', '10kg']),
      attr('产地', false, ['黑龙江', '吉林']),
      attr('产区', false, [
        {
          text: '五常',
          children: [{
            name: '乡镇',
            values: [{
              text: '民乐',
              children: [{
                name: '地块',
                values: [{
                  text: '核心区',
                  children: [{
                    name: '品种系',
                    values: [{
                      text: '稻花香',
                      children: [{ name: '年份', values: ['当年', '次年'] }]
                    }]
                  }]
                }]
              }]
            }]
          }]
        },
        '普通产区'
      ])
    ],
    '泰国香米': [attr('规格', true, ['5kg', '10kg']), attr('年份', false, ['新米', '陈米'])],
    '面粉': [attr('筋度', false, ['高筋', '中筋', '低筋'])],
    '高筋面粉': [attr('规格', true, ['1kg', '2.5kg']), attr('用途', false, ['面包', '面条'])],
    '低筋面粉': [attr('规格', true, ['1kg', '2.5kg']), attr('用途', false, ['蛋糕', '饼干'])],
    '调味': [attr('咸度', false, ['淡', '中', '咸'])],
    '酱油醋': [attr('酿造工艺', false, ['酿造', '配制'])],
    '生抽': [attr('容量', true, ['500ml', '1L']), attr('咸度', false, ['淡', '标准'])],
    '老抽': [attr('容量', true, ['500ml', '1L']), attr('色泽', false, ['红亮', '深褐'])],
    '陈醋': [attr('容量', true, ['500ml', '1L']), attr('酸度', false, ['柔和', '浓酸'])],
    '香料': [attr('形态', false, ['整粒', '粉末'])],
    '花椒': [attr('规格', true, ['50g', '100g']), attr('色泽', false, ['红', '青'])],
    '八角': [attr('规格', true, ['50g', '100g']), attr('完整度', false, ['整朵', '碎瓣'])],
    '酒水饮料': [attr('包装形式', false, ['瓶装', '罐装']), attr('容量档', true, ['小', '中', '大'])],
    '饮料': [attr('饮用温度', false, ['常温', '冷藏'])],
    '碳酸饮料': [attr('气量', false, ['标准', '加强'])],
    '可乐': [
      attr('容量', true, ['330ml', '500ml']),
      attr('是否含糖', false, ['有糖', '无糖']),
      attr('配方', false, [
        {
          text: '经典',
          children: [{
            name: '糖度',
            values: [{
              text: '标准',
              children: [{
                name: '甜味剂',
                values: [{
                  text: '蔗糖',
                  children: [{
                    name: '糖源',
                    values: [{
                      text: '广西',
                      children: [{ name: '批次', values: ['当季', '陈糖'] }]
                    }]
                  }]
                }]
              }]
            }]
          }]
        },
        '零度'
      ])
    ],
    '雪碧': [attr('容量', true, ['330ml', '500ml']), attr('是否含糖', false, ['有糖', '无糖'])],
    '饮用水': [attr('水源', false, ['山泉', '纯净'])],
    '矿泉水': [attr('容量', true, ['550ml', '1.5L']), attr('矿物质', false, ['偏硅', '偏锶'])],
    '纯净水': [attr('容量', true, ['550ml', '1.5L']), attr('包装', false, ['瓶装', '桶装'])],
    '酒类': [attr('酒精度', false, ['低度', '中度'])],
    '啤酒': [attr('麦芽度', false, ['低醇', '普通'])],
    '工业啤酒': [attr('容量', true, ['330ml', '500ml']), attr('口感', false, ['淡爽', '浓郁'])],
    '精酿': [attr('容量', true, ['330ml', '500ml']), attr('风格', false, ['IPA', '世涛'])],
    '餐厨用品': [attr('材质', false, ['塑料', '纸质', '不锈钢']), attr('是否重复使用', true, ['是', '否'])],
    '一次性用品': [attr('是否降解', false, ['可降解', '普通'])],
    '餐具': [attr('餐具材质', false, ['纸', '塑料'])],
    '纸杯': [attr('容量', true, ['250ml', '400ml']), attr('覆膜', false, ['单层', '双层'])],
    '纸巾': [attr('层数', true, ['2层', '3层']), attr('抽数', false, ['100抽', '200抽'])],
    '清洁': [attr('香味', false, ['柠檬', '无香'])],
    '洗洁精': [attr('香型', false, ['柠檬', '绿茶'])],
    '果蔬净': [attr('容量', true, ['500ml', '1L']), attr('用途', false, ['果蔬', '餐具'])],
    '餐具净': [attr('容量', true, ['500ml', '1L']), attr('是否浓缩', false, ['浓缩', '普通'])],
    '其他': [attr('适用场景', false, ['厨房', '餐厅']), attr('规格', true, ['标准', '加量'])]
  };

  /** 一级分类演示商品单位（从全局枚举中挑选） */
  var GOODS_UNIT_SEED = {
    '生鲜食品': ['箱', '件', '斤', '个', '克', '袋', '包', '筐'],
    '粮油调味': ['箱', '件', '袋', '包', 'kg', '克', '瓶', '罐'],
    '酒水饮料': ['箱', '件', '瓶', '罐', '盒', 'ml', '提', '个'],
    '餐厨用品': ['箱', '件', '个', '包', '卷', '张', '套', '支']
  };

  /** 一级分类的属性分类。names 命中的属性归入该组，未命中的归入最后一组 */
  var ATTR_GROUP_SEED = {
    '生鲜食品': [
      { name: '储存配送', sort: 10, names: ['储存条件', '配送时效', '储存温度'] },
      { name: '规格参数', sort: 20, names: ['规格', '重量', '长度', '果径', '厚度', '容量'] },
      { name: '品质属性', sort: 30, names: [] }
    ],
    '粮油调味': [
      { name: '包装保质', sort: 10, names: ['包装', '保质期'] },
      { name: '规格参数', sort: 20, names: ['规格', '容量'] },
      { name: '工艺属性', sort: 30, names: [] }
    ],
    '酒水饮料': [
      { name: '包装容量', sort: 10, names: ['包装形式', '容量档', '容量', '包装'] },
      { name: '口感成分', sort: 20, names: [] }
    ],
    '餐厨用品': [
      { name: '材质用途', sort: 10, names: ['材质', '是否重复使用', '是否降解', '餐具材质', '适用场景', '用途', '覆膜', '香味', '香型', '是否浓缩'] },
      { name: '规格容量', sort: 20, names: ['容量', '层数', '抽数', '规格'] }
    ]
  };

  var data = { categories: [], productBindings: {} };

  function seedAttributesForName(name) {
    var list = ATTR_SEED[name];
    if (!list) return [];
    return list.map(function (item, index) {
      return {
        id: 'attr-seed-' + index + '-' + name,
        name: item.name,
        sort: (index + 1) * 10,
        independent_sku: !!item.independent_sku,
        values: seedAttrValues(item.values, 'attr-seed-' + index + '-' + name)
      };
    });
  }

  function seedAttrValues(values, idPrefix) {
    return (values || []).map(function (value, valueIndex) {
      if (typeof value === 'string') return { text: value, children: [] };
      return {
        text: value.text || '',
        children: (value.children || []).map(function (child, childIndex) {
          var childId = child.id || (idPrefix + '-' + valueIndex + '-' + childIndex);
          return {
            id: childId,
            name: child.name || '',
            values: seedAttrValues(child.values, childId)
          };
        })
      };
    });
  }

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function recomputeCounts(categories, bindings) {
    categories.forEach(function (c) {
      if (c.level === 4) c.product_count = (bindings[c.id] || []).length;
    });
    [3, 2, 1].forEach(function (level) {
      categories.forEach(function (c) {
        if (c.level !== level) return;
        c.product_count = categories
          .filter(function (x) { return x.parent_id === c.id; })
          .reduce(function (sum, x) { return sum + x.product_count; }, 0);
      });
    });
  }

  function buildFlatSeed() {
    var list = [];
    var bindings = {};
    var bindCursor = 0;
    var bindNames = { '茄子': true, '西红柿': true, '东北大米': true, '可乐': true };

    function segmentOf(index) {
      return String(10 + index);
    }

    function pushNode(spec) {
      var segment = spec.codeSegment;
      list.push({
        id: spec.id,
        name: spec.name,
        code_segment: segment,
        code: (spec.parentCode || '') + segment,
        level: spec.level,
        parent_id: spec.parentId,
        path: spec.path,
        path_ids: spec.pathIds,
        icon: spec.icon || '',
        sort: spec.sort,
        status: spec.status || 'on_shelf',
        is_leaf: spec.level === 4,
        product_count: 0,
        attributes: spec.attributes ? spec.attributes : seedAttributesForName(spec.name),
        attribute_categories: [],
        goods_units: [],
        created_at: spec.createdAt
      });
    }

    TREE.forEach(function (l1, i1) {
      var l1Id = 'l1-' + i1;
      var l1Status = l1.status || 'on_shelf';
      var l1Code = segmentOf(i1);
      pushNode({
        id: l1Id,
        name: l1.name,
        codeSegment: l1Code,
        parentCode: '',
        level: 1,
        parentId: null,
        path: l1.name,
        pathIds: [l1Id],
        icon: ASSET + l1.icon,
        sort: (i1 + 1) * 10,
        status: l1Status,
        createdAt: '2024-08-' + pad(12 - i1) + ' 10:00'
      });

      (l1.children || []).forEach(function (l2, i2) {
        var l2Id = l1Id + '-l2-' + i2;
        var l2Code = l1Code + segmentOf(i2);
        pushNode({
          id: l2Id,
          name: l2.name,
          codeSegment: segmentOf(i2),
          parentCode: l1Code,
          level: 2,
          parentId: l1Id,
          path: l1.name + '/' + l2.name,
          pathIds: [l1Id, l2Id],
          sort: (i2 + 1) * 10,
          status: l1Status,
          createdAt: '2024-08-' + pad(8 + i2) + ' 11:00'
        });

        (l2.children || []).forEach(function (l3, i3) {
          var l3Id = l2Id + '-l3-' + i3;
          var l3Code = l2Code + segmentOf(i3);
          pushNode({
            id: l3Id,
            name: l3.name,
            codeSegment: segmentOf(i3),
            parentCode: l2Code,
            level: 3,
            parentId: l2Id,
            path: l1.name + '/' + l2.name + '/' + l3.name,
            pathIds: [l1Id, l2Id, l3Id],
            sort: (i3 + 1) * 10,
            status: l1Status,
            createdAt: '2024-07-' + pad(18 - (i3 % 10)) + ' 09:30'
          });

          (l3.children || []).forEach(function (l4Name, i4) {
            var l4Id = l3Id + '-l4-' + i4;
            pushNode({
              id: l4Id,
              name: l4Name,
              codeSegment: segmentOf(i4),
              parentCode: l3Code,
              level: 4,
              parentId: l3Id,
              path: l1.name + '/' + l2.name + '/' + l3.name + '/' + l4Name,
              pathIds: [l1Id, l2Id, l3Id, l4Id],
              sort: (i4 + 1) * 10,
              status: l1Status,
              createdAt: '2024-07-' + pad(10 + (i4 % 8)) + ' 14:00'
            });
            if (bindNames[l4Name]) {
              bindings[l4Id] = [DEMO_PRODUCTS[bindCursor % DEMO_PRODUCTS.length]];
              bindCursor += 1;
            }
          });
        });
      });
    });

    assignSeedAttributeCategories(list);
    assignSeedGoodsUnits(list);
    recomputeCounts(list, bindings);
    return { categories: list, productBindings: bindings };
  }

  function assignSeedGoodsUnits(categories) {
    categories.forEach(function (node) {
      if (node.level !== 1) {
        node.goods_units = [];
        return;
      }
      var names = GOODS_UNIT_SEED[node.name] || ['箱', '件', '个'];
      node.goods_units = names.map(function (name, index) {
        return {
          id: 'gunit-' + node.id + '-' + index,
          name: name,
          sort: (index + 1) * 10
        };
      });
    });
  }

  function assignSeedAttributeCategories(categories) {
    var byId = {};
    categories.forEach(function (node) { byId[node.id] = node; });

    function rootOf(node) {
      var current = node;
      while (current && current.parent_id) current = byId[current.parent_id];
      return current;
    }

    categories.forEach(function (node) {
      if (node.level !== 1) return;
      var spec = ATTR_GROUP_SEED[node.name] || [{ name: '基础属性', sort: 10, names: [] }];
      node.attribute_categories = spec.map(function (item, index) {
        return {
          id: 'acat-' + node.id + '-' + index,
          name: item.name,
          sort: item.sort
        };
      });
      node._seedAttrGroup = spec.map(function (item, index) {
        return { id: node.attribute_categories[index].id, names: item.names || [] };
      });
    });

    categories.forEach(function (node) {
      var root = rootOf(node);
      var groups = (root && root._seedAttrGroup) || [];
      var fallback = groups.length ? groups[groups.length - 1].id : '';
      (node.attributes || []).forEach(function (attr) {
        var matched = '';
        for (var i = 0; i < groups.length; i += 1) {
          if (groups[i].names.indexOf(attr.name) >= 0) {
            matched = groups[i].id;
            break;
          }
        }
        attr.category_id = matched || fallback;
      });
    });

    categories.forEach(function (node) { delete node._seedAttrGroup; });
  }

  function rootCategory(id) {
    var node = getNode(id);
    while (node && node.parent_id) node = getNode(node.parent_id);
    return node;
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

  function hasBindingsInTree(id) {
    return collectDescendantIds(id).some(function (did) {
      return (data.productBindings[did] || []).length > 0;
    });
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

  function refreshCategoryCode(node) {
    var parent = node.parent_id ? getNode(node.parent_id) : null;
    var prefix = parent ? (parent.code || '') : '';
    node.code = prefix + (node.code_segment || '');
    getChildren(node.id).forEach(refreshCategoryCode);
  }

  var store = {
    BLOCK_MSG: '分类及下级分类已关联商品，请先解除绑定后再操作',

    load: function () {
      var seed = buildFlatSeed();
      data.categories = seed.categories;
      data.productBindings = seed.productBindings;
    },

    save: function () {
      recomputeCounts(data.categories, data.productBindings);
    },

    getCategories: function () { return data.categories; },
    getNode: getNode,
    getChildren: getChildren,

    getByLevel: function (level) {
      return data.categories
        .filter(function (c) { return c.level === level; })
        .sort(function (a, b) { return a.sort - b.sort; });
    },

    getBindings: function (id) {
      return (data.productBindings[id] || []).slice();
    },

    getAttributes: function (id) {
      var node = getNode(id);
      return node && Array.isArray(node.attributes) ? node.attributes.slice() : [];
    },

    rootCategory: rootCategory,

    getAttributeCategories: function (id) {
      var root = rootCategory(id);
      var list = root && Array.isArray(root.attribute_categories) ? root.attribute_categories.slice() : [];
      return list.sort(function (a, b) {
        var aSort = parseInt(a.sort, 10);
        var bSort = parseInt(b.sort, 10);
        if (isNaN(aSort)) aSort = 0;
        if (isNaN(bSort)) bSort = 0;
        return aSort - bSort;
      });
    },

    setAttributeCategories: function (id, list) {
      var root = rootCategory(id);
      if (!root || root.level !== 1) return;
      root.attribute_categories = list;
      store.save();
    },

    /** 一级分类维护的商品单位；传任意下级 id 时取所属一级 */
    getGoodsUnits: function (id) {
      var root = rootCategory(id);
      var list = root && Array.isArray(root.goods_units) ? root.goods_units.slice() : [];
      return list.sort(function (a, b) {
        var aSort = parseInt(a.sort, 10);
        var bSort = parseInt(b.sort, 10);
        if (isNaN(aSort)) aSort = 0;
        if (isNaN(bSort)) bSort = 0;
        return aSort - bSort;
      });
    },

    setGoodsUnits: function (id, list) {
      var root = rootCategory(id);
      if (!root || root.level !== 1) return;
      root.goods_units = list;
      store.save();
    },

    /** 已配置的单位名称（按排序）；未配置返回空数组 */
    listGoodsUnitNames: function (id) {
      return store.getGoodsUnits(id).map(function (item) { return item.name; }).filter(Boolean);
    },

    isAttributeCategoryUsed: function (l1Id, categoryId) {
      return collectDescendantIds(l1Id).some(function (did) {
        var node = getNode(did);
        return node && (node.attributes || []).some(function (attr) {
          return attr.category_id === categoryId;
        });
      });
    },

    /** 从一级到当前分类依次展开；上级属性标记为继承，本级属性可编辑 */
    listAttributeRows: function (id) {
      var node = getNode(id);
      if (!node) return [];
      var chain = [];
      var current = node;
      while (current) {
        chain.unshift(current);
        current = current.parent_id ? getNode(current.parent_id) : null;
      }
      var rows = [];
      chain.forEach(function (category) {
        var inherited = category.id !== node.id;
        (category.attributes || []).forEach(function (attr) {
          rows.push({
            attr: attr,
            inherited: inherited,
            sourceId: category.id,
            sourceName: category.name,
            sourceLevel: category.level
          });
        });
      });
      rows.sort(function (a, b) {
        if (a.sourceLevel !== b.sourceLevel) return a.sourceLevel - b.sourceLevel;
        var aSort = parseInt(a.attr && a.attr.sort, 10);
        var bSort = parseInt(b.attr && b.attr.sort, 10);
        if (isNaN(aSort)) aSort = 0;
        if (isNaN(bSort)) bSort = 0;
        return aSort - bSort;
      });
      return rows;
    },

    setAttributes: function (id, list) {
      var node = getNode(id);
      if (!node) return;
      node.attributes = list;
      store.save();
    },

    unbindProduct: function (id, code) {
      if (!id || !code) return;
      data.productBindings[id] = (data.productBindings[id] || []).filter(function (p) {
        return p.code !== code;
      });
      store.save();
    },

    collectDescendantIds: collectDescendantIds,
    hasBindingsInTree: hasBindingsInTree,
    canDelete: function (id) { return !hasBindingsInTree(id); },
    rebuildPath: rebuildPath,

    addCategory: function (node) {
      data.categories.push(node);
      store.save();
    },

    updateCategory: function (node) {
      rebuildPath(node);
      refreshCategoryCode(node);
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
      if (status === 'off_shelf' && node.level < 4) {
        collectDescendantIds(id).forEach(function (did) {
          var child = getNode(did);
          if (child) child.status = 'off_shelf';
        });
      }
      store.save();
    }
  };

  window.MasterDataCategoryStore = store;
})();
