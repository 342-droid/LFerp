(function () {
  function toast(msg) {
    var el = document.querySelector('.sa-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'sa-toast';
      var shell = document.querySelector('.sa-more-shell');
      (shell || document.body).appendChild(el);
    }
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.hidden = true;
    }, 1600);
  }

  var LABELS = {
    qa: '知识问答',
    meeting: '视频会议',
    mail: '邮箱',
    kb: '知识库',
    task: '任务',
    sheet: '多维表格',
    assistant: '工作助手',
    discover: '发现',
    password: '密码管理',
    bankcard: '银行卡'
  };

  var editBtn = document.getElementById('moreEditBtn');
  if (editBtn) {
    editBtn.addEventListener('click', function () {
      toast('编辑应用（演示）');
    });
  }

  var aiBtn = document.getElementById('moreAiBtn');
  if (aiBtn) {
    aiBtn.addEventListener('click', function () {
      toast('AI（演示）');
    });
  }

  var bizBtn = document.getElementById('moreBizCenter');
  if (bizBtn) {
    bizBtn.addEventListener('click', function () {
      var api = window.SaLivePromoSession;
      var info = api && typeof api.identity === 'function' ? api.identity() : null;
      if (info && info.role === 'bd') {
        var map = {
          HGH00002: 'STORE-YY',
          BJS00001: 'STORE-BJ',
          TSN00001: 'STORE-CN',
          SHA00001: 'STORE-HP',
          HGH00001: 'STORE-YY'
        };
        var sid = map[info.storeId] || 'STORE-YY';
        window.location.href =
          'biz-center.html?role=bd&from=bd-app&storeId=' + encodeURIComponent(sid);
        return;
      }
      window.location.href = 'biz-center.html?from=store-app';
    });
  }

  var grid = document.getElementById('moreGrid');
  if (grid) {
    grid.addEventListener('click', function (e) {
      var item = e.target.closest('[data-more]');
      if (!item) return;
      var key = item.getAttribute('data-more');
      if (key === 'password') {
        window.location.href = 'password.html';
        return;
      }
      if (key === 'bankcard') {
        window.location.href = 'bank-cards.html';
        return;
      }
      toast((LABELS[key] || '功能') + '（演示）');
    });
  }
})();
