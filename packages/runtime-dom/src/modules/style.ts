export function patchStyle(el, prevValue, nextValue) {
  // 样式需要比较差异
  for (let key in nextValue) {
    // 新的样式直接覆盖
    el.style[key] = nextValue[key];
  }

  if (prevValue) {
    for (let key in prevValue) {
      if (!nextValue.hasOwnProperty(key)) {
        el.style[key] = null;
      }
    }
  }
}
