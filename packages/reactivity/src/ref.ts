import { isObject, isArray } from "@vue/shared";
import { trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";

// 复杂数据类型还是要拦截proxy
function toReactive(value) {
  return isObject(value) ? reactive(value) : value;
}

class RefImpl {
  public _value;
  public rawValue;
  public dep = new Set();
  public __v_isRef = true;
  constructor(rawValue) {
    this._value = toReactive(rawValue);
  }
  get value() {
    trackEffects(this.dep);
    return this._value;
  }
  set value(newValue) {
    if (newValue !== this.rawValue) {
      this._value = toReactive(newValue);
      this.rawValue = newValue;
      triggerEffects(this.dep);
    }
  }
}

export function ref(value) {
  return new RefImpl(value);
}

class ObjectRefImpl {
  constructor(public object, public key) {}
  get value() {
    return this.object[this.key];
  }
  set value(newValue) {
    this.object[this.key] = newValue;
  }
}

function toRef(object, key) {
  return new ObjectRefImpl(object, key);
}

export function toRefs(object) {
  const result = isArray(object) ? new Array(object.length) : {};

  for (let key in object) {
    result[key] = toRef(object, key);
  }

  return result;
}

export function proxyRefs(object) {
  return new Proxy(object, {
    get(target, key, recevier) {
      let result = Reflect.get(target, key, recevier);
      return result.__v_isRef ? result.value : result;
    },
    set(target, key, value, recevier) {
      const oldValue = target[key];
      if (oldValue.__v_isRef) {
        oldValue.value = value;
        return true;
      } else {
        return Reflect.set(target, key, value, recevier);
      }
    },
  });
}
