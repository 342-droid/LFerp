/**
 * DOM 小工具：清空、创建元素、事件委托
 */

/**
 * 清空节点子元素
 * @param {HTMLElement} el
 */
export function empty(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

/**
 * 创建带 class 的元素
 * @param {string} tag
 * @param {string} [className]
 * @param {string} [text]
 */
export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

/**
 * 在容器上委托点击事件
 * @param {HTMLElement} container
 * @param {string} selector 子元素选择器
 * @param {(ev: MouseEvent, target: Element) => void} handler
 */
export function delegateClick(container, selector, handler) {
  container.addEventListener('click', (ev) => {
    const t = ev.target;
    if (!(t instanceof Element)) return;
    const match = t.closest(selector);
    if (match && container.contains(match)) {
      handler(ev, match);
    }
  });
}
