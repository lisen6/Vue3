import { isFunction } from "@vue/shared";
import { ReactiveEffect, trackEffects, triggerEffects } from "./effect";

class ComputedRefImpl {
  public effect;
  public getter;
  public setter;
  public _dirty = true; // 默认应该取值的时候进行计算
  public __v_isReadOnly = true;
  public __v_isRef = true;
  public _value;
  public dep = new Set();
  constructor(getter, setter) {
    // 我们将用户的getter放到effect中，effect中的属性就会被effect收集
    // 稍后依赖的属性变化，会执行调度函数scheduler
    this.effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;

        // 实现一个触发更新
        triggerEffects(this.dep);
      }
    });
  }
  get value() {
    // 需要依赖收集
    trackEffects(this.dep);

    // 说明脏值
    if (this._dirty) {
      this._dirty = false;
      this._value = this.effect.run();
    }
    return this._value;
  }
  set value(newValue) {
    this.setter(newValue);
  }
}

export const computed = (getterOrOptions) => {
  let onlyGetter = isFunction(getterOrOptions);
  let getter;
  let setter;
  if (onlyGetter) {
    getter = getterOrOptions;
    setter = () => console.warn("no set");
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }

  return new ComputedRefImpl(getter, setter);
};
