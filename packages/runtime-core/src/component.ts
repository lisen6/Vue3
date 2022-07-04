import { reactive } from "@vue/reactivity";
import { hasOwn, isFunction } from "@vue/shared";
import { initProps } from "./componentProps";

export function createComponentInstance(vnode) {
  // 组件的实例
  const instance = {
    data: null,
    vnode,
    subTree: null, // 渲染的组件内容
    isMounted: false,
    update: null,
    propsOptions: vnode.type.props,
    props: {},
    attrs: {},
    proxy: null,
    render: null,
  };

  return instance;
}

const publicPropertyMap = {
  $attrs: (i) => i.attrs,
};

const publicInstanceProxy = {
  get(target, key) {
    const { data, props } = target;
    if (data && hasOwn(data, key)) {
      return data[key];
    } else if (props && hasOwn(props, key)) {
      return props[key];
    }
    let getter = publicPropertyMap[key];
    if (getter) {
      return getter(target);
    }
  },
  set(target, key, value) {
    const { data, props } = target;
    if (data && hasOwn(data, key)) {
      data[key] = value;
      return true;
    } else if (props && hasOwn(props, key)) {
      console.warn("attempting to mutate prop" + (key as string));
      return false;
    }
    return true;
  },
};

export function setupComponent(instance) {
  let { props, type } = instance.vnode;

  initProps(instance, props);

  instance.proxy = new Proxy(instance, publicInstanceProxy);

  let data = type.data;
  if (data) {
    if (!isFunction(data)) {
      return console.warn("data option must be a function");
    }
    instance.data = reactive(data.call(instance.proxy));
  }

  instance.render = type.render;
}
