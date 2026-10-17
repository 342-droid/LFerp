/**
 * 主数据 · 供应商档案数据
 * 供应商档案页维护。同一浏览器会话内保留增删改，新开会话恢复初始供应商。
 */
(function () {
  var STORAGE_KEY = 'lf-master-data-suppliers-v2';

  function seedSuppliers() {
    return [
      { id: 's1', code: 'SUP0001', name: '华东果蔬有限公司', type: '品牌商', bizContact: '王丽', bizPhone: '13800001101', warehouseContact: '赵强', warehousePhone: '13800002101', region: '上海市 / 市辖区 / 浦东新区', detailAddress: '张江路88号', status: 'active' },
      { id: 's2', code: 'SUP0002', name: '浙北农产品合作社', type: '代理商', bizContact: '张宁', bizPhone: '13800001102', warehouseContact: '周敏', warehousePhone: '13800002102', region: '浙江省 / 嘉兴市 / 南湖区', detailAddress: '中环南路66号', status: 'active' },
      { id: 's3', code: 'SUP0003', name: '上海鲜达供应链', type: '品牌商', bizContact: '李萌', bizPhone: '13800001103', warehouseContact: '孙磊', warehousePhone: '13800002103', region: '上海市 / 市辖区 / 静安区', detailAddress: '南京西路1266号', status: 'disabled' },
      { id: 's4', code: 'SUP0004', name: '苏果直采中心', type: '代理商', bizContact: '陈杰', bizPhone: '13800001104', warehouseContact: '吴芳', warehousePhone: '13800002104', region: '江苏省 / 南京市 / 鼓楼区', detailAddress: '中山北路88号', status: 'active' }
    ];
  }

  var suppliers = null;

  function load() {
    if (suppliers) return suppliers;
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          suppliers = parsed;
          return suppliers;
        }
      }
    } catch (err) {}
    suppliers = seedSuppliers();
    return suppliers;
  }

  function save() {
    if (!suppliers) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(suppliers));
    } catch (err) {}
  }

  function isActive(item) {
    return !item || item.status !== 'disabled';
  }

  window.MasterDataSupplierStore = {
    all: function () {
      return load();
    },
    save: save,
    active: function () {
      return load().filter(isActive);
    },
    nextId: function () {
      var max = 0;
      load().forEach(function (item) {
        var num = parseInt(String(item.id || '').replace(/\D/g, ''), 10);
        if (!isNaN(num) && num > max) max = num;
      });
      return 's' + (max + 1);
    }
  };
})();
