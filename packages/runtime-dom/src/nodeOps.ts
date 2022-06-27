export const nodeOps = {
  // 增加 删除 修改 查询
  insert(child, parent, anchor = null) {
    // insertBefore第二个参数为null，相当于appendChild
    parent.insertBefore(child, anchor);
  },
  remove(child) {
    const parentNode = child.parentNode;
    if (parentNode) {
      parentNode.removeChild(child);
    }
  },
  // 元素中的内容
  setElementText(el, text) {
    el.textContent = text;
  },
  // 文本节点
  setText(node, text) {
    node.nodeValue = text;
  },
  querySelector(selector) {
    return document.querySelector(selector);
  },
  parentNode(node) {
    return node.parentNode;
  },
  nextSibling(node) {
    return node.nextSibling;
  },
  createElement(tagName) {
    return document.createElement(tagName);
  },
  createText(text) {
    return document.createTextNode(text);
  },
};
