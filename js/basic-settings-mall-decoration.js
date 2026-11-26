/**
 * 基础设置 · 商城装修
 * 绑定商城商品弹窗：仅展示带冷丰商城标签 ID 的商品
 */
(function () {
  /** 冷丰商城商品标签 ID（进入弹窗列表的过滤条件） */
  var ONLINE_PRODUCT_TAG_ID = '382058562475524096';
  var ONLINE_PRODUCT_TAG_LABEL = '冷丰商城（' + ONLINE_PRODUCT_TAG_ID + '）';

  var MODULE_DEFS = [
    { type: 'banner', name: '推荐位轮播' },
    { type: 'category', name: '分类菜单' },
    { type: 'mall_entrance', name: '商城入口' },
    { type: 'live', name: '直播模块' },
    { type: 'ops_card', name: '运营卡片区' },
    { type: 'product_rec', name: '商品推荐' }
  ];

  var ASSET = '../user-app/assets/restock/';

  /** 演示商品：仅带 ONLINE_PRODUCT_TAG_ID 的可被商城入口绑定 */
  var DEMO_PRODUCTS = [
    {
      id: '379873502481633280',
      code: 'SPU00171',
      name: '下游商品1',
      category: '熟鲜融合店',
      img: 'https://picsum.photos/seed/deco-p1/480/320',
      onSale: true,
      tagIds: [ONLINE_PRODUCT_TAG_ID]
    },
    {
      id: '379873502481633281',
      code: 'SPU00170',
      name: '土豆酸奶-小栈专卖',
      category: '生鲜线 (C)',
      img: 'https://picsum.photos/seed/deco-p2/480/320',
      onSale: true,
      tagIds: [ONLINE_PRODUCT_TAG_ID]
    },
    {
      id: '379873502481633282',
      code: 'SPU00169',
      name: '有机上海青-自提',
      category: '生鲜线 (C)',
      img: ASSET + 'product-leaf.svg',
      onSale: true,
      tagIds: [ONLINE_PRODUCT_TAG_ID]
    },
    {
      id: '379873502481633283',
      code: 'SPU00168',
      name: '多规格-食物',
      category: '熟鲜融合店',
      img: 'https://picsum.photos/seed/deco-p3/480/320',
      onSale: true,
      tagIds: [ONLINE_PRODUCT_TAG_ID]
    },
    {
      id: '379873502481633284',
      code: 'SPU00167',
      name: '售后30',
      category: '百货线 (F)',
      img: 'https://picsum.photos/seed/deco-p4/480/320',
      onSale: true,
      tagIds: [ONLINE_PRODUCT_TAG_ID]
    },
    {
      id: '379873502481633285',
      code: 'SPU00166',
      name: '红壳黄心鲜鸡蛋',
      category: '生鲜线 (C)',
      img: ASSET + 'product-egg.svg',
      onSale: true,
      tagIds: [ONLINE_PRODUCT_TAG_ID]
    },
    {
      id: '379873502481633286',
      code: 'SPU00999',
      name: '未打标签商品（不应出现）',
      category: '测试类目',
      img: ASSET + 'product-tomato.svg',
      onSale: true,
      tagIds: []
    },
    {
      id: '379873502481633287',
      code: 'SPU00998',
      name: '其他标签商品（不应出现）',
      category: '测试类目',
      img: ASSET + 'product-cola.svg',
      onSale: true,
      tagIds: ['111111111111111111']
    }
  ];

  var CATEGORIES = ['全部', '熟鲜融合店', '生鲜线 (C)', '百货线 (F)', '测试类目'];

  var state = {
    modules: [
      {
        uid: 'm1',
        type: 'category',
        title: '分类菜单'
      },
      {
        uid: 'm2',
        type: 'mall_entrance',
        title: '上海仓',
        mallEntrance: {
          id: '379873101606834176',
          name: '上海仓线上商城'
        },
        productMode: 'manual',
        products: [
          { id: '379873502481633280', name: '下游商品1', code: 'SPU00171' }
        ]
      },
      {
        uid: 'm3',
        type: 'banner',
        title: '推荐位轮播'
      },
      {
        uid: 'm4',
        type: 'ops_card',
        title: '运营卡片区'
      },
      {
        uid: 'm5',
        type: 'product_rec',
        title: '商品推荐'
      }
    ],
    selectedUid: 'm2'
  };

  var pickerState = {
    open: false,
    tab: 'mall',
    category: '全部',
    searchField: 'name',
    keyword: '',
    selected: {},
    page: 1,
    pageSize: 20
  };

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function padIndex(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function moduleLabel(type) {
    for (var i = 0; i < MODULE_DEFS.length; i++) {
      if (MODULE_DEFS[i].type === type) return MODULE_DEFS[i].name;
    }
    return type;
  }

  function findModule(uid) {
    for (var i = 0; i < state.modules.length; i++) {
      if (state.modules[i].uid === uid) return state.modules[i];
    }
    return null;
  }

  function selectedModule() {
    return findModule(state.selectedUid);
  }

  function toast(msg) {
    if (window.ErpToast && typeof window.ErpToast.show === 'function') {
      window.ErpToast.show(msg);
      return;
    }
    window.alert(msg);
  }

  function nextUid() {
    return 'm' + Date.now() + Math.floor(Math.random() * 1000);
  }

  function createModule(type) {
    var base = {
      uid: nextUid(),
      type: type,
      title: moduleLabel(type)
    };
    if (type === 'mall_entrance') {
      base.title = '';
      base.mallEntrance = null;
      base.productMode = 'manual';
      base.products = [];
    }
    return base;
  }

  /** 仅返回带冷丰商城标签 ID 的商品（弹窗列表过滤口径） */
  function productsWithOnlineTag() {
    return DEMO_PRODUCTS.filter(function (p) {
      return (p.tagIds || []).indexOf(ONLINE_PRODUCT_TAG_ID) !== -1;
    });
  }

  function getPickerPool() {
    return productsWithOnlineTag().filter(function (p) {
      if (pickerState.category !== '全部' && p.category !== pickerState.category) return false;
      var kw = String(pickerState.keyword || '').trim().toLowerCase();
      if (!kw) return true;
      var value = pickerState.searchField === 'code' ? p.code : p.name;
      return String(value || '').toLowerCase().indexOf(kw) !== -1;
    });
  }

  function boundProductMap(mod) {
    var map = {};
    (mod.products || []).forEach(function (p) {
      map[p.id] = true;
    });
    return map;
  }

  function renderPalette() {
    var el = document.getElementById('decoModulePalette');
    if (!el) return;
    el.innerHTML = MODULE_DEFS.map(function (def) {
      return (
        '<button type="button" class="mdm-deco-palette-item" data-add-type="' +
        escapeHtml(def.type) +
        '">' +
        escapeHtml(def.name) +
        '</button>'
      );
    }).join('');
  }

  function renderStructure() {
    var el = document.getElementById('decoStructureList');
    if (!el) return;
    el.innerHTML = state.modules
      .map(function (mod, idx) {
        var active = mod.uid === state.selectedUid ? ' is-active' : '';
        return (
          '<li class="mdm-deco-structure__item' +
          active +
          '" data-uid="' +
          escapeHtml(mod.uid) +
          '">' +
          '<span class="mdm-deco-structure__index">' +
          padIndex(idx + 1) +
          '</span>' +
          '<span>' +
          escapeHtml(moduleLabel(mod.type)) +
          '</span>' +
          '</li>'
        );
      })
      .join('');
  }

  function renderPreviewBlock(mod) {
    var active = mod.uid === state.selectedUid ? ' is-active' : '';
    var title = mod.title || moduleLabel(mod.type);
    if (mod.type === 'mall_entrance') {
      var entranceName = (mod.mallEntrance && mod.mallEntrance.name) || '未绑定商城入口';
      var productHint =
        mod.productMode === 'auto'
          ? '自动取商城商品'
          : (mod.products || []).length
            ? '已绑定 ' + mod.products.length + ' 件商品'
            : '尚未绑定商城商品';
      return (
        '<div class="mdm-deco-preview-block' +
        active +
        '" data-uid="' +
        escapeHtml(mod.uid) +
        '">' +
        '<div class="mdm-deco-preview-mall">' +
        '<div class="mdm-deco-preview-mall__icon">商城</div>' +
        '<div class="mdm-deco-preview-mall__meta">' +
        '<strong>' +
        escapeHtml(entranceName) +
        '</strong>' +
        '<span>' +
        escapeHtml(title || '商城入口') +
        ' · ' +
        escapeHtml(productHint) +
        '</span>' +
        '</div></div></div>'
      );
    }
    if (mod.type === 'banner') {
      return (
        '<div class="mdm-deco-preview-block' +
        active +
        '" data-uid="' +
        escapeHtml(mod.uid) +
        '">' +
        '<div class="mdm-deco-preview-banner">0.1 元鸡蛋专场</div></div>'
      );
    }
    if (mod.type === 'product_rec') {
      return (
        '<div class="mdm-deco-preview-block' +
        active +
        '" data-uid="' +
        escapeHtml(mod.uid) +
        '">' +
        '<h4 class="mdm-deco-preview-block__title">' +
        escapeHtml(title) +
        '</h4>' +
        '<div class="mdm-deco-preview-products">' +
        '<div class="mdm-deco-preview-product"><div class="mdm-deco-preview-product__img">图</div><p class="mdm-deco-preview-product__name">多规格-食物</p></div>' +
        '<div class="mdm-deco-preview-product"><div class="mdm-deco-preview-product__img">图</div><p class="mdm-deco-preview-product__name">有机上海青-自提</p></div>' +
        '</div></div>'
      );
    }
    return (
      '<div class="mdm-deco-preview-block' +
      active +
      '" data-uid="' +
      escapeHtml(mod.uid) +
      '">' +
      '<h4 class="mdm-deco-preview-block__title">' +
      escapeHtml(title) +
      '</h4>' +
      '<p class="mdm-deco-empty-tip" style="margin:0">模块预览示意</p></div>'
    );
  }

  function renderPreview() {
    var el = document.getElementById('decoPhonePreview');
    if (!el) return;
    el.innerHTML =
      '<div class="mdm-deco-preview-search">搜索商品</div>' +
      '<div class="mdm-deco-preview-tabs"><span class="is-active">精选</span><span>蔬菜</span><span>肉蛋</span><span>水果</span></div>' +
      state.modules.map(renderPreviewBlock).join('');
  }

  function renderMallEntranceSettings(mod) {
    var entrance = mod.mallEntrance;
    var mode = mod.productMode === 'auto' ? 'auto' : 'manual';
    var products = mod.products || [];
    var entranceHtml = entrance
      ? '<div class="mdm-deco-bound-card"><div><strong>' +
        escapeHtml(entrance.name) +
        '</strong><span class="mdm-deco-bound-card__id">' +
        escapeHtml(entrance.id) +
        '</span></div><button type="button" class="erp-btn" data-clear-entrance>更换</button></div>'
      : '<button type="button" class="mdm-deco-search-trigger" data-pick-entrance>搜索并绑定商城入口</button>';

    var productListHtml = products.length
      ? '<div class="mdm-deco-product-list">' +
        products
          .map(function (p) {
            return (
              '<div class="mdm-deco-product-item" data-product-id="' +
              escapeHtml(p.id) +
              '">' +
              '<div class="mdm-deco-product-item__meta"><strong>' +
              escapeHtml(p.name) +
              '</strong><span>' +
              escapeHtml(p.id) +
              '</span></div>' +
              '<button type="button" class="mdm-deco-product-item__remove" data-remove-product="' +
              escapeHtml(p.id) +
              '" aria-label="移除">×</button></div>'
            );
          })
          .join('') +
        '</div>'
      : '<p class="mdm-deco-empty-tip">尚未绑定商城商品</p>';

    var productBlock =
      mode === 'auto'
        ? '<p class="mdm-deco-auto-tip">自动模式：按商城入口关联规则拉取商品，仍仅包含带标签<strong>' +
          escapeHtml(ONLINE_PRODUCT_TAG_LABEL) +
          '</strong>的商品。</p>'
        : '<button type="button" class="mdm-deco-search-trigger" data-open-product-picker>搜索并添加商城商品</button>' +
          productListHtml;

    return (
      '<h3 class="mdm-deco-panel__title">' +
      escapeHtml((entrance && entrance.name) || '商城入口') +
      '</h3>' +
      '<div class="mdm-deco-field"><label class="mdm-deco-field__label" for="decoModuleTitle">模块标题/副标题</label>' +
      '<input class="mdm-deco-input" id="decoModuleTitle" type="text" value="' +
      escapeHtml(mod.title || '') +
      '" placeholder="如：上海仓"></div>' +
      '<div class="mdm-deco-field"><div class="mdm-deco-field__label"><span class="req">*</span>绑定商城入口</div>' +
      entranceHtml +
      '</div>' +
      '<div class="mdm-deco-field"><div class="mdm-deco-field__label">绑定商城商品</div>' +
      '<div class="mdm-deco-mode-switch">' +
      '<button type="button" data-product-mode="manual"' +
      (mode === 'manual' ? ' class="is-active"' : '') +
      '>指定</button>' +
      '<button type="button" data-product-mode="auto"' +
      (mode === 'auto' ? ' class="is-active"' : '') +
      '>自动</button></div>' +
      productBlock +
      '</div>'
    );
  }

  function renderGenericSettings(mod) {
    return (
      '<h3 class="mdm-deco-panel__title">' +
      escapeHtml(moduleLabel(mod.type)) +
      '</h3>' +
      '<div class="mdm-deco-field"><label class="mdm-deco-field__label" for="decoModuleTitle">模块标题</label>' +
      '<input class="mdm-deco-input" id="decoModuleTitle" type="text" value="' +
      escapeHtml(mod.title || '') +
      '"></div>' +
      '<p class="mdm-deco-empty-tip">本模块配置项示意，重点能力在「商城入口」绑定商品。</p>'
    );
  }

  function renderSettings() {
    var panel = document.getElementById('decoSettingsPanel');
    var actions = document.getElementById('decoModuleActions');
    if (!panel) return;
    var mod = selectedModule();
    if (!mod) {
      panel.innerHTML = '<p class="mdm-deco-settings-empty">请选择左侧页面结构中的模块进行配置</p>';
      if (actions) actions.hidden = true;
      return;
    }
    if (actions) actions.hidden = false;
    panel.innerHTML =
      mod.type === 'mall_entrance' ? renderMallEntranceSettings(mod) : renderGenericSettings(mod);
  }

  function renderAll() {
    renderStructure();
    renderPreview();
    renderSettings();
  }

  function closeProductPicker() {
    var backdrop = document.querySelector('[data-deco-picker-backdrop]');
    var modal = document.getElementById('mdmDecoProductPicker');
    if (backdrop) backdrop.remove();
    if (modal) modal.remove();
    document.body.classList.remove('mdm-deco-picker-open');
    pickerState.open = false;
    pickerState.selected = {};
  }

  function clampPickerPage(total) {
    var pages = Math.max(1, Math.ceil(total / pickerState.pageSize));
    if (pickerState.page > pages) pickerState.page = pages;
    if (pickerState.page < 1) pickerState.page = 1;
    return pages;
  }

  function renderPickerCategories(poolAll) {
    var list = document.getElementById('decoPickerCatList');
    if (!list) return;
    var counts = {};
    CATEGORIES.forEach(function (c) {
      counts[c] = 0;
    });
    poolAll.forEach(function (p) {
      counts['全部'] = (counts['全部'] || 0) + 1;
      if (p.category) counts[p.category] = (counts[p.category] || 0) + 1;
    });
    list.innerHTML = CATEGORIES.map(function (cat) {
      var active = pickerState.category === cat ? ' is-active' : '';
      return (
        '<li class="mdm-deco-picker-cat' +
        active +
        '" data-cat="' +
        escapeHtml(cat) +
        '"><span>' +
        escapeHtml(cat) +
        '</span><span class="mdm-deco-picker-cat__count">' +
        (counts[cat] || 0) +
        '</span></li>'
      );
    }).join('');
  }

  function renderPickerGrid(mod) {
    var grid = document.getElementById('decoPickerGrid');
    var totalEl = document.getElementById('decoPickerTotal');
    var selectedEl = document.getElementById('decoPickerSelected');
    var confirmBtn = document.getElementById('decoPickerConfirm');
    var checkAll = document.getElementById('decoPickerCheckAll');
    if (!grid) return;

    var bound = boundProductMap(mod);
    var list = getPickerPool();
    var totalPages = clampPickerPage(list.length);
    var start = (pickerState.page - 1) * pickerState.pageSize;
    var pageItems = list.slice(start, start + pickerState.pageSize);

    if (totalEl) totalEl.textContent = '共 ' + list.length + ' 条';

    if (!list.length) {
      grid.innerHTML =
        '<div class="mdm-deco-picker__empty">暂无带标签' +
        escapeHtml(ONLINE_PRODUCT_TAG_LABEL) +
        '的商品</div>';
    } else {
      grid.innerHTML = pageItems
        .map(function (p) {
          var added = !!bound[p.id];
          var selected = !!pickerState.selected[p.id];
          var cls = 'mdm-deco-picker-card';
          if (added) cls += ' is-added';
          else if (selected) cls += ' is-selected';
          return (
            '<article class="' +
            cls +
            '" data-id="' +
            escapeHtml(p.id) +
            '"' +
            (added ? '' : ' data-selectable="1"') +
            '>' +
            '<div class="mdm-deco-picker-card__media">' +
            (added
              ? ''
              : '<label class="mdm-deco-picker-card__check"><input type="checkbox"' +
                (selected ? ' checked' : '') +
                ' data-pick-id="' +
                escapeHtml(p.id) +
                '"></label>') +
            '<img src="' +
            escapeHtml(p.img) +
            '" alt="" onerror="this.onerror=null;this.src=\'' +
            ASSET +
            'product-leaf.svg\'">' +
            '<div class="mdm-deco-picker-card__tags">' +
            '<span class="mdm-deco-picker-card__tag">实物</span>' +
            '<span class="mdm-deco-picker-card__tag mdm-deco-picker-card__tag--sale">' +
            (added ? '已添加' : '在售') +
            '</span></div></div>' +
            '<div class="mdm-deco-picker-card__body"><h4 class="mdm-deco-picker-card__name">' +
            escapeHtml(p.name) +
            '</h4><p class="mdm-deco-picker-card__code">' +
            escapeHtml(p.code) +
            '</p></div></article>'
          );
        })
        .join('');
    }

    var pickable = pageItems.filter(function (p) {
      return !bound[p.id];
    });
    var selectedCount = Object.keys(pickerState.selected).length;
    if (selectedEl) selectedEl.textContent = '已选 ' + selectedCount + ' 件';
    if (confirmBtn) confirmBtn.disabled = selectedCount === 0;
    if (checkAll) {
      var selectedAll = pickable.filter(function (p) {
        return pickerState.selected[p.id];
      });
      checkAll.disabled = pickable.length === 0;
      checkAll.checked = pickable.length > 0 && selectedAll.length === pickable.length;
      checkAll.indeterminate = selectedAll.length > 0 && selectedAll.length < pickable.length;
    }

    var pagesEl = document.getElementById('decoPickerPages');
    if (pagesEl) {
      var html =
        '<button type="button" class="mdm-deco-picker__page-btn" data-nav="prev"' +
        (pickerState.page <= 1 ? ' disabled' : '') +
        '>‹</button>';
      for (var i = 1; i <= totalPages && i <= 7; i++) {
        html +=
          '<button type="button" class="mdm-deco-picker__page-btn' +
          (i === pickerState.page ? ' is-active' : '') +
          '" data-page="' +
          i +
          '">' +
          i +
          '</button>';
      }
      html +=
        '<button type="button" class="mdm-deco-picker__page-btn" data-nav="next"' +
        (pickerState.page >= totalPages ? ' disabled' : '') +
        '>›</button>';
      pagesEl.innerHTML = html;
    }

    var goto = document.getElementById('decoPickerGoto');
    if (goto) goto.value = String(pickerState.page);
    var sizeEl = document.getElementById('decoPickerPageSize');
    if (sizeEl) sizeEl.value = String(pickerState.pageSize);
  }

  function refreshPicker(mod) {
    renderPickerCategories(productsWithOnlineTag());
    renderPickerGrid(mod);
  }

  function openProductPicker() {
    var mod = selectedModule();
    if (!mod || mod.type !== 'mall_entrance') return;

    closeProductPicker();
    pickerState.open = true;
    pickerState.tab = 'mall';
    pickerState.category = '全部';
    pickerState.searchField = 'name';
    pickerState.keyword = '';
    pickerState.selected = {};
    pickerState.page = 1;

    var html =
      '<div class="mdm-deco-picker-backdrop" data-deco-picker-backdrop></div>' +
      '<div class="mdm-deco-picker" id="mdmDecoProductPicker" role="dialog" aria-modal="true" aria-label="选择商城商品">' +
      '<div class="mdm-deco-picker__tabs">' +
      '<button type="button" class="mdm-deco-picker__tab is-active" data-picker-tab="mall">从商城商品列表添加</button>' +
      '</div>' +
      '<p class="mdm-deco-picker__tag-tip">列表已按标签过滤：仅展示带<strong>' +
      escapeHtml(ONLINE_PRODUCT_TAG_LABEL) +
      '</strong>的商品</p>' +
      '<div class="mdm-deco-picker__body">' +
      '<aside class="mdm-deco-picker__sidebar"><ul id="decoPickerCatList" style="list-style:none;margin:0;padding:8px 0;"></ul></aside>' +
      '<div class="mdm-deco-picker__main">' +
      '<div class="mdm-deco-picker__toolbar">' +
      '<div class="mdm-deco-picker__filter">' +
      '<select id="decoPickerSearchField" aria-label="搜索字段"><option value="name">商品名称</option><option value="code">商品编码</option></select>' +
      '<input type="text" id="decoPickerKeyword" placeholder="搜索商品名称" autocomplete="off">' +
      '</div>' +
      '<label class="mdm-deco-picker__checkall"><input type="checkbox" id="decoPickerCheckAll"> 全选本页 <span id="decoPickerTotal">共 0 条</span></label>' +
      '</div>' +
      '<div class="mdm-deco-picker__grid-wrap"><div class="mdm-deco-picker__grid" id="decoPickerGrid"></div></div>' +
      '</div></div>' +
      '<footer class="mdm-deco-picker__footer">' +
      '<div class="mdm-deco-picker__pager">' +
      '<select id="decoPickerPageSize" aria-label="每页条数"><option value="20">20条/页</option><option value="50">50条/页</option><option value="100">100条/页</option></select>' +
      '<div class="mdm-deco-picker__pages" id="decoPickerPages"></div>' +
      '<label>前往 <input id="decoPickerGoto" type="text" value="1" inputmode="numeric"> 页</label>' +
      '</div>' +
      '<div class="mdm-deco-picker__actions">' +
      '<span class="mdm-deco-picker__selected" id="decoPickerSelected">已选 0 件</span>' +
      '<button type="button" class="erp-btn" data-deco-picker-cancel>取消</button>' +
      '<button type="button" class="erp-btn erp-btn--primary" id="decoPickerConfirm" disabled>确认添加</button>' +
      '</div></footer></div>';

    document.body.insertAdjacentHTML('beforeend', html);
    document.body.classList.add('mdm-deco-picker-open');
    bindPickerEvents(mod);
    refreshPicker(mod);
  }

  function bindPickerEvents(mod) {
    var backdrop = document.querySelector('[data-deco-picker-backdrop]');
    if (backdrop) backdrop.addEventListener('click', closeProductPicker);

    document.querySelectorAll('[data-deco-picker-cancel]').forEach(function (btn) {
      btn.addEventListener('click', closeProductPicker);
    });

    var catList = document.getElementById('decoPickerCatList');
    if (catList) {
      catList.addEventListener('click', function (e) {
        var item = e.target.closest('[data-cat]');
        if (!item) return;
        pickerState.category = item.getAttribute('data-cat') || '全部';
        pickerState.page = 1;
        refreshPicker(mod);
      });
    }

    var keyword = document.getElementById('decoPickerKeyword');
    if (keyword) {
      keyword.addEventListener('input', function () {
        pickerState.keyword = keyword.value || '';
        pickerState.page = 1;
        refreshPicker(mod);
      });
    }

    var searchField = document.getElementById('decoPickerSearchField');
    if (searchField) {
      searchField.addEventListener('change', function () {
        pickerState.searchField = searchField.value === 'code' ? 'code' : 'name';
        if (keyword) keyword.placeholder = pickerState.searchField === 'code' ? '搜索商品编码' : '搜索商品名称';
        pickerState.page = 1;
        refreshPicker(mod);
      });
    }

    var grid = document.getElementById('decoPickerGrid');
    if (grid) {
      grid.addEventListener('click', function (e) {
        var card = e.target.closest('[data-selectable="1"]');
        if (!card) return;
        var id = card.getAttribute('data-id');
        if (!id) return;
        if (pickerState.selected[id]) delete pickerState.selected[id];
        else pickerState.selected[id] = true;
        renderPickerGrid(mod);
      });
    }

    var checkAll = document.getElementById('decoPickerCheckAll');
    if (checkAll) {
      checkAll.addEventListener('change', function () {
        var bound = boundProductMap(mod);
        var start = (pickerState.page - 1) * pickerState.pageSize;
        var list = getPickerPool().slice(start, start + pickerState.pageSize);
        if (checkAll.checked) {
          list.forEach(function (p) {
            if (!bound[p.id]) pickerState.selected[p.id] = true;
          });
        } else {
          list.forEach(function (p) {
            delete pickerState.selected[p.id];
          });
        }
        renderPickerGrid(mod);
      });
    }

    var pagesEl = document.getElementById('decoPickerPages');
    if (pagesEl) {
      pagesEl.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-page], [data-nav]');
        if (!btn || btn.disabled) return;
        var total = getPickerPool().length;
        var totalPages = clampPickerPage(total);
        if (btn.hasAttribute('data-page')) {
          pickerState.page = Number(btn.getAttribute('data-page')) || 1;
        } else if (btn.getAttribute('data-nav') === 'prev') {
          pickerState.page = Math.max(1, pickerState.page - 1);
        } else if (btn.getAttribute('data-nav') === 'next') {
          pickerState.page = Math.min(totalPages, pickerState.page + 1);
        }
        renderPickerGrid(mod);
      });
    }

    var sizeEl = document.getElementById('decoPickerPageSize');
    if (sizeEl) {
      sizeEl.addEventListener('change', function () {
        pickerState.pageSize = Number(sizeEl.value) || 20;
        pickerState.page = 1;
        renderPickerGrid(mod);
      });
    }

    var goto = document.getElementById('decoPickerGoto');
    if (goto) {
      goto.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        var totalPages = clampPickerPage(getPickerPool().length);
        var page = Number(goto.value) || 1;
        pickerState.page = Math.min(totalPages, Math.max(1, page));
        renderPickerGrid(mod);
      });
    }

    var confirmBtn = document.getElementById('decoPickerConfirm');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', function () {
        var ids = Object.keys(pickerState.selected);
        if (!ids.length) return;
        var pool = productsWithOnlineTag();
        var byId = {};
        pool.forEach(function (p) {
          byId[p.id] = p;
        });
        mod.products = mod.products || [];
        ids.forEach(function (id) {
          var p = byId[id];
          if (!p) return;
          var exists = mod.products.some(function (x) {
            return x.id === id;
          });
          if (exists) return;
          mod.products.push({ id: p.id, name: p.name, code: p.code });
        });
        closeProductPicker();
        renderAll();
        toast('已添加 ' + ids.length + ' 件商城商品');
      });
    }
  }

  function moveModule(dir) {
    var idx = -1;
    for (var i = 0; i < state.modules.length; i++) {
      if (state.modules[i].uid === state.selectedUid) {
        idx = i;
        break;
      }
    }
    if (idx < 0) return;
    var target = idx + dir;
    if (target < 0 || target >= state.modules.length) return;
    var tmp = state.modules[idx];
    state.modules[idx] = state.modules[target];
    state.modules[target] = tmp;
    renderAll();
  }

  function bindPageEvents() {
    var palette = document.getElementById('decoModulePalette');
    if (palette) {
      palette.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-add-type]');
        if (!btn) return;
        var mod = createModule(btn.getAttribute('data-add-type'));
        state.modules.push(mod);
        state.selectedUid = mod.uid;
        renderAll();
      });
    }

    var structure = document.getElementById('decoStructureList');
    if (structure) {
      structure.addEventListener('click', function (e) {
        var item = e.target.closest('[data-uid]');
        if (!item) return;
        state.selectedUid = item.getAttribute('data-uid');
        renderAll();
      });
    }

    var preview = document.getElementById('decoPhonePreview');
    if (preview) {
      preview.addEventListener('click', function (e) {
        var block = e.target.closest('[data-uid]');
        if (!block) return;
        state.selectedUid = block.getAttribute('data-uid');
        renderAll();
      });
    }

    var settings = document.getElementById('decoSettingsPanel');
    if (settings) {
      settings.addEventListener('input', function (e) {
        var mod = selectedModule();
        if (!mod) return;
        if (e.target && e.target.id === 'decoModuleTitle') {
          mod.title = e.target.value;
          renderStructure();
          renderPreview();
        }
      });

      settings.addEventListener('click', function (e) {
        var mod = selectedModule();
        if (!mod) return;

        var modeBtn = e.target.closest('[data-product-mode]');
        if (modeBtn && mod.type === 'mall_entrance') {
          mod.productMode = modeBtn.getAttribute('data-product-mode') === 'auto' ? 'auto' : 'manual';
          renderSettings();
          renderPreview();
          return;
        }

        if (e.target.closest('[data-open-product-picker]')) {
          openProductPicker();
          return;
        }

        if (e.target.closest('[data-pick-entrance]')) {
          mod.mallEntrance = {
            id: '379873101606834176',
            name: '上海仓线上商城'
          };
          if (!mod.title) mod.title = '上海仓';
          renderAll();
          toast('已绑定商城入口');
          return;
        }

        if (e.target.closest('[data-clear-entrance]')) {
          mod.mallEntrance = {
            id: '379873101606834176',
            name: '上海仓线上商城'
          };
          renderSettings();
          return;
        }

        var removeBtn = e.target.closest('[data-remove-product]');
        if (removeBtn) {
          var pid = removeBtn.getAttribute('data-remove-product');
          mod.products = (mod.products || []).filter(function (p) {
            return p.id !== pid;
          });
          renderAll();
        }
      });
    }

    var actions = document.getElementById('decoModuleActions');
    if (actions) {
      actions.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-deco-action]');
        if (!btn) return;
        var action = btn.getAttribute('data-deco-action');
        var mod = selectedModule();
        if (!mod) return;
        if (action === 'up') moveModule(-1);
        else if (action === 'down') moveModule(1);
        else if (action === 'copy') {
          var copy = JSON.parse(JSON.stringify(mod));
          copy.uid = nextUid();
          copy.title = (copy.title || moduleLabel(copy.type)) + ' 副本';
          var idx = state.modules.indexOf(mod);
          state.modules.splice(idx + 1, 0, copy);
          state.selectedUid = copy.uid;
          renderAll();
        } else if (action === 'remove') {
          if (state.modules.length <= 1) {
            toast('至少保留一个模块');
            return;
          }
          state.modules = state.modules.filter(function (m) {
            return m.uid !== mod.uid;
          });
          state.selectedUid = state.modules[0] ? state.modules[0].uid : null;
          renderAll();
        }
      });
    }

    var saveBtn = document.getElementById('decoSaveBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        toast('装修配置已保存（原型演示）');
      });
    }
  }

  function init() {
    renderPalette();
    renderAll();
    bindPageEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.MdmMallDecoration = {
    ONLINE_PRODUCT_TAG_ID: ONLINE_PRODUCT_TAG_ID,
    productsWithOnlineTag: productsWithOnlineTag
  };
})();
