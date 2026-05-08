/**
 * 资源中心 — 仓库档案（专用表单，无进件）
 */
import { empty, el } from '../utils/dom.js';
import {
  fieldRow,
  textInput,
  selectInput,
  button,
  paginationBar,
  breadcrumb,
} from '../utils/erp-ui.js';
import {
  removeWarehouseArchiveUi,
  openWarehouseAddModal,
  openWarehouseEditModal,
  openWarehouseConfirmModal,
} from '../utils/warehouse-archive-ui.js';
import { renderWithdrawPhoneTableCell } from '../utils/withdraw-phone-modal.js';

const HEADERS = [
  '仓库编号',
  '主体名称',
  '仓库名称',
  '仓库类型',
  '关联门店',
  '仓库管理员',
  '手机号码',
  '可提现手机号',
  '仓库位置',
  '仓库面积',
  '创建时间',
  '状态',
  '操作',
];

const MOCK_TEMPLATE = [
  {
    code: 'WH001',
    orgId: '307403295087919501',
    subjectName: '沪南一号仓',
    name: '主仓库',
    typeLabel: '仓库',
    relatedStore: '仓库商家4.18',
    admin: '小牛',
    adminPhone: '138****2211',
    adminPhoneRaw: '13822112211',
    withdrawPhone: '138****2211',
    withdrawPhoneRaw: '13822112211',
    location: '上海市浦东新区张江路88号',
    region: '上海市/市辖区/浦东新区',
    regionPath: '上海市 / 市辖区 / 浦东新区',
    detailAddress: '张江路88号',
    areaNum: 3200,
    areaDisplay: '3200 m²',
    createTime: '2026-04-24 10:22:11',
    statusOn: true,
  },
  {
    code: 'WH304550231884821504',
    orgId: '307403295087919502',
    subjectName: '合作仓-苏州',
    name: '前置仓-华东区域履约中心一号库（演示超长名称折行）',
    typeLabel: '仓库',
    relatedStore: '冷丰演示门店',
    admin: '周仓',
    adminPhone: '137****0098',
    adminPhoneRaw: '13700980098',
    withdrawPhone: '137****0098',
    withdrawPhoneRaw: '13700980098',
    location: '上海市浦东新区张江路1688号',
    region: '上海市/市辖区/浦东新区',
    regionPath: '上海市 / 市辖区 / 浦东新区',
    detailAddress: '张江路1688号1号库',
    areaNum: 180,
    areaDisplay: '180 m²',
    createTime: '2026-04-23 15:01:44',
    statusOn: true,
  },
  {
    code: 'WH-ONS-88303',
    orgId: '307403295087919503',
    subjectName: '自建仓-杭州',
    name: '合作仓-苏州',
    typeLabel: '仓库',
    relatedStore: '—',
    admin: '钱多多',
    adminPhone: '159****7788',
    adminPhoneRaw: '15977881234',
    withdrawPhone: '—',
    withdrawPhoneRaw: '',
    location: '江苏省苏州市工业园区星湖街328号',
    region: '江苏省/苏州市/工业园区',
    regionPath: '江苏省 / 苏州市 / 工业园区',
    detailAddress: '星湖街328号',
    areaNum: 5600,
    areaDisplay: '5600 m²',
    createTime: '2026-04-22 09:33:02',
    statusOn: false,
  },
  {
    code: 'WH004',
    orgId: '307403295087919504',
    subjectName: '同城周转仓主体',
    name: '同城周转仓',
    typeLabel: '门店',
    relatedStore: '五角场体验店',
    admin: '孙丽',
    adminPhone: '188****7765',
    adminPhoneRaw: '18877651234',
    withdrawPhone: '188****7765',
    withdrawPhoneRaw: '18877651234',
    location: '上海市杨浦区国定路506号',
    region: '上海市/市辖区/杨浦区',
    regionPath: '上海市 / 市辖区 / 杨浦区',
    detailAddress: '国定路506号',
    areaNum: 96,
    areaDisplay: '96 m²',
    createTime: '2026-04-21 08:30:00',
    statusOn: true,
  },
];

