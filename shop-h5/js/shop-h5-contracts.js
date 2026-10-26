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

  function statusText(status) {
    if (status === 'sign_completed') return '已签署';
    if (status === 'sign_progress' || status === 'wait_auth') return '待签署';
    return status || '—';
  }

  function card(task, partyName) {
    var pending = task.status === 'sign_progress' || task.status === 'wait_auth';
    var box = document.createElement('section');
    box.className = 'shop-h5-hero';
    var title = document.createElement('div');
    title.style.fontWeight = '700';
    title.style.marginBottom = '6px';
    title.textContent = task.agreementNames || task.name;
    var meta = document.createElement('div');
    meta.style.fontSize = '13px';
    meta.style.color = '#6b7280';
    meta.style.marginBottom = '12px';
    meta.textContent = (partyName || '') + ' · ' + statusText(task.status);
    var actions = document.createElement('div');
    actions.className = 'shop-h5-foot-inner';
    var copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'shop-h5-btn shop-h5-btn-outline';
    copy.textContent = '复制链接';
    copy.addEventListener('click', function () {
      window.LfContract.copyText(task.signUrl || window.LfContract.htmlSignUrl(task)).then(function () {
        meta.textContent = (partyName || '') + ' · 链接已复制';
      });
    });
    var open = document.createElement('button');
    open.type = 'button';
    open.className = 'shop-h5-btn shop-h5-btn-primary shop-h5-btn-wide';
    open.textContent = pending ? '去签署' : '查看合同';
    open.addEventListener('click', function () {
      location.href = window.LfContract.htmlSignUrl(task);
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
      note.textContent = storeName + '的门店合作合同。审核通过后生成，可在此签署，也可把链接转发出去签。';
    } else {
      note.textContent = '门店入驻审核通过后生成合同。可在此签署，也可复制链接转发。';
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
      list.appendChild(card(task, party ? party.name : ''));
    });
  }

  render();
})();
