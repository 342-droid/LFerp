/**
 * 营销活动 — 手动派发红包表单（单个会员 / 批量发放 / 等级 / 标签 / 分群）
 */
(function () {
  'use strict';

  var Store = window.MdmMarketingCashRedpackStore;
  if (!Store) return;

  var wp = window.wmsPath || {
    page: function (f) {
      return f;
    }
  };
  var pageParams = new URLSearchParams(window.location.search || '');
  var pageMode = pageParams.get('mode') || 'add';
  var auditId = pageParams.get('auditId') || '';
  var fromAudit = pageParams.get('from') === 'audit' || pageMode === 'audit' || pageMode === 'view';
  var formLocked = false;

  var TAG_GROUPS = [
    {
      id: 'TG10001',
      name: '活跃度',
      rule: '多选',
      tags: [
        { id: 'TV10001', name: '高活跃' },
        { id: 'TV10002', name: '中活跃' },
        { id: 'TV10003', name: '低活跃', disabled: true }
      ]
    },
    {
      id: 'TG10002',
      name: '消费偏好',
      rule: '多选',
      tags: [
        { id: 'TV10004', name: '储值' },
        { id: 'TV10005', name: '复购' }
      ]
    },
    {
      id: 'TG10003',
      name: '生命周期',
      rule: '多选',
      tags: [{ id: 'TV10006', name: '新客' }]
    }
  ];
  var SEGMENTS = [
    { id: 'AG10001', name: '高价值复购客群' },
    { id: 'AG10002', name: '沉睡唤回-海鲜偏好' }
  ];
  var MANUAL_USERS = [
    { id: 'U10001', name: '小程序用户A', phone: '138****2211', digits: '13800002211', port: 'mini', levelId: 'ML10004', tags: ['TV10001'], segments: ['AG10001'] },
    { id: 'U10002', name: 'APP会员B', phone: '139****9033', digits: '13900009033', port: 'app', levelId: 'ML10003', tags: ['TV10004'], segments: ['AG10001'] },
    { id: 'U10004', name: '演示会员4', phone: '137****1004', digits: '13700001004', port: 'app', levelId: 'ML10002', tags: ['TV10005'], segments: ['AG10002'] },
    { id: 'U10006', name: '演示会员6', phone: '136****6606', digits: '13600006606', port: 'mini', levelId: 'ML10001', tags: ['TV10006'], segments: ['AG10002'] },
    { id: 'U10086', name: '宁静致远', phone: '159****4315', digits: '15900004315', port: 'app', levelId: 'ML10002', tags: ['TV10001'], segments: ['AG10001'] }
  ];
  var LEVEL_FALLBACK = [
    { id: 'ML10004', name: '普通会员' },
    { id: 'ML10003', name: '银牌会员' },
    { id: 'ML10002', name: '金牌会员' },
    { id: 'ML10001', name: '钻石会员' }
  ];
  var manualSelected = {};
  var manualAmounts = {};
  var levelSelected = {};
  var tagSelected = {};
  var segmentSelected = {};
  var audienceAmounts = {};
  var excelUsers = [];
  var excelErrors = [];
  var excelFileName = '';
  var readingExcelName = '';
  var excelPage = 1;
  var excelEditing = -1;
  var EXCEL_PAGE_SIZE = 20;
  var EXCEL_MAX_ROWS = 100000;
  var EXCEL_MAX_BYTES = 20 * 1024 * 1024;
  var EXCEL_HEADERS = ['会员ID', '用户手机号', '奖励金额', '前台备注', '后台备注'];
  /** 用户收款时可见的前台备注，对齐微信转账备注上限 */
  var FRONT_REMARK_MAX = 32;

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type || 'info');
  }

  function listHref() {
    if (fromAudit) return wp.page('mdm_audit_cash_redpack_manual.html');
    return wp.page('mdm_marketing_cash_redpack_manual.html');
  }

  function setHidden(el, hidden) {
    if (el) el.hidden = !!hidden;
  }

  function detailHref(batchId) {
    return (
      wp.page('mdm_marketing_cash_redpack.html') +
      '?tab=detail&activityId=' +
      encodeURIComponent(batchId)
    );
  }

  function showDispatchModal(batchId) {
    var link = document.getElementById('crManualDispatchDetail');
    var backdrop = document.getElementById('crManualDispatchBackdrop');
    if (link) link.href = detailHref(batchId);
    if (backdrop) backdrop.hidden = false;
  }

  function refreshFormPage() {
    window.location.reload();
  }

  function selectedPorts() {
    var ports = [];
    document.querySelectorAll('input[name="crManualPort"]:checked').forEach(function (el) {
      if ((el.value === 'mini' || el.value === 'app') && ports.indexOf(el.value) < 0) ports.push(el.value);
    });
    return ports;
  }

  function applyPorts(ports) {
    var chosen = Array.isArray(ports) ? ports : [];
    document.querySelectorAll('input[name="crManualPort"]').forEach(function (el) {
      el.checked = chosen.indexOf(el.value) >= 0;
    });
  }

  function selectedMode() {
    var el = document.querySelector('input[name="crManualMode"]:checked');
    var value = el && el.value;
    if (value === 'batch' || value === 'level' || value === 'tag' || value === 'segment') return value;
    return 'single';
  }

  function amountMode() {
    return 'unified';
  }

  function rewardAmountText() {
    return String((document.getElementById('crManualReward') || {}).value || '').trim();
  }

  function unifiedAmount() {
    var text = rewardAmountText();
    if (rewardAmountError(text)) return 0;
    return Store.toMoney(text);
  }

  var REWARD_AMOUNT_HINT = '单用户单笔金额不得超过200';

  function rewardAmountError(raw) {
    var text = typeof raw === 'number' && isFinite(raw) ? String(raw) : String(raw == null ? '' : raw).replace(/元/g, '').replace(/,/g, '').trim();
    if (typeof raw === 'number' && isFinite(raw)) {
      if (Math.abs(raw * 100 - Math.round(raw * 100)) > 1e-6) return REWARD_AMOUNT_HINT;
      text = String(Math.round(raw * 100) / 100);
    }
    if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(text)) return REWARD_AMOUNT_HINT;
    var cents = Math.round(Store.toMoney(text) * 100);
    if (!(cents > 0) || cents > 20000) return REWARD_AMOUNT_HINT;
    return '';
  }

  function remarkText(id) {
    return String((document.getElementById(id) || {}).value || '').trim();
  }

  function selectedTransferScene() {
    return String((document.getElementById('crManualTransferScene') || {}).value || 'cash_marketing');
  }

  function syncUserPerception(preferred) {
    var scene = Store.transferSceneById(selectedTransferScene());
    var sel = document.getElementById('crManualUserPerception');
    var want = preferred != null && preferred !== '' ? String(preferred) : sel ? sel.value : '';
    if (!sel) return;
    var known = (scene.perceptions || []).some(function (item) {
      return item.id === want;
    });
    if (!known) want = (scene.perceptions[0] || {}).id || '';
    sel.innerHTML = (scene.perceptions || [])
      .map(function (item) {
        return '<option value="' + escapeHtml(item.id) + '">' + escapeHtml(item.label) + '</option>';
      })
      .join('');
    sel.value = want;
  }

  function frontRemarkError(raw) {
    if (String(raw == null ? '' : raw).trim().length > FRONT_REMARK_MAX) return '前台备注最多32个字符';
    return '';
  }

  function memberKind() {
    var el = document.querySelector('input[name="crMemberKind"]:checked');
    return el && el.value === 'id' ? 'id' : 'phone';
  }

  function memberKindLabel() {
    return memberKind() === 'id' ? '会员ID' : '会员手机号';
  }

  function syncMemberPlaceholder() {
    var input = document.getElementById('crManualMemberInput');
    if (!input) return;
    input.placeholder = '输入多条请用逗号拼接，最多支持200个' + memberKindLabel();
  }

  function memberTokens() {
    return String((document.getElementById('crManualMemberInput') || {}).value || '')
      .split(/[,，]/)
      .map(function (item) {
        return item.trim();
      })
      .filter(Boolean);
  }

  function findMember(token, kind) {
    var text = String(token || '').trim();
    if (kind === 'id') {
      return MANUAL_USERS.filter(function (u) {
        return u.id === text;
      })[0];
    }
    var digits = text.replace(/\D/g, '');
    return MANUAL_USERS.filter(function (u) {
      return (digits && u.digits === digits) || u.phone === text;
    })[0];
  }

  function resolveSingleUsers() {
    var kind = memberKind();
    var label = memberKindLabel();
    var tokens = memberTokens();
    var seen = {};
    var unique = [];
    tokens.forEach(function (token) {
      if (seen[token]) return;
      seen[token] = true;
      unique.push(token);
    });
    if (!unique.length) return { ok: false, message: '请输入' + label, users: [], missing: [] };
    if (unique.length > 200) return { ok: false, message: '最多支持200个' + label, users: [], missing: [] };
    var users = [];
    var missing = [];
    unique.forEach(function (token) {
      var found = findMember(token, kind);
      if (found) users.push(found);
      else missing.push(token);
    });
    if (missing.length) return { ok: false, message: '未找到' + label + '：' + missing[0], users: users, missing: missing };
    return { ok: true, message: '', users: users, missing: [] };
  }

  function paintSingleHint() {
    var hint = document.getElementById('crManualSingleHint');
    if (!hint) return;
    var result = resolveSingleUsers();
    var label = memberKindLabel();
    if (!memberTokens().length) {
      hint.textContent = '请输入' + label;
      return;
    }
    if (!result.ok && !result.users.length) {
      hint.textContent = result.message;
      return;
    }
    var each = unifiedAmount();
    var total = each >= 0.01 ? each * result.users.length : 0;
    hint.textContent =
      '已识别 ' +
      result.users.length +
      ' 个' +
      label +
      (result.missing.length ? '，未找到 ' + result.missing.length + ' 个' : '') +
      (total > 0 ? '，合计 ' + Store.toMoney(total).toFixed(2) + ' 元' : '，请输入奖励金额');
  }

  function levelOptions() {
    var Data = window.MdmMemberLevelData;
    var list = Data && Data.loadLevelList ? Data.loadLevelList() : [];
    var enabled = (list || []).filter(function (level) {
      return level && level.status !== '禁用' && level.id && level.name;
    });
    if (!enabled.length) return LEVEL_FALLBACK.slice();
    return enabled
      .slice()
      .sort(function (a, b) {
        return Number(a.growthValue || 0) - Number(b.growthValue || 0);
      })
      .map(function (level) {
        return { id: String(level.id), name: String(level.name) };
      });
  }

  function syncRewardFields() {
    var batch = selectedMode() === 'batch';
    ['crManualRewardField', 'crManualFrontField', 'crManualBackField'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.hidden = batch;
    });
  }

  function maskPhone(phone) {
    var d = String(phone || '').replace(/\D/g, '');
    if (d.length !== 11) return String(phone || '').trim();
    return d.slice(0, 3) + '****' + d.slice(7);
  }

  function usersForPort() {
    var kw = String((document.getElementById('crManualKeyword') || {}).value || '')
      .trim()
      .toLowerCase();
    return MANUAL_USERS.filter(function (u) {
      if (!kw) return true;
      return (u.id + ' ' + u.name + ' ' + u.phone + ' ' + u.digits).toLowerCase().indexOf(kw) >= 0;
    });
  }

  function paintPickHint() {
    var hint = document.getElementById('crManualHint');
    if (!hint) return;
    var ids = Object.keys(manualSelected).filter(function (id) {
      var u = MANUAL_USERS.filter(function (item) {
        return item.id === id;
      })[0];
      return !!u;
    });
    var total = 0;
    if (amountMode() === 'unified') {
      var each = unifiedAmount();
      if (each >= 0.01) total = each * ids.length;
    } else {
      ids.forEach(function (id) {
        var n = Store.toMoney(manualAmounts[id]);
        if (n >= 0.01) total += n;
      });
    }
    hint.textContent =
      '已选 ' +
      ids.length +
      ' 人' +
      (total > 0 ? '，合计 ' + Store.toMoney(total).toFixed(2) + ' 元' : '，请输入奖励金额');
  }

  function renderManualUsers() {
    var box = document.getElementById('crManualUserList');
    var allBox = document.getElementById('crManualCheckAll');
    if (!box) return;
    var rows = usersForPort();
    if (!rows.length) {
      box.innerHTML =
        '<div class="mkt-cr-user-empty">' +
        '没有匹配的会员' +
        '</div>';
      if (allBox) allBox.checked = false;
      paintPickHint();
      return;
    }
    box.innerHTML = rows
      .map(function (u) {
        var on = !!manualSelected[u.id];
        var amount = manualAmounts[u.id] != null ? manualAmounts[u.id] : '';
        var amountHtml =
          amountMode() === 'each'
            ? '<span class="mkt-cr-user-amount"><input class="erp-input" type="number" min="0.01" step="0.01" placeholder="发放金额" data-amount="' +
              escapeHtml(u.id) +
              '" value="' +
              escapeHtml(amount) +
              '">元</span>'
            : '';
        return (
          '<div class="mkt-cr-user-row">' +
          '<label class="mkt-cr-user-row__main">' +
          '<input type="checkbox" data-user="' +
          escapeHtml(u.id) +
          '"' +
          (on ? ' checked' : '') +
          '>' +
          '<span class="mkt-cr-user-row__name">' +
          escapeHtml(u.name) +
          '</span>' +
          '<span class="mkt-cr-user-row__meta">' +
          escapeHtml(u.id) +
          ' · ' +
          escapeHtml(u.phone) +
          '</span></label>' +
          amountHtml +
          '</div>'
        );
      })
      .join('');
    if (allBox) {
      allBox.checked = rows.every(function (u) {
        return !!manualSelected[u.id];
      });
    }
    paintPickHint();
  }

  function findKnown(id, digits) {
    return MANUAL_USERS.filter(function (u) {
      if (id && u.id.toLowerCase() === id.toLowerCase()) return true;
      return digits && digits.length === 11 && u.digits === digits;
    })[0];
  }

  function normalizeExcelHeader(value) {
    return String(value == null ? '' : value)
      .replace(/[（(][^）)]*[）)]/g, '')
      .replace(/\s/g, '');
  }

  function excelHeadersMatch(headerRow) {
    var got = (headerRow || []).map(normalizeExcelHeader).filter(function (name) {
      return !!name;
    });
    if (got.length !== EXCEL_HEADERS.length) return false;
    return EXCEL_HEADERS.every(function (name, index) {
      return got[index] === name;
    });
  }

  function excelCellText(value) {
    if (value == null) return '';
    if (typeof value === 'number' && isFinite(value)) {
      if (Math.abs(value - Math.round(value)) < 1e-8) return String(Math.round(value));
      return String(value);
    }
    return String(value).trim();
  }

  function paintExcelFile() {
    var chip = document.getElementById('crManualExcelFile');
    var nameEl = document.getElementById('crManualExcelFileName');
    var btn = document.getElementById('crManualUploadBtn');
    var has = !!excelFileName;
    if (chip) chip.hidden = !has;
    if (nameEl) nameEl.textContent = excelFileName;
    if (btn) btn.classList.toggle('is-locked', has);
  }

  function paintExcelTable() {
    paintExcelFile();
  }

  function showImportResult(total) {
    var backdrop = document.getElementById('crManualImportBackdrop');
    var body = document.getElementById('crManualImportBody');
    if (!backdrop || !body) return;
    var failHtml = excelErrors.length
      ? '<ul class="mkt-cr-import-errors">' +
        excelErrors.slice(0, 20).map(function (line) {
          return '<li>' + escapeHtml(line) + '</li>';
        }).join('') +
        (excelErrors.length > 20 ? '<li>仅展示前 20 条失败原因</li>' : '') +
        '</ul>'
      : '';
    body.innerHTML =
      '<div class="mkt-cr-import-stats">' +
      '<span>总数<strong>' + total + '</strong></span>' +
      '<span class="is-ok">成功<strong>' + excelUsers.length + '</strong></span>' +
      '<span class="is-bad">失败<strong>' + excelErrors.length + '</strong></span>' +
      '</div>' +
      failHtml;
    backdrop.hidden = false;
  }

  function closeImportResult() {
    var backdrop = document.getElementById('crManualImportBackdrop');
    if (backdrop) backdrop.hidden = true;
  }

  function phoneDigits(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function resolveExcelMember(id, phoneRaw) {
    var digits = phoneDigits(phoneRaw);
    if (phoneRaw && digits.length !== 11) return { error: '用户手机号格式不正确' };
    var byId = id ? findKnown(id, '') : null;
    var byPhone = digits ? findKnown('', digits) : null;
    if (byId && byPhone && byId.id !== byPhone.id) return { error: '会员ID与用户手机号不匹配' };
    if (byId && digits && byId.digits !== digits) return { error: '会员ID与用户手机号不匹配' };
    if (!byId && byPhone && id && byPhone.id.toLowerCase() !== String(id).toLowerCase()) return { error: '会员ID与用户手机号不匹配' };
    var known = byId || byPhone;
    var memberId = known ? known.id : id || 'P' + digits;
    return {
      id: memberId,
      name: known ? known.name : '用户',
      phone: known ? known.phone : maskPhone(digits),
      port: known ? known.port : '',
      key: known ? known.id : id || digits
    };
  }

  function parseSheetMatrix(matrix) {
    excelUsers = [];
    excelErrors = [];
    excelPage = 1;
    var seen = {};
    var total = 0;
    (matrix || []).forEach(function (row, index) {
      var cells = row || [];
      var id = excelCellText(cells[0]);
      var phoneRaw = excelCellText(cells[1]);
      var amountRaw = cells[2];
      var front = excelCellText(cells[3]);
      var back = excelCellText(cells[4]);
      var amountText = excelCellText(amountRaw);
      if (!id && !phoneRaw && !amountText && !front && !back) return;
      total += 1;
      var lineNo = index + 2;
      if (!id && !phoneRaw) {
        excelErrors.push('第 ' + lineNo + ' 行会员ID和用户手机号请至少填写一项');
        return;
      }
      var member = resolveExcelMember(id, phoneRaw);
      if (member.error) {
        excelErrors.push('第 ' + lineNo + ' 行' + member.error);
        return;
      }
      var amountError = rewardAmountError(amountRaw === '' || amountRaw == null ? '' : amountRaw);
      if (amountError) {
        excelErrors.push('第 ' + lineNo + ' 行：' + amountError);
        return;
      }
      var frontError = frontRemarkError(front);
      if (frontError) {
        excelErrors.push('第 ' + lineNo + ' 行' + frontError);
        return;
      }
      if (seen[member.key]) {
        excelErrors.push('第 ' + lineNo + ' 行会员ID或用户手机号重复');
        return;
      }
      seen[member.key] = true;
      excelUsers.push({
        id: member.id,
        name: member.name,
        phone: member.phone,
        port: member.port,
        amount: Store.toMoney(amountRaw),
        frontRemark: front,
        backRemark: back
      });
    });
    excelFileName = readingExcelName;
    paintExcelTable();
    if (!total) {
      toast('表格里没有可发放的会员', 'warning');
      return;
    }
    showImportResult(total);
  }

  function readWorkbook(file) {
    if (excelFileName) return;
    if (file.size > EXCEL_MAX_BYTES) {
      toast('上传文档的大小不超过20M', 'warning');
      return;
    }
    readingExcelName = file.name;
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var data = new Uint8Array(e.target.result);
        var wb = window.XLSX.read(data, { type: 'array' });
        var sheet = wb.Sheets[wb.SheetNames[0]];
        var matrix = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });
        if (!matrix.length || !excelHeadersMatch(matrix[0])) {
          toast('上传文档的字段顺序请按照表格模板，请勿错漏', 'warning');
          return;
        }
        var body = matrix.slice(1);
        var filled = body.filter(function (row) {
          return (row || []).some(function (cell) {
            return excelCellText(cell) !== '';
          });
        });
        if (filled.length > EXCEL_MAX_ROWS) {
          toast('建议每个文档会员数量100,000以下，超出请分批上传', 'warning');
          return;
        }
        parseSheetMatrix(body);
      } catch (err) {
        excelUsers = [];
        excelErrors = [];
        paintExcelTable();
        toast('Excel 解析失败', 'warning');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function downloadTemplate() {
    if (!window.XLSX) {
      toast('Excel 组件未加载', 'warning');
      return;
    }
    var headers = ['会员ID(二选一必填)', '用户手机号(二选一必填)', '奖励金额(必填)', '前台备注(选填，最多32个字符)', '后台备注(选填)'];
    var wb = window.XLSX.utils.book_new();
    var ws = window.XLSX.utils.aoa_to_sheet([headers]);
    ws['!cols'] = [{ wch: 22 }, { wch: 24 }, { wch: 18 }, { wch: 36 }, { wch: 24 }];
    window.XLSX.utils.book_append_sheet(wb, ws, '批量发放');
    window.XLSX.writeFile(wb, '手动发放红包批量模板.xlsx');
  }

  function clearExcelUsers() {
    excelUsers = [];
    excelErrors = [];
    excelPage = 1;
    excelEditing = -1;
    excelFileName = '';
    readingExcelName = '';
    paintExcelTable();
    closeImportResult();
    closeExcelEdit();
  }

  function openExcelEdit(index) {
    var user = excelUsers[index];
    var backdrop = document.getElementById('crManualEditBackdrop');
    if (!user || !backdrop) return;
    excelEditing = index;
    document.getElementById('crManualEditId').value = user.id || '';
    document.getElementById('crManualEditPhone').value = user.phone && user.phone !== '—' ? user.phone : '';
    document.getElementById('crManualEditAmount').value = Store.toMoney(user.amount).toFixed(2);
    document.getElementById('crManualEditFront').value = user.frontRemark || '';
    document.getElementById('crManualEditBack').value = user.backRemark || '';
    document.getElementById('crManualEditError').textContent = '';
    backdrop.hidden = false;
  }

  function closeExcelEdit() {
    excelEditing = -1;
    var backdrop = document.getElementById('crManualEditBackdrop');
    if (backdrop) backdrop.hidden = true;
  }

  function saveExcelEdit() {
    var user = excelUsers[excelEditing];
    if (!user) return;
    var amount = (document.getElementById('crManualEditAmount') || {}).value;
    var error = rewardAmountError(amount);
    var errorEl = document.getElementById('crManualEditError');
    if (error) {
      if (errorEl) errorEl.textContent = error;
      return;
    }
    var front = remarkText('crManualEditFront');
    if (frontRemarkError(front)) {
      if (errorEl) errorEl.textContent = '前台备注最多32个字符';
      return;
    }
    user.amount = Store.toMoney(amount);
    user.frontRemark = front;
    user.backRemark = remarkText('crManualEditBack');
    closeExcelEdit();
    paintExcelTable();
  }

  function tagGroupById(id) {
    for (var i = 0; i < TAG_GROUPS.length; i++) {
      if (TAG_GROUPS[i].id === id) return TAG_GROUPS[i];
    }
    return null;
  }

  function enabledTags(group) {
    return (group.tags || []).filter(function (tag) {
      return !tag.disabled;
    });
  }

  function audienceState(kind) {
    if (kind === 'level') return { picked: levelSelected, box: 'crManualLevelUsers', hint: 'crManualLevelHint', empty: '请选择会员等级' };
    if (kind === 'segment') return { picked: segmentSelected, box: 'crManualSegmentUsers', hint: 'crManualSegmentHint', empty: '请选择人群' };
    return { picked: tagSelected, box: 'crManualTagUsers', hint: 'crManualTagHint', empty: '请选择会员标签' };
  }

  function usersMatching(key) {
    var state = audienceState(key);
    var ids = Object.keys(state.picked).filter(function (id) {
      return state.picked[id];
    });
    if (!ids.length) return [];
    if (key === 'level') {
      return MANUAL_USERS.filter(function (u) {
        return ids.indexOf(u.levelId) >= 0;
      });
    }
    var field = key === 'segment' ? 'segments' : 'tags';
    return MANUAL_USERS.filter(function (u) {
      return (u[field] || []).some(function (id) {
        return ids.indexOf(id) >= 0;
      });
    });
  }

  function paintAudience(kind, skipList) {
    var users = usersMatching(kind);
    var state = audienceState(kind);
    var hint = document.getElementById(state.hint);
    var picked = state.picked;
    var hasPick = Object.keys(picked).some(function (id) {
      return picked[id];
    });
    if (!hint) return;
    if (!hasPick) {
      hint.textContent = '';
      hint.hidden = true;
      return;
    }
    hint.hidden = false;
    var each = unifiedAmount();
    var total = each >= 0.01 ? each * users.length : 0;
    hint.textContent =
      '命中 ' + users.length + ' 人' + (total > 0 ? '，合计 ' + Store.toMoney(total).toFixed(2) + ' 元' : '，请输入奖励金额');
  }

  function renderTagBox() {
    var box = document.getElementById('crManualTagBox');
    if (!box) return;
    box.innerHTML = TAG_GROUPS.map(function (group) {
      var enabled = enabledTags(group);
      var allOn = enabled.length && enabled.every(function (tag) {
        return !!tagSelected[tag.id];
      });
      var tags = group.tags
        .map(function (tag) {
          var input =
            '<input type="checkbox" data-tag-id="' +
            escapeHtml(tag.id) +
            '" data-tag-group="' +
            escapeHtml(group.id) +
            '"' +
            (tag.disabled ? ' disabled' : '') +
            (tagSelected[tag.id] ? ' checked' : '') +
            '>';
          return (
            '<label class="mkt-cr-tag-check' +
            (tag.disabled ? ' is-disabled' : '') +
            '">' +
            input +
            '<span>' +
            escapeHtml(tag.name) +
            (tag.disabled ? '（禁用）' : '') +
            '</span></label>'
          );
        })
        .join('');
      var all =
        '<label class="mkt-cr-tag-group__all"><input type="checkbox" data-tag-all="' +
        escapeHtml(group.id) +
        '"' +
        (allOn ? ' checked' : '') +
        '> 全选</label>';
      return (
        '<div class="mkt-cr-tag-group">' +
        '<div class="mkt-cr-tag-group__head"><strong>' +
        escapeHtml(group.name) +
        '</strong>' +
        all +
        '</div><div class="mkt-cr-tag-group__tags">' +
        tags +
        '</div></div>'
      );
    }).join('');
    paintAudience('tag');
  }

  function renderLevelBox() {
    var box = document.getElementById('crManualLevelBox');
    if (!box) return;
    box.innerHTML = levelOptions()
      .map(function (level) {
        return (
          '<label class="mkt-cr-tag-check"><input type="checkbox" data-level-id="' +
          escapeHtml(level.id) +
          '"' +
          (levelSelected[level.id] ? ' checked' : '') +
          '><span>' +
          escapeHtml(level.name) +
          '</span></label>'
        );
      })
      .join('');
    paintAudience('level');
  }

  function renderSegmentBox() {
    var box = document.getElementById('crManualSegmentBox');
    if (!box) return;
    box.innerHTML = SEGMENTS.map(function (seg) {
      return (
        '<label class="mkt-cr-tag-check"><input type="checkbox" data-segment-id="' +
        escapeHtml(seg.id) +
        '"' +
        (segmentSelected[seg.id] ? ' checked' : '') +
        '><span>' +
        escapeHtml(seg.name) +
        '</span></label>'
      );
    }).join('');
    paintAudience('segment');
  }

  function syncMode() {
    var mode = selectedMode();
    var singleField = document.getElementById('crManualSingleField');
    var excelField = document.getElementById('crManualExcelField');
    var levelField = document.getElementById('crManualLevelField');
    var tagField = document.getElementById('crManualTagField');
    var segmentField = document.getElementById('crManualSegmentField');
    if (singleField) singleField.hidden = mode !== 'single';
    if (excelField) excelField.hidden = mode !== 'batch';
    if (levelField) levelField.hidden = mode !== 'level';
    if (tagField) tagField.hidden = mode !== 'tag';
    if (segmentField) segmentField.hidden = mode !== 'segment';
    syncRewardFields();
    syncMemberPlaceholder();
  }

  function chosenUsers() {
    var mode = selectedMode();
    var shared = unifiedAmount();
    if (mode === 'batch') {
      return excelUsers.map(function (u) {
        return Object.assign({}, u, {
          amount: Store.toMoney(u.amount),
          frontRemark: String(u.frontRemark || '').trim(),
          backRemark: String(u.backRemark || '').trim()
        });
      });
    }
    if (mode === 'single') {
      return resolveSingleUsers().users.map(function (u) {
        return Object.assign({}, u, { amount: shared });
      });
    }
    if (mode === 'level' || mode === 'tag' || mode === 'segment') {
      return usersMatching(mode).map(function (u) {
        return Object.assign({}, u, { amount: shared });
      });
    }
    return [];
  }

  function currentCreator() {
    var user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (user && typeof user === 'object') {
      var name = String(user.name || user.realName || user.nickname || '').trim();
      var account = String(user.account || user.username || user.loginName || '').trim();
      if (name && account && name !== account) return name + ' / ' + account;
      if (name || account) return name || account;
    }
    return '演示运营';
  }

  function selectedTrigger() {
    var el = document.querySelector('input[name="crManualTrigger"]:checked');
    return el && el.value === 'schedule' ? 'schedule' : 'now';
  }

  function syncTrigger() {
    var wrap = document.getElementById('crManualTriggerAtWrap');
    if (wrap) wrap.hidden = selectedTrigger() !== 'schedule';
  }

  function localNowKey() {
    var date = new Date();
    function pad(n) { return n < 10 ? '0' + n : String(n); }
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':00';
  }

  function readTriggerAt() {
    var raw = String((document.getElementById('crManualTriggerAt') || {}).value || '').trim();
    if (!raw) return '';
    var text = raw.replace('T', ' ');
    return text.length === 16 ? text + ':00' : text;
  }

  function triggerError() {
    if (selectedTrigger() !== 'schedule') return '';
    var at = readTriggerAt();
    if (!at) return '请选择触发时间';
    if (at <= localNowKey()) return '触发时间须晚于当前时间';
    return '';
  }

  function fillTrigger(mode, at) {
    document.querySelectorAll('input[name="crManualTrigger"]').forEach(function (el) {
      el.checked = el.value === (mode === 'schedule' ? 'schedule' : 'now');
    });
    var input = document.getElementById('crManualTriggerAt');
    if (input) {
      var text = String(at || '').trim();
      input.value = text ? text.replace(' ', 'T').slice(0, 16) : '';
    }
    syncTrigger();
  }

  function submitManualGrant() {
    if (!Store.isEnabled()) {
      toast('请先开启现金红包', 'warning');
      return;
    }
    var name = String((document.getElementById('crManualName') || {}).value || '').trim();
    if (!name) {
      toast('请填写红包名称', 'warning');
      return;
    }
    var ports = selectedPorts();
    if (!ports.length) {
      toast('请至少选择一个活动领取终端', 'warning');
      return;
    }
    var mode = selectedMode();
    if (mode === 'single') {
      var single = resolveSingleUsers();
      if (!single.ok) {
        toast(single.message, 'warning');
        return;
      }
    }
    var users = chosenUsers();
    if (!users.length) {
      var emptyMsg = '请至少选择一位用户';
      if (mode === 'batch') emptyMsg = '请先批量上传会员';
      if (mode === 'level') emptyMsg = Object.keys(levelSelected).some(function (id) { return levelSelected[id]; }) ? '没有命中的会员' : '请选择会员等级';
      if (mode === 'tag') emptyMsg = Object.keys(tagSelected).some(function (id) { return tagSelected[id]; }) ? '没有命中的会员' : '请选择会员标签';
      if (mode === 'segment') emptyMsg = Object.keys(segmentSelected).some(function (id) { return segmentSelected[id]; }) ? '没有命中的会员' : '请选择人群';
      toast(emptyMsg, 'warning');
      return;
    }
    var batchMode = mode === 'batch';
    if (!batchMode && rewardAmountError(rewardAmountText())) {
      toast(rewardAmountText() ? REWARD_AMOUNT_HINT : '请输入奖励金额', 'warning');
      return;
    }
    if (batchMode) {
      var badAmount = users.some(function (u) {
        return !!rewardAmountError(u.amount);
      });
      if (badAmount) {
        toast(REWARD_AMOUNT_HINT, 'warning');
        return;
      }
    }
    var triggerMsg = triggerError();
    if (triggerMsg) {
      toast(triggerMsg, 'warning');
      return;
    }
    var triggerMode = selectedTrigger();
    var frontRemark = batchMode ? '' : remarkText('crManualFrontRemark');
    var backRemark = batchMode ? '' : remarkText('crManualBackRemark');
    if (frontRemarkError(frontRemark) || users.some(function (user) { return !!frontRemarkError(user.frontRemark); })) {
      toast('前台备注最多32个字符', 'warning');
      return;
    }
    var reward = unifiedAmount();
    var pickedIds = function (map) {
      return Object.keys(map).filter(function (id) {
        return map[id];
      });
    };
    var payload = {
      name: name,
      ports: ports,
      mode: mode,
      memberKind: memberKind(),
      memberInput: String((document.getElementById('crManualMemberInput') || {}).value || ''),
      levelIds: pickedIds(levelSelected),
      tagIds: pickedIds(tagSelected),
      segmentIds: pickedIds(segmentSelected),
      users: users,
      reward: batchMode ? 0 : reward,
      frontRemark: frontRemark,
      backRemark: backRemark,
      fileName: excelFileName,
      triggerMode: triggerMode,
      triggerAt: triggerMode === 'schedule' ? readTriggerAt() : '',
      transferScene: selectedTransferScene(),
      userPerception: String((document.getElementById('crManualUserPerception') || {}).value || ''),
      creator: currentCreator()
    };
    if (pageMode === 'edit' && auditId) {
      var resubmit = Store.resubmitManualDraft(auditId, payload);
      if (!resubmit || !resubmit.ok) {
        toast((resubmit && resubmit.message) || '仅草稿可提交', 'warning');
        return;
      }
    } else {
      Store.createManualAudit(payload);
    }
    try {
      sessionStorage.setItem('crManualAuditFlash', '已提交审核，请到审核中心-营销审核-派发红包处理');
    } catch (e) {}
    if (pageMode === 'edit') {
      window.location.href = listHref();
      return;
    }
    window.location.reload();
  }

  function applyAuditSnapshot(audit) {
    var snap = (audit && audit.snapshot) || {};
    var name = document.getElementById('crManualName');
    if (name) name.value = snap.name || '';
    applyPorts(snap.ports);
    document.querySelectorAll('input[name="crManualMode"]').forEach(function (el) {
      el.checked = el.value === (snap.mode || 'single');
    });
    document.querySelectorAll('input[name="crMemberKind"]').forEach(function (el) {
      el.checked = el.value === (snap.memberKind || 'phone');
    });
    var member = document.getElementById('crManualMemberInput');
    if (member) member.value = snap.memberInput || '';
    (snap.levelIds || []).forEach(function (id) {
      levelSelected[id] = true;
    });
    (snap.tagIds || []).forEach(function (id) {
      tagSelected[id] = true;
    });
    (snap.segmentIds || []).forEach(function (id) {
      segmentSelected[id] = true;
    });
    var reward = document.getElementById('crManualReward');
    if (reward && snap.mode !== 'batch' && snap.reward) reward.value = Store.toMoney(snap.reward).toFixed(2);
    var front = document.getElementById('crManualFrontRemark');
    if (front) front.value = snap.frontRemark || '';
    var back = document.getElementById('crManualBackRemark');
    if (back) back.value = snap.backRemark || '';
    fillTrigger(snap.triggerMode, snap.triggerAt);
    var scene = document.getElementById('crManualTransferScene');
    if (scene) scene.value = snap.transferScene || 'cash_marketing';
    syncUserPerception(snap.userPerception || '');
    if (snap.mode === 'batch') {
      excelUsers = (snap.users || []).map(function (u) {
        return Object.assign({}, u);
      });
      excelFileName = snap.fileName || '已上传文件.xlsx';
    }
  }

  function lockFormFields() {
    var card = document.querySelector('.pts-rule-card');
    if (!card) return;
    card.querySelectorAll('input, textarea, select, button').forEach(function (el) {
      el.disabled = true;
    });
  }

  function publishExecNotice(batchId, total, success, fail, fileName, creator) {
    var payload = {
      batchId: batchId,
      fileName: fileName || excelFileName || '—',
      total: total,
      success: success,
      fail: fail,
      module: '冷丰营销-营销活动-现金红包-派发红包',
      creator: creator || '',
      readyAt: Date.now() + 1800
    };
    if (window.LfCashRedpackExecNotice && typeof window.LfCashRedpackExecNotice.publish === 'function') {
      window.LfCashRedpackExecNotice.publish(payload);
      return;
    }
    try {
      localStorage.setItem('mdm_cash_redpack_exec_notice_v1', JSON.stringify({
        id: String(batchId),
        batchId: String(batchId),
        fileName: payload.fileName,
        total: total,
        success: success,
        fail: fail,
        module: payload.module,
        creator: payload.creator,
        readyAt: payload.readyAt,
        acked: false
      }));
    } catch (e) {
      /* 隐私模式忽略 */
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var audit = auditId && Store.findManualAudit ? Store.findManualAudit(auditId) : null;
    if (pageMode === 'edit' && (!audit || audit.status !== 'DRAFT')) {
      toast('仅草稿可编辑', 'warning');
      window.location.href = listHref();
      return;
    }
    if (fromAudit && !audit) {
      toast('未找到审核记录', 'warning');
      window.location.href = listHref();
      return;
    }
    if (pageMode === 'audit' && (!audit || audit.status !== 'PENDING')) pageMode = 'view';
    if (audit) applyAuditSnapshot(audit);
    try {
      var flash = sessionStorage.getItem('crManualAuditFlash');
      if (flash) {
        sessionStorage.removeItem('crManualAuditFlash');
        toast(flash, 'success');
      }
    } catch (e) {}
    var back = document.getElementById('crManualBack');
    if (back) {
      back.href = listHref();
      if (fromAudit) back.textContent = '← 返回派发红包审核';
    }
    var titles = { add: '手动发放', edit: '编辑派发红包', view: '查看派发红包', audit: '审核派发红包' };
    var tab = document.querySelector('.content-tabs button');
    if ((fromAudit || pageMode === 'edit') && tab) tab.textContent = titles[pageMode] || '派发红包';
    if (fromAudit || pageMode === 'edit') document.title = '冷丰WMS - ' + (titles[pageMode] || '派发红包');
    var tip = document.getElementById('crManualTip');
    if (tip && pageMode === 'audit') {
      tip.innerHTML = '以下为提交时的派发信息，只读。<strong>审核成功</strong>后才会执行发放。';
    } else if (tip && pageMode === 'view' && audit) {
      tip.innerHTML = '以下为提交时的派发信息，只读。当前审核状态：<strong>' + escapeHtml(Store.manualAuditStatusLabel(audit.status)) + '</strong>' + (audit.reason ? '。失败原因：' + escapeHtml(audit.reason) : '') + '。';
    }
    renderManualUsers();
    renderLevelBox();
    renderTagBox();
    renderSegmentBox();
    paintExcelTable();
    paintSingleHint();
    syncMode();
    syncTrigger();
    document.querySelectorAll('input[name="crManualTrigger"]').forEach(function (el) {
      el.addEventListener('change', syncTrigger);
    });
    var transferScene = document.getElementById('crManualTransferScene');
    if (transferScene) {
      transferScene.addEventListener('change', function () {
        syncUserPerception('');
      });
    }
    var userPerception = document.getElementById('crManualUserPerception');
    if (userPerception) {
      userPerception.addEventListener('change', function () {
        syncUserPerception();
      });
    }
    if (!audit) syncUserPerception('activity_reward');
    if (!fromAudit && !Store.isEnabled()) {
      var closedTip = document.getElementById('crManualTip');
      if (closedTip) closedTip.innerHTML = '<strong>现金红包已关闭。</strong>请先回到现金红包页开启总开关。';
      var submitBtn = document.getElementById('crManualSubmit');
      if (submitBtn) submitBtn.disabled = true;
    }
    formLocked = fromAudit;
    setHidden(document.getElementById('crManualSubmit'), fromAudit);
    setHidden(document.getElementById('crManualReject'), pageMode !== 'audit');
    setHidden(document.getElementById('crManualApprove'), pageMode !== 'audit');
    var opinion = { read: function () { return ''; } };
    if (window.MdmMarketingAuditPanel && audit) {
      opinion = window.MdmMarketingAuditPanel.mount(document.getElementById('crManualAuditPanel'), audit, pageMode === 'audit');
    }
    if (formLocked) lockFormFields();

    document.querySelectorAll('input[name="crManualPort"]').forEach(function (el) {
      el.addEventListener('change', function () {
        if (!selectedPorts().length) {
          el.checked = true;
          toast('请至少选择一个活动领取终端', 'warning');
        }
      });
    });
    document.querySelectorAll('input[name="crManualMode"]').forEach(function (el) {
      el.addEventListener('change', function () {
        syncMode();
        renderManualUsers();
        paintAudience('level');
        paintAudience('tag');
        paintAudience('segment');
        paintSingleHint();
      });
    });
    document.querySelectorAll('input[name="crMemberKind"]').forEach(function (el) {
      el.addEventListener('change', function () {
        syncMemberPlaceholder();
        paintSingleHint();
      });
    });
    var memberInput = document.getElementById('crManualMemberInput');
    if (memberInput) memberInput.addEventListener('input', paintSingleHint);
    var levelBox = document.getElementById('crManualLevelBox');
    if (levelBox) {
      levelBox.addEventListener('change', function (e) {
        var t = e.target;
        if (!t || !t.getAttribute) return;
        var id = t.getAttribute('data-level-id');
        if (!id) return;
        if (t.checked) levelSelected[id] = true;
        else delete levelSelected[id];
        paintAudience('level');
      });
    }
    var amountInput = document.getElementById('crManualReward');
    if (amountInput) {
      amountInput.addEventListener('input', function () {
        paintPickHint();
        paintSingleHint();
        paintAudience('level', true);
        paintAudience('tag', true);
        paintAudience('segment', true);
      });
    }
    var kw = document.getElementById('crManualKeyword');
    if (kw) kw.addEventListener('input', renderManualUsers);
    var allBox = document.getElementById('crManualCheckAll');
    if (allBox) {
      allBox.addEventListener('change', function () {
        usersForPort().forEach(function (u) {
          if (allBox.checked) manualSelected[u.id] = true;
          else delete manualSelected[u.id];
        });
        renderManualUsers();
      });
    }
    var list = document.getElementById('crManualUserList');
    if (list) {
      list.addEventListener('change', function (e) {
        var box = e.target && e.target.getAttribute ? e.target : null;
        if (!box || !box.getAttribute('data-user')) return;
        var id = box.getAttribute('data-user');
        if (box.checked) manualSelected[id] = true;
        else delete manualSelected[id];
        renderManualUsers();
      });
      list.addEventListener('input', function (e) {
        var input = e.target && e.target.getAttribute ? e.target : null;
        if (!input || !input.getAttribute('data-amount')) return;
        manualAmounts[input.getAttribute('data-amount')] = input.value;
        paintPickHint();
      });
    }
    var tagBox = document.getElementById('crManualTagBox');
    if (tagBox) {
      tagBox.addEventListener('change', function (e) {
        var t = e.target;
        if (!t || !t.getAttribute) return;
        var allId = t.getAttribute('data-tag-all');
        if (allId) {
          var allGroup = tagGroupById(allId);
          enabledTags(allGroup).forEach(function (tag) {
            if (t.checked) tagSelected[tag.id] = true;
            else delete tagSelected[tag.id];
          });
          renderTagBox();
          return;
        }
        var tagId = t.getAttribute('data-tag-id');
        if (!tagId) return;
        if (t.checked) tagSelected[tagId] = true;
        else delete tagSelected[tagId];
        renderTagBox();
      });
    }
    var segmentBox = document.getElementById('crManualSegmentBox');
    if (segmentBox) {
      segmentBox.addEventListener('change', function (e) {
        var t = e.target;
        var segId = t && t.getAttribute ? t.getAttribute('data-segment-id') : '';
        if (!segId) return;
        if (t.checked) segmentSelected[segId] = true;
        else delete segmentSelected[segId];
        renderSegmentBox();
      });
    }
    ['crManualTagUsers', 'crManualSegmentUsers'].forEach(function (boxId) {
      var audienceBox = document.getElementById(boxId);
      if (!audienceBox) return;
      audienceBox.addEventListener('input', function (e) {
        var input = e.target && e.target.getAttribute ? e.target : null;
        if (!input || !input.getAttribute('data-audience-amount')) return;
        audienceAmounts[input.getAttribute('data-audience-amount')] = input.value;
        paintAudience(boxId === 'crManualSegmentUsers' ? 'segment' : 'tag', true);
      });
    });
    var tplBtn = document.getElementById('crManualTplBtn');
    if (tplBtn) tplBtn.addEventListener('click', downloadTemplate);
    var uploadBtn = document.getElementById('crManualUploadBtn');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', function (e) {
        if (!excelFileName) return;
        e.preventDefault();
      });
    }
    var removeFileBtn = document.getElementById('crManualExcelFileRemove');
    if (removeFileBtn) removeFileBtn.addEventListener('click', clearExcelUsers);
    ['crManualImportClose', 'crManualImportOk'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('click', closeImportResult);
    });
    ['crManualEditClose', 'crManualEditCancel'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('click', closeExcelEdit);
    });
    var editSave = document.getElementById('crManualEditSave');
    if (editSave) editSave.addEventListener('click', saveExcelEdit);
    var fileEl = document.getElementById('crManualFile');
    if (fileEl) {
      fileEl.addEventListener('change', function () {
        var file = fileEl.files && fileEl.files[0];
        if (!file) return;
        fileEl.value = '';
        if (!/\.xlsx?$/i.test(file.name)) {
          toast('请上传 xlsx 或 xls 文件', 'warning');
          return;
        }
        readWorkbook(file);
      });
    }
    var cancelBtn = document.getElementById('crManualCancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        window.location.href = listHref();
      });
    }
    var submit = document.getElementById('crManualSubmit');
    if (submit) submit.addEventListener('click', submitManualGrant);
    var approveBtn = document.getElementById('crManualApprove');
    if (approveBtn) {
      approveBtn.addEventListener('click', function () {
        var result = Store.approveManualAudit(auditId, opinion.read());
        if (!result.ok) {
          toast(result.message, 'warning');
          return;
        }
        if (result.scheduled) {
          toast('审核成功，将于 ' + (result.triggerAt || '') + ' 触发发放', 'success');
          window.location.href = listHref();
          return;
        }
        var snap = (result.audit && result.audit.snapshot) || {};
        publishExecNotice(result.batchId, result.total, result.success, result.fail, result.fileName, snap.creator || '');
        toast('审核成功', 'success');
        window.location.href = listHref();
      });
    }
    var rejectBtn = document.getElementById('crManualReject');
    if (rejectBtn) {
      rejectBtn.addEventListener('click', function () {
        var reason = opinion.read();
        if (!reason) {
          toast('请填写驳回原因', 'error');
          return;
        }
        var result = Store.rejectManualAudit(auditId, reason);
        if (!result.ok) {
          toast(result.message, 'warning');
          return;
        }
        toast('已标记审核失败', 'success');
        window.location.href = listHref();
      });
    }
    ['crManualDispatchClose', 'crManualDispatchOk'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('click', refreshFormPage);
    });
  });
})();
