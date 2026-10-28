/**
 * 门店 App：入驻审核通过后的门店合作合同，在这里签署。
 */
(function () {
  var list = document.getElementById('contractList');
  var back = document.getElementById('btnBack');
  if (back) {
    back.addEventListener('click', function () {
      if (history.length > 1) history.back();
      else location.href = 'status.html?status=approved';
    });
  }

  function card(task, tpl, partyName) {
    var signed = tpl ? window.LfContract.isTemplateSigned(task, tpl.id) : task.status === 'sign_completed';
    var box = document.createElement('section');
    box.className = 'shop-h5-hero';
    var title = document.createElement('div');
    title.style.fontWeight = '700';
    title.style.marginBottom = '6px';
    title.textContent = (tpl && tpl.name) || task.agreementNames || task.name;
    var meta = document.createElement('div');
    meta.style.fontSize = '13px';
    meta.style.color = '#6b7280';
    meta.style.marginBottom = '12px';
    meta.textContent = (partyName || '') + ' · ' + (signed ? '已签署' : '待签署');
    var actions = document.createElement('div');
    actions.className = 'shop-h5-foot-inner';
    var copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'shop-h5-btn shop-h5-btn-outline';
    copy.textContent = '复制链接';
    copy.addEventListener('click', function () {
      window.LfContract.copyText(window.LfContract.fadadaSignUrl(task)).then(function () {
        meta.textContent = (partyName || '') + ' · 本份链接已复制';
      });
    });
    var open = document.createElement('button');
    open.type = 'button';
    open.className = 'shop-h5-btn shop-h5-btn-primary shop-h5-btn-wide';
    open.textContent = signed ? '查看合同' : '去签署';
    open.addEventListener('click', function () {
      location.href = window.LfContract.fadadaSignUrl(task);
    });
    actions.appendChild(copy);
    actions.appendChild(open);
    box.appendChild(title);
    box.appendChild(meta);
    box.appendChild(actions);
    return box;
  }

  function render() {
    if (!list) return;
    list.innerHTML = '';
    var api = window.LfContract;
    if (!api) {
      list.textContent = '合同列表未加载';
      return;
    }
    var params = new URLSearchParams(location.search);
    var storeName = params.get('storeName') || '';
    if (storeName === '您的门店') storeName = '';
    var rows = api.listStoreTasks(storeName);
    var note = document.createElement('p');
    note.className = 'shop-h5-note';
    note.style.padding = '0 0 12px';
    note.style.textAlign = 'left';
    if (storeName && !rows.length) {
      rows = api.listStoreTasks('');
      note.textContent = '当前门店还没有待签署合同，下面是全部门店合作合同。';
    } else if (storeName) {
      note.textContent = storeName + '的门店合作合同。每份单独签署，签完一份不会自动签上其他协议。';
    } else {
      note.textContent = '门店入驻审核通过后生成合同。每份单独签署，也可复制单份链接转发。';
    }
    list.appendChild(note);
    if (!rows.length) {
      var empty = document.createElement('p');
      empty.className = 'shop-h5-note';
      empty.textContent = '暂无合同。门店入驻总监审核通过后会出现在这里。';
      list.appendChild(empty);
      return;
    }
    rows.sort(function (a, b) {
      var ap = a.status === 'sign_completed' ? 1 : 0;
      var bp = b.status === 'sign_completed' ? 1 : 0;
      return ap - bp;
    });
    rows.forEach(function (task) {
      var party = api.findParty(task.partyId);
      var tpls = api.taskTemplates(task);
      if (!tpls.length) {
        list.appendChild(card(task, null, party ? party.name : ''));
        return;
      }
      tpls.forEach(function (tpl) {
        list.appendChild(card(task, tpl, party ? party.name : ''));
      });
    });
  }

  render();
})();
