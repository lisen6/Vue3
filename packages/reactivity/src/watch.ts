import { isFunction } from "./../../shared/src/index";
import { isObject } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { isReactive } from "./reactive";

// 如果对象中有循环运用, 用set记录
function travsal(value, set = new Set()) {
  // 递归终止条件，不是对象就不递归了
  if (!isObject(value)) return value;

  // 循环引用
  if (set.has(value)) {
    return value;
  }

  set.add(value);
  for (let key in value) {
    travsal(value[key], set);
  }

  return value;
}

// source是用户传入的对象，cb就是对应的用户的回调
export function watch(source, cb) {
  let getter;
  if (isReactive(source)) {
    // 对我们用户传入的数据进行递归循环，只要循环就会访问对象上的每一个属性，访问属性就会收集effect
    getter = () => travsal(source);
  } else if (isFunction(source)) {
    getter = source;
  }

  let cleanUp;
  const onCleanUp = (fn) => {
    // 保存用户的函数
    cleanUp = fn;
  };

  let oldValue;

  const job = () => {
    if (cleanUp) cleanUp(); // 下一次watch开始触发上一次watch的清理函数
    const newValue = effect.run();
    cb(newValue, oldValue, onCleanUp);
    oldValue = newValue;
  };

  const effect = new ReactiveEffect(getter, job); // 监控自己构造的函数，变化后执行执行job

  oldValue = effect.run();
}
