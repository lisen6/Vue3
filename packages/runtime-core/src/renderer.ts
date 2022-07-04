import { isString } from "./../../shared/src/index";
import { ShapeFlags } from "@vue/shared";
import { createVnode, isSameVnode, Text, Fragment } from "./vnode";
import { getSequence } from "./sequence";
import { reactive, ReactiveEffect } from "@vue/reactivity";
import { queueJob } from "./scheduler";

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
  const normalize = (children, i) => {
    if (isString(children[i])) {
      // 把字符串的儿子转成vnode
      let vnode = createVnode(Text, null, children[i]);
      children[i] = vnode;
    }
    return children[i];
  };

  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      let child = normalize(children, i);
      patch(null, child, container, null);
    }
  };

  const mountElement = (vnode, container, anchor) => {
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

    hostInsert(el, container, anchor);
  };

  const processText = (n1, n2, container) => {
    if (n1 == null) {
      // 初始化 文本
      hostInsert((n2.el = hostCreateText(n2.children)), container);
    } else {
      // 文本的内容变化了，复用老节点
      let el = (n2.el = n1.el);
      if (n1.children !== n2.children) {
        hostSetText(el, n2.children); // 文本的更新
      }
    }
  };

  // 更新属性
  const patchProps = (oldProps, newProps, el) => {
    // 用新属性覆盖老属性
    for (let key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }

    // 老的里面有，新的里面没有，清空老的
    for (let key in oldProps) {
      if (newProps[key] == null) {
        hostPatchProp(el, key, oldProps[key], undefined);
      }
    }
  };

  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i]);
    }
  };

  // 比较两个儿子差异
  const patchKeyedChildren = (c1, c2, el) => {
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;

    // 从头开始比对 尽可能减少diff的比对
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el, null); // 这样做就是比较两个节点的属性和子节点
      } else {
        break;
      }
      i++;
    }

    // 从尾部开始比较
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el, null);
      } else {
        break;
      }
      e1--;
      e2--;
    }

    // 同序列挂载
    // i比e1大说明有新增的节点
    // i比e2之间的是新增的部分
    if (i > e1) {
      if (i <= e2) {
        while (i <= e2) {
          const nextPos = e2 + 1;
          // 根据下一个节点的索引看参照物，来判断是insertBefore还是appendChild
          const anchor = nextPos < c2.length ? c2[nextPos].el : null;
          patch(null, c2[i], el, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      // i比e2大说明有要卸载的节点
      // 卸载的部分就是i到e1之间的节点
      if (i <= e1) {
        while (i <= e1) {
          unmount(c1[i]);
          i++;
        }
      }
    }

    // 乱序对比，新节点创建映射表  Map{vnode.key: index}
    let s1 = i;
    let s2 = i;
    const keyToNewIndexMap = new Map();
    for (let i = s2; i <= e2; i++) {
      keyToNewIndexMap.set(c2[i].key, i);
    }

    // 循环老元素，看一下新的里面有没有，如果有说明要patch，没有添加到列表中，老的有新的没有要删除，
    const toBePatched = e2 - s2 + 1;
    const newIndexToOldIndexMap = new Array(toBePatched).fill(0); // 记录比对过的映射表

    for (let i = s1; i <= e1; i++) {
      const oldChild = c1[i]; // 老的节点
      let newIndex = keyToNewIndexMap.get(oldChild.key); // 用老的孩子去新的里面去找

      if (!newIndex) {
        unmount(oldChild); // 映射表里找不到的删掉
      } else {
        // 如果数组里放的值大于0, 说明是已经patch过了
        newIndexToOldIndexMap[newIndex - s2] = i + 1; // 用来标记当前所patch过的结果
        patch(oldChild, c2[newIndex], el, null);
      }
    }

    // 获取最长递增子序列
    let increment = getSequence(newIndexToOldIndexMap);
    // 需要移动位置
    let j = increment.length - 1;
    for (let i = toBePatched - 1; i >= 0; i--) {
      let index = i + s2;
      let current = c2[index];
      let anchor = index + 1 < c2.length ? c2[index + 1].el : null;

      if (newIndexToOldIndexMap[i] == 0) {
        // 创建
        patch(null, current, el, anchor);
      } else {
        if (i !== increment[j]) {
          // 不是0就说明已经比对过属性跟儿子了
          hostInsert(current.el, el, anchor, null);
        } else {
          j--;
        }
      }
    }
  };

  const patchChildren = (n1, n2, el) => {
    // 比较两个虚拟节点的儿子的差异，el就是当前的父节点
    const c1 = n1.children;
    const c2 = n2.children;

    const prevShapeFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;
    // 比较两个儿子列表的差异
    // 文本、null、数组

    // 新儿子  老儿子
    // -文本    数组（删除老儿子，设置文本内容）
    // -文本    文本（更新文本）
    // -数组    数组（diff算法）
    // 数组    文本（清空文本，进行挂载）
    // -空      数组（删除所有儿子）
    // 空      文本（清空文本）
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 新的是文本，老的是数组
        // 删除所有子节点
        unmountChildren(c1);
      }
      // 新的是文本，老的是文本
      if (c1 !== c2) {
        hostSetElementText(el, c2);
      }
    } else {
      // 现在为数组或空
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 新的是数组，老的也是数组
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // diff算法
          patchKeyedChildren(c1, c2, el);
        } else {
          // 新的不是数组，老的是数组（文本和空）
          // 删除老的数组，放入新的
          unmountChildren(c1);
        }
      } else {
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, "");
        }
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el);
        }
      }
    }
  };

  // 先复用节点，再比较属性，再比较儿子
  const patchElement = (n1, n2) => {
    let el = (n2.el = n1.el);

    let oldProps = n1.props || {};
    let newProps = n2.props || {};

    patchProps(oldProps, newProps, el);

    patchChildren(n1, n2, el);
  };

  const processElement = (n1, n2, container, anchor) => {
    if (n1 == null) {
      // 初次渲染
      // 后续还有组件的初次渲染，目前是元素的初始化渲染
      mountElement(n2, container, anchor);
    } else {
      // 元素更新流程
      patchElement(n1, n2);
    }
  };

  const processFragment = (n1, n2, container, anchor) => {
    if (n1 == null) {
      mountChildren(n2.children, container);
    } else {
      patchChildren(n1, n2, container);
    }
  };

  // 挂载组件
  const mountComponent = (vnode, container, anchor) => {
    let { data = () => ({}), render } = vnode.type; // 用户组件写的内容
    const state = reactive(data());

    // 组件的实例
    const instance = {
      state,
      vnode,
      subTree: null, // 渲染的组件内容
      isMounted: false,
      update: null,
    };

    const componentUpdateFn = () => {
      // 区分初始化还是更新
      if (!instance.isMounted) {
        const subTree = render.call(state);
        patch(null, subTree, container, anchor); // 创造了subTree的真实节点
        instance.subTree = subTree;
        instance.isMounted = true;
      } else {
        // 组件内部更新（组件的render方法重新执行）
        const subTree = render.call(state);
        patch(instance.subTree, subTree, container, anchor);
        instance.subTree = subTree;
      }
    };

    const effect = new ReactiveEffect(componentUpdateFn, () => {
      queueJob(instance.update);
    });

    // 将组件强制更新的逻辑保存到了组件的实例上
    let update = (instance.update = effect.run.bind(effect)); // 让组件强制重新渲染
    update();
  };

  const processComponent = (n1, n2, container, anchor) => {
    if (n1 == null) {
      mountComponent(n2, container, anchor);
    } else {
      // 组件更新靠的是props
    }
  };

  const patch = (n1, n2, container, anchor) => {
    // n2有可能是vnode，也有可能是字符串
    if (n1 === n2) return;

    if (n1 && !isSameVnode(n1, n2)) {
      // 判断两个元素是否相同，不相同卸载再添加
      unmount(n1); // 删除老的
      n1 = null;
    }

    const { type, shapeFlag } = n2;

    switch (type) {
      case Text:
        processText(n1, n2, container);
        break;
      case Fragment:
        processFragment(n1, n2, container, anchor);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor);
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          processComponent(n1, n2, container, anchor);
        }
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
      patch(container._vnode || null, vnode, container, null);
    }
    container._vnode = vnode;

    // 如果当前vnode是空的话，
  };

  return {
    render,
  };
}

/**
 * 1.DOM更新的了逻辑思考
 * - DOM更新前后完全没关心，删除老的，添加新的
 * - 老的跟新的意义，复用，属性不一样，对比属性，更新属性
 * - 比儿子
 */
