import { isArray, isObject } from "@vue/shared";
import { createVnode, isVnode } from "./vnode";
/**
 * h函数的用法
 * h('div')
 * h('div', {style: {color: 'red'}})
 * h('div', {style: {color: 'red'}}, 'hello')
 * h('div', 'hello')
 * h('div', h('span'))
 * h('div', [h('span'), h('span')])
 * h('div', null, 'hello', 'world')
 * h('div', null, h('span'))
 */

// 其余的除了三个之外都是children
export function h(type, propsChildren, children) {
  const length = arguments.length;
  /**
   * h('div', {style: {color: 'red'}})
   * h('div', 'hello')
   * h('div', h('span'))
   * h('div', [h('span'), h('span')])
   */
  if (length === 2) {
    // 为什么要将儿子包装成数组，因为元素可以循环创建。文本不需要包装
    if (isObject(propsChildren) && !isArray(propsChildren)) {
      if (isVnode(propsChildren)) {
        // h('div', h('span'))
        return createVnode(type, null, [propsChildren]);
      }
      // h('div', {style: {color: 'red'}})
      return createVnode(type, propsChildren); // 属性
    } else {
      // h('div', 'hello')
      // h('div', [h('span'), h('span')])
      return createVnode(type, null, propsChildren); // 文本 || 孩子
    }
  } else {
    if (length > 3) {
      children = Array.from(arguments).slice(2);
    } else if (length === 3 && isVnode(children)) {
      // h('div',{}, h('span'))
      // 等于三个
      children = [children];
    }
    return createVnode(type, propsChildren, children); // chilren有两种情况：文本 / 数组
  }
}
