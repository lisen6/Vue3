function createInvoker(callback) {
  const invoker = (e) => invoker.value(e);
  invoker.value = callback;
  return invoker;
}

// 第一次绑定了click事件 "a"函数
// 第二次绑定了click事件 "b"函数
export function patchEvent(el, eventName, nextValue) {
  // 先移除时间，再重新绑定事件
  // remove -> add === > add + 自定义事件

  let invokers = el._vei || (el._vei = {});

  let exists = invokers[eventName];

  if (exists && nextValue) {
    // 已经绑定过事件
    exists.value = nextValue;
  } else {
    const event = eventName.slice(2).toLowerCase();
    if (nextValue) {
      const invoker = (invokers[eventName] = createInvoker(nextValue));
      el.addEventListener(event, invoker);
    } else if (exists) {
      // 如果有老值，需要将老的绑定事件移除掉
      el.removeEventListener(event, exists);
      invokers[eventName] = null;
    }
  }
}
