/**
 * 主数据 · 供货关系数据
 * 一条记录对应一个货号和一个供应商。同一浏览器会话内保留增删改，新开会话恢复初始数据。
 */
(function () {
  var STORAGE_KEY = 'lf-master-data-supply-relations-v2';

  function pickProduct(name, fallback) {
    var list = window.MasterDataGoodsCatalog || [];
    for (var i = 0; i < list.length; i += 1) {
      if (list[i] && list[i].name === name) return list[i];
    }
    return fallback;
  }

  function row(id, product, supplierId, purchasePrice, approvedPrice, minOrderQty, sampleStatus, isPrimary) {
    return {
      id: id,
      sku: product.sku,
      spu: product.spu || '',
      name: product.name,
      barcode: product.barcode || '',
      shelfLife: product.shelfLife || '',
      tempLayer: product.tempLayer || '',
      purchaseUnit: product.purchaseUnit || '',
      tone: product.tone || 'blue',
      mark: product.mark || (product.name || '').charAt(0),
      operateMode: product.operateMode || '代采代销',
      supplierId: supplierId,
      purchasePrice: purchasePrice,
      approvedPrice: approvedPrice,
      actualPurchaseUnit: '箱',
      minOrderQty: minOrderQty,
      priceStatus: '未核价',
      sampleStatus: sampleStatus,
      status: 'active',
      isPrimary: !!isPrimary
    };
  }

  function seedRelations() {
    var pork = pickProduct('生物发面猪肉小笼包 50g 100个/包', {
      sku: '100001', spu: 'SPU100001', name: '生物发面猪肉小笼包 50g 100个/包', barcode: '6974562300012',
      shelfLife: '180', tempLayer: '冷冻', operateMode: '购销', purchaseUnit: '箱', tone: 'blue', mark: '笼'
    });
    var eggplant = pickProduct('圆茄 优质', {
      sku: '100003', spu: 'SPU100003', name: '圆茄 优质', barcode: '6974562300101',
      shelfLife: '7', tempLayer: '冷藏', operateMode: '代采代销', purchaseUnit: '箱', tone: 'green', mark: '茄'
    });
    var rice = pickProduct('东北大米 5kg', {
      sku: '110001', spu: 'SPU110001', name: '东北大米 5kg', barcode: '6974562300301',
      shelfLife: '365', tempLayer: '常温', operateMode: '购销', purchaseUnit: '箱', tone: 'green', mark: '米'
    });
    return [
      row('r1', pork, 's1', 17.6, 18.8, 10, '合格', true),
      row('r2', pork, 's2', 18.2, 18.6, 20, '待检', false),
      row('r3', eggplant, 's4', 3.2, 3.5, 5, '合格', true),
      row('r4', rice, 's1', 30, 32, 2, '待检', false)
    ];
  }

  var relations = null;

  function load() {
    if (relations) return relations;
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          var filled = false;
          parsed.forEach(function (item) {
            if (item && !item.actualPurchaseUnit) {
              item.actualPurchaseUnit = item.purchaseUnit || '箱';
              filled = true;
            }
            if (item && (!item.priceStatus || item.priceStatus === '初始价格')) {
              item.priceStatus = '未核价';
              filled = true;
            }
            if (item && item.status !== 'active' && item.status !== 'disabled') {
              item.status = 'active';
              filled = true;
            }
            if (item && !(Number(item.minOrderQty) > 0)) {
              var seedQty = { r1: 10, r2: 20, r3: 5, r4: 2 };
              item.minOrderQty = seedQty[item.id] || 1;
              filled = true;
            }
          });
          relations = parsed;
          if (filled) save();
          return relations;
        }
      }
    } catch (err) {}
    relations = seedRelations();
    return relations;
  }

  function save() {
    if (!relations) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(relations));
    } catch (err) {}
  }

  window.MasterDataSupplyRelationStore = {
    all: function () {
      return load();
    },
    save: save,
    nextId: function () {
      var max = 0;
      load().forEach(function (item) {
        var num = parseInt(String(item.id || '').replace(/\D/g, ''), 10);
        if (!isNaN(num) && num > max) max = num;
      });
      return 'r' + (max + 1);
    }
  };
})();
