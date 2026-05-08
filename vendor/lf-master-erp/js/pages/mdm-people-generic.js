/**
 * MDM — 人员中心静态列表
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

const HEADERS = ['姓名', '工号', '手机号码', '所属部门', '岗位状态', '绑定组织', '最近更新', '操作'];

/**
 * @param {{ title: string, roleLabel: string, mock: string[][] }} cfg
 */
export function renderPeoplePage(container, cfg) {
  empty(container);
  const root = el('div', 'erp-page');
  const card = el('div', 'erp-page__card');
  const head = el('div', 'erp-page__head');
  head.appendChild(breadcrumb(['基础数据中心', '人员中心', cfg.title]));

  const toolbar = el('div', 'erp-toolbar');
  toolbar.appendChild(fieldRow('姓名', textInput('请输入姓名')));
  toolbar.appendChild(
    fieldRow(
      '岗位状态',
      selectInput(
        [
          { value: '', label: '全部' },
          { value: '1', label: '在岗' },
          { value: '2', label: '停用' },
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
  actions.appendChild(button(`+ 新增${cfg.roleLabel}`, 'primary'));
  card.appendChild(actions);

  const rows = cfg.mock.map((r) => [...r, linkActions([{ label: '编辑' }, { label: '权限' }])]);
  card.appendChild(dataTable(HEADERS, rows));
  card.appendChild(paginationBar({ total: cfg.mock.length + 18, page: 1, pageSize: 20 }));

  const note = el(
    'p',
    'erp-page__note',
    '说明：人员中心沉淀内部商务、履约与内容生产角色主数据，供业务侧授权、分润与排班读取。',
  );
  root.appendChild(card);
  root.appendChild(note);
  container.appendChild(root);
}
