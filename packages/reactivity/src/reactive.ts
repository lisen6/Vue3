import { isObject } from "@vue/shared";

// 数据转换成响应式数据, 只能做对象的代理

const reactiveMap = new WeakMap(); // key只能是对象

const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
}

export function reactive(target) {
  if (!isObject(target)) {
    return;
  }

  // 防止处理已经被代理过的对象再次被代理
  // 如果传递已经代理过的对象，那么访问target.ReactiveFlags.IS_REACTIVE === proxy.ReactiveFlags.IS_REACTIVE, 就会触发proxy的get方法。里面判断 key === ReactiveFlags.IS_REACTIVE,直接返回true，说明他是已经代理过的对象了
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target;
  }

  // 防止同一个源对象代理两次，增加一层缓存
  let existingProxy = reactiveMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }

  // 并没有重新定义属性，只是代理，取值调用get，赋值调用set

  // 第一次普通对象代理，我们会通过new Proxy代理一次
  // 下一次你传递的是proxy， 我们可以看一下他有没有被代理过，如果访问则个proxy， 有get方法就说明访问过了
  const proxy = new Proxy(target, {
    get(target, key, receiver) {
      // 防止target被二次代理
      if (key === ReactiveFlags.IS_REACTIVE) {
        return true;
      }
      return Reflect.get(target, key, receiver);
    },
    set(target, key, value, receiver) {
      return Reflect.set(target, key, value, receiver);
    },
  });

  reactiveMap.set(target, proxy);
  return proxy;
}