export function render(container) {
  removeWarehouseArchiveUi();
  empty(container);

  const rowsState = MOCK_TEMPLATE.map((r) => ({ ...r }));

  const root = el('div', 'erp-page');
  const card = el('div', 'erp-page__card');
  const head = el('div', 'erp-page__head');
  head.appendChild(breadcrumb(['基础数据中心', '资源中心', '仓库档案']));

  const toolbar = el('div', 'erp-toolbar');
  toolbar.appendChild(fieldRow('主体名称', textInput('请输入主体名称')));
  toolbar.appendChild(fieldRow('仓库名称', textInput('请输入仓库名称')));
  toolbar.appendChild(
    fieldRow(
      '仓库类型',
      selectInput(
        [
          { value: '', label: '全部' },
          { value: 'w', label: '仓库' },
          { value: 's', label: '门店' },
        ],
        '',
      ),
    ),
  );
  toolbar.appendChild(
    fieldRow(
      '状态',
      selectInput(
        [
          { value: '', label: '全部' },
          { value: 'on', label: '启用' },
          { value: 'off', label: '停用' },
        ],
        '',
      ),
    ),
  );
  toolbar.appendChild(
    fieldRow(
      '关联门店',
      selectInput(
        [
          { value: '', label: '全部' },
          { value: '1', label: '冷丰演示门店' },
          { value: '2', label: '五角场体验店' },
          { value: '3', label: '仓库商家4.18' },
        ],
        '',
      ),
    ),
  );
  const ta = el('div', 'erp-toolbar__actions');
  ta.appendChild(button('重置', 'default'));
  ta.appendChild(button('查询', 'primary'));
  toolbar.appendChild(ta);
  head.appendChild(toolbar);
  card.appendChild(head);

  const actions = el('div', 'erp-actions-row');
  const addBtn = button('+ 新增仓库', 'primary');
  addBtn.addEventListener('click', () => openWarehouseAddModal());
  actions.appendChild(addBtn);
  card.appendChild(actions);

  const wrap = el('div', 'erp-table-scroll');
  const table = el('table', 'erp-table warehouse-archive-table');
  const thead = el('thead');
  const trh = el('tr');
  HEADERS.forEach((h) => trh.appendChild(el('th', '', h)));
  thead.appendChild(trh);
  const tbody = el('tbody');

  const colWithdrawPhone = HEADERS.indexOf('可提现手机号');

  function paintRows() {
    empty(tbody);
    rowsState.forEach((rec, idx) => {
      const tr = el('tr');
      if (idx % 2 === 1) tr.classList.add('erp-table__row--alt');

      const cells = [
        rec.code,
        rec.subjectName ?? '—',
        rec.name,
        rec.typeLabel,
        rec.relatedStore,
        rec.admin,
        rec.adminPhone,
        rec.withdrawPhone,
        rec.location,
        rec.areaDisplay,
        rec.createTime,
        rec.statusOn ? '启用' : '停用',
      ];

      cells.forEach((text, colIdx) => {
        const td = el('td', '');
        if (colIdx === colWithdrawPhone) {
          renderWithdrawPhoneTableCell(td, rec, { onMutated: paintRows });
        } else {
          td.textContent = text;
        }
        tr.appendChild(td);
      });

      const tdOp = el('td', '');
      const op = el('span', 'erp-actions-cell');

      const toggle = el('a', 'erp-link', rec.statusOn ? '停用' : '启用');
      toggle.href = '#';
      toggle.addEventListener('click', (ev) => {
        ev.preventDefault();
        if (rec.statusOn) {
          openWarehouseConfirmModal({
            message: '确定将此仓库设为停用？',
            onConfirm: () => {
              rec.statusOn = false;
              paintRows();
            },
          });
        } else {
          openWarehouseConfirmModal({
            message: '确定将此仓库设为启用？',
            onConfirm: () => {
              rec.statusOn = true;
              paintRows();
            },
          });
        }
      });
      op.appendChild(toggle);
      op.appendChild(document.createTextNode('\u3000'));

      const editA = el('a', 'erp-link', '编辑');
      editA.href = '#';
      editA.addEventListener('click', (ev) => {
        ev.preventDefault();
        openWarehouseEditModal(rec, paintRows);
      });
      op.appendChild(editA);

      tdOp.appendChild(op);
      tr.appendChild(tdOp);
      tbody.appendChild(tr);
    });
  }

  paintRows();

  table.appendChild(thead);
  table.appendChild(tbody);
  wrap.appendChild(table);
  card.appendChild(wrap);
  card.appendChild(paginationBar({ total: 10, page: 1, pageSize: 20 }));

  const note = el(
    'p',
    'erp-page__note',
    '说明：仓库档案无进件流程；停用/启用需二次确认。',
  );
  root.appendChild(card);
  root.appendChild(note);
  container.appendChild(root);
}
