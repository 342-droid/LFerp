/**
 * 主体中心— 原「超管账号」：建立商家与组织关系，并驱动门店/供应商/仓库首家档案生成
 */
import { empty, el } from '../utils/dom.js';
import {
  fieldRow,
  textInput,
  selectInput,
  button,
  dataTable,
  paginationBar,
  breadcrumb,
  linkActions,
} from '../utils/erp-ui.js';

const HEADERS = [
  '主体ID',
  '主体名称',
  '绑定BD名称',
  '主体类型',
  '联系人',
  '手机号码',
  '登录账号',
  '创建时间',
  '最后操作人',
  '主体状态',
  '操作',
];

const MOCK_ROWS = [
  [
    'MCH88291001',
    '超管创建仓库042402',
    '—',
    '仓库',
    '王敏',
    '138****2210',
    'cg_ck042402',
    '2026-04-24T19:12:08',
    '系统',
    '正常',
    '',
  ],
  [
    'MCH88291002',
    '小九小九',
    '李四',
    '门店',
    '赵小九',
    '—',
    'xj_store01',
    '2026-04-23T11:03:41',
    '张三',
    '正常',
    '',
  ],
  [
    'MCH88291003',
    '华东供应商一号',
    '公司11号',
    '供应商',
    '刘洋',
    '159****8891',
    'sup_hz_01',
    '2026-04-22T09:55:12',
    '张三',
    '冻结',
    '',
  ],
  [
    'MCH88291004',
    '冷丰演示门店',
    '—',
    '门店',
    '陈晨',
    '186****3321',
    'demo_store',
    '2026-04-21T16:40:00',
    '系统',
    '正常',
    '',
  ],
  [
    'MCH88291005',
    '合作仓-沪南',
    '李四',
    '仓库',
    '周仓',
    '137****0098',
    'wh_hz_nan',
    '2026-04-20T14:22:19',
    '李四',
    '正常',
    '',
  ],
  [
    'MCH88291006',
    '供应商-珠宝集采',
    '公司11号',
    '供应商',
    '钱多多',
    '—',
    'sup_jewel',
    '2026-04-19T10:08:33',
    '王五',
    '正常',
    '',
  ],
  [
    'MCH88291007',
    '门店-五角场',
    '张三',
    '门店',
    '孙丽',
    '188****7765',
    'store_wujc',
    '2026-04-18T08:17:50',
    '张三',
    '正常',
    '',
  ],
  [
    'MCH88291008',
    '测试停用商家',
    '—',
    '门店',
    '测试',
    '133****0000',
    'test_off',
    '2026-04-17T18:01:02',
    '系统',
    '停用',
    '',
  ],
];

function buildRows() {
  return MOCK_ROWS.map((r) => {
    const op =
      r[9] === '停用'
        ? linkActions([{ label: '启用' }])
        : linkActions([{ label: '禁用' }]);
    return [...r.slice(0, 10), op];
  });
}

/**
 * @param {HTMLElement} container
 */
export function render(container) {
  empty(container);
  const root = el('div', 'erp-page');

  const card = el('div', 'erp-page__card');
  const head = el('div', 'erp-page__head');
  head.appendChild(breadcrumb(['基础数据中心', '主体中心', '主体中心']));
  const toolbar = el('div', 'erp-toolbar');
  toolbar.appendChild(fieldRow('主体名称', textInput('请输入主体名称')));
  toolbar.appendChild(
    fieldRow(
      '主体状态',
      selectInput(
        [
          { value: '', label: '全部' },
          { value: '1', label: '正常' },
          { value: '2', label: '冻结' },
          { value: '3', label: '停用' },
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
  actions.appendChild(button('+ 新增门店主体', 'primary'));
  actions.appendChild(button('+ 新增供应商主体', 'primary'));
  actions.appendChild(button('+ 新增仓库主体', 'primary'));
  card.appendChild(actions);

  card.appendChild(dataTable(HEADERS, buildRows()));
  card.appendChild(paginationBar({ total: 55, page: 1, pageSize: 20 }));

  const note = el(
    'p',
    'erp-page__note',
    '说明：本页为 MDM 主体中心（原超管账号能力）。先建立「商家与组织」关系，系统同步生成对应首家门店/供应商/仓库档案；完整明细沉淀在「资源中心」各档案表中，供业务侧读取。',
  );
  root.appendChild(card);
  root.appendChild(note);
  container.appendChild(root);
}
