/**
 * 合同正文页：模板链接只供查阅；签署任务链接可确认签署。
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

  function setMeta(text) {
    if (metaEl) metaEl.textContent = text || '';
  }

  function show(index) {
    var doc = docs[index] || { name: '合同', body: '暂无合同正文' };
    if (titleEl) titleEl.textContent = doc.name || '合同';
    document.title = doc.name || '合同';
    if (paperEl) paperEl.textContent = doc.body || '暂无合同正文';
    if (!tabsEl) return;
    tabsEl.innerHTML = '';
    if (docs.length < 2) return;
    docs.forEach(function (item, n) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sign-tab' + (n === index ? ' is-active' : '');
      btn.textContent = item.name;
      btn.addEventListener('click', function () { show(n); });
      tabsEl.appendChild(btn);
    });
  }

  function addDoc(tpl, filled) {
    if (!tpl) return;
    var body = api.contractBodyOf(tpl);
    if (filled && party) body = api.fillContractParty(body, party);
    docs.push({ name: tpl.name || tpl.id, body: body });
  }

  function button(label, primary, onClick) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = primary ? 'primary' : '';
    btn.textContent = label;
    if (onClick) btn.addEventListener('click', onClick);
    return btn;
  }

  function copyPage() {
    var url = task ? api.htmlSignUrl(task) : location.href;
    api.copyText(url).then(function () {
      setMeta('链接已复制，可转发给对方');
    });
  }

  if (!api) {
    if (paperEl) paperEl.textContent = '合同页面未加载完成';
    return;
  }

  if (taskId) {
    task = api.findTask(taskId);
    if (!task) {
      if (titleEl) titleEl.textContent = '未找到合同';
      if (paperEl) paperEl.textContent = '该签署链接无效，请向发起方重新索取。';
      return;
    }
    party = api.findParty(task.partyId);
    api.taskTemplates(task).forEach(function (tpl) { addDoc(tpl, true); });
    var pending = task.status === 'sign_progress' || task.status === 'wait_auth';
    var who = party ? party.name : '';
    setMeta(who + (pending ? ' · 请阅读后确认签署' : ' · 已签署'));
    if (footEl) {
      footEl.appendChild(button('复制链接', false, copyPage));
      if (pending) {
        footEl.appendChild(button('确认签署', true, function () {
          api.markTaskSigned(task.id);
          task = api.findTask(task.id) || task;
          setMeta((who ? who + ' · ' : '') + '已签署');
          footEl.innerHTML = '';
          var done = button('已签署', false, null);
          done.disabled = true;
          footEl.appendChild(done);
        }));
      } else if (task.status === 'sign_completed') {
        var doneBtn = button('已签署', false, null);
        doneBtn.disabled = true;
        footEl.appendChild(doneBtn);
      }
    }
  } else if (tplId) {
    addDoc(api.findTpl(tplId), false);
    setMeta('合同正文，供查阅转发');
    if (footEl) footEl.appendChild(button('复制链接', true, copyPage));
  } else if (sceneId) {
    api.templatesOfScene(sceneId).forEach(function (tpl) { addDoc(tpl, false); });
    setMeta(sceneId === 'user' ? '用户注册协议与隐私政策，供查阅' : '合同正文，供查阅转发');
    if (footEl) footEl.appendChild(button('复制链接', true, copyPage));
  }

  if (!docs.length) {
    if (titleEl) titleEl.textContent = '未找到合同';
    if (paperEl) paperEl.textContent = '没有可展示的合同正文。';
    return;
  }
  show(0);
})();
