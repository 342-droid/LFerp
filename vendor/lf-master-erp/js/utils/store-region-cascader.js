/**
 * 省市区三级联动（门店 / 进件等共用）
 */
import { el } from './dom.js';

/** @type {Record<string, Record<string, string[]>>} */
export const REGION_TREE = {
  北京市: { 市辖区: ['东城区', '西城区', '朝阳区', '海淀区'] },
  天津市: { 市辖区: ['河东区', '河西区', '和平区'] },
  河北省: { 石家庄市: ['长安区', '桥西区'], 唐山市: ['路北区', '路南区'] },
  山西省: { 太原市: ['小店区', '迎泽区'] },
  内蒙古自治区: { 呼和浩特市: ['新城区', '回民区'] },
  辽宁省: { 沈阳市: ['和平区', '沈河区'], 大连市: ['中山区', '西岗区'] },
  上海市: { 市辖区: ['浦东新区', '黄浦区', '静安区', '杨浦区'] },
  江苏省: { 苏州市: ['工业园区', '姑苏区'], 南京市: ['鼓楼区', '玄武区'] },
  浙江省: { 杭州市: ['余杭区', '西湖区'], 宁波市: ['鄞州区', '海曙区'] },
  广东省: { 深圳市: ['罗湖区', '南山区'], 广州市: ['天河区', '越秀区'] },
};

/**
 * @param {HTMLElement} mountInside 挂在 modal body 内，用于定位下拉
 * @param {string} [initialPath] 已选路径文案
 */
export function createRegionCascader(mountInside, initialPath = '') {
  const wrap = el('div', 'store-region');
  const trigger = el('button', 'store-region__trigger erp-input');
  trigger.type = 'button';
  const placeholder = '请选择（省市区三级联动）';
  let selected = initialPath;

  function syncTrigger() {
    trigger.textContent = selected || placeholder;
    trigger.classList.toggle('is-placeholder', !selected);
  }

  syncTrigger();

  const panel = el('div', 'store-region__panel');
  panel.style.display = 'none';

  const colP = el('div', 'store-region__col');
  const colC = el('div', 'store-region__col');
  const colD = el('div', 'store-region__col');

  let prov = '';
  let city = '';

  function fillProvinces() {
    colP.replaceChildren();
    Object.keys(REGION_TREE).forEach((p) => {
      const item = el('div', 'store-region__item', p);
      if (p === prov) item.classList.add('is-active');
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        prov = p;
        city = '';
        fillProvinces();
        fillCities();
        colD.replaceChildren();
      });
      colP.appendChild(item);
    });
  }

  function fillCities() {
    colC.replaceChildren();
    if (!prov || !REGION_TREE[prov]) return;
    Object.keys(REGION_TREE[prov]).forEach((c) => {
      const item = el('div', 'store-region__item', c);
      if (c === city) item.classList.add('is-active');
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        city = c;
        fillCities();
        fillDistricts();
      });
      colC.appendChild(item);
    });
  }

  function fillDistricts() {
    colD.replaceChildren();
    if (!prov || !city || !REGION_TREE[prov]?.[city]) return;
    REGION_TREE[prov][city].forEach((d) => {
      const item = el('div', 'store-region__item', d);
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        selected = `${prov} / ${city} / ${d}`;
        syncTrigger();
        panel.style.display = 'none';
      });
      colD.appendChild(item);
    });
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = panel.style.display === 'none';
    panel.style.display = open ? 'flex' : 'none';
    if (open) {
      if (!prov) prov = Object.keys(REGION_TREE)[0];
      fillProvinces();
      fillCities();
      fillDistricts();
    }
  });

  panel.appendChild(colP);
  panel.appendChild(colC);
  panel.appendChild(colD);
  wrap.appendChild(trigger);
  wrap.appendChild(panel);

  const closeOnDoc = (ev) => {
    if (!wrap.contains(ev.target)) panel.style.display = 'none';
  };

  mountInside.addEventListener('scroll', () => {
    panel.style.display = 'none';
  });

  setTimeout(() => document.addEventListener('click', closeOnDoc), 0);

  wrap.addEventListener('remove', () => document.removeEventListener('click', closeOnDoc));

  return {
    wrap,
    getValue: () => selected,
    setValue: (v) => {
      selected = v || '';
      syncTrigger();
    },
  };
}
