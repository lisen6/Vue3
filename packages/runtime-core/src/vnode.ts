// 虚拟 DOM 必备 type props children
import { isString, ShapeFlags, isArray } from "@vue/shared";

export const Text = Symbol("Text");

export function isVnode(val) {
  return !!(val && val.__v_isVnode);
}

// 判断两个虚拟DOM是否是相同节点
export function isSameVnode(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}

// 虚拟节点有很多：组件的，元素的，文本的 h('h1')
export function createVnode(type, props, children = null) {
  // 组合方案 shapeFlag  我想知道一个元素中包含的是多个儿子还是一个儿子  标识

  let shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0;

  // 虚拟 DOM
  const vnode = {
    __v_isVnode: true,
    shapeFlag,
    type,
    props,
    children,
    key: props?.["key"],
    el: null, // 虚拟节点上对应的真实节点
  };

  if (children) {
    let type = 0;
    if (isArray(children)) {
      type = ShapeFlags.ARRAY_CHILDREN;
    } else {
      children = String(children);
      type = ShapeFlags.TEXT_CHILDREN;
    }

    vnode.shapeFlag |= type;
  }

  return vnode;
}
