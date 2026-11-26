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

  var isSupplier = !!(window.FybOrg && window.FybOrg.isSupplier && window.FybOrg.isSupplier());
  document.body.setAttribute('data-fyb-role', isSupplier ? 'supplier' : 'store');
  var tabbar = document.querySelector('.sa-tabbar');
  if (tabbar) tabbar.classList.toggle('sa-tabbar--no-biz', !!isSupplier);
  var bizBtn = document.getElementById('moreBizCenter');
  if (bizBtn) {
    /* 供应商底栏不展示数据中心（基础工具已有） */
    bizBtn.hidden = !!isSupplier;
    if (isSupplier) {
      bizBtn.setAttribute('aria-hidden', 'true');
      bizBtn.style.display = 'none';
    } else {
      bizBtn.style.display = '';
    }
    bizBtn.addEventListener('click', function () {
      if (window.FybOrg && window.FybOrg.isSupplier && window.FybOrg.isSupplier()) {
        window.location.href = 'biz-supplier-home.html';
        return;
      }
      var api = window.SaLivePromoSession;
      var info = api && typeof api.identity === 'function' ? api.identity() : null;
      if (info && info.role === 'bd') {
        var map = {
          HGH00002: 'S-XX',
          BJS00001: 'S-BJ',
          TSN00001: 'S-CN',
          SHA00001: 'S-HP',
          HGH00001: 'S-CN'
        };
        var sid = map[info.storeId] || '';
        if (!sid) {
          window.location.href = 'biz-bd-center.html?from=bd-app&role=bd';
          return;
        }
        window.location.href =
          'biz-bd-store.html?role=bd&from=bd-app&storeId=' + encodeURIComponent(sid) + '&returnTo=center';
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
