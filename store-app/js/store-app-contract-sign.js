/**
 * 门店 App 内一次只打开一份合同。确认签署只签这一份。
 */
(function () {
  var api = window.LfContract;
  var params = new URLSearchParams(location.search);
  var taskId = params.get('task') || '';
  var tplId = params.get('tpl') || '';
  var titleEl = document.getElementById('saCtTitle');
  var metaEl = document.getElementById('saCtMeta');
  var tabsEl = document.getElementById('saCtTabs');
  var paperEl = document.getElementById('saCtPaper');
  var footEl = document.getElementById('saCtFoot');
  var task = api && taskId ? api.findTask(taskId) : null;
  if (task && api.fadadaSignUrl) {
    location.replace(api.fadadaSignUrl(task));
    return;
  }
  var party = task && api.findParty(task.partyId);
  var tpl = null;

  function templates() {
    return task ? api.taskTemplates(task) : [];
  }

  function pickTemplate() {
    var list = templates();
    var found = null;
    list.forEach(function (item) {
      if (item.id === tplId) found = item;
    });
    if (found) return found;
    list.forEach(function (item) {
      if (!found && !api.isTemplateSigned(task, item.id)) found = item;
    });
    return found || list[0] || null;
  }

  function nextUnsigned() {
    var list = templates();
    var next = null;
    list.forEach(function (item) {
      if (!next && item.id !== (tpl && tpl.id) && !api.isTemplateSigned(task, item.id)) next = item;
    });
    return next;
  }

  function paint() {
    task = api.findTask(taskId) || task;
    tpl = pickTemplate();
    if (tabsEl) tabsEl.innerHTML = '';
    if (!tpl) {
      if (paperEl) paperEl.textContent = '没有可展示的合同正文';
      return;
    }
    tplId = tpl.id;
    if (titleEl) titleEl.textContent = tpl.name || '签署合同';
    var body = api.contractBodyOf(tpl);
    if (party) body = api.fillContractParty(body, party);
    if (paperEl) paperEl.textContent = body || '暂无合同正文';
    var signed = api.isTemplateSigned(task, tpl.id);
    var rest = templates().filter(function (item) {
      return !api.isTemplateSigned(task, item.id);
    }).length;
    if (metaEl) {
      var who = party ? party.name + ' · ' : '';
      metaEl.textContent = signed
        ? (who + '本份已签署' + (rest ? '，还有 ' + rest + ' 份待签署' : ''))
        : (who + '请阅读后确认签署本份');
    }
    if (!footEl) return;
    footEl.innerHTML = '';
    if (signed) {
      var done = document.createElement('button');
      done.type = 'button';
      done.className = 'sa-ct-btn';
      done.disabled = true;
      done.textContent = '本份已签署';
      footEl.appendChild(done);
      var nxt = nextUnsigned();
      if (nxt) {
        var go = document.createElement('button');
        go.type = 'button';
        go.className = 'sa-ct-btn sa-ct-btn--primary';
        go.textContent = '签署下一份';
        go.addEventListener('click', function () {
          location.href = 'contract-sign.html?task=' + encodeURIComponent(task.id) + '&tpl=' + encodeURIComponent(nxt.id);
        });
        footEl.appendChild(go);
      }
      return;
    }
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sa-ct-btn sa-ct-btn--primary';
    btn.textContent = '确认签署';
    btn.addEventListener('click', function () {
      api.markTemplateSigned(task.id, tpl.id);
      paint();
    });
    footEl.appendChild(btn);
  }

  if (!api || !task) {
    if (paperEl) paperEl.textContent = '未找到待签署合同';
    return;
  }
  paint();
})();
