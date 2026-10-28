/**
 * 合同正文页：模板链接只供查阅。签署任务一次只确认当前这一份。
 */
(function () {
  var api = window.LfContract;
  var params = new URLSearchParams(location.search);
  var taskId = params.get('task') || '';
  var tplId = params.get('tpl') || '';
  var sceneId = params.get('scene') || '';
  var titleEl = document.getElementById('signTitle');
  var metaEl = document.getElementById('signMeta');
  var tabsEl = document.getElementById('signTabs');
  var paperEl = document.getElementById('signPaper');
  var footEl = document.getElementById('signFoot');
  var docs = [];
  var task = null;
  var party = null;
  var current = 0;

  function setMeta(text) {
    if (metaEl) metaEl.textContent = text || '';
  }

  function button(label, primary, onClick) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = primary ? 'primary' : '';
    btn.textContent = label;
    if (onClick) btn.addEventListener('click', onClick);
    return btn;
  }

  function copyPage(doc) {
    var url = task && doc && doc.tplId ? api.htmlSignUrl(task, doc.tplId) : (task ? api.htmlSignUrl(task) : location.href);
    api.copyText(url).then(function () {
      setMeta('本份合同链接已复制，可转发给对方');
    });
  }

  function addDoc(tpl, filled) {
    if (!tpl) return;
    var body = api.contractBodyOf(tpl);
    if (filled && party) body = api.fillContractParty(body, party);
    docs.push({ name: tpl.name || tpl.id, body: body, tplId: tpl.id || '' });
  }

  function unsignedCount() {
    if (!task) return 0;
    return docs.filter(function (doc) {
      return doc.tplId && !api.isTemplateSigned(task, doc.tplId);
    }).length;
  }

  function nextUnsigned(from) {
    var i;
    for (i = 1; i < docs.length; i++) {
      var n = (from + i) % docs.length;
      var doc = docs[n];
      if (doc && doc.tplId && !api.isTemplateSigned(task, doc.tplId)) return n;
    }
    return -1;
  }

  function paintFoot() {
    if (!footEl) return;
    footEl.innerHTML = '';
    var doc = docs[current];
    if (!task || !doc || !doc.tplId) {
      footEl.appendChild(button('复制链接', true, function () { copyPage(doc); }));
      return;
    }
    var signed = api.isTemplateSigned(task, doc.tplId);
    footEl.appendChild(button('复制链接', false, function () { copyPage(doc); }));
    if (signed) {
      var done = button('本份已签署', false, null);
      done.disabled = true;
      footEl.appendChild(done);
      var nxt = nextUnsigned(current);
      if (nxt >= 0) footEl.appendChild(button('签署下一份', true, function () { show(nxt); }));
      return;
    }
    if (task.status === 'cancelled' || task.status === 'rejected' || task.status === 'terminated' || task.status === 'voiding' || task.status === 'voided' || task.status === 'draft') return;
    footEl.appendChild(button('确认签署', true, function () {
      api.markTemplateSigned(task.id, doc.tplId);
      task = api.findTask(task.id) || task;
      show(current);
    }));
  }

  function show(index) {
    current = index;
    var doc = docs[index] || { name: '合同', body: '暂无合同正文' };
    if (titleEl) titleEl.textContent = doc.name || '合同';
    document.title = doc.name || '合同';
    if (paperEl) paperEl.textContent = doc.body || '暂无合同正文';
    if (task && doc.tplId) {
      var who = party ? party.name + ' · ' : '';
      var signed = api.isTemplateSigned(task, doc.tplId);
      var rest = unsignedCount();
      setMeta(signed
        ? who + '本份已签署' + (rest ? '，还有 ' + rest + ' 份待签署' : '')
        : who + '请阅读后确认签署本份');
    }
    if (tabsEl) {
      tabsEl.innerHTML = '';
      if (docs.length > 1) {
        docs.forEach(function (item, n) {
          var btn = document.createElement('button');
          btn.type = 'button';
          var marked = task && item.tplId && api.isTemplateSigned(task, item.tplId);
          btn.className = 'sign-tab' + (n === index ? ' is-active' : '');
          btn.textContent = item.name + (marked ? ' · 已签署' : '');
          btn.addEventListener('click', function () { show(n); });
          tabsEl.appendChild(btn);
        });
      }
    }
    paintFoot();
  }

  if (!api) {
    if (paperEl) paperEl.textContent = '合同页面未加载完成';
    return;
  }

  if (taskId) {
    task = api.findTask(taskId);
    if (task && api.fadadaSignUrl) {
      location.replace(api.fadadaSignUrl(task));
      return;
    }
    if (!task) {
      if (titleEl) titleEl.textContent = '未找到合同';
      if (paperEl) paperEl.textContent = '该签署链接无效，请向发起方重新索取。';
      return;
    }
    party = api.findParty(task.partyId);
    api.taskTemplates(task).forEach(function (tpl) { addDoc(tpl, true); });
  } else if (tplId) {
    addDoc(api.findTpl(tplId), false);
    setMeta('合同正文，供查阅转发');
  } else if (sceneId) {
    api.templatesOfScene(sceneId).forEach(function (tpl) { addDoc(tpl, false); });
    setMeta(sceneId === 'user' ? '用户注册协议与隐私政策，供查阅' : '合同正文，供查阅转发');
  }

  if (!docs.length) {
    if (titleEl) titleEl.textContent = '未找到合同';
    if (paperEl) paperEl.textContent = '没有可展示的合同正文。';
    return;
  }
  var start = -1;
  if (task && tplId) {
    docs.forEach(function (doc, i) {
      if (doc.tplId === tplId) start = i;
    });
  }
  if (task && start < 0) {
    docs.forEach(function (doc, i) {
      if (start < 0 && doc.tplId && !api.isTemplateSigned(task, doc.tplId)) start = i;
    });
  }
  show(start < 0 ? 0 : start);
})();
