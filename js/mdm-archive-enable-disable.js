/**
 * 门店档案 / 仓库档案 · 停启用预检弹窗（原型）
 * 共享状态：
 * - lferp_store_disabled_v1：供 C 端选店拦截
 * - lferp_warehouse_disabled_v1：业务伙伴仓库档案权威启停，仓储侧履约副本同步读取
 */
(function (global) {
  'use strict';

  var STORE_DISABLED_KEY = 'lferp_store_disabled_v1';
  var WAREHOUSE_DISABLED_KEY = 'lferp_warehouse_disabled_v1';
  var REASON_OPTIONS = ['违规整改', '经营调整', '装修迁址', '暂停经营', '其他'];

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var data = JSON.parse(raw);
      return data && typeof data === 'object' ? data : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      /* ignore */
    }
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function readStoreDisabledMap() {
    return readJson(STORE_DISABLED_KEY, {});
  }

  function setStoreDisabled(entry) {
    var map = readStoreDisabledMap();
    var id = String((entry && entry.id) || '').trim();
    var name = String((entry && entry.name) || '').trim();
    if (!id && !name) return map;
    var key = id || name;
    if (entry && entry.disabled) {
      map[key] = {
        id: id,
        name: name,
        disabled: true,
        at: new Date().toISOString()
      };
      if (name && name !== key) {
        map[name] = map[key];
      }
    } else {
      delete map[key];
      if (name) delete map[name];
    }
    writeJson(STORE_DISABLED_KEY, map);
    return map;
  }

  function isStoreDisabledByMeta(meta) {
    var map = readStoreDisabledMap();
    if (!meta) return false;
    var id = String(meta.id || meta.storeId || '').trim();
    var name = String(meta.name || '').trim();
    if (id && map[id] && map[id].disabled) return true;
    if (name && map[name] && map[name].disabled) return true;
    return false;
  }

  function readWarehouseDisabledMap() {
    return readJson(WAREHOUSE_DISABLED_KEY, {});
  }

  function setWarehouseDisabled(entry) {
    var map = readWarehouseDisabledMap();
    var id = String((entry && entry.id) || '').trim();
    var name = String((entry && entry.name) || '').trim();
    if (!id && !name) return map;
    var key = id || name;
    if (entry && entry.disabled) {
      map[key] = {
        id: id,
        name: name,
        disabled: true,
        at: new Date().toISOString()
      };
      if (name && name !== key) map[name] = map[key];
    } else {
      delete map[key];
      if (name) delete map[name];
    }
    writeJson(WAREHOUSE_DISABLED_KEY, map);
    try {
      global.dispatchEvent(
        new CustomEvent('lferp-warehouse-disabled-changed', { detail: { map: map, entry: entry || null } })
      );
    } catch (e) {
      /* ignore */
    }
    return map;
  }

  function isWarehouseDisabledByMeta(meta) {
    var map = readWarehouseDisabledMap();
    if (!meta) return false;
    var id = String(meta.id || meta.code || meta.warehouseId || '').trim();
    var name = String(meta.name || '').trim();
    if (id && map[id] && map[id].disabled) return true;
    if (name && map[name] && map[name].disabled) return true;
    return false;
  }

  /**
   * 按 localStorage 启停态回写表格状态列（业务伙伴仓库档案 / 仓储·仓库共用）
   * opts: { codeCol, nameCol, statusCol, enabledLabel, disabledLabel, pageManager }
   */
  function applyWarehouseDisabledToTable(tbody, opts) {
    opts = opts || {};
    if (!tbody) return 0;
    var codeCol = opts.codeCol != null ? opts.codeCol : 0;
    var nameCol = opts.nameCol != null ? opts.nameCol : 2;
    var statusCol = opts.statusCol != null ? opts.statusCol : 11;
    var enabledLabel = opts.enabledLabel || '启用';
    var disabledLabel = opts.disabledLabel || '停用';
    var pm = opts.pageManager || null;
    var changed = 0;
    tbody.querySelectorAll('tr').forEach(function (tr) {
      var cells = tr.querySelectorAll('td');
      if (!cells[codeCol] || !cells[statusCol]) return;
      var id = String(cells[codeCol].textContent || '').trim();
      var name = cells[nameCol] ? String(cells[nameCol].textContent || '').trim() : '';
      /* 仅同步业务伙伴档案仓：显式标记，或仓库编号以 WH 开头，避免误改仓储自建示例行 */
      var archiveLinked = tr.getAttribute('data-archive-wh') === '1' || /^WH/i.test(id);
      if (!archiveLinked) return;
      var shouldOff = isWarehouseDisabledByMeta({ id: id, warehouseId: id, code: id, name: name });
      var stSpan = cells[statusCol].querySelector('.status');
      var cur = stSpan
        ? String(stSpan.textContent || '').trim()
        : String(cells[statusCol].textContent || '').trim();
      var nowOff = cur === '停用' || cur === '禁用' || cur === '关闭';
      if (shouldOff === nowOff) return;
      var next = shouldOff ? disabledLabel : enabledLabel;
      if (pm && typeof pm.updateTableRow === 'function') {
        var patch = {};
        patch[statusCol] = { value: next, isStatus: true };
        pm.updateTableRow(tr, patch);
        if (typeof pm.refreshDisableToggleLabel === 'function') {
          pm.refreshDisableToggleLabel(tr);
        }
      } else if (stSpan) {
        stSpan.textContent = next;
        stSpan.className = 'status ' + (shouldOff ? 'inactive' : 'active');
      } else {
        cells[statusCol].innerHTML =
          '<span class="status ' + (shouldOff ? 'inactive' : 'active') + '">' + escapeHtml(next) + '</span>';
      }
      changed += 1;
    });
    return changed;
  }

  function parseCountMap(raw) {
    var out = {};
    String(raw || '')
      .split(',')
      .forEach(function (part) {
        var pair = String(part || '').trim();
        if (!pair) return;
        var idx = pair.indexOf(':');
        if (idx < 0) return;
        var k = pair.slice(0, idx).trim();
        var n = parseInt(pair.slice(idx + 1).trim(), 10);
        if (!k || isNaN(n)) return;
        out[k] = n;
      });
    return out;
  }

  function buildStorePrecheck(tr) {
    var blocksRaw = tr.getAttribute('data-disable-blocks') || '';
    var warnsRaw = tr.getAttribute('data-disable-warns') || '';
    /* 默认演示：有在途则硬阻断；干净行可设 data-disable-blocks="" */
    if (!tr.hasAttribute('data-disable-blocks')) {
      blocksRaw = 'retail:1,proxy:0,aftersale:0,withdraw:0';
    }
    if (!tr.hasAttribute('data-disable-warns')) {
      warnsRaw = 'pendingPay:1,bind:36,balance:128.5';
    }
    var blocks = parseCountMap(blocksRaw);
    var warns = parseCountMap(warnsRaw);
    var hardBlocks = [];
    var warnings = [];
    if (blocks.retail > 0) {
      hardBlocks.push({
        code: 'H1',
        message: '仍有 ' + blocks.retail + ' 笔未完结零售订单（用户单），无法停用',
        count: blocks.retail,
        jumpHint: '零售订单'
      });
    }
    if (blocks.proxy > 0) {
      hardBlocks.push({
        code: 'H1b',
        message: '仍有 ' + blocks.proxy + ' 笔未完结进货单（代采），无法停用',
        count: blocks.proxy,
        jumpHint: '代采订单'
      });
    }
    if (blocks.aftersale > 0) {
      hardBlocks.push({
        code: 'H2',
        message: '仍有 ' + blocks.aftersale + ' 笔未完结售后，无法停用',
        count: blocks.aftersale,
        jumpHint: '售后单'
      });
    }
    if (blocks.withdraw > 0) {
      hardBlocks.push({
        code: 'H5',
        message: '仍有 ' + blocks.withdraw + ' 笔处理中提现，无法停用',
        count: blocks.withdraw,
        jumpHint: '提现记录'
      });
    }
    if (warns.pendingPay > 0) {
      warnings.push({
        code: 'W-pay',
        message: '存在 ' + warns.pendingPay + ' 笔待支付订单（不阻断，建议先关闭或等待超时）'
      });
    }
    if (warns.bind > 0) {
      warnings.push({
        code: 'W-bind',
        message: '仍有 ' + warns.bind + ' 名绑定客户；停用后用户 APP 不可再选该店'
      });
    }
    if (warns.balance > 0) {
      warnings.push({
        code: 'W-bal',
        message: '钱包可用余额 ¥' + warns.balance + '：停用后可提现，不可充值/余额支付'
      });
    }
    warnings.push({
      code: 'W-wh',
      message: '关联仓库不会因本店停用而关闭'
    });
    return {
      canDisable: hardBlocks.length === 0,
      hardBlocks: hardBlocks,
      warnings: warnings
    };
  }

  function buildWarehousePrecheck(tr) {
    var blocksRaw = tr.getAttribute('data-disable-blocks') || '';
    var warnsRaw = tr.getAttribute('data-disable-warns') || '';
    if (!tr.hasAttribute('data-disable-blocks')) {
      blocksRaw = 'refStores:1,outbound:0,inbound:0,transfer:0,task:0';
    }
    if (!tr.hasAttribute('data-disable-warns')) {
      warnsRaw = 'stock:80';
    }
    var blocks = parseCountMap(blocksRaw);
    var warns = parseCountMap(warnsRaw);
    var hardBlocks = [];
    var warnings = [];
    var refNames = String(tr.getAttribute('data-ref-stores') || '')
      .split(/[,，]/)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
    if (blocks.refStores > 0) {
      hardBlocks.push({
        code: 'W-H0',
        message:
          '仍有 ' +
          blocks.refStores +
          ' 家启用门店使用该仓库' +
          (refNames.length ? '（' + refNames.slice(0, 3).join('、') + (refNames.length > 3 ? '…' : '') + '）' : '') +
          '，请先停用相关门店或调整履约仓后再停用仓库',
        count: blocks.refStores,
        jumpHint: '门店档案'
      });
    }
    if (blocks.outbound > 0) {
      hardBlocks.push({
        code: 'W-H1',
        message: '存在 ' + blocks.outbound + ' 笔未完结出库单，无法停用',
        count: blocks.outbound,
        jumpHint: '出库单'
      });
    }
    if (blocks.inbound > 0) {
      hardBlocks.push({
        code: 'W-H2',
        message: '存在 ' + blocks.inbound + ' 笔未完结入库单，无法停用',
        count: blocks.inbound,
        jumpHint: '入库单'
      });
    }
    if (blocks.transfer > 0) {
      hardBlocks.push({
        code: 'W-H3',
        message: '存在 ' + blocks.transfer + ' 笔未完结调拨单，无法停用',
        count: blocks.transfer,
        jumpHint: '调拨单'
      });
    }
    if (blocks.task > 0) {
      hardBlocks.push({
        code: 'W-H5',
        message: '存在 ' + blocks.task + ' 项进行中作业任务，无法停用',
        count: blocks.task,
        jumpHint: '作业任务'
      });
    }
    if (warns.stock > 0) {
      warnings.push({
        code: 'W-W2',
        message: '可用库存约 ' + warns.stock + '：库存保留，停用后不可新出入库'
      });
    }
    return {
      canDisable: hardBlocks.length === 0,
      hardBlocks: hardBlocks,
      warnings: warnings
    };
  }

  function ensureModal() {
    var el = document.getElementById('mdmArchiveEnableDisableModal');
    if (el) return el;
    document.body.insertAdjacentHTML(
      'beforeend',
      '<div id="mdmArchiveEnableDisableModal" class="modal" style="display:none;z-index:12000">' +
        '<div class="modal-content" style="width:560px;max-width:94vw">' +
        '<div class="modal-header">' +
        '<h2 class="modal-title" id="mdmArchEdTitle">停用</h2>' +
        '<span class="close" id="mdmArchEdCloseX">&times;</span>' +
        '</div>' +
        '<div class="modal-body" style="padding:16px 20px;line-height:1.65;color:#333;max-height:70vh;overflow:auto">' +
        '<p id="mdmArchEdLead" style="margin:0 0 12px;color:#555;font-size:13px"></p>' +
        '<div id="mdmArchEdHard" style="display:none;margin-bottom:12px;padding:10px 12px;border:1px solid #ffccc7;background:#fff2f0;border-radius:6px"></div>' +
        '<div id="mdmArchEdWarn" style="display:none;margin-bottom:12px;padding:10px 12px;border:1px solid #ffe58f;background:#fffbe6;border-radius:6px"></div>' +
        '<div id="mdmArchEdForm" style="display:none">' +
        '<div class="form-group" style="margin-bottom:12px">' +
        '<label style="display:block;margin-bottom:6px;font-size:13px">停用原因 <span style="color:#f5222d">*</span></label>' +
        '<select id="mdmArchEdReason" style="width:100%;height:36px;border:1px solid #ddd;border-radius:4px;padding:0 8px"></select>' +
        '</div>' +
        '<div class="form-group" id="mdmArchEdReasonOtherWrap" style="display:none;margin-bottom:12px">' +
        '<label style="display:block;margin-bottom:6px;font-size:13px">说明</label>' +
        '<input id="mdmArchEdReasonOther" type="text" maxlength="100" placeholder="请补充说明" style="width:100%;height:36px;border:1px solid #ddd;border-radius:4px;padding:0 8px;box-sizing:border-box">' +
        '</div>' +
        '<label style="display:flex;gap:8px;align-items:flex-start;margin-bottom:12px;font-size:13px;cursor:pointer">' +
        '<input type="checkbox" id="mdmArchEdAck" style="margin-top:3px">' +
        '<span>我已知晓停用影响，并确认已评估上述风险</span>' +
        '</label>' +
        '<div class="form-group" style="margin-bottom:0">' +
        '<label style="display:block;margin-bottom:6px;font-size:13px">输入名称确认 <span style="color:#f5222d">*</span></label>' +
        '<input id="mdmArchEdNameConfirm" type="text" autocomplete="off" placeholder="" style="width:100%;height:36px;border:1px solid #ddd;border-radius:4px;padding:0 8px;box-sizing:border-box">' +
        '<div style="margin-top:4px;font-size:12px;color:#999">请输入「<span id="mdmArchEdNameHint"></span>」以确认</div>' +
        '</div>' +
        '</div>' +
        '<div id="mdmArchEdEnableBody" style="display:none;font-size:13px;color:#555"></div>' +
        '</div>' +
        '<div class="modal-footer">' +
        '<button type="button" class="btn btn-secondary" id="mdmArchEdCancel">取消</button>' +
        '<button type="button" class="btn btn-primary" id="mdmArchEdOk">确认</button>' +
        '</div></div></div>'
    );
    el = document.getElementById('mdmArchiveEnableDisableModal');
    function hide() {
      el.style.display = 'none';
    }
    document.getElementById('mdmArchEdCancel').addEventListener('click', hide);
    document.getElementById('mdmArchEdCloseX').addEventListener('click', hide);
    el.addEventListener('click', function (e) {
      if (e.target === el) hide();
    });
    var reasonSel = document.getElementById('mdmArchEdReason');
    reasonSel.innerHTML = REASON_OPTIONS.map(function (r) {
      return '<option value="' + escapeHtml(r) + '">' + escapeHtml(r) + '</option>';
    }).join('');
    reasonSel.addEventListener('change', function () {
      document.getElementById('mdmArchEdReasonOtherWrap').style.display =
        reasonSel.value === '其他' ? 'block' : 'none';
    });
    return el;
  }

  function listHtml(title, items, tone) {
    if (!items || !items.length) return '';
    var color = tone === 'hard' ? '#a8071a' : '#ad6800';
    return (
      '<div style="font-weight:600;margin-bottom:6px;color:' +
      color +
      '">' +
      escapeHtml(title) +
      '</div><ul style="margin:0;padding-left:18px;font-size:13px">' +
      items
        .map(function (it) {
          return (
            '<li style="margin-bottom:4px">' +
            escapeHtml(it.message) +
            (it.jumpHint
              ? ' <span style="color:#999">[' + escapeHtml(it.jumpHint) + ']</span>'
              : '') +
            '</li>'
          );
        })
        .join('') +
      '</ul>'
    );
  }

  /**
   * @param {{
   *   mode: 'disable'|'enable',
   *   entityType: 'store'|'warehouse',
   *   entityName: string,
   *   precheck?: {canDisable:boolean,hardBlocks:Array,warnings:Array},
   *   lead?: string,
   *   onConfirm: function(payload):void
   * }} opts
   */
  function openDialog(opts) {
    opts = opts || {};
    var modal = ensureModal();
    var titleEl = document.getElementById('mdmArchEdTitle');
    var leadEl = document.getElementById('mdmArchEdLead');
    var hardEl = document.getElementById('mdmArchEdHard');
    var warnEl = document.getElementById('mdmArchEdWarn');
    var formEl = document.getElementById('mdmArchEdForm');
    var enableBody = document.getElementById('mdmArchEdEnableBody');
    var okBtn = document.getElementById('mdmArchEdOk');
    var nameInput = document.getElementById('mdmArchEdNameConfirm');
    var nameHint = document.getElementById('mdmArchEdNameHint');
    var ack = document.getElementById('mdmArchEdAck');
    var reasonSel = document.getElementById('mdmArchEdReason');
    var reasonOther = document.getElementById('mdmArchEdReasonOther');
    var entityName = String(opts.entityName || '').trim();
    var isDisable = opts.mode !== 'enable';
    var precheck = opts.precheck || { canDisable: true, hardBlocks: [], warnings: [] };

    titleEl.textContent = isDisable
      ? opts.entityType === 'warehouse'
        ? '停用仓库'
        : '停用门店'
      : opts.entityType === 'warehouse'
        ? '启用仓库'
        : '启用门店';

    if (!isDisable) {
      leadEl.textContent = opts.lead || '确认启用「' + entityName + '」？启用后恢复经营/作业能力。';
      hardEl.style.display = 'none';
      warnEl.style.display = 'none';
      formEl.style.display = 'none';
      enableBody.style.display = 'block';
      enableBody.textContent = '';
      okBtn.disabled = false;
      okBtn.textContent = '确认启用';
      okBtn.onclick = function () {
        modal.style.display = 'none';
        if (typeof opts.onConfirm === 'function') opts.onConfirm({ mode: 'enable' });
      };
      modal.style.display = 'block';
      return;
    }

    leadEl.textContent =
      opts.lead ||
      (opts.entityType === 'warehouse'
        ? '停用后该仓不再承接新的分配/出入库；仓储侧履约仓库同步为停用；关联门店状态不会自动变更。'
        : '停用后用户 APP 不可再选择该门店；不可新下零售/代采单；可提现，不可充值与余额支付；关联仓库不联动停用。');

    hardEl.innerHTML = listHtml('无法停用，请先处理：', precheck.hardBlocks, 'hard');
    hardEl.style.display = precheck.hardBlocks.length ? 'block' : 'none';
    warnEl.innerHTML = listHtml('请确认以下影响：', precheck.warnings, 'warn');
    warnEl.style.display = precheck.warnings.length ? 'block' : 'none';
    enableBody.style.display = 'none';

    var blocked = !precheck.canDisable;
    formEl.style.display = blocked ? 'none' : 'block';
    okBtn.textContent = blocked ? '关闭' : '确认停用';
    okBtn.disabled = false;
    if (blocked) {
      okBtn.onclick = function () {
        modal.style.display = 'none';
      };
      modal.style.display = 'block';
      return;
    }

    reasonSel.value = REASON_OPTIONS[0];
    document.getElementById('mdmArchEdReasonOtherWrap').style.display = 'none';
    reasonOther.value = '';
    ack.checked = false;
    nameHint.textContent = entityName;
    nameInput.value = '';
    nameInput.placeholder = '请输入 ' + entityName;
    okBtn.onclick = function () {
      if (!ack.checked) {
        if (typeof showToast === 'function') showToast('请勾选已知晓停用影响', 'error');
        return;
      }
      if (String(nameInput.value || '').trim() !== entityName) {
        if (typeof showToast === 'function') showToast('请正确输入名称以确认', 'error');
        return;
      }
      var reason = reasonSel.value;
      if (reason === '其他') {
        var other = String(reasonOther.value || '').trim();
        if (!other) {
          if (typeof showToast === 'function') showToast('请补充停用说明', 'error');
          return;
        }
        reason = '其他：' + other;
      }
      modal.style.display = 'none';
      if (typeof opts.onConfirm === 'function') {
        opts.onConfirm({ mode: 'disable', reason: reason });
      }
    };
    modal.style.display = 'block';
  }

  /** 面向 C 端用户的可读文案 */
  function userFacingDisabledCopy(storeName) {
    var name = String(storeName || '该门店').trim() || '该门店';
    return {
      title: '门店已暂停服务',
      scan:
        '「' +
        name +
        '」目前已停用，暂时不能进入或切换到这家店。请选择其他正在营业的门店继续购物。',
      switch:
        '「' +
        name +
        '」已停用，无法切换到这家店。请选择其他门店。',
      current:
        '您当前所在的「' +
        name +
        '」已停用。请先切换到其他门店，再继续购物。',
      staffBanner:
        '本门店已停用。用户端无法选店下单；请联系平台运营了解恢复启用安排。',
      bdBanner: '当前切入的门店已停用。用户无法进入该店；请切换到其他启用中的门店开展业务。'
    };
  }

  function showUserNotice(opts) {
    opts = opts || {};
    var existing = document.getElementById('lferpStoreDisabledNotice');
    if (existing) existing.remove();
    var copy = userFacingDisabledCopy(opts.storeName);
    var title = opts.title || copy.title;
    var message = opts.message || copy.scan;
    var primaryText = opts.primaryText || '我知道了';
    var secondaryText = opts.secondaryText || '';
    document.body.insertAdjacentHTML(
      'beforeend',
      '<div id="lferpStoreDisabledNotice" style="position:fixed;inset:0;z-index:20000;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box">' +
        '<div role="dialog" aria-modal="true" style="width:100%;max-width:320px;background:#fff;border-radius:14px;padding:20px 18px 16px;box-shadow:0 12px 40px rgba(0,0,0,.18)">' +
        '<div style="font-size:17px;font-weight:600;color:#1f1f1f;text-align:center;margin-bottom:10px">' +
        escapeHtml(title) +
        '</div>' +
        '<div style="font-size:14px;line-height:1.65;color:#595959;text-align:center;margin-bottom:18px">' +
        escapeHtml(message) +
        '</div>' +
        '<div style="display:flex;gap:10px">' +
        (secondaryText
          ? '<button type="button" id="lferpStoreDisabledNoticeSec" style="flex:1;height:40px;border:1px solid #d9d9d9;border-radius:8px;background:#fff;color:#595959;font-size:15px">' +
            escapeHtml(secondaryText) +
            '</button>'
          : '') +
        '<button type="button" id="lferpStoreDisabledNoticeOk" style="flex:1;height:40px;border:none;border-radius:8px;background:#ff7019;color:#fff;font-size:15px;font-weight:600">' +
        escapeHtml(primaryText) +
        '</button>' +
        '</div></div></div>'
    );
    var root = document.getElementById('lferpStoreDisabledNotice');
    function close() {
      if (root) root.remove();
    }
    var ok = document.getElementById('lferpStoreDisabledNoticeOk');
    var sec = document.getElementById('lferpStoreDisabledNoticeSec');
    if (ok) {
      ok.addEventListener('click', function () {
        close();
        if (typeof opts.onPrimary === 'function') opts.onPrimary();
      });
    }
    if (sec) {
      sec.addEventListener('click', function () {
        close();
        if (typeof opts.onSecondary === 'function') opts.onSecondary();
      });
    }
    root.addEventListener('click', function (e) {
      if (e.target === root) close();
    });
  }

  global.MdmArchiveEnableDisable = {
    STORE_DISABLED_KEY: STORE_DISABLED_KEY,
    WAREHOUSE_DISABLED_KEY: WAREHOUSE_DISABLED_KEY,
    readStoreDisabledMap: readStoreDisabledMap,
    setStoreDisabled: setStoreDisabled,
    isStoreDisabledByMeta: isStoreDisabledByMeta,
    readWarehouseDisabledMap: readWarehouseDisabledMap,
    setWarehouseDisabled: setWarehouseDisabled,
    isWarehouseDisabledByMeta: isWarehouseDisabledByMeta,
    applyWarehouseDisabledToTable: applyWarehouseDisabledToTable,
    buildStorePrecheck: buildStorePrecheck,
    buildWarehousePrecheck: buildWarehousePrecheck,
    openDialog: openDialog,
    userFacingDisabledCopy: userFacingDisabledCopy,
    showUserNotice: showUserNotice
  };
})(typeof window !== 'undefined' ? window : this);
