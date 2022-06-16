import { isObject } from "@vue/shared";
import { reactive } from "./reactive";
import { activeEffect, track, trigger } from "./effect";

export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
}
export const mutableHandlers = {
  get(target, key, receiver) {
    // 防止target被二次代理
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }

    // 收集effect
    // 对象的某个属性对应多个effect，还要去重
    // weakMap = {对象：Map{key, Set}}  key代表当前属性，Set代表当前收集到的effect
    track(target, "get", key);
    let res = Reflect.get(target, key, receiver);

    if (isObject) {
      return reactive(res); // 深度代理，当访问的属性是个对象的时候，要再次代理这个对象
    }
    return res;
  },
  set(target, key, value, receiver) {
    let oldValue = target[key];
    let result = Reflect.set(target, key, value, receiver);

    // 新老值不一样才需要更新
    if (oldValue !== value) {
      // 要更新
      trigger(target, "set", key, result, oldValue);
    }
    return result;
  },
};
