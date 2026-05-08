/**
 * 静态列表页通用 DOM：筛选条、表格、分页（无业务请求）
 */
import { el } from './dom.js';

/**
 * @param {string} label
 * @param {HTMLElement} control
 */
export function fieldRow(label, control) {
  const wrap = el('div', 'erp-field');
  wrap.appendChild(el('span', 'erp-field__label', label));
  const inner = el('div', 'erp-field__control');
  inner.appendChild(control);
  wrap.appendChild(inner);
  return wrap;
}

/**
 * @param {string} placeholder
 * @param {string} [value]
 */
export function textInput(placeholder, value = '') {
  const input = el('input', 'erp-input');
  input.type = 'text';
  input.placeholder = placeholder;
  if (value) input.value = value;
  return input;
}

/**
 * @param {Array<{ value: string, label: string }>} options
 * @param {string} [currentValue]
 */
export function selectInput(options, currentValue = '') {
  const sel = el('select', 'erp-select');
  options.forEach((o) => {
    const opt = document.createElement('option');
    opt.value = o.value;
    opt.textContent = o.label;
    if (o.value === currentValue) opt.selected = true;
    sel.appendChild(opt);
  });
  return sel;
}

/**
 * @param {string} text
 * @param {'primary'|'default'} variant
 */
export function button(text, variant = 'default') {
  const btn = el('button', variant === 'primary' ? 'erp-btn erp-btn--primary' : 'erp-btn');
  btn.type = 'button';
  btn.textContent = text;
  return btn;
}

/**
 * @param {string[]} headers
 * @param {string[][]} rows
 */
export function dataTable(headers, rows) {
  const wrap = el('div', 'erp-table-scroll');
  const table = el('table', 'erp-table');
  const thead = el('thead');
  const trh = el('tr');
  headers.forEach((h) => {
    trh.appendChild(el('th', '', h));
  });
  thead.appendChild(trh);
  const tbody = el('tbody');
  rows.forEach((cells, idx) => {
    const tr = el('tr');
    if (idx % 2 === 1) tr.classList.add('erp-table__row--alt');
    cells.forEach((c) => {
      const td = el('td', '');
      if (c instanceof Node) td.appendChild(c);
      else td.textContent = c;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(thead);
  table.appendChild(tbody);
  wrap.appendChild(table);
  return wrap;
}

/**
 * @param {{ total: number, page: number, pageSize: number }} meta
 */
export function paginationBar(meta) {
  const bar = el('div', 'erp-pagination');
  bar.appendChild(el('span', 'erp-pagination__total', `共 ${meta.total} 条`));
  const mid = el('div', 'erp-pagination__mid');
  mid.appendChild(el('span', 'erp-pagination__hint', `${meta.pageSize} 条/页`));
  const pages = el('div', 'erp-pagination__pages');
  const maxPage = Math.max(1, Math.ceil(meta.total / meta.pageSize));
  const windowStart = Math.max(1, Math.min(meta.page - 1, maxPage - 2));
  for (let p = windowStart; p <= Math.min(maxPage, windowStart + 2); p += 1) {
    const b = el('button', `erp-page-btn${p === meta.page ? ' is-active' : ''}`, String(p));
    b.type = 'button';
    pages.appendChild(b);
  }
  mid.appendChild(pages);
  bar.appendChild(mid);
  const right = el('div', 'erp-pagination__right');
  right.appendChild(el('span', 'erp-pagination__goto-label', '前往'));
  const inp = el('input', 'erp-pagination__goto-input');
  inp.type = 'number';
  inp.value = String(meta.page);
  right.appendChild(inp);
  right.appendChild(el('span', 'erp-pagination__goto-label', '页'));
  bar.appendChild(right);
  return bar;
}

/**
 * @param {string[]} parts
 */
export function breadcrumb(parts) {
  const bc = el('div', 'erp-breadcrumb');
  parts.forEach((p, i) => {
    if (i > 0) bc.appendChild(el('span', 'erp-breadcrumb__sep', '/'));
    bc.appendChild(el('span', i === parts.length - 1 ? 'erp-breadcrumb__current' : '', p));
  });
  return bc;
}

/**
 * @param {Array<{ label: string }>} items
 */
export function linkActions(items) {
  const span = el('span', 'erp-actions-cell');
  items.forEach((it, i) => {
    if (i > 0) span.appendChild(document.createTextNode('\u3000'));
    const a = el('a', 'erp-link', it.label);
    a.href = '#';
    a.addEventListener('click', (e) => e.preventDefault());
    span.appendChild(a);
  });
  return span;
}

/**
 * @param {string} text
 * @param {boolean} on
 */
export function statusTag(text, on) {
  return el('span', on ? 'erp-tag erp-tag--on' : 'erp-tag erp-tag--off', text);
}

/**
 * @param {string} text
 */
export function accentText(text) {
  const s = el('span', 'erp-text-accent', text);
  return s;
}
