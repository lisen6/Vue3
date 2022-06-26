import { isString } from "./../../shared/src/index";
import { ShapeFlags } from "@vue/shared";
import { createVnode, Text } from "./vnode";

export function createRenderer(renderOptions) {
  const {
    // 增加 删除 修改 查询
    insert: hostInsert,
    remove: hostRemove,
    // 元素中的内容
    setElementText: hostSetElementText,
    // 文本节点
    setText: hostSetText,
    querySelector: hostQuerySelector,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    createElement: hostCreateElement,
    createText: hostCreateText,
    patchProp: hostPatchProp,
  } = renderOptions;

  // 判断儿子节点是 vnode 还是 Text
  const normalize = (child) => {
    if (isString(child)) {
      return createVnode(Text, null, child);
    }
    return child;
  };

  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      let child = normalize(children[i]);
      patch(null, child, container);
    }
  };

  const mountElement = (vnode, container) => {
    let { type, props, children, shapeFlag } = vnode;
    let el = (vnode.el = hostCreateElement(type)); // 将真实元素挂载到这个虚拟节点上，后续更新复用该节点
    if (props) {
      for (let key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }

    // 看下是不是文本
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el);
    }

    hostInsert(el, container);
  };

  const processText = (n1, n2, container) => {
    if (n1 == null) {
      // 初始化 文本
      hostInsert((n2.el = hostCreateText(n2.children)), container);
    }
  };

  const patch = (n1, n2, container) => {
    // n2有可能是vnode，也有可能是字符串
    if (n1 === n2) return;

    const { type, shapeFlag } = n2;
    if (n1 == null) {
      // 初次渲染
      // 后续还有组件的初次渲染，目前是元素的初始化渲染
      switch (type) {
        case Text:
          processText(n1, n2, container);
          break;
        default:
          if (shapeFlag & ShapeFlags.ELEMENT) {
            mountElement(n2, container);
          }
      }
    } else {
      // 更新流程
    }
  };

  const unmount = (vnode) => {
    // 卸载元素
    hostRemove(vnode.el);
  };

  const render = (vnode, container) => {
    if (vnode == null) {
      // 卸载逻辑
      if (container._vnode) {
        // 之前正确渲染过了，那么就卸载掉dom
        unmount(container._vnode);
      }
    } else {
      // 初始化渲染逻辑 || 更新逻辑
      patch(container._vnode || null, vnode, container);
    }
    container._vnode = vnode;

    // 如果当前vnode是空的话，
  };

  return {
    render,
  };
}
