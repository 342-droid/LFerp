/**
 * 丰银宝合同列表。一份协议一张卡片，确认签署只签当前这一份。
 * 门店视角：门店合作合同；供应商视角：供应商入驻/结算合同。
 */
(function () {
  var list = document.getElementById('saCtList');
  var titleEl = document.querySelector('.sa-ct-nav__title');
  var isSupplier = !!(window.FybOrg && window.FybOrg.isSupplier());

  function partyName() {
    if (isSupplier && window.FybOrg) {
      return window.FybOrg.current().name;
    }
    var api = window.SaLivePromoSession;
    var info = api && typeof api.identity === 'function' ? api.identity() : null;
    return (info && info.storeName) || '冷丰生鲜超市';
  }

  function ensureTask(name) {
    var api = window.LfContract;
    if (!api) return [];
    if (isSupplier) {
      var rows = api.listSupplierTasks ? api.listSupplierTasks(name) : [];
      if (rows.length) return rows;
      api.generateCoopTask({
        scene: 'supplier',
        bizRef: 'fyb-supplier:' + name,
        name: name,
        contact: '供应商联系人 13800000000',
        address: '供应商注册地址',
        initiator: '丰银宝·供应商',
        status: 'sign_progress'
      });
      return api.listSupplierTasks(name);
    }
    var storeRows = api.listStoreTasks(name);
    if (storeRows.length) return storeRows;
    api.generateCoopTask({
      scene: 'store',
      bizRef: 'store-app:' + name,
      name: name,
      partnerType: '加盟店',
      contact: '牛店长 13812348001',
      address: '天津市河东区',
      initiator: '门店入驻审核',
      status: 'sign_progress'
    });
    return api.listStoreTasks(name);
  }

  function docsOf(task) {
    var api = window.LfContract;
    var tpls = api.taskTemplates(task);
    var isSup = !!(task && (task.kind === 'settle_supplement' || /结算信息变更补充协议/.test(task.name || '')));
    if (!tpls.length) {
      return [
        {
          task: task,
          tplId: '',
          name: task.agreementNames || task.name,
          signed: task.status === 'sign_completed',
          supplement: isSup
        }
      ];
    }
    return tpls.map(function (tpl) {
      return {
        task: task,
        tplId: tpl.id,
        name: tpl.name || tpl.id,
        signed: api.isTemplateSigned(task, tpl.id),
        supplement: isSup || !!(tpl && tpl.kind === 'supplement')
      };
    });
  }

  function card(doc) {
    var box = document.createElement('section');
    box.className = 'sa-ct-card';
    var title = document.createElement('div');
    title.className = 'sa-ct-card__name';
    title.textContent = doc.name;
    var meta = document.createElement('div');
    meta.className = 'sa-ct-card__meta ' + (doc.signed ? 'is-done' : 'is-wait');
    meta.textContent =
      (doc.supplement ? '结算变更补充协议 · ' : '') + (doc.signed ? '已签署' : '待签署');
    var actions = document.createElement('div');
    actions.className = 'sa-ct-actions';
    var open = document.createElement('button');
    open.type = 'button';
    open.className = 'sa-ct-btn sa-ct-btn--primary';
    open.textContent = doc.signed ? '查看合同' : '去签署';
    open.addEventListener('click', function () {
      location.href = window.LfContract.fadadaSignUrl(doc.task);
    });
    actions.appendChild(open);
    box.appendChild(title);
    box.appendChild(meta);
    box.appendChild(actions);
    return box;
  }

  function render() {
    if (!list) return;
    list.innerHTML = '';
    var note = document.createElement('p');
    note.className = 'sa-ct-note';
    var name = partyName();
    if (titleEl) titleEl.textContent = isSupplier ? '供应商合同' : '合同签署';
    document.title = (isSupplier ? '供应商合同' : '合同签署') + ' · 丰银宝';
    if (!window.LfContract) {
      note.textContent = '合同列表未加载';
      list.appendChild(note);
      return;
    }
    var docs = [];
    ensureTask(name).forEach(function (task) {
      docsOf(task).forEach(function (doc) {
        docs.push(doc);
      });
    });
    note.textContent = isSupplier
      ? name +
        '的供应商合作合同与结算变更补充协议。入驻协议与补充协议分开签署；结算信息变更并确认发放后，补充协议会出现在待签列表。'
      : name + '的门店合作合同。每份单独签署，签完一份不会自动签上其他协议。';
    list.appendChild(note);
    docs.sort(function (a, b) {
      return (a.signed ? 1 : 0) - (b.signed ? 1 : 0);
    });
    docs.forEach(function (doc) {
      list.appendChild(card(doc));
    });
  }

  render();
})();
