(function () {
  var Center = window.MdmDataBizCenter;
  var Ui = window.MdmDataBizCenterUi;
  if (!Center || !Ui) return;

  var root = document.querySelector('[data-ldb-root]');
  var table = root.querySelector('[data-ldb-table]');
  var storageKey = 'lf-biz-pos-store-mapping-v1';
  var rows = Center.POS_STORE_MAP.filter(function (row) { return row.posName; });
  var saved;
  try {
    saved = JSON.parse(localStorage.getItem(storageKey) || '{}') || {};
  } catch (error) {
    saved = {};
  }

  root.querySelector('[data-ldb-back]').innerHTML =
    '<a class="ldb-back" href="mdm_data_biz_pos.html">← 返回食亨POS</a>';
  root.querySelector('[data-ldb-tip]').innerHTML =
    '<p class="ldb-tip">为每家食亨门店选择对应的 ERP 门店，再保存。选择“未关联”可解除对应。原型关系保存在当前浏览器。</p>';

  function render() {
    table.innerHTML = Ui.sectionCard('食亨 ↔ ERP 门店关系', Ui.simpleTable([
      { key: 'posName', label: '食亨门店' },
      {
        label: 'ERP 门店',
        render: function (row) {
          var selected = saved[row.posId] == null ? row.erpId : saved[row.posId];
          return '<select class="ldb-select" data-erp="' + row.posId + '" aria-label="' +
            Ui.esc(row.posName + ' 对应的 ERP 门店') + '"><option value="">未关联</option>' +
            Center.STORES.map(function (store) {
              return '<option value="' + store.id + '"' + (selected === store.id ? ' selected' : '') +
                '>' + Ui.esc(store.name) + '</option>';
            }).join('') + '</select>';
        }
      },
      {
        label: '匹配状态',
        render: function (row) {
          var id = saved[row.posId] == null ? row.erpId : saved[row.posId];
          return id ? '<span class="ldb-badge ldb-badge--ok">已匹配</span>' :
            '<span class="ldb-badge ldb-badge--warn">未匹配</span>';
        }
      },
      {
        label: '操作',
        render: function (row) {
          return '<button type="button" class="btn btn-secondary" data-save="' + row.posId + '">保存对应</button>';
        }
      }
    ], rows));

    table.querySelectorAll('[data-save]').forEach(function (button) {
      button.addEventListener('click', function () {
        var id = button.getAttribute('data-save');
        var select = table.querySelector('[data-erp="' + id + '"]');
        var updated = Object.assign({}, saved);
        updated[id] = select.value;
        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch (error) {
          Ui.toast('浏览器无法保存对应关系，请重试。');
          return;
        }
        saved = updated;
        var cell = button.closest('td').previousElementSibling;
        cell.innerHTML = select.value ? '<span class="ldb-badge ldb-badge--ok">已匹配</span>' :
          '<span class="ldb-badge ldb-badge--warn">未匹配</span>';
        Ui.toast(select.value ? '已保存对应关系' : '已解除对应关系');
      });
    });
  }

  render();
})();
